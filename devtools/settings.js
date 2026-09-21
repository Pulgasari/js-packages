// @pulgasari/devtools/settings.js
//
// one spec drives the defaults, the panel's controls and the persisted values.
// every entry here has to change something observable — a settings panel full of
// switches that do nothing is worse than no settings panel.

const KEY = 'devtools:settings';

// a curated slice of the highlight.js themes rather than the full index: fetching
// the jsdelivr file list to populate a picker is a network round trip for a
// dropdown, and these are the ones that read well on a dark panel
const CODE_THEMES = ['dracula', 'github-dark', 'nord', 'monokai', 'atom-one-dark', 'tokyo-night-dark', 'github'];

export const SPEC = {
  // ui/general
  position    : { section: 'ui', type: 'enum',    label: 'panel position',  values: ['bottom', 'top'], default: 'bottom' },
  panelHeight : { section: 'ui', type: 'integer', label: 'panel height',    min: 10, max: 60, step: 1, unit: 'dvh', default: 40 },
  fontSize    : { section: 'ui', type: 'integer', label: 'font size',       min: 10, max: 20, step: 1, unit: 'px',  default: 13 },

  // console
  logLimit    : { section: 'console', type: 'integer', label: 'buffer',            min: 100, max: 2000, step: 100, unit: 'entries', default: 500 },
  timestamps  : { section: 'console', type: 'boolean', label: 'timestamps',        default: false },
  dedupe      : { section: 'console', type: 'boolean', label: 'collapse repeats',  default: true },
  wrapLines   : { section: 'console', type: 'boolean', label: 'wrap long lines',   default: true },

  // css
  codeTheme   : { section: 'css', type: 'enum', label: 'code theme', values: CODE_THEMES, default: 'dracula' },

  // data
  pollMs      : { section: 'data', type: 'integer', label: 'poll interval', min: 250, max: 5000, step: 250, unit: 'ms', default: 1000 },
};

/** spec keys grouped by section, in the order the panel renders them */
export const SECTIONS = ['ui', 'console', 'css', 'data'].map(name => [
  name,
  Object.entries(SPEC).filter(([, entry]) => entry.section === name),
]);

const DEFAULTS = Object.fromEntries(Object.entries(SPEC).map(([key, entry]) => [key, entry.default]));

// an unknown or out of range stored value is dropped rather than repaired: a
// settings file from a newer version must not be able to wedge the panel
function sanitize (stored) {
  const out = { ...DEFAULTS };

  for (const [key, value] of Object.entries(stored ?? {})) {
    const entry = SPEC[key];
    if (!entry) continue;

    if (entry.type === 'boolean' && typeof value === 'boolean') out[key] = value;
    if (entry.type === 'enum'    && entry.values.includes(value)) out[key] = value;
    if (entry.type === 'integer' && Number.isFinite(value) && value >= entry.min && value <= entry.max) out[key] = value;
  }

  return out;
}

let values = DEFAULTS;
try { values = sanitize(JSON.parse(localStorage.getItem(KEY) ?? '{}')); } catch {}

const listeners = new Set();

const notify = (key) => { for (const fn of listeners) { try { fn(key, values[key], values); } catch (error) { console.warn('[devtools] settings listener failed:', error); } } };

export const settings = {
  get  : (key)  => values[key],
  all  : ()     => ({ ...values }),

  set (key, value) {
    if (!(key in SPEC) || values[key] === value) return values[key];

    values = { ...values, [key]: value };
    try { localStorage.setItem(KEY, JSON.stringify(values)); } catch {}
    notify(key);

    return value;
  },

  reset () {
    values = { ...DEFAULTS };
    try { localStorage.removeItem(KEY); } catch {}
    notify(null);
  },

  /** @returns {() => void} unsubscribe */
  subscribe (fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

export default settings;
