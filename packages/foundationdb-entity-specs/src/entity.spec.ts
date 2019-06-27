import { SimpleEntityFactory } from './entity.repo';
import { EntityStorage } from '@openland/foundationdb-entity';
import { Database, withReadOnlyTransaction, inTx } from '@openland/foundationdb';
import { createNamedContext } from '@openland/context';

describe('Entity', () => {
    it('should return null if not exists', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await SimpleEntityFactory.open(store);
        expect(await factory.findById(testCtx, '1')).toBe(null);
    });

    it('should be able to create entity', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await SimpleEntityFactory.open(store);
        expect(await factory.findById(testCtx, '1')).toBe(null);
        let created = await factory.create(testCtx, '1', { value: 'value', value2: 2, value3: false });
        expect(created.id).toBe('1');
        expect(created.value).toBe('value');
        expect(created.value2).toBe(2);
        expect(created.value3).toBe(false);
        expect(created.metadata.versionCode).toBe(0);

        let loaded = await factory.findById(testCtx, '1');
        expect(loaded).not.toBe(null);
        expect(loaded).not.toBe(undefined);
        expect(loaded.id).toBe('1');
        expect(loaded.value).toBe('value');
        expect(loaded.value2).toBe(2);
        expect(loaded.value3).toBe(false);
        expect(loaded.metadata.versionCode).toBe(0);
    });

    it('should be able to create entity in parallel', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await SimpleEntityFactory.open(store);
        await inTx(testCtx, async (ctx) => {
            let pending: any[] = [];
            for (let i = 0; i < 100; i++) {
                pending.push(factory.create(ctx, 'id-' + i, { value: 'value', value2: 2, value3: false }));
            }
            await Promise.all(pending);
        });
        for (let i = 0; i < 100; i++) {
            let r = await factory.findById(testCtx, 'id-' + i);
            expect(r).not.toBe(null);
            expect(r).not.toBe(undefined);
            expect(r.id).toBe('id-' + i);
        }
    });

    it('should return same instance within same transaction', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await SimpleEntityFactory.open(store);
        await factory.create(testCtx, '1', { value: 'value', value2: 2, value3: false });
        let ctx = withReadOnlyTransaction(testCtx);
        let firstRead = await factory.findById(ctx, '1');
        let secondRead = await factory.findById(ctx, '1');
        expect(firstRead === secondRead).toBe(true);
    });

    it('should read your writes', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await SimpleEntityFactory.open(store);
        await inTx(testCtx, async (ctx) => {
            let ex = await factory.findById(ctx, '1');
            expect(ex).toBe(null);
            let c = factory.create(ctx, '1', { value: 'value', value2: 2, value3: false });
            let ex2 = factory.findById(ctx, '1');
            expect(await ex2).toBe(await c);
        });
    });
});