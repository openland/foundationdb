import { Context } from '@openland/context';
import { RangeOptions } from './Subspace';

interface SubspaceTracerConfig {
    get<T>(ctx: Context, key: Buffer, handler: () => Promise<T>): Promise<T>;
    set<T>(ctx: Context, key: Buffer, value: Buffer, handler: () => T): T;
    range<T>(ctx: Context, key: Buffer, opts: RangeOptions<Buffer>|undefined, handler: () => Promise<T>): Promise<T>;
}

const NoopTracer: SubspaceTracerConfig = {
    get: async (ctx, key, handler) => handler(),
    set: (ctx, key, value, handler) => handler(),
    range: async (ctx, key, opts, handler) => handler()
};

export let SubspaceTracer = NoopTracer;

export function setSubspaceTracer(tracer: SubspaceTracerConfig) {
    SubspaceTracer = tracer;
}