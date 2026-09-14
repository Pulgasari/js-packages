// @ts-self-types="./CanonicalMap.d.ts"
// @pulgasari/obj/CanonicalMap

// :::::: IMPORT

import { toCamelCase, toConstantCase, toKebabCase, toPascalCase, toSlugCase, toSnakeCase } from '@pulgasari/str';

// :::::: INTERNAL

const FORMS = {
  camel    : toCamelCase,    // userProfileStatus
  constant : toConstantCase, // USER_PROFILE_STATUS
  kebab    : toKebabCase,    // user-profile-status
  pascal   : toPascalCase,   // UserProfileStatus
  slug     : toSlugCase,     // 
  snake    : toSnakeCase,    // user_profile_status
};

const toConverter = (form) => typeof form === 'function' ? form : FORMS[form];

const toEntries = (source) =>
    source == null                                  ? []
  : typeof source[Symbol.iterator] === 'function'   ? source
  : Object.entries(source);

// :::::: MAIN

class CanonicalMap extends Map {
  constructor (source, forms = ['camel', 'kebab', 'snake']) {
    super();

    this.forms     = forms.map(toConverter).filter(Boolean);
    if (!this.forms.length) this.forms = [FORMS.camel];
    this.canonical = this.forms[0];
    this.aliases   = new Map;
    this.cache     = new Map;

    for (const [key, value] of toEntries(source)) this.set(key, value);
  }

  static from (source, forms) {
    return new CanonicalMap(source, forms);
  }

  key (rawKey) {
    if (typeof rawKey !== 'string') return rawKey;

    const alias = this.aliases.get(rawKey);
    if (alias !== undefined) return alias;

    const cached = this.cache.get(rawKey);
    if (cached !== undefined) return cached;

    const key = this.canonical(rawKey);
    this.cache.set(rawKey, key);
    return key;
  }

  set (rawKey, value) {
    if (typeof rawKey !== 'string') return super.set(rawKey, value);

    const key = this.aliases.get(rawKey) ?? this.canonical(rawKey);

    if (!super.has(key)) {
      this.aliases.set(rawKey, key);
      for (const form of this.forms) this.aliases.set(form(key), key);
    }

    return super.set(key, value);
  }

  get (rawKey) { return super.get(this.key(rawKey)); }
  has (rawKey) { return super.has(this.key(rawKey)); }

  delete (rawKey) {
    const key = this.key(rawKey);
    for (const [alias, target] of this.aliases) if (target === key) this.aliases.delete(alias);
    return super.delete(key);
  }

  clear () {
    this.aliases.clear();
    this.cache.clear();
    return super.clear();
  }

  merge (source) {
    for (const [key, value] of toEntries(source)) this.set(key, value);
    return this;
  }

  toObject (form) {
    const convert = form ? toConverter(form) : null;
    const result  = {};
    for (const [key, value] of this) result[convert ? convert(key) : key] = value;
    return result;
  }
}

// :::::: EXPORT

export { CanonicalMap };
export default CanonicalMap;
