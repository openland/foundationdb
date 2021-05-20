import { Context } from '@openland/context';
import { EntityStorage } from './EntityStorage';
import { AtomicBoolean } from './AtomicBoolean';
import { TupleItem, Subspace, encoders } from '@openland/foundationdb';
import { AtomicBooleanFactoryTracer } from './tracing';

export abstract class AtomicBooleanFactory {

    readonly storage: EntityStorage;
    readonly directory: Subspace;

    protected constructor(storage: EntityStorage, subspace: Subspace) {
        this.storage = storage;
        this.directory = subspace;
    }

    protected _findById(key: TupleItem[]) {
        return new AtomicBoolean(encoders.tuple.pack(key), this.directory);
    }

    protected async _get(ctx: Context, key: TupleItem[]) {
        return await AtomicBooleanFactoryTracer.get(this.directory, ctx, key, () => {
            return this._findById(key).get(ctx);
        });
    }

    protected async _snapshotGet(ctx: Context, key: TupleItem[]) {
        return await AtomicBooleanFactoryTracer.get(this.directory, ctx, key, () => {
            return this._findById(key).snapshotGet(ctx);
        });
    }

    protected _set(ctx: Context, key: TupleItem[], value: boolean) {
        return AtomicBooleanFactoryTracer.set(this.directory, ctx, key, value, () => {
            this._findById(key).set(ctx, value);
        });
    }

    protected _invert(ctx: Context, key: TupleItem[]) {
        this._findById(key).invert(ctx);
    }
}