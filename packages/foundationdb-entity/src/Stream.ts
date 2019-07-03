import { Context } from '@openland/context';

export interface Stream<T> {

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