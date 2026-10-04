// @ts-self-types="./index.d.ts"
// @pulgasari/typeshift

/*
shapeshift with patterns instead of predicate names.
every case key is a pattern string (see parse.js), 
compiled once when typeshift(cases) is called:

const label = typeshift({ 'null | undefined': '—', 'number(0..)': format, fallback: String });
label(1250.5);
*/

import * as IS_PREDICATES from '@pulgasari/is';
import { compile } from './compile.js';
import { parse }   from './parse.js';

// :::::: INTERNAL

const FALLBACK  = 'fallback';
const valueOf   = (handler, target) => typeof handler === 'function' ? handler(target) : handler;
const toEntries = Object.entries;

// the types every instance knows, by typeof. null and undefined are literals
const CORE = {
  any       : () => true,
  array     : Array.isArray,
  bigint    : value => typeof value === 'bigint',
  boolean   : value => typeof value === 'boolean',
  function  : value => typeof value === 'function',
  number    : value => typeof value === 'number',
  object    : value => typeof value === 'object' && value !== null,
  string    : value => typeof value === 'string',
  symbol    : value => typeof value === 'symbol',
};

// the is-predicates as names: isPlainObject -> plainObject, isJSON -> json.
// the ones that build a predicate from an argument, or take a list, are left
// out, and the core names keep their typeof meaning
const FACTORIES = new Set(['isAny', 'isInstanceOf', 'isMatchOf', 'isNot', 'isTypeOf']);
const nameOf    = key => key.slice(2).replace(/^[A-Z]+(?=[A-Z][a-z]|$)|^[A-Z]/, head => head.toLowerCase());
const IS_TYPES  = Object.fromEntries(Object.entries(IS_PREDICATES)
  .filter (([key, predicate]) => /^is[A-Z]/.test(key) && !FACTORIES.has(key) && typeof predicate === 'function')
  .filter (([key])            => !Object.hasOwn(CORE, nameOf(key)))
  .map    (([key, predicate]) => [nameOf(key), predicate]));

// every name a tree refers to
function namesOf (node, names = new Set) {
  if (node.type === 'name') names.add(node.name);
  for (const child of [node.item, node.pattern, node.rest, ...(node.options ?? []), ...(node.parts ?? []), ...(node.items ?? []), ...(node.fields ?? []).map(field => field.pattern)]) {
    if (child) namesOf(child, names);
  }
  return names;
}

// allocation-free traversal
function namesOf (node, names = new Set) {
  if (node.type === 'name') names.add(node.name);
  if (node.item)    namesOf(node.item,    names);
  if (node.pattern) namesOf(node.pattern, names);
  if (node.rest)    namesOf(node.rest,    names);
  if (node.options) { for (let i = 0; i < node.options.length; i++) namesOf(node.options [i], names); }
  if (node.parts)   { for (let i = 0; i < node.parts . length; i++) namesOf(node.parts   [i], names); }
  if (node.items)   { for (let i = 0; i < node.items . length; i++) namesOf(node.items   [i], names); }
  if (node.fields)  { for (let i = 0; i < node.fields. length; i++) namesOf(node.fields  [i].pattern, names); }
  return names;
}

// an unknown capitalized name that is a global constructor is an instanceof check
const constructorOf = name => /^[A-Z]/.test(name) && typeof globalThis[name] === 'function' ? globalThis[name] : null;

// :::::: MAIN

// an instance that knows `types`, each a predicate or a pattern string.
// with() adds more to this very instance
function createTypeshift (types = {}) {
  const known    = {};         // name -> predicate or pattern
  const resolved = new Map;    // name -> predicate
  const compiled = new Map;    // pattern -> predicate

  const resolve = name => {
    if (resolved.has(name)) return resolved.get(name);
    const type      = known[name];
    const construct = constructorOf(name);
    const predicate = typeof type === 'function' ? type
                    : typeof type === 'string'   ? compile(parse(type), resolve)
                    : value => value instanceof construct;
    resolved.set(name, predicate);
    return predicate;
  };

  const check = (tree, pattern) => {
    for (const name of namesOf(tree)) {
      if (!Object.hasOwn(known, name) && !constructorOf(name)) throw new TypeError(`unknown type: ${name} in "${pattern}"`);
    }
  };

  const predicate = pattern => {
    if (compiled.has(pattern)) return compiled.get(pattern);
    const tree = parse(pattern);
    check(tree, pattern);
    const result = compile(tree, resolve);
    compiled.set(pattern, result);
    return result;
  };

  function typeshift (cases) {
    const list = [];
    for (const [pattern, handler] of Object.entries(cases)) {
      if (pattern !== FALLBACK) list.push([predicate(pattern), handler]);
    }
    return target => {
      for (const [test, handler] of list) if (test(target)) return valueOf(handler, target);
      return valueOf(cases[FALLBACK], target);
    };
  }

  // all additions first, so the patterns among them may name each other
  typeshift.with = additions => {
    for (const [name, type] of Object.entries(additions)) {
      if (!/^[A-Za-z_$][\w$]*$/.test(name)) throw new TypeError(`not a type name: ${name}`);
      if (typeof type !== 'function' && typeof type !== 'string') throw new TypeError(`not a predicate or pattern: ${name}`);
      known[name] = type;
    }
    for (const [name, type] of Object.entries(additions)) if (typeof type === 'string') check(parse(type), type);
    resolved.clear();
    compiled.clear();
    return typeshift;
  };

  typeshift.matches   = (pattern, value) => predicate(pattern)(value);
  typeshift.predicate = predicate;

  // a copy, to build another instance on top of this one
  Object.defineProperty(typeshift, 'types', { get: () => ({ ...known }) });

  return typeshift.with({ ...CORE, ...types });
}

const typeshift     = createTypeshift (IS_TYPES);   // knows the is-predicates as names
const pureTypeshift = createTypeshift ();           // the core types only

// :::::: EXPORT

export { createTypeshift, parse, pureTypeshift, typeshift };
export default typeshift;
