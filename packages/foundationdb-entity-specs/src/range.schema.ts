import { declareSchema, entity, primaryKey, field, string, integer, boolean, enumString, array, float, struct, union, optional, rangeIndex } from '@openland/foundationdb-compiler';

export default declareSchema(() => {
    entity('RangeIndex', () => {
        primaryKey('id', integer());
        field('range1', integer());
        field('range2', integer());
        rangeIndex('ranges', ['range1', 'range2']);
    });
});