import { DirectoryLayer } from './impl/directory/DirectoryLayer';
import { Subspace } from './Subspace';
import * as fdb from 'foundationdb';
import { GlobalSubspace } from './impl/GlobalSubspace';
import { randomNumbersString } from './utils';
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
     * Function for opening database with specific prefix and deletes 
     * everything under this prefix.
     * 
     * @param name 
     */
    static async openTest(name?: string) {
        if (process.env.NODE_ENV === 'production') {
            throw Error('Trying to open test database in production mode');
        }
        let nm = name ? name : 'test-' + randomNumbersString(64);
        let db: fdb.Database = fdb.openSync()
            .at(nm);
        await db.clearRange(Buffer.of());
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
     * Root directory layer
     */
    readonly directory: DirectoryLayer;

    /**
     * Constructor for client
     * @param db raw database object
     */
    private constructor(db: fdb.Database) {
        this.rawDB = db;
        this.allKeys = new GlobalSubspace(this);
        this.directory = new DirectoryLayer(this, this.allKeys.subspace(Buffer.of(0xfe)), this.allKeys);
    }

    /**
     * Closing database
     */
    close() {
        this.rawDB.close();
    }
}