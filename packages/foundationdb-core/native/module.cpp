/*
 * FoundationDB Node.js API
 * Copyright (c) 2012 FoundationDB, LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

#include <cassert>

#include "utils.h"

// We need a wrapper around pthread / the windows equivalent, and libuv is
// already packaged.
#include <uv.h>

#include "fdbversion.h"
#include <foundationdb/fdb_c.h>

#include "cluster.h"
#include "database.h"
#include "future.h"
#include "transaction.h"
#include "error.h"
#include "options.h"

using namespace std;


static uv_thread_t fdbThread;

static bool networkStarted = false;
static int32_t previousApiVersion = 0;

// napi_status get_int32_arg(napi_env env, napi_callback_info info) {

// }

static napi_value setAPIVersion(napi_env env, napi_callback_info info) {
  GET_ARGS(env, info, args, 1);

  int32_t apiVersion;
  NAPI_OK_OR_RETURN_NULL(env, napi_get_value_int32(env, args[0], &apiVersion));
  
  if (previousApiVersion != 0) {
    if (apiVersion != previousApiVersion) {
      napi_throw_error(env, NULL, "foundationdb already initialized with another API version");
      return NULL;
    }
  } else {
    FDB_OK_OR_RETURN_NULL(env, fdb_select_api_version(apiVersion));
    previousApiVersion = apiVersion;    
  }
  return NULL;
}

static napi_value setAPIVersionImpl(napi_env env, napi_callback_info info) {
  GET_ARGS(env, info, args, 2);

  int32_t apiVersion;
  NAPI_OK_OR_RETURN_NULL(env, napi_get_value_int32(env, args[0], &apiVersion));
  int32_t headerVersion;
  NAPI_OK_OR_RETURN_NULL(env, napi_get_value_int32(env, args[1], &headerVersion));
  
  if (previousApiVersion != 0) {
    if (apiVersion != previousApiVersion) {
      napi_throw_error(env, NULL, "foundationdb already initialized with another API version");
      return NULL;
    }
  } else {
    FDB_OK_OR_RETURN_NULL(env, fdb_select_api_version_impl(apiVersion, headerVersion));
    previousApiVersion = apiVersion;    
  }
  return NULL;
}

static void networkThread(void *arg) {
  fdb_error_t errorCode = fdb_run_network();
  if(errorCode != 0) {
    fprintf(stderr, "Unhandled error in FoundationDB network thread: %s (%d)\n", fdb_get_error(errorCode), errorCode);
  }
}

static fdb_error_t runNetwork() {
  fdb_error_t errorCode = fdb_setup_network();

  if(errorCode != 0) return errorCode;

  assert(0 == uv_thread_create(&fdbThread, networkThread, NULL));  // FIXME: Handle errors here gracefully
  return 0;
}

// Returns null if the passed value isn't a string or NULL.
static FDBFuture *_createClusterFuture(napi_env env, napi_value filenameOrNull) {
  if (filenameOrNull != NULL) {
    napi_valuetype type;
    NAPI_OK_OR_RETURN_NULL(env, napi_typeof(env, filenameOrNull, &type));
    if (type == napi_null || type == napi_undefined) filenameOrNull = NULL;
  }

  if (filenameOrNull != NULL) {
    // This effectively enforces a hardcoded 1024 character limit on cluster file
    // paths. In practice this should be fine.
    char path[1024];
    // TODO: Consider adding a warning here if the path is truncated. (We can
    // pull the length back off with the last argument).
    NAPI_OK_OR_RETURN_NULL(env, napi_get_value_string_utf8(env, filenameOrNull, path, sizeof(path), NULL));
    return fdb_create_cluster(path);
  } else {
    return fdb_create_cluster(NULL);
  }
}

// static void finalizeCluster(napi_env env, void *cluster, void *_unused) {
//   // fprintf(stderr, "finalizeCluster");
//   // fflush(stderr);
//   fdb_cluster_destroy((FDB_cluster *)cluster);
// }

static napi_value createClusterSync(napi_env env, napi_callback_info info) {
  GET_ARGS(env, info, args, 1);

  FDBFuture *f = _createClusterFuture(env, args[0]);
  if (f == NULL) return NULL; // A napi error happened.

  // Isolate *isolate = Isolate::GetCurrent();
  // Nan::EscapableHandleScope scope;

  // FDBFuture *f = _createClusterFuture(info[0]);
  FDB_OK_OR_RETURN_NULL(env, fdb_future_block_until_ready(f));

  FDBCluster *cluster;
  FDB_OK_OR_RETURN_NULL(env, fdb_future_get_cluster(f, &cluster));

  MaybeValue val = newCluster(env, cluster);
  return val.value;
  // if (val.status != napi_ok) return NULL;

  // napi_value result;
  // napi_status status = napi_create_external(env, (void *)cluster, finalizeCluster, NULL, &result);
  // if (status != napi_ok) {
  //   fdb_cluster_destroy(cluster);
  //   return NULL;
  // }

  // return result;
}

// void createCluster(const FunctionCallbackInfo<Value>& info) {
static napi_value createCluster(napi_env env, napi_callback_info info) {
  GET_ARGS(env, info, args, 2);

  FDBFuture *f = _createClusterFuture(env, args[0]);
  return futureToJS(env, f, args[1], [](napi_env env, FDBFuture* f, fdb_error_t* errOut) -> MaybeValue {
    FDBCluster *cluster;
    if ((*errOut = fdb_future_get_cluster(f, &cluster))) return wrap_null();
    else return newCluster(env, cluster);
  }).value;
}

static napi_value setNetworkOption(napi_env env, napi_callback_info info) {
  set_option_wrapped(env, NULL, OptNetwork, info);
  return NULL;
}

static napi_value startNetwork(napi_env env, napi_callback_info info) {
  if(!networkStarted) {
    networkStarted = true;
    runNetwork();
  }
  return NULL;
}

static napi_value stopNetwork(napi_env env, napi_callback_info info) {
  if (!networkStarted) return NULL;

  FDB_OK_OR_RETURN_NULL(env, fdb_stop_network());

  assert(0 == uv_thread_join(&fdbThread));

  networkStarted = false;

  //This line forces garbage collection.  Useful for doing valgrind tests
  //while(!V8::IdleNotification());
  return NULL;
}

// (test, code) -> bool.
static napi_value errorPredicate(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value args[2];
  NAPI_OK_OR_RETURN_NULL(env, napi_get_cb_info(env, info, &argc, args, NULL, NULL));
  
  int test;
  NAPI_OK_OR_RETURN_NULL(env, napi_get_value_int32(env, args[0], &test));

  fdb_error_t code;
  NAPI_OK_OR_RETURN_NULL(env, napi_get_value_int32(env, args[1], &code));

  fdb_bool_t result = fdb_error_predicate(test, code);

  napi_value js_result;
  NAPI_OK_OR_RETURN_NULL(env, napi_get_boolean(env, result, &js_result));
  return js_result;
}

static napi_value init(napi_env env, napi_value exports) {
  NAPI_OK_OR_RETURN_NULL(env, initFuture(env));
  NAPI_OK_OR_RETURN_NULL(env, initCluster(env));
  NAPI_OK_OR_RETURN_NULL(env, initDatabase(env));
  NAPI_OK_OR_RETURN_NULL(env, initTransaction(env));
  NAPI_OK_OR_RETURN_NULL(env, initWatch(env));
  NAPI_OK_OR_RETURN_NULL(env, initError(env, exports));

  napi_value napi;
  NAPI_OK_OR_RETURN_NULL(env, napi_create_string_utf8(env, "napi", NAPI_AUTO_LENGTH, &napi));

  napi_property_descriptor desc[] = {
    FN_DEF(setAPIVersion),
    FN_DEF(setAPIVersionImpl),

    FN_DEF(createCluster),
    FN_DEF(createClusterSync),

    FN_DEF(setNetworkOption),
    FN_DEF(startNetwork),
    FN_DEF(stopNetwork),

    FN_DEF(errorPredicate),

    // export type: 'napi' to differentiate it from the nan-based code at runtime.
    {"type", NULL, NULL, NULL, NULL, napi, napi_default, NULL},
  };
  NAPI_OK_OR_RETURN_NULL(env, napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc));
  return NULL;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init);
