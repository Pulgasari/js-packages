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

## example 1:

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

toDate(new Date);          // the same date
toDate(1700000000000);     // from a timestamp
toDate('2026-09-26');      // parsed
toDate(null);              // now
toDate({ invalid: 123 });  // null
```

```javascript
parseDate(new Date);       // Returns same Date
parseDate(1700000000000);    // Converted from timestamp
parseDate('2026-09-26');     // Parsed string
parseDate(null);             // Current date
parseDate({ invalid: 123 }); // null
```

## example 2:

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

usage:

```javascript
valueOf('#user-input');          // the value of that field
valueOf(document.body);          // its text
valueOf(() => 'computed value'); // 'computed value'
valueOf(42);                     // '42'
```

## example 3: API Response Normalisierer (normalizePayload)

Nützt die Curried Form shift(data)(cases) in einer Async Data Pipeline.

Transforms incoming API data into a predictable standard shape.

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

## example 4: Tabellen-Spalten Formatter (formatCell)

​Nützt shift.from(cases) direkt als Map-Callback beim Rendern von Data-Grids.

formats arbitrary cell values for display in a UI table.

```javascript
import { shift } from '@pulgasari/is';

const formatCell = shift ({
  isNullish  : '—',
  isNumber   : val  => new Intl.NumberFormat('de-DE').format(val),
  isDate     : date => date.toLocaleDateString('de-DE'),
  isBoolean  : bool => (bool ? 'Ja' : 'Nein'),
  isIterable : list => [...list].join(', '), // custom predicate check from @pulgasari/is
  fallback   : val  => String(val),
});
```

usage in Data Rendering:

```javascript
const rowData      = [null, 1250.5, new Date(), true, ['Admin', 'Editor']];
const formattedRow = rowData.map(formatCell);
// Output: ['—', '1.250,5', '26.9.2026', 'Ja', 'Admin, Editor']
```

## example 5: Polymorpher Children-Renderer (renderNode)
​
Verarbeitet JSX/DOM/Component-Bäume flexibel in UI-Libraries.

normalizes different children shapes into an array of renderable nodes.

```javascript
export function renderNode (children) {
  return shift(children, {
    // skip empty nodes
    isNullish : () => [],
    // lazy components or factory functions
    isFn : fn => renderNode(fn()),
    // single DOM / EDO element
    isElementish : node => [node],
    // collections (Array, Set, NodeList) excluding raw strings
    isCollection : items => [...items].flatMap(renderNode),
    // text nodes (string/number)
    fallback : text => [document.createTextNode(String(text))],
  });
}
```


