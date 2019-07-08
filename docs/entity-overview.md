---
id: entity-overview
title: Overview of Entity layer
sidebar_label: Overview
---

Entity Layer is a typescript library providing an entity-oriented store on top of FoundationDB, supporting structured records with fields and types, primary and secondary indexes and very high performance.

Sitting on top of FoundationDB, the Entity Layer inherits its strong ACID semantics, reliability, and performance in a distributed setting.

## Dependencies

This layer is dependent on [Event Bus](/docs/layer-bus) and it need to be installed first.

## Install

```bash
yarn install @openland/foundationdb-entity @openland/foundationdb-entity-compiler
```

## Schema

To begin to use Entity Layer you need to specify schema of your data. Create new file from template:

```typescript
import * as c from '@openland/foundationdb-compiler';

export default c.declareSchema(() => {
    c.entity('SampleEntity', () => {
        c.primaryKey('id', c.integer());
        c.field('value1', c.string());
        c.field('range2', c.integer());
    });
});
```

Then compile schema to a script:
```bash
yarn foundationdb-compiler ./schema.ts ./store.ts
```

## Usage

```typescript
import { openStore } from './store';

let storage = new EntityStorage(db);
let store = await openStore(storage);

// Create entity
await store.SampleEntity.create(ctx, 1, { value1: 'hello!', value2: 10 });

// Fetch entity
let sample = await store.SampleEntity.findById(ctx, 1);

```