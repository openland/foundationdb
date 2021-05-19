import { createContextNamespace } from '@openland/context';

export const PriorityContext = createContextNamespace<'default' | 'immediate' | 'batch'>('fdb-priority', 'default');
