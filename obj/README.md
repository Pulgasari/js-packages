# @pulgasari/obj

object utilities: deep clone/merge, dot-path access, key/value transforms, plus
a chainable `obj()` sugar. ships `CanonicalMap` on a subpath.

## install

```sh
deno add jsr:@pulgasari/obj
```

```sh
npx jsr add @pulgasari/obj
```

## usage

```js
import { deepClone, deepMerge, getByPath, setByPath, dropByKey, obj } from '@pulgasari/obj';

deepMerge({ a: { x: 1 } }, { a: { y: 2 } }); // { a: { x: 1, y: 2 } }
getByPath({ a: { b: 1 } }, 'a.b');           // 1
setByPath(state, 'user.name', 'ada');
dropByKey({ a: 1, b: 2 }, 'b');              // { a: 1 }

// chainable sugar: known methods run against the object,
// everything else reads the property
obj(data).getByPath('user.name');
```

### CanonicalMap

a `Map` that treats key case forms (camel/kebab/snake/…) as the same key.

```js
import { CanonicalMap } from '@pulgasari/obj/CanonicalMap';

const m = new CanonicalMap({ 'user-name': 'ada' });
m.get('userName');  // 'ada'
m.get('user_name'); // 'ada'
```
