import { UniqueIndexFactory, UniqueConditionalIndexFactory } from './unique.repo';
import { EntityStorage } from '@openland/foundationdb-entity';
import { inTx } from '@openland/foundationdb';
import { createNamedContext } from '@openland/context';
import { openTestDatabase } from './utils/openTestDatabase';

describe('Unique index', () => {
    it('should check consistency', async () => {
        let testCtx = createNamedContext('test');
        let db = await openTestDatabase();
        let store = new EntityStorage(db);
        let factory = await UniqueIndexFactory.open(store);

        // Should create first item
        await inTx(testCtx, async (ctx) => {
            await factory.create(ctx, 1, { unique1: '1', unique2: '2' });
        });
        let ex = await factory.test.find(testCtx, '1', '2');
        expect(ex.id).toBe(1);

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

    it('should work concurrently', async () => {
        let testCtx = createNamedContext('test');
        let db = await openTestDatabase();
        let store = new EntityStorage(db);
        let factory = await UniqueIndexFactory.open(store);

        // Concurrent creation
        await inTx(testCtx, async (ctx) => {
            let p1 = factory.create(ctx, 1, { unique1: '1', unique2: '2' });
            let p2 = factory.create(ctx, 2, { unique1: '1', unique2: '2' });
            await expect(p1).resolves.not.toBeNull();
            await expect(p1).resolves.not.toBeUndefined();
            await expect(p2).rejects.toThrowError('Unique index constraint violation');
        });

        // Concurrent modification
        await expect(inTx(testCtx, async (ctx) => {
            let p1 = await factory.create(ctx, 3, { unique1: '3', unique2: '2' });
            let p2 = await factory.create(ctx, 4, { unique1: '4', unique2: '2' });
            p1.unique1 = '5';
            p2.unique1 = '5';
        })).rejects.toThrowError('Unique index constraint violation');
    });

    it('should read your writes', async () => {

        //
        // NOTE: We are not supporting read your writes when updating fields and before 
        // flushing of changes.
        //

        let testCtx = createNamedContext('test');
        let db = await openTestDatabase();
        let store = new EntityStorage(db);
        let factory = await UniqueIndexFactory.open(store);

        await inTx(testCtx, async (ctx) => {
            let p1 = factory.create(ctx, 1, { unique1: '1', unique2: '2' });
            let p2 = factory.test.find(ctx, '1', '2');
            await expect(p1).resolves.not.toBeNull();
            await expect(p1).resolves.not.toBeUndefined();
            await expect(p2).resolves.not.toBeNull();
            await expect(p2).resolves.not.toBeUndefined();
        });
    });

    it('should support conditional indexes', async () => {
        let testCtx = createNamedContext('test');
        let db = await openTestDatabase();
        let store = new EntityStorage(db);
        let factory = await UniqueConditionalIndexFactory.open(store);

        let ex = await factory.test.find(testCtx, '!', '2');
        expect(ex).toBeNull();

        await inTx(testCtx, async (ctx) => {
            await factory.create(ctx, 1, { unique1: '!', unique2: '2' });
            await factory.create(ctx, 2, { unique1: '?', unique2: '2' });
        });

        // Added to index
        ex = await factory.test.find(testCtx, '!', '2');
        expect(ex).not.toBeNull();
        expect(ex).not.toBeUndefined();

        // Not added to index
        ex = await factory.test.find(testCtx, '?', '2');
        expect(ex).toBeNull();

        // Removed from index
        await inTx(testCtx, async (ctx) => {
            let entity = await factory.findById(ctx, 1);
            entity.unique1 = '@';
        });
        ex = await factory.test.find(testCtx, '!', '2');
        expect(ex).toBeNull();

        // Added to index after edit
        await inTx(testCtx, async (ctx) => {
            let entity = await factory.findById(ctx, 1);
            entity.unique1 = '!';
            entity.unique2 = '3';
        });
        ex = await factory.test.find(testCtx, '!', '3');
        expect(ex).not.toBeNull();
        expect(ex).not.toBeUndefined();
    });

    it('should properly destroy', async () => {
        let testCtx = createNamedContext('test');
        let db = await openTestDatabase();
        let store = new EntityStorage(db);
        let factory = await UniqueIndexFactory.open(store);

        await inTx(testCtx, async ctx => {
            let created = await factory.create(ctx, 1, { unique1: '1', unique2: '2' });
            await created.delete(ctx);
            expect(await factory.findById(ctx, 1)).toBe(null);
            expect(await factory.test.find(ctx, '1', '2')).toBe(null);
        });
    });

    it('should properly destroy with condition', async () => {
        let testCtx = createNamedContext('test');
        let db = await openTestDatabase();
        let store = new EntityStorage(db);
        let factory = await UniqueConditionalIndexFactory.open(store);

        await inTx(testCtx, async ctx => {
            let created = await factory.create(ctx, 1, { unique1: '!', unique2: '2' });
            await created.delete(ctx);
            expect(await factory.findById(ctx, 1)).toBe(null);
            expect(await factory.test.find(ctx, '!', '2')).toBe(null);
        });
    });
});