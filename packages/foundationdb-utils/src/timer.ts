import { createLogger } from '@openland/log';
import { Context } from '@openland/context';

const log = createLogger('backoff');

export function delayBreakable(ms: number) {
    // We can cancel delay from outer code
    let promiseResolver: ((value?: any | PromiseLike<any>) => void) | null = null;
    let resolver = () => {
        if (promiseResolver) {
            promiseResolver();
        }
    };
    let promise = new Promise(resolve => {
        promiseResolver = resolve;
        setTimeout(resolve, ms);
    });
    return { promise, resolver };
}

export async function delay(ms: number) {
    return new Promise(resolve => { setTimeout(resolve, ms); });
}

export function exponentialBackoffDelay(currentFailureCount: number, minDelay: number, maxDelay: number, maxFailureCount: number) {
    let maxDelayRet = minDelay + ((maxDelay - minDelay) / maxFailureCount) * currentFailureCount;
    return Math.random() * maxDelayRet;
}

export async function backoff<T>(ctx: Context, callback: () => Promise<T>): Promise<T> {
    let currentFailureCount = 0;
    const minDelay = 500;
    const maxDelay = 15000;
    const maxFailureCount = 50;
    while (true) {
        try {
            return await callback();
        } catch (e) {
            if (currentFailureCount > 3) {
                log.warn(ctx, e);
            }
            if (currentFailureCount < maxFailureCount) {
                currentFailureCount++;
            }

            let waitForRequest = exponentialBackoffDelay(currentFailureCount, minDelay, maxDelay, maxFailureCount);
            await delay(waitForRequest);
        }
    }
}

export function forever(ctx: Context, callback: () => Promise<void>) {
    // tslint:disable-next-line:no-floating-promises
    (async () => {
        while (true) {
            await backoff(ctx, callback);
        }
    })();
}

export function foreverBreakable(ctx: Context, callback: () => Promise<void>) {
    let working = true;
    // tslint:disable-next-line:no-floating-promises
    let promise = (async () => {
        while (working) {
            await backoff(ctx, callback);
        }
    })();

    return {
        stop: async () => {
            working = false;
            await promise;
        }
    };
}