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
    rangeIndex,
    deletableEntity
} from '@openland/foundationdb-compiler';

export default declareSchema(() => {
    deletableEntity('RangeIndex', () => {
        primaryKey('id', integer());
        field('range1', integer());
        field('range2', integer());
        rangeIndex('ranges', ['range1', 'range2']);
    });

    deletableEntity('RangeIndexConditional', () => {
        primaryKey('id', integer());
        field('range1', integer());
        field('range2', integer());
        rangeIndex('ranges', ['range1', 'range2']).withCondition((src) => src.range1 === 0);
    });
});