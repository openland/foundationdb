import * as fdb from 'foundationdb';
import { Context } from '@openland/context';
import { encoders } from './../encoding';
import { Database } from './../Database';
import { Transaction } from './../Transaction';
import { Versionstamp, VersionstampRef } from '@openland/foundationdb-tuple';

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
    private version?: Buffer;
    private versionstampIndex = 0;

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
            if (this.version) {
                this.rawTx.setReadVersion(this.version);
            }
        }
        return this.rawTx!;
    }

    setOptions(options: Partial<fdb.TransactionOptions>) {
        this.options = { ...this.options, ...options };
    }

    setReadVersion(version: Buffer) {
        this.version = version;
    }

    getReadVersion() {
        return this.rawTx!.getReadVersion();
    }

    getCommittedVersion() {
        return new Promise<Buffer>((resolve, reject) => {
            this.afterCommit(() => {
                try {
                    resolve(this.rawTx!.getCommittedVersion());
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    getVersionstamp() {
        return new Promise<Buffer>((resolve, reject) => {
            this.afterCommit(async () => {
                try {
                    resolve(await this.rawTx!.getVersionstamp().promise);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    allocateVersionstampRef(): VersionstampRef {
        let index = this.versionstampIndex;
        this.versionstampIndex++;
        return new VersionstampRef(encoders.int16BE.pack(index));
    }

    async resolveVersionstampRef(ref: VersionstampRef): Promise<Versionstamp> {
        let vt = await this.getVersionstamp();
        return new Versionstamp(Buffer.concat([vt, ref.index]));
    }

    abstract beforeCommit(fn: ((ctx: Context) => Promise<void>) | ((ctx: Context) => void)): void;
    abstract afterCommit(fn: (ctx: Context) => void): void;
}