import { Context } from '@openland/context';
import { inTx } from './inTx';

export async function runInBatch<T>(parent: Context, tasks: ((c: Context) => Promise<T>)[]): Promise<T[]> {
    let res: T[];
    try {
        res = await inTx(parent, async (ctx) => {
            let executions: Promise<T>[] = [];
            for (let t of tasks) {
                executions.push(t(ctx));
            }
            return Promise.all(executions);
        });
    } catch (e) {
        throw e;
    }
    return res;
}