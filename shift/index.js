// @ts-self-types="./index.d.ts"
// @pulgasari/shift

// :::::: IMPORT

import { predicates } from '@pulgasari/is';

// :::::: INTERNAL

const FALLBACK = 'fallback';
const valueOf  = (handler, target) => typeof handler === 'function' ? handler(target) : handler;

// :::::: MAIN

// an instance that knows `predicates`.
// with() adds more to this very instance
function createShift (preds = {}) {
  const map = new Map;

  function predicateOf (name) {
    if (map.has(name)) return map.get(name);

    const prefixed = 'is' + name.charAt(0).toUpperCase() + name.slice(1);
    if (map.has(prefixed)) return map.get(prefixed);

    throw new TypeError(`unknown predicate: ${name}`);
  }

  function shift (...args) {
    const cases = args.length < 2 ? args[0] : args[1];
    const list  = [];
    for (const [name, handler] of Object.entries(cases)) {
      if (name === FALLBACK) continue;
      list.push([predicateOf(name), handler]);
    }
    const run = target => {
      for (const [predicate, handler] of list) if (predicate(target)) return valueOf(handler, target);
      return valueOf(cases[FALLBACK], target);
    };
    return args.length < 2 ? run : run(args[0]);
  }

  shift.with = additions => {
    for (const [name, predicate] of Object.entries(additions)) {
      if (typeof predicate !== 'function') throw new TypeError(`not a predicate: ${name}`);
      map.set(name, predicate);
    }
    return shift;
  };

  // a copy, to build another instance on top of this one
  Object.defineProperty(shift, 'predicates', { get: () => Object.fromEntries(map) });

  return shift.with(preds);
}

const shift     = createShift (predicates); // the standard 'shift' already knows the is-predicates     
const pureShift = createShift (); // ... but the 'pureShift' does not

// :::::: EXPORT

export { createShift, pureShift, shift };
export default shift;
