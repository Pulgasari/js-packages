# @pulgasari/typeshift

a test sibling of `@pulgasari/shapeshift`: the case keys are patterns instead of predicate names.

```javascript
import { typeshift } from '@pulgasari/typeshift';

const toElements = typeshift ({
  'null | undefined'  : ()       => [document.documentElement],
  'string(1..)'       : (target) => [...document.querySelectorAll(target)],
  'element'           : (target) => [target],
  'iterable & !string': (target) => [...target].filter(isElement),
  fallback            : ()       => [],
});
```

patterns are parsed and compiled once, when `typeshift(cases)` is called. the first matching case wins, `fallback` otherwise.

---

## exports

- `typeshift` — an instance that knows the core types and the predicates of `@pulgasari/is` as names
- `pureTypeshift` — an instance that knows the core types only
- `createTypeshift` — the factory
- `parse` — a pattern string to its syntax tree

every instance has:

- `.with({ name: predicate | pattern })` — adds types to this very instance, patterns may name each other and themselves
- `.matches(pattern, value)` — a single test
- `.predicate(pattern)` — the compiled predicate
- `.types` — a copy of what it knows

---

## syntax

| pattern                       | matches                                                   |
| ----------------------------- | --------------------------------------------------------- |
| `string`                      | a type by name                                            |
| `Date`, `Map`                 | an unknown capitalized global constructor, by instanceof   |
| `string \| number`            | either                                                    |
| `iterable & !string`          | both, `!` negates                                         |
| `string[]`                    | an array, every item matches                              |
| `[number, number]`            | a tuple of exactly that length                            |
| `[string, ...number]`         | a tuple with a rest                                       |
| `{ ok: true, data?: object }` | an object with these keys, `?` may be missing, more allowed |
| `'a' \| "b" \| 3 \| true \| null` | literals                                              |
| `/^\d+$/i`                    | a string the regexp matches                               |
| `number(0..10)`, `(1..)`, `(..5)`, `(3)` | a range: numbers by value, strings and arrays by length, maps and sets by size |
| `(string \| number)[]`        | grouping                                                  |

precedence, loosest first: `|`, `&`, `!`, `[]`.

core types (typeof, in every instance): `any`, `array`, `bigint`, `boolean`, `function`, `number`, `object` (not null), `string`, `symbol`.

from `@pulgasari/is` (in `typeshift`): `isPlainObject` is `plainObject`, `isJSON` is `json`, `isNullish` is `nullish` and so on. the core names keep their typeof meaning, so `number` includes `NaN`, `finite` does not.

---

## own types

```javascript
import { createTypeshift } from '@pulgasari/typeshift';

const shift = createTypeshift ().with({
  point : '[number, number]',
  tree  : '{ value: number, children: tree[] }',
  even  : n => n % 2 === 0,
});

shift.matches('point[]', [[1, 2], [3, 4]]);   // true
shift.matches('number & even', 4);             // true
```

a key that looks like an integer (`'1'`) is sorted ahead of the others by javascript itself, write it as `'1.0'` or put it into a union if the order matters.

---

erweiterung bzw . koppeln mit zod / standardschema / typescript ?

```javascript
// Theoretische Erweiterung für typeshift:
typeshift.toStandardSchema = (pattern) => ({
  '~standard': {
    version: 1,
    vendor: 'typeshift',
    validate: (value) => {
      const ok = typeshift.matches(pattern, value);
      return ok 
        ? { value } 
        : { issues: [{ message: `Value does not match pattern: ${pattern}` }] };
    }
  }
});
```
