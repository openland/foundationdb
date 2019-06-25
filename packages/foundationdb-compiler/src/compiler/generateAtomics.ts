import { StringBuilder } from './StringBuilder';
import { SchemaModel } from './../model';
import * as Case from 'change-case';

export function generateAtomicsHeader(schema: SchemaModel, builder: StringBuilder) {
    if (schema.atomics.length > 0) {
        builder.append(`// @ts-ignore`);
        builder.append(`import { AtomicIntegerFactory, AtomicBooleanFactory } from '@openland/foundationdb-entity';`);
    }
}

export function generateAtomicsStore(schema: SchemaModel, builder: StringBuilder) {
    for (let atomic of schema.atomics) {
        builder.append('readonly ' + atomic.name + ': ' + atomic.name + 'Factory;');
    }
}

export function generateAtomics(schema: SchemaModel, builder: StringBuilder) {
    for (let atomic of schema.atomics) {
        let entityKey = Case.camelCase(atomic.name);
        let entityClass = Case.pascalCase(atomic.name);
        let baseClass: string;
        if (atomic.kind === 'int') {
            baseClass = 'AtomicIntegerFactory';
        } else if (atomic.kind === 'boolean') {
            baseClass = 'AtomicBooleanFactory';
        } else {
            throw Error('Unknown atomic type: ' + atomic.kind);
        }

        // Header
        builder.append();
        builder.append(`export class ${entityClass}Factory extends ${baseClass} {`);
        builder.addIndent();

        // Constructor
        builder.append();
        builder.append(`static async open(storage: EntityStorage) {`);
        builder.addIndent();
        builder.append(`let directory = await storage.resolveAtomicDirectory('${entityKey}');`);
        builder.append(`return new ${entityClass}Factory(storage, directory);`);
        builder.removeIndent();
        builder.append(`}`);
        builder.append();
        builder.append(`private constructor(storage: EntityStorage, subspace: Subspace) {`);
        builder.addIndent();
        builder.append('super(storage, subspace);');
        builder.removeIndent();
        builder.append(`}`);

        // By Id
        builder.append();
        builder.append(`byId(${atomic.keys.map((v) => v.name + ': ' + v.type).join(', ')}) {`);
        builder.addIndent();
        builder.append(`return this._findById([${atomic.keys.map((v) => v.name).join(', ')}]);`);
        builder.removeIndent();
        builder.append('}');

        builder.append();
        builder.append(`get(ctx: Context, ${atomic.keys.map((v) => v.name + ': ' + v.type).join(', ')}) {`);
        builder.addIndent();
        builder.append(`return this._get(ctx, [${atomic.keys.map((v) => v.name).join(', ')}]);`);
        builder.removeIndent();
        builder.append('}');

        if (atomic.kind === 'boolean') {
            builder.append();
            builder.append(`set(ctx: Context, ${atomic.keys.map((v) => v.name + ': ' + v.type).join(', ')}, value: boolean) {`);
            builder.addIndent();
            builder.append(`return this._set(ctx, [${atomic.keys.map((v) => v.name).join(', ')}], value);`);
            builder.removeIndent();
            builder.append('}');

            builder.append();
            builder.append(`invert(ctx: Context, ${atomic.keys.map((v) => v.name + ': ' + v.type).join(', ')}) {`);
            builder.addIndent();
            builder.append(`return this._invert(ctx, [${atomic.keys.map((v) => v.name).join(', ')}]);`);
            builder.removeIndent();
            builder.append('}');
        }

        if (atomic.kind === 'int') {
            builder.append();
            builder.append(`set(ctx: Context, ${atomic.keys.map((v) => v.name + ': ' + v.type).join(', ')}, value: number) {`);
            builder.addIndent();
            builder.append(`return this._set(ctx, [${atomic.keys.map((v) => v.name).join(', ')}], value);`);
            builder.removeIndent();
            builder.append('}');

            builder.append();
            builder.append(`add(ctx: Context, ${atomic.keys.map((v) => v.name + ': ' + v.type).join(', ')}, value: number) {`);
            builder.addIndent();
            builder.append(`return this._add(ctx, [${atomic.keys.map((v) => v.name).join(', ')}], value);`);
            builder.removeIndent();
            builder.append('}');

            builder.append();
            builder.append(`increment(ctx: Context, ${atomic.keys.map((v) => v.name + ': ' + v.type).join(', ')}) {`);
            builder.addIndent();
            builder.append(`return this._increment(ctx, [${atomic.keys.map((v) => v.name).join(', ')}]);`);
            builder.removeIndent();
            builder.append('}');

            builder.append();
            builder.append(`decrement(ctx: Context, ${atomic.keys.map((v) => v.name + ': ' + v.type).join(', ')}) {`);
            builder.addIndent();
            builder.append(`return this._decrement(ctx, [${atomic.keys.map((v) => v.name).join(', ')}]);`);
            builder.removeIndent();
            builder.append('}');
        }

        // Footer
        builder.removeIndent();
        builder.append(`}`);
    }
}