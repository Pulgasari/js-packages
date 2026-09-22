/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { h, Fragment }          from 'preact';
import { createHtml, RAW_HTML } from '../index.js';

/*
!html is htx's name for the raw-html escape hatch; preact's own is a prop
holding a wrapper object. only an element gets the translation — a component is
not an element, so it keeps the prop and may forward it to the element it
renders. see RAW_HTML in ../index.js for why the name is ugly.
*/
function hx (type, props, ...children) {
  const raw = props?.[RAW_HTML];

  if (raw != null && typeof type === 'string') {
    delete props[RAW_HTML];
    props.dangerouslySetInnerHTML = { __html: raw };

    // preact renders the markup and drops these on the floor
    if (children.length) console.warn('[htx] !html together with children: preact drops the children');
  }

  // `this` carries htm's staticness bit field. preact ignores it, but an
  // adapter has no business swallowing it
  return h.apply(this, [type, props, ...children]);
}

export const html = createHtml(hx, Fragment);
export * from 'preact';
