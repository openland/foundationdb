export interface RangeQueryOptions<T> {
    limit?: number | undefined | null;
    reverse?: boolean | undefined | null;
    after?: T | undefined | null;
    afterCursor?: string | undefined | null;
}