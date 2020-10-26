import { Context } from '@openland/context';
import { getTransaction } from './getTransaction';

export function createVersionstampRef(ctx: Context) {
    return getTransaction(ctx).allocateVersionstampRef();
}