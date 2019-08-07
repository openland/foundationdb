import { EntityStorage } from './EntityStorage';
import { EventFactory } from './EventFactory';
import { Subspace } from '@openland/foundationdb';

export interface EventStoreDescriptor {

    /**
     * Name of event store
     */
    name: string;

    /**
     * Storage Key under that events are stored
     */
    storageKey: string;

    /**
     * Subspace of entity values
     */
    subspace: Subspace<Buffer, any>;

    /**
     * Reference to event factory
     */
    factory: EventFactory;

    /**
     * Reference to the underlying storage
     */
    storage: EntityStorage;
}