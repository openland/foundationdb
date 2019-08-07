import { createLogger } from '@openland/log';
import { ConditionalMaintainer } from './indexes/ConditionalMaintainer';
import { LiveStream } from './LiveStream';
import { UniqueIndex } from './indexes/UniqueIndex';
import { TupleItem, Float } from '@openland/foundationdb-tuple';
import { uniqueSeed } from '@openland/foundationdb-utils';
import { Context } from '@openland/context';
import { TransactionCache, encoders, inTx, Watch } from '@openland/foundationdb';
import { Entity } from './Entity';
import { EntityDescriptor, SecondaryIndexDescriptor } from './EntityDescriptor';
import { EntityMetadata } from './EntityMetadata';
import { codecs, Codec } from './codecs';
import { ShapeWithMetadata } from './ShapeWithMetadata';
import { PrimaryKeyType } from './PrimaryKeyType';
import { PrimaryIndex } from './indexes/PrimaryIndex';
import { IndexMaintainer } from './indexes/IndexMaintainer';
import { IndexMutexManager } from './indexes/IndexMutexManager';
import { resolveIndexKey, tupleToCursor, cursorToTuple } from './indexes/utils';
import { RangeIndex } from './indexes/RangeIndex';
import { IndexStream } from './indexes/IndexStream';
import { EntityFactoryTracer } from './tracing';

export interface StreamProps {
    batchSize?: number;
    reverse?: boolean;
    after?: string;
}

function getCacheKey(id: ReadonlyArray<TupleItem>) {
    return encoders.tuple.pack(id as any /* WTF, TS? */).toString('hex');
}

const metadataCodec = codecs.struct({
    _version: codecs.default(codecs.number, 0),
    createdAt: codecs.default(codecs.number, () => Date.now()),
    updatedAt: codecs.default(codecs.number, () => Date.now()),
});

const logger = createLogger('fdb');

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

    protected async _findFromUniqueIndex(
        ctx: Context,
        _id: (PrimaryKeyType | null)[],
        descriptor: SecondaryIndexDescriptor
    ): Promise<T | null> {
        return await EntityFactoryTracer.findFromUniqueIndex(this.descriptor, ctx, _id, descriptor, async () => {
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

            // Fetch object value
            let k = getCacheKey(pk);
            let cached = this._entityCache.get(ctx, k);
            if (cached) {
                return cached;
            } else {
                let res = this._createEntityInstance(ctx, this._decode(ctx, ex));
                this._entityCache.set(ctx, k, res);
                return res;
            }
        });
    }

    //
    // Range Index Operations
    //

    protected _createStream(
        descriptor: SecondaryIndexDescriptor,
        _id: (PrimaryKeyType | null)[],
        opts?: StreamProps
    ) {
        let id = resolveIndexKey(_id, descriptor.type.fields, true /* Partial key */);
        let batchSize = opts && opts.batchSize ? opts.batchSize : 5000;
        let reverse = opts && opts.reverse ? opts.reverse : false;
        let stream = new IndexStream(descriptor, id, batchSize, reverse, (ctx, src) => {
            let pk = this._resolvePrimaryKeyFromObject(src);
            let k = getCacheKey(pk);
            let cached = this._entityCache.get(ctx, k);
            if (cached) {
                return cached;
            } else {
                let res = this._createEntityInstance(ctx, this._decode(ctx, src));
                this._entityCache.set(ctx, k, res);
                return res;
            }
        }, this.descriptor.storage);
        if (opts && opts.after) {
            stream.seek(opts.after);
        }
        return stream;
    }

    protected _createLiveStream(
        ctx: Context,
        descriptor: SecondaryIndexDescriptor,
        _id: (PrimaryKeyType | null)[],
        opts?: StreamProps
    ) {
        return new LiveStream(this._createStream(descriptor, _id, opts)).generator(ctx);
    }

    protected async _query(
        ctx: Context,
        descriptor: SecondaryIndexDescriptor,
        _id: (PrimaryKeyType | null)[],
        opts?: {
            limit?: number | undefined | null,
            reverse?: boolean | undefined | null,
            after?: (PrimaryKeyType | null)[] | undefined | null,
            afterCursor?: string | undefined | null
        }
    ): Promise<{ items: T[], cursor?: string, haveMore: boolean }> {
        return await EntityFactoryTracer.query(this.descriptor, ctx, descriptor, _id, opts, async () => {
            // Resolve index key
            let id = resolveIndexKey(_id, descriptor.type.fields, true /* Partial key */);
            let after: TupleItem[] | undefined = undefined;
            if (opts && opts.after) {
                after = resolveIndexKey(opts.after, descriptor.type.fields, true, _id.length);
            } else if (opts && opts.afterCursor) {
                after = cursorToTuple(opts.afterCursor);
            }

            let res = await descriptor.subspace.subspace(id).range(ctx, [], {
                limit: opts && opts.limit ? (opts.limit + 1) : undefined,
                reverse: opts && opts.reverse ? opts.reverse : undefined,
                after
            });
            let items = await Promise.all(res.map(async (v) => {
                let pk = this._resolvePrimaryKeyFromObject(v.value);
                let k = getCacheKey(pk);
                let cached = this._entityCache.get(ctx, k);
                if (cached) {
                    return cached;
                } else {
                    let res2 = this._createEntityInstance(ctx, this._decode(ctx, v.value));
                    this._entityCache.set(ctx, k, res2);
                    return res2;
                }
            }));

            if (opts && opts.limit) {
                let haveMore = items.length > opts.limit;
                let cursor: string | undefined;
                if (items.length > opts.limit) {
                    items.splice(items.length - 1, 1);
                    cursor = tupleToCursor(res[opts.limit - 1].key);
                } else {
                    if (res.length > 0) {
                        cursor = tupleToCursor(res[res.length - 1].key);
                    }
                }
                return { items: items, cursor, haveMore: haveMore };
            }

            let cursor2: string | undefined;
            if (res.length > 0) {
                cursor2 = tupleToCursor(res[res.length - 1].key);
            }
            return { items, cursor: cursor2, haveMore: false };
        });
    }

    async findAll(ctx: Context) {
        return await EntityFactoryTracer.findAll(this.descriptor, ctx, async () => {
            let ex = await this.descriptor.subspace.range(ctx, []);
            return ex.map((v) => {
                let k = getCacheKey(v.key);
                let cached = this._entityCache.get(ctx, k);
                if (cached) {
                    return cached;
                }
                let res = this._createEntityInstance(ctx, this._decode(ctx, v.value));
                this._entityCache.set(ctx, k, res);
                return res;
            });
        });
    }

    async findAllKeys(ctx: Context) {
        let ex = await this.descriptor.subspace.range(ctx, []);
        return ex.map((v) => this._decodePrimaryKey(v.key));
    }

    protected async _findById(ctx: Context, _id: PrimaryKeyType[]): Promise<T | null> {
        return await EntityFactoryTracer.findById(this.descriptor, ctx, _id, async () => {
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
                    let decoded = this._decode(ctx, ex);

                    // Create instance
                    let res = this._createEntityInstance(ctx, decoded);
                    this._entityCache.set(ctx, k, res);
                    return res;
                } else {
                    return null;
                }
            });
        });
    }

    protected _create_UNSAFE(ctx: Context, _id: PrimaryKeyType[], value: SHAPE): T {
        let id = this._resolvePrimaryKey(_id);
        let now = Date.now();
        let metadata: EntityMetadata = {
            versionCode: 0,
            createdAt: now,
            updatedAt: now
        };
        let encoded = this._encode(ctx, value, metadata);

        // Check cache
        let k = getCacheKey(id);
        if (this._entityCache.get(ctx, k)) {
            throw Error('Entity already exists');
        }

        // Create indexes
        for (let i of this._indexMaintainers) {
            i.onCreate(ctx, id, encoded);
        }

        //
        // Notify about created entity
        //
        this.descriptor.storage.eventBus.publish(ctx, 'fdb-entity-created-' + this.descriptor.storageKey, { entity: this.descriptor.storageKey });

        // Create Instance
        let res = this._createEntityInstance(ctx, Object.assign({}, value, { createdAt: metadata.createdAt, updatedAt: metadata.updatedAt, _version: metadata.versionCode }));
        this._entityCache.set(ctx, k, res);
        return res;
    }

    protected async _create(ctx: Context, _id: PrimaryKeyType[], value: SHAPE): Promise<T> {
        return await EntityFactoryTracer.create(this.descriptor, ctx, _id, value, async () => {
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
            let encoded = this._encode(ctx, value, metadata);

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
            let res = this._createEntityInstance(ctx, Object.assign({}, value, { createdAt: metadata.createdAt, updatedAt: metadata.updatedAt, _version: metadata.versionCode }));
            this._entityCache.set(ctx, k, res);
            return res;
        });
    }

    // Need to be arrow function since we are passing this function to entity instances
    protected _flush = async (ctx: Context, _id: ReadonlyArray<PrimaryKeyType>, oldValue: ShapeWithMetadata<SHAPE>, newValue: ShapeWithMetadata<SHAPE>) => {
        return await EntityFactoryTracer.flush(this.descriptor, ctx, _id, oldValue, newValue, async () => {
            let id = this._resolvePrimaryKey(_id);
            // Encode value before any write
            let encoded = Object.assign({}, newValue, this._codec.encode(newValue));

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
        });
    }

    private _encode(ctx: Context, value: SHAPE, metadata: EntityMetadata) {
        try {
            return Object.assign({}, value, this._codec.encode(Object.assign({}, value, { createdAt: metadata.createdAt, updatedAt: metadata.updatedAt, _version: metadata.versionCode })));
        } catch (e) {
            logger.error(ctx, 'Unable to encode entity: ', value);
            throw e;
        }
    }

    private _decode(ctx: Context, value: any) {
        try {
            return Object.assign({}, value, this._codec.decode(value));
        } catch (e) {
            logger.error(ctx, 'Unable to decode entity: ', value);
            throw e;
        }
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

    private _decodePrimaryKey(id: TupleItem[]) {
        if (this.descriptor.primaryKeys.length !== id.length) {
            throw Error('Invalid primary key');
        }
        let res: PrimaryKeyType[] = [];
        for (let i = 0; i < id.length; i++) {
            let key = this.descriptor.primaryKeys[i];
            if (key.type === 'boolean') {
                if (typeof id[i] !== 'boolean') {
                    throw Error('Unexpected key: ' + id[i]);
                }
                res.push(id[i] as boolean);
            } else if (key.type === 'integer') {
                if (typeof id[i] !== 'number') {
                    throw Error('Unexpected key: ' + id[i]);
                }
                res.push(id[i] as number);
            } else if (key.type === 'float') {
                if (id[i] instanceof Float) {
                    throw Error('Unexpected key: ' + id[i]);
                }
                res.push((id[i] as Float).value);
            } else if (key.type === 'string') {
                res.push(id[i] as string);
            } else {
                throw Error('Unknown primary key');
            }
        }
        return res;
    }
}