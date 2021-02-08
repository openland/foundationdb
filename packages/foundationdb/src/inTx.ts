import { TransactionContext, ReadOnlyTransactionContext } from './impl/TransactionContext';
import { FDBError } from 'foundationdb';
import { Context } from '@openland/context';
import { ReadWriteTransaction } from './impl/ReadWriteTransaction';
import { TransactionTracer } from './tracing';

async function doInTx<T>(_ctx: Context, callback: (ctx: Context) => Promise<T>): Promise<T> {
    let ex = TransactionContext.get(_ctx);
    if (ex) {
        return await callback(_ctx);
    }

    return await TransactionTracer.tx(_ctx, async (ctx) => {
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
    return doInTx(ctx, callback);
}

/**
 * Helper method to assert non-transactional context
 * @param ctx context
 */
export function assertNoTransaction(ctx: Context) {
    let ex = TransactionContext.get(ctx);
    if (ex) {
        throw Error('This context must be without transaction');
    }
    let rex = ReadOnlyTransactionContext.get(ctx);
    if (rex) {
        throw Error('This context must be without transaction');
    }
}