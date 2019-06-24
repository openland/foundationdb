import { AtomicInteger } from './AtomicInteger';
import { Tuple, Subspace, encoders } from '@openland/foundationdb';
import { EntityStore } from './EntityStore';

export abstract class AtomicIntegerFactory {

    readonly store: EntityStore;
    readonly directory: Subspace;

    protected constructor(store: EntityStore, subspace: Subspace) {
        this.store = store;
        this.directory = subspace;
    }

    protected _findById(key: Tuple[]) {
        return new AtomicInteger(encoders.tuple.pack(key), this.directory);
    }
}