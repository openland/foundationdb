/**
 * This function is intended to detect if number is integer that 
 * can be safely encoded as integer
 * 
 * @param src sorce number
 */
export function normalizeInteger(src: number): number {
    if (typeof src !== 'number') {
        throw Error('Input is not integer');
    }
    if (!Number.isFinite(src)) {
        throw Error('Number ' + src + ' is not finite');
    }
    if (!Number.isInteger(src)) {
        throw Error('Number ' + src + ' is not an integer');
    }
    if (!Number.isSafeInteger(src)) {
        throw Error('Number ' + src + ' is not a safe integer');
    }
    return src | 0;
}