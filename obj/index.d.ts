// @pulgasari/obj - type declarations

export type Dict = Record<PropertyKey, any>;

/** resolved location of a dot-path inside an object. */
export interface PathTarget {
  target: Dict;
  key: string;
  value: unknown;
}

// :::::: HELPERS

export function isObject(value: unknown): value is object;
export function isPlainObject(value: unknown): value is Record<PropertyKey, unknown>;

// :::::: CORE / METHODS

/** structuredClone when available, otherwise a JSON round-trip. */
export function deepClone<T>(value: T): T;

/** recursively merges plain-object sources into target (mutates and returns target). */
export function deepMerge<T extends Dict>(target: T, ...sources: Dict[]): T & Dict;

/** resolves a dot-path to its parent target, final key and current value. */
export function resolvePath(object: Dict, dotKey: string): PathTarget;

export function getByPath(object: Dict, path: string): any;
export function hasPath(object: Dict, path: string): boolean;
export function setByPath<T extends Dict>(object: T, path: string, value: unknown): T;
export function deleteByPath<T extends Dict>(object: T, path: string): T;
/** flips a boolean or an 'on'/'off' string at the given path. */
export function toggleByPath<T extends Dict>(object: T, path: string): T;

export function assign<T extends Dict>(target: T, ...sources: Dict[]): T & Dict;
/** shallow-per-level merge via entries (mutates and returns target). */
export function merge<T extends Dict>(target: T, ...sources: Dict[]): T & Dict;
/** returns a shallow copy without the given keys. */
export function dropByKey<T extends Dict>(object: T, ...keys: PropertyKey[]): Partial<T>;

// :::::: TRANSFORM

export function transformKeys(
  object: Dict,
  ...fns: Array<(key: string, value: any) => string>
): Record<string, any>;

export function transformValues(
  object: Dict,
  ...fns: Array<(value: any, key: string) => any>
): Record<string, any>;

// :::::: CONVERSION

export function toEntries(object: Dict): Array<[string, any]>;
export function toKeys(object: Dict): string[];
export function toValues(object: Dict): any[];

// :::::: OBJ SUGAR

/** chain returned by obj(object): known methods run against the object, everything else reads the property. */
export interface ObjChain {
  assign(...sources: Dict[]): Dict;
  deleteByPath(path: string): Dict;
  dropByKey(...keys: PropertyKey[]): Dict;
  getByPath(path: string): any;
  hasPath(path: string): boolean;
  merge(...sources: Dict[]): Dict;
  resolvePath(dotKey: string): PathTarget;
  setByPath(path: string, value: unknown): Dict;
  toggleByPath(path: string): Dict;
  transformKeys(...fns: Array<(key: string, value: any) => string>): Record<string, any>;
  transformValues(...fns: Array<(value: any, key: string) => any>): Record<string, any>;
  toEntries(): Array<[string, any]>;
  toKeys(): string[];
  toValues(): any[];
  [key: string]: any;
}

export function obj(object: any): ObjChain;
export default obj;
