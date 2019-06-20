import { createLogger } from '@openland/log';
import { createNamedContext } from '@openland/context';
import uuid from 'uuid/v4';

const log = createLogger('backoff');
const unknownContext = createNamedContext('unknown');

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

export async function backoff<T>(callback: () => Promise<T>): Promise<T> {
    let currentFailureCount = 0;
    const minDelay = 500;
    const maxDelay = 15000;
    const maxFailureCount = 50;
    while (true) {
        try {
            return await callback();
        } catch (e) {
            if (currentFailureCount > 3) {
                log.warn(unknownContext, e);
            }
            if (currentFailureCount < maxFailureCount) {
                currentFailureCount++;
            }

            let waitForRequest = exponentialBackoffDelay(currentFailureCount, minDelay, maxDelay, maxFailureCount);
            await delay(waitForRequest);
        }
    }
}

export function forever(callback: () => Promise<void>) {
    // tslint:disable-next-line:no-floating-promises
    (async () => {
        while (true) {
            await backoff(callback);
        }
    })();
}

export function foreverBreakable(callback: () => Promise<void>) {
    let working = true;
    // tslint:disable-next-line:no-floating-promises
    let promise = (async () => {
        while (working) {
            await backoff(callback);
        }
    })();

    return {
        stop: async () => {
            working = false;
            await promise;
        }
    };
}

export function uniqueSeed() {
    return uuid();
}