import { uniqueSeed, Mutex } from '@openland/foundationdb-utils';
import { Context } from '@openland/context';
import { Tuple, TransactionCache, encoders, inTx } from '@openland/foundationdb';
import { Entity } from './Entity';
import { EntityDescriptor } from './EntityDescriptor';

function getCacheKey(id: Tuple[]) {
    return encoders.tuple.pack(id).toString('hex');
}

export abstract class EntityFactory<SHAPE, T extends Entity<SHAPE>> {
    readonly descriptor: EntityDescriptor;

    private primaryLockCache = new TransactionCache<Mutex>(uniqueSeed());
    private entityCache = new TransactionCache<T>(uniqueSeed());

    protected constructor(descriptor: EntityDescriptor) {
        this.descriptor = descriptor;
    }

    protected async _findById(ctx: Context, id: Tuple[]): Promise<T | null> {
        return await this.getPrimaryLock(ctx, id).runExclusive(async () => {

            // Check Cache
            let k = getCacheKey(id);
            let cached = this.entityCache.get(ctx, k);
            if (cached) {
                return cached;
            }

            // Read entity
            let ex = await this.descriptor.subspace.get(ctx, id);

            // Check cache
            cached = this.entityCache.get(ctx, k);
            if (cached) {
                return cached;
            }

            if (ex) {
                // Validate record
                this.descriptor.validator(ex);

                // Create instance
                let res = this._createEntityInstance(ex);
                this.entityCache.set(ctx, k, res);
                return res;
            } else {
                return null;
            }
        });
    }

    protected async _create(ctx: Context, id: Tuple[], value: SHAPE): Promise<T> {

        // Validate input
        this.descriptor.validator(value);

        // Check cache
        let k = getCacheKey(id);
        if (this.entityCache.get(ctx, k)) {
            throw Error('Entity already exists');
        }

        // Check Primary Index and write result
        await this.getPrimaryLock(ctx, id).runExclusive(async () => {
            await inTx(ctx, async (ctx2) => {
                let ex = await this.descriptor.subspace.get(ctx2, id);
                if (ex) {
                    throw Error('Entity already exists');
                }
                this.descriptor.subspace.set(ctx2, id, value);
            });
        });

        // Check cache
        if (this.entityCache.get(ctx, k)) {
            throw Error('Entity already exists');
        }

        // Create Instance
        let res = this._createEntityInstance(value);
        this.entityCache.set(ctx, k, res);
        return res;
    }

    private getPrimaryLock(ctx: Context, id: Tuple[]) {
        let k = getCacheKey(id);
        let ex = this.primaryLockCache.get(ctx, k);
        if (!ex) {
            ex = new Mutex();
            this.primaryLockCache.set(ctx, k, ex);
            return ex;
        } else {
            return ex;
        }
    }

    protected abstract _createEntityInstance(value: SHAPE): T;
}