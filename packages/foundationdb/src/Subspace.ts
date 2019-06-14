import { Context } from '@openland/context';
import { Transformer } from './encoding';

/**
 * RangeOption contains parameters of range queries
 */
export interface RangeOptions<K = Buffer> {
    
    /**
     * If provided specifies after what key to query data
     */
    after?: K;
    
    /**
     * Maximnum number of returned values.
     */
    limit?: number;

    /**
     * If true reverses order.
     */
    reverse?: boolean;
}

/**
 * Subspace represents a well-defined region of keyspace in a FoundationDB database and 
 * all possible operations in it.
 */
export interface Subspace<K = Buffer, V = Buffer> {

    /**
     * Returns subspace with different key encoding
     * @param keyTf key transformation function
     */
    withKeyEncoding<K2>(keyTf: Transformer<K, K2>): Subspace<K2, V>;

    /**
     * Returns subspace with different value encoding
     * @param valueTf value transfromation function
     */
    withValueEncoding<V2>(valueTf: Transformer<V, V2>): Subspace<K, V2>;

    /**
     * Returns a new Subspace whose prefix is the provided key.
     * @param key key prefix
     */
    subspace(key: K): Subspace<K, V>;

    /**
     * Get returns the promise of the value associated with the specified key. The read is performed 
     * asynchronously and does not block event loop.
     * 
     * @param ctx context
     * @param key key
     * @returns   value or null if not exist
     */
    get(ctx: Context, key: K): Promise<V | null>;

    /**
     * Returns the promise of values that prefixed by key in current subspace ordered by key values.
     * The read is performed asynchronously and does not block event loop.
     * 
     * @param ctx  context
     * @param key  key prefix
     * @param opts optional range parameters
     */
    range(ctx: Context, key: K, opts?: RangeOptions<K>): Promise<{ key: K, value: V }[]>;

    /**
     * Set associated the given key and value, overwriting any previous association with key. 
     * Set returns immediately, having modified the snapshot of the database represented by the transaction.
     * 
     * @param ctx   context
     * @param key   key
     * @param value value to set;
     */
    set(ctx: Context, key: K, value: V): void;

    /**
     * Removes the specified key (and any associated value), if it exists. 
     * Clear returns immediately, having modified the snapshot of the database represented by the transaction.
     * 
     * @param ctx context
     * @param key key
     */
    clear(ctx: Context, key: K): void;

    /**
     * Performs an addition of little-endian integers. If the existing value in the database is not present 
     * or shorter than “param“, it is first extended to the length of “param“ with zero bytes. If “param“ is 
     * shorter than the existing value in the database, the existing value is truncated to match the length 
     * of “param“. The integers to be added must be stored in a little-endian representation. They can be 
     * signed in two's complement representation or unsigned. You can add to an integer at a known offset in 
     * the value by prepending the appropriate number of zero bytes to “param“ and padding with zero bytes 
     * to match the length of the value. However, this offset technique requires that you know the addition 
     * will not cause the integer field within the value to overflow.
     * 
     * @param ctx   context
     * @param key   key
     * @param value value
     */
    add(ctx: Context, key: K, value: V): void;

    /**
     * Performs a bitwise “or“ operation. If the existing value in the database is not present or shorter than “param“, 
     * it is first extended to the length of “param“ with zero bytes. If “param“ is shorter than the existing value in 
     * the database, the existing value is truncated to match the length of “param“.
     * @param ctx   context
     * @param key   key
     * @param value value
     */
    bitOr(ctx: Context, key: K, value: V): void;

    /**
     * Performs a bitwise “and“ operation. If the existing value in the database is not present, then “param“ is 
     * stored in the database. If the existing value in the database is shorter than “param“, it is first extended
     * to the length of “param“ with zero bytes. If “param“ is shorter than the existing value in the database, 
     * the existing value is truncated to match the length of “param“.
     * 
     * @param ctx   context
     * @param key   key
     * @param value value
     */
    bitAnd(ctx: Context, key: K, value: V): void;

    /**
     * Performs a bitwise “xor“ operation. If the existing value in the database is not present or shorter than “param“, 
     * it is first extended to the length of “param“ with zero bytes. If “param“ is shorter than the existing value in 
     * the database, the existing value is truncated to match the length of “param“.
     * 
     * @param ctx   context
     * @param key   key
     * @param value value
     */
    bitXor(ctx: Context, key: K, value: V): void;
}