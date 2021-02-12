import { encoders } from './encoding';
import { copySubspace, deleteMissing } from './operations';
import { createNamedContext } from '@openland/context';
import { isSubspaceEquals } from './operations';
import { Database, inTx, inReadOnlyTx } from './';

describe('operations', () => {

    let db: Database;
    beforeAll(async () => {
        db = await Database.openTest();
    });

    it('should copy subspaces', async () => {
        jest.setTimeout(30000);

        let parent = createNamedContext('copy');

        let from = await db.directories.createOrOpen(parent, ['from']);
        let to = await db.directories.createOrOpen(parent, ['to']);

        // Preconditions
        let data = await inReadOnlyTx(parent, async (ctx) => (await to.range(ctx, Buffer.of())));
        expect(data.length).toBe(0);
        data = (await inReadOnlyTx(parent, async (ctx) => from.range(ctx, Buffer.of())));
        expect(data.length).toBe(0);
        expect(await isSubspaceEquals(parent, to, from)).toBeTruthy();

        // Prefill
        await inTx(parent, async (ctx) => {
            for (let i = 0; i < 20000; i++) {
                from.set(ctx, encoders.tuple.pack([i]), encoders.json.pack({ v: i }));
            }
        });
        expect(await isSubspaceEquals(parent, to, from)).toBeFalsy();

        // Copy
        await copySubspace(parent, from, to);

        // Check results
        data = (await inReadOnlyTx(parent, async (ctx) => to.range(ctx, Buffer.of())));
        expect(data.length).toBe(20000);
        for (let i = 0; i < 20000; i++) {
            expect(Buffer.compare(data[i].value, encoders.json.pack({ v: i }))).toBe(0);
            expect(Buffer.compare(data[i].key, encoders.tuple.pack([i]))).toBe(0);
        }
        expect(await isSubspaceEquals(parent, to, from)).toBeTruthy();

        //
        // Second pass
        //

        await inTx(parent, async (ctx) => {
            for (let i = 20000; i < 40000; i++) {
                from.set(ctx, encoders.tuple.pack([i]), encoders.json.pack({ v: i }));
            }
        });
        expect(await isSubspaceEquals(parent, to, from)).toBeFalsy();

        // Copy
        await copySubspace(parent, from, to);

        // Check results
        data = (await inReadOnlyTx(parent, async (ctx) => to.range(ctx, Buffer.of())));
        expect(data.length).toBe(40000);
        for (let i = 0; i < 40000; i++) {
            expect(Buffer.compare(data[i].value, encoders.json.pack({ v: i }))).toBe(0);
            expect(Buffer.compare(data[i].key, encoders.tuple.pack([i]))).toBe(0);
        }
        expect(await isSubspaceEquals(parent, to, from)).toBeTruthy();

        //
        // Deletion
        //
        await inTx(parent, async (ctx) => {
            from.clear(ctx, encoders.tuple.pack([0]));
        });
        expect(await isSubspaceEquals(parent, to, from)).toBeFalsy();
        await deleteMissing(parent, from, to);
        expect(await isSubspaceEquals(parent, to, from)).toBeTruthy();
    });
});