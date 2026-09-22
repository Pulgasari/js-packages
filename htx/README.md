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

## Tag selectors

A tag name carries its id and classes the way a CSS selector does:

```javascript
html`<div#main.card.big />`   // <div id="main" class="card big">
html`<div.card />`            // <div class="card">
html`<.card />`              // a div, the way Emmet reads a tagless selector
html`<$icon.big />`          // the shorthand tag, plus class="big"
```

The classes are emitted **before** any written attribute, so `class=` appends
to them and duplicates collapse. A written `id=` replaces the selector's id —
written beats shorthand, same as on a shorthand tag:

```javascript
html`<div.card class=${['big']} />`  // class="card big"
html`<div.a.b class="a" />`          // class="a b"
html`<div#main id='other' />`        // id="other"
```

An element has one id, so the first `#` wins; a second one is a typo and says
so in the console. Splitting happens at build time, which means the warning
fires once per template, not once per render.

This closes a tag name to `.` and `#`. Only a custom element could want one —
`<my.el-ement>` is legal HTML — and an interpolated name is never split, so
`<${'my.el-ement'} />` still gets through.

## Prop groups

One value, several names. All three spellings do the same thing:

```javascript
html`<${Box} [id, title]='example' />`
html`<${Box} id,title='example' />`
html`<${Box} id|title='example' />`
// -> <Box id='example' title='example' />
```

Either separator works in either spelling — `[a|b]` and `a,b` are both fine —
and a group of one (`[id]='x'`) is just that prop. Whitespace around the
separator is allowed **inside the brackets only**, because outside them a space
is what ends an attribute.

> The final spelling is not settled yet. All three are supported so they can be
> lived with for a while; one of them may win later.

The value can be anything a single prop takes, interpolation included, and
everything else on the tag behaves as it did:

```javascript
html`<div [a,b]=${value} />`              // both get the same reference
html`<div [a,b]="x${y}z" />`              // both get the same built string
html`<div [hidden, disabled] />`          // a boolean group, both true
html`<div [class:on, class:big]=${ok} />` // -> class="on big"
```

Groups are split at build time, so one group costs one op per name in the
cached program and nothing at all on render. A dangling separator (`a,`), an
empty group (`[]`) or a missing `]` throws — each is a typo rather than a name.

A quoted value is still positional, so `<div '[a,b]' />` is the text `[a,b]`,
not a group.

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

## Raw HTML

A string that already *is* markup has to be parsed to become nodes, and as a
child it would be escaped — correctly, but not usefully:

```javascript
html`<div>${'<b>x</b>'}</div>`        // <div>&lt;b&gt;x&lt;/b&gt;</div>
html`<div !html=${'<b>x</b>'} />`     // <div><b>x</b></div>
```

`!html` is that escape hatch, for Markdown output, CMS fields and pre-rendered
server markup. The ugly name is the point: parsing is what runs a `<script>` or
an `onerror=` hidden in the string, so anything from someone else's hands
belongs in a sanitizer (or a renderer with escaping switched on) first.

The core only names the prop; each adapter writes it — `innerHTML` in vanilla,
`dangerouslySetInnerHTML` in preact. It resolves **late**, when an element is
actually created, so a component is not an element and receives the prop
untouched:

```javascript
const Card = ({ ...rest }) => html`<section ...${rest} />`;
html`<${Card} !html=${markup} />`     // the markup lands on the <section>
```

Since `'!html'` is nothing an object literal can shorthand, the name is
exported for the spread form:

```javascript
import { RAW_HTML } from '@pulgasari/htx';
html`<div ...${{ [RAW_HTML]: markup }} />`;
```

Don't mix it with children: vanilla appends them after the parsed markup,
preact drops them, and both say so in the console.

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

## Markdown

`markdown.js` walks a token tree into `h()` calls, so Markdown arrives as nodes
rather than as an HTML string — which means `!html` is not needed for it, and
raw HTML inside the Markdown never has to be parsed.

The parser is **injected, not imported**. htx has no dependency on it, and
nothing Markdown-related enters the module graph until you import this file:

```javascript
const { marked }         = await import('marked');
const { createMarkdown } = await import('@pulgasari/htx/markdown.js');

html.use({ md: createMarkdown(h, Fragment, { lexer: marked.lexer }) });

html`<article.prose>${html.md(text)}</article>`
```

That is the whole lazy story — your `import()`, your moment. A template call is
synchronous, so the parser has to be there before the first `html.md(…)`; there
is no way around one `await` somewhere at startup.

`html.use('md', fn)` or `html.use({ md, … })` attaches a helper to the tag
function and returns it, so it chains. Names belonging to the API (`define`,
`tags`, `use`) are refused rather than silently replaced.

### Options

| | |
|---|---|
| `lexer` | `src => tokens`. Required. |
| `html` | raw HTML inside the Markdown: `'skip'` (default) drops it, `'text'` shows it as text, `'raw'` parses it through `!html` |
| `breaks` | mirror the lexer's own `breaks`: a newline inside a paragraph becomes a `<br>` |
| `handlers` | `{ [tokenType]: (token, walk) => node }`, for marked extensions |

Safe by default: `'skip'` means an `<img onerror=…>` written into the Markdown
is dropped instead of parsed. Only `'raw'` is the dangerous one, and it says so.

**One marked trap:** pass `marked.lexer` bare. Unlike `marked.parse`, the
standalone lexer *replaces* marked's defaults with whatever options object it
gets, so `marked.lexer(src, {})` quietly turns GFM off — no tables, no task
lists, no `~~del~~`. Spread `marked.defaults` if you need to pass options.

### Fidelity

Checked against `marked.parse()` as an oracle, 36 assertions, with two
deliberate deviations:

- Table alignment becomes `style="text-align:…"` rather than the obsolete
  `align` attribute.
- `- [x]` sets the checkbox's `checked` **property** (via domina), so the box is
  really checked but the attribute does not appear in `outerHTML`.

Everything else — entities, escapes, autolinks, loose and tight lists, nested
blockquotes, code fences, hard breaks, link definitions — renders identically.
Note that the lexer hands back *source* text, so `&amp;` written in the
Markdown is decoded here rather than escaped; that is the one thing a node
builder has to do in the opposite direction from a string renderer.

## Writing an adapter

```javascript
import { createHtml } from '@pulgasari/htx';

export const html = createHtml(h, Fragment, { memo: true, tags: {} });
```

`h(type, props, ...children)` is called bottom up. `memo` defaults to `true`,
which is what a vdom wants. `tags` seeds the shorthand registry.
