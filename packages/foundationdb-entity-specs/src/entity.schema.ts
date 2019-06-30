import { declareSchema, entity, primaryKey, field, string, integer, boolean, enumString, array, float } from '@openland/foundationdb-compiler';

export default declareSchema(() => {
    entity('SimpleEntity', () => {
        primaryKey('id', string());
        field('value', string());
        field('value2', integer());
        field('value3', boolean()).nullable();
    });

    entity('SimpleEntity2', () => {
        primaryKey('id', integer());
        field('value', string());
    });

    entity('AllFields', () => {
        primaryKey('key1', boolean());
        primaryKey('key2', integer());
        primaryKey('key3', float());
        primaryKey('key4', string());
        field('value1', boolean());
        field('value2', integer());
        field('value3', float());
        field('value4', string());
        field('value5', enumString('value1', 'value2'));
        field('value6', array(string()));
        // field('value6',)
    });
});