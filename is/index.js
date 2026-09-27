// @ts-self-types="./index.d.ts"
// @pulgasari/is

import * as predicates from './predicates.js';

// :::::: INTERNAL

// resolved name -> predicate
// keeps the hot path a single map hit instead of re-running upperFirst 
// and two namespace lookups on every is()/isAny()/isNot().
const nameCache  = new Map;
const upperFirst = str => str.charAt(0).toUpperCase() + str.slice(1);

// module namespace objects have a null prototype,
// so a plain lookup cannot hit inherited keys like 'constructor'.
const resolvePredicate = p => {
  if (typeof p === 'function') return p;

  const cached = nameCache.get(p);
  if (cached) return cached;

  const fn = predicates[p] ?? predicates['is' + upperFirst(p)];
  if (!fn) throw new TypeError(`unknown predicate: ${p}`);

  nameCache.set(p, fn);
  return fn;
};

// :::::: MAIN

// pattern matcher
const testRule = (rule, value) => {
  if (typeof rule === 'function') return rule(value);
  if (typeof rule === 'boolean')  return rule;
  if (Array.isArray(rule))        return rule.every(r => testRule(r, value));
  return false;
};

const
// an empty list returns false everywhere,
// instead of the vacuous true every() would give
// — a forgotten argument must not confirm anything.
is    = (value, ...list) => list.length > 0 && list.every (p => !!resolvePredicate(p)(value)),     
isNot = (value, ...list) => list.length > 0 && list.every (p =>  !resolvePredicate(p)(value)),
isAny = (value, ...list) =>                    list.some  (p => !!resolvePredicate(p)(value));

// :::::: EXPORT

export const // re-created and exported here so 'predicates.js' provides pure
and = (...preds) => v => preds.every (p => p(v)),
or  = (...preds) => v => preds.some  (p => p(v)),
not = (pred)     => v => !pred(v);

export * from './predicates.js';
export { is, isAny, isNot, predicates, resolvePredicate, testRule };
