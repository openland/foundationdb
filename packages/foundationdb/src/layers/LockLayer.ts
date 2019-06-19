import { Database } from '../Database';
import { Subspace } from '../Subspace';
import { encoders, Tuple } from '../encoding';
import { Context } from '@openland/context';
import { BaseLayer } from "../Layer";
import { transactional } from '../transactional';
import uuid from 'uuid/v4';

interface LockRecord {
    version: number;
    minVersion: number;
    seed: string;
    timeout: number;
}

export class LockLayer extends BaseLayer {
    displayName = 'Lock Layer';
    private locksSubspace!: Subspace<Tuple[], LockRecord>;

    @transactional
    async tryLock(ctx: Context, key: string, seed: string, opts?: { version?: number, timeout?: number }) {

        let version = 0;
        if (opts && opts.version) {
            version = opts.version!;
        }
        let timeout = 30 * 1000;
        if (opts && opts.timeout) {
            timeout = opts.timeout!!;
        }

        let existing = await this.locksSubspace.get(ctx, [key]);
        let now = Date.now();
        let currentTimeout = now + 30 * 1000;
        if (existing !== null) {
            // If current version is less than current required minimum
            if (existing.minVersion > version) {
                return false;
            }

            if (existing.seed === seed || existing.timeout < now) {
                existing.seed = seed;
                existing.timeout = currentTimeout;
                existing.version = version;
                existing.minVersion = version;
                this.locksSubspace.set(ctx, [key], existing);
                return true;
            } else {
                // Bump minumum version if needed
                if (version > existing.minVersion!!) {
                    existing.minVersion = version;
                    this.locksSubspace.set(ctx, [key], existing);
                }
                return false;
            }
        } else {
            this.locksSubspace.set(ctx, [key], { version: version, minVersion: version, seed: seed, timeout: currentTimeout });
            return true;
        }
    }

    @transactional
    async releaseLock(ctx: Context, key: string, seed: string) {

        let existing = await this.locksSubspace.get(ctx, [key]);
        if (!existing) {
            return false;
        }
        if (existing.seed === seed) {
            existing.timeout = Date.now();
            this.locksSubspace.set(ctx, [key], existing);
            return true;
        }

        return false;
    }

    async willStart(ctx: Context) {
        let directory = await this.db.directories.createOrOpen(ctx, ['com.openland.layers', 'locks']);
        this.locksSubspace = (await directory.createOrOpen(ctx, ['keys']))
            .withKeyEncoding(encoders.tuple)
            .withValueEncoding(encoders.json);
    }
}

export class DistributedLock {
    private readonly seed = uuid();
    readonly db: Database;
    readonly layer: LockLayer;
    readonly key: string;
    readonly version: number;

    constructor(key: string, db: Database, version: number = 0) {
        this.db = db;
        this.key = key;
        this.version = version;
        this.layer = this.db.get(LockLayer);
    }

    async tryLock(ctx: Context, timeout: number = 30000) {
        return await this.layer.tryLock(ctx, this.key, this.seed, { timeout, version: this.version });
    }

    async releaseLock(ctx: Context) {
        return await this.layer.releaseLock(ctx, this.key, this.seed);
    }
}