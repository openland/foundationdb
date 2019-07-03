import { Context } from '@openland/context';
import { Stream } from './Stream';

export interface RangeQuery<T> {
    asArray(ctx: Context): Promise<{ cursor: string, value: T }[]>;
    asStream(): Stream<T>;
    asLiveStream(): AsyncIterable<{ cursor: string, value: T }>;
}