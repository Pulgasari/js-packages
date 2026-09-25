# @pulgasari/coerce

turns loose input (attribute strings, form values, query params, json) into the type
a caller asked for. nothing throws, what cannot be converted is the fallback.

## install

```sh
deno add jsr:@pulgasari/coerce
```

```sh
npx jsr add @pulgasari/coerce
```

## usage

```js
import { coerce, toArray, toBoolean, toNumber } from '@pulgasari/coerce';

coerce('42', Number);             // 42
coerce('abc', Number, 0);         // 0
coerce('off', Boolean);           // false
coerce('', Boolean);              // true, like a boolean html attribute
coerce('a, b', Array);            // ['a', 'b']
coerce('["a","b"]', Array);       // ['a', 'b']
coerce('{"a":1}', Object);        // { a: 1 }
coerce('2026-01-01', Date);       // Date
coerce('x', value => value.toUpperCase());   // any converting function

toMap({ a: 1 });                  // Map { 'a' => 1 }
toSet('a,b,a');                   // Set { 'a', 'b' }
toEntries(new Map([['a', 1]]));   // [['a', 1]]
```

`toBool` and `toJSON` are aliases of `toBoolean` and `toJson`.
