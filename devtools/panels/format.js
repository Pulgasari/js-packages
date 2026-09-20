// @pulgasari/devtools/panels/format.js
//
// turning logged arguments into something readable. two jobs:
//
//  1. console format specifiers. not optional here — @pulgasari/logger prefixes
//     every namespaced call with ['%cboot', 'color:#3b82f6;font-weight:bold'],
//     which without this renders as literal "%cboot color:#3b82f6…" garbage.
//  2. depth-1 previews. the inspector below them is lazy, so these are what the
//     collapsed line shows and what decides whether the console is readable.

import createElement from '@domina/methods/createElement.js';

const el = createElement;

// :::::: %c STYLING :::::::::::::::::::::::::::::::::::::::::::::

// a logged string reaches the panel as untrusted text — it can come from a
// dependency, a server payload or a pasted value. only properties that change how
// the run of text looks are allowed through, so no %c can move, size or cover the
// panel's own ui
const STYLE_PROPS = new Set([
  'color', 'background', 'background-color', 'font-weight', 'font-style',
  'font-size', 'font-family', 'text-decoration', 'text-transform', 'padding',
  'border-radius', 'opacity',
]);

function safeStyle (css) {
  const out = [];

  for (const rule of String(css).split(';')) {
    const at = rule.indexOf(':');
    if (at < 0) continue;

    const prop  = rule.slice(0, at).trim().toLowerCase();
    const value = rule.slice(at + 1).trim();

    // url() and expression() are the ways a style string reaches back out
    if (!STYLE_PROPS.has(prop) || /url\s*\(|expression\s*\(|[<>]/i.test(value)) continue;
    out.push(`${prop}:${value}`);
  }

  return out.join(';');
}

// :::::: PREVIEWS ::::::::::::::::::::::::::::::::::::::::::::::::

const MAX_STRING  = 120;
const MAX_ENTRIES = 5;

const fnName = (value) => value.name || 'anonymous';

const tagOf = (node) => {
  const id      = node.id ? `#${node.id}` : '';
  const classes = node.classList?.length ? `.${[...node.classList].join('.')}` : '';
  return `<${node.localName}${id}${classes}>`;
};

const clip = (text, max = MAX_STRING) => text.length > max ? `${text.slice(0, max)}…` : text;

/**
 * a one line description. `depth` 0 is the top level, where a bare string is
 * printed as itself — the same string nested inside an object gets quotes, which
 * is the distinction that makes '1' vs 1 visible at all.
 */
export function preview (value, depth = 0) {
  switch (typeof value) {
    case 'string'    : return depth === 0 ? clip(value) : JSON.stringify(clip(value, 60));
    case 'number'    : return Object.is(value, -0) ? '-0' : String(value);
    case 'bigint'    : return `${value}n`;
    case 'boolean'   :
    case 'undefined' : return String(value);
    case 'symbol'    : return value.toString();
    case 'function'  : return /^class[\s{]/.test(Function.prototype.toString.call(value))
                              ? `class ${fnName(value)}` : `ƒ ${fnName(value)}()`;
  }

  if (value === null) return 'null';

  // a proxy or a cross-origin window can throw on nearly any access, so every
  // branch below runs inside one guard rather than each carrying its own
  try {
    if (value instanceof Error)   return `${value.name}: ${value.message}`;
    if (value instanceof Date)    return value.toISOString();
    if (value instanceof RegExp)  return String(value);
    if (value?.nodeType === 1)    return tagOf(value);
    if (value?.nodeType === 3)    return `#text "${clip(value.data, 40)}"`;
    if (value?.nodeType === 9)    return '#document';

    if (Array.isArray(value)) {
      if (depth > 0) return `Array(${value.length})`;
      const shown = value.slice(0, MAX_ENTRIES).map(item => preview(item, depth + 1));
      return `(${value.length}) [${shown.join(', ')}${value.length > MAX_ENTRIES ? ', …' : ''}]`;
    }

    if (value instanceof Map) return `Map(${value.size})`;
    if (value instanceof Set) return `Set(${value.size})`;
    if (ArrayBuffer.isView(value)) return `${value.constructor.name}(${value.length})`;
    if (value instanceof Promise)  return 'Promise';

    const name = value.constructor?.name;
    const tag  = !name || name === 'Object' ? '' : `${name} `;

    if (depth > 0) return `${tag}{…}`;

    // own enumerable keys only: walking the prototype chain for a collapsed
    // preview line costs more than it tells you
    const keys  = Object.keys(value);
    const shown = keys.slice(0, 3).map(key => `${key}: ${preview(value[key], depth + 1)}`);

    return `${tag}{${shown.join(', ')}${keys.length > 3 ? ', …' : ''}}`;
  } catch {
    return '<unreadable>';
  }
}

/** whether a value has anything worth opening an inspector for */
export function isExpandable (value) {
  if (value === null) return false;
  const type = typeof value;
  return type === 'object' || type === 'function';
}

// :::::: FORMAT SPECIFIERS :::::::::::::::::::::::::::::::::::::::

/*
splits a console call into a list of parts:

  { kind: 'text',  text, style }   a run of plain text, optionally %c styled
  { kind: 'value', value }         an argument rendered as a preview + inspector

console only treats the first argument as a format string, and only substitutes
as many specifiers as it has arguments for — a leftover %s stays literal.
*/
export function formatParts (args) {
  const parts = [];
  let style   = '';

  const text = (chunk) => {
    if (!chunk) return;
    const last = parts[parts.length - 1];
    // merge consecutive runs that share a style, so one log line is not split
    // into a dozen spans
    if (last?.kind === 'text' && last.style === style) last.text += chunk;
    else parts.push({ kind: 'text', text: chunk, style });
  };

  const [first, ...rest] = args;

  if (typeof first !== 'string' || !first.includes('%')) {
    args.forEach((value, index) => {
      if (index) text(' ');
      typeof value === 'string' ? text(value) : parts.push({ kind: 'value', value });
    });
    return parts;
  }

  let buffer = '';
  let next   = 0;

  for (let i = 0; i < first.length; i++) {
    if (first[i] !== '%' || i === first.length - 1) { buffer += first[i]; continue; }

    const token = first[i + 1];

    if (token === '%') { buffer += '%'; i++; continue; }
    if (!'sdifoOcj'.includes(token) || next >= rest.length) { buffer += first[i]; continue; }

    const value = rest[next];
    i++;

    if (token === 'c') { text(buffer); buffer = ''; style = safeStyle(value); next++; continue; }

    next++;

    switch (token) {
      case 's': buffer += typeof value === 'string' ? value : preview(value, 1); break;
      case 'd':
      case 'i': buffer += typeof value === 'bigint' ? `${value}n` : String(Math.trunc(Number(value))); break;
      case 'f': buffer += String(Number(value)); break;
      // %o/%O/%j hand the argument to the inspector rather than stringifying it,
      // which is the whole reason they exist
      default : text(buffer); buffer = ''; parts.push({ kind: 'value', value });
    }
  }

  text(buffer);

  // a %c run ends with the format string, so the leftovers below are unstyled
  style = '';

  // anything the format string had no specifier for is appended, as console does
  for (let i = next; i < rest.length; i++) {
    text(' ');
    typeof rest[i] === 'string' ? text(rest[i]) : parts.push({ kind: 'value', value: rest[i] });
  }

  return parts;
}

/** a cheap signature for collapsing repeated lines, without building previews */
export function signature (level, args) {
  try {
    return level + '\u0000' + args.map(arg =>
      arg !== null && typeof arg === 'object' ? '\u0002obj' : typeof arg === 'symbol' ? arg.toString() : String(arg)
    ).join('\u0001');
  } catch {
    return level + '\u0000<unreadable>';
  }
}

export { el, safeStyle };
