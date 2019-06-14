import { Context } from '@openland/context';
import { BaseTransaction } from './BaseTransaction';

export class ReadOnlyTransaction extends BaseTransaction {
    readonly isReadOnly: boolean = true;
    readonly isCompleted: boolean = false;
    beforeCommit(fn: ((ctx: Context) => Promise<void>) | (() => void)) {
        throw Error('Trying to write to read-only context');
    }
    afterCommit(fn: (ctx: Context) => void) {
        throw Error('Trying to write to read-only context');
    }
}