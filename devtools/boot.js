// @pulgasari/devtools

import { autoloader } from '@aufbau/elements';
import createElement  from '@domina/methods/createElement.js';

autoloader();

// :::::: panels

const taps = {
  console : 'mdi:console-line',
  dom     : 'mdi:file-tree',
  css     : 'ph:file-css-fill',
  style   : 'dashicons:admin-appearance',
};

const $devtools = createElement('aside', { id: 'devtools' });

const $panels = {
  // elements
  console : createElement('section', { className: 'hidden', id: 'devtools-console' }),
  css     : createElement('section', { className: 'hidden', id: 'devtools-css' }),
  dom     : createElement('section', { className: 'hidden', id: 'devtools-dom' }),
  style   : createElement('section', { className: 'hidden', id: 'devtools-style' }),
  // api
  hide   : (key)        => $panels[key].classList.add('hidden'),
  show   : (key)        => $panels[key].classList.remove('hidden'),
  toggle : (key, force) => $panels[key].classList.toggle('hidden', force),
};

const $menu = createElement('menu');
for (const key in taps) {
  // the handler has to stay a function reference, calling toggle() here would
  // flip the panel at build time and register nothing
  const $icon = createElement('aufbau-icon', {
    icon    : taps[key],
    onClick : () => $panels.toggle(key),
  });
  $menu.append($icon);
}

// :::::: live css
// an editable <aufbau-code> writing straight into a <style> in <head>, backed by
// localStorage so the sheet survives reloads. the style node is appended before
// the panel mounts, so stored css paints with the first frame.

const CSS_KEY = 'devtools:css';

// storage is blocked in incognito and behind some privacy settings, a dev panel
// is not worth throwing over
const readCss  = ()    => { try { return localStorage.getItem(CSS_KEY) ?? ''; } catch { return ''; } };
const writeCss = (css) => { try { localStorage.setItem(CSS_KEY, css); }        catch {} };

const $liveCss = createElement('style', { id: 'devtools-live-css', textContent: readCss() });
document.head.append($liveCss);

const $code = createElement('aufbau-code', {
  lang     : 'css',
  theme    : 'dracula',
  editable : '',
  code     : readCss() || '/* live css */',
  // <aufbau-code> re-emits every edit of its contenteditable as a CustomEvent
  // carrying the current source. the inner node's native input event bubbles up
  // here as well, hence the fallback to the element's own getter.
  onInput  : (event) => {
    const css = event.detail?.code ?? $code.code ?? '';
    $liveCss.textContent = css;
    writeCss(css);
  },
});

$panels.css.append($code);

$panels.console.innerHTML = '<i>coming soon ...</i>';
$panels.dom.innerHTML     = '<i>coming soon ...</i>';
$panels.style.innerHTML   = '<i>coming soon ...</i>';

// :::::: mount

$devtools.append(
  $panels.console,
  $panels.css,
  $panels.dom,
  $panels.style,
  $menu,
);

document.body.append($devtools);
