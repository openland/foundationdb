import { Context } from '@openland/context';
import { AtomicInteger } from './AtomicInteger';
import { TupleItem, Subspace, encoders } from '@openland/foundationdb';
import { EntityStorage } from './EntityStorage';
import { AtomicIntegerFactoryTracer } from './tracing';

export abstract class AtomicIntegerFactory {

    readonly storage: EntityStorage;
    readonly directory: Subspace;

    protected constructor(storage: EntityStorage, subspace: Subspace) {
        this.storage = storage;
        this.directory = subspace;
    }

    protected _findById(key: TupleItem[]) {
        return new AtomicInteger(encoders.tuple.pack(key), this.directory);
    }

    protected async _get(ctx: Context, key: TupleItem[]) {
        return await AtomicIntegerFactoryTracer.get(this.directory, ctx, key, () => {
            return this._findById(key).get(ctx);
        });
    }

    protected async _snapshotGet(ctx: Context, key: TupleItem[]) {
        return await AtomicIntegerFactoryTracer.get(this.directory, ctx, key, () => {
            return this._findById(key).snapshotGet(ctx);
        });
    }

    protected _set(ctx: Context, key: TupleItem[], value: number) {
        return AtomicIntegerFactoryTracer.set(this.directory, ctx, key, value, () => {
            return this._findById(key).set(ctx, value);
        });
    }

    protected _add(ctx: Context, key: TupleItem[], value: number) {
        this._findById(key).add(ctx, value);
    }

    protected _increment(ctx: Context, key: TupleItem[]) {
        this._findById(key).increment(ctx);
    }

    protected _decrement(ctx: Context, key: TupleItem[]) {
        this._findById(key).decrement(ctx);
    }
}