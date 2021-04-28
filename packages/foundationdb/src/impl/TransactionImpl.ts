import { TransactionTracer } from './../tracing';
import { WriteToReadOnlyContextError } from './../WriteToReadOnlyContextError';
import * as fdb from 'foundationdb';
import { Context } from '@openland/context';
import { encoders } from '../encoding';
import { Database } from '../Database';
import { Transaction } from '../Transaction';
import { Versionstamp, VersionstampRef } from '@openland/foundationdb-tuple';

export class TransactionImpl implements Transaction {

    static createTransaction(isReadOnly: boolean, isHybrid: boolean) {
        return new TransactionImpl(isReadOnly, isHybrid);
    }

    // ID
    private static nextId = 1;
    readonly id = TransactionImpl.nextId++;

    // State
    readonly isReadOnly: boolean;
    readonly isHybrid: boolean;
    private _broken = false;
    private _isCompleted = false;
    get isCompleted() {
        return this._isCompleted;
    }

    // Cache
    readonly userData: Map<string, any> = new Map();

    // Raw Transaction
    private db!: Database;
    private dbTx!: fdb.Transaction;
    private rawTx!: fdb.Transaction;
    private options: Partial<fdb.TransactionOptions> = {};

    // Hooks
    private _beforeCommit: (((ctx: Context) => void) | ((ctx: Context) => Promise<void>))[] = [];
    private _afterCommit: (((ctx: Context) => void) | ((ctx: Context) => Promise<void>))[] = [];

    // Versionstamps
    private vt: Buffer | null = null;
    private vtRequest: ((src: Buffer) => void) | null = null;
    private vtReject: ((src: any) => void) | null = null;
    private vtPromise: Promise<Buffer> | null = null;
    private version?: Buffer;
    private versionstampIndex = 0;

    private constructor(isReadOnly: boolean, isHybrid: boolean, retry?: { db: Database, tx: fdb.Transaction }) {
        this.isReadOnly = isReadOnly;
        this.isHybrid = isHybrid;
        if (retry) {
            this.db = retry.db;
            this.dbTx = retry.tx;
        }
    }

    derive(isReadOnly: boolean, isHybrid: boolean): TransactionImpl {
        if (this.db && this.dbTx) {
            // Reset when transaction is changed from read only to write
            if (this.isHybrid && isHybrid) {
                if (this.isReadOnly && !isReadOnly) {
                    this.dbTx.rawReset();
                }
            }
            return new TransactionImpl(isReadOnly, isHybrid, { db: this.db, tx: this.dbTx });
        } else {
            return new TransactionImpl(isReadOnly, isHybrid);
        }
    }

    //
    // Transaction
    //

    rawWriteTransaction(db: Database): fdb.Transaction {
        if (this.isReadOnly) {
            throw new WriteToReadOnlyContextError();
        }
        return this.rawTransaction(db);
    }

    rawReadTransaction(db: Database): fdb.Transaction {
        return this.rawTransaction(db);
    }

    private rawTransaction(db: Database): fdb.Transaction {
        if (this.db && this.db !== db) {
            throw Error('Unable to use two different connections in the same transaction');
        }

        if (!this.db || !this.dbTx) {
            this.db = db;
            this.dbTx = db.rawDB.rawCreateTransaction(this.options);
        }
        if (!this.rawTx) {
            if (this.isReadOnly) {
                this.rawTx = this.dbTx.snapshot();
            } else {
                this.rawTx = this.dbTx;
            }
            if (this.version) {
                this.rawTx.setReadVersion(this.version);
            }
            if (this.vtRequest && this.vtReject) {
                let vtt = this.rawTx!.getVersionstamp().promise;
                // tslint:disable-next-line:no-floating-promises
                (async () => {
                    try {
                        this.vt = await vtt;
                        this.vtRequest!(this.vt!);
                    } catch (e) {
                        this.vtReject!(e);
                    }
                })();
            }
        }
        return this.rawTx!;
    }

    setOptions(options: Partial<fdb.TransactionOptions>) {
        this.options = { ...this.options, ...options };
    }

    //
    // Versions
    //

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

    //
    // Versionstamps
    //

    getVersionstamp(): Promise<Buffer> {
        if (this.isReadOnly) {
            throw new WriteToReadOnlyContextError('Versionstamps are not available in read-only transactions');
        }

        if (this.vt) {
            return Promise.resolve(this.vt);
        }
        if (!this.vtPromise) {
            this.vtPromise = new Promise((resolve, reject) => {
                this.vtRequest = resolve;
                this.vtReject = reject;
            });
            if (this.rawTx) {
                let vtt = this.rawTx!.getVersionstamp().promise;
                // tslint:disable-next-line:no-floating-promises
                (async () => {
                    try {
                        this.vt = await vtt;
                        this.vtRequest!(this.vt!);
                    } catch (e) {
                        this.vtReject!(e);
                    }
                })();
            }
        }
        return this.vtPromise!;
    }

    allocateVersionstampRef(): VersionstampRef {
        if (this.isReadOnly) {
            throw new WriteToReadOnlyContextError('Versionstamps are not available in read-only transactions');
        }
        let index = this.versionstampIndex;
        this.versionstampIndex++;
        return new VersionstampRef(encoders.int16BE.pack(index));
    }

    async resolveVersionstampRef(ref: VersionstampRef): Promise<Versionstamp> {
        if (this.isReadOnly) {
            throw new WriteToReadOnlyContextError('Versionstamps are not available in read-only transactions');
        }
        let vt = await this.getVersionstamp();
        return new Versionstamp(Buffer.concat([vt, ref.index]));
    }

    //
    // Hooks
    //

    beforeCommit(fn: ((ctx: Context) => void) | ((ctx: Context) => Promise<void>)) {
        this._beforeCommit.push(fn);
    }

    afterCommit(fn: ((ctx: Context) => Promise<void>) | ((ctx: Context) => void)) {
        this._afterCommit.push(fn);
    }

    //
    // Commit
    //

    async flushPending(ctx: Context) {
        if (this._isCompleted) {
            return;
        }
        let pend = [...this._beforeCommit];
        this._beforeCommit = [];
        if (pend.length > 0) {
            for (let p of pend) {
                await p(ctx);
            }
        }
    }

    async commit(ctx: Context) {
        if (this._isCompleted) {
            return;
        }
        if (this._broken) {
            throw Error('Transaction broken');
        }

        // beforeCommit hook
        if (this._beforeCommit.length > 0) {
            let pend = [...this._beforeCommit];
            this._beforeCommit = [];
            for (let p of pend) {
                await TransactionTracer.commitPreHook(ctx, async (ctx2) => {
                    await p(ctx2);
                });
            }
        }

        // Commit changes
        this._isCompleted = true;
        if (this.rawTx) {
            if (this.isReadOnly) {
                this.rawTx.rawCancel();
            } else {
                let rawTx = this.rawTx;
                await TransactionTracer.commitFDB(ctx, async () => {
                    await rawTx.rawCommit();
                });
            }
        }

        // afterCommit hook
        if (this._afterCommit.length > 0) {
            let pend2 = [...this._afterCommit];
            this._afterCommit = [];
            if (pend2.length > 0) {
                for (let p of pend2) {
                    await TransactionTracer.commitPostHook(ctx, async (ctx2) => {
                        await p(ctx2);
                    });
                }
            }
        }
    }

    async broke() {
        this._broken = true;
    }

    async handleError(code: number) {
        await this.rawTx!.rawOnError(code);
    }
}