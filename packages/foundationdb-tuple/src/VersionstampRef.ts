export class VersionstampRef {
    readonly index: Buffer;
    constructor(index: Buffer) {
        if (index.length !== 2) {
            throw Error('Index must be 2 bytes long');
        }
        this.index = index;
        Object.freeze(this);
    }
}