export class WriteToReadOnlyContextError extends Error {
    constructor(message: string = 'Trying to write to read-only context') {
        super(message);
        Object.setPrototypeOf(this, WriteToReadOnlyContextError.prototype);
    }
}