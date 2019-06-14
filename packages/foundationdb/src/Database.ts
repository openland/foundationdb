import * as fdb from 'foundationdb';
fdb.setAPIVersion(600);

export class Database {

    static open(clusterFile?: string) {
        let db: fdb.Database = fdb.openSync(clusterFile);
        return new Database(db);
    }

    readonly rawDB: fdb.Database;

    private constructor(db: fdb.Database) {
        this.rawDB = db;
    }

    close() {
        this.rawDB.close();
    }
}