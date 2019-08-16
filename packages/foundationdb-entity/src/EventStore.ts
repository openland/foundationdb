import { LiveStream } from './LiveStream';
import { TransactionCache } from '@openland/foundationdb';
import { Context } from '@openland/context';
import { BaseEvent } from './BaseEvent';
import { PrimaryKeyType } from './PrimaryKeyType';
import { EventStoreDescriptor } from './EventStoreDescriptor';
import { encoders } from '@openland/foundationdb';
import { EventStream } from './EventStream';

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
            .range(ctx, emptyBuffer))
            .map((v) => this.descriptor.factory.decode(v.value));
    }

    protected async _query(
        ctx: Context,
        key: PrimaryKeyType[],
        opts?: {
            limit?: number | undefined | null,
            reverse?: boolean | undefined | null,
            after?: Buffer | undefined | null,
            afterCursor?: string | undefined | null
        }
    ) {
        let after: Buffer | undefined = undefined;
        if (opts && opts.afterCursor) {
            after = Buffer.from(opts.afterCursor, 'base64');
        } else if (opts && opts.after) {
            after = opts.after;
        }

        let res = await this.descriptor.subspace.subspace(encoders.tuple.pack(key)).range(ctx, emptyBuffer, {
            limit: opts && opts.limit ? (opts.limit + 1) : undefined,
            reverse: opts && opts.reverse ? opts.reverse : undefined,
            after
        });

        let items = res.map(v => ({ event: this.descriptor.factory.decode(v.value), key: v.key }));
        if (opts && opts.limit) {
            let haveMore = items.length > opts.limit;
            if (haveMore) {
                items.splice(items.length - 1, 1);
                return {
                    items,
                    cursor: res[res.length - 2].key.toString('base64'),
                    haveMore: haveMore
                };
            } else {
                return {
                    items,
                    cursor: res[res.length - 1].key.toString('base64'),
                    haveMore: haveMore
                };
            }
        }

        return {
            items,
            cursor: res[res.length - 1].key.toString('base64'),
            haveMore: false
        };
    }

    protected _createStream(key: PrimaryKeyType[], opts?: { batchSize?: number, after?: string }) {
        return new EventStream(this.descriptor, encoders.tuple.pack(key), opts && opts.batchSize || 5000, opts && opts.after);
    }

    protected _createLiveStream(ctx: Context, key: PrimaryKeyType[], opts?: { batchSize?: number, after?: string }) {
        return new LiveStream(this._createStream(key, opts)).generator(ctx);
    }
}