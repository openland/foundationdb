import { Context } from '@openland/context';
import { ReadOnlyTransactionContext } from './impl/TransactionContext';
import { ReadOnlyTransaction } from './impl/ReadOnlyTransaction';

export function withReadOnlyTransaction(ctx: Context): Context {
    let ex = ReadOnlyTransactionContext.get(ctx);
    if (ex) {
        return ctx;
    }

    let cache = new ReadOnlyTransaction();
    ctx = ReadOnlyTransactionContext.set(ctx, cache);
    return ctx;
}