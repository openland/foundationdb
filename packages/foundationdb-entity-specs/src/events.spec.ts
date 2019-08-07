import { EntityStorage } from '@openland/foundationdb-entity';
import { openTestDatabase } from './utils/openTestDatabase';
import { openStore, SampleEvent } from './events.repo';
import { inTx } from '@openland/foundationdb';
import { createNamedContext } from '@openland/context';

describe('Events', () => {
    it('should decode and encode events', async () => {
        let db = await openTestDatabase();
        let store = await openStore(new EntityStorage(db));
        let encoded = store.eventFactory.encode(SampleEvent.create({
            id: 'some_id',
            name: 'name'
        }));
        expect(encoded).toMatchSnapshot();
        let decoded = store.eventFactory.decode(encoded);
        expect(decoded).toMatchSnapshot();
    });

    it('should persist events', async () => {
        let root = createNamedContext('test');
        let db = await openTestDatabase();
        let store = await openStore(new EntityStorage(db));
        await inTx(root, async (ctx) => {
            store.UserEvents.post(ctx, 'user1', SampleEvent.create({ id: '1' }));
            store.UserEvents.post(ctx, 'user1', SampleEvent.create({ id: '2' }));
            store.UserEvents.post(ctx, 'user1', SampleEvent.create({ id: '3' }));
            store.UserEvents.post(ctx, 'user1', SampleEvent.create({ id: '4' }));

            store.UserEvents.post(ctx, 'user2', SampleEvent.create({ id: '5' }));
        });

        let ex = await store.UserEvents.findAll(root, 'user1');
        expect(ex.length).toBe(4);
        expect(ex[0] instanceof SampleEvent).toBeTruthy();
        expect((ex[0] as SampleEvent).id).toBe('1');
        expect(ex[1] instanceof SampleEvent).toBeTruthy();
        expect((ex[1] as SampleEvent).id).toBe('2');
        expect(ex[2] instanceof SampleEvent).toBeTruthy();
        expect((ex[2] as SampleEvent).id).toBe('3');
        expect(ex[3] instanceof SampleEvent).toBeTruthy();
        expect((ex[3] as SampleEvent).id).toBe('4');

        let ex2 = await store.UserEvents.findAll(root, 'user2');
        expect(ex2.length).toBe(1);

        let ex3 = await store.UserEvents.findAll(root, 'user3');
        expect(ex3.length).toBe(0);
    });
});