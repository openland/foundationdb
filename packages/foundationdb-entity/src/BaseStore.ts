import { EventFactory } from './EventFactory';
import { EntityStorage } from './EntityStorage';

export interface BaseStore {
    readonly storage: EntityStorage;
    readonly eventFactory: EventFactory;
}