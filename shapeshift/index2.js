// @ts-self-types="./index.d.ts"
// @pulgasari/shapeshift

// dispatches a value to the first case whose predicate holds. the cases are an
// object keyed by predicate names, resolved once when shift(cases) is called:
//
//   const label = shift({ isNullish: '—', isNumber: format, fallback: String });
//   label(1250.5);

import * as is from '@pulgasari/is';

// :::::: INTERNAL

const FALLBACK = 'fallback';

// the predicates of @pulgasari/is, without its is()/isAny()/isNot() checkers
const IS_PREDICATES = Object.fromEntries(Object.entries(is).filter(([name]) => /^is[A-Z]/.test(name) && name !== 'isAny' && name !== 'isNot'));

const valueOf = (handler, target) => typeof handler === 'function' ? handler(target) : handler;

// :::::: MAIN

// an instance that knows `predicates`. with() adds more to this very instance
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

const pureShift = createShift();
const shift     = createShift(IS_PREDICATES);

// :::::: EXPORT

export { createShift, pureShift, shift };
export default shift;
