import { TransactionContext } from './impl/TransactionContext';
import { FDBError } from 'foundationdb';
import { Context } from '@openland/context';
import { ReadWriteTransaction } from './impl/ReadWriteTransaction';
import { TransactionTracer } from './tracing';

async function doInTx<T>(leaky: boolean, _ctx: Context, callback: (ctx: Context) => Promise<T>): Promise<T> {
    return await TransactionTracer.tx(_ctx, async (ctx) => {
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
            TransactionTracer.onNewReadWriteTx(ctx);
            let tx = new ReadWriteTransaction();
            let ctxi = TransactionContext.set(ctx, tx);
            try {
                const result = await callback(ctxi);
                await TransactionTracer.commit(ctx, async () => {
                    await tx._commit(ctxi);
                });
                return result;
            } catch (err) {
                if (err instanceof FDBError) {
                    TransactionTracer.onFDBError(ctx, err);
                    await tx._handleError(err.code);
                } else {
                    throw err;
                }
            }
            TransactionTracer.onRetry(ctx);
        } while (true);
    });
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