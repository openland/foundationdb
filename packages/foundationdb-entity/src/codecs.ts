export interface Codec<T> {
    decode(src: any): T;
    encode(src: T): any;
}

class StructCodec<T> implements Codec<T> {
    private readonly fields: { [index: string]: Codec<any> };

    constructor(fields: { [index: string]: Codec<any> }) {
        this.fields = fields;
    }

    decode(src: any): T {
        let res: any = {};
        for (let key in this.fields) {
            res[key] = this.fields[key].decode(src[key]);
        }
        return res;
    }
    encode(src: T) {
        let res: any = {};
        for (let key in this.fields) {
            res[key] = this.fields[key].encode(src[key]);
        }
        return res;
    }
}

const stringCodec: Codec<string> = {
    decode(src: any) {
        if (typeof src === 'string') {
            return src;
        } else {
            throw Error('Input type is not string');
        }
    },
    encode(src: string) {
        if (typeof src === 'string') {
            return src;
        } else {
            throw Error('Input type is not string');
        }
    }
};

const booleanCodec: Codec<boolean> = {
    decode(src: any) {
        if (typeof src === 'boolean') {
            return src;
        } else {
            throw Error('Input type is not boolean');
        }
    },
    encode(src: boolean) {
        if (typeof src === 'boolean') {
            return src;
        } else {
            throw Error('Input type is not boolean');
        }
    }
};

const numberCodec: Codec<number> = {
    decode(src: any) {
        if (typeof src === 'number') {
            return src;
        } else {
            throw Error('Input type is not number');
        }
    },
    encode(src: number) {
        if (typeof src === 'number') {
            return src;
        } else {
            throw Error('Input type is not number');
        }
    }
};

export const codecs = {
    string: stringCodec,
    boolean: booleanCodec,
    number: numberCodec,
    optional: <T>(src: Codec<T>) => {
        let res: Codec<T | null> = {
            decode(src2: any) {
                if (src2 !== undefined && src2 !== null) {
                    return src.decode(src2);
                }
                return null;
            },
            encode(src2: T | null) {
                if (src2 !== undefined && src2 !== null) {
                    return src.encode(src2);
                } else {
                    return null;
                }
            }
        };
        return res;
    },
    struct: <T>(src: { [index in keyof T]: Codec<any> }) => {
        return new StructCodec<T>(src);
    }
};