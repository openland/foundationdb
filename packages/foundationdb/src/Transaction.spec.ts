import { createNamedContext } from '@openland/context';
import { getTransaction } from './getTransaction';
import { inTx } from './inTx';
import { Database } from './Database';

describe('Transaction', () => {
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

    it('should crash when using two different connections in the same transaction', async () => {
        let db1 = await Database.openTest();
        let db2 = await Database.openTest();
        let r = inTx(createNamedContext('test'), async (ctx) => {
            db1.allKeys.set(ctx, Buffer.of(1), Buffer.of());
            db2.allKeys.set(ctx, Buffer.of(1), Buffer.of());
        });
        await expect(r).rejects.toThrowError();
    });

    it('should retry on conflict', async () => {
        let db = await Database.openTest();
        let iteration = 0;
        await inTx(createNamedContext('test'), async (ctx) => {
            await db.allKeys.get(ctx, Buffer.from([1]));
            if (iteration === 0) {
                await inTx(createNamedContext('test'), async (ctx2) => {
                    db.allKeys.set(ctx2, Buffer.from([1]), Buffer.from([]));
                });
            }
            db.allKeys.set(ctx, Buffer.from([1]), Buffer.from([1]));
            iteration++;
        });
        expect(iteration).toBe(2);
    });

    it('should limit retry attempts', async () => {
        
        //
        // Original source for node-foundationdb
        //
        // await db.rawDB.doTn(async (tn) => {
        //     await tn.get('key');
        //     await db.rawDB.doTn(async (tn2) => {
        //         tn2.set('key', 'value-1');
        //     });
        //     tn.set('key', 'value-1');
        // }, { retry_limit: 1 });
        //

        let db = await Database.openTest();
        await expect(inTx(createNamedContext('test'), async (ctx) => {
            getTransaction(ctx).setOptions({ retry_limit: 1 });
            await db.allKeys.get(ctx, Buffer.from([1]));
            await inTx(createNamedContext('test'), async (ctx2) => {
                db.allKeys.set(ctx2, Buffer.from([1]), Buffer.from([]));
            });
            db.allKeys.set(ctx, Buffer.from([1]), Buffer.from([1]));
        })).rejects.toThrowError('Transaction not committed due to conflict with another transaction');
    });
});