// This file is auto-generated from gentsopts.ts. Do not edit.
import {OptionData} from './opts'

export type NetworkOptions = {
  local_address?: string // DEPRECATED
  cluster_file?: string // DEPRECATED
  trace_enable?: string  // path to output directory (or NULL for current working directory)
  trace_roll_size?: number  // max size of a single trace output file
  trace_max_logs_size?: number  // max total size of trace files
  trace_log_group?: string  // value of the LogGroup attribute
  knob?: string  // knob_name=knob_value
  TLS_plugin?: string // DEPRECATED
  TLS_cert_bytes?: Buffer  // certificates
  TLS_cert_path?: string  // file path
  TLS_key_bytes?: Buffer  // key
  TLS_key_path?: string  // file path
  TLS_verify_peers?: Buffer  // verification pattern
  Buggify_enable?: true
  Buggify_disable?: true
  Buggify_section_activated_probability?: number  // probability expressed as a percentage between 0 and 100
  Buggify_section_fired_probability?: number  // probability expressed as a percentage between 0 and 100
  TLS_ca_bytes?: Buffer  // ca bundle
  TLS_ca_path?: string  // file path
  TLS_password?: string  // key passphrase
  disable_multi_version_client_api?: true
  callbacks_on_external_threads?: true
  external_client_library?: string  // path to client library
  external_client_directory?: string  // path to directory containing client libraries
  disable_local_client?: true
  disable_client_statistics_logging?: true
  enable_slow_task_profiling?: true
  supported_client_versions?: string  // [release version],[source version],[protocol version];...
  external_client?: true
  external_client_transport_id?: number  // Transport ID for the child connection
}

export enum NetworkOptionCode {
  // DEPRECATED
  LocalAddress = 10,

  // DEPRECATED
  ClusterFile = 20,

  // Enables trace output to a file in a directory of the clients choosing
  TraceEnable = 30,

  // Sets the maximum size in bytes of a single trace output file. This
  // value should be in the range ``[0, INT64_MAX]``. If the value is set
  // to 0, there is no limit on individual file size. The default is a
  // maximum size of 10,485,760 bytes.
  TraceRollSize = 31,

  // Sets the maximum size of all the trace output files put together. This
  // value should be in the range ``[0, INT64_MAX]``. If the value is set
  // to 0, there is no limit on the total size of the files. The default is
  // a maximum size of 104,857,600 bytes. If the default roll size is used,
  // this means that a maximum of 10 trace files will be written at a time.
  TraceMaxLogsSize = 32,

  // Sets the 'LogGroup' attribute with the specified value for all events
  // in the trace output files. The default log group is 'default'.
  TraceLogGroup = 33,

  // Set internal tuning or debugging knobs
  Knob = 40,

  // DEPRECATED
  TLSPlugin = 41,

  // Set the certificate chain
  TLSCertBytes = 42,

  // Set the file from which to load the certificate chain
  TLSCertPath = 43,

  // Set the private key corresponding to your own certificate
  TLSKeyBytes = 45,

  // Set the file from which to load the private key corresponding to your
  // own certificate
  TLSKeyPath = 46,

  // Set the peer certificate field verification criteria
  TLSVerifyPeers = 47,

  BuggifyEnable = 48,

  BuggifyDisable = 49,

  // Set the probability of a BUGGIFY section being active for the current
  // execution.  Only applies to code paths first traversed AFTER this
  // option is changed.
  BuggifySectionActivatedProbability = 50,

  // Set the probability of an active BUGGIFY section being fired
  BuggifySectionFiredProbability = 51,

  // Set the ca bundle
  TLSCaBytes = 52,

  // Set the file from which to load the certificate authority bundle
  TLSCaPath = 53,

  // Set the passphrase for encrypted private key. Password should be set
  // before setting the key for the password to be used.
  TLSPassword = 54,

  // Disables the multi-version client API and instead uses the local
  // client directly. Must be set before setting up the network.
  DisableMultiVersionClientApi = 60,

  // If set, callbacks from external client libraries can be called from
  // threads created by the FoundationDB client library. Otherwise,
  // callbacks will be called from either the thread used to add the
  // callback or the network thread. Setting this option can improve
  // performance when connected using an external client, but may not be
  // safe to use in all environments. Must be set before setting up the
  // network. WARNING: This feature is considered experimental at this
  // time.
  CallbacksOnExternalThreads = 61,

  // Adds an external client library for use by the multi-version client
  // API. Must be set before setting up the network.
  ExternalClientLibrary = 62,

  // Searches the specified path for dynamic libraries and adds them to the
  // list of client libraries for use by the multi-version client API. Must
  // be set before setting up the network.
  ExternalClientDirectory = 63,

  // Prevents connections through the local client, allowing only
  // connections through externally loaded client libraries. Intended
  // primarily for testing.
  DisableLocalClient = 64,

  // Disables logging of client statistics, such as sampled transaction
  // activity.
  DisableClientStatisticsLogging = 70,

  // Enables debugging feature to perform slow task profiling. Requires
  // trace logging to be enabled. WARNING: this feature is not recommended
  // for use in production.
  EnableSlowTaskProfiling = 71,

  // This option is set automatically to communicate the list of supported
  // clients to the active client.
  SupportedClientVersions = 1000,

  // This option is set automatically on all clients loaded externally
  // using the multi-version API.
  ExternalClient = 1001,

  // This option tells a child on a multiversion client what transport ID
  // to use.
  ExternalClientTransportId = 1002,

}

export type DatabaseOptions = {
  location_cache_size?: number  // Max location cache entries
  max_watches?: number  // Max outstanding watches
  machine_id?: string  // Hexadecimal ID
  datacenter_id?: string  // Hexadecimal ID
}

export enum DatabaseOptionCode {
  // Set the size of the client location cache. Raising this value can
  // boost performance in very large databases where clients access data in
  // a near-random pattern. Defaults to 100000.
  LocationCacheSize = 10,

  // Set the maximum number of watches allowed to be outstanding on a
  // database connection. Increasing this number could result in increased
  // resource usage. Reducing this number will not cancel any outstanding
  // watches. Defaults to 10000 and cannot be larger than 1000000.
  MaxWatches = 20,

  // Specify the machine ID that was passed to fdbserver processes running
  // on the same machine as this client, for better location-aware load
  // balancing.
  MachineId = 21,

  // Specify the datacenter ID that was passed to fdbserver processes
  // running in the same datacenter as this client, for better
  // location-aware load balancing.
  DatacenterId = 22,

}

export type TransactionOptions = {
  causal_write_risky?: true
  causal_read_risky?: true
  causal_read_disable?: true
  next_write_no_write_conflict_range?: true
  commit_on_first_proxy?: true
  check_writes_enable?: true
  read_your_writes_disable?: true
  read_ahead_disable?: true // DEPRECATED
  durability_datacenter?: true
  durability_risky?: true
  durability_dev_null_is_web_scale?: true // DEPRECATED
  priority_system_immediate?: true
  priority_batch?: true
  initialize_new_database?: true
  access_system_keys?: true
  read_system_keys?: true
  debug_dump?: true
  debug_retry_logging?: string  // Optional transaction name
  transaction_logging_enable?: string  // String identifier to be used in the logs when tracing this transaction. The identifier must not exceed 100 characters.
  timeout?: number  // value in milliseconds of timeout
  retry_limit?: number  // number of times to retry
  max_retry_delay?: number  // value in milliseconds of maximum delay
  snapshot_ryw_enable?: true
  snapshot_ryw_disable?: true
  lock_aware?: true
  used_during_commit_protection_disable?: true
  read_lock_aware?: true
  first_in_batch?: true
}

export enum TransactionOptionCode {
  // The transaction, if not self-conflicting, may be committed a second
  // time after commit succeeds, in the event of a fault
  CausalWriteRisky = 10,

  // The read version will be committed, and usually will be the latest
  // committed, but might not be the latest committed in the event of a
  // fault or partition
  CausalReadRisky = 20,

  CausalReadDisable = 21,

  // The next write performed on this transaction will not generate a write
  // conflict range. As a result, other transactions which read the key(s)
  // being modified by the next write will not conflict with this
  // transaction. Care needs to be taken when using this option on a
  // transaction that is shared between multiple threads. When setting this
  // option, write conflict ranges will be disabled on the next write
  // operation, regardless of what thread it is on.
  NextWriteNoWriteConflictRange = 30,

  // Committing this transaction will bypass the normal load balancing
  // across proxies and go directly to the specifically nominated 'first
  // proxy'.
  CommitOnFirstProxy = 40,

  CheckWritesEnable = 50,

  // Reads performed by a transaction will not see any prior mutations that
  // occured in that transaction, instead seeing the value which was in the
  // database at the transaction's read version. This option may provide a
  // small performance benefit for the client, but also disables a number
  // of client-side optimizations which are beneficial for transactions
  // which tend to read and write the same keys within a single
  // transaction.
  ReadYourWritesDisable = 51,

  // DEPRECATED
  ReadAheadDisable = 52,

  DurabilityDatacenter = 110,

  DurabilityRisky = 120,

  // DEPRECATED
  DurabilityDevNullIsWebScale = 130,

  // Specifies that this transaction should be treated as highest priority
  // and that lower priority transactions should block behind this one. Use
  // is discouraged outside of low-level tools
  PrioritySystemImmediate = 200,

  // Specifies that this transaction should be treated as low priority and
  // that default priority transactions should be processed first. Useful
  // for doing batch work simultaneously with latency-sensitive work
  PriorityBatch = 201,

  // This is a write-only transaction which sets the initial configuration.
  // This option is designed for use by database system tools only.
  InitializeNewDatabase = 300,

  // Allows this transaction to read and modify system keys (those that
  // start with the byte 0xFF)
  AccessSystemKeys = 301,

  // Allows this transaction to read system keys (those that start with the
  // byte 0xFF)
  ReadSystemKeys = 302,

  DebugDump = 400,

  DebugRetryLogging = 401,

  // Enables tracing for this transaction and logs results to the client
  // trace logs. Client trace logging must be enabled to get log output.
  TransactionLoggingEnable = 402,

  // Set a timeout in milliseconds which, when elapsed, will cause the
  // transaction automatically to be cancelled. Valid parameter values are
  // ``[0, INT_MAX]``. If set to 0, will disable all timeouts. All pending
  // and any future uses of the transaction will throw an exception. The
  // transaction can be used again after it is reset. Like all transaction
  // options, a timeout must be reset after a call to onError. This
  // behavior allows the user to make the timeout dynamic.
  Timeout = 500,

  // Set a maximum number of retries after which additional calls to
  // onError will throw the most recently seen error code. Valid parameter
  // values are ``[-1, INT_MAX]``. If set to -1, will disable the retry
  // limit. Like all transaction options, the retry limit must be reset
  // after a call to onError. This behavior allows the user to make the
  // retry limit dynamic.
  RetryLimit = 501,

  // Set the maximum amount of backoff delay incurred in the call to
  // onError if the error is retryable. Defaults to 1000 ms. Valid
  // parameter values are ``[0, INT_MAX]``. Like all transaction options,
  // the maximum retry delay must be reset after a call to onError. If the
  // maximum retry delay is less than the current retry delay of the
  // transaction, then the current retry delay will be clamped to the
  // maximum retry delay.
  MaxRetryDelay = 502,

  // Snapshot read operations will see the results of writes done in the
  // same transaction.
  SnapshotRywEnable = 600,

  // Snapshot read operations will not see the results of writes done in
  // the same transaction.
  SnapshotRywDisable = 601,

  // The transaction can read and write to locked databases, and is
  // resposible for checking that it took the lock.
  LockAware = 700,

  // By default, operations that are performed on a transaction while it is
  // being committed will not only fail themselves, but they will attempt
  // to fail other in-flight operations (such as the commit) as well. This
  // behavior is intended to help developers discover situations where
  // operations could be unintentionally executed after the transaction has
  // been reset. Setting this option removes that protection, causing only
  // the offending operation to fail.
  UsedDuringCommitProtectionDisable = 701,

  // The transaction can read from locked databases.
  ReadLockAware = 702,

  // No other transactions will be applied before this transaction within
  // the same commit version.
  FirstInBatch = 710,

}

export enum StreamingMode {
  // Client intends to consume the entire range and would like it all
  // transferred as early as possible.
  WantAll = -2,

  // The default. The client doesn't know how much of the range it is
  // likely to used and wants different performance concerns to be
  // balanced. Only a small portion of data is transferred to the client
  // initially (in order to minimize costs if the client doesn't read the
  // entire range), and as the caller iterates over more items in the range
  // larger batches will be transferred in order to minimize latency.
  Iterator = -1,

  // Infrequently used. The client has passed a specific row limit and
  // wants that many rows delivered in a single batch. Because of iterator
  // operation in client drivers make request batches transparent to the
  // user, consider ``WANT_ALL`` StreamingMode instead. A row limit must be
  // specified if this mode is used.
  Exact = 0,

  // Infrequently used. Transfer data in batches small enough to not be
  // much more expensive than reading individual rows, to minimize cost if
  // iteration stops early.
  Small = 1,

  // Infrequently used. Transfer data in batches sized in between small and
  // large.
  Medium = 2,

  // Infrequently used. Transfer data in batches large enough to be, in a
  // high-concurrency environment, nearly as efficient as possible. If the
  // client stops iteration early, some disk and network bandwidth may be
  // wasted. The batch size may still be too small to allow a single client
  // to get high throughput from the database, so if that is what you need
  // consider the SERIAL StreamingMode.
  Large = 3,

  // Transfer data in batches large enough that an individual client can
  // get reasonable read bandwidth from the database. If the client stops
  // iteration early, considerable disk and network bandwidth may be
  // wasted.
  Serial = 4,

}

export enum MutationType {
  // Performs an addition of little-endian integers. If the existing value
  // in the database is not present or shorter than ``param``, it is first
  // extended to the length of ``param`` with zero bytes.  If ``param`` is
  // shorter than the existing value in the database, the existing value is
  // truncated to match the length of ``param``. The integers to be added
  // must be stored in a little-endian representation.  They can be signed
  // in two's complement representation or unsigned. You can add to an
  // integer at a known offset in the value by prepending the appropriate
  // number of zero bytes to ``param`` and padding with zero bytes to match
  // the length of the value. However, this offset technique requires that
  // you know the addition will not cause the integer field within the
  // value to overflow.
  Add = 2,

  // DEPRECATED
  And = 6,

  // Performs a bitwise ``and`` operation.  If the existing value in the
  // database is not present, then ``param`` is stored in the database. If
  // the existing value in the database is shorter than ``param``, it is
  // first extended to the length of ``param`` with zero bytes.  If
  // ``param`` is shorter than the existing value in the database, the
  // existing value is truncated to match the length of ``param``.
  BitAnd = 6,

  // DEPRECATED
  Or = 7,

  // Performs a bitwise ``or`` operation.  If the existing value in the
  // database is not present or shorter than ``param``, it is first
  // extended to the length of ``param`` with zero bytes.  If ``param`` is
  // shorter than the existing value in the database, the existing value is
  // truncated to match the length of ``param``.
  BitOr = 7,

  // DEPRECATED
  Xor = 8,

  // Performs a bitwise ``xor`` operation.  If the existing value in the
  // database is not present or shorter than ``param``, it is first
  // extended to the length of ``param`` with zero bytes.  If ``param`` is
  // shorter than the existing value in the database, the existing value is
  // truncated to match the length of ``param``.
  BitXor = 8,

  // Appends ``param`` to the end of the existing value already in the
  // database at the given key (or creates the key and sets the value to
  // ``param`` if the key is empty). This will only append the value if the
  // final concatenated value size is less than or equal to the maximum
  // value size (i.e., if it fits). WARNING: No error is surfaced back to
  // the user if the final value is too large because the mutation will not
  // be applied until after the transaction has been committed. Therefore,
  // it is only safe to use this mutation type if one can guarantee that
  // one will keep the total value size under the maximum size.
  AppendIfFits = 9,

  // Performs a little-endian comparison of byte strings. If the existing
  // value in the database is not present or shorter than ``param``, it is
  // first extended to the length of ``param`` with zero bytes.  If
  // ``param`` is shorter than the existing value in the database, the
  // existing value is truncated to match the length of ``param``. The
  // larger of the two values is then stored in the database.
  Max = 12,

  // Performs a little-endian comparison of byte strings. If the existing
  // value in the database is not present, then ``param`` is stored in the
  // database. If the existing value in the database is shorter than
  // ``param``, it is first extended to the length of ``param`` with zero
  // bytes.  If ``param`` is shorter than the existing value in the
  // database, the existing value is truncated to match the length of
  // ``param``. The smaller of the two values is then stored in the
  // database.
  Min = 13,

  // Transforms ``key`` using a versionstamp for the transaction. Sets the
  // transformed key in the database to ``param``. The key is transformed
  // by removing the final four bytes from the key and reading those as a
  // little-Endian 32-bit integer to get a position ``pos``. The 10 bytes
  // of the key from ``pos`` to ``pos + 10`` are replaced with the
  // versionstamp of the transaction used. The first byte of the key is
  // position 0. A versionstamp is a 10 byte, unique, monotonically (but
  // not sequentially) increasing value for each committed transaction. The
  // first 8 bytes are the committed version of the database (serialized in
  // big-Endian order). The last 2 bytes are monotonic in the serialization
  // order for transactions. WARNING: At this time, versionstamps are
  // compatible with the Tuple layer only in the Java and Python bindings.
  // Also, note that prior to API version 520, the offset was computed from
  // only the final two bytes rather than the final four bytes.
  SetVersionstampedKey = 14,

  // Transforms ``param`` using a versionstamp for the transaction. Sets
  // the ``key`` given to the transformed ``param``. The parameter is
  // transformed by removing the final four bytes from ``param`` and
  // reading those as a little-Endian 32-bit integer to get a position
  // ``pos``. The 10 bytes of the parameter from ``pos`` to ``pos + 10``
  // are replaced with the versionstamp of the transaction used. The first
  // byte of the parameter is position 0. A versionstamp is a 10 byte,
  // unique, monotonically (but not sequentially) increasing value for each
  // committed transaction. The first 8 bytes are the committed version of
  // the database (serialized in big-Endian order). The last 2 bytes are
  // monotonic in the serialization order for transactions. WARNING: At
  // this time, versionstamps are compatible with the Tuple layer only in
  // the Java and Python bindings. Also, note that prior to API version
  // 520, the versionstamp was always placed at the beginning of the
  // parameter rather than computing an offset.
  SetVersionstampedValue = 15,

  // Performs lexicographic comparison of byte strings. If the existing
  // value in the database is not present, then ``param`` is stored.
  // Otherwise the smaller of the two values is then stored in the
  // database.
  ByteMin = 16,

  // Performs lexicographic comparison of byte strings. If the existing
  // value in the database is not present, then ``param`` is stored.
  // Otherwise the larger of the two values is then stored in the database.
  ByteMax = 17,

}

export enum ConflictRangeType {
  // Used to add a read conflict range
  Read = 0,

  // Used to add a write conflict range
  Write = 1,

}

export enum ErrorPredicate {
  // Returns ``true`` if the error indicates the operations in the
  // transactions should be retried because of transient error.
  Retryable = 50000,

  // Returns ``true`` if the error indicates the transaction may have
  // succeeded, though not in a way the system can verify.
  MaybeCommitted = 50001,

  // Returns ``true`` if the error indicates the transaction has not
  // committed, though in a way that can be retried.
  RetryableNotCommitted = 50002,

}

export const networkOptionData: OptionData = {
  local_address: {
    code: 10,
    description: "Deprecated",
    deprecated: true,
    type: 'string',
    paramDescription: "IP:PORT",
  },

  cluster_file: {
    code: 20,
    description: "Deprecated",
    deprecated: true,
    type: 'string',
    paramDescription: "path to cluster file",
  },

  trace_enable: {
    code: 30,
    description: "Enables trace output to a file in a directory of the clients choosing",
    type: 'string',
    paramDescription: "path to output directory (or NULL for current working directory)",
  },

  trace_roll_size: {
    code: 31,
    description: "Sets the maximum size in bytes of a single trace output file. This value should be in the range ``[0, INT64_MAX]``. If the value is set to 0, there is no limit on individual file size. The default is a maximum size of 10,485,760 bytes.",
    type: 'int',
    paramDescription: "max size of a single trace output file",
  },

  trace_max_logs_size: {
    code: 32,
    description: "Sets the maximum size of all the trace output files put together. This value should be in the range ``[0, INT64_MAX]``. If the value is set to 0, there is no limit on the total size of the files. The default is a maximum size of 104,857,600 bytes. If the default roll size is used, this means that a maximum of 10 trace files will be written at a time.",
    type: 'int',
    paramDescription: "max total size of trace files",
  },

  trace_log_group: {
    code: 33,
    description: "Sets the 'LogGroup' attribute with the specified value for all events in the trace output files. The default log group is 'default'.",
    type: 'string',
    paramDescription: "value of the LogGroup attribute",
  },

  knob: {
    code: 40,
    description: "Set internal tuning or debugging knobs",
    type: 'string',
    paramDescription: "knob_name=knob_value",
  },

  TLS_plugin: {
    code: 41,
    description: "Deprecated",
    deprecated: true,
    type: 'string',
    paramDescription: "file path or linker-resolved name",
  },

  TLS_cert_bytes: {
    code: 42,
    description: "Set the certificate chain",
    type: 'bytes',
    paramDescription: "certificates",
  },

  TLS_cert_path: {
    code: 43,
    description: "Set the file from which to load the certificate chain",
    type: 'string',
    paramDescription: "file path",
  },

  TLS_key_bytes: {
    code: 45,
    description: "Set the private key corresponding to your own certificate",
    type: 'bytes',
    paramDescription: "key",
  },

  TLS_key_path: {
    code: 46,
    description: "Set the file from which to load the private key corresponding to your own certificate",
    type: 'string',
    paramDescription: "file path",
  },

  TLS_verify_peers: {
    code: 47,
    description: "Set the peer certificate field verification criteria",
    type: 'bytes',
    paramDescription: "verification pattern",
  },

  Buggify_enable: {
    code: 48,
    description: "",
    type: 'none',
  },

  Buggify_disable: {
    code: 49,
    description: "",
    type: 'none',
  },

  Buggify_section_activated_probability: {
    code: 50,
    description: "Set the probability of a BUGGIFY section being active for the current execution.  Only applies to code paths first traversed AFTER this option is changed.",
    type: 'int',
    paramDescription: "probability expressed as a percentage between 0 and 100",
  },

  Buggify_section_fired_probability: {
    code: 51,
    description: "Set the probability of an active BUGGIFY section being fired",
    type: 'int',
    paramDescription: "probability expressed as a percentage between 0 and 100",
  },

  TLS_ca_bytes: {
    code: 52,
    description: "Set the ca bundle",
    type: 'bytes',
    paramDescription: "ca bundle",
  },

  TLS_ca_path: {
    code: 53,
    description: "Set the file from which to load the certificate authority bundle",
    type: 'string',
    paramDescription: "file path",
  },

  TLS_password: {
    code: 54,
    description: "Set the passphrase for encrypted private key. Password should be set before setting the key for the password to be used.",
    type: 'string',
    paramDescription: "key passphrase",
  },

  disable_multi_version_client_api: {
    code: 60,
    description: "Disables the multi-version client API and instead uses the local client directly. Must be set before setting up the network.",
    type: 'none',
  },

  callbacks_on_external_threads: {
    code: 61,
    description: "If set, callbacks from external client libraries can be called from threads created by the FoundationDB client library. Otherwise, callbacks will be called from either the thread used to add the callback or the network thread. Setting this option can improve performance when connected using an external client, but may not be safe to use in all environments. Must be set before setting up the network. WARNING: This feature is considered experimental at this time.",
    type: 'none',
  },

  external_client_library: {
    code: 62,
    description: "Adds an external client library for use by the multi-version client API. Must be set before setting up the network.",
    type: 'string',
    paramDescription: "path to client library",
  },

  external_client_directory: {
    code: 63,
    description: "Searches the specified path for dynamic libraries and adds them to the list of client libraries for use by the multi-version client API. Must be set before setting up the network.",
    type: 'string',
    paramDescription: "path to directory containing client libraries",
  },

  disable_local_client: {
    code: 64,
    description: "Prevents connections through the local client, allowing only connections through externally loaded client libraries. Intended primarily for testing.",
    type: 'none',
  },

  disable_client_statistics_logging: {
    code: 70,
    description: "Disables logging of client statistics, such as sampled transaction activity.",
    type: 'none',
  },

  enable_slow_task_profiling: {
    code: 71,
    description: "Enables debugging feature to perform slow task profiling. Requires trace logging to be enabled. WARNING: this feature is not recommended for use in production.",
    type: 'none',
  },

  supported_client_versions: {
    code: 1000,
    description: "This option is set automatically to communicate the list of supported clients to the active client.",
    type: 'string',
    paramDescription: "[release version],[source version],[protocol version];...",
  },

  external_client: {
    code: 1001,
    description: "This option is set automatically on all clients loaded externally using the multi-version API.",
    type: 'none',
  },

  external_client_transport_id: {
    code: 1002,
    description: "This option tells a child on a multiversion client what transport ID to use.",
    type: 'int',
    paramDescription: "Transport ID for the child connection",
  },

}

export const databaseOptionData: OptionData = {
  location_cache_size: {
    code: 10,
    description: "Set the size of the client location cache. Raising this value can boost performance in very large databases where clients access data in a near-random pattern. Defaults to 100000.",
    type: 'int',
    paramDescription: "Max location cache entries",
  },

  max_watches: {
    code: 20,
    description: "Set the maximum number of watches allowed to be outstanding on a database connection. Increasing this number could result in increased resource usage. Reducing this number will not cancel any outstanding watches. Defaults to 10000 and cannot be larger than 1000000.",
    type: 'int',
    paramDescription: "Max outstanding watches",
  },

  machine_id: {
    code: 21,
    description: "Specify the machine ID that was passed to fdbserver processes running on the same machine as this client, for better location-aware load balancing.",
    type: 'string',
    paramDescription: "Hexadecimal ID",
  },

  datacenter_id: {
    code: 22,
    description: "Specify the datacenter ID that was passed to fdbserver processes running in the same datacenter as this client, for better location-aware load balancing.",
    type: 'string',
    paramDescription: "Hexadecimal ID",
  },

}

export const transactionOptionData: OptionData = {
  causal_write_risky: {
    code: 10,
    description: "The transaction, if not self-conflicting, may be committed a second time after commit succeeds, in the event of a fault",
    type: 'none',
  },

  causal_read_risky: {
    code: 20,
    description: "The read version will be committed, and usually will be the latest committed, but might not be the latest committed in the event of a fault or partition",
    type: 'none',
  },

  causal_read_disable: {
    code: 21,
    description: "undefined",
    type: 'none',
  },

  next_write_no_write_conflict_range: {
    code: 30,
    description: "The next write performed on this transaction will not generate a write conflict range. As a result, other transactions which read the key(s) being modified by the next write will not conflict with this transaction. Care needs to be taken when using this option on a transaction that is shared between multiple threads. When setting this option, write conflict ranges will be disabled on the next write operation, regardless of what thread it is on.",
    type: 'none',
  },

  commit_on_first_proxy: {
    code: 40,
    description: "Committing this transaction will bypass the normal load balancing across proxies and go directly to the specifically nominated 'first proxy'.",
    type: 'none',
  },

  check_writes_enable: {
    code: 50,
    description: "undefined",
    type: 'none',
  },

  read_your_writes_disable: {
    code: 51,
    description: "Reads performed by a transaction will not see any prior mutations that occured in that transaction, instead seeing the value which was in the database at the transaction's read version. This option may provide a small performance benefit for the client, but also disables a number of client-side optimizations which are beneficial for transactions which tend to read and write the same keys within a single transaction.",
    type: 'none',
  },

  read_ahead_disable: {
    code: 52,
    description: "Deprecated",
    deprecated: true,
    type: 'none',
  },

  durability_datacenter: {
    code: 110,
    description: "undefined",
    type: 'none',
  },

  durability_risky: {
    code: 120,
    description: "undefined",
    type: 'none',
  },

  durability_dev_null_is_web_scale: {
    code: 130,
    description: "Deprecated",
    deprecated: true,
    type: 'none',
  },

  priority_system_immediate: {
    code: 200,
    description: "Specifies that this transaction should be treated as highest priority and that lower priority transactions should block behind this one. Use is discouraged outside of low-level tools",
    type: 'none',
  },

  priority_batch: {
    code: 201,
    description: "Specifies that this transaction should be treated as low priority and that default priority transactions should be processed first. Useful for doing batch work simultaneously with latency-sensitive work",
    type: 'none',
  },

  initialize_new_database: {
    code: 300,
    description: "This is a write-only transaction which sets the initial configuration. This option is designed for use by database system tools only.",
    type: 'none',
  },

  access_system_keys: {
    code: 301,
    description: "Allows this transaction to read and modify system keys (those that start with the byte 0xFF)",
    type: 'none',
  },

  read_system_keys: {
    code: 302,
    description: "Allows this transaction to read system keys (those that start with the byte 0xFF)",
    type: 'none',
  },

  debug_dump: {
    code: 400,
    description: "undefined",
    type: 'none',
  },

  debug_retry_logging: {
    code: 401,
    description: "undefined",
    type: 'string',
    paramDescription: "Optional transaction name",
  },

  transaction_logging_enable: {
    code: 402,
    description: "Enables tracing for this transaction and logs results to the client trace logs. Client trace logging must be enabled to get log output.",
    type: 'string',
    paramDescription: "String identifier to be used in the logs when tracing this transaction. The identifier must not exceed 100 characters.",
  },

  timeout: {
    code: 500,
    description: "Set a timeout in milliseconds which, when elapsed, will cause the transaction automatically to be cancelled. Valid parameter values are ``[0, INT_MAX]``. If set to 0, will disable all timeouts. All pending and any future uses of the transaction will throw an exception. The transaction can be used again after it is reset. Like all transaction options, a timeout must be reset after a call to onError. This behavior allows the user to make the timeout dynamic.",
    type: 'int',
    paramDescription: "value in milliseconds of timeout",
  },

  retry_limit: {
    code: 501,
    description: "Set a maximum number of retries after which additional calls to onError will throw the most recently seen error code. Valid parameter values are ``[-1, INT_MAX]``. If set to -1, will disable the retry limit. Like all transaction options, the retry limit must be reset after a call to onError. This behavior allows the user to make the retry limit dynamic.",
    type: 'int',
    paramDescription: "number of times to retry",
  },

  max_retry_delay: {
    code: 502,
    description: "Set the maximum amount of backoff delay incurred in the call to onError if the error is retryable. Defaults to 1000 ms. Valid parameter values are ``[0, INT_MAX]``. Like all transaction options, the maximum retry delay must be reset after a call to onError. If the maximum retry delay is less than the current retry delay of the transaction, then the current retry delay will be clamped to the maximum retry delay.",
    type: 'int',
    paramDescription: "value in milliseconds of maximum delay",
  },

  snapshot_ryw_enable: {
    code: 600,
    description: "Snapshot read operations will see the results of writes done in the same transaction.",
    type: 'none',
  },

  snapshot_ryw_disable: {
    code: 601,
    description: "Snapshot read operations will not see the results of writes done in the same transaction.",
    type: 'none',
  },

  lock_aware: {
    code: 700,
    description: "The transaction can read and write to locked databases, and is resposible for checking that it took the lock.",
    type: 'none',
  },

  used_during_commit_protection_disable: {
    code: 701,
    description: "By default, operations that are performed on a transaction while it is being committed will not only fail themselves, but they will attempt to fail other in-flight operations (such as the commit) as well. This behavior is intended to help developers discover situations where operations could be unintentionally executed after the transaction has been reset. Setting this option removes that protection, causing only the offending operation to fail.",
    type: 'none',
  },

  read_lock_aware: {
    code: 702,
    description: "The transaction can read from locked databases.",
    type: 'none',
  },

  first_in_batch: {
    code: 710,
    description: "No other transactions will be applied before this transaction within the same commit version.",
    type: 'none',
  },

}

