import { Context } from '@openland/context';
import { TransactionCache } from '@openland/foundationdb';
import { MultiMutex, uniqueSeed } from '@openland/foundationdb-utils';

export class IndexMutexManager {
    private readonly _mutexes = new TransactionCache<MultiMutex>(uniqueSeed());

    runExclusively = <T2>(ctx: Context, keys: string[], handler: () => Promise<T2>) => {
        let ex = this._mutexes.get(ctx, 'miltimutex');
        if (!ex) {
            ex = new MultiMutex();
            this._mutexes.set(ctx, 'miltimutex', ex);
        }
        let k = Array.from(new Set(keys)); // How to make better?
        return ex.runExclusive(k, handler);
    }
}