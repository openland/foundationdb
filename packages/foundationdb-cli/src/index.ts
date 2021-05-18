#!/usr/bin/env node
// tslint:disable:no-console

import program from 'commander';
import treeify from 'treeify';
import ora from 'ora';
import filesize from 'filesize';
import fs from 'fs';
import { disableAll } from '@openland/log';
disableAll();

import { Database, getTransaction, inTx, resolveRangeParameters } from '@openland/foundationdb';
import { createNamedContext } from '@openland/context';
import { findAllDirectories } from './ops/findAllDirectories';
import { findMisusedRanges } from './ops/findMisusedRanges';
import { createTree, getTreeItem, materializeTree, parseTree, setTreeItem } from './ops/tree';
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
    .option('-r, --recover <recover>', 'Recover path')
    .option('-o, --output <path>', 'Output path')
    .action(async (options) => {
        function formatSize(keySize: number, valueSize: number, count: number) {
            return `${filesize(keySize)}/${filesize(valueSize)}/${count}`;
        }

        // Read recovery
        let tree = createTree<{ keySize: number, valueSize: number, count: number }>({ keySize: 0, valueSize: 0, count: 0 });
        if (options.recover) {
            if (fs.existsSync(options.recover)) {
                tree = parseTree(JSON.parse(fs.readFileSync(options.recover, 'utf-8')));
            }
        }

        function saveRecovery() {
            fs.writeFileSync(options.recover, JSON.stringify(materializeTree(tree)), 'utf-8');
        }

        const spinner = ora('Loading directories').start();
        const database = await Database.open();
        async function measureDirectory(parent: string[]) {
            let keyBytes = 0;
            let keyCount = 0;
            let valueBytes = 0;
            let cursor: Buffer | null = null;
            let iteration = 0;
            await inTx(rootCtx, async (ctx) => {
                if (iteration > 0) {
                    spinner.text = 'Measuring ' + parent.join(' -> ') + ': ' + (formatSize(keyBytes, valueBytes, keyCount));
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
            spinner.clear();
            console.log(parent.join(' -> ') + ': ' + (formatSize(keyBytes, valueBytes, keyCount)));
            spinner.render();
            return { keyBytes, valueBytes, keyCount };
        }
        const directories = await findAllDirectories(rootCtx, database);
        for (let dir of directories) {
            let ex = getTreeItem(tree, dir.path);
            if (!ex) {
                spinner.text = 'Measuring ' + dir.path.join(' -> ');
                let r = await measureDirectory(dir.path);
                for (let i = 0; i <= dir.path.length; i++) {
                    let v = getTreeItem(tree, dir.path.slice(0, i))!;
                    if (v) {
                        v.value.count += r.keyCount;
                        v.value.keySize += r.keyBytes;
                        v.value.valueSize += r.valueBytes;
                    } else {
                        setTreeItem(tree, dir.path.slice(0, i), { count: r.keyCount, keySize: r.keyBytes, valueSize: r.valueBytes });
                    }
                }
                if (options.recover) {
                    saveRecovery();
                }
            }
        }

        if (options.output) {
            fs.writeFileSync(options.output, JSON.stringify(materializeTree(tree)), 'utf-8');
        }

        spinner.clear();
        console.log(treeify.asTree(materializeTree(tree), true, false));
        spinner.render();
        spinner.succeed('Completed').stop();
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

// Size usage
program.command('status')
    .description('Read status')
    .action(async () => {
        const database = await Database.open();
        let status = await inTx(rootCtx, async (ctx) => {
            getTransaction(ctx).setOptions({ read_system_keys: true });
            return (await database.allKeys.get(ctx, Buffer.concat([Buffer.of(0xff, 0xff), Buffer.from('/status/json', 'utf-8')])))!;
        });
        console.log(status.toString('utf-8'));
    });

program.parse(process.argv);

// console.log('Hello world, ', process.argv);