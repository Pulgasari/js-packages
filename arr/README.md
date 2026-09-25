# @pulgasari/arr

array helpers for lists of records: filter, find and drop by criteria, pluck, sort
by keys. plus a chainable `arr()` sugar, and data last transformers for `pipe()` on
a subpath.

## install

```sh
deno add jsr:@pulgasari/arr
```

```sh
npx jsr add @pulgasari/arr
```

## usage

```js
import { arr, filterByAnyCriteria, filterByCriteria, mapBy, sortBy } from '@pulgasari/arr';

const users = [{ name: 'ada', role: 'admin' }, { name: 'bob', role: 'user' }];

filterByCriteria(users, { role: 'admin' });      // every key has to match
filterByAnyCriteria(users, { name: 'bob', role: 'admin' });   // one is enough
mapBy(users, 'name');                            // ['ada', 'bob']
sortBy(users, 'name', 'desc');                   // a sorted copy
sortBy(users, { role: 'asc', name: 'desc' });    // several keys, in order

arr(users).sortBy('name').length;                // known helpers run on the array
```

`drop…` and `find…` exist for every `filter…`. nothing mutates the input.

### fp

```js
import { filter, map, take } from '@pulgasari/arr/fp';

const top3 = pipe(filter(user => user.active), map(user => user.name), take(3));
```
