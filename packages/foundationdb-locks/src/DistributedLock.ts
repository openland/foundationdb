import { Context } from '@openland/context';
import { LockLayer } from './LockLayer';
import { Database, transactional } from '@openland/foundationdb';
import { uniqueSeed } from '@openland/foundationdb-utils';

export class DistributedLock {

    readonly db: Database;
    readonly layer: LockLayer;
    readonly key: string;
    readonly version: number;

    private readonly seed = uniqueSeed();

    private lockIndex = 0;
    private isLocked = false;

    constructor(key: string, db: Database, version: number = 0) {
        this.db = db;
        this.key = key;
        this.version = version;
        this.layer = this.db.get(LockLayer);
    }

    @transactional
    async tryLock(ctx: Context, timeout: number = 30000) {
        let res = await this.layer.tryLock(ctx, this.key, this.seed, { timeout, version: this.version });
        if (res !== false) {
            this.lockIndex = res;
            this.isLocked = true;
            return true;
        } else {
            this.lockIndex = -1;
            this.isLocked = false;
            return false;
        }
    }

    @transactional
    async refresh(ctx: Context, timeout: number = 30000) {
        if (!this.isLocked) {
            return false;
        }
        let res = await this.layer.tryLock(ctx, this.key, this.seed, { timeout, version: this.version, refreshIndex: this.lockIndex });
        if (res !== false) {
            return true;
        } else {
            return false;
        }
    }

    async releaseLock(ctx: Context) {
        if (!this.isLocked) {
            return;
        }
        return await this.layer.releaseLock(ctx, this.key, this.seed);
    }
}