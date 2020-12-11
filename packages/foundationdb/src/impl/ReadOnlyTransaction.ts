import { Context } from '@openland/context';
import { BaseTransaction } from './BaseTransaction';

export class ReadOnlyTransaction extends BaseTransaction {
    readonly isReadOnly: boolean = true;
    readonly isCompleted: boolean = false;
    readonly isEphemeral: boolean;
    
    constructor(isEphemeral: boolean) {
        super();
        this.isEphemeral = isEphemeral;
    }

    beforeCommit(fn: ((ctx: Context) => Promise<void>) | ((ctx: Context) => void)) {
        throw Error('Trying to write to read-only context');
    }
    afterCommit(fn: ((ctx: Context) => Promise<void>) | ((ctx: Context) => void)) {
        throw Error('Trying to write to read-only context');
    }
}