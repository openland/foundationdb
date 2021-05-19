export type Tree<T> = { child: Map<string, Tree<T>>, value: T };

export function createTree<T>(rootValue: T): Tree<T> {
    return { child: new Map(), value: rootValue };
}

export function getTreeItem<T>(src: Tree<T>, path: string[]): Tree<T> | null {
    if (path.length === 0) {
        return src;
    }
    if (path.length === 1) {
        let ex = src.child.get(path[0]);
        if (!ex) {
            return null;
        } else {
            return ex;
        }
    }
    let p = [...path];
    let id = p.shift()!;
    let ch = src.child.get(id);
    if (!ch) {
        return null;
    }
    return getTreeItem(ch, p);
}

export function setTreeItem<T>(src: Tree<T>, path: string[], value: T) {
    if (path.length === 0) {
        src.value = value;
        return;
    } else {
        let p = [...path];
        let id = p.shift()!;
        if (!src.child.has(id)) {
            if (path.length === 1) {
                src.child.set(path[0], { child: new Map(), value });
                return;
            }
            throw Error('Unable to find parent tree item:' + path);
        }
        setTreeItem(src.child.get(id)!, p, value);
    }
}

export function materializeTree<T>(src: Tree<T>) {
    let res: any = { ['$value']: src.value };
    for (let ch of src.child.keys()) {
        res[ch] = materializeTree(src.child.get(ch)!);
    }
    return res;
}

export function parseTree<T>(src: any) {
    let value = src.$value as T;
    let root = createTree<T>(value);
    function parseTreeChild(key: string[], vvv: any) {
        let v = vvv.$value as T;
        setTreeItem(root, key, v);
        for (let ch2 of Object.keys(vvv)) {
            if (ch2 === '$value') {
                continue;
            }
            parseTreeChild([...key, ch2], vvv[ch2]);
        }
    }
    for (let ch of Object.keys(src)) {
        if (ch === '$value') {
            continue;
        }
        parseTreeChild([ch], src[ch]);
    }
    return root;
}