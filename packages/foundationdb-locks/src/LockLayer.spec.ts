import { LockLayer } from './LockLayer';
import { DistributedLock } from './DistributedLock';
import { Database } from '@openland/foundationdb';
import { createNamedContext } from '@openland/context';
import { delay } from '@openland/foundationdb-utils';

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
    it('should expire lock', async () => {
        let ctx = createNamedContext('test');
        let db = await Database.openTest({ layers: [new LockLayer()] });
        let lock1 = new DistributedLock('lockkey1', db);
        let lock2 = new DistributedLock('lockkey1', db);
        let res = await lock1.tryLock(ctx, 10);
        expect(res).toBe(true);
        await delay(50);
        res = await lock2.tryLock(ctx, 100);
        expect(res).toBe(true);
        res = await lock1.tryLock(ctx);
        expect(res).toBe(false);
    });
});