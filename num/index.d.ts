// @pulgasari/num - type declarations

/** clamps value into [min, max]; each bound is optional (open-ended if omitted or null). */
export function clamp(value: number, min?: number | null, max?: number | null): number;

/** linear interpolation between from and to by amount (0..1). */
export function lerp(from: number, to: number, amount: number): number;

/** remaps value from one range to another; returns toMin when the source range is empty. */
export function mapRange(
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number,
): number;

/** value as a percentage of total (default 100); returns 0 when total is 0. */
export function percent(value: number, total?: number): number;

/** rounds value to the given number of decimals (default 0). */
export function round(value: number, decimals?: number): number;

/** snaps value to the nearest of a set of steps, or to a fixed step size from origin. */
export function snap(value: number, steps: number | number[], origin?: number): number;

/** parses value to a finite number, falling back to fallback (default 0) otherwise. */
export function toNumber(value: unknown, fallback?: number): number;
