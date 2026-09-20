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

$devtools = createElement('aside', { id: 'devtools' });
$panels = {
  // elements
  console : createElement('div', { class: 'devtools-panel hidden', id: 'devtools-panel-consosle' }),        
  css     : createElement('div', { class: 'devtools-panel hidden', id: 'devtools-panel-css' }),
  dom     : createElement('div', { class: 'devtools-panel hidden', id: 'devtools-panel-css' }),
  style   : createElement('div', { class: 'devtools-panel hidden', id: 'devtools-panel-css' }),
  // api
  hide   : (key)        => $panels[key].classList.add('hidden'),
  show   : (key)        => $panels[key].classList.remove('hidden'),
  toggle : (key, force) => $panels[key].classList.toggle('hidden', force),
  //open   : (key)        => $panels.toggle(key, false),
  //close  : (key)        => $panels.toggle(key, true),
};

$menu = createElement('menu');
for (const key of taps) {
  const $icon = createElement('aufbau-icon', {
    name    : taps[key], 
    onclick : $panel.toggle(key),
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



