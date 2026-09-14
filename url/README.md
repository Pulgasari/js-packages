# @pulgasari/url

thin, chainable wrapper around the native `URL` / `URLSearchParams` API.

## install

```sh
deno add jsr:@pulgasari/url   # deno
npx jsr add @pulgasari/url    # npm / node / bun
```

## usage

```js
import { url } from '@pulgasari/url';

const u = url('https://example.com/blog?page=2');

u.path.append('My Post');   // -> /blog/my-post  (segments are slugified)
u.query.set('page', null);  // removes ?page  (nullish value deletes)
u.query.set('sort', 'asc');
u.toString();               // 'https://example.com/blog/my-post?sort=asc'

// property view over query params
const q = u.query.values;
q.sort;          // 'asc'
q.tag = 'js';    // sets ?tag=js
delete q.sort;
```

in the browser a relative input resolves against `window.location`; outside a
browser pass an absolute url (or a base) since there is no ambient location.

depends on `@pulgasari/is` and `@pulgasari/str`.
