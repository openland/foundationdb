import { Context } from '@openland/context';
import { TransactionContext, ReadOnlyTransactionContext } from './impl/TransactionContext';

export function withoutTransaction(ctx: Context) {
    let res = ctx;
    res = TransactionContext.set(res, null);
    res = ReadOnlyTransactionContext.set(res, null);
    return res;
}