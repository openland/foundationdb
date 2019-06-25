import { EntityDescriptor } from './EntityDescriptor';
import { PrimaryKeyType } from './PrimaryKeyType';

export abstract class Entity {
    readonly rawId: PrimaryKeyType[];
    readonly rawValue: any;

    constructor(id: PrimaryKeyType[], rawValue: any) {
        this.rawId = id;
        this.rawValue = rawValue;
    }
}