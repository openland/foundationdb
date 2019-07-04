import { delayBreakable } from '@openland/foundationdb-utils';
import { Context } from '@openland/context';
import { withoutTransaction } from '@openland/foundationdb';
import { BusSubcription } from '@openland/foundationdb-bus';
import { Stream } from './Stream';
import { EntityDescriptor } from './EntityDescriptor';

export class LiveStream<T> {
    private readonly baseStream: Stream<T>;
    private ended = false;
    private awaiter?: () => void;
    private subscription?: BusSubcription;

    constructor(stream: Stream<T>, descriptor: EntityDescriptor<unknown>) {
        this.baseStream = stream;

        this.subscription = descriptor.storage.eventBus.subscibe('fdb-entity-created-' + descriptor.storageKey, (data: any) => {
            if (data.entity === descriptor.storageKey) {
                if (this.awaiter) {
                    this.awaiter();
                    this.awaiter = undefined;
                }
            }
        });
    }

    generator(parent: Context): AsyncIterable<{ items: T[], cursor: string | null }> {
        let t = this;
        let ctx = withoutTransaction(parent); // Clear transaction information since live stream manage transactions by itself
        return {
            [Symbol.asyncIterator]() {
                return {
                    ...(async function* func() {
                        if (!t.baseStream.cursor) {
                            let tail = await t.baseStream.tail(ctx);
                            if (tail) {
                                t.baseStream.seek(tail);
                            }
                        }
                        while (!t.ended) {
                            let res = await t.baseStream.next(ctx);
                            if (res.length > 0) {
                                yield { items: res, cursor: t.baseStream.cursor };
                            } else {
                                let w = delayBreakable(10000 + Math.random() * 15000);
                                t.awaiter = w.resolver;
                                await w.promise;
                                t.awaiter = undefined;
                            }
                        }
                    })(),
                    return: async () => {
                        t.handleEnded();
                        return { done: true, value: { items: [], cursor: t.baseStream.cursor } };
                    }
                };
            }
        };
    }

    private handleEnded() {
        this.ended = true;
        if (this.subscription) {
            this.subscription.cancel();
            this.subscription = undefined;
        }
    }
}