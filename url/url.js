// @ts-self-types="./url.d.ts"
// @pulgasari/url

// thin, chainable wrapper around the native URL / URLSearchParams API.
//   const u = url('/blog?page=2');
//   u.path.append('My Post');      // -> /blog/my-post
//   u.query.set('page', null);     // -> removes ?page
//   u.toString();                  // -> https://example.com/blog/my-post

// :::::: IMPORT

import str from '@pulgasari/str';

// :::::: INTERNAL

const DEFAULT_BASE = 'http://localhost';

const isNullish = sth => typeof sth === 'undefined' || typeof sth === 'null';
const isSymbol  = sth => typeof sth === 'symbol';

const arrayfied   = (value)  => Array.isArray(value) ? value : [value];
const toSlugs     = (values) => arrayfied(values).flat(Infinity).map(str.toSlugCase);
const currentHref = () => (typeof window !== 'undefined' ? window.location.href : DEFAULT_BASE);    

// :::::: MAIN

class UrlPath {
  #url;

  constructor (url) {
    this.#url = url;
  }

  get segments ()         { return this.#url.pathname.split('/').filter(Boolean); }
  set segments (segments) { this.#url.pathname = `/${segments.join('/')}`; }
  
  append  (...values) { this.segments = [...this.segments, ...toSlugs(values)]; return this; }
  prepend (...values) { this.segments = [...toSlugs(values), ...this.segments]; return this; }

  /** Like append(), but skips segments that are already present. */
  add (...values) {
    const segments = this.segments;

    for (const segment of toSlugs(values)) {
      if (!segments.includes(segment)) segments.push(segment);
    }

    this.segments = segments;
    return this;
  }

  /** Removes every occurrence of the given segments. */
  remove (...values) {
    const removable = new Set(toSlugs(values));
    this.segments = this.segments.filter((segment) => !removable.has(segment));
    return this;
  }

  has      (value) { return this.segments.includes(str.toSlugCase(value)); }
  toArray  ()      { return this.segments; }
  toString ()      { return this.#url.pathname; }
}

/**
 * Property-access view over the query parameters.
 *
 * The proxy target is an empty null-prototype object: it carries no methods
 * and no inherited members, so every string key is data and nothing can be
 * shadowed. The API lives on UrlQuery, not in here.
 *
 *   const q = url('?page=2').query.values;
 *   q.page;          // '2'
 *   q.sort = 'asc';  // sets ?sort=asc
 *   q.page = null;   // removes ?page
 *   delete q.sort;
 *   'page' in q;     // false
 *   { ...q };        // { sort: 'asc' }
 */
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

    deleteProperty (_target, key) {
      params().delete(key);
      return true;
    },

    ownKeys: () => [...new Set(params().keys())],

    getOwnPropertyDescriptor: (_target, key) =>
      !isSymbol(key) && params().has(key)
        ? {
            value: params().get(key),
            writable: true,
            enumerable: true,
            configurable: true,
          }
        : undefined,
  });
};

class UrlQuery {
  #url; #values;

  constructor (url) {
    this.#url = url;
  }

  get params () { return this.#url.searchParams; } // live params of the underlying URL
  get values () { return (this.#values ??= createQueryView(this.#url)); } // collision-free property view      
  
  set (key, value) {
    if (isNullish(value)) this.params.delete(key);
    else this.params.set(key, String(value));

    return this;
  }
  
  assign (values) {
    for (const [key, value] of Object.entries(values)) this.set(key, value);
    return this;
  }

  clear    ()    { this.#url.search = ''; return this; }
  delete   (key) { this.params.delete(key); return this; }
  has      (key) { return this.params.has    (key); }
  get      (key) { return this.params.get    (key); }
  getAll   (key) { return this.params.getAll (key); } // all values of a repeated parameter      
  toObject ()    { return Object.fromEntries(this.params); }
  toString ()    { return this.#url.search; }
  
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
