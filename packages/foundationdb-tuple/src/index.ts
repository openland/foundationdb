import { Float } from './Float';
import { Versionstamp } from './Versionstamp';
import { VersionstampRef } from './VersionstampRef';
import { BufferWriter, BufferReader } from './utils/buffer';
import { IntegerCodec, TextStringCodec, BooleanCodec, NullCodec, ByteStringCodec, DoubleCodec, VersionstampCodec } from './codecs';

export { Float };
export { Versionstamp };
export { VersionstampRef };
export type TupleItem = number | Float | boolean | string | Buffer | Versionstamp | null;
export type TupleItemExtended = TupleItem | VersionstampRef;

/**
 * Pack tuple to a Buffer
 * @param src array of TupleItems
 */
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
        } else if (Buffer.isBuffer(itm)) {
            ByteStringCodec.pack(itm, writer);
        } else if (itm instanceof Float) {
            DoubleCodec.pack(itm, writer);
        } else if (itm instanceof Versionstamp) {
            VersionstampCodec.pack(itm, writer);
        } else if (itm === null) {
            NullCodec.pack(itm, writer);
        } else {
            throw Error('Unknown tuple item: ' + itm);
        }
    }
    return writer.build();
}
/**
 * Unpack tuple from a Buffer
 * @param src source Buffer
 */
export function unpack(src: Buffer): TupleItem[] {
    let res: TupleItem[] = [];
    let reader = new BufferReader(src);
    while (!reader.completed) {
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
        } else if (VersionstampCodec.is(code)) {
            res.push(VersionstampCodec.unpack(reader));
        } else {
            throw Error('Unsupported tag: ' + code);
        }
    }
    return res;
}

/**
 * Equality of two tuples
 * @param a first tuple
 * @param b second tuple
 */
export function equals(a: TupleItem[], b: TupleItem[]) {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (typeof a[i] !== typeof b[i]) {
            return false;
        }
        if (typeof a[i] === 'string' || typeof a[i] === 'number' || typeof a[i] === 'boolean' || a[i] === null || b[i] === null) {
            if (a[i] !== b[i]) {
                return false;
            }
        } else if (Buffer.isBuffer(a[i])) {
            if (!Buffer.isBuffer(b[i])) {
                return false;
            }
            if (!(a[i] as Buffer).equals(b[i] as Buffer)) {
                return false;
            }
        } else if (a[i] instanceof Float) {
            if (!(b[i] instanceof Float)) {
                return false;
            }
            if ((a[i] as Float).value !== (b[i] as Float).value) {
                return false;
            }
        } else if (a[i] instanceof Versionstamp) {
            if (!(b[i] instanceof Versionstamp)) {
                return false;
            }
            if (!((a[i] as Versionstamp).value.equals((b[i] as Versionstamp).value))) {
                return false;
            }
        } else {
            throw Error('Unknown tuple item: ' + a[i]);
        }
    }
    return true;
}

/**
 * Pack with versionstamp ref
 * @param src source tuple
 */
export function packWithVersionstamp(src: TupleItemExtended[]): { prefix: Buffer, suffix: Buffer } {
    let prefix: Buffer | null = null;
    let suffix: Buffer | null = null;
    let writer = new BufferWriter();
    for (let itm of src) {
        if (itm instanceof VersionstampRef) {
            if (prefix) {
                throw Error('Multiple versionstamps found');
            }
            // Prefix of Versionstamp
            writer.writeByte(0x33);
            prefix = writer.build();

            // Buffer suffix (expected to be two bytes)
            writer = new BufferWriter();
            writer.writeBuffer(itm.index);
        } else if (typeof itm === 'undefined') {
            throw Error('Tuples can\'t have undefined values');
        } else if (typeof itm === 'number') {
            IntegerCodec.pack(itm, writer);
        } else if (typeof itm === 'string') {
            TextStringCodec.pack(itm, writer);
        } else if (typeof itm === 'boolean') {
            BooleanCodec.pack(itm, writer);
        } else if (Buffer.isBuffer(itm)) {
            ByteStringCodec.pack(itm, writer);
        } else if (itm instanceof Float) {
            DoubleCodec.pack(itm, writer);
        } else if (itm instanceof Versionstamp) {
            VersionstampCodec.pack(itm, writer);
        } else if (itm === null) {
            NullCodec.pack(itm, writer);
        } else {
            throw Error('Unknown tuple item: ' + itm);
        }
    }
    if (!prefix) {
        throw Error('No versionstamps found');
    }
    suffix = writer.build();
    return { prefix, suffix };
}
