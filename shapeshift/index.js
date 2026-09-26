// @shapeshift :: DO NOT USE – it's just an experimental concept

/* Unterstützt alle Aufruf-Formen nahtlos 
- shift(target, cases)
- shift(target)(cases)
- Point-Free via shift.from(cases)).
*/

// :::::: IMPORT

import { isElement, isFn, resolve } from './is.js';

// :::::: INTERNAL

// evaluates target against case rules
function matchCases (target, cases) {
  for (const [key, handler] of Object.entries(cases)) {
    if (key === 'fallback' || key === 'default' || key === '_') continue;
    // resolve() automatically maps 'isNullish' -> predicates.isNullish
    const predicate = resolve(key);
    if (predicate(target)) return isFn (handler) ? handler (target) : handler;
  }

  const fallback = cases.fallback ?? cases.default ?? cases._;
  return isFn (fallback) ? fallback (target) : fallback;
}

// :::::: MAIN

// universal pattern matcher supporting direct and curried signatures.
function shift (target, cases) {
  return (arguments.length >= 2)
  ? matchCases (target, cases) // direct signature: shift(target, cases)
  : (casesObject) => matchCases (target, casesObject); // curried data-first: shift(target)(cases)     
}

// cases-first helper for point-free functions: shift.from(cases)(target)
shift.from = (cases) => (target) => matchCases(target, cases);

// :::::: EXPORT

export { shift };
export default shift;

// :::::: USAGE

// bind custom local predicates to a new shift instance
shift.with = (customPredicates) => {
  const customShift = (target, cases) => {
    if (arguments.length >= 2) return matchCases(target, cases, customPredicates);
    return (casesObject) => matchCases(target, casesObject, customPredicates);
  };
  customShift.from = (cases) => (target) => matchCases(target, cases, customPredicates);
  return customShift;
};











//////////////////////// EXTEND SHIFT ////////////////////////

import { resolve as baseResolve } from './is.js';

function matchCases (target, cases, customPredicates = {}) {
  for (const [key, handler] of Object.entries(cases)) {
    if (key === 'fallback' || key === 'default' || key === '_') continue;

    // Check custom local predicates first, then fall back to @pulgasari/is
    const predicate = customPredicates[key] ?? baseResolve(key);

    if (predicate(target)) {
      return typeof handler === 'function' ? handler(target) : handler;
    }
  }

  const fallback = cases.fallback ?? cases.default ?? cases._;
  return typeof fallback === 'function' ? fallback(target) : fallback;
}

export function shift(target, cases) {
  if (arguments.length >= 2) return matchCases(target, cases);
  return (casesObject) => matchCases(target, casesObject);
}



// USAGE EXAMPLE

import { isArray, isString, isNullish, and, has } from '@pulgasari/is';
import { shift } from './shift.js';

// 1. Define custom reusable predicates upfront using @pulgasari/is helpers
const hasLength      = (n) => has.length(n); // or: v => v?.length === len
const isTripleArray  = and(isArray, hasLength(3));
const isStringOrNull = or(isString, isNullish);

// 2. Bind custom predicates to shift
const myShift = shift.with({
  isTripleArray,
  isStringOrNull,
});

// 3. Clean object matching with domain-specific terms
function process (target) {
  return myShift (target, {
    isTripleArray  : (arr) => `Vector 3D: ${arr.join(', ')}`,
    isStringOrNull : ()    => 'String or empty',
    isArray        : (arr) => `Array with ${arr.length} elements`,
    fallback       : ()    => 'Other',
  });
}

process([10, 20, 30]); // "Vector 3D: 10, 20, 30"

