import { EntityDescriptor } from './EntityDescriptor';
import { PrimaryKeyType } from './PrimaryKeyType';

export abstract class Entity<T> {
    readonly descriptor: EntityDescriptor<T>;
    protected readonly _rawId: PrimaryKeyType[];
    protected readonly _rawValue: T;

    constructor(id: PrimaryKeyType[], rawValue: T, descriptor: EntityDescriptor<T>) {
        this._rawId = id;
        this._rawValue = rawValue;
        this.descriptor = descriptor;
    }
}