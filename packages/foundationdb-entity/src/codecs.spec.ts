import { codecs } from './codecs';

describe('Codecs', () => {

    // Strings
    it('should encode and decode string', () => {
        expect(codecs.string.decode('hey!')).toBe('hey!');
        expect(codecs.string.encode('hey!')).toBe('hey!');
    });
    it('should throw error if not string', () => {
        expect(() => codecs.string.decode(1)).toThrowError('Input type is not a string');
        expect(() => codecs.string.encode(1 as any)).toThrowError('Input type is not a string');
    });

    // Numbers
    it('should encode and decode number', () => {
        expect(codecs.number.decode(1)).toBe(1);
        expect(codecs.number.encode(-1)).toBe(-1);
    });
    it('should throw error if not number', () => {
        expect(() => codecs.number.decode('!')).toThrowError('Input type is not a number');
        expect(() => codecs.number.encode('!' as any)).toThrowError('Input type is not a number');
    });

    // Boolean
    it('should decode boolean', () => {
        expect(codecs.boolean.decode(true)).toBe(true);
        expect(codecs.boolean.encode(false)).toBe(false);
    });
    it('should throw error if not boolean', () => {
        expect(() => codecs.boolean.decode('!')).toThrowError('Input type is not a boolean');
        expect(() => codecs.boolean.encode('!' as any)).toThrowError('Input type is not a boolean');
    });

    // Optional
    it('should bypass values for non-null/undefined values', () => {
        expect(codecs.optional(codecs.string).decode('!!!')).toBe('!!!');
        expect(codecs.optional(codecs.string).encode('!!!')).toBe('!!!');
    });
    it('should return null for null or undefined value', () => {
        expect(codecs.optional(codecs.boolean).decode(null)).toBe(null);
        expect(codecs.optional(codecs.boolean).decode(undefined)).toBe(null);
        expect(codecs.optional(codecs.boolean).encode(null)).toBe(null);
        expect(codecs.optional(codecs.boolean).encode(undefined)).toBe(null);
    });

    // Default
    it('should bypass values for non-null/undefined values', () => {
        expect(codecs.optional(codecs.string).decode('!!!')).toBe('!!!');
        expect(codecs.optional(codecs.string).encode('!!!')).toBe('!!!');
    });
    it('should return default value', () => {
        expect(codecs.default(codecs.boolean, false).decode(null)).toBe(false);
        expect(codecs.default(codecs.boolean, () => false).decode(null)).toBe(false);
        expect(codecs.default(codecs.boolean, false).decode(undefined)).toBe(false);
        expect(codecs.default(codecs.boolean, () => false).decode(undefined)).toBe(false);
        expect(codecs.default(codecs.boolean, true).encode(null)).toBe(true);
        expect(codecs.default(codecs.boolean, () => true).encode(null)).toBe(true);
        expect(codecs.default(codecs.boolean, true).encode(undefined)).toBe(true);
        expect(codecs.default(codecs.boolean, () => true).encode(undefined)).toBe(true);
    });

    // Structs
    it('should encode and decode simple struct', () => {
        let codec = codecs.struct({
            name: codecs.string
        });
        let res = codec.decode({ name: 'hello!' });
        expect(Object.keys(res).length).toBe(1);
        expect(Object.keys(res)[0]).toBe('name');
        expect(res.name).toBe('hello!');
        let res2 = codec.encode(res);
        expect(Object.keys(res2).length).toBe(1);
        expect(Object.keys(res2)[0]).toBe('name');
        expect(res2.name).toBe('hello!');
    });
    it('should ignore unknown fields', () => {
        let codec = codecs.struct({
            name: codecs.string
        });
        let res = codec.decode({ name: 'hello!', value: 'hey!' });
        expect(Object.keys(res).length).toBe(1);
        expect(Object.keys(res)[0]).toBe('name');
        expect(res.name).toBe('hello!');
    });
    it('should throw if not object', () => {
        let codec = codecs.struct({
            name: codecs.string
        });
        expect(() => codec.decode('')).toThrowError('Input type is not an object');
        expect(() => codec.encode('' as any)).toThrowError('Input type is not an object');
    });
    it('should ignore null values during encoding', () => {
        let codec = codecs.struct({
            name: codecs.optional(codecs.string)
        });
        let encoded = codec.encode({ name: null });
        expect(Object.keys(encoded).length).toBe(0);
        encoded = codec.encode({} as any);
        expect(Object.keys(encoded).length).toBe(0);
    });
    it('should unwrap undefined or null as null', () => {
        let codec = codecs.struct({
            name: codecs.optional(codecs.string)
        });
        let decoded = codec.decode({ name: null });
        expect(Object.keys(decoded).length).toBe(1);
        expect(decoded.name).toBe(null);
        decoded = codec.decode({});
        expect(Object.keys(decoded).length).toBe(1);
        expect(decoded.name).toBe(null);
    });

    // Enums
    it('should encode and decode enums', () => {
        let codec = codecs.enum('1', '2');
        expect(codec.decode('1')).toBe('1');
        expect(codec.encode('1')).toBe('1');
    });
    it('should throw error on invalid value', () => {
        let codec = codecs.enum('1', '2');
        expect(() => codec.decode('3')).toThrowError();
        expect(() => codec.encode('3' as any)).toThrowError();
    });

    // Union
    it('should union types', () => {
        let codec1 = codecs.struct({
            name: codecs.string
        });
        let codec2 = codecs.struct({
            metadata: codecs.string
        });
        let codec3 = codecs.union(codec1, codec2);
        let decoded = codec3.decode({
            name: 'name1',
            metadata: 'metadata2'
        });
        expect(Object.keys(decoded).length).toBe(2);
        expect(decoded.name).toBe('name1');
        expect(decoded.metadata).toBe('metadata2');
        let encoded = codec3.encode({
            name: 'name1',
            metadata: 'metadata2'
        });
        expect(Object.keys(encoded).length).toBe(2);
        expect(encoded.name).toBe('name1');
        expect(encoded.metadata).toBe('metadata2');
    });
});