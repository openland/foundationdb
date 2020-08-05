import { StringBuilder } from './StringBuilder';
import { SchemaModel } from './../model';
import * as Case from 'change-case';

export function generateStore(schema: SchemaModel, builder: StringBuilder) {
    builder.append();
    builder.append(`export interface Store extends BaseStore {`);
    builder.addIndent();
    for (let atomic of schema.atomics) {
        builder.append(`readonly ${atomic.name}: ${atomic.name}Factory;`);
    }
    for (let entity of schema.entities) {
        builder.append(`readonly ${entity.name}: ${entity.name}Factory;`);
    }
    for (let entity of schema.eventStores) {
        builder.append(`readonly ${entity.name}: ${entity.name};`);
    }
    for (let directory of schema.directories) {
        builder.append(`readonly ${directory.name}Directory: Subspace;`);
    }
    for (let ext of schema.extensions) {
        if (ext.field) {
            let f = ext.field();
            builder.append(`readonly ${f.fieldName}: ${f.typename};`);
        }
    }
    builder.removeIndent();
    builder.append('}');
    builder.append();
    builder.append(`export async function openStore(storage: EntityStorage): Promise<Store> {`);
    builder.addIndent();
    builder.append(`const eventFactory = new EventFactory();`);
    for (let event of schema.events) {
        builder.append(`eventFactory.registerEventType('${Case.camelCase(event.name)}', ${Case.pascalCase(event.name)}.encode as any, ${Case.pascalCase(event.name)}.decode);`);
    }
    for (let atomic of schema.atomics) {
        builder.append(`let ${atomic.name}Promise = ${atomic.name}Factory.open(storage);`);
    }
    for (let entity of schema.entities) {
        builder.append(`let ${entity.name}Promise = ${entity.name}Factory.open(storage);`);
    }
    for (let directory of schema.directories) {
        builder.append(`let ${directory.name}DirectoryPromise = storage.resolveCustomDirectory('${Case.camelCase(directory.name)}');`);
    }
    for (let atomic of schema.eventStores) {
        builder.append(`let ${atomic.name}Promise = ${atomic.name}.open(storage, eventFactory);`);
    }
    for (let ext of schema.extensions) {
        if (ext.field) {
            let f = ext.field();
            builder.append(`let ${f.fieldName}Promise = ${f.init};`);
        }
    }

    builder.append('return {');
    builder.addIndent();
    builder.append('storage,');
    builder.append('eventFactory,');
    for (let atomic of schema.atomics) {
        builder.append(`${atomic.name}: await ${atomic.name}Promise,`);
    }
    for (let entity of schema.entities) {
        builder.append(`${entity.name}: await ${entity.name}Promise,`);
    }
    for (let directory of schema.directories) {
        builder.append(`${directory.name}Directory: await ${directory.name}DirectoryPromise,`);
    }
    for (let entity of schema.eventStores) {
        builder.append(`${entity.name}: await ${entity.name}Promise,`);
    }
    for (let ext of schema.extensions) {
        if (ext.field) {
            let f = ext.field();
            builder.append(`${f.fieldName}: await ${f.fieldName}Promise,`);
        }
    }
    builder.removeIndent();
    builder.append('};');
    builder.removeIndent();
    builder.append('}');
}