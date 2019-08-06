import { ReadOnlyTransaction } from './impl/ReadOnlyTransaction';
import { Context } from '@openland/context';
import { TransactionContext, ReadOnlyTransactionContext } from './impl/TransactionContext';
import { Transaction } from './Transaction';
import { TransactionTracer } from './tracing';

/**
 * Get Transaction from current context or create a temporary read-only one.
 * @param ctx context
 */
export function getTransaction(ctx: Context): Transaction {
    let tx = TransactionContext.get(ctx);
    if (tx) {
        return tx;
    }
    let cache = ReadOnlyTransactionContext.get(ctx);
    if (cache) {
        return cache;
    }

    TransactionTracer.onNewEphemeralTx(ctx);
    return new ReadOnlyTransaction(true);
}