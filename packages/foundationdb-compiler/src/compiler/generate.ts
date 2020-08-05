import { StringBuilder } from './StringBuilder';
import { SchemaModel } from '../model';
import { generateHeader } from './generateHeader';
import { generateAtomics } from './generateAtomics';
import { generateStore } from './generateStore';
import { generateEntities } from './generateEntities';
import { generateEvents } from './generateEvents';
import { generateExtensions } from './generateExtensions';

export function generate(src: SchemaModel, builder: StringBuilder) {
    // Header
    generateHeader(src, builder);

    // Body
    generateAtomics(src, builder);
    generateEntities(src, builder);
    generateEvents(src, builder);
    generateExtensions(src, builder);

    // Container
    generateStore(src, builder);
}
