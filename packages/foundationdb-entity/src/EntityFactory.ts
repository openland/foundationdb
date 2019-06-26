import { uniqueSeed, Mutex } from '@openland/foundationdb-utils';
import { Context } from '@openland/context';
import { Tuple, TransactionCache, encoders, inTx } from '@openland/foundationdb';
import { Entity } from './Entity';
import { EntityDescriptor } from './EntityDescriptor';

function getCacheKey(id: Tuple[]) {
    return encoders.tuple.pack(id).toString('hex');
}

export abstract class EntityFactory<SHAPE, T extends Entity<SHAPE>> {
    readonly descriptor: EntityDescriptor<SHAPE>;

    private primaryLockCache = new TransactionCache<Mutex>(uniqueSeed());
    private entityCache = new TransactionCache<T>(uniqueSeed());

    protected constructor(descriptor: EntityDescriptor<SHAPE>) {
        this.descriptor = descriptor;
    }

    protected async _findById(ctx: Context, id: Tuple[]): Promise<T | null> {

        //
        // We assume here next things:
        // * id is a correct tuple and verified by callee
        // 

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
                // Decode record
                let decoded = this.descriptor.codec.decode(ex);

                // Create instance
                let res = this._createEntityInstance(decoded);
                this.entityCache.set(ctx, k, res);
                return res;
            } else {
                return null;
            }
        });
    }

    protected async _create(ctx: Context, id: Tuple[], value: SHAPE): Promise<T> {

        //
        // We assume here next things:
        // * id is a correct tuple and verified by callee
        // * value is in normalized shape. Meaning all undefined are replaced with nulls and 
        //   there are no unknown fields.
        //

        // Validate input
        let encoded = this.descriptor.codec.encode(value);

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
                this.descriptor.subspace.set(ctx2, id, encoded);
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