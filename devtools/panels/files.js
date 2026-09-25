// panels/files.js

/*
an explorer for the origin private file system: walk the directories, look into
a file, download it, drop files in, delete. nothing is read until the panel is
shown, and a file's content only when it is picked.

files written by @bunker/opfs for values that are not plain bytes start with a
container header. the preview recognises it and shows the json instead of bytes.
*/

import createElement      from '@domina/methods/createElement.js';
import fmt                from '../fmt.js';
import { armAction, button } from './kit.js';

const el = createElement;

const PREVIEW_TEXT  = 64 * 1024;   // more than that is a download, not a preview
const BUNKER_MAGIC  = [0x42, 0x55, 0x4e, 0x4b, 0x45, 0x52, 0x00, 0x01];
const IMAGE         = /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i;
const TEXT          = /\.(css|csv|html?|js|json5?|md|mjs|svg|txt|xml|ya?ml)$/i;

const hasOpfs = typeof navigator.storage?.getDirectory === 'function';

// :::::: READING :::::::::::::::::::::::::::::::::::::::::::::::

async function list (directory) {
  const rows = [];
  for await (const [name, handle] of directory.entries()) {
    if (handle.kind === 'directory') { rows.push({ handle, name, kind: 'directory' }); continue; }
    try {
      const file = await handle.getFile();
      rows.push({ handle, name, kind: 'file', size: file.size, modified: file.lastModified });
    } catch {
      // a file mid-write can refuse to be read, it still exists
      rows.push({ handle, name, kind: 'file', size: NaN, modified: NaN });
    }
  }

  // directories first, then by name
  return rows.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'directory' ? -1 : 1) || a.name.localeCompare(b.name));
}

async function sizeOf (directory) {
  let total = 0;
  for await (const handle of directory.values()) {
    total += handle.kind === 'directory' ? await sizeOf(handle) : await handle.getFile().then(file => file.size, () => 0);
  }
  return total;
}

const startsWith = (bytes, prefix) => prefix.every((byte, index) => bytes[index] === byte);

const looksLikeText = (bytes) => !bytes.slice(0, 512).includes(0);

const hex = (bytes) => [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join(' ');

async function preview (file) {
  const head = new Uint8Array(await file.slice(0, 512).arrayBuffer());

  if (startsWith(head, BUNKER_MAGIC)) {
    const length = new DataView(head.buffer).getUint32(BUNKER_MAGIC.length, true);
    const header = JSON.parse(await file.slice(12, 12 + length).text());
    return el('div', {},
      el('small', { textContent: `@bunker/opfs container · ${fmt.plural(header.parts.length, 'binary part')}` }),
      el('pre', { textContent: JSON.stringify(header.value, null, 2) }),
    );
  }

  if (IMAGE.test(file.name) || file.type.startsWith('image/') || isImage(head)) {
    const url = URL.createObjectURL(file);
    return el('img', { alt: file.name, src: url, onLoad: () => URL.revokeObjectURL(url), onError: () => URL.revokeObjectURL(url) });
  }

  if ((TEXT.test(file.name) || looksLikeText(head)) && file.size <= PREVIEW_TEXT) {
    return el('pre', { textContent: await file.text() });
  }

  return el('div', {},
    el('small', { textContent: `binary · first ${Math.min(64, file.size)} bytes` }),
    el('pre', { textContent: hex(head.slice(0, 64)) }),
  );
}

// the signatures of the formats an app is likely to keep, for files without an extension
function isImage (bytes) {
  return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])                                       // png
      || startsWith(bytes, [0xff, 0xd8, 0xff])                                             // jpeg
      || startsWith(bytes, [0x47, 0x49, 0x46])                                             // gif
      || (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes.slice(8), [0x57, 0x45, 0x42, 0x50]));   // webp
}

function download (file) {
  const url = URL.createObjectURL(file);
  el('a', { download: file.name, href: url }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// :::::: PANEL :::::::::::::::::::::::::::::::::::::::::::::::::

export function createFilesPanel () {
  if (!hasOpfs) return { $content: el('em', { textContent: 'no origin private file system in this browser' }) };

  // the open directory, as the chain of handles from the root down
  let trail = [];

  const $crumbs  = el('nav');
  const $total   = el('small');
  const $body    = el('tbody');
  const $table   = el('table', {},
    el('thead', {}, el('tr', {}, el('th', { textContent: 'name' }), el('th', { textContent: 'size' }), el('th', { textContent: 'modified' }), el('th'))),
    $body,
  );
  const $preview = el('figure', { hidden: true });

  const $upload = el('input', { type: 'file', multiple: true, hidden: true, onChange: () => { upload($upload.files); $upload.value = ''; } });

  const current = () => trail.at(-1);

  async function open (index) {
    trail = trail.slice(0, index + 1);
    $preview.hidden = true;
    await render();
  }

  async function render () {
    const directory = current();

    $crumbs.replaceChildren(...trail.map((handle, index) =>
      el('button', { type: 'button', textContent: index ? handle.name : 'opfs', onClick: () => open(index) })
    ));

    const rows = await list(directory);
    $body.replaceChildren(...rows.map(row));
    if (!rows.length) $body.append(el('tr', {}, el('td', { colSpan: 4 }, el('em', { textContent: 'empty' }))));

    sizeOf(trail[0]).then(total => { $total.textContent = `${fmt.bytes(total)} in the opfs`; });
  }

  function row (entry) {
    const isDirectory = entry.kind === 'directory';

    const $name = el('td', {
      title       : entry.name,
      textContent : isDirectory ? `${entry.name}/` : entry.name,
      dataset     : { kind: entry.kind },
      onClick     : async () => {
        if (isDirectory) { trail.push(entry.handle); $preview.hidden = true; return render(); }
        const file = await entry.handle.getFile();
        $preview.replaceChildren(el('figcaption', { textContent: `${entry.name} · ${fmt.bytes(file.size)}` }), await preview(file));
        $preview.hidden = false;
      },
    });

    const $delete = el('button', { type: 'button', textContent: 'del' });
    armAction($delete, 'del', async () => {
      await current().removeEntry(entry.name, { recursive: true });
      $preview.hidden = true;
      await render();
    });

    return el('tr', {},
      $name,
      el('td', { dataset: { numeric: '' }, textContent: isDirectory ? '' : fmt.bytes(entry.size) }),
      el('td', { textContent: isDirectory ? '' : fmt.ago(entry.modified) }),
      el('td', {},
        isDirectory ? '' : button('get', async () => download(await entry.handle.getFile())),
        $delete,
      ),
    );
  }

  async function upload (files) {
    for (const file of files) {
      const handle   = await current().getFileHandle(file.name, { create: true });
      const writable = await handle.createWritable();
      await writable.write(file);
      await writable.close();
    }
    await render();
  }

  async function makeDirectory () {
    const name = prompt('new directory');
    if (!name) return;
    await current().getDirectoryHandle(name, { create: true });
    await render();
  }

  const $header = el('header', {}, $crumbs, $total,
    button('up', () => trail.length > 1 && open(trail.length - 2)),
    button('mkdir', makeDirectory),
    button('upload', () => $upload.click()),
    button('refresh', () => render()),
  );

  const $content = el('div', {
    onDragOver : (event) => { event.preventDefault(); },
    onDrop     : (event) => { event.preventDefault(); upload(event.dataTransfer.files); },
  }, $header, $table, $preview, $upload);

  const onShow = async () => {
    if (!trail.length) trail = [await navigator.storage.getDirectory()];
    render().catch(error => console.warn('[devtools] opfs listing failed:', error));
  };

  return { $content, onShow };
}

export default createFilesPanel;
