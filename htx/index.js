// HTX = HTM EXTENDED (but we couldn't name it HTMX lol)

/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
modified fork of htm (developit/htm). changes vs upstream:
- MINI branches and treeify removed, build/evaluate/tag-fn collapsed into one file
- every prop write goes through setProp/appendProp instead of assigning directly,
  so duplicate class/className/class:* /style survive spreads instead of overwriting
- empty tag (<>...</>) falls back to Fragment
- class accepts string | array | object
- style accepts object
- a prop group — [id, title]='x' — writes one value to several names
- a tag selector — <div#main.card.big> — sets id and class
- !html names the raw-html escape hatch, which each adapter then writes
*/

// :::::: IMPORTS

import { isArray, isFn, isObject, isString } from '@pulgasari/is';
import { Logger } from '@pulgasari/logger';

const logger = new Logger ({ prefix: 'HTX' });

// :::::: CONSTANTS

const MODE_SLASH       = 0;
const MODE_TEXT        = 1;
const MODE_WHITESPACE  = 2;
const MODE_TAGNAME     = 3;
const MODE_COMMENT     = 4;
const MODE_PROP_SET    = 5;
const MODE_PROP_APPEND = 6;

const CHILD_APPEND  = 0;
const CHILD_RECURSE = 2;
const TAG_SET       = 3;
const PROPS_ASSIGN  = 4;
const PROP_SET      = MODE_PROP_SET;
const PROP_APPEND   = MODE_PROP_APPEND;

// :::::: PROP MERGING

const CLASSES    = Symbol('classes');
const POSITIONAL = Symbol('positional');
const STYLES     = Symbol('styles');
const RAW_HTML   = '!html';

const isClassKey = (key) => key === 'class' || key === 'className' || key.startsWith('class:');

function addClass (list, value) {
       if (!value) return;
  else if (isString(value)) list.push(value);
  else if  (isArray(value)) for (const item of value) addClass(list, item);
  else if (isObject(value)) for (const [name, enabled] of Object.entries(value)) if (enabled) list.push(name);      
}

function collect (props, symbol, key, value) {
  (props[symbol] || (props[symbol] = [])).push([key, value]);
}

function setProp (props, key, value) {
       if (key === POSITIONAL) (props[key] || (props[key] = [])).push(value);
  else if (isClassKey(key)) collect(props, CLASSES, key, value);
  else if (key === 'style') collect(props, STYLES, key, value);
  else props[key] = value;
}

function appendProp (props, key, value) {
  const list = isClassKey(key) ? props[CLASSES] : key === 'style' ? props[STYLES] : null;

  if (!list) { props[key] += value + ''; return; }

  // the entry this append belongs to is the last one written under the same
  // key, not simply the last one: a prop group interleaves its siblings, so
  // class,className="a${x}" writes both before either appends
  let i = list.length - 1;
  while (i > 0 && list[i][0] !== key) i--;

  const entry = list[i];
  entry[1] = (entry[1] == null ? '' : entry[1]) + value;
}

function finalize (props) {
  if (!props) return props;

  const classes = props[CLASSES];
  const styles  = props[STYLES];

  if (classes) {
    const list = [];
    delete props[CLASSES];

    for (const [key, value] of classes) {
      if (key.startsWith('class:')) { if (value) list.push(key.slice(6)); }
      else addClass(list, value);
    }

    if (list.length) props.class = [...new Set(list)].join(' ');
  }

  if (styles) {
    let merged = null;
    delete props[STYLES];

    // objects merge left to right. a string value discards everything before it,
    // so don't mix the two forms on one element.
    for (const [, value] of styles) {
      if (!value) continue;
      else if (isString(value))  merged = value;
      else if (isObject(merged)) Object.assign(merged, value);
      else merged = { ...value };
    }

    if (merged) props.style = merged;
  }

  return props;
}

// :::::: EVALUATE

function evaluate (h, built, fields, args, memo = true) {
  let tmp;
  built[0] = 0;

  for (let i = 1; i < built.length; i++) {
    const type  = built[i++];
    const value = built[i] ? ((built[0] |= type ? 1 : 2), fields[built[i++]]) : built[++i];

    if (type === TAG_SET) {
      args[0] = value;
    }
    else if (type === PROPS_ASSIGN) {
      const props = args[1] || (args[1] = {});
      for (const key of Object.keys(value)) setProp(props, key, value[key]);
    }
    else if (type === PROP_SET) {
      setProp(args[1] || (args[1] = {}), built[++i], value);
    }
    else if (type === PROP_APPEND) {
      appendProp(args[1], built[++i], value);
    }
    else if (type) {
      tmp = h.apply(value, evaluate(h, value, fields, ['', null], memo));
      args.push(tmp);

      if (value[0] || !memo) {
        built[0] |= 2;
      }
      else {
        built[i - 2] = CHILD_APPEND;
        built[i] = tmp;
      }
    }
    else args.push(value); // // type === CHILD_APPEND
    
  }

  return args;
}

// :::::: PROP GROUPS

/*
a prop group writes one value to several names:

  <$box [id, title]='example' />   ->  id='example' title='example'
  <$box id,title='example' />
  <$box id|title='example' />
*/

const SEPARATOR = /[,|]/;

function splitProp (name) {
  const bracketed = name[0] === '[';

  if (!bracketed && !SEPARATOR.test(name)) return [name];
  if (bracketed && name[name.length - 1] !== ']') throw new Error(`[htx] unclosed prop group '${name}'`);

  const names = (bracketed ? name.slice(1, -1) : name).split(SEPARATOR);
  if (names.some(part => !part)) throw new Error(`[htx] malformed prop group '${name}'`);

  return names;
}

// :::::: TAG SELECTORS

/*
a tag name carries its id and classes the way a css selector does:

  <div#main.card.big />   ->  <div id='main' class='card big'>
  <$icon.big />           ->  the shorthand tag, plus class='big'
  <.card />               ->  a div, the way emmet reads a selector with no tag
*/

const SELECTOR = /[.#]/;

function splitSelector (name) {
  if (!SELECTOR.test(name)) return null;

  const classes = [];
  let tag = '';
  let id  = '';

  // a lookahead split keeps the sigils, so each token says what it is
  for (const token of name.split(/(?=[.#])/)) {
    const sigil = token[0];
    const value = token.slice(1);

    if (sigil !== '.' && sigil !== '#') { tag = token; continue; }
    if (!value) continue; // a dangling '.' or '#' names nothing

    if (sigil === '.') classes.push(value);
    else if (!id) id = value;
    else logger.warn(`<${name}> has more than one id: keeping '#${id}', ignoring '#${value}'`);
  }

  return { tag: tag || 'div', id, classes };
}

// :::::: BUILD

function build (statics) {
  let char, names;
  let mode    = MODE_TEXT;
  let buffer  = '';
  let current = [0];
  let quote   = '';
  let quoted  = false;
  let group   = false;

  const commit = field => {
    if (mode === MODE_TEXT && (field || (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g, '')))) {
      current.push(CHILD_APPEND, field, buffer);
    }
    else if (mode === MODE_TAGNAME && (field || buffer)) {
      const selector = field ? null : splitSelector(buffer);

      current.push(TAG_SET, field, selector ? selector.tag : buffer);

      if (selector?.id)             current.push(PROP_SET, 0, selector.id,      'id'   );
      if (selector?.classes.length) current.push(PROP_SET, 0, selector.classes, 'class');

      mode = MODE_WHITESPACE;
    }
    else if (mode === MODE_WHITESPACE && buffer === '...' && field) {
      current.push(PROPS_ASSIGN, field, 0);
    }
    // a bare interpolation in a tag — <$icon ${name} /> — used to fall through
    // every branch and be dropped on the floor
    else if (mode === MODE_WHITESPACE && !buffer && field) {
      current.push(PROP_SET, field, 0, POSITIONAL);
    }
    else if (mode === MODE_WHITESPACE && buffer && !field) {
      // the quote is the whole distinction: 'bx:search' is a positional value,
      // a bare word is a boolean attribute (<a disabled>)
      if (quoted) current.push(PROP_SET, 0, buffer, POSITIONAL);
      else for (const name of splitProp(buffer)) current.push(PROP_SET, 0, true, name);
    }
    else if (mode >= MODE_PROP_SET) {
      // one op per name in the group, so every name gets the same value and
      // then the same appends
      if (buffer || (!field && mode === MODE_PROP_SET)) {
        for (const name of names) current.push(mode, 0, buffer, name);
        mode = MODE_PROP_APPEND;
      }
      if (field) {
        for (const name of names) current.push(mode, field, 0, name);
        mode = MODE_PROP_APPEND;
      }
    }

    buffer = '';
    quoted = false;
    group  = false;
  };

  for (let i = 0; i < statics.length; i++) {
    if (i) {
      if (mode === MODE_TEXT) commit();
      commit(i);
    }

    for (let j = 0; j < statics[i].length; j++) {
      char = statics[i][j];

      if (mode === MODE_TEXT) {
        if (char === '<') {
          commit();
          current = [current];
          mode = MODE_TAGNAME;
        }
        else buffer += char;
      }
      else if (mode === MODE_COMMENT) {
        // ignore everything until the last three characters are '-', '-' and '>'
        if (buffer === '--' && char === '>') {
          mode = MODE_TEXT;
          buffer = '';
        }
        else buffer = char + buffer[0];
      }
      else if (quote) {
        if (char === quote) { quote = ''; if (mode === MODE_WHITESPACE) quoted = true; }
        else buffer += char;
      }
      else if (char === '"' || char === "'") {
        quote = char;
      }
      else if (char === '>') {
        commit();
        mode = MODE_TEXT;
      }
      else if (!mode) {} // ignore everything until the tag ends
      else if (char === '=') {
        mode   = MODE_PROP_SET;
        names  = splitProp(buffer);
        buffer = '';
        group  = false;
      }
      else if (char === '/' && (mode < MODE_PROP_SET || statics[i][j + 1] === '>')) {
        commit();
        if (mode === MODE_TAGNAME) current = current[0];
        mode = current;
        (current = current[0]).push(CHILD_RECURSE, 0, mode);
        mode = MODE_SLASH;
      }
      // a bracketed prop group — [id, title]='x' — is a single token although
      // it may hold whitespace, so the brackets suspend the space boundary
      else if (char === '[' && mode === MODE_WHITESPACE && !buffer) {
        group  = true;
        buffer = char;
      }
      else if (char === ']' && group) {
        group   = false;
        buffer += char;
      }
      else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        // <a disabled>
        if (!group) { commit(); mode = MODE_WHITESPACE; }
      }
      else buffer += char;

      if (mode === MODE_TAGNAME && buffer === '!--') {
        mode = MODE_COMMENT;
        current = current[0];
      }
    }
  }

  commit();

  return current;
}

// :::::: SHORTHAND TAGS ::::::::::::::::::::::::::::::::::::::::

/*
a shorthand is a tag whose name starts with $ and resolves through a registry:

  html.define('icon', { tag: 'aufbau-icon', args: ['icon', 'size'], props: { mode: 'mask' } });

  <$icon 'bx:search' />          ->  <aufbau-icon icon="bx:search" mode="mask">
  <$icon 'bx:search' '2em' />    ->  <aufbau-icon icon="bx:search" size="2em" mode="mask">
  <$icon 'x' mode="image" />     ->  <aufbau-icon icon="x" mode="image">
*/

// 'aufbau-icon' | Component | { tag, args?, props? }
function normalizeTag (spec) {
  if (isString(spec) || isFn(spec)) return { tag: spec, args: [], props: null };
  if (!isObject(spec)) throw new Error('[htx] a shorthand is a tag name, a component, or { tag, args, props }');

  // a single positional needs no array around it
  const args = spec.args ?? [];

  return { tag: spec.tag, args: isString(args) ? [args] : args, props: spec.props ?? null };
}

function resolveTag (props, entry) {
  const out = {};

  // defaults first, so a class or style written on the tag appends to them
  // instead of replacing them
  if (entry?.props) for (const key in entry.props) setProp(out, key, entry.props[key]);

  if (props) {
    for (const key in props) setProp(out, key, props[key]);
    for (const symbol of [CLASSES, STYLES]) {
      if (props[symbol]) out[symbol] = [...(out[symbol] ?? []), ...props[symbol]];
    }
  }

  const positional = props?.[POSITIONAL];
  if (!positional) return [out, []];

  const args  = entry?.args ?? [];
  const extra = [];

  for (let i = 0; i < positional.length; i++) {
    const name = args[i];

    if (!name) extra.push(positional[i]);
    else if (!props || !(name in props)) out[name] = positional[i];
  }

  return [out, extra];
}

// :::::: TAG FUNCTION

function createHtml (h, Fragment, { memo = true, tags } = {}) {
  const cache      = new Map;
  const normalized = new Map;
  const registry   = {};

  // keyed on the spec object, so reassigning a tag re-normalises it
  const entryFor = (name) => {
    const spec = registry[name] ?? registry['$' + name];
    if (!spec) return null;

    let entry = normalized.get(spec);
    if (!entry) normalized.set(spec, entry = normalizeTag(spec));

    return entry;
  };

  const hx = function (type, props, ...children) {
    const shorthand = isString(type) && type[0] === '$';
    let entry = null;

    if (shorthand) {
      entry = entryFor(type.slice(1));
      // silently rendering a <$foo> element would be a typo nobody finds: as a
      // tag name it is invalid for createElement and merely unknown to a vdom
      if (!entry) throw new Error(`[htx] unknown shorthand tag <${type}>`);
      type = entry.tag;
    }

    // a positional on a plain tag has nowhere to go but the children, which
    // makes <div 'text' /> read as <div>text</div>
    if (!shorthand && !props?.[POSITIONAL]) return h.apply(this, [type || Fragment, finalize(props), ...children]);

    const [resolved, extra] = resolveTag(props, entry);
    return h.apply(this, [type || Fragment, finalize(resolved), ...extra, ...children]);
  };

  function html (statics) {
    let built = cache.get(statics);
    if (!built) cache.set(statics, built = build(statics));

    const result = evaluate(hx, built, arguments, [], memo);
    return result.length > 1 ? result : result[0];
  }

  /** define('icon', spec) or define({ icon: spec, box: spec }) */
  html.define = (name, spec) => {
    Object.assign(registry, isString(name) ? { [name]: spec } : name);
    return html;
  };

  html.tags = registry;

  // use('md', fn) or use({ md: fn, … })
  html.use = (name, fn) => {
    const helpers = isString(name) ? { [name]: fn } : name;

    // a helper named after the api would replace it, and the failure would
    // show up far from the call that caused it
    for (const key of Object.keys(helpers)) {
      if (key === 'define' || key === 'tags' || key === 'use') throw new Error(`[htx] '${key}' is part of the html api and cannot be a helper`);
    }

    Object.assign(html, helpers);
    return html;
  };

  if (tags) html.define(tags);

  return html;
}

export { createHtml, build, evaluate, POSITIONAL, RAW_HTML };
export default createHtml;
