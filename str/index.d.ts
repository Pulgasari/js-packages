// @pulgasari/str - type declarations

/** a single-argument transform; nullish input is coerced to ''. */
export type Transform = (value?: unknown) => string;

/** uppercases the first character, leaves the rest: `'hello world'` -> `'Hello world'`. */
export const capitalize: Transform;
/** `String#toLowerCase`, nullish-safe. */
export const toLowerCase: Transform;
/** `String#toUpperCase`, nullish-safe. */
export const toUpperCase: Transform;
/** `'foo-bar baz'` -> `'fooBarBaz'`. splits on case changes, spaces, `-`, `_` and `.`. */
export const toCamelCase: Transform;
/** `'fooBar'` -> `'FOO_BAR'`. */
export const toConstantCase: Transform;
/** `'fooBar'` -> `'foo-bar'`. */
export const toKebabCase: Transform;
/** `'foo-bar'` -> `'FooBar'`. */
export const toPascalCase: Transform;
/** url slug: diacritics stripped, `ß` -> `ss`, non-alphanumerics collapsed to `-`: `'Größe Ä'` -> `'grosse-a'`. */
export const toSlugCase: Transform;
/** `'fooBar'` -> `'foo_bar'`. */
export const toSnakeCase: Transform;
/** `'foo-bar'` -> `'Foo Bar'`. */
export const toTitleCase: Transform;
/** `String#trim`, nullish-safe. */
export const trim: Transform;
/** `String#trimEnd`, nullish-safe. */
export const trimEnd: Transform;
/** `String#trimStart`, nullish-safe. */
export const trimStart: Transform;
/** removes one pair of matching surrounding quotes (`'`, `"` or `` ` ``): `'"x"'` -> `'x'`. */
export const unquote: Transform;

/** true when the string starts with any of the given prefixes. */
export function startsWith(value: unknown, ...prefixes: string[]): boolean;
/** true when the string ends with any of the given suffixes. */
export function endsWith(value: unknown, ...suffixes: string[]): boolean;

/** the wrapped string returned by str(value); methods run against that string. */
export interface StrChain {
  /** runs `capitalize` on the wrapped string. */
  capitalize(): string;
  /** runs `toLowerCase` on the wrapped string. */
  toLowerCase(): string;
  /** runs `toUpperCase` on the wrapped string. */
  toUpperCase(): string;
  /** runs `toCamelCase` on the wrapped string. */
  toCamelCase(): string;
  /** runs `toConstantCase` on the wrapped string. */
  toConstantCase(): string;
  /** runs `toKebabCase` on the wrapped string. */
  toKebabCase(): string;
  /** runs `toPascalCase` on the wrapped string. */
  toPascalCase(): string;
  /** runs `toSlugCase` on the wrapped string. */
  toSlugCase(): string;
  /** runs `toSnakeCase` on the wrapped string. */
  toSnakeCase(): string;
  /** runs `toTitleCase` on the wrapped string. */
  toTitleCase(): string;
  /** runs `trim` on the wrapped string. */
  trim(): string;
  /** runs `trimEnd` on the wrapped string. */
  trimEnd(): string;
  /** runs `trimStart` on the wrapped string. */
  trimStart(): string;
  /** runs `unquote` on the wrapped string. */
  unquote(): string;
  /** runs `startsWith` on the wrapped string. */
  startsWith(...prefixes: string[]): boolean;
  /** runs `endsWith` on the wrapped string. */
  endsWith(...suffixes: string[]): boolean;
  /** the wrapped string. */
  toString(): string;
  /** the wrapped string. */
  valueOf(): string;
  /** unknown members fall through to native String methods/properties. */
  [key: string]: unknown;
}

/** dual-use: str(value) returns a chain, str.method(value) runs a transform directly. */
export interface Str {
  /** wraps a value (nullish becomes `''`) for chained access. */
  (value?: unknown): StrChain;
  /** uppercases the first character, leaves the rest: `'hello world'` -> `'Hello world'`. */
  capitalize(value?: unknown): string;
  /** `String#toLowerCase`, nullish-safe. */
  toLowerCase(value?: unknown): string;
  /** `String#toUpperCase`, nullish-safe. */
  toUpperCase(value?: unknown): string;
  /** `'foo-bar baz'` -> `'fooBarBaz'`. splits on case changes, spaces, `-`, `_` and `.`. */
  toCamelCase(value?: unknown): string;
  /** `'fooBar'` -> `'FOO_BAR'`. */
  toConstantCase(value?: unknown): string;
  /** `'fooBar'` -> `'foo-bar'`. */
  toKebabCase(value?: unknown): string;
  /** `'foo-bar'` -> `'FooBar'`. */
  toPascalCase(value?: unknown): string;
  /** url slug: diacritics stripped, `ß` -> `ss`, non-alphanumerics collapsed to `-`: `'Größe Ä'` -> `'grosse-a'`. */
  toSlugCase(value?: unknown): string;
  /** `'fooBar'` -> `'foo_bar'`. */
  toSnakeCase(value?: unknown): string;
  /** `'foo-bar'` -> `'Foo Bar'`. */
  toTitleCase(value?: unknown): string;
  /** `String#trim`, nullish-safe. */
  trim(value?: unknown): string;
  /** `String#trimEnd`, nullish-safe. */
  trimEnd(value?: unknown): string;
  /** `String#trimStart`, nullish-safe. */
  trimStart(value?: unknown): string;
  /** removes one pair of matching surrounding quotes (`'`, `"` or `` ` ``): `'"x"'` -> `'x'`. */
  unquote(value?: unknown): string;
  /** true when the string starts with any of the given prefixes. */
  startsWith(value: unknown, ...prefixes: string[]): boolean;
  /** true when the string ends with any of the given suffixes. */
  endsWith(value: unknown, ...suffixes: string[]): boolean;
}

/**
 * dual-use entry point.
 *
 * @example
 * ```js
 * str.toKebabCase('fooBar');       // 'foo-bar'
 * str('fooBar').toKebabCase();     // 'foo-bar'
 * str(' x ').trim();               // 'x'
 * ```
 */
export const str: Str;
export default str;
