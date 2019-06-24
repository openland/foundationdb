import { StringBuilder } from './compiler/StringBuilder';
import * as path from 'path';
import * as fs from 'fs';
import { SchemaModel } from './model';
import { generate } from './compiler/generate';

export function compile(schema: SchemaModel): string {
    let builder = new StringBuilder();
    generate(schema, builder);
    return builder.build();
}

export function compileFile(source: string, destination: string) {
    let sourceSchema = require(path.resolve(source)).default as SchemaModel;
    if (!sourceSchema || !sourceSchema._schema) {
        throw Error('Unable to find schema');
    }
    let res = compile(sourceSchema);
    fs.writeFileSync(path.resolve(destination), res);
} 