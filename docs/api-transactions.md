---
id: api-transactions
title: Transactions
sidebar_label: Transactions
---

All reads and modifications of key-value pairs in FoundationDB are done within the context of a transaction. A transaction is a small unit of work that is both reliably performed and logically independent of other transactions.

FoundationDB provides full ACID transaction gurarantees:

* **Atomicity**: Either all of the writes in the transaction happen, or none of them happen.
* **Consistency**: If each individual transaction maintains a database invariant, then the invariant is maintained even when multiple transactions are modifying the database concurrently.
* **Isolation**: It is as if transactions executed one at a time (serializability).
* **Durability**: Once a transaction succeeds, its writes will not be lost despite any failures or network partitions.

An additional important property, though technically not part of ACID, is also guaranteed:
* **Causality**: A transaction is guaranteed to see the effects of all other transactions that commit before it begins.

FoundationDB implements these properties using multiversion concurrency control (MVCC) for reads and **optimistic** concurrency for writes. As a result, **neither reads nor writes are blocked by other readers or writers**. Instead, conflicting transactions will fail at commit time and will usually be **retried** by the client.

In particular, the reads in a transaction take place from an **instantaneous snapshot of the database**. From the perspective of the transaction this snapshot is not modified by the writes of other, concurrent transactions. When the transaction is ready to be committed, the FoundationDB cluster checks that it does not conflict with any previously committed transaction (i.e. that no value read by a transaction has been modified by another transaction since the read occurred) and, if it does conflict, rejects it. Rejected conflicting transactions are usually retried by the client. Accepted transactions are written to disk on multiple cluster nodes and then reported accepted to the client.

## Litations
FoundationDB transactions have some "limitations":
* Key sizes above 10 kB are not allowed, and sizes above 1 kB should be avoided—store the data in the value if possible.
* Value sizes are more flexible, with 0-10 kB normal. Value sizes cannot exceed 100 kB.
* 5 second duration max. This is not an issue for most apps since you usually timeout query if it will be more than 5 seconds anyway.
* 10 MB of keys and values. Each transaction can have only at most 10 MB of sum of keys and values. If transaction will exceed this limit then it will throw error on commit. 

## Transaction Retry Loops

In most client APIs, there is a way of encapsulating a block of code as part of a transaction. In Typescropt, the `@transactional` decorator or `inTx` function encapsulates retrying errors for the client. Here is a more detailed view of what the encapsulation does:

```typescript
async function doOperation() {
    let tx = createTransaction();
    while(true) {
        try {
            /// Transaction body
        } catch (e) {
          if (e instanceof FDBError) {
            await tx.onerror(e)
          } else {
              throw e;
          }
        }
    }
}
```

## `inTx` wrapper

For working with transactions there is inTx function that wraps execution in right retry loop. `inTx` invocations can be nested and only one transaction will be created.

```typescript
await inTx(context, async (ctx) => {
    directory.set(ctx, Buffer.of(1,2,3), Buffer.of(1,2,3));
});
```

## `@transactional` decorator

Easiest way to use transactions is to use decorators, unfortunatelly they are working only on class methods:

```typescript
class UserRepository {
    
    @transactional
    async createUser(ctx: Context, name: string) {
        // ctx here will contain transaction
    }
}
```

## `afterCommit` hook

Note that, while the this methods encapsulates an entire function, only the database operations it contains are part of the transaction and enjoy enforcement of ACID properties. Operations that mutate client memory (e.g., ordinary variable assignments or changes to data structures) are not “rolled back” when a transaction conflicts. You should place such operations outside of the retry loop unless it is acceptable for them to be executed when a transaction conflicts and is retried.

For easy of use there is an `afterCommit` hook will be called right after transaction commit:

```typescript
getTransaction(ctx).afterCommit(() => {
    // Will be called after transaction was successfuly commited
})
```

## `beforeCommit` hook

Sometimes you don't want to do operations right now, but at the end of transaction. For example, flushing data can be wasteful and you want to flush all changes at once. For simplifying this there is `beforeCommit` hook.

```typescript
getTransaction(ctx).before(async () => {
    // Will be called before trying to commit transaction
})
```

## Long-running transactions
FoundationDB does not support long-running transactions, currently defined as those lasting over five seconds. The reasons for this design limitation relate to multiversion concurrency control and are discussed in [Anti-Features](https://apple.github.io/foundationdb/anti-features.html).

You may have certain large operations that you’re accustomed to implementing as long-running transactions with another database. How should you approach implementing your operation in FoundationDB?

The key consideration is whether your operation requires global consistency over all its data elements. In many cases, some smaller scope of consistency is acceptable. For example, many analytic computations are defined over a set of entities, such as users, and require consistency only for each entity, not globally across them. In this case, you can decompose the operation into multiple transactions, one for each entity. More generally, the strategy for operations requiring local consistency is to decompose them into a set of short transactions.

(source: https://apple.github.io/foundationdb/developer-guide.html#transaction-basics)