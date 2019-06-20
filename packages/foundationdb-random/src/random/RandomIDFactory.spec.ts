import { RandomIDFactory } from './RandomIDFactory';

describe('RandomIDFactory', () => {
    it('should generate values', () => {
        let factory = new RandomIDFactory(1);
        for (let i = 0; i < 1024; i++) {
            let res = factory.next();
            expect(res.length).toBe(16);
        }
    });
});