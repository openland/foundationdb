# @openland/foundationdb-tuple
Subset of official tuple encoding that is safe to use in JavaScript environments. 
We are intentionally NOT supporting deprecated or questional tuple item types. If you think we are wrong, open an issue - we are usually answering within an hour.

## Example

Tuple items can be: `number` (only for integer values!), `number` wrapped in `Float` (for float values), `boolean`, `string`, `Buffer`, `null`:

```typescript

import * as Tuple from '@openland/foundationdb-tuple';

// Encode tuple
let encoded = Tuple.pack(['user', 1, 'score', new Tuple.Float(0.4)]);

// Decode tuple
let decoded = Tuple.unpack(encoded);

```

## Supported types
* Null
* Boolean
* Text String
* Byte String
* Integer
* Float (without NaN and Inf values) (NOTE: They are encoded as Double)

## Not supported types
* (0x03, 0x04 and 0x05) Nested Tuple. We haven't found good usecase for nested tuples.
* (0x0a and 0x0b Codes) Negative arbitrary-precision Integer. They are reserved now and when it will be officially specified we could use this encoding for BigInts.
* (0x1d and 0x1e Codes) Positive arbitrary-precision Integer. They are reserved now and when it will be officially specified we could use this encoding for BigInts.
* (0x20 and 0x22 Codes) Float and Long Double. Double is enougth and mixing this two types of encoding can cause ordering problems since they are encoded in different way. Original library (node-foundationdb) can read float and then write to a double. This can cause very nasty bugs in practice.
* (0x30 Code) RFC 4122 UUID. UUIDs can be represented with Byte String.
* (0x25 Code) Deprecated True Value
* (0x31 Code) 64 bit identifier. Not used in official bindings.
* (0x32 Code) 80 Bit versionstamp. Not used in official bindings.
* (0x33 Code) 96 Bit Versionstamp. We are not supporting versionstamps right now because it is not obvious they need to be implemented in JavaScript.

## Used Specifications and Source Code
* Official spec: https://github.com/apple/foundationdb/blob/master/design/tuple.md
* Documentation about Tuples: https://apple.github.io/foundationdb/data-modeling.html#tuples
* node-foundationdb source code: https://github.com/josephg/node-foundationdb/blob/master/lib/tuple.ts

## License
MIT (c) Data Makes Perfect LLC
