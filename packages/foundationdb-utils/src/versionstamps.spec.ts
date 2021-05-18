import { createVersionstampDelta } from './verstionstamps';

describe('versionstamps', () => {
    it('should generate valid versionstamps', () => {
        const vt = createVersionstampDelta(10);
        expect(vt).toMatchObject(Buffer.from('000000000098968000000000', 'hex'));
    });
});