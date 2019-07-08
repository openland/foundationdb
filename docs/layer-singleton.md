---
id: layer-singleton
title: Singleton Worker layer
sidebar_label: Singleton Worker
---

Singleton Worker layer allows you to launch processes that you want to run on only single machine in the cluster. This layer does not guarantee strict exclusive execution and in rare cases it 
can run multiple workers at the same time.

## Dependencies

This layer depends on [Distributed Lock Layer](/docs/layer-locks).

## Install

```bash
yarn install @openland/foundationdb-singleton
```

and then add layer in your initialization code:

```typescript
import { Database } from '@openland/foundationdb';
import { SingletonWorkerLayer } from '@openland/foundationdb-singleton';

let db = await Database.open({
    layers: [
        /* other layers */
        new SingletonWorkerLayer()
    ]
})
```

## Usage

```typescript
import { singletonWorker } from '@openland/foundationdb-singleton';

singletonWorker({ db, name: 'my-singleton-worker' }, async (ctx) => {
    // This block will be invoked in loop with short delays (~100ms)
});
```