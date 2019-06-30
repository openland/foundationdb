export type PrimaryKeyType = 'string' | 'integer' | 'float' | 'boolean';
export type FieldType = 'string' | 'integer' | 'float' | 'boolean' | 'enum';

export abstract class SchemaType {
    abstract readonly type: 'string' | 'integer' | 'float' | 'boolean' | 'enum' | 'array' | 'struct';
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

    isNullable: boolean = false;
    isSecure: boolean = false;

    constructor(name: string, type: SchemaType) {
        this.name = name;
        this.type = type;
    }
}

export class SchemaModel {
    readonly _schema = true;
    readonly usedNames = new Set<string>();
    readonly atomics: AtomicModel[] = [];
    readonly entities: EntityModel[] = [];
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

export class EntityModel {
    readonly name: string;
    readonly keys: PrimaryKey[] = [];
    readonly fields: Field[] = [];

    constructor(name: string) {
        this.name = name;
    }

    addKey(name: string, type: SchemaType) {
        let res = new PrimaryKey(name, type);
        this.keys.push(res);
        return res;
    }
}