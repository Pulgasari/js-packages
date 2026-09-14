// @ts-self-types="./index.d.ts"
// @pulgasari/is

import * as preds from './predicates.js';

// and/or/not live in predicates.js and reach consumers via `export *` below.

// pattern matcher
export const testRule = (rule, value) => {
  if (typeof rule === 'function') return rule(value);
  if (typeof rule === 'boolean')  return rule;
  if (Array.isArray(rule))        return rule.every(r => testRule(r, value));
  return false;
};


const upperFirst = s => s.charAt(0).toUpperCase() + s.slice(1);

// resolved name -> predicate. keeps the hot path a single map hit instead of
// re-running upperFirst and two namespace lookups on every is()/isAny()/isNot().
const nameCache = new Map();

// module namespace objects have a null prototype, so a plain lookup
// cannot hit inherited keys like 'constructor'.
const resolve = p => {
  if (typeof p === 'function') return p;

  const cached = nameCache.get(p);
  if (cached) return cached;

  const fn = preds[p] ?? preds['is' + upperFirst(p)];
  if (!fn) throw new TypeError(`unknown predicate: ${p}`);

  nameCache.set(p, fn);
  return fn;
};

const
// an empty list returns false everywhere, instead of the vacuous true
// every() would give — a forgotten argument must not confirm anything.
is    = (value, ...list) => list.length > 0 && list.every(p => !!resolve(p)(value)),     
isNot = (value, ...list) => list.length > 0 && list.every(p =>  !resolve(p)(value)),
isAny = (value, ...list) => list.some(p => !!resolve(p)(value));

// :::::: EXPORTS

export * from './predicates.js';
//export { and, or, not, testRule };
export { is, isAny, isNot };
