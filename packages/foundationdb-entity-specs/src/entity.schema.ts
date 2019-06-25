import { declareSchema } from '@openland/foundationdb-compiler';
import { entity, primaryKey } from '@openland/foundationdb-compiler/lib/builder';

export default declareSchema(() => {
    entity('SimpleEntity', () => {
        primaryKey('id', 'string');
    });
});