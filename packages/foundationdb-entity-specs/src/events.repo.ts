// THIS FILE IS AUTOGENERATED! DO NOT TRY TO EDIT!
// @ts-ignore
import { Context } from '@openland/context';
// @ts-ignore
import { Subspace, Watch } from '@openland/foundationdb';
// @ts-ignore
import { EntityStorage, EventFactory, BaseStore, RangeQueryOptions, BaseEvent, codecs as c } from '@openland/foundationdb-entity';

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

export interface Store extends BaseStore {
}

export async function openStore(storage: EntityStorage): Promise<Store> {
    const eventFactory = new EventFactory();
    eventFactory.registerEventType('sampleEvent', SampleEvent.encode, SampleEvent.decode);
    return {
        storage,
        eventFactory,
    };
}
