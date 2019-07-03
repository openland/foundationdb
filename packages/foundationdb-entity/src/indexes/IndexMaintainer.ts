import { TupleItem } from '@openland/foundationdb';
import { Context } from '@openland/context';

export interface IndexMaintainer {
    onCreateLockKeys?(id: TupleItem[], values: any): string[];
    beforeCreate?(ctx: Context, id: TupleItem[], values: any): void | Promise<void>;
    onCreate(ctx: Context, id: TupleItem[], value: any): void | Promise<void>;
    afterCreate?(ctx: Context, id: TupleItem[], values: any): void | Promise<void>;

    onUpdateLockKeys?(id: TupleItem[], oldValue: any, newValue: any): string[];
    beforeUpdate?(ctx: Context, id: TupleItem[], oldValue: any, newValue: any): void | Promise<void>;
    onUpdate(ctx: Context, id: TupleItem[], oldValue: any, newValue: any): void | Promise<void>;
    afterUpdate?(ctx: Context, id: TupleItem[], oldValue: any, newValue: any): void | Promise<void>;

    onDestroyLockKeys?(id: TupleItem[], values: any): string[];
    beforeDestory?(ctx: Context, id: TupleItem[], values: any): void | Promise<void>;
    onDestroy(ctx: Context, id: TupleItem[], value: any): void | Promise<void>;
    afterDestroy?(ctx: Context, id: TupleItem[], values: any): void | Promise<void>;
}