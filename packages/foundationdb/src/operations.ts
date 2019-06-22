import { Subspace } from './Subspace';
import { inTx } from './inTx';
import { Context } from '@openland/context';
import { createLogger, withLogPath } from '@openland/log';

const logger = createLogger('operations');

export async function copySubspace(parent: Context, from: Subspace, to: Subspace, batchSize: number = 10000) {
    let cursor: Buffer | undefined;
    let emptyBuffer = Buffer.of();
    let completed = false;
    let iteration = 0;
    while (!completed) {
        logger.log(parent, 'Copying subspace iteration: ' + iteration);
        await inTx(parent, async (ctx) => {
            let r = await from.range(ctx, emptyBuffer, { after: cursor, limit: batchSize });
            for (let i of r) {
                cursor = i.key;
                to.set(ctx, i.key, i.value);
            }
            if (r.length === 0) {
                completed = true;
            }
        });
        iteration++;
    }
}

export async function deleteMissing(parent: Context, from: Subspace, to: Subspace, batchSize: number = 10000) {
    let cursor: Buffer | undefined;
    let emptyBuffer = Buffer.of();
    let completed = false;
    let iteration = 0;
    while (!completed) {
        logger.log(parent, 'Delete missing keys iteration: ' + iteration);
        await inTx(parent, async (ctx) => {
            let r2 = await to.range(ctx, emptyBuffer, { after: cursor, limit: batchSize });

            await Promise.all(r2.map(async (i) => {
                let ex = await from.get(ctx, i.key);
                if (!ex) {
                    to.clear(ctx, i.key);
                }
            }));
            for (let i of r2) {
                cursor = i.key;
            }
            if (r2.length === 0) {
                completed = true;
            }
        });
        iteration++;
    }
}

export async function syncSubspaces(parent: Context, from: Subspace, to: Subspace, batchSize: number = 10000) {
    let iteration = 0;
    while (!await isSubspaceEquals(parent, from, to, batchSize)) {
        let ctx = withLogPath(parent, 'sync');
        logger.log(ctx, 'Subspace sync iteration: ' + iteration);
        await copySubspace(ctx, from, to, batchSize);
        await deleteMissing(ctx, from, to, batchSize);
        iteration++;
    }
    logger.log(parent, 'Subspace sync completed');
}

export async function isSubspaceEquals(parent: Context, a: Subspace, b: Subspace, batchSize: number = 10000): Promise<boolean> {
    let cursor: Buffer | undefined;
    let emptyBuffer = Buffer.of();
    let completed = false;
    let iteration = 0;
    while (!completed) {
        logger.log(parent, 'isSubspaceEquals iteration: ' + iteration);
        let equals = await inTx(parent, async (ctx) => {
            let r = await a.range(ctx, emptyBuffer, { after: cursor, limit: batchSize });
            let r2 = await b.range(ctx, emptyBuffer, { after: cursor, limit: batchSize });
            if (r.length !== r2.length) {
                return false;
            }
            for (let i = 0; i < r.length; i++) {
                if (Buffer.compare(r[i].key, r2[i].key) !== 0) {
                    return false;
                }
                if (Buffer.compare(r[i].value, r2[i].value) !== 0) {
                    return false;
                }
            }
            for (let i of r) {
                cursor = i.key;
            }
            if (r.length === 0) {
                completed = true;
            }
            return true;
        });
        if (!equals) {
            return false;
        }
        iteration++;
    }
    return true;
}