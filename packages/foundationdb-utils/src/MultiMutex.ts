export class MultiMutex {
    private _locked = new Set<string>();
    private _queue: ({ callback: () => void, keys: string[] })[] = [];

    isLocked(src: string[]) {
        if (src.length === 0) {
            return false;
        }
        if (this._locked.size === 0) {
            return false;
        }
        for (let s of src) {
            if (this._locked.has(s)) {
                return true;
            }
        }
        return false;
    }

    acquireSync = (src: string[]) => {
        if (src.length === 0) {
            return;
        }
        // Preflight check before changing locked keys
        if (this.isLocked(src)) {
            throw Error('internal inconsistency!');
        }

        // Performa actual lock
        for (let s of src) {
            this._locked.add(s);
        }
    }

    acquire = async (src: string[]) => {
        while (this.isLocked(src)) {
            await new Promise<void>((resolve) => {
                this._queue.push({ callback: resolve, keys: src });
            });
        }
        if (this.isLocked(src)) {
            throw Error('internal inconsistency!');
        }
        for (let s of src) {
            this._locked.add(s);
        }
    }

    release = (src: string[]) => {

        // Check inputs before unlocking
        for (let s of src) {
            if (!this._locked.has(s)) {
                throw Error('Trying to release non-locked mutex!');
            }
        }

        // Unlock keys
        for (let s of src) {
            this._locked.delete(s);
        }

        if (this._queue.length > 0) {
            let ex = this._queue.findIndex((s) => !this.isLocked(s.keys));
            if (ex >= 0) {
                let cb = this._queue.splice(ex, 1);
                cb[0].callback();
            }
        }
    }

    runExclusive = async <T>(src: string[], fn: () => Promise<T>): Promise<T> => {
        try {
            if (this.isLocked(src)) {
                await this.acquire(src);
            } else {
                this.acquireSync(src);
            }
            return await fn();
        } finally {
            this.release(src);
        }
    }
}