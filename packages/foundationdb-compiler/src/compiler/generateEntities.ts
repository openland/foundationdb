import { StringBuilder } from './StringBuilder';
import { SchemaModel } from '../model';
import * as Case from 'change-case';

export function generateEntitiesHeader(schema: SchemaModel, builder: StringBuilder) {
    if (schema.entities.length > 0) {
        builder.append(`// @ts-ignore`);
        builder.append(`import { Entity, EntityFactory, EntityDescriptor } from '@openland/foundationdb-entity';`);
    }
}

export function generateEntities(schema: SchemaModel, builder: StringBuilder) {
    for (let entity of schema.entities) {
        let entityKey = Case.camelCase(entity.name);
        let entityClass = Case.pascalCase(entity.name);

        // Entity
        builder.append();
        builder.append(`export class ${entityClass} extends Entity {`);
        builder.addIndent();

        builder.removeIndent();
        builder.append(`}`);

        // Factory
        builder.append();
        builder.append(`export class ${entityClass}Factory extends EntityFactory<${entityClass}> {`);
        builder.addIndent();

        builder.append(`protected _createEntityInstance(value: any): ${entityClass} {`);
        builder.addIndent();
        builder.append(`return new ${entityClass}([${entity.keys.map((v) => 'value.' + v.name).join(', ')}], value);`);
        builder.removeIndent();
        builder.append(`}`);

        builder.removeIndent();
        builder.append(`}`);
    }
}