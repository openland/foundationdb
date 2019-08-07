import { EntityStorage } from './EntityStorage';
import { Context } from '@openland/context';

/**
 * Stream represents bounded and ordered collection of items.
 */
export interface Stream<T> {

    /**
     * Key that is used in event bus to broadcast events about updates
     */
    readonly eventBusKey: string;

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

    /**
     * Storage reference
     */
    readonly entityStorage: EntityStorage;
}