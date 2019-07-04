import { BusProvider } from './BusProvider';
import { BaseLayer } from '@openland/foundationdb';

export class BusLayer extends BaseLayer {
    readonly displayName = 'Bus Layer';
    readonly provider: BusProvider;

    constructor(provider: BusProvider) {
        super();
        this.provider = provider;
    }
}