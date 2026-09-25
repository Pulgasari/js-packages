// @aufbau/utils/fp/array.js

// data-last array transformers, ready to drop into pipe().
// hand-written closures instead of curry(), one less rest-spread per call on a hot path.

export const

// :::::: TRANSFORM

filter  = (fn)          => list => list.filter  (fn),
flat    = (depth = 1)   => list => list.flat    (depth),
flatMap = (fn)          => list => list.flatMap (fn),
map     = (fn)          => list => list.map     (fn),
reduce  = (fn, initial) => list => list.reduce  (fn, initial),

// :::::: QUERY
  
every = fn => list => list.every (fn),
find  = fn => list => list.find  (fn),
some  = fn => list => list.some  (fn),

// :::::: ORDER & SHAPE
// sort and reverse copy first, the native methods mutate in place
  
drop    = count      => list => list.slice(count),
join    = (sep = '') => list => list.join(sep),
reverse =               list => [...list].reverse(),
sort    = compare    => list => [...list].sort(compare),
take    = count      => list => list.slice(0, count),
uniq    =               list => [...new Set(list)],

// :::::: SEQUENCE OPS (arrays AND strings)

at       = (index)      => sequence => sequence.at       (index),
concat   = (...values)  => sequence => sequence.concat   (...values),
includes = (search)     => sequence => sequence.includes (search),
indexOf  = (search)     => sequence => sequence.indexOf  (search),
slice    = (start, end) => sequence => sequence.slice    (start, end);

/*

// return the first object matching the specified key-value pair
const findByKeyValue = (array, key, value) => {
  return array.find(item => item && item[key] === value);
};

// return the first object matching all key-value pairs in criteria
const findByCriteria = (array, criteria) => {
  return array.find(item => 
    item && Object.entries(criteria).every(([key, value]) => item[key] === value)
  );
};

// return the first object matching at least one key-value pair in criteria
const findByAnyCriteria = (array, criteria) => {
  return array.find(item => 
    item && Object.entries(criteria).some(([key, value]) => item[key] === value)
  );
};

// return all objects matching all key-value pairs in criteria
const filterByCriteria = (array, criteria) => {
  return array.filter(item => 
    item && Object.entries(criteria).every(([key, value]) => item[key] === value)
  );
};

// return all objects matching at least one key-value pair in criteria
const filterByAnyCriteria = (array, criteria) => {
  return array.filter(item => 
    item && Object.entries(criteria).some(([key, value]) => item[key] === value)
  );
};

*/

// arr.js

// :::::: CORE

const byCriteria = (item, criteria, mode = 'every') => {
  return Object.keys(criteria).[mode](
    key => item[key] === criteria[key]
  )
}

const byAllCriteria = (item, criteria) => {
  return Object.keys(criteria).every(
    key => item[key] === criteria[key]
  )
}
const byAnyCriteria = (item, criteria) => {
  return Object.keys(criteria).some(
    key => item[key] === criteria[key]
  )
}


export const
dropByCriteria = (array, criteria = {}) => {
  return array.filter(item => !byAllCriteria(item, criteria));
};

export const
dropByAnyCriteria = (array, criteria = {}) => {
  return array.filter(item => !byAnyCriteria(item, criteria));
};

export const 
filterByCriteria = (array, criteria = {}) => {
  return array.filter(item => byAllCriteria(item, criteria));
};

export const 
filterByAnyCriteria = (array, criteria = {}) => {
  return array.filter(item => byAnyCriteria(item, criteria));
};


export const
dropByCriteria = (array, criteria = {}) => {
  return array.filter(item =>
    !Object.keys(criteria).every(
      key => item[key] === criteria[key]
    )
  );
};

export const
dropByAnyCriteria = (array, criteria = {}) => {
  return array.filter(item =>
    !Object.keys(criteria).some(
      key => item[key] === criteria[key]
    )
  );
};

export const 
filterByCriteria = (array, criteria = {}) => {
  return array.filter(item =>
    Object.keys(criteria).every(
      key => item[key] === criteria[key]
    )
  );
};

export const 
filterByAnyCriteria = (array, criteria = {}) => {
  return array.filter(item =>
    Object.keys(criteria).some(
      key => item[key] === criteria[key]
    )
  );
};

export const 
mapBy     = (array, key) => array.map(item => item[key]),
mapValues = (array, fn)  => array.map(fn);

export const sortByKey = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const left  = a[key];
    const right = b[key];

    if (left === right) return 0;

    const result = left < right ? -1 : 1;

    return direction === 'desc' ? -result : result;
  });
};

export const sortByKeys = (array, keys) => {
  const rules = Array.isArray(keys)
    ? Object.fromEntries(keys.map(key => [key, 'asc']))
    : keys;

  return [...array].sort((a, b) => {
    for (const [key, direction] of Object.entries(rules)) {
      const left  = a[key];
      const right = b[key];

      if (left === right) continue;

      const result = left < right ? -1 : 1;

      return direction === 'desc' ? -result : result;
    }

    return 0;
  });
};

export const
sortBy = (array, sort) => (typeof sort === 'string') ? sortByKey(array, sort) : sortByKeys(array, sort);      

// :::::: ARRAY SUGAR

const methods = {
  dropByCriteria,
  dropByAnyCriteria,
  filterByCriteria,
  filterByAnyCriteria,
  mapBy,
  mapValues,
  sortBy,
  sortByKey,
  sortByKeys,
};

export const arr = array => new Proxy({}, {
  get (_, method) {
    const fn = methods[method];

    return fn
      ? (...args) => fn(array, ...args)
      : array?.[method];
  }
});

export default arr;
