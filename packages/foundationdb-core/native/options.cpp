#include "fdbversion.h"
#include <foundationdb/fdb_c.h>

#include "options.h"
#include "error.h"

static fdb_error_t set_option(void *target, OptionType type, int code, void const* value, int length) {
  switch (type) {
    case OptNetwork: return fdb_network_set_option((FDBNetworkOption)code, (const uint8_t *)value, length);
    // case OptCluster: return fdb_cluster_set_option((FDBCluster *)target, (FDBClusterOption)code, value, length);
    case OptDatabase: return fdb_database_set_option((FDBDatabase *)target, (FDBDatabaseOption)code, (const uint8_t *)value, length);
    case OptTransaction: return fdb_transaction_set_option((FDBTransaction *)target, (FDBTransactionOption)code, (const uint8_t *)value, length);
  }
  // This should be unreachable, but I'm not sure if aborting makes sense... Hm.
  return 0;
}

napi_status set_option_wrapped(napi_env env, void *target, OptionType type, napi_callback_info info) {
  // For network options, target is ignored.
  // args should contain code, value.
  size_t argc = 2;
  napi_value args[2];
  NAPI_OK_OR_RETURN_STATUS(env, napi_get_cb_info(env, info, &argc, args, NULL, NULL));

  uint32_t code;
  NAPI_OK_OR_RETURN_STATUS(env, napi_get_value_uint32(env, args[0], &code));

  napi_valuetype js_type;
  NAPI_OK_OR_RETURN_STATUS(env, napi_typeof(env, args[1], &js_type));

  fdb_error_t err;
  if (js_type == napi_null || js_type == napi_undefined) {
    err = set_option(target, type, code, NULL, 0);
  } else if (js_type == napi_number) {
    int64_t value;
    NAPI_OK_OR_RETURN_STATUS(env, napi_get_value_int64(env, args[1], &value));
    err = set_option(target, type, code, (const void *)&value, sizeof(value));
  } else {
    bool is_buffer;
    NAPI_OK_OR_RETURN_STATUS(env, is_bufferish(env, args[1], &is_buffer));
    if (is_buffer) {
      void *data;
      size_t length;
      NAPI_OK_OR_RETURN_STATUS(env, get_buffer_info(env, args[1], &data, &length));
      err = set_option(target, type, code, data, length);
    } else {
      // No idea what it is. Bail!
      throw_if_not_ok(env, napi_throw_type_error(env, NULL, "Second argument must be a number or buffer"));
      return napi_pending_exception;
    }
  }

  if (err) {
    throw_fdb_error(env, err);
    return napi_pending_exception;
  } else return napi_ok;
}
