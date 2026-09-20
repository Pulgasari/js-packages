// @pulgasari/devtools/panels/dom.js
//
// the element panel: a lazy tree of the live document, an on-page highlight, a
// pick mode, and a detail view for whatever is selected.
//
// pick mode is the part that matters on a phone. there is no hover, so the way
// you get from "this box looks wrong" to the node behind it is to tap it — the
// tree alone is unusable for finding anything in a real page.
//
// the panel's own subtree is excluded everywhere: it is in the document it is
// inspecting, and without the guard the tree contains itself and every pick
// lands on a devtools row.

import createElement from '@domina/methods/createElement.js';

import fmt from '../fmt.js';

const el = createElement;

const PANEL_ID   = 'devtools';
const MAX_CHILDREN = 300; // a table with 5000 rows would build 5000 rows

const isOurs = (node) => !!node?.closest?.(`#${PANEL_ID}, #devtools-highlight`);

// :::::: HIGHLIGHT :::::::::::::::::::::::::::::::::::::::::::::

/*
one fixed box plus a label, appended to <body> rather than into the panel so the
panel's own overflow cannot clip it. pointer-events stay off throughout — pick
mode reads elementFromPoint(), and a highlight that could be hit would return
itself for every tap.
*/
const $highlight = el('div', { id: 'devtools-highlight', className: 'hidden' },
  el('div', { className: 'dt-hl-box' }),
  el('div', { className: 'dt-hl-label' }),
);

const $hlBox   = $highlight.firstElementChild;
const $hlLabel = $highlight.lastElementChild;

function highlight (element) {
  if (!element?.getBoundingClientRect) return hideHighlight();

  const rect = element.getBoundingClientRect();
  if (!rect.width && !rect.height) return hideHighlight();

  Object.assign($hlBox.style, {
    insetInlineStart: `${rect.left}px`,
    insetBlockStart : `${rect.top}px`,
    inlineSize      : `${rect.width}px`,
    blockSize       : `${rect.height}px`,
  });

  $hlLabel.textContent = `${tagLabel(element)}  ${Math.round(rect.width)} × ${Math.round(rect.height)}`;

  // the label goes below the box when there is no room above it
  const above = rect.top > 24;
  Object.assign($hlLabel.style, {
    insetInlineStart: `${Math.max(0, rect.left)}px`,
    insetBlockStart : `${above ? rect.top - 22 : rect.bottom + 2}px`,
  });

  $highlight.classList.remove('hidden');
}

const hideHighlight = () => $highlight.classList.add('hidden');

// :::::: LABELS ::::::::::::::::::::::::::::::::::::::::::::::::

const tagLabel = (element) => {
  const id      = element.id ? `#${element.id}` : '';
  const classes = element.classList?.length ? `.${[...element.classList].join('.')}` : '';
  return `${element.localName}${id}${classes}`;
};

// the selector path back to the root, which is what you copy out and paste into
// a query. nth-of-type only where nothing more stable is available
function pathOf (element) {
  const parts = [];

  for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
    if (node.id) { parts.unshift(`#${node.id}`); break; }

    const siblings = node.parentElement ? [...node.parentElement.children].filter(child => child.localName === node.localName) : [];
    parts.unshift(siblings.length > 1 ? `${node.localName}:nth-of-type(${siblings.indexOf(node) + 1})` : node.localName);
  }

  return parts.join(' > ');
}

/*
cssText, not [...rule.style]: iterating the declaration enumerates the expanded
longhands, so an authored `border: 2px solid red` reads back as seventeen lines.
the cssom re-serialises shorthands in cssText, which is what was written.

it splits on a semicolon followed by whitespace rather than on any semicolon,
because a data: url carries its own (`url(data:image/svg+xml;base64,…)`) and the
serialisation never puts a space after that one.
*/
const declarations = (rule) => {
  const text = rule.style.cssText;
  if (!text) return '  /* empty */';

  return text.split(/;\s+/).filter(Boolean)
    .map(declaration => `  ${declaration.replace(/;$/, '')};`)
    .join('\n');
};

// :::::: PANEL :::::::::::::::::::::::::::::::::::::::::::::::::

// a curated default, because getComputedStyle exposes around 340 properties and
// a wall of them answers nothing. everything else is one filter keystroke away
const KEY_STYLES = [
  'display', 'position', 'inset-block-start', 'inset-inline-start', 'z-index',
  'inline-size', 'block-size', 'margin', 'padding', 'border', 'overflow',
  'flex', 'flex-direction', 'gap', 'grid-template-columns', 'align-items', 'justify-content',
  'color', 'background-color', 'font-family', 'font-size', 'line-height',
  'opacity', 'transform', 'visibility', 'pointer-events',
];

export function createDomPanel () {
  document.body.append($highlight);

  let selected = null;
  let picking  = false;

  let rows = new WeakMap(); // element -> its <details> row, rebuilt with the tree

  // ── tree

  const $tree = el('div', { className: 'dt-tree' });

  function childrenOf (element) {
    const out = [];

    for (const node of element.childNodes) {
      if (node.nodeType === 1 && !isOurs(node)) out.push(node);
      // a text node only earns a row when it carries something
      else if (node.nodeType === 3 && node.data.trim()) out.push(node);
      else if (node.nodeType === 8) out.push(node);

      if (out.length >= MAX_CHILDREN) break;
    }

    return out;
  }

  function buildRow (node) {
    if (node.nodeType === 3) {
      return el('div', { className: 'dt-tree-row is-text', textContent: `"${fmt.truncate(node.data.trim(), 60)}"` });
    }

    if (node.nodeType === 8) {
      return el('div', { className: 'dt-tree-row is-comment', textContent: `<!-- ${fmt.truncate(node.data.trim(), 50)} -->` });
    }

    const kids     = childrenOf(node);
    const $label   = el('span', { className: 'dt-tree-tag', textContent: tagLabel(node) });
    const $summary = el('summary', { className: 'dt-tree-row' }, $label);
    const $details = el('details', { className: `dt-tree-node${kids.length ? '' : ' is-leaf'}` }, $summary);

    // tapping the row selects; only the disclosure triangle expands. on a phone
    // one gesture has to mean one thing
    $summary.addEventListener('click', (event) => {
      event.preventDefault();
      select(node);
    });

    let built = false;
    const build = () => {
      if (built) return;
      built = true;
      for (const child of childrenOf(node)) $details.append(buildRow(child));
      if (!kids.length) $details.append(el('div', { className: 'dt-tree-row is-empty', textContent: '(empty)' }));
    };

    // built here rather than in the toggle handler, because reveal() has to open
    // a chain of ancestors synchronously and toggle fires a task too late
    $details.addEventListener('toggle', build);
    $details._build = build;

    rows.set(node, $details);
    return $details;
  }

  const expand = ($details) => { $details._build?.(); $details.open = true; };

  /** opens every ancestor of an element so its own row exists and is on screen */
  function reveal (element) {
    const chain = [];
    for (let node = element; node && node !== document.documentElement; node = node.parentElement) chain.unshift(node);

    let $row = rows.get(document.documentElement);
    if (!$row) return null;
    expand($row);

    for (const node of chain) {
      const $next = rows.get(node);
      if (!$next) break;
      $row = $next;
      expand($row);
    }

    return rows.get(element) ?? $row;
  }

  function renderTree () {
    rows = new WeakMap();
    $tree.replaceChildren(buildRow(document.documentElement));
    expand(rows.get(document.documentElement));
  }

  // ── details

  const $detail = el('div', { className: 'dt-detail' });

  let styleFilter = '';
  const $styleFilter = el('input', {
    type: 'search', placeholder: 'filter styles…', autocapitalize: 'off', spellcheck: false,
    onInput: (event) => { styleFilter = event.target.value.trim().toLowerCase(); renderDetail(); },
  });

  // ── matched rules
  /*
  getMatchedCSSRules was removed years ago, so the only way to answer "which rule
  is doing this" is to walk every sheet and test the selectors ourselves. a
  cross-origin sheet throws on .cssRules and is reported as such rather than
  silently left out — an unexplained missing rule is worse than a named gap.
  */
  function matchedRules (element) {
    const found = [];
    let blocked = 0;

    // @media (…) / @supports (…) / @layer name, for the source column
    const groupLabel = (rule) => {
      const kind = rule.constructor.name.replace(/^CSS|Rule$/g, '').toLowerCase();
      return `@${kind} ${rule.conditionText ?? rule.name ?? ''}`.trim();
    };

    const walk = (rules, context, parent) => {
      for (const rule of rules ?? []) {
        const selector = rule.selectorText;

        /*
        selectorText is tested before cssRules, and the order is not cosmetic:
        since css nesting, every CSSStyleRule exposes a cssRules list (usually
        empty), so a `if (rule.cssRules)` branch placed first swallows every
        ordinary rule and nothing ever matches.
        */
        if (selector) {
          // a nested rule's selectorText still carries the & placeholder, which
          // matches() cannot parse. resolving it against the parent is what makes
          // a nested sheet show up at all — devtools.css is one
          const resolved = parent ? selector.replaceAll('&', `:is(${parent})`) : selector;

          // a selector with ::before or an unsupported syntax throws here; it
          // cannot apply to the element itself anyway
          // a rule with no declarations of its own is a pure nesting container:
          // it contributes nothing, and its children are walked below anyway
          try {
            if (rule.style.cssText && element.matches(resolved)) found.push({ rule, context, selector: resolved });
          } catch {}

          if (rule.cssRules?.length) walk(rule.cssRules, context, resolved);
          continue;
        }

        // a grouping rule: @media, @supports, @layer, @container
        if (rule.cssRules) walk(rule.cssRules, [context, groupLabel(rule)].filter(Boolean).join(' '), parent);
      }
    };

    /*
    getMatchedCSSRules was removed years ago, so the only way to answer "which
    rule is doing this" is to walk every sheet and test the selectors ourselves.
    a cross-origin sheet throws on .cssRules and is reported as such rather than
    silently left out — an unexplained missing rule is worse than a named gap.
    */
    for (const sheet of [...document.styleSheets, ...document.adoptedStyleSheets]) {
      let rules;
      // only the access is guarded: wrapping the whole walk would blame the sheet
      // for any error raised deeper in
      try { rules = sheet.cssRules; } catch { blocked++; continue; }
      walk(rules, '', '');
    }

    return { found, blocked };
  }

  function boxModel (element) {
    const style = getComputedStyle(element);
    const rect  = element.getBoundingClientRect();
    const side  = (prop) => ['top', 'right', 'bottom', 'left']
      .map(edge => parseFloat(style.getPropertyValue(`${prop}-${edge}${prop === 'border' ? '-width' : ''}`)) || 0);

    return { rect, margin: side('margin'), border: side('border'), padding: side('padding') };
  }

  const row = (key, value, className = '') => el('div', { className: 'dt-row' },
    el('span', { className: 'dt-key', textContent: key }),
    el('span', { className: `dt-val ${className}`, textContent: value }),
  );

  function renderDetail () {
    if (!selected) {
      $detail.replaceChildren(el('p', { className: 'dt-empty', textContent: 'nothing selected — tap a row, or use pick' }));
      return;
    }

    const style = getComputedStyle(selected);
    const box   = boxModel(selected);
    const parts = [];

    // ── path
    parts.push(el('div', { className: 'dt-detail-head' },
      el('code', { className: 'dt-path', textContent: pathOf(selected) }),
      el('button', {
        type: 'button', className: 'dt-btn', textContent: 'copy',
        onClick: (event) => {
          navigator.clipboard?.writeText(pathOf(selected)).then(() => { event.target.textContent = 'copied'; });
        },
      }),
    ));

    // ── box model
    const edges = (list) => list.every(value => value === list[0]) ? String(list[0]) : list.join(' / ');
    parts.push(section('box model', [
      row('size',    `${Math.round(box.rect.width)} × ${Math.round(box.rect.height)}`),
      row('position', `${Math.round(box.rect.left)}, ${Math.round(box.rect.top)}`),
      row('margin',  edges(box.margin)),
      row('border',  edges(box.border)),
      row('padding', edges(box.padding)),
    ]));

    // ── attributes
    const attrs = [...selected.attributes];
    parts.push(section(`attributes (${attrs.length})`, attrs.length
      ? attrs.map(attribute => row(attribute.name, fmt.truncate(attribute.value, 80)))
      : [el('p', { className: 'dt-empty', textContent: 'none' })]));

    // ── computed styles
    const keys = styleFilter
      ? [...style].filter(prop => prop.includes(styleFilter)).slice(0, 80)
      : KEY_STYLES;

    parts.push(section(`computed${styleFilter ? '' : ' (key properties)'}`, [
      $styleFilter,
      ...keys.map(prop => row(prop, style.getPropertyValue(prop) || '—')),
      ...(styleFilter ? [] : [el('p', { className: 'dt-note', textContent: 'filter above to reach any of the ~340 computed properties' })]),
    ]));

    // ── matched rules
    const { found, blocked } = matchedRules(selected);
    parts.push(section(`matched rules (${found.length})`, [
      ...found.slice(0, 40).map(({ rule, context, selector }) => el('div', { className: 'dt-rule' },
        el('div', { className: 'dt-rule-head' },
          el('code', { textContent: selector }),
          el('span', { className: 'dt-rule-src', textContent: context || sourceOf(rule) }),
        ),
        el('pre', { className: 'dt-rule-body', textContent: declarations(rule) }),
      )),
      ...(found.length ? [] : [el('p', { className: 'dt-empty', textContent: 'no rule matches this element' })]),
      el('p', { className: 'dt-note', textContent: 'listed in sheet order, which is the cascade order — the last match for a property is the one that wins. specificity is not weighed in.' }),
      ...(blocked ? [el('p', { className: 'dt-note', textContent: `${fmt.plural(blocked, 'stylesheet')} could not be read (cross-origin), so rules in them are not listed` })] : []),
    ]));

    // the filter input is moved, not rebuilt, but replaceChildren still detaches
    // it — without this the caret jumps to the end on every keystroke
    const caret = $styleFilter === document.activeElement ? $styleFilter.selectionStart : null;

    $detail.replaceChildren(...parts);

    if (caret !== null) { $styleFilter.focus(); $styleFilter.setSelectionRange(caret, caret); }
  }

  const sourceOf = (rule) => {
    const href = rule.parentStyleSheet?.href;
    return href ? fmt.url(href, 28) : 'adopted / inline';
  };



  function section (label, children) {
    const $details = el('details', { className: 'dt-section', open: true },
      el('summary', {}, el('span', { textContent: label })));
    $details.append(el('div', { className: 'dt-body' }, ...children));
    return $details;
  }

  // ── selection

  function select (element, { scroll = false } = {}) {
    selected = element;
    globalThis.$0 = element; // the console helper, finally pointing at something

    for (const $row of $tree.querySelectorAll('.is-selected')) $row.classList.remove('is-selected');

    const $row = rows.get(element);
    $row?.firstElementChild?.classList.add('is-selected');
    if (scroll) $row?.firstElementChild?.scrollIntoView({ block: 'center' });

    highlight(element);
    renderDetail();
  }

  // ── pick mode

  const swallow = (event) => { event.preventDefault(); event.stopPropagation(); };

  function onPick (event) {
    if (!picking) return;
    swallow(event);

    // pointerdown covers touch, mouse and pen; click and touchstart are listened
    // to only so they can be cancelled as well
    if (event.type !== 'pointerdown') return;

    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (!element || isOurs(element)) return;

    setPicking(false);

    // cancelling pointerdown does not stop the click that follows it, so one more
    // is swallowed on the way out — otherwise picking a button also presses it
    document.addEventListener('click', swallow, { capture: true, once: true });

    reveal(element);
    select(element, { scroll: true });
  }

  const $pick = el('button', { type: 'button', className: 'dt-btn', textContent: 'pick', onClick: () => setPicking(!picking) });

  function setPicking (on) {
    picking = on;
    $pick.classList.toggle('is-armed', on);
    $pick.textContent = on ? 'tap an element…' : 'pick';
    document.documentElement.classList.toggle('dt-picking', on);

    const method = on ? 'addEventListener' : 'removeEventListener';
    for (const type of ['pointerdown', 'click', 'touchstart']) document[method](type, onPick, true);
  }

  // ── selector search: on a phone, scrolling a tree to find a node is hopeless
  const $find = el('input', {
    type: 'search', placeholder: 'querySelector…', autocapitalize: 'off', spellcheck: false,
    onKeyDown: (event) => {
      if (event.key !== 'Enter') return;

      let match = null;
      try { match = document.querySelector(event.target.value); } catch { return; }
      if (!match || isOurs(match)) return;

      reveal(match);
      select(match, { scroll: true });
    },
  });

  const $refresh = el('button', {
    type: 'button', className: 'dt-btn', textContent: 'refresh',
    onClick: () => { renderTree(); if (selected?.isConnected) { reveal(selected); select(selected, { scroll: true }); } },
  });

  const $content = el('div', { className: 'dt-dom' },
    el('div', { className: 'dt-filter' }, $pick, $find, $refresh),
    $tree,
    $detail,
  );

  renderTree();
  renderDetail();

  return {
    $content,

    onShow () {
      // the tree is a snapshot; the page has moved on since it was built
      renderTree();
      if (selected?.isConnected) { reveal(selected); select(selected); } else { selected = null; renderDetail(); }
    },

    onHide () { setPicking(false); hideHighlight(); },
  };
}

export default createDomPanel;
