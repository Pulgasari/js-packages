// @pulgasari/coerce - type declarations

/** a constructor or any converting function. */
export type Target<T = unknown> =
  | BooleanConstructor | NumberConstructor | StringConstructor | DateConstructor
  | ObjectConstructor  | ArrayConstructor  | SetConstructor    | MapConstructor
  | ((value: unknown) => T);

/**
 * converts `value` to `type`. nullish input and anything that cannot be converted
 * give the fallback, nothing throws.
 */
export function coerce<T = unknown>(value: unknown, type?: Target<T>, fallback?: T): T;

/** 'false', '0', 'no', 'off', 'null', 'undefined' are false, any other string is true, '' too. */
export function toBoolean(value: unknown, fallback?: boolean): boolean;
export function toBool(value: unknown, fallback?: boolean): boolean;
export function toNumber<F = undefined>(value: unknown, fallback?: F): number | F;
/** objects become json, nullish the fallback. */
export function toString(value: unknown, fallback?: string): string;
export function toDate<F = null>(value: unknown, fallback?: F): Date | F;
/** a string is parsed, anything else is returned as it is. */
export function toJson<T = unknown>(value: unknown, fallback?: T): T;
export function toJSON<T = unknown>(value: unknown, fallback?: T): T;

/** a json array string is parsed, any other string is split on commas. */
export function toArray<T = unknown>(value: unknown): T[];
export function toSet<T = unknown>(value: unknown): Set<T>;
/** a map, an iterable of pairs, or the entries of an object. */
export function toMap<K = unknown, V = unknown>(value: unknown): Map<K, V>;
export function toEntries(value: unknown): Array<[unknown, unknown]>;
export function toKeys(value: unknown): unknown[];

export default coerce;
