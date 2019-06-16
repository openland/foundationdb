import { encoders as fencoders } from 'foundationdb';

/**
 * Transformer of values
 */
export interface Transformer<T1, T2> {
    unpack(src: T1): T2;
    pack(src: T2): T1;
}

/**
 * Type represented tuple item that is limited to only integers, strings and booleans.
 */
export type Tuple = (string | number | boolean | Buffer);

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
const tupleTransformer: Transformer<Buffer, Tuple[]> = {
    unpack(src: Buffer) {
        return fencoders.tuple.unpack(src) as Tuple[];
    },
    pack(src: Tuple[]) {
        return fencoders.tuple.pack(src) as Buffer;
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
}
const int32BETransfromer: Transformer<Buffer, number> = {
    pack(src: number) {
        const b = Buffer.alloc(4);
        b.writeInt32BE(src, 0);
        return b;
    },
    unpack(buffer: Buffer) {
        return buffer.readInt32BE(0);
    }
}

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
     * Int32 Big-Endian encoding. Useful for sorting.
     */
    int32BE: int32BETransfromer,

    /**
     * Identity transformer
     */
    id: <T>(): Transformer<T, T> => {
        return {
            pack: (src: T) => src,
            unpack: (src: T) => src
        };
    }
};