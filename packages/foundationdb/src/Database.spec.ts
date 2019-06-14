import { Database } from "./Database";

describe('Database', () => {
    it('should open and close database', async () => {
        let db = await Database.open();
        expect(db).not.toBeFalsy();
        db.close();
    });
});