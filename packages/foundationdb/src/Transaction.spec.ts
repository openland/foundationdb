import { withReadOnlyTransaction } from './withReadOnlyTransaction';
import { createNamedContext } from '@openland/context';
import { getTransaction } from './getTransaction';
import { inTx } from './inTx';
import { withoutTransaction } from './withoutTransaction';
import { Database } from './Database';

describe('Transaction', () => {
    it('should be ephemeral in empty context', async () => {
        let ctx = createNamedContext('test');
        let tx = getTransaction(ctx);
        expect(tx.isReadOnly).toBe(true);
        expect(tx.isCompleted).toBe(false);
        expect(tx.isEphemeral).toBe(true);
    });
    it('should throw error on hooks in read only transaction', async () => {
        let ctx = withReadOnlyTransaction(createNamedContext('test'));
        let tx = getTransaction(ctx);
        expect(tx.isReadOnly).toBe(true);
        expect(tx.isCompleted).toBe(false);
        expect(tx.isEphemeral).toBe(false);
        expect(() => tx.afterCommit(() => { /* */ })).toThrowError();
        expect(() => tx.beforeCommit(() => { /* */ })).toThrowError();
    });

    it('should nested read transaction be same', async () => {
        let ctx = withReadOnlyTransaction(createNamedContext('test'));
        let tx = getTransaction(ctx);
        let ctx2 = withReadOnlyTransaction(ctx);
        let tx2 = getTransaction(ctx2);
        expect(tx).toBe(tx2);
    });

    it('should nested write transaction be same', async () => {
        let root = createNamedContext('test');
        let afterCommit1 = jest.fn();
        let afterCommit2 = jest.fn();
        let beforeCommit1 = jest.fn();
        let beforeCommit2 = jest.fn();
        let beforeCommit3 = jest.fn();
        await inTx(root, async (ctx1) => {
            let tx = getTransaction(ctx1);
            expect(tx.isReadOnly).toBe(false);
            expect(tx.isCompleted).toBe(false);
            expect(tx.isEphemeral).toBe(false);

            tx.afterCommit(afterCommit1);
            tx.beforeCommit(beforeCommit1);

            await inTx(ctx1, async (ctx2) => {
                let tx2 = getTransaction(ctx2);
                expect(tx).toBe(tx2);

                tx.beforeCommit(beforeCommit3);
                expect(beforeCommit3).toHaveBeenCalledTimes(0);
                await inTx(ctx2, async (ctx3) => {
                    expect(beforeCommit3).toHaveBeenCalledTimes(0);
                });
                expect(beforeCommit3).toHaveBeenCalledTimes(0);
                expect(beforeCommit1).toHaveBeenCalledTimes(0);
                expect(afterCommit1).not.toHaveBeenCalled();
            });

            expect(beforeCommit3).toHaveBeenCalledTimes(0);
            expect(beforeCommit1).toHaveBeenCalledTimes(0);
            expect(afterCommit1).not.toHaveBeenCalled();
            tx.afterCommit(afterCommit2);
            tx.beforeCommit(beforeCommit2);
        });

        expect(beforeCommit1).toHaveBeenCalledTimes(1);
        expect(beforeCommit2).toHaveBeenCalledTimes(1);
        expect(beforeCommit3).toHaveBeenCalledTimes(1);
        expect(afterCommit1).toHaveBeenCalledTimes(1);
        expect(afterCommit2).toHaveBeenCalledTimes(1);
    });

    it('should be reset after withoutTransaction', async () => {
        let ctx = withReadOnlyTransaction(createNamedContext('test'));
        let tx = getTransaction(ctx);
        let tx2 = getTransaction(ctx);
        let tx3 = getTransaction(withoutTransaction(ctx));
        expect(tx2).toBe(tx);
        expect(tx3).not.toBe(tx);
    });

    it('should crash when using two different connections in the same transaction', async () => {
        let db1 = await Database.openTest();
        let db2 = await Database.openTest();
        let r = inTx(createNamedContext('test'), async (ctx) => {
            db1.allKeys.set(ctx, Buffer.of(1), Buffer.of());
            db2.allKeys.set(ctx, Buffer.of(1), Buffer.of());
        });
        await expect(r).rejects.toThrowError();
    });
});