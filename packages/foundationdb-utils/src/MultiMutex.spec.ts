// tslint:disable:no-floating-promises
import { MultiMutex } from './MultiMutex';
import { delay } from './timer';
describe('MultiMutex', () => {
    it('should lock and unlock successfully', () => {
        let mm = new MultiMutex();
        expect(mm.isLocked(['123', '333'])).toBe(false);
        mm.acquireSync(['123', '333']);
        expect(mm.isLocked(['123', '333'])).toBe(true);
        mm.release(['123']);
        expect(mm.isLocked(['123', '333'])).toBe(true);
        mm.release(['333']);
        expect(mm.isLocked(['123', '333'])).toBe(false);
    });

    it('should run exclusively', async () => {
        let mm = new MultiMutex();
        let releaser: () => void;
        let fn1 = jest.fn();
        let fn2 = jest.fn();
        let fn3 = jest.fn();

        mm.runExclusive(['123'], async () => {
            fn1();
            await new Promise((resolve) => {
                releaser = resolve;
            });
            fn3();
        });

        mm.runExclusive(['123', '333'], async () => {
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
    });

    it('should run concurrently', async () => {
        let mm = new MultiMutex();
        let fn1 = jest.fn();
        let fn2 = jest.fn();
        mm.runExclusive(['123'], async () => {
            fn1();
            await null;
        });
        mm.runExclusive(['333'], async () => {
            fn2();
            await null;
        });
        expect(fn1).not.toHaveBeenCalled();
        expect(fn2).not.toHaveBeenCalled();
        await delay(10);
        expect(fn1).toHaveBeenCalledTimes(1);
        expect(fn2).toHaveBeenCalledTimes(1);
    });
});