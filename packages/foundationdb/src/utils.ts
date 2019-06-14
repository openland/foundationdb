const byteZero = Buffer.alloc(1)
byteZero.writeUInt8(0, 0)

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

export function keyNext(buf: Buffer): Buffer {
    // Buffer.from does support taking a string but @types/node has overly
    // strict type definitions for the function.
    return Buffer.concat([buf, byteZero], buf.length + 1)
}