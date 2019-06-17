---
id: api-directory
title: Directory Layer
sidebar_label: Directory Layer
---

Managing global key space across teams and modules can be hard in large projects. You have to avoid conflicts with other subsystems, try to keep key size small and allocation need to be fast and conflict-free.

For this purposes there is a Directory Layer, most basic layer in FoundationDB ecosystem and it is built-in in most available bindings.

# Creation of directory

`Database` object has field `directory` that contains default DirectoryLayer and it is most convenient way to work with directories.

This will create or load existing prefix that you can use in your code:

```typescript
let prefix = await db.directory.createOrOpen(ctx, ['com.example', 'tutorial']);
```