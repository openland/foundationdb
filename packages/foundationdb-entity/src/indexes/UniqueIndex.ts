import * as Tuple from '@openland/foundationdb-tuple';
import { IndexField } from './../EntityDescriptor';
import { Context } from '@openland/context';
import { SecondaryIndexDescriptor } from '../EntityDescriptor';
import { IndexMaintainer } from './IndexMaintainer';

export class UniqueIndex implements IndexMaintainer {
    readonly descriptor: SecondaryIndexDescriptor;
    readonly fields: IndexField[] = [];

    constructor(descriptor: SecondaryIndexDescriptor) {
        this.descriptor = descriptor;
        if (descriptor.type.type !== 'unique') {
            throw Error();
        }
        this.fields = descriptor.type.fields;
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

    onDestroy(ctx: Context, id: Tuple.TupleItem[], value: any) {
        // Not Supported yet
    }

    private _resolveIndexKey(value: any) {
        let res: Tuple.TupleItem[] = [];
        for (let i = 0; i < this.fields.length; i++) {
            let key = this.fields[i];
            let v = value[key.name];
            if (key.type === 'boolean') {
                if (typeof v !== 'boolean') {
                    throw Error('Unexpected key');
                }
                res.push(v);
            } else if (key.type === 'integer') {
                if (typeof v !== 'number') {
                    throw Error('Unexpected key');
                }
                res.push(v);
            } else if (key.type === 'float') {
                if (typeof v !== 'number') {
                    throw Error('Unexpected key');
                }
                res.push(new Tuple.Float(value as number));
            } else if (key.type === 'string') {
                if (typeof v !== 'string') {
                    throw Error('Unexpected key');
                }
                res.push(v);
            } else {
                throw Error('Unknown index key');
            }
        }
        return res;
    }
}