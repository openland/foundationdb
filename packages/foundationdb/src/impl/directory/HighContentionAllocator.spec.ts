import { HighContentionAllocator } from './HighContentionAllocator';
import { createNamedContext } from '@openland/context';
import { Database } from '../../Database';
import { inTx } from '../../inTx';

describe('HighContentionAllocator', () => {

    it('should allocate distinct values', async () => {
        let db = await Database.openTest();
        let allocator = new HighContentionAllocator(Buffer.of(0));
        let promises: Promise<number>[] = [];
        for (let i = 0; i < 1000; i++) {
            promises.push(inTx(createNamedContext('test'), async (ctx) => {
                return await allocator.allocate(ctx, db);
            }));
        }
        let res = await Promise.all(promises);
        let set = new Set(res);
        expect(set.size).toBe(res.length);
    });
});