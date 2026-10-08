// @pulgasari/it/core

// the query vocabulary as plain functions: a list in, a plain array or a value out.
// index.js wraps the results in It, prototype.js puts them on Array.prototype.
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
//
// everything loops by index: a native method on an array with another prototype leaves
// the engine's fast path, a plain loop does not.

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

// :::::: SELECT

function select (list, test, keep = true) {
  const out = [];
  for (let i = 0, n = list.length; i < n; i++) if (Boolean(test(list[i], i, list)) === keep) out.push(list[i]);
  return out;
}

// all that match, all that do not
const where   = (list, pattern) => select(list, match(pattern));
const without = (list, pattern) => select(list, match(pattern), false);

// the first that matches
function one (list, pattern) {
  const test = match(pattern);
  for (let i = 0, n = list.length; i < n; i++) if (test(list[i])) return list[i];
  return undefined;
}

// is there one that matches, do all
function has (list, pattern) {
  const test = match(pattern);
  for (let i = 0, n = list.length; i < n; i++) if (test(list[i])) return true;
  return false;
}

function all (list, pattern) {
  const test = match(pattern);
  for (let i = 0, n = list.length; i < n; i++) if (!test(list[i])) return false;
  return true;
}

// case insensitive text search over fields (keys or functions), over the items
// themselves without fields. an empty query finds everything
function search (list, query, fields) {
  const needle = String(query ?? '').trim().toLowerCase();
  if (!needle) return select(list, () => true);
  const gets = fields ? [fields].flat().map(getter) : [item => item], n = gets.length;
  return select(list, item => {
    for (let i = 0; i < n; i++) {
      const value = gets[i](item);
      if (value != null && String(value).toLowerCase().includes(needle)) return true;
    }
    return false;
  });
}

// :::::: SHAPE

// the value of a key, or of a function, of every item
function pluck (list, key) {
  const get = getter(key), out = new Array(list.length);
  for (let i = 0, n = list.length; i < n; i++) out[i] = get(list[i]);
  return out;
}

// a plain object by a key or a function, the last item of a key wins
function keyBy (list, key) {
  const get = getter(key), object = {};
  for (let i = 0, n = list.length; i < n; i++) object[get(list[i])] = list[i];
  return object;
}

// :::::: SORT
// a sorted copy. strings sort like people read them: case and accents aside, numbers by
// value ('file 2' before 'file 10'). nullish goes last, in either direction
//
//   sortBy('title')                   ascending
//   sortBy('title', 'desc')
//   sortBy(['author', 'title'])       ascending by each, in order
//   sortBy({ year: 'desc', title: 'asc' })
//   sortBy(book => book.title.length)
//
// each string becomes a sort key once (lowercase, without diacritics, digit runs padded),
// then the sort compares plain values. about twice as fast as an Intl.Collator with
// numeric and base sensitivity, same order for latin text, not locale specific (a
// swedish å sorts as a, not after z)

const ASCII = /^[\x00-\x7f]*$/, DIACRITICS = /[\u0300-\u036f]/g, DIGIT = /\d/, DIGITS = /\d+/g;
const pad   = digits => digits.padStart(16, '0');

function sortKey (value) {
  if (typeof value !== 'string') return value;
  let key = ASCII.test(value) ? value : value.normalize('NFD').replace(DIACRITICS, '');
  key = key.toLowerCase();
  return DIGIT.test(key) ? key.replace(DIGITS, pad) : key;
}

function compare (a, b) {
  if (a == null || b == null) return a == null ? (b == null ? 0 : 1) : -1;
  return a < b ? -1 : a > b ? 1 : 0;
}

function sortBy (list, sort, direction = 'asc') {
  const rules = typeof sort === 'string' || typeof sort === 'function' ? [[sort, direction]]
              : Array.isArray(sort)                                     ? sort.map(key => [key, 'asc'])
              :                                                           Object.entries(sort ?? {});
  const gets  = rules.map(([key]) => getter(key));
  const signs = rules.map(([, dir]) => dir === 'desc' ? -1 : 1), n = rules.length;

  // decorate, sort, undecorate. one rule keeps its key bare, more an array of them
  const rows = new Array(list.length);

  if (n === 1) {
    const [get] = gets, [sign] = signs;
    for (let i = 0, m = list.length; i < m; i++) rows[i] = [sortKey(get(list[i])), list[i]];
    rows.sort((a, b) => { const result = compare(a[0], b[0]); return a[0] == null || b[0] == null ? result : sign * result; });
  }
  else {
    for (let i = 0, m = list.length; i < m; i++) {
      const keys = new Array(n);
      for (let k = 0; k < n; k++) keys[k] = sortKey(gets[k](list[i]));
      rows[i] = [keys, list[i]];
    }
    rows.sort((a, b) => {
      for (let k = 0; k < n; k++) {
        const x = a[0][k], y = b[0][k], result = compare(x, y);
        if (result) return x == null || y == null ? result : signs[k] * result;
      }
      return 0;
    });
  }

  for (let i = 0, m = rows.length; i < m; i++) rows[i] = rows[i][1];
  return rows;
}

// :::::: EXPORT

export { all, getter, has, keyBy, match, one, pluck, search, select, sortBy, where, without };
