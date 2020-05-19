import { Mutex } from '@openland/foundationdb-utils';
import { Context } from '@openland/context';
import { EntityMetadata } from './EntityMetadata';
import { EntityDescriptor } from './EntityDescriptor';
import { PrimaryKeyType } from './PrimaryKeyType';
import { ShapeWithMetadata } from './ShapeWithMetadata';
import { getTransaction, Transaction } from '@openland/foundationdb';

export abstract class Entity<T> {
    protected readonly _descriptor: EntityDescriptor<T>;
    protected readonly _rawId: readonly PrimaryKeyType[];
    protected readonly _isReadOnly: boolean;
    protected readonly _tx: Transaction;
    protected readonly _flusher: (ctx: Context, id: ReadonlyArray<PrimaryKeyType>, oldValue: ShapeWithMetadata<T>, newValue: ShapeWithMetadata<T>) => Promise<void>;
    protected readonly _destroyer: (ctx: Context, id: readonly PrimaryKeyType[], value: ShapeWithMetadata<T>) => Promise<void>;

    /**
     * Stores **latest** stored data in database
     */
    protected _snapshotValue: ShapeWithMetadata<T>;
    /**
     * Stores actual values
     */
    protected _rawValue: ShapeWithMetadata<T>;
    /**
     * Stores all changed values
     */
    protected _updatedValues: Partial<T> = {};

    /**
     * Flag if we have ben scheduled changes
     */
    private _invalidated = false;

    /**
     * Flag if entity was deleted
     */
    private _deleted = false;

    /**
     * Flush mutex to avoid consistency problems during accidental parallel flushes
     */
    private mutex = new Mutex();

    constructor(
        id: PrimaryKeyType[],
        rawValue: ShapeWithMetadata<T>,
        descriptor: EntityDescriptor<T>,
        flush: (ctx: Context, id: readonly PrimaryKeyType[], oldValue: ShapeWithMetadata<T>, newValue: ShapeWithMetadata<T>) => Promise<void>,
        destroy: (ctx: Context, id: readonly PrimaryKeyType[], value: ShapeWithMetadata<T>) => Promise<void>,
        ctx: Context
    ) {
        this._descriptor = descriptor;
        this._rawId = Object.freeze(id);
        this._rawValue = rawValue;
        this._snapshotValue = Object.freeze({ ...this._rawValue });
        this._tx = getTransaction(ctx);
        this._isReadOnly = this._tx.isReadOnly;
        this._flusher = flush;
        this._destroyer = destroy;
    }

    /**
     * Metadata about entity value
     */
    get metadata(): EntityMetadata {
        return { versionCode: this._rawValue._version, createdAt: this._rawValue.createdAt, updatedAt: this._rawValue.updatedAt };
    }

    /**
     * Descriptor of entity class
     */
    get descriptor(): EntityDescriptor<T> {
        return this._descriptor;
    }

    /**
     * Schedule entity update
     */
    invalidate() {
        if (this._isReadOnly) {
            throw Error('Entity is not writable. Did you wrapped everything in transaction?');
        }
        if (this._tx.isCompleted) {
            throw Error('You can\'t update entity when transaction is in completed state.');
        }
        if (this._deleted) {
            throw Error('You can\'t update deleted entity');
        }
        if (this._invalidated) {
            return;
        }
        this._invalidated = true;
        this._tx.beforeCommit((ctx) => this.flush(ctx));
    }

    /**
     * Flush pending entity changes
     * @param ctx context
     */
    async flush(ctx: Context) {
        await this.mutex.runExclusive(async () => {
            // Check if entity was destroyed
            if (this._deleted) {
                return;
            }

            // Check if we have something to flush
            if (!this._invalidated) {
                return;
            }
            this._invalidated = false;

            // Calculate updated shape
            let changes = { ...this._updatedValues }; // Save changes for rollback
            let value: ShapeWithMetadata<T> = {
                ...this._snapshotValue,
                ...this._updatedValues,
                _version: this._rawValue._version + 1, // Increment version
                createdAt: this._rawValue.createdAt, // Keep created date
                updatedAt: Date.now(), // Update updated date
            };
            this._updatedValues = {};
            Object.freeze(value); // Freezing object is a requirement for _snapshotValue

            //
            // Perform updates flush
            //
            try {
                await this._flusher(ctx, this._rawId, this._snapshotValue, value);
            } catch (e) {
                // 
                // Changes from `changes` variable wasn't applied and we need to
                // restore value of _updatedValues. But _updatedValues can be already changed during
                // flushing and therefore we need to apply old changes first and then new one.
                //
                this._updatedValues = { ...changes, ...this._updatedValues };
                throw e;
            }

            //
            // NOTE: We are not relying on keeping executing in the same tick 
            // after flushing actual changes to FDB since we have outer mutex guard 
            // and we can safely update snapshot any time.
            //

            // Update snapshot
            this._snapshotValue = value;
        });
    }

    /**
     * Deletes entity from storage
     * @param ctx context
     */
    async delete(ctx: Context) {
        if (this._isReadOnly) {
            throw Error('Entity is not writable. Did you wrapped everything in transaction?');
        }
        if (this._tx.isCompleted) {
            throw Error('You can\'t delete entity when transaction is in completed state.');
        }
        if (!this.descriptor.allowDelete) {
            throw Error('Can\'t delete non-deletable entity');
        }
        if (this._deleted) {
            throw Error('Entity already deleted');
        }

        // Mark as deleted
        this._deleted = true;

        // Perform delete
        await this._destroyer(ctx, this._rawId, this._snapshotValue);
    }
}