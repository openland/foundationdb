import { FDBError } from 'foundationdb';
import { Context } from '@openland/context';
import { RangeOptions } from './Subspace';

interface SubspaceTracerConfig {
    get<T>(ctx: Context, key: Buffer, handler: () => Promise<T>): Promise<T>;
    set<T>(ctx: Context, key: Buffer, value: Buffer, handler: () => T): T;
    range<K, V>(ctx: Context, key: Buffer, opts: RangeOptions<Buffer> | undefined, handler: () => Promise<{ key: K, value: V }[]>): Promise<{ key: K, value: V }[]>;
}

const NoopSubspaceTracer: SubspaceTracerConfig = {
    get: async (ctx, key, handler) => handler(),
    set: (ctx, key, value, handler) => handler(),
    range: async (ctx, key, opts, handler) => handler()
};

export let SubspaceTracer = NoopSubspaceTracer;

/**
 * Sets subspace-tracer which allows to trace basic subspace operations
 *
 * @param tracer implementation
 */
export function setSubspaceTracer(tracer: SubspaceTracerConfig) {
    SubspaceTracer = tracer;
}

interface TransactionTracerConfig {
    tx<T>(ctx: Context, handler: (ctx: Context) => Promise<T>): Promise<T>;
    commit<T>(ctx: Context, handler: () => Promise<T>): Promise<T>;
    onNewReadWriteTx(ctx: Context): void;
    onRetry(ctx: Context): void;
    onFDBError(ctx: Context, error: FDBError): void;
    onNewEphemeralTx(ctx: Context): void;
}

const NoopTransactionTracer: TransactionTracerConfig = {
    tx: async (ctx, handler) => handler(ctx),
    commit: async (ctx, handler) => handler(),
    onNewReadWriteTx: () => {
        // Noop
    },
    onRetry: () => {
        // Noop
    },
    onFDBError: (ctx: Context, error: FDBError) => {
        // Noop
    },
    onNewEphemeralTx: () => {
        // Noop
    }
};

export let TransactionTracer = NoopTransactionTracer;

/**
 * Sets transaction-tracer which allows to trace transactions and errors in them
 *
 * @param tracer implementation
 */
export function setTransactionTracer(tracer: TransactionTracerConfig) {
    TransactionTracer = tracer;
}