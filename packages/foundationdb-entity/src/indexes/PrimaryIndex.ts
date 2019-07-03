import { TupleItem } from '@openland/foundationdb-tuple';
import { Context } from '@openland/context';
import { Subspace, encoders } from '@openland/foundationdb';
import { IndexMaintainer } from './IndexMaintainer';

export class PrimaryIndex implements IndexMaintainer {

    static lockKey(id: TupleItem[]) {
        return 'primary-' + encoders.tuple.pack(id).toString('hex');
    }

    private readonly subspace: Subspace<TupleItem[], any>;
    constructor(subspace: Subspace<TupleItem[], any>) {
        this.subspace = subspace;
    }

    //
    // Same mutex key
    //

    onCreateLockKey(id: TupleItem[]) {
        return PrimaryIndex.lockKey(id);
    }
    onUpdateLockKey(id: TupleItem[]) {
        return PrimaryIndex.lockKey(id);
    }
    onDeleteLockKey(id: TupleItem[]) {
        return PrimaryIndex.lockKey(id);
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