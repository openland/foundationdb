import * as Tuple from '@openland/foundationdb-tuple';
import { IndexField } from './../EntityDescriptor';
import { Context } from '@openland/context';
import { SecondaryIndexDescriptor } from '../EntityDescriptor';
import { IndexMaintainer } from './IndexMaintainer';
import { resolveIndexKey, tupleKey } from './utils';

export class UniqueIndex implements IndexMaintainer {

    static lockKey(descriptor: SecondaryIndexDescriptor, id: Tuple.TupleItem[]) {
        return 'secondary-' + descriptor.name + '-' + tupleKey(id);
    }

    readonly descriptor: SecondaryIndexDescriptor;
    readonly fields: IndexField[] = [];

    constructor(descriptor: SecondaryIndexDescriptor) {
        this.descriptor = descriptor;
        if (descriptor.type.type !== 'unique') {
            throw Error();
        }
        this.fields = descriptor.type.fields;
    }

    //
    // Create
    //

    onCreateLockKeys(_id: Tuple.TupleItem[], value: any) {
        let id = this._resolveIndexKey(value);
        return [UniqueIndex.lockKey(this.descriptor, id)];
    }
    async beforeCreate(ctx: Context, _id: Tuple.TupleItem[], value: any) {
        let id = this._resolveIndexKey(value);
        let ex = await this.descriptor.subspace.get(ctx, id);
        if (ex) {
            throw Error('Unique index constraint violation');
        }
    }
    onCreate(ctx: Context, _id: Tuple.TupleItem[], value: any) {
        let id = this._resolveIndexKey(value);
        this.descriptor.subspace.set(ctx, id, value);
    }

    //
    // Update
    //

    onUpdateLockKeys(_id: Tuple.TupleItem[], oldValue: any, newValue: any) {
        let oldId = this._resolveIndexKey(oldValue);
        let newId = this._resolveIndexKey(newValue);
        if (!Tuple.equals(oldId, newId)) {
            return [UniqueIndex.lockKey(this.descriptor, oldId), UniqueIndex.lockKey(this.descriptor, newId)];
        } else {
            return [UniqueIndex.lockKey(this.descriptor, newId)];
        }
    }
    async beforeUpdate(ctx: Context, _id: Tuple.TupleItem[], oldValue: any, newValue: any) {
        let oldId = this._resolveIndexKey(oldValue);
        let newId = this._resolveIndexKey(newValue);
        if (!Tuple.equals(oldId, newId)) {
            let ex = await this.descriptor.subspace.get(ctx, newId);
            if (ex) {
                throw Error('Unique index constraint violation');
            }
        }
    }

    onUpdate(ctx: Context, id: Tuple.TupleItem[], oldValue: any, newValue: any) {
        let oldId = this._resolveIndexKey(oldValue);
        let newId = this._resolveIndexKey(newValue);
        if (!Tuple.equals(oldId, newId)) {
            this.descriptor.subspace.clear(ctx, oldId);
        }
        this.descriptor.subspace.set(ctx, newId, newValue);
    }

    //
    // Destroy
    //

    onDestroy(ctx: Context, id: Tuple.TupleItem[], value: any) {
        // Not Supported yet
    }

    private _resolveIndexKey(value: any) {
        let res: any[] = [];
        for (let i = 0; i < this.fields.length; i++) {
            let key = this.fields[i];
            let v = value[key.name];
            res.push(v);
        }
        return resolveIndexKey(res, this.descriptor.type.fields);
    }
}