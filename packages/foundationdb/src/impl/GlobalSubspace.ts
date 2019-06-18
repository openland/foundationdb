import { Watch } from './../Watch';
import { keySelector } from 'foundationdb';
import { ChildSubspace } from './ChildSubspace';
import { Context } from '@openland/context';
import { Database } from './../Database';
import { Subspace, RangeOptions } from "../Subspace";
import { getTransaction } from '../getTransaction';
import { encoders, Transformer } from '../encoding';
import { TransformedSubspace } from './TransformedSubspace';
import { keyNext, keyIncrement } from '../utils';

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
        let tx = getTransaction(ctx).rawTransaction(this.db);
        return await tx.get(key);
    }

    async range(ctx: Context, key: Buffer, opts?: RangeOptions<Buffer>) {
        let tx = getTransaction(ctx).rawTransaction(this.db);
        if (opts && opts.after) {
            let after = opts.after!;
            let reversed = (opts && opts.reverse) ? true : false;
            let start = reversed ? keyNext(key) : keyIncrement(after);
            let end = reversed ? after : keyIncrement(key);
            return (await tx.getRangeAll(start, end, {
                limit: opts && opts.limit ? opts.limit! : undefined,
                reverse: opts && opts.reverse ? opts.reverse : undefined
            })).map((v) => ({ key: v[0], value: v[1] }));
        } else {
            return (await tx.getRangeAll(key, undefined, {
                limit: opts && opts.limit ? opts.limit! : undefined,
                reverse: opts && opts.reverse ? opts.reverse : undefined
            })).map((v) => ({ key: v[0], value: v[1] }));
        }
    }

    set(ctx: Context, key: Buffer, value: Buffer) {
        let tx = getTransaction(ctx).rawTransaction(this.db);
        tx.set(key, value);
    }

    clear(ctx: Context, key: Buffer) {
        let tx = getTransaction(ctx).rawTransaction(this.db);
        tx.clear(key);
    }

    add(ctx: Context, key: Buffer, value: Buffer) {
        let tx = getTransaction(ctx).rawTransaction(this.db);
        tx.add(key, value);
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
        }
    }
}