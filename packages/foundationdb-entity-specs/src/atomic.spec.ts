import './atomic.schema'; // For 100% coverage
import { EntityStorage } from '@openland/foundationdb-entity';
import { createNamedContext } from '@openland/context';
import { SimpleAtomicIntegerFactory, SimpleAtomicBooleanFactory } from './atomic.repo';
import { Database, inTx } from '@openland/foundationdb';

describe('AtomicInteger', () => {
    it('should default to zero', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await SimpleAtomicIntegerFactory.open(store);
        expect(await factory.get(testCtx, '1')).toBe(0);
    });
    it('should set and get', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await SimpleAtomicIntegerFactory.open(store);
        await inTx(testCtx, async (ctx) => {
            factory.set(ctx, 'some', 1339);
        });
        let res = await factory.byId('some').get(testCtx);
        expect(res).toEqual(1339);

        let res2 = await inTx(testCtx, async (ctx) => {
            return await factory.get(ctx, 'some');
        });
        expect(res2).toEqual(1339);
    });
    it('should increment and decrement', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await SimpleAtomicIntegerFactory.open(store);

        await inTx(testCtx, async (ctx) => {
            factory.set(ctx, 'some-1', 1339);
        });

        await inTx(testCtx, async (ctx) => {
            factory.increment(ctx, 'some-1');
        });

        let res = await factory.get(testCtx, 'some-1');
        expect(res).toEqual(1340);

        await inTx(testCtx, async (ctx) => {
            factory.increment(ctx, 'some-1');
            factory.increment(ctx, 'some-1');
            factory.increment(ctx, 'some-1');
            factory.increment(ctx, 'some-1');
            factory.increment(ctx, 'some-1');
            factory.increment(ctx, 'some-1');
            factory.increment(ctx, 'some-1');
            factory.increment(ctx, 'some-1');
            factory.increment(ctx, 'some-1');
            factory.increment(ctx, 'some-1');
        });

        let res2 = await (factory.get(testCtx, 'some-1'));
        expect(res2).toEqual(1350);

        await inTx(testCtx, async (ctx) => {
            factory.add(ctx, 'some-1', -10);
        });

        let res3 = await factory.get(testCtx, 'some-1');
        expect(res3).toEqual(1340);

        await inTx(testCtx, async (ctx) => {
            factory.decrement(ctx, 'some-1');
        });

        res3 = await factory.get(testCtx, 'some-1');
        expect(res3).toEqual(1339);
    });
});

describe('AtomicBoolean', () => {
    it('should set and get', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await SimpleAtomicBooleanFactory.open(store);

        let res = await factory.get(testCtx, 'some-1');
        expect(res).toEqual(false);

        await inTx(testCtx, async (ctx) => {
            factory.set(ctx, 'some-1', true);
        });

        res = await factory.byId('some-1').get(testCtx);
        expect(res).toEqual(true);

        await inTx(testCtx, async (ctx) => {
            factory.set(ctx, 'some-1', false);
        });

        res = await factory.get(testCtx, 'some-1');
        expect(res).toEqual(false);
    });
    it('should invert', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await SimpleAtomicBooleanFactory.open(store);

        let res = await factory.get(testCtx, 'some-1');
        expect(res).toEqual(false);

        await inTx(testCtx, async (ctx) => {
            factory.invert(ctx, 'some-1');
        });

        res = await factory.get(testCtx, 'some-1');
        expect(res).toEqual(true);

        await inTx(testCtx, async (ctx) => {
            factory.invert(ctx, 'some-1');
        });

        res = await factory.get(testCtx, 'some-1');
        expect(res).toEqual(false);
    });
});