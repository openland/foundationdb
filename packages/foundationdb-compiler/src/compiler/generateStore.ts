import { StringBuilder } from './StringBuilder';
import { SchemaModel } from './../model';

export function generateStore(schema: SchemaModel, builder: StringBuilder) {
    builder.append();
    builder.append(`export interface Store extends BaseStore {`);
    builder.addIndent();
    for (let atomic of schema.atomics) {
        builder.append(`readonly ${atomic.name}: ${atomic.name}Factory;`);
    }
    builder.removeIndent();
    builder.append('}');
    builder.append();
    builder.append(`export async function openStore(storage: EntityStorage): Promise<Store> {`);
    builder.addIndent();
    for (let atomic of schema.atomics) {
        builder.append(`let ${atomic.name}Promise = ${atomic.name}Factory.open(storage);`);
    }
    for (let atomic of schema.atomics) {
        builder.append(`let ${atomic.name} = await ${atomic.name}Promise;`);
    }
    builder.append('return {');
    builder.addIndent();
    builder.append('storage,');
    for (let atomic of schema.atomics) {
        builder.append(`${atomic.name},`);
    }
    builder.removeIndent();
    builder.append('};');
    builder.removeIndent();
    builder.append('}');
}