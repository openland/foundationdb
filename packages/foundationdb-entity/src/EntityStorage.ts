import { createNamedContext } from '@openland/context';
import { Database, inTx } from '@openland/foundationdb';

export class EntityStorage {
    readonly db: Database;
    readonly storeId: string;

    constructor(db: Database, storeId: string = 'app') {
        this.db = db;
        this.storeId = storeId;
        Object.freeze(this);
    }

    async resolveAtomicDirectory(name: string) {
        return await inTx(createNamedContext('entity'), async (ctx) => await this.db.directories.createOrOpen(ctx, ['com.openland.layers', 'layers', this.storeId, 'atomic', name]));
    }
}