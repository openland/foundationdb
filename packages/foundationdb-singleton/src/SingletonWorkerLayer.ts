import { Context } from '@openland/context';
import { BaseLayer } from '@openland/foundationdb';

export class SingletonWorkerLayer extends BaseLayer {
    displayName = 'Singleton Worker';
    private workers: ((ctx: Context) => void)[] = [];

    registerWorker(shutdown: (ctx: Context) => void) {
        this.workers.push(shutdown);
    }
}