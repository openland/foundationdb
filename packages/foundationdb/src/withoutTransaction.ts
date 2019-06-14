import { Context } from '@openland/context';
import { TransactionContext, ReadOnlyTransactionContext } from './impl/TransactionContext';

/**
 * Removing transaction information from context. 
 * 
 * Useful if you don't want to create new empty context and 
 * keep other context state.
 * 
 * @param ctx context
 */
export function withoutTransaction(ctx: Context) {
    let res = ctx;
    res = TransactionContext.set(res, null);
    res = ReadOnlyTransactionContext.set(res, null);
    return res;
}