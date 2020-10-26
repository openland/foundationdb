import { Context } from '@openland/context';
import { getTransaction } from './getTransaction';

export function createVersionstampRef(ctx: Context) {
    let tx = getTransaction(ctx);
    let res = tx.allocateVersionstampRef();
    // tslint:disable-next-line:no-floating-promises
    (async () => {
        try {
            let vt = await tx.getVersionstamp();
            res.resolve(vt);
        } catch (e) {
            // Ignore
        }
    })();
    return res;
}