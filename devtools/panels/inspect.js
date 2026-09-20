// @pulgasari/devtools/panels/inspect.js
//
// the lazy object inspector.
//
// <aufbau-tree> was the obvious candidate and is the wrong one: renderNodes()
// recurses the whole node array at render time, so feeding it a live object graph
// would mean materialising every reachable value up front — and a circular
// reference would never terminate. a native <details> that builds its children on
// first open has neither problem, and gets the disclosure triangle and the
// keyboard handling from the platform.

import createElement       from '@domina/methods/createElement.js';
import { isExpandable, preview } from './format.js';

const el = createElement;

const MAX_KEYS = 100;

// :::::: CHILDREN ::::::::::::::::::::::::::::::::::::::::::::::

/** @returns {Array<[label: string, read: () => unknown, kind?: string]>} */
function childrenOf (value) {
  const out = [];

  try {
    if (value instanceof Map) {
      let i = 0;
      for (const [key, item] of value) {
        if (i++ >= MAX_KEYS) break;
        out.push([preview(key, 1), () => item]);
      }
      return out;
    }

    if (value instanceof Set) {
      let i = 0;
      for (const item of value) {
        if (i++ >= MAX_KEYS) break;
        out.push([String(i - 1), () => item]);
      }
      return out;
    }

    if (value?.nodeType === 1) {
      for (const attribute of value.attributes) out.push([attribute.name, () => attribute.value, 'attr']);
      if (value.childNodes.length) out.push(['childNodes', () => [...value.childNodes]]);
      return out;
    }

    // an accessor is listed but not invoked: a getter can be expensive, throw, or
    // change what it reports just by being read
    const seen = new Set();
    for (const key of Object.getOwnPropertyNames(value).slice(0, MAX_KEYS)) {
      if (seen.has(key)) continue;
      seen.add(key);

      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor?.get) { out.push([key, () => descriptor.get.call(value), 'getter']); continue; }

      out.push([key, () => value[key], descriptor?.enumerable ? undefined : 'hidden']);
    }

    for (const symbol of Object.getOwnPropertySymbols(value).slice(0, 16)) {
      out.push([symbol.toString(), () => value[symbol], 'hidden']);
    }
  } catch {
    out.push(['<unreadable>', () => undefined, 'hidden']);
  }

  return out;
}

// :::::: NODES :::::::::::::::::::::::::::::::::::::::::::::::::

/**
 * one inspectable value.
 * @param ancestors the chain from the root down to this node, used to spot a
 *        cycle. an array rather than a WeakSet because only the path matters —
 *        the same object appearing in two sibling branches is not a cycle.
 */
export function inspect (value, { label = null, kind, ancestors = [] } = {}) {
  const $label   = label === null ? null : el('span', { className: `dt-ins-key${kind ? ` is-${kind}` : ''}`, textContent: `${label}:` });
  const describe = (text) => el('span', { className: `dt-ins-val is-${typeName(value)}`, textContent: text });

  if (kind === 'getter') {
    const $row  = el('span', { className: 'dt-ins-row' });
    const $read = el('button', { type: 'button', className: 'dt-ins-getter', textContent: '(…)', title: 'invoke getter' });

    // reading it is the user's call, and the result replaces the button in place
    $read.addEventListener('click', () => {
      let result;
      try { result = value(); } catch (error) { result = error; }
      $read.replaceWith(inspect(result, { ancestors }));
    }, { once: true });

    $row.append(...(label === null ? [] : [$label, ' ']), $read);
    return $row;
  }

  if (!isExpandable(value)) {
    const $row = el('span', { className: 'dt-ins-row' });
    $row.append(...(label === null ? [] : [$label, ' ']), describe(preview(value, ancestors.length ? 1 : 0)));
    return $row;
  }

  if (ancestors.includes(value)) {
    const $row = el('span', { className: 'dt-ins-row' });
    $row.append(...(label === null ? [] : [$label, ' ']), el('span', { className: 'dt-ins-val is-circular', textContent: '[circular]' }));
    return $row;
  }

  // depth 0, at every level: preview() only ever descends one step, so a summary
  // that says {name: "root", list: Array(3), …} costs the same as one saying {…}
  const $summary = el('summary', {});
  $summary.append(...(label === null ? [] : [$label, ' ']), describe(preview(value, 0)));

  const $details = el('details', { className: 'dt-ins' }, $summary);

  // built once, on first open: a console holding a few hundred entries must not
  // walk every logged object just to render the collapsed list
  let built = false;
  $details.addEventListener('toggle', () => {
    if (built || !$details.open) return;
    built = true;

    const $body = el('div', { className: 'dt-ins-body' });
    const chain = [...ancestors, value];
    const kids  = childrenOf(value);

    for (const [childLabel, read, childKind] of kids) {
      if (childKind === 'getter') { $body.append(inspect(read, { label: childLabel, kind: 'getter', ancestors: chain })); continue; }

      let child;
      try { child = read(); } catch (error) { child = error; }
      $body.append(inspect(child, { label: childLabel, kind: childKind, ancestors: chain }));
    }

    if (!kids.length) $body.append(el('span', { className: 'dt-ins-empty', textContent: 'no properties' }));
    $details.append($body);
  });

  return $details;
}

// drives the colour class, so a string reads differently from a number at a glance
function typeName (value) {
  if (value === null) return 'null';
  const type = typeof value;
  if (type === 'object') return Array.isArray(value) ? 'array' : value?.nodeType ? 'node' : value instanceof Error ? 'error' : 'object';
  return type;
}

export default inspect;
