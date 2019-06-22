import { EventStore } from './EventStore';
import { Database, inTx } from '@openland/foundationdb';
import { createNamedContext } from '@openland/context';
describe('EventStore', () => {
    it('should persist events', async () => {
        let ctx = createNamedContext('test');
        let db = await Database.openTest();
        let store = new EventStore(await db.directories.createOrOpen(ctx, ['events']));
        await inTx(ctx, async (ctx2) => {
            store.write(ctx2, 'somekey', { value: 1 });
        });
        let events = await store.findAll(ctx, 'somekey');
        expect(events.length).toBe(1);
        expect(events[0].value).toBe(1);
    });
});