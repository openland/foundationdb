import { Context } from '@openland/context';
import { TransactionContext } from './impl/TransactionContext';
import { Transaction } from './Transaction';

/**
 * Get Transaction from current context or create a temporary read-only one.
 * @param ctx context
 */
export function getTransaction(ctx: Context): Transaction {
    let tx = TransactionContext.get(ctx);
    if (tx) {
        return tx;
    }
    throw Error('No transaction in context');
}