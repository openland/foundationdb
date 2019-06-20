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

#include "utils.h"
#include "database.h"
#include "future.h"

using namespace std;

// Cluster::Cluster() { }
// Cluster::~Cluster() {
//   if (cluster) fdb_cluster_destroy(cluster);
// }

// Nan::Persistent<Function> Cluster::constructor;

// static napi_value newCluster(napi_env env, napi_callback_info info) {

// }

static napi_ref cons_ref;

static FDBFuture *createDbFuture(FDBCluster *cluster) {
  return fdb_cluster_create_database(cluster, (const uint8_t *)"DB", 2);
}

static napi_value openDatabaseSync(napi_env env, napi_callback_info info) {
  FDBCluster *cluster = (FDBCluster *)getWrapped(env, info);
  if (cluster == NULL) return NULL;

  FDBFuture *f = createDbFuture(cluster);
  FDB_OK_OR_RETURN_NULL(env, fdb_future_block_until_ready(f));

  FDBDatabase *database;
  FDB_OK_OR_RETURN_NULL(env, fdb_future_get_database(f, &database));

  return newDatabase(env, database).value;
}

static napi_value openDatabase(napi_env env, napi_callback_info info) {
  GET_ARGS(env, info, args, 2);
  FDBCluster *cluster = (FDBCluster *)getWrapped(env, info);
  if (cluster == NULL) return NULL;

  FDBFuture *f = createDbFuture(cluster);
  return futureToJS(env, f, args[1], [](napi_env env, FDBFuture* f, fdb_error_t* errOut) -> MaybeValue {
    FDBDatabase *database;
    if ((*errOut = fdb_future_get_database(f, &database))) return wrap_null();
    else return newDatabase(env, database);
  }).value;
}

static napi_value close(napi_env env, napi_callback_info info) {
  FDBCluster *cluster;
  napi_value obj;
  NAPI_OK_OR_RETURN_NULL(env, napi_get_cb_info(env, info, 0, NULL, &obj, NULL));
  // Note that this calls napi_remove_wrap not napi_unwrap like other methods.
  NAPI_OK_OR_RETURN_NULL(env, napi_remove_wrap(env, obj, (void **)&cluster));
  fdb_cluster_destroy(cluster);
  return NULL;
}

static napi_value newCluster(napi_env env, napi_callback_info info) {
  return NULL;
}

static void finalize(napi_env env, void* cluster, void* finalize_hint) {
  fdb_cluster_destroy((FDBCluster *)cluster);
}

MaybeValue newCluster(napi_env env, FDBCluster *cluster) {
  napi_value ctor;
  NAPI_OK_OR_RETURN_MAYBE(env, napi_get_reference_value(env, cons_ref, &ctor));

  napi_value obj;
  NAPI_OK_OR_RETURN_MAYBE(env, napi_new_instance(env, ctor, 0, NULL, &obj));
  NAPI_OK_OR_RETURN_MAYBE(env, napi_wrap(env, obj, (void *)cluster, finalize, NULL, NULL));
  return wrap_ok(obj);
}

napi_status initCluster(napi_env env) {
  napi_property_descriptor desc[] = {
    FN_DEF(openDatabase),
    FN_DEF(openDatabaseSync),
    FN_DEF(close),
  };

  napi_value constructor;
  NAPI_OK_OR_RETURN_STATUS(env, napi_define_class(env, "Cluster", NAPI_AUTO_LENGTH,
    newCluster, NULL, sizeof(desc)/sizeof(desc[0]), desc, &constructor));

  NAPI_OK_OR_RETURN_STATUS(env, napi_create_reference(env, constructor, 1, &cons_ref));
  return napi_ok;
}
