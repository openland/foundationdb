import { Float } from './Float';
import { BufferWriter, BufferReader } from './utils/buffer';
import { TupleCodec } from './codecs';
import { normalizeInteger } from './utils/normalizeInteger';
import { normalizeDouble } from './utils/normalizeDouble';

export interface TupleCodec<T> {
    is(code: number): boolean;
    pack(src: T, writer: BufferWriter): void;
    unpack(reader: BufferReader): T;
}

//
// Null Codec
//

export const NullCodec: TupleCodec<null> = {
    is(code: number) {
        return code === 0x00;
    },
    pack(src: null, writer: BufferWriter) {
        writer.writeByte(0x00);
    },
    unpack(reader: BufferReader) {
        reader.expect(0x00);
        return null;
    }
};

//
// Boolean Codec
//

export const BooleanCodec: TupleCodec<boolean> = {
    is(code: number) {
        return code === 0x26 || code === 0x27;
    },
    pack(src: boolean, writer: BufferWriter) {
        if (src) {
            writer.writeByte(0x27);
        } else {
            writer.writeByte(0x26);
        }
    },
    unpack(reader: BufferReader) {
        let code = reader.readByte();
        if (code === 0x27) {
            return true;
        } else if (code === 0x26) {
            return false;
        } else {
            throw Error('Unknown code: ' + code);
        }
    }
};

//
// Buffer/String codecs
//

function writeBuffer(src: Buffer, writer: BufferWriter) {
    for (let i = 0; i < src.length; i++) {
        const val = src.readUInt8(i);
        writer.writeByte(val);

        // Escape zero bytes
        if (val === 0) {
            writer.writeByte(0xff);
        }
    }
    writer.writeByte(0x00);
}

function readBuffer(reader: BufferReader) {
    /** 
     * NOTE: Our implementation is different here from node-foundationdb. 
     * They are not crashing codec if they reached buffer end, but we are.
     */
    let writer = new BufferWriter();
    while (true) {
        const byte = reader.readByte();
        if (byte === 0) {
            /**
             * If zero byte is not escaped then stop reading
             */
            if (reader.completed || reader.peek() !== 0xff) {
                break;
            }
            reader.expect(0xff);
        }
        writer.writeByte(byte);
    }
    return writer.build();
}

export const ByteStringCodec: TupleCodec<Buffer> = {
    is(code: number) {
        return code === 0x01;
    },
    pack(src: Buffer, writer: BufferWriter) {
        writer.writeByte(0x01);
        writeBuffer(src, writer);
    },
    unpack(reader: BufferReader) {
        reader.expect(0x01);
        return readBuffer(reader);
    }
};

export const TextStringCodec: TupleCodec<string> = {
    is(code: number) {
        return code === 0x02;
    },
    pack(src: string, writer: BufferWriter) {
        writer.writeByte(0x02);
        writeBuffer(Buffer.from(src, 'utf8'), writer);
    },
    unpack(reader: BufferReader) {
        reader.expect(0x02);
        return readBuffer(reader).toString(); /* UTF-8 is default encoding */
    }
};

//
// Integer Codec
//

const numByteLen = (num: number) => {
    let max = 1;
    for (let i = 0; i <= 8; i++) {
        if (num < max) {
            return i;
        }
        max *= 256;
    }
    throw Error('Number too big for encoding');
};

export const IntegerCodec: TupleCodec<number> = {
    is(code: number) {
        return code >= 0x0c && code <= 0x1c;
    },
    pack(src: number, writer: BufferWriter) {
        let item = normalizeInteger(src);
        let absItem = Math.abs(item);
        let byteLen = numByteLen(absItem);

        // Write length and sign byte
        writer.writeByte(0x14 + (item < 0 ? -byteLen : byteLen));

        // Magic
        let lowBits = (absItem & 0xffffffff) >>> 0;
        let highBits = ((absItem - lowBits) / 0x100000000) >>> 0;
        if (item < 0) {
            lowBits = (~lowBits) >>> 0;
            highBits = (~highBits) >>> 0;
        }
        for (; byteLen > 4; --byteLen) {
            writer.writeByte(highBits >>> (8 * (byteLen - 5)));
        }
        for (; byteLen > 0; --byteLen) {
            writer.writeByte(lowBits >>> (8 * (byteLen - 1)));
        }
    },
    unpack(reader: BufferReader) {
        let code = reader.readByte();
        const byteLen = code - 20; // Negative if number is negative.
        const absByteLen = Math.abs(byteLen);
        if (absByteLen <= 7) {
            if (code === 0x14) {
                return 0;
            } else {
                const negative = byteLen < 0;

                let num = 0;
                let mult = 1;
                let odd;
                for (let i = absByteLen - 1; i >= 0; --i) {
                    let b = reader.bufffer[reader.offset + i];
                    if (negative) {
                        b = -(~b & 0xff);
                    }
                    if (i === absByteLen - 1) {
                        odd = b & 0x01;
                    }
                    num += b * mult;
                    mult *= 0x100;
                }
                reader.skip(absByteLen);
                return normalizeInteger(num);
            }
        } else {
            throw new RangeError('Cannot unpack signed integers larger than 54 bits');
        }
    }
};

//
// Double Codec
//

const adjustDouble = (data: Buffer, isEncode: boolean) => {
    // Some magic, have no idea what it does
    if ((isEncode && (data[0] & 0x80) === 0x80) || (!isEncode && (data[0] & 0x80) === 0x00)) {
        for (var i = 0; i < data.length; i++) {
            data[i] = ~data[i];
        }
    } else {
        data[0] ^= 0x80;
    }
    return data;
};

export const DoubleCodec: TupleCodec<Float> = {
    is(code: number) {
        return code === 0x21;
    },
    pack(src: Float, writer: BufferWriter) {
        let normalized = normalizeDouble(src.value);
        writer.writeByte(0x21);

        // We need to look at the representation bytes - which needs a temporary buffer.
        const bytes = Buffer.allocUnsafe(8);
        bytes.writeDoubleBE(normalized, 0);
        adjustDouble(bytes, true);
        writer.writeBuffer(bytes);
    },
    unpack(reader: BufferReader) {
        reader.expect(0x21);
        const numBuf = Buffer.alloc(8);
        reader.bufffer.copy(numBuf, 0, reader.offset, reader.offset + 8);
        adjustDouble(numBuf, false);
        reader.skip(8);

        // NOTE: buffer.readDoubleBE canonicalizes all NaNs to the same NaN
        // value. This is usually fine, but it means unpack(pack(val)) is
        // sometimes not bit-identical. There's also some canonicalization of
        // other funky float values.
        // We throw error if we detect NaN to avoid inconsistent data.
        const value = normalizeDouble(numBuf.readDoubleBE(0));
        return new Float(value);
    }
};