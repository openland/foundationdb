import { delay } from '@openland/foundationdb-utils';
import { SimpleEntityFactory, SimpleEntity2Factory } from './entity.repo';
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
        let start = Date.now();
        let created = await factory.create(testCtx, '1', { value: 'value', value2: 2, value3: false });
        let end = Date.now();
        expect(created.id).toBe('1');
        expect(created.value).toBe('value');
        expect(created.value2).toBe(2);
        expect(created.value3).toBe(false);
        expect(created.metadata.versionCode).toBe(0);
        expect(created.metadata.createdAt).toBeGreaterThanOrEqual(start);
        expect(created.metadata.createdAt).toBeLessThanOrEqual(end);
        expect(created.metadata.updatedAt).toBeGreaterThanOrEqual(start);
        expect(created.metadata.updatedAt).toBeLessThanOrEqual(end);
        expect(created.metadata.updatedAt).toBe(created.metadata.createdAt);

        let loaded = await factory.findById(testCtx, '1');
        expect(loaded).not.toBe(null);
        expect(loaded).not.toBe(undefined);
        expect(loaded.id).toBe('1');
        expect(loaded.value).toBe('value');
        expect(loaded.value2).toBe(2);
        expect(loaded.value3).toBe(false);
        expect(loaded.metadata.versionCode).toBe(0);
        expect(loaded.metadata.createdAt).toBeGreaterThanOrEqual(start);
        expect(loaded.metadata.createdAt).toBeLessThanOrEqual(end);
        expect(loaded.metadata.updatedAt).toBeGreaterThanOrEqual(start);
        expect(loaded.metadata.updatedAt).toBeLessThanOrEqual(end);
        expect(loaded.metadata.updatedAt).toBe(loaded.metadata.createdAt);
        expect(loaded.metadata.updatedAt).toBe(created.metadata.createdAt);
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

    it('should update entity', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await SimpleEntityFactory.open(store);

        // Create New
        let start = Date.now();
        await inTx(testCtx, async (ctx) => {
            await factory.create(ctx, '1', { value: 'value', value2: 2, value3: false });
        });
        let end = Date.now();

        let read = await factory.findById(testCtx, '1');
        expect(read.value).toBe('value');
        expect(read.metadata.versionCode).toBe(0);
        expect(read.metadata.createdAt).toBeGreaterThanOrEqual(start);
        expect(read.metadata.createdAt).toBeLessThanOrEqual(end);
        expect(read.metadata.updatedAt).toBe(read.metadata.createdAt);

        // Update
        let start2 = Date.now();
        await inTx(testCtx, async (ctx) => {
            let ex = await factory.findById(ctx, '1');
            ex.value = 'value2';
        });
        let end2 = Date.now();
        let read2 = await factory.findById(testCtx, '1');
        expect(read2.value).toBe('value2');
        expect(read2.metadata.versionCode).toBe(1);
        expect(read2.metadata.updatedAt).not.toBe(read2.metadata.createdAt);
        expect(read2.metadata.createdAt).toBeGreaterThanOrEqual(start);
        expect(read2.metadata.createdAt).toBeLessThanOrEqual(end);
        expect(read2.metadata.updatedAt).toBeGreaterThanOrEqual(start2);
        expect(read2.metadata.updatedAt).toBeLessThanOrEqual(end2);
    });

    it('should throw error when trying to change read-only instance', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await SimpleEntityFactory.open(store);
        await inTx(testCtx, async (ctx) => {
            await factory.create(ctx, '1', { value: 'value', value2: 2, value3: false });
        });
        let read = await factory.findById(testCtx, '1');
        expect(() => read.value = 'hey!').toThrowError('Entity is not writable. Did you wrapped everything in transaction?');
    });

    it('double flush should work', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await SimpleEntityFactory.open(store);
        await inTx(testCtx, async (ctx) => {
            await factory.create(ctx, '1', { value: 'value', value2: 2, value3: false });
        });
        await inTx(testCtx, async (ctx) => {
            let ex = await factory.findById(ctx, '1');
            ex.value = 'value2';
            let f1 = ex.flush(ctx);
            ex.value = 'value3';
            let f2 = ex.flush(ctx);
            await f1; await f2;
        });
        let read = await factory.findById(testCtx, '1');
        expect(read.value).toBe('value3');
    });

    it('should throw if entity already exists', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await SimpleEntityFactory.open(store);
        await inTx(testCtx, async (ctx) => {
            await factory.create(ctx, '1', { value: 'hello world1', value2: 2, value3: false });
        });

        let res = inTx(testCtx, async (ctx) => {
            await factory.create(ctx, '1', { value: 'hello world1', value2: 2, value3: false });
        });
        await expect(res).rejects.toThrowError('Entity already exists');
    });

    it('should throw on second creation', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await SimpleEntityFactory.open(store);
        await inTx(testCtx, async (ctx) => {
            let ex = factory.create(ctx, '1', { value: 'hello world1', value2: 2, value3: false });
            let ex2 = factory.create(ctx, '1', { value: 'hello world2', value2: 2, value3: false });
            await expect(ex).resolves.not.toBeUndefined();
            await expect(ex).resolves.not.toBeNull();
            await expect(ex2).rejects.toThrowError('Entity already exists');
        });
    });

    it('should crash when trying to change value after transaction completed', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await SimpleEntityFactory.open(store);
        let res = await inTx(testCtx, async (ctx) => {
            return await factory.create(ctx, '1', { value: 'hello world1', value2: 2, value3: false });
        });
        expect(() => res.value = 'hey!').toThrowError('You can\'t update entity when transaction is in completed state.');
    });

    it('should preserve unknown fields', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await SimpleEntityFactory.open(store);
        await inTx(testCtx, async (ctx) => {
            return await factory.create(ctx, '1', { value: 'hello world1', value2: 2, value3: false });
        });
        await inTx(testCtx, async (ctx) => {
            let ex = await factory.descriptor.subspace.get(ctx, ['1']);
            factory.descriptor.subspace.set(ctx, ['1'], { ...ex, unknownField: 'unknown value' });
        });
        await inTx(testCtx, async (ctx) => {
            let st = await factory.findById(ctx, '1');
            st.value = 'value';
        });
        let res = await factory.descriptor.subspace.get(testCtx, ['1']);
        expect(res.unknownField).toBe('unknown value');
    });

    it('should throw on invalid key numbers', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await SimpleEntity2Factory.open(store);
        await expect(factory.findById(testCtx, 0.1)).rejects.toThrowError();
        await expect(inTx(testCtx, async (ctx) => {
            return await factory.create(ctx, 0.1, { value: 'hello world1' });
        })).rejects.toThrowError();
    });

    it('should resolve watch promise', async () => {
        let testCtx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EntityStorage(db);
        let factory = await SimpleEntity2Factory.open(store);

        let func = jest.fn();
        await inTx(testCtx, async (ctx) => {
            return await factory.create(ctx, 1, { value: 'hello world1' });
        });
        
        // tslint:disable:no-floating-promises
        (async () => {
            while (true) {
                let w = await inTx(testCtx, async (ctx) => factory.watch(ctx, 1));
                await w.promise;
                func();
            }
        })();

        await inTx(testCtx, async (ctx) => {
            let v = await factory.findById(ctx, 1);
            v!.value = 'test2';
        });

        await delay(1000);

        expect(func.mock.calls.length).toBe(1);
    });
});