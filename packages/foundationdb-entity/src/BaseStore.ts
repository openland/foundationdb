import { EntityStorage } from './EntityStorage';

export interface BaseStore {
    readonly storage: EntityStorage;
}