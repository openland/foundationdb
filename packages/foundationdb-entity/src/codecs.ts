export const typeSymbol: unique symbol = Symbol('type');

/**
 * Codec performs type-safe serialization to json
 */
export interface Codec<T> {
    readonly [typeSymbol]: T;

    /**
     * Decode from serialized object
     * @param src encoded data
     */
    decode(src: any): T;

    /**
     * Encode for serialization
     * @param src source data
     */
    encode(src: T): any;

    /**
     * Verify and Normalize data
     * @param src source data
     */
    normalize(src: any): T;
}

export class StructCodec<T> implements Codec<T> {
    readonly [typeSymbol]!: T;

    readonly fields: { [K in keyof T]: Codec<any> };

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
            let v = this.fields[key].encode(src[key]);
            if (v !== null) {
                res[key] = v;
            }
        }
        return res;
    }
    normalize(src: any): T {
        if (typeof src !== 'object') {
            throw Error('Input type is not an object');
        }
        let res: any = {};
        for (let key in this.fields) {
            res[key] = this.fields[key].normalize(src[key]);
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
    normalize(src: any) {
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
    normalize(src: any) {
        if (typeof src === 'boolean') {
            return src;
        } else {
            throw Error('Input type is not a string');
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
    normalize(src: any) {
        if (typeof src === 'number') {
            return src;
        } else {
            throw Error('Input type is not a string');
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
    normalize(src: any) {
        if (src !== undefined && src !== null) {
            return this.parent.normalize(src);
        }
        return null;
    }
}

class DefaultCodec<T> implements Codec<T> {
    readonly [typeSymbol]!: T;
    private readonly defaultValue: () => T;
    private readonly parent: Codec<T | null>;

    constructor(defaultValue: () => T, parent: Codec<T | null>) {
        this.defaultValue = defaultValue;
        this.parent = parent;
    }

    decode(src2: any) {
        if (src2 !== undefined && src2 !== null) {
            return this.parent.decode(src2)!;
        }
        return this.defaultValue();
    }
    encode(src2: T | null) {
        if (src2 !== undefined && src2 !== null) {
            return this.parent.encode(src2)!;
        } else {
            return this.defaultValue();
        }
    }
    normalize(src: any) {
        if (src !== undefined && src !== null) {
            return this.parent.normalize(src)!;
        }
        return this.defaultValue();
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
    normalize(src: any) {
        let decoded = this.inner.decode(src);
        if (!this.values.has(decoded)) {
            throw Error('String \'' + decoded + '\' is not matched with known enum values');
        }
        return decoded as any;
    }
}

export const codecs = {
    string: new StringCodec() as Codec<string>,
    boolean: new BooleanCodec() as Codec<boolean>,
    number: new NumberCodec() as Codec<number>,
    enum: <T extends string[]>(...values: T) => {
        return new EnumCodec<T[number]>(values) as Codec<T[number]>;
    },
    optional: <T>(src: Codec<T>) => {
        return new OptionalCodec<T>(src) as Codec<T | null>;
    },
    struct: <T extends { [key: string]: Codec<any> }>(src: T) => {
        return new StructCodec<{ [K in keyof T]: T[K][typeof typeSymbol] }>(src);
    },
    union: <T1, T2>(a: Codec<T1>, b: Codec<T2>) => {
        if (!(a instanceof StructCodec)) {
            throw Error('Union is possible only for struct codecs');
        }
        if (!(b instanceof StructCodec)) {
            throw Error('Union is possible only for struct codecs');
        }
        let fields: { [K in keyof (T1 & T2)]: Codec<any> } = {
            ...a.fields,
            ...b.fields
        } as any;
        return new StructCodec<{ [K in keyof (T1 & T2)]: (T1 & T2)[K] }>(fields) as Codec<{ [K in keyof (T1 & T2)]: (T1 & T2)[K] }>;
    },
    default: <T>(src: Codec<T | null>, value: (() => T) | T) => {
        return new DefaultCodec<T>(() => typeof value === 'function' ? src.normalize((value as any)())! : src.normalize(value)!, src) as Codec<T>;
    },
};