// @pulgasatri/devtools

import { autoloader } from '@aufbau/elements';
import createElement  from '@domina/methods/createElement.js';
autoloader();



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
  console : createElement('section', { class: 'hidden', id: 'devtools-panel-consosle' }),        
  css     : createElement('section', { class: 'hidden', id: 'devtools-panel-css' }),
  dom     : createElement('section', { class: 'hidden', id: 'devtools-panel-css' }),
  style   : createElement('section', { class: 'hidden', id: 'devtools-panel-css' }),
  // api
  hide   : (key)        => $panels[key].classList.add('hidden'),
  show   : (key)        => $panels[key].classList.remove('hidden'),
  toggle : (key, force) => $panels[key].classList.toggle('hidden', force),
  //open   : (key)        => $panels.toggle(key, false),
  //close  : (key)        => $panels.toggle(key, true),
};

const $menu = createElement('menu');
for (const key in taps) {
  const $icon = createElement('aufbau-icon', {
    name    : taps[key], 
    onclick : $panels.toggle(key),
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



