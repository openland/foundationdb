import { declareSchema, entity, primaryKey, field, string, integer, boolean, enumString, array, float, struct, union, optional, uniqueIndex } from '@openland/foundationdb-compiler';

export default declareSchema(() => {
    entity('SimpleEntity', () => {
        primaryKey('id', string());
        field('value', string());
        field('value2', integer());
        field('value3', optional(boolean()));
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
        field('value7', struct({
            name: string(),
            type: integer()
        }));
        field('value8', optional(union({
            something: struct({
                name: string()
            }),
            something_2: struct({
                name: string()
            })
        })));

        uniqueIndex('uniqIndex', ['key1', 'key2']);
    });
});