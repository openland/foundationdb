import * as fdb from 'foundationdb';
import { Database } from './Database';
import { Context } from '@openland/context';
import { Versionstamp, VersionstampRef } from '@openland/foundationdb-tuple';

/**
 * FoundationDB transaction. Transactions are created lazily on first read or write operation.
 * 
 * In FoundationDB, a transaction is a mutable snapshot of a database. All read and write operations 
 * on a transaction see and modify an otherwise-unchanging version of the database and only change the 
 * underlying database if and when the transaction is committed. Read operations do see the effects of 
 * previous write operations on the same transaction. Committing a transaction usually succeeds in 
 * the absence of conflicts.
 * 
 * Transactions group operations into a unit with the properties of atomicity, isolation, and durability. 
 * Transactions also provide the ability to maintain an applications invariants or integrity constraints, 
 * supporting the property of consistency. Together these properties are known as ACID.
 * Transactions are also causally consistent: once a transaction has been successfully committed, 
 * all subsequently created transactions will see the modifications made by it.
 */
export interface Transaction {

    /**
     * Application-local transaction unique id. Useful for debug.
     */
    readonly id: number;

    /**
     * If transaction is read only
     */
    readonly isReadOnly: boolean;

    /**
     * If transaction is hybrid
     */
    readonly isHybrid: boolean;

    /**
     * If transaction is already completed (successfuly or not)
     */
    readonly isCompleted: boolean;

    /**
     * Application or layer specific data.
     */
    readonly userData: Map<string, any>;

    /** 
     * If transaction in retrying state
     */
    readonly isRetry: boolean;

    /**
     * Retry error
     */
    readonly retryError: fdb.FDBError | null;

    /**
     * Hook that will be called right before transaction commit,  
     * before starting or before completion of inner transaction.
     * 
     * Each transaction can have multiple beforeCommit hooks and they all are called in the FIFO order.
     * 
     * @param fn hook function
     */
    beforeCommit(fn: ((ctx: Context) => Promise<void>) | ((ctx: Context) => void)): void;

    /**
     * Hook that will be called after transaction was successfuly commited. 
     * If transaction was restarted hook won't be called.
     * 
     * Each transaction can have multiple afterCommit hooks and they all are called in the FIFO order.
     * 
     * @param fn hook function
     */
    afterCommit(fn: (ctx: Context) => void): void;

    /**
     * Getting raw transaction object for writes
     * @param db current database connnection
     */
    rawWriteTransaction(db: Database): fdb.Transaction;

    /**
     * Getting raw transaction object for reads
     * @param db current database connnection
     */
    rawReadTransaction(db: Database): fdb.Transaction;

    /**
     * Setting transaction options
     * @param options should be done before starting any operation
     */
    setOptions(options: Partial<fdb.TransactionOptions>): void;

    /**
     * Set Read Version of transaction. This version will NOT be applied for 
     * restarted transactions.
     * @param version read version value
     */
    setReadVersion(version: Buffer): void;

    /**
     * Get Read Version of transaction. Must be called after any read operation.
     */
    getReadVersion(): Promise<Buffer>;

    /**
     * Get Commited Version of transaction. Must be called after any write operation.
     */
    getCommittedVersion(): Promise<Buffer>;

    /**
     * Allocates unique versionstamp reference
     */
    allocateVersionstampRef(): VersionstampRef;

    /**
     * Resolves versionstamp by it's ref.
     * @param ref Versionstamp reference
     */
    resolveVersionstampRef(ref: VersionstampRef): Promise<Versionstamp>;

    /**
     * Get versionstamp
     */
    getVersionstamp(): Promise<Buffer>;
}