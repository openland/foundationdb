import { Database } from './Database';
import { createNamedContext } from '@openland/context';

describe('Directory', () => {
    it('should create custom prefixes', async () => {
        let ctx = createNamedContext('test');
        let db = await Database.openTest();
        let prefix = await db.directories.create(ctx, ['com.openalnd.layers', 'entity']);
        let prefix2 = await (await db.directories.open(ctx, ['com.openalnd.layers'])).open(ctx, ['entity']);
        expect(prefix.prefix.equals(prefix2.prefix)).toBe(true);
    });
})