# @pulgasari/htx

HTX = HTM EXTENDED (but we couldn't name it HTMX lol)

A fork of [htm](https://github.com/developit/htm) with merged props, shorthand
tags and a vanilla DOM adapter.

```javascript
import { html } from '@pulgasari/htx/adapters/preact.js';
import { html } from '@pulgasari/htx/adapters/vanilla.js';
```

## What it adds over htm

**Props merge instead of overwriting.** Every write goes through `setProp`, so
duplicate `class` / `className` / `class:*` and `style` survive a spread:

```javascript
html`<div class="a" class=${['b','c']} class=${{ d: true, e: false }} />`
// -> class="a b c d"
```

`class` takes a string, an array or an object; `style` takes an object. An empty
tag `<>…</>` falls back to `Fragment`.

## Shorthand tags

A tag starting with `$` resolves through a registry:

```javascript
html.define('icon', {
  tag   : 'aufbau-icon',
  args  : ['icon', 'size'],    // what the positional values fill, in order
  props : { mode: 'mask' },    // defaults, both optional
});

html`<$icon 'bx:search' />`           // <aufbau-icon icon="bx:search" mode="mask">
html`<$icon 'bx:search' '2em' />`     // + size="2em"
html`<$icon 'x' mode="image" />`      // the written attribute wins
html`<$icon ${name} />`               // an interpolation is positional too
```

Precedence runs **defaults < positional < written attribute**, so a default is a
starting point and anything spelled out on the tag wins. `class` and `style`
append to their defaults rather than replacing them.

A positional past the declared `args` becomes a child, which is what makes the
args list optional:

```javascript
html.define('em', 'strong');   // a bare tag name is the whole spec
html`<$em 'hi' />`             // <strong>hi</strong>
```

The same holds for an ordinary tag, so `html`<div 'text' />`` is
`<div>text</div>`.

Several at once, and per-instance registries:

```javascript
html.define({ icon: {…}, box: 'div' });

import { createVanillaHtml } from '@pulgasari/htx/adapters/vanilla.js';
const html = createVanillaHtml({ tags: { icon: {…} } });
```

An unknown `<$foo>` throws rather than rendering an element nobody asked for.

### Why the quotes matter

`<$icon 'bx:search' />` is a positional value; `<a disabled>` is a boolean
attribute. The quote is the whole distinction, and it is the only change the
tokenizer needed.

## The vanilla adapter

No vdom and no diffing: a template call builds DOM nodes and hands them over. It
is a **builder**, not a renderer — to update, `replaceChildren()` the subtree or
bring your own diff.

```javascript
import { html } from '@pulgasari/htx/adapters/vanilla.js';

const $panel = html`
  <section class="panel">
    <h2>${title}</h2>
    <button onClick=${save}>save</button>
  </section>
`;
```

Props go through `@domina/methods`, so event handlers, `dataset`, `style`
objects and the `appendTo` / `prependTo` shortcuts all work. SVG tags are created
in the right namespace, which keeps `viewBox` and friends from being lowercased;
the tags shared with HTML (`a`, `script`, `style`, `title`) stay HTML on purpose.

It runs with `memo: false`. `evaluate()` otherwise caches a fully static subtree
and returns the identical node on every later call, which is correct for an
immutable vnode and wrong for a DOM node — appending it a second time would move
it out of the first tree instead of building a second one.

## Writing an adapter

```javascript
import { createHtml } from '@pulgasari/htx';

export const html = createHtml(h, Fragment, { memo: true, tags: {} });
```

`h(type, props, ...children)` is called bottom up. `memo` defaults to `true`,
which is what a vdom wants. `tags` seeds the shorthand registry.
