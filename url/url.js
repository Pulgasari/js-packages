// @ts-self-types="./url.d.ts"
// @pulgasari/url

// :::::: INTERNAL

const toSlug = (value) => String(value)
  .replace(/ß/g, 'ss')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase();

const DEFAULT_BASE = 'http://localhost';
const isNullish    = (value)  => typeof value === 'undefined' || typeof value === 'null';
const isSymbol     = (value)  => typeof value === 'symbol';
const arrayfied    = (value)  => Array.isArray(value) ? value : [value];
const currentHref  = ()       => (typeof window !== 'undefined' ? window.location.href : DEFAULT_BASE);    
const toSlugs      = (values) => arrayfied(values).flat(Infinity).map(toSlug);

// :::::: MAIN

class UrlPath {
  #url;

  constructor (url) { this.#url = url; }

  get segments ()         { return this.#url.pathname.split('/').filter(Boolean); }
  set segments (segments) { this.#url.pathname = `/${segments.join('/')}`; }
  
  add (...values) {
    const segments = this.segments;

    for (const segment of toSlugs(values)) {
      if (!segments.includes(segment)) segments.push(segment);
    }

    this.segments = segments;
    return this;
  }
  
  remove (...values) {
    const removable = new Set(toSlugs(values));
    this.segments = this.segments.filter(segment => !removable.has(segment));
    return this;
  }
  
  append   (...values) { this.segments = [...this.segments, ...toSlugs(values)]; return this; }
  prepend  (...values) { this.segments = [...toSlugs(values), ...this.segments]; return this; }
  has      (value)     { return this.segments.includes(toSlug(value)); }
  toArray  ()          { return this.segments; }
  toString ()          { return this.#url.pathname; }
}

const createQueryView = (url) => {
  const params = () => url.searchParams;

  return new Proxy (Object.create(null), {
    get (_target, key) { // keys are always strings, so symbols can never be data.
      if (key === Symbol.toPrimitive) return () => url.search;
      if (isSymbol(key))              return undefined;

      return params().get(key) ?? undefined;
    },

    set (_target, key, value) {
      if (isSymbol(key)) return false;

      if (isNullish(value)) params().delete(key);
      else params().set(key, String(value));

      return true;
    },

    has: (_target, key) => !isSymbol(key) && params().has(key),

    deleteProperty (_target, key) { params().delete(key); return true; },

    ownKeys: () => [...new Set(params().keys())],

    getOwnPropertyDescriptor: (_target, key) =>
      !isSymbol(key) && params().has(key)
        ? { value: params().get(key), configurable: true, enumerable: true, writable: true }
        : undefined,
  });
};

class UrlQuery {
  #url; #values;

  constructor (url) { this.#url = url; }

  get params () { return this.#url.searchParams; } // live params of the underlying URL
  get values () { return (this.#values ??= createQueryView(this.#url)); } // collision-free property view      
  
  set (key, value) {
    if (isNullish(value)) this.params.delete(key);
    else this.params.set(key, String(value));

    return this;
  }

//set (key, value) { isNullish(value) ? this.delete(key) : this.params.set(key, String(value)); return this; }
  
  assign   (values) { for (const [key, value] of Object.entries(values)) this.set(key, value); return this; }         
//assign   (values) { for (const key of values) this.set(key, values[key]); return this; }
  clear    ()       { this.#url.search = ''; return this; }
  delete   (key)    { this.params.delete(key); return this; }
  has      (key)    { return this.params.has    (key); }
  get      (key)    { return this.params.get    (key); }
  getAll   (key)    { return this.params.getAll (key); } // all values of a repeated parameter      
  toObject ()       { return Object.fromEntries(this.params); }
  toString ()       { return this.#url.search; }
  
  [Symbol.iterator]() { return this.params[Symbol.iterator](); }
}

class Url {
  constructor (input, base = currentHref()) {
    this.instance = new URL(input?.toString() ?? base, base);
    this.path     = new UrlPath  (this.instance);
    this.query    = new UrlQuery (this.instance);
  }

  get full   () { return this.instance.href; }
  get hash   () { return this.instance.hash; }
  get origin () { return this.instance.origin; }

  set full (value) { this.instance.href = new URL(value, this.instance).href; }
  set hash (value) { this.instance.hash = value; }

  clone    = () => new Url(this.full);
  toString = () =>         this.full;
}

// :::::: EXPORT

const url = (input, base) => new Url (input, base);

export { Url, url };
export default url;
