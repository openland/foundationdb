import { BusProvider, BusSubcription } from './BusProvider';
import { BusLayer } from './BusLayer';
import { Context } from '@openland/context';
import { Database, getTransaction } from '@openland/foundationdb';

export class EventBus<T> {
    readonly db: Database;
    private readonly provider: BusProvider;

    constructor(db: Database) {
        this.db = db;
        this.provider = this.db.get(BusLayer).provider;
    }

    publish(ctx: Context, topic: string, data: T) {
        getTransaction(ctx).afterCommit(() => { this.provider.publish(topic, data); });
    }

    subscibe(topic: string, receiver: (data: T) => void): BusSubcription {
        return this.provider.subscribe(topic, receiver);
    }
}