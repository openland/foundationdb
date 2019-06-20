const byteZero = Buffer.alloc(1);
byteZero.writeUInt8(0, 0);

/**
 * Getting an "increment" of a key. 
 * 
 * Increment of a key is a key that is ordered after all keys that is prefixed by a first one.
 * For example, keyIncrement(ABCD) -> ABCE.
 * 
 * Special case for empty key: [] -> [0xFF]
 * 
 * @param buf source key
 */
export function keyIncrement(buf: Buffer): Buffer {
    if (buf.length === 0) {
        let b = Buffer.alloc(1);
        b.writeUInt8(0xff, 0);
        return b;
    }
    let lastNonFFByte;
    for (lastNonFFByte = buf.length - 1; lastNonFFByte >= 0; --lastNonFFByte) {
        if (buf[lastNonFFByte] !== 0xFF) {
            break;
        }
    }

    if (lastNonFFByte < 0) {
        throw new Error(`invalid argument '${buf}': prefix must have at least one byte not equal to 0xFF`);
    }

    const result = Buffer.alloc(lastNonFFByte + 1);
    buf.copy(result, 0, 0, result.length);
    ++result[lastNonFFByte];

    return result;
}

/**
 * Calculating next key. Next key is a first key that right after provided one. It is always `key + 0x00`.
 * @param buf source key
 */
export function keyNext(buf: Buffer): Buffer {
    // Buffer.from does support taking a string but @types/node has overly
    // strict type definitions for the function.
    return Buffer.concat([buf, byteZero], buf.length + 1);
}

export function randomNumbersString(len: number) {
    let length = len;
    let alphabet = '0123456789';
    let key = '';

    for (let i = 0; i < length; i++) {
        key += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }

    return key;
}

/**
 * Promise that resolves after `ms` milliseconds
 * @param ms delay in milliseconds
 */
export async function delay(ms: number) {
    return new Promise(resolve => { setTimeout(resolve, ms); });
}