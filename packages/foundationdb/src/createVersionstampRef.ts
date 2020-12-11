import { VersionstampRef } from '@openland/foundationdb-tuple';
import { TransactionCache } from './TransactionCache';
import { Context } from '@openland/context';
import { getTransaction } from './getTransaction';

const cacheVtResolve = new TransactionCache<VersionstampRef[]>('vt-resolve');

export function createVersionstampRef(ctx: Context) {
    let tx = getTransaction(ctx);
    let res = tx.allocateVersionstampRef();

    let cached = cacheVtResolve.get(ctx, 'all');
    if (!cached) {
        let c = [res];
        cacheVtResolve.set(ctx, 'all', c);
        let vtt = tx.getVersionstamp();
        tx.afterCommit(async () => {
            let vt = await vtt;
            for (let vtc of c) {
                vtc.resolve(vt);
            }
        });
    } else {
        cached.push(res);
    }

    return res;
}