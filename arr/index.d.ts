// @pulgasari/arr - type declarations

export type Criteria<T> = Partial<Record<keyof T, unknown>> & Record<PropertyKey, unknown>;
export type Direction   = 'asc' | 'desc';

/** items matching none of the criteria (strict equality per key). */
export function dropByAnyCriteria<T>(array: T[], criteria?: Criteria<T>): T[];
/** items not matching all of the criteria. */
export function dropByCriteria<T>(array: T[], criteria?: Criteria<T>): T[];
/** items matching at least one of the criteria. */
export function filterByAnyCriteria<T>(array: T[], criteria?: Criteria<T>): T[];
/** items matching all of the criteria. */
export function filterByCriteria<T>(array: T[], criteria?: Criteria<T>): T[];
export function findByAnyCriteria<T>(array: T[], criteria?: Criteria<T>): T | undefined;
export function findByCriteria<T>(array: T[], criteria?: Criteria<T>): T | undefined;

/** the value of `key` of every item. */
export function mapBy<T, K extends keyof T>(array: T[], key: K): Array<T[K]>;
export function mapValues<T, R>(array: T[], fn: (item: T, index: number, array: T[]) => R): R[];

/** a sorted copy. */
export function sortByKey<T>(array: T[], key: keyof T, direction?: Direction): T[];
/** a sorted copy, `['a', 'b']` ascending by each or `{ a: 'desc', b: 'asc' }`. */
export function sortByKeys<T>(array: T[], keys: Array<keyof T> | Partial<Record<keyof T, Direction>>): T[];
export function sortBy<T>(array: T[], sort: keyof T | Array<keyof T> | Partial<Record<keyof T, Direction>>, direction?: Direction): T[];

/** the helpers above bound to one array, everything else reads from it. */
export interface ArrChain<T> {
  dropByAnyCriteria(criteria?: Criteria<T>): T[];
  dropByCriteria(criteria?: Criteria<T>): T[];
  filterByAnyCriteria(criteria?: Criteria<T>): T[];
  filterByCriteria(criteria?: Criteria<T>): T[];
  findByAnyCriteria(criteria?: Criteria<T>): T | undefined;
  findByCriteria(criteria?: Criteria<T>): T | undefined;
  mapBy<K extends keyof T>(key: K): Array<T[K]>;
  mapValues<R>(fn: (item: T, index: number, array: T[]) => R): R[];
  sortBy(sort: keyof T | Array<keyof T> | Partial<Record<keyof T, Direction>>, direction?: Direction): T[];
  sortByKey(key: keyof T, direction?: Direction): T[];
  sortByKeys(keys: Array<keyof T> | Partial<Record<keyof T, Direction>>): T[];
  [key: string]: any;
}

export function arr<T>(array: T[]): ArrChain<T> & T[];
export default arr;
