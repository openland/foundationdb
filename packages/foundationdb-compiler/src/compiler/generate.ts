import { StringBuilder } from './StringBuilder';
import { SchemaModel } from '../model';
import { generateHeader } from './generateHeader';
import { generateAtomics } from './generateAtomics';

export function generate(src: SchemaModel, builder: StringBuilder) {
    generateHeader(src, builder);
    generateAtomics(src, builder);
}
