// @ts-self-types="./index.d.ts"
// @pulgasari/shift
// a switch over predicates: the first case whose predicate holds gives the result.
//
//   shift (cases)           -> a function of the target, to keep and call later
//   shift (target, cases)   -> the result right away
//
// a case is a predicate name and a handler. the handler is called with the
// target, a handler that is no function is the result itself. `fallback` is
// taken when no predicate holds. a name may leave out its `is`: 'nullish'
// stands for 'isNullish'.

// :::::: IMPORT

// the plain predicates. the module namespace would bring is(), testRule() and
// the `predicates` map along, which are no predicates of one value
import { predicates as IS_PREDICATES } from '@pulgasari/is';

// :::::: INTERNAL

const FALLBACK = 'fallback';

function resultOf (handler, target) {
  if (typeof handler === 'function') return handler(target);
  return handler;
}

// :::::: MAIN

// an instance that knows `predicates`. with() teaches it more
function createShift (predicates = {}) {
  const known = {};

  // 'nullish' -> the predicate isNullish, 'isNullish' -> the same
  function predicateOf (name) {
    if (Object.hasOwn(known, name)) return known[name];

    const prefixed = 'is' + name.charAt(0).toUpperCase() + name.slice(1);
    if (Object.hasOwn(known, prefixed)) return known[prefixed];

    throw new TypeError(`unknown predicate: ${name}`);
  }

  // the cases as [predicate, handler] pairs, checked once
  function compile (cases) {
    const pairs = [];

    for (const [name, handler] of Object.entries(cases)) {
      if (name === FALLBACK) continue;
      pairs.push([predicateOf(name), handler]);
    }

    return function run (target) {
      for (const [predicate, handler] of pairs) {
        if (predicate(target)) return resultOf(handler, target);
      }
      return resultOf(cases[FALLBACK], target);
    };
  }

  // one argument: the cases, a function comes back.
  // two arguments: the target and the cases, the result comes back
  function shift (...args) {
    if (args.length < 2) return compile(args[0]);

    const [target, cases] = args;
    return compile(cases)(target);
  }

  shift.with = function (additions) {
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

const shift     = createShift(IS_PREDICATES); // knows every predicate of @pulgasari/is
const pureShift = createShift();              // knows none, teach it with with()

// :::::: EXPORT

export { createShift, pureShift, shift };
export default shift;
