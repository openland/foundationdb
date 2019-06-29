import { normalizeInteger } from './normalizeInteger';

function validCase(name: string, src: number) {
    it('should accept ' + name, () => {
        expect(normalizeInteger(src) === src).toBe(true);
    });
}

function invalidCase(name: string, src: number) {
    it('should not accept ' + name, () => {
        expect(() => normalizeInteger(src)).toThrowError();
    });
}

describe('normalizeInteger', () => {
    validCase('zero', 0);
    validCase('-zero', -0);
    validCase('1', 1);
    validCase('2', 2);
    validCase('2^53-1', Math.pow(2, 53) - 1);
    validCase('2^50', Math.pow(2, 50));
    invalidCase('2^53', Math.pow(2, 53));
    invalidCase('-2^53', -Math.pow(2, 53));
    invalidCase('inf', Infinity);
    invalidCase('-inf', -Infinity);
    invalidCase('NaN', NaN);
});