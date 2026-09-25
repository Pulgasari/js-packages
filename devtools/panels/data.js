// panels/data.js

/*
1. a value the browser has no api for is rendered as missing, never as 0.
2. anything expensive sits behind an explicit button. (like reading cache bodies, counting object stores)
   a panel that measures continuously changes the numbers it is measuring.
3. polling only runs while the panel is actually visible.
*/

import createElement from '@domina/methods/createElement.js';
import fmt           from '../fmt.js';
import settings      from '../settings.js';
import { button }    from './kit.js';

// :::::: FEATURE PROBES ::::::::::::::::::::::::::::::::::::::::

const conn     = navigator.connection ?? navigator.mozConnection ?? navigator.webkitConnection ?? null;
const hasCache = typeof caches !== 'undefined'; // undefined outside a secure context
const MAX_ENTRIES = 1000;

const SECTIONS_KEY = 'devtools:data:sections';

// :::::: DOM KIT :::::::::::::::::::::::::::::::::::::::::::::::

const el = createElement;

/**
 * a label/value list. rows are built once and then written through their
 * setters, so polling never touches the dom structure — only text nodes.
 */
function createRows () {
  // the key/value pairs share one <dl>, which is also what lays the two columns
  // out. anything else a section needs goes after it, in document order
  const $list = el('dl');
  const $el   = el('div', {}, $list);

  return {
    $el,

    /** @returns {(value: string, state?: string) => void} */
    add (label) {
      const $value = el('dd', { textContent: '—' });
      $list.append(el('dt', { textContent: label }), $value);

      return (value, state) => {
        $value.textContent = value ?? '—';
        state ? $value.dataset.state = state : delete $value.dataset.state;
      };
    },

    note (text) { $el.append(el('small', { textContent: text })); return this; },
    add$ (node) { $el.append(node); return node; },
  };
}

/** a labelled bar. returns a setter taking the raw used/total pair. */
function createMeter (label) {
  const $value = el('dd', { textContent: '—' });
  const $bar   = el('aufbau-progress', { value: 0, max: 100 });
  const $meter = el('div', {}, el('dl', {}, el('dt', { textContent: label }), $value), $bar);

  const set = (used, total, suffix = '') => {
    if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) {
      $value.textContent  = 'n/a';
      $value.dataset.state = 'missing';
      $bar.setAttribute('value', 0);
      return;
    }

    const share = used / total * 100;
    delete $value.dataset.state;
    $value.textContent = `${fmt.bytes(used)} / ${fmt.bytes(total)}${suffix} · ${share.toFixed(share < 10 ? 1 : 0)}%`;
    $bar.setAttribute('value', Math.min(share, 100).toFixed(1));
    $meter.dataset.state = share > 90 ? 'bad' : share > 70 ? 'warn' : 'ok';
    $value.dataset.state = $meter.dataset.state === 'ok' ? '' : $meter.dataset.state;
  };

  return { $el: $meter, set };
}

const actions = (...$buttons) => el('div', {}, ...$buttons);

/** a <details> section with a header badge and a refresh hook */
function createSection ({ id, label, open = false }) {
  const $badge   = el('small');
  const $summary = el('summary', {}, el('span', { textContent: label }), $badge);
  const $details = el('details', { id: `dt-${id}` }, $summary);

  // open state is per section and survives reloads, a panel that forgets what
  // you had open is unusable on a small screen. every section shares the one key,
  // so the write re-reads instead of merging into a snapshot taken at build time,
  // which would let whichever section toggled last drop the others' state
  const readState = () => { try { return JSON.parse(localStorage.getItem(SECTIONS_KEY) ?? '{}'); } catch { return {}; } };

  $details.open = readState()[id] ?? open;

  $details.addEventListener('toggle', () => {
    try { localStorage.setItem(SECTIONS_KEY, JSON.stringify({ ...readState(), [id]: $details.open })); } catch {}
  });

  return { $el: $details, badge: (text) => { $badge.textContent = text ?? ''; } };
}

// :::::: SECTION: RUNTIME ::::::::::::::::::::::::::::::::::::::

function runtimeSection () {
  const section = createSection({ id: 'runtime', label: 'runtime', open: true });
  const rows    = createRows();

  const online     = rows.add('online');
  const visibility = rows.add('visibility');
  const viewport   = rows.add('viewport');
  const keyboard   = rows.add('keyboard gap');
  const dpr        = rows.add('device pixel ratio');
  const cores      = rows.add('cpu cores');
  const ram        = rows.add('device memory');
  const network    = rows.add('connection');
  const worker     = rows.add('service worker');
  const persisted  = rows.add('storage persisted');

  const $swActions = actions();
  rows.$el.append($swActions);

  // deviceMemory is bucketed (0.25/0.5/1/2/4/8) and chromium only — it says what
  // class of device this is, never how much is free
  const staticRows = () => {
    cores(navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : fmt.missing(), navigator.hardwareConcurrency ? undefined : 'missing');
    ram(navigator.deviceMemory ? `${navigator.deviceMemory} GB (bucketed)` : fmt.missing('chromium only'), navigator.deviceMemory ? undefined : 'missing');
  };

  async function refresh () {
    section.badge(navigator.onLine ? 'online' : 'offline');
    online(navigator.onLine ? 'yes' : 'no', navigator.onLine ? 'good' : 'bad');
    dpr(String(devicePixelRatio)); // not static: pinch zoom and a display change both move it
    visibility(document.visibilityState);
    viewport(`${innerWidth}×${innerHeight} css px`);

    // what the virtual keyboard is eating. the single most useful number when a
    // mobile layout collapses on focus
    const vv  = globalThis.visualViewport;
    const gap = vv ? Math.round(innerHeight - vv.height) : null;
    keyboard(vv ? `${gap} px${gap > 100 ? ' (keyboard open)' : ''}` : fmt.missing(), vv ? (gap > 100 ? 'warn' : undefined) : 'missing');

    network(conn
      ? `${conn.effectiveType ?? '?'} · ${conn.downlink ?? '?'} Mbit/s · ${conn.rtt ?? '?'} ms rtt${conn.saveData ? ' · save-data' : ''}`
      : fmt.missing('chromium only'), conn ? undefined : 'missing');

    if (!navigator.serviceWorker) {
      worker(fmt.missing('unsupported'), 'missing');
    } else {
      const registration = await navigator.serviceWorker.getRegistration().catch(() => null);
      const controlled   = !!navigator.serviceWorker.controller;

      if (!registration) worker('none registered', 'warn');
      else {
        const state = registration.active?.state ?? registration.installing?.state ?? registration.waiting?.state ?? '?';
        worker(`${state}${registration.waiting ? ' · update waiting' : ''}${controlled ? '' : ' · page not controlled'}`,
               registration.waiting || !controlled ? 'warn' : 'good');
      }

      // rebuilt on every refresh so the buttons always match the current
      // registration, and vanish once it is gone
      $swActions.replaceChildren(...(registration ? [
        button('check update', () => registration.update()),
        button('unregister + reload', async () => { await registration.unregister(); location.reload(); }, { destructive: true }),
      ] : []));
    }

    if (!navigator.storage?.persisted) persisted(fmt.missing('unsupported'), 'missing');
    else {
      const isPersisted = await navigator.storage.persisted().catch(() => null);
      persisted(isPersisted === null ? fmt.missing() : isPersisted ? 'yes' : 'no — caches may be evicted',
                isPersisted ? 'good' : 'warn');
    }
  }

  rows.note('deviceMemory, connection and the heap readings below are chromium only. a dash means the browser has no api for it, not that the value is zero.');

  section.$el.append(rows.$el);
  staticRows();

  return { ...section, refresh, live: true };
}

// :::::: SECTION: MEMORY :::::::::::::::::::::::::::::::::::::::

function memorySection () {
  const section = createSection({ id: 'memory', label: 'memory' });
  const rows    = createRows();
  const heap    = createMeter('js heap');

  rows.$el.prepend(heap.$el);

  const total = rows.add('heap total');
  const nodes = rows.add('dom nodes');
  const roots = rows.add('shadow roots');

  // walking the whole tree for shadow roots is not something to do once a second,
  // so it stays a button while the plain node count rides along with the poll
  rows.$el.append(actions(button('scan shadow roots', () =>
    roots(fmt.number([...document.querySelectorAll('*')].filter(node => node.shadowRoot).length)))));

  rows.note('performance.memory is quantised and capped without cross-origin isolation, so treat it as a trend, not a measurement. measureUserAgentSpecificMemory() would be exact but needs COOP+COEP, which would break the cdn imports.');

  function refresh () {
    const memory = performance.memory;

    if (memory) {
      heap.set(memory.usedJSHeapSize, memory.jsHeapSizeLimit);
      total(fmt.bytes(memory.totalJSHeapSize));
      section.badge(fmt.bytes(memory.usedJSHeapSize));
    } else {
      heap.set(NaN, NaN);
      total(fmt.missing('chromium only'), 'missing');
      section.badge('n/a');
    }

    // no api reports detached nodes, but a node count that only ever climbs is
    // the cheapest leak signal available from inside the page
    nodes(fmt.number(document.getElementsByTagName('*').length));
  }

  section.$el.append(rows.$el);
  return { ...section, refresh, live: true };
}

// :::::: SECTION: STORAGE ::::::::::::::::::::::::::::::::::::::

// localStorage exposes no byte count, so this is an estimate: utf-16 code units
// for key and value. the real cost is implementation defined and usually higher
const measureWebStorage = (storage) => {
  const keys = [];
  let total  = 0;

  try {
    for (let i = 0; i < storage.length; i++) {
      const key  = storage.key(i);
      const size = (key.length + (storage.getItem(key)?.length ?? 0)) * 2;
      keys.push({ key, size });
      total += size;
    }
  } catch { return null; } // blocked in incognito

  return { keys: keys.sort((a, b) => b.size - a.size), total };
};

function storageSection () {
  const section = createSection({ id: 'storage', label: 'storage' });
  const rows    = createRows();
  const quota   = createMeter('origin quota');

  rows.$el.prepend(quota.$el);

  const details = rows.add('breakdown');
  const local   = rows.add('localStorage');
  const session = rows.add('sessionStorage');
  const dbs     = rows.add('indexedDB');
  const cacheRow = rows.add('cache storage');

  const $keys   = rows.add$(el('div'));
  const $caches = rows.add$(el('div'));
  const $dbs    = rows.add$(el('div'));

  // ── localStorage keys, biggest first: the point is finding the one fat key
  function renderKeys () {
    const measured = measureWebStorage(localStorage);

    if (!measured)            { local(fmt.missing('blocked'), 'missing'); $keys.replaceChildren(); return; }
    if (!measured.keys.length) { local('empty'); $keys.replaceChildren(); return; }

    local(`${fmt.bytes(measured.total)} est. · ${fmt.plural(measured.keys.length, 'key')}`,
          measured.total > 4_000_000 ? 'bad' : measured.total > 2_000_000 ? 'warn' : undefined);

    const $body = el('tbody');
    for (const { key, size } of measured.keys.slice(0, 20)) {
      $body.append(el('tr', {},
        el('td', { title: key, textContent: fmt.truncate(key, 34) }),
        el('td', { dataset: { numeric: '' }, textContent: fmt.bytes(size) }),
        el('td', {}, button('del', () => { localStorage.removeItem(key); renderKeys(); }, { destructive: true })),
      ));
    }

    $keys.replaceChildren(el('table', {},
      el('thead', {}, el('tr', {}, el('th', { textContent: 'key' }), el('th', { textContent: 'est. size' }), el('th', {}))),
      $body,
    ));
  }

  // ── caches: names and entry counts are cheap, bytes are not
  async function renderCaches () {
    if (!hasCache) { cacheRow(fmt.missing('insecure context'), 'missing'); return; }

    const names = await caches.keys().catch(() => []);
    cacheRow(names.length ? fmt.plural(names.length, 'cache') : 'empty');

    const $body = el('tbody');

    for (const name of names) {
      const cache = await caches.open(name);
      const keys  = await cache.keys();

      const $size = el('td', { dataset: { numeric: '' }, textContent: '—' });
      const $age  = el('td', { dataset: { numeric: '' }, textContent: '—' });

      // reading every body is the expensive part, so it stays opt-in per cache.
      // the bunker stamp rides along as a header, which is how a cached entry
      // can report its own age — something the browser's own tooling cannot show
      const measure = async () => {
        let bytes = 0;
        let oldest = Infinity;

        for (const request of keys) {
          const response = await cache.match(request);
          if (!response) continue;

          const at = Number(response.headers.get('x-bunker-at'));
          if (Number.isFinite(at) && at > 0) oldest = Math.min(oldest, at);

          bytes += (await response.clone().blob().catch(() => ({ size: 0 }))).size;
        }

        $size.textContent = fmt.bytes(bytes);
        $age.textContent  = Number.isFinite(oldest) ? fmt.ago(oldest) : 'unstamped';
      };

      $body.append(el('tr', {},
        el('td', { title: name, textContent: fmt.truncate(name, 28) }),
        el('td', { dataset: { numeric: '' }, textContent: String(keys.length) }),
        $size,
        $age,
        el('td', {}, button('measure', measure)),
        el('td', {}, button('drop', async () => { await caches.delete(name); renderCaches(); }, { destructive: true })),
      ));
    }

    $caches.replaceChildren(names.length ? el('table', {},
      el('thead', {}, el('tr', {},
        el('th', { textContent: 'cache' }), el('th', { textContent: 'entries' }),
        el('th', { textContent: 'bytes' }), el('th', { textContent: 'oldest' }), el('th', {}), el('th', {}),
      )),
      $body,
    ) : el('em', { textContent: 'no caches' }));
  }

  // ── indexedDB: databases() is unsupported on older safari and never reports size
  async function renderDbs () {
    if (!indexedDB?.databases) { dbs(fmt.missing('unsupported'), 'missing'); $dbs.replaceChildren(); return; }

    const list = await indexedDB.databases().catch(() => []);
    dbs(list.length ? fmt.plural(list.length, 'database') : 'none');

    const $body = el('tbody');

    for (const { name, version } of list) {
      const $stores = el('td', { textContent: '—' });

      // opening a database to count its stores can block on a pending upgrade,
      // so this too is a button rather than something the panel does on its own
      const inspect = () => new Promise((resolve) => {
        const request = indexedDB.open(name);

        request.onsuccess = async () => {
          const db = request.result;

          try {
            const names  = [...db.objectStoreNames];
            const counts = await Promise.all(names.map(store => new Promise((done) => {
              try {
                const ask = db.transaction(store, 'readonly').objectStore(store).count();
                ask.onsuccess = () => done(`${store}: ${ask.result}`);
                ask.onerror   = () => done(`${store}: ?`);
              } catch { done(`${store}: ?`); }
            })));

            $stores.textContent = counts.join(', ') || 'no stores';
          } catch {
            $stores.textContent = 'could not read';
          }

          // a database left open blocks every later upgrade and delete
          db.close();
          resolve();
        };

        request.onerror   = () => { $stores.textContent = 'could not open'; resolve(); };
        request.onblocked = () => { $stores.textContent = 'blocked'; resolve(); };
      });

      $body.append(el('tr', {},
        el('td', { title: name, textContent: fmt.truncate(name, 24) }),
        el('td', { dataset: { numeric: '' }, textContent: `v${version}` }),
        $stores,
        el('td', {}, button('count', inspect)),
        el('td', {}, button('drop', () => new Promise((resolve) => {
          const request = indexedDB.deleteDatabase(name);
          request.onsuccess = request.onerror = request.onblocked = () => { renderDbs(); resolve(); };
        }), { destructive: true })),
      ));
    }

    $dbs.replaceChildren(list.length ? el('table', {},
      el('thead', {}, el('tr', {},
        el('th', { textContent: 'database' }), el('th', { textContent: 'ver' }),
        el('th', { textContent: 'stores' }), el('th', {}), el('th', {}),
      )),
      $body,
    ) : el('em', { textContent: 'no databases' }));
  }

  async function refresh () {
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate().catch(() => null);

      if (!estimate) {
        quota.set(NaN, NaN);
        details(fmt.missing('estimate failed'), 'missing');
      } else {
        quota.set(estimate.usage, estimate.quota);
        section.badge(fmt.bytes(estimate.usage));

        // usageDetails is chromium only and the only per-bucket breakdown there
        // is. it comes back as an empty object when nothing is stored yet, which
        // is not the same as the browser not having it
        const parts  = estimate.usageDetails;
        const broken = parts && Object.entries(parts).map(([key, value]) => `${key} ${fmt.bytes(value)}`);

        details(!parts ? fmt.missing('chromium only') : broken.length ? broken.join(' · ') : 'nothing stored',
                parts ? undefined : 'missing');
      }
    } else {
      quota.set(NaN, NaN);
      details(fmt.missing('unsupported'), 'missing');
    }

    const sessionMeasured = measureWebStorage(sessionStorage);
    session(sessionMeasured ? `${fmt.bytes(sessionMeasured.total)} est. · ${fmt.plural(sessionMeasured.keys.length, 'key')}` : fmt.missing('blocked'),
            sessionMeasured ? undefined : 'missing');

    renderKeys();
    await renderCaches();
    await renderDbs();
  }

  rows.note('the origin quota does not include localStorage in most browsers, so it reading lower than the localStorage row below is expected, not a bug. web storage sizes are estimates — utf-16 code units, no browser exposes the real cost. cache bytes are exact but only measured when you ask, since reading every body is expensive.');

  rows.$el.append(actions(
    button('clear localStorage', () => { localStorage.clear(); refresh(); }, { destructive: true }),
    button('clear sessionStorage', () => { sessionStorage.clear(); refresh(); }, { destructive: true }),
    button('drop all caches', async () => {
      if (hasCache) for (const name of await caches.keys()) await caches.delete(name);
      refresh();
    }, { destructive: true }),
  ));

  section.$el.append(rows.$el);
  return { ...section, refresh, live: false };
}

// :::::: SECTION: NETWORK ::::::::::::::::::::::::::::::::::::::

/*
classifying where a response came from:

  opaque  - cross origin without timing-allow-origin. every size field reads 0
            and the timing is start/end only. this is an unanswerable question,
            not a zero byte response, and must be counted separately or the
            totals silently under-report.
  sw      - the service worker answered it from a cache (it handled the request
            and nothing went over the wire)
  cache   - the http cache answered it, no service worker involved
  network - it was actually fetched
*/
function sourceOf (entry) {
  const crossOrigin = !entry.name.startsWith(location.origin);
  const noSizes     = !entry.transferSize && !entry.encodedBodySize && !entry.decodedBodySize;

  if (crossOrigin && noSizes)                          return 'opaque';
  if (entry.workerStart > 0 && !entry.transferSize)    return 'sw';
  if (!entry.transferSize || entry.deliveryType === 'cache') return 'cache';

  return 'network';
}

function networkSection () {
  const section = createSection({ id: 'network', label: 'network' });
  const rows    = createRows();

  const requests = rows.add('requests');
  const transfer = rows.add('transferred');
  const decoded  = rows.add('decoded');
  const fromSw   = rows.add('from service worker');
  const fromHttp = rows.add('from http cache');
  const opaque   = rows.add('opaque timing');
  const slowest  = rows.add('slowest');
  const nav      = rows.add('navigation');

  const $filter = el('input', { type: 'search', placeholder: 'filter by url or type…', autocapitalize: 'off', autocorrect: 'off', spellcheck: false });
  const $table  = el('div');

  rows.$el.append(el('header', {}, $filter,
    button('clear', () => { entries.length = 0; performance.clearResourceTimings?.(); refresh(); })));
  rows.$el.append($table);

  let sortKey = 'transferSize';
  let sortDir = -1;

  const columns = [
    { key: 'name',          label: 'resource', numeric: false },
    { key: 'initiatorType', label: 'type',     numeric: false },
    { key: 'source',        label: 'from',     numeric: false },
    { key: 'transferSize',  label: 'transfer', numeric: true  },
    { key: 'duration',      label: 'time',     numeric: true  },
  ];

  const cell = (entry, column) => {
    if (column.key === 'name')   return el('td', { title: entry.name, textContent: fmt.url(entry.name) });
    if (column.key === 'source') return el('td', { dataset: { source: entry.source }, textContent: entry.source });
    if (column.key === 'transferSize') {
      return el('td', { dataset: { numeric: '' }, textContent: entry.source === 'opaque' ? '?' : fmt.bytes(entry.transferSize) });
    }
    if (column.key === 'duration') return el('td', { dataset: { numeric: '' }, textContent: fmt.ms(entry.duration) });

    return el('td', { textContent: entry.initiatorType || '—' });
  };

  function renderTable () {
    const needle  = $filter.value.trim().toLowerCase();
    const visible = entries
      .filter(entry => !needle || entry.name.toLowerCase().includes(needle) || entry.initiatorType?.includes(needle) || entry.source.includes(needle))
      .sort((a, b) => {
        const x = a[sortKey], y = b[sortKey];
        return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * sortDir;
      })
      .slice(0, 200); // the dom, not the buffer, is what a phone chokes on

    const $head = el('tr', {}, ...columns.map(column => el('th', {
      dataset : { key: column.key },
      textContent: column.label,
      onClick : () => {
        sortDir = sortKey === column.key ? -sortDir : (column.numeric ? -1 : 1);
        sortKey = column.key;
        renderTable();
      },
    })));

    for (const $th of $head.children) {
      $th.setAttribute('aria-sort', $th.dataset.key === sortKey ? (sortDir < 0 ? 'descending' : 'ascending') : 'none');
    }

    $table.replaceChildren(visible.length
      ? el('table', {}, el('thead', {}, $head),
          el('tbody', {}, ...visible.map(entry => el('tr', {}, ...columns.map(column => cell(entry, column))))))
      : el('em', { textContent: entries.length ? 'nothing matches the filter' : 'no resources recorded yet' }));
  }

  function refresh () {
    const total = entries.reduce((sum, entry) => sum + entry.transferSize, 0);
    const body  = entries.reduce((sum, entry) => sum + entry.decodedBodySize, 0);
    const count = (source) => entries.filter(entry => entry.source === source).length;
    const blind = count('opaque');

    requests(fmt.number(entries.length));
    transfer(fmt.bytes(total) + (blind ? ' (+ unknown)' : ''), blind ? 'warn' : undefined);
    decoded(fmt.bytes(body));
    fromSw(fmt.number(count('sw')), count('sw') ? 'good' : undefined);
    fromHttp(fmt.number(count('cache')));
    opaque(blind ? `${fmt.number(blind)} — sizes unknown` : '0', blind ? 'warn' : 'good');

    const worst = entries.reduce((max, entry) => entry.duration > (max?.duration ?? 0) ? entry : max, null);
    slowest(worst ? `${fmt.ms(worst.duration)} · ${fmt.url(worst.name, 30)}` : '—');

    const [navigation] = performance.getEntriesByType('navigation');
    nav(navigation
      ? `${navigation.type} · dcl ${fmt.ms(navigation.domContentLoadedEventEnd)} · load ${fmt.ms(navigation.loadEventEnd)}`
      : fmt.missing());

    section.badge(`${entries.length} · ${fmt.bytes(total)}`);
    renderTable();
  }

  rows.note('a cross-origin response without timing-allow-origin reports every size as 0. those rows are counted as "opaque timing" instead of being added in as zero bytes, so the transfer total is a lower bound whenever that counter is above zero.');

  $filter.addEventListener('input', renderTable);
  section.$el.append(rows.$el);

  // new resources arrive whenever the app navigates or lazy loads something. the
  // section is not on the 1s poll — rebuilding the table that often is wasteful —
  // so it reacts to the observer instead, throttled and only while on screen
  let pending = null;
  listeners.add(() => {
    if (pending || !section.$el.open || section.$el.offsetParent === null) return;
    pending = setTimeout(() => { pending = null; refresh(); }, 2000);
  });

  return { ...section, refresh, live: false };
}

// :::::: RESOURCE COLLECTION :::::::::::::::::::::::::::::::::::

// collected at module scope, with buffered: true, so entries that landed before
// the panel was ever opened are still there. the browser's own resource buffer
// holds 250 entries by default and then drops silently — boot.js raises it.
const entries   = [];
const listeners = new Set();

function collect (list) {
  for (const entry of list) {
    entries.push({
      name            : entry.name,
      initiatorType   : entry.initiatorType,
      transferSize    : entry.transferSize ?? 0,
      encodedBodySize : entry.encodedBodySize ?? 0,
      decodedBodySize : entry.decodedBodySize ?? 0,
      duration        : entry.duration ?? 0,
      protocol        : entry.nextHopProtocol || '',
      source          : sourceOf(entry),
      at              : entry.startTime,
    });
  }

  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);

  for (const notify of listeners) { try { notify(); } catch {} }
}

try {
  new PerformanceObserver(list => collect(list.getEntries())).observe({ type: 'resource', buffered: true });
} catch {
  // no observer support: fall back to whatever is in the buffer right now
  collect(performance.getEntriesByType?.('resource') ?? []);
}

// :::::: PANEL :::::::::::::::::::::::::::::::::::::::::::::::::

export function createDataPanel () {
  const sections = [memorySection(), networkSection(), runtimeSection(), storageSection()];
  const $content = sections.map(section => section.$el);

  let timer = null;

  const refreshAll = (liveOnly) => {
    for (const section of sections) {
      // a section nobody has open is not worth reading the apis for
      if (!section.$el.open) continue;
      if (liveOnly && !section.live) continue;
      Promise.resolve(section.refresh()).catch(error => console.warn('[devtools] section refresh failed:', error));
    }
  };

  // measuring continuously would move the very numbers being measured, so the
  // poll only runs while the panel is on screen
  const startPolling = () => {
    clearInterval(timer);
    timer = setInterval(() => refreshAll(true), settings.get('pollMs'));
  };

  const onShow = () => { refreshAll(false); startPolling(); };
  const onHide = () => { clearInterval(timer); timer = null; };

  // a changed interval only means anything while the panel is actually polling
  settings.subscribe((key) => { if (timer && (key === null || key === 'pollMs')) startPolling(); });

  // a section opened while the panel is already visible should fill immediately
  for (const section of sections) {
    section.$el.addEventListener('toggle', () => {
      if (section.$el.open) Promise.resolve(section.refresh()).catch(() => {});
    });
  }

  document.addEventListener('visibilitychange', () => { if (timer) refreshAll(true); });

  return { $content, onShow, onHide };
}

export default createDataPanel;
