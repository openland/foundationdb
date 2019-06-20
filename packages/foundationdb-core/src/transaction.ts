import { NativeWatch, NativeTransaction } from './native';

import keySelector, { KeySelector } from './keySelector';
import { eachOption } from './opts';
import {
  TransactionOptions,
  TransactionOptionCode,
  transactionOptionData,
  StreamingMode,
  MutationType
} from './opts.g';

const byteZero = Buffer.alloc(1);
byteZero.writeUInt8(0, 0);

export interface RangeOptionsBatch {
  // defaults to Iterator for batch mode, WantAll for getRangeAll.
  streamingMode?: StreamingMode;
  limit?: number;
  reverse?: boolean;
}

export interface RangeOptions extends RangeOptionsBatch {
  targetBytes?: number;
}

export type KVList = {
  results: [Buffer, Buffer][], // [key, value] pair.
  more: boolean,
};

export { NativeWatch as Watch };

export type WatchOptions = {
  throwAllErrors?: boolean
};

const doNothing = () => { /* Nothing */ };

// NativeValue is string | Buffer because the C code accepts either format.
// But all values returned from methods will actually just be Buffer.
export default class Transaction {
  private readonly _tn: NativeTransaction;
  readonly isSnapshot: boolean;

  constructor(tn: NativeTransaction, snapshot: boolean, opts?: TransactionOptions) {
    this._tn = tn;
    this.isSnapshot = snapshot;
    if (opts) {
      eachOption(transactionOptionData, opts, (code, val) => tn.setOption(code, val));
    }
  }

  // Usually you should pass options when the transaction is constructed.
  // Options are shared between a transaction object and any other aliases
  // (snapshots, transactions in other scopes)
  setOption(opt: TransactionOptionCode, value?: number | string | Buffer) {
    // TODO: Check type of passed option is valid.
    this._tn.setOption(opt, (value == null) ? null : value);
  }

  // Returns a mirror transaction which does snapshot reads.
  snapshot(): Transaction {
    return new Transaction(this._tn, true);
  }

  async rawCommit(): Promise<void> {
    await this._tn.commit();
  }
  rawReset() { this._tn.reset(); }
  rawCancel() { this._tn.cancel(); }

  async rawOnError(code: number): Promise<void> {
    return this._tn.onError(code);
  }

  get(key: Buffer): Promise<Buffer | null> {
    return this._tn.get(key, this.isSnapshot);
  }

  getKey(_sel: Buffer | KeySelector): Promise<Buffer | null> {
    const sel = keySelector.from(_sel);
    return this._tn.getKey(sel.key, sel.orEqual, sel.offset, this.isSnapshot);
  }

  set(key: Buffer, val: Buffer) {
    this._tn.set(key, val);
  }

  clear(key: Buffer) {
    this._tn.clear(key);
  }

  /**
   * Range reads
   * @param start start key
   * @param end end key
   * @param opts options
   */
  async getRangeAll(start: Buffer | KeySelector, end: Buffer | KeySelector, opts: RangeOptions = {}) {
    const childOpts: RangeOptions = { ...opts };
    if (childOpts.streamingMode == null) {
      childOpts.streamingMode = StreamingMode.WantAll;
    }

    const result: [Buffer, Buffer][] = [];
    for await (const batch of this.getRangeBatch(start, end, childOpts)) {
      result.push.apply(result, batch);
    }
    return result;
  }

  private getRangeNative(start: KeySelector, end: KeySelector, limit: number, targetBytes: number,
    streamingMode: StreamingMode, iter: number, reverse: boolean): Promise<KVList> {
    return this._tn.getRange(
      start.key, start.orEqual, start.offset,
      end.key, end.orEqual, end.offset,
      limit, targetBytes, streamingMode,
      iter, this.isSnapshot, reverse
    );
  }

  private async *getRangeBatch(
    _start: Buffer | KeySelector, // Consider also supporting string / buffers for these.
    _end: Buffer | KeySelector, // If not specified, start is used as a prefix.
    opts: RangeOptions = {}) {
    let start = keySelector.from(_start);
    let end = keySelector.from(_end);
    let limit = opts.limit || 0;
    const streamingMode = opts.streamingMode == null ? StreamingMode.Iterator : opts.streamingMode;

    let iter = 0;
    while (1) {
      const { results, more } = await this.getRangeNative(start, end, limit, 0, streamingMode, ++iter, opts.reverse || false);

      if (results.length) {
        if (!opts.reverse) {
          start = keySelector.firstGreaterThan(results[results.length - 1][0]);
        } else {
          end = keySelector.firstGreaterOrEqual(results[results.length - 1][0]);
        }
      }

      yield results;

      if (!more) {
        break;
      }
      if (limit) {
        limit -= results.length;
        if (limit <= 0) {
          break;
        }
      }
    }
  }

  clearRange(start: Buffer, end: Buffer) {
    this._tn.clearRange(start, end);
  }

  watch(key: Buffer, opts?: WatchOptions): NativeWatch {
    const throwAll = opts && opts.throwAllErrors;
    const watch = this._tn.watch(key, !throwAll);
    // Suppress the global unhandledRejection handler when a watch errors
    watch.promise.catch(doNothing);
    return watch;
  }

  /**
   * Read conflict range
   * @param start 
   * @param end 
   */
  addReadConflictRange(start: Buffer, end: Buffer) {
    this._tn.addReadConflictRange(start, end);
  }
  addWriteConflictRange(start: Buffer, end: Buffer) {
    this._tn.addWriteConflictRange(start, end);
  }

  // version must be 8 bytes
  setReadVersion(v: Buffer) {
    this._tn.setReadVersion(v);
  }
  getReadVersion(): Promise<Buffer> {
    return this._tn.getReadVersion();
  }
  getCommittedVersion() {
    return this._tn.getCommittedVersion();
  }

  // Note: This promise can't be directly returned via the return value of a
  // transaction.
  getVersionstamp(): { promise: Promise<Buffer> } {
    // This one is surprisingly tricky:
    //
    // - If we return the promise as normal, you'll deadlock if you try to
    //   return it via your async tn function (since JS automatically
    //   flatmaps promises)
    // - Also if the tn conflicts, this promise will also generate an error.
    //   By default node will crash your program when it sees this error.
    //   We'll allow the error naturally, but suppress node's default
    //   response by adding an empty catch function
    const promise = this._tn.getVersionstamp();
    promise.catch(doNothing);
    return { promise };
  }

  getAddressesForKey(key: Buffer): string[] {
    return this._tn.getAddressesForKey(key);
  }

  // **** Atomic operations

  atomicOp(opType: MutationType, key: Buffer, oper: Buffer) {
    this._tn.atomicOp(opType, key, oper);
  }

  // Does little-endian addition on encoded values. Value transformer should encode to some
  // little endian type.
  add(key: Buffer, oper: Buffer) { this.atomicOp(MutationType.Add, key, oper); }
  max(key: Buffer, oper: Buffer) { this.atomicOp(MutationType.Max, key, oper); }
  min(key: Buffer, oper: Buffer) { this.atomicOp(MutationType.Min, key, oper); }

  // Raw buffer variants are provided here to support fancy bit packing semantics.
  bitAnd(key: Buffer, oper: Buffer) { this.atomicOp(MutationType.BitAnd, key, oper); }
  bitOr(key: Buffer, oper: Buffer) { this.atomicOp(MutationType.BitOr, key, oper); }
  bitXor(key: Buffer, oper: Buffer) { this.atomicOp(MutationType.BitXor, key, oper); }

  // Performs lexicographic comparison of byte strings. Sets the value in the
  // database to the lexographical min / max of its current value and the
  // value supplied as a parameter. If the key does not exist in the database
  // this is the same as set().
  byteMin(key: Buffer, val: Buffer) { this.atomicOp(MutationType.ByteMin, key, val); }
  byteMax(key: Buffer, val: Buffer) { this.atomicOp(MutationType.ByteMax, key, val); }
}
