import { BaseLayer } from './Layer';
import { Database } from './Database';
import { createNamedContext } from '@openland/context';

describe('Database', () => {
    it('should open and close database', async () => {
        let ctx = createNamedContext('test');
        let db = await Database.open();
        expect(db).not.toBeFalsy();
        await db.close(ctx);
    });

    it('should crash when opening test database in production', async () => {
        process.env.NODE_ENV = 'production';
        await expect(Database.openTest()).rejects.toThrowError();
        process.env.NODE_ENV = undefined;
    });

    it('should register layers', async () => {
        class SampleLayer extends BaseLayer {
            readonly displayName: string = 'sample layer';
        }
        let instance = new SampleLayer();
        let db = await Database.openTest({ layers: [instance] });
        let layer2 = db.get(SampleLayer);
        expect(instance === layer2).toBe(true);
    });

    it('should crash on double registration of layers', async () => {
        class SampleLayer extends BaseLayer {
            readonly displayName: string = 'sample layer';
        }
        await expect(Database.openTest({layers: [new SampleLayer(), new SampleLayer()]})).rejects.toThrowError();
    });
});