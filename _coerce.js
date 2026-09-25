// @pulgasari/coerce

import { is, isArray, isBool, isFn, isNullish, isNumber } from '@pulgasari/is';

const FALSY    = new Set(['false', '0', 'no', 'off', 'null', 'undefined']);
const isFalsyX = value => FALSY.has(String(value).trim().toLowerCase());

const parseNumber = (value, fallback) => {
  const number = isNumber(value) ? value : parseFloat(value);
  return Number.isFinite(number) ? number : fallback;
};

const coerce = (value, type = String, fallback) => {
  if (isNullish(value)) return fallback;
  
  if (type === Boolean) return toBoolean   (value, Boolean(fallback));
  if (type === Number)  return parseNumber (value, fallback);
  if (type === String)  return String      (value);
  if (type === Date)    return toDate      (value, fallback);
  if (type === Object)  return toJson      (value, fallback);

  if (type === Array) {
    const parsed = toJSON(value, null);
    if (isArray(parsed)) return parsed;
    return isString(value)
      ? value.split(',').map(part => part.trim()).filter(Boolean)
      : toArray(value);
  }

  if (isFn(type)) {
    try   { return type(value) ?? fallback; }
    catch { return fallback; }
  }

  return value;
};

const toArray = (value) =>
    isArray    (value) ? value
  : isNullish  (value) ? []
  : isString   (value) ? [value]
  : isIterable (value) ? Array.from(value)
  : [value];

const toBool = (value, fallback = false) => {
  : isBool    (value) ? value
  : isNullish (value) ? fallback
  : isNumber  (value) ? value !== 0
  : !isFalsyX (value);

const toDate = (value, fallback = null) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const toJSON = (value, fallback) => {
  if (!isString(value)) return value ?? fallback;
  
  try   { return JSON.parse(value); }
  catch { return fallback; }
};

/* eigtl fehlen noch:
toEntries
toKeys
toMap
toSet
toString
*/

// :::::: EXPORT

export {
  coerce,
  toArray,
  toBool,
  toDate,
  toJSON,
};
