import { Context } from '@openland/context';
import { ReadOnlyTransactionContext } from './impl/TransactionContext';
import { ReadOnlyTransaction } from './impl/ReadOnlyTransaction';

/**
 * Add Read-Only transaction to provided context. 
 * If context already have read only transaction function will not change context.
 * 
 * @param ctx context
 */
export function withReadOnlyTransaction(ctx: Context): Context {
    let ex = ReadOnlyTransactionContext.get(ctx);
    if (ex) {
        return ctx;
    }

    let cache = new ReadOnlyTransaction(false);
    ctx = ReadOnlyTransactionContext.set(ctx, cache);
    return ctx;
}