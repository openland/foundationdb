import { Context } from '@openland/context';

export interface MigrationDefinition {
    key: string;
    migration: (ctx: Context) => Promise<void>;
}