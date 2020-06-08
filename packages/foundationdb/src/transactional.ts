import { Context, isContext } from '@openland/context';
import { inTx } from './inTx';

/**
 * Method decorator for wrapping body in transaction. Method need to have first argument of type Context and return promise.
 */
export function transactional(target: any, key: string, descriptor: TypedPropertyDescriptor<(ctx: Context, ...args: any) => Promise<any>>) {
    const originalMethod = descriptor.value!;
    descriptor.value = async function () {
        let ctx = arguments[0];
        let args = [...arguments].slice(1);
        if (isContext(ctx)) {
            return await inTx(ctx, async (ctx2) => {
                return await originalMethod.apply(this, [ctx2, ...args]);
            });
        } else {
            throw Error('Unable to find context value');
        }
    };
    return descriptor;
}