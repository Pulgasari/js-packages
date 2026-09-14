// @pulgasari/logger - type declarations

export type ColorName = "blue" | "cyan" | "gray" | "green" | "orange" | "purple" | "red" | "yellow";
export type WriterName = "debug" | "error" | "info" | "log" | "success" | "trace" | "warn";

/** a palette name, or any raw color value (a hex string or css color name). */
export type Color = ColorName | (string & {});

export type Writer = (...args: any[]) => void;

export interface LoggerOptions {
  /** one color for all writers, or a per-writer map. */
  color?: Color | Partial<Record<WriterName, Color>>;
  /** extends the named palette; same key overrides. */
  colors?: Record<string, string>;
  prefix?: string;
  /** when true, silent unless globalThis.DEBUG === true (read at call time). */
  debugger?: boolean;
}

/** the console-shaped surface shared by a Logger and by .color(...). */
export interface LoggerApi {
  debug: Writer;
  error: Writer;
  info: Writer;
  log: Writer;
  success: Writer;
  trace: Writer;
  warn: Writer;
  group: Writer;
  groupCollapsed: Writer;
  groupEnd: Writer;
  assert: Writer;
  clear: Writer;
  count: Writer;
  countReset: Writer;
  dir: Writer;
  dirxml: Writer;
  table: Writer;
  time: Writer;
  timeEnd: Writer;
  timeLog: Writer;
  /** applies a one-off color to a whole call: logger.color('red').log(...). */
  color(color: Color): LoggerApi;
}

export class Logger implements LoggerApi {
  constructor(options?: LoggerOptions);
  debug: Writer;
  error: Writer;
  info: Writer;
  log: Writer;
  success: Writer;
  trace: Writer;
  warn: Writer;
  group: Writer;
  groupCollapsed: Writer;
  groupEnd: Writer;
  assert: Writer;
  clear: Writer;
  count: Writer;
  countReset: Writer;
  dir: Writer;
  dirxml: Writer;
  table: Writer;
  time: Writer;
  timeEnd: Writer;
  timeLog: Writer;
  color(color: Color): LoggerApi;
  /** a sub-namespace inheriting palette, colors and the gate. */
  child(prefix: string, options?: LoggerOptions): Logger;
}

export default Logger;
