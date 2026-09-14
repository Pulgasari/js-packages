# @pulgasari/logger

namespaced, colorized `console` wrapper with a runtime gate and child loggers.
works in the browser (css-colors) and in node (ansi, respects `NO_COLOR` and
non-tty output).

## install

```sh
deno add jsr:@pulgasari/logger
```

```sh
npx jsr add @pulgasari/logger
```

## usage

```js
import { Logger } from '@pulgasari/logger';

const log = new Logger({ prefix: 'app', color: { error: 'red', info: 'blue' } });
log.info('ready');
log.error('boom');
log.color('purple').log('one-off color');

// child inherits palette, colors and the gate
const db = log.child('db');
db.warn('slow query');

// gated logger: silent unless globalThis.DEBUG === true, read at call time
const debug = new Logger({ prefix: 'trace', debugger: true });
```

writer methods (`log`, `info`, `warn`, `error`, `success`, `debug`, `trace`)
get the styled prefix; native console methods (`table`, `dir`, `time`, `group`,
…) are forwarded as-is so their call-site line numbers stay intact.
