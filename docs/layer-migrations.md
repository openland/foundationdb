---
id: layer-migrations
title: Migrations layer
sidebar_label: Migrations
---

Layer for performing migrations

## Dependencies

This layer does not have any depdendencies

## Install

```bash
yarn install @openland/foundationdb-migrations
```

and then add layer in your initialization code:

```typescript
import { Database } from '@openland/foundationdb';
import { MigrationsLayer } from '@openland/foundationdb-migrations';

let db = await Database.open({
    layers: [
        /* other layers */
        new MigrationsLayer(/* Your migrations */)
    ]
});
```

## Usage

```typescript
import { inTx } from '@openland/foundationdb';
import { MigrationDefinition } from '@openland/foundationdb-migrations';

// Declare migrations

let migrations: MigrationDefinition[] = [];

migrations.push({
    key: '100-remove-invalid-users' /* Unique Key of migration */,
    migration: async (parent) => {
        // Perform migration
    }
});

// Start database

let db = await Database.open({
    layers: [
        /* other layers */
        new MigrationsLayer(migrations)
    ]
});
```