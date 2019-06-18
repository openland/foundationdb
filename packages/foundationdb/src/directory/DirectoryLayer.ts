import { Database } from '../Database';
import { Context } from '@openland/context';
import { HighContentionAllocator } from './HighContentionAllocator';
import { Subspace } from '../Subspace';
import { encoders, Tuple } from '../encoding';
import { transactional } from '../transactional';

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

function hasPrefix(src: Buffer, value: Buffer) {
    if (src.length < value.length) {
        return false;
    }
    return value.equals(src.slice(0, value.length));
}

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

    @transactional
    async createOrOpen(ctx: Context, path: string[]) {
        return this.doCreateOrOpen(ctx, path, null, null, true, true);
    }

    @transactional
    async create(ctx: Context, path: string[]) {
        return this.doCreateOrOpen(ctx, path, null, null, true, false);
    }

    @transactional
    async open(ctx: Context, path: string[]) {
        return this.doCreateOrOpen(ctx, path, null, null, false, true);
    }

    @transactional
    async createPrefix(ctx: Context, path: string[], prefix: Buffer) {
        return this.doCreateOrOpen(ctx, path, null, prefix, true, false);
    }

    @transactional
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

    @transactional
    private async doCreateOrOpen(ctx: Context, path: string[], layer: Buffer | null, prefix: Buffer | null, allowCreate: boolean, allowOpen: boolean) {
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

        let resPrefix: Buffer;
        if (!prefix) {

            let allocated = await this.allocator.allocate(ctx, this.db);

            // Check content keys
            let newss = this.contentSS.subspace([allocated]);
            if ((await newss.range(ctx, [], { limit: 1 })).length !== 0) {
                throw Error('the database has keys stored at the prefix chosen by the automatic prefix allocator');
            }

            // Check node prefix keys
            if (!await this.isPrefixFree(ctx, newss.prefix)) {
                throw Error('the directory layer has manually allocated prefixes that conflict with the automatic prefix allocator');
            }

            resPrefix = newss.prefix;
        } else {
            if (!await this.isPrefixFree(ctx, prefix)) {
                throw Error('the given prefix is already in use');
            }
            resPrefix = prefix;
        }

        // Parent directory
        let parentPrefix = this.nodeSS.prefix;
        if (path.length > 1) {
            parentPrefix = await this.doCreateOrOpen(ctx, path.slice(0, path.length - 1), null, null, allowCreate, allowOpen);
        }
        let parent = this.nodeSS.subspace([parentPrefix]);

        // Create node
        let newNodeSS = this.nodeWithPrefix(resPrefix);
        newNodeSS.set(ctx, [Buffer.from('layer', 'ascii')], layer || empty);

        // Set reference to parent node
        parent.set(ctx, [SUBDIR, path[path.length - 1]], resPrefix);

        return resPrefix;
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

    private async isPrefixFree(ctx: Context, prefix: Buffer) {
        if (await this.nodeContainingPrefix(ctx, prefix)) {
            return false;
        }

        let newss = this.nodeSS.subspace([prefix]);
        if ((await newss.range(ctx, [], { limit: 1 })).length !== 0) {
            return false;
        }
        return true;
    }

    private async nodeContainingPrefix(ctx: Context, prefix: Buffer) {
        if (hasPrefix(prefix, this.nodeSS.prefix)) {
            return this.nodeSS;
        }
        let r = await this.nodeSS.range(ctx, [prefix], { limit: 1 });
        if (r.length > 0) {
            let key = r[0].key;
            return this.nodeWithPrefix(key[key.length - 1] as Buffer);
        } else {
            return null;
        }
    }
}