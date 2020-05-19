import {
    SchemaModel, AtomicModel, EntityModel, Field, StringType, IntegerType, FloatType, BooleanType, SchemaType,
    EnumType, ArrayType, StructType, UnionType, OptionalType, EntityIndexModel, JsonType, DirectoryModel,
    EventModel, EventStoreModel
} from './model';

const reservedFieldNames = [
    'do', 'if', 'in', 'for', 'let', 'new', 'try', 'var', 'else',
    'enum', 'eval', 'null', 'this', 'true', 'void', 'with', 'break', 'catch',
    'class', 'const', 'false', 'super', 'throw', 'while', 'yield', 'delete',
    'export', 'import', 'return', 'static', 'switch', 'typeof', 'extends', 'finally',
    'continue', 'debugger', 'function', 'interface', 'protected',
    'implements', 'instanceof', 'NaN', 'Infinity', 'undefined', 'async',

    'createdAt', 'updatedAt', 'deletedAt', 'flush', 'invalidate'
];

const fieldRegex = RegExp('/^[a-z][a-zA-Z0-9]*$/').compile();
const entityRegex = RegExp('/^[A-Z][a-zA-Z0-9]*$/').compile();

const reservedEntityNames = [
    'Entity', 'Tuple', 'EntityFactory', 'Store', 'Context', 'Subspace', 'EntityStorage',
    'BaseStore', 'EntityDescriptor', 'SecondaryIndexDescriptor', 'ShapeWithMetadata'
];

function checkValidEntityName(name: string) {
    if (name.length === 0) {
        throw Error('Entity name can\'t be empty');
    }
    if (reservedEntityNames.indexOf(name) >= 0) {
        throw Error('Entity name ' + name + ' is reserved');
    }
    if (!entityRegex.test(name)) {
        throw Error('Entity name ' + name + ' is invalid');
    }
}

function checkValidFieldName(name: string) {
    if (name.length === 0) {
        throw Error('Field name can\'t be empty');
    }
    if (name.startsWith('_')) {
        throw Error('Field name ' + name + ' can\'t start with underscore');
    }
    if (reservedFieldNames.indexOf(name) >= 0) {
        throw Error('Entity name ' + name + ' is reserved');
    }
    if (!fieldRegex.test(name)) {
        throw Error('Entity name ' + name + ' is invalid');
    }
}

let currentSchema: SchemaModel | null = null;
let currentAtomic: AtomicModel | null = null;
let currentEntity: EntityModel | null = null;
let currentEvent: EventModel | null = null;
let currentEventStore: EventStoreModel | null = null;

export function declareSchema(schema: () => void) {
    currentSchema = new SchemaModel();
    schema();
    let res = currentSchema!;
    currentSchema = null;
    return res;
}

export function atomicInt(name: string, schema: () => void) {
    checkValidEntityName(name);
    if (currentAtomic || currentEntity || currentEventStore || currentEvent) {
        throw Error('You can\'t nest declarations');
    }
    if (currentSchema!.usedNames.has(name)) {
        throw Error('Duplicate atomic with name ' + name);
    }
    currentAtomic = new AtomicModel(name, 'integer');
    schema();
    currentSchema!.usedNames.add(name);
    currentSchema!.atomics.push(currentAtomic!!);
    currentAtomic = null;
}

export function atomicBool(name: string, schema: () => void) {
    checkValidEntityName(name);
    if (currentAtomic || currentEntity || currentEventStore || currentEvent) {
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
    checkValidEntityName(name);
    if (currentAtomic || currentEntity || currentEventStore || currentEvent) {
        throw Error('You can\'t nest declarations');
    }
    if (currentSchema!.usedNames.has(name)) {
        throw Error('Duplicate entity with name ' + name);
    }
    currentEntity = new EntityModel(name, false);
    schema();
    currentSchema!.usedNames.add(name);
    currentSchema!.entities.push(currentEntity!!);
    currentEntity = null;
}

export function deletableEntity(name: string, schema: () => void) {
    checkValidEntityName(name);
    if (currentAtomic || currentEntity || currentEventStore || currentEvent) {
        throw Error('You can\'t nest declarations');
    }
    if (currentSchema!.usedNames.has(name)) {
        throw Error('Duplicate entity with name ' + name);
    }
    currentEntity = new EntityModel(name, true);
    schema();
    currentSchema!.usedNames.add(name);
    currentSchema!.entities.push(currentEntity!!);
    currentEntity = null;
}

export function event(name: string, schema: () => void) {
    checkValidEntityName(name);
    if (currentAtomic || currentEntity || currentEventStore || currentEvent) {
        throw Error('You can\'t nest declarations');
    }
    if (currentSchema!.usedNames.has(name)) {
        throw Error('Duplicate entity with name ' + name);
    }
    currentEvent = new EventModel(name);
    schema();
    currentSchema!.usedNames.add(name);
    currentSchema!.events.push(currentEvent!);
    currentEvent = null;
}

export function eventStore(name: string, schema: () => void) {
    checkValidEntityName(name);
    if (currentAtomic || currentEntity || currentEventStore || currentEvent) {
        throw Error('You can\'t nest declarations');
    }
    if (currentSchema!.usedNames.has(name)) {
        throw Error('Duplicate entity with name ' + name);
    }
    currentEventStore = new EventStoreModel(name);
    schema();
    currentSchema!.usedNames.add(name);
    currentSchema!.eventStores.push(currentEventStore!);
    currentEventStore = null;
}

export function primaryKey(name: string, type: SchemaType) {
    checkValidFieldName(name);
    if (!currentAtomic && !currentEntity && !currentEventStore) {
        throw Error('No entity, atomic or event store is specified');
    }
    if (currentEventStore) {
        currentEventStore!.addKey(name, type);
    }
    if (currentAtomic) {
        currentAtomic!.addKey(name, type);
    }
    if (currentEntity) {
        currentEntity!.addKey(name, type);
    }
}

class FieldBuilder {
    readonly res: Field;
    constructor(res: Field) {
        this.res = res;
    }
    secure = () => {
        this.res.isSecure = true;
        return this;
    }
}

export function string() {
    return new StringType();
}

export function integer() {
    return new IntegerType();
}

export function float() {
    return new FloatType();
}

export function boolean() {
    return new BooleanType();
}

export function json() {
    return new JsonType();
}

export function enumString(...args: string[]) {
    return new EnumType(args);
}

export function array(src: SchemaType) {
    return new ArrayType(src);
}

export function struct(feilds: { [key: string]: SchemaType }) {
    return new StructType(feilds);
}

export function union(fields: { [key: string]: StructType }) {
    return new UnionType(fields);
}

export function optional(src: SchemaType) {
    return new OptionalType(src);
}

export function field(name: string, type: SchemaType) {
    checkValidFieldName(name);
    if (!currentEntity && !currentEvent) {
        throw Error('No entity or event specified');
    }
    let res = new Field(name, type);
    if (currentEntity) {
        currentEntity!.fields.push(res);
    } else {
        currentEvent!.fields.push(res);
    }

    return new FieldBuilder(res);
}

export function uniqueIndex(name: string, fields: string[]) {
    checkValidFieldName(name);
    if (!currentEntity) {
        throw Error('No entity specified');
    }
    let res = new EntityIndexModel(name, { type: 'unique', fields: fields });
    currentEntity!.indexes.push(res);
    return res;
}

export function rangeIndex(name: string, fields: string[]) {
    checkValidFieldName(name);
    if (!currentEntity) {
        throw Error('No entity specified');
    }
    let res = new EntityIndexModel(name, { type: 'range', fields: fields });
    currentEntity!.indexes.push(res);
    return res;
}

export function customDirectory(name: string) {
    checkValidEntityName(name);
    if (currentAtomic || currentEntity) {
        throw Error('You can\'t nest declarations');
    }
    if (currentSchema!.usedNames.has(name)) {
        throw Error('Duplicate entity with name ' + name);
    }
    currentSchema!.usedNames.add(name);
    currentSchema!.directories.push(new DirectoryModel(name));
}