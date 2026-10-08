// @ts-self-types="./prototype.d.ts"
// @pulgasari/it/prototype

// the vocabulary of It right on Array.prototype, for an app that owns its globals:
//
//   import '@pulgasari/it/prototype.js';
//   app.state.$bookmarks.where({ folder });
//   types().one({ id });
//
// the methods are non-enumerable, like the natives, and return plain arrays. a name the
// prototype already has is left alone, a later standard method wins over this one.
// a library should not import this, it changes every array of the realm.

import * as core from './core.js';

const methods = {
  all     (pattern)         { return core.all    (this, pattern);         },
  has     (pattern)         { return core.has    (this, pattern);         },
  keyBy   (key)             { return core.keyBy  (this, key);             },
  one     (pattern)         { return core.one    (this, pattern);         },
  pluck   (key)             { return core.pluck  (this, key);             },
  search  (query, fields)   { return core.search (this, query, fields);   },
  sortBy  (sort, direction) { return core.sortBy (this, sort, direction); },
  where   (pattern)         { return core.where  (this, pattern);         },
  without (pattern)         { return core.without(this, pattern);         },
};

for (const [name, value] of Object.entries(methods)) {
  if (name in Array.prototype) { console.warn(`[@pulgasari/it] Array.prototype.${name} exists already, left alone.`); continue; }
  Object.defineProperty(Array.prototype, name, { configurable: true, value, writable: true });
}

export { match } from './core.js';
