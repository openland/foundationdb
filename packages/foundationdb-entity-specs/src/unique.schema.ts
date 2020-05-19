import {
    declareSchema,
    entity,
    primaryKey,
    field,
    string,
    integer,
    boolean,
    enumString,
    array,
    float,
    struct,
    union,
    optional,
    uniqueIndex,
    deletableEntity
} from '@openland/foundationdb-compiler';

export default declareSchema(() => {
    deletableEntity('UniqueIndex', () => {
        primaryKey('id', integer());
        field('unique1', string());
        field('unique2', string());
        uniqueIndex('test', ['unique1', 'unique2']);
    });

    deletableEntity('UniqueConditionalIndex', () => {
        primaryKey('id', integer());
        field('unique1', string());
        field('unique2', string());
        uniqueIndex('test', ['unique1', 'unique2']).withCondition((src) => src.unique1 === '!');
    });
});