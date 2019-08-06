import * as fdb from 'foundationdb';
import { Context } from '@openland/context';
import { Database } from './../Database';
import { Transaction } from './../Transaction';

export abstract class BaseTransaction implements Transaction {

    readonly id = BaseTransaction.nextId++;
    db!: Database;

    private static nextId = 1;
    abstract isReadOnly: boolean;
    abstract isCompleted: boolean;
    abstract isEphemeral: boolean;
    readonly userData: Map<string, any> = new Map();
    protected rawTx?: fdb.Transaction;
    private options: Partial<fdb.TransactionOptions> = {};

    rawTransaction(db: Database): fdb.Transaction {
        if (this.db && this.db !== db) {
            throw Error('Unable to use two different connections in the same transaction');
        }

        if (!this.rawTx) {
            this.db = db;
            if (this.isReadOnly) {
                this.rawTx = db.rawDB.rawCreateTransaction({ ...this.options, causal_read_risky: true }).snapshot();
            } else {
                this.rawTx = db.rawDB.rawCreateTransaction(this.options);
            }
        }
        return this.rawTx!;
    }

    setOptions(options: Partial<fdb.TransactionOptions>) {
        this.options = { ...this.options, ...options };
    }

    abstract beforeCommit(fn: ((ctx: Context) => Promise<void>) | ((ctx: Context) => void)): void;
    abstract afterCommit(fn: (ctx: Context) => void): void;
}