import { Context } from '@openland/context';
import * as Tuple from '@openland/foundationdb-tuple';
import { IndexMaintainer } from './IndexMaintainer';
import { SecondaryIndexDescriptor } from '../EntityDescriptor';
import { resolveIndexKey } from './utils';
export class RangeIndex implements IndexMaintainer {

    readonly descriptor: SecondaryIndexDescriptor;
    constructor(descriptor: SecondaryIndexDescriptor) {
        this.descriptor = descriptor;
        if (descriptor.type.type !== 'range') {
            throw Error();
        }
    }

    onCreate(ctx: Context, _id: Tuple.TupleItem[], value: any) {
        let id = this._resolveIndexKey(value);
        this.descriptor.subspace.set(ctx, [...id, ..._id], value);
    }

    onUpdate(ctx: Context, _id: Tuple.TupleItem[], oldValue: any, newValue: any) {
        let oldId = this._resolveIndexKey(oldValue);
        let newId = this._resolveIndexKey(newValue);
        if (!Tuple.equals(oldId, newId)) {
            this.descriptor.subspace.clear(ctx, [...oldId, ..._id]);
        }
        this.descriptor.subspace.set(ctx, [...newId, ..._id], newValue);
    }

    onDestroy(ctx: Context, id: Tuple.TupleItem[], value: any) {
        // Not Supported yet
    }

    private _resolveIndexKey(value: any) {
        let res: any[] = [];
        for (let i = 0; i < this.descriptor.type.fields.length; i++) {
            let key = this.descriptor.type.fields[i];
            let v = value[key.name];
            res.push(v);
        }
        return resolveIndexKey(res, this.descriptor.type.fields);
    }
}