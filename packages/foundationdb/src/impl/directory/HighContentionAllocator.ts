import { Context } from '@openland/context';
import { Database } from './../../Database';
import { TransactionOptionCode } from 'foundationdb';
import { encoders } from '../../encoding';
import { getTransaction } from '../../getTransaction';

//
// Port from https://github.com/apple/foundationdb/blob/master/bindings/go/src/fdb/directory/allocator.go
//

var increment = Buffer.alloc(8);
increment.fill(0);
increment.writeUInt32LE(1, 0);

export class HighContentionAllocator {

    private readonly counters: Buffer;
    private readonly recent: Buffer;

    constructor(subspace: Buffer) {
        this.counters = Buffer.concat([subspace, encoders.tuple.pack([0])]);
        this.recent = Buffer.concat([subspace, encoders.tuple.pack([1])]);
    }

    async allocate(ctx: Context, db: Database) {
        let tx = getTransaction(ctx).rawTransaction(db);
        while (true) {
            let rr = await tx.snapshot().getRangeAllStartsWith(this.counters, { limit: 1, reverse: true });
            let start = 0;
            let window = 0;
            if (rr.length === 1) {
                let ex = encoders.tuple.unpack(rr[0][0].slice(this.counters.length));
                start = ex[0] as number;
            }

            let windowAdvanced = false;
            while (true) {
                // Cannot yield to event loop in this block {
                if (windowAdvanced) {
                    tx.clearRange(this.counters, Buffer.concat([this.counters, encoders.tuple.pack([start])]));
                    tx.setOption(TransactionOptionCode.NextWriteNoWriteConflictRange);
                    tx.clearRange(this.recent, Buffer.concat([this.recent, encoders.tuple.pack([start])]));
                }
                tx.add(Buffer.concat([this.counters, encoders.tuple.pack([start])]), increment);
                let newCountPromise = tx.snapshot().get(Buffer.concat([this.counters, encoders.tuple.pack([start])]));
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
                let key = Buffer.concat([this.recent, encoders.tuple.pack([candidate])]);

                // Cannot yield to event loop in this block {
                var counterRangePromise = tx.snapshot().getRangeAllStartsWith(this.counters, { limit: 1, reverse: true });
                var allocationPromise = tx.get(key);
                tx.setOption(TransactionOptionCode.NextWriteNoWriteConflictRange);
                tx.set(key, Buffer.of());
                // }

                let counterRange = await counterRangePromise;
                var currentWindowStart = counterRange.length > 0 ? counterRange[0].slice(this.counters.length) : 0;
                if (currentWindowStart > start) {
                    break;
                }

                let res = await allocationPromise;
                if (res === null) {
                    tx.addWriteConflictKey(key);
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