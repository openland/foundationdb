import { TransactionContext } from './impl/TransactionContext';
import { FDBError } from '@openland/foundationdb-core';
import { Context } from '@openland/context';
import { ReadWriteTransaction } from './impl/ReadWriteTransaction';

async function doInTx<T>(leaky: boolean, ctx: Context, callback: (ctx: Context) => Promise<T>): Promise<T> {
    let ex = TransactionContext.get(ctx);
    if (ex) {
        if (!leaky) {
            // Flush all pending operations to avoid nasty bugs during composing of transactions
            await ex!._flushPending(ctx);
        }
        let res = await callback(ctx);
        if (!leaky) {
            // Flush all pending operations to avoid nasty bugs during composing of transactions
            await ex!._flushPending(ctx);
        }
        return res;
    }

    // Implementation is copied from database.js from foundationdb library.
    do {
        let tx = new ReadWriteTransaction();
        let ctxi = TransactionContext.set(ctx, tx);
        try {
            const result = await callback(ctxi);
            await tx._commit(ctxi);
            return result;
        } catch (err) {
            if (err instanceof FDBError) {
                await tx._handleError(err.code);
            } else {
                throw err;
            }
        }
    } while (true);
}

/**
 * Performing transaction. Transactions can be nested.
 * 
 * Example:
 * ```
 * await inTx(rootContext, async (ctx) => {
 *     ....
 *     await inTx(ctx, async (innerCtx) => {
 *         ....
 *     });
 *     ....
 * })
 * ```
 * @param ctx Context
 * @param callback transaction body
 */
export async function inTx<T>(ctx: Context, callback: (ctx: Context) => Promise<T>): Promise<T> {
    return doInTx(false, ctx, callback);
}

/**
 * Performing transaction without strict guarantees. 
 * Use only if you can guarantee that data wouldn't be corrupted if changes won't flushed 
 * between inner transactions.
 * 
 * @param ctx context
 * @param callback transaction body
 */
export async function inTxLeaky<T>(ctx: Context, callback: (ctx: Context) => Promise<T>): Promise<T> {
    return doInTx(true, ctx, callback);
}