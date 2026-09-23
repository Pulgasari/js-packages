// @pulgasari/devtools

// :::::: IMPORT

import { autoloader }  from '@aufbau/elements';
import adoptStylesheet from '@domina/methods/adoptStylesheet.js';
import createElement   from '@domina/methods/createElement.js';
import htx             from '@htx/js';

import settings, { SPEC }      from './settings.js';
import { createConsolePanel }  from './panels/console.js';
import { createCssPanel }      from './panels/css.js';
import { createDataPanel }     from './panels/data.js';
import { createDomPanel }      from './panels/dom.js';
import { createSettingsPanel } from './panels/settings.js';

// :::::: INIT

autoloader();
adoptStylesheet(new URL('./devtools.css?v=2', import.meta.url).href, { key: 'devtools' });

// :::::: PANELS ::::::::::::::::::::::::::::::::::::::::::::::::

/*
a panel factory returns { $content, onShow?, onHide? }. the lifecycle hooks are
what let a panel poll only while it is on screen — see panels/data.js. a panel
without a factory is a placeholder and just renders its note.
*/
const registry = {
  console  : { icon: 'mdi:console-line',            create: createConsolePanel },
  dom      : { icon: 'mdi:file-tree',               create: createDomPanel },
  css      : { icon: 'ph:file-css-fill',            create: createCssPanel },
  data     : { icon: 'mdi:database-outline',        create: createDataPanel },
  style    : { icon: 'dashicons:admin-appearance' },
  settings : { icon: 'mdi:tune-variant',            create: createSettingsPanel },
};

// made with htx
//htx.tags.icon = { tag: 'aufbau-icon', args: 'icon', props: { role: 'button', tabIndex: 0 } };
//const $devtools = htx`<aside id='devtools' />`;
//const $tab      = htx`<$icon 'mdi:console-line' title='console' />`;

const $devtools = createElement('aside', { id: 'devtools' });

// :::::: RESIZE HANDLE :::::::::::::::::::::::::::::::::::::::::

/*
the handle is the aside's first child, which puts it on whichever end faces the
app: last in a normal column, first in the reversed one the top position uses.
css hides it while no panel is open, since there is then nothing to resize.

dragging writes --dt-height straight onto the element for the duration and only
commits to the settings on release — a store write per pointermove would persist
to localStorage sixty times a second for one gesture.
*/
const HEIGHT = SPEC.panelHeight;

const $handle = createElement('div', {
  title         : 'drag to resize',
  role          : 'separator',
  'aria-label'  : 'panel height',
  onPointerDown : (event) => {
    const $open = $devtools.querySelector('section:not([hidden])');
    if (!$open) return; // nothing to resize

    const startY = event.clientY;
    const startH = $open.getBoundingClientRect().height / innerHeight * 100;
    let   height = settings.get('panelHeight');

    $handle.setPointerCapture(event.pointerId);

    const onMove = (move) => {
      // at the bottom of the viewport the panel grows upwards, at the top it
      // grows downwards, so the sign follows the position
      const delta = ($devtools.dataset.position === 'top' ? 1 : -1) * (move.clientY - startY);

      height = Math.min(HEIGHT.max, Math.max(HEIGHT.min, Math.round((startH + delta / innerHeight * 100) / HEIGHT.step) * HEIGHT.step));
      $devtools.style.setProperty('--dt-height', `${height}dvh`);
    };

    const onUp = () => {
      $handle.removeEventListener('pointermove', onMove);
      $handle.removeEventListener('pointerup', onUp);
      $handle.removeEventListener('pointercancel', onUp);
      settings.set('panelHeight', height);
    };

    $handle.addEventListener('pointermove', onMove);
    $handle.addEventListener('pointerup', onUp);
    $handle.addEventListener('pointercancel', onUp);
  },
});

$devtools.append($handle);

// two groups, so the menu can push one to each edge: the panel tabs, and the
// actions that are not panels at all
const $tabs    = createElement('li');
const $actions = createElement('li');
const $menu    = createElement('menu', {}, $tabs, $actions);

const panels = {};
const $icons = {};

const icon = (props, group) => {
  const $icon = createElement('aufbau-icon', { role: 'button', tabIndex: 0, ...props });
  group.append($icon);
  return $icon;
};

for (const [key, { icon: name, create }] of Object.entries(registry)) {
  const panel    = create?.() ?? { $content: createElement('em', { textContent: 'coming soon ...' }) };
  const $section = createElement('section', { hidden: true, id: `devtools-${key}` }, panel.$content);

  // the panel object itself, not a copy: spreading it would mean a later
  // assignment like panels.dom.onPickChange lands on the copy while the panel
  // goes on calling its own, and the callback silently never fires
  panel.$section = $section;
  panels[key] = panel;

  // the handler has to stay a function reference — calling toggle() here would
  // flip the panel at build time and register nothing
  $icons[key] = icon({
    icon    : name,
    title   : key,
    'aria-pressed': 'false',
    onClick : () => toggle(key),
  }, $tabs);

  $devtools.append($section);
}

/** one panel at a time: two open sections leave no room for the app on a phone */
function toggle (key, force) {
  const panel = panels[key];
  const open  = force ?? panel.$section.hidden;

  for (const [other, candidate] of Object.entries(panels)) {
    if (other === key || candidate.$section.hidden) continue;
    candidate.$section.hidden = true;
    candidate.onHide?.();
  }

  panel.$section.hidden = !open;
  open ? panel.onShow?.() : panel.onHide?.();

  for (const [name, $icon] of Object.entries($icons)) {
    $icon.setAttribute('aria-pressed', String(!panels[name].$section.hidden));
  }
}

// :::::: ACTIONS :::::::::::::::::::::::::::::::::::::::::::::::

// picking belongs to the element panel but is wanted from anywhere, so the menu
// drives it and opens that panel along the way — a pick with nowhere to land
// would just move $0 silently
const $pick = icon({
  icon    : 'mdi:cursor-default-click-outline',
  title   : 'pick an element',
  'aria-pressed': 'false',
  onClick : () => {
    const on = panels.dom.pick();
    if (on) toggle('dom', true);
  },
}, $actions);

// the panel reports back, because it also disarms itself once something is
// picked and when it is hidden
panels.dom.onPickChange = (on) => $pick.setAttribute('aria-pressed', String(on));

icon({ icon: 'mdi:reload', title: 'reload the page', onClick: () => location.reload() }, $actions);

$devtools.append($menu);

// :::::: CHROME ::::::::::::::::::::::::::::::::::::::::::::::::

const CHROME_KEYS = new Set(['fontSize', 'panelHeight', 'position', 'wrapLines']);

// the settings that change the panel's own shape ride as custom properties and
// data attributes, so devtools.css stays the single place that decides what they
// mean
const applyChrome = () => {
  $devtools.style.setProperty('--dt-height', `${settings.get('panelHeight')}dvh`);
  $devtools.style.setProperty('--dt-font',   `${settings.get('fontSize')}px`);
  $devtools.dataset.wrap     = settings.get('wrapLines') ? 'on' : 'off';
  $devtools.dataset.position = settings.get('position');
};

applyChrome();
settings.subscribe((key) => { if (key === null || CHROME_KEYS.has(key)) applyChrome(); });

document.body.append($devtools);

export { panels, settings, toggle };
