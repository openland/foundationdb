import * as fdb from 'foundationdb';
import { Database } from './Database';
import { Context } from '@openland/context';

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
     * If transaction is already completed (successfuly or not)
     */
    readonly isCompleted: boolean;

    /**
     * If transaction is ephemeral. Ephemeral transactions are never commited.
     */
    readonly isEphemeral: boolean;

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
     * Getting raw transaction object
     * @param db current database connnection
     */
    rawTransaction(db: Database): fdb.Transaction<Buffer, Buffer>;
}