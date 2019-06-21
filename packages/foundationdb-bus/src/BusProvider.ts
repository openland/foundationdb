export type BusSubcription = { cancel(): void };

export interface BusProvider {
    publish(topic: string, data: any): void;
    subscribe(topic: string, receiver: (data: any) => void): BusSubcription;
}