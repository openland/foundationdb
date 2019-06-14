import { TransformedSubspace } from './TransformedSubspace';
import { Context } from '@openland/context';
import { encoders, Transformer } from './../encoding';
import { Database } from './../Database';
import { Subspace, RangeOptions } from './../Subspace';
import { getTransaction } from '../getTransaction';
import { keyNext, keyIncrement } from '../utils';
import { keySelector } from 'foundationdb';

export class ChildSubspace implements Subspace {
    
    private readonly db: Database;
    private readonly prefix: Buffer;

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
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        return await tx.get(Buffer.concat([this.prefix, key]));
    }

    async range(ctx: Context, key: Buffer, opts?: RangeOptions<Buffer>) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        if (opts && opts.after) {
            let keyR = Buffer.concat([this.prefix, key]);
            let after = Buffer.concat([this.prefix, key, opts.after!]);
            let reversed = (opts && opts.reverse) ? true : false;
            let start = reversed ? keyNext(keyR) : keySelector.firstGreaterThan(keyIncrement(after));
            let end = reversed ? after : keyIncrement(keyR);
            return (await tx.getRangeAll(start, end, {
                limit: opts && opts.limit ? opts.limit! : undefined,
                reverse: opts && opts.reverse ? opts.reverse : undefined
            })).map((v) => ({ key: v[0].slice(this.prefix.length), value: v[1] }));
        } else {
            return (await tx.getRangeAll(Buffer.concat([this.prefix, key]), undefined, {
                limit: opts && opts.limit ? opts.limit! : undefined,
                reverse: opts && opts.reverse ? opts.reverse : undefined
            })).map((v) => ({ key: v[0].slice(this.prefix.length), value: v[1] }));
        }
    }

    set(ctx: Context, key: Buffer, value: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.set(Buffer.concat([this.prefix, key]), value);
    }

    clear(ctx: Context, key: Buffer) {
        let tx = getTransaction(ctx)!.rawTransaction(this.db);
        tx.clear(Buffer.concat([this.prefix, key]));
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
}