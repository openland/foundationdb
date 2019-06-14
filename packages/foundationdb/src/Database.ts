import { Subspace } from './Subspace';
import * as fdb from 'foundationdb';
import { GlobalSubspace } from './impl/GlobalSubspace';
fdb.setAPIVersion(600);

/**
 * Database is an entry point for working wiht FoundationDB.
 * 
 * To open database static method `Database.open`
 */
export class Database {

    /**
     * Function for opening database
     * 
     * @param clusterFile optional path to FoundationDB cluster file
     */
    static open(clusterFile?: string) {
        let db: fdb.Database = fdb.openSync(clusterFile);
        return new Database(db);
    }

    /**
     * Direct access for underlying database
     */
    readonly rawDB: fdb.Database;

    /**
     * Subspace for all keys
     */
    readonly allKeys: Subspace

    /**
     * Constructor for client
     * @param db raw database object
     */
    private constructor(db: fdb.Database) {
        this.rawDB = db;
        this.allKeys = new GlobalSubspace(this);
    }

    /**
     * Closing database
     */
    close() {
        this.rawDB.close();
    }
}