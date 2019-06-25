import { Context } from '@openland/context';
import { Tuple } from '@openland/foundationdb';
import { Entity } from './Entity';
import { EntityDescriptor } from './EntityDescriptor';

export abstract class EntityFactory<T extends Entity> {
    readonly descriptor: EntityDescriptor;

    protected constructor(descriptor: EntityDescriptor) {
        this.descriptor = descriptor;
    }

    protected async _findById(ctx: Context, id: Tuple[]): Promise<T | null> {
        let ex = await this.descriptor.subspace.get(ctx, id);
        if (ex) {
            return this._createEntity(ctx, ex);
        } else {
            return null;
        }
    }

    private _createEntity(ctx: Context, value: any) {
        this.descriptor.validator(value);
        return this._createEntityInstance(value);
    }

    protected abstract _createEntityInstance(value: any): T;
}