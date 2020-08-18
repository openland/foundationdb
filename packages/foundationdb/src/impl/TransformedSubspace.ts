import { Context } from '@openland/context';
import { Subspace, RangeOptions } from '../Subspace';
import { Transformer, encoders } from '../encoding';
import { Watch } from '../Watch';

export class TransformedSubspace<K, V, SK, SV> implements Subspace<K, V> {

    readonly ops: Subspace<SK, SV>;
    readonly keyTf: Transformer<SK, K>;
    readonly valTf: Transformer<SV, V>;

    constructor(ops: Subspace<SK, SV>, keyTf: Transformer<SK, K>, valTf: Transformer<SV, V>) {
        this.ops = ops;
        this.keyTf = keyTf;
        this.valTf = valTf;
    }

    get prefix() {
        return this.ops.prefix;
    }
    get db() {
        return this.ops.db;
    }

    withKeyEncoding<K2>(keyTf: Transformer<K, K2>): Subspace<K2, V> {
        return new TransformedSubspace<K2, V, K, V>(this, keyTf, encoders.id<V>());
    }
    withValueEncoding<V2>(valueTf: Transformer<V, V2>): Subspace<K, V2> {
        return new TransformedSubspace<K, V2, K, V>(this, encoders.id<K>(), valueTf);
    }

    subspace(key: K): Subspace<K, V> {
        return new TransformedSubspace(this.ops.subspace(this.keyTf.pack(key)), this.keyTf, this.valTf);
    }

    async get(ctx: Context, key: K): Promise<V | null> {
        let res = await this.ops.get(ctx, this.keyTf.pack(key));
        if (res) {
            return this.valTf.unpack(res);
        } else {
            return null;
        }
    }

    async snapshotGet(ctx: Context, key: K): Promise<V | null> {
        let res = await this.ops.snapshotGet(ctx, this.keyTf.pack(key));
        if (res) {
            return this.valTf.unpack(res);
        } else {
            return null;
        }
    }

    exists(ctx: Context, key: K): Promise<boolean> {
        return this.ops.exists(ctx, this.keyTf.pack(key));
    }

    snapshotExists(ctx: Context, key: K): Promise<boolean> {
        return this.ops.exists(ctx, this.keyTf.pack(key));
    }

    async range(ctx: Context, key: K, opts?: RangeOptions<K>): Promise<{ key: K, value: V }[]> {
        let opts2: RangeOptions<SK> | undefined = undefined;
        if (opts) {
            opts2 = {
                after: opts.after ? this.keyTf.pack(opts.after) : undefined,
                before: opts.before ? this.keyTf.pack(opts.before) : undefined,
                limit: opts.limit,
                reverse: opts.reverse
            };
        }
        let res = await this.ops.range(ctx, this.keyTf.pack(key), opts2);
        return res.map((v) => ({ key: this.keyTf.unpack(v.key), value: this.valTf.unpack(v.value) }));
    }

    async snapshotRange(ctx: Context, key: K, opts?: RangeOptions<K>): Promise<{ key: K, value: V }[]> {
        let opts2: RangeOptions<SK> | undefined = undefined;
        if (opts) {
            opts2 = {
                after: opts.after ? this.keyTf.pack(opts.after) : undefined,
                before: opts.before ? this.keyTf.pack(opts.before) : undefined,
                limit: opts.limit,
                reverse: opts.reverse
            };
        }
        let res = await this.ops.snapshotRange(ctx, this.keyTf.pack(key), opts2);
        return res.map((v) => ({ key: this.keyTf.unpack(v.key), value: this.valTf.unpack(v.value) }));
    }

    set(ctx: Context, key: K, value: V) {
        this.ops.set(ctx, this.keyTf.pack(key), this.valTf.pack(value));
    }

    setVersionstampedKey(ctx: Context, key: K, value: V, suffix?: K) {
        let s: SK | undefined;
        if (suffix) {
            s = this.keyTf.pack(suffix);
        }
        this.ops.setVersionstampedKey(ctx, this.keyTf.pack(key), this.valTf.pack(value), s);
    }

    setVersionstampedValue(ctx: Context, key: K, value: V, suffix?: V) {
        let s: SV | undefined;
        if (suffix) {
            s = this.valTf.pack(suffix);
        }
        this.ops.setVersionstampedValue(ctx, this.keyTf.pack(key), this.valTf.pack(value), s);
    }

    addReadConflictKey(ctx: Context, key: K) {
        this.ops.addReadConflictKey(ctx, this.keyTf.pack((key)));
    }

    addReadConflictRange(ctx: Context, start: K, end: K) {
        this.ops.addReadConflictRange(ctx, this.keyTf.pack((start)), this.keyTf.pack((end)));
    }

    addWriteConflictKey(ctx: Context, key: K) {
        this.ops.addWriteConflictKey(ctx, this.keyTf.pack((key)));
    }

    addWriteConflictRange(ctx: Context, start: K, end: K) {
        this.ops.addWriteConflictRange(ctx, this.keyTf.pack((start)), this.keyTf.pack((end)));
    }

    add(ctx: Context, key: K, value: V) {
        this.ops.add(ctx, this.keyTf.pack(key), this.valTf.pack(value));
    }

    bitXor(ctx: Context, key: K, value: V) {
        this.ops.bitXor(ctx, this.keyTf.pack(key), this.valTf.pack(value));
    }

    bitOr(ctx: Context, key: K, value: V) {
        this.ops.bitOr(ctx, this.keyTf.pack(key), this.valTf.pack(value));
    }

    bitAnd(ctx: Context, key: K, value: V) {
        this.ops.bitAnd(ctx, this.keyTf.pack(key), this.valTf.pack(value));
    }

    max(ctx: Context, key: K, value: V) {
        this.ops.max(ctx, this.keyTf.pack(key), this.valTf.pack(value));
    }

    min(ctx: Context, key: K, value: V) {
        this.ops.min(ctx, this.keyTf.pack(key), this.valTf.pack(value));
    }

    byteMax(ctx: Context, key: K, value: V) {
        this.ops.byteMax(ctx, this.keyTf.pack(key), this.valTf.pack(value));
    }

    byteMin(ctx: Context, key: K, value: V) {
        this.ops.byteMin(ctx, this.keyTf.pack(key), this.valTf.pack(value));
    }

    compareAndClear(ctx: Context, key: K, value: V) {
        this.ops.compareAndClear(ctx, this.keyTf.pack(key), this.valTf.pack(value));
    }

    clear(ctx: Context, key: K) {
        this.ops.clear(ctx, this.keyTf.pack(key));
    }

    clearPrefixed(ctx: Context, key: K) {
        this.ops.clearPrefixed(ctx, this.keyTf.pack(key));
    }

    clearRange(ctx: Context, start: K, end: K) {
        this.ops.clearRange(ctx, this.keyTf.pack(start), this.keyTf.pack(end));
    }

    watch(ctx: Context, key: K): Watch {
        return this.ops.watch(ctx, this.keyTf.pack(key));
    }
}