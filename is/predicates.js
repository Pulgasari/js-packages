// @ts-self-types="./predicates.d.ts"
// @pulgasari/is/predicates.js

export const
and = (...preds) => v => preds.every (p => p(v)),
or  = (...preds) => v => preds.some  (p => p(v)),
not = pred       => v => !pred(v);

// :::::: FACTORIES

const
// TODO:isListOf | isArray(v) && v.every(...),
isInstanceOf = constructor => v => v instanceof constructor,
isMatchOf    = regexp      => v => typeof v === 'string' && regexp.test(v),
isTypeOf     = type        => v => typeof v === type,

// property probe. reads a missing prop as undefined, never throws.
// with values: matches any of them. without: presence check.
probe = key => (...values) => values.length
  ? v => values.includes(v?.[key])
  : v => v?.[key] !== undefined;

// probes keyed by the property they read: has.nodeType(1, 9, 11).
// the proxy binds any key on first access, so nothing is listed upfront.
// the trap only runs while predicates are being defined — what a call site
// ends up holding is a plain closure, no proxy in the hot path.
const has = new Proxy({}, {
  get: (cache, key) => (cache[key] ??= probe(key)),
});

// :::::: PRIMITIVES

export const
isBigInt    = isTypeOf('bigint'),
isBoolean   = isTypeOf('boolean'),
isFn        = isTypeOf('function'),
isString    = isTypeOf('string'),
isSymbol    = isTypeOf('symbol'),
isUndefined = v => v === undefined,
isNull      = v => v === null,
isNullish   = v => v === null || v === undefined,
isDefined   = v => v !== null && v !== undefined,
isPrimitive = v => v !== Object(v),

// :::::: NUMBERS

isNan       = Number.isNaN,
isInteger   = Number.isInteger,
isFinite    = Number.isFinite,               // shadows the loose global inside this module only
isNumber    = v => typeof v === 'number' && Number.isFinite(v),
isFloat     = and(isNumber, not(Number.isInteger)),
isEven      = and(isInteger, v => v % 2 === 0),
isOdd       = and(isInteger, v => Math.abs(v % 2) === 1),
isPositive  = and(isNumber, v => v > 0),
isNegative  = and(isNumber, v => v < 0),
isZero      = v => v === 0,

isNumericString = v => isString(v) && v.trim() !== '' && !Number.isNaN(Number(v)),
isNumeric       = or(isNumber, isNumericString),
isYear          = v => (isNumber(v) || isNumericString(v)) && /^\d{4}$/.test(String(v)),

// :::::: OBJECTS & STRUCTURES

isArray  = Array.isArray,
isObject = v => v !== null && typeof v === 'object' && !isArray(v),

// prototype based: also true for Object.create(null), false for class instances.
isPlainObject = v => {
  if (v === null || typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v);
  return proto === null || proto === Object.prototype;
},

isMap      = v => v instanceof Map,
isSet      = v => v instanceof Set,
isRegExp   = v => v instanceof RegExp,
isPromise  = v => v instanceof Promise,
isThenable = v => isFn(v?.then),
isError    = v => v instanceof Error,
isBuffer   = v => typeof Buffer !== 'undefined' && Buffer.isBuffer(v),
isDate     = v => v instanceof Date && !Number.isNaN(v.getTime()),

// numeric strings are rejected on purpose: '2024' is a year, not a date.
isDateString = v => isString(v) && Number.isNaN(Number(v)) && (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(v) || !Number.isNaN(Date.parse(v))),      

isIterable      = v => isFn(v?.[Symbol.iterator]),
isAsyncIterable = v => isFn(v?.[Symbol.asyncIterator]),
isCollection    = and(isIterable, not(isString)),   // spreadable without falling apart into chars

// :::::: DOM & ENVIRONMENT

isDocument   = has.nodeType(9),
isElement    = has.nodeType(1),
isElementish = has.nodeType(1, 9, 11),
isFragment   = has.nodeType(11),
isNode       = has.nodeType(),
isWindow     = v => v != null && v === v.window,
isCanvas     = and(isElement, has.tagName('CANVAS')),

isRealNodeList = v => Object.prototype.toString.call(v) === '[object NodeList]',
isNodeList     = v => isRealNodeList(v) || (isArray(v) && v.every(isNode)),

isExternalUrl = v => isString(v) && typeof window !== 'undefined' && !v.startsWith(window.location.origin),
isInternalUrl = v => isString(v) && typeof window !== 'undefined' &&  v.startsWith(window.location.origin),

// :::::: DOM SHAPES

isEDO    = v => isObject(v) && !isElementish(v) && !!(v.tag || v.tagName),
isHTML   = v => isString(v) && v.trim().startsWith('<'),
isIdLike = v => isString(v) && v.charCodeAt(0) === 35 && !/[\s.]/.test(v),

isCheckable   = has.type('checkbox', 'radio'),
isMultiSelect = and(has.tagName('SELECT'), v => v.multiple === true),

// :::::: EMPTINESS & LOGIC

isBlank       = v => isNullish(v) || v === '',
isEmptyString = and (isString     , v => v.length === 0),
isEmptyArray  = and (isArray      , v => v.length === 0),
isEmptyMap    = and (isMap        , v => v.size   === 0),
isEmptySet    = and (isSet        , v => v.size   === 0),
isEmptyObject = and (isPlainObject, v => Object.keys(v).length === 0),

// nullish counts as empty, 0 and false do not.
isEmpty  = or(isNullish, isEmptyString, isEmptyArray, isEmptyMap, isEmptySet, isEmptyObject),
isFilled = not(isEmpty),

isFalsy  = v =>  !v,
isTruthy = v => !!v,

// :::::: FORMATS & PARSING

isAlphaNumeric = isMatchOf(/^[a-z0-9]+$/i),
isBase64       = isMatchOf(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
isEmail        = isMatchOf(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
isHexColor     = isMatchOf(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i),
isUUID         = isMatchOf(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),

isJSON = v => { if (!isString(v)) return false; try { JSON.parse(v); return true; } catch { return false; } },
isURL  = v => { if (!isString(v)) return false; try { new URL(v);    return true; } catch { return false; } },    

// :::::: STRING CASES

// requires at least one cased character, so '123' is neither lower nor upper.
isLowerCase = v => isString(v) && v === v.toLowerCase() && v !== v.toUpperCase(),
isUpperCase = v => isString(v) && v === v.toUpperCase() && v !== v.toLowerCase(),

isCamelCase    = isMatchOf(/^[a-z][a-zA-Z0-9]*$/),
isConstantCase = isMatchOf(/^[A-Z0-9]+(?:_[A-Z0-9]+)*$/),
isKebabCase    = isMatchOf(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
isPascalCase   = isMatchOf(/^[A-Z][a-zA-Z0-9]*$/),
isSnakeCase    = isMatchOf(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),

// :::::: LISTS

isEntriesList = v => isArray(v) && v.every(item => isArray(item) && item.length === 2),
isObjectList  = v => isArray(v) && v.every(isObject),
isStringList  = v => isArray(v) && v.every(isString);
