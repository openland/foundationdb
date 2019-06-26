export class Mutex {
    private locked = false;
    private queue: (() => void)[] = [];

    get isLocked() {
        return this.locked;
    }

    acquireSync = () => {
        if (this.locked) {
            throw Error('internal inconsistency!');
        }
        this.locked = true;
    }

    acquire = async () => {
        while (this.locked) {
            await new Promise<void>((resolve) => {
                this.queue.push(resolve);
            });
        }
        if (this.locked) {
            throw Error('internal inconsistency!');
        }
        this.locked = true;
    }

    release = () => {
        if (!this.locked) {
            throw Error('Trying to release non-locked mutex!');
        }
        this.locked = false;
        if (this.queue.length > 0) {
            let ex = this.queue.shift()!;
            ex();
        }
    }

    runExclusive = async <T>(fn: () => Promise<T>): Promise<T> => {
        try {
            await this.acquire();
            return await fn();
        } finally {
            this.release();
        }
    }
}