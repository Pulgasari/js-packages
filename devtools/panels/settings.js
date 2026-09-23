// panels/settings.js

/*
the controls are native <input>/<select> rather than @aufbau/runtime/gui.js,
which builds the same shape of panel from the same shape of spec and is what
zugriff's own app settings use. the reason is narrow: a debugging tool should
not depend on the component library it may be used to debug. if <aufbau-picker>
is what broke, devtools still has to open. the spec in ../settings.js is kept
in gui.js's format, so swapping this file for a gui.controls() call is a local
change if that trade ever stops being worth it.
*/

import createElement from '@domina/methods/createElement.js';
import settings, { SECTIONS, SPEC } from '../settings.js';

const el = createElement;

function control (key, entry, value) {
  if (entry.type === 'boolean') {
    return el('input', {
      type: 'checkbox', id: `dt-set-${key}`, checked: value, name: key,
      onChange: (event) => settings.set(key, event.target.checked),
    });
  }

  if (entry.type === 'enum') {
    const $select = el('select', { id: `dt-set-${key}`, name: key, onChange: (event) => settings.set(key, event.target.value) },
      ...entry.values.map(option => el('option', { value: option, textContent: option, selected: option === value })));
    return $select;
  }

  // a range plus a live readout: on a phone a slider is reachable where a number
  // stepper's arrows are not
  const $out   = el('output', { textContent: `${value}${entry.unit ? ` ${entry.unit}` : ''}` });
  const $range = el('input', {
    type: 'range', id: `dt-set-${key}`, name: key, min: entry.min, max: entry.max, step: entry.step, value,
    onInput: (event) => {
      const next = Number(event.target.value);
      $out.textContent = `${next}${entry.unit ? ` ${entry.unit}` : ''}`;
      settings.set(key, next);
    },
  });

  return [$range, $out];
}

export function createSettingsPanel () {
  const $body = el('div'); // rebuilt wholesale on reset, so it keeps a container

  const NOTES = {
    console: 'the buffer only grows from here on — entries already dropped are gone, and the page-side recorder keeps its own fixed cap, so the history available at mount is whatever that held.',
  };

  const build = () => {
    const values = settings.all();

    // grouped like the data panel, and open by default: there are few enough
    // settings that hiding them behind a tap costs more than it saves
    $body.replaceChildren(...SECTIONS.map(([name, entries]) => el('details', { open: true },
      el('summary', {}, el('span', { textContent: name }), el('small', { textContent: String(entries.length) })),
      el('div', {},
        // dt/dd rather than a <label> per row: the dl is what aligns the two
        // columns, and a control inside dd is still reachable by tapping it
        el('dl', {}, ...entries.flatMap(([key, entry]) => [
          el('dt', {}, el('label', { htmlFor: `dt-set-${key}`, textContent: entry.label ?? key })),
          el('dd', {}, control(key, entry, values[key])),
        ])),
        ...(NOTES[name] ? [el('small', { textContent: NOTES[name] })] : []),
      ),
    )));

    $body.append(el('div', {},
      el('button', { type: 'button', textContent: 'reset to defaults', onClick: () => settings.reset() })));
  };

  build();

  const readout = (key, value) => `${value}${SPEC[key].unit ? ` ${SPEC[key].unit}` : ''}`;

  /*
  a reset rewrites every value at once, so the panel is rebuilt. a single change
  syncs that one control instead — it can come from somewhere else entirely, and
  the resize handle does exactly that: without this the height slider would still
  read whatever it was built with after a drag.
  */
  settings.subscribe((key, value) => {
    if (key === null) return build();

    const $control = $body.querySelector(`[name="${key}"]`);
    if (!$control) return;

    if ($control.type === 'checkbox') $control.checked = value;
    else $control.value = value;

    const $out = $control.parentElement?.querySelector('output');
    if ($out) $out.textContent = readout(key, value);
  });

  return { $content: $body };
}

export default createSettingsPanel;
