import { declareSchema, atomicBool } from '../../../foundationdb-compiler/src';
import { primaryKey, atomicInt } from '../../../foundationdb-compiler/src';

export default declareSchema(() => {
    atomicBool('SimpleAtomicBoolean', () => {
        primaryKey('key', 'string');
    });
    atomicInt('SimpleAtomicInteger', () => {
        primaryKey('key', 'string');
    });
});