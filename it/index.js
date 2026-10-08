// @ts-self-types="./index.d.ts"
// @pulgasari/it

// it(iterable) wraps a list in It, an array with a query vocabulary. it stays a real
// array, so length, indices, for…of, spread and the native methods work as usual, and
// whatever returns a list hands back an It again, the chain goes on.
//
//   it(books).where({ sourceId: folder }).search(query, ['title', 'author'])
//   it(types).one({ id })
//
// a pattern describes the item:
//
//   undefined          anything, so an unset criterion filters nothing
//   function           a predicate
//   RegExp             a string that matches
//   Set                one of its values
//   array              one of its patterns
//   plain object       every key against its own pattern, nested the same way
//   anything else      the same value (===, NaN matches NaN)

// :::::: MATCH

const isPlainObject = value => {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

// a pattern as a predicate
function match (pattern) {
  if (pattern === undefined)          return () => true;
  if (typeof pattern === 'function')  return pattern;
  if (pattern instanceof RegExp)      return item => typeof item === 'string' && (pattern.lastIndex = 0, pattern.test(item));
  if (pattern instanceof Set)         return item => pattern.has(item);
  if (Array.isArray(pattern)) {
    const tests = pattern.map(match), n = tests.length;
    return item => { for (let i = 0; i < n; i++) if (tests[i](item)) return true; return false; };
  }
  if (isPlainObject(pattern)) {
    const keys = Object.keys(pattern).filter(key => pattern[key] !== undefined);
    const tests = keys.map(key => match(pattern[key])), n = keys.length;
    if (n === 1) { const [key] = keys, [test] = tests; return item => test(item?.[key]); }
    return item => { for (let i = 0; i < n; i++) if (!tests[i](item?.[keys[i]])) return false; return true; };
  }
  if (pattern !== pattern) return item => item !== item;   // NaN
  return item => item === pattern;
}

// a key or a function as a getter
const getter = key => typeof key === 'function' ? key : item => item?.[key];

// :::::: IT
// the methods loop by index into a plain array and hand that over as an It. a native
// method on an array with another prototype leaves the engine's fast path (about eight
// times slower on 2000 items), a plain loop does not. so the chainable natives (filter,
// map, slice) are overridden the same way, the rest stays native and works, just slower

const wrap = array => Object.setPrototypeOf(array, It.prototype);

function select (list, test, keep = true) {
  const out = [];
  for (let i = 0, n = list.length; i < n; i++) if (Boolean(test(list[i], i, list)) === keep) out.push(list[i]);
  return wrap(out);
}

class It extends Array {

  // :::::: QUERY

  // all that match, all that do not
  where   (pattern) { return select(this, match(pattern)); }
  without (pattern) { return select(this, match(pattern), false); }

  // the first that matches
  one (pattern) {
    const test = match(pattern);
    for (let i = 0, n = this.length; i < n; i++) if (test(this[i])) return this[i];
    return undefined;
  }

  // is there one that matches, do all
  has (pattern) {
    const test = match(pattern);
    for (let i = 0, n = this.length; i < n; i++) if (test(this[i])) return true;
    return false;
  }

  all (pattern) {
    const test = match(pattern);
    for (let i = 0, n = this.length; i < n; i++) if (!test(this[i])) return false;
    return true;
  }

  // :::::: SHAPE

  // the value of a key, or of a function, of every item
  pluck (key) { return this.map(getter(key)); }

  // a plain object by a key or a function, the last item of a key wins
  keyBy (key) {
    const get = getter(key), object = {};
    for (let i = 0, n = this.length; i < n; i++) object[get(this[i])] = this[i];
    return object;
  }

  // case insensitive text search over fields (keys or functions), over the items
  // themselves without fields. an empty query finds everything
  search (query, fields) {
    const needle = String(query ?? '').trim().toLowerCase();
    if (!needle) return this.slice();
    const gets = fields ? [fields].flat().map(getter) : [item => item], n = gets.length;
    return select(this, item => {
      for (let i = 0; i < n; i++) {
        const value = gets[i](item);
        if (value != null && String(value).toLowerCase().includes(needle)) return true;
      }
      return false;
    });
  }

  // :::::: NATIVE, FAST

  filter (fn) { return select(this, fn); }

  map (fn) {
    const out = new Array(this.length);
    for (let i = 0, n = this.length; i < n; i++) out[i] = fn(this[i], i, this);
    return wrap(out);
  }

  slice (start = 0, end = this.length) {
    const n = this.length;
    const from = start < 0 ? Math.max(n + start, 0) : Math.min(start, n);
    const to   = end   < 0 ? Math.max(n + end,   0) : Math.min(end,   n);
    const out  = [];
    for (let i = from; i < to; i++) out.push(this[i]);
    return wrap(out);
  }
}

// :::::: EXPORT

// any iterable or array-like, nullish is an empty list
const it = iterable => wrap(Array.isArray(iterable) ? iterable.slice() : Array.from(iterable ?? []));

export { It, it, match };
export default it;
