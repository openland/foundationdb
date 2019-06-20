import { LockLayer } from '@openland/foundationdb-locks';
import { Context } from '@openland/context';
import { BaseLayer } from '@openland/foundationdb';

export class SingletonWorkerLayer extends BaseLayer {
    displayName = 'Singleton Worker';
    private lockLayer!: LockLayer;
    private workers: ((ctx: Context) => void)[] = [];

    async willStart(ctx: Context) {
        this.lockLayer = this.db.get(LockLayer);
    }

    registerWorker(shutdown: (ctx: Context) => void) {
        this.workers.push(shutdown);
    }
}