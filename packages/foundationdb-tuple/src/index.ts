import { BufferWriter, BufferReader } from './utils/buffer';
import { IntegerCodec, TextStringCodec, BooleanCodec, NullCodec, ByteStringCodec, DoubleCodec } from './codecs';
export type TupleItem = number | string | boolean | null | Buffer | { type: 'double', value: number };

export function pack(src: TupleItem[]): Buffer {
    let writer = new BufferWriter();
    for (let itm of src) {
        if (typeof itm === 'undefined') {
            throw Error('Tuples can\'t have undefined values');
        } else if (typeof itm === 'number') {
            IntegerCodec.pack(itm, writer);
        } else if (typeof itm === 'string') {
            TextStringCodec.pack(itm, writer);
        } else if (typeof itm === 'boolean') {
            BooleanCodec.pack(itm, writer);
        } else if (itm === null) {
            NullCodec.pack(itm, writer);
        } else if (Buffer.isBuffer(itm)) {
            ByteStringCodec.pack(itm, writer);
        } else if (itm.type === 'double') {
            DoubleCodec.pack(itm, writer);
        } else {
            throw Error('Unknown tuple item: ' + itm);
        }
    }
    return writer.build();
}

export function unpack(src: Buffer): TupleItem[] {
    let res: TupleItem[] = [];
    let reader = new BufferReader(src);
    while (reader.completed) {
        let code = reader.peek();
        if (IntegerCodec.is(code)) {
            res.push(IntegerCodec.unpack(reader));
        } else if (TextStringCodec.is(code)) {
            res.push(TextStringCodec.unpack(reader));
        } else if (BooleanCodec.is(code)) {
            res.push(BooleanCodec.unpack(reader));
        } else if (NullCodec.is(code)) {
            res.push(NullCodec.unpack(reader));
        } else if (ByteStringCodec.is(code)) {
            res.push(ByteStringCodec.unpack(reader));
        } else if (DoubleCodec.is(code)) {
            res.push(DoubleCodec.unpack(reader));
        } else {
            throw Error('Unsupported tag: ' + code);
        }
    }
    return res;
}