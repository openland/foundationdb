import { Context } from '@openland/context';
import { TupleItem } from '@openland/foundationdb-tuple';
import { IndexMaintainer } from './IndexMaintainer';

export class ConditionalMaintainer implements IndexMaintainer {
    readonly condition: (src: any) => boolean;
    readonly inner: IndexMaintainer;

    constructor(condition: (src: any) => boolean, inner: IndexMaintainer) {
        this.condition = condition;
        this.inner = inner;
    }

    //
    // Create
    //

    onCreateLockKeys(id: TupleItem[], values: any): string[] {
        if (this.condition(values)) {
            return this.inner.onCreateLockKeys(id, values);
        } else {
            return [];
        }
    }
    beforeCreate(ctx: Context, id: TupleItem[], values: any): void | Promise<void> {
        if (this.condition(values)) {
            if (this.inner.beforeCreate) {
                return this.inner.beforeCreate(ctx, id, values);
            }
        }
    }
    onCreate(ctx: Context, id: TupleItem[], value: any): void | Promise<void> {
        if (this.condition(value)) {
            return this.inner.onCreate(ctx, id, value);
        }
    }
    afterCreate(ctx: Context, id: TupleItem[], values: any): void | Promise<void> {
        if (this.condition(values)) {
            if (this.inner.afterCreate) {
                return this.inner.afterCreate(ctx, id, values);
            }
        }
    }

    //
    // Update
    //

    onUpdateLockKeys(id: TupleItem[], oldValue: any, newValue: any): string[] {
        let oldCond = this.condition(oldValue);
        let newCond = this.condition(newValue);

        // Simple update
        if (oldCond && newCond) {
            return this.inner.onUpdateLockKeys(id, oldValue, newValue);
        }

        // Removed from index
        if (oldCond && !newCond) {
            return this.inner.onDestroyLockKeys(id, oldValue);
        }

        // Added to index
        if (!oldCond && newCond) {
            return this.inner.onCreateLockKeys(id, newValue);
        }

        return [];
    }
    beforeUpdate(ctx: Context, id: TupleItem[], oldValue: any, newValue: any): void | Promise<void> {
        let oldCond = this.condition(oldValue);
        let newCond = this.condition(newValue);

        // Simple update
        if (oldCond && newCond) {
            if (this.inner.beforeUpdate) {
                return this.inner.beforeUpdate(ctx, id, oldValue, newValue);
            }
        }

        // Removed from index
        if (oldCond && !newCond) {
            if (this.inner.beforeDestory) {
                return this.inner.beforeDestory(ctx, id, oldValue);
            }
        }

        // Added to index
        if (!oldCond && newCond) {
            if (this.inner.beforeCreate) {
                return this.inner.beforeCreate(ctx, id, newValue);
            }
        }
    }
    onUpdate(ctx: Context, id: TupleItem[], oldValue: any, newValue: any): void | Promise<void> {
        let oldCond = this.condition(oldValue);
        let newCond = this.condition(newValue);

        // Simple update
        if (oldCond && newCond) {
            return this.inner.onUpdate(ctx, id, oldValue, newValue);
        }

        // Removed from index
        if (oldCond && !newCond) {
            return this.inner.onDestroy(ctx, id, oldValue);
        }

        // Added to index
        if (!oldCond && newCond) {
            return this.inner.onCreate(ctx, id, newValue);
        }
    }
    afterUpdate(ctx: Context, id: TupleItem[], oldValue: any, newValue: any): void | Promise<void> {
        let oldCond = this.condition(oldValue);
        let newCond = this.condition(newValue);

        // Simple update
        if (oldCond && newCond) {
            if (this.inner.afterUpdate) {
                return this.inner.afterUpdate(ctx, id, oldValue, newValue);
            }
        }

        // Removed from index
        if (oldCond && !newCond) {
            if (this.inner.afterDestroy) {
                return this.inner.afterDestroy(ctx, id, oldValue);
            }
        }

        // Added to index
        if (!oldCond && newCond) {
            if (this.inner.afterCreate) {
                return this.inner.afterCreate(ctx, id, newValue);
            }
        }
    }

    onDestroyLockKeys(id: TupleItem[], values: any): string[] {
        return [];
    }
    beforeDestory(ctx: Context, id: TupleItem[], values: any): void | Promise<void> {
        //
    }
    onDestroy(ctx: Context, id: TupleItem[], value: any): void | Promise<void> {
        //
    }
    afterDestroy(ctx: Context, id: TupleItem[], values: any): void | Promise<void> {
        //
    }
}