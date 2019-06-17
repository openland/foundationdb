import { createNamedContext } from '@openland/context';
import { Context } from '@openland/context';
import { transactional } from "./transactional";
import { getTransaction } from './getTransaction';

describe('transactional', () => {
    it('should create transaction', async () => {
        let fn = jest.fn();
        class A {
            @transactional
            async txed(ctx: Context) {
                expect(getTransaction(ctx).isReadOnly).toBe(false);
                fn();
            }
        }
        await new A().txed(createNamedContext('test'));
        expect(fn).toHaveBeenCalled();
    });
});