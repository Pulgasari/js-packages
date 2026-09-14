// @ts-self-types="./index.d.ts"
// @pulgasari/logger

const IS_NODE = !!globalThis.process?.versions?.node;
// node only: respect NO_COLOR and piped/redirected output
const NO_ANSI = IS_NODE && (!!process.env.NO_COLOR || !process.stdout?.isTTY);

// variadic writers, get the styled prefix. api method -> console method
const METHODS = {
  debug: 'debug',
  error: 'error',
  info: 'info',
  log: 'log',
  success: 'log',
  trace: 'trace',
  warn: 'warn',
};

// bring their own arg shape, so no prefix is possible -> bound and forwarded as is.
// labels stay unnamespaced on purpose, the call site is worth more here
const NATIVE = [
  'assert',
  'clear',
  'count',
  'countReset',
  'dir',
  'dirxml',
  'table',
  'time',
  'timeEnd',
  'timeLog',
];

const COLORS = {
  blue   : '#3b82f6',
  cyan   : '#06b6d4',
  gray   : '#888888',
  green  : '#22c55e',
  orange : '#f97316',
  purple : '#a855f7',
  red    : '#ff5555',
  yellow : '#eab308',
};

const DEFAULTS = {
  debug   : 'gray',
  error   : 'red',
  info    : 'blue',
  log     : 'gray',
  success : 'green',
  trace   : 'gray',
  warn    : 'orange',
};

const noop = () => {};

// one value for every writer
const mapAll = (color) => Object.fromEntries(Object.keys(METHODS).map((n) => [n, color]));

// #rgb | #rrggbb -> "r;g;b"
const rgb = (hex) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)).join(';');
};

export class Logger {
  #colors; #gated; #palette; #prefix;

  // `debugger` is a reserved word -> renamed while destructuring.
  // color: one value for all writers, or a per-method map { log, warn, error, success, ... }
  // colors: extends the named palette, same key overrides
  constructor ({ color, colors, prefix = '', debugger: gated = false } = {}) {
    this.#colors  = { ...DEFAULTS, ...(typeof color === 'string' ? mapAll(color) : color) };
    this.#gated   = gated;
    this.#palette = { ...COLORS, ...colors };
    this.#prefix  = prefix;

    // copy descriptors, not values: Object.assign would evaluate the getters once
    // and freeze both the gate and the bound arguments at construction time
    const api = this.#api((name) => this.#colors[name]);
    Object.defineProperties(this, Object.getOwnPropertyDescriptors(api));
  }

  // read at call time, so flipping globalThis.DEBUG at runtime takes effect
  get #on() {
    return !this.#gated || globalThis.DEBUG === true;
  }

  // sub namespace inheriting palette, colors and the gate. options override per child
  child(prefix, { color, colors, ...rest } = {}) {
    return new Logger({
      prefix: [this.#prefix, prefix].filter(Boolean).join(':'),
      color: { ...this.#colors, ...(typeof color === 'string' ? mapAll(color) : color) },
      colors: { ...this.#palette, ...colors },
      debugger: this.#gated,
      ...rest,
    });
  }

  // palette name or a raw value, unknown names pass through untouched
  #hex (color) {
    return this.#palette[color] ?? color;
  }

  // leading console args for the current environment
  #tag (color) {
    if (!this.#prefix) return [];
    const hex = this.#hex(color);
    if (!IS_NODE) return [`%c${this.#prefix}`, `color:${hex};font-weight:bold`];
    // ansi needs real rgb values, so css color names stay unstyled here
    return NO_ANSI || !hex.startsWith('#')
      ? [this.#prefix]
      : [`\x1b[1;38;2;${rgb(hex)}m${this.#prefix}\x1b[0m`];
  }

  // builds the whole api around a picker: (method name) => color
  #api(pick) {
    const api = {};
    // getter, so the binding happens per access and the gate stays live
    const define = (name, get)       => Object.defineProperty(api, name, { get, enumerable: true });
    const bind   = (method, ...args) => this.#on && console[method] ? console[method].bind(console, ...args) : noop;

    for (const name in METHODS) define(name, () => bind(METHODS[name], ...this.#tag(pick(name))));
    for (const name of NATIVE)  define(name, () => bind(name));

    // opens a group, closed by groupEnd(). nesting handles the console itself
    define('group',          () => bind('group',          ...this.#tag(pick('log'))));
    define('groupCollapsed', () => bind('groupCollapsed', ...this.#tag(pick('log'))));
    define('groupEnd',       () => bind('groupEnd'));

    // one-off color for a whole call: logger.color('red').log(...)
    api.color = (color) => this.#api(() => color);

    return api;
  }
}

export default Logger;
