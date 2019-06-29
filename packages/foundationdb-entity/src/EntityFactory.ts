import { uniqueSeed, Mutex } from '@openland/foundationdb-utils';
import { Context } from '@openland/context';
import { TransactionCache, encoders, inTx } from '@openland/foundationdb';
import { Entity } from './Entity';
import { EntityDescriptor } from './EntityDescriptor';
import { EntityMetadata } from './EntityMetadata';
import { codecs, Codec } from './codecs';
import { ShapeWithMetadata } from './ShapeWithMetadata';
import { PrimaryKeyType } from './PrimaryKeyType';

function getCacheKey(id: ReadonlyArray<PrimaryKeyType>) {
    return encoders.tuple.pack(id as any /* WTF, TS? */).toString('hex');
}

const metadataCodec = codecs.struct({
    _metadata: codecs.struct({
        versionCode: codecs.number,
        createdAt: codecs.number,
        updatedAt: codecs.number,
    })
});

export abstract class EntityFactory<SHAPE, T extends Entity<SHAPE>> {
    readonly descriptor: EntityDescriptor<SHAPE>;

    private primaryLockCache = new TransactionCache<Mutex>(uniqueSeed());
    private entityCache = new TransactionCache<T>(uniqueSeed());
    private codec: Codec<ShapeWithMetadata<SHAPE>>;

    protected constructor(descriptor: EntityDescriptor<SHAPE>) {
        Object.freeze(descriptor);
        this.descriptor = descriptor;
        this.codec = codecs.union(descriptor.codec, metadataCodec);
    }

    protected async _findById(ctx: Context, id: PrimaryKeyType[]): Promise<T | null> {

        //
        // We assume here next things:
        // * id is a correct tuple and verified by callee
        // 

        return await this._getPrimaryLock(ctx, id).runExclusive(async () => {

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
                let decoded = this._decode(ex);

                // Create instance
                let res = this._createEntityInstance(ctx, decoded);
                this.entityCache.set(ctx, k, res);
                return res;
            } else {
                return null;
            }
        });
    }

    protected async _create(ctx: Context, id: PrimaryKeyType[], value: SHAPE): Promise<T> {

        //
        // We assume here next things:
        // * id is a correct tuple and verified by callee
        // * value is in normalized shape. Meaning all undefined are replaced with nulls and 
        //   there are no unknown fields.
        //

        // Validate input
        let now = Date.now();
        let metadata: EntityMetadata = {
            versionCode: 0,
            createdAt: now,
            updatedAt: now
        };
        let encoded = this._encode(value, metadata);

        // Check cache
        let k = getCacheKey(id);
        if (this.entityCache.get(ctx, k)) {
            throw Error('Entity already exists');
        }

        // Check Primary Index and write result
        await this._getPrimaryLock(ctx, id).runExclusive(async () => {
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
        let res = this._createEntityInstance(ctx, { ...value, _metadata: metadata });
        this.entityCache.set(ctx, k, res);
        return res;
    }

    // Need to be arrow function since we are passing this function to entity instances
    protected _flush = async (ctx: Context, id: ReadonlyArray<PrimaryKeyType>, oldValue: ShapeWithMetadata<SHAPE>, newValue: ShapeWithMetadata<SHAPE>) => {
        await this._getPrimaryLock(ctx, id).runExclusive(async () => {

            // Encode value before any write
            let encoded = { ...newValue, ...this.codec.encode(newValue) };

            // Write primary key index value
            this.descriptor.subspace.set(ctx, id as any, encoded);
        });
    }

    private _encode(value: SHAPE, metadata: EntityMetadata) {
        return { ...value, ...this.codec.encode({ ...value, _metadata: metadata }) };
    }

    private _decode(value: any) {
        return { ...value, ...this.codec.decode(value) };
    }

    private _getPrimaryLock(ctx: Context, id: ReadonlyArray<PrimaryKeyType>) {
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

    protected abstract _createEntityInstance(ctx: Context, value: ShapeWithMetadata<SHAPE>): T;
}