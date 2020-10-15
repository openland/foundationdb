export abstract class BaseEvent {
    abstract readonly type: string;
    readonly raw: any;

    protected constructor(raw: any) {
        this.raw = raw;
        Object.freeze(raw);
    }
}