import { declareSchema, entity, primaryKey, field, string, integer, boolean, enumString, array, float, struct, union, optional, uniqueIndex } from '@openland/foundationdb-compiler';

export default declareSchema(() => {
    entity('UniqueIndex', () => {
        primaryKey('id', integer());
        field('unique1', string());
        field('unique2', string());
        uniqueIndex('test', ['unique1', 'unique2']);
    });

    entity('UniqueConditionalIndex', () => {
        primaryKey('id', integer());
        field('unique1', string());
        field('unique2', string());
        uniqueIndex('test', ['unique1', 'unique2']).withCondition((src) => src.unique1 === '!');
    });
});