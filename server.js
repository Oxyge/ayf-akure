require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const fs = require('fs');
const store = require('./db/jsonStore');

// First start on a fresh server (e.g. Render): fill the empty database with the
// starting content and the admin account, so no separate "npm run seed" is needed.
if (Object.keys(store.getSettings()).length === 0) require('./db/seed');

// Locked out? Set ADMIN_USERNAME, ADMIN_PASSWORD and RESET_ADMIN_PASSWORD=true on the host,
// redeploy, sign in, then remove RESET_ADMIN_PASSWORD again.
if (process.env.RESET_ADMIN_PASSWORD === 'true' && process.env.ADMIN_PASSWORD) {
  const name = process.env.ADMIN_USERNAME || 'admin';
  const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
  const existing = store.getAdminByUsername(name);
  if (existing) store.updateAdmin(existing.id, { password_hash: hash, role: 'owner' });
  else store.addAdmin(name, hash, { role: 'owner' });
  console.log('Admin password reset for user "' + name + '". Remove RESET_ADMIN_PASSWORD now.');
}

const app = express();
const PORT = process.env.PORT || 3000;

// --- View engine -----------------------------------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Middleware --------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Pictures from the old WordPress site: fetched by this server (so the old site's
// hotlink protection can't block them) and kept on disk after the first request.
const OLD_SITE = 'https://ayfakure.org.ng';
const IMG_CACHE = path.join(__dirname, 'data', 'img-cache');
app.get('/wp-content/uploads/*', async (req, res) => {
  const rel = req.params[0] || '';
  if (!/^[\w\-./ ()]+$/.test(rel) || rel.includes('..')) return res.status(400).end();
  const file = path.join(IMG_CACHE, rel);
  const send = () => res.set('Cache-Control', 'public, max-age=604800').sendFile(file);
  if (fs.existsSync(file)) return send();
  try {
    const url = OLD_SITE + '/wp-content/uploads/' + rel.split('/').map(encodeURIComponent).join('/');
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (AYF Akure website)' } });
    if (!r.ok) return res.status(404).end();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
    send();
  } catch (e) { res.status(502).end(); }
});
app.use(cookieSession({
  name: 'ayf_session',
  keys: [process.env.SESSION_SECRET || 'ayf-akure-dev-secret-change-me'],
  maxAge: 24 * 60 * 60 * 1000
}));

// --- Uploads (used by admin dashboard to add real photos) --------------------
// UPLOAD_DIR lets a host keep uploaded pictures between deploys (e.g. a Render Disk).
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));
const ALLOWED_UPLOAD = /\.(png|jpe?g|gif|webp|svg|pdf)$/i;
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, path.extname(file.originalname)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'file';
    cb(null, `${base}-${Date.now().toString(36)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ALLOWED_UPLOAD.test(file.originalname))
});


// Custom pages flagged "show in menu" appear in the site navigation.
app.use((req, res, next) => {
  res.locals.navPages = store.listOrdered('pages').filter(p => p.published !== 'no' && (p.menu === 'yes' || p.menu === true));
  next();
});

// Default order for each list until someone drags items into a custom order.
const FALLBACK = {
  news: { sortKey: 'published_at', dir: 'desc' }, articles: { sortKey: 'published_at', dir: 'desc' },
  programmes: { sortKey: 'event_date' }, archdeaconries: { sortKey: 'name' },
  leaders: { sortKey: 'sort_order' }, executives: { sortKey: 'sort_order' }, patrons: { sortKey: 'sort_order' },
  pastPresidents: { sortKey: 'sort_order' }, slides: { sortKey: 'sort_order' },
  gallery: { sortKey: 'created_at', dir: 'desc' }, videos: { sortKey: 'published_at', dir: 'desc' },
  publications: { sortKey: 'published_at', dir: 'desc' }, magazines: { sortKey: 'issue_date', dir: 'desc' },
  newsletters: { sortKey: 'issue_date', dir: 'desc' }, pages: { sortKey: 'id' }
};

// --- Helpers -----------------------------------------------------------------
// Every section of the dashboard that can be given to (or withheld from) a user.
const PERM_GROUPS = [
  { title: 'Inbox', items: [['messages', 'Messages']] },
  { title: 'Website', items: [['settings', 'Site settings'], ['slides', 'Homepage slider'], ['pages', 'Custom pages'], ['news', 'News'], ['articles', 'Articles & preaching'], ['programmes', 'Programmes'], ['archdeaconries', 'Archdeaconries']] },
  { title: 'People', items: [['leaders', 'Fathers in God'], ['executives', 'Diocesan executives'], ['patrons', 'Patrons & Patroness'], ['pastPresidents', 'Past presidents']] },
  { title: 'Media & reading', items: [['media', 'Media library'], ['gallery', 'Gallery'], ['videos', 'Videos'], ['magazines', 'Magazine'], ['newsletters', 'Newsletter'], ['publications', 'Publications']] }
];
const ALL_PERMS = PERM_GROUPS.flatMap(g => g.items.map(i => i[0]));
const isOwner = a => !!a && a.role !== 'editor';          // older accounts have no role = full admin
const permsOf = a => isOwner(a) ? ALL_PERMS : (a.permissions || []).filter(k => ALL_PERMS.includes(k));

function requireAdmin(req, res, next) {
  // Always re-read the account, so changes to access (or a removed user) apply immediately.
  const admin = req.session && req.session.adminId ? store.getAdminById(req.session.adminId) : null;
  if (admin) { req.admin = admin; return next(); }
  if (req.session) req.session = null;
  if (req.originalUrl.startsWith('/api/')) return res.status(401).json({ error: 'Not authenticated' });
  return res.redirect('/admin/login');
}

// =============================================================================
// PUBLIC PAGES (server-rendered from the store)
// =============================================================================
app.get('/', (req, res) => {
  const settings = store.getSettings();
  const slides = store.listOrdered('slides', { sortKey: 'sort_order' });
  const news = store.listOrdered('news', { sortKey: 'published_at', dir: 'desc' }).slice(0, 3);
  const allProg = store.listOrdered('programmes', { sortKey: 'event_date' });
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingProg = allProg.filter(p => !p.event_date || p.event_date >= todayStr);
  const programmes = (upcomingProg.length ? upcomingProg : allProg.slice().reverse()).slice(0, 3);
  const leaders = store.listOrdered('leaders', { sortKey: 'sort_order' });
  const gallery = store.listOrdered('gallery', { sortKey: 'created_at', dir: 'desc' }).slice(0, 6);
  const videos = store.listOrdered('videos', { sortKey: 'published_at', dir: 'desc' }).slice(0, 3);
  const quotes = leaders.filter(l => l.quote).map(l => ({ quote: l.quote, name: l.name, role: l.role, photo_url: l.photo_url }));
  if (!quotes.length && settings.leader_quote) {
    quotes.push({ quote: settings.leader_quote, name: settings.leader_quote_attribution, role: '', photo_url: leaders[0] && leaders[0].photo_url });
  }
  res.render('index', { settings, slides, news, programmes, leaders, gallery, videos, quotes, page: 'home' });
});

app.get('/about', (req, res) => {
  const settings = store.getSettings();
  const leaders = store.listOrdered('leaders', { sortKey: 'sort_order' });
  const article = store.listOrdered('articles').find(a => a.title === 'AYF Akure in a Nutshell');
  res.render('about', { settings, leaders, article, page: 'about' });
});

app.get('/executives', (req, res) => {
  const settings = store.getSettings();
  const executives = store.listOrdered('executives', { sortKey: 'sort_order' });
  const pastPresidents = store.listOrdered('pastPresidents', { sortKey: 'sort_order' });
  res.render('executives', { settings, executives, pastPresidents, page: 'executives' });
});

app.get('/patrons', (req, res) => {
  const settings = store.getSettings();
  const patrons = store.listOrdered('patrons', { sortKey: 'sort_order' });
  const pastPresidents = store.listOrdered('pastPresidents', { sortKey: 'sort_order' });
  res.render('patrons', { settings, patrons, pastPresidents, page: 'patrons' });
});

app.get('/programmes', (req, res) => {
  const settings = store.getSettings();
  const programmes = store.listOrdered('programmes', { sortKey: 'event_date' });
  res.render('programmes', { settings, programmes, page: 'programmes' });
});

app.get('/news', (req, res) => {
  const settings = store.getSettings();
  const news = store.listOrdered('news', { sortKey: 'published_at', dir: 'desc' });
  const articles = store.listOrdered('articles', { sortKey: 'published_at', dir: 'desc' });
  res.render('news', { settings, news, articles, page: 'news' });
});

app.get('/news/:id', (req, res) => {
  const settings = store.getSettings();
  const item = store.getById('news', req.params.id);
  if (!item) return res.status(404).render('404', { settings, page: '' });
  res.render('news-detail', { settings, item, page: 'news' });
});

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

app.get('/media', (req, res) => {
  const settings = store.getSettings();
  const gallery = store.listOrdered('gallery', { sortKey: 'created_at', dir: 'desc' });
  const videos = store.listOrdered('videos', { sortKey: 'published_at', dir: 'desc' });
  const publications = store.listOrdered('publications', { sortKey: 'published_at', dir: 'desc' });
  const albumMap = {};
  gallery.forEach(item => {
    const name = item.category || 'Gallery';
    const slug = slugify(name);
    if (!albumMap[slug]) albumMap[slug] = { name, slug, items: [] };
    albumMap[slug].items.push(item);
  });
  const galleryAlbums = Object.values(albumMap);
  res.render('media', { settings, gallery, galleryAlbums, videos, publications, page: 'media' });
});

app.get('/gallery/:slug', (req, res) => {
  const settings = store.getSettings();
  const gallery = store.listOrdered('gallery', { sortKey: 'created_at', dir: 'desc' });
  const items = gallery.filter(g => slugify(g.category || 'Gallery') === req.params.slug);
  if (!items.length) return res.status(404).render('404', { settings, page: '' });
  const albumName = items[0].category || 'Gallery';
  res.render('gallery-album', { settings, albumName, items, page: 'media' });
});

app.get('/magazine', (req, res) => {
  const settings = store.getSettings();
  const magazines = store.listOrdered('magazines', { sortKey: 'issue_date', dir: 'desc' });
  res.render('magazine', { settings, magazines, page: 'magazine' });
});

app.get('/newsletter', (req, res) => {
  const settings = store.getSettings();
  const newsletters = store.listOrdered('newsletters', { sortKey: 'issue_date', dir: 'desc' });
  res.render('newsletter', { settings, newsletters, page: 'newsletter' });
});

app.get('/archdeaconries', (req, res) => {
  const settings = store.getSettings();
  const archdeaconries = store.listOrdered('archdeaconries', { sortKey: 'name' });
  res.render('archdeaconries', { settings, archdeaconries, page: 'archdeaconries' });
});

app.get('/archdeaconries/:id', (req, res) => {
  const settings = store.getSettings();
  const item = store.getById('archdeaconries', req.params.id);
  if (!item) return res.status(404).render('404', { settings, page: '' });
  res.render('archdeaconry-detail', { settings, item, page: 'archdeaconries' });
});

app.get('/p/:slug', (req, res) => {
  const settings = store.getSettings();
  const custom = store.list('pages').find(p => p.slug === req.params.slug && p.published !== 'no');
  if (!custom) return res.status(404).render('404', { settings, page: '' });
  res.render('page', { settings, custom, page: 'custom-' + custom.slug });
});

app.get('/donate', (req, res) => {
  const settings = store.getSettings();
  res.render('donate', { settings, page: 'donate' });
});

app.get('/contact', (req, res) => {
  const settings = store.getSettings();
  res.render('contact', { settings, page: 'contact', sent: req.query.sent === '1' });
});

app.post('/contact', (req, res) => {
  const { full_name, email, phone, subject, message } = req.body;
  if (!full_name || !email || !message) return res.redirect('/contact');
  store.insert('messages', {
    full_name, email, phone: phone || '', subject: subject || '', message,
    created_at: new Date().toISOString(), is_read: 0
  });
  res.redirect('/contact?sent=1');
});

// =============================================================================
// JSON API (read-only, public — powers dynamic bits & external integrations)
// =============================================================================
const apiRouter = express.Router();
apiRouter.get('/settings', (req, res) => res.json(store.getSettings()));
apiRouter.get('/slides', (req, res) => res.json(store.listOrdered('slides', { sortKey: 'sort_order' })));
apiRouter.get('/news', (req, res) => res.json(store.listOrdered('news', { sortKey: 'published_at', dir: 'desc' })));
apiRouter.get('/programmes', (req, res) => res.json(store.listOrdered('programmes', { sortKey: 'event_date' })));
apiRouter.get('/leaders', (req, res) => res.json(store.listOrdered('leaders', { sortKey: 'sort_order' })));
apiRouter.get('/gallery', (req, res) => res.json(store.listOrdered('gallery', { sortKey: 'created_at', dir: 'desc' })));
apiRouter.get('/videos', (req, res) => res.json(store.listOrdered('videos', { sortKey: 'published_at', dir: 'desc' })));
apiRouter.get('/publications', (req, res) => res.json(store.listOrdered('publications', { sortKey: 'published_at', dir: 'desc' })));
apiRouter.get('/archdeaconries', (req, res) => res.json(store.listOrdered('archdeaconries', { sortKey: 'name' })));
apiRouter.get('/executives', (req, res) => res.json(store.listOrdered('executives', { sortKey: 'sort_order' })));
apiRouter.get('/patrons', (req, res) => res.json(store.listOrdered('patrons', { sortKey: 'sort_order' })));
apiRouter.get('/magazines', (req, res) => res.json(store.listOrdered('magazines', { sortKey: 'issue_date', dir: 'desc' })));
apiRouter.get('/newsletters', (req, res) => res.json(store.listOrdered('newsletters', { sortKey: 'issue_date', dir: 'desc' })));
app.use('/api', apiRouter);

// =============================================================================
// ADMIN — auth
// =============================================================================
app.get('/admin/login', (req, res) => {
  if (req.session && req.session.adminId) return res.redirect('/admin');
  res.render('admin/login', { error: null });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const admin = store.getAdminByUsername(username);
  if (!admin || !bcrypt.compareSync(password || '', admin.password_hash)) {
    return res.render('admin/login', { error: 'Invalid username or password.' });
  }
  req.session.adminId = admin.id;
  req.session.adminName = admin.display_name || admin.username;
  res.redirect('/admin');
});

app.post('/admin/logout', (req, res) => {
  req.session = null;
  res.redirect('/admin/login');
});

app.get('/admin', requireAdmin, (req, res) => {
  const settings = store.getSettings();
  res.render('admin/dashboard', {
    adminName: req.admin.display_name || req.admin.username, settings,
    perms: permsOf(req.admin), owner: isOwner(req.admin), permGroups: PERM_GROUPS
  });
});

// =============================================================================
// ADMIN API — full CRUD used by the dashboard (all protected)
// =============================================================================
const adminApi = express.Router();
adminApi.use(requireAdmin);

// Gate: each section of the API needs the matching permission.
adminApi.use((req, res, next) => {
  const seg = req.path.split('/')[1] || '';
  const mine = permsOf(req.admin);
  const deny = () => res.status(403).json({ error: 'You do not have access to this section.' });
  if (seg === 'users') return isOwner(req.admin) ? next() : deny();
  if (seg === 'me') return next();
  if (seg === 'upload') return mine.length ? next() : deny();                       // needed by any editor to add pictures
  if (seg === 'media' && req.method === 'GET') return mine.length ? next() : deny(); // picture picker
  if (ALL_PERMS.includes(seg)) return mine.includes(seg) ? next() : deny();
  return deny();
});

const FEED_TABLES = ['news', 'articles', 'programmes', 'gallery', 'videos', 'magazines', 'newsletters', 'publications'];

function slugify(v) {
  return String(v || '').toLowerCase().trim().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}
const RESERVED_SLUGS = ['admin', 'api', 'about', 'executives', 'patrons', 'programmes', 'news', 'media', 'magazine', 'newsletter', 'archdeaconries', 'contact', 'donate', 'p'];

function crud(table, fields) {
  adminApi.get(`/${table}`, (req, res) => {
    res.json(store.listOrdered(table, FALLBACK[table] || { sortKey: 'id', dir: 'desc' }));
  });
  // Drag-and-drop ordering: the admin sends every id in the order it should appear.
  adminApi.put(`/${table}/reorder`, (req, res) => {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    const n = store.reorder(table, ids);
    res.json({ ok: true, count: n });
  });
  function clean(body) {
    const data = {};
    fields.forEach(f => { if (body[f] !== undefined) data[f] = body[f]; });
    if (table === 'pages') {
      if (data.title !== undefined || data.slug !== undefined) data.slug = slugify(data.slug || data.title);
      if (data.blocks !== undefined && !Array.isArray(data.blocks)) data.blocks = [];
    }
    return data;
  }
  function slugTaken(slug, exceptId) {
    return RESERVED_SLUGS.includes(slug) || store.list('pages').some(p => p.slug === slug && p.id !== Number(exceptId));
  }
  adminApi.post(`/${table}`, (req, res) => {
    const data = clean(req.body);
    if (table === 'pages') {
      if (!data.slug) return res.status(400).json({ error: 'Please give the page a title.' });
      let base = data.slug, n = 2;
      while (slugTaken(data.slug)) data.slug = `${base}-${n++}`;
    }
    // A new story with no date would sink to the bottom, so default it to today.
    const dateField = { news: 'published_at', articles: 'published_at', videos: 'published_at', publications: 'published_at', magazines: 'issue_date', newsletters: 'issue_date' }[table];
    if (dateField && !data[dateField]) data[dateField] = new Date().toISOString().slice(0, 10);
    const bounds = store.orderBounds(table);
    if (bounds && (data.sort_order === undefined || data.sort_order === '')) {
      data.sort_order = FEED_TABLES.includes(table) ? bounds.min - 1 : bounds.max + 1;
    }
    const id = store.insert(table, data);
    res.json({ id, slug: data.slug });
  });
  adminApi.put(`/${table}/:id`, (req, res) => {
    const data = clean(req.body);
    if (table === 'pages' && data.slug) {
      let base = data.slug, n = 2;
      while (slugTaken(data.slug, req.params.id)) data.slug = `${base}-${n++}`;
    }
    store.update(table, req.params.id, data);
    res.json({ ok: true, slug: data.slug });
  });
  adminApi.delete(`/${table}/:id`, (req, res) => {
    store.remove(table, req.params.id);
    res.json({ ok: true });
  });
}

crud('news', ['title', 'category', 'excerpt', 'body', 'image_url', 'published_at']);
crud('programmes', ['title', 'event_date', 'event_time', 'venue', 'description', 'image_url']);
crud('leaders', ['name', 'role', 'bio', 'photo_url', 'quote', 'sort_order']);
crud('archdeaconries', ['name', 'location', 'leadership', 'contact', 'description', 'image_url']);
crud('executives', ['name', 'role', 'phone', 'email', 'photo_url', 'sort_order']);
crud('patrons', ['name', 'role', 'photo_url', 'sort_order']);
crud('pastPresidents', ['name', 'tenure', 'photo_url', 'sort_order']);
crud('magazines', ['title', 'description', 'cover_image_url', 'file_url', 'issue_date']);
crud('newsletters', ['title', 'description', 'cover_image_url', 'file_url', 'issue_date']);
crud('gallery', ['title', 'category', 'image_url']);
crud('videos', ['title', 'video_url', 'thumbnail_url', 'published_at']);
crud('publications', ['title', 'description', 'file_url', 'published_at']);
crud('articles', ['title', 'author', 'body', 'image_url', 'published_at']);
crud('pages', ['title', 'slug', 'menu', 'published', 'intro', 'cover_url', 'blocks']);
crud('slides', ['eyebrow', 'heading', 'body', 'button_label', 'button_link', 'image_url', 'sort_order']);

adminApi.get('/settings', (req, res) => res.json(store.getSettings()));
adminApi.put('/settings', (req, res) => {
  store.setSettings(req.body);
  res.json({ ok: true });
});

adminApi.get('/messages', (req, res) => res.json(store.list('messages', { sortKey: 'created_at', dir: 'desc' })));
adminApi.put('/messages/:id/read', (req, res) => {
  store.update('messages', req.params.id, { is_read: 1 });
  res.json({ ok: true });
});
adminApi.delete('/messages/:id', (req, res) => {
  store.remove('messages', req.params.id);
  res.json({ ok: true });
});

adminApi.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Please choose a picture (JPG, PNG, GIF, WEBP or SVG) or a PDF under 10 MB.' });
  res.json({ url: `/uploads/${req.file.filename}`, name: req.file.originalname });
});

// Media library: everything uploaded, plus pictures the site already uses.
const IMG_RE = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i;
const MEDIA_TABLES = ['slides', 'news', 'programmes', 'leaders', 'archdeaconries', 'gallery', 'videos', 'publications', 'articles',
  'executives', 'patrons', 'pastPresidents', 'magazines', 'newsletters', 'pages'];
adminApi.get('/media', (req, res) => {
  const all = MEDIA_TABLES.map(t => store.list(t));
  const blob = JSON.stringify([all, store.getSettings()]);
  const uploads = fs.readdirSync(uploadDir).filter(f => !f.startsWith('.')).map(f => {
    const st = fs.statSync(path.join(uploadDir, f));
    const url = '/uploads/' + f;
    return { name: f, url, size: st.size, mtime: st.mtimeMs, source: 'upload', kind: IMG_RE.test(f) ? 'image' : 'file', inUse: blob.includes(url) };
  }).sort((a, b) => b.mtime - a.mtime);
  const seen = new Set(uploads.map(u => u.url));
  const site = [];
  const walk = v => {
    if (typeof v === 'string') {
      if (IMG_RE.test(v) && !seen.has(v) && (v.startsWith('/') || /^https?:\/\//.test(v))) {
        seen.add(v);
        let name = v.split('?')[0].split('/').pop();
        try { name = decodeURIComponent(name); } catch (e) { /* keep raw name */ }
        site.push({ name, url: v, source: 'site', kind: 'image', inUse: true });
      }
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(all); walk(store.getSettings());
  res.json({ uploads, site: site.slice(0, 600) });
});
adminApi.delete('/media/:name', (req, res) => {
  const name = path.basename(req.params.name);
  const file = path.join(uploadDir, name);
  if (name.startsWith('.') || !fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(file);
  res.json({ ok: true });
});

// --- Users & access (full admins only; see the gate above) ---
const cleanUser = a => ({ id: a.id, username: a.username, display_name: a.display_name || '', role: isOwner(a) ? 'owner' : 'editor', permissions: isOwner(a) ? [] : permsOf(a), created_at: a.created_at || '' });
const ownerCount = () => store.listAdmins().filter(isOwner).length;

adminApi.get('/users', (req, res) => res.json({ users: store.listAdmins().map(cleanUser), me: req.admin.id }));

adminApi.post('/users', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  if (!/^[A-Za-z0-9._-]{3,30}$/.test(username)) return res.status(400).json({ error: 'Username must be 3–30 letters, numbers, dots, dashes or underscores.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  if (store.listAdmins().some(a => a.username.toLowerCase() === username.toLowerCase())) return res.status(400).json({ error: 'That username is already taken.' });
  const role = req.body.role === 'owner' ? 'owner' : 'editor';
  const permissions = (Array.isArray(req.body.permissions) ? req.body.permissions : []).filter(k => ALL_PERMS.includes(k));
  const id = store.addAdmin(username, bcrypt.hashSync(password, 10), { role, permissions: role === 'owner' ? [] : permissions, display_name: String(req.body.display_name || '').trim(), created_at: new Date().toISOString() });
  res.json({ id });
});

adminApi.put('/users/:id', (req, res) => {
  const target = store.getAdminById(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  const patch = {};
  if (req.body.display_name !== undefined) patch.display_name = String(req.body.display_name).trim();
  if (req.body.role !== undefined) {
    const role = req.body.role === 'owner' ? 'owner' : 'editor';
    if (role === 'editor' && isOwner(target) && ownerCount() <= 1) return res.status(400).json({ error: 'There must always be at least one full administrator.' });
    patch.role = role;
  }
  if (req.body.permissions !== undefined) patch.permissions = (Array.isArray(req.body.permissions) ? req.body.permissions : []).filter(k => ALL_PERMS.includes(k));
  if (req.body.password) {
    if (String(req.body.password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    patch.password_hash = bcrypt.hashSync(String(req.body.password), 10);
  }
  store.updateAdmin(target.id, patch);
  res.json({ ok: true });
});

adminApi.delete('/users/:id', (req, res) => {
  const target = store.getAdminById(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  if (target.id === req.admin.id) return res.status(400).json({ error: 'You cannot delete your own account while signed in.' });
  if (isOwner(target) && ownerCount() <= 1) return res.status(400).json({ error: 'There must always be at least one full administrator.' });
  store.removeAdmin(target.id);
  res.json({ ok: true });
});

// Anyone can change their own password.
adminApi.put('/me/password', (req, res) => {
  const { current, next: nextPw } = req.body;
  if (!bcrypt.compareSync(String(current || ''), req.admin.password_hash)) return res.status(400).json({ error: 'Your current password is not correct.' });
  if (String(nextPw || '').length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  store.updateAdmin(req.admin.id, { password_hash: bcrypt.hashSync(String(nextPw), 10) });
  res.json({ ok: true });
});

app.use('/api/admin', adminApi);

// 404
app.use((req, res) => {
  res.status(404).render('404', { settings: store.getSettings(), page: '' });
});

app.listen(PORT, () => {
  console.log(`AYF Akure website running at http://localhost:${PORT}`);
});
