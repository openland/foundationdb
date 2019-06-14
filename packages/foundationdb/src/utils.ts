const byteZero = Buffer.alloc(1)
byteZero.writeUInt8(0, 0)

/**
 * Getting an "increment" of a key. 
 * 
 * Increment of a key is a key that is ordered after all keys that is prefixed by a first one.
 * For example, keyIncrement(ABCD) -> ABCE.
 * 
 * @param buf source key
 */
export function keyIncrement(buf: Buffer): Buffer {
    let lastNonFFByte
    for (lastNonFFByte = buf.length - 1; lastNonFFByte >= 0; --lastNonFFByte) {
        if (buf[lastNonFFByte] !== 0xFF) {
            break;
        }
    }

    if (lastNonFFByte < 0) {
        throw new Error(`invalid argument '${buf}': prefix must have at least one byte not equal to 0xFF`)
    }

    const result = Buffer.alloc(lastNonFFByte + 1)
    buf.copy(result, 0, 0, result.length)
    ++result[lastNonFFByte]

    return result;
}

/**
 * Calculating next key. Next key is a first key that right after provided one. It is always `key + 0x00`.
 * @param buf source key
 */
export function keyNext(buf: Buffer): Buffer {
    // Buffer.from does support taking a string but @types/node has overly
    // strict type definitions for the function.
    return Buffer.concat([buf, byteZero], buf.length + 1)
}