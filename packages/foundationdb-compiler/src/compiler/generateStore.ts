import { StringBuilder } from './StringBuilder';
import { SchemaModel } from './../model';

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
    builder.removeIndent();
    builder.append('}');
    builder.append();
    builder.append(`export async function openStore(storage: EntityStorage): Promise<Store> {`);
    builder.addIndent();
    for (let atomic of schema.atomics) {
        builder.append(`let ${atomic.name}Promise = ${atomic.name}Factory.open(storage);`);
    }
    for (let entity of schema.entities) {
        builder.append(`let ${entity.name}Promise = ${entity.name}Factory.open(storage);`);
    }
    builder.append('return {');
    builder.addIndent();
    builder.append('storage,');
    for (let atomic of schema.atomics) {
        builder.append(`${atomic.name}: await ${atomic.name}Promise,`);
    }
    for (let entity of schema.entities) {
        builder.append(`${entity.name}: await ${entity.name}Promise,`);
    }
    builder.removeIndent();
    builder.append('};');
    builder.removeIndent();
    builder.append('}');
}