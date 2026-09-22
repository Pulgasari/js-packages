// @pulgasari/htx/markdown.js
//
// markdown as nodes rather than as an html string, so <div !html=${…}> is not
// needed for it and raw html inside the markdown never has to be parsed.
//
// the parser is injected, not imported: this file walks a marked-shaped token
// tree and knows nothing about marked itself. that keeps htx free of the
// dependency and makes the whole thing lazy by construction — neither the
// parser nor this walker enters the module graph until something imports it.
//
//   const { marked }         = await import('marked');
//   const { createMarkdown } = await import('@pulgasari/htx/markdown.js');
//
//   html.use({ md: createMarkdown(h, Fragment, { lexer: marked.lexer }) });
//   html`<article>${html.md(text)}</article>`

// :::::: ENTITY DECODING

/*
the lexer hands back source text, not html: an '&amp;' written in the markdown
is still '&amp;' in the token, because marked escapes on the way out, in the
renderer. a dom text node needs the opposite — the character itself.

only entity-shaped matches go through the parser, never the whole string: a
text token may hold a bare '<' (as in '5 < 6'), and letting the html parser see
that risks it swallowing the rest as a tag. a <template> is inert, so nothing
runs and nothing is fetched while it holds the markup.

codespan and code tokens arrive already decoded and must not be touched again.
*/

const BASIC = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

const ENTITY = /&(#\d+|#[xX][\da-fA-F]+|[a-zA-Z][a-zA-Z\d]*);/g;

let decoder;

function decode (text) {
  if (!text || !text.includes('&')) return text;

  // false rather than undefined, so the lookup happens once either way
  decoder ??= typeof document === 'undefined' ? false : document.createElement('template');

  return text.replace(ENTITY, (match, name) => {
    if (decoder) {
      decoder.innerHTML = match;
      return decoder.content.textContent;
    }

    // without a dom (server side) the five that matter, plus numeric
    if (name[0] !== '#') return BASIC[name.toLowerCase()] ?? match;
    return String.fromCodePoint(Number(name[1] === 'x' || name[1] === 'X' ? '0' + name.slice(1) : name.slice(1)));
  });
}

// :::::: WALKER

/**
 * @param h         the adapter's hyperscript, h(type, props, ...children)
 * @param Fragment  the adapter's fragment type
 * @param lexer     src -> tokens. marked.lexer, or anything token-compatible.
 *                  pass marked.lexer bare to get marked's defaults: unlike
 *                  marked.parse, the standalone lexer REPLACES them with the
 *                  options object it is given, so marked.lexer(src, {}) quietly
 *                  turns gfm off — no tables, no task lists, no ~~del~~
 * @param html      what to do with raw html inside the markdown:
 *                  'skip' drops it, 'text' shows it as text, 'raw' parses it
 *                  through !html and is therefore the unsafe one
 * @param breaks    mirror the lexer's own breaks option: a newline inside a
 *                  paragraph becomes a <br> instead of collapsing to a space
 * @param handlers  { [tokenType]: (token, walk) => node } for marked extensions
 */
export function createMarkdown (h, Fragment, { lexer, html: rawHtml = 'skip', breaks = false, handlers } = {}) {
  if (typeof lexer !== 'function') throw new Error('[htx] createMarkdown needs a lexer, e.g. { lexer: marked.lexer }');

  // `top` is marked's own distinction: in a block context a bare text token is
  // a paragraph, inline it is just text. a loose list item is a block context,
  // a tight one is not, which is the whole difference between the two
  const kids = (tokens, top) => (tokens ?? []).flatMap(token => {
    const child = node(token, top);
    return child == null ? [] : [child];
  });

  // a text token carries its inline children, or nothing but its own text
  const inline = (t) => t.tokens?.length ? kids(t.tokens, false) : [text(t.text)];

  // with breaks on, the newline the lexer left in place becomes a <br>
  const text = (value) => {
    const decoded = decode(value);
    if (!breaks || !decoded?.includes('\n')) return decoded;

    return h(Fragment, null, ...decoded.split('\n').flatMap((part, i) => i ? [h('br', null), part] : [part]));
  };

  const cell = (tag, c, align) => h(tag, align ? { style: { 'text-align': align } } : null, ...inline(c));

  const table = (t) => h('table', null,
    h('thead', null, h('tr', null, ...t.header.map((c, i) => cell('th', c, t.align[i])))),
    h('tbody', null, ...t.rows.map(row => h('tr', null, ...row.map((c, i) => cell('td', c, t.align[i]))))),
  );

  const raw = (t) => rawHtml === 'text' ? text(t.text)
            : rawHtml === 'raw'  ? h(t.block ? 'div' : 'span', { '!html': t.text })
            : null; // 'skip'

  function node (t, top) {
    const handler = handlers?.[t.type];
    if (handler) return handler(t, kids);

    switch (t.type) {
      // structure
      case 'paragraph':  return h('p', null, ...inline(t));
      case 'heading':    return h('h' + t.depth, null, ...inline(t));
      case 'blockquote': return h('blockquote', null, ...kids(t.tokens, true));
      case 'hr':         return h('hr', null);
      case 'table':      return table(t);
      case 'list':       return h(t.ordered ? 'ol' : 'ul', t.ordered && t.start > 1 ? { start: t.start } : null, ...kids(t.items, t.loose));
      case 'list_item':  return h('li', null,
                           ...(t.task ? [h('input', { type: 'checkbox', checked: !!t.checked, disabled: true }), ' '] : []),
                           ...kids(t.tokens, t.loose));

      // inline
      case 'strong':     return h('strong', null, ...inline(t));
      case 'em':         return h('em', null, ...inline(t));
      case 'del':        return h('del', null, ...inline(t));
      case 'codespan':   return h('code', null, t.text);
      case 'br':         return h('br', null);
      case 'link':       return h('a', { href: t.href, title: t.title || null }, ...inline(t));
      case 'image':      return h('img', { src: t.href, alt: decode(t.text), title: t.title || null });
      case 'escape':     return t.text; // already the literal character

      // a bare text token is a paragraph in a block context and text inline
      case 'text':       return top ? h('p', null, ...inline(t)) : t.tokens?.length ? h(Fragment, null, ...inline(t)) : text(t.text);

      // code text arrives decoded; the info string may carry more than the
      // language. the trailing newline is what marked's renderer emits too,
      // which keeps the output comparable against it token for token
      case 'code':       return h('pre', null, h('code', t.lang ? { class: 'language-' + t.lang.trim().split(/\s+/)[0] } : null, t.text.endsWith('\n') ? t.text : t.text + '\n'));

      case 'html':       return raw(t);

      // link definitions and blank lines render nothing. a checkbox is drawn by
      // its list_item instead, from task/checked, which older marked versions
      // carry too — they emit no checkbox token at all
      case 'checkbox':
      case 'def':
      case 'space':      return null;

      // an unknown type is a marked extension without a handler. showing its
      // source beats dropping content silently
      default:           return text(t.raw ?? t.text ?? null);
    }
  }

  /** src -> one fragment holding the whole document */
  return (src) => h(Fragment, null, ...kids(lexer(src ?? ''), true));
}

export default createMarkdown;
