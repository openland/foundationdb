// THIS FILE IS AUTOGENERATED! DO NOT TRY TO EDIT!
// @ts-ignore
import { Context } from '@openland/context';
// @ts-ignore
import { Subspace, Watch } from '@openland/foundationdb';
// @ts-ignore
import { EntityStorage, EventStore, EventStoreDescriptor, EventFactory, BaseStore, RangeQueryOptions, BaseEvent, codecs as c } from '@openland/foundationdb-entity';
// @ts-ignore
import { Entity, EntityFactory, EntityDescriptor, SecondaryIndexDescriptor, ShapeWithMetadata, PrimaryKeyDescriptor, FieldDescriptor, StreamProps } from '@openland/foundationdb-entity';

export interface UniqueIndexShape {
    id: number;
    unique1: string;
    unique2: string;
}

export interface UniqueIndexCreateShape {
    unique1: string;
    unique2: string;
}

export class UniqueIndex extends Entity<UniqueIndexShape> {
    get id(): number { return this._rawValue.id; }
    get unique1(): string { return this._rawValue.unique1; }
    set unique1(value: string) {
        let normalized = this.descriptor.codec.fields.unique1.normalize(value);
        if (this._rawValue.unique1 !== normalized) {
            this._rawValue.unique1 = normalized;
            this._updatedValues.unique1 = normalized;
            this.invalidate();
        }
    }
    get unique2(): string { return this._rawValue.unique2; }
    set unique2(value: string) {
        let normalized = this.descriptor.codec.fields.unique2.normalize(value);
        if (this._rawValue.unique2 !== normalized) {
            this._rawValue.unique2 = normalized;
            this._updatedValues.unique2 = normalized;
            this.invalidate();
        }
    }

    delete(ctx: Context) {
        return this._delete(ctx);
    }
}

export class UniqueIndexFactory extends EntityFactory<UniqueIndexShape, UniqueIndex> {

    static async open(ctx: Context, storage: EntityStorage) {
        let subspace = await storage.resolveEntityDirectory(ctx, 'uniqueIndex');
        let secondaryIndexes: SecondaryIndexDescriptor[] = [];
        secondaryIndexes.push({ name: 'test', storageKey: 'test', type: { type: 'unique', fields: [{ name: 'unique1', type: 'string' }, { name: 'unique2', type: 'string' }] }, subspace: await storage.resolveEntityIndexDirectory(ctx, 'uniqueIndex', 'test'), condition: undefined });
        let primaryKeys: PrimaryKeyDescriptor[] = [];
        primaryKeys.push({ name: 'id', type: 'integer' });
        let fields: FieldDescriptor[] = [];
        fields.push({ name: 'unique1', type: { type: 'string' }, secure: false });
        fields.push({ name: 'unique2', type: { type: 'string' }, secure: false });
        let codec = c.struct({
            id: c.integer,
            unique1: c.string,
            unique2: c.string,
        });
        let descriptor: EntityDescriptor<UniqueIndexShape> = {
            name: 'UniqueIndex',
            storageKey: 'uniqueIndex',
            allowDelete: true,
            subspace, codec, secondaryIndexes, storage, primaryKeys, fields
        };
        return new UniqueIndexFactory(descriptor);
    }

    private constructor(descriptor: EntityDescriptor<UniqueIndexShape>) {
        super(descriptor);
    }

    readonly test = Object.freeze({
        find: async (ctx: Context, unique1: string, unique2: string) => {
            return this._findFromUniqueIndex(ctx, [unique1, unique2], this.descriptor.secondaryIndexes[0]);
        },
        findAll: async (ctx: Context, unique1: string) => {
            return (await this._query(ctx, this.descriptor.secondaryIndexes[0], [unique1])).items;
        },
        query: (ctx: Context, unique1: string, opts?: RangeQueryOptions<string>) => {
            return this._query(ctx, this.descriptor.secondaryIndexes[0], [unique1], { limit: opts && opts.limit, reverse: opts && opts.reverse, after: opts && opts.after ? [opts.after] : undefined, afterCursor: opts && opts.afterCursor ? opts.afterCursor : undefined });
        },
    });

    create(ctx: Context, id: number, src: UniqueIndexCreateShape): Promise<UniqueIndex> {
        return this._create(ctx, [id], this.descriptor.codec.normalize({ id, ...src }));
    }

    create_UNSAFE(ctx: Context, id: number, src: UniqueIndexCreateShape): UniqueIndex {
        return this._create_UNSAFE(ctx, [id], this.descriptor.codec.normalize({ id, ...src }));
    }

    findById(ctx: Context, id: number): Promise<UniqueIndex | null> | UniqueIndex | null {
        return this._findById(ctx, [id]);
    }

    findByIdOrFail(ctx: Context, id: number): Promise<UniqueIndex> | UniqueIndex {
        return this._findByIdOrFail(ctx, [id]);
    }

    watch(ctx: Context, id: number): Watch {
        return this._watch(ctx, [id]);
    }

    protected _createEntityInstance(ctx: Context, value: ShapeWithMetadata<UniqueIndexShape>): UniqueIndex {
        return new UniqueIndex([value.id], value, this.descriptor, this._flush, this._delete, ctx);
    }
}

export interface UniqueConditionalIndexShape {
    id: number;
    unique1: string;
    unique2: string;
}

export interface UniqueConditionalIndexCreateShape {
    unique1: string;
    unique2: string;
}

export class UniqueConditionalIndex extends Entity<UniqueConditionalIndexShape> {
    get id(): number { return this._rawValue.id; }
    get unique1(): string { return this._rawValue.unique1; }
    set unique1(value: string) {
        let normalized = this.descriptor.codec.fields.unique1.normalize(value);
        if (this._rawValue.unique1 !== normalized) {
            this._rawValue.unique1 = normalized;
            this._updatedValues.unique1 = normalized;
            this.invalidate();
        }
    }
    get unique2(): string { return this._rawValue.unique2; }
    set unique2(value: string) {
        let normalized = this.descriptor.codec.fields.unique2.normalize(value);
        if (this._rawValue.unique2 !== normalized) {
            this._rawValue.unique2 = normalized;
            this._updatedValues.unique2 = normalized;
            this.invalidate();
        }
    }

    delete(ctx: Context) {
        return this._delete(ctx);
    }
}

export class UniqueConditionalIndexFactory extends EntityFactory<UniqueConditionalIndexShape, UniqueConditionalIndex> {

    static async open(ctx: Context, storage: EntityStorage) {
        let subspace = await storage.resolveEntityDirectory(ctx, 'uniqueConditionalIndex');
        let secondaryIndexes: SecondaryIndexDescriptor[] = [];
        secondaryIndexes.push({ name: 'test', storageKey: 'test', type: { type: 'unique', fields: [{ name: 'unique1', type: 'string' }, { name: 'unique2', type: 'string' }] }, subspace: await storage.resolveEntityIndexDirectory(ctx, 'uniqueConditionalIndex', 'test'), condition: (src) => src.unique1 === '!' });
        let primaryKeys: PrimaryKeyDescriptor[] = [];
        primaryKeys.push({ name: 'id', type: 'integer' });
        let fields: FieldDescriptor[] = [];
        fields.push({ name: 'unique1', type: { type: 'string' }, secure: false });
        fields.push({ name: 'unique2', type: { type: 'string' }, secure: false });
        let codec = c.struct({
            id: c.integer,
            unique1: c.string,
            unique2: c.string,
        });
        let descriptor: EntityDescriptor<UniqueConditionalIndexShape> = {
            name: 'UniqueConditionalIndex',
            storageKey: 'uniqueConditionalIndex',
            allowDelete: true,
            subspace, codec, secondaryIndexes, storage, primaryKeys, fields
        };
        return new UniqueConditionalIndexFactory(descriptor);
    }

    private constructor(descriptor: EntityDescriptor<UniqueConditionalIndexShape>) {
        super(descriptor);
    }

    readonly test = Object.freeze({
        find: async (ctx: Context, unique1: string, unique2: string) => {
            return this._findFromUniqueIndex(ctx, [unique1, unique2], this.descriptor.secondaryIndexes[0]);
        },
        findAll: async (ctx: Context, unique1: string) => {
            return (await this._query(ctx, this.descriptor.secondaryIndexes[0], [unique1])).items;
        },
        query: (ctx: Context, unique1: string, opts?: RangeQueryOptions<string>) => {
            return this._query(ctx, this.descriptor.secondaryIndexes[0], [unique1], { limit: opts && opts.limit, reverse: opts && opts.reverse, after: opts && opts.after ? [opts.after] : undefined, afterCursor: opts && opts.afterCursor ? opts.afterCursor : undefined });
        },
    });

    create(ctx: Context, id: number, src: UniqueConditionalIndexCreateShape): Promise<UniqueConditionalIndex> {
        return this._create(ctx, [id], this.descriptor.codec.normalize({ id, ...src }));
    }

    create_UNSAFE(ctx: Context, id: number, src: UniqueConditionalIndexCreateShape): UniqueConditionalIndex {
        return this._create_UNSAFE(ctx, [id], this.descriptor.codec.normalize({ id, ...src }));
    }

    findById(ctx: Context, id: number): Promise<UniqueConditionalIndex | null> | UniqueConditionalIndex | null {
        return this._findById(ctx, [id]);
    }

    findByIdOrFail(ctx: Context, id: number): Promise<UniqueConditionalIndex> | UniqueConditionalIndex {
        return this._findByIdOrFail(ctx, [id]);
    }

    watch(ctx: Context, id: number): Watch {
        return this._watch(ctx, [id]);
    }

    protected _createEntityInstance(ctx: Context, value: ShapeWithMetadata<UniqueConditionalIndexShape>): UniqueConditionalIndex {
        return new UniqueConditionalIndex([value.id], value, this.descriptor, this._flush, this._delete, ctx);
    }
}

export interface Store extends BaseStore {
    readonly UniqueIndex: UniqueIndexFactory;
    readonly UniqueConditionalIndex: UniqueConditionalIndexFactory;
}

export async function openStore(ctx: Context, storage: EntityStorage): Promise<Store> {
    const eventFactory = new EventFactory();
    let UniqueIndexPromise = UniqueIndexFactory.open(ctx, storage);
    let UniqueConditionalIndexPromise = UniqueConditionalIndexFactory.open(ctx, storage);
    return {
        storage,
        eventFactory,
        UniqueIndex: await UniqueIndexPromise,
        UniqueConditionalIndex: await UniqueConditionalIndexPromise,
    };
}
