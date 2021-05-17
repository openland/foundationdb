#!/usr/bin/env node
import program from 'commander';
// import treeify from 'treeify';

import { Database, getTransaction, inTx, resolveRangeParameters } from '@openland/foundationdb';
import { createNamedContext } from '@openland/context';
import { findAllDirectories } from './ops/findAllDirectories';
import { findMisusedRanges } from './ops/findMisusedRanges';
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
        const directories = await findAllDirectories(rootCtx, database);
        for (let dir of directories) {
            await measureDirectory(dir.path);
        }
    });

program.command('fm')
    .description('Find used key spaces outside of directories')
    .action(async () => {
        const database = await Database.open();
        const directories = await findAllDirectories(rootCtx, database);
        const sorted = directories.map((v) => v.key).sort(Buffer.compare);
        if (sorted.length === 0) {
            console.log('No directories found');
            return;
        }

        const misused = await findMisusedRanges(rootCtx, sorted, database.allKeys);
        if (misused.length === 0) {
            console.log('No misused keys found');
        } else {
            for (let m of misused) {
                if (m.start === null) {
                    console.log('Found invalid key range: <start> - 0x' + m.end!.toString('hex'));
                } else if (m.end === null) {
                    console.log('Found invalid key range: 0x' + m.start!.toString('hex') + ' - <end>');
                } else {
                    console.log('Found invalid key range: 0x' + m.start!.toString('hex') + ' - 0x' + m.end!.toString('hex'));
                }
            }
        }
    });

program.parse(process.argv);

// console.log('Hello world, ', process.argv);