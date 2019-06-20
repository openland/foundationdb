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
#include "transaction.h"
#include "database.h"
#include "options.h"

static napi_ref cons_ref;

static void finalize(napi_env env, void* database, void* finalize_hint) {
  fdb_database_destroy((FDB_database *)database);
}

MaybeValue newDatabase(napi_env env, FDBDatabase *database) {
  napi_value ctor;
  NAPI_OK_OR_RETURN_MAYBE(env, napi_get_reference_value(env, cons_ref, &ctor));

  napi_value obj;
  NAPI_OK_OR_RETURN_MAYBE(env, napi_new_instance(env, ctor, 0, NULL, &obj));
  NAPI_OK_OR_RETURN_MAYBE(env, napi_wrap(env, obj, (void *)database, finalize, NULL, NULL));
  return wrap_ok(obj);
}


static napi_value setOption(napi_env env, napi_callback_info info) {
  FDBDatabase *db = (FDBDatabase *)getWrapped(env, info);
  // Silently fail if the database is closed.
  if (db != NULL) set_option_wrapped(env, db, OptDatabase, info);
  return NULL;
}

static napi_value close(napi_env env, napi_callback_info info) {
  FDBDatabase *database;
  napi_value obj;
  NAPI_OK_OR_RETURN_NULL(env, napi_get_cb_info(env, info, 0, NULL, &obj, NULL));
  // Calls napi_remove_wrap not napi_unwrap.
  NAPI_OK_OR_RETURN_NULL(env, napi_remove_wrap(env, obj, (void **)&database));
  fdb_database_destroy(database);
  return NULL;
}

static napi_value createTransaction(napi_env env, napi_callback_info info) {
  FDBDatabase *db = (FDBDatabase *)getWrapped(env, info);
  if (db == NULL) {
    throw_if_not_ok(env, napi_throw_error(env, NULL, "Cannot create transaction after db closed"));
    return NULL;
  }

  FDBTransaction *tr;
  FDB_OK_OR_RETURN_NULL(env, fdb_database_create_transaction(db, &tr));

  return newTransaction(env, tr).value;
}


static napi_value newDatabase(napi_env env, napi_callback_info info) {
  return NULL;
}

napi_status initDatabase(napi_env env) {
  napi_property_descriptor desc[] = {
    FN_DEF(setOption),
    FN_DEF(close),
    FN_DEF(createTransaction),
  };

  napi_value constructor;
  NAPI_OK_OR_RETURN_STATUS(env, napi_define_class(env, "Database", NAPI_AUTO_LENGTH,
    newDatabase, NULL, sizeof(desc)/sizeof(desc[0]), desc, &constructor));

  NAPI_OK_OR_RETURN_STATUS(env, napi_create_reference(env, constructor, 1, &cons_ref));
  return napi_ok;
}
