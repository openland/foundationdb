/**
 * Wrapper object for float values
 */
export class Float {
    /**
     * Actual value of a float tuple
     */
    readonly value: number;

    constructor(value: number) {
        this.value = value;
        Object.freeze(this);
    }
}