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

export function isBigInt(value: unknown): value is bigint;
export function isBoolean(value: unknown): value is boolean;
export function isFn(value: unknown): value is (...args: any[]) => any;
export function isString(value: unknown): value is string;
export function isSymbol(value: unknown): value is symbol;
export function isUndefined(value: unknown): value is undefined;
export function isNull(value: unknown): value is null;
export function isNullish(value: unknown): value is null | undefined;
export function isDefined<T>(value: T): value is NonNullable<T>;
export function isPrimitive(value: unknown): boolean;

// :::::: NUMBERS

export function isNan(value: unknown): boolean;
export function isInteger(value: unknown): value is number;
export function isFinite(value: unknown): value is number;
export function isNumber(value: unknown): value is number;
export function isFloat(value: unknown): value is number;
export function isEven(value: unknown): value is number;
export function isOdd(value: unknown): value is number;
export function isPositive(value: unknown): value is number;
export function isNegative(value: unknown): value is number;
export function isZero(value: unknown): value is 0;
export function isNumericString(value: unknown): value is string;
export function isNumeric(value: unknown): boolean;
export function isYear(value: unknown): boolean;

// :::::: OBJECTS & STRUCTURES

export function isArray(value: unknown): value is unknown[];
export function isObject(value: unknown): value is Record<PropertyKey, unknown>;
export function isPlainObject(value: unknown): value is Record<PropertyKey, unknown>;
export function isMap(value: unknown): value is Map<unknown, unknown>;
export function isSet(value: unknown): value is Set<unknown>;
export function isRegExp(value: unknown): value is RegExp;
export function isPromise(value: unknown): value is Promise<unknown>;
export function isThenable(value: unknown): value is PromiseLike<unknown>;
export function isError(value: unknown): value is Error;
export function isBuffer(value: unknown): boolean;
export function isDate(value: unknown): value is Date;
export function isDateString(value: unknown): value is string;
export function isIterable(value: unknown): value is Iterable<unknown>;
export function isAsyncIterable(value: unknown): value is AsyncIterable<unknown>;
export function isCollection(value: unknown): boolean;

// :::::: DOM & ENVIRONMENT
// typed as plain boolean tests so the package stays free of the dom lib.

export function isDocument(value: unknown): boolean;
export function isElement(value: unknown): boolean;
export function isElementish(value: unknown): boolean;
export function isFragment(value: unknown): boolean;
export function isNode(value: unknown): boolean;
export function isWindow(value: unknown): boolean;
export function isCanvas(value: unknown): boolean;
export function isRealNodeList(value: unknown): boolean;
export function isNodeList(value: unknown): boolean;
export function isExternalUrl(value: unknown): boolean;
export function isInternalUrl(value: unknown): boolean;

// :::::: DOM SHAPES

export function isEDO(value: unknown): boolean;
export function isHTML(value: unknown): boolean;
export function isIdLike(value: unknown): boolean;
export function isCheckable(value: unknown): boolean;
export function isMultiSelect(value: unknown): boolean;

// :::::: EMPTINESS & LOGIC

export function isBlank(value: unknown): boolean;
export function isEmptyString(value: unknown): boolean;
export function isEmptyArray(value: unknown): boolean;
export function isEmptyMap(value: unknown): boolean;
export function isEmptySet(value: unknown): boolean;
export function isEmptyObject(value: unknown): boolean;
export function isEmpty(value: unknown): boolean;
export function isFilled(value: unknown): boolean;
export function isFalsy(value: unknown): boolean;
export function isTruthy(value: unknown): boolean;

// :::::: FORMATS & PARSING

export function isAlphaNumeric(value: unknown): boolean;
export function isBase64(value: unknown): boolean;
export function isEmail(value: unknown): boolean;
export function isHexColor(value: unknown): boolean;
export function isUUID(value: unknown): boolean;
export function isJSON(value: unknown): boolean;
export function isURL(value: unknown): boolean;

// :::::: STRING CASES

export function isLowerCase(value: unknown): boolean;
export function isUpperCase(value: unknown): boolean;
export function isCamelCase(value: unknown): boolean;
export function isConstantCase(value: unknown): boolean;
export function isKebabCase(value: unknown): boolean;
export function isPascalCase(value: unknown): boolean;
export function isSnakeCase(value: unknown): boolean;

// :::::: LISTS

export function isEntriesList(value: unknown): value is Array<[unknown, unknown]>;
export function isObjectList(value: unknown): value is Array<Record<PropertyKey, unknown>>;
export function isStringList(value: unknown): value is string[];
