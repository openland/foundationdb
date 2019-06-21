import path = require('path');

import FDBError from './error';
import { MutationType, StreamingMode } from './opts.g';

export type KVList = {
  results: [Buffer, Buffer][], // [key, value] pair.
  more: boolean,
};

export type NativeWatch = {
  cancel(): void
  // Resolves to true if the watch resolved normally. false if the watch it was aborted.
  promise: Promise<boolean>
};

export interface NativeTransaction {
  setOption(code: number, param: string | number | Buffer | null): void;

  commit(): Promise<void>;
  reset(): void;
  cancel(): void;
  onError(code: number): Promise<void>;

  get(key: Buffer, isSnapshot: boolean): Promise<Buffer | null>;
  getKey(key: Buffer, orEqual: boolean, offset: number, isSnapshot: boolean): Promise<Buffer | null>;
  set(key: Buffer, val: Buffer): void;
  clear(key: Buffer): void;

  atomicOp(opType: MutationType, key: Buffer, operand: Buffer): void;

  getRange(
    start: Buffer, beginOrEq: boolean, beginOffset: number,
    end: Buffer, endOrEq: boolean, endOffset: number,
    limit: number, targetBytes: number,
    mode: StreamingMode, iter: number, isSnapshot: boolean, reverse: boolean
  ): Promise<KVList>;

  clearRange(start: Buffer, end: Buffer): void;

  watch(key: Buffer, ignoreStandardErrs: boolean): NativeWatch;

  addReadConflictRange(start: Buffer, end: Buffer): void;
  addWriteConflictRange(start: Buffer, end: Buffer): void;

  setReadVersion(v: Buffer): void;
  getReadVersion(): Promise<Buffer>;
  getCommittedVersion(): Buffer;

  getVersionstamp(): Promise<Buffer>;

  getAddressesForKey(key: Buffer): string[];
}

export interface NativeDatabase {
  createTransaction(): NativeTransaction; // invalid after the database has closed
  setOption(code: number, param: string | number | Buffer | null): void;
  close(): void;
}

export interface NativeCluster {
  openDatabase(dbName: 'DB'): Promise<NativeDatabase>;
  openDatabaseSync(dbName: 'DB'): NativeDatabase;
  close(): void;
}

export enum ErrorPredicate {
  Retryable = 50000,
  MaybeCommitted = 50001,
  RetryableNotCommitted = 50002,
}

export interface NativeModule {
  setAPIVersion(v: number): void;
  setAPIVersionImpl(v: number, h: number): void;

  startNetwork(): void;
  stopNetwork(): void;

  createCluster(filename?: string): Promise<NativeCluster>;
  createClusterSync(filename?: string): NativeCluster;

  setNetworkOption(code: number, param: string | number | Buffer | null): void;

  errorPredicate(test: ErrorPredicate, code: number): boolean;
}

// Will load a compiled build if present or a prebuild.
// If no build if found it will throw an exception
const rootDir = __dirname.endsWith(`dist${path.sep}lib`) // gross.
  ? path.resolve(`${__dirname}/../..`)
  : path.resolve(`${__dirname}/..`);

let mod;
try {
  mod = require('node-gyp-build')(rootDir);
} catch (e) {
  // tslint:disable:no-console
  console.error('Could not load native module. Make sure the foundationdb client is installed and');
  console.error('(on windows) in your PATH. https://www.foundationdb.org/download/');
  // tslint:enable:no-console
  throw e;
}
mod.FDBError = FDBError;

export default mod as NativeModule;