import { SchemaModel, AtomicModel, PrimaryKeyType } from './model';

let currentSchema: SchemaModel | null = null;
let currentAtomic: AtomicModel | null = null;

export function declareSchema(schema: () => void) {
    currentSchema = new SchemaModel();
    schema();
    let res = currentSchema!;
    currentSchema = null;
    return res;
}

export function atomicInt(name: string, schema: () => void) {
    if (currentAtomic != null) {
        throw Error('You can\'t nest declarations');
    }
    currentAtomic = new AtomicModel(name, 'int');
    if (currentSchema!.usedNames.has(name)) {
        throw Error('Duplicate atomic with name ' + name);
    }
    schema();
    currentSchema!.atomics.push(currentAtomic!!);
    currentAtomic = null;
}

export function atomicBool(name: string, schema: () => void) {
    if (currentAtomic != null) {
        throw Error('You can\'t nest declarations');
    }
    currentAtomic = new AtomicModel(name, 'boolean');
    if (currentSchema!.usedNames.has(name)) {
        throw Error('Duplicate atomic with name ' + name);
    }
    schema();
    currentSchema!.atomics.push(currentAtomic!!);
    currentAtomic = null;
}

export function primaryKey(name: string, type: PrimaryKeyType) {
    if (currentAtomic == null) {
        throw Error('No entity specified');
    }
    currentAtomic!.addKey(name, type);
}