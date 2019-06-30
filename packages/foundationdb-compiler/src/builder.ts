import { SchemaModel, AtomicModel, EntityModel, Field, StringType, IntegerType, FloatType, BooleanType, SchemaType, EnumType, ArrayType, StructType, UnionType, OptionalType, EntityIndexModel } from './model';

const reservedFieldNames = [
    'do', 'if', 'in', 'for', 'let', 'new', 'try', 'var', 'case', 'else',
    'enum', 'eval', 'null', 'this', 'true', 'void', 'with', 'break', 'catch',
    'class', 'const', 'false', 'super', 'throw', 'while', 'yield', 'delete',
    'export', 'import', 'public', 'return', 'static', 'switch', 'typeof',
    'default', 'extends', 'finally', 'package', 'private', 'continue',
    'debugger', 'function', 'arguments', 'interface', 'protected',
    'implements', 'instanceof', 'NaN', 'Infinity', 'undefined', 'async',

    'createdAt', 'updatedAt', 'deletedAt'
];

const fieldRegex = RegExp('/^[a-z][a-zA-Z0-9]*$/').compile();
const entityRegex = RegExp('/^[A-Z][a-zA-Z0-9]*$/').compile();

const reservedEntityNames = [
    'Entity', 'Tuple', 'EntityFactory', 'Store', 'Context', 'Subspace', 'EntityStorage',
    'BaseStore', 'EntityDescriptor', 'SecondaryIndexDescriptor', 'ShapeWithMetadata'
];

function checkValidEntityName(name: string) {
    if (name.length === 0) {
        throw Error('Field name can\'t be empty');
    }
    if (reservedEntityNames.indexOf(name) >= 0) {
        throw Error('Field name is invalid');
    }
    if (!entityRegex.test(name)) {
        throw Error('Field name is invalid');
    }
}

function checkValidFieldName(name: string) {
    if (name.length === 0) {
        throw Error('Field name can\'t be empty');
    }
    if (name.startsWith('_')) {
        throw Error('Field can\'t start with underscore');
    }
    if (reservedFieldNames.indexOf(name) >= 0) {
        throw Error('Field name is invalid');
    }
    if (!fieldRegex.test(name)) {
        throw Error('Field name is invalid');
    }
}

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
    checkValidEntityName(name);
    if (currentAtomic || currentEntity) {
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
    checkValidEntityName(name);
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

export function primaryKey(name: string, type: SchemaType) {
    checkValidFieldName(name);
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
    if (!currentEntity) {
        throw Error('No entity specified');
    }
    let res = new Field(name, type);
    currentEntity!.fields.push(res);

    return new FieldBuilder(res);
}

export function uniqueIndex(name: string, fields: string[]) {
    checkValidFieldName(name);
    if (!currentEntity) {
        throw Error('No entity specified');
    }
    currentEntity!.indexes.push(new EntityIndexModel(name, { type: 'unique', fields: fields }));
}