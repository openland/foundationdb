import { createNamedContext } from '@openland/context';
import { Database, inTx } from '@openland/foundationdb';
import { findAllDirectories } from './findAllDirectories';

describe('findAllDirectories', () => {
    it('should list all directories', async () => {
        const rootCtx = createNamedContext('test');
        const db = await Database.openTest();
        await inTx(rootCtx, async (ctx) => {
            await db.directories.createOrOpen(ctx, ['test.dir', 'dir1']);
            await db.directories.createOrOpen(ctx, ['test.dir', 'dir2']);
            await db.directories.createOrOpen(ctx, ['test.dir2']);
        });
        let dirs = await findAllDirectories(rootCtx, db);
        expect(dirs.map((d) => d.path)).toMatchObject([['test.dir'], ['test.dir', 'dir1'], ['test.dir', 'dir2'], ['test.dir2']])
    });
});