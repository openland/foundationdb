import { Subspace, encoders } from '@openland/foundationdb';
import { Context } from '@openland/context';

export class AtomicInteger {
    private readonly key: Buffer;
    private readonly keySpace: Subspace;

    constructor(key: Buffer, keySpace: Subspace) {
        this.key = key;
        this.keySpace = keySpace;
    }

    get = async (ctx: Context) => {
        let r = await this.keySpace.get(ctx, this.key);
        if (r) {
            return encoders.int32LE.unpack(r);
        } else {
            return 0;
        }
    }
    snapshotGet = async (ctx: Context) => {
        let r = await this.keySpace.snapshotGet(ctx, this.key);
        if (r) {
            return encoders.int32LE.unpack(r);
        } else {
            return 0;
        }
    }
    set = (ctx: Context, value: number) => {
        this.keySpace.set(ctx, this.key, encoders.int32LE.pack(value));
    }
    increment = (ctx: Context) => {
        this.add(ctx, 1);
    }
    decrement = (ctx: Context) => {
        this.add(ctx, -1);
    }
    add = (ctx: Context, value: number) => {
        this.keySpace.add(ctx, this.key, encoders.int32LE.pack(value));
    }
}