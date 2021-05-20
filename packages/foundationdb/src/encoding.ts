import * as Tuple from '@openland/foundationdb-tuple';

/**
 * Transformer of values
 */
export interface Transformer<T1, T2> {
    unpack(src: T1): T2;
    pack(src: T2): T1;
}

const zero = Buffer.of();
const one = Buffer.from('ff', 'hex');

const jsonTransformer: Transformer<Buffer, any> = {
    unpack(src: Buffer) {
        return JSON.parse(src.toString('utf-8'));
    },
    pack(src: any) {
        return Buffer.from(JSON.stringify(src), 'utf-8');
    }
};
const tupleTransformer: Transformer<Buffer, Tuple.TupleItem[]> = {
    unpack(src: Buffer) {
        return Tuple.unpack(src);
    },
    pack(src: Tuple.TupleItem[]) {
        return Tuple.pack(src);
    }
};

const int32LETransfromer: Transformer<Buffer, number> = {
    pack(src: number) {
        const b = Buffer.alloc(4);
        b.writeInt32LE(src, 0);
        return b;
    },
    unpack(buffer: Buffer) {
        return buffer.readInt32LE(0);
    }
};

const int16LETransfromer: Transformer<Buffer, number> = {
    pack(src: number) {
        const b = Buffer.alloc(2);
        b.writeInt16LE(src, 0);
        return b;
    },
    unpack(buffer: Buffer) {
        return buffer.readInt16LE(0);
    }
};

const int32BETransfromer: Transformer<Buffer, number> = {
    pack(src: number) {
        const b = Buffer.alloc(4);
        b.writeInt32BE(src, 0);
        return b;
    },
    unpack(buffer: Buffer) {
        return buffer.readInt32BE(0);
    }
};

const int16BETransfromer: Transformer<Buffer, number> = {
    pack(src: number) {
        const b = Buffer.alloc(2);
        b.writeUInt16BE(src, 0);
        return b;
    },
    unpack(buffer: Buffer) {
        return buffer.readInt16BE(0);
    }
};

const booleanTransformer: Transformer<Buffer, boolean> = {
    unpack(src: Buffer) {
        return src.length > 0;
    },
    pack(src: boolean) {
        if (src) {
            return one;
        } else {
            return zero;
        }
    }
};

const stringTransformer: Transformer<Buffer, string> = {
    unpack(src: Buffer) {
        return src.toString('utf-8');
    },
    pack(src: string) {
        return Buffer.from(src, 'utf-8');
    }
};

/**
 * Built-in encoders.
 */
export const encoders = {

    /**
     * JSON encoder
     */
    json: jsonTransformer,

    /**
     * Tuple encoder
     */
    tuple: tupleTransformer,

    /**
     * Boolean encoder. `false === (key.length === 0)`.
     */
    boolean: booleanTransformer,

    /**
     * Int32 Little-Endian encoding. Useful for atomic counters.
     */
    int32LE: int32LETransfromer,
    /**
     * Int16 Little-Endian encoding. Useful for atomic counters.
     */
    int16LE: int16LETransfromer,
    /**
     * Int32 Big-Endian encoding. Useful for sorting.
     */
    int32BE: int32BETransfromer,
    /**
     * Int16 Big-Endian encoding. Useful for sorting
     */
    int16BE: int16BETransfromer,

    /**
     * Identity transformer
     */
    id: <T>(): Transformer<T, T> => {
        return {
            pack: (src: T) => src,
            unpack: (src: T) => src
        };
    },

    /**
     * UTF-8 string encoder
     */
    string: stringTransformer,
};