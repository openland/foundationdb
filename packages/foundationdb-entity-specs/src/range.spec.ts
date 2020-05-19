import { RangeIndexFactory, RangeIndexConditionalFactory } from './range.repo';
import { EntityStorage } from '@openland/foundationdb-entity';
import { inTx } from '@openland/foundationdb';
import { createNamedContext } from '@openland/context';
import { openTestDatabase } from './utils/openTestDatabase';

describe('Range Index', () => {
    it('should create entity', async () => {
        let testCtx = createNamedContext('test');
        let db = await openTestDatabase();
        let store = new EntityStorage(db);
        let factory = await RangeIndexFactory.open(store);

        await inTx(testCtx, async (ctx) => {
            await factory.create(ctx, 1, { range1: 1, range2: 2 });
            await factory.create(ctx, 2, { range1: 1, range2: 2 });
            await factory.create(ctx, 3, { range1: 1, range2: 2 });
            await factory.create(ctx, 4, { range1: 1, range2: 2 });
        });

        let res = await factory.ranges.findAll(testCtx, 1);
        expect(res.length).toBe(4);
        expect(res[0].id).toBe(1);
        expect(res[1].id).toBe(2);
        expect(res[2].id).toBe(3);
        expect(res[3].id).toBe(4);

        let res2 = await factory.ranges.query(testCtx, 1, { limit: 1 });
        expect(res2.items.length).toBe(1);
        expect(res2.items[0].id).toBe(1);

        res2 = await factory.ranges.query(testCtx, 1, { limit: 1, reverse: true });
        expect(res2.items.length).toBe(1);
        expect(res2.items[0].id).toBe(4);
    });

    it('should produce working streams', async () => {
        let testCtx = createNamedContext('test');
        let db = await openTestDatabase();
        let store = new EntityStorage(db);
        let factory = await RangeIndexFactory.open(store);

        await inTx(testCtx, async (ctx) => {
            await factory.create(ctx, -3, { range1: 0, range2: 2 });
            await factory.create(ctx, -2, { range1: 0, range2: 2 });
            await factory.create(ctx, -1, { range1: 0, range2: 2 });
            await factory.create(ctx, 0, { range1: 0, range2: 2 });
            await factory.create(ctx, 1, { range1: 1, range2: 2 });
            await factory.create(ctx, 2, { range1: 1, range2: 2 });
            await factory.create(ctx, 3, { range1: 1, range2: 2 });
            await factory.create(ctx, 4, { range1: 1, range2: 2 });
            await factory.create(ctx, 5, { range1: 2, range2: 2 });
            await factory.create(ctx, 6, { range1: 2, range2: 2 });
            await factory.create(ctx, 7, { range1: 2, range2: 2 });
            await factory.create(ctx, 8, { range1: 2, range2: 2 });
            await factory.create(ctx, 9, { range1: 2, range2: 2 });
        });

        let stream = factory.ranges.stream(1, { batchSize: 1 });
        expect(stream.cursor).toMatchSnapshot();
        expect(await stream.tail(testCtx)).toMatchSnapshot();
        expect(await stream.head(testCtx)).toMatchSnapshot();

        let next = await stream.next(testCtx);
        expect(stream.cursor).toMatchSnapshot();
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(1);

        next = await stream.next(testCtx);
        let after = stream.cursor;
        expect(stream.cursor).toMatchSnapshot();
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(2);

        next = await stream.next(testCtx);
        expect(stream.cursor).toMatchSnapshot();
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(3);

        next = await stream.next(testCtx);
        expect(stream.cursor).toMatchSnapshot();
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(4);

        next = await stream.next(testCtx);
        expect(stream.cursor).toMatchSnapshot();
        expect(next.length).toBe(0);

        //
        // After
        //
        stream = factory.ranges.stream(1, { batchSize: 1, after });

        next = await stream.next(testCtx);
        expect(stream.cursor).toMatchSnapshot();
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(3);

        next = await stream.next(testCtx);
        expect(stream.cursor).toMatchSnapshot();
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(4);

        next = await stream.next(testCtx);
        expect(stream.cursor).toMatchSnapshot();
        expect(next.length).toBe(0);

        //
        // Reverse
        //

        stream = factory.ranges.stream(1, { batchSize: 1, reverse: true });
        expect(stream.cursor).toMatchSnapshot();
        expect(await stream.tail(testCtx)).toMatchSnapshot();
        expect(await stream.head(testCtx)).toMatchSnapshot();

        next = await stream.next(testCtx);
        expect(stream.cursor).toMatchSnapshot();
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(4);

        next = await stream.next(testCtx);
        after = stream.cursor;
        expect(stream.cursor).toMatchSnapshot();
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(3);

        next = await stream.next(testCtx);
        expect(stream.cursor).toMatchSnapshot();
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(2);

        next = await stream.next(testCtx);
        expect(stream.cursor).toMatchSnapshot();
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(1);

        next = await stream.next(testCtx);
        expect(stream.cursor).toMatchSnapshot();
        expect(next.length).toBe(0);

        //
        // Reverse after
        //
        stream = factory.ranges.stream(1, { batchSize: 1, reverse: true, after });

        next = await stream.next(testCtx);
        expect(stream.cursor).toMatchSnapshot();
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(2);

        next = await stream.next(testCtx);
        expect(stream.cursor).toMatchSnapshot();
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(1);

        next = await stream.next(testCtx);
        expect(stream.cursor).toMatchSnapshot();
        expect(next.length).toBe(0);
    });

    it('should have consistent cursors', async () => {
        let testCtx = createNamedContext('test');
        let db = await openTestDatabase();
        let store = new EntityStorage(db);
        let factory = await RangeIndexFactory.open(store);

        await inTx(testCtx, async (ctx) => {
            await factory.create(ctx, -3, { range1: 0, range2: 2 });
            await factory.create(ctx, -2, { range1: 0, range2: 2 });
            await factory.create(ctx, -1, { range1: 0, range2: 2 });
            await factory.create(ctx, 0, { range1: 0, range2: 2 });
            await factory.create(ctx, 1, { range1: 1, range2: 2 });
            await factory.create(ctx, 2, { range1: 1, range2: 2 });
            await factory.create(ctx, 3, { range1: 1, range2: 2 });
            await factory.create(ctx, 4, { range1: 1, range2: 2 });
            await factory.create(ctx, 5, { range1: 2, range2: 2 });
            await factory.create(ctx, 6, { range1: 2, range2: 2 });
            await factory.create(ctx, 7, { range1: 2, range2: 2 });
            await factory.create(ctx, 8, { range1: 2, range2: 2 });
            await factory.create(ctx, 9, { range1: 2, range2: 2 });
        });

        let res = await factory.ranges.query(testCtx, 1, { limit: 1 });
        expect(res.cursor).not.toBeNull();
        expect(res.cursor).not.toBeUndefined();
        expect(res.haveMore).toBe(true);
        let s = factory.ranges.stream(1, { batchSize: 1 });
        s.seek(res.cursor!);
        let res2 = await s.next(testCtx);
        expect(res2.length).toBe(1);
        expect(res2[0].id).toBe(2);

        res = await factory.ranges.query(testCtx, 2, { limit: 4 });
        expect(res.cursor).not.toBeNull();
        expect(res.cursor).not.toBeUndefined();
        expect(res.haveMore).toBe(true);

        res = await factory.ranges.query(testCtx, 2, { limit: 5 });
        expect(res.cursor).not.toBeNull();
        expect(res.cursor).not.toBeUndefined();
        expect(res.haveMore).toBe(false);
    });

    it('should support conditional indexes', async () => {
        let testCtx = createNamedContext('test');
        let db = await openTestDatabase();
        let store = new EntityStorage(db);
        let factory = await RangeIndexConditionalFactory.open(store);

        let ex = await factory.ranges.findAll(testCtx, 0);
        expect(ex.length).toBe(0);

        await inTx(testCtx, async (ctx) => {
            await factory.create(ctx, 1, { range1: 0, range2: 2 });
            await factory.create(ctx, 2, { range1: 1, range2: 2 });
        });

        // Added to index
        ex = await factory.ranges.findAll(testCtx, 0);
        expect(ex.length).toBe(1);
        expect(ex[0].id).toBe(1);

        // Not added to index
        ex = await factory.ranges.findAll(testCtx, 1);
        expect(ex.length).toBe(0);

        // Removed from index
        await inTx(testCtx, async (ctx) => {
            let entity = await factory.findById(ctx, 1);
            entity.range1 = 3;
        });
        ex = await factory.ranges.findAll(testCtx, 0);
        expect(ex.length).toBe(0);

        // Added to index after edit
        await inTx(testCtx, async (ctx) => {
            let entity = await factory.findById(ctx, 1);
            entity.range1 = 0;
            entity.range2 = 4;
        });
        ex = await factory.ranges.findAll(testCtx, 0);
        expect(ex.length).toBe(1);
        expect(ex[0].id).toBe(1);
    });

    it('should properly destroy', async () => {
        let testCtx = createNamedContext('test');
        let db = await openTestDatabase();
        let store = new EntityStorage(db);
        let factory = await RangeIndexFactory.open(store);

        await inTx(testCtx, async ctx => {
            let created = await factory.create(ctx, 1, { range1: 1, range2: 2 });
            await created.delete(ctx);
            expect(await factory.findById(ctx, 1)).toBe(null);
            expect(await factory.ranges.findAll(ctx, 1)).toHaveLength(0);
        });
    });

    it('should properly destroy with condition', async () => {
        let testCtx = createNamedContext('test');
        let db = await openTestDatabase();
        let store = new EntityStorage(db);
        let factory = await RangeIndexConditionalFactory.open(store);

        await inTx(testCtx, async ctx => {
            let created = await factory.create(ctx, 1, { range1: 0, range2: 2 });
            await created.delete(ctx);
            expect(await factory.findById(ctx, 1)).toBe(null);
            expect(await factory.ranges.findAll(ctx, 0)).toHaveLength(0);
        });
    });
    //
    // TODO: Read your writes test
    //
});