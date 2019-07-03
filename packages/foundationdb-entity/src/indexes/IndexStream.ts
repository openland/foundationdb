import { Context } from '@openland/context';
import { Stream } from '../Stream';

export class IndexStream<T> implements Stream<T> {
    async tail(ctx: Context): Promise<string | null> {
        return null;
    }
    async head(ctx: Context): Promise<string | null> {
        return null;
    }

    seek(cursor: string) {
        //
    }

    reset() {
        //
    }

    async next(ctx: Context): Promise<T[]> {
        return [];
    }
}