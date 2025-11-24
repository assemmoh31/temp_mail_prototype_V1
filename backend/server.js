const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { randomBytes } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database('./temp_mail.db');

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS inboxes (
      id TEXT PRIMARY KEY,
      created_at INTEGER
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inbox_id TEXT,
      sender TEXT,
      recipient TEXT,
      subject TEXT,
      body TEXT,
      received_at INTEGER
    )`
  );
});

app.post('/api/generate', (req, res) => {
  const id = randomBytes(6).toString('hex');
  const now = Date.now();
  db.run(
    'INSERT INTO inboxes (id, created_at) VALUES (?, ?)',
    [id, now],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id });
    }
  );
});

app.get('/api/domains', (req, res) => {
  // Return configured domains
  res.json({ domains: ['tempmail.local', 'example.tempmail'] });
});

// Simple health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/inbox/:id/messages', (req, res) => {
  const inboxId = req.params.id;
  db.all(
    'SELECT id, sender, recipient, subject, body, received_at FROM messages WHERE inbox_id = ? ORDER BY received_at DESC',
    [inboxId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ messages: rows });
    }
  );
});

app.post('/api/receive', (req, res) => {
  const { to, from, subject, body } = req.body;
  if (!to || !from) return res.status(400).json({ error: 'missing to/from' });

  // Derive inbox_id from 'to' address before @ if it looks like u123@...
  const inboxId = (to || '').split('@')[0];
  const now = Date.now();

  db.get('SELECT id FROM inboxes WHERE id = ?', [inboxId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!row) {
      // Create inbox on-demand
      db.run('INSERT INTO inboxes (id, created_at) VALUES (?, ?)', [inboxId, now]);
    }

    db.run(
      'INSERT INTO messages (inbox_id, sender, recipient, subject, body, received_at) VALUES (?, ?, ?, ?, ?, ?)',
      [inboxId, from, to, subject || '', body || '', now],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ ok: true, messageId: this.lastID });
      }
    );
  });
});

// Bind explicitly to IPv4 loopback to avoid IPv6/hostname bind issues on Windows
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Temp mail backend listening on ${PORT} (127.0.0.1)`);
}).on('error', (err) => {
  console.error('Failed to start server:', err && err.message ? err.message : err);
  process.exit(1);
});
