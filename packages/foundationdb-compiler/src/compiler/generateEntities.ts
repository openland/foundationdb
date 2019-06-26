import { FieldType } from './../model';
import { StringBuilder } from './StringBuilder';
import { SchemaModel } from '../model';
import * as Case from 'change-case';

export function generateEntitiesHeader(schema: SchemaModel, builder: StringBuilder) {
    if (schema.entities.length > 0) {
        builder.append(`// @ts-ignore`);
        builder.append(`import { Entity, EntityFactory, EntityDescriptor, SecondaryIndexDescriptor } from '@openland/foundationdb-entity';`);
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
            if (key.isNullable) {
                builder.append(`get ${key.name}(): ${type} | null {  if (this._rawValue.${key.name} !== undefined && this._rawValue.${key.name} !== null) { return this._rawValue.${key.name}; } else { return null; } }`);
            } else {
                builder.append(`get ${key.name}(): ${type} {  return this._rawValue.${key.name}; }`);
            }
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

        // ts-io type
        builder.append(`let type = t.type({`);
        builder.addIndent();
        for (let key of entity.keys) {
            if (key.type === 'string') {
                builder.append(`${key.name}: t.string,`);
            } else if (key.type === 'boolean') {
                builder.append(`${key.name}: t.boolean,`);
            } else if (key.type === 'number') {
                builder.append(`${key.name}: t.number,`);
            } else {
                throw Error('Unsupported primary key type: ' + key.type);
            }
        }
        builder.removeIndent();
        builder.append(`});`);
        builder.append(`let validator = function (src: any) {`);
        builder.addIndent();
        builder.append(`type.decode(src);`);
        builder.removeIndent();
        builder.append(`};`);

        // Descriptor
        builder.append(`let descriptor: EntityDescriptor = {`);
        builder.addIndent();
        builder.append(`name: '${entity.name}',`);
        builder.append(`storageKey: '${entityKey}',`);
        builder.append(`subspace, validator, secondaryIndexes, storage`);
        builder.removeIndent();
        builder.append(`};`);
        builder.append(`return new ${entityClass}Factory(descriptor);`);
        builder.removeIndent();
        builder.append(`}`);
        builder.append();
        builder.append(`private constructor(descriptor: EntityDescriptor) {`);
        builder.addIndent();
        builder.append('super(descriptor);');
        builder.removeIndent();
        builder.append(`}`);

        //
        // Operations
        //

        // create
        builder.append();
        builder.append(`create(ctx: Context, src: ${entityClass}Shape): Promise<${entityClass}> {`);
        builder.addIndent();
        builder.append(`return this._create(ctx, [${entity.keys.map((v) => 'src.' + v.name).join(', ')}], src);`);
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
        builder.append(`protected _createEntityInstance(value: any): ${entityClass} {`);
        builder.addIndent();
        builder.append(`return new ${entityClass}([${entity.keys.map((v) => 'value.' + v.name).join(', ')}], value, this.descriptor);`);
        builder.removeIndent();
        builder.append(`}`);

        builder.removeIndent();
        builder.append(`}`);
    }
}