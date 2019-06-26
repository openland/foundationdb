import { codecs } from './codecs';

describe('Codecs', () => {

    // Strings
    it('should encode and decode string', () => {
        expect(codecs.string.decode('hey!')).toBe('hey!');
        expect(codecs.string.encode('hey!')).toBe('hey!');
    });
    it('should throw error if not string', () => {
        expect(() => codecs.string.decode(1)).toThrowError();
        expect(() => codecs.string.encode(1 as any)).toThrowError();
    });

    // Numbers
    it('should encode and decode number', () => {
        expect(codecs.number.decode(1)).toBe(1);
        expect(codecs.number.encode(-1)).toBe(-1);
    });
    it('should throw error if not number', () => {
        expect(() => codecs.number.decode('!')).toThrowError();
        expect(() => codecs.number.encode('!' as any)).toThrowError();
    });

    // Boolean
    it('should decode boolean', () => {
        expect(codecs.boolean.decode(true)).toBe(true);
        expect(codecs.boolean.encode(false)).toBe(false);
    });
    it('should throw error if not boolean', () => {
        expect(() => codecs.boolean.decode('!')).toThrowError();
        expect(() => codecs.boolean.encode('!' as any)).toThrowError();
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

    // Structs
    it('should parse simple struct', () => {
        let codec = codecs.struct({
            name: codecs.string
        });
        let res = codec.decode({ name: 'hello!' });
        expect(Object.keys(res).length).toBe(1);
        expect(Object.keys(res)[0]).toBe('name');
        expect(res.name).toBe('hello!');
    });
});