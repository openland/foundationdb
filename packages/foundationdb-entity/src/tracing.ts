import { Context } from '@openland/context';
import { EntityDescriptor, SecondaryIndexDescriptor } from './EntityDescriptor';
import { PrimaryKeyType } from './PrimaryKeyType';
import { ShapeWithMetadata } from './ShapeWithMetadata';
import { Subspace, TupleItem } from '@openland/foundationdb';

interface EntityFactoryTracerConfig {
    findFromUniqueIndex<T>(entityDescriptor: EntityDescriptor<any>, ctx: Context, id: (PrimaryKeyType | null)[], descriptor: SecondaryIndexDescriptor, handler: () => Promise<T>): Promise<T>;

    query<T>(
        entityDescriptor: EntityDescriptor<any>,
        ctx: Context,
        descriptor: SecondaryIndexDescriptor,
        id: (PrimaryKeyType | null)[],
        opts: {
            limit?: number | undefined | null,
            reverse?: boolean | undefined | null,
            after?: (PrimaryKeyType | null)[] | undefined | null,
            afterCursor?: string | undefined | null
        } | undefined,
        handler: () => Promise<{ items: T[], cursor?: string, haveMore: boolean }>
    ): Promise<{ items: T[], cursor?: string, haveMore: boolean }>;

    findAll<T>(entityDescriptor: EntityDescriptor<any>, ctx: Context, handler: () => Promise<T[]>): Promise<T[]>;

    findById<T>(entityDescriptor: EntityDescriptor<any>, ctx: Context, id: PrimaryKeyType[], handler: () => Promise<T>): Promise<T>;

    create<T>(entityDescriptor: EntityDescriptor<any>, ctx: Context, id: PrimaryKeyType[], value: any, handler: () => Promise<T>): Promise<T>;

    flush<T>(entityDescriptor: EntityDescriptor<any>, ctx: Context, id: ReadonlyArray<PrimaryKeyType>, oldValue: ShapeWithMetadata<any>, newValue: ShapeWithMetadata<any>, handler: () => Promise<T>): Promise<T>;
}

const NoopEntityFactoryTracer: EntityFactoryTracerConfig = {
    findFromUniqueIndex: (entityDescriptor, ctx, id, descriptor, handler) => handler(),
    query: (entityDescriptor, ctx, descriptor, id, opts, handler) => handler(),
    findAll: (entityDescriptor, ctx, handler) => handler(),
    findById: (entityDescriptor, ctx, id, handler) => handler(),
    create: (entityDescriptor, ctx, id, value, handler) => handler(),
    flush: (entityDescriptor, ctx, id, oldValue, newValue, handler) => handler()
};

export let EntityFactoryTracer = NoopEntityFactoryTracer;

/**
 * Sets entity-factory-tracer which allows to trace entity-factory operations
 *
 * @param tracer
 */
export function setEntityFactoryTracer(tracer: EntityFactoryTracerConfig) {
    EntityFactoryTracer = tracer;
}

interface AtomicBooleanFactoryTracerConfig {
    get<T>(directory: Subspace, ctx: Context, key: TupleItem[], handler: () => Promise<T>): Promise<T>;
    set<T>(directory: Subspace, ctx: Context, key: TupleItem[], value: boolean, handler: () => T): T;
}

const NoopAtomicBooleanFactoryTracerConfig: AtomicBooleanFactoryTracerConfig = {
    get: (directory, ctx, key, handler) => handler(),
    set: (directory, ctx, key, value, handler) => handler()
};

export let AtomicBooleanFactoryTracer = NoopAtomicBooleanFactoryTracerConfig;

/**
 * Sets boolean-atomic-factory-tracer which allows to trace boolean-atomic-factory operations
 *
 * @param tracer
 */
export function seAtomicBooleanFactoryTracer(tracer: AtomicBooleanFactoryTracerConfig) {
    AtomicBooleanFactoryTracer = tracer;
}

interface AtomicIntegerFactoryTracerConfig {
    get<T>(directory: Subspace, ctx: Context, key: TupleItem[], handler: () => Promise<T>): Promise<T>;
    set<T>(directory: Subspace, ctx: Context, key: TupleItem[], value: number, handler: () => T): T;
}

const NoopAtomicIntegerFactoryTracerConfig: AtomicIntegerFactoryTracerConfig = {
    get: (directory, ctx, key, handler) => handler(),
    set: (directory, ctx, key, value, handler) => handler()
};

export let AtomicIntegerFactoryTracer = NoopAtomicIntegerFactoryTracerConfig;

/**
 * Sets integer-atomic-factory-tracer which allows to trace integer-atomic-factory operations
 *
 * @param tracer
 */
export function seAtomicIntegerFactoryTracer(tracer: AtomicIntegerFactoryTracerConfig) {
    AtomicIntegerFactoryTracer = tracer;
}