// THIS FILE IS AUTOGENERATED! DO NOT TRY TO EDIT!
// @ts-ignore
import { Context } from '@openland/context';
// @ts-ignore
import { Subspace, Watch, RangeOptions } from '@openland/foundationdb';
// @ts-ignore
import { EntityStorage, BaseStore, codecs as c } from '@openland/foundationdb-entity';
// @ts-ignore
import { Entity, EntityFactory, EntityDescriptor, SecondaryIndexDescriptor, ShapeWithMetadata, PrimaryKeyDescriptor, FieldDescriptor, StreamProps } from '@openland/foundationdb-entity';

export interface SimpleEntityShape {
    id: string;
    value: string;
    value2: number;
    value3: boolean | null;
}

export interface SimpleEntityCreateShape {
    value: string;
    value2: number;
    value3: boolean | null;
}

export class SimpleEntity extends Entity<SimpleEntityShape> {
    get id(): string { return this._rawValue.id; }
    get value(): string { return this._rawValue.value; }
    set value(value: string) {
        let normalized = this.descriptor.codec.fields.value.normalize(value);
        if (this._rawValue.value !== normalized) {
            this._rawValue.value = normalized;
            this._updatedValues.value = normalized;
            this.invalidate();
        }
    }
    get value2(): number { return this._rawValue.value2; }
    set value2(value: number) {
        let normalized = this.descriptor.codec.fields.value2.normalize(value);
        if (this._rawValue.value2 !== normalized) {
            this._rawValue.value2 = normalized;
            this._updatedValues.value2 = normalized;
            this.invalidate();
        }
    }
    get value3(): boolean | null { return this._rawValue.value3; }
    set value3(value: boolean | null) {
        let normalized = this.descriptor.codec.fields.value3.normalize(value);
        if (this._rawValue.value3 !== normalized) {
            this._rawValue.value3 = normalized;
            this._updatedValues.value3 = normalized;
            this.invalidate();
        }
    }
}

export class SimpleEntityFactory extends EntityFactory<SimpleEntityShape, SimpleEntity> {

    static async open(storage: EntityStorage) {
        let subspace = await storage.resolveEntityDirectory('simpleEntity');
        let secondaryIndexes: SecondaryIndexDescriptor[] = [];
        let primaryKeys: PrimaryKeyDescriptor[] = [];
        primaryKeys.push({ name: 'id', type: 'string' });
        let fields: FieldDescriptor[] = [];
        fields.push({ name: 'value', type: { type: 'string' }, secure: false });
        fields.push({ name: 'value2', type: { type: 'integer' }, secure: false });
        fields.push({ name: 'value3', type: { type: 'optional', inner: { type: 'boolean' } }, secure: false });
        let codec = c.struct({
            id: c.string,
            value: c.string,
            value2: c.integer,
            value3: c.optional(c.boolean),
        });
        let descriptor: EntityDescriptor<SimpleEntityShape> = {
            name: 'SimpleEntity',
            storageKey: 'simpleEntity',
            subspace, codec, secondaryIndexes, storage, primaryKeys, fields
        };
        return new SimpleEntityFactory(descriptor);
    }

    private constructor(descriptor: EntityDescriptor<SimpleEntityShape>) {
        super(descriptor);
    }

    create(ctx: Context, id: string, src: SimpleEntityCreateShape): Promise<SimpleEntity> {
        return this._create(ctx, [id], this.descriptor.codec.normalize({ id, ...src }));
    }

    create_UNSAFE(ctx: Context, id: string, src: SimpleEntityCreateShape): SimpleEntity {
        return this._create_UNSAFE(ctx, [id], this.descriptor.codec.normalize({ id, ...src }));
    }

    findById(ctx: Context, id: string): Promise<SimpleEntity | null> {
        return this._findById(ctx, [id]);
    }

    watch(ctx: Context, id: string): Watch {
        return this._watch(ctx, [id]);
    }

    protected _createEntityInstance(ctx: Context, value: ShapeWithMetadata<SimpleEntityShape>): SimpleEntity {
        return new SimpleEntity([value.id], value, this.descriptor, this._flush, ctx);
    }
}

export interface SimpleEntity2Shape {
    id: number;
    value: string;
}

export interface SimpleEntity2CreateShape {
    value: string;
}

export class SimpleEntity2 extends Entity<SimpleEntity2Shape> {
    get id(): number { return this._rawValue.id; }
    get value(): string { return this._rawValue.value; }
    set value(value: string) {
        let normalized = this.descriptor.codec.fields.value.normalize(value);
        if (this._rawValue.value !== normalized) {
            this._rawValue.value = normalized;
            this._updatedValues.value = normalized;
            this.invalidate();
        }
    }
}

export class SimpleEntity2Factory extends EntityFactory<SimpleEntity2Shape, SimpleEntity2> {

    static async open(storage: EntityStorage) {
        let subspace = await storage.resolveEntityDirectory('simpleEntity2');
        let secondaryIndexes: SecondaryIndexDescriptor[] = [];
        let primaryKeys: PrimaryKeyDescriptor[] = [];
        primaryKeys.push({ name: 'id', type: 'integer' });
        let fields: FieldDescriptor[] = [];
        fields.push({ name: 'value', type: { type: 'string' }, secure: false });
        let codec = c.struct({
            id: c.integer,
            value: c.string,
        });
        let descriptor: EntityDescriptor<SimpleEntity2Shape> = {
            name: 'SimpleEntity2',
            storageKey: 'simpleEntity2',
            subspace, codec, secondaryIndexes, storage, primaryKeys, fields
        };
        return new SimpleEntity2Factory(descriptor);
    }

    private constructor(descriptor: EntityDescriptor<SimpleEntity2Shape>) {
        super(descriptor);
    }

    create(ctx: Context, id: number, src: SimpleEntity2CreateShape): Promise<SimpleEntity2> {
        return this._create(ctx, [id], this.descriptor.codec.normalize({ id, ...src }));
    }

    create_UNSAFE(ctx: Context, id: number, src: SimpleEntity2CreateShape): SimpleEntity2 {
        return this._create_UNSAFE(ctx, [id], this.descriptor.codec.normalize({ id, ...src }));
    }

    findById(ctx: Context, id: number): Promise<SimpleEntity2 | null> {
        return this._findById(ctx, [id]);
    }

    watch(ctx: Context, id: number): Watch {
        return this._watch(ctx, [id]);
    }

    protected _createEntityInstance(ctx: Context, value: ShapeWithMetadata<SimpleEntity2Shape>): SimpleEntity2 {
        return new SimpleEntity2([value.id], value, this.descriptor, this._flush, ctx);
    }
}

export interface AllFieldsShape {
    key1: boolean;
    key2: number;
    key3: number;
    key4: string;
    value1: boolean;
    value2: number;
    value3: number;
    value4: string;
    value5: 'value1' | 'value2';
    value55: 'value1' | 'value2' | null;
    value6: (string)[];
    value7: { name: string, type: number };
    value8: { type: 'something', name: string } | { type: 'something_2', name: string } | null;
    value9: any;
    value10: boolean | null;
    value11: number | null;
    value12: number | null;
    value13: string | null;
    vaueSome: number;
}

export interface AllFieldsCreateShape {
    value1: boolean;
    value2: number;
    value3: number;
    value4: string;
    value5: 'value1' | 'value2';
    value55: 'value1' | 'value2' | null;
    value6: (string)[];
    value7: { name: string, type: number };
    value8: { type: 'something', name: string } | { type: 'something_2', name: string } | null;
    value9: any;
    value10: boolean | null;
    value11: number | null;
    value12: number | null;
    value13: string | null;
    vaueSome: number;
}

export class AllFields extends Entity<AllFieldsShape> {
    get key1(): boolean { return this._rawValue.key1; }
    get key2(): number { return this._rawValue.key2; }
    get key3(): number { return this._rawValue.key3; }
    get key4(): string { return this._rawValue.key4; }
    get value1(): boolean { return this._rawValue.value1; }
    set value1(value: boolean) {
        let normalized = this.descriptor.codec.fields.value1.normalize(value);
        if (this._rawValue.value1 !== normalized) {
            this._rawValue.value1 = normalized;
            this._updatedValues.value1 = normalized;
            this.invalidate();
        }
    }
    get value2(): number { return this._rawValue.value2; }
    set value2(value: number) {
        let normalized = this.descriptor.codec.fields.value2.normalize(value);
        if (this._rawValue.value2 !== normalized) {
            this._rawValue.value2 = normalized;
            this._updatedValues.value2 = normalized;
            this.invalidate();
        }
    }
    get value3(): number { return this._rawValue.value3; }
    set value3(value: number) {
        let normalized = this.descriptor.codec.fields.value3.normalize(value);
        if (this._rawValue.value3 !== normalized) {
            this._rawValue.value3 = normalized;
            this._updatedValues.value3 = normalized;
            this.invalidate();
        }
    }
    get value4(): string { return this._rawValue.value4; }
    set value4(value: string) {
        let normalized = this.descriptor.codec.fields.value4.normalize(value);
        if (this._rawValue.value4 !== normalized) {
            this._rawValue.value4 = normalized;
            this._updatedValues.value4 = normalized;
            this.invalidate();
        }
    }
    get value5(): 'value1' | 'value2' { return this._rawValue.value5; }
    set value5(value: 'value1' | 'value2') {
        let normalized = this.descriptor.codec.fields.value5.normalize(value);
        if (this._rawValue.value5 !== normalized) {
            this._rawValue.value5 = normalized;
            this._updatedValues.value5 = normalized;
            this.invalidate();
        }
    }
    get value55(): 'value1' | 'value2' | null { return this._rawValue.value55; }
    set value55(value: 'value1' | 'value2' | null) {
        let normalized = this.descriptor.codec.fields.value55.normalize(value);
        if (this._rawValue.value55 !== normalized) {
            this._rawValue.value55 = normalized;
            this._updatedValues.value55 = normalized;
            this.invalidate();
        }
    }
    get value6(): (string)[] { return this._rawValue.value6; }
    set value6(value: (string)[]) {
        let normalized = this.descriptor.codec.fields.value6.normalize(value);
        if (this._rawValue.value6 !== normalized) {
            this._rawValue.value6 = normalized;
            this._updatedValues.value6 = normalized;
            this.invalidate();
        }
    }
    get value7(): { name: string, type: number } { return this._rawValue.value7; }
    set value7(value: { name: string, type: number }) {
        let normalized = this.descriptor.codec.fields.value7.normalize(value);
        if (this._rawValue.value7 !== normalized) {
            this._rawValue.value7 = normalized;
            this._updatedValues.value7 = normalized;
            this.invalidate();
        }
    }
    get value8(): { type: 'something', name: string } | { type: 'something_2', name: string } | null { return this._rawValue.value8; }
    set value8(value: { type: 'something', name: string } | { type: 'something_2', name: string } | null) {
        let normalized = this.descriptor.codec.fields.value8.normalize(value);
        if (this._rawValue.value8 !== normalized) {
            this._rawValue.value8 = normalized;
            this._updatedValues.value8 = normalized;
            this.invalidate();
        }
    }
    get value9(): any { return this._rawValue.value9; }
    set value9(value: any) {
        let normalized = this.descriptor.codec.fields.value9.normalize(value);
        if (this._rawValue.value9 !== normalized) {
            this._rawValue.value9 = normalized;
            this._updatedValues.value9 = normalized;
            this.invalidate();
        }
    }
    get value10(): boolean | null { return this._rawValue.value10; }
    set value10(value: boolean | null) {
        let normalized = this.descriptor.codec.fields.value10.normalize(value);
        if (this._rawValue.value10 !== normalized) {
            this._rawValue.value10 = normalized;
            this._updatedValues.value10 = normalized;
            this.invalidate();
        }
    }
    get value11(): number | null { return this._rawValue.value11; }
    set value11(value: number | null) {
        let normalized = this.descriptor.codec.fields.value11.normalize(value);
        if (this._rawValue.value11 !== normalized) {
            this._rawValue.value11 = normalized;
            this._updatedValues.value11 = normalized;
            this.invalidate();
        }
    }
    get value12(): number | null { return this._rawValue.value12; }
    set value12(value: number | null) {
        let normalized = this.descriptor.codec.fields.value12.normalize(value);
        if (this._rawValue.value12 !== normalized) {
            this._rawValue.value12 = normalized;
            this._updatedValues.value12 = normalized;
            this.invalidate();
        }
    }
    get value13(): string | null { return this._rawValue.value13; }
    set value13(value: string | null) {
        let normalized = this.descriptor.codec.fields.value13.normalize(value);
        if (this._rawValue.value13 !== normalized) {
            this._rawValue.value13 = normalized;
            this._updatedValues.value13 = normalized;
            this.invalidate();
        }
    }
    get vaueSome(): number { return this._rawValue.vaueSome; }
    set vaueSome(value: number) {
        let normalized = this.descriptor.codec.fields.vaueSome.normalize(value);
        if (this._rawValue.vaueSome !== normalized) {
            this._rawValue.vaueSome = normalized;
            this._updatedValues.vaueSome = normalized;
            this.invalidate();
        }
    }
}

export class AllFieldsFactory extends EntityFactory<AllFieldsShape, AllFields> {

    static async open(storage: EntityStorage) {
        let subspace = await storage.resolveEntityDirectory('allFields');
        let secondaryIndexes: SecondaryIndexDescriptor[] = [];
        secondaryIndexes.push({ name: 'uniqIndex', storageKey: 'uniqIndex', type: { type: 'unique', fields: [{ name: 'key1', type: 'boolean' }, { name: 'key2', type: 'integer' }, { name: 'key3', type: 'float' }, { name: 'key4', type: 'string' }, { name: 'value1', type: 'boolean' }, { name: 'value2', type: 'integer' }, { name: 'value3', type: 'float' }, { name: 'value4', type: 'string' }, { name: 'value10', type: 'opt_boolean' }, { name: 'value11', type: 'opt_integer' }, { name: 'value12', type: 'opt_float' }, { name: 'value13', type: 'opt_string' }, { name: 'createdAt', type: 'integer' }, { name: 'updatedAt', type: 'integer' }, { name: 'value5', type: 'string' }, { name: 'value55', type: 'opt_string' }] }, subspace: await storage.resolveEntityIndexDirectory('allFields', 'uniqIndex'), condition: (src) => src.key1 !== 'hello!' });
        let primaryKeys: PrimaryKeyDescriptor[] = [];
        primaryKeys.push({ name: 'key1', type: 'boolean' });
        primaryKeys.push({ name: 'key2', type: 'integer' });
        primaryKeys.push({ name: 'key3', type: 'float' });
        primaryKeys.push({ name: 'key4', type: 'string' });
        let fields: FieldDescriptor[] = [];
        fields.push({ name: 'value1', type: { type: 'boolean' }, secure: false });
        fields.push({ name: 'value2', type: { type: 'integer' }, secure: false });
        fields.push({ name: 'value3', type: { type: 'float' }, secure: false });
        fields.push({ name: 'value4', type: { type: 'string' }, secure: false });
        fields.push({ name: 'value5', type: { type: 'enum', values: ['value1', 'value2'] }, secure: false });
        fields.push({ name: 'value55', type: { type: 'optional', inner: { type: 'enum', values: ['value1', 'value2'] } }, secure: false });
        fields.push({ name: 'value6', type: { type: 'array', inner: { type: 'string' } }, secure: false });
        fields.push({ name: 'value7', type: { type: 'struct', fields: { name: { type: 'string' }, type: { type: 'integer' } } }, secure: false });
        fields.push({ name: 'value8', type: { type: 'optional', inner: { type: 'union', types: { something: { name: { type: 'string' } }, something_2: { name: { type: 'string' } } } } }, secure: false });
        fields.push({ name: 'value9', type: { type: 'json' }, secure: false });
        fields.push({ name: 'value10', type: { type: 'optional', inner: { type: 'boolean' } }, secure: false });
        fields.push({ name: 'value11', type: { type: 'optional', inner: { type: 'integer' } }, secure: false });
        fields.push({ name: 'value12', type: { type: 'optional', inner: { type: 'float' } }, secure: false });
        fields.push({ name: 'value13', type: { type: 'optional', inner: { type: 'string' } }, secure: false });
        fields.push({ name: 'vaueSome', type: { type: 'integer' }, secure: false });
        let codec = c.struct({
            key1: c.boolean,
            key2: c.integer,
            key3: c.float,
            key4: c.string,
            value1: c.boolean,
            value2: c.integer,
            value3: c.float,
            value4: c.string,
            value5: c.enum('value1', 'value2'),
            value55: c.optional(c.enum('value1', 'value2')),
            value6: c.array(c.string),
            value7: c.struct({ name: c.string, type: c.integer }),
            value8: c.optional(c.union({ something: c.struct({ name: c.string }), something_2: c.struct({ name: c.string }) })),
            value9: c.any,
            value10: c.optional(c.boolean),
            value11: c.optional(c.integer),
            value12: c.optional(c.float),
            value13: c.optional(c.string),
            vaueSome: c.integer,
        });
        let descriptor: EntityDescriptor<AllFieldsShape> = {
            name: 'AllFields',
            storageKey: 'allFields',
            subspace, codec, secondaryIndexes, storage, primaryKeys, fields
        };
        return new AllFieldsFactory(descriptor);
    }

    private constructor(descriptor: EntityDescriptor<AllFieldsShape>) {
        super(descriptor);
    }

    readonly uniqIndex = Object.freeze({
        find: async (ctx: Context, key1: boolean, key2: number, key3: number, key4: string, value1: boolean, value2: number, value3: number, value4: string, value10: boolean | null, value11: number | null, value12: number | null, value13: string | null, createdAt: number, updatedAt: number, value5: 'value1' | 'value2', value55: 'value1' | 'value2' | null) => {
            return this._findFromUniqueIndex(ctx, [key1, key2, key3, key4, value1, value2, value3, value4, value10, value11, value12, value13, createdAt, updatedAt, value5, value55], this.descriptor.secondaryIndexes[0]);
        },
        findAll: async (ctx: Context, key1: boolean, key2: number, key3: number, key4: string, value1: boolean, value2: number, value3: number, value4: string, value10: boolean | null, value11: number | null, value12: number | null, value13: string | null, createdAt: number, updatedAt: number, value5: 'value1' | 'value2') => {
            return (await this._query(ctx, this.descriptor.secondaryIndexes[0], [key1, key2, key3, key4, value1, value2, value3, value4, value10, value11, value12, value13, createdAt, updatedAt, value5])).items;
        },
        query: (ctx: Context, key1: boolean, key2: number, key3: number, key4: string, value1: boolean, value2: number, value3: number, value4: string, value10: boolean | null, value11: number | null, value12: number | null, value13: string | null, createdAt: number, updatedAt: number, value5: 'value1' | 'value2', opts?: RangeOptions<'value1' | 'value2' | null>) => {
            return this._query(ctx, this.descriptor.secondaryIndexes[0], [key1, key2, key3, key4, value1, value2, value3, value4, value10, value11, value12, value13, createdAt, updatedAt, value5], { limit: opts && opts.limit, reverse: opts && opts.reverse, after: opts && opts.after ? [opts.after] : undefined});
        },
    });

    create(ctx: Context, key1: boolean, key2: number, key3: number, key4: string, src: AllFieldsCreateShape): Promise<AllFields> {
        return this._create(ctx, [key1, key2, key3, key4], this.descriptor.codec.normalize({ key1, key2, key3, key4, ...src }));
    }

    create_UNSAFE(ctx: Context, key1: boolean, key2: number, key3: number, key4: string, src: AllFieldsCreateShape): AllFields {
        return this._create_UNSAFE(ctx, [key1, key2, key3, key4], this.descriptor.codec.normalize({ key1, key2, key3, key4, ...src }));
    }

    findById(ctx: Context, key1: boolean, key2: number, key3: number, key4: string): Promise<AllFields | null> {
        return this._findById(ctx, [key1, key2, key3, key4]);
    }

    watch(ctx: Context, key1: boolean, key2: number, key3: number, key4: string): Watch {
        return this._watch(ctx, [key1, key2, key3, key4]);
    }

    protected _createEntityInstance(ctx: Context, value: ShapeWithMetadata<AllFieldsShape>): AllFields {
        return new AllFields([value.key1, value.key2, value.key3, value.key4], value, this.descriptor, this._flush, ctx);
    }
}

export interface Store extends BaseStore {
    readonly SimpleEntity: SimpleEntityFactory;
    readonly SimpleEntity2: SimpleEntity2Factory;
    readonly AllFields: AllFieldsFactory;
    readonly directoryDirectory: Subspace;
}

export async function openStore(storage: EntityStorage): Promise<Store> {
    let SimpleEntityPromise = SimpleEntityFactory.open(storage);
    let SimpleEntity2Promise = SimpleEntity2Factory.open(storage);
    let AllFieldsPromise = AllFieldsFactory.open(storage);
    let directoryDirectoryPromise = storage.resolveCustomDirectory('directory');
    return {
        storage,
        SimpleEntity: await SimpleEntityPromise,
        SimpleEntity2: await SimpleEntity2Promise,
        AllFields: await AllFieldsPromise,
        directoryDirectory: await directoryDirectoryPromise,
    };
}
