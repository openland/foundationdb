import { createNamedContext } from '@openland/context';
import { SimpleAtomicIntegerFactory, SimpleAtomicBooleanFactory } from './atomic.repo';
import { EntityStore } from '@openland/foundationdb-entity';
import { Database, inTx } from '@openland/foundationdb';

describe('AtomicInteger', () => {
    it('should set and get', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStore(db);
        let factory = await SimpleAtomicIntegerFactory.create(store);
        await inTx(testCtx, async (ctx) => {
            let atomic = factory.byId('some');
            await atomic.set(ctx, 1339);
        });
        let res = await (factory.byId('some')).get(testCtx);
        expect(res).toEqual(1339);

        let res2 = await inTx(testCtx, async (ctx) => {
            let atomic = factory.byId('some');
            return await atomic.get(ctx);
        });
        expect(res2).toEqual(1339);
    });
    it('should increment and decrement', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStore(db);
        let factory = await SimpleAtomicIntegerFactory.create(store);

        await inTx(testCtx, async (ctx) => {
            let atomic = factory.byId('some-1');
            await atomic.set(ctx, 1339);
        });

        await inTx(testCtx, async (ctx) => {
            let atomic = factory.byId('some-1');
            atomic.increment(ctx);
        });

        let res = await (factory.byId('some-1')).get(testCtx);
        expect(res).toEqual(1340);

        await inTx(testCtx, async (ctx) => {
            let atomic = factory.byId('some-1');
            atomic.increment(ctx);
            atomic.increment(ctx);
            atomic.increment(ctx);
            atomic.increment(ctx);
            atomic.increment(ctx);
            atomic.increment(ctx);
            atomic.increment(ctx);
            atomic.increment(ctx);
            atomic.increment(ctx);
            atomic.increment(ctx);
        });

        let res2 = await (factory.byId('some-1')).get(testCtx);
        expect(res2).toEqual(1350);

        await inTx(testCtx, async (ctx) => {
            let atomic = factory.byId('some-1');
            atomic.add(ctx, -10);
        });

        let res3 = await (factory.byId('some-1')).get(testCtx);
        expect(res3).toEqual(1340);
    });
});

describe('AtomicBoolean', () => {
    it('should set and get', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStore(db);
        let factory = await SimpleAtomicBooleanFactory.create(store);

        let res = await (factory.byId('some-1')).get(testCtx);
        expect(res).toEqual(false);

        await inTx(testCtx, async (ctx) => {
            let atomic = factory.byId('some-1');
            await atomic.set(ctx, true);
        });

        res = await (factory.byId('some-1')).get(testCtx);
        expect(res).toEqual(true);

        await inTx(testCtx, async (ctx) => {
            let atomic = factory.byId('some-1');
            await atomic.set(ctx, false);
        });

        res = await (factory.byId('some-1')).get(testCtx);
        expect(res).toEqual(false);
    });
});