// tslint:disable:no-floating-promises
import { Mutex } from './Mutex';
import { delay } from './';

describe('Mutex', () => {
    it('should lock for same key', async () => {
        let mutex = new Mutex();
        let releaser: () => void;
        let fn1 = jest.fn();
        let fn2 = jest.fn();
        let fn3 = jest.fn();
        
        mutex.runExclusive(async () => {
            fn1();
            await new Promise((resolve) => {
                releaser = resolve;
            });
            fn3();
        });
        expect(mutex.isLocked).toBeTruthy();
        mutex.runExclusive(async () => {
            fn2();
        });
        await delay(10);
        expect(fn1).toHaveBeenCalledTimes(1);
        expect(fn2).not.toHaveBeenCalled();
        expect(fn3).not.toHaveBeenCalled();
        releaser!();
        await delay(10);
        expect(fn1).toHaveBeenCalledTimes(1);
        expect(fn2).toHaveBeenCalledTimes(1);
        expect(fn3).toHaveBeenCalledTimes(1);
        expect(mutex.isLocked).toBeFalsy();
    });
});