#ifndef FDB_NODE_OPTIONS_H
#define FDB_NODE_OPTIONS_H

#include "utils.h"

enum OptionType {
  OptNetwork,
  OptDatabase,
  OptTransaction,
};

napi_status set_option_wrapped(napi_env env, void *target, OptionType type, napi_callback_info info);

#endif