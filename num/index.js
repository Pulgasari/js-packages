// @ts-self-types="./index.d.ts"
// @pulgasari/num

export const 
clamp = (value, min, max)  => Math.min(Math.max(value, min ?? -Infinity), max ?? Infinity),
lerp  = (from, to, amount) => from + (to - from) * amount,

mapRange = (value, fromMin, fromMax, toMin, toMax) =>
  fromMax === fromMin ? toMin : toMin + ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin),

percent = (value, total = 100) => total ? (value / total) * 100 : 0,

round = (value, decimals = 0) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
},

snap = (value, steps, origin = 0) =>
    !steps               ? value
  : Array.isArray(steps) ? steps.reduce((best, step) => Math.abs(step - value) < Math.abs(best - value) ? step : best)
  : origin + Math.round((value - origin) / steps) * steps,

toNumber = (value, fallback = 0) => {
  const number = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(number) ? number : fallback;
};
