import { SingletonWorkerLayer } from './SingletonWorkerLayer';
import { DistributedLock } from '@openland/foundationdb-locks';
import { createNamedContext } from '@openland/context';
import { Context } from '@openland/context';
import { Database } from '@openland/foundationdb';
import { foreverBreakable, delay, delayBreakable } from '@openland/foundationdb-utils';

export function singletonWorker(config: { db: Database, name: string, version?: number, delay?: number, startDelay?: number }, worker: (ctx: Context) => Promise<void>) {
    let working = true;
    let wasStarted = false;
    let layer = config.db.get(SingletonWorkerLayer);
    let ctx = createNamedContext('singleton-' + config.name);
    let timeout = 30000;
    let refreshInterval = 5000;
    let awaiter: (() => void) | undefined;

    let workLoop = foreverBreakable(ctx, async () => {
        if (!wasStarted && config.startDelay) {
            await delay(config.startDelay);
        }
        wasStarted = true;
        let res = await (async () => {

            // Trying to acquire lock
            let lock = new DistributedLock('worker_' + config.name, config.db, config.version);
            if (!(await lock.tryLock(ctx, timeout))) {
                return false;
            }

            let locked = true;

            // Refresh lock loop
            // tslint:disable-next-line:no-floating-promises
            (async () => {
                while (locked) {
                    if (!(await lock.refresh(ctx, timeout))) {
                        locked = false;
                        break;
                    }
                    await delay(refreshInterval);
                }
            })();

            // Work loop
            while (locked && working) {
                try {
                    await worker(ctx);
                } catch (e) {
                    locked = false;
                    await lock.releaseLock(ctx);
                    throw e;
                }
                await delay(config.delay || 1000);
            }

            // Release Lock
            await lock.releaseLock(ctx);

            return true;
        })();
        if (!working) {
            return;
        }
        if (!res) {
            let w = delayBreakable(config.delay || 1000);
            awaiter = w.resolver;
            await w.promise;
        } else {
            await delay(100);
        }
    });

    const shutdown = async (sctx: Context) => {
        if (!working) {
            throw new Error('Worker already stopped');
        }
        working = false;
        if (awaiter) {
            awaiter();
            awaiter = undefined;
        }
        await workLoop.stop();
    };

    layer.registerWorker(shutdown);
}