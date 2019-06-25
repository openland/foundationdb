---
id: api-database
title: Database
sidebar_label: Database
---

To start working with client you need to create a Database object. Static method `Database.open(path)` open database synchronously and by default connects to a database that is installed on local machine. First optional argument is a path to a cluster file.

```typescript
import { Database } from '@openland/foundationdb';
let db = Database.open();
```

### Closing Database

Closing database can be possible by simply calling synchronous method `Database.close()`:

```typescript
db.close();
```

### Database for tests

For easier unit testing there is *asynchronous* method `Database.openTest()` that generates random key, creates instance of database that is isolated to this subspace and before returning clears all data in this subspace. You can provide optional argument `name` to use static prefix instead of generated one. This method will crash if `NODE_ENV` is equals `production`.
