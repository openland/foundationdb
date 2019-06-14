import * as fdb from 'foundationdb';
import { Database } from './Database';
import { Context } from '@openland/context';

export interface Transaction {
    readonly id: number;
    readonly isReadOnly: boolean;
    readonly isCompleted: boolean;

    beforeCommit(fn: ((ctx: Context) => Promise<void>) | (() => void)): void;
    afterCommit(fn: (ctx: Context) => void): void;

    rawTransaction(db: Database): fdb.Transaction<Buffer, Buffer>;
}