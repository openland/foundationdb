import { createNamedContext } from '@openland/context';
import { Context } from '@openland/context';
import { transactable } from "./transactable";
import { getTransaction } from './getTransaction';

describe('transactable', () => {
    it('should create transaction', async () => {
        let fn = jest.fn();
        class A {
            @transactable
            async txed(ctx: Context) {
                expect(getTransaction(ctx).isReadOnly).toBe(false);
                fn();
            }
        }
        await new A().txed(createNamedContext('test'));
        expect(fn).toHaveBeenCalled();
    });
});