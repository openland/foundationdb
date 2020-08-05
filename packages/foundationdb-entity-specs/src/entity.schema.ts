import {
    declareSchema,
    entity,
    primaryKey,
    field,
    string,
    integer,
    boolean,
    enumString,
    customDirectory,
    json,
    array,
    float,
    struct,
    union,
    optional,
    uniqueIndex,
    allowDelete,
    extension
} from '@openland/foundationdb-compiler';

export default declareSchema(() => {
    entity('SimpleEntity', () => {
        primaryKey('id', string());
        field('value', string());
        field('value2', integer());
        field('value3', optional(boolean()));

        allowDelete();
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
        field('value55', optional(enumString('value1', 'value2')));
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
        field('value9', json());
        field('value10', optional(boolean()));
        field('value11', optional(integer()));
        field('value12', optional(float()));
        field('value13', optional(string()));
        field('vaueSome', integer());

        uniqueIndex('uniqIndex', ['key1', 'key2', 'key3', 'key4', 'value1', 'value2', 'value3', 'value4', 'value10', 'value11', 'value12', 'value13', 'createdAt', 'updatedAt', 'value5', 'value55']).withCondition((src) => src.key1 !== 'hello!');
    });

    customDirectory('directory');

    extension('SampleExtension', 'com.openland.example.sample', {
        header: (b) => b.append('// Test SampleExtension header'),
        body: (b) => {
            b.append();
            b.append('// Test Sample Extension Body');
        },
        field: () => ({
            typename: 'number',
            fieldName: 'SampleExt',
            init: '123'
        })
    });
});