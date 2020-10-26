import { Database } from './Database';
import { inTx } from './inTx';
import { createNamedContext } from '@openland/context';
import { encoders } from './encoding';
import { createVersionstampRef } from './createVersionstampRef';
import { Versionstamp } from '@openland/foundationdb-tuple';
import { delay } from './utils';

async function createKeyspaces() {
    let db = await Database.openTest();

    return [
        db.allKeys
            .withKeyEncoding(encoders.tuple)
            .withValueEncoding(encoders.int32LE),
        db.allKeys
            .withKeyEncoding(encoders.tuple)
            .withValueEncoding(encoders.int32LE)
            .subspace(['1']),
        db.allKeys
            .withKeyEncoding(encoders.tuple)
            .withValueEncoding(encoders.int32LE)
            .subspace(['2'])
            .subspace(['3']),
        db.allKeys
            .subspace(Buffer.of(100))
            .withKeyEncoding(encoders.tuple)
            .withValueEncoding(encoders.int32LE),
        db.allKeys
            .subspace(Buffer.of(101))
            .withValueEncoding(encoders.int32LE)
            .withKeyEncoding(encoders.tuple)
    ];
}

describe('Subspace', () => {

    it('should read and write single keys', async () => {
        let keyspaces = await createKeyspaces();
        for (let keyspace of keyspaces) {
            let rootCtx = createNamedContext('test');
            await inTx(rootCtx, async (ctx) => {

                // Read
                let k = await keyspace.get(ctx, ['key']);
                expect(k).toBe(null);

                // Set
                keyspace.set(ctx, ['key'], 1);

                // Read your writes
                k = await keyspace.get(ctx, ['key']);
                expect(k).toBe(1);
            });

            // Read in ephemeral transaction
            let k2 = await keyspace.get(rootCtx, ['key']);
            expect(k2).toBe(1);

            // Read in rw transaction
            await inTx(rootCtx, async (ctx) => {
                let k = await keyspace.get(ctx, ['key']);
                expect(k).toBe(1);
            });
        }
    });

    it('should clear keys', async () => {
        let keyspaces = await createKeyspaces();
        for (let keyspace of keyspaces) {
            let rootCtx = createNamedContext('test');
            await inTx(rootCtx, async (ctx) => {
                keyspace.set(ctx, ['key'], 1);
            });
            let ex = await keyspace.get(rootCtx, ['key']);
            expect(ex).toBe(1);

            await inTx(rootCtx, async (ctx) => {
                keyspace.clear(ctx, ['key']);
            });
            ex = await keyspace.get(rootCtx, ['key']);
            expect(ex).toBe(null);
        }
    });

    it('should add', async () => {
        let keyspaces = await createKeyspaces();
        for (let keyspace of keyspaces) {
            let rootCtx = createNamedContext('test');
            await inTx(rootCtx, async (ctx) => {
                keyspace.set(ctx, ['key', 1], 1);
            });
            let ex = await keyspace.get(rootCtx, ['key', 1]);
            expect(ex).toBe(1);

            await inTx(rootCtx, async (ctx) => {
                keyspace.add(ctx, ['key', 1], 1);
            });

            ex = await keyspace.get(rootCtx, ['key', 1]);
            expect(ex).toBe(2);

            await inTx(rootCtx, async (ctx) => {
                keyspace.add(ctx, ['key', 1], -3);
            });

            ex = await keyspace.get(rootCtx, ['key', 1]);
            expect(ex).toBe(-1);
        }
    });

    it('should perform bitwise or', async () => {
        let keyspaces = await createKeyspaces();
        for (let keyspace of keyspaces) {
            let rootCtx = createNamedContext('test');
            await inTx(rootCtx, async (ctx) => {
                keyspace.set(ctx, ['key', 1], 0xf);
            });
            let ex = await keyspace.get(rootCtx, ['key', 1]);
            expect(ex).toBe(0xf);

            await inTx(rootCtx, async (ctx) => {
                keyspace.bitOr(ctx, ['key', 1], 0xf0);
            });

            ex = await keyspace.get(rootCtx, ['key', 1]);
            expect(ex).toBe(0xff);
        }
    });

    it('should perform bitwise and', async () => {
        let keyspaces = await createKeyspaces();
        for (let keyspace of keyspaces) {
            let rootCtx = createNamedContext('test');
            await inTx(rootCtx, async (ctx) => {
                keyspace.set(ctx, ['key', 1], 0xff);
            });
            let ex = await keyspace.get(rootCtx, ['key', 1]);
            expect(ex).toBe(0xff);

            await inTx(rootCtx, async (ctx) => {
                keyspace.bitAnd(ctx, ['key', 1], 0xf0);
            });

            ex = await keyspace.get(rootCtx, ['key', 1]);
            expect(ex).toBe(0xf0);
        }
    });

    it('should perform bitwise xor', async () => {
        let keyspaces = await createKeyspaces();
        for (let keyspace of keyspaces) {
            let rootCtx = createNamedContext('test');
            await inTx(rootCtx, async (ctx) => {
                keyspace.set(ctx, ['key', 1], 0xff);
            });
            let ex = await keyspace.get(rootCtx, ['key', 1]);
            expect(ex).toBe(0xff);

            await inTx(rootCtx, async (ctx) => {
                keyspace.bitXor(ctx, ['key', 1], 0x0f);
            });

            ex = await keyspace.get(rootCtx, ['key', 1]);
            expect(ex).toBe(0xf0);
        }
    });

    it('should be equal to same subspaces', async () => {
        let db = await Database.openTest();
        let ksa = db.allKeys
            .withValueEncoding(encoders.int32LE)
            .withKeyEncoding(encoders.tuple)
            .subspace(['1', '3']);
        let ksb = db.allKeys
            .withKeyEncoding(encoders.tuple)
            .subspace(['1'])
            .withValueEncoding(encoders.int32LE)
            .subspace(['3']);
        let rootCtx = createNamedContext('test');
        await inTx(rootCtx, async (ctx) => {
            ksa.set(ctx, ['key'], 1);
        });
        let k = await ksb.get(rootCtx, ['key']);
        expect(k).toBe(1);

        // Nothing else
        let all = await db.allKeys.range(rootCtx, Buffer.of());
        expect(all.length).toBe(1);
        let all2 = await ksa.range(rootCtx, []);
        expect(all2.length).toBe(1);
        let all3 = await ksb.range(rootCtx, []);
        expect(all3.length).toBe(1);
    });

    it('should read all on allKeys must work', async () => {
        let db = await Database.openTest();
        let rootCtx = createNamedContext('test');

        let keyspaces = [
            db.allKeys
                .withKeyEncoding(encoders.tuple)
                .withValueEncoding(encoders.int32LE),
            db.allKeys
                .withKeyEncoding(encoders.tuple)
                .withValueEncoding(encoders.int32LE)
                .subspace(['1'])
        ];
        for (let keyspace of keyspaces) {
            await inTx(rootCtx, async (ctx) => {
                keyspace.clearPrefixed(ctx, []);
            });

            await inTx(rootCtx, async (ctx) => {
                keyspace.set(ctx, ['key'], 1);
            });

            let all = await keyspace.range(rootCtx, []);
            expect(all.length).toBe(1);
            all = await keyspace.range(rootCtx, [], { reverse: true });
            expect(all.length).toBe(1);
            all = await keyspace.range(rootCtx, [], { after: ['aaa'] });
            expect(all.length).toBe(1);
            all = await keyspace.range(rootCtx, [], { reverse: true, after: ['aaa'] });
            expect(all.length).toBe(0);
            all = await keyspace.range(rootCtx, [], { reverse: true, after: ['mmm'] });
            expect(all.length).toBe(1);
            all = await keyspace.range(rootCtx, [], { reverse: false, after: ['mmm'] });
            expect(all.length).toBe(0);
            all = await keyspace.range(rootCtx, [], { reverse: false, after: ['key'] });
            expect(all.length).toBe(0);
            all = await keyspace.range(rootCtx, [], { reverse: false, after: ['ke'] });
            expect(all.length).toBe(1);

            all = await keyspace.range(rootCtx, [], { reverse: true, before: ['aaa'] });
            expect(all.length).toBe(1);
            all = await keyspace.range(rootCtx, [], { reverse: true, before: ['mmm'] });
            expect(all.length).toBe(0);
            all = await keyspace.range(rootCtx, [], { reverse: false, before: ['mmm'] });
            expect(all.length).toBe(1);
            all = await keyspace.range(rootCtx, [], { reverse: false, before: ['key'] });
            expect(all.length).toBe(0);
            all = await keyspace.range(rootCtx, [], { reverse: false, before: ['ke'] });
            expect(all.length).toBe(0);
            all = await keyspace.range(rootCtx, [], { reverse: false, before: ['key1'] });
            expect(all.length).toBe(1);

            await inTx(rootCtx, async (ctx) => {
                keyspace.set(ctx, ['key2'], 1);
            });

            all = await keyspace.range(rootCtx, [], { limit: 1 });
            expect(all.length).toBe(1);
            all = await keyspace.range(rootCtx, [], { reverse: true, limit: 1 });
            expect(all.length).toBe(1);
            all = await keyspace.range(rootCtx, [], { after: ['aaa'], limit: 1 });
            expect(all.length).toBe(1);
            all = await keyspace.range(rootCtx, [], { reverse: true, after: ['aaa'], limit: 1 });
            expect(all.length).toBe(0);
            all = await keyspace.range(rootCtx, [], { reverse: true, after: ['mmm'], limit: 1 });
            expect(all.length).toBe(1);
            all = await keyspace.range(rootCtx, [], { reverse: false, after: ['mmm'], limit: 1 });
            expect(all.length).toBe(0);
        }
    });

    it('should honor after for exact position', async () => {
        let db = await Database.openTest();
        let rootCtx = createNamedContext('test');

        let keyspaces = [
            db.allKeys
                .withKeyEncoding(encoders.tuple)
                .withValueEncoding(encoders.int32LE),
            db.allKeys
                .withKeyEncoding(encoders.tuple)
                .withValueEncoding(encoders.int32LE)
                .subspace(['1'])
        ];

        for (let keyspace of keyspaces) {
            await inTx(rootCtx, async (ctx) => {
                keyspace.set(ctx, [1, 1], 1);
                keyspace.set(ctx, [1, 2], 2);
                keyspace.set(ctx, [1, 3], 3);
                keyspace.set(ctx, [1, 4], 4);
                keyspace.set(ctx, [1, 5], 5);
                keyspace.set(ctx, [1, 6], 6);
                keyspace.set(ctx, [1, 7], 7);
                keyspace.set(ctx, [1, 8], 8);
                keyspace.set(ctx, [1, 9], 9);
                keyspace.set(ctx, [1, 10], 10);
                keyspace.set(ctx, [1, 11], 11);
                keyspace.set(ctx, [1, 12], 12);
            });

            let res = await keyspace.range(rootCtx, [1], { after: [1, 6], limit: 1 });
            expect(res.length).toBe(1);
            expect(res[0].value).toBe(7);

            res = await keyspace.range(rootCtx, [1], { after: [1, 6], limit: 1, reverse: true });
            expect(res.length).toBe(1);
            expect(res[0].value).toBe(5);

            res = await keyspace.range(rootCtx, [1], { after: [1, 12], limit: 1 });
            expect(res.length).toBe(0);

            res = await keyspace.range(rootCtx, [1], { after: [1, 0], limit: 1, reverse: true });
            expect(res.length).toBe(0);

            res = await keyspace.range(rootCtx, [1], { before: [1, 6], limit: 1 });
            expect(res.length).toBe(1);
            expect(res[0].value).toBe(1);

            res = await keyspace.range(rootCtx, [1], { before: [1, 6], limit: 1, reverse: true });
            expect(res.length).toBe(1);
            expect(res[0].value).toBe(12);

            res = await keyspace.range(rootCtx, [1], { before: [1, 12], limit: 1, reverse: true });
            expect(res.length).toBe(0);

            res = await keyspace.range(rootCtx, [1], { before: [1, 0], limit: 1 });
            expect(res.length).toBe(0);
        }
    });

    it('should honor after for prefix position', async () => {
        let db = await Database.openTest();
        let rootCtx = createNamedContext('test');

        let keyspaces = [
            db.allKeys
                .withKeyEncoding(encoders.tuple)
                .withValueEncoding(encoders.int32LE),
            db.allKeys
                .withKeyEncoding(encoders.tuple)
                .withValueEncoding(encoders.int32LE)
                .subspace(['1'])
        ];

        for (let keyspace of keyspaces) {
            await inTx(rootCtx, async (ctx) => {
                keyspace.set(ctx, [1, 1, 1], 1);
                keyspace.set(ctx, [1, 2, 1], 2);
                keyspace.set(ctx, [1, 3, 1], 3);
                keyspace.set(ctx, [1, 4, 1], 4);
                keyspace.set(ctx, [1, 5, 1], 5);
                keyspace.set(ctx, [1, 6, 0], 6);
                keyspace.set(ctx, [1, 6, 1], 6);
                keyspace.set(ctx, [1, 6, 2], 6);
                keyspace.set(ctx, [1, 7, 1], 7);
                keyspace.set(ctx, [1, 8, 1], 8);
                keyspace.set(ctx, [1, 9, 1], 9);
                keyspace.set(ctx, [1, 10, 1], 10);
                keyspace.set(ctx, [1, 11, 1], 11);
                keyspace.set(ctx, [1, 12, 1], 12);
            });

            let res = await keyspace.range(rootCtx, [1], { after: [1, 6], limit: 1 });
            expect(res.length).toBe(1);
            expect(res[0].value).toBe(7);

            res = await keyspace.range(rootCtx, [1], { after: [1, 6], limit: 1, reverse: true });
            expect(res.length).toBe(1);
            expect(res[0].value).toBe(5);

            res = await keyspace.range(rootCtx, [1], { after: [1, 12], limit: 1 });
            expect(res.length).toBe(0);

            res = await keyspace.range(rootCtx, [1], { after: [1, 0], limit: 1, reverse: true });
            expect(res.length).toBe(0);

            res = await keyspace.range(rootCtx, [1], { before: [1, 6], limit: 1 });
            expect(res.length).toBe(1);
            expect(res[0].value).toBe(1);

            res = await keyspace.range(rootCtx, [1], { before: [1, 6], limit: 1, reverse: true });
            expect(res.length).toBe(1);
            expect(res[0].value).toBe(12);

            res = await keyspace.range(rootCtx, [1], { before: [1, 12], limit: 1, reverse: true });
            expect(res.length).toBe(0);

            res = await keyspace.range(rootCtx, [1], { before: [1, 0], limit: 1 });
            expect(res.length).toBe(0);
        }
    });

    it('should return first and last values in ranges', async () => {
        let db = await Database.openTest();
        let rootCtx = createNamedContext('test');

        let keyspaces = [
            db.allKeys
                .withKeyEncoding(encoders.tuple)
                .withValueEncoding(encoders.int32LE),
            db.allKeys
                .withKeyEncoding(encoders.tuple)
                .withValueEncoding(encoders.int32LE)
                .subspace(['1'])
        ];

        for (let keyspace of keyspaces) {
            await inTx(rootCtx, async (ctx) => {
                keyspace.set(ctx, [0, 0, 0], 0);
                keyspace.set(ctx, [1, 1, 1], 1);
                keyspace.set(ctx, [1, 2, 1], 2);
                keyspace.set(ctx, [1, 3, 1], 3);
                keyspace.set(ctx, [1, 4, 1], 4);
                keyspace.set(ctx, [1, 5, 1], 5);
                keyspace.set(ctx, [1, 6, 0], 6);
                keyspace.set(ctx, [1, 6, 1], 6);
                keyspace.set(ctx, [1, 6, 2], 6);
                keyspace.set(ctx, [1, 7, 1], 7);
                keyspace.set(ctx, [1, 8, 1], 8);
                keyspace.set(ctx, [1, 9, 1], 9);
                keyspace.set(ctx, [1, 10, 1], 10);
                keyspace.set(ctx, [1, 11, 1], 11);
                keyspace.set(ctx, [1, 12, 1], 12);
                keyspace.set(ctx, [2, 1, 1], 13);
            });

            let res = await keyspace.range(rootCtx, [], { reverse: true, limit: 1 });
            expect(res.length).toBe(1);
            expect(res[0].value).toBe(13);

            res = await keyspace.range(rootCtx, [], { reverse: false, limit: 1 });
            expect(res.length).toBe(1);
            expect(res[0].value).toBe(0);

            res = await keyspace.range(rootCtx, [1], { reverse: true, limit: 1 });
            expect(res.length).toBe(1);
            expect(res[0].value).toBe(12);

            res = await keyspace.range(rootCtx, [1], { reverse: false, limit: 1 });
            expect(res.length).toBe(1);
            expect(res[0].value).toBe(1);
        }
    });

    it('should clear all', async () => {
        let db = await Database.openTest();
        let rootCtx = createNamedContext('test');

        let keyspaces = [
            db.allKeys
                .withKeyEncoding(encoders.tuple)
                .withValueEncoding(encoders.int32LE),
            db.allKeys
                .withKeyEncoding(encoders.tuple)
                .withValueEncoding(encoders.int32LE)
                .subspace(['1'])
        ];

        for (let keyspace of keyspaces) {
            await inTx(rootCtx, async (ctx) => {
                keyspace.set(ctx, [0, 0, 0], 0);
                keyspace.set(ctx, [1, 1, 1], 1);
                keyspace.set(ctx, [1, 2, 1], 2);
                keyspace.set(ctx, [1, 3, 1], 3);
                keyspace.set(ctx, [1, 4, 1], 4);
                keyspace.set(ctx, [1, 5, 1], 5);
                keyspace.set(ctx, [1, 6, 0], 6);
                keyspace.set(ctx, [1, 6, 1], 6);
                keyspace.set(ctx, [1, 6, 2], 6);
                keyspace.set(ctx, [1, 7, 1], 7);
                keyspace.set(ctx, [1, 8, 1], 8);
                keyspace.set(ctx, [1, 9, 1], 9);
                keyspace.set(ctx, [1, 10, 1], 10);
                keyspace.set(ctx, [1, 11, 1], 11);
                keyspace.set(ctx, [1, 12, 1], 12);
                keyspace.set(ctx, [2, 1, 1], 13);
            });

            await inTx(rootCtx, async (ctx) => {
                keyspace.clearPrefixed(ctx, []);
            });

            let res = await keyspace.range(rootCtx, []);
            expect(res.length).toBe(0);
        }
    });

    it('should clear prefix', async () => {
        let db = await Database.openTest();
        let rootCtx = createNamedContext('test');

        let keyspaces = [
            db.allKeys
                .withKeyEncoding(encoders.tuple)
                .withValueEncoding(encoders.int32LE),
            db.allKeys
                .withKeyEncoding(encoders.tuple)
                .withValueEncoding(encoders.int32LE)
                .subspace(['1'])
        ];

        for (let keyspace of keyspaces) {
            await inTx(rootCtx, async (ctx) => {
                keyspace.set(ctx, [0, 0, 0], 0);
                keyspace.set(ctx, [1, 1, 1], 1);
                keyspace.set(ctx, [1, 2, 1], 2);
                keyspace.set(ctx, [1, 3, 1], 3);
                keyspace.set(ctx, [1, 4, 1], 4);
                keyspace.set(ctx, [1, 5, 1], 5);
                keyspace.set(ctx, [1, 6, 0], 6);
                keyspace.set(ctx, [1, 6, 1], 6);
                keyspace.set(ctx, [1, 6, 2], 6);
                keyspace.set(ctx, [1, 7, 1], 7);
                keyspace.set(ctx, [1, 8, 1], 8);
                keyspace.set(ctx, [1, 9, 1], 9);
                keyspace.set(ctx, [1, 10, 1], 10);
                keyspace.set(ctx, [1, 11, 1], 11);
                keyspace.set(ctx, [1, 12, 1], 12);
                keyspace.set(ctx, [2, 1, 1], 13);
            });

            await inTx(rootCtx, async (ctx) => {
                keyspace.clearPrefixed(ctx, [1]);
            });

            let res = await keyspace.range(rootCtx, []);
            expect(res.length).toBe(2);
        }
    });

    it('should correcrly write versionstamp key', async () => {
        let db = await Database.openTest();
        let rootCtx = createNamedContext('test');

        // Write versionstamp
        await inTx(rootCtx, async (ctx) => {
            db.allKeys.setVersionstampedKey(ctx, Buffer.from('prefix', 'ascii'), Buffer.from('value', 'ascii'), Buffer.from('suffix', 'ascii'));
        });

        let keys = await inTx(rootCtx, async (ctx) => {
            return await db.allKeys.range(ctx, Buffer.alloc(0));
        });
        expect(keys.length).toBe(1);
        expect(keys[0].key.length).toBe('prefix'.length + 10 + 'suffix'.length);
        expect(Buffer.compare(Buffer.from('prefix', 'ascii'), keys[0].key.subarray(0, 'prefix'.length)));
        expect(Buffer.compare(Buffer.from('suffix', 'ascii'), keys[0].key.subarray('prefix'.length + 10)));
    });

    it('should correcrly write tuple key/value', async () => {
        let db = await Database.openTest();
        let rootCtx = createNamedContext('test');

        let keyspaces = [
            db.allKeys
                .withKeyEncoding(encoders.tuple)
                .withValueEncoding(encoders.int32LE),
            db.allKeys
                .withKeyEncoding(encoders.tuple)
                .withValueEncoding(encoders.int32LE)
                .subspace(['1'])
        ];

        for (let keyspace of keyspaces) {
            await inTx(rootCtx, async (ctx) => {
                keyspace.setTupleKey(ctx, [1, 2, 3], 1);
                keyspace.setTupleKey(ctx, [1, 2, '!'], 2);
            });

            await inTx(rootCtx, async (ctx) => {
                expect(await keyspace.get(ctx, [1, 2, 3])).toBe(1);
                expect(await keyspace.get(ctx, [1, 2, '!'])).toBe(2);
            });
        }
    });

    it('should correcrly write tuple with versionstamp key/value', async () => {
        let db = await Database.openTest();
        let rootCtx = createNamedContext('test');

        let keyspaces = [
            db.allKeys
                .withKeyEncoding(encoders.tuple)
                .withValueEncoding(encoders.int32LE),
            db.allKeys
                .withKeyEncoding(encoders.tuple)
                .withValueEncoding(encoders.int32LE)
                .subspace(['1'])
        ];

        for (let keyspace of keyspaces) {
            let vts = await inTx(rootCtx, async (ctx) => {
                let vt1 = createVersionstampRef(ctx);
                let vt2 = createVersionstampRef(ctx);
                keyspace.setTupleKey(ctx, [1, 2, vt1, 3], 1);
                keyspace.setTupleKey(ctx, [1, 2, vt2, 3], 2);
                return { vt1, vt2 };
            });
            expect(vts.vt1.resolved).not.toBeFalsy();
            expect(vts.vt2.resolved).not.toBeFalsy();

            await inTx(rootCtx, async (ctx) => {
                let r = await keyspace.range(ctx, [1, 2]);
                expect(r.length).toBe(2);
                expect(r[0].value).toBe(1);
                expect(r[1].value).toBe(2);
                expect(r[0].key[0]).toBe(1);
                expect(r[0].key[1]).toBe(2);
                expect(r[0].key[2] instanceof Versionstamp).toBe(true);
                expect(r[1].key[3]).toBe(3);
                expect(r[1].key[0]).toBe(1);
                expect(r[1].key[1]).toBe(2);
                expect(r[1].key[2] instanceof Versionstamp).toBe(true);
                expect(r[1].key[3]).toBe(3);
            });
        }
    });
});