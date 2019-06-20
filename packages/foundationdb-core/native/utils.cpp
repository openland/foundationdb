#include <cstdio>
#include <cassert>
#include "utils.h"
#include "error.h"
// #include <execinfo.h>

// Useful for figuring out where an error is coming from.
// From GCC docs
// void print_trace ()
// {
//   void *array[10];
//   size_t size;
//   char **strings;
//   size_t i;

//   size = backtrace (array, 10);
//   strings = backtrace_symbols (array, size);

//   printf ("Obtained %zd stack frames.\n", size);

//   for (i = 0; i < size; i++)
//      printf ("%s\n", strings[i]);

//   free (strings);
// }


napi_status throw_if_not_ok(napi_env env, napi_status status) {
  switch (status) {
    case napi_ok: case napi_pending_exception:
      return status;
    case napi_invalid_arg:
      // print_trace();
      napi_throw_error(env, NULL, "Invalid arguments");
      return napi_pending_exception;
    case napi_number_expected:
      napi_throw_type_error(env, NULL, "Expected number");
      return napi_pending_exception;
    case napi_string_expected:
      napi_throw_type_error(env, NULL, "Expected string");
      return napi_pending_exception;
    case napi_generic_failure:
      napi_throw_type_error(env, NULL, "Generic failure");
      return napi_pending_exception;
    default:
      fprintf(stderr, "throw_if_not_ok %d\n", status);
      assert(0);
  }
}

napi_status wrap_fdb_error(napi_env env, fdb_error_t code, napi_value* result) {
  MaybeValue err = create_error(env, code);
  if (err.status == napi_ok) *result = err.value;
  return throw_if_not_ok(env, err.status);
    
  // napi_value errCode;
  // NAPI_OK_OR_RETURN_STATUS(env, napi_create_int32(env, fdbErrCode, &errCode));
  // napi_value errStr;
  // NAPI_OK_OR_RETURN_STATUS(env, napi_create_string_utf8(env, fdb_get_error(fdbErrCode), NAPI_AUTO_LENGTH, &errStr));
  // NAPI_OK_OR_RETURN_STATUS(env, napi_create_error(env, NULL, errStr, result));

  // // TODO: This isn't the same as the old code, since it won't allow err instanceof fdbErrCode to work.
  // NAPI_OK_OR_RETURN_STATUS(env, napi_set_named_property(env, *result, "fdb_errcode", errCode));
  // return napi_ok;
}

void throw_fdb_error(napi_env env, fdb_error_t fdbErrCode) {
  napi_value error;
  if (throw_if_not_ok(env, wrap_fdb_error(env, fdbErrCode, &error)) == napi_pending_exception) return; 
  throw_if_not_ok(env, napi_throw(env, error));
  // There'll be a pending exception after this no matter what. No need to return a status code.
}

void *getWrapped(napi_env env, napi_callback_info info) {
  void *data;
  napi_value obj;
  NAPI_OK_OR_RETURN_NULL(env, napi_get_cb_info(env, info, 0, NULL, &obj, NULL));
  NAPI_OK_OR_RETURN_NULL(env, napi_unwrap(env, obj, &data));
  return data;
}
