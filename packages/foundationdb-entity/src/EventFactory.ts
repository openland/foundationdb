import { BaseEvent } from './BaseEvent';

export class EventFactory {
    private readonly registrations = new Map<string, {
        decode: (src: any) => BaseEvent,
        encode: (src: BaseEvent) => any
    }>();

    registerEventType(key: string, encode: (src: BaseEvent) => any, decode: (src: any) => BaseEvent) {
        if (this.registrations.has(key)) {
            throw Error('Double registration for key ' + key);
        }
        this.registrations.set(key, { encode, decode });
    }

    encode(src: BaseEvent) {
        let reg = this.registrations.get(src.type);
        if (!reg) {
            throw Error('Unknown event type ' + src.type);
        }
        return { type: src.type, data: reg.encode(src) };
    }

    decode(src: any) {
        if (typeof src.type !== 'string') {
            throw Error('Mailformed event');
        }
        let type = src.type as string;
        let reg = this.registrations.get(type);
        if (!reg) {
            throw Error('Unknown event type ' + type);
        }
        return reg.decode(src.data);
    }
}