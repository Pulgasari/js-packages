// @pulgasatri/devtools

import { autoloader } from '@aufbau/elements';
import createElement  from '@domina/methods/createElement.js';
autoloader();

// ::::::
//const createIcon = (icon, props = {}) => createElement('aufbau-icon', { icon, ...props });

const tapsList = [
  { panel: 'console' , icon: 'mdi:console-line' },
  { panel: 'dom'     , icon: 'mdi:file-tree'    },
  { panel: 'css'     , icon: 'ph:file-css-fill' },
  { panel: 'style'   , icon: 'dashicons:admin-appearance' },
];

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
  //open   : (key)        => $panels.toggle(key, false),
  //close  : (key)        => $panels.toggle(key, true),
};

const $menu = createElement('menu');
for (const key in taps) {
  //const $icon = createIcon(taps[key], { onclick: $panels.toggle(key) });
  const $icon = createElement('aufbau-icon', {
    icon    : taps[key], 
    onClick : $panels.toggle(key),
  });
  $menu.append($icon);
}

$devtools.append(
  $panels.console,
  $panels.css,
  $panels.dom,
  $panels.style,
  $menu,
);

document.body.append($devtools);

$code = createElement('aufbau-code', { lang: 'css', placeholder: 'enter css code ...' });    
$panels.css.append($code);

$panels.console.innerHTML = '<i>coming soon ...</i>';
$panels.dom.innerHTML     = '<i>coming soon ...</i>';
$panels.style.innerHTML   = '<i>coming soon ...</i>';



