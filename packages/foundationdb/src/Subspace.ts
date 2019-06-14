import { Context } from '@openland/context';
import { Transformer } from './encoding';

export interface RangeOptions<K = Buffer> {
    after?: K;
    limit?: number;
    reverse?: boolean;
}

export interface Subspace<K = Buffer, V = Buffer> {

    withKeyEncoding<K2>(keyTf: Transformer<K, K2>): Subspace<K2, V>;
    withValueEncoding<V2>(valueTf: Transformer<V, V2>): Subspace<K, V2>;
    subspace(key: K): Subspace<K, V>;

    //
    // Queries
    //

    get(ctx: Context, key: K): Promise<V | null>;
    range(ctx: Context, key: K, opts?: RangeOptions<K>): Promise<{ key: K, value: V }[]>;

    //
    // Mutations
    //

    set(ctx: Context, key: K, value: V): void;
    clear(ctx: Context, key: K): void;
    
    //
    // Atomic Operations
    //

    add(ctx: Context, key: K, value: V): void;
    bitOr(ctx: Context, key: K, value: V): void;
    bitAnd(ctx: Context, key: K, value: V): void;
    bitXor(ctx: Context, key: K, value: V): void;
}