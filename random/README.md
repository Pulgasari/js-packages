# @pulgasari/random

random numbers, picks and css colours. `Math.random()` based, not for anything
security related.

## install

```sh
deno add jsr:@pulgasari/random
```

```sh
npx jsr add @pulgasari/random
```

## usage

```js
import random from '@pulgasari/random';

random.int({ min: 1, max: 6 });             // 1 to 6, both inclusive
random.int({ min: 0, max: 100, step: 5 });  // 0, 5, 10, …
random.float({ min: 0, max: 1, step: 0.1 });
random.boolean(0.2);                        // true in one of five
random.item(['a', 'b', 'c']);
random.shuffle([1, 2, 3]);                  // a shuffled copy

random.color.hex({ min: '#333', max: '#ccc' });
random.color.hsl({ s: 80, l: 60 });         // a fixed channel wins over its range
random.color.hsla({ aMin: 0.5 });           // 'hsl(… / 0.73)'
random.color.rgb({ rMax: 128 });
```

every function is exported on its own as well: `randomInt`, `randomColorHex`, …
