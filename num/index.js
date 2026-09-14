// @ts-self-types="./index.d.ts"
// @pulgasari/num

export const 
clamp = (value, min, max)  => Math.min(Math.max(value, min ?? -Infinity), max ?? Infinity),
lerp  = (from, to, amount) => from + (to - from) * amount;

export const mapRange = (value, fromMin, fromMax, toMin, toMax) =>
  fromMax === fromMin ? toMin : toMin + ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin);

export const percent = (value, total = 100) => total ? (value / total) * 100 : 0;

export const round = (value, decimals = 0) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const snap = (value, steps, origin = 0) =>
    !steps               ? value
  : Array.isArray(steps) ? steps.reduce((best, step) => Math.abs(step - value) < Math.abs(best - value) ? step : best)
  : origin + Math.round((value - origin) / steps) * steps;

export const toNumber = (value, fallback = 0) => {
  const number = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(number) ? number : fallback;
};
