import { Context } from '@openland/context';
import { Directory, encoders } from '@openland/foundationdb';

export class EventStore {
    private directory: Directory;

    constructor(directory: Directory) {
        this.directory = directory;
    }

    write(ctx: Context, key: string, shape: any) {
        this.directory.setVersionstampedKey(ctx, encoders.tuple.pack([key, 0]), encoders.json.pack(shape));
    }

    async findAll(ctx: Context, key: string) {
        return (await this.directory
            .subspace(encoders.tuple.pack([key, 0]))
            .range(ctx, Buffer.of()))
            .map((v) => encoders.json.unpack(v.value));
    }
}