// @pulgasari/devtools/fmt.js
//
// the formatters the panels share. this is the staging area for everything that
// does not exist in @pulgasari/num yet — once a helper has proven itself here it
// should move there and be dropped from this file.

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

// binary units, which is what every storage and transfer api reports in.
// whole bytes and three digit values carry no fraction, they only add noise
export const bytes = (value, decimals = 1) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '0 B';

  const i      = Math.min(Math.floor(Math.log(n) / Math.log(1024)), UNITS.length - 1);
  const scaled = n / 1024 ** i;

  return `${scaled.toFixed(i === 0 || scaled >= 100 ? 0 : decimals)} ${UNITS[i]}`;
};

// milliseconds, the unit the performance apis speak
export const ms = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n <     1) return `${n.toFixed(2)} ms`;
  if (n <  1000) return `${Math.round(n)} ms`;
  if (n < 60000) return `${(n / 1000).toFixed(2)} s`;

  return `${Math.floor(n / 60000)}:${String(Math.round(n % 60000 / 1000)).padStart(2, '0')} min`;
};

// "how long ago", for cache stamps and boot marks
export const ago = (timestamp) => {
  const n = Number(timestamp);
  if (!Number.isFinite(n) || n <= 0) return '—';

  const delta = Date.now() - n;
  if (delta <         0) return 'just now';
  if (delta <     60000) return `${Math.round(delta / 1000)}s ago`;
  if (delta <   3600000) return `${Math.round(delta / 60000)}m ago`;
  if (delta <  86400000) return `${Math.round(delta / 3600000)}h ago`;

  return `${Math.round(delta / 86400000)}d ago`;
};

export const percent = (value, total, decimals = 0) => (
  !total || !Number.isFinite(value / total) ? '—' : `${(value / total * 100).toFixed(decimals)}%`
);

export const number = (value, locale = 'de-DE') => (
  Number.isFinite(Number(value)) ? new Intl.NumberFormat(locale).format(value) : '—'
);

export const plural = (count, singular, many = `${singular}s`) => `${number(count)} ${count === 1 ? singular : many}`;

export const truncate = (text, max = 40) => {
  const string = String(text ?? '');
  return string.length > max ? `${string.slice(0, max - 1)}…` : string;
};

// urls are ellipsised in the middle: the host says where it came from, the last
// path segment says what it is, only the middle is ever noise
export const url = (href, max = 44) => {
  let path = String(href ?? '');

  try {
    const parsed = new URL(path, location.href);
    path = parsed.origin === location.origin ? parsed.pathname + parsed.search : parsed.host + parsed.pathname;
  } catch {}

  if (path.length <= max) return path;

  const head = Math.ceil((max - 1) * 0.4);
  return `${path.slice(0, head)}…${path.slice(-(max - 1 - head))}`;
};

// a value that is missing because the browser has no such api, as opposed to a
// value that is genuinely zero. the panels must never confuse the two
export const missing = (why = 'n/a') => why;

export default { ago, bytes, missing, ms, number, percent, plural, truncate, url };
