import { TransactionCache } from './../../foundationdb/src/TransactionCache';
import { Context } from '@openland/context';
import { BaseEvent } from './BaseEvent';
import { PrimaryKeyType } from './PrimaryKeyType';
import { EventStoreDescriptor } from './EventStoreDescriptor';
import { encoders } from '@openland/foundationdb';

const emptyBuffer = Buffer.of();

const txCache = new TransactionCache<number>('event-number');

export abstract class EventStore {
    readonly descriptor: EventStoreDescriptor;

    protected constructor(descriptor: EventStoreDescriptor) {
        this.descriptor = descriptor;
    }

    protected _post(ctx: Context, key: PrimaryKeyType[], event: BaseEvent) {
        let ex = (txCache.get(ctx, 'key') || 0) + 1;
        txCache.set(ctx, 'key', ex);
        this.descriptor.subspace.setVersionstampedKey(ctx, encoders.tuple.pack(key), this.descriptor.factory.encode(event), encoders.tuple.pack([ex]));
    }

    protected async _findAll(ctx: Context, key: PrimaryKeyType[]) {
        return (await this.descriptor.subspace
            .subspace(encoders.tuple.pack(key))
            .range(ctx, emptyBuffer))
            .map((v) => this.descriptor.factory.decode(v.value));
    }
}