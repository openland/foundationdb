import { SchemaType, EnumType, ArrayType, StructType, UnionType, OptionalType } from './../model';
import { StringBuilder } from './StringBuilder';
import { SchemaModel } from '../model';
import * as Case from 'change-case';

export function generateEntitiesHeader(schema: SchemaModel, builder: StringBuilder) {
    if (schema.entities.length > 0) {
        builder.append(`// @ts-ignore`);
        builder.append(`import { Entity, EntityFactory, EntityDescriptor, SecondaryIndexDescriptor, ShapeWithMetadata, PrimaryKeyDescriptor, FieldDescriptor } from '@openland/foundationdb-entity';`);
    }
}

function resolveType(type: SchemaType): string {
    if (type.type === 'string') {
        return 'string';
    } else if (type.type === 'boolean') {
        return 'boolean';
    } else if (type.type === 'integer') {
        return 'number';
    } else if (type.type === 'float') {
        return 'number';
    } else if (type.type === 'enum') {
        return (type as EnumType).values.map((v) => `'${v}'`).join(' | ');
    } else if (type.type === 'array') {
        return '(' + resolveType((type as ArrayType).inner) + ')[]';
    } else if (type.type === 'struct') {
        let fields = (type as StructType).fields;
        let keys = Object.keys(fields).map((v) => v + ': ' + resolveType(fields[v]));
        return `{ ${keys.join(', ')} }`;
    } else if (type.type === 'union') {
        let fields = (type as UnionType).fields;
        let kinds: string[] = [];
        for (let k of Object.keys(fields)) {
            let fields2 = (fields[k] as StructType).fields;
            let keys = Object.keys(fields2).map((v) => v + ': ' + resolveType(fields2[v]));
            kinds.push(`{ type: '${k}', ${keys.join(', ')} }`);
        }
        return kinds.join(' | ');
    } else if (type.type === 'optional') {
        return resolveType((type as OptionalType).inner) + ' | null';
    } else {
        throw Error('Unsupported type: ' + JSON.stringify(type));
    }
}

function resolveDescriptorType(type: SchemaType): string {
    if (type.type === 'string') {
        return `{ type: 'string' }`;
    } else if (type.type === 'boolean') {
        return `{ type: 'boolean' }`;
    } else if (type.type === 'integer') {
        return `{ type: 'integer' }`;
    } else if (type.type === 'float') {
        return `{ type: 'float' }`;
    } else if (type.type === 'enum') {
        return `{ type: 'enum', values: [${(type as EnumType).values.map((v) => `'${v}'`).join(', ')}] }`;
    } else if (type.type === 'array') {
        return `{ type: 'array', inner: ${resolveDescriptorType((type as ArrayType).inner)} }`;
    } else if (type.type === 'struct') {
        let fields = (type as StructType).fields;
        let keys = Object.keys(fields).map((v) => v + ': ' + resolveDescriptorType(fields[v]));
        return `{ type: 'struct', fields: { ${keys.join(', ')} } }`;
    } else if (type.type === 'union') {
        let fields = (type as UnionType).fields;
        let kinds: string[] = [];
        for (let k of Object.keys(fields)) {
            let fields2 = (fields[k] as StructType).fields;
            let keys = Object.keys(fields2).map((v) => v + ': ' + resolveDescriptorType(fields2[v]));
            kinds.push(`${k}: { ${keys.join(', ')} }`);
        }
        return `{ type: 'union', types: { ${kinds.join(', ')} } }`;
    } else if (type.type === 'optional') {
        return `{ type: 'optional', inner: ${resolveDescriptorType((type as OptionalType).inner)} }`;
    } else {
        throw Error('Unsupported type: ' + JSON.stringify(type));
    }
}

function resolveCodec(type: SchemaType): string {
    if (type.type === 'string') {
        return 'c.string';
    } else if (type.type === 'boolean') {
        return 'c.boolean';
    } else if (type.type === 'integer') {
        return 'c.integer';
    } else if (type.type === 'float') {
        return 'c.float';
    } else if (type.type === 'enum') {
        return `c.enum(${(type as EnumType).values.map((v) => `'${v}'`).join(', ')})`;
    } else if (type.type === 'array') {
        return `c.array(${resolveCodec((type as ArrayType).inner)})`;
    } else if (type.type === 'struct') {
        let fields = (type as StructType).fields;
        let keys = Object.keys(fields).map((v) => v + ': ' + resolveCodec(fields[v]));
        return `c.struct({ ${keys.join(', ')} })`;
    } else if (type.type === 'union') {
        let fields = (type as UnionType).fields;
        let keys = Object.keys(fields).map((v) => v + ': ' + resolveCodec(fields[v]));
        return `c.union({ ${keys.join(', ')} })`;
    } else if (type.type === 'optional') {
        return `c.optional(${resolveCodec((type as OptionalType).inner)})`;
    } else {
        throw Error('Unsupported field type: ' + type.type);
    }
}

export function generateEntities(schema: SchemaModel, builder: StringBuilder) {
    for (let entity of schema.entities) {
        let entityKey = Case.camelCase(entity.name);
        let entityClass = Case.pascalCase(entity.name);

        // Shape
        builder.append();
        builder.append(`export interface ${entityClass}Shape {`);
        builder.addIndent();
        for (let key of entity.keys) {
            if (key.type.type !== 'string' && key.type.type !== 'integer' && key.type.type !== 'boolean' && key.type.type !== 'float') {
                throw Error('Unsupported primary key type: ' + key.type.type);
            }
            builder.append(`${key.name}: ${resolveType(key.type)};`);
        }
        for (let field of entity.fields) {
            builder.append(`${field.name}: ${resolveType(field.type)};`);
        }
        builder.removeIndent();
        builder.append(`}`);

        // Create Shape
        builder.append();
        builder.append(`export interface ${entityClass}CreateShape {`);
        builder.addIndent();
        for (let field of entity.fields) {
            builder.append(`${field.name}: ${resolveType(field.type)};`);
        }
        builder.removeIndent();
        builder.append(`}`);

        // Entity
        builder.append();
        builder.append(`export class ${entityClass} extends Entity<${entityClass}Shape> {`);
        builder.addIndent();
        for (let key of entity.keys) {
            let type: string = resolveType(key.type);
            builder.append(`get ${key.name}(): ${type} { return this._rawValue.${key.name}; }`);
        }
        for (let key of entity.fields) {
            let type: string = resolveType(key.type);

            // Getter
            builder.append(`get ${key.name}(): ${type} { return this._rawValue.${key.name}; }`);

            // Setter
            builder.append(`set ${key.name}(value: ${type}) {`);
            builder.addIndent();
            builder.append(`let normalized = this.descriptor.codec.fields.${key.name}.normalize(value);`);
            builder.append(`if (this._rawValue.${key.name} !== normalized) {`);
            builder.addIndent();
            builder.append(`this._rawValue.${key.name} = normalized;`);
            builder.append(`this._updatedValues.${key.name} = normalized;`);
            builder.append(`this.invalidate();`);
            builder.removeIndent();
            builder.append(`}`);
            builder.removeIndent();
            builder.append(`}`);
        }
        builder.removeIndent();
        builder.append(`}`);

        // Factory
        builder.append();
        builder.append(`export class ${entityClass}Factory extends EntityFactory<${entityClass}Shape, ${entityClass}> {`);
        builder.addIndent();

        //
        // Constructor
        //

        builder.append();
        builder.append(`static async open(storage: EntityStorage) {`);
        builder.addIndent();

        // Root Directory
        builder.append(`let subspace = await storage.resolveEntityDirectory('${entityKey}');`);

        // Indexes
        builder.append(`let secondaryIndexes: SecondaryIndexDescriptor[] = [];`);
        for (let index of entity.indexes) {
            let type: string;
            if (index.type.type === 'unique' || index.type.type === 'range') {
                let fields: string[] = [];
                for (let f of index.type.fields) {
                    let tp: string;
                    let ef = entity.fields.find((v) => v.name === f);
                    let stp: SchemaType;
                    if (!ef) {
                        let kf = entity.keys.find((v) => v.name === f);
                        if (kf) {
                            stp = kf.type;
                        } else {
                            throw Error('Unable to find field ' + f);
                        }
                    } else {
                        stp = ef.type;
                    }
                    if (stp.type === 'string') {
                        tp = 'string';
                    } else if (stp.type === 'integer') {
                        tp = 'integer';
                    } else if (stp.type === 'float') {
                        tp = 'float';
                    } else if (stp.type === 'boolean') {
                        tp = 'boolean';
                    } else {
                        throw Error('Unsupported field type for index: ' + stp.type);
                    }
                    fields.push(`{ name: '${f}', type: '${tp}' }`);
                }
                if (index.type.type === 'unique') {
                    type = `{ type: 'unique', fields: [${fields.join(', ')}] }`;
                } else {
                    type = `{ type: 'range', fields: [${fields.join(', ')}] }`;
                }
            } else {
                throw Error('Unknown index type');
            }
            builder.append(`secondaryIndexes.push({ name: '${index.name}', storageKey: '${index.name}', type: ${type}, subspace: await storage.resolveEntityIndexDirectory('${entityKey}', '${index.name}') });`);
        }

        // Primary Keys
        builder.append(`let primaryKeys: PrimaryKeyDescriptor[] = [];`);
        for (let key of entity.keys) {
            if (key.type.type === 'string') {
                builder.append(`primaryKeys.push({ name: '${key.name}', type: 'string' });`);
            } else if (key.type.type === 'boolean') {
                builder.append(`primaryKeys.push({ name: '${key.name}', type: 'boolean' });`);
            } else if (key.type.type === 'integer') {
                builder.append(`primaryKeys.push({ name: '${key.name}', type: 'integer' });`);
            } else if (key.type.type === 'float') {
                builder.append(`primaryKeys.push({ name: '${key.name}', type: 'float' });`);
            } else {
                throw Error('Unsupported primary key type: ' + key.type);
            }
        }

        // Fields
        builder.append(`let fields: FieldDescriptor[] = [];`);
        for (let key of entity.fields) {
            builder.append(`fields.push({ name: '${key.name}', type: ${resolveDescriptorType(key.type)}, secure: ${key.isSecure} });`);
        }

        // Codec
        builder.append(`let codec = c.struct({`);
        builder.addIndent();
        for (let key of entity.keys) {
            if (key.type.type === 'string') {
                builder.append(`${key.name}: c.string,`);
            } else if (key.type.type === 'boolean') {
                builder.append(`${key.name}: c.boolean,`);
            } else if (key.type.type === 'integer') {
                builder.append(`${key.name}: c.integer,`);
            } else if (key.type.type === 'float') {
                builder.append(`${key.name}: c.float,`);
            } else {
                throw Error('Unsupported primary key type: ' + key.type);
            }
        }
        for (let key of entity.fields) {
            builder.append(`${key.name}: ${resolveCodec(key.type)},`);
        }
        builder.removeIndent();
        builder.append(`});`);

        // Descriptor
        builder.append(`let descriptor: EntityDescriptor<${entityClass}Shape> = {`);
        builder.addIndent();
        builder.append(`name: '${entity.name}',`);
        builder.append(`storageKey: '${entityKey}',`);
        builder.append(`subspace, codec, secondaryIndexes, storage, primaryKeys, fields`);
        builder.removeIndent();
        builder.append(`};`);
        builder.append(`return new ${entityClass}Factory(descriptor);`);
        builder.removeIndent();
        builder.append(`}`);
        builder.append();
        builder.append(`private constructor(descriptor: EntityDescriptor<${entityClass}Shape>) {`);
        builder.addIndent();
        builder.append('super(descriptor);');
        builder.removeIndent();
        builder.append(`}`);

        //
        // Indexes
        //

        let indexIndex = 0;
        for (let index of entity.indexes) {
            if (index.type.type === 'unique') {
                builder.append();
                builder.append(`readonly ${index.name}Index = Object.freeze({`);
                builder.addIndent();
                let fields: string[] = [];
                let fieldNames: string[] = [];
                for (let f of index.type.fields) {
                    let ef = entity.fields.find((v) => v.name === f);
                    let stp: SchemaType;
                    if (!ef) {
                        let kf = entity.keys.find((v) => v.name === f);
                        if (kf) {
                            stp = kf.type;
                        } else {
                            throw Error('Unable to find field ' + f);
                        }
                    } else {
                        stp = ef.type;
                    }
                    fieldNames.push(f);
                    if (stp.type === 'string') {
                        fields.push(`${f}: string`);
                    } else if (stp.type === 'integer') {
                        fields.push(`${f}: number`);
                    } else if (stp.type === 'float') {
                        fields.push(`${f}: number`);
                    } else if (stp.type === 'boolean') {
                        fields.push(`${f}: boolean`);
                    } else {
                        throw Error('Unsupported index key type: ' + stp.type);
                    }
                }
                builder.append(`find: async (ctx: Context, ${fields.join(', ')}) => {`);
                builder.addIndent();
                builder.append(`return this._findFromUniqueIndex(ctx, [${fieldNames.join(', ')}], this.descriptor.secondaryIndexes[${indexIndex}]);`);
                builder.removeIndent();
                builder.append(`}`);
                builder.removeIndent();
                builder.append(`});`);
            } else if (index.type.type === 'range') {
                let fields: string[] = [];
                let fieldNames: string[] = [];
                let fieldTypes: string[] = [];
                for (let f of index.type.fields) {
                    let ef = entity.fields.find((v) => v.name === f);
                    let stp: SchemaType;
                    if (!ef) {
                        let kf = entity.keys.find((v) => v.name === f);
                        if (kf) {
                            stp = kf.type;
                        } else {
                            throw Error('Unable to find field ' + f);
                        }
                    } else {
                        stp = ef.type;
                    }
                    fieldNames.push(f);
                    if (stp.type === 'string') {
                        fields.push(`${f}: string`);
                        fieldTypes.push('string');
                    } else if (stp.type === 'integer') {
                        fields.push(`${f}: number`);
                        fieldTypes.push('number');
                    } else if (stp.type === 'float') {
                        fields.push(`${f}: number`);
                        fieldTypes.push('number');
                    } else if (stp.type === 'boolean') {
                        fields.push(`${f}: boolean`);
                        fieldTypes.push('boolean');
                    } else {
                        throw Error('Unsupported index key type: ' + stp.type);
                    }
                }

                let tFields = [...fields];
                tFields.splice(tFields.length - 1, 1);
                let tFieldNames = [...fieldNames];
                tFieldNames.splice(tFieldNames.length - 1, 1);

                builder.append();
                builder.append(`readonly ${index.name}Index = Object.freeze({`);
                builder.addIndent();
                builder.append(`findAll: (ctx: Context, ${tFields.join(', ')}) => {`);
                builder.addIndent();
                builder.append(`return this._findRangeFromIndex(this.descriptor.secondaryIndexes[${indexIndex}], [${tFieldNames.join(', ')}]).asArray(ctx);`);
                builder.removeIndent();
                builder.append(`},`);

                builder.append(`query: (${tFields.join(', ')}, opts?: RangeOptions<${fieldTypes[fieldTypes.length - 1]}>) => {`);
                builder.addIndent();
                builder.append(`return this._findRangeFromIndex(this.descriptor.secondaryIndexes[${indexIndex}], [${tFieldNames.join(', ')}], { limit: opts && opts.limit, reverse: opts && opts.reverse, after: opts && opts.after ? [opts.after] : undefined});`);
                builder.removeIndent();
                builder.append(`}`);

                builder.removeIndent();
                builder.append(`});`);
            } else {
                throw Error('Unknown index type');
            }
            indexIndex++;
        }

        //
        // Operations
        //

        // create
        builder.append();
        builder.append(`create(ctx: Context, ${entity.keys.map((v) => v.name + ': ' + resolveType(v.type)).join(', ')}, src: ${entityClass}CreateShape): Promise<${entityClass}> {`);
        builder.addIndent();
        builder.append(`return this._create(ctx, [${entity.keys.map((v) => v.name).join(', ')}], this.descriptor.codec.normalize({ ${entity.keys.map((v) => v.name).join(', ')}, ...src }));`);
        builder.removeIndent();
        builder.append(`}`);

        // findById
        builder.append();
        builder.append(`findById(ctx: Context, ${entity.keys.map((v) => v.name + ': ' + resolveType(v.type)).join(', ')}): Promise<${entityClass} | null> {`);
        builder.addIndent();
        builder.append(`return this._findById(ctx, [${entity.keys.map((v) => v.name).join(', ')}]);`);
        builder.removeIndent();
        builder.append(`}`);

        // watch
        builder.append();
        builder.append(`watch(ctx: Context, ${entity.keys.map((v) => v.name + ': ' + resolveType(v.type)).join(', ')}): Watch {`);
        builder.addIndent();
        builder.append(`return this._watch(ctx, [${entity.keys.map((v) => v.name).join(', ')}]);`);
        builder.removeIndent();
        builder.append(`}`);

        // Create Instance
        builder.append();
        builder.append(`protected _createEntityInstance(ctx: Context, value: ShapeWithMetadata<${entityClass}Shape>): ${entityClass} {`);
        builder.addIndent();
        builder.append(`return new ${entityClass}([${entity.keys.map((v) => 'value.' + v.name).join(', ')}], value, this.descriptor, this._flush, ctx);`);
        builder.removeIndent();
        builder.append(`}`);

        builder.removeIndent();
        builder.append(`}`);
    }
}