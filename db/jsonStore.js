// A tiny embedded database backed by a single JSON file.
// No native modules, no compiling — just Node's built-in "fs". This keeps
// the site easy to install on any beginner's PC (no Python, no build tools).

const fs = require('fs');
const path = require('path');

// DATA_DIR lets a host (e.g. a Render Disk mounted at /var/data) keep the data between deploys.
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dataFile = path.join(dataDir, 'ayf.json');

function defaultState() {
  return {
    _seq: {},
    admins: [],
    settings: {},
    slides: [], news: [], programmes: [], leaders: [],
    archdeaconries: [], gallery: [], videos: [], publications: [],
    articles: [], messages: [], executives: [], patrons: [], pastPresidents: [],
    magazines: [], newsletters: [], pages: []
  };
}

let state;
if (fs.existsSync(dataFile)) {
  try {
    state = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch (e) {
    console.error('Could not read data/ayf.json, starting fresh:', e.message);
    state = defaultState();
  }
} else {
  state = defaultState();
}
// Fill in any tables missing from an older data file, without overwriting existing data.
state = { ...defaultState(), ...state };

function save() {
  fs.writeFileSync(dataFile, JSON.stringify(state, null, 2));
}

function nextId(table) {
  state._seq[table] = (state._seq[table] || 0) + 1;
  return state._seq[table];
}

function list(table, { sortKey, dir = 'asc' } = {}) {
  const arr = [...(state[table] || [])];
  if (sortKey) {
    arr.sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      if (av < bv) return dir === 'desc' ? 1 : -1;
      if (av > bv) return dir === 'desc' ? -1 : 1;
      return 0;
    });
  }
  return arr;
}


// Manual order: once someone drags items into a position, every item carries a
// numeric sort_order and that order wins. Until then the normal fallback
// (newest first, A-Z, ...) applies. Items without a sort_order (newly added)
// show first.
const ord = (it) => (it.sort_order === '' || it.sort_order == null || isNaN(Number(it.sort_order))) ? null : Number(it.sort_order);
function listOrdered(table, fallback) {
  const arr = list(table, fallback);
  if (!arr.some(i => ord(i) !== null)) return arr;
  return arr.map((x, idx) => [x, idx]).sort(([a, ai], [b, bi]) => {
    const av = ord(a), bv = ord(b);
    if (av !== null && bv !== null) return (av - bv) || (ai - bi);
    if ((av === null) !== (bv === null)) return av === null ? -1 : 1;
    return ai - bi;
  }).map(x => x[0]);
}
function orderBounds(table) {
  const vals = (state[table] || []).map(ord).filter(v => v !== null);
  return vals.length ? { min: Math.min(...vals), max: Math.max(...vals) } : null;
}
function reorder(table, ids) {
  const arr = state[table] || [];
  let n = 0;
  ids.forEach(id => { const it = arr.find(x => x.id === Number(id)); if (it) it.sort_order = ++n; });
  save();
  return n;
}

function getById(table, id) {
  return (state[table] || []).find(item => item.id === Number(id));
}

function insert(table, data) {
  const id = nextId(table);
  const withTimestamp = data.created_at !== undefined ? data : { ...data, created_at: new Date().toISOString() };
  const record = { id, ...withTimestamp };
  state[table].push(record);
  save();
  return id;
}

function update(table, id, data) {
  const arr = state[table] || [];
  const idx = arr.findIndex(item => item.id === Number(id));
  if (idx === -1) return false;
  arr[idx] = { ...arr[idx], ...data };
  save();
  return true;
}

function remove(table, id) {
  const arr = state[table] || [];
  const idx = arr.findIndex(item => item.id === Number(id));
  if (idx === -1) return false;
  arr.splice(idx, 1);
  save();
  return true;
}

function getSettings() {
  return { ...state.settings };
}

function setSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  save();
}

function getAdminByUsername(username) {
  return state.admins.find(a => a.username === username);
}

function addAdmin(username, password_hash, extra = {}) {
  const id = nextId('admins');
  state.admins.push({ id, username, password_hash, role: 'owner', permissions: [], ...extra });
  save();
  return id;
}
function listAdmins() { return [...state.admins]; }
function getAdminById(id) { return state.admins.find(a => a.id === Number(id)); }
function updateAdmin(id, patch) {
  const i = state.admins.findIndex(a => a.id === Number(id));
  if (i === -1) return false;
  state.admins[i] = { ...state.admins[i], ...patch };
  save();
  return true;
}
function removeAdmin(id) {
  const i = state.admins.findIndex(a => a.id === Number(id));
  if (i === -1) return false;
  state.admins.splice(i, 1);
  save();
  return true;
}

function isEmpty(table) {
  return (state[table] || []).length === 0;
}

module.exports = {
  list, listOrdered, orderBounds, reorder, getById, insert, update, remove,
  getSettings, setSettings,
  getAdminByUsername, addAdmin, listAdmins, getAdminById, updateAdmin, removeAdmin,
  isEmpty
};
