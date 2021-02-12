import { createContextNamespace } from '@openland/context';
import { Transaction } from '../Transaction';

export const TransactionContext = createContextNamespace<Transaction | null>('fdb-tx', null);