// @pulgasari/logger - type declarations

/** the names of the built-in palette. */
export type ColorName = "blue" | "cyan" | "gray" | "green" | "orange" | "purple" | "red" | "yellow";
/** the writers that carry a prefix and a color of their own. */
export type WriterName = "debug" | "error" | "info" | "log" | "success" | "trace" | "warn";

/** a palette name, or any raw color value (a hex string or css color name). */
export type Color = ColorName | (string & {});

/** a bound console method. a no-op while the debug gate is closed. */
export type Writer = (...args: any[]) => void;

/** options for `new Logger()` and `logger.child()`. */
export interface LoggerOptions {
  /** one color for all writers, or a per-writer map. */
  color?: Color | Partial<Record<WriterName, Color>>;
  /** extends the named palette; same key overrides. */
  colors?: Record<string, string>;
  /** printed in front of every prefixed call. a child joins its own with `:`. */
  prefix?: string;
  /** when true, silent unless globalThis.DEBUG === true (read at call time). */
  debugger?: boolean;
}

/** the console-shaped surface shared by a Logger and by .color(...). */
export interface LoggerApi {
  /** `console.debug` with the styled prefix. */
  debug: Writer;
  /** `console.error` with the styled prefix. */
  error: Writer;
  /** `console.info` with the styled prefix. */
  info: Writer;
  /** `console.log` with the styled prefix. */
  log: Writer;
  /** `console.log` with the prefix in the success color (green by default). */
  success: Writer;
  /** `console.trace` with the styled prefix. */
  trace: Writer;
  /** `console.warn` with the styled prefix. */
  warn: Writer;
  /** `console.group` with the styled prefix. closed by `groupEnd()`. */
  group: Writer;
  /** `console.groupCollapsed` with the styled prefix. closed by `groupEnd()`. */
  groupCollapsed: Writer;
  /** `console.groupEnd`. */
  groupEnd: Writer;
  /** `console.assert`, forwarded as is. */
  assert: Writer;
  /** `console.clear`, forwarded as is. */
  clear: Writer;
  /** `console.count`, forwarded as is. */
  count: Writer;
  /** `console.countReset`, forwarded as is. */
  countReset: Writer;
  /** `console.dir`, forwarded as is. */
  dir: Writer;
  /** `console.dirxml`, forwarded as is. */
  dirxml: Writer;
  /** `console.table`, forwarded as is. */
  table: Writer;
  /** `console.time`, forwarded as is. */
  time: Writer;
  /** `console.timeEnd`, forwarded as is. */
  timeEnd: Writer;
  /** `console.timeLog`, forwarded as is. */
  timeLog: Writer;
  /** applies a one-off color to a whole call: logger.color('red').log(...). */
  color(color: Color): LoggerApi;
}

/**
 * console wrapper with a colored prefix. css styling in the browser, ansi colors
 * in node, deno and bun (off for NO_COLOR and non-tty output).
 *
 * @example
 * ```js
 * const logger = new Logger({ prefix: 'app' });
 * logger.info('ready');
 * logger.child('db').warn('slow query');   // prefix 'app:db'
 * ```
 */
export class Logger implements LoggerApi {
  /** creates a logger. without a prefix, calls go to the console unchanged. */
  constructor(options?: LoggerOptions);
  /** `console.debug` with the styled prefix. */
  debug: Writer;
  /** `console.error` with the styled prefix. */
  error: Writer;
  /** `console.info` with the styled prefix. */
  info: Writer;
  /** `console.log` with the styled prefix. */
  log: Writer;
  /** `console.log` with the prefix in the success color (green by default). */
  success: Writer;
  /** `console.trace` with the styled prefix. */
  trace: Writer;
  /** `console.warn` with the styled prefix. */
  warn: Writer;
  /** `console.group` with the styled prefix. closed by `groupEnd()`. */
  group: Writer;
  /** `console.groupCollapsed` with the styled prefix. closed by `groupEnd()`. */
  groupCollapsed: Writer;
  /** `console.groupEnd`. */
  groupEnd: Writer;
  /** `console.assert`, forwarded as is. */
  assert: Writer;
  /** `console.clear`, forwarded as is. */
  clear: Writer;
  /** `console.count`, forwarded as is. */
  count: Writer;
  /** `console.countReset`, forwarded as is. */
  countReset: Writer;
  /** `console.dir`, forwarded as is. */
  dir: Writer;
  /** `console.dirxml`, forwarded as is. */
  dirxml: Writer;
  /** `console.table`, forwarded as is. */
  table: Writer;
  /** `console.time`, forwarded as is. */
  time: Writer;
  /** `console.timeEnd`, forwarded as is. */
  timeEnd: Writer;
  /** `console.timeLog`, forwarded as is. */
  timeLog: Writer;
  /** applies a one-off color to a whole call: logger.color('red').log(...). */
  color(color: Color): LoggerApi;
  /** a sub-namespace inheriting palette, colors and the gate. */
  child(prefix: string, options?: LoggerOptions): Logger;
}

export default Logger;
