---
id: layer-locks
title: Distributed Lock layer
sidebar_label: Distributed Lock
---

Low level distributed lock that can be used to coordinate execution within your cluster. This locks 
can (and should) be executed inside a related transaction to guarantee absolute exclusive locking.

## Dependencies

This layer does not have any depdendencies

## Install

```bash
yarn install @openland/foundationdb-locks
```

and then add layer in your initialization code:

```typescript
import { Database } from '@openland/foundationdb';
import { LockLayer } from '@openland/foundationdb-locks';

let db = await Database.open({
    layers: [
        /* other layers */
        new LockLayer()
    ]
})
```

## Usage

```typescript
import { DistributedLock } from '@openland/foundationdb-locks';

// Version is monotonic value that prohibits all locks with version 
// that is less than last known maximum version
let version = 1;

// Unique identifier. Beware this ID is global and can conflict with 
// other layers or modules in your app
let lockName = 'email-worker';

// Timeout after which lock will be automatically released
let timeout = 30000;

// Create lock object
let lock = new DistributedLock(lockName, db, version);

// Try to lock
let lockSuccessful: boolean = await lock.tryLock(ctx /* Context with transaction */, timeout);

// Release lock
await lock.releaseLock(ctx /* Context with transaction */);

// Refresh lock timeout to keep it for longer time
await lock.refresh(ctx, timeout);

```