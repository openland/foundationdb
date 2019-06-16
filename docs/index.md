---
id: index
title: Getting Started
sidebar_label: Getting Started
---

## About FoundationDB

FoundationDB is a key-value database with **distributed** ACID transactions. 

## Hello World

After [installation](install.md) you can start doing transactions.

```typescript
import { createNamedContext } from '@openland/context';
import { Database, inTx } from '@openland/Database';

// Open Database
let db = Database.open();
let context = createNamedContext('main');

async function main() {

    // Resolve directory for our data
    let directory = db.directory.createOrOpen(context, ['examples', 'hello-world']);

    // Do write transaction
    await inTx(context, async (ctx) => {
        directory.set(ctx, Buffer.of(1,2,3), Buffer.of(1,2,3));
    });

    // Read data with auto-created transaction
    await directory.get(context, Buffer.of(1,2,3)); // Resolves to value of Buffer.of(1,2,3)
}

main();

```