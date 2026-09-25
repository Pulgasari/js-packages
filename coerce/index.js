// @ts-self-types="./index.d.ts"
// @pulgasari/coerce

// turns loose input (attribute strings, form values, query params, json) into the
// type a caller asked for. nothing throws: what cannot be converted is the fallback.

import { isArray, isBoolean, isFn, isNullish, isNumber, isString } from '@pulgasari/is';

const FALSY = new Set(['false', '0', 'no', 'off', 'null', 'undefined']);

const isIterable = value => value != null && typeof value !== 'string' && typeof value[Symbol.iterator] === 'function';
const isRecord   = value => value !== null && typeof value === 'object';

// :::::: SINGLE TYPES

export const

// 'false', '0', 'no', 'off', 'null' and 'undefined' are false, any other string is
// true. an empty string too, like a boolean html attribute
toBoolean = (value, fallback = false) =>
    isBoolean (value) ? value
  : isNullish (value) ? fallback
  : isNumber  (value) ? value !== 0
  : !FALSY.has(String(value).trim().toLowerCase()),

toNumber = (value, fallback) => {
  const number = isNumber(value) ? value : parseFloat(value);
  return Number.isFinite(number) ? number : fallback;
},

toString = (value, fallback = '') =>
    isNullish (value) ? fallback
  : isString  (value) ? value
  : isRecord  (value) && !(value instanceof Date) ? toJsonString(value, fallback)
  : String(value),

toDate = (value, fallback = null) => {
  if (isNullish(value)) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
},

// a string is parsed, anything else is taken as it is
toJson = (value, fallback) => {
  if (!isString(value)) return value ?? fallback;
  try   { return JSON.parse(value); }
  catch { return fallback; }
};

const toJsonString = (value, fallback) => { try { return JSON.stringify(value); } catch { return fallback; } };

// :::::: COLLECTIONS

export const

// a json array string is parsed, any other string is split on commas
toArray = (value) =>
    isArray    (value) ? value
  : isNullish  (value) ? []
  : isString   (value) ? fromString(value)
  : isIterable (value) ? Array.from(value)
  : [value],

toSet = (value) => value instanceof Set ? value : new Set(toArray(value)),

// a map, an iterable of [key, value] pairs, or the entries of a plain object
toMap = (value) =>
    value instanceof Map ? value
  : isNullish  (value)  ? new Map
  : isIterable (value)  ? new Map(value)
  : isRecord   (value)  ? new Map(Object.entries(value))
  : new Map,

toEntries = (value) =>
    value instanceof Map || value instanceof Set ? [...value.entries()]
  : isArray  (value) ? [...value.entries()]
  : isRecord (value) ? Object.entries(value)
  : [],

toKeys = (value) => toEntries(value).map(([key]) => key);

function fromString (value) {
  const parsed = toJson(value, null);
  if (isArray(parsed)) return parsed;
  return value.split(',').map(part => part.trim()).filter(Boolean);
}

// :::::: BY TYPE

// the type is a constructor (Boolean, Number, String, Date, Object, Array, Set, Map)
// or any function that converts. a function that throws or returns nullish gives the fallback
export function coerce (value, type = String, fallback) {
  if (isNullish(value)) return fallback;

  switch (type) {
    case Array   : return toArray   (value);
    case Boolean : return toBoolean (value, Boolean(fallback));
    case Date    : return toDate    (value, fallback);
    case Map     : return toMap     (value);
    case Number  : return toNumber  (value, fallback);
    case Object  : return toJson    (value, fallback);
    case Set     : return toSet     (value);
    case String  : return toString  (value, fallback);
  }

  if (!isFn(type)) return value;
  try   { return type(value) ?? fallback; }
  catch { return fallback; }
}

export {
  toBoolean as toBool,
  toJson    as toJSON,
};

export default coerce;
