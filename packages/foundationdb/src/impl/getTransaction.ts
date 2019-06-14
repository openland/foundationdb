import { Context } from '@openland/context';
import { TransactionContext, ReadOnlyTransactionContext } from './TransactionContext';
import { Transaction } from '../Transaction';

export function getTransaction(ctx: Context): Transaction | null {
    let tx = TransactionContext.get(ctx);
    if (tx) {
        return tx;
    }
    let cache = ReadOnlyTransactionContext.get(ctx);
    if (cache) {
        return cache;
    }

    return null;
}