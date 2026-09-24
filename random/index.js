// random.js

const
$floor    = Math.floor,
$isFinite = Number.isFinite,
$max      = Math.max,
$min      = Math.min,
$round    = Math.round;

export function randomFloat ({ min = 0, max = 1, step = 0 }) {
  let value = $random() * (max - min) + min;
  if (step > 0) value = $round(value / step) * step;
  return value;
}

export function randomInt ({ min = 0, max = 100, step = 1 }) {
  let range = $floor((max - min) / step) + 1;
  return min + step * $floor($random() * range);
}

export function randomValueFromArray (arr) {
  if (!Array.isArray(arr) || arr.length === 0) return;
  let index = $floor($random() * arr.length);
  return arr[index];
}

// Color: Hex
export function randomColorHex ({ min, max } = {}) {
  let toInt = (v, fallback) => {
    if (v == null) return fallback;
    if (typeof v === 'number' && $isFinite(v)) {
      return $min(0xFFFFFF, $max(0, v | 0));
    }
    if (typeof v === 'string') {
      let s = v.trim();
      if (s.startsWith('#')) s = s.slice(1);
      if (s.length === 3) s = s.split('').map(ch => ch + ch).join('');
      if (!/^[0-9a-fA-F]{6}$/.test(s)) {
        throw new Error('randomHexColor: Ungültiger Hex-String für min/max');
      }
      return parseInt(s, 16);
    }
    if (typeof v === 'object') {
      let clamp = x => Math.min(255, Math.max(0, x | 0));
      let { r, g, b } = v;
      if ([r, g, b].some(n => n == null || !Number.isFinite(n))) {
        throw new Error('randomHexColor: RGB-Objekt muss {r,g,b} mit Zahlen enthalten');
      }
      return (clamp(r) << 16) | (clamp(g) << 8) | clamp(b);
    }
    throw new Error('randomHexColor: min/max müssen Zahl, Hex-String oder {r,g,b} sein');
  };
  let lo = toInt(min, 0x000000);
  let hi = toInt(max, 0xFFFFFF);
  if (lo > hi) [lo, hi] = [hi, lo];
  let range = hi - lo + 1;
  let n = lo + Math.floor(Math.random() * range);
  return '#' + n.toString(16).padStart(6, '0');
}

// Color: HSL(A)
export function randomColorHSL ({
  h = null, hMin = 0, hMax = 360,
  s = null, sMin = 0, sMax = 100,
  l = null, lMin = 0, lMax = 100,
  step = 1
} = {} ){
  h ??= randomInt({ min: hMin, max: hMax, step }) % 360;
  s ??= randomInt({ min: sMin, max: sMax, step });
  l ??= randomInt({ min: lMin, max: lMax, step });
  return `hsl(${h} ${s}% ${l}%)`;
}
export function randomColorHSLA ({
  h = null, hMin = 0, hMax = 360,
  s = null, sMin = 0, sMax = 100,
  l = null, lMin = 0, lMax = 100,
  a = null, aMin = 0, aMax = 1,
  step = 1,
} = {} ){
  let hsl = randomColorHSL({ h, s, l, hMin, hMax, sMin, sMax, lMin, lMax, step });
  if( a === null ){
    a = Math.random() * (aMax - aMin) + aMin;
    a = Math.round(a * 100) / 100;
  }
  return hsl.replace(/^hsl\((.+)\)$/, `hsla($1 / ${a})`);
}

// Color: RGB(A)
function randomColorRGB ({
  r = null, rMin = 0, rMax = 255,
  g = null, gMin = 0, gMax = 255,
  b = null, bMin = 0, bMax = 255,
  step = 1
} = {} ){
  r ??= randomInt({ min: rMin, max: rMax, step });
  g ??= randomInt({ min: gMin, max: gMax, step });
  b ??= randomInt({ min: bMin, max: bMax, step });
  return `rgb(${r} ${g} ${b})`;
}

function randomColorRGBA ({
  r = null, rMin = 0, rMax = 255,
  g = null, gMin = 0, gMax = 255,
  b = null, bMin = 0, bMax = 255,
  a = null, aMin = 0, aMax = 1,
  step = 1
} = {} ){
  let rgb = randomColorRGB({ r, g, b, rMin, rMax, gMin, gMax, bMin, bMax, step });
  if( a === null ){
    a = Math.random() * (aMax - aMin) + aMin;
    a = Math.round(a * 100) / 100;
  }
  return rgb.replace(/^rgb\((.+)\)$/, `rgba($1 / ${alpha})`);
}

export const random = {
  color : {
    hex  : randomColorHex,
    hsl  : randomColorHSL,
    hsla : randomColorHSLA,
    rgb  : randomColorRGB,
    rgba : randomColorRGBA,
  },
  float : randomFloat,
  int   : randomInt,
  valueFromArray : randomValueFromArray,
};

// :::::: EXPORT

export default random;
