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

    runExclusive = <T>(fn: () => Promise<T>): Promise<T> => {
        return (async () => {
            if (!this.locked) {
                this.acquireSync();
            } else {
                await this.acquire();
            }
            try {
                return await fn();
            } finally {
                this.release();
            }
        })();
    }
}