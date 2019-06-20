export default class FDBError extends Error {
  
  readonly code: number;

  constructor(description: string, code: number) {
    super(description);

    Object.setPrototypeOf(this, FDBError.prototype);
    // Error.captureStackTrace(this, this.constructor);

    this.code = code;
  }
}