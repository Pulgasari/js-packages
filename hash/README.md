# @pulgasari/hash

small, fast, non cryptographic hashes for cache keys, ids and change detection. for
anything security related use `crypto.subtle.digest()`.

## install

```sh
deno add jsr:@pulgasari/hash
```

```sh
npx jsr add @pulgasari/hash
```

## usage

```js
import { hash, hash53, hashKey, hash53Key, stableStringify } from '@pulgasari/hash';

hash('hello');                    // 32 bit, djb2
hash53('hello');                  // 53 bit, cyrb53, for ids that have to stay unique
hashKey({ b: 1, a: 2 });          // base36, e.g. for a cache key
hashKey({ a: 2, b: 1 });          // the same: keys are sorted before hashing

stableStringify({ b: [1, 'x'], a: null });   // '{"a":null,"b":[1,"x"]}'
```

a string on its own is hashed as it is. inside a structure it is quoted, so `'a'`
and `['a']`, or `{ a: '1' }` and `{ a: 1 }`, never hash alike. maps, sets and dates
are serialised by content.
