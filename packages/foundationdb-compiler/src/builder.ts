import { SchemaModel, AtomicModel, PrimaryKeyType, EntityModel } from './model';

let currentSchema: SchemaModel | null = null;
let currentAtomic: AtomicModel | null = null;
let currentEntity: EntityModel | null = null;

export function declareSchema(schema: () => void) {
    currentSchema = new SchemaModel();
    schema();
    let res = currentSchema!;
    currentSchema = null;
    return res;
}

export function atomicInt(name: string, schema: () => void) {
    if (currentAtomic || currentEntity) {
        throw Error('You can\'t nest declarations');
    }
    if (currentSchema!.usedNames.has(name)) {
        throw Error('Duplicate atomic with name ' + name);
    }
    currentAtomic = new AtomicModel(name, 'int');
    schema();
    currentSchema!.usedNames.add(name);
    currentSchema!.atomics.push(currentAtomic!!);
    currentAtomic = null;
}

export function atomicBool(name: string, schema: () => void) {
    if (currentAtomic || currentEntity) {
        throw Error('You can\'t nest declarations');
    }
    if (currentSchema!.usedNames.has(name)) {
        throw Error('Duplicate atomic with name ' + name);
    }
    currentAtomic = new AtomicModel(name, 'boolean');
    schema();
    currentSchema!.usedNames.add(name);
    currentSchema!.atomics.push(currentAtomic!!);
    currentAtomic = null;
}

export function entity(name: string, schema: () => void) {
    if (currentAtomic || currentEntity) {
        throw Error('You can\'t nest declarations');
    }
    if (currentSchema!.usedNames.has(name)) {
        throw Error('Duplicate entity with name ' + name);
    }
    currentEntity = new EntityModel(name);
    schema();
    currentSchema!.usedNames.add(name);
    currentSchema!.entities.push(currentEntity!!);
    currentEntity = null;
}

export function primaryKey(name: string, type: PrimaryKeyType) {
    if (!currentAtomic && !currentEntity) {
        throw Error('No entity specified');
    }
    if (currentAtomic) {
        currentAtomic!.addKey(name, type);
    }
    if (currentEntity) {
        currentEntity!.addKey(name, type);
    }
}