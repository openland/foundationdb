import { LiveStream, LiveStreamItem } from './LiveStream';
import { TransactionCache } from '@openland/foundationdb';
import { Context } from '@openland/context';
import { BaseEvent } from './BaseEvent';
import { PrimaryKeyType } from './PrimaryKeyType';
import { EventStoreDescriptor } from './EventStoreDescriptor';
import { encoders } from '@openland/foundationdb';
import { EventStream } from './EventStream';

const ZERO = Buffer.alloc(0);

const txCache = new TransactionCache<number>('event-number');

export abstract class EventStore {
    readonly descriptor: EventStoreDescriptor;

    protected constructor(descriptor: EventStoreDescriptor) {
        this.descriptor = descriptor;
    }

    protected _post(ctx: Context, key: PrimaryKeyType[], event: BaseEvent) {
        let ex = (txCache.get(ctx, 'key') || 0) + 1;
        txCache.set(ctx, 'key', ex);
        const streamId = encoders.tuple.pack(key);
        const pubsubKey = 'event-' + this.descriptor.storageKey + '-' + streamId.toString('base64');
        this.descriptor.subspace.setVersionstampedKey(ctx, streamId, this.descriptor.factory.encode(event), encoders.tuple.pack([ex]));
        this.descriptor.storage.eventBus.publish(ctx, pubsubKey, {
            storageKey: this.descriptor.storageKey
        });
    }

    protected async _findAll(ctx: Context, key: PrimaryKeyType[]) {
        return (await this.descriptor.subspace
            .subspace(encoders.tuple.pack(key))
            .range(ctx, ZERO))
            .map((v) => this.descriptor.factory.decode(v.value));
    }

    protected _createRawStream(key: PrimaryKeyType[], opts?: { batchSize?: number, after?: string }) {
        return new EventStream<any>(this.descriptor, encoders.tuple.pack(key), opts && opts.batchSize || 5000, (src) => src, opts && opts.after);
    }

    protected _createRawLiveStream(ctx: Context, key: PrimaryKeyType[], opts?: { batchSize?: number, after?: string }) {
        return new LiveStream<any>(this._createRawStream(key, opts)).generator(ctx);
    }

    protected _createStream(key: PrimaryKeyType[], opts?: { batchSize?: number, after?: string }) {
        return new EventStream<BaseEvent>(this.descriptor, encoders.tuple.pack(key), opts && opts.batchSize || 5000, this.descriptor.factory.decode, opts && opts.after);
    }

    protected _createLiveStream(ctx: Context, key: PrimaryKeyType[], opts?: { batchSize?: number, after?: string }) {
        return new LiveStream<BaseEvent>(this._createStream(key, opts)).generator(ctx);
    }

    decodeRawStreamItem(events: any[]): BaseEvent[] {
        return events.map((e) => this.descriptor.factory.decode(e));
    }

    decodeRawLiveStreamItem(event: LiveStreamItem<any>): LiveStreamItem<BaseEvent> {
        return {
            cursor: event.cursor,
            items: this.decodeRawStreamItem(event.items)
        }
    }
}