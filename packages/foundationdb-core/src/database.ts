import * as fdb from './native';
import Transaction from './transaction';
import { eachOption } from './opts';
import { DatabaseOptions, TransactionOptions, databaseOptionData } from './opts.g';

export default class Database {
  private readonly _db: fdb.NativeDatabase;

  constructor(db: fdb.NativeDatabase) {
    this._db = db;
  }

  setNativeOptions(opts: DatabaseOptions) {
    eachOption(databaseOptionData, opts, (code, val) => this._db.setOption(code, val));
  }

  rawCreateTransaction(opts?: TransactionOptions) {
    return new Transaction(this._db.createTransaction(), false, opts);
  }

  close() {
    this._db.close();
  }
}

export const createDatabase = (db: fdb.NativeDatabase): Database => {
  return new Database(db);
};