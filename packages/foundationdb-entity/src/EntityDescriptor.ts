import { Subspace, TupleItem } from '@openland/foundationdb';
import { StructCodec } from './codecs';
import { EntityStorage } from './EntityStorage';

/**
 * Descriptor of Entity that represent crucial information 
 * for working with this type of entity.
 */
export interface EntityDescriptor<SHAPE> {

    /**
     * Name of entity
     */
    name: string;

    /**
     * Storage Key under that entity is placed
     */
    storageKey: string;

    /**
     * Subspace of entity values
     */
    subspace: Subspace<TupleItem[], any>;

    /**
     * Codec for entity serialization
     */
    codec: StructCodec<SHAPE>;

    /**
     * Primary Key Descriptors
     */
    primaryKeys: PrimaryKeyDescriptor[];

    /**
     * Field Descriptors
     */
    fields: FieldDescriptor[];

    /**
     * List of secondary index descriptors
     */
    secondaryIndexes: SecondaryIndexDescriptor[];

    /**
     * Reference to the underlying storage
     */
    storage: EntityStorage;
}

/**
 * Primary key descriptor
 */
export interface PrimaryKeyDescriptor {

    /**
     * Name of primary key
     */
    name: string;

    /**
     * Type of primary key
     */
    type: 'string' | 'boolean' | 'integer' | 'float';
}

/**
 * Field Descriptor
 */
export interface FieldDescriptor {

    /**
     * Name of field
     */
    name: string;

    /**
     * Type of field
     */
    type: FieldType;

    /**
     * If field is nullable
     */
    nullable: boolean;

    /**
     * If field contains sensitive information
     */
    secure: boolean;
}

/**
 * Type of field
 */
export type FieldType =
    { type: 'integer' } |
    { type: 'float' } |
    { type: 'boolean' } |
    { type: 'string' } |
    { type: 'enum', values: string[] } |
    { type: 'array', inner: FieldType } |
    { type: 'struct', fields: { [key: string]: FieldType } };

/**
 * Secondary Index Implementation
 */
export interface SecondaryIndexDescriptor {

    /**
     * Name of Secondary Index
     */
    name: string;

    /**
     * Storage Key under that index is placed
     */
    storageKey: string;

    /**
     * Types of index
     */
    type: 'range' | 'unique';

    /**
     * Fields that is used in index
     */
    fields: string[];

    /**
     * Optional condition for partial indexes
     */
    condition?: (src: any) => boolean;

    /**
     * Subspace of index data
     */
    subspace: Subspace<TupleItem[], any>;
}