// This file provides some utilities for wrapping FDB future objects with javascript.

#ifndef _FUTURE_H_
#define _FUTURE_H_

#include "utils.h"

napi_status initFuture(napi_env env);

typedef MaybeValue ExtractValueFn(napi_env env, FDBFuture* f, fdb_error_t* errOut);

// v8::Local<v8::Promise> fdbFutureToJSPromise(FDBFuture* f, ExtractValueFn* extractValueFn);
// void fdbFutureToCallback(FDBFuture *f, v8::Local<v8::Function> cbFunc, ExtractValueFn *extractFn);

MaybeValue futureToJS(napi_env env, FDBFuture *f, napi_value cbOrNull, ExtractValueFn *extractFn);

napi_status initWatch(napi_env env);
MaybeValue watchFuture(napi_env env, FDBFuture *f, bool ignoreStandardErrors);

#endif