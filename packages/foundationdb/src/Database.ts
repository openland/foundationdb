import { Context, createNamedContext } from '@openland/context';
import { Layer } from './Layer';
import { DirectoryLayer } from './DirectoryLayer';
import { Subspace } from './Subspace';
import * as fdb from 'foundationdb';
import { GlobalSubspace } from './impl/GlobalSubspace';
import { randomNumbersString } from './utils';
import { inTx } from './inTx';

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
    static async open(args?: { layers: Layer[], clusterFile?: string }) {
        fdb.setAPIVersion(600);
        let db: fdb.Database = await fdb.open(args && args.clusterFile);
        let res = new Database(db);
        if (args && args.layers) {
            for (let l of args.layers) {
                res.register(l);
            }
        }
        await res.start(createNamedContext('start'));
        return res;
    }

    /**
     * Function for opening database with specific prefix and deletes 
     * everything under this prefix.
     * 
     * @param name 
     */
    static async openTest(args?: { layers: Layer[], clusterFile?: string, name?: string }) {
        fdb.setAPIVersion(600);
        if (process.env.NODE_ENV === 'production') {
            throw Error('Trying to open test database in production mode');
        }
        let nm = args && args.name ? args.name : 'test-' + randomNumbersString(64);
        let db: fdb.Database = await fdb.open(args && args.clusterFile);
        let res = new Database(db, Buffer.from(nm, 'utf-8'));
        await inTx(createNamedContext('test'), async (ctx) => {
            res.allKeys.clearPrefixed(ctx, Buffer.of());
        });
        if (args && args.layers) {
            for (let l of args.layers) {
                res.register(l);
            }
        }
        await res.start(createNamedContext('test'));
        return res;
    }

    /**
     * Direct access for underlying database
     */
    readonly rawDB: fdb.Database;

    /**
     * Subspace for all keys
     */
    readonly allKeys: Subspace;

    /**
     * Root directory layer
     */
    readonly directories: DirectoryLayer;

    /**
     * Flag to avoid double start
     */
    private started = false;

    /** 
     * Registered layers 
     */
    private layers = new Map<any, Layer>();

    /**
     * Constructor for client
     * @param db raw database object
     */
    private constructor(db: fdb.Database, prefix?: Buffer) {
        this.rawDB = db;
        let global: Subspace = new GlobalSubspace(this);
        if (prefix) {
            global = global.subspace(prefix);
        }
        this.allKeys = global;
        this.directories = new DirectoryLayer(this, this.allKeys.subspace(Buffer.of(0xfe)), this.allKeys);
    }

    /**
     * Get registered layer
     * @param arg layer class
     */
    get<T extends Layer>(arg: new (...args: any) => T): T {
        let res = this.layers.get(arg);
        if (res) {
            return res! as T;
        } else {
            throw Error('Layer is not registered');
        }
    }

    /**
     * Closing database
     * @param ctx context
     */
    async close(ctx: Context) {
        for (let l of this.layers.values()) {
            await l.willStop(ctx);
        }
        this.rawDB.close();
        for (let l of this.layers.values()) {
            await l.didStop(ctx);
        }
    }

    /**
     * Register new layer
     * @param layer layer for registration
     */
    private register<T extends Layer>(layer: T) {
        if (this.started) {
            throw Error('Datanase already started!');
        }
        let key = (layer as any).constructor;
        if (this.layers.has(key)) {
            throw Error('Layer already registered');
        }
        layer.init(this);
        this.layers.set(key, layer);
    }

    /**
     * Start database and it's layers
     * @param ctx context
     */
    private async start(ctx: Context) {
        if (this.started) {
            throw Error('Datanase already started!');
        }
        this.started = true;
        for (let l of this.layers.values()) {
            await l.willStart(ctx);
        }
        for (let l of this.layers.values()) {
            await l.didStart(ctx);
        }
    }
}