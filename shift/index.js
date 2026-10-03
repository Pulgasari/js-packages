// @ts-self-types="./index.d.ts"
// @pulgasari/shift

// :::::: IMPORT

import * as IS_PREDICATES from '@pulgasari/is';

// :::::: INTERNAL

const FALLBACK = 'fallback';
const valueOf  = (handler, target) => typeof handler === 'function' ? handler(target) : handler;

// :::::: MAIN

// an instance that knows `predicates`.
// with() adds more to this very instance
function createShift (predicates = {}) {
  const known = {};

  function shift (cases) {
    const list = [];
    for (const [name, handler] of Object.entries(cases)) {
      if (name === FALLBACK) continue;
      if (!Object.hasOwn(known, name)) throw new TypeError(`unknown predicate: ${name}`);
      list.push([known[name], handler]);
    }
    return target => {
      for (const [predicate, handler] of list) if (predicate(target)) return valueOf(handler, target);
      return valueOf(cases[FALLBACK], target);
    };
  }

  shift.with = additions => {
    for (const [name, predicate] of Object.entries(additions)) {
      if (typeof predicate !== 'function') throw new TypeError(`not a predicate: ${name}`);
      known[name] = predicate;
    }
    return shift;
  };

  // a copy, to build another instance on top of this one
  Object.defineProperty(shift, 'predicates', { get: () => ({ ...known }) });

  return shift.with(predicates);
}

const shift     = createShift (IS_PREDICATES); // the standard 'shift' already knows the is-predicates     
const pureShift = createShift (); // ... but the 'pureShift' does not

// :::::: EXPORT

export { createShift, pureShift, shift };
export default shift;
