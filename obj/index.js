// @ts-self-types="./index.d.ts"
// @pulgasari/obj

// :::::: PREDICATES

export const
isObject      = value => value !== null && typeof value === 'object',
isPlainObject = value => {
  if (!isObject(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
};

// :::::: CLONE / MERGE

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export const
deepClone = value => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)),

// plain objects are merged recursively, everything else is taken as is. mutates target
deepMerge = (target, ...sources) => {
  for (const source of sources) {
    if (!isPlainObject(source)) continue;

    for (const key of Object.keys(source)) {
      if (UNSAFE_KEYS.has(key)) continue;
      const value = source[key];

      target[key] = !isPlainObject(value)       ? value
                  : isPlainObject(target[key]) ? deepMerge(target[key], value)
                  :                              deepMerge({}, value);
    }
  }
  return target;
},

assign = Object.assign,
merge  = deepMerge;

// :::::: PATHS

// 'a.b.c' -> { target: object.a.b, key: 'c', value }. target is undefined when
// a node on the way is missing, nothing throws
export const
resolvePath = (object, path) => {
  const keys = String(path).split('.');
  const key  = keys.pop();
  let target = object;

  for (const part of keys) {
    target = isObject(target) ? target[part] : undefined;
  }

  return { key, target: isObject(target) ? target : undefined, value: isObject(target) ? target[key] : undefined };
},

getByPath = (object, path) => resolvePath(object, path).value,

hasPath = (object, path) => {
  const { key, target } = resolvePath(object, path);
  return target !== undefined && Object.hasOwn(target, key);
},

// missing nodes are created as plain objects
setByPath = (object, path, value) => {
  const keys = String(path).split('.');
  const key  = keys.pop();
  let target = object;

  for (const part of keys) {
    if (UNSAFE_KEYS.has(part)) return object;
    if (!isObject(target[part])) target[part] = {};
    target = target[part];
  }

  if (!UNSAFE_KEYS.has(key)) target[key] = value;
  return object;
},

deleteByPath = (object, path) => {
  const { key, target } = resolvePath(object, path);
  if (target !== undefined) delete target[key];
  return object;
},

// booleans flip, 'on' and 'off' swap, anything else stays
toggleByPath = (object, path) => {
  const value = getByPath(object, path);
  const next  = typeof value === 'boolean' ? !value
              : value === 'on'             ? 'off'
              : value === 'off'            ? 'on'
              :                              value;

  return setByPath(object, path, next);
};

// :::::: TRANSFORM

export const
dropByKey = (object, ...keys) => {
  const result = { ...object };
  for (const key of keys) delete result[key];
  return result;
},

// every function receives (key, value) and returns the next key
transformKeys = (object, ...fns) => {
  const result = {};
  for (const [key, value] of Object.entries(object ?? {})) {
    result[fns.reduce((current, fn) => fn(current, value), key)] = value;
  }
  return result;
},

// every function receives (value, key) and returns the next value
transformValues = (object, ...fns) => {
  const result = {};
  for (const [key, value] of Object.entries(object ?? {})) {
    result[key] = fns.reduce((current, fn) => fn(current, key), value);
  }
  return result;
};

// :::::: CONVERSION

export const
toEntries = Object.entries,
toKeys    = Object.keys,
toValues  = Object.values;

// :::::: CHAIN

const methods = {
  assign,
  deleteByPath,
  dropByKey,
  getByPath,
  hasPath,
  merge,
  resolvePath,
  setByPath,
  toEntries,
  toggleByPath,
  toKeys,
  toValues,
  transformKeys,
  transformValues,
};

// known methods run against the object, everything else reads the property
const obj = object => new Proxy(object ?? {}, {
  get (target, key) {
    if (Object.hasOwn(methods, key)) return (...args) => methods[key](target, ...args);
    const value = target[key];
    return typeof value === 'function' ? value.bind(target) : value;
  },
});

// :::::: EXPORT

export { obj };
export default obj;
