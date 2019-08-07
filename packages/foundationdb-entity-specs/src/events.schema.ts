import { declareSchema, event, string, field, optional } from '@openland/foundationdb-compiler';
import { eventStore, primaryKey } from '@openland/foundationdb-compiler/lib/builder';

export default declareSchema(() => {
    event('SampleEvent', () => {
        field('id', string());
        field('name', optional(string()));
    });

    eventStore('UserEvents', () => {
        primaryKey('userId', string());
    });
});