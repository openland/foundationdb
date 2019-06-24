import { Context } from '@openland/context';
import { EntityStore } from './EntityStore';
import { AtomicBoolean } from './AtomicBoolean';
import { Tuple, Subspace, encoders } from '@openland/foundationdb';

export abstract class AtomicBooleanFactory {

    readonly store: EntityStore;
    readonly directory: Subspace;

    protected constructor(layer: EntityStore, subspace: Subspace) {
        this.store = layer;
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