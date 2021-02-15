import { createNamedContext } from '@openland/context';
import * as Redis from 'handy-redis';
import { BusProvider, BusSubcription } from '@openland/foundationdb-bus';
import { backoff } from '@openland/foundationdb-utils';

const ctx = createNamedContext('redis');

export class RedisBusProvider implements BusProvider {
    private readonly client: Redis.IHandyRedis;
    private readonly subscribeClient: Redis.IHandyRedis;
    private subscribers = new Map<string, Array<{ listener: (data: any) => void }>>();
    private subscribedTopics = new Set<string>();

    constructor(port: number = 6379, host?: string,) {
        this.client = Redis.createHandyClient(port, host);
        this.subscribeClient = Redis.createHandyClient(port, host);

        // Subscribe for events
        this.subscribeClient.redis.on('message', (topic: string, message) => {

            // Check topic
            if (!this.subscribedTopics.has(topic)) {
                return;
            }

            // Parsing data
            let parsed: any;
            try {
                parsed = JSON.parse(message);
            } catch (e) {
                return;
            }

            // Delivering notifications
            for (let r of this.subscribers.get(topic)!!) {
                r.listener(parsed);
            }
        });
    }

    publish(topic: string, data: any) {
        // tslint:disable-next-line:no-floating-promises
        backoff(ctx, async () => await this.client!.publish(topic, JSON.stringify(data)));
    }

    subscribe(topic: string, receiver: (data: any) => void): BusSubcription {
        if (!this.subscribedTopics.has(topic)) {
            this.subscribedTopics.add(topic);
            // tslint:disable-next-line:no-floating-promises
            backoff(ctx, async () => await this.subscribeClient.subscribe([topic]));
        }
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, []);
        }
        this.subscribers.get(topic)!!.push({ listener: receiver });
        return {
            cancel: () => {
                let subs = this.subscribers.get(topic)!;
                let index = subs.findIndex(s => s.listener === receiver);

                if (index === -1) {
                    throw Error('Double unsubscribe from event bus for topic ' + topic);
                } else {
                    subs.splice(index, 1);
                }
            }
        };
    }
}