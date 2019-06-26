import { Context } from '@openland/context';
import { getTransaction } from './getTransaction';

/**
 * Helper class for maintaining transaction-related cache
 */
export class TransactionCache<T> {

    /**
     * Globaly unique cache key
     */
    readonly key: string;

    constructor(key: string) {
        this.key = key;
    }

    /**
     * Get value by key from transaction if exists or null otherwise
     * 
     * @param ctx      context
     * @param cacheKey cache key
     */
    get(ctx: Context, cacheKey: string): T | null {
        let tx = getTransaction(ctx);
        let ex = tx.userData.get(this.key);
        if (ex) {
            let exm = ex as Map<string, T>;
            let r = exm.get(cacheKey);
            if (r) {
                return r;
            }
        }
        return null;
    }

    /**
     * Set value to transaction cache
     * 
     * @param ctx      context
     * @param cacheKey cache key
     * @param value    value to set
     */
    set(ctx: Context, cacheKey: string, value: T) {
        let tx = getTransaction(ctx);
        let ex = tx.userData.get(this.key);
        if (ex) {
            let exm = ex as Map<string, T>;
            exm.set(cacheKey, value);
        } else {
            let exm = new Map<string, T>();
            exm.set(cacheKey, value);
            tx.userData.set(this.key, exm);
        }
    }
}