// @pulgasari/is/predicates - type declarations

/** a value test used by is(), and by the and/or/not combinators. */
export type Predicate = (value: unknown) => boolean;

// :::::: COMBINATORS

/** true when every predicate holds. */
export function and(...preds: Predicate[]): Predicate;
/** true when any predicate holds. */
export function or(...preds: Predicate[]): Predicate;
/** negates a predicate. */
export function not(pred: Predicate): Predicate;

// :::::: PRIMITIVES

/** true for a bigint. */
export function isBigInt(value: unknown): value is bigint;
/** true for `true` or `false`. */
export function isBoolean(value: unknown): value is boolean;
/** true for any function, including classes and async functions. */
export function isFn(value: unknown): value is (...args: any[]) => any;
/** true for a string primitive. */
export function isString(value: unknown): value is string;
/** true for a symbol. */
export function isSymbol(value: unknown): value is symbol;
/** true for `undefined` only. */
export function isUndefined(value: unknown): value is undefined;
/** true for `null` only. */
export function isNull(value: unknown): value is null;
/** true for `null` or `undefined`. */
export function isNullish(value: unknown): value is null | undefined;
/** true for anything but `null` and `undefined`. */
export function isDefined<T>(value: T): value is NonNullable<T>;
/** true for a primitive: string, number, bigint, boolean, symbol, null or undefined. */
export function isPrimitive(value: unknown): boolean;

// :::::: NUMBERS

/** `Number.isNaN`: true for the number `NaN` only, no coercion. */
export function isNan(value: unknown): boolean;
/** `Number.isInteger`: true for an integral number, no coercion. */
export function isInteger(value: unknown): value is number;
/** `Number.isFinite`: true for a finite number, no coercion. */
export function isFinite(value: unknown): value is number;
/** true for a finite number. `NaN` and `Infinity` are rejected. */
export function isNumber(value: unknown): value is number;
/** true for a finite number with a fractional part. */
export function isFloat(value: unknown): value is number;
/** true for an even integer. */
export function isEven(value: unknown): value is number;
/** true for an odd integer, negatives included. */
export function isOdd(value: unknown): value is number;
/** true for a finite number greater than 0. */
export function isPositive(value: unknown): value is number;
/** true for a finite number less than 0. */
export function isNegative(value: unknown): value is number;
/** true for `0` (and `-0`). */
export function isZero(value: unknown): value is 0;
/** true for a non-blank string that `Number()` parses, e.g. `'42'`, `' 1.5 '`. */
export function isNumericString(value: unknown): value is string;
/** true for a finite number or a numeric string. */
export function isNumeric(value: unknown): boolean;
/** true for a four-digit number or numeric string, e.g. `2024` or `'2024'`. */
export function isYear(value: unknown): boolean;

// :::::: OBJECTS & STRUCTURES

/** `Array.isArray`. */
export function isArray(value: unknown): value is unknown[];
/** true for any non-null object that is not an array. class instances included. */
export function isObject(value: unknown): value is Record<PropertyKey, unknown>;
/** true for an object literal or `Object.create(null)`. class instances are rejected. */
export function isPlainObject(value: unknown): value is Record<PropertyKey, unknown>;
/** true for a `Map`. */
export function isMap(value: unknown): value is Map<unknown, unknown>;
/** true for a `Set`. */
export function isSet(value: unknown): value is Set<unknown>;
/** true for a `RegExp`. */
export function isRegExp(value: unknown): value is RegExp;
/** true for a native `Promise` instance. */
export function isPromise(value: unknown): value is Promise<unknown>;
/** true for anything with a callable `then`, native promise or not. */
export function isThenable(value: unknown): value is PromiseLike<unknown>;
/** true for an `Error` or a subclass of it. */
export function isError(value: unknown): value is Error;
/** true for a node `Buffer`. always false where `Buffer` does not exist. */
export function isBuffer(value: unknown): boolean;
/** true for a valid `Date`. an invalid date (`new Date(NaN)`) is rejected. */
export function isDate(value: unknown): value is Date;
/** true for a string `Date.parse` accepts, or a `d.m.yyyy` date. purely numeric strings are rejected: `'2024'` is a year, not a date. */
export function isDateString(value: unknown): value is string;
/** true for anything with `Symbol.iterator`, strings included. */
export function isIterable(value: unknown): value is Iterable<unknown>;
/** true for anything with `Symbol.asyncIterator`. */
export function isAsyncIterable(value: unknown): value is AsyncIterable<unknown>;
/** true for an iterable that is not a string, i.e. spreadable without falling apart into characters. */
export function isCollection(value: unknown): boolean;

// :::::: DOM & ENVIRONMENT
// typed as plain boolean tests so the package stays free of the dom lib.

/** true for a document node (`nodeType` 9). */
export function isDocument(value: unknown): boolean;
/** true for an element node (`nodeType` 1). */
export function isElement(value: unknown): boolean;
/** true for an element, a document or a fragment (`nodeType` 1, 9 or 11). */
export function isElementish(value: unknown): boolean;
/** true for a document fragment (`nodeType` 11). */
export function isFragment(value: unknown): boolean;
/** true for anything carrying a `nodeType`. */
export function isNode(value: unknown): boolean;
/** true for a window object (`v === v.window`). */
export function isWindow(value: unknown): boolean;
/** true for a `<canvas>` element. */
export function isCanvas(value: unknown): boolean;
/** true for a native `NodeList`. */
export function isRealNodeList(value: unknown): boolean;
/** true for a native `NodeList`, or an array holding nothing but nodes. */
export function isNodeList(value: unknown): boolean;
/** true for a string not starting with `location.origin`. always false without a `window`. */
export function isExternalUrl(value: unknown): boolean;
/** true for a string starting with `location.origin`. always false without a `window`. */
export function isInternalUrl(value: unknown): boolean;

// :::::: DOM SHAPES

/** true for an element descriptor object: a plain object with a `tag` or `tagName`, which is not itself a node. */
export function isEDO(value: unknown): boolean;
/** true for a string that starts with `<` once trimmed. */
export function isHTML(value: unknown): boolean;
/** true for an id selector string: starts with `#`, no whitespace or `.`. */
export function isIdLike(value: unknown): boolean;
/** true for a checkbox or radio input. */
export function isCheckable(value: unknown): boolean;
/** true for a `<select multiple>`. */
export function isMultiSelect(value: unknown): boolean;

// :::::: EMPTINESS & LOGIC

/** true for `null`, `undefined` or `''`. */
export function isBlank(value: unknown): boolean;
/** true for `''`. */
export function isEmptyString(value: unknown): boolean;
/** true for an array without items. */
export function isEmptyArray(value: unknown): boolean;
/** true for a `Map` without entries. */
export function isEmptyMap(value: unknown): boolean;
/** true for a `Set` without entries. */
export function isEmptySet(value: unknown): boolean;
/** true for a plain object without own enumerable keys. */
export function isEmptyObject(value: unknown): boolean;
/** true for nullish, or an empty string, array, map, set or plain object. `0` and `false` are not empty. */
export function isEmpty(value: unknown): boolean;
/** negation of `isEmpty`. */
export function isFilled(value: unknown): boolean;
/** true for any falsy value. */
export function isFalsy(value: unknown): boolean;
/** true for any truthy value. */
export function isTruthy(value: unknown): boolean;

// :::::: FORMATS & PARSING

/** true for a non-empty string of ascii letters and digits only. */
export function isAlphaNumeric(value: unknown): boolean;
/** true for a padded base64 string. the empty string passes. */
export function isBase64(value: unknown): boolean;
/** true for a string shaped like `local@domain.tld`. a shape check, not rfc 5322. */
export function isEmail(value: unknown): boolean;
/** true for a css hex color: `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa`. */
export function isHexColor(value: unknown): boolean;
/** true for a uuid of version 1 to 5. */
export function isUUID(value: unknown): boolean;
/** true for a string `JSON.parse` accepts. */
export function isJSON(value: unknown): boolean;
/** true for a string the `URL` constructor accepts, i.e. an absolute url. */
export function isURL(value: unknown): boolean;

// :::::: STRING CASES

/** true for a string equal to its lowercase form with at least one cased character, so `'123'` is rejected. */
export function isLowerCase(value: unknown): boolean;
/** true for a string equal to its uppercase form with at least one cased character, so `'123'` is rejected. */
export function isUpperCase(value: unknown): boolean;
/** true for `camelCase`: a lowercase start, then letters and digits. */
export function isCamelCase(value: unknown): boolean;
/** true for `CONSTANT_CASE`. */
export function isConstantCase(value: unknown): boolean;
/** true for `kebab-case`. */
export function isKebabCase(value: unknown): boolean;
/** true for `PascalCase`: an uppercase start, then letters and digits. */
export function isPascalCase(value: unknown): boolean;
/** true for `snake_case`. */
export function isSnakeCase(value: unknown): boolean;

// :::::: LISTS

/** true for an array of `[key, value]` pairs. */
export function isEntriesList(value: unknown): value is Array<[unknown, unknown]>;
/** true for an array holding nothing but objects (as in `isObject`). */
export function isObjectList(value: unknown): value is Array<Record<PropertyKey, unknown>>;
/** true for an array holding nothing but strings. */
export function isStringList(value: unknown): value is string[];
