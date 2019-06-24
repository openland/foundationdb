
export class StringBuilder {

    private res = '';
    private _indent = 0;

    addIndent() {
        this._indent++;
    }

    removeIndent() {
        this._indent--;
    }

    append(text?: string) {
        if (text) {
            this.res += ' '.repeat(this._indent * 4) + text + '\n';
        } else {
            this.res += '\n';
        }
    }

    build() {
        return this.res;
    }
}