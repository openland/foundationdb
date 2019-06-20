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

#include "error.h"

// This is pretty ugly. We're holding a reference to the exports object. The JS
// code adds a reference to a JS error class after the module is created.

static napi_ref module;

napi_status initError(napi_env env, napi_value exports) {
  return napi_create_reference(env, exports, 1, &module);
}

MaybeValue create_error(napi_env env, fdb_error_t code) {
  napi_value jsModule;
  NAPI_OK_OR_RETURN_MAYBE(env, napi_get_reference_value(env, module, &jsModule));
  napi_value constructor;
  NAPI_OK_OR_RETURN_MAYBE(env, napi_get_named_property(env, jsModule, "FDBError", &constructor));

  napi_valuetype type;
  NAPI_OK_OR_RETURN_MAYBE(env, napi_typeof(env, constructor, &type));

  napi_value instance;

  if (type == napi_function) {
    napi_value args[2] = {};
    NAPI_OK_OR_RETURN_MAYBE(env, napi_create_string_utf8(env, fdb_get_error(code), NAPI_AUTO_LENGTH, &args[0]));
    NAPI_OK_OR_RETURN_MAYBE(env, napi_create_int32(env, code, &args[1]));
    NAPI_OK_OR_RETURN_MAYBE(env, napi_new_instance(env, constructor, 2, args, &instance));
  } else {
    // We can't find the (javascript) FDBError class, so construct and throw *something*
    napi_value errStr;
    napi_create_string_utf8(env, "FDBError class not found. Unable to deliver error.", NAPI_AUTO_LENGTH, &errStr);
    napi_create_error(env, NULL, errStr, &instance);
  }

  return wrap_ok(instance);
}
