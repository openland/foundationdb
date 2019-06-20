// Stuff that hasn't been ported over:

// const Transactional = require('./retryDecorator')
// const locality = require('./locality')
// const directory = require('./directory')

import nativeMod, * as fdb from './native';
import Database, { createDatabase } from './database';
import { eachOption } from './opts';
import { NetworkOptions, networkOptionData, DatabaseOptions } from './opts.g';

import * as apiVersion from './apiVersion';

// Must be called before fdb is initialized. Eg setAPIVersion(510).
export { set as setAPIVersion } from './apiVersion';

// This is called implicitly when the first cluster / db is opened.
let initCalled = false;
const init = () => {
  if (apiVersion.get() == null) {
    throw Error('You must specify an API version to connect to FoundationDB. Eg: fdb.setAPIVersion(510);');
  }

  if (initCalled) {
    return;
  }
  initCalled = true;

  nativeMod.startNetwork();

  process.on('exit', () => nativeMod.stopNetwork());
};

// Destroy the network thread. This is not needed under normal circumstances;
// but can be used to de-init FDB.
export const stopNetworkSync = nativeMod.stopNetwork;

export { default as FDBError } from './error';
export { default as keySelector, KeySelector } from './keySelector';

// These are exported to give consumers access to the type. Databases must
// always be constructed using open or via a cluster object.
export { default as Database } from './database';
export { default as Transaction, Watch } from './transaction';

export {
  NetworkOptions,
  NetworkOptionCode,
  DatabaseOptions,
  DatabaseOptionCode,
  TransactionOptions,
  TransactionOptionCode,
  StreamingMode,
  MutationType,
  ConflictRangeType,
  ErrorPredicate,
} from './opts.g';

const wrapCluster = (cluster: fdb.NativeCluster) => ({
  async openDatabase(dbName: 'DB' = 'DB', opts?: DatabaseOptions) {
    const db = createDatabase(await cluster.openDatabase(dbName));
    if (opts) {
      db.setNativeOptions(opts);
    }
    return db;
  },
  close() { cluster.close(); }
});

export const createCluster = (clusterFile?: string) => {
  init();
  return nativeMod.createCluster(clusterFile).then(c => wrapCluster(c));
};

// Can only be called before open() or openSync().
export function configNetwork(netOpts: NetworkOptions) {
  if (initCalled) {
    throw Error('configNetwork must be called before FDB connections are opened');
  }
  eachOption(networkOptionData, netOpts, (code, val) => nativeMod.setNetworkOption(code, val));
}

// Returns a promise to a database.
// Note any network configuration must preceed this call.
export function open(clusterFile?: string, dbOpts?: DatabaseOptions) {
  return createCluster(clusterFile).then(c => c.openDatabase('DB', dbOpts));
}

// TODO: Should I expose a method here for stopping the network for clean shutdown?
// I feel like I should.. but I'm not sure when its useful. Will the network thread
// keep the process running?