// @pulgasari/htx/adapters/vanilla.js
//
// htx against plain dom. no vdom, no diffing: a template call builds nodes and
// hands them over, which is what makes it a builder rather than a renderer.
// re-rendering means replaceChildren() on the subtree, or a diff of your own.
//
// two things this adapter has to get right that preact does not:
//
//  1. memo: false. evaluate() otherwise caches a fully static subtree and hands
//     back the identical node on every later call — appending it a second time
//     would move it out of the first tree instead of building a second one.
//  2. svg. document.createElement('svg') makes an HTMLUnknownElement, so the
//     element renders nothing and its attributes are lowercased on the way in.

// :::::: IMPORT

import { updateElement }       from '@domina/methods/updateElement.js';
import { createHtml, RAW_HTML } from '../index.js';

export const Fragment = Symbol('htx.fragment');



// :::::: HELPERS

const isFn = (value) => typeof value === 'function';

// a document fragment has no innerHTML, so a string destined for one is parsed
// in a throwaway <template> instead. inert while parsing: no request is sent
// and no script runs until the nodes are in the document
const parseHtml = (html) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
};

// :::::: SVG SONDERBEHANDLUNG
// (gehört evtl. direkt in @domina gelöst?)

const SVG_NS = 'http://www.w3.org/2000/svg';

/*
tags that only exist in svg. the ones shared with html — a, script, style,
title — stay html on purpose: guessing wrong on <title> in an ordinary document
is worse than an svg <title> nobody reads. wrap those in ${…} if you need them.
*/
const SVG_TAGS = new Set([
  'circle', 'clipPath', 'defs', 'desc', 'ellipse', 'feBlend', 'feColorMatrix',
  'feComposite', 'feDropShadow', 'feFlood', 'feGaussianBlur', 'feMerge',
  'feMergeNode', 'feMorphology', 'feOffset', 'feTurbulence', 'filter',
  'foreignObject', 'g', 'line', 'linearGradient', 'marker', 'mask', 'path',
  'pattern', 'polygon', 'polyline', 'radialGradient', 'rect', 'stop', 'svg',
  'symbol', 'text', 'textPath', 'tspan', 'use',
]);

// the node is created here and only then filled, because createElement() takes a
// tag name and the svg branch needs a namespace. domina's updateElement already
// skips the property path for an SVGElement and writes attributes verbatim, so
// viewBox keeps its case once the node exists in the right namespace
const make = (tag, props) => updateElement(
  SVG_TAGS.has(tag) ? document.createElementNS(SVG_NS, tag) : document.createElement(tag),
  props,
);

function h (type, props, ...children) {
  // htx never calls a component; preact does that itself, so vanilla has to.
  // a component is not an element, so it keeps !html and may forward it
  if (isFn(type)) return type(props ?? {}, children);

  // taken out before updateElement sees it: '!html' is not a legal attribute
  // name, so setAttribute would throw on it
  const raw = props?.[RAW_HTML];
  if (raw != null) delete props[RAW_HTML];

  const node = !type || type === Fragment ? document.createDocumentFragment() : make(type, props ?? {});

  // first, because innerHTML replaces whatever the element already holds
  if (raw != null) node.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? node.append(parseHtml(raw)) : (node.innerHTML = raw);

  // append takes strings as text nodes, so primitives need no wrapping. false
  // and nullish are dropped the way a vdom drops them
  const kids = children.flat(Infinity).filter(child => child != null && child !== false && child !== true);

  // preact drops the children in this case, so the two adapters disagree —
  // worth hearing about rather than picking one silently
  if (raw != null && kids.length) console.warn('[htx] !html together with children: appended after the parsed markup, which preact would instead drop');

  if (kids.length) node.append(...kids);

  return node;
}

/** the shared instance. use createVanillaHtml() for a registry of your own */ 
const htx = createHTX (h, Fragment, { memo: false });
const createVanillaHtml = (options) => createHTX (h, Fragment, { memo: false, ...options });

// :::::: ALIASES

const 
createHtml = createHTX,
html       = htx;

// :::::: EXPORT

export {
  h, htx, createHTX,
  html, createVanillaHtml,
};

export default htx;
