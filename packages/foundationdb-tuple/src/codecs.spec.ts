import { Float } from './Float';
import { BufferWriter, BufferReader } from './utils/buffer';
import { NullCodec, TupleCodec, BooleanCodec, ByteStringCodec, TextStringCodec, IntegerCodec, DoubleCodec } from './codecs';

function testEncoding<T>(codec: TupleCodec<T>, src: T, expected: Buffer) {
    let writer = new BufferWriter();
    codec.pack(src, writer);
    let res = writer.build();
    expect(res.equals(expected)).toBe(true);
    let reader = new BufferReader(res);
    let decoded = codec.unpack(reader);
    expect(reader.completed).toBe(true);
    if (Buffer.isBuffer(src)) {
        expect(src.equals(decoded as any)).toBe(true);
    } else if (Object.is(-0, src)) {
        expect(decoded).toBe(0);
    } else {
        expect(decoded).toEqual(src);
    }
}

function testFailedEncoding<T>(codec: TupleCodec<T>, src: T) {
    let writer = new BufferWriter();
    expect(() => codec.pack(src, writer)).toThrowError();
}

describe('Tuple Codecs', () => {

    it('should encode and decode null', () => {
        expect(NullCodec.is(0x00)).toBe(true);
        expect(NullCodec.is(1)).toBe(false);
        testEncoding(NullCodec, null, Buffer.of(0x00));
    });

    it('should encode and decode boolean', () => {
        expect(BooleanCodec.is(0x26)).toBe(true);
        expect(BooleanCodec.is(0x27)).toBe(true);
        expect(BooleanCodec.is(1)).toBe(false);
        testEncoding(BooleanCodec, true, Buffer.of(0x27));
        testEncoding(BooleanCodec, false, Buffer.of(0x26));
    });

    it('should encode and decode byte string', () => {
        expect(ByteStringCodec.is(0x01)).toBe(true);
        expect(ByteStringCodec.is(2)).toBe(false);
        testEncoding(ByteStringCodec, Buffer.from('foo\x00bar', 'ascii'), Buffer.from('\x01foo\x00\xffbar\x00', 'ascii'));
    });

    it('should encode and decode text string', () => {
        expect(TextStringCodec.is(0x02)).toBe(true);
        expect(TextStringCodec.is(1)).toBe(false);
        testEncoding(TextStringCodec, 'F\u00d4O\u0000bar', Buffer.from('\x02F\xc3\x94O\x00\xffbar\x00', 'ascii'));
    });

    it('should encode and decode integers', () => {
        expect(IntegerCodec.is(1)).toBe(false);
        expect(IntegerCodec.is(0x0c)).toBe(true);
        expect(IntegerCodec.is(0x0d)).toBe(true);
        expect(IntegerCodec.is(0x0e)).toBe(true);
        expect(IntegerCodec.is(0x0f)).toBe(true);
        expect(IntegerCodec.is(0x10)).toBe(true);
        expect(IntegerCodec.is(0x11)).toBe(true);
        expect(IntegerCodec.is(0x12)).toBe(true);
        expect(IntegerCodec.is(0x13)).toBe(true);
        expect(IntegerCodec.is(0x14)).toBe(true);
        expect(IntegerCodec.is(0x15)).toBe(true);
        expect(IntegerCodec.is(0x16)).toBe(true);
        expect(IntegerCodec.is(0x17)).toBe(true);
        expect(IntegerCodec.is(0x18)).toBe(true);
        expect(IntegerCodec.is(0x19)).toBe(true);
        expect(IntegerCodec.is(0x1a)).toBe(true);
        expect(IntegerCodec.is(0x1b)).toBe(true);
        expect(IntegerCodec.is(0x1c)).toBe(true);
        testEncoding(IntegerCodec, -5551212, Buffer.from('\x11\xabK\x93', 'ascii'));
        testEncoding(IntegerCodec, -0, Buffer.from('\x14', 'ascii'));
        testEncoding(IntegerCodec, 0, Buffer.from('\x14', 'ascii'));
        testFailedEncoding(IntegerCodec, NaN);
        testFailedEncoding(IntegerCodec, Infinity);
        testFailedEncoding(IntegerCodec, -Infinity);
        testFailedEncoding(IntegerCodec, Math.pow(2, 60));
        testFailedEncoding(IntegerCodec, -Math.pow(2, 60));
    });

    it('should encode and decode doubles', () => {
        expect(DoubleCodec.is(0x21)).toBe(true);
        expect(DoubleCodec.is(0x22)).toBe(false);
        expect(DoubleCodec.is(0x20)).toBe(false);
        testEncoding(DoubleCodec, new Float(-42), Buffer.from('213fbaffffffffffff', 'hex'));
        testFailedEncoding(DoubleCodec, new Float(NaN));
        testFailedEncoding(DoubleCodec, new Float(Infinity));
        testFailedEncoding(DoubleCodec, new Float(-Infinity));
    });
});