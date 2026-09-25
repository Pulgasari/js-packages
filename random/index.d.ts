// @pulgasari/random - type declarations

export interface Range {
  min?: number;
  max?: number;
  /** snaps the result to `min + n * step`. */
  step?: number;
}

/** min inclusive, max exclusive. */
export function randomFloat(range?: Range): number;
/** min and max inclusive. */
export function randomInt(range?: Range): number;
/** true with the given probability, 0.5 by default. */
export function randomBoolean(chance?: number): boolean;

export function randomItem<T>(array: T[]): T | undefined;
export function randomValueFromArray<T>(array: T[]): T | undefined;
/** a shuffled copy. */
export function shuffle<T>(array: T[]): T[];

/** `0xrrggbb`, `'#rgb'`, `'#rrggbb'` or `{ r, g, b }`. */
export type ColorBound = number | string | { r: number; g: number; b: number };

export interface AlphaOptions { a?: number | null; aMin?: number; aMax?: number; }

export interface HslOptions {
  h?: number | null; hMin?: number; hMax?: number;
  s?: number | null; sMin?: number; sMax?: number;
  l?: number | null; lMin?: number; lMax?: number;
  step?: number;
}

export interface RgbOptions {
  r?: number | null; rMin?: number; rMax?: number;
  g?: number | null; gMin?: number; gMax?: number;
  b?: number | null; bMin?: number; bMax?: number;
  step?: number;
}

/** `'#rrggbb'` between two bounds. */
export function randomColorHex(bounds?: { min?: ColorBound; max?: ColorBound }): string;
/** `'hsl(h s% l%)'`, a fixed channel wins over its range. */
export function randomColorHSL(options?: HslOptions): string;
/** `'hsl(h s% l% / a)'`. */
export function randomColorHSLA(options?: HslOptions & AlphaOptions): string;
/** `'rgb(r g b)'`. */
export function randomColorRGB(options?: RgbOptions): string;
/** `'rgb(r g b / a)'`. */
export function randomColorRGBA(options?: RgbOptions & AlphaOptions): string;

export const random: {
  boolean: typeof randomBoolean;
  color: {
    hex: typeof randomColorHex;
    hsl: typeof randomColorHSL;
    hsla: typeof randomColorHSLA;
    rgb: typeof randomColorRGB;
    rgba: typeof randomColorRGBA;
  };
  float: typeof randomFloat;
  int: typeof randomInt;
  item: typeof randomItem;
  shuffle: typeof shuffle;
};

export default random;
