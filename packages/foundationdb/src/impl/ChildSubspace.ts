import { TransformedSubspace } from './TransformedSubspace';
import { Context } from '@openland/context';
import { encoders, Transformer } from './../encoding';
import { Database } from './../Database';
import { Subspace, RangeOptions } from './../Subspace';
import { getTransaction } from '../getTransaction';
import { keyNext, keyIncrement } from '../utils';
import { Watch } from '../Watch';
import * as fdb from 'foundationdb';
import { SubspaceTracer } from '../tracing';

export class ChildSubspace implements Subspace {

    readonly db: Database;
    readonly prefix: Buffer;

    constructor(db: Database, prefix: Buffer) {
        this.db = db;
        this.prefix = prefix;
    }

    withKeyEncoding<K2>(keyTf: Transformer<Buffer, K2>): Subspace<K2, Buffer> {
        return new TransformedSubspace<K2, Buffer, Buffer, Buffer>(this, keyTf, encoders.id<Buffer>());
    }

    withValueEncoding<V2>(valueTf: Transformer<Buffer, V2>): Subspace<Buffer, V2> {
        return new TransformedSubspace<Buffer, V2, Buffer, Buffer>(this, encoders.id<Buffer>(), valueTf);
    }

    subspace(key: Buffer): Subspace {
        return new ChildSubspace(this.db, Buffer.concat([this.prefix, key]));
    }

    async get(ctx: Context, key: Buffer) {
        return await SubspaceTracer.get(ctx, key, async () => {
            let tx = getTransaction(ctx)!.rawTransaction(this.db);
            return (await tx.get(Buffer.concat([this.prefix, key]))) || null;
        });
    }

    async snapshotGet(ctx: Context, key: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        return (await tx.snapshot().get(Buffer.concat([this.prefix, key]))) || null;
    }

    async range(ctx: Context, key: Buffer, opts?: RangeOptions<Buffer>) {
        return SubspaceTracer.range(ctx, key, opts, async () => {
            let tx = getTransaction(ctx)!.rawTransaction(this.db);
            return this.doRange(tx, key, opts);
        });
    }

    async snapshotRange(ctx: Context, key: Buffer, opts?: RangeOptions<Buffer>) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        return this.doRange(tx.snapshot(), key, opts);
    }

    private async doRange(tx: fdb.Transaction, key: Buffer, opts?: RangeOptions<Buffer>) {
        if (opts && opts.after) {
            let keyR = Buffer.concat([this.prefix, key]);
            let after = Buffer.concat([this.prefix, opts.after!]);
            let reversed = (opts && opts.reverse) ? true : false;
            let start = reversed ? keyNext(keyR) : keyIncrement(after);
            let end = reversed ? after : keyIncrement(keyR);
            return (await tx.getRangeAll(start, end, {
                limit: opts && opts.limit ? opts.limit! : undefined,
                reverse: opts && opts.reverse ? opts.reverse : undefined
            })).map((v) => ({ key: v[0].slice(this.prefix.length), value: v[1] }));
        } else {
            return (await tx.getRangeAll(Buffer.concat([this.prefix, key]), keyIncrement(Buffer.concat([this.prefix, key])), {
                limit: opts && opts.limit ? opts.limit! : undefined,
                reverse: opts && opts.reverse ? opts.reverse : undefined
            })).map((v) => ({ key: v[0].slice(this.prefix.length), value: v[1] }));
        }
    }

    set(ctx: Context, key: Buffer, value: Buffer) {
        return SubspaceTracer.set(ctx, key, value, () => {
            let tx = getTransaction(ctx)!.rawTransaction(this.db);
            tx.set(Buffer.concat([this.prefix, key]), value);
        });
    }

    setVersionstampedKey(ctx: Context, key: Buffer, value: Buffer, suffix?: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.setVersionstampSuffixedKey(Buffer.concat([this.prefix, key]), value, suffix);
    }

    setVersionstampedValue(ctx: Context, key: Buffer, value: Buffer, suffix?: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.setVersionstampPrefixedValue(Buffer.concat([this.prefix, key]), suffix, value);
    }

    addReadConflictKey(ctx: Context, key: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.addReadConflictKey(Buffer.concat([this.prefix, key]));
    }

    addReadConflictRange(ctx: Context, start: Buffer, end: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.addWriteConflictRange(Buffer.concat([this.prefix, start]), Buffer.concat([this.prefix, end]));
    }

    addWriteConflictKey(ctx: Context, key: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.addWriteConflictKey(Buffer.concat([this.prefix, key]));
    }

    addWriteConflictRange(ctx: Context, start: Buffer, end: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.addWriteConflictRange(Buffer.concat([this.prefix, start]), Buffer.concat([this.prefix, end]));
    }

    clear(ctx: Context, key: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.clear(Buffer.concat([this.prefix, key]));
    }

    clearPrefixed(ctx: Context, key: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.clearRange(Buffer.concat([this.prefix, key]), keyIncrement(Buffer.concat([this.prefix, key])));
    }

    clearRange(ctx: Context, start: Buffer, end: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.clearRange(Buffer.concat([this.prefix, start]), Buffer.concat([this.prefix, end]));
    }

    add(ctx: Context, key: Buffer, value: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.add(Buffer.concat([this.prefix, key]), value);
    }

    bitOr(ctx: Context, key: Buffer, value: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.bitOr(Buffer.concat([this.prefix, key]), value);
    }

    bitAnd(ctx: Context, key: Buffer, value: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.bitAnd(Buffer.concat([this.prefix, key]), value);
    }

    bitXor(ctx: Context, key: Buffer, value: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.bitXor(Buffer.concat([this.prefix, key]), value);
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
        let w = tx.watch(Buffer.concat([this.prefix, key]), { throwAllErrors: true });
        return {
            promise: w.promise as any as Promise<void>,
            cancel: () => w.cancel()
        };
    }
}