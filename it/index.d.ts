// @pulgasari/it - type declarations

/**
 * what an item is matched against:
 * `undefined` anything, a function a predicate, a RegExp a matching string, a Set or an
 * array one of their values / patterns, a plain object every key against its own pattern,
 * anything else the same value.
 */
export type Pattern<T = unknown> =
  | undefined
  | ((item: T) => unknown)
  | RegExp
  | Set<unknown>
  | Array<Pattern<T>>
  | (T extends object ? { [K in keyof T]?: Pattern<T[K]> } : never)
  | Record<PropertyKey, unknown>
  | string | number | boolean | bigint | symbol | null;

/** a key of the items or a function of one. */
export type Getter<T, R = unknown> = keyof T | ((item: T) => R);

export type Direction = 'asc' | 'desc';

/** a key or a function, a list of them (ascending each), or `{ key: direction }` in order. */
export type Sort<T> = Getter<T> | Array<Getter<T>> | Partial<Record<keyof T, Direction>>;

/** a real array with a query vocabulary. lists it returns are an `It` again. */
export class It<T> extends Array<T> {
  /** all items that match. */
  where (pattern?: Pattern<T>): It<T>;
  /** all items that do not match. */
  without (pattern?: Pattern<T>): It<T>;
  /** the first item that matches. */
  one (pattern?: Pattern<T>): T | undefined;
  /** is there an item that matches. */
  has (pattern?: Pattern<T>): boolean;
  /** do all items match. */
  all (pattern?: Pattern<T>): boolean;
  /** the value of a key, or of a function, of every item. */
  pluck<K extends keyof T> (key: K): It<T[K]>;
  pluck<R> (fn: (item: T) => R): It<R>;
  /** a plain object by a key or a function, the last item of a key wins. */
  keyBy (key: Getter<T, PropertyKey>): Record<PropertyKey, T>;
  /** case insensitive text search over fields, over the items without fields. an empty query finds everything. */
  search (query?: string | null, fields?: Getter<T> | Array<Getter<T>>): It<T>;
  /** a sorted copy. strings case and accent insensitive, numbers in them by value, nullish last. */
  sortBy (sort: Sort<T>, direction?: Direction): It<T>;

  filter (fn: (item: T, index: number, list: It<T>) => unknown): It<T>;
  map<R> (fn: (item: T, index: number, list: It<T>) => R): It<R>;
  slice (start?: number, end?: number): It<T>;
}

/** a pattern as a predicate, for the native methods as well: `list.filter(match({ id }))`. */
export function match<T = unknown> (pattern?: Pattern<T>): (item: T) => boolean;

/** any iterable or array-like as an `It`, nullish is an empty list. */
export function it<T> (iterable?: Iterable<T> | ArrayLike<T> | null): It<T>;

export default it;
