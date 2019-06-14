import { Database } from "./Database";

describe('Database', () => {
    it('should open and close database', async () => {
        let db = await Database.open();
        expect(db).not.toBeFalsy();
        db.close();
    });

    it('should crash when opening test database in production', async () => {
        process.env.NODE_ENV = 'production';
        await expect(Database.openTest()).rejects.toThrowError();
    })
});