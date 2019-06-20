// This is a few utility methods & macros to help interact with NAPI and FDB.

#ifndef UTILS_H
#define UTILS_H

// // Experimental is needed for threadsafe_function in node 10.
// #define NAPI_EXPERIMENTAL
// #define NAPI_VERSION 4

#include <node_api.h>
#include <stdbool.h>
#include "fdbversion.h"
#include <foundationdb/fdb_c.h>

#if defined(__clang__) || defined(__GNUC__)
#define LIKELY(condition) __builtin_expect(static_cast<bool>(condition), 1)
#define UNLIKELY(condition) __builtin_expect(static_cast<bool>(condition), 0)
#else
#define LIKELY(condition) (condition)
#define UNLIKELY(condition) (condition)
#endif

napi_status throw_if_not_ok(napi_env env, napi_status status);

typedef struct MaybeValue {
  napi_status status;
  napi_value value; // Only if status is napi_ok.
} MaybeValue;

inline MaybeValue wrap_ok(napi_value value) {
  return { napi_ok, value };
}
inline MaybeValue wrap_err(napi_status status) {
  return { status, NULL };
}
inline MaybeValue wrap_null() {
  return { napi_ok, NULL };
}

#define NAPI_OK_OR_RETURN_NULL(env, expr) do {\
  if (UNLIKELY(throw_if_not_ok(env, (expr)) != napi_ok)) { return NULL; }\
} while (0)

#define NAPI_OK_OR_RETURN_STATUS(env, expr) do {\
  napi_status status = throw_if_not_ok(env, (expr));\
  if (UNLIKELY(status != napi_ok)) { return status; }\
} while (0)

#define NAPI_OK_OR_RETURN_MAYBE(env, expr) do {\
  napi_status status = throw_if_not_ok(env, (expr));\
  if (UNLIKELY(status != napi_ok)) { return wrap_err(status); }\
} while (0)

napi_status wrap_fdb_error(napi_env env, fdb_error_t fdbErrCode, napi_value* result);

void throw_fdb_error(napi_env env, fdb_error_t fdbErrCode);

// TODO: Rename to indicate that this also throws the error.
#define FDB_OK_OR_RETURN_NULL(env, expr) do {\
  fdb_error_t code = (expr);\
  if (UNLIKELY(code != 0)) {\
    throw_fdb_error(env, code);\
    return NULL;\
  }\
} while (0)

inline MaybeValue fdb_status_to_maybe(napi_env env, fdb_error_t errcode) {
  if (UNLIKELY(errcode != 0)) {
    throw_fdb_error(env, errcode);
    return wrap_err(napi_pending_exception);
  } else return wrap_null();
}

#define FDB_OK_OR_RETURN_MAYBE(env, expr) do {\
  fdb_error_t code = (expr);\
  if (UNLIKELY(code != 0)) \
    throw_fdb_error(env, code);\
    return wrap_err(napi_pending_exception);\
  }\
} while (0)

#define FN_DEF(fn) {#fn, NULL, fn, NULL, NULL, NULL, napi_default, NULL}

#define GET_ARGS(env, info, args, count) \
  size_t _argc = count;\
  napi_value args[count];\
  NAPI_OK_OR_RETURN_NULL(env, napi_get_cb_info(env, info, &_argc, args, NULL, NULL));


inline napi_status typeof_wrap(napi_env env, napi_value value, napi_valuetype* result) {
  if (value == NULL) {
    *result = napi_undefined;
    return napi_ok;
  } else {
    return napi_typeof(env, value, result);
  }
}
// inline napi_status is_nullish(napi_env env, napi_value value, bool* result) {
//   if (value == NULL) {
//     *result = true;
//     return napi_ok;
//   } else {
//     napi_valuetype type;
//     NAPI_OK_OR_RETURN_STATUS(env, napi_typeof(env, value, &type));
//     *result = type == napi_null || type == napi_undefined;
//     return napi_ok;
//   }
// }

// Returns null on error.
void *getWrapped(napi_env env, napi_callback_info info);

inline napi_status is_bufferish(napi_env env, napi_value value, bool* result) {
  NAPI_OK_OR_RETURN_STATUS(env, napi_is_buffer(env, value, result));
  if (!result) return napi_is_arraybuffer(env, value, result);
  else return napi_ok;
}

inline napi_status get_buffer_info(napi_env env, napi_value value, void** data, size_t* length) {
  bool is_buffer;
  NAPI_OK_OR_RETURN_STATUS(env, napi_is_buffer(env, value, &is_buffer));
  if (is_buffer) return napi_get_buffer_info(env, value, data, length);
  else return napi_get_arraybuffer_info(env, value, data, length);
}

#endif