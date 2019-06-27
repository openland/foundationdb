import { EntityMetadata } from './EntityMetadata';
import { EntityDescriptor } from './EntityDescriptor';
import { PrimaryKeyType } from './PrimaryKeyType';
import { ShapeWithMetadata } from './ShapeWithMetadata';

export abstract class Entity<T> {
    readonly descriptor: EntityDescriptor<T>;
    protected readonly _rawId: readonly PrimaryKeyType[];
    protected readonly _rawValue: ShapeWithMetadata<T>;

    constructor(id: PrimaryKeyType[], rawValue: ShapeWithMetadata<T>, descriptor: EntityDescriptor<T>) {
        this._rawId = Object.freeze(id);
        this._rawValue = Object.freeze(rawValue);
        this.descriptor = descriptor;
    }

    get metadata(): EntityMetadata {
        return this._rawValue._metadata;
    }
}