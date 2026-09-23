// panels/css.js

// an editable <aufbau-code> writing straight into a <style> in <head>, backed by
// localStorage so the sheet survives reloads. the style node is appended as soon
// as this module evaluates, so stored css paints with the first frame instead of
// waiting for the panel to be opened.

import createElement from '@domina/methods/createElement.js';
import settings      from '../settings.js';

const KEY = 'devtools:css';

// storage is blocked in incognito and behind some privacy settings, a dev panel
// is not worth throwing over
const read  = ()    => { try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; } };
const write = (css) => { try { localStorage.setItem(KEY, css); }        catch {} };

const $liveCss = createElement('style', { id: 'devtools-live-css', textContent: read() });
document.head.append($liveCss);

export function createCssPanel () {
  const $code = createElement('aufbau-code', {
    lang     : 'css',
    theme    : settings.get('codeTheme'),
    editable : '',
    code     : read() || '/* live css */',
    // <aufbau-code> re-emits every edit of its contenteditable as a CustomEvent
    // carrying the current source. the inner node's native input event bubbles up
    // here as well, hence the fallback to the element's own getter.
    onInput  : (event) => {
      const css = event.detail?.code ?? $code.code ?? '';
      $liveCss.textContent = css;
      write(css);
    },
  });

  // aufbau-code observes `theme` and re-adopts the token sheet itself
  settings.subscribe((key, value) => {
    if (key === 'codeTheme' || key === null) $code.setAttribute('theme', settings.get('codeTheme'));
  });

  return { $content: $code };
}

export default createCssPanel;
