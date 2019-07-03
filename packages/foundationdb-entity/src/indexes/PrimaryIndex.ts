import { TupleItem } from '@openland/foundationdb-tuple';
import { Context } from '@openland/context';
import { Subspace } from '@openland/foundationdb';
import { IndexMaintainer } from './IndexMaintainer';
import { tupleKey } from './utils';

export class PrimaryIndex implements IndexMaintainer {

    static lockKey(id: TupleItem[]) {
        return 'primary-' + tupleKey(id);
    }

    private readonly subspace: Subspace<TupleItem[], any>;
    constructor(subspace: Subspace<TupleItem[], any>) {
        this.subspace = subspace;
    }

    //
    // Same mutex key
    //

    onCreateLockKeys(id: TupleItem[]) {
        return [PrimaryIndex.lockKey(id)];
    }
    onUpdateLockKeys(id: TupleItem[]) {
        return [PrimaryIndex.lockKey(id)];
    }
    onDeleteLockKeys(id: TupleItem[]) {
        return [PrimaryIndex.lockKey(id)];
    }

    async beforeCreate(ctx: Context, id: TupleItem[], value: any) {
        let ex = await this.subspace.get(ctx, id);
        if (ex) {
            throw Error('Entity already exists');
        }
    }

    onCreate(ctx: Context, id: TupleItem[], value: any) {
        this.subspace.set(ctx, id, value);
    }

    onUpdate(ctx: Context, id: TupleItem[], oldValue: any, newValue: any) {
        this.subspace.set(ctx, id, newValue);
    }

    onDestroy(ctx: Context, id: TupleItem[], value: any) {
        this.subspace.clear(ctx, id);
    }
}