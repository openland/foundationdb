#!/usr/bin/env node
import program from 'commander';
import treeify from 'treeify';

import { Database, inTx } from '@openland/foundationdb';
import { createNamedContext } from '@openland/context';
const version = require(__dirname + '/../package.json').version as string;
const rootCtx = createNamedContext('ofdbcli');

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

program.parse(process.argv);

// console.log('Hello world, ', process.argv);