#!/usr/bin/env node
import program from 'commander';
import treeify from 'treeify';

import { Database, inTx } from '@openland/foundationdb';
import { createNamedContext } from '@openland/context';
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
        async function readDirectory(parent: string[]): Promise<any> {
            let dirs = await inTx(rootCtx, async (ctx) => {
                return await database.directories.listAll(ctx, parent.length > 0 ? parent : undefined);
            });
            let dirres: any = {};
            for (let d of dirs) {
                dirres[d] = await readDirectory([...parent, d]);
            }
            return dirres;
        }
        const res = await readDirectory([]);
        console.log(treeify.asTree(res, true, true));
    });

// Size usage
program.command('du')
    .description('Read all directories in database')
    .action(async () => {
        const database = await Database.open();
        async function measureDirectory(parent: string[]) {
            console.log(parent.join(' -> ') + ': Counting');
            let keyBytes = 0;
            let keyCount = 0;
            let valueBytes = 0;
            let cursor: Buffer | null = null;
            await inTx(rootCtx, async (ctx) => {
                let subspace = await database.directories.open(ctx, parent);
                while (true) {
                    let read = await subspace.range(ctx, ZERO, { after: cursor ? cursor : undefined, limit: 1000 });
                    if (read.length === 0) {
                        break;
                    }
                    for (let r of read) {
                        keyBytes += r.key.length;
                        valueBytes += r.value.length;
                        keyCount++;
                        cursor = r.key;
                    }
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

program.parse(process.argv);

// console.log('Hello world, ', process.argv);