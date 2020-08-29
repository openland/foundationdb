import { TransactionContext, ReadOnlyTransactionContext } from './impl/TransactionContext';
import { Context } from '@openland/context';
import { withReadOnlyTransaction } from './withReadOnlyTransaction';

export async function inReadOnlyTx<T>(ctx: Context, callback: (ctx: Context) => Promise<T>): Promise<T> {
    let tx = TransactionContext.get(ctx);
    if (tx) {
        return callback(ctx);
    }
    let cache = ReadOnlyTransactionContext.get(ctx);
    if (cache) {
        return callback(ctx);
    }

    let child = withReadOnlyTransaction(ctx);
    return callback(child);
}