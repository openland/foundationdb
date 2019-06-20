export interface KeySelector {
  key: Buffer;
  orEqual: boolean;
  offset: number;
  _isKeySelector: true;
}

const keySelector = (key: Buffer, orEqual: boolean, offset: number): KeySelector => (
  { key, orEqual, offset, _isKeySelector: true }
);

const add = (sel: KeySelector, addOffset: number) => keySelector(sel.key, sel.orEqual, sel.offset + addOffset);
const next = (sel: KeySelector) => add(sel, 1);
const prev = (sel: KeySelector) => add(sel, -1);

// From the [docs](https://apple.github.io/foundationdb/developer-guide.html#key-selectors):
// 
// To resolve these key selectors FoundationDB first finds the last key less
// than the reference key (or equal to the reference key, if the equality flag
// is true), then moves forward a number of keys equal to the offset (or
// backwards, if the offset is negative).
const lastLessThan = (key: Buffer) => keySelector(key, false, 0);
const lastLessOrEqual = (key: Buffer) => keySelector(key, true, 0);
const firstGreaterThan = (key: Buffer) => keySelector(key, true, 1);
const firstGreaterOrEqual = (key: Buffer) => keySelector(key, false, 1);

const isKeySelector = (val: any): val is KeySelector => {
  return (typeof val === 'object' && val != null && val._isKeySelector);
};

const from = (valOrKS: Buffer | KeySelector): KeySelector => (
  isKeySelector(valOrKS) ? valOrKS : firstGreaterOrEqual(valOrKS)
);

export default Object.assign(keySelector, {
  add, next, prev, lastLessThan, lastLessOrEqual, firstGreaterThan, firstGreaterOrEqual, isKeySelector, from
});
