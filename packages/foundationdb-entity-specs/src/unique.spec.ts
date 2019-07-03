import { UniqueIndexFactory } from './unique.repo';
import { EntityStorage } from '@openland/foundationdb-entity';
import { Database, inTx } from '@openland/foundationdb';
import { createNamedContext } from '@openland/context';
describe('Unique index', () => {
    
    it('should check consistency', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await UniqueIndexFactory.open(store);

        // Should create first item
        await inTx(testCtx, async (ctx) => {
            await factory.create(ctx, 1, { unique1: '1', unique2: '2' });
        });

        // Should throw on constraint violation
        await expect(inTx(testCtx, async (ctx) => {
            await factory.create(ctx, 2, { unique1: '1', unique2: '2' });
        })).rejects.toThrowError('Unique index constraint violation');

        // Should other items
        await inTx(testCtx, async (ctx) => {
            await factory.create(ctx, 3, { unique1: '1', unique2: '3' });
        });
        await inTx(testCtx, async (ctx) => {
            await factory.create(ctx, 4, { unique1: '2', unique2: '2' });
        });

        // Should throw on update
        await expect(inTx(testCtx, async (ctx) => {
            let c = (await factory.findById(ctx, 4))!;
            c.unique1 = '1';
        })).rejects.toThrowError('Unique index constraint violation');

        // Should not throw on correct update
        await inTx(testCtx, async (ctx) => {
            let c = (await factory.findById(ctx, 4))!;
            c.unique1 = '4';
        });
    });
});