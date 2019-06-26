const typeSymbol: unique symbol = Symbol('type');

export interface Codec<T> {
    readonly [typeSymbol]: T;
    decode(src: any): T;
    encode(src: T): any;
}

class StructCodec<T> implements Codec<T> {
    readonly [typeSymbol]!: T;

    private readonly fields: { [K in keyof T]: Codec<any> };

    constructor(fields: { [K in keyof T]: Codec<any> }) {
        this.fields = fields;
    }

    decode(src: any): T {
        if (typeof src !== 'object') {
            throw Error('Input type is not an object');
        }
        let res: any = {};
        for (let key in this.fields) {
            res[key] = this.fields[key].decode(src[key]);
        }
        return res;
    }
    encode(src: T) {
        if (typeof src !== 'object') {
            throw Error('Input type is not an object');
        }
        let res: any = {};
        for (let key in this.fields) {
            res[key] = this.fields[key].encode(src[key]);
        }
        return res;
    }
}

class StringCodec implements Codec<string> {
    readonly [typeSymbol]!: string;

    decode(src: any) {
        if (typeof src === 'string') {
            return src;
        } else {
            throw Error('Input type is not a string');
        }
    }
    encode(src: string) {
        if (typeof src === 'string') {
            return src;
        } else {
            throw Error('Input type is not a string');
        }
    }
}

class BooleanCodec implements Codec<boolean> {
    readonly [typeSymbol]!: boolean;

    decode(src: any) {
        if (typeof src === 'boolean') {
            return src;
        } else {
            throw Error('Input type is not a boolean');
        }
    }
    encode(src: boolean) {
        if (typeof src === 'boolean') {
            return src;
        } else {
            throw Error('Input type is not a boolean');
        }
    }
}

class NumberCodec implements Codec<number> {
    readonly [typeSymbol]!: number;

    decode(src: any) {
        if (typeof src === 'number') {
            return src;
        } else {
            throw Error('Input type is not a number');
        }
    }
    encode(src: number) {
        if (typeof src === 'number') {
            return src;
        } else {
            throw Error('Input type is not a number');
        }
    }
}

class OptionalCodec<T> implements Codec<T | null> {
    readonly [typeSymbol]!: T | null;
    private readonly parent: Codec<T>;
    
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

class EnumCodec<T> implements Codec<T> {
    readonly [typeSymbol]!: T;
    private readonly values: Set<string>;
    private readonly inner = new StringCodec();

    constructor(values: string[]) {
        this.values = new Set(values);
    }

    decode(src: any) {
        let decoded = this.inner.decode(src);
        if (!this.values.has(decoded)) {
            throw Error('String \'' + decoded + '\' is not matched with known enum values');
        }
        return decoded as any;
    }
    encode(src: T) {
        let encoded = this.inner.encode(src as any);
        if (!this.values.has(encoded)) {
            throw Error('String \'' + encoded + '\' is not matched with known enum values');
        }
        return encoded;
    }
}

export const codecs = {
    string: new StringCodec(),
    boolean: new BooleanCodec(),
    number: new NumberCodec(),
    enum: <T extends string[]>(...values: T) => {
        return new EnumCodec<T[number]>(values);
    },
    optional: <T>(src: Codec<T>) => {
        return new OptionalCodec(src);
    },
    struct: <T extends { [key: string]: Codec<any> }>(src: T) => {
        return new StructCodec<{ [K in keyof T]: T[K][typeof typeSymbol] }>(src);
    }
};