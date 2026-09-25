// @ts-self-types="./index.d.ts"
// @pulgasari/random

// random numbers, picks and css colours. Math.random based, not for anything
// security related, crypto.getRandomValues() is for that.

// :::::: NUMBERS

// min inclusive, max exclusive. with a step the value snaps to min + n * step
export function randomFloat ({ max = 1, min = 0, step = 0 } = {}) {
  const value = Math.random() * (max - min) + min;
  return step > 0 ? min + Math.round((value - min) / step) * step : value;
}

// min and max inclusive, every value reachable is min + n * step
export function randomInt ({ max = 100, min = 0, step = 1 } = {}) {
  const count = Math.floor((max - min) / step) + 1;
  return min + step * Math.floor(Math.random() * count);
}

export const randomBoolean = (chance = 0.5) => Math.random() < chance;

// :::::: ARRAYS

export function randomItem (array) {
  if (!Array.isArray(array) || !array.length) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

// a shuffled copy, fisher yates
export function shuffle (array) {
  const copy = [...array];
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

// :::::: COLOURS

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// an alpha between aMin and aMax, two decimals, unless one is given
const alphaOf = ({ a = null, aMax = 1, aMin = 0 }) => a ?? Math.round((Math.random() * (aMax - aMin) + aMin) * 100) / 100;

// a bound as 0xrrggbb, '#rgb', '#rrggbb' or { r, g, b }
function toRgbInt (value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'number' && Number.isFinite(value)) return clamp(value | 0, 0, 0xffffff);

  if (typeof value === 'string') {
    let hex = value.trim().replace(/^#/, '');
    if (hex.length === 3) hex = [...hex].map(char => char + char).join('');
    if (!/^[0-9a-f]{6}$/i.test(hex)) throw new TypeError(`[@pulgasari/random] invalid hex colour "${value}"`);
    return parseInt(hex, 16);
  }

  if (typeof value === 'object') {
    const { b, g, r } = value;
    if (![r, g, b].every(Number.isFinite)) throw new TypeError('[@pulgasari/random] an rgb bound needs numeric r, g and b');
    return (clamp(r | 0, 0, 255) << 16) | (clamp(g | 0, 0, 255) << 8) | clamp(b | 0, 0, 255);
  }

  throw new TypeError('[@pulgasari/random] a colour bound is a number, a hex string or { r, g, b }');
}

// a colour between two bounds on the 0x000000 to 0xffffff scale
export function randomColorHex ({ max, min } = {}) {
  let low  = toRgbInt(min, 0x000000);
  let high = toRgbInt(max, 0xffffff);
  if (low > high) [low, high] = [high, low];
  return '#' + randomInt({ max: high, min: low }).toString(16).padStart(6, '0');
}

// a fixed channel wins over its range
export function randomColorHSL ({
  h = null, hMax = 360, hMin = 0,
  l = null, lMax = 100, lMin = 0,
  s = null, sMax = 100, sMin = 0,
  step = 1,
} = {}) {
  h ??= randomInt({ max: hMax, min: hMin, step }) % 360;
  s ??= randomInt({ max: sMax, min: sMin, step });
  l ??= randomInt({ max: lMax, min: lMin, step });
  return `hsl(${h} ${s}% ${l}%)`;
}

export const randomColorHSLA = (options = {}) => randomColorHSL(options).replace(/\)$/, ` / ${alphaOf(options)})`);

export function randomColorRGB ({
  b = null, bMax = 255, bMin = 0,
  g = null, gMax = 255, gMin = 0,
  r = null, rMax = 255, rMin = 0,
  step = 1,
} = {}) {
  r ??= randomInt({ max: rMax, min: rMin, step });
  g ??= randomInt({ max: gMax, min: gMin, step });
  b ??= randomInt({ max: bMax, min: bMin, step });
  return `rgb(${r} ${g} ${b})`;
}

export const randomColorRGBA = (options = {}) => randomColorRGB(options).replace(/\)$/, ` / ${alphaOf(options)})`);

// :::::: NAMESPACE

export const random = {
  boolean : randomBoolean,
  color   : {
    hex  : randomColorHex,
    hsl  : randomColorHSL,
    hsla : randomColorHSLA,
    rgb  : randomColorRGB,
    rgba : randomColorRGBA,
  },
  float   : randomFloat,
  int     : randomInt,
  item    : randomItem,
  shuffle,
};

export { randomItem as randomValueFromArray };

export default random;
