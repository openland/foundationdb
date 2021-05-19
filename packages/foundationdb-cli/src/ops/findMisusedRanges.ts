import { Context } from '@openland/context';
import { inTx, keyIncrement, Subspace } from '@openland/foundationdb';
const ZERO = Buffer.from([]);
const ZFF = Buffer.from([0xff]);

export async function findMisusedRanges(rootCtx: Context, usedKeys: Buffer[], subspace: Subspace) {
    let sorted = [...usedKeys];
    sorted.sort(Buffer.compare);
    let res: { start: Buffer | null, from: Buffer, to: Buffer, end: Buffer | null }[] = [];

    let first = await inTx(rootCtx, async (ctx) => {
        let r = await subspace.range(ctx, ZERO, { limit: 1, before: sorted[0] });
        if (r.length > 0) {
            let from = r[0].key;
            let to = (await subspace.range(ctx, ZERO, { limit: 1, reverse: true, after: keyIncrement(sorted[0]) }))[0].key;
            return { from, to };
        } else {
            return null;
        }
    });
    if (first) {
        res.push({ start: null, end: sorted[0], ...first });
    }

    // Check
    for (let i = 1; i < sorted.length; i++) {
        let ex = await inTx(rootCtx, async (ctx) => {
            let r = await subspace.range(ctx, ZERO, { limit: 1, after: keyIncrement(sorted[i - 1]), before: sorted[i] });
            if (r.length > 0) {
                let from = r[0].key;
                let to = (await subspace.range(ctx, ZERO, { limit: 1, reverse: true, before: sorted[i - 1], after: keyIncrement(sorted[i]) }))[0].key;
                return { from, to };
            } else {
                return null;
            }
        });
        if (ex) {
            res.push({ start: sorted[i - 1], end: sorted[i], ...ex });
        }
    }

    let last = await inTx(rootCtx, async (ctx) => {
        let r = await subspace.range(ctx, ZERO, { limit: 1, after: keyIncrement(sorted[sorted.length - 1]), before: Buffer.from([0xfe]) });
        if (r.length > 0) {
            let from = r[0].key;
            let to = (await subspace.range(ctx, ZERO, { limit: 1, reverse: true, after: Buffer.from([0xfe]), before: sorted[sorted.length - 1] }))[0].key;
            return { from, to };
        } else {
            return null;
        }
    });
    if (last) {
        res.push({ start: sorted[sorted.length - 1], end: null, ...last });
    }

    return res;
}