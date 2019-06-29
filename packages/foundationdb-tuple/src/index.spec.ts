import { Float } from './Float';
import { unpack, TupleItem, pack } from './index';

function testConsistency(source: TupleItem[]) {
    let res = pack(source);
    let decoded = unpack(res);
    let encoded = pack(decoded);
    expect(encoded.equals(res)).toBe(true);
}

function testConsistencyBinary(source: Buffer) {
    let decoded = unpack(source);
    let encoded = pack(decoded);
    expect(encoded.equals(source)).toBe(true);
}

function testConsistencyBoth(source: TupleItem[], sourceBin: Buffer) {
    let res = pack(source);
    let decoded = unpack(res);
    let encoded = pack(decoded);
    expect(encoded.equals(res)).toBe(true);
    expect(sourceBin.equals(encoded)).toBe(true);
}

function snapshotTest(name: string, tuple: TupleItem[]) {
    it('should encode ' + name, () => {
        let res = pack(tuple);
        let unpacked = unpack(res);
        expect(unpacked.length).toBe(tuple.length);
        for (let i = 0; i < tuple.length; i++) {
            if (tuple[i] instanceof Float) {
                expect(unpacked[i] instanceof Float).toBe(true);
                expect((unpacked[i] as Float).value).toBe((tuple[i] as Float).value);
            } else if (Buffer.isBuffer(tuple[i])) {
                expect(Buffer.isBuffer(unpacked[i])).toBe(true);
                expect((unpacked[i] as Buffer).equals(tuple[i] as Buffer)).toBe(true);
            } else {
                expect(unpacked[i] === tuple[i]).toBe(true);
            }
        }
        expect(res.toString('hex')).toMatchSnapshot();
    });
}

describe('tuple', () => {
    it('should preserve -0', () => {
        testConsistencyBoth([new Float(-0)], Buffer.from('217fffffffffffffff', 'hex'));
    });
    it('should preserve integers', () => {
        testConsistencyBinary(Buffer.from('218000000000000000', 'hex'));
    });
    it('should preserve PI', () => {
        testConsistency([new Float(Math.PI)]);
    });
    it('should throw error on NaN', () => {
        expect(() => unpack(Buffer.from('21fff8000000000000', 'hex'))).toThrowError();
        expect(() => unpack(Buffer.from('210007ffffffffffff', 'hex'))).toThrowError();
    });
    snapshotTest('mixed data', ['user', 1, 'score', new Float(0.4)]);
    snapshotTest('integers', [0, 1, -1, 2, 10, 10000, Math.pow(2, 50), -0, -10000, -45553]);
    snapshotTest('strings', ['', 'hello!', '🤣', '??', '\x00', '\x00\xff\x00']);
    snapshotTest('floats', [new Float(Math.PI), new Float(1), new Float(-0), new Float(0), new Float(Math.pow(2, 100))]);
});