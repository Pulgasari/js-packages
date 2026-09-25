// @pulgasari/arr/fp - type declarations

type Sequence<T> = T[] | string;

export function filter<T>(fn: (item: T, index: number) => unknown): (list: T[]) => T[];
export function flat(depth?: number): (list: unknown[]) => unknown[];
export function flatMap<T, R>(fn: (item: T, index: number) => R | R[]): (list: T[]) => R[];
export function map<T, R>(fn: (item: T, index: number) => R): (list: T[]) => R[];
export function reduce<T, R>(fn: (accumulator: R, item: T, index: number) => R, initial: R): (list: T[]) => R;

export function every<T>(fn: (item: T, index: number) => unknown): (list: T[]) => boolean;
export function find<T>(fn: (item: T, index: number) => unknown): (list: T[]) => T | undefined;
export function some<T>(fn: (item: T, index: number) => unknown): (list: T[]) => boolean;

export function drop(count: number): <T>(list: T[]) => T[];
export function join(separator?: string): (list: unknown[]) => string;
export function reverse<T>(list: T[]): T[];
export function sort<T>(compare?: (a: T, b: T) => number): (list: T[]) => T[];
export function take(count: number): <T>(list: T[]) => T[];
export function uniq<T>(list: T[]): T[];

export function at(index: number): <T>(sequence: Sequence<T>) => T | string | undefined;
export function concat(...values: unknown[]): <S extends Sequence<unknown>>(sequence: S) => S;
export function includes(search: unknown): (sequence: Sequence<unknown>) => boolean;
export function indexOf(search: unknown): (sequence: Sequence<unknown>) => number;
export function slice(start?: number, end?: number): <S extends Sequence<unknown>>(sequence: S) => S;
