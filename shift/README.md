# @pulgasari/shift

a `switch` over predicates: the first case whose predicate holds gives the result.

```javascript
import { shift }     from '@pulgasari/shift';
import { isElement } from '@pulgasari/is';

const toElements = shift ({
  isNullish  : ()       => [document.documentElement],
  isString   : (target) => [...document.querySelectorAll(target)],
  isElement  : (target) => [target],
  isIterable : (target) => [...target].filter(isElement),
  fallback   : ()       => [],
});

toElements('main > p');   // [p, p, …]
toElements(null);         // [html]
```

---

## two forms

**closed**: `shift (cases)` gives a function of the target, to keep and call later.

```javascript
const toElements = shift ({
  isNullish  : ()       => [document.documentElement],
  isString   : (target) => [...document.querySelectorAll(target)],
  isElement  : (target) => [target],
  isIterable : (target) => [...target].filter(isElement),
  fallback   : ()       => [],
});
```

**open**: `shift (target, cases)` gives the result right away. it reads like a
`switch (target)`, and the handlers can reach `target` from the scope around them.

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

both are the same thing: `shift (target, cases)` is `shift (cases) (target)`.
the closed form checks the case names once, the open form on every call.

there is no `shift (target) (cases)`: with one argument shift cannot tell a
target from cases, a plain object can be either.

## cases

- **the name** is a predicate: `isString`, `isNullish`, … the `is` may be left
  out: `string`, `nullish`. an unknown name throws a `TypeError`.
- **the handler** is called with the target. a handler that is no function is
  the result itself: `isNullish: ''`.
- **the order** counts: the first predicate that holds wins.
- **`fallback`** is taken when none holds. without it the result is `undefined`.

## instances

```javascript
import { createShift, pureShift, shift } from '@pulgasari/shift';
```

- `shift` knows every predicate of [`@pulgasari/is`](../is/README.md)
- `pureShift` knows none
- `createShift (predicates)` makes another instance

`with (predicates)` teaches an instance more, `predicates` is a copy of what it knows:

```javascript
const shapes = createShift(shift.predicates).with({
  isTriple : value => Array.isArray(value) && value.length === 3,
});

shapes([1, 2, 3], { triple: 'three of them', fallback: 'something else' });   // 'three of them'
```

---

## examples

### dates

different inputs as a native `Date`.

```javascript
const toDate = shift ({
  isDate       : (date)      => date,
  isNumber     : (timestamp) => new Date(timestamp),
  isDateString : (text)      => new Date(text),
  isNullish    : ()          => new Date,   // now
  fallback     : null,
});

toDate(new Date);          // the same date
toDate(1700000000000);     // from a timestamp
toDate('2026-09-26');      // parsed
toDate(null);              // now
toDate({ invalid: 123 });  // null
```

### a value from anything

the text of an element, a selector, a getter or a primitive.

```javascript
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

valueOf('#user-input');           // the value of that field
valueOf(document.body);           // its text
valueOf(() => 'computed value');  // 'computed value'
valueOf(42);                      // '42'
```

### an api response

whatever comes back, the same shape goes on.

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

### table cells

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

### children

nodes, factories and lists of them as a flat array of nodes.

```javascript
function toNodes (children) {
  return shift (children, {
    isNullish    : ()        => [],
    isFn         : (factory) => toNodes(factory()),
    isElementish : (node)    => [node],
    isCollection : (items)   => [...items].flatMap(toNodes),   // iterable, but no string
    fallback     : (text)    => [document.createTextNode(String(text))],
  });
}
```
