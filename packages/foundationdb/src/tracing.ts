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
    txIteration<T>(ctx: Context, handler: (ctx: Context) => Promise<T>): Promise<T>;
    commit<T>(ctx: Context, handler: (ctx: Context) => Promise<T>): Promise<T>;
    commitPreHook(ctx: Context, handler: (ctx: Context) => Promise<void>): Promise<void>;
    commitFDB(ctx: Context, handler: (ctx: Context) => Promise<void>): Promise<void>;
    commitPostHook(ctx: Context, handler: (ctx: Context) => Promise<void>): Promise<void>;
    onTx(ctx: Context): void;
    onRetry(ctx: Context): void;
    onError(ctx: Context, error: any): void;
    onFDBError(ctx: Context, error: FDBError): void;
}

const NoopTransactionTracer: TransactionTracerConfig = {
    tx: async (ctx, handler) => handler(ctx),
    txIteration: async (ctx, handler) => handler(ctx),
    commit: async (ctx, handler) => handler(ctx),
    commitPreHook: async (ctx, handler) => handler(ctx),
    commitFDB: async (ctx, handler) => handler(ctx),
    commitPostHook: async (ctx, handler) => handler(ctx),
    onTx: () => {
        // Noop
    },
    onRetry: () => {
        // Noop
    },
    onError: (ctx: Context, error: any) => {
        // Noop
    },
    onFDBError: (ctx: Context, error: FDBError) => {
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