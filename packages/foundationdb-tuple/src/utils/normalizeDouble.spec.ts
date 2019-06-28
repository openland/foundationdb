import { normalizeDouble } from './normalizeDouble';

describe('normalieDouble', () => {
    it('should throw for NaN', () => {
        expect(() => normalizeDouble(NaN)).toThrowError();
    });
});