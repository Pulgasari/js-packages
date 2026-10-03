// @pulgasari/typeshift/compile.js

// a syntax tree -> a predicate. 
// names are looked up through `resolve` only when a value is tested,
// so a type may name itself (`tree: '{ children: tree[] }'`)

function sizeOf (value) {
  if (typeof value === 'number' || typeof value === 'bigint') return Number(value);
  if (typeof value === 'string' || Array.isArray(value))      return value.length;
  if (value instanceof Map || value instanceof Set)           return value.size;
  return NaN;
}

const inRange = ({ maximum, minimum }, value) => {
  const size = sizeOf(value);
  return !Number.isNaN(size) && (minimum === undefined || size >= minimum) && (maximum === undefined || size <= maximum);
};

const isKeyed = value => (typeof value === 'object' && value !== null) || typeof value === 'function';

function compile (node, resolve) {
  switch (node.type) {
    case 'intersection': {
      const parts = node.parts.map(part => compile(part, resolve));
      return value => parts.every(part => part(value));
    }
    case 'list': {
      const item = compile(node.item, resolve);
      return value => Array.isArray(value) && value.every(item);
    }
    case 'literal': {
      const expected = node.value;
      return value => value === expected;
    }
    case 'name': {
      const { name, range } = node;
      return range
        ? value => resolve(name)(value) && inRange(range, value)
        : value => resolve(name)(value);
    }
    case 'not': {
      const pattern = compile(node.pattern, resolve);
      return value => !pattern(value);
    }
    case 'regexp': {
      const regexp = node.value;
      return value => typeof value === 'string' && (regexp.lastIndex = 0, regexp.test(value));
    }
    case 'shape': {
      const fields = node.fields.map(({ key, optional, pattern }) => ({ key, optional, pattern: compile(pattern, resolve) }));
      return value => isKeyed(value) && fields.every(({ key, optional, pattern }) =>
        optional && value[key] === undefined ? true : key in value && pattern(value[key]));
    }
    case 'tuple': {
      const items = node.items.map(item => compile(item, resolve));
      const rest  = node.rest && compile(node.rest, resolve);
      return value => Array.isArray(value)
        && (rest ? value.length >= items.length : value.length === items.length)
        && items.every((item, index) => item(value[index]))
        && (!rest || value.slice(items.length).every(rest));
    }
    case 'union': {
      const options = node.options.map(option => compile(option, resolve));
      return value => options.some(option => option(value));
    }
  }
  throw new TypeError(`unknown node: ${node.type}`);
}

export { compile, sizeOf };
export default compile;
