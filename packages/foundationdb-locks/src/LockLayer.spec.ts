import { LockLayer, DistributedLock } from './LockLayer';
import { Database } from '@openland/foundationdb';
import { createNamedContext } from '@openland/context';

describe('LockLayer', () => {
    it('should lock', async () => {
        let ctx = createNamedContext('test');
        let db = await Database.openTest({ layers: [new LockLayer()] });
        let lock1 = new DistributedLock('lockkey1', db);
        let lock2 = new DistributedLock('lockkey1', db);
        let res = await lock1.tryLock(ctx);
        expect(res).toBe(true);
        res = await lock2.tryLock(ctx);
        expect(res).toBe(false);
        res = await lock1.tryLock(ctx);
        expect(res).toBe(true);
    });
});