import { EntityStorage } from '@openland/foundationdb-entity';
import { openTestDatabase } from './utils/openTestDatabase';
import { openStore, SampleEvent } from './events.repo';

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
});