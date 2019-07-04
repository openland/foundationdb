import { Context } from '@openland/context';

/**
 * Stream represents bounded and ordered collection of items.
 */
export interface Stream<T> {

    /**
     * Current stream cursor
     */
    readonly cursor: string | null;

    /**
     * Tail of the cursor
     * @param ctx context
     */
    tail(ctx: Context): Promise<string | null>;

    /**
     * Head of the cursor
     * @param ctx context
     */
    head(ctx: Context): Promise<string | null>;

    /**
     * Seek to a cursor
     * @param cursor 
     */
    seek(cursor: string): void;

    /**
     * Reset stream to the begining
     */
    reset(): void;

    /**
     * Read next batch
     * @param ctx context
     */
    next(ctx: Context): Promise<T[]>;
}