import { StringBuilder } from './StringBuilder';
import { SchemaModel } from './../model';
import * as Case from 'change-case';

export function generateAtomicsHeader(schema: SchemaModel, builder: StringBuilder) {
    builder.append(`// @ts-ignore`);
    builder.append(`import { AtomicIntegerFactory, AtomicBooleanFactory } from '@openland/foundationdb-entity';`);
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
        builder.append(`static async create(store: EntityStore) {`);
        builder.addIndent();
        builder.append(`let directory = await store.resolveAtomicDirectory('${entityKey}');`);
        builder.append(`return new ${entityClass}Factory(store, directory);`);
        builder.removeIndent();
        builder.append(`}`);
        builder.append();
        builder.append(`private constructor(store: EntityStore, subspace: Subspace) {`);
        builder.addIndent();
        builder.append('super(store, subspace);');
        builder.removeIndent();
        builder.append(`}`);

        // Get
        builder.append();
        builder.append(`byId(${atomic.keys.map((v) => v.name + ': ' + v.type).join(', ')}) {`);
        builder.addIndent();
        builder.append(`return this._findById([${atomic.keys.map((v) => v.name).join(', ')}]);`);
        builder.removeIndent();
        builder.append('}');

        // Footer
        builder.removeIndent();
        builder.append(`}`);
    }
}