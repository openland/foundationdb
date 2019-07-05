import { IndexField } from '../EntityDescriptor';
import * as Tuple from '@openland/foundationdb-tuple';
import { encoders, TupleItem } from '@openland/foundationdb';

export function tupleToCursor(tuple: TupleItem[]) {
    return encoders.tuple.pack(tuple).toString('hex');
}

export function cursorToTuple(src: string) {
    return encoders.tuple.unpack(Buffer.from(src, 'hex'));
}

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
        if (key.type === 'opt_boolean'
            || key.type === 'opt_string'
            || key.type === 'opt_float'
            || key.type === 'opt_integer'
        ) {
            if (v === null) {
                res.push(v);
                continue;
            }
        }
        if (key.type === 'boolean' || key.type === 'opt_boolean') {
            if (typeof v !== 'boolean') {
                throw Error('Unexpected key');
            }
            res.push(v);
        } else if (key.type === 'integer' || key.type === 'opt_integer') {
            if (typeof v !== 'number') {
                throw Error('Unexpected key');
            }
            res.push(v);
        } else if (key.type === 'float' || key.type === 'opt_float') {
            if (typeof v !== 'number') {
                throw Error('Unexpected key');
            }
            res.push(new Tuple.Float(v as number));
        } else if (key.type === 'string' || key.type === 'opt_string') {
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