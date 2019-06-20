import { uniqueSeed, delay } from '@openland/foundationdb-utils';
import { Subspace, BaseLayer, encoders, inTx, Tuple } from '@openland/foundationdb';
import { Context, createNamedContext } from '@openland/context';
import { RandomIDFactory } from './random/RandomIDFactory';

export class RandomLayer extends BaseLayer {

    readonly displayName: string = 'Random Layer';

    private readonly seed = uniqueSeed();
    private nodeIdKeyspace!: Subspace<Tuple[], any>;
    private isStopped = false;
    private randomFactory!: RandomIDFactory;

    nextRandomId(): string {
        return this.randomFactory.next();
    }

    async willStart(ctx: Context) {
        let directory = await this.db.directories.createOrOpen(ctx, ['com.openland.layers', 'random']);
        this.nodeIdKeyspace = (await directory.createOrOpen(ctx, ['nodeId']))
            .withKeyEncoding(encoders.tuple)
            .withValueEncoding(encoders.json);

        while (true) {
            let candidate = Math.round(Math.random() * 1023);
            let now = Date.now();
            let res = await inTx(ctx, async (childCtx) => {
                let existing = await this.nodeIdKeyspace.get(childCtx, [candidate]);
                if (!existing || (existing.timeout < now)) {
                    this.nodeIdKeyspace.set(childCtx, [candidate], { timeout: now + 30000, seed: this.seed });
                    return true;
                } else {
                    return false;
                }
            });

            if (res) {
                this.startRefreshLoop(candidate);
                break;
            } else {
                await delay(500);
            }
        }
    }

    async willStop(ctx: Context): Promise<void> {
        this.isStopped = true;
    }

    private startRefreshLoop(nodeId: number) {
        this.randomFactory = new RandomIDFactory(nodeId);

        // Start Refresh Loop
        // tslint:disable:no-floating-promises
        let rootCtx = createNamedContext('random-layer-refresh');
        (async () => {
            while (!this.isStopped) {
                let updated = await inTx(rootCtx, async (ctx) => {
                    let existing = await this.nodeIdKeyspace.get(ctx, [nodeId]);
                    if (existing && (existing.seed === this.seed)) {
                        this.nodeIdKeyspace.set(ctx, [nodeId], { timeout: Date.now() + 30000, seed: this.seed });
                        return true;
                    } else {
                        return false;
                    }
                });
                if (updated) {
                    await delay(5000);
                } else {
                    if (!this.isStopped) {
                        this.onHalted();
                    }
                }
            }
        })();
    }

    private onHalted() {
        if (process.env.NODE_ENV === 'production') {
            // Halt NodeJS process
            process.abort();
        }
    }
}