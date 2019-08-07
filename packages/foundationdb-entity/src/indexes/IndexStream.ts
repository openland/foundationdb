import { EntityStorage } from './../EntityStorage';
import { Context } from '@openland/context';
import { transactional, TupleItem } from '@openland/foundationdb';
import { Stream } from '../Stream';
import { tupleToCursor, cursorToTuple } from './utils';
import { SecondaryIndexDescriptor } from '../EntityDescriptor';

export class IndexStream<T> implements Stream<T> {
    readonly eventBusKey: string;
    readonly entityStorage: EntityStorage;
    private readonly _descriptor: SecondaryIndexDescriptor;
    private readonly _builder: (ctx: Context, src: any) => T;
    private readonly _limit: number;
    private readonly _reverse: boolean;
    private readonly _prefix: TupleItem[];
    private _cursor: TupleItem[] | undefined = undefined;

    constructor(
        descriptor: SecondaryIndexDescriptor,
        prefix: TupleItem[],
        limit: number,
        reverse: boolean,
        builder: (ctx: Context, src: any) => T,
        storage: EntityStorage
    ) {
        this._descriptor = descriptor;
        this._builder = builder;
        this._limit = limit;
        this._reverse = reverse;
        this._prefix = prefix;
        this.eventBusKey = 'fdb-entity-created-' + descriptor.storageKey;
        this.entityStorage = storage;
    }

    get cursor(): string | null {
        if (this._cursor) {
            return tupleToCursor(this._cursor);
        } else {
            return null;
        }
    }

    @transactional
    async tail(ctx: Context): Promise<string | null> {
        let res = await this._descriptor.subspace.subspace(this._prefix).range(ctx, [], { limit: 1, reverse: !this._reverse });
        if (res.length >= 1) {
            return tupleToCursor(res[0].key);
        } else {
            return null;
        }
    }

    @transactional
    async head(ctx: Context): Promise<string | null> {
        let res = await this._descriptor.subspace.subspace(this._prefix).range(ctx, [], { limit: 1, reverse: this._reverse });
        if (res.length >= 1) {
            return tupleToCursor(res[0].key);
        } else {
            return null;
        }
    }

    seek(cursor: string) {
        this._cursor = cursorToTuple(cursor);
    }

    reset() {
        this._cursor = undefined;
    }

    @transactional
    async next(ctx: Context): Promise<T[]> {
        let res = await this._descriptor.subspace.subspace(this._prefix).range(ctx, [], { limit: this._limit, after: this._cursor, reverse: this._reverse });
        if (res.length > 0) {
            let r = res.map((v) => this._builder(ctx, v.value));
            this._cursor = res[res.length - 1].key; // NOTE: Update cursor only after successful decoding
            return r;
        } else {
            return [];
        }
    }
}