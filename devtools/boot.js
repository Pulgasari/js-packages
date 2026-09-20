// @pulgasari/devtools

import { autoloader }     from '@aufbau/elements';
import { adoptStylesheet } from '@domina/methods/adoptStylesheet.js';
import createElement      from '@domina/methods/createElement.js';

import settings                from './settings.js';
import { createConsolePanel }  from './panels/console.js';
import { createCssPanel }      from './panels/css.js';
import { createDataPanel }     from './panels/data.js';
import { createSettingsPanel } from './panels/settings.js';

autoloader();

// the sheet lives next to this module, so a host page only ever has to know the
// one entry point. adopted sheets cascade after the page's own author styles,
// which is why nothing in devtools.css needs !important
adoptStylesheet(new URL('./devtools.css', import.meta.url).href, { key: 'devtools' });

// :::::: PANELS ::::::::::::::::::::::::::::::::::::::::::::::::

/*
a panel factory returns { $content, onShow?, onHide? }. the lifecycle hooks are
what let a panel poll only while it is on screen — see panels/data.js. a panel
without a factory is a placeholder and just renders its note.
*/
const registry = {
  console  : { icon: 'mdi:console-line',            create: createConsolePanel },
  dom      : { icon: 'mdi:file-tree' },
  css      : { icon: 'ph:file-css-fill',            create: createCssPanel },
  data     : { icon: 'mdi:database-outline',        create: createDataPanel },
  style    : { icon: 'dashicons:admin-appearance' },
  settings : { icon: 'mdi:tune-variant',            create: createSettingsPanel },
};

const $devtools = createElement('aside', { id: 'devtools' });
const $menu     = createElement('menu');
const panels    = {};

for (const [key, { icon, create }] of Object.entries(registry)) {
  const panel    = create?.() ?? { $content: createElement('i', { textContent: 'coming soon ...' }) };
  const $section = createElement('section', { className: 'hidden', id: `devtools-${key}` }, panel.$content);

  panels[key] = { ...panel, $section };

  // the handler has to stay a function reference — calling toggle() here would
  // flip the panel at build time and register nothing
  $menu.append(createElement('aufbau-icon', {
    icon,
    title   : key,
    onClick : () => toggle(key),
  }));

  $devtools.append($section);
}

/** one panel at a time: two open sections leave no room for the app on a phone */
function toggle (key, force) {
  const panel = panels[key];
  const open  = force ?? panel.$section.classList.contains('hidden');

  for (const [other, candidate] of Object.entries(panels)) {
    if (other === key || candidate.$section.classList.contains('hidden')) continue;
    candidate.$section.classList.add('hidden');
    candidate.onHide?.();
  }

  panel.$section.classList.toggle('hidden', !open);
  open ? panel.onShow?.() : panel.onHide?.();
}

$devtools.append($menu);

// the two settings that change the panel's own shape ride as custom properties,
// so devtools.css stays the single place that decides what they mean
const CHROME_KEYS = new Set(['panelHeight', 'fontSize', 'wrapLines']);

const applyChrome = () => {
  $devtools.style.setProperty('--dt-height', `${settings.get('panelHeight')}dvh`);
  $devtools.style.setProperty('--dt-font',   `${settings.get('fontSize')}px`);
  $devtools.dataset.wrap = settings.get('wrapLines') ? 'on' : 'off';
};

applyChrome();
settings.subscribe((key) => { if (key === null || CHROME_KEYS.has(key)) applyChrome(); });

document.body.append($devtools);

export { panels, settings, toggle };
