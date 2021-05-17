#!/usr/bin/env node
import program from 'commander';
// import treeify from 'treeify';

import { Database, getTransaction, inTx, resolveRangeParameters } from '@openland/foundationdb';
import { createNamedContext } from '@openland/context';
import { findAllDirectories } from './ops/findAllDirectories';
const version = require(__dirname + '/../package.json').version as string;
const rootCtx = createNamedContext('ofdbcli');
const ZERO = Buffer.from([]);

// Description
program
    .name('ofdbcli')
    .version(version)
    .description('Openland FoundationDB CLI');

// Size usage
program.command('ls')
    .description('Read all directories in database')
    .action(async () => {
        const database = await Database.open();
        const directories = await findAllDirectories(rootCtx, database);
        for (let dir of directories) {
            console.log(dir.path.join(' -> ') + ': ' + dir.key.toString('hex'));
        }
    });

// Size usage
program.command('du')
    .description('Read all directories in database')
    .action(async () => {
        const database = await Database.open();
        async function measureDirectory(parent: string[]) {
            // console.log(parent.join(' -> ') + ': Counting');
            let keyBytes = 0;
            let keyCount = 0;
            let valueBytes = 0;
            let cursor: Buffer | null = null;
            let iteration = 0;
            await inTx(rootCtx, async (ctx) => {
                if (iteration > 0) {
                    console.log(parent.join(' -> ') + ': Counting ' + iteration);
                }
                iteration++;
                let subspace = await database.directories.open(ctx, parent);
                let tx = getTransaction(ctx)!.rawReadTransaction(database);
                let args = resolveRangeParameters({ after: cursor ? cursor : undefined, prefix: subspace.prefix, key: ZERO });
                for await (const [key, value] of tx.getRange(args.start, args.end)) {
                    keyBytes += key.length;
                    valueBytes += value.length;
                    keyCount++;
                    cursor = key.subarray(subspace.prefix.length);
                }
            });
            console.log(parent.join(' -> ') + ': ' + JSON.stringify({ keyBytes, valueBytes, keyCount }));
        }
        async function processDirectory(parent: string[]): Promise<any> {
            if (parent.length > 0) {
                await measureDirectory(parent);
            }
            let dirs = await inTx(rootCtx, async (ctx) => {
                return await database.directories.listAll(ctx, parent.length > 0 ? parent : undefined);
            });
            for (let d of dirs) {
                await processDirectory([...parent, d]);
            }
        }
        await processDirectory([]);
    });

program.command('fm')
    .description('Find used key spaces outside of directories')
    .action(async () => {
        const database = await Database.open();
    });

program.parse(process.argv);

// console.log('Hello world, ', process.argv);