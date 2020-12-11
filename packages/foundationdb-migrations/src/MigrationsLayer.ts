import { createLogger, withLogPath } from '@openland/log';
import { delay } from '@openland/foundationdb-utils';
import { BaseLayer, encoders, inTx } from '@openland/foundationdb';
import { MigrationDefinition } from './MigrationDefinition';
import { singletonWorker } from '@openland/foundationdb-singleton';

const log = createLogger('migration');

export class MigrationsLayer extends BaseLayer {
    readonly displayName = 'Migrations Layer';
    private migrations: MigrationDefinition[];

    constructor(migrations: MigrationDefinition[]) {
        super();
        this.migrations = migrations;
    }

    async didStart() {
        singletonWorker({ name: 'com.openland.layers.migrator', db: this.db }, async (ctx) => {
            if (this.migrations.length !== 0) {
                let dir = (await this.db.directories.createOrOpen(ctx, ['com.openland.layers', 'migrator', 'completed']))
                    .withKeyEncoding(encoders.tuple)
                    .withValueEncoding(encoders.boolean);
                let appliedTransactions = await dir.range(ctx, []);
                let remaining = this.migrations.filter((v) => !appliedTransactions.find((m) => m.key[0] === v.key));
                if (remaining.length > 0) {
                    log.log(ctx, 'Remaining migrations: ' + remaining.length);
                    for (let m of remaining) {
                        log.log(ctx, 'Starting migration: ' + m.key);
                        let ctx2 = withLogPath(ctx, m.key);
                        try {
                            await m.migration(ctx2);
                        } catch (e) {
                            log.error(ctx, e);
                            throw e;
                        }
                        await inTx(ctx2, async (ctx3) => {
                            let ex = await dir.get(ctx3, [m.key]);
                            if (ex) {
                                throw Error('Parallel migrations detected');
                            }
                            dir.set(ctx3, [m.key], true);
                        });
                        log.log(ctx, 'Completed migration: ' + m.key);
                    }
                    log.log(ctx, 'All migrations are completed');
                }
            }
            await delay(1500000);
        });
    }
}