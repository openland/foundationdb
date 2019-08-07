// THIS FILE IS AUTOGENERATED! DO NOT TRY TO EDIT!
// @ts-ignore
import { Context } from '@openland/context';
// @ts-ignore
import { Subspace, Watch } from '@openland/foundationdb';
// @ts-ignore
import { EntityStorage, EventStore, EventStoreDescriptor, EventFactory, BaseStore, RangeQueryOptions, BaseEvent, codecs as c } from '@openland/foundationdb-entity';

const sampleEventCodec = c.struct({
    id: c.string,
    name: c.optional(c.string),
});

interface SampleEventShape {
    id: string;
    name?: string | null | undefined;
}

export class SampleEvent extends BaseEvent {

    static create(data: SampleEventShape) {
        return new SampleEvent(sampleEventCodec.normalize(data));
    }

    static decode(data: any) {
        return new SampleEvent(sampleEventCodec.decode(data));
    }

    static encode(event: SampleEvent) {
        return sampleEventCodec.encode(event.raw);
    }

    private constructor(data: any) {
        super('sampleEvent', data);
    }

    get id(): string { return this.raw.id; }
    get name(): string | null { return this.raw.name; }
}

export class UserEvents extends EventStore {

    static async open(storage: EntityStorage, factory: EventFactory) {
        let subspace = await storage.resolveEventStoreDirectory('userEvents');
        const descriptor = {
            name: 'UserEvents',
            storageKey: 'userEvents',
            subspace,
            storage,
            factory
        };
        return new UserEvents(descriptor);
    }

    private constructor(descriptor: EventStoreDescriptor) {
        super(descriptor);
    }

    post(ctx: Context, userId: string, event: BaseEvent) {
        this._post(ctx, [userId], event);
    }

    async findAll(ctx: Context, userId: string) {
        return this._findAll(ctx, [userId]);
    }

    createStream(userId: string, opts?: { batchSize?: number, after?: string }) {
        return this._createStream([userId], opts);
    }

    createLiveStream(ctx: Context, userId: string, opts?: { batchSize?: number, after?: string }) {
        return this._createLiveStream(ctx, [userId], opts);
    }
}

export interface Store extends BaseStore {
    readonly UserEvents: UserEvents;
}

export async function openStore(storage: EntityStorage): Promise<Store> {
    const eventFactory = new EventFactory();
    eventFactory.registerEventType('sampleEvent', SampleEvent.encode, SampleEvent.decode);
    let UserEventsPromise = UserEvents.open(storage, eventFactory);
    return {
        storage,
        eventFactory,
        UserEvents: await UserEventsPromise,
    };
}