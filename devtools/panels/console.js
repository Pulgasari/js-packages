// @pulgasari/devtools/panels/console.js
//
// the console panel: a filtered view over the ring buffer, an eval input, and a
// lazy inspector per logged value.
//
// the buffer is not this module's own. boot.js in the host page installs a
// recorder from <head>, long before this module can run, so everything logged
// during boot is already there when the panel mounts. this drains it and then
// receives further entries through the recorder's onPush hook. without a
// recorder (devtools dropped into a page that has no shim) it patches console
// itself and simply starts from the moment it loaded.

import createElement from '@domina/methods/createElement.js';

import settings          from '../settings.js';
import { inspect }      from './inspect.js';
import { formatParts, signature } from './format.js';

const el = createElement;

const LEVELS = ['log', 'info', 'warn', 'error', 'debug'];

// the eval echo and its result are rows in the same stream, but not filterable
// levels — they always show. trace folds into debug: a separate toggle for it
// buys a button nobody presses
const PASSTHROUGH = new Set(['input', 'result']);
const levelOf = (level) =>
    level === 'trace'        ? 'debug'
  : PASSTHROUGH.has(level)   ? level
  : LEVELS.includes(level)   ? level
  :                            'log';

// :::::: BUFFER ::::::::::::::::::::::::::::::::::::::::::::::::

const entries = [];
let sink = null; // set by the panel; the buffer fills whether or not it is open

function record (entry) {
  const level = levelOf(entry.level);
  const sig   = signature(level, entry.args);
  const last  = entries[entries.length - 1];

  // a log inside a raf loop would otherwise eat the whole buffer in a second
  if (settings.get('dedupe') && last && last.sig === sig) {
    last.count++;
    last.time = entry.time;
    sink?.bump(last);
    return;
  }

  const row = { level, args: entry.args, time: entry.time ?? Date.now(), sig, count: 1 };
  entries.push(row);

  const limit = settings.get('logLimit');
  if (entries.length > limit) { entries.splice(0, entries.length - limit); sink?.trim(); }

  sink?.add(row);
}

function takeOver () {
  const recorder = globalThis.__DEVTOOLS_RECORDER__;

  if (recorder) {
    for (const entry of recorder.entries) record(entry);
    // from here the recorder keeps buffering for anyone else and forwards to us
    recorder.onPush = record;
    return;
  }

  // standalone: no shim in the host page, so wrap console here and accept that
  // everything before this module evaluated is lost
  for (const level of [...LEVELS, 'trace']) {
    const native = console[level]?.bind(console) ?? (() => {});
    console[level] = (...args) => { record({ level, args, time: Date.now() }); native(...args); };
  }

  addEventListener('error', (event) => {
    const source = event.target && event.target !== globalThis && (event.target.src || event.target.href);
    record({ level: 'error', args: source ? [`failed to load: ${source}`] : [event.error ?? event.message], time: Date.now() });
  }, true);

  addEventListener('unhandledrejection', (event) =>
    record({ level: 'error', args: ['unhandled rejection:', event.reason], time: Date.now() }));
}

takeOver();

// :::::: EVAL ::::::::::::::::::::::::::::::::::::::::::::::::::

// indirect eval runs in global scope, so `var` lands on globalThis and the page's
// own globals are visible. a direct eval() would see this module's scope instead,
// which is the opposite of what a console is for
const globalEval = eval;

/*
expression first: wrapping in parens makes `{ a: 1 }` parse as an object literal
rather than a block with a label, which is what makes `$_` and object results work
at all. a statement (`let x = 1`, `if (…) …`) fails that parse, so the bare source
is the fallback — the same two step chrome uses.
*/
function compile (source) {
  const isAsync = /\bawait\b/.test(source);

  const attempt = (body) => isAsync ? `(async () => { return ${body} })()` : body;

  try   { return globalEval(attempt(`(${source}\n)`)); }
  catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return globalEval(isAsync ? `(async () => { ${persist(source)}\n })()` : persist(source));
  }
}

/*
a top level `let`/`const` binds inside the eval's own lexical scope and is gone
the moment it returns, so `let x = 1` followed by `x` reads as undefined — only
`var` and function declarations reach globalThis. rewriting the leading keyword
is what makes a console feel like a repl, and is what chrome's does. only the
first keyword of the whole source is touched, so a `const` inside a block body
keeps its meaning.
*/
const persist = (source) => source.replace(/^(\s*)(?:let|const)\s/, '$1var ');

// $_ and $$ are installed only if the page has not already claimed them
function installHelpers () {
  try {
    if (!('$$' in globalThis)) globalThis.$$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    if (!('$_' in globalThis)) globalThis.$_ = undefined;
  } catch {}
}

// :::::: PANEL :::::::::::::::::::::::::::::::::::::::::::::::::

const HISTORY_KEY = 'devtools:console:history';
const VISIBLE_MAX = 250; // rows in the dom, not entries in the buffer

export function createConsolePanel () {
  installHelpers();

  const active = new Set(LEVELS); // which levels pass the filter
  let needle   = '';
  let pinned   = true;            // autoscroll, released as soon as you scroll up

  const $list   = el('div', { className: 'dt-log' });
  const $counts = {};

  // ── filter bar
  const $levels = el('div', { className: 'dt-levels' });

  for (const level of LEVELS) {
    const $count  = el('span', { className: 'dt-level-count', textContent: '0' });
    const $toggle = el('button', {
      type      : 'button',
      className : 'dt-level is-on',
      dataset   : { level },
      onClick   : () => {
        active.has(level) ? active.delete(level) : active.add(level);
        $toggle.classList.toggle('is-on', active.has(level));
        render();
      },
    }, el('span', { textContent: level }), $count);

    $counts[level] = $count;
    $levels.append($toggle);
  }

  const $search = el('input', {
    type: 'search', placeholder: 'filter…', autocapitalize: 'off', autocorrect: 'off', spellcheck: false,
    onInput: (event) => { needle = event.target.value.trim().toLowerCase(); render(); },
  });

  const $clear = el('button', {
    type: 'button', className: 'dt-btn', textContent: 'clear',
    onClick: () => { entries.length = 0; render(); },
  });

  const $filter = el('div', { className: 'dt-filter' }, $search, $clear);

  // ── input
  const $input = el('textarea', {
    className: 'dt-input', rows: 1, placeholder: '›  expression', spellcheck: false,
    autocapitalize: 'off', autocorrect: 'off', autocomplete: 'off',
  });

  let recent = [];
  try { recent = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'); } catch {}
  let cursor = recent.length;

  const grow = () => { $input.style.height = 'auto'; $input.style.height = `${Math.min($input.scrollHeight, 120)}px`; };

  function run () {
    const source = $input.value.trim();
    if (!source) return;

    recent = [...recent.filter(item => item !== source), source].slice(-50);
    cursor = recent.length;
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(recent)); } catch {}

    $input.value = '';
    grow();

    record({ level: 'input', args: [source], time: Date.now() });

    let result;
    try { result = compile(source); }
    catch (error) { record({ level: 'error', args: [error], time: Date.now() }); return; }

    // a thenable is awaited so the panel shows the settled value, not "Promise"
    if (result && typeof result.then === 'function') {
      result.then(
        value  => { globalThis.$_ = value; record({ level: 'result', args: [value], time: Date.now() }); },
        reason => record({ level: 'error', args: [reason], time: Date.now() }),
      );
      return;
    }

    globalThis.$_ = result;
    record({ level: 'result', args: [result], time: Date.now() });
  }

  $input.addEventListener('input', grow);
  $input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); run(); return; }

    // history only when the caret cannot move any further in that direction, so
    // arrow keys still navigate a multi-line draft
    if (event.key === 'ArrowUp' && $input.selectionStart === 0 && cursor > 0) {
      event.preventDefault();
      $input.value = recent[--cursor] ?? '';
      grow();
    } else if (event.key === 'ArrowDown' && $input.selectionStart === $input.value.length && cursor < recent.length) {
      event.preventDefault();
      $input.value = recent[++cursor] ?? '';
      grow();
    }
  });

  const $run  = el('button', { type: 'button', className: 'dt-btn dt-run', textContent: 'run', onClick: run });
  const $form = el('div', { className: 'dt-console-input' }, $input, $run);

  // ── rendering

  const passes = (row) => (active.has(row.level) || PASSTHROUGH.has(row.level))
    && (!needle || textOf(row).toLowerCase().includes(needle));

  // only built for filtering, and only for the rows on screen
  const textOf = (row) => {
    try { return row.args.map(arg => typeof arg === 'string' ? arg : String(arg?.message ?? arg)).join(' '); }
    catch { return ''; }
  };

  function rowElement (row) {
    const $row  = el('div', { className: `dt-log-row is-${row.level}`, dataset: { level: row.level } });
    const $body = el('div', { className: 'dt-log-body' });

    if (settings.get('timestamps')) {
      $body.append(el('span', { className: 'dt-log-time', textContent: new Date(row.time).toTimeString().slice(0, 8) }));
    }

    if (row.level === 'input')  $body.append(el('span', { className: 'dt-log-caret', textContent: '›' }));
    if (row.level === 'result') $body.append(el('span', { className: 'dt-log-caret', textContent: '‹' }));

    for (const part of formatParts(row.args)) {
      if (part.kind === 'text') {
        $body.append(el('span', { textContent: part.text, ...(part.style && { style: part.style }) }));
      } else {
        $body.append(inspect(part.value));
      }
    }

    const $count = el('span', { className: 'dt-log-count', textContent: row.count > 1 ? String(row.count) : '' });
    $row.append($body, $count);

    row.$el    = $row;
    row.$count = $count;

    return $row;
  }

  const atBottom = () => $list.scrollHeight - $list.scrollTop - $list.clientHeight < 40;
  const toBottom = () => { $list.scrollTop = $list.scrollHeight; };

  function render () {
    const visible = entries.filter(passes).slice(-VISIBLE_MAX);
    $list.replaceChildren(...visible.map(rowElement));

    if (!visible.length) {
      $list.append(el('p', { className: 'dt-empty', textContent: entries.length ? 'nothing matches the filter' : 'nothing logged yet' }));
    }

    const tally = Object.fromEntries(LEVELS.map(level => [level, 0]));
    for (const row of entries) if (tally[row.level] !== undefined) tally[row.level]++;
    for (const level of LEVELS) $counts[level].textContent = String(tally[level]);

    if (pinned) toBottom();
  }

  // incremental: appending one row beats rebuilding the list on every log line
  sink = {
    add (row) {
      if (!passes(row)) return;
      const stick = pinned && atBottom();

      $list.querySelector('.dt-empty')?.remove();
      $list.append(rowElement(row));

      while ($list.childElementCount > VISIBLE_MAX) $list.firstElementChild.remove();
      if (stick) toBottom();

      const $count = $counts[row.level];
      if ($count) $count.textContent = String(Number($count.textContent) + 1);
    },

    bump (row) {
      if (!row.$count) return;
      row.$count.textContent = String(row.count);
      if (pinned && atBottom()) toBottom();
    },

    trim () { while ($list.childElementCount > VISIBLE_MAX) $list.firstElementChild.remove(); },
  };

  // scrolling up releases the pin, scrolling back to the bottom takes it again
  $list.addEventListener('scroll', () => { pinned = atBottom(); }, { passive: true });

  settings.subscribe((key) => { if (key === 'timestamps' || key === 'dedupe' || key === 'logLimit' || key === null) render(); });

  const $content = el('div', { className: 'dt-console' }, $levels, $filter, $list, $form);

  return {
    $content,
    onShow () { render(); pinned = true; toBottom(); },
  };
}

export default createConsolePanel;
