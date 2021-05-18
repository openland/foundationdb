// VTs generated with 10 sec delay
// <Buffer 00 00 06 75 de 95 ef ae 00 00>
// -
// <Buffer 00 00 06 75 df 2e a5 dc 00 00>
// =
// <Buffer 00 00 00 00 00 97 b5 2e 00 00>
//         00 00 00 00 00 98 96 80 00 00
// NOTE: Add two more bytes for tx id part of versionstamp
//       And add yet another two more for tx-local index of versionstamp
// According to forum: ~1 mil vts are generated

import { bufferAdd, bufferMultiply, bufferSubstract, int32ToBufferBE } from './buffers';

/**
 * Creates delta of versionstamp for timeshifting value
 * @param seconds seconds by how much to shift versionstamp
 * @returns 12-byte buffer with delta
 */
export function createVersionstampDelta(seconds: number) {
    if (!Number.isSafeInteger(seconds)) {
        throw Error('Delta must be safe integer');
    }
    if (seconds < 0) {
        throw Error('Delta must be positive number');
    }

    let offset = int32ToBufferBE(seconds);
    let padded = bufferMultiply(offset, 1_000_000);
    const res = Buffer.alloc(12);
    padded.copy(res, res.length - padded.length - 4);
    return res;
}

/**
 * Calculate shifted versionstamp
 * @param src versionstamp for shifting
 * @param seconds positive or negative integer to shift versionstamp
 * @returns shifted versionstamps
 */
export function getShiftedVersionstamp(src: Buffer, seconds: number) {
    if (src.length !== 12) {
        throw Error('Expected 12-byte versionstamp');
    }
    if (!Number.isSafeInteger(seconds)) {
        throw Error('Delta must be safe integer');
    }
    if (seconds === 0) {
        return src;
    }
    if (seconds > 0) {
        let delta = createVersionstampDelta(seconds);
        return bufferAdd(src, delta);
    } else {
        let delta = createVersionstampDelta(-seconds);
        return bufferSubstract(src, delta);
    }
}