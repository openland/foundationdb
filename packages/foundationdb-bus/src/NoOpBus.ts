import { BusProvider } from './BusProvider';

export class NoOpBus implements BusProvider {
    publish(topic: string, data: any) {
        // No op
    }
    subscribe(topic: string, receiver: (data: any) => void) {
        return {
            cancel: () => {
                // No op
            }
        };
    }
}