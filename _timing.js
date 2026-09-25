// timing.js

import { isFn } from '@pulgasari/is';

export const debounce = (callback, delay = 100) => {
  let timer = null;

  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { timer = null; callback(...args); }, delay);
  };

  debounced.cancel = () => { clearTimeout(timer); timer = null; };
  return debounced;
};


export const 
idle     = (fn, timeout = 2000) => requestIdleCallback?.(fn, { timeout }) ?? setTimeout(fn, 1),     
interval = (fn, delay   = 1000) => { const id = setInterval (fn, delay); return () => clearInterval (id); },         
timeout  = (fn, delay   =    0) => { const id = setTimeout  (fn, delay); return () => clearTimeout  (id); },
sleep    = (duration    =    0) => new Promise (resolve => setTimeout(resolve, duration));


export const 
idle = (callback, deadline = 2000) =>
  isFn(requestIdleCallback)
    ? requestIdleCallback(callback, { timeout: deadline })
    : setTimeout(callback, 1),

interval = (fn, delay = 1000) => {
  const id = setInterval(fn, delay);
  return () => clearInterval(id);
};

export const 
nextFrame = () => new Promise (requestAnimationFrame);

export const
rafThrottle = (callback) => {
  let frame   = null;
  let pending = null;

  const throttled = (...args) => {
    pending = args;
    if (frame !== null) return;
    frame = requestAnimationFrame(() => { frame = null; callback(...pending); });
  };

  throttled.cancel = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = pending = null;
  };
  return throttled;
};


export const 
throttle = (callback, delay = 100) => {
  let last    = 0;
  let timer   = null;
  let pending = null;

  const invoke = (args) => { last = Date.now(); pending = null; callback(...args); };

  const throttled = (...args) => {
    const remaining = delay - (Date.now() - last);
    pending = args;

    if (remaining <= 0) {
      clearTimeout(timer);
      timer = null;
      invoke(args);
    } else if (timer === null) {
      timer = setTimeout(() => { timer = null; if (pending) invoke(pending); }, remaining);
    }
  };

  throttled.cancel = () => { clearTimeout(timer); timer = null; pending = null; };
  return throttled;
};
