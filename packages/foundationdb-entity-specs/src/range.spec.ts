import { RangeIndexFactory } from './range.repo';
import { EntityStorage } from '@openland/foundationdb-entity';
import { Database, inTx } from '@openland/foundationdb';
import { createNamedContext } from '@openland/context';

describe('Range Index', () => {
    it('should create entity', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
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
        expect(res[0].value.id).toBe(1);
        expect(res[1].value.id).toBe(2);
        expect(res[2].value.id).toBe(3);
        expect(res[3].value.id).toBe(4);

        res = await factory.ranges.query(1, { limit: 1 }).asArray(testCtx);
        expect(res.length).toBe(1);
        expect(res[0].value.id).toBe(1);

        res = await factory.ranges.query(1, { limit: 1, reverse: true }).asArray(testCtx);
        expect(res.length).toBe(1);
        expect(res[0].value.id).toBe(4);
    });

    it('should produce working streams', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await RangeIndexFactory.open(store);

        await inTx(testCtx, async (ctx) => {
            await factory.create(ctx, 1, { range1: 1, range2: 2 });
            await factory.create(ctx, 2, { range1: 1, range2: 2 });
            await factory.create(ctx, 3, { range1: 1, range2: 2 });
            await factory.create(ctx, 4, { range1: 1, range2: 2 });
        });

        let stream = factory.ranges.query(1, { limit: 1 }).asStream();
        let next = await stream.next(testCtx);
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(1);

        next = await stream.next(testCtx);
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(2);

        next = await stream.next(testCtx);
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(3);

        next = await stream.next(testCtx);
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(4);

        next = await stream.next(testCtx);
        expect(next.length).toBe(0);

        //
        // Reverse
        //

        stream = factory.ranges.query(1, { limit: 1, reverse: true }).asStream();
        next = await stream.next(testCtx);
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(4);

        next = await stream.next(testCtx);
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(3);

        next = await stream.next(testCtx);
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(2);

        next = await stream.next(testCtx);
        expect(next.length).toBe(1);
        expect(next[0].id).toBe(1);

        next = await stream.next(testCtx);
        expect(next.length).toBe(0);
    });

    //
    // TODO: Read your writes test
    //
});