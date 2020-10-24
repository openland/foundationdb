
export class BufferReader {
    readonly bufffer: Buffer;
    offset: number = 0;
    constructor(src: Buffer) {
        this.bufffer = src;
    }

    get completed() {
        return this.offset >= this.bufffer.length;
    }

    peek() {
        if (this.completed) {
            throw Error('EOF');
        }
        return this.bufffer.readUInt8(this.offset);
    }

    readByte() {
        if (this.completed) {
            throw Error('EOF');
        }
        return this.bufffer.readUInt8(this.offset++);
    }

    readBuffer(size: number) {
        if (this.completed) {
            throw Error('EOF');
        }
        if (this.offset + size > this.bufffer.length) {
            throw Error('EOF');
        }
        let res = this.bufffer.slice(this.offset, this.offset + size);
        this.skip(size);
        return res;
    }

    expect(byte: number) {
        let res = this.bufffer.readUInt8(this.offset++);
        if (res !== byte) {
            throw Error('Expected ' + byte + ', got ' + res);
        }
    }
    skip(count: number) {
        this.offset += count;
    }
}

export class BufferWriter {
    private _storage: Buffer;
    private _used: number = 0;

    constructor(capacity: number = 64) {
        this._storage = Buffer.alloc(capacity);
    }

    writeByte(val: number) {
        this._need(1); this._storage[this._used++] = val;
    }

    writeString(val: string) {
        const len = Buffer.byteLength(val);
        this._need(len);
        this._storage.write(val, this._used);
        this._used += len;
    }

    writeBuffer(val: Buffer) {
        this._need(val.length);
        val.copy(this._storage, this._used);
        this._used += val.length;
    }

    build() {
        const result = Buffer.alloc(this._used);
        this._storage.copy(result, 0, 0, this._used);
        return result;
    }

    private _need(numBytes: number) {
        if (this._storage.length < this._used + numBytes) {
            let newAmt = this._storage.length;
            while (newAmt < this._used + numBytes) {
                newAmt *= 2;
            }
            const newStorage = Buffer.alloc(newAmt);
            this._storage.copy(newStorage);
            this._storage = newStorage;
        }
    }
}