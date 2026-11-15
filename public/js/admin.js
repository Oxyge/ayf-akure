const API = '/api/admin';
const IS_OWNER = document.body.dataset.owner === '1';
const MY_PERMS = (document.body.dataset.perms || '').split(',').filter(Boolean);
const can = k => IS_OWNER || MY_PERMS.includes(k);

function toast(msg) {
  let el = document.querySelector('.admin-toast');
  if (!el) { el = document.createElement('div'); el.className = 'admin-toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2200);
}

async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (res.status === 401) { window.location.href = '/admin/login'; return null; }
  if (!res.ok) {
    let msg = 'Something went wrong.';
    try { const j = await res.clone().json(); if (j && j.error) msg = j.error; } catch (e) { /* keep default */ }
    toast(msg); throw new Error(msg);
  }
  return res.json();
}


// -------------------------------------------------------------------------
// Small helpers
// -------------------------------------------------------------------------
function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const AV_COLORS = ['#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b', '#ec4899', '#22c55e', '#ef4444', '#06b6d4'];
function avatar(name) {
  const n = String(name || '?').replace(/^(the|ven\.?|revd\.?|rev\.?|dr\.?|mr\.?|mrs\.?|prof\.?|hon\.?|engr\.?)\s+/i, '').trim() || '?';
  let h = 0; for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const parts = n.split(/\s+/);
  const ini = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  return `<div class="av" style="background:${AV_COLORS[h % AV_COLORS.length]}">${esc(ini)}</div>`;
}

const PEOPLE_KEYS = ['leaders', 'executives', 'patrons', 'pastPresidents'];
function thumbFor(key, item, titleField) {
  const url = item.photo_url || item.image_url || item.cover_image_url || item.thumbnail_url;
  if (url) return `<div class="av av-img" style="background-image:url('${esc(url)}')"></div>`;
  if (PEOPLE_KEYS.includes(key)) return avatar(item[titleField]);
  return `<div class="av av-doc"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg></div>`;
}
const SVG_NS_ICON = {
  news: '<path d="M4 5h13a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2z"/><path d="M8 9h7M8 13h7"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>'
};
const ico = n => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${SVG_NS_ICON[n]}</svg>`;

const PAGE_META = {
  overview: ['', 'Here is what is happening on the AYF Akure website.'],
  articles: ['Articles & Preaching', 'Longer reads and sermons shown under News.'],
  pages: ['Custom pages', 'Build any new page you like and choose whether it appears in the menu.'],
  media: ['Media library', 'Every picture you have uploaded. Drop new ones in to add them.'],
  settings: ['Site settings', 'Contact details, statements, donation accounts and social links.'],
  slides: ['Homepage slider', 'The large rotating banners at the top of the homepage.'],
  news: ['News', 'Articles shown on the homepage and the News page.'],
  programmes: ['Programmes', 'Upcoming events and fellowship activities.'],
  leaders: ['Fathers in God', 'Diocesan leaders and the quotes shown on the homepage.'],
  executives: ['Diocesan executives', 'The current Executive Council.'],
  patrons: ['Patrons & Patroness', 'Patrons and Patroness of the fellowship.'],
  pastPresidents: ['Past presidents', 'Those who led the fellowship before.'],
  magazines: ['Magazine', 'Issues of the AYF magazine.'],
  newsletters: ['Newsletter', 'Issues of the newsletter.'],
  archdeaconries: ['Archdeaconries', 'Archdeaconries and their youth leadership.'],
  gallery: ['Gallery', 'Photos shown in the media gallery.'],
  videos: ['Videos', 'Videos played on the homepage and Media page.'],
  publications: ['Publications', 'Documents people can read or download.'],
  messages: ['Messages', 'Messages sent through the website contact form.'],
  users: ['Users & access', 'Add people who can sign in, and choose exactly which sections each one may manage.']
};

// -------------------------------------------------------------------------
// Pop-ups, picture picker and Media Library (the WordPress-style bits)
// -------------------------------------------------------------------------
const h = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

function closeModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
  document.body.classList.remove('modal-open');
}
function showModal(ov, opts = {}) {
  if (!opts.stack) closeModals();
  document.body.appendChild(ov);
  document.body.classList.add('modal-open');
  const isTop = () => [...document.querySelectorAll('.modal-overlay')].pop() === ov;
  const close = () => {
    ov.remove();
    document.removeEventListener('keydown', onKey);
    if (!document.querySelector('.modal-overlay')) document.body.classList.remove('modal-open');
    if (opts.onClose) opts.onClose();
  };
  const onKey = e => { if (e.key === 'Escape' && isTop()) close(); };
  document.addEventListener('keydown', onKey);
  ov.addEventListener('mousedown', e => { if (e.target === ov && isTop()) close(); });
  ov.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
  return close;
}

// Pictures are shrunk in the browser before uploading, so big phone photos upload quickly
// and load fast for visitors. Transparent PNGs stay PNG; everything else becomes a light JPEG.
async function prepareImage(file) {
  if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const MAX = 1800, scale = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 600 * 1024) return file;
    const w = Math.round(bmp.width * scale), hgt = Math.round(bmp.height * scale);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = hgt;
    cv.getContext('2d').drawImage(bmp, 0, 0, w, hgt);
    let type = 'image/jpeg';
    if (file.type === 'image/png') {
      const s = document.createElement('canvas'); s.width = s.height = 48;
      const sc = s.getContext('2d'); sc.drawImage(cv, 0, 0, 48, 48);
      const d = sc.getImageData(0, 0, 48, 48).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] < 250) { type = 'image/png'; break; }
    }
    const blob = await new Promise(r => cv.toBlob(r, type, 0.86));
    if (!blob || (scale === 1 && blob.size >= file.size)) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + (type === 'image/png' ? '.png' : '.jpg'), { type });
  } catch (e) { return file; }
}

let mediaCache = null;
async function uploadFile(file) {
  const f = await prepareImage(file);
  const fd = new FormData();
  fd.append('file', f);
  const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
  if (res.status === 401) { window.location.href = '/admin/login'; throw new Error('login'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) { toast(data.error || 'That file could not be uploaded.'); throw new Error('upload failed'); }
  mediaCache = null;
  return data.url;
}
async function loadMedia(force) {
  if (force || !mediaCache) mediaCache = await api('/media');
  return mediaCache;
}
function chooseFile(accept, multiple, cb) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = accept; inp.multiple = !!multiple;
  inp.addEventListener('change', () => { if (inp.files.length) cb([...inp.files]); });
  inp.click();
}
async function uploadMany(files, onStep) {
  const urls = [];
  for (let i = 0; i < files.length; i++) {
    if (onStep) onStep(i + 1, files.length);
    try { urls.push(await uploadFile(files[i])); } catch (e) { /* a message was already shown */ }
  }
  return urls;
}

const DROP_ICON = '<svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>';
function dropzoneHtml(multiple, compact) {
  return `<label class="dropzone${compact ? ' compact' : ''}" tabindex="0">
    ${DROP_ICON}
    <strong>${multiple ? 'Drop your pictures here' : 'Drop a picture here'}</strong>
    <span>or click to choose ${multiple ? 'them' : 'one'} from your computer or phone</span>
    <input type="file" accept="image/*" ${multiple ? 'multiple' : ''} hidden>
  </label>`;
}
function wireDropzone(zone, onFiles) {
  const inp = zone.querySelector('input[type=file]');
  inp.addEventListener('change', () => { if (inp.files.length) onFiles([...inp.files]); inp.value = ''; });
  zone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } });
  ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('over'); }));
  zone.addEventListener('drop', e => {
    const files = [...e.dataTransfer.files].filter(f => /^image\//.test(f.type));
    if (files.length) onFiles(files); else toast('Please drop picture files (JPG, PNG, GIF, WEBP).');
  });
}

function tileHtml(m, opts = {}) {
  const sel = opts.selected && opts.selected.includes(m.url);
  const badge = m.source === 'upload' ? (m.inUse ? '<span class="tag use">In use</span>' : '<span class="tag">Uploaded</span>') : '<span class="tag site">On your site</span>';
  const del = m.source === 'upload' ? `data-del="${esc(m.name)}" data-inuse="${m.inUse ? 1 : 0}"` : '';
  return `<div class="tile${sel ? ' selected' : ''}" data-url="${esc(m.url)}" role="button" tabindex="0" aria-label="${esc(m.name)}">
    <img src="${esc(m.url)}" alt="" loading="lazy">
    ${badge}<span class="check" aria-hidden="true">&#10003;</span>
    <div class="tile-name">${esc(m.name)}</div>
    ${opts.actions
      ? `<div class="tile-actions"><button type="button" data-copy="${esc(m.url)}">Copy link</button>${del ? `<button type="button" class="danger" ${del}>Delete</button>` : ''}</div>`
      : (del ? `<button type="button" class="tile-x" ${del} aria-label="Delete this picture" title="Delete this picture">&times;</button>` : '')}
  </div>`;
}
async function deleteMedia(name, inUse) {
  const msg = String(inUse) === '1'
    ? 'This picture is used on your website. If you delete it, that spot will go blank.\n\nDelete it anyway?'
    : 'Delete this picture from your library?';
  if (!confirm(msg)) return false;
  await api('/media/' + encodeURIComponent(name), { method: 'DELETE' });
  mediaCache = null;
  toast('Picture deleted.');
  return true;
}

// The picture picker (opens from every "Choose picture" button).
function openMedia({ multiple = false, onPick }) {
  const ov = h(`<div class="modal-overlay"><div class="modal glass media-dialog" role="dialog" aria-modal="true" aria-label="Choose a picture">
    <div class="modal-head"><h3>${multiple ? 'Choose pictures' : 'Choose a picture'}</h3><button type="button" class="modal-x" data-close aria-label="Close">&times;</button></div>
    <div class="m-tabs"><button type="button" data-t="up" class="on">Upload new</button><button type="button" data-t="lib">Media library</button></div>
    <div class="modal-body">
      <div id="mt-up">${dropzoneHtml(multiple)}<div class="up-status" id="up-status"></div></div>
      <div id="mt-lib" hidden>
        <input type="search" id="m-search" placeholder="Search pictures by name&hellip;">
        <div class="media-grid" id="m-grid"></div>
        <div class="more-wrap"><button type="button" class="pill-btn" id="m-more" hidden>Show more</button></div>
      </div>
    </div>
    <div class="modal-foot"><span class="sel-info" id="sel-info"></span><button type="button" class="btn btn-dark-outline" data-close>Cancel</button><button type="button" class="btn btn-solid" id="m-use" disabled>${multiple ? 'Use pictures' : 'Use this picture'}</button></div>
  </div></div>`);
  const close = showModal(ov, { stack: true });
  let sel = [], shown = 60, items = [];
  const $ = s => ov.querySelector(s);
  function finish() { const out = multiple ? sel.slice() : sel[0]; close(); if (out && onPick) onPick(out); }
  function paint() {
    const q = $('#m-search').value.trim().toLowerCase();
    const list = items.filter(m => !q || m.name.toLowerCase().includes(q));
    $('#m-grid').innerHTML = list.slice(0, shown).map(m => tileHtml(m, { selected: sel })).join('') || '<div class="empty-state">No pictures found.</div>';
    $('#m-more').hidden = list.length <= shown;
    $('#sel-info').textContent = sel.length ? (sel.length === 1 ? '1 picture selected' : sel.length + ' pictures selected') : '';
    $('#m-use').disabled = !sel.length;
  }
  async function showLibrary(force) {
    ov.querySelectorAll('.m-tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === 'lib'));
    $('#mt-up').hidden = true; $('#mt-lib').hidden = false;
    $('#m-grid').innerHTML = '<div class="empty-state">Loading&hellip;</div>';
    const m = await loadMedia(force);
    items = [...m.uploads.filter(x => x.kind === 'image'), ...m.site];
    paint();
  }
  ov.querySelectorAll('.m-tabs button').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.t === 'lib') showLibrary(false);
    else { ov.querySelectorAll('.m-tabs button').forEach(x => x.classList.toggle('on', x === b)); $('#mt-up').hidden = false; $('#mt-lib').hidden = true; }
  }));
  wireDropzone($('.dropzone'), async files => {
    const urls = await uploadMany(files, (i, n) => { $('#up-status').textContent = `Uploading ${i} of ${n}…`; });
    $('#up-status').textContent = '';
    if (!urls.length) return;
    if (!multiple) { sel = [urls[0]]; finish(); return; }
    await showLibrary(true); sel = urls; paint();
  });
  $('#m-search').addEventListener('input', () => { shown = 60; paint(); });
  $('#m-more').addEventListener('click', () => { shown += 60; paint(); });
  $('#m-use').addEventListener('click', finish);
  const grid = $('#m-grid');
  grid.addEventListener('click', async e => {
    const del = e.target.closest('[data-del]');
    if (del) { e.stopPropagation(); if (await deleteMedia(del.dataset.del, del.dataset.inuse)) showLibrary(true); return; }
    const t = e.target.closest('.tile'); if (!t) return;
    const url = t.dataset.url;
    if (multiple) sel = sel.includes(url) ? sel.filter(u => u !== url) : [...sel, url]; else sel = [url];
    paint();
  });
  grid.addEventListener('dblclick', e => { const t = e.target.closest('.tile'); if (t && !multiple && !e.target.closest('[data-del]')) { sel = [t.dataset.url]; finish(); } });
  grid.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('tile')) { e.preventDefault(); e.target.click(); } });
}

// A picture (or PDF) field: preview, "Choose" and "Remove" buttons, value kept in a hidden input.
function imgField(attr, key, value, kind = 'image') {
  const v = value == null ? '' : value;
  return `<div class="imgfield" data-kind="${kind}">
    <div class="imgfield-preview"></div>
    <div class="imgfield-side">
      <div class="imgfield-name"></div>
      <div class="imgfield-actions"><button type="button" class="pill-btn sm primary" data-pick></button><button type="button" class="pill-btn sm" data-clear>Remove</button></div>
    </div>
    <input type="hidden" ${attr}="${key}" value="${esc(v)}">
  </div>`;
}
function refreshImgFields(root) {
  (root || document).querySelectorAll('.imgfield').forEach(f => {
    const v = f.querySelector('input[type=hidden]').value, kind = f.dataset.kind;
    f.querySelector('.imgfield-preview').innerHTML = !v ? `<span class="imgfield-empty">${kind === 'file' ? 'No file' : 'No picture'}</span>` : kind === 'file' ? '<span class="imgfield-file">PDF</span>' : `<img src="${esc(v)}" alt="">`;
    let nm = ''; if (v) { nm = v.split('?')[0].split('/').pop(); try { nm = decodeURIComponent(nm); } catch (e) { /* keep as is */ } }
    f.querySelector('.imgfield-name').textContent = nm.length > 44 ? nm.slice(0, 41) + '…' : nm;
    f.querySelector('[data-pick]').textContent = v ? 'Change' : (kind === 'file' ? 'Choose PDF' : 'Choose picture');
    f.querySelector('[data-clear]').hidden = !v;
  });
}
document.addEventListener('click', e => {
  const pick = e.target.closest('.imgfield [data-pick]');
  if (pick) {
    const f = pick.closest('.imgfield'), inp = f.querySelector('input[type=hidden]'), root = f.parentElement;
    if (f.dataset.kind === 'file') {
      chooseFile('.pdf', false, async ([file]) => { toast('Uploading…'); try { inp.value = await uploadFile(file); refreshImgFields(root); toast('Uploaded.'); } catch (err) { /* shown */ } });
    } else openMedia({ onPick: url => { inp.value = url; refreshImgFields(root); } });
    return;
  }
  const clr = e.target.closest('.imgfield [data-clear]');
  if (clr) { const f = clr.closest('.imgfield'); f.querySelector('input[type=hidden]').value = ''; refreshImgFields(f.parentElement); return; }
  const multi = e.target.closest('[data-pick-multi]');
  if (multi) {
    const ta = multi.closest('.block-body').querySelector('textarea[data-bk="text"]');
    openMedia({ multiple: true, onPick: urls => { ta.value = [ta.value.trim(), ...urls].filter(Boolean).join('\n'); } });
  }
});

// -------------------------------------------------------------------------
// Generic CRUD panel factory
// -------------------------------------------------------------------------
const ENTITIES = {
  news: {
    label: 'News', single: 'News story', endpoint: 'news', titleField: 'title', metaField: 'category',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['News', 'Diocese', 'Communion', 'Message', 'Announcement', 'Events', 'Preaching', 'Notice'] },
      { key: 'excerpt', label: 'Short Excerpt', type: 'textarea' },
      { key: 'body', label: 'Full Story', type: 'textarea', tall: true, hint: 'Leave a blank line between paragraphs.' },
      { key: 'image_url', label: 'Image', type: 'image' },
      { key: 'published_at', label: 'Published Date', type: 'date' }
    ]
  },
  articles: {
    label: 'Articles & Preaching', single: 'Article', endpoint: 'articles', titleField: 'title', metaField: 'author',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'author', label: 'Author', type: 'text' },
      { key: 'body', label: 'Full Text', type: 'textarea', tall: true, hint: 'Leave a blank line between paragraphs.' },
      { key: 'image_url', label: 'Image', type: 'image' },
      { key: 'published_at', label: 'Published Date', type: 'date' }
    ]
  },
  programmes: {
    label: 'Programmes', single: 'Programme', endpoint: 'programmes', titleField: 'title', metaField: 'venue',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'event_date', label: 'Date', type: 'date' },
      { key: 'event_time', label: 'Time', type: 'text', placeholder: 'e.g. 10:00 AM' },
      { key: 'venue', label: 'Venue', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'image_url', label: 'Image', type: 'image' }
    ]
  },
  leaders: {
    label: 'Leadership', single: 'Leader', endpoint: 'leaders', titleField: 'name', metaField: 'role',
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'role', label: 'Position / Role', type: 'text' },
      { key: 'bio', label: 'Short Biography', type: 'textarea' },
      { key: 'quote', label: 'Quote (shown in the homepage quote band)', type: 'textarea' },
      { key: 'photo_url', label: 'Photograph', type: 'image' },
      { key: 'sort_order', label: 'Display Order', type: 'number' }
    ]
  },
  archdeaconries: {
    label: 'Archdeaconries', single: 'Archdeaconry', endpoint: 'archdeaconries', titleField: 'name', metaField: 'location',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'leadership', label: 'Leadership', type: 'textarea' },
      { key: 'contact', label: 'Contact', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'image_url', label: 'Photo / Logo', type: 'image' }
    ]
  },
  executives: {
    label: 'Diocesan Executives', single: 'Executive', endpoint: 'executives', titleField: 'name', metaField: 'role',
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'role', label: 'Position', type: 'text', required: true },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'photo_url', label: 'Photograph', type: 'image' },
      { key: 'sort_order', label: 'Display Order', type: 'number' }
    ]
  },
  patrons: {
    label: 'Patrons & Patroness', single: 'Patron or Patroness', endpoint: 'patrons', titleField: 'name', metaField: 'role',
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'select', options: ['Patron', 'Patroness'] },
      { key: 'photo_url', label: 'Photograph', type: 'image' },
      { key: 'sort_order', label: 'Display Order', type: 'number' }
    ]
  },
  pastPresidents: {
    label: 'Past Presidents', single: 'Past president', endpoint: 'pastPresidents', titleField: 'name', metaField: 'tenure',
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'tenure', label: 'Tenure / Role', type: 'text' },
      { key: 'photo_url', label: 'Photograph', type: 'image' },
      { key: 'sort_order', label: 'Display Order', type: 'number' }
    ]
  },
  magazines: {
    label: 'Magazine', single: 'Magazine issue', endpoint: 'magazines', titleField: 'title', metaField: 'issue_date',
    fields: [
      { key: 'title', label: 'Issue Title', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'cover_image_url', label: 'Cover Image', type: 'image' },
      { key: 'file_url', label: 'PDF File', type: 'file' },
      { key: 'issue_date', label: 'Issue Date', type: 'date' }
    ]
  },
  newsletters: {
    label: 'Newsletter', single: 'Newsletter issue', endpoint: 'newsletters', titleField: 'title', metaField: 'issue_date',
    fields: [
      { key: 'title', label: 'Issue Title', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'cover_image_url', label: 'Cover Image', type: 'image' },
      { key: 'file_url', label: 'PDF File', type: 'file' },
      { key: 'issue_date', label: 'Issue Date', type: 'date' }
    ]
  },
  gallery: {
    label: 'Gallery', single: 'Photo', endpoint: 'gallery', titleField: 'title', metaField: 'category',
    fields: [
      { key: 'title', label: 'Caption', type: 'text' },
      { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Youth Camp' },
      { key: 'image_url', label: 'Image', type: 'image', required: true }
    ]
  },
  videos: {
    label: 'Videos', single: 'Video', endpoint: 'videos', titleField: 'title', metaField: 'video_url',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'video_url', label: 'Video URL (YouTube or file link)', type: 'text', required: true },
      { key: 'thumbnail_url', label: 'Thumbnail', type: 'image' },
      { key: 'published_at', label: 'Published Date', type: 'date' }
    ]
  },
  publications: {
    label: 'Publications', single: 'Publication', endpoint: 'publications', titleField: 'title', metaField: 'published_at',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'file_url', label: 'PDF File', type: 'file' },
      { key: 'published_at', label: 'Published Date', type: 'date' }
    ]
  },
  slides: {
    label: 'Homepage Slider', single: 'Slide', endpoint: 'slides', titleField: 'heading', metaField: 'eyebrow',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow Label', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text', required: true },
      { key: 'body', label: 'Supporting Text', type: 'textarea' },
      { key: 'button_label', label: 'Button Label', type: 'text' },
      { key: 'button_link', label: 'Button Link', type: 'text', placeholder: '/about' },
      { key: 'image_url', label: 'Background Image', type: 'image' },
      { key: 'sort_order', label: 'Display Order', type: 'number' }
    ]
  }
};

function fieldInput(field, value = '') {
  const v = value == null ? '' : value;
  const k = esc(field.key);
  if (field.type === 'textarea') return `<textarea data-key="${k}" class="${field.tall ? 'tall' : ''}">${esc(v)}</textarea>`;
  if (field.type === 'select') return `<select data-key="${k}">${field.options.map(o => `<option value="${esc(o)}" ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  if (field.type === 'date') return `<input data-key="${k}" type="date" value="${esc(v)}">`;
  if (field.type === 'number') return `<input data-key="${k}" type="number" value="${esc(v)}">`;
  if (field.type === 'image' || field.type === 'file') return imgField('data-key', field.key, v, field.type === 'file' ? 'file' : 'image');
  return `<input data-key="${k}" type="text" value="${esc(v)}" placeholder="${esc(field.placeholder || '')}">`;
}

// The "Add new" / "Edit" pop-up used by every list.
function openEditor(key, item) {
  const cfg = ENTITIES[key];
  const what = cfg.single || cfg.label;
  const ov = h(`<div class="modal-overlay"><div class="modal glass editor-dialog" role="dialog" aria-modal="true" aria-label="${item ? 'Edit' : 'Add'} ${esc(what)}">
    <div class="modal-head"><h3>${item ? 'Edit' : 'Add new'}: ${esc(what)}</h3><button type="button" class="modal-x" data-close aria-label="Close">&times;</button></div>
    <div class="modal-body"><div class="admin-form-grid" id="ed-form">
      ${cfg.fields.map(f => `<div><label>${esc(f.label)}${f.required ? ' <i class="req" title="Required">*</i>' : ''}</label>${fieldInput(f, item ? item[f.key] : '')}${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}</div>`).join('')}
    </div></div>
    <div class="modal-foot"><button type="button" class="btn btn-dark-outline" data-close>Cancel</button><button type="button" class="btn btn-solid" id="ed-save">${item ? 'Save changes' : 'Add it'}</button></div>
  </div></div>`);
  const close = showModal(ov);
  const form = ov.querySelector('#ed-form');
  refreshImgFields(form);
  if (!item) {   // new items start with today's date, so they appear at the top
    const today = new Date().toISOString().slice(0, 10);
    form.querySelectorAll('input[type=date][data-key="published_at"],input[type=date][data-key="issue_date"]').forEach(d => { if (!d.value) d.value = today; });
  }
  const first = form.querySelector('input:not([type=hidden]),textarea,select'); if (first) first.focus();
  ov.querySelector('#ed-save').addEventListener('click', async () => {
    const data = {};
    cfg.fields.forEach(f => { const el = form.querySelector(`[data-key="${f.key}"]`); if (el) data[f.key] = el.value; });
    for (const f of cfg.fields.filter(x => x.required)) {
      if (!data[f.key]) { toast(`Please fill in: ${f.label}`); const el = form.querySelector(`[data-key="${f.key}"]`); if (el && el.type !== 'hidden') el.focus(); return; }
    }
    if (data.sort_order === '') delete data.sort_order;
    const btn = ov.querySelector('#ed-save'); btn.disabled = true;
    try {
      if (item) { await api(`/${cfg.endpoint}/${item.id}`, { method: 'PUT', body: data }); toast('Saved.'); }
      else { await api(`/${cfg.endpoint}`, { method: 'POST', body: data }); toast('Added. It is now on your website.'); }
      close();
      loadEntityList(key);
    } catch (e) { btn.disabled = false; }
  });
}

function buildEntityPanel(key) {
  const cfg = ENTITIES[key];
  const panel = document.getElementById(`panel-${key}`);
  panel.innerHTML = `
    <div class="list-top">
      <div class="list-title"><strong>${esc((PAGE_META[key] || [cfg.label])[0] || cfg.label)}</strong><span class="count" id="${key}-count"></span></div>
      <div class="grow"></div>
      ${key === 'gallery' ? '<button type="button" class="pill-btn" id="gallery-bulk">Upload many photos</button>' : ''}
      <button type="button" class="btn btn-solid" id="${key}-add">+ Add new</button>
    </div>
    <div class="order-hint">Drag the grip on the left of a row to put it where you want it &mdash; the website follows this order. Click a row to edit it.</div>
    <div class="admin-list full" id="${key}-list"></div>`;
  document.getElementById(`${key}-add`).addEventListener('click', () => openEditor(key, null));
  if (key === 'gallery') {
    document.getElementById('gallery-bulk').addEventListener('click', () => chooseFile('image/*', true, async files => {
      const urls = await uploadMany(files, (i, n) => toast(`Uploading ${i} of ${n}…`));
      for (const url of urls) await api('/gallery', { method: 'POST', body: { title: '', category: '', image_url: url } });
      if (urls.length) toast(`${urls.length} photo${urls.length > 1 ? 's' : ''} added to the gallery.`);
      loadEntityList('gallery');
    }));
  }
  const list = document.getElementById(`${key}-list`);
  makeSortable(list, '.admin-list-item', async () => {
    const ids = [...list.querySelectorAll('.admin-list-item')].map(el => el.dataset.id);
    await api(`/${cfg.endpoint}/reorder`, { method: 'PUT', body: { ids } });
    toast('Order saved. The website now follows it.');
  });
  list.addEventListener('click', async e => {
    const row = e.target.closest('.admin-list-item'); if (!row) return;
    const item = (list._items || []).find(i => String(i.id) === row.dataset.id);
    if (e.target.closest('[data-delete]')) {
      if (!confirm(`Delete "${item ? item[cfg.titleField] || 'this item' : 'this item'}"? This cannot be undone.`)) return;
      await api(`/${cfg.endpoint}/${row.dataset.id}`, { method: 'DELETE' });
      toast('Deleted.'); loadEntityList(key); return;
    }
    if (e.target.closest('.drag-handle') || e.target.closest('a')) return;
    if (item) openEditor(key, item);
  });
  loadEntityList(key);
}

async function loadEntityList(key) {
  const cfg = ENTITIES[key];
  const list = document.getElementById(`${key}-list`);
  const items = (await api(`/${cfg.endpoint}`)) || [];
  list._items = items;
  const count = document.getElementById(`${key}-count`); if (count) count.textContent = items.length;
  if (!items.length) { list.innerHTML = '<div class="empty-state">Nothing here yet. Click <strong>+ Add new</strong> to add the first one.</div>'; return; }
  list.innerHTML = items.map(item => `
    <div class="admin-list-item clickable" data-id="${item.id}">
      <button type="button" class="drag-handle" aria-label="Drag to reorder (or use the up and down arrow keys)" title="Drag to reorder">${GRIP}</button>
      ${thumbFor(key, item, cfg.titleField)}
      <div class="grow">
        <div class="title">${esc(item[cfg.titleField] || '(untitled)')}</div>
        <div class="meta">${esc(item[cfg.metaField] || '')}</div>
      </div>
      <div class="admin-item-actions">
        <button type="button" data-edit>Edit</button>
        <button type="button" class="danger" data-delete>Delete</button>
      </div>
    </div>`).join('');
}

// -------------------------------------------------------------------------
// Site settings, grouped into small sections
// -------------------------------------------------------------------------
const SETTINGS_FIELDS = [
  { key: 'site_name', label: 'Organisation Name' },
  { key: 'tagline', label: 'Tagline' },
  { key: 'logo_url', label: 'AYF Logo', type: 'image' },
  { key: 'diocese_crest_url', label: 'Diocese of Akure Crest', type: 'image' },
  { key: 'office_address', label: 'Office Address', type: 'textarea' },
  { key: 'email_1', label: 'Email 1' },
  { key: 'email_2', label: 'Email 2' },
  { key: 'email_3', label: 'Email 3' },
  { key: 'phone_1', label: 'Phone 1' },
  { key: 'phone_2', label: 'Phone 2' },
  { key: 'phone_3', label: 'Phone 3' },
  { key: 'phone_4', label: 'Phone 4' },
  { key: 'vision', label: 'Vision Statement', type: 'textarea' },
  { key: 'mission', label: 'Mission Statement', type: 'textarea' },
  { key: 'purpose', label: 'Purpose Statement', type: 'textarea' },
  { key: 'history_intro', label: 'Homepage History Intro (paragraph 1)', type: 'textarea' },
  { key: 'history_intro_2', label: 'Homepage History Intro (paragraph 2)', type: 'textarea' },
  { key: 'history_photo_url', label: 'Homepage History Photo', type: 'image' },
  { key: 'leader_quote', label: 'Featured Quote (homepage)', type: 'textarea' },
  { key: 'leader_quote_attribution', label: 'Quote Attribution' },
  { key: 'cta_band_heading', label: 'Join CTA — Heading' },
  { key: 'cta_band_body', label: 'Join CTA — Body Text', type: 'textarea' },
  { key: 'cta_band_button_label', label: 'Join CTA — Button Label' },
  { key: 'bishop_name', label: 'Diocesan Bishop — Name' },
  { key: 'bishop_title', label: 'Diocesan Bishop — Title' },
  { key: 'bishop_photo_url', label: 'Diocesan Bishop — Photo', type: 'image' },
  { key: 'donate_verse', label: 'Donation Bible Verse', type: 'textarea' },
  { key: 'donate_verse_ref', label: 'Verse Reference' },
  { key: 'donate_intro', label: 'Donate Page Intro Text', type: 'textarea' },
  { key: 'donate_photo_url', label: 'Donate Page Photo', type: 'image' },
  { key: 'paystack_url', label: 'Paystack Payment Link' },
  { key: 'donate_project_bank', label: 'Project Account \u2014 Bank Name' },
  { key: 'donate_project_account_name', label: 'Project Account \u2014 Account Name' },
  { key: 'donate_project_account_number', label: 'Project Account \u2014 Account Number' },
  { key: 'donate_main_bank', label: 'Main Account \u2014 Bank Name' },
  { key: 'donate_main_account_name', label: 'Main Account \u2014 Account Name' },
  { key: 'donate_main_account_number', label: 'Main Account \u2014 Account Number' },
  { key: 'donate_special_bank', label: 'Special Account \u2014 Bank Name' },
  { key: 'donate_special_account_name', label: 'Special Account \u2014 Account Name' },
  { key: 'donate_special_account_number', label: 'Special Account \u2014 Account Number' },
  { key: 'donate_usd_bank', label: 'USD Account \u2014 Bank Name' },
  { key: 'donate_usd_account_name', label: 'USD Account \u2014 Account Name' },
  { key: 'donate_usd_account_number', label: 'USD Account \u2014 Account Number' },
  { key: 'facebook_url', label: 'Facebook URL' },
  { key: 'instagram_url', label: 'Instagram URL' },
  { key: 'twitter_url', label: 'X / Twitter URL' },
  { key: 'youtube_url', label: 'YouTube URL' },
  { key: 'whatsapp_url', label: 'WhatsApp Link' }
];

const SETTING_GROUPS = [
  { title: 'About the fellowship', open: true, keys: ['site_name', 'tagline', 'logo_url', 'diocese_crest_url'] },
  { title: 'Contact details', keys: ['office_address', 'email_1', 'email_2', 'email_3', 'phone_1', 'phone_2', 'phone_3', 'phone_4'] },
  { title: 'Vision, mission & purpose', keys: ['vision', 'mission', 'purpose'] },
  { title: 'Homepage', keys: ['history_photo_url', 'history_intro', 'history_intro_2', 'leader_quote', 'leader_quote_attribution', 'cta_band_heading', 'cta_band_body', 'cta_band_button_label'] },
  { title: 'Diocesan Bishop', keys: ['bishop_photo_url', 'bishop_name', 'bishop_title'] },
  { title: 'Donate page', keys: ['donate_photo_url', 'donate_verse', 'donate_verse_ref', 'donate_intro', 'paystack_url'] },
  { title: 'Bank accounts', keys: ['donate_project_bank', 'donate_project_account_name', 'donate_project_account_number', 'donate_main_bank', 'donate_main_account_name', 'donate_main_account_number', 'donate_special_bank', 'donate_special_account_name', 'donate_special_account_number', 'donate_usd_bank', 'donate_usd_account_name', 'donate_usd_account_number'] },
  { title: 'Social media links', keys: ['facebook_url', 'instagram_url', 'twitter_url', 'youtube_url', 'whatsapp_url'] }
];

async function buildSettingsPanel() {
  const panel = document.getElementById('panel-settings');
  const settings = await api('/settings');
  const used = new Set(SETTING_GROUPS.flatMap(g => g.keys));
  const groups = [...SETTING_GROUPS];
  const rest = SETTINGS_FIELDS.filter(f => !used.has(f.key)).map(f => f.key);
  if (rest.length) groups.push({ title: 'Other', keys: rest });
  panel.innerHTML = `
    <div id="settings-form" class="settings-wrap">
      ${groups.map(g => `<details class="set-group" ${g.open ? 'open' : ''}><summary>${esc(g.title)}</summary>
        <div class="admin-form-grid">
          ${g.keys.map(k => SETTINGS_FIELDS.find(f => f.key === k)).filter(Boolean).map(f => `<div><label>${esc(f.label)}</label>${
            f.type === 'textarea' ? `<textarea data-key="${f.key}">${esc(settings[f.key] || '')}</textarea>`
            : f.type === 'image' ? imgField('data-key', f.key, settings[f.key] || '')
            : `<input data-key="${f.key}" type="text" value="${esc(settings[f.key] || '')}">`}</div>`).join('')}
        </div></details>`).join('')}
      <div class="savebar"><span>Changes appear on your website as soon as you save.</span><button class="btn btn-solid" id="settings-save">Save changes</button></div>
    </div>`;
  refreshImgFields(panel);
  document.getElementById('settings-save').addEventListener('click', async () => {
    const data = {};
    SETTINGS_FIELDS.forEach(f => { const el = document.querySelector(`#settings-form [data-key="${f.key}"]`); if (el) data[f.key] = el.value; });
    await api('/settings', { method: 'PUT', body: data });
    toast('Saved. Your website is updated.');
  });
}

// Media library page
async function buildMediaPanel() {
  const panel = document.getElementById('panel-media');
  panel.innerHTML = `
    ${dropzoneHtml(true, true)}
    <div class="up-status" id="mp-status"></div>
    <div class="list-top"><div class="list-title"><strong>Your uploads</strong><span class="count" id="mp-count"></span></div></div>
    <div class="media-grid page" id="mp-up"></div>
    <details class="set-group"><summary>Pictures already on your website <span class="count" id="mp-site-count"></span></summary><div class="media-grid page" id="mp-site"></div></details>`;
  const paint = async force => {
    const m = await loadMedia(force);
    document.getElementById('mp-count').textContent = m.uploads.length;
    document.getElementById('mp-up').innerHTML = m.uploads.length ? m.uploads.map(x => tileHtml(x, { actions: true })).join('') : '<div class="empty-state">No uploads yet. Drop pictures above to add the first one.</div>';
    document.getElementById('mp-site-count').textContent = m.site.length;
    document.getElementById('mp-site').innerHTML = m.site.slice(0, 120).map(x => tileHtml(x, { actions: true })).join('');
  };
  wireDropzone(panel.querySelector('.dropzone'), async files => {
    const urls = await uploadMany(files, (i, n) => { document.getElementById('mp-status').textContent = `Uploading ${i} of ${n}…`; });
    document.getElementById('mp-status').textContent = '';
    if (urls.length) toast(`${urls.length} picture${urls.length > 1 ? 's' : ''} uploaded.`);
    paint(true);
  });
  panel.addEventListener('click', async e => {
    const cp = e.target.closest('[data-copy]');
    if (cp) { try { await navigator.clipboard.writeText(location.origin + cp.dataset.copy); toast('Link copied.'); } catch (err) { toast(location.origin + cp.dataset.copy); } return; }
    const del = e.target.closest('[data-del]');
    if (del && await deleteMedia(del.dataset.del, del.dataset.inuse)) paint(true);
  });
  paint(true);
}

async function buildMessagesPanel() {
  const panel = document.getElementById('panel-messages');
  panel.innerHTML = `<div class="admin-list" id="messages-list" style="max-width:860px;"></div>`;
  const list = document.getElementById('messages-list');
  const items = await api('/messages');
  setMsgBadge(items);
  if (!items || !items.length) { list.innerHTML = '<div class="empty-state">No messages yet.</div>'; return; }
  list.innerHTML = items.map(m => `
    <div class="admin-list-item" style="align-items:flex-start;">
      ${avatar(m.full_name)}
      <div class="grow">
        <div class="title">${esc(m.full_name)} <span style="font-weight:400;color:var(--t3);">&middot; ${esc(m.subject || 'No subject')}</span> ${m.is_read ? '' : '<span class="tag new">New</span>'}</div>
        <div class="meta">${esc(m.email)}${m.phone ? ' &middot; ' + esc(m.phone) : ''} &middot; ${esc(new Date(m.created_at).toLocaleString())}</div>
        <div class="msg">${esc(m.message)}</div>
      </div>
      <div class="admin-item-actions">
        ${m.is_read ? '' : `<button data-read="${m.id}">Mark read</button>`}
        <button class="danger" data-delmsg="${m.id}">Delete</button>
      </div>
    </div>
  `).join('');
  list.querySelectorAll('[data-read]').forEach(btn => btn.addEventListener('click', async () => {
    await api(`/messages/${btn.dataset.read}/read`, { method: 'PUT' });
    buildMessagesPanel(); refreshOverview();
  }));
  list.querySelectorAll('[data-delmsg]').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Delete this message?')) return;
    await api(`/messages/${btn.dataset.delmsg}`, { method: 'DELETE' });
    buildMessagesPanel(); refreshOverview();
  }));
}

function setMsgBadge(items) {
  const n = (items || []).filter(m => !m.is_read).length;
  const b = document.getElementById('nav-msg-badge');
  if (b) { b.textContent = n; b.hidden = n === 0; }
}


// -------------------------------------------------------------------------
// Drag-and-drop sorting (mouse, touch and keyboard arrows)
// -------------------------------------------------------------------------
const GRIP = '<svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true"><circle cx="7" cy="4" r="1.6"/><circle cx="13" cy="4" r="1.6"/><circle cx="7" cy="10" r="1.6"/><circle cx="13" cy="10" r="1.6"/><circle cx="7" cy="16" r="1.6"/><circle cx="13" cy="16" r="1.6"/></svg>';

function scrollParent(el) {
  for (let n = el.parentElement; n; n = n.parentElement) {
    const oy = getComputedStyle(n).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 2) return n;
  }
  return document.scrollingElement;
}

function makeSortable(container, itemSel, onDrop) {
  if (!container || container._sortable) return;
  container._sortable = true;
  container.addEventListener('pointerdown', e => {
    const handle = e.target.closest('.drag-handle');
    if (!handle || !container.contains(handle) || (e.button != null && e.button > 0)) return;
    const item = handle.closest(itemSel);
    if (!item) return;
    e.preventDefault();
    startDrag(container, item, e, itemSel, onDrop);
  });
  container.addEventListener('keydown', e => {
    const handle = e.target.closest('.drag-handle');
    if (!handle || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    const item = handle.closest(itemSel);
    const sib = e.key === 'ArrowUp' ? item.previousElementSibling : item.nextElementSibling;
    if (!sib || !sib.matches(itemSel)) return;
    e.preventDefault();
    if (e.key === 'ArrowUp') container.insertBefore(item, sib); else container.insertBefore(sib, item);
    handle.focus();
    clearTimeout(container._kt);
    container._kt = setTimeout(() => onDrop(), 600);
  });
}

function startDrag(container, item, e, itemSel, onDrop) {
  const rect = item.getBoundingClientRect();
  const ph = document.createElement('div');
  ph.className = 'drag-ph';
  ph.style.height = rect.height + 'px';
  item.parentNode.insertBefore(ph, item.nextSibling);
  const offY = e.clientY - rect.top;
  const saved = item.getAttribute('style');
  Object.assign(item.style, { position: 'fixed', left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', zIndex: 2000, margin: 0 });
  item.classList.add('dragging');
  // The glass panels use backdrop-filter, which makes "fixed" relative to the panel
  // instead of the window. Measure the difference once and compensate for it.
  const placed = item.getBoundingClientRect();
  const dx = rect.left - placed.left, dy = rect.top - placed.top;
  item.style.left = (rect.left + dx) + 'px';
  document.body.classList.add('is-dragging');
  const scroller = scrollParent(container);
  let y = e.clientY, raf = 0, moved = false;

  function placeholder() {
    const sibs = [...container.querySelectorAll(':scope > ' + itemSel)].filter(x => x !== item);
    let target = null;
    for (const sb of sibs) { const r = sb.getBoundingClientRect(); if (y < r.top + r.height / 2) { target = sb; break; } }
    if (target ? ph.nextElementSibling !== target : container.lastElementChild !== ph) container.insertBefore(ph, target);
  }
  function frame() {
    item.style.top = (y - offY + dy) + 'px';
    placeholder();
    const box = scroller === document.scrollingElement ? { top: 0, bottom: window.innerHeight } : scroller.getBoundingClientRect();
    if (y < box.top + 70) scroller.scrollTop -= 14; else if (y > box.bottom - 70) scroller.scrollTop += 14;
    raf = requestAnimationFrame(frame);
  }
  function move(ev) { y = ev.clientY; moved = true; }
  function up() {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    cancelAnimationFrame(raf);
    if (saved == null) item.removeAttribute('style'); else item.setAttribute('style', saved);
    item.classList.remove('dragging');
    document.body.classList.remove('is-dragging');
    ph.replaceWith(item);
    if (moved) onDrop();
  }
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  raf = requestAnimationFrame(frame);
}

// -------------------------------------------------------------------------
// Custom pages — a small block builder so anything can be added to the site
// -------------------------------------------------------------------------
const BLOCK_TYPES = [
  { t: 'heading', label: 'Heading' }, { t: 'text', label: 'Text' }, { t: 'list', label: 'List' },
  { t: 'image', label: 'Image' }, { t: 'gallery', label: 'Photo gallery' }, { t: 'video', label: 'Video' },
  { t: 'quote', label: 'Quote' }, { t: 'button', label: 'Button' }, { t: 'divider', label: 'Divider line' }
];
const uid = () => Math.random().toString(36).slice(2, 9);
let pg = { id: null, blocks: [] };

function blockFields(b) {
  const i = (k, label, ph = '') => `<div><label>${label}</label><input type="text" data-bk="${k}" value="${esc(b[k])}" placeholder="${esc(ph)}"></div>`;
  const ta = (k, label, ph = '') => `<div><label>${label}</label><textarea data-bk="${k}" placeholder="${esc(ph)}">${esc(b[k])}</textarea></div>`;
  const pic = (k, label) => `<div><label>${label}</label>${imgField('data-bk', k, b[k])}</div>`;
  switch (b.type) {
    case 'heading': return i('text', 'Heading text') + `<div><label>Size</label><select data-bk="level"><option value="h2" ${b.level !== 'h3' ? 'selected' : ''}>Large heading</option><option value="h3" ${b.level === 'h3' ? 'selected' : ''}>Smaller heading</option></select></div>`;
    case 'text': return ta('text', 'Text (leave a blank line between paragraphs)');
    case 'list': return ta('text', 'One item per line') + `<label class="chk"><input type="checkbox" data-bk="ordered" ${b.ordered ? 'checked' : ''}> Number the items</label>`;
    case 'image': return pic('url', 'Picture') + i('caption', 'Caption (optional)');
    case 'gallery': return `<div><label>Pictures</label><button type="button" class="pill-btn sm primary" data-pick-multi>+ Add pictures</button></div>` + ta('text', 'Picture links (one per line — you can also reorder or delete them here)');
    case 'video': return i('url', 'YouTube link or video file link', 'https://www.youtube.com/watch?v=...');
    case 'quote': return ta('text', 'Quote') + i('author', 'Who said it (optional)');
    case 'button': return i('label', 'Button text', 'e.g. Register now') + i('url', 'Where it goes', 'https://… or /contact');
    case 'divider': return '<div class="muted-note">A thin line to separate sections.</div>';
    default: return '';
  }
}

function renderBlocks() {
  const wrap = document.getElementById('pg-blocks');
  if (!pg.blocks.length) { wrap.innerHTML = '<div class="empty-state">No content yet. Use the buttons below to add a heading, text, picture, video and more.</div>'; return; }
  wrap.innerHTML = pg.blocks.map(b => `
    <div class="block-item" data-uid="${b._uid}">
      <div class="block-head">
        <button type="button" class="drag-handle" aria-label="Drag to reorder" title="Drag to reorder">${GRIP}</button>
        <strong>${esc((BLOCK_TYPES.find(x => x.t === b.type) || {}).label || b.type)}</strong>
        <button type="button" class="block-del" data-del="${b._uid}" aria-label="Remove block">Remove</button>
      </div>
      <div class="block-body">${blockFields(b)}</div>
    </div>`).join('');
  refreshImgFields(wrap);
}

function syncBlocksFromDom() {
  document.querySelectorAll('#pg-blocks .block-item').forEach(el => {
    const b = pg.blocks.find(x => x._uid === el.dataset.uid);
    if (!b) return;
    el.querySelectorAll('[data-bk]').forEach(inp => { b[inp.dataset.bk] = inp.type === 'checkbox' ? inp.checked : inp.value; });
  });
}

function resetPageEditor() {
  pg = { id: null, blocks: [] };
  ['title', 'slug', 'intro', 'cover_url'].forEach(k => { document.querySelector(`#pg-form [data-pk="${k}"]`).value = ''; });
  document.querySelector('#pg-form [data-pk="menu"]').value = 'yes';
  document.querySelector('#pg-form [data-pk="published"]').value = 'yes';
  document.getElementById('pg-title').textContent = 'New page';
  document.getElementById('pg-cancel').style.display = 'none';
  refreshImgFields(document.getElementById('pg-form'));
  renderBlocks();
}

async function loadPagesList() {
  const list = document.getElementById('pages-list');
  const items = await api('/pages');
  if (!items || !items.length) { list.innerHTML = '<div class="empty-state">No custom pages yet. Build your first one on the left.</div>'; return; }
  list.innerHTML = items.map(it => `
    <div class="admin-list-item" data-id="${it.id}">
      <button type="button" class="drag-handle" aria-label="Drag to reorder" title="Drag to reorder">${GRIP}</button>
      <div class="av av-doc"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg></div>
      <div class="grow">
        <div class="title">${esc(it.title)}</div>
        <div class="meta">/p/${esc(it.slug)} &middot; ${it.menu === 'yes' ? 'In menu' : 'Not in menu'}${it.published === 'no' ? ' &middot; Hidden' : ''}</div>
      </div>
      <div class="admin-item-actions">
        <a class="mini-link" href="/p/${esc(it.slug)}" target="_blank" rel="noopener">View</a>
        <button data-edit="${it.id}">Edit</button>
        <button class="danger" data-delete="${it.id}">Delete</button>
      </div>
    </div>`).join('');
  list.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => {
    const it = items.find(x => String(x.id) === btn.dataset.edit);
    pg = { id: it.id, blocks: (it.blocks || []).map(b => ({ ...b, _uid: uid() })) };
    ['title', 'slug', 'intro', 'cover_url'].forEach(k => { document.querySelector(`#pg-form [data-pk="${k}"]`).value = it[k] || ''; });
    document.querySelector('#pg-form [data-pk="menu"]').value = it.menu === 'yes' ? 'yes' : 'no';
    document.querySelector('#pg-form [data-pk="published"]').value = it.published === 'no' ? 'no' : 'yes';
    document.getElementById('pg-title').textContent = 'Editing: ' + it.title;
    document.getElementById('pg-cancel').style.display = 'inline-flex';
    refreshImgFields(document.getElementById('pg-form'));
    renderBlocks();
    document.getElementById('main').scrollTo({ top: 0, behavior: 'smooth' });
  }));
  list.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Delete this page? This cannot be undone.')) return;
    await api(`/pages/${btn.dataset.delete}`, { method: 'DELETE' });
    if (String(pg.id) === btn.dataset.delete) resetPageEditor();
    toast('Deleted.'); loadPagesList();
  }));
}

function buildPagesPanel() {
  const panel = document.getElementById('panel-pages');
  panel.innerHTML = `
    <div class="admin-grid pages-grid">
      <div class="admin-card" id="pg-form">
        <h3 id="pg-title">New page</h3>
        <div class="admin-form-grid">
          <div><label>Page title</label><input type="text" data-pk="title" placeholder="e.g. Youth Camp 2026"></div>
          <div class="two">
            <div><label>Show in the site menu?</label><select data-pk="menu"><option value="yes">Yes, add it to the menu</option><option value="no">No, only reachable by link</option></select></div>
            <div><label>Visible to visitors?</label><select data-pk="published"><option value="yes">Yes, published</option><option value="no">No, hide it for now</option></select></div>
          </div>
          <div><label>Short introduction (shown under the title)</label><textarea data-pk="intro" style="min-height:70px"></textarea></div>
          <div><label>Banner picture (optional)</label>${imgField('data-pk', 'cover_url', '')}</div>
          <input type="hidden" data-pk="slug">
          <div>
            <label>Page content</label>
            <div id="pg-blocks" class="block-list"></div>
            <div class="add-blocks" id="pg-add"><span>Add:</span>${BLOCK_TYPES.map(b => `<button type="button" class="pill-btn sm" data-add="${b.t}">+ ${b.label}</button>`).join('')}</div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-solid" id="pg-save">Save page</button>
            <button class="btn btn-dark-outline" id="pg-cancel" style="display:none;">Cancel</button>
          </div>
        </div>
      </div>
      <div>
        <div class="order-hint">Drag the grip to set the order pages appear in the menu.</div>
        <div class="admin-list" id="pages-list"></div>
      </div>
    </div>`;

  const blocksEl = document.getElementById('pg-blocks');
  makeSortable(blocksEl, '.block-item', () => {
    syncBlocksFromDom();
    const order = [...blocksEl.querySelectorAll('.block-item')].map(el => el.dataset.uid);
    pg.blocks = order.map(u => pg.blocks.find(b => b._uid === u));
  });
  blocksEl.addEventListener('click', e => {
    const d = e.target.closest('[data-del]');
    if (!d) return;
    syncBlocksFromDom();
    pg.blocks = pg.blocks.filter(b => b._uid !== d.dataset.del);
    renderBlocks();
  });
  document.getElementById('pg-add').addEventListener('click', e => {
    const a = e.target.closest('[data-add]');
    if (!a) return;
    syncBlocksFromDom();
    const nb = { type: a.dataset.add, _uid: uid() };
    if (nb.type === 'heading') nb.level = 'h2';
    pg.blocks.push(nb);
    renderBlocks();
    const last = blocksEl.lastElementChild; if (last) { last.scrollIntoView({ behavior: 'smooth', block: 'center' }); const f = last.querySelector('input,textarea'); if (f) f.focus({ preventScroll: true }); }
  });
  document.getElementById('pg-cancel').addEventListener('click', resetPageEditor);
  document.getElementById('pg-save').addEventListener('click', async () => {
    syncBlocksFromDom();
    const val = k => document.querySelector(`#pg-form [data-pk="${k}"]`).value.trim();
    if (!val('title')) { toast('Please give the page a title.'); return; }
    const body = {
      title: val('title'), slug: pg.id ? val('slug') : '', menu: val('menu'), published: val('published'),
      intro: val('intro'), cover_url: val('cover_url'),
      blocks: pg.blocks.map(({ _uid, ...rest }) => rest)
    };
    const res = pg.id ? await api(`/pages/${pg.id}`, { method: 'PUT', body }) : await api('/pages', { method: 'POST', body });
    if (!pg.id && res && res.id) { pg.id = res.id; }
    if (res && res.slug) document.querySelector('#pg-form [data-pk="slug"]').value = res.slug;
    document.getElementById('pg-title').textContent = 'Editing: ' + body.title;
    document.getElementById('pg-cancel').style.display = 'inline-flex';
    toast('Saved. Your page is live at /p/' + (res && res.slug ? res.slug : ''));
    loadPagesList();
  });
  makeSortable(document.getElementById('pages-list'), '.admin-list-item', async () => {
    const ids = [...document.querySelectorAll('#pages-list .admin-list-item')].map(el => el.dataset.id);
    await api('/pages/reorder', { method: 'PUT', body: { ids } });
    toast('Menu order saved.');
  });
  resetPageEditor();
  loadPagesList();
}

// -------------------------------------------------------------------------
// Overview (greeting, stat cards, charts) + right-hand widget rail
// -------------------------------------------------------------------------
const SECTIONS = [
  { k: 'news', label: 'News articles', group: 'Articles', color: '#4c93ff' },
  { k: 'articles', label: 'Articles', group: 'Articles', color: '#4c93ff' },
  { k: 'programmes', label: 'Programmes', group: 'Programmes', color: '#ffb648' },
  { k: 'pages', label: 'Custom pages', group: 'Pages', color: '#fb923c' },
  { k: 'leaders', label: 'Fathers in God', group: 'People', color: '#3ddc97' },
  { k: 'executives', label: 'Executives', group: 'People', color: '#3ddc97' },
  { k: 'patrons', label: 'Patrons & Patroness', group: 'People', color: '#3ddc97' },
  { k: 'pastPresidents', label: 'Past presidents', group: 'People', color: '#3ddc97' },
  { k: 'gallery', label: 'Gallery photos', group: 'Media', color: '#c084fc' },
  { k: 'videos', label: 'Videos', group: 'Media', color: '#c084fc' },
  { k: 'slides', label: 'Slider banners', group: 'Media', color: '#c084fc' },
  { k: 'magazines', label: 'Magazines', group: 'Reading', color: '#ff7aa8' },
  { k: 'newsletters', label: 'Newsletters', group: 'Reading', color: '#ff7aa8' },
  { k: 'publications', label: 'Publications', group: 'Reading', color: '#ff7aa8' },
  { k: 'archdeaconries', label: 'Archdeaconries', group: 'Archdeaconries', color: '#5ee0e0' }
];
const GROUP_COLORS = { Pages: '#fb923c', Articles: '#4c93ff', Programmes: '#ffb648', People: '#3ddc97', Media: '#c084fc', Reading: '#ff7aa8', Archdeaconries: '#5ee0e0' };
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

async function loadAll() {
  const out = {};
  await Promise.all(SECTIONS.map(async sec => { if (!can(sec.k)) { out[sec.k] = []; return; } try { out[sec.k] = (await api(`/${sec.k}`)) || []; } catch (e) { out[sec.k] = []; } }));
  out.messages = [];
  if (can('messages')) { try { out.messages = (await api('/messages')) || []; } catch (e) { out.messages = []; } }
  return out;
}

function lastMonths(n) {
  const now = new Date(), arr = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); arr.push({ y: d.getFullYear(), m: d.getMonth() }); }
  return arr;
}
function monthlyCounts(items, field, n = 12) {
  const slots = lastMonths(n);
  const counts = slots.map(() => 0);
  items.forEach(it => {
    const d = new Date(it[field] || it.created_at);
    if (isNaN(d)) return;
    const idx = slots.findIndex(s => s.y === d.getFullYear() && s.m === d.getMonth());
    if (idx > -1) counts[idx]++;
  });
  return { slots, counts };
}

function donutSvg(parts, total) {
  const r = 52, c = 2 * Math.PI * r;
  let off = 0;
  const gap = parts.length > 1 ? 3 : 0;
  const segs = parts.map(p => {
    const len = total ? (p.value / total) * c : 0;
    const seg = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${p.color}" stroke-width="15" stroke-linecap="round" stroke-dasharray="${Math.max(len - gap, 0.01)} ${c}" stroke-dashoffset="${-off}"/>`;
    off += len; return seg;
  }).join('');
  return `<svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="${r}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="15"/>${segs}</svg>`;
}

function linePath(vals, w, h, pad = 6) {
  const max = Math.max(...vals, 1), step = (w - pad * 2) / Math.max(vals.length - 1, 1);
  const pts = vals.map((v, i) => [pad + i * step, h - pad - (v / max) * (h - pad * 2)]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2; d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`; }
  return { d, last: pts[pts.length - 1], pts };
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

let overviewData = null;
async function refreshOverview() {
  if (!IS_OWNER) { renderLimitedOverview(); return; }
  overviewData = await loadAll(); renderOverview(overviewData); renderRail(overviewData); setMsgBadge(overviewData.messages);
}

// People with limited access get a simple launcher instead of site-wide statistics.
async function renderLimitedOverview() {
  const rail = document.getElementById('admin-rail'); if (rail) rail.hidden = true;
  const panel = document.getElementById('panel-overview');
  const tabs = [...document.querySelectorAll('.admin-tab[data-tab]')].filter(t => t.dataset.tab !== 'overview');
  panel.innerHTML = tabs.length
    ? `<div class="inner"><div class="inner-head"><h3>Your sections</h3><span class="chip">${tabs.length} available</span></div>
        <div class="launch-grid">${tabs.map(t => `<button type="button" class="launch-card" data-goto="${esc(t.dataset.tab)}">${t.querySelector('svg') ? t.querySelector('svg').outerHTML : ''}<span>${esc(t.dataset.label)}</span></button>`).join('')}</div></div>`
    : '<div class="inner"><div class="empty-state">You have not been given access to any section yet. Please ask the administrator.</div></div>';
  panel.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.goto)));
  if (can('messages')) { try { setMsgBadge(await api('/messages')); } catch (e) { /* ignore */ } }
}

function renderOverview(D) {
  const panel = document.getElementById('panel-overview');
  const today = new Date().toISOString().slice(0, 10);
  const news = D.news, progs = D.programmes, msgs = D.messages;
  const upcoming = progs.filter(p => (p.event_date || '') >= today).length;
  const unread = msgs.filter(m => !m.is_read).length;
  const total = SECTIONS.reduce((n, sec) => n + D[sec.k].length, 0);
  const nm = monthlyCounts(news, 'published_at', 12);
  const thisYear = news.filter(n => String(n.published_at || '').startsWith(String(new Date().getFullYear()))).length;

  // groups for donut
  const groupTotals = {};
  SECTIONS.forEach(sec => { groupTotals[sec.group] = (groupTotals[sec.group] || 0) + D[sec.k].length; });
  const parts = Object.keys(groupTotals).map(g => ({ label: g, value: groupTotals[g], color: GROUP_COLORS[g] })).filter(p => p.value > 0);

  const ranked = SECTIONS.map(sec => ({ ...sec, n: D[sec.k].length })).sort((a, b) => b.n - a.n).slice(0, 6);
  const maxN = Math.max(...ranked.map(r => r.n), 1);
  const maxM = Math.max(...nm.counts, 1);
  const hotIdx = nm.counts.indexOf(Math.max(...nm.counts));
  const sparkMax = Math.max(...nm.counts.slice(-8), 1);

  const recent = msgs.slice(0, 4);

  panel.innerHTML = `
    <div class="inner quick-add">
      <div class="inner-head"><h3>Add something new</h3><span class="chip">One click</span></div>
      <div class="qa-row">
        ${[['news', 'New news story'], ['articles', 'New article'], ['programmes', 'New programme'], ['patrons', 'Add a patron'], ['archdeaconries', 'Add archdeaconry'], ['gallery', 'Upload a photo'], ['videos', 'Add a video'], ['pages', 'Create a page']].map(([k, l]) => `<button type="button" class="qa-btn" data-quick="${k}"><span>+</span>${l}</button>`).join('')}
      </div>
    </div>

    <div class="ov-grid ov-stats" style="margin-top:16px;">
      <div class="inner stat">
        <div class="lbl">${ico('news')} News articles</div>
        <div class="num">${news.length}<span class="delta">${thisYear} this year</span></div>
        <div class="spark">${nm.counts.slice(-8).map(c => `<i class="${c === sparkMax && c > 0 ? 'hot' : ''}" style="height:${Math.max(c / sparkMax * 100, 8)}%"></i>`).join('')}</div>
      </div>
      <div class="inner stat">
        <div class="lbl">${ico('cal')} Upcoming programmes</div>
        <div class="num">${upcoming}<span class="delta ${upcoming ? '' : 'warn'}">${progs.length} listed</span></div>
        <div class="meter"><b style="width:${progs.length ? Math.round(upcoming / progs.length * 100) : 0}%"></b></div>
        <div class="sub" style="margin-top:8px;">${upcoming ? 'Still ahead of today' : 'Add the next event'}</div>
      </div>
      <div class="inner stat">
        <div class="lbl">${ico('mail')} Unread messages</div>
        <div class="num">${unread}<span class="delta ${unread ? 'warn' : ''}">${msgs.length} total</span></div>
        <div class="meter"><b style="width:${msgs.length ? Math.round((msgs.length - unread) / msgs.length * 100) : 100}%"></b></div>
        <div class="sub" style="margin-top:8px;">${unread ? 'Waiting for a reply' : 'Inbox is clear'}</div>
      </div>
    </div>

    <div class="ov-grid ov-two" style="margin-top:16px;">
      <div class="inner">
        <div class="inner-head"><h3>Largest sections</h3><span class="chip">${total} items</span></div>
        <div class="rows">
          ${ranked.map(r => `<div class="row-bar"><span>${esc(r.label)}</span><div class="tr"><b style="width:${Math.max(r.n / maxN * 100, r.n ? 6 : 0)}%;background:${r.color}"></b></div><span class="v">${r.n}</span></div>`).join('')}
        </div>
      </div>
      <div class="inner">
        <div class="inner-head"><h3>Content mix</h3><span class="chip">All sections</span></div>
        <div class="donut-wrap">
          <div class="donut">${donutSvg(parts, total)}<div class="mid"><b>${total}</b><span>items</span></div></div>
          <div class="legend">${parts.map(p => `<div><i style="background:${p.color}"></i>${esc(p.label)}<b>${p.value}</b></div>`).join('')}</div>
        </div>
      </div>
    </div>

    <div class="inner" style="margin-top:16px;">
      <div class="inner-head"><h3>Articles published by month</h3><span class="chip">Last 12 months</span></div>
      <div class="bars">
        ${nm.counts.map((c, i) => `<div class="b ${i === hotIdx && c > 0 ? 'hot' : ''}" title="${MONTH_NAMES[nm.slots[i].m]} ${nm.slots[i].y}: ${c}"><i style="height:${Math.max(c / maxM * 100, 7)}%"></i><span>${MONTHS[nm.slots[i].m]}</span></div>`).join('')}
      </div>
    </div>

    <div class="inner" style="margin-top:16px;">
      <div class="inner-head"><h3>Recent messages</h3><button type="button" class="pill-btn" data-goto="messages">Open inbox</button></div>
      <div class="list-rows">
        ${recent.length ? recent.map(m => `<div class="list-row">${avatar(m.full_name)}<div class="tx"><b>${esc(m.full_name)}</b><span>${esc(m.subject || m.message || '')}</span></div>${m.is_read ? '' : '<span class="tag new">New</span>'}</div>`).join('') : '<div class="empty-state">No messages yet.</div>'}
      </div>
    </div>
  `;
  panel.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.goto)));
  panel.querySelectorAll('[data-quick]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.quick;
    switchTab(k);
    if (ENTITIES[k]) openEditor(k, null);
  }));
}

function renderRail(D) {
  const rail = document.getElementById('admin-rail');
  const total = SECTIONS.reduce((n, sec) => n + D[sec.k].length, 0);
  const top = SECTIONS.map(sec => ({ lab: sec.label.replace(/[^A-Za-z ]/g, '').slice(0, 3), n: D[sec.k].length })).sort((a, b) => b.n - a.n).slice(0, 7);
  const maxN = Math.max(...top.map(t => t.n), 1);
  const unread = D.messages.filter(m => !m.is_read).length;
  const nm = monthlyCounts(D.news, 'published_at', 12);
  let run = D.news.filter(n => { const d = new Date(n.published_at || n.created_at); return !isNaN(d) && d < new Date(nm.slots[0].y, nm.slots[0].m, 1); }).length;
  const cum = nm.counts.map(c => (run += c));
  const lp = linePath(cum, 240, 96);

  rail.innerHTML = `
    <div class="rail-card rail-blue">
      <div class="k">${ico('box')} Published items</div>
      <div class="big">${total}</div>
      <div class="s">across ${SECTIONS.length} sections</div>
      <div class="rail-bars">${top.map((t, i) => `<div class="b ${i ? 'dim' : ''}"><i style="height:${Math.max(t.n / maxN * 100, 8)}%"></i><span>${esc(t.lab)}</span></div>`).join('')}</div>
    </div>
    <div class="rail-card rail-warm">
      <div class="k">${ico('mail')} Unread messages</div>
      <div class="big">${unread}</div>
      <div class="s">${D.messages.length} received in total</div>
      <button type="button" class="round-add" data-goto="messages" aria-label="Open messages">&rarr;</button>
    </div>
    <div class="rail-card rail-dark">
      <div class="k" style="justify-content:space-between;"><span style="display:flex;align-items:center;gap:7px;">${ico('news')} News archive</span><span class="chip">12 months</span></div>
      <div class="big">${D.news.length}</div>
      <div class="s">articles in total</div>
      <svg class="line-svg" viewBox="0 0 240 96" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
        <path d="${lp.d} L${lp.pts[lp.pts.length - 1][0]},96 L${lp.pts[0][0]},96 Z" fill="url(#lg)"/>
        <path d="${lp.d}" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
        <circle cx="${lp.last[0]}" cy="${lp.last[1]}" r="4" fill="#fff"/>
      </svg>
    </div>
  `;
  rail.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.goto)));
}


// -------------------------------------------------------------------------
// Users & access (full administrators only) + "change my password"
// -------------------------------------------------------------------------
const PERM_GROUPS = [
  ['Inbox', [['messages', 'Messages']]],
  ['Website', [['settings', 'Site settings'], ['slides', 'Homepage slider'], ['pages', 'Custom pages'], ['news', 'News'], ['articles', 'Articles & preaching'], ['programmes', 'Programmes'], ['archdeaconries', 'Archdeaconries']]],
  ['People', [['leaders', 'Fathers in God'], ['executives', 'Diocesan executives'], ['patrons', 'Patrons & Patroness'], ['pastPresidents', 'Past presidents']]],
  ['Media & reading', [['media', 'Media library'], ['gallery', 'Gallery'], ['videos', 'Videos'], ['magazines', 'Magazine'], ['newsletters', 'Newsletter'], ['publications', 'Publications']]]
];
const PERM_LABEL = Object.fromEntries(PERM_GROUPS.flatMap(g => g[1]));

async function buildUsersPanel() {
  const panel = document.getElementById('panel-users');
  panel.innerHTML = `
    <div class="list-top">
      <div class="list-title"><strong>Users &amp; access</strong><span class="count" id="users-count"></span></div>
      <div class="grow"></div>
      <button type="button" class="btn btn-solid" id="users-add">+ Add user</button>
    </div>
    <div class="order-hint">Each person signs in with their own username and password and only sees the sections you tick for them. Changes apply immediately.</div>
    <div class="admin-list full" id="users-list"></div>`;
  document.getElementById('users-add').addEventListener('click', () => openUserDialog(null));
  const list = document.getElementById('users-list');
  let data;
  try { data = await api('/users'); } catch (e) { return; }
  if (!data) return;
  document.getElementById('users-count').textContent = data.users.length;
  list.innerHTML = data.users.map(u => {
    const owner = u.role === 'owner';
    const chips = owner ? '<span class="tag">Full access</span>' : (u.permissions.length ? u.permissions.map(k => `<span class="tag soft">${esc(PERM_LABEL[k] || k)}</span>`).join('') : '<span class="tag soft">No sections yet</span>');
    return `<div class="admin-list-item user-row" data-id="${u.id}">
      ${avatar(u.display_name || u.username)}
      <div class="grow">
        <div class="title">${esc(u.display_name || u.username)} ${u.id === data.me ? '<span class="tag new">You</span>' : ''}</div>
        <div class="meta">@${esc(u.username)} &middot; ${owner ? 'Full administrator' : 'Limited access'}</div>
        <div class="user-chips">${chips}</div>
      </div>
      <div class="admin-item-actions">
        <button data-edit-user="${u.id}">Edit</button>
        ${u.id === data.me ? '' : `<button class="danger" data-del-user="${u.id}">Delete</button>`}
      </div>
    </div>`;
  }).join('');
  list.querySelectorAll('[data-edit-user]').forEach(b => b.addEventListener('click', () => openUserDialog(data.users.find(u => String(u.id) === b.dataset.editUser), data.me)));
  list.querySelectorAll('[data-del-user]').forEach(b => b.addEventListener('click', async () => {
    const u = data.users.find(x => String(x.id) === b.dataset.delUser);
    if (!confirm(`Delete ${u.display_name || u.username}? They will no longer be able to sign in.`)) return;
    try { await api(`/users/${u.id}`, { method: 'DELETE' }); toast('User deleted.'); buildUsersPanel(); } catch (e) { /* message shown */ }
  }));
}

function openUserDialog(user, meId) {
  const isNew = !user;
  const owner = user ? user.role === 'owner' : false;
  const has = k => user && user.permissions.includes(k);
  const ov = h(`<div class="modal-overlay"><div class="modal glass editor-dialog" role="dialog" aria-modal="true">
    <div class="modal-head"><h3>${isNew ? 'Add a user' : 'Edit user'}</h3><button type="button" class="modal-x" data-close aria-label="Close">&times;</button></div>
    <div class="modal-body"><div class="admin-form-grid" id="u-form">
      <div><label>Full name <i class="req">*</i></label><input id="u-name" type="text" value="${esc(user ? user.display_name : '')}" placeholder="e.g. Mary Adeyemi"></div>
      <div><label>Username ${isNew ? '<i class="req">*</i>' : ''}</label><input id="u-username" type="text" value="${esc(user ? user.username : '')}" ${isNew ? '' : 'disabled'} placeholder="used to sign in" autocomplete="off"></div>
      <div><label>${isNew ? 'Password <i class="req">*</i>' : 'New password'}</label><input id="u-pass" type="password" autocomplete="new-password" placeholder="${isNew ? 'At least 8 characters' : 'Leave empty to keep the current one'}"></div>
      <div><label>Access level</label>
        <select id="u-role"><option value="editor" ${owner ? '' : 'selected'}>Limited &mdash; only the sections I tick</option><option value="owner" ${owner ? 'selected' : ''}>Full administrator &mdash; everything, including users</option></select></div>
      <div id="u-perms" ${owner ? 'hidden' : ''}>
        <label>Sections this person can manage</label>
        <div class="perm-tools"><button type="button" data-all>Select all</button><button type="button" data-none>Clear</button></div>
        ${PERM_GROUPS.map(([title, items]) => `<div class="perm-group"><div class="perm-title">${esc(title)}</div><div class="perm-grid">${items.map(([k, l]) => `<label class="perm-opt"><input type="checkbox" value="${k}" ${has(k) ? 'checked' : ''}><span>${esc(l)}</span></label>`).join('')}</div></div>`).join('')}
        <div class="hint">Anyone with a section can also add pictures to it. They never see Users &amp; access.</div>
      </div>
    </div></div>
    <div class="modal-foot"><button type="button" class="btn btn-dark-outline" data-close>Cancel</button><button type="button" class="btn btn-solid" id="u-save">${isNew ? 'Create user' : 'Save changes'}</button></div>
  </div></div>`);
  const close = showModal(ov);
  const roleSel = ov.querySelector('#u-role'), perms = ov.querySelector('#u-perms');
  roleSel.addEventListener('change', () => { perms.hidden = roleSel.value === 'owner'; });
  ov.querySelector('[data-all]').addEventListener('click', () => perms.querySelectorAll('input[type=checkbox]').forEach(c => c.checked = true));
  ov.querySelector('[data-none]').addEventListener('click', () => perms.querySelectorAll('input[type=checkbox]').forEach(c => c.checked = false));
  if (user && user.id === meId) { roleSel.disabled = true; }
  ov.querySelector('#u-save').addEventListener('click', async () => {
    const body = {
      display_name: ov.querySelector('#u-name').value.trim(),
      role: roleSel.value,
      permissions: [...perms.querySelectorAll('input:checked')].map(c => c.value)
    };
    const pw = ov.querySelector('#u-pass').value;
    if (isNew) {
      body.username = ov.querySelector('#u-username').value.trim();
      body.password = pw;
      if (!body.display_name) { toast('Please enter the person\u2019s name.'); return; }
      if (body.role === 'editor' && !body.permissions.length && !confirm('No sections are ticked, so this person will see nothing. Continue?')) return;
    } else if (pw) body.password = pw;
    const btn = ov.querySelector('#u-save'); btn.disabled = true;
    try {
      if (isNew) await api('/users', { method: 'POST', body }); else await api(`/users/${user.id}`, { method: 'PUT', body });
      toast(isNew ? 'User created. Share their username and password with them.' : 'Saved.');
      close(); buildUsersPanel();
    } catch (e) { btn.disabled = false; }
  });
  const first = ov.querySelector('#u-name'); if (first) first.focus();
}

function openPasswordDialog() {
  const ov = h(`<div class="modal-overlay"><div class="modal glass editor-dialog" style="max-width:440px" role="dialog" aria-modal="true">
    <div class="modal-head"><h3>Change my password</h3><button type="button" class="modal-x" data-close aria-label="Close">&times;</button></div>
    <div class="modal-body"><div class="admin-form-grid">
      <div><label>Current password</label><input id="pw-cur" type="password" autocomplete="current-password"></div>
      <div><label>New password</label><input id="pw-new" type="password" autocomplete="new-password" placeholder="At least 8 characters"></div>
    </div></div>
    <div class="modal-foot"><button type="button" class="btn btn-dark-outline" data-close>Cancel</button><button type="button" class="btn btn-solid" id="pw-save">Update password</button></div>
  </div></div>`);
  const close = showModal(ov);
  ov.querySelector('#pw-cur').focus();
  ov.querySelector('#pw-save').addEventListener('click', async () => {
    try {
      await api('/me/password', { method: 'PUT', body: { current: ov.querySelector('#pw-cur').value, next: ov.querySelector('#pw-new').value } });
      toast('Password updated.'); close();
    } catch (e) { /* message shown */ }
  });
}

// -------------------------------------------------------------------------
// Tab switching + init
// -------------------------------------------------------------------------
const loaded = new Set();
function switchTab(key) {
  const tab = document.querySelector(`.admin-tab[data-tab="${key}"]`);
  if (!tab) return;
  document.querySelectorAll('.admin-tab[data-tab]').forEach(t => t.classList.toggle('active', t === tab));
  document.querySelectorAll('.admin-panel').forEach(p => p.hidden = true);
  document.getElementById(`panel-${key}`).hidden = false;
  const meta = PAGE_META[key] || ['', ''];
  const raw = document.querySelector('.avatar-chip').title || 'Admin';
  const adminName = raw.charAt(0).toUpperCase() + raw.slice(1);
  document.getElementById('page-title').textContent = key === 'overview' ? `${greeting()}, ${adminName}` : meta[0];
  document.getElementById('page-sub').textContent = meta[1];
  document.getElementById('main').scrollTo({ top: 0 });
  if (key === 'overview') { refreshOverview(); return; }
  if (!loaded.has(key)) {
    loaded.add(key);
    if (key === 'settings') buildSettingsPanel();
    else if (key === 'messages') buildMessagesPanel();
    else if (key === 'pages') buildPagesPanel();
    else if (key === 'media') buildMediaPanel();
    else if (key === 'users') buildUsersPanel();
    else buildEntityPanel(key);
  } else if (key === 'messages') {
    buildMessagesPanel();
  } else if (key === 'users') {
    buildUsersPanel();
  }
}
document.querySelectorAll('.admin-tab[data-tab]').forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
document.getElementById('change-pw').addEventListener('click', openPasswordDialog);
switchTab('overview');
