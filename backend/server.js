'use strict';

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const Database = require('better-sqlite3');

const app  = express();
const PORT = process.env.PORT || 8080;
const DB_PATH = process.env.DB_PATH || '/data/vss.db';

// ── Middleware ────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));

// ── Database setup ────────────────────────────────────────
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS visitors (
    id          TEXT PRIMARY KEY,
    first       TEXT,
    last        TEXT,
    company     TEXT,
    email       TEXT,
    phone       TEXT,
    host        TEXT,
    host_email  TEXT,
    purpose     TEXT,
    arrived     TEXT,
    departed    TEXT,
    status      TEXT DEFAULT 'in',
    visit_date  TEXT,
    auto_signoff INTEGER DEFAULT 0,
    next_id     INTEGER,
    color_bg    TEXT,
    color_fg    TEXT,
    initials    TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS employees (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    email     TEXT,
    dept      TEXT,
    webhook   TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS next_id (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    val INTEGER DEFAULT 1
  );
  INSERT OR IGNORE INTO next_id (id, val) VALUES (1, 1);
`);

// ── Helper ────────────────────────────────────────────────
function getNextId() {
  const row = db.prepare('SELECT val FROM next_id WHERE id = 1').get();
  const val = row ? row.val : 1;
  db.prepare('UPDATE next_id SET val = val + 1 WHERE id = 1').run();
  return 'VIS-' + String(val).padStart(4, '0');
}

// ── VISITORS ──────────────────────────────────────────────
// GET all visitors (optionally filter by status or date)
app.get('/api/visitors', (req, res) => {
  try {
    let sql = 'SELECT * FROM visitors ORDER BY created_at DESC';
    const rows = db.prepare(sql).all();
    res.json(rows.map(rowToVisitor));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST new visitor
app.post('/api/visitors', (req, res) => {
  try {
    const v = req.body;
    const id = getNextId();
    db.prepare(`
      INSERT INTO visitors (id, first, last, company, email, phone, host, host_email, purpose, arrived, status, visit_date, color_bg, color_fg, initials)
      VALUES (@id, @first, @last, @company, @email, @phone, @host, @hostEmail, @purpose, @arrived, 'in', @date, @cbg, @cfg, @ini)
    `).run({
      id,
      first:     v.first || '',
      last:      v.last  || '',
      company:   v.company || '',
      email:     v.email || '',
      phone:     v.phone || '',
      host:      v.host  || '',
      hostEmail: v.hostEmail || '',
      purpose:   v.purpose || '',
      arrived:   v.arrived || '',
      date:      new Date().toDateString(),
      cbg:       v.cbg || '#DDEEFF',
      cfg:       v.cfg || '#003A96',
      ini:       v.ini || 'VV'
    });
    const row = db.prepare('SELECT * FROM visitors WHERE id = ?').get(id);
    res.json(rowToVisitor(row));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH visitor (sign out, auto sign-off)
app.patch('/api/visitors/:id', (req, res) => {
  try {
    const { departed, status, autoSignOff } = req.body;
    db.prepare(`
      UPDATE visitors SET departed = @departed, status = @status, auto_signoff = @auto WHERE id = @id
    `).run({ departed: departed || '', status: status || 'out', auto: autoSignOff ? 1 : 0, id: req.params.id });
    const row = db.prepare('SELECT * FROM visitors WHERE id = ?').get(req.params.id);
    res.json(rowToVisitor(row));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

function rowToVisitor(r) {
  if (!r) return null;
  return {
    id: r.id, first: r.first, last: r.last, company: r.company,
    email: r.email, phone: r.phone, host: r.host, hostEmail: r.host_email,
    purpose: r.purpose, arrived: r.arrived, departed: r.departed,
    status: r.status, date: r.visit_date, autoSignOff: r.auto_signoff === 1,
    cbg: r.color_bg, cfg: r.color_fg, ini: r.initials
  };
}

// ── EMPLOYEES ─────────────────────────────────────────────
// GET all employees
app.get('/api/employees', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM employees ORDER BY name').all();
    res.json(rows.map(r => ({ id: r.id, name: r.name, email: r.email, dept: r.dept, webhook: r.webhook })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST bulk replace employees (import)
app.post('/api/employees', (req, res) => {
  try {
    const emps = req.body; // array
    if (!Array.isArray(emps)) return res.status(400).json({ error: 'Expected array' });
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM employees').run();
      const ins = db.prepare('INSERT INTO employees (name, email, dept, webhook) VALUES (@name, @email, @dept, @webhook)');
      emps.forEach(e => ins.run({ name: e.name || '', email: e.email || '', dept: e.dept || '', webhook: e.webhook || '' }));
    });
    tx();
    res.json({ count: emps.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH single employee webhook
app.patch('/api/employees/:id', (req, res) => {
  try {
    const { webhook } = req.body;
    db.prepare('UPDATE employees SET webhook = ? WHERE id = ?').run(webhook || '', req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE all employees
app.delete('/api/employees', (req, res) => {
  try {
    db.prepare('DELETE FROM employees').run();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── SETTINGS ──────────────────────────────────────────────
// GET all settings
app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const obj = {};
    rows.forEach(r => { try { obj[r.key] = JSON.parse(r.value); } catch(e) { obj[r.key] = r.value; } });
    res.json(obj);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT single setting
app.put('/api/settings/:key', (req, res) => {
  try {
    const val = JSON.stringify(req.body.value);
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(req.params.key, val);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE single setting
app.delete('/api/settings/:key', (req, res) => {
  try {
    db.prepare('DELETE FROM settings WHERE key = ?').run(req.params.key);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── HEALTH ────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ── START ─────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`VSS API running on port ${PORT}`);
  console.log(`Database: ${DB_PATH}`);
});
