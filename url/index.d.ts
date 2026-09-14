// @pulgasari/url - type declarations

/** property-access view over the query parameters; string keys read/write params, nullish deletes. */
export interface QueryView {
  [key: string]: string | undefined;
}

/** path segment handling on a Url; reads and writes the live URL instance. */
export interface UrlPath {
  segments: string[];
  /** appends values as slugified segments. */
  append(...values: unknown[]): this;
  /** prepends values as slugified segments. */
  prepend(...values: unknown[]): this;
  /** like append, but skips segments already present. */
  add(...values: unknown[]): this;
  /** removes every occurrence of the given segments. */
  remove(...values: unknown[]): this;
  has(value: unknown): boolean;
  toArray(): string[];
  toString(): string;
}

/** query parameter handling on a Url. */
export interface UrlQuery {
  readonly params: URLSearchParams;
  readonly values: QueryView;
  has(key: string): boolean;
  get(key: string): string | null;
  getAll(key: string): string[];
  /** sets a parameter; a nullish value removes it. */
  set(key: string, value: unknown): this;
  /** sets many parameters at once. */
  assign(values: Record<string, unknown>): this;
  delete(key: string): this;
  clear(): this;
  toObject(): Record<string, string>;
  toString(): string;
  [Symbol.iterator](): IterableIterator<[string, string]>;
}

/** thin, chainable wrapper around the native URL / URLSearchParams API. */
export class Url {
  constructor(input?: string | URL | { toString(): string }, base?: string | URL);
  instance: URL;
  path: UrlPath;
  query: UrlQuery;
  get full(): string;
  set full(value: string);
  get hash(): string;
  set hash(value: string);
  get origin(): string;
  clone(): Url;
  toString(): string;
}

export function url(input?: string | URL | { toString(): string }, base?: string | URL): Url;
