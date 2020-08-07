import { Database } from './Database';
import { Context } from '@openland/context';
import { Transformer } from './encoding';
import { Watch } from './Watch';

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
     * Prefix of keys in current subspace
     */
    readonly prefix: Buffer;

    /**
     * Active database connection
     */
    readonly db: Database;

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
     * Get returns the promise of the value associated with the specified key. The read is performed 
     * asynchronously and does not block event loop.
     * 
     * Unlike `get` method does not creates read conflicts
     * 
     * @param ctx context
     * @param key key
     * @returns   value or null if not exist
     */
    snapshotGet(ctx: Context, key: K): Promise<V | null>;

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
     * Returns the promise of values that prefixed by key in current subspace ordered by key values.
     * The read is performed asynchronously and does not block event loop.
     * 
     * Unlike `range` method does not creates read conflicts
     * 
     * @param ctx  context
     * @param key  key prefix
     * @param opts optional range parameters
     */
    snapshotRange(ctx: Context, key: K, opts?: RangeOptions<K>): Promise<{ key: K, value: V }[]>;

    /**
     * Set associated the given key and value, overwriting any previous association with key. 
     * Set returns immediately, having modified the snapshot of the database represented by the transaction.
     * 
     * @param ctx   context
     * @param key   key
     * @param value value to set
     */
    set(ctx: Context, key: K, value: V): void;

    /**
     * Transforms key by appending versionstamp, append optional suffix and set value at result key, overwriting any previous 
     * association with key. Set returns immediately, having modified the snapshot of the database represented by the 
     * transaction but without versionstamp.
     * 
     * @param ctx    context
     * @param key    key
     * @param value  value to set
     * @param suffix optinal suffix to append to a key
     */
    setVersionstampedKey(ctx: Context, key: K, value: V, suffix?: K): void;

    /**
     * Transforms value by appending versionstamp, append optional suffix and set result value at key, overwriting any previous 
     * association with key. Set returns immediately, having modified the snapshot of the database represented by the 
     * transaction but without versionstamp.
     * @param ctx    context
     * @param key    key
     * @param value  value to set 
     * @param suffix optional suffix to append to a value
     */
    setVersionstampedValue(ctx: Context, key: K, value: V, suffix?: V): void;

    /**
     * Removes the specified key (and any associated value), if it exists. 
     * Clear returns immediately, having modified the snapshot of the database represented by the transaction.
     * 
     * @param ctx context
     * @param key key
     */
    clear(ctx: Context, key: K): void;

    /**
     * Clears all keys that is prefixed by key
     * @param ctx context
     * @param key key
     */
    clearPrefixed(ctx: Context, key: K): void;

    /**
     * Clears all keys that is prefixed by key
     * @param ctx context
     * @param start start key
     * @param end end key
     */
    clearRange(ctx: Context, start: K, end: K): void;

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

    /**
     * Watch creates a watch and returns a promise that will become ready when the watch reports a change to the value 
     * of the specified key.
     * 
     * A watchs behavior is relative to the transaction that created it. A watch will report a change in relation to 
     * the keys value as readable by that transaction. The initial value used for comparison is either that of the transactions 
     * read version or the value as modified by the transaction itself prior to the creation of the watch. If the value changes 
     * and then changes back to its initial value, the watch might not report the change.
     * 
     * Until the transaction that created it has been committed, a watch will not report changes made by other transactions. 
     * In contrast, a watch will immediately report changes made by the transaction itself. Watches cannot be created if the 
     * transaction has called SetReadYourWritesDisable on the Transaction options, and an attempt to do so will return a 
     * watches_disabled error.
     * 
     * If the transaction used to create a watch encounters an error during commit, then the watch will be set with that error. 
     * A transaction whose commit result is unknown will set all of its watches with the commit_unknown_result error. 
     * If an uncommitted transaction is reset or destroyed, then any watches it created will be set with the transaction_cancelled error.
     * 
     * By default, each database connection can have no more than 10,000 watches that have not yet reported a change. When this number 
     * is exceeded, an attempt to create a watch will return a too_many_watches error. This limit can be changed using SetMaxWatches on 
     * the Database. Because a watch outlives the transaction that creates it, any watch that is no longer needed should be cancelled 
     * by calling `cancel()` on its returned object.
     * 
     * @param ctx context
     * @param key key to watch
     */
    watch(ctx: Context, key: K): Watch;
}