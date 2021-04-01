import { Context, createNamedContext } from '@openland/context';
import { Future } from '@openland/foundationdb-utils';
import { runInBatch } from './runInBatch';

export type Task<T> = (ctx: Context) => Promise<T>;

export interface TaskExecutor {
    execute<T>(task: Task<T>): Promise<T>;
}

type Batch = {
    tasks: { future: Future<any>, task: (c: Context) => Promise<any> }[]
};

export function createDefaultTaskExecutor(name: string, batchSize: number, delay: number): TaskExecutor {
    const batchedContext = createNamedContext(name);
    let currentBatch: Batch | null = null;

    function flushBatch(batch: Batch) {
        // tslint:disable-next-line:no-floating-promises
        (async () => {
            let res: any[];
            try {
                res = await runInBatch(batchedContext, batch.tasks.map((v) => v.task));
            } catch (e) {
                for (let f of batch.tasks) {
                    f.future.reject(e);
                }
                return;
            }
            for (let i = 0; i < res.length; i++) {
                try {
                    batch.tasks[i].future.resolve(res[i]);
                } catch (e) {
                    // We just ignore some errors inside of resolver
                }
            }
        })();
    }

    return {
        execute<T>(task: (c: Context) => Promise<T>): Promise<T> {
            const future: Future<T> = new Future();

            if (!currentBatch || currentBatch.tasks.length >= batchSize) {

                // Flush on overflow
                if (currentBatch && currentBatch.tasks.length >= batchSize) {
                    flushBatch(currentBatch);
                    currentBatch = null;
                }

                // Create new batch and schedule execution
                const batch: Batch = { tasks: [{ task, future }] };
                currentBatch = batch;
                setTimeout(() => {
                    if (currentBatch === batch) {
                        currentBatch = null;
                    }
                    flushBatch(batch);
                }, delay);
            } else {
                currentBatch.tasks.push({ future, task });
            }

            return future.promise;
        }
    };
}