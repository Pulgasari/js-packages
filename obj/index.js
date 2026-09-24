// @ts-self-types="./index.d.ts"
// @pulgasari/obj

// :::::: HELPERS

const hasStructuredClone = typeof structuredClone === 'function';

export const 
isObject = value => value !== null && typeof value === 'object',
isPlainObject = value => {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
};

// :::::: CORE / METHODS

export const

deepClone = value => hasStructuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value)),   

deepMerge = (target, ...sources) => {
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    if (!isPlainObject(source)) continue;

    for (const key in source) {
      if (!Object.hasOwn(source, key) || key === '__proto__' || key === 'constructor') continue;

      const value   = source[key];
      const current = target[key];

      target[key] = isPlainObject(current) && isPlainObject(value)
        ? deepMerge(current, value)
        : isPlainObject(value)
        ? deepMerge({}, value)
        : value;
    }
  }
  return target;
},

resolvePath = (object, dotKey) => {
  const parts  = dotKey.split('.');
  const key    = parts.pop();
  const target = parts.reduce((node, part) => node[part], object);
  const value  = target[key];

  return { target, key, value };
},

getByPath = (object, path) => {
  return resolvePath(object, path).value;
},

hasPath = (object, path) => {
  const { target, key } = resolvePath(object, path);
  return Object.hasOwn(target, key);
},

setByPath = (object, path, value) => {
  const { target, key } = resolvePath(object, path);
  target[key] = value;
  return object;
},

deleteByPath = (object, path) => {
  const { target, key } = resolvePath(object, path);
  delete target[key];
  return object;
},

/*
// Fast non-allocating path lookup without split('.') arrays or TypeError on missing nodes
resolvePath = (object, path) => {
  if (object == null || typeof path !== 'string') {
    return { target: undefined, key: undefined, value: undefined };
  }

  const lastDot = path.lastIndexOf('.');
  
  if (lastDot === -1) {
    return { target: object, key: path, value: object[path] };
  }

  let current = object;
  let start = 0;
  let dotIndex = path.indexOf('.');

  while (dotIndex !== lastDot) {
    const k = path.slice(start, dotIndex);
    current = current[k];
    if (current == null) {
      return { target: undefined, key: path.slice(lastDot + 1), value: undefined };
    }
    start = dotIndex + 1;
    dotIndex = path.indexOf('.', start);
  }

  const parentKey = path.slice(start, lastDot);
  const target = current[parentKey];
  const key = path.slice(lastDot + 1);
  const value = isObject(target) ? target[key] : undefined;

  return { target, key, value };
},

getByPath = (object, path) => {
  if (object == null || typeof path !== 'string') return undefined;
  
  let current = object;
  let start = 0;
  let dotIndex = path.indexOf('.');

  while (dotIndex !== -1) {
    const key = path.slice(start, dotIndex);
    current = current[key];
    if (current == null) return undefined;
    start = dotIndex + 1;
    dotIndex = path.indexOf('.', start);
  }

  return current[path.slice(start)];
},

hasPath = (object, path) => {
  if (object == null || typeof path !== 'string') return false;

  let current = object;
  let start = 0;
  let dotIndex = path.indexOf('.');

  while (dotIndex !== -1) {
    const key = path.slice(start, dotIndex);
    if (!Object.hasOwn(current, key)) return false;
    current = current[key];
    if (current == null) return false;
    start = dotIndex + 1;
    dotIndex = path.indexOf('.', start);
  }

  return Object.hasOwn(current, path.slice(start));
},

setByPath = (object, path, value) => {
  if (!isObject(object) || typeof path !== 'string') return object;

  let current = object;
  let start = 0;
  let dotIndex = path.indexOf('.');

  while (dotIndex !== -1) {
    const key = path.slice(start, dotIndex);
    if (!isObject(current[key])) {
      current[key] = {};
    }
    current = current[key];
    start = dotIndex + 1;
    dotIndex = path.indexOf('.', start);
  }

  current[path.slice(start)] = value;
  return object;
},

deleteByPath = (object, path) => {
  if (object == null || typeof path !== 'string') return object;

  let current = object;
  let start = 0;
  let dotIndex = path.indexOf('.');

  while (dotIndex !== -1) {
    const key = path.slice(start, dotIndex);
    current = current[key];
    if (current == null) return object;
    start = dotIndex + 1;
    dotIndex = path.indexOf('.', start);
  }

  delete current[path.slice(start)];
  return object;
},
*/

toggleByPath = (object, path) => {
  const oldValue = getByPath(object, path);
  const newValue = typeof oldValue === 'boolean' ? !oldValue
    : oldValue === 'on'  ? 'off'
    : oldValue === 'off' ? 'on'
    : oldValue;

  return setByPath(object, path, newValue);
},



/*
assign = (target, ...sources) => {
  return Object.assign(target, ...sources);
},
merge = (target, ...sources) => {
  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      if (isPlainObject(value) && isPlainObject(target[key]))
        merge(target[key], value);
      else
        target[key] = value;
    }
  }

  return target;
},
*/

dropByKey = (object, ...keys) => {
  const result = { ...object };
  for (const key of keys) delete result[key];
  return result;
};

/*
dropByKey = (object, ...keys) => {
  if (object == null) return {};
  const result = {};
  const keySet = new Set (keys);

  for (const key in object) {
    if (Object.hasOwn(object, key) && !keySet.has(key)) {
      result[key] = object[key];
    }
  }
  return result;
};
*/

// ::: TRANSFORM

export const 

transformKeys = (object, ...fns) => {
  if (object == null) return {};
  
  const result  = {};
  const fnCount = fns.length;

  for (let key in object) {
    if (Object.hasOwn(object, key)) {
      const value = object[key];
      for (let i = 0; i < fnCount; i++) {
        key = fns[i](key, value);
      }
      result[key] = value;
    }
  }
  
  return result;
},

transformValues = (object, ...fns) => {
  if (object == null) return {};
  
  const result  = {};
  const fnCount = fns.length;

  for (const key in object) {
    if (Object.hasOwn(object, key)) {
      let value = object[key];
      for (let i = 0; i < fnCount; i++) {
        value = fns[i](value, key);
      }
      result[key] = value;
    }
  }
  
  return result;
},

assign = Object.assign,
merge  = deepMerge; // alias deepMerge to keep single optimized recursive implementation

// ::: CONVERSION

export const 
toEntries = Object.entries,
toKeys    = Object.keys,
toValues  = Object.values;

// :::::: PROXY

const methods = {
  assign,
  deleteByPath,
  dropByKey,
  getByPath,
  hasPath,
  merge,
  //resolvePath,
  setByPath,
  toggleByPath,
  transformKeys,
  transformValues,
  toEntries,
  toKeys,
  toValues,
};

const obj = object => new Proxy(object ?? {}, {
  get(target, prop) {
    const fn = methods[prop];
    if (fn) return (...args) => fn(target, ...args);
    
    const val = target[prop];
    return typeof val === 'function' ? val.bind(target) : val;
  }
});

// :::::: PROXY
/*
const obj = object => new Proxy ({}, {
  get (_, method) {
    const fn = methods[method];

    return fn
      ? (...args) => fn(object, ...args)
      : object?.[method];
  }
});
*/

// :::::: EXPORT

export { obj };
export default obj;
