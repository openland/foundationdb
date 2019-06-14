import { Context } from '@openland/context';
import { BaseTransaction } from './BaseTransaction';

export class ReadWriteTransaction extends BaseTransaction {

    readonly isReadOnly: boolean = false;
    readonly isEphemeral: boolean = false;
    private _beforeCommit: (((ctx: Context) => void) | ((ctx: Context) => Promise<void>))[] = [];
    private _afterCommit: ((ctx: Context) => void)[] = [];
    private _isCompleted = false;

    get isCompleted() {
        return this._isCompleted;
    }

    beforeCommit(fn: ((ctx: Context) => void) | ((ctx: Context) => Promise<void>)) {
        this._beforeCommit.push(fn);
    }

    afterCommit(fn: (ctx: Context) => void) {
        this._afterCommit.push(fn);
    }

    async _flushPending(ctx: Context) {
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

    async _commit(ctx: Context) {
        if (this._isCompleted) {
            return;
        }

        // beforeCommit hook
        let pend = [...this._beforeCommit];
        this._beforeCommit = [];
        for (let p of pend) {
            await p(ctx);
        }

        // Commit changes
        this._isCompleted = true;
        if (this.rawTx) {
            await this.rawTx.rawCommit();
        }

        // afterCommit hook
        let pend2 = [...this._afterCommit];
        this._afterCommit = [];
        if (pend2.length > 0) {
            for (let p of pend2) {
                p(ctx);
            }
        }
    }

    async _handleError(code: number) {
        await this.rawTx!.rawOnError(code);
    }
}