// @pulgasari/hash - type declarations

/** a string stays as it is, anything else is serialised json like with sorted keys. */
export function stableStringify(value: unknown): string;

/** djb2, 32 bit unsigned. */
export function hash(value: unknown): number;
/** cyrb53, 53 bit, far fewer collisions. */
export function hash53(value: unknown, seed?: number): number;

/** `hash()` as a base36 string. */
export function hashKey(value: unknown): string;
/** `hash53()` as a base36 string. */
export function hash53Key(value: unknown, seed?: number): string;

export default hash;
