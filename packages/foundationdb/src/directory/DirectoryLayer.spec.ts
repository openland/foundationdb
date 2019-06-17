import { DirectoryLayer } from "./DirectoryLayer";
import { Database } from "../Database";
import { createNamedContext } from "@openland/context";

/**
 * Sample data from Go bindings:
 * 
 * \xfe\x01\x15\x03\x00\x01layer\x00 is ''
 * \xfe\x01\x15\x03\x00\x14\x02some\x00 is \x15\x1d
 * \xfe\x01\x15\x0f\x00\x01layer\x00 is ''
 * \xfe\x01\x15\x12\x00\x01layer\x00 is ''
 * \xfe\x01\x15\x12\x00\x14\x02some\x00 is \x15\x0f
 * \xfe\x01\x15\x1d\x00\x01layer\x00 is ''
 * \xfe\x01\xfe\x00\x01hca\x00\x14\x14 is \x04\x00\x00\x00\x00\x00\x00\x00
 * \xfe\x01\xfe\x00\x01hca\x00\x15\x01\x15\x03 is ''
 * \xfe\x01\xfe\x00\x01hca\x00\x15\x01\x15\x0f is ''
 * \xfe\x01\xfe\x00\x01hca\x00\x15\x01\x15\x12 is ''
 * \xfe\x01\xfe\x00\x01hca\x00\x15\x01\x15\x1d is ''
 * \xfe\x01\xfe\x00\x01version\x00 is \x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00
 * \xfe\x01\xfe\x00\x14\x02test\x00 is \x15\x12
 * \xfe\x01\xfe\x00\x14\x02test2\x00 is \x15\x03
 */

describe('Directory', () => {
    it('should allocate directories', async () => {
        let ctx = createNamedContext('test');
        let db = await Database.openTest();
        let d = new DirectoryLayer(db, db.allKeys.subspace(Buffer.of(0xfe)), db.allKeys);

        expect(await d.exists(ctx, ['test'])).toBeFalsy();
        expect(await d.exists(ctx, ['test', 'test2'])).toBeFalsy();
        let d1 = await d.createOrOpen(ctx, ['test']);
        let d2 = await d.createOrOpen(ctx, ['test', 'test2']);
        expect(!d1.equals(d2)).toBeTruthy();

        expect(await d.exists(ctx, ['test'])).toBeTruthy();
        expect(await d.exists(ctx, ['test', 'test2'])).toBeTruthy();

        let d12 = await d.open(ctx, ['test']);
        let d22 = await d.createOrOpen(ctx, ['test', 'test2']);
        expect(d1.equals(d12)).toBeTruthy();
        expect(d2.equals(d22)).toBeTruthy();
    });
    it('should throw error on double creation', async () => {
        let ctx = createNamedContext('test');
        let db = await Database.openTest();
        let d = new DirectoryLayer(db, db.allKeys.subspace(Buffer.of(0xfe)), db.allKeys);
        await d.createOrOpen(ctx, ['test']);
        await expect(d.create(ctx, ['test'])).rejects.toThrowError();
    });
    it('should throw error on trying to open non existent directory', async () => {
        let ctx = createNamedContext('test');
        let db = await Database.openTest();
        let d = new DirectoryLayer(db, db.allKeys.subspace(Buffer.of(0xfe)), db.allKeys);
        await expect(d.open(ctx, ['test'])).rejects.toThrowError();
    });
});