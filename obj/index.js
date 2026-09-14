// @ts-self-types="./index.d.ts"
// @pulgasari/obj

// :::::: HELPERS

export const 
isObject      = value => value !== null && typeof value === 'object',
isPlainObject = value => isObject(value) && (value.constructor === Object || !value.constructor);

// :::::: CORE / METHODS

export const
deepClone = (value) => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)),     

deepMerge = (target, ...sources) => {
  for (const source of sources) {
    if (!isPlainObject(source)) continue;
    for (const key of Object.keys(source)) {
      const value   = source[key];
      const current = target[key];
      target[key] = isPlainObject(current) && isPlainObject(value) ? deepMerge(current, value) : value;
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

toggleByPath = (object, path) => {
  const { target, key, value } = resolvePath(object, path);

  target[key] = typeof value === 'boolean' ? !value
    : value === 'on'  ? 'off'
    : value === 'off' ? 'on'
    : value;

  return object;
},

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

dropByKey = (object, ...keys) => {
  const result = { ...object };
  for (const key of keys) delete result[key];
  return result;
};


// ::: TRANSFORM

export const 

transformKeys = (object, ...fns) => {
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => {
      for (const fn of fns) key = fn(key, value);
      return [key, value];
    })
  );
},

transformValues = (object, ...fns) => {
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => {
      for (const fn of fns) value = fn(value, key);
      return [key, value];
    })
  );
};


// ::: CONVERSION

export const 
toEntries = object => Object.entries (object),
toKeys    = object => Object.keys    (object),
toValues  = object => Object.values  (object);

// :::::: PROXY

const methods = {
  assign,
  deleteByPath,
  dropByKey,
  getByPath,
  hasPath,
  merge,
  resolvePath,
  setByPath,
  toggleByPath,
  transformKeys,
  transformValues,
  toEntries,
  toKeys,
  toValues,
};

const obj = object => new Proxy ({}, {
  get (_, method) {
    const fn = methods[method];

    return fn
      ? (...args) => fn(object, ...args)
      : object?.[method];
  }
});

// :::::: EXPORT

export { obj };
export default obj;
