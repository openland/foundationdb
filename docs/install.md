---
id: install
title: Installation
---

### Install FoundationDB
Before adding `@openland/foundationdb` library to your project you need to install FoundationDB client to you machine (and server for development). 

Minimum required version of FoundationDB is **6.0.0**.

Installation is simple: download package/installer for your OS from page: https://www.foundationdb.org/download/. 

If you have installed server as well you can check if everything is fine by invoking `fdbcli` command, you should see something like this:

```text
Using cluster file '/usr/local/etc/foundationdb/fdb.cluster'.

The database is available.

Welcome to the fdbcli. For help, type `help'.
```

If something wrong, try to reinstall FoundationDB.

### Add library to your project

After client is installed you can add dependency to your project:
```bash
yarn install @openland/foundationdb
```