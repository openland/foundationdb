import { IndexField } from './../EntityDescriptor';
import * as Tuple from '@openland/foundationdb-tuple';
import { encoders, TupleItem } from '@openland/foundationdb';

export function tupleKey(tuple: TupleItem[]) {
    return encoders.tuple.pack(tuple).toString('hex');
}

export function resolveIndexKey(src: any[], fields: IndexField[], partial: boolean = false, offset: number = 0) {
    if (!partial && src.length !== fields.length) {
        throw Error('Invalid key length');
    }

    let res: Tuple.TupleItem[] = [];
    for (let i = 0; i < src.length; i++) {
        let key = fields[i + offset];
        let v = src[i];
        if (key.type === 'boolean') {
            if (typeof v !== 'boolean') {
                throw Error('Unexpected key');
            }
            res.push(v);
        } else if (key.type === 'integer') {
            if (typeof v !== 'number') {
                throw Error('Unexpected key');
            }
            res.push(v);
        } else if (key.type === 'float') {
            if (typeof v !== 'number') {
                throw Error('Unexpected key');
            }
            res.push(new Tuple.Float(v as number));
        } else if (key.type === 'string') {
            if (typeof v !== 'string') {
                throw Error('Unexpected key');
            }
            res.push(v);
        } else {
            throw Error('Unknown index key');
        }
    }
    return res;
}