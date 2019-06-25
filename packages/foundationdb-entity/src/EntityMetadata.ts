/**
 * Metadata of Entity Record
 */
export interface EntityMetadata {
    /**
     * Version Code. Incremented with each change.
     */
    versionCode: number;
    
    /**
     * Date when record is created. Used local machine time.
     */
    createdAt: number;

    /**
     * Date when record was last time updated. Used local machine time.
     */
    updatedAt: number;
}