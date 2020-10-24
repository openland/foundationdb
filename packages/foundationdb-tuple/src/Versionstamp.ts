export class Versionstamp {
    readonly value: Buffer;
    constructor(value: Buffer) {
        if (value.length !== 12) {
            throw Error('Index must be 12 bytes long');
        }
        this.value = value;
        Object.freeze(this);
    }
}