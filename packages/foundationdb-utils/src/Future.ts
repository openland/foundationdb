export class Future<T = void> {

    private _promise!: Promise<T>;
    private _promiseResolve!: (src: T) => void;
    private _promiseReject!: (reason?: any) => void;

    constructor() {
        this._promise = new Promise((resolve, reject) => {
            this._promiseResolve = resolve;
            this._promiseReject = reject;
        });
    }

    get promise() {
        return this._promise;
    }

    resolve = (src: T) => {
        this._promiseResolve(src);
    }

    reject = (src?: any) => {
        this._promiseReject(src);
    }
}