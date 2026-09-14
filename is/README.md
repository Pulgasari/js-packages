# @pulgasari/is

runtime type and shape predicates plus a small composable checker.

## install

```sh
deno add jsr:@pulgasari/is   # deno
npx jsr add @pulgasari/is    # npm / node / bun
```

## usage

```js
import { is, isAny, isNot, isEmail, and, or, not } from '@pulgasari/is';

is(5, 'number', 'positive', 'integer'); // true  — all predicates must hold
isAny(x, 'string', 'number');           // true if any holds
isNot(x, 'nullish');                     // negated form
isEmail('a@b.co');                       // direct predicate call

// predicates are named without the `is` prefix in is()/isAny()/isNot(),
// or passed as functions:
is(v, 'plainObject');
is(v, isEmail);
```

`and` / `or` / `not` compose predicates into new ones; `testRule` evaluates
function/boolean/array rules against a value.

predicates cover primitives, numbers, objects and structures, dom nodes,
emptiness, string cases, and common formats (email, uuid, url, json, hex color,
base64). see `predicates.js` for the full list — all are re-exported here.

## note

an empty predicate list returns `false` (never a vacuous `true`), so a forgotten
argument can never accidentally confirm a value.
