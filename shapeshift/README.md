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
