import { ChildSubspace } from './impl/ChildSubspace';
import { DirectoryLayer } from './DirectoryLayer';
import { Context } from '@openland/context';
import { Subspace } from './Subspace';

export interface Directory extends Subspace {
    path: string[];
    open(ctx: Context, path: string[]): Promise<Directory>;
    create(ctx: Context, path: string[]): Promise<Directory>;
    createOrOpen(ctx: Context, path: string[]): Promise<Directory>;
    createPrefix(ctx: Context, path: string[], prefix: Buffer): Promise<Directory>;
    exists(ctx: Context, path: string[]): Promise<boolean>;
}

export class DirectorySubspace extends ChildSubspace implements Directory {
    readonly path: string[];
    readonly prefix: Buffer;
    private readonly layer: DirectoryLayer;

    constructor(layer: DirectoryLayer, path: string[], prefix: Buffer) {
        super(layer.db, prefix);
        this.path = path;
        this.layer = layer;
        this.prefix = prefix;
    }

    async open(ctx: Context, path: string[]): Promise<Directory> {
        return await this.layer.open(ctx, [...this.path, ...path]);
    }

    async create(ctx: Context, path: string[]): Promise<Directory> {
        return await this.layer.create(ctx, [...this.path, ...path]);
    }

    async createOrOpen(ctx: Context, path: string[]): Promise<Directory> {
        return await this.layer.createOrOpen(ctx, [...this.path, ...path]);
    }

    async createPrefix(ctx: Context, path: string[], prefix2: Buffer): Promise<Directory> {
        return await this.layer.createPrefix(ctx, [...this.path, ...path], prefix2);
    }

    async exists(ctx: Context, path: string[]): Promise<boolean> {
        return await this.layer.exists(ctx, [...this.path, ...path]);
    }
}