import { ConditionalMaintainer } from './indexes/ConditionalMaintainer';
import { LiveStream } from './LiveStream';
import { UniqueIndex } from './indexes/UniqueIndex';
import { TupleItem, Float } from '@openland/foundationdb-tuple';
import { uniqueSeed } from '@openland/foundationdb-utils';
import { Context } from '@openland/context';
import { TransactionCache, encoders, inTx, Watch, inTxLeaky } from '@openland/foundationdb';
import { Entity } from './Entity';
import { EntityDescriptor, SecondaryIndexDescriptor } from './EntityDescriptor';
import { EntityMetadata } from './EntityMetadata';
import { codecs, Codec } from './codecs';
import { ShapeWithMetadata } from './ShapeWithMetadata';
import { PrimaryKeyType } from './PrimaryKeyType';
import { PrimaryIndex } from './indexes/PrimaryIndex';
import { IndexMaintainer } from './indexes/IndexMaintainer';
import { IndexMutexManager } from './indexes/IndexMutexManager';
import { resolveIndexKey, tupleToCursor } from './indexes/utils';
import { RangeIndex } from './indexes/RangeIndex';
import { IndexStream } from './indexes/IndexStream';

export interface StreamProps {
    batchSize?: number;
    reverse?: boolean;
    after?: string;
}

function getCacheKey(id: ReadonlyArray<TupleItem>) {
    return encoders.tuple.pack(id as any /* WTF, TS? */).toString('hex');
}

function encodeKey(key: TupleItem[]): string {
    return encoders.tuple.pack(key).toString('hex');
}

const metadataCodec = codecs.struct({
    _version: codecs.number,
    createdAt: codecs.number,
    updatedAt: codecs.number,
});

export abstract class EntityFactory<SHAPE, T extends Entity<SHAPE>> {
    readonly descriptor: EntityDescriptor<SHAPE>;

    private readonly _mutexManager = new IndexMutexManager();
    private readonly _entityCache = new TransactionCache<T>(uniqueSeed());
    private readonly _codec: Codec<ShapeWithMetadata<SHAPE>>;
    private readonly _indexMaintainers: IndexMaintainer[] = [];

    protected constructor(descriptor: EntityDescriptor<SHAPE>) {
        Object.freeze(descriptor);
        this.descriptor = descriptor;
        this._codec = codecs.merge(descriptor.codec, metadataCodec);
        this._indexMaintainers.push(new PrimaryIndex(descriptor.subspace));
        for (let ind of descriptor.secondaryIndexes) {
            if (ind.type.type === 'unique') {
                if (ind.condition) {
                    this._indexMaintainers.push(new ConditionalMaintainer(ind.condition, new UniqueIndex(ind)));
                } else {
                    this._indexMaintainers.push(new UniqueIndex(ind));
                }
            } else if (ind.type.type === 'range') {
                if (ind.condition) {
                    this._indexMaintainers.push(new ConditionalMaintainer(ind.condition, new RangeIndex(ind)));
                } else {
                    this._indexMaintainers.push(new RangeIndex(ind));
                }
            } else {
                throw Error('Unknown index type');
            }
        }
    }

    protected _watch(ctx: Context, _id: PrimaryKeyType[]): Watch {
        let id = this._resolvePrimaryKey(_id);
        return this.descriptor.subspace.watch(ctx, id);
    }

    //
    // Unique Index Operation
    //

    protected async _findFromUniqueIndex(parent: Context, _id: PrimaryKeyType[], descriptor: SecondaryIndexDescriptor): Promise<T | null> {
        return inTxLeaky(parent, async (ctx) => {
            // Resolve index key
            let id = resolveIndexKey(_id, descriptor.type.fields);

            // Resolve value
            let ex = await this._mutexManager.runExclusively(ctx, [UniqueIndex.lockKey(descriptor, id)],
                async () => await descriptor.subspace.get(ctx, id));
            if (!ex) {
                return null;
            }

            // Resolve primary key
            let pk = this._resolvePrimaryKeyFromObject(ex);

            // Query primary id
            return this._findById(ctx, pk);
        });
    }

    //
    // Range Index Operations
    //

    protected _createStream(
        descriptor: SecondaryIndexDescriptor,
        _id: PrimaryKeyType[],
        opts?: StreamProps
    ) {
        let id = resolveIndexKey(_id, descriptor.type.fields, true /* Partial key */);
        let batchSize = opts && opts.batchSize ? opts.batchSize : 5000;
        let reverse = opts && opts.reverse ? opts.reverse : false;
        return new IndexStream(descriptor, id, batchSize, reverse, (ctx, src) => {
            let pk = this._resolvePrimaryKeyFromObject(src);
            let k = getCacheKey(pk);
            let cached = this._entityCache.get(ctx, k);
            if (cached) {
                return cached;
            } else {
                let res = this._createEntityInstance(ctx, src);
                this._entityCache.set(ctx, k, res);
                return res;
            }
        });
    }

    protected _createLiveStream(
        ctx: Context,
        descriptor: SecondaryIndexDescriptor,
        _id: PrimaryKeyType[],
        opts?: StreamProps
    ) {
        return new LiveStream(this._createStream(descriptor, _id, opts), this.descriptor).generator(ctx);
    }

    protected async _query(
        parent: Context,
        descriptor: SecondaryIndexDescriptor,
        _id: PrimaryKeyType[],
        opts?: { limit?: number, reverse?: boolean, after?: PrimaryKeyType[] }
    ): Promise<{ items: T[], cursor?: string }> {
        // Resolve index key
        let id = resolveIndexKey(_id, descriptor.type.fields, true /* Partial key */);
        let after: TupleItem[] | undefined = undefined;
        if (opts && opts.after) {
            after = resolveIndexKey(opts.after, descriptor.type.fields, true, _id.length);
        }

        return await inTxLeaky(parent, async (ctx) => {
            let res = await descriptor.subspace.subspace(id).range(ctx, [], {
                limit: opts && opts.limit,
                reverse: opts && opts.reverse,
                after
            });
            let items = await Promise.all(res.map(async (v) => {
                let pk = this._resolvePrimaryKeyFromObject(v.value);
                let e = await this._findById(ctx, pk);
                if (!e) {
                    throw Error('Broken index!');
                }
                return e;
            }));

            let cursor: string | undefined;
            if (res.length > 0) {
                cursor = tupleToCursor(res[res.length - 1].key);
            }
            return { items, cursor };
        });
    }

    async findAll(ctx: Context) {
        let ex = await this.descriptor.subspace.range(ctx, []);
        return ex.map((v) => {
            let k = getCacheKey(v.key);
            let cached = this._entityCache.get(ctx, k);
            if (cached) {
                return cached;
            }
            let res = this._createEntityInstance(ctx, v.value);
            this._entityCache.set(ctx, k, res);
            return res;
        });
    }

    protected async _findById(ctx: Context, _id: PrimaryKeyType[]): Promise<T | null> {

        // Validate input
        let id = this._resolvePrimaryKey(_id);

        return await this._mutexManager.runExclusively(ctx, [PrimaryIndex.lockKey(id)], async () => {

            // Check Cache
            let k = getCacheKey(id);
            let cached = this._entityCache.get(ctx, k);
            if (cached) {
                return cached;
            }

            // Read entity
            let ex = await this.descriptor.subspace.get(ctx, id);

            // Check cache
            cached = this._entityCache.get(ctx, k);
            if (cached) {
                return cached;
            }

            if (ex) {
                // Decode record
                let decoded = this._decode(ex);

                // Create instance
                let res = this._createEntityInstance(ctx, decoded);
                this._entityCache.set(ctx, k, res);
                return res;
            } else {
                return null;
            }
        });
    }

    protected async _create(ctx: Context, _id: PrimaryKeyType[], value: SHAPE): Promise<T> {

        //
        // We assume here next things:
        // * value is in normalized shape. Meaning all undefined are replaced with nulls and 
        //   there are no unknown fields.
        //

        // Validate input
        let id = this._resolvePrimaryKey(_id);
        let now = Date.now();
        let metadata: EntityMetadata = {
            versionCode: 0,
            createdAt: now,
            updatedAt: now
        };
        let encoded = this._encode(value, metadata);

        // Check cache
        let k = getCacheKey(id);
        if (this._entityCache.get(ctx, k)) {
            throw Error('Entity already exists');
        }

        // Compute mutex keys
        let mutexKeys: string[] = [];
        for (let i of this._indexMaintainers) {
            if (i.onCreateLockKeys) {
                for (let k2 of i.onCreateLockKeys(id, encoded)) {
                    mutexKeys.push(k2);
                }
            } else {
                mutexKeys.push('global-lock');
            }
        }

        await this._mutexManager.runExclusively(ctx, mutexKeys, async () => {
            await inTx(ctx, async (ctx2) => {

                //
                // Call beforeCreate hooks
                // beforeCreate is the only place that can throw exeptions
                // about constrain violations
                //

                for (let i of this._indexMaintainers) {
                    if (i.beforeCreate) {
                        await i.beforeCreate(ctx2, id, encoded);
                    }
                }

                //
                // Update indexes (all method are synchronous)
                //

                for (let i of this._indexMaintainers) {
                    i.onCreate(ctx2, id, encoded);
                }

                //
                // afterCreate hook. Currently is not used by built-in bindings.
                //

                for (let i of this._indexMaintainers) {
                    if (i.afterCreate) {
                        await i.afterCreate(ctx2, id, encoded);
                    }
                }

                //
                // Notify about created entity
                //

                this.descriptor.storage.eventBus.publish(ctx, 'fdb-entity-created-' + this.descriptor.storageKey, { entity: this.descriptor.storageKey });
            });
        });

        // Check cache
        if (this._entityCache.get(ctx, k)) {
            throw Error('Entity already exists');
        }

        // Create Instance
        let res = this._createEntityInstance(ctx, { ...value, createdAt: metadata.createdAt, updatedAt: metadata.updatedAt, _version: metadata.versionCode });
        this._entityCache.set(ctx, k, res);
        return res;
    }

    // Need to be arrow function since we are passing this function to entity instances
    protected _flush = async (ctx: Context, _id: ReadonlyArray<PrimaryKeyType>, oldValue: ShapeWithMetadata<SHAPE>, newValue: ShapeWithMetadata<SHAPE>) => {
        let id = this._resolvePrimaryKey(_id);
        // Encode value before any write
        let encoded = { ...newValue, ...this._codec.encode(newValue) };

        let mutexKeys: string[] = [];
        for (let i of this._indexMaintainers) {
            if (i.onUpdateLockKeys) {
                for (let k of i.onUpdateLockKeys(id, oldValue, encoded)) {
                    mutexKeys.push(k);
                }
            } else {
                mutexKeys.push('global-lock');
            }
        }

        await this._mutexManager.runExclusively(ctx, mutexKeys, async () => {

            //
            // Call beforeUpdate hooks
            // beforeUpdate is the only place that can throw exeptions
            // about constrain violations
            //

            for (let i of this._indexMaintainers) {
                if (i.beforeUpdate) {
                    await i.beforeUpdate(ctx, id, oldValue, encoded);
                }
            }

            //
            // Update indexes (all method are synchronous)
            //

            for (let i of this._indexMaintainers) {
                i.onUpdate(ctx, id, oldValue, encoded);
            }

            //
            // afterUpdate hook. Currently is not used by built-in bindings.
            //

            for (let i of this._indexMaintainers) {
                if (i.afterUpdate) {
                    await i.afterUpdate(ctx, id, oldValue, encoded);
                }
            }
        });
    }

    private _encode(value: SHAPE, metadata: EntityMetadata) {
        return { ...value, ...this._codec.encode({ ...value, createdAt: metadata.createdAt, updatedAt: metadata.updatedAt, _version: metadata.versionCode }) };
    }

    private _decode(value: any) {
        return { ...value, ...this._codec.decode(value) };
    }

    protected abstract _createEntityInstance(ctx: Context, value: ShapeWithMetadata<SHAPE>): T;

    private _resolvePrimaryKeyFromObject(src: any) {
        let res: any[] = [];
        for (let pk of this.descriptor.primaryKeys) {
            res.push(src[pk.name]);
        }
        return res;
    }

    private _resolvePrimaryKey(id: ReadonlyArray<any>) {
        if (this.descriptor.primaryKeys.length !== id.length) {
            throw Error('Invalid primary key');
        }
        let res: TupleItem[] = [];
        for (let i = 0; i < id.length; i++) {
            let key = this.descriptor.primaryKeys[i];
            if (key.type === 'boolean') {
                if (typeof id[i] !== 'boolean') {
                    throw Error('Unexpected key: ' + id[i]);
                }
                res.push(id[i]);
            } else if (key.type === 'integer') {
                if (typeof id[i] !== 'number') {
                    throw Error('Unexpected key: ' + id[i]);
                }
                res.push(id[i]);
            } else if (key.type === 'float') {
                if (typeof id[i] !== 'number') {
                    throw Error('Unexpected key: ' + id[i]);
                }
                res.push(new Float(id[i] as number));
            } else if (key.type === 'string') {
                res.push(id[i]);
            } else {
                throw Error('Unknown primary key');
            }
        }
        return res;
    }
}