import { Context } from '@openland/context';
import { PriorityContext } from './impl/PriorityContext';

export function withTxPriority(ctx: Context, priority: 'default' | 'immediate' | 'batch') {
    return PriorityContext.set(ctx, priority);
}