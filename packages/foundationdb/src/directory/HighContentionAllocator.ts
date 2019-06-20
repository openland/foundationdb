import { Subspace } from './../Subspace';
import { Context } from '@openland/context';
import { TransactionOptionCode } from '@openland/foundationdb-core';
import { encoders, Tuple } from '../encoding';
import { getTransaction } from '../getTransaction';
import { keyIncrement } from '../utils';
import { transactional } from '../transactional';

//
// Port from https://github.com/apple/foundationdb/blob/master/bindings/go/src/fdb/directory/allocator.go
//

var increment = Buffer.alloc(8);
increment.fill(0);
increment.writeUInt32LE(1, 0);

export class HighContentionAllocator {

    private readonly counters: Subspace<Tuple[]>;
    private readonly recent: Subspace<Tuple[]>;

    constructor(subspace: Subspace<Tuple[]>) {
        this.counters = subspace.subspace([0]);
        this.recent = subspace.subspace([1]);
    }

    @transactional
    async allocate(ctx: Context) {
        while (true) {
            let rr = await this.counters.snapshotRange(ctx, [], { limit: 1, reverse: true });
            let start = 0;
            let window = 0;
            if (rr.length === 1) {
                let ex = rr[0].key;
                start = ex[ex.length - 1] as number;
            }

            let windowAdvanced = false;
            while (true) {
                // Cannot yield to event loop in this block {
                if (windowAdvanced) {
                    this.counters.clearRange(ctx, [], [start]);
                    getTransaction(ctx).rawTransaction(this.counters.db).setOption(TransactionOptionCode.NextWriteNoWriteConflictRange);
                    this.recent.clearRange(ctx, [], [start]);
                }
                this.counters.add(ctx, [start], increment);
                let newCountPromise = this.counters.snapshotGet(ctx, [start]);
                // }
                let newCount = await newCountPromise;
                let count = 0;
                if (newCount !== null) {
                    count = newCount.readUInt32LE(0);
                }

                window = this.windowSize(start);
                if (count * 2 < window) {
                    break;
                }

                start += window;
                windowAdvanced = true;
            }

            while (true) {
                // As of the snapshot being read from, the window is less than half
                // full, so this should be expected to take 2 tries.  Under high
                // contention (and when the window advances), there is an additional
                // subsequent risk of conflict for this transaction.
                let candidate = Math.floor(Math.random() * window) + start;
                let key = Buffer.concat([this.recent.prefix, encoders.tuple.pack([candidate])]);

                // Cannot yield to event loop in this block {
                var counterRangePromise = this.counters.snapshotRange(ctx, [], { limit: 1, reverse: true });
                var allocationPromise = this.recent.get(ctx, [candidate]);
                getTransaction(ctx).rawTransaction(this.counters.db).setOption(TransactionOptionCode.NextWriteNoWriteConflictRange);
                this.recent.set(ctx, [candidate], Buffer.of());
                // }

                let counterRange = await counterRangePromise;
                var currentWindowStart = counterRange.length > 0 ? counterRange[0].key.slice(this.counters.prefix.length) : 0;
                if (currentWindowStart > start) {
                    break;
                }

                let res = await allocationPromise;
                if (res === null) {
                    getTransaction(ctx).rawTransaction(this.counters.db).addWriteConflictRange(key, keyIncrement(key));
                    return candidate;
                }
            }
        }
    }

    private windowSize(start: number) {
        // Larger window sizes are better for high contention, smaller sizes for
        // keeping the keys small.  But if there are many allocations, the keys
        // can't be too small.  So start small and scale up.  We don't want this to
        // ever get *too* big because we have to store about window_size/2 recent
        // items.
        if (start < 255) {
            return 64;
        }
        if (start < 65535) {
            return 1024;
        }
        return 8192;
    }
}