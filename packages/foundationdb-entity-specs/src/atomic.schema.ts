import { declareSchema, atomicBool, primaryKey, atomicInt, string } from '@openland/foundationdb-compiler';

export default declareSchema(() => {
    atomicBool('SimpleAtomicBoolean', () => {
        primaryKey('key', string());
    });
    atomicInt('SimpleAtomicInteger', () => {
        primaryKey('key', string());
    });
});