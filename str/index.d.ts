// @pulgasari/str - type declarations

/** a single-argument transform; nullish input is coerced to ''. */
export type Transform = (value?: unknown) => string;

export const capitalize: Transform;
export const toLowerCase: Transform;
export const toUpperCase: Transform;
export const toCamelCase: Transform;
export const toConstantCase: Transform;
export const toKebabCase: Transform;
export const toPascalCase: Transform;
export const toSlugCase: Transform;
export const toSnakeCase: Transform;
export const toTitleCase: Transform;
export const trim: Transform;
export const trimEnd: Transform;
export const trimStart: Transform;
export const unquote: Transform;

export function startsWith(value: unknown, ...prefixes: string[]): boolean;
export function endsWith(value: unknown, ...suffixes: string[]): boolean;

/** the wrapped string returned by str(value); methods run against that string. */
export interface StrChain {
  capitalize(): string;
  toLowerCase(): string;
  toUpperCase(): string;
  toCamelCase(): string;
  toConstantCase(): string;
  toKebabCase(): string;
  toPascalCase(): string;
  toSlugCase(): string;
  toSnakeCase(): string;
  toTitleCase(): string;
  trim(): string;
  trimEnd(): string;
  trimStart(): string;
  unquote(): string;
  startsWith(...prefixes: string[]): boolean;
  endsWith(...suffixes: string[]): boolean;
  toString(): string;
  valueOf(): string;
  /** unknown members fall through to native String methods/properties. */
  [key: string]: unknown;
}

/** dual-use: str(value) returns a chain, str.method(value) runs a transform directly. */
export interface Str {
  (value?: unknown): StrChain;
  capitalize(value?: unknown): string;
  toLowerCase(value?: unknown): string;
  toUpperCase(value?: unknown): string;
  toCamelCase(value?: unknown): string;
  toConstantCase(value?: unknown): string;
  toKebabCase(value?: unknown): string;
  toPascalCase(value?: unknown): string;
  toSlugCase(value?: unknown): string;
  toSnakeCase(value?: unknown): string;
  toTitleCase(value?: unknown): string;
  trim(value?: unknown): string;
  trimEnd(value?: unknown): string;
  trimStart(value?: unknown): string;
  unquote(value?: unknown): string;
  startsWith(value: unknown, ...prefixes: string[]): boolean;
  endsWith(value: unknown, ...suffixes: string[]): boolean;
}

export const str: Str;
export default str;
