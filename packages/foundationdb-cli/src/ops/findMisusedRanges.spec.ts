import { createNamedContext } from '@openland/context';
import { Database, inTx } from '@openland/foundationdb';
import { findMisusedRanges } from './findMisusedRanges';

describe('findMisusedRanges', () => {
    it('should find all misused ranges', async () => {
        const rootCtx = createNamedContext('test');
        const db = await Database.openTest();
        await inTx(rootCtx, async (ctx) => {
            db.allKeys.set(ctx, Buffer.from([10]), Buffer.from([]));
            db.allKeys.set(ctx, Buffer.from([0]), Buffer.from([]));
            db.allKeys.set(ctx, Buffer.from([24]), Buffer.from([]));
        });

        const misused = await inTx(rootCtx, async (ctx) => {
            return await findMisusedRanges(ctx, [Buffer.from([1]), Buffer.from([20])], db.allKeys);
        });

        console.warn(misused);

        // await inTx(rootCtx, async (ctx) => {
        //     await db.directories.createOrOpen(ctx, ['test.dir', 'dir1']);
        //     await db.directories.createOrOpen(ctx, ['test.dir', 'dir2']);
        //     await db.directories.createOrOpen(ctx, ['test.dir2']);
        // });
        // let dirs = await findAllDirectories(rootCtx, db);
        // expect(dirs.map((d) => d.path)).toMatchObject([['test.dir'], ['test.dir', 'dir1'], ['test.dir', 'dir2'], ['test.dir2']])
    });
});