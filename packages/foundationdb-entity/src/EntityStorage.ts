import { EventBus } from '@openland/foundationdb-bus';
import { Context } from '@openland/context';
import { Database, inTx, encoders } from '@openland/foundationdb';

export class EntityStorage {
    readonly db: Database;
    readonly storeId: string;
    readonly eventBus: EventBus<any>;

    constructor(db: Database, storeId: string = 'app') {
        this.db = db;
        this.storeId = storeId;
        this.eventBus = new EventBus<any>(db);
        Object.freeze(this);
    }

    async resolveCustomDirectory(parent: Context, name: string) {
        return await inTx(parent, async (ctx) => await this.db.directories.createOrOpen(ctx, ['com.openland.layers', 'layers', this.storeId, 'custom', name]));
    }

    async resolveAtomicDirectory(parent: Context, name: string) {
        return await inTx(parent, async (ctx) => await this.db.directories.createOrOpen(ctx, ['com.openland.layers', 'layers', this.storeId, 'atomic', name]));
    }

    async resolveEventStoreDirectory(parent: Context, name: string) {
        return (await inTx(parent, async (ctx) => await this.db.directories.createOrOpen(ctx, ['com.openland.layers', 'layers', this.storeId, 'events', name])))
            .withValueEncoding(encoders.json);
    }

    async resolveEntityDirectory(parent: Context, name: string) {
        return (await inTx(parent, async (ctx) => await this.db.directories.createOrOpen(ctx, ['com.openland.layers', 'layers', this.storeId, 'entity', name])))
            .withKeyEncoding(encoders.tuple)
            .withValueEncoding(encoders.json);
    }

    async resolveEntityIndexDirectory(parent: Context, entityName: string, indexName: string) {
        return (await inTx(parent, async (ctx) => await this.db.directories.createOrOpen(ctx, ['com.openland.layers', 'layers', this.storeId, 'entity', entityName, '__indexes', indexName])))
            .withKeyEncoding(encoders.tuple)
            .withValueEncoding(encoders.json);
    }
}