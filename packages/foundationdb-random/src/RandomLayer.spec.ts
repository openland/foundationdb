import { RandomLayer } from './RandomLayer';
import { Database } from "@openland/foundationdb";
import { createNamedContext } from '@openland/context';

describe('RandomLayer', () => {
    it('should generate random keys', async () => {
        let ctx = createNamedContext('test');
        let db = await Database.openTest({ layers: [new RandomLayer()] });
        let ids = new Set<string>();
        for (let i = 0; i < 1000; i++) {
            ids.add(db.get(RandomLayer).nextRandomId());
        }
        expect(ids.size).toBe(1000);
    });
})