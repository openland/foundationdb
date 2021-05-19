export function bufferSubstract(src: Buffer, sub: Buffer): Buffer {
    if (src.length !== sub.length) {
        throw Error('Buffers have different sizes: ' + src.length + ' and ' + sub.length);
    }

    // Ignore for empty
    if (src.length === 0) {
        return src;
    }

    let overflow = 0;
    let res: number[] = [];
    for (let i = src.length - 1; i >= 0; i--) {
        let a = src.readUInt8(i);
        let b = sub.readUInt8(i);
        let r = a - b - overflow;
        let ow = 0;
        if (r < 0) {
            ow++;
            r = (256 + r) & 0xff;
        }
        overflow = ow;
        res.unshift(r);
    }

    return Buffer.from(res);
}

export function bufferAdd(src: Buffer, add: Buffer): Buffer {
    if (src.length !== add.length) {
        throw Error('Buffers have different sizes: ' + src.length + ' and ' + add.length);
    }

    let overflow = 0;
    let res: number[] = [];
    for (let i = src.length - 1; i >= 0; i--) {
        let a = src.readUInt8(i);
        let b = add.readUInt8(i);
        let sum = a + b + overflow;
        overflow = sum >> 8;
        res.unshift(sum & 0xff);
    }

    return Buffer.from(res);
}

export function bufferMultiply(src: Buffer, mult: number): Buffer {
    if (!Number.isSafeInteger(mult)) {
        throw Error('Number is not positive int32');
    }
    if (mult > 2_147_483_647) {
        throw Error('Number is not positive int32');
    }
    if (mult < 0) {
        throw Error('Number is not positive int32');
    }

    let overflow = 0;
    let res: number[] = [];
    for (let i = src.length - 1; i >= 0; i--) {
        let a = src.readUInt8(i);
        let sum = a * mult + overflow;
        overflow = sum >> 8;
        res.unshift(sum & 0xff);
    }
    return Buffer.from(res);
}

export function int32ToBufferBE(src: number): Buffer {
    if (!Number.isSafeInteger(src)) {
        throw Error('Number is not positive int32');
    }
    if (src > 2_147_483_647) {
        throw Error('Number is not positive int32');
    }
    if (src < 0) {
        throw Error('Number is not positive int32');
    }

    let res = Buffer.alloc(4);
    res.writeInt32BE(src, 0);
    return res;
}

export function bufferShiftRight(src: Buffer, shift: number): Buffer {
    if (!Number.isSafeInteger(shift)) {
        throw Error('Number is not positive int32');
    }
    if (shift > 2_147_483_647) {
        throw Error('Number is not positive int32');
    }
    if (shift < 0) {
        throw Error('Number is not positive int32');
    }
    if (shift === 0) {
        return src;
    }
    if (src.length === 0) {
        return src;
    }
    let data = Array.from(src);

    // Pop full bytes
    while (shift >= 8 && data.length > 0) {
        data.pop();
        shift -= 8;
    }
    if (shift === 0 || shift === 0) {
        return Buffer.from(data);
    }

    // Shift bits
    for (let i = data.length - 1; i >= 0; i--) {
        let prev = 0;
        if (i > 0) {
            prev = data[i - 1];
        }
        data[i] = ((data[i] + (prev << 8)) >> shift) & 0xff;
    }
    return Buffer.from(data);
}

export function bufferShiftLeft(src: Buffer, shift: number): Buffer {
    if (!Number.isSafeInteger(shift)) {
        throw Error('Number is not positive int32');
    }
    if (shift > 2_147_483_647) {
        throw Error('Number is not positive int32');
    }
    if (shift < 0) {
        throw Error('Number is not positive int32');
    }
    if (shift === 0) {
        return src;
    }
    if (src.length === 0) {
        return src;
    }
    let data = Array.from(src);

    // Pop full bytes
    while (shift >= 8) {
        data.push(0);
        shift -= 8;
    }
    if (shift === 0) {
        return Buffer.from(data);
    }

    // Shift bits
    for (let i = 0; i < data.length; i++) {
        let prev = 0;
        if (i < data.length - 1) {
            prev = data[i + 1];
        }
        data[i] = ((((data[i] << 8) + prev) << shift) >> 8) & 0xff;
    }
    return Buffer.from(data);
}

// From JAVA bindings
// https://github.com/apple/foundationdb/blob/6571e9e78cd0f22af5e283f0d5b7c3dde661afc4/bindings/java/src/main/com/apple/foundationdb/tuple/ByteArrayUtil.java#L435
export function formatBuffer(src: Buffer) {
    let res = '';
    for (let i = 0; i < src.length; i++) {
        let code = src.readUInt8(i);
        if (
            code >= 32 && code < 127 && code !== 92 /* \ */
        ) {
            res += String.fromCharCode(code);
        } else {
            let c = code.toString(16);
            if (c.length < 2) {
                c = '0' + c;
            }
            res += '\\x' + c;
        }
    }
    return res;
}