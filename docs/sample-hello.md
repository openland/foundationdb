---
id: sample-hello
title: Hello world
sidebar_label: Hello world
---

After [installation](install.md) you can start doing transactions.

```typescript
import { createNamedContext } from '@openland/context';
import { Database, inTx } from '@openland/foundationdb';

// Open Database
let db = await Database.open();
let context = createNamedContext('main');

async function main() {

    // Resolve directory for our data
    let directory = await db.directory.createOrOpen(context, ['examples', 'hello-world']);

    // Do write transaction
    await inTx(context, async (ctx) => {
        directory.set(ctx, Buffer.of(1,2,3), Buffer.of(1,2,3));
    });

    // Read data with auto-created transaction
    await directory.get(context, Buffer.of(1,2,3)); // Resolves to value of Buffer.of(1,2,3)
}

main();

```
