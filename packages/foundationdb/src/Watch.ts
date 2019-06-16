/**
 * Watch object
 */
export interface Watch {
    
    /**
     * Await this promise for waiting for watch trigger. Can throw error when there are too many watches in current process.
     */
    promise: Promise<void>;
    
    /**
     * Cancel watch. Resoles promise to an exception.
     */
    cancel(): void;
}