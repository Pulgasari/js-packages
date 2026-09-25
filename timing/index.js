// @ts-self-types="./index.d.ts"
// @pulgasari/timing

// every scheduler returns a function that cancels it, the wrappers carry .cancel()

// :::::: SCHEDULE

export const
interval = (fn, delay = 1000) => { const id = setInterval (fn, delay); return () => clearInterval (id); },
timeout  = (fn, delay =    0) => { const id = setTimeout  (fn, delay); return () => clearTimeout  (id); },
sleep    = (duration  =    0) => new Promise(resolve => setTimeout(resolve, duration)),

// requestIdleCallback is missing in safari, a short timeout stands in there
idle = (fn, deadline = 2000) => {
  if (typeof globalThis.requestIdleCallback === 'function') {
    const id = globalThis.requestIdleCallback(fn, { timeout: deadline });
    return () => globalThis.cancelIdleCallback(id);
  }
  return timeout(() => fn({ didTimeout: false, timeRemaining: () => 0 }), 1);
},

nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

// :::::: RATE LIMIT

// runs once the calls have stopped for `delay` ms, with the last arguments
export const debounce = (callback, delay = 100) => {
  let timer = null;

  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { timer = null; callback(...args); }, delay);
  };

  debounced.cancel = () => { clearTimeout(timer); timer = null; };
  return debounced;
};

// runs at most once per `delay` ms: the first call right away, the last one of a
// burst at the end of its window
export const throttle = (callback, delay = 100) => {
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

// runs at most once per animation frame, with the last arguments
export const rafThrottle = (callback) => {
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
