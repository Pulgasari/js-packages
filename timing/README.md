# @pulgasari/timing

timers that hand back their own cancel function, and the three rate limiters.

## install

```sh
deno add jsr:@pulgasari/timing
```

```sh
npx jsr add @pulgasari/timing
```

## usage

```js
import { debounce, idle, interval, nextFrame, rafThrottle, sleep, throttle, timeout } from '@pulgasari/timing';

const stop = interval(poll, 5000);   // every scheduler returns its cancel function
stop();

await sleep(300);
await nextFrame();
idle(() => prefetch());              // a short timeout where requestIdleCallback is missing

const save   = debounce(write, 500); // once the calls stopped for 500ms
const scroll = throttle(update, 100); // at most every 100ms, leading and trailing
const move   = rafThrottle(draw);    // at most once per frame
save.cancel();
```
