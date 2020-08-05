import * as fdb from 'foundationdb';
import { TupleItem } from '@openland/foundationdb-tuple';
import { DirectorySubspace } from './Directory';
import { Database } from './Database';
import { Context } from '@openland/context';
import { Subspace } from './Subspace';
import { transactional } from './transactional';
import { getTransaction } from './getTransaction';

class Node {
    readonly subspace!: Subspace<TupleItem[]>;
    readonly path: string[];
    readonly targetPath: string[];
    readonly exists: boolean;
    readonly layer!: Buffer;

    constructor(
        subspace: Subspace<TupleItem[]> | null,
        path: string[],
        targetPath: string[],
        layer: Buffer | null
    ) {
        if (subspace) {
            this.subspace = subspace;
        }
        if (layer) {
            this.layer = layer;
        }
        this.path = path;
        this.targetPath = targetPath;
        this.exists = !!subspace;
    }
}

export class DirectoryLayer {

    readonly db: Database;
    private readonly directory: fdb.DirectoryLayer;

    constructor(db: Database, nodeSS: Subspace, contentSS: Subspace) {
        this.db = db;
        this.directory = new fdb.DirectoryLayer({
            nodePrefix: nodeSS.prefix,
            contentPrefix: contentSS.prefix,
            allowManualPrefixes: true
        });
    }

    @transactional
    async createOrOpen(ctx: Context, path: string[]) {
        let raw = getTransaction(ctx).rawTransaction(this.db);
        return this.wrap(await this.directory.createOrOpen(raw, path));
    }

    @transactional
    async create(ctx: Context, path: string[]) {
        let raw = getTransaction(ctx).rawTransaction(this.db);
        return this.wrap(await this.directory.create(raw, path));
    }

    @transactional
    async open(ctx: Context, path: string[]) {
        let raw = getTransaction(ctx).rawTransaction(this.db);
        return this.wrap(await this.directory.open(raw, path));
    }

    @transactional
    async createPrefix(ctx: Context, path: string[], prefix: Buffer) {
        let raw = getTransaction(ctx).rawTransaction(this.db);
        return this.wrap(await this.directory.create(raw, path, undefined, prefix));
    }

    @transactional
    async exists(ctx: Context, path: string[]) {
        let raw = getTransaction(ctx).rawTransaction(this.db);
        return await this.directory.exists(raw, path);
    }

    @transactional
    async move(ctx: Context, oldPath: string[], newPath: string[]) {
        let raw = getTransaction(ctx).rawTransaction(this.db);
        await this.directory.move(raw, oldPath, newPath);
    }

    private wrap(src: fdb.Directory) {
        return new DirectorySubspace(this, src.getPath(), src.getSubspace().prefix);
    }
}