// @pulgasatri/devtools

import { autoloader } from '@aufbau/elements';
import createElement  from '@domina/methods/createElement.js';

autoloader();

$menu = createElement('div', { id: 'devtools' });
$menu.innerHTML = `
  <aufbau-icon name=''></aufbau-icon>
`;

const taps = [
  { panel: 'console' , icon: 'mdi:console-line' },
  { panel: 'dom'     , icon: 'mdi:file-tree'    },
  { panel: 'css'     , icon: 'ph:file-css-fill' },
  { panel: 'style'   , icon: 'dashicons:admin-appearance' },
];
