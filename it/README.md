# @pulgasari/it

a list with a query vocabulary. `it(iterable)` hands back an `It`, a real array that
understands `where`, `without`, `one`, `has`, `all`, `pluck`, `keyBy` and `search`.

## install

```sh
deno add jsr:@pulgasari/it
```
```sh
npx jsr add @pulgasari/it
```

## usage

```js
import it from '@pulgasari/it';

const books = it(library);

books.where({ sourceId: folder })              // all that match
books.without({ id })                          // all that do not
books.one({ id })                              // the first that matches
books.has({ status: 'reading' })               // is there one
books.all({ year: year => year > 1900 })       // do all
books.pluck('title')                           // the value of a key of every item
books.keyBy('id')                              // { [id]: book }
books.search(query, ['title', 'author'])       // case insensitive, an empty query finds all

it(books).where({ sourceId: folder }).search(query, ['title', 'author']).pluck('id');
```

an `It` stays an array: `length`, indices, `for…of`, spread and the native methods work as
usual, and a list it returns is an `It` again. any iterable goes in, a `Set`, a `Map`, a
`NodeList`, a generator; nullish is an empty list.

## patterns

a pattern describes the item, the same rules for strings and for records:

| pattern | matches |
|---|---|
| `undefined` | anything, so an unset criterion filters nothing |
| function | when it returns something truthy |
| `RegExp` | a string that matches |
| `Set` | one of its values |
| array | one of its patterns |
| plain object | every key against its own pattern, nested the same way |
| anything else | the same value, `null` and `''` included |

```js
it(['mdi', 'lucide', 'ph']).where(['mdi', 'ph'])        // ['mdi', 'ph']
it(tasks).where({ parent: null, done: false })          // top level, open
it(tasks).where({ tags: Boolean })                      // truthy key
it(icons).where({ prefix: popular, total: n => n > 99 })
it(files).without({ name: /^\./ })
```

`match(pattern)` turns a pattern into a predicate for the native methods:

```js
import { match } from '@pulgasari/it';

list.filter(match({ folder }));
```

## performance

the methods loop by index and hand over a plain array as an `It`, as fast as the native
`filter` and `find`. `it()` copies the list once. the natives `It` does not override
(`sort`, `concat`, `flat` …) work, but run slower on an array with another prototype.
