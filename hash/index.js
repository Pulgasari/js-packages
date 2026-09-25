// @ts-self-types="./index.d.ts"
// @pulgasari/hash

// small, fast, non cryptographic hashes for cache keys, ids and change detection.
// a value that is not a string is serialised with sorted keys first, so two
// objects with the same content hash alike whatever their key order.

// :::::: SERIALISE

// json like, keys sorted. a string on its own stays as it is, inside a structure
// it is quoted, so 'a' and ['a'] or { a: '1' } and { a: 1 } never collide
export const stableStringify = (value) => typeof value === 'string' ? value : serialise(value);

const serialise = (value) =>
    value === undefined                          ? 'undefined'
  : value === null || typeof value !== 'object'  ? typeof value === 'bigint' ? `${value}n` : JSON.stringify(value) ?? String(value)
  : value instanceof Date                        ? `Date(${value.toISOString()})`
  : Array.isArray(value)                         ? `[${value.map(serialise).join(',')}]`
  : value instanceof Map                         ? `Map{${[...value].map(([key, item]) => `${serialise(key)}:${serialise(item)}`).sort().join(',')}}`
  : value instanceof Set                         ? `Set[${[...value].map(serialise).sort().join(',')}]`
  : `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${serialise(value[key])}`).join(',')}}`;

const textOf = (value) => typeof value === 'string' ? value : serialise(value);

// :::::: HASH

// djb2, 32 bit. the cheapest, fine for a few thousand keys
export const hash = (value) => {
  const text = textOf(value);
  let result = 5381;
  for (let index = text.length; index;) result = (result * 33) ^ text.charCodeAt(--index);
  return result >>> 0;
};

// cyrb53, 53 bit. far fewer collisions, for ids that have to stay unique
export const hash53 = (value, seed = 0) => {
  const text = textOf(value);
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let index = 0; index < text.length; index++) {
    const char = text.charCodeAt(index);
    h1 = Math.imul(h1 ^ char, 2654435761);
    h2 = Math.imul(h2 ^ char, 1597334677);
  }
  h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

// the same as short base36 strings, for keys and file names
export const
hashKey   = (value)       => hash(value).toString(36),
hash53Key = (value, seed) => hash53(value, seed).toString(36);

export default hash;
