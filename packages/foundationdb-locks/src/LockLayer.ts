import { Context } from '@openland/context';
import { BaseLayer, Subspace, Tuple, transactional, encoders } from '@openland/foundationdb';

interface LockRecord {
    version: number;
    minVersion: number;

    index: number;
    seed: string;
    timeout: number;
}

export class LockLayer extends BaseLayer {
    displayName = 'Lock Layer';
    private locksSubspace!: Subspace<Tuple[], LockRecord>;

    @transactional
    async tryLock(ctx: Context, key: string, seed: string, opts?: { version?: number, timeout?: number, refreshIndex?: number }): Promise<false | number> {

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
        let currentTimeout = now + timeout;
        if (existing !== null) {
            // If current version is less than current required minimum
            if (existing.minVersion > version) {
                return false;
            }

            // Fence token
            if (opts && opts.refreshIndex && existing.index !== opts.refreshIndex) {
                return false;
            }

            // Locking
            if (existing.seed === seed || existing.timeout < now) {
                existing.seed = seed;
                existing.timeout = currentTimeout;
                existing.version = version;
                existing.minVersion = version;
                if (existing.seed !== seed) {
                    existing.index++;
                }
                this.locksSubspace.set(ctx, [key], existing);
                return existing.index;
            } else {
                // Bump minumum version if needed (why?)
                if (version > existing.minVersion!!) {
                    existing.minVersion = version;
                    this.locksSubspace.set(ctx, [key], existing);
                }
                return false;
            }
        } else {
            this.locksSubspace.set(ctx, [key], { version: version, minVersion: version, seed: seed, timeout: currentTimeout, index: 1 });
            return 1;
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