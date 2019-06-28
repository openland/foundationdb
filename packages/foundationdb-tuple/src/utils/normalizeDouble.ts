export function normalizeDouble(src: number) {
    if (!Number.isFinite(src)) {
        throw Error('Number ' + src + ' is not finite');
    }
    return src;
}