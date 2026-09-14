// @ts-self-types="./index.d.ts"
// @pulgasari/str

// Helper functions for word splitting and casing
const slugify = (value) => String(value)
  .replace(/ß/g, 'ss')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase();

const upperFirst = (word) => word.charAt(0).toUpperCase() + word.slice(1);

const toWords = (value) => String(value ?? '')
  .replace(/([a-z\d])([A-Z])/g, '$1 $2')
  .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
  .replace(/[\s\-_.]+/g, ' ')
  .trim()
  .toLowerCase()
  .split(' ')
  .filter(Boolean);


export const // Standalone exportable transform functions
capitalize     = value => { const s = String(value ?? ''); return s.charAt(0).toUpperCase() + s.slice(1); },
toLowerCase    = value => String(value ?? '').toLowerCase(),
toUpperCase    = value => String(value ?? '').toUpperCase(),
toCamelCase    = value => toWords(value).map((word, index) => index ? upperFirst(word) : word).join(''),
toConstantCase = value => toWords(value).join('_').toUpperCase(),
toKebabCase    = value => toWords(value).join('-'),
toPascalCase   = value => toWords(value).map(upperFirst).join(''),
toSlugCase     = value => slugify(value),
toSnakeCase    = value => toWords(value).join('_'),
toTitleCase    = value => toWords(value).map(upperFirst).join(' '),
trim           = value => String(value ?? '').trim(),
trimEnd        = value => String(value ?? '').trimEnd(),
trimStart      = value => String(value ?? '').trimStart(),
unquote        = value => String(value ?? '').replace(/^(['"`])([\s\S]*)\1$/, '$2');

export const 
startsWith = (value, ...prefixes) => prefixes.some((prefix) => String(value ?? '').startsWith(prefix)),
  endsWith = (value, ...suffixes) => suffixes.some((suffix) => String(value ?? '').endsWith(suffix));

const methods = {
  capitalize,
  endsWith,
  startsWith,
  toLowerCase,
  toUpperCase,
  toCamelCase,
  toConstantCase,
  toKebabCase,
  toPascalCase,
  toSlugCase,
  toSnakeCase,
  toTitleCase,
  trim,
  trimEnd,
  trimStart,
  unquote,
};

/**
 * Dual-use string utility supporting both chainable str(val) calls
 * and direct static str.method(val) execution.
 */
export const str = Object.assign(
  function str (value) {
    const string = String(value ?? '');

    return new Proxy ({}, {
      get (_, prop) {
        if (prop === 'toString') return () => string;
        if (prop === 'valueOf')  return () => string;
        if (prop in methods)     return (...args) => methods[prop](string, ...args);
        
        const nativeAttribute = string[prop];
        return typeof nativeAttribute === 'function' ? nativeAttribute.bind(string) : nativeAttribute;
      }
    });
  },
  methods
);

export default str;
