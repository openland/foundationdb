import { StringBuilder } from './StringBuilder';
import { SchemaModel } from '../model';

export function generateExtensionsHeader(schema: SchemaModel, builder: StringBuilder) {
    let handledTypes = new Set<string>();
    for (let ex of schema.extensions) {
        if (handledTypes.has(ex.type)) {
            continue;
        }
        handledTypes.add(ex.type);
        if (ex.header) {
            ex.header(builder);
        }
    }
}

export function generateExtensions(schema: SchemaModel, builder: StringBuilder) {
    for (let ex of schema.extensions) {
        if (ex.body) {
            ex.body(builder);
        }
    }
}