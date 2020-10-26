import { Versionstamp } from './Versionstamp';

export class VersionstampRef {
    readonly index: Buffer;
    private _resolved: Versionstamp | null = null;

    constructor(index: Buffer) {
        if (index.length !== 2) {
            throw Error('Index must be 2 bytes long');
        }
        this.index = index;
    }

    get resolved() {
        if (!this._resolved) {
            throw Error('Versionstamp is not resolved');
        }
        return this._resolved;
    }

    resolve(vt: Buffer) {
        if (this._resolved) {
            throw Error('Versionstamp already resolved');
        }
        this._resolved = new Versionstamp(Buffer.concat([vt, this.index]));
    }
}