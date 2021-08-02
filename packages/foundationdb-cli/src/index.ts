#!/usr/bin/env node
// tslint:disable:no-console

import program from 'commander';
import treeify from 'treeify';
import ora from 'ora';
import filesize from 'filesize';
import fs from 'fs';
import { disableAll } from '@openland/log';
import prompts from 'prompts';
disableAll();

import { Database, getTransaction, inTx, keyNext, resolveRangeParameters, Subspace } from '@openland/foundationdb';
import { createNamedContext } from '@openland/context';
import { findAllDirectories } from './ops/findAllDirectories';
import { findMisusedRanges } from './ops/findMisusedRanges';
import { createTree, getTreeItem, materializeTree, parseTree, setTreeItem, Tree } from './ops/tree';
import { formatBuffer } from '@openland/foundationdb-utils';
import { getBoundaryKeys } from './ops/getBoundaryKeys';
const version = require(__dirname + '/../package.json').version as string;
const rootCtx = createNamedContext('ofdbcli');
const ZERO = Buffer.from([]);

function formatSize(keySize: number, valueSize: number, prefixSize: number, count: number) {
    return `${filesize(keySize)}/${filesize(valueSize)}/${filesize(prefixSize)}/${count}`;
}

async function measureSubspace(subspace: Subspace, spinner?: ora.Ora, tag?: string) {
    let keyBytes = 0;
    let keyCount = 0;
    let valueBytes = 0;
    let cursor: Buffer | null = null;
    let iteration = 0;
    await inTx(rootCtx, async (ctx) => {
        if (iteration > 0 && tag && spinner) {
            spinner.text = 'Measuring ' + tag + ': ' + (formatSize(keyBytes, valueBytes, keyCount * subspace.prefix.length, keyCount));
        }
        iteration++;
        let tx = getTransaction(ctx)!.rawReadTransaction(subspace.db);
        let args = resolveRangeParameters({ after: cursor ? cursor : undefined, prefix: subspace.prefix, key: ZERO });
        for await (const [key, value] of tx.getRange(args.start, args.end)) {
            keyBytes += key.length;
            valueBytes += value.length;
            keyCount++;
            cursor = key.subarray(subspace.prefix.length);
        }
    });
    if (tag && spinner) {
        spinner.clear();
        console.log(tag + ': ' + (formatSize(keyBytes, valueBytes, keyCount * subspace.prefix.length, keyCount)));
        spinner.render();
    }
    let prefixBytes = keyCount * subspace.prefix.length;
    return { keyBytes, valueBytes, keyCount, prefixBytes };
}

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

program.command('sh')
    .description('Read all shards')
    .action(async () => {
        const spinner = ora('Loading shards').start();
        const database = await Database.open();
        let keys = await getBoundaryKeys(rootCtx, database, Buffer.from([]), Buffer.from([0xff, 0xff, 0xff]));
        spinner.stop();
        for (let k of keys) {
            console.log(formatBuffer(k));
        }
        // const directories = await findAllDirectories(rootCtx, database);
        // for (let dir of directories) {
        //     console.log(dir.path.join(' -> ') + ': ' + dir.key.toString('hex'));
        // }
    });

// Size usage
program.command('du')
    .description('Read all directories in database')
    .option('-r, --recover <recover>', 'Recover path')
    .option('-o, --output <path>', 'Output path')
    .action(async (options) => {
        // Read recovery
        let tree = createTree<{ keySize: number, valueSize: number, count: number, prefixSize: number }>({ keySize: 0, valueSize: 0, count: 0, prefixSize: 0 });
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
        const directories = await findAllDirectories(rootCtx, database);

        // Measuring directories
        for (let dir of directories) {
            let ex = getTreeItem(tree, dir.path);
            if (!ex) {
                spinner.text = 'Measuring ' + dir.path.join(' -> ');
                let r = await measureSubspace(database.allKeys.subspace(dir.key), spinner, dir.path.join(' -> '));
                for (let i = 0; i <= dir.path.length; i++) {
                    if (i === dir.path.length) {
                        setTreeItem(tree, dir.path, { count: r.keyCount, keySize: r.keyBytes, valueSize: r.valueBytes, prefixSize: r.prefixBytes });
                    } else {
                        if (!getTreeItem(tree, dir.path.slice(0, i))) {
                            setTreeItem(tree, dir.path.slice(0, i), { count: 0, keySize: 0, valueSize: 0, prefixSize: 0 });
                        }
                    }
                }
                if (options.recover) {
                    saveRecovery();
                }
            }
        }

        // Measure directory registry
        spinner.text = 'Measuring directories';
        const r = await measureSubspace(database.allKeys.subspace(Buffer.of(0xfe)), spinner, 'Measuring directories');
        setTreeItem(tree, ['$directories'], { keySize: r.keyBytes, valueSize: r.valueBytes, count: r.keyCount, prefixSize: r.prefixBytes });

        // Convert to tree
        type PrintedTree = { sizeSt: string, size: number, count: number, prefixSizeSt: string, prefixSize: number, keySizeSt: string, keySize: number, valueSizeSt: string, valueSize: number, children?: { [key: string]: PrintedTree } };
        function printTree(src: Tree<{ keySize: number, valueSize: number, count: number, prefixSize: number }>): PrintedTree {
            let size = src.value.keySize + src.value.valueSize + src.value.prefixSize;
            let count = src.value.count;
            let keySize = src.value.keySize;
            let valueSize = src.value.valueSize;
            let prefixSize = src.value.prefixSize;
            let children: { [key: string]: PrintedTree } = {};
            if (src.child.size === 0) {
                return {
                    sizeSt: filesize(size),
                    size,
                    count,
                    keySizeSt: filesize(keySize),
                    keySize,
                    valueSizeSt: filesize(valueSize),
                    valueSize,
                    prefixSize: prefixSize,
                    prefixSizeSt: filesize(prefixSize)
                };
            } else {
                if (src.value.count !== 0) {
                    children['$self'] = {
                        sizeSt: filesize(size),
                        size,
                        count,
                        keySizeSt: filesize(keySize),
                        keySize,
                        valueSizeSt: filesize(valueSize),
                        valueSize,
                        prefixSize: prefixSize,
                        prefixSizeSt: filesize(prefixSize)
                    }
                }

                let unsorted: [string, PrintedTree][] = [];
                for (let ch of src.child.keys()) {
                    let r = src.child.get(ch)!;
                    let p = printTree(r);
                    size += p.size;
                    count += p.count;
                    keySize += p.keySize;
                    valueSize += p.valueSize;
                    prefixSize += p.prefixSize;
                    unsorted.push([ch, p]);
                }
                unsorted.sort(function (a, b) {
                    return b[1].size - a[1].size;
                });
                for (let k of unsorted) {
                    children[k[0]] = k[1];
                }
                return {
                    sizeSt: filesize(size),
                    size,
                    count,
                    keySizeSt: filesize(keySize),
                    keySize,
                    valueSizeSt: filesize(valueSize),
                    valueSize,
                    prefixSize: prefixSize,
                    prefixSizeSt: filesize(prefixSize),
                    children
                };
            }
        }
        const printedTree = printTree(tree);

        if (options.output) {
            fs.writeFileSync(options.output, JSON.stringify(printedTree), 'utf-8');
        }

        spinner.clear();
        console.log(treeify.asTree(printedTree as any, true, false));
        spinner.render();
        spinner.succeed('Completed').stop();
    });

program.command('da')
    .description('Measure all keys and values in database')
    .action(async () => {
        const spinner = ora('Starting').start();
        const database = await Database.open();
        spinner.text = 'Measuring';
        const r = await measureSubspace(database.allKeys, spinner, 'Measuring');
        spinner.clear();
        console.log(formatSize(r.keyBytes, r.valueBytes, r.prefixBytes, r.keyCount));
        spinner.render();
        spinner.succeed('Completed').stop();
    });

program.command('fm')
    .description('Find used key spaces outside of directories')
    .action(async () => {
        const spinner = ora('Starting').start();
        const database = await Database.open();
        spinner.text = 'Loading directories';
        const directories = await findAllDirectories(rootCtx, database);
        const sorted = directories.map((v) => v.key).sort(Buffer.compare);
        if (sorted.length === 0) {
            spinner.fail('No directories found').stop();
            return;
        }
        spinner.text = 'Measuring';
        const misused = await findMisusedRanges(rootCtx, sorted, database.allKeys);
        if (misused.length === 0) {
            spinner.succeed('No misused keys found').stop();
        } else {
            spinner.clear();
            for (let m of misused) {
                if (m.start === null) {
                    console.log('Found invalid key range: <start> - 0x' + m.end!.toString('hex'));
                } else if (m.end === null) {
                    console.log('Found invalid key range: 0x' + m.start!.toString('hex') + ' - <end>');
                } else {
                    console.log('Found invalid key range: 0x' + m.start!.toString('hex') + ' - 0x' + m.end!.toString('hex'));
                }
                console.log('FROM: ' + formatBuffer(m.from));
                console.log('TO: ' + formatBuffer(m.to));
            }
            spinner.succeed('Completed').stop();
        }
    });

program.command('fc')
    .description('Find used key spaces outside of directories and delete them')
    .action(async () => {
        const spinner = ora('Starting').start();
        const database = await Database.open();
        spinner.text = 'Loading directories';
        const directories = await findAllDirectories(rootCtx, database);
        const sorted = directories.map((v) => v.key).sort(Buffer.compare);
        if (sorted.length === 0) {
            spinner.fail('No directories found').stop();
            return;
        }
        spinner.text = 'Measuring';
        const misused = await findMisusedRanges(rootCtx, sorted, database.allKeys);
        if (misused.length === 0) {
            spinner.succeed('No misused keys found').stop();
        } else {
            spinner.clear();
            spinner.stop();
            for (let m of misused) {
                if (m.start === null) {
                    console.log('Found invalid key range: <start> - 0x' + m.end!.toString('hex'));
                } else if (m.end === null) {
                    console.log('Found invalid key range: 0x' + m.start!.toString('hex') + ' - <end>');
                } else {
                    console.log('Found invalid key range: 0x' + m.start!.toString('hex') + ' - 0x' + m.end!.toString('hex'));
                }
                console.log('FROM: ' + formatBuffer(m.from));
                console.log('TO  : ' + formatBuffer(m.to));
                if ((await prompts({
                    name: 'confirm',
                    type: 'confirm',
                    message: 'Clear range?'
                })).confirm) {
                    spinner.start('Clearing...');
                    await inTx(rootCtx, async (ctx) => {
                        database.allKeys.clearRange(ctx, m.from, keyNext(m.to));
                    });
                    spinner.clear();
                    spinner.stop();
                }
            }
            // spinner.succeed('Completed').stop();
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