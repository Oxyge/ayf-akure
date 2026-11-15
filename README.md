# Akure Anglican Youth Fellowship — Website

A full-stack website for AYF, Diocese of Akure, replacing ayfakure.org.ng with a
modern, admin-manageable site.

**Stack:** Node.js + Express (server), EJS (server-rendered pages), a plain
JSON-file database (`data/ayf.json`, no native modules — nothing to compile),
vanilla HTML/CSS/JS (frontend + admin dashboard). No build step, no external
services required to run it.

## What's included

- **Public site** — Home, About (History/Vision/Leadership), Programmes, News
  (with individual article pages), Media (Gallery/Videos/Publications),
  Archdeaconries (with individual pages), Contact (working form).
- **Admin dashboard** at `/admin` — add/edit/delete News, Programmes, Leaders,
  Archdeaconries, Gallery photos, Videos, Publications, Homepage slider
  slides, Site Settings (contact info, social links, vision/mission text,
  logo), and read messages submitted through the Contact form. No developer
  needed for day-to-day updates.
- **JSON API** at `/api/*` (public, read-only) for anyone who wants to pull
  this content into another app, plus `/api/admin/*` (authenticated) used by
  the dashboard itself.
- **Real starting content** — the database is seeded with the actual
  history, leadership, and contact details from the current ayfakure.org.ng,
  including direct links to the real photos already hosted there, so the
  site isn't empty on first run. Replace these through the admin dashboard
  as you go.

## Running it locally

Requires Node.js 18+.

```bash
npm install
cp .env.example .env      # then edit .env — see below
npm run seed               # creates the database and an admin login
npm start                  # starts the site at http://localhost:3000
```

Visit `http://localhost:3000` for the public site and
`http://localhost:3000/admin` for the dashboard.

## Environment variables (`.env`)

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | Port the server listens on | `3000` |
| `SESSION_SECRET` | Random string used to sign admin login cookies | — set your own |
| `ADMIN_USERNAME` | Admin login username (used only the first time you run `npm run seed`) | `admin` |
| `ADMIN_PASSWORD` | Admin login password (used only the first time you run `npm run seed`) | `ChangeMe123!` |

**Change `ADMIN_PASSWORD` before your first `npm run seed`, and change
`SESSION_SECRET` to a long random string.** If you ever need to reset the
admin password afterwards, delete `data/ayf.json` and run `npm run seed`
again (note: this also re-seeds sample content, so back up first if you've
already added your own).

## Deploying it

This is a normal Node.js app, so it runs on any host that supports Node —
Render, Railway, a VPS, cPanel with Node support, etc. The two things to get
right:

1. **Persistent disk** — the database lives at `data/ayf.json` and uploaded
   photos live in `public/uploads/`. Make sure your host doesn't wipe these
   on redeploy (use a persistent volume, or point them at a mounted disk).
2. **Domain** — point `ayfakure.org.ng` at your new host once you're happy
   with the content, so existing links and search results keep working.

If you ever outgrow a single JSON file (very high traffic, multiple editors
saving at once), swap `db/jsonStore.js` for a real database client — every
other file in the app talks to it through the same handful of functions
(`list`, `getById`, `insert`, `update`, `remove`, `getSettings`,
`setSettings`), so the change is isolated to that one file.

## Content notes

- Leadership photos, the logo, and a few news photos currently point
  directly at files already hosted on `ayfakure.org.ng` (copied from the
  live site's homepage). Re-upload them through the admin dashboard
  whenever you're ready to host them yourself — the "Upload" button next to
  any image field handles that.
- The **Archdeaconries** list is seeded with the three confirmed real ones
  (Iju, Akure East, Idanre North — Iju includes its full 1996 founding
  history and first executive committee). Add the rest of the Diocese's
  Archdeaconries from the admin dashboard as you confirm their details.
- **News** is seeded with real headlines and summaries carried over from the
  current site's News & Event archive (about a dozen items spanning Diocesan
  and wider Anglican Communion news); add, edit, or delete freely from the
  dashboard. **Programmes** are seeded with a few starter entries.
- The contact form saves messages into the database (visible under
  **Messages** in the dashboard). If you want it to also send an email
  notification, add a mail provider (e.g. Nodemailer with your SMTP
  details) inside the `POST /contact` route in `server.js`.

## Project structure

```
server.js              Express app: routes, API, auth
db/jsonStore.js          The database engine (plain JSON file, no native deps)
db/seed.js               One-time seed data (real AYF content)
views/                  EJS templates for every public page + admin
public/css/style.css     Public site styles
public/css/admin.css     Admin dashboard styles
public/js/main.js        Public site behaviour (menu, slider, lightbox)
public/js/admin.js       Admin dashboard (CRUD, settings, messages)
public/uploads/          Photos/files uploaded via the dashboard
data/ayf.json             The database (created on first run)
```

## Keeping data and pictures between deploys (Render)

On Render's free plan the disk is wiped on every deploy or restart. To keep your content and uploaded
pictures, add a **Disk** to the service (mount path `/var/data`) and set two environment variables:

    DATA_DIR=/var/data/data
    UPLOAD_DIR=/var/data/uploads

Without them, the site stores everything inside the project folder as before.
