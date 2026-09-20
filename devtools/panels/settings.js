// @pulgasari/devtools/panels/settings.js
//
// the controls are native <input>/<select> rather than @aufbau/runtime/gui.js,
// which builds the same shape of panel from the same shape of spec and is what
// zugriff's own app settings use. the reason is narrow: a debugging tool should
// not depend on the component library it may be used to debug. if <aufbau-picker>
// is what broke, devtools still has to open. the spec in ../settings.js is kept
// in gui.js's format, so swapping this file for a gui.controls() call is a local
// change if that trade ever stops being worth it.

import createElement from '@domina/methods/createElement.js';
import settings, { SPEC } from '../settings.js';

const el = createElement;

function control (key, entry, value) {
  if (entry.type === 'boolean') {
    return el('input', {
      type: 'checkbox', checked: value, name: key,
      onChange: (event) => settings.set(key, event.target.checked),
    });
  }

  if (entry.type === 'enum') {
    const $select = el('select', { name: key, onChange: (event) => settings.set(key, event.target.value) },
      ...entry.values.map(option => el('option', { value: option, textContent: option, selected: option === value })));
    return $select;
  }

  // a range plus a live readout: on a phone a slider is reachable where a number
  // stepper's arrows are not
  const $out   = el('output', { className: 'dt-set-out', textContent: `${value}${entry.unit ? ` ${entry.unit}` : ''}` });
  const $range = el('input', {
    type: 'range', name: key, min: entry.min, max: entry.max, step: entry.step, value,
    onInput: (event) => {
      const next = Number(event.target.value);
      $out.textContent = `${next}${entry.unit ? ` ${entry.unit}` : ''}`;
      settings.set(key, next);
    },
  });

  return el('span', { className: 'dt-set-range' }, $range, $out);
}

export function createSettingsPanel () {
  const $body = el('div', { className: 'dt-body' });

  const build = () => {
    const values = settings.all();

    $body.replaceChildren(...Object.entries(SPEC).map(([key, entry]) => el('label', { className: 'dt-row dt-set-row' },
      el('span', { className: 'dt-key', textContent: entry.label ?? key }),
      el('span', { className: 'dt-val' }, control(key, entry, values[key])),
    )));

    $body.append(
      el('p', { className: 'dt-note', textContent:
        'panel height and font size apply immediately. the console buffer only grows from here on — entries already dropped are gone, and the page-side recorder keeps its own fixed cap, so the history available at mount is whatever that held.' }),
      el('div', { className: 'dt-actions' },
        el('button', { type: 'button', className: 'dt-btn', textContent: 'reset to defaults', onClick: () => settings.reset() })),
    );
  };

  build();

  // a reset rewrites every value at once, so the panel is rebuilt rather than
  // each control trying to reconcile itself
  settings.subscribe((key) => { if (key === null) build(); });

  return { $content: $body };
}

export default createSettingsPanel;
