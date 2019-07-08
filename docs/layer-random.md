---
id: layer-random
title: Random ID layer
sidebar_label: Random ID
---

Random ID allows you to generate **globaly unique** and time ordered random ids that can be fit in 8 byte integer. Uses Twitter's Snowflake: https://github.com/twitter-archive/snowflake

## Dependencies

This layer does not have any depdendencies

## Install

```bash
yarn install @openland/foundationdb-random
```

and then add layer in your initialization code:

```typescript
import { Database } from '@openland/foundationdb';
import { RandomLayer } from '@openland/foundationdb-random';

let db = await Database.open({
    layers: [
        /* other layers */
        new RandomLayer()
    ]
})
```

## Usage

```typescript
let randomString: string = db.get(RandomLayer).nextRandomId();
```