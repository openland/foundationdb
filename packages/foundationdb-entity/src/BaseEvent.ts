export abstract class BaseEvent {
    readonly type: string;
    readonly raw: any;

    protected constructor(type: string, raw: any) {
        this.type = type;
        this.raw = raw;
        Object.freeze(this);
    }
}