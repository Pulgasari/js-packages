// @pulgasari/it/prototype - type declarations

import type { Direction, Getter, Pattern, Sort } from './index.js';

export { match } from './index.js';

declare global {
  interface Array<T> {
    /** all items that match. */
    where (pattern?: Pattern<T>): T[];
    /** all items that do not match. */
    without (pattern?: Pattern<T>): T[];
    /** the first item that matches. */
    one (pattern?: Pattern<T>): T | undefined;
    /** is there an item that matches. */
    has (pattern?: Pattern<T>): boolean;
    /** do all items match. */
    all (pattern?: Pattern<T>): boolean;
    /** the value of a key, or of a function, of every item. */
    pluck<K extends keyof T> (key: K): Array<T[K]>;
    pluck<R> (fn: (item: T) => R): R[];
    /** a plain object by a key or a function, the last item of a key wins. */
    keyBy (key: Getter<T, PropertyKey>): Record<PropertyKey, T>;
    /** case insensitive text search over fields, over the items without fields. an empty query finds everything. */
    search (query?: string | null, fields?: Getter<T> | Array<Getter<T>>): T[];
    /** a sorted copy. strings case and accent insensitive, numbers in them by value, nullish last. */
    sortBy (sort: Sort<T>, direction?: Direction): T[];
  }
}
