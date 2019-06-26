export interface Codec<T> {
    readonly _T: T;
    decode(src: any): T;
    encode(src: T): any;
}

class StructCodec<T> implements Codec<T> {
    readonly _T!: T;

    private readonly fields: { [K in keyof T]: Codec<any> };

    constructor(fields: { [K in keyof T]: Codec<any> }) {
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

class StringCodec implements Codec<string> {
    readonly _T!: string;

    decode(src: any) {
        if (typeof src === 'string') {
            return src;
        } else {
            throw Error('Input type is not string');
        }
    }
    encode(src: string) {
        if (typeof src === 'string') {
            return src;
        } else {
            throw Error('Input type is not string');
        }
    }
}

class BooleanCodec implements Codec<boolean> {
    readonly _T!: boolean;

    decode(src: any) {
        if (typeof src === 'boolean') {
            return src;
        } else {
            throw Error('Input type is not boolean');
        }
    }
    encode(src: boolean) {
        if (typeof src === 'boolean') {
            return src;
        } else {
            throw Error('Input type is not boolean');
        }
    }
}

class NumberCodec implements Codec<number> {
    readonly _T!: number;

    decode(src: any) {
        if (typeof src === 'number') {
            return src;
        } else {
            throw Error('Input type is not number');
        }
    }
    encode(src: number) {
        if (typeof src === 'number') {
            return src;
        } else {
            throw Error('Input type is not number');
        }
    }
}

class OptionalCodec<T> implements Codec<T | null> {
    readonly _T!: T | null;
    readonly parent: Codec<T>;
    constructor(parent: Codec<T>) {
        this.parent = parent;
    }

    decode(src2: any) {
        if (src2 !== undefined && src2 !== null) {
            return this.parent.decode(src2);
        }
        return null;
    }
    encode(src2: T | null) {
        if (src2 !== undefined && src2 !== null) {
            return this.parent.encode(src2);
        } else {
            return null;
        }
    }
}

export const codecs = {
    string: new StringCodec(),
    boolean: new BooleanCodec(),
    number: new NumberCodec(),
    optional: <T>(src: Codec<T>) => {
        return new OptionalCodec(src);
    },
    struct: <T extends { [key: string]: Codec<any> }>(src: T) => {
        return new StructCodec<{ [K in keyof T]: T[K]['_T'] }>(src);
    }
};