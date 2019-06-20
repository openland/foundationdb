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

#ifndef FDB_NODE_FDB_ERROR_H
#define FDB_NODE_FDB_ERROR_H

#include "fdbversion.h"
#include <foundationdb/fdb_c.h>
#include "utils.h"

napi_status initError(napi_env env, napi_value exports);
MaybeValue create_error(napi_env env, fdb_error_t code);

// class FdbError {
//   public:
//     static v8::Local<v8::Value> NewInstance(fdb_error_t code);
//     static v8::Local<v8::Value> NewInstance(fdb_error_t code, const char *description);

//     static void Init( v8::Local<v8::Object> module );

//   private:
//     FdbError();  // not implemented by design
// };

#endif
