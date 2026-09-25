// panels/kit.js
// the controls more than one panel builds

import createElement from '@domina/methods/createElement.js';

/**
 * destructive actions take two taps: the first arms the button and relabels it,
 * the second runs. a stray tap on a phone must not be able to drop a cache.
 */
export function armAction ($btn, label, run) {
  let timer = null;

  const disarm = () => { clearTimeout(timer); timer = null; delete $btn.dataset.armed; $btn.textContent = label; };

  $btn.addEventListener('click', async () => {
    if (!$btn.dataset.armed) {
      $btn.dataset.armed = '1';
      $btn.textContent   = `${label}?`;
      timer = setTimeout(disarm, 4000);
      return;
    }

    disarm();
    $btn.disabled = true;
    try { await run(); } catch (error) { console.warn('[devtools] action failed:', error); }
    $btn.disabled = false;
  });
}

export const button = (label, onClick, { destructive = false } = {}) => {
  const $btn = createElement('button', { type: 'button', textContent: label });
  destructive ? armAction($btn, label, onClick) : $btn.addEventListener('click', onClick);
  return $btn;
};
