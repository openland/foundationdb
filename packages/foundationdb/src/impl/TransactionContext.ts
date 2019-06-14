import { createContextNamespace } from "@openland/context";
import { ReadWriteTransaction } from './ReadWriteTransaction';
import { ReadOnlyTransaction } from './ReadOnlyTransaction';

export const TransactionContext = createContextNamespace<ReadWriteTransaction | null>('fdb-tx-rw', null);
export const ReadOnlyTransactionContext = createContextNamespace<ReadOnlyTransaction | null>('fdb-tx-ro', null);