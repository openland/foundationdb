---
id: index
title: Getting Started
sidebar_label: Getting Started
---

FoundationDB is a key-value database with **distributed** ACID transactions maintained by Apple.

* Multi paradigm database. You can implement efficiently key value storage, event sourcing, working queues and work with models within same transaction (no 2PC!).
* Ready for production. FoundationDB has been running in production for years and been hardened with lessons learned. Backing FoundationDB up is an unmatched testing system based on a deterministic simulation engine.
* Very [fast](https://apple.github.io/foundationdb/benchmarking.html). Single core process can provide up to **300k** reads per second. Scaling is linear - just add 2x more nodes and you will get 2x more performance.
* FoundationDB is fault tolerant. FoundationDB is easy to install, grow, and manage. It has a distributed architecture that gracefully scales out, and handles faults while acting like a single ACID database.

## Data Model
FoundationDB’s core data model is an ordered key-value store. Also known as an ordered associative array, map, or dictionary, this is a data structure composed of a collection of key-value pairs in which all keys are unique and ordered. Both keys and values in FoundationDB are simple byte strings. Apart from storage and retrieval, the database does not interpret or depend on the content of values. In contrast, keys are treated as members of a total order, the lexicographic order over the underlying bytes, in which keys are sorted by each byte in order.

The combination of the core data model and multikey transactions allows an application to build richer data models and libraries that inherit FoundationDB’s scalability, performance, and integrity. Richer data models are designed by mapping the application’s data to keys and values in a way that yields an effective abstraction and enables efficient storage and retrieval.