import { Context } from '@openland/context';
import { inTx, keyNext, getTransaction, Database } from '@openland/foundationdb';

export async function getBoundaryKeys(rootCtx: Context, db: Database, begin: Buffer, end: Buffer) {
    let currentBegin = begin;
    let keys: Buffer[] = [];
    await inTx(rootCtx, async (ctx) => {
        getTransaction(ctx).setOptions({ read_system_keys: true, lock_aware: true });
        let tx = getTransaction(ctx).rawWriteTransaction(db);

        let start = Buffer.concat([Buffer.of(0xff), Buffer.from('/keyServers/'), currentBegin]);
        let stop = Buffer.concat([Buffer.of(0xff), Buffer.from('/keyServers/'), end]);
        for await (const [key, value] of tx.getRange(start, stop)) {
            currentBegin = keyNext(key).subarray(13);
            keys.push(currentBegin);
        }
    });
    return keys;
}