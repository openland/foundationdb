import { StringBuilder } from './StringBuilder';
import { SchemaModel } from '../model';
import { generateHeader } from './generateHeader';
import { generateAtomics } from './generateAtomics';
import { generateStore } from './generateStore';

export function generate(src: SchemaModel, builder: StringBuilder) {
    generateHeader(src, builder);
    generateAtomics(src, builder);
    generateStore(src, builder);
}
