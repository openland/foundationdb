export type PrimaryKeyType = 'string' | 'number' | 'boolean';

export class PrimaryKey {
    readonly name: string;
    readonly type: PrimaryKeyType;

    constructor(name: string, type: PrimaryKeyType) {
        this.name = name;
        this.type = type;
    }
}

export class SchemaModel {
    readonly _schema = true;
    readonly usedNames = new Set<string>();
    readonly atomics: AtomicModel[] = [];
}

export class AtomicModel {
    readonly name: string;
    readonly kind: 'int' | 'boolean';
    readonly keys: PrimaryKey[] = [];

    constructor(name: string, kind: 'int' | 'boolean') {
        this.name = name;
        this.kind = kind;
    }

    addKey(name: string, type: PrimaryKeyType) {
        let res = new PrimaryKey(name, type);
        this.keys.push(res);
        return res;
    }
}