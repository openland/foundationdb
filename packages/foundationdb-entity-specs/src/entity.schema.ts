import { declareSchema } from '@openland/foundationdb-compiler';
import { entity, primaryKey, field } from '@openland/foundationdb-compiler/lib/builder';

export default declareSchema(() => {
    entity('SimpleEntity', () => {
        primaryKey('id', 'string');
        field('value', 'string');
        field('value2', 'number');
        field('value3', 'boolean').nullable();
    });

    entity('SimpleEntity2', () => {
        primaryKey('id', 'number');
        field('value', 'string');
    });
});