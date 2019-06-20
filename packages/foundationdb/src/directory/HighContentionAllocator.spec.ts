import { HighContentionAllocator } from './HighContentionAllocator';
import { createNamedContext } from '@openland/context';
import { Database } from '../Database';
import { inTx } from '../inTx';
import { encoders } from '../encoding';

describe('HighContentionAllocator', () => {

    it('should allocate distinct values', async () => {
        jest.setTimeout(15000);
        
        let db = await Database.openTest();
        let subspace = (await db.directories.createOrOpen(createNamedContext('test'), ['test']))
            .withKeyEncoding(encoders.tuple);
        let allocator = new HighContentionAllocator(subspace);
        let promises: Promise<number>[] = [];
        for (let i = 0; i < 3000; i++) {
            promises.push(inTx(createNamedContext('test'), async (ctx) => {
                return await allocator.allocate(ctx);
            }));
        }
        let res = await Promise.all(promises);
        let set = new Set(res);
        expect(set.size).toBe(res.length);
    });
});