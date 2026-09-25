// @ts-self-types="./fp.d.ts"
// @pulgasari/arr/fp

// data last array transformers, ready to drop into pipe(). hand written closures
// instead of curry(), one less rest spread per call on a hot path.

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

// :::::: ORDER AND SHAPE
// sort and reverse copy first, the native methods mutate in place

drop    = count      => list => list.slice(count),
join    = (sep = '') => list => list.join(sep),
reverse =               list => [...list].reverse(),
sort    = compare    => list => [...list].sort(compare),
take    = count      => list => list.slice(0, count),
uniq    =               list => [...new Set(list)],

// :::::: SEQUENCES (arrays and strings)

at       = (index)      => sequence => sequence.at       (index),
concat   = (...values)  => sequence => sequence.concat   (...values),
includes = (search)     => sequence => sequence.includes (search),
indexOf  = (search)     => sequence => sequence.indexOf  (search),
slice    = (start, end) => sequence => sequence.slice    (start, end);
