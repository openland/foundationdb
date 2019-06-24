import meow from 'meow';
import { compileFile } from './compiler';

let cli = meow(`
  Usage
    $ foundationdb-compiler <schema> <dest>
`);

if (cli.input.length < 2) {
    cli.showHelp(2);
} else {
    compileFile(cli.input[0], cli.input[1]);
}