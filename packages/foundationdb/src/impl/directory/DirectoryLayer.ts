import { Database } from '../../Database';
import { Context } from '@openland/context';
import { HighContentionAllocator } from './HighContentionAllocator';
import { Subspace } from '../../Subspace';
import { encoders, Tuple } from '../../encoding';
import { transactable } from '../../transactable';

class Node {
    readonly subspace!: Subspace<Tuple[]>;
    readonly path: string[];
    readonly targetPath: string[];
    readonly exists: boolean;
    readonly layer!: Buffer;

    constructor(
        subspace: Subspace<Tuple[]> | null,
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

const empty = Buffer.alloc(0);
const partition = Buffer.from('partition', 'ascii');
const SUBDIR = 0;

export class DirectoryLayer {
    private readonly VERSION = [1, 0, 0]
    private readonly nodeSS: Subspace<Tuple[]>;
    private readonly contentSS: Subspace<Tuple[]>;
    private readonly rootNode: Subspace<Tuple[]>;
    private readonly allocator: HighContentionAllocator;
    readonly db: Database;

    constructor(db: Database, nodeSS: Subspace, contentSS: Subspace) {
        this.nodeSS = nodeSS.withKeyEncoding(encoders.tuple);
        this.contentSS = contentSS.withKeyEncoding(encoders.tuple);
        this.rootNode = this.nodeSS.subspace([nodeSS.prefix]);
        let allocatorPath = Buffer.concat([this.rootNode.prefix, encoders.tuple.pack([Buffer.from('hca', 'ascii')])]);
        this.allocator = new HighContentionAllocator(allocatorPath);
        this.db = db;
    }

    @transactable
    async createOrOpen(ctx: Context, path: string[]) {
        return this.doCreateOrOpen(ctx, path, null, true, true);
    }

    @transactable
    async create(ctx: Context, path: string[]) {
        return this.doCreateOrOpen(ctx, path, null, true, false);
    }

    @transactable
    async open(ctx: Context, path: string[]) {
        return this.doCreateOrOpen(ctx, path, null, false, true);
    }

    @transactable
    async exists(ctx: Context, path: string[]) {
        await this.checkVersion(ctx, false);
        let res = await this.find(ctx, path);
        if (!res.exists) {
            return false;
        }

        // TODO: Implement partitions
        if (res.layer.equals(partition)) {
            throw Error('partitions are not supported');
        }

        return true;
    }

    @transactable
    private async doCreateOrOpen(ctx: Context, path: string[], layer: Buffer | null, allowCreate: boolean, allowOpen: boolean) {
        if (path.length === 0) {
            throw Error('Path can\'t be empty');
        }
        await this.checkVersion(ctx, false);

        let res = await this.find(ctx, path);
        if (res.exists) {

            // TODO: Implement partitions
            if (res.layer.equals(partition)) {
                throw Error('partitions are not supported');
            }

            if (layer) {
                if (Buffer.compare(res.layer, layer!) !== 0) {
                    throw Error('the directory was created with an incompatible layer');
                }
            }

            if (!allowOpen) {
                throw Error('directory already exists');
            }

            return this.prefixFromNode(res);
        }

        if (!allowCreate) {
            throw Error('directory does not exists');
        }

        // Create directory if not exists
        await this.checkVersion(ctx, true);

        // Content Subspace
        let newss = this.contentSS.subspace([await this.allocator.allocate(ctx, this.db)]);
        let prefix = newss.prefix;
        if ((await newss.range(ctx, [], { limit: 1 })).length !== 0) {
            throw Error('the database has keys stored at the prefix chosen by the automatic prefix allocator');
        }

        // Parent directory
        let parentPrefix = this.nodeSS.prefix;
        if (path.length > 1) {
            parentPrefix = await this.doCreateOrOpen(ctx, path.slice(0, path.length - 1), layer, allowCreate, allowOpen);
        }
        let parent = this.nodeSS.subspace([parentPrefix]);

        // Create node
        let newNodeSS = this.nodeWithPrefix(prefix);
        newNodeSS.set(ctx, [Buffer.from('layer', 'ascii')], layer || empty);

        // Set reference to parent node
        parent.set(ctx, [SUBDIR, path[path.length - 1]], prefix);

        return prefix;
    }

    private async checkVersion(ctx: Context, allowWrite: boolean) {
        let ex = await this.rootNode.get(ctx, ([Buffer.from('version', 'ascii')]))
        if (!ex) {
            if (allowWrite) {
                this.initDirectory(ctx);
            }
        } else {
            var version = [];
            for (var i = 0; i < 3; ++i) {
                version.push(ex.readInt32LE(4 * i));
            }
            if (version[0] > this.VERSION[0]) {
                throw new Error('Unsupported directory version');
            }
            if (version[1] > this.VERSION[1]) {
                throw new Error('Unsupported directory version');
            }
        }
    }

    private initDirectory(ctx: Context) {
        var versionBuf = Buffer.alloc(12);
        for (var i = 0; i < 3; ++i) {
            versionBuf.writeUInt32LE(this.VERSION[i], i * 4);
        }
        this.rootNode.set(ctx, [Buffer.from('version', 'ascii')], versionBuf);
    }

    private async find(ctx: Context, path: string[]) {
        let node = new Node(this.rootNode, [], path, empty);
        let currentPath: string[] = [];
        for (let p of path) {
            currentPath.push(p);
            let prefix = await node.subspace.get(ctx, [SUBDIR, p]);
            if (prefix) {
                let nsp = this.nodeWithPrefix(prefix);
                let layer = await nsp.get(ctx, [Buffer.from('layer', 'ascii')]) || empty;
                node = new Node(nsp, [...currentPath], path, layer);
            } else {
                node = new Node(null, [...currentPath], path, empty);
            }
            if (!node.exists || Buffer.compare(node.layer, partition) === 0) {
                return node;
            }
        }
        return node;
    }

    private nodeWithPrefix(prefix: Buffer): Subspace<Tuple[]> {
        return this.nodeSS.subspace([prefix]);
    }

    private prefixFromNode(node: Node) {
        let r = node.subspace.prefix.slice(this.nodeSS.prefix.length);
        return encoders.tuple.unpack(r)[0] as Buffer;
    }
}