# @pulgasari/num

small, dependency-free numeric helpers.

## install

```sh
deno add jsr:@pulgasari/num   # deno
npx jsr add @pulgasari/num    # npm / node / bun
```

## usage

```js
import { clamp, lerp, mapRange, percent, round, snap, toNumber } from '@pulgasari/num';

clamp(15, 0, 10);            // 10  — min/max are optional (open-ended if omitted)
lerp(0, 100, 0.25);          // 25
mapRange(5, 0, 10, 0, 100);  // 50
percent(1, 4);               // 25
round(3.14159, 2);           // 3.14
snap(7, [0, 5, 10]);         // 5   — nearest of a set, or a fixed step size
toNumber('42px', 0);         // 42  — parses, falls back on non-finite
```
