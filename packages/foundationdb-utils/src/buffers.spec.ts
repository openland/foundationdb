import { bufferSubstract, bufferAdd, int32ToBufferBE, bufferShiftRight, bufferShiftLeft, bufferMultiply } from './buffers';

describe('buffers', () => {
    it('should handler empty values', () => {
        let src = Buffer.from([1, 2, 3]);
        expect(bufferSubstract(src, Buffer.from([0, 0, 0]))).toMatchObject(src);
        expect(bufferAdd(src, Buffer.from([0, 0, 0]))).toMatchObject(src);

        src = Buffer.from([]);
        expect(bufferSubstract(src, Buffer.from([]))).toMatchObject(src);
        expect(bufferAdd(src, Buffer.from([]))).toMatchObject(src);
    });

    it('should substract and add back without overflow', () => {
        let src = Buffer.from([1, 2, 3]);
        let substracted = bufferSubstract(src, Buffer.from([0, 1, 2]));
        expect(substracted).toMatchObject(Buffer.from([1, 1, 1]));
        expect(bufferAdd(substracted, Buffer.from([0, 1, 2]))).toMatchObject(src);
    });

    it('should multiply buffer', () => {
        let src = Buffer.from([0, 0, 1]);
        expect(bufferMultiply(src, 2)).toMatchObject(Buffer.from([0, 0, 2]));
        expect(bufferMultiply(src, 256)).toMatchObject(Buffer.from([0, 1, 0]));
        expect(bufferMultiply(src, 256 + 128)).toMatchObject(Buffer.from([0, 1, 128]));
    });

    it('should substract with overflow', () => {
        let src = Buffer.from([1, 2, 3]);
        let substracted = bufferSubstract(src, Buffer.from([0, 3, 2]));
        expect(substracted).toMatchObject(Buffer.from([0, 255, 1]));
        expect(bufferAdd(substracted, Buffer.from([0, 3, 2]))).toMatchObject(src);
    });

    it('should subsctract versionstamp', () => {
        let src = Buffer.from('000040c1b4c636cd00000000', 'hex');
        let dlt = Buffer.from('000000000001000000000000', 'hex');
        let dst = Buffer.from('000040c1b4c536cd00000000', 'hex');
        expect(bufferSubstract(src, dlt)).toMatchObject(dst);
        expect(bufferAdd(bufferSubstract(src, dlt), dlt)).toMatchObject(src);
    });

    it('should create correct int32 buffer', () => {
        expect(int32ToBufferBE(0)).toMatchObject(Buffer.from([0, 0, 0, 0]));
        expect(int32ToBufferBE(1)).toMatchObject(Buffer.from([0, 0, 0, 1]));
        expect(int32ToBufferBE(256)).toMatchObject(Buffer.from([0, 0, 1, 0]));
        expect(int32ToBufferBE(257)).toMatchObject(Buffer.from([0, 0, 1, 1]));
    });

    it('should shift right buffers', () => {
        let src = Buffer.from('0102', 'hex');
        expect(bufferShiftRight(src, 8).toString('hex')).toBe('01');
        expect(bufferShiftRight(src, 4).toString('hex')).toBe('0010');
        expect(bufferShiftRight(src, 3).toString('hex')).toBe('0020');
        expect(bufferShiftRight(src, 1).toString('hex')).toBe('0081');

        expect(bufferShiftLeft(bufferShiftRight(src, 8), 8).toString('hex')).toBe('0100');
        expect(bufferShiftLeft(bufferShiftRight(src, 4), 4).toString('hex')).toBe('0100');
        expect(bufferShiftLeft(bufferShiftRight(src, 3), 3).toString('hex')).toBe('0100');
        expect(bufferShiftLeft(bufferShiftRight(src, 1), 1).toString('hex')).toBe('0102');
    });
});