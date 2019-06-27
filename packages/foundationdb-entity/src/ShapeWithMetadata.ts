import { EntityMetadata } from './EntityMetadata';
export type ShapeWithMetadata<T> = T & { _metadata: EntityMetadata };