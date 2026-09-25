// @pulgasari/hash

export const stableStringify = (value) =>
    typeof value === 'string'                    ? value
  : value === null || typeof value !== 'object'  ? String(value)
  : Array.isArray(value)                         ? `[${value.map(stableStringify).join(',')}]`
  : `{${Object.keys(value).sort().map(key => `${key}:${stableStringify(value[key])}`).join(',')}}`;

export const hash = (value) => {
  const text = typeof value === 'string' ? value : stableStringify(value);
  let result = 5381;
  let index  = text.length;
  while (index) result = (result * 33) ^ text.charCodeAt(--index);
  return result >>> 0;
};

export const hashKey = (value) => hash(value).toString(36);




const hashKey = (value) => hash(value).toString(36);

function hashCode (s) {
  for (var i = 0, h = 0; i < s.length; i++)
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return h;
}

//const hashCode = (str) => [...str].reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0);

// https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0?permalink_comment_id=4557681#gistcomment-4557681     
function hashCode2 (s) {
  return [...s].reduce(
    (hash, c) => (Math.imul(31, hash) + c.charCodeAt(0)) | 0,
    0
  );
}
