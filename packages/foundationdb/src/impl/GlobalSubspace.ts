import { Watch } from './../Watch';
import { ChildSubspace } from './ChildSubspace';
import { Context } from '@openland/context';
import { Database } from './../Database';
import { Subspace, RangeOptions } from '../Subspace';
import { getTransaction } from '../getTransaction';
import { encoders, Transformer } from '../encoding';
import { TransformedSubspace } from './TransformedSubspace';
import { keyNext, keyIncrement } from '../utils';
import { SubspaceTracer } from '../tracing';
import { resolveRangeParameters } from './resolveRangeParameters';
import { MutationType } from 'foundationdb';

const empty = Buffer.alloc(0);

export class GlobalSubspace implements Subspace {

    readonly db: Database;
    readonly prefix: Buffer = empty;

    constructor(db: Database) {
        this.db = db;
    }

    withKeyEncoding<K2>(keyTf: Transformer<Buffer, K2>): Subspace<K2, Buffer> {
        return new TransformedSubspace<K2, Buffer, Buffer, Buffer>(this, keyTf, encoders.id<Buffer>());
    }

    withValueEncoding<V2>(valueTf: Transformer<Buffer, V2>): Subspace<Buffer, V2> {
        return new TransformedSubspace<Buffer, V2, Buffer, Buffer>(this, encoders.id<Buffer>(), valueTf);
    }

    subspace(key: Buffer): Subspace {
        return new ChildSubspace(this.db, key);
    }

    async get(ctx: Context, key: Buffer) {
        return await SubspaceTracer.get(ctx, key, async () => {
            let tx = getTransaction(ctx).rawTransaction(this.db);
            return (await tx.get(key)) || null;
        });
    }

    async snapshotGet(ctx: Context, key: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        return (await tx.snapshot().get(Buffer.concat([this.prefix, key]))) || null;
    }

    exists(ctx: Context, key: Buffer): Promise<boolean> {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        return tx.exists(key);
    }

    snapshotExists(ctx: Context, key: Buffer): Promise<boolean> {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        return tx.snapshot().exists(key);
    }

    async range(ctx: Context, key: Buffer, opts?: RangeOptions<Buffer>) {
        return await SubspaceTracer.range(ctx, key, opts, async () => {
            let tx = getTransaction(ctx).rawTransaction(this.db);
            let args = resolveRangeParameters({ after: opts && opts.after, before: opts && opts.before, reverse: opts && opts.reverse, prefix: empty, key });
            return (await tx.getRangeAll(args.start, args.end, {
                limit: opts && opts.limit ? opts.limit! : undefined,
                reverse: opts && opts.reverse ? opts.reverse : undefined
            })).map((v) => ({ key: v[0], value: v[1] }));
        });
    }

    async snapshotRange(ctx: Context, key: Buffer, opts?: RangeOptions<Buffer>) {
        let tx = getTransaction(ctx).rawTransaction(this.db).snapshot();
        let args = resolveRangeParameters({ after: opts && opts.after, before: opts && opts.before, reverse: opts && opts.reverse, prefix: empty, key });
        return (await tx.getRangeAll(args.start, args.end, {
            limit: opts && opts.limit ? opts.limit! : undefined,
            reverse: opts && opts.reverse ? opts.reverse : undefined
        })).map((v) => ({ key: v[0], value: v[1] }));
    }

    set(ctx: Context, key: Buffer, value: Buffer) {
        return SubspaceTracer.set(ctx, key, value, () => {
            let tx = getTransaction(ctx).rawTransaction(this.db);
            tx.set(key, value);
        });
    }

    setVersionstampedKey(ctx: Context, key: Buffer, value: Buffer, suffix?: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.setVersionstampSuffixedKey(key, value, suffix);
    }

    setVersionstampedValue(ctx: Context, key: Buffer, value: Buffer, suffix?: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.setVersionstampPrefixedValue(key, suffix, value);
    }

    addReadConflictKey(ctx: Context, key: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.addReadConflictKey(key);
    }

    addReadConflictRange(ctx: Context, start: Buffer, end: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.addReadConflictRange(start, end);
    }

    addWriteConflictKey(ctx: Context, key: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.addWriteConflictKey(key);
    }

    addWriteConflictRange(ctx: Context, start: Buffer, end: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.addWriteConflictRange(start, end);
    }

    clear(ctx: Context, key: Buffer) {
        let tx = getTransaction(ctx).rawTransaction(this.db);
        tx.clear(key);
    }

    clearPrefixed(ctx: Context, key: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.clearRange(key, keyIncrement(key));
    }

    clearRange(ctx: Context, start: Buffer, end: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.clearRange(start, end);
    }

    add(ctx: Context, key: Buffer, value: Buffer) {
        let tx = getTransaction(ctx).rawTransaction(this.db);
        tx.add(key, value);
    }

    max(ctx: Context, key: Buffer, value: Buffer) {
        let tx = getTransaction(ctx).rawTransaction(this.db);
        tx.max(key, value);
    }

    min(ctx: Context, key: Buffer, value: Buffer) {
        let tx = getTransaction(ctx).rawTransaction(this.db);
        tx.min(key, value);
    }

    byteMax(ctx: Context, key: Buffer, value: Buffer) {
        let tx = getTransaction(ctx).rawTransaction(this.db);
        tx.byteMax(key, value);
    }

    byteMin(ctx: Context, key: Buffer, value: Buffer) {
        let tx = getTransaction(ctx).rawTransaction(this.db);
        tx.byteMin(key, value);
    }

    compareAndClear(ctx: Context, key: Buffer, value: Buffer) {
        let tx = getTransaction(ctx).rawTransaction(this.db);
        tx.atomicOp(MutationType.CompareAndClear, key, value);
    }

    bitOr(ctx: Context, key: Buffer, value: Buffer) {
        let tx = getTransaction(ctx).rawTransaction(this.db);
        tx.bitOr(key, value);
    }

    bitAnd(ctx: Context, key: Buffer, value: Buffer) {
        let tx = getTransaction(ctx).rawTransaction(this.db);
        tx.bitAnd(key, value);
    }

    bitXor(ctx: Context, key: Buffer, value: Buffer) {
        let tx = getTransaction(ctx).rawTransaction(this.db);
        tx.bitXor(key, value);
    }

    watch(ctx: Context, key: Buffer): Watch {
        let tn = getTransaction(ctx);
        if (tn.isEphemeral) {
            throw Error('Watches are not possible in ephemeral transactions');
        }
        if (tn.isReadOnly) {
            throw Error('Watches are not possible in read only transactions');
        }
        let tx = getTransaction(ctx).rawTransaction(this.db);
        let w = tx.watch(key, { throwAllErrors: true });
        return {
            promise: w.promise as any as Promise<void>,
            cancel: () => w.cancel()
        };
    }
}