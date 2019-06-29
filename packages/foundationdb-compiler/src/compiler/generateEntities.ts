import { FieldType } from './../model';
import { StringBuilder } from './StringBuilder';
import { SchemaModel } from '../model';
import * as Case from 'change-case';

export function generateEntitiesHeader(schema: SchemaModel, builder: StringBuilder) {
    if (schema.entities.length > 0) {
        builder.append(`// @ts-ignore`);
        builder.append(`import { Entity, EntityFactory, EntityDescriptor, SecondaryIndexDescriptor, ShapeWithMetadata, PrimaryKeyDescriptor, FieldDescriptor } from '@openland/foundationdb-entity';`);
    }
}

function resolveType(type: FieldType, enumValues: string[]) {
    if (type === 'string') {
        return 'string';
    } else if (type === 'boolean') {
        return 'boolean';
    } else if (type === 'number') {
        return 'number';
    } else {
        throw Error('Unsupported primary key type: ' + type);
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
            builder.append(`${key.name}: ${resolveType(key.type, [])};`);
        }
        for (let field of entity.fields) {
            if (field.isNullable) {
                builder.append(`${field.name}: ${resolveType(field.type, field.enumValues)} | null;`);
            } else {
                builder.append(`${field.name}: ${resolveType(field.type, field.enumValues)};`);
            }
        }
        builder.removeIndent();
        builder.append(`}`);

        // Create Shape
        builder.append();
        builder.append(`export interface ${entityClass}CreateShape {`);
        builder.addIndent();
        for (let field of entity.fields) {
            if (field.isNullable) {
                builder.append(`${field.name}?: ${resolveType(field.type, field.enumValues)} | null | undefined;`);
            } else {
                builder.append(`${field.name}: ${resolveType(field.type, field.enumValues)};`);
            }
        }
        builder.removeIndent();
        builder.append(`}`);

        // Entity
        builder.append();
        builder.append(`export class ${entityClass} extends Entity<${entityClass}Shape> {`);
        builder.addIndent();
        for (let key of entity.keys) {
            let type: string = resolveType(key.type, []);
            builder.append(`get ${key.name}(): ${type} { return this._rawValue.${key.name}; }`);
        }
        for (let key of entity.fields) {
            let type: string = resolveType(key.type, []);

            // Getter
            if (key.isNullable) {
                builder.append(`get ${key.name}(): ${type} | null { return this._rawValue.${key.name}; }`);

            } else {
                builder.append(`get ${key.name}(): ${type} {  return this._rawValue.${key.name}; }`);

            }

            // Setter
            if (key.isNullable) {
                builder.append(`set ${key.name}(value: ${type} | null) {`);
            } else {
                builder.append(`set ${key.name}(value: ${type}) {`);
            }
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

        // Primary Keys
        builder.append(`let primaryKeys: PrimaryKeyDescriptor[] = [];`);
        for (let key of entity.keys) {
            if (key.type === 'string') {
                builder.append(`primaryKeys.push({ name: '${key.name}', type: 'string' });`);
            } else if (key.type === 'boolean') {
                builder.append(`primaryKeys.push({ name: '${key.name}', type: 'boolean' });`);
            } else if (key.type === 'number') {
                builder.append(`primaryKeys.push({ name: '${key.name}', type: 'integer' });`);
            } else {
                throw Error('Unsupported primary key type: ' + key.type);
            }
        }
        
        // Fields
        builder.append(`let fields: FieldDescriptor[] = [];`);
        for (let key of entity.fields) {
            if (key.type === 'string') {
                builder.append(`fields.push({ name: '${key.name}', type: 'string', nullable: ${key.isNullable}, secure: ${key.isSecure} });`);
            } else if (key.type === 'boolean') {
                builder.append(`fields.push({ name: '${key.name}', type: 'boolean', nullable: ${key.isNullable}, secure: ${key.isSecure} });`);
            } else if (key.type === 'number') {
                builder.append(`fields.push({ name: '${key.name}', type: 'integer', nullable: ${key.isNullable}, secure: ${key.isSecure} });`);
            } else {
                throw Error('Unsupported field type: ' + key.type);
            }
        }

        // Codec
        builder.append(`let codec = c.struct({`);
        builder.addIndent();
        for (let key of entity.keys) {
            if (key.type === 'string') {
                builder.append(`${key.name}: c.string,`);
            } else if (key.type === 'boolean') {
                builder.append(`${key.name}: c.boolean,`);
            } else if (key.type === 'number') {
                builder.append(`${key.name}: c.number,`);
            } else {
                throw Error('Unsupported primary key type: ' + key.type);
            }
        }
        for (let key of entity.fields) {
            if (key.type === 'string') {
                if (key.isNullable) {
                    builder.append(`${key.name}: c.optional(c.string),`);
                } else {
                    builder.append(`${key.name}: c.string,`);
                }
            } else if (key.type === 'boolean') {
                if (key.isNullable) {
                    builder.append(`${key.name}: c.optional(c.boolean),`);
                } else {
                    builder.append(`${key.name}: c.boolean,`);
                }
            } else if (key.type === 'number') {
                if (key.isNullable) {
                    builder.append(`${key.name}: c.optional(c.number),`);
                } else {
                    builder.append(`${key.name}: c.number,`);
                }
            } else {
                throw Error('Unsupported field type: ' + key.type);
            }
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
        // Operations
        //

        // create
        builder.append();
        builder.append(`create(ctx: Context, ${entity.keys.map((v) => v.name + ': ' + v.type).join(', ')}, src: ${entityClass}CreateShape): Promise<${entityClass}> {`);
        builder.addIndent();
        builder.append(`return this._create(ctx, [${entity.keys.map((v) => v.name).join(', ')}], this.descriptor.codec.normalize({${entity.keys.map((v) => v.name).join(', ')}, ...src }));`);
        builder.removeIndent();
        builder.append(`}`);

        // findById
        builder.append();
        builder.append(`findById(ctx: Context, ${entity.keys.map((v) => v.name + ': ' + v.type).join(', ')}): Promise<${entityClass} | null> {`);
        builder.addIndent();
        builder.append(`return this._findById(ctx, [${entity.keys.map((v) => v.name).join(', ')}]);`);
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