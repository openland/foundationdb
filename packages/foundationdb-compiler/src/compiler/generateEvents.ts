import * as Case from 'change-case';
import { SchemaModel } from '../model';
import { StringBuilder } from './StringBuilder';
import { resolveCodec, resolveType } from './generateEntities';

export function generateEvents(schema: SchemaModel, builder: StringBuilder) {
    for (let event of schema.events) {
        let eventKey = Case.camelCase(event.name);
        let eventClass = Case.pascalCase(event.name);

        // Codec
        builder.append();
        builder.append(`const ${eventKey}Codec = c.struct({`);
        builder.addIndent();
        for (let key of event.fields) {
            builder.append(`${key.name}: ${resolveCodec(key.type)},`);
        }
        builder.removeIndent();
        builder.append('});');

        // Shape
        builder.append();
        builder.append(`interface ${eventClass}Shape {`);
        builder.addIndent();
        for (let field of event.fields) {
            if (field.type.type === 'optional') {
                builder.append(`${field.name}?: ${resolveType(field.type, true)};`);
            } else {
                builder.append(`${field.name}: ${resolveType(field.type, true)};`);
            }
        }
        builder.removeIndent();
        builder.append('}');

        // Class
        builder.append();
        builder.append(`export class ${eventClass} extends BaseEvent {`);
        builder.addIndent();
        builder.append();
        builder.append(`static readonly type: '${eventKey}' = '${eventKey}';`);
        builder.append();
        builder.append(`static create(data: ${eventClass}Shape) {`);
        builder.addIndent();
        builder.append(`return new ${eventClass}(${eventKey}Codec.normalize(data));`);
        builder.removeIndent();
        builder.append(`}`);
        builder.append();
        builder.append(`static decode(data: any) {`);
        builder.addIndent();
        builder.append(`return new ${eventClass}(${eventKey}Codec.decode(data));`);
        builder.removeIndent();
        builder.append(`}`);
        builder.append();
        builder.append(`static encode(event: ${eventClass}) {`);
        builder.addIndent();
        builder.append(`return ${eventKey}Codec.encode(event.raw);`);
        builder.removeIndent();
        builder.append(`}`);
        builder.append();
        builder.append(`readonly type: '${eventKey}' = '${eventKey}';`);
        builder.append();
        builder.append(`private constructor(data: any) {`);
        builder.addIndent();
        builder.append(`super(data);`);
        builder.removeIndent();
        builder.append(`}`);
        builder.append();
        for (let field of event.fields) {
            let type: string = resolveType(field.type, false);
            builder.append(`get ${field.name}(): ${type} { return this.raw.${field.name}; }`);
        }
        builder.removeIndent();
        builder.append(`}`);
    }
    for (let eventStore of schema.eventStores) {
        let eventKey = Case.camelCase(eventStore.name);
        let eventClass = Case.pascalCase(eventStore.name);
        builder.append();
        builder.append(`export class ${eventClass} extends EventStore {`);
        builder.addIndent();

        // Open
        builder.append();
        builder.append(`static async open(storage: EntityStorage, factory: EventFactory) {`);
        builder.addIndent();
        builder.append(`let subspace = await storage.resolveEventStoreDirectory('${eventKey}');`);
        builder.append(`const descriptor = {`);
        builder.addIndent();
        builder.append(`name: '${eventStore.name}',`);
        builder.append(`storageKey: '${eventKey}',`);
        builder.append('subspace,');
        builder.append('storage,');
        builder.append('factory');
        builder.removeIndent();
        builder.append(`};`);
        builder.append(`return new ${eventClass}(descriptor);`);
        builder.removeIndent();
        builder.append(`}`);

        // Constructor
        builder.append();
        builder.append(`private constructor(descriptor: EventStoreDescriptor) {`);
        builder.addIndent();
        builder.append(`super(descriptor);`);
        builder.removeIndent();
        builder.append(`}`);

        // Post
        builder.append();
        builder.append(`post(ctx: Context${eventStore.keys.length > 0 ? ', ' + eventStore.keys.map((v) => v.name + ': ' + resolveType(v.type, false)).join(', ') : ''}, event: BaseEvent) {`);
        builder.addIndent();
        builder.append(`this._post(ctx, [${eventStore.keys.map((v) => v.name).join(', ')}], event);`);
        builder.removeIndent();
        builder.append(`}`);

        // Find All
        builder.append();
        builder.append(`async findAll(ctx: Context${eventStore.keys.length > 0 ? ', ' + eventStore.keys.map((v) => v.name + ': ' + resolveType(v.type, false)).join(', ') : ''}) {`);
        builder.addIndent();
        builder.append(`return this._findAll(ctx, [${eventStore.keys.map((v) => v.name).join(', ')}]);`);
        builder.removeIndent();
        builder.append(`}`);

        // Create Stream
        builder.append();
        builder.append(`createStream(${eventStore.keys.length > 0 ? eventStore.keys.map((v) => v.name + ': ' + resolveType(v.type, false)).join(', ') + ', ' : ''}opts?: { batchSize?: number, after?: string }) {`);
        builder.addIndent();
        builder.append(`return this._createStream([${eventStore.keys.map((v) => v.name).join(', ')}], opts);`);
        builder.removeIndent();
        builder.append(`}`);

        // Create Live Stream
        builder.append();
        builder.append(`createLiveStream(ctx: Context${eventStore.keys.length > 0 ? ', ' + eventStore.keys.map((v) => v.name + ': ' + resolveType(v.type, false)).join(', ') : ''}, opts?: { batchSize?: number, after?: string }) {`);
        builder.addIndent();
        builder.append(`return this._createLiveStream(ctx, [${eventStore.keys.map((v) => v.name).join(', ')}], opts);`);
        builder.removeIndent();
        builder.append(`}`);

        builder.removeIndent();
        builder.append(`}`);
    }
}