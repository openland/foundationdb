export type PrimaryKeyType = 'string' | 'integer' | 'float' | 'boolean';

export abstract class SchemaType {
    abstract readonly type: 'string' | 'integer' | 'float' | 'boolean' | 'enum' | 'json' | 'array' | 'struct' | 'union' | 'optional';
}
export class StringType extends SchemaType {
    readonly type = 'string';
}
export class IntegerType extends SchemaType {
    readonly type = 'integer';
}
export class FloatType extends SchemaType {
    readonly type = 'float';
}
export class BooleanType extends SchemaType {
    readonly type = 'boolean';
}
export class JsonType extends SchemaType {
    readonly type = 'json';
}
export class EnumType extends SchemaType {
    readonly type = 'enum';
    readonly values: string[];
    constructor(values: string[]) {
        super();
        this.values = values;
    }
}
export class ArrayType extends SchemaType {
    readonly type = 'array';
    readonly inner: SchemaType;
    constructor(inner: SchemaType) {
        super();
        this.inner = inner;
    }
}
export class StructType extends SchemaType {
    readonly type = 'struct';
    readonly fields: { [key: string]: SchemaType };
    constructor(fields: { [key: string]: SchemaType }) {
        super();
        this.fields = fields;
    }
}
export class UnionType extends SchemaType {
    readonly type = 'union';
    readonly fields: { [key: string]: StructType };
    constructor(fields: { [key: string]: StructType }) {
        super();
        this.fields = fields;
    }
}
export class OptionalType extends SchemaType {
    readonly type = 'optional';
    readonly inner: SchemaType;
    constructor(inner: SchemaType) {
        super();
        this.inner = inner;
    }
}

export class PrimaryKey {
    readonly name: string;
    readonly type: SchemaType;

    constructor(name: string, type: SchemaType) {
        this.name = name;
        this.type = type;
    }
}

export class Field {
    readonly name: string;
    readonly type: SchemaType;

    isSecure: boolean = false;

    constructor(name: string, type: SchemaType) {
        this.name = name;
        this.type = type;
    }
}

export class DirectoryModel {
    readonly name: string;

    constructor(name: string) {
        this.name = name;
    }
}

export class SchemaModel {
    readonly _schema = true;
    readonly usedNames = new Set<string>();
    readonly atomics: AtomicModel[] = [];
    readonly entities: EntityModel[] = [];
    readonly directories: DirectoryModel[] = [];
    readonly events: EventModel[] = [];
    readonly eventStores: EventStoreModel[] = [];
}

export class AtomicModel {
    readonly name: string;
    readonly kind: 'integer' | 'boolean';
    readonly keys: PrimaryKey[] = [];

    constructor(name: string, kind: 'integer' | 'boolean') {
        this.name = name;
        this.kind = kind;
    }

    addKey(name: string, type: SchemaType) {
        let res = new PrimaryKey(name, type);
        this.keys.push(res);
        return res;
    }
}

type EntityIndexType = {
    type: 'unique'
    fields: string[]
} | {
    type: 'range'
    fields: string[]
};

export class EntityIndexModel {
    readonly name: string;
    readonly type: EntityIndexType;
    condition?: (src: any) => boolean;

    constructor(name: string, type: EntityIndexType) {
        this.name = name;
        this.type = type;
    }

    withCondition(handler: (src: any) => boolean) {
        this.condition = handler;
        return this;
    }
}

export class EntityModel {
    readonly name: string;
    readonly keys: PrimaryKey[] = [];
    readonly fields: Field[] = [];
    readonly indexes: EntityIndexModel[] = [];
    readonly isDeletable: boolean;

    constructor(name: string, isDeletable: boolean) {
        this.name = name;
        this.isDeletable = isDeletable;
    }

    addKey(name: string, type: SchemaType) {
        let res = new PrimaryKey(name, type);
        this.keys.push(res);
        return res;
    }
}

export class EventModel {
    readonly name: string;
    readonly fields: Field[] = [];
    constructor(name: string) {
        this.name = name;
    }
}

export class EventStoreModel {
    readonly name: string;
    readonly keys: PrimaryKey[] = [];
    constructor(name: string) {
        this.name = name;
    }

    addKey(name: string, type: SchemaType) {
        let res = new PrimaryKey(name, type);
        this.keys.push(res);
        return res;
    }
}