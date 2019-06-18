import { Database } from './Database';
import { Context } from '@openland/context';

export interface Layer {
    readonly displayName: string;
    init(db: Database): void;
    willStart(ctx: Context): Promise<void>;
    didStart(ctx: Context): Promise<void>;
    willStop(ctx: Context): Promise<void>;
    didStop(ctx: Context): Promise<void>;
}

export abstract class BaseLayer implements Layer {
    abstract readonly displayName: string;
    db!: Database;

    init(db: Database) {
        this.db = db;
    }

    async willStart(ctx: Context): Promise<void> {
        // Empty
    }
    async didStart(ctx: Context): Promise<void> {
        // Empty
    }
    async willStop(ctx: Context): Promise<void> {
        // Empty
    }
    async didStop(ctx: Context): Promise<void> {
        // Empty
    }
}