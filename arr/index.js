// @ts-self-types="./index.d.ts"
// @pulgasari/arr

// data first array helpers for lists of records, plus a chainable arr() sugar.
// the data last transformers for pipe() live in ./fp.js

// :::::: CRITERIA

// every key of criteria has to match, or at least one
const matchesAll = (item, criteria) => Object.keys(criteria).every(key => item?.[key] === criteria[key]);
const matchesAny = (item, criteria) => Object.keys(criteria).some (key => item?.[key] === criteria[key]);

export const
dropByAnyCriteria   = (array, criteria = {}) => array.filter(item => !matchesAny(item, criteria)),
dropByCriteria      = (array, criteria = {}) => array.filter(item => !matchesAll(item, criteria)),
filterByAnyCriteria = (array, criteria = {}) => array.filter(item => matchesAny(item, criteria)),
filterByCriteria    = (array, criteria = {}) => array.filter(item => matchesAll(item, criteria)),
findByAnyCriteria   = (array, criteria = {}) => array.find  (item => matchesAny(item, criteria)),
findByCriteria      = (array, criteria = {}) => array.find  (item => matchesAll(item, criteria));

// :::::: MAP

export const
mapBy     = (array, key) => array.map(item => item?.[key]),
mapValues = (array, fn)  => array.map(fn);

// :::::: SORT
// copies first, the native sort mutates in place

const compare = (left, right) => left === right ? 0 : left < right ? -1 : 1;

export const
sortByKey = (array, key, direction = 'asc') => {
  const sign = direction === 'desc' ? -1 : 1;
  return [...array].sort((a, b) => sign * compare(a?.[key], b?.[key]));
},

// ['name', 'age'] sorts ascending by each, { age: 'desc', name: 'asc' } names the direction
sortByKeys = (array, keys) => {
  const rules = Object.entries(Array.isArray(keys) ? Object.fromEntries(keys.map(key => [key, 'asc'])) : keys);

  return [...array].sort((a, b) => {
    for (const [key, direction] of rules) {
      const result = compare(a?.[key], b?.[key]);
      if (result) return direction === 'desc' ? -result : result;
    }
    return 0;
  });
},

sortBy = (array, sort, direction) => typeof sort === 'string' ? sortByKey(array, sort, direction) : sortByKeys(array, sort);

// :::::: CHAIN

const methods = {
  dropByAnyCriteria,
  dropByCriteria,
  filterByAnyCriteria,
  filterByCriteria,
  findByAnyCriteria,
  findByCriteria,
  mapBy,
  mapValues,
  sortBy,
  sortByKey,
  sortByKeys,
};

// known methods run against the array, everything else reads from it
export const arr = array => new Proxy(array ?? [], {
  get (target, key) {
    if (Object.hasOwn(methods, key)) return (...args) => methods[key](target, ...args);
    const value = target[key];
    return typeof value === 'function' ? value.bind(target) : value;
  },
});

export default arr;
