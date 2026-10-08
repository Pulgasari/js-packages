// @ts-self-types="./index.d.ts"
// @pulgasari/it

// it(iterable) wraps a list in It, an array with a query vocabulary. it stays a real
// array, so length, indices, for…of, spread and the native methods work as usual, and
// whatever returns a list hands back an It again, the chain goes on.
//
//   it(books).where({ sourceId: folder }).search(query, ['title', 'author'])
//   it(types).one({ id })
//
// the patterns and the methods themselves live in ./core.js. ./prototype.js puts the
// same methods on Array.prototype instead, for an app that owns its globals.

import * as core from './core.js';

const { match } = core;

// :::::: IT
// a result is a plain array with It.prototype set. the natives on an array with another
// prototype leave the engine's fast path (about eight times slower on 2000 items), so
// the chainable ones (filter, map, slice) loop by index here as well. the rest stays
// native and works, just slower

const wrap = array => Object.setPrototypeOf(array, It.prototype);

class It extends Array {

  // :::::: QUERY

  where   (pattern) { return wrap(core.where  (this, pattern)); }
  without (pattern) { return wrap(core.without(this, pattern)); }
  search  (query, fields) { return wrap(core.search(this, query, fields)); }

  one (pattern) { return core.one(this, pattern); }
  has (pattern) { return core.has(this, pattern); }
  all (pattern) { return core.all(this, pattern); }

  // :::::: SHAPE

  pluck  (key)             { return wrap(core.pluck (this, key)); }
  keyBy  (key)             { return core.keyBy(this, key); }
  sortBy (sort, direction) { return wrap(core.sortBy(this, sort, direction)); }

  // :::::: NATIVE, FAST

  filter (fn) { return wrap(core.select(this, fn)); }
  map    (fn) {
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
