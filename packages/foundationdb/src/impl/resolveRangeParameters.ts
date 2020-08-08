import { keyIncrement } from '../utils';

export function resolveRangeParameters(args: { after?: Buffer, before?: Buffer, reverse?: boolean, prefix: Buffer, key: Buffer }) {
    let start: Buffer;
    let end: Buffer;

    if (args.key.length > 0) {
        start = Buffer.concat([args.prefix, args.key]);
        end = keyIncrement(start);

        if (args.after) {
            if (args.after.length < args.key.length) {
                throw Error('value of the after must be prefixed with key');
            }
            if (Buffer.compare(args.after.slice(0, args.key.length), args.key) !== 0) {
                throw Error('value of the after must be prefixed with key');
            }
        }

        if (args.before) {
            if (args.before.length < args.key.length) {
                throw Error('value of the before must be prefixed with key');
            }
            if (Buffer.compare(args.before.slice(0, args.key.length), args.key) !== 0) {
                throw Error('value of the before must be prefixed with key');
            }
        }
    } else {
        start = args.prefix;
        end = keyIncrement(start);
    }

    if (args.reverse) {
        if (args.after) {
            end = Buffer.concat([args.prefix, args.after]);
        }
        if (args.before) {
            start = keyIncrement(Buffer.concat([args.prefix, args.before]));
        }
    } else {
        if (args.after) {
            start = keyIncrement(Buffer.concat([args.prefix, args.after]));
        }
        if (args.before) {
            end = Buffer.concat([args.prefix, args.before]);
        }
    }

    return { start, end };
}