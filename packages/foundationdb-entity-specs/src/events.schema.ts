import { declareSchema, event, string, field, optional } from '@openland/foundationdb-compiler';

export default declareSchema(() => {
    event('SampleEvent', () => {
        field('id', string());
        field('name', optional(string()));
    });
});