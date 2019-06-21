import { Context } from '@openland/context';
import { BusProvider, BusSubcription } from './BusProvider';
import { BaseLayer, getTransaction, Database } from '@openland/foundationdb';

export class BusLayer extends BaseLayer {
    readonly displayName = 'Bus Layer';
    readonly provider: BusProvider;

    constructor(provider: BusProvider) {
        super();
        this.provider = provider;
    }
}