---
id: api-subspaces
title: Subspaces
sidebar_label: Subspaces
---

`Subspace` represents subset of keys in database and provide the way to work with data in it. Entry point is `allKeys` field in `Database` object.

## Data Serialization

By default Subspace uses Buffers for keys and values, but it is not useful for most cases and any subspace can be converted to a more friendly representation:

```typescript
let tupledKeys = db.allkeys
    .withKeyEncoding(encoders.tuple)
    .withValueEncoding(encoders.json)
```
Now `tupledKeys` accepts tuples as keys and values are arbitary json.

## Read Operations
All read operations are **asynchronous**.

### Read single key
`Subspace.get` returns value or null if key does not exist.
```typescript
let value = await tupledKeys.get(ctx, ['test-key']);
```

### Range reads
`Subspace.range` returns all keys and values that is prefixed by provided key. All keys are soted.
`limit` limits number of results. `reversed` reverses read order,  `after` is and exclusive key read start.
```typescript
let value = await tupledKeys.range(ctx, ['test-key'], { limit: 1, reversed: false, after: [123]});
```

## Write Operations
All write operations are **synchronous**, but sent to server only during commit.

### Set single key
`Subspace.set` sets value for a key.

```typescript
tupledKeys.set(ctx, ['test-key'], { test: 'hello!' });
```

### Clear single key
`Subspace.clear` clears value for a key

```typescript
tupledKeys.clear(ctx, ['test-key']);
```

### Clear range
Clearing ranges are not supported as it could be too dangerous.