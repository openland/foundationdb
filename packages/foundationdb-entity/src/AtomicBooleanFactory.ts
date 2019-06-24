import { Context } from '@openland/context';
import { EntityStorage } from './EntityStorage';
import { AtomicBoolean } from './AtomicBoolean';
import { Tuple, Subspace, encoders } from '@openland/foundationdb';

export abstract class AtomicBooleanFactory {

    readonly storage: EntityStorage;
    readonly directory: Subspace;

    protected constructor(storage: EntityStorage, subspace: Subspace) {
        this.storage = storage;
        this.directory = subspace;
    }

    protected _findById(key: Tuple[]) {
        return new AtomicBoolean(encoders.tuple.pack(key), this.directory);
    }

    protected _get(ctx: Context, key: Tuple[]) {
        return this._findById(key).get(ctx);
    }

    protected _set(ctx: Context, key: Tuple[], value: boolean) {
        this._findById(key).set(ctx, value);
    }

    protected _invert(ctx: Context, key: Tuple[]) {
        this._findById(key).invert(ctx);
    }
}