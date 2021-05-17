import { Context } from '@openland/context';
import { inTx, Subspace } from '@openland/foundationdb';
const ZERO = Buffer.from([]);
const ZFF = Buffer.from([0xff]);

export async function findMisusedRanges(rootCtx: Context, usedKeys: Buffer[], subspace: Subspace) {
    let sorted = [...usedKeys];
    sorted.sort(Buffer.compare);
    let res: { start: Buffer | null, end: Buffer | null }[] = [];

    let first = await inTx(rootCtx, async (ctx) => {
        let r = await subspace.range(ctx, ZERO, { limit: 1, before: sorted[0] });
        if (r.length > 0) {
            return r[0].key;
        } else {
            return null;
        }
    });
    if (first) {
        res.push({ start: null, end: sorted[0] });
    }

    // Check
    for (let i = 1; i < sorted.length; i++) {
        let ex = await inTx(rootCtx, async (ctx) => {
            let r = await subspace.range(ctx, ZERO, { limit: 1, after: sorted[i - 1], before: sorted[i] });
            if (r.length > 0) {
                return r[0].key;
            } else {
                return null;
            }
        });
        if (ex) {
            res.push({ start: sorted[i - 1], end: sorted[i] });
        }
    }

    let last = await inTx(rootCtx, async (ctx) => {
        let r = await subspace.range(ctx, ZERO, { limit: 1, after: sorted[sorted.length - 1] });
        if (r.length > 0) {
            return r[0].key;
        } else {
            return null;
        }
    });
    if (first) {
        res.push({ start: sorted[sorted.length - 1], end: null });
    }

    return res;
}