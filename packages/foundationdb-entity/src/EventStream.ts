import { EntityStorage } from './EntityStorage';
import { transactional } from '@openland/foundationdb';
import { Context } from '@openland/context';
import { Stream } from './Stream';
import { BaseEvent } from './BaseEvent';
import { EventStoreDescriptor } from './EventStoreDescriptor';

const ZERO = Buffer.alloc(0);

export class EventStream implements Stream<BaseEvent> {
    readonly eventBusKey: string;
    readonly entityStorage: EntityStorage;
    private readonly _descriptor: EventStoreDescriptor;
    private readonly _prefix: Buffer;
    private readonly _batchSize: number;
    private _cursor: Buffer | null = null;

    constructor(descriptor: EventStoreDescriptor, prefix: Buffer, batchSize: number, after?: string) {
        this._descriptor = descriptor;
        this._prefix = prefix;
        this._batchSize = batchSize;
        this.eventBusKey = 'event-' + descriptor.storageKey + '-' + prefix.toString('base64');
        this.entityStorage = descriptor.storage;
        if (after) {
            this.seek(after);
        }
    }

    get cursor(): string | null {
        if (this._cursor) {
            return this._cursor.toString('base64');
        } else {
            return null;
        }
    }

    @transactional
    async tail(ctx: Context): Promise<string | null> {
        let res = await this._descriptor.subspace
            .subspace(this._prefix)
            .range(ctx, ZERO, {
                limit: 1,
                reverse: true
            });
        if (res.length >= 1) {
            return res[0].key.toString('base64');
        } else {
            return null;
        }
    }

    @transactional
    async head(ctx: Context): Promise<string | null> {
        let res = await this._descriptor.subspace
            .subspace(this._prefix)
            .range(ctx, ZERO, {
                limit: 1,
                reverse: false
            });
        if (res.length >= 1) {
            return res[0].key.toString('base64');
        } else {
            return null;
        }
    }

    seek(cursor: string) {
        this._cursor = Buffer.from(cursor, 'base64');
    }

    reset() {
        this._cursor = null;
    }

    @transactional
    async next(ctx: Context): Promise<BaseEvent[]> {
        let res = await this._descriptor.subspace
            .subspace(this._prefix).range(ctx, ZERO, {
                limit: this._batchSize,
                after: this._cursor ? this._cursor : undefined
            });
        if (res.length > 0) {
            let r = res.map((v) => this._descriptor.factory.decode(v.value));
            this._cursor = res[res.length - 1].key; // NOTE: Update cursor only after successful decoding
            return r;
        } else {
            return [];
        }
    }
}