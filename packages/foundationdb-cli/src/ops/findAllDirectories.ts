import { Context } from '@openland/context';
import { Database, inTx } from '@openland/foundationdb';

export async function findAllDirectories(rootCtx: Context, db: Database) {
    async function readDirectory(parent: string[]): Promise<{ path: string[], key: Buffer }[]> {
        let dirs = await inTx(rootCtx, async (ctx) => {
            return await db.directories.listAll(ctx, parent.length > 0 ? parent : undefined);
        });
        let res: { path: string[], key: Buffer }[] = [];
        if (parent.length > 0) {
            const prefix = await inTx(rootCtx, async (ctx) => {
                return (await db.directories.open(ctx, parent)).prefix;
            });
            res.push({ path: parent, key: prefix });
        }
        for (let d of dirs) {
            res = [...res, ...await readDirectory([...parent, d])];
        }
        return res;
    }
    const allDirectories = await readDirectory([]);
    return allDirectories;
}