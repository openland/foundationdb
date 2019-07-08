---
id: layer-bus
title: PubSub layer
sidebar_label: PubSub
---

Layer for fast pubsub implementation. This layer provides **at-most-once** guarantees. In short - no guarantees. This layer publish events in transactional manner.

## Dependencies

This layer depends on external implementation of pubsub and have only Redis and NoOp providers.

## Install

```bash
yarn install @openland/foundationdb-bus @openland/foundationdb-bus-redis
```

and then add layer in your initialization code:

```typescript
import { Database } from '@openland/foundationdb';
import { BusLayer, NoOpBus } from '@openland/foundationdb-bus';
import { RedisBusProvider } from '@openland/foundationdb-bus-redis';

// No Op bus (useful for tests)
let db = await Database.open({
    layers: [
        /* other layers */
        new BusLayer(new NoOpBus())
    ]
});

// For Redis
let db = await Database.open({
    layers: [
        /* other layers */
        new BusLayer(new RedisBusProvider(6379 /* port */, localhost /* optional host*/))
    ]
});
```

## Usage

```typescript
import { DistributedLock } from '@openland/foundationdb-bus';

let eventBus = new EventBus<T>(db);

// Publish message to topic
eventBus.publish(ctx, 'my-topic' /* topic id */, data: T);

// Receive messages from topic
eventBus.subscibe('my-topic', async (data: T) => {
    // Process messages
});

```