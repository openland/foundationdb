import { WriteToReadOnlyContextError } from './WriteToReadOnlyContextError';
import { TransactionImpl } from './impl/TransactionImpl';
import { TransactionContext } from './impl/TransactionContext';
import { FDBError } from 'foundationdb';
import { Context } from '@openland/context';
import { TransactionTracer } from './tracing';
import { PriorityContext } from './impl/PriorityContext';

async function doInTx<T>(type: 'rw' | 'ro' | 'hybrid', _ctx: Context, callback: (ctx: Context) => Promise<T>): Promise<T> {
    let ex = TransactionContext.get(_ctx);
    if (ex) {
        return await callback(_ctx);
    }

    return await TransactionTracer.tx(_ctx, async (ctx) => {
        // Implementation is copied from database.js from foundationdb library.
        let switchToWrite = false;
        const priority = PriorityContext.get(ctx);
        let tx = TransactionImpl.createTransaction(type === 'ro' ? true : (type === 'hybrid' ? true : false), type === 'hybrid', priority);
        let error: FDBError | null = null;
        do {
            const ctxi = TransactionContext.set(ctx, tx);
            TransactionTracer.onTx(ctx);
            try {
                return await TransactionTracer.txIteration(ctxi, async (ctx2) => {
                    const result = await callback(ctx2);
                    await TransactionTracer.commit(ctx2, async (ctx3) => {
                        await tx.commit(ctx3);
                    });
                    return result;
                });
            } catch (err) {
                TransactionTracer.onError(ctx, err);
                if (err instanceof FDBError) {
                    error = err;
                    TransactionTracer.onFDBError(ctx, err);
                    await tx.handleError(err.code);
                } else if (err instanceof WriteToReadOnlyContextError) {
                    if (type === 'hybrid') {
                        switchToWrite = true;
                        error = null;
                    } else {
                        throw err;
                    }
                } else {
                    throw err;
                }
            }
            tx = tx.derive(type === 'ro' ? true : (type === 'hybrid' ? !switchToWrite : false), type === 'hybrid', error);
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
    return doInTx('rw', ctx, callback);
}

/**
 * Performing read only transaction. All inner transactuions would be also read only.
 * 
 * @param ctx Context
 * @param callback transaction body
 */
export async function inReadOnlyTx<T>(ctx: Context, callback: (ctx: Context) => Promise<T>): Promise<T> {
    return doInTx('ro', ctx, callback);
}

/**
 * Special kind of transaction. Initialy tries to perform a read only transaction. Once write has been detected - it automatically restarts in write mode.
 * Useful for code that often have getOrCreate operations while essentially just reading.
 * 
 * @param ctx Context
 * @param callback transaction body
 */
export async function inHybridTx<T>(ctx: Context, callback: (ctx: Context) => Promise<T>): Promise<T> {
    return doInTx('hybrid', ctx, callback);
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
}