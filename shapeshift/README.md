# @shapeshift

---

# examples

## the variants

all 3 syntaxes gonna work.

```javascript
function toElements (target) {
  return shift (target) ({
    isNullish  : () => [document.documentElement],
    isString   : () => [...document.querySelectorAll(target)],
    isElement  : () => [target],
    isIterable : () => [...target].filter(isElement),
    fallback   : () => [],
  });
}
```

```javascript
const toElements = shift ({
  isNullish  : ()       => [document.documentElement],
  isString   : (target) => [...document.querySelectorAll(target)],
  isElement  : (target) => [target],
  isIterable : (target) => [...target].filter(isElement),
  fallback   : ()       => [],
});
```

```javascript
const toElements = (target) => shift (target, {
  isNullish  : () => [document.documentElement],
  isString   : () => [...document.querySelectorAll(target)],
  isElement  : () => [target],
  isIterable : () => [...target].filter(isElement),
  fallback   : () => [],
});
```

## example 1:

normalizes different date inputs into a native Date object.

```javascript
import { shift } from './shift.js';

export const parseDate = shift.from({
  isDate       : date      => date,
  isNumber     : timestamp => new Date (timestamp),
  isDateString : str       => new Date (str),
  isNullish    : ()        => new Date, // defaults to now
  fallback     : () => null,
});
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

export function extractValue (target) {
  return shift (target, {
    isElement : el => el.value ?? el.textContent?.trim() ?? '',
    isString  : selector => {
      const el = document.querySelector(selector);
      return el ? extractValue(el) : selector;
    },
    isFn      : fn => fn(),
    isNullish : '',
    fallback  : String(target),
  });
}
```

usage:

```javascript
extractValue('#user-input');          // Reads value from DOM node
extractValue(document.body);          // Reads textContent
extractValue(() => 'computed value'); // Runs getter function
extractValue(42);                     // '42'
```

## example 3: API Response Normalisierer (normalizePayload)

Nützt die Curried Form shift(data)(cases) in einer Async Data Pipeline.

Transforms incoming API data into a predictable standard shape.

```javascript
import { shift } from './shift.js';

export async function fetchUserData (userId) {
  const rawResponse = await api.get(`/users/${userId}`);

  return shift (rawResponse)({
    // Native Error or HTTP error instance
    isError : err => ({ ok: false, message: err.message, data: null }),

    // Valid JSON string needing parse
    isJSON : json => ({ ok: true, data: JSON.parse(json) }),

    // Plain object response
    isPlainObject : obj => ({ ok: true, data: obj }),

    // Empty or invalid response fallback
    isBlank  : { data: null, ok: false, message: 'Empty payload' },
    fallback : { data: null, ok: false, message: 'Unexpected payload format' },
  });
}
```

## example 4: Tabellen-Spalten Formatter (formatCell)

​Nützt shift.from(cases) direkt als Map-Callback beim Rendern von Data-Grids.

formats arbitrary cell values for display in a UI table.

```javascript
import { shift } from './shift.js';

const formatCell = shift.from({
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


