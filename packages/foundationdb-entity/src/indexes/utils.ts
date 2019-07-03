import { encoders, TupleItem } from '@openland/foundationdb';

export function tupleKey(tuple: TupleItem[]) {
    return encoders.tuple.pack(tuple).toString('hex');
}