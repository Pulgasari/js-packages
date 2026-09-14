// @pulgasari/obj/CanonicalMap - type declarations

/** built-in case forms a key can be normalized to. */
export type CaseForm = "camel" | "constant" | "kebab" | "pascal" | "slug" | "snake";

/** a custom key converter, or a built-in form name. */
export type Form = CaseForm | ((key: string) => string);

export type CanonicalSource<V> =
  | Iterable<readonly [string, V]>
  | Record<string, V>
  | null
  | undefined;

/**
 * a Map that treats different case forms of a key (camel/kebab/snake/…) as the
 * same key. the first form is canonical; lookups accept any registered form.
 */
export class CanonicalMap<V = unknown> extends Map<string, V> {
  forms: Array<(key: string) => string>;
  canonical: (key: string) => string;
  aliases: Map<string, string>;
  cache: Map<string, string>;

  constructor(source?: CanonicalSource<V>, forms?: Form[]);

  static from<V = unknown>(source?: CanonicalSource<V>, forms?: Form[]): CanonicalMap<V>;

  /** resolves a raw key to its canonical key. */
  key(rawKey: string): string;

  set(rawKey: string, value: V): this;
  get(rawKey: string): V | undefined;
  has(rawKey: string): boolean;
  delete(rawKey: string): boolean;
  clear(): void;

  merge(source: CanonicalSource<V>): this;

  /** plain object of the entries, optionally with keys converted to a form. */
  toObject(form?: Form): Record<string, V>;
}

export default CanonicalMap;
