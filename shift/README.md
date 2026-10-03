# @pulgasari/shift

---

what you end up with if used as intended and properly understood:

```javascript
const toElements = shift ({
  isNullish  : ()       => [document.documentElement],
  isString   : (target) => [...document.querySelectorAll(target)],
  isElement  : (target) => [target],
  isIterable : (target) => [...target].filter(isElement),
  fallback   : ()       => [],
});
```

alternative form (maybe deprecated, not sure):

```javascript
const toElements = shift ({
  'nullish'  : ()       => [document.documentElement],
  'string'   : (target) => [...document.querySelectorAll(target)],
  'element'  : (target) => [target],
  'iterable' : (target) => [...target].filter(isElement),
  fallback   : ()       => [],
});
```

```javascript
function toElements (target) {
  return shift (target, {
    isNullish  : () => [document.documentElement],
    isString   : () => [...document.querySelectorAll(target)],
    isElement  : () => [target],
    isIterable : () => [...target].filter(isElement),
    fallback   : () => [],
  });
}
```

---

it exports 3 methods:
- `shift` — an instance from a shift-factory with predicates from `@pulgasari/is` included
- `pureShift` — an instance from a shift-factory without any pre-defined predicates
- `createShift` — the shift-factory itself

---

# examples

## example 1: dates

normalizes different date inputs into a native Date object.

```javascript
import shift from '@pulgasari/shift';

const toDate = shift ({
  isDate       : (date)      => date,
  isNumber     : (timestamp) => new Date(timestamp),
  isDateString : (text)      => new Date(text),
  isNullish    : ()          => new Date,   // now
  fallback     : null,
});
```

```javascript
toDate(new Date);          // the same date
toDate(1700000000000);     // from a timestamp
toDate('2026-09-26');      // parsed
toDate(null);              // now
toDate({ invalid: 123 });  // null
```

## example 2: a value from anything

extracts a string/primitive value from various input targets.

```javascript
import { shift } from './shift.js';

function valueOf (target) {
  return shift (target, {
    isElement : (element)  => element.value ?? element.textContent?.trim() ?? '',
    isString  : (selector) => {
      const element = document.querySelector(selector);
      return element ? valueOf(element) : selector;
    },
    isFn      : (getter) => getter(),
    isNullish : '',
    fallback  : String(target),
  });
}
```

```javascript
valueOf('#user-input');          // the value of that field
valueOf(document.body);          // its text
valueOf(() => 'computed value'); // 'computed value'
valueOf(42);                     // '42'
```

## example 3: API response

transforms incoming API data into a predictable standard shape.

```javascript
async function fetchUser (id) {
  const response = await api.get(`/users/${id}`);

  return shift (response, {
    isError       : (error)  => ({ ok: false, data: null, message: error.message }),
    isJSON        : (json)   => ({ ok: true,  data: JSON.parse(json) }),
    isPlainObject : (object) => ({ ok: true,  data: object }),
    isBlank       : { ok: false, data: null, message: 'empty payload' },
    fallback      : { ok: false, data: null, message: 'unexpected payload' },
  });
}
```

## example 4: table cell

the closed form is a function, so it goes straight into `map()`.

```javascript
const formatCell = shift ({
  isNullish    : '—',
  isNumber     : (number) => new Intl.NumberFormat('de-DE').format(number),
  isDate       : (date)   => date.toLocaleDateString('de-DE'),
  isBoolean    : (bool)   => bool ? 'ja' : 'nein',
  isCollection : (list)   => [...list].join(', '),
  fallback     : (value)  => String(value),
});

[null, 1250.5, new Date, true, ['Admin', 'Editor']].map(formatCell);
// ['—', '1.250,5', '3.10.2026', 'ja', 'Admin, Editor']
```

## example 5: children
​
normalizes different children shapes into an array of renderable nodes.

```javascript
function toNodes (children) {
  return shift (children, {
    isNullish    : ()        => [],
    isFn         : (factory) => toNodes(factory()),
    isElementish : (node)    => [node],
    isCollection : (items)   => [...items].flatMap(toNodes), // iterable, but no string
    fallback     : (text)    => [document.createTextNode(String(text))],
  });
}
```


