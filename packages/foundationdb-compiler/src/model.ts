export type PrimaryKeyType = 'string' | 'integer' | 'float' | 'boolean';
export type FieldType = 'string' | 'integer' | 'float' | 'boolean' | 'enum';

export class PrimaryKey {
    readonly name: string;
    readonly type: PrimaryKeyType;

    constructor(name: string, type: PrimaryKeyType) {
        this.name = name;
        this.type = type;
    }
}

export class Field {
    readonly name: string;
    readonly type: FieldType;
    readonly enumValues: string[];

    isNullable: boolean = false;
    isSecure: boolean = false;

    constructor(name: string, type: FieldType, enumValues: string[]) {
        this.name = name;
        this.type = type;
        this.enumValues = enumValues;
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

    addKey(name: string, type: PrimaryKeyType) {
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

    addKey(name: string, type: PrimaryKeyType) {
        let res = new PrimaryKey(name, type);
        this.keys.push(res);
        return res;
    }
}