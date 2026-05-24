require('dotenv').config();

const path = require('path');
const cors = require('cors');
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const apiBasePath = (process.env.API_BASE_PATH || '/api/drawsplat/mysql').replace(/\/+$/, '');
const port = Number(process.env.PORT || 8787);
const sessionTtlHours = Number(process.env.SESSION_TTL_HOURS || 24);

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  database: process.env.MYSQL_DATABASE || 'drawsplat',
  user: process.env.MYSQL_USER || 'drawsplat_app',
  password: process.env.MYSQL_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  ssl: process.env.MYSQL_SSL === 'true' ? {} : undefined
});

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '25mb' }));

// Serve the bundled parent portal HTML + JS so districts get the family-facing
// surface alongside the API. Static assets are mounted under /parent-portal/.
app.use('/parent-portal', express.static(path.join(__dirname, 'static')));

let dsAuth = null;
let dsLogEvent = async () => {};
let dsCheckBoardSafety = () => ({ ok: true });

// Phase 4b compliance routes (auth, parent requests, time limits, audit, config).
try {
  const { attachComplianceRoutes } = require('./compliance-routes');
  const handle = attachComplianceRoutes(app, pool, { basePath: apiBasePath, sessionTtlHours, pepper: process.env.DRAWSPLAT_PEPPER });
  dsAuth = handle.auth;
  dsLogEvent = handle.logEvent;
  dsCheckBoardSafety = handle.checkBoardSafety;
} catch (err) {
  console.error('Failed to attach compliance routes:', err.message);
}

// OAuth (Google + Microsoft).
try {
  const { attachOAuthRoutes } = require('./oauth-routes');
  attachOAuthRoutes(app, pool, {
    basePath: apiBasePath,
    sessionTtlHours,
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    logEvent: dsLogEvent
  });
} catch (err) {
  console.error('Failed to attach OAuth routes:', err.message);
}

// Realtime SSE channel.
let realtime = { publishUser: () => 0, publishBoard: () => 0 };
try {
  realtime = require('./realtime');
  if (dsAuth) realtime.attach(app, apiBasePath, dsAuth);
} catch (err) {
  console.error('Failed to attach realtime routes:', err.message);
}

// SIS / Clever connector (admin-only).
try {
  if (dsAuth) {
    const { attachSisRoutes } = require('./sis-clever');
    attachSisRoutes(app, pool, { basePath: apiBasePath, auth: dsAuth, logEvent: dsLogEvent });
  }
} catch (err) {
  console.error('Failed to attach SIS routes:', err.message);
}

// District Privacy Packet generator.
try {
  if (dsAuth) {
    const { attachPrivacyPacketRoute } = require('./privacy-packet');
    attachPrivacyPacketRoute(app, pool, { basePath: apiBasePath, auth: dsAuth, logEvent: dsLogEvent });
  }
} catch (err) {
  console.error('Failed to attach privacy packet route:', err.message);
}

function expiresAt(hours = sessionTtlHours){
  const date = new Date(Date.now() + Math.max(1, Number(hours || sessionTtlHours)) * 60 * 60 * 1000);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function ensureRoom(roomKey, title = null){
  const key = String(roomKey || '').trim();
  if(!key) throw Object.assign(new Error('roomKey is required'), { status: 400 });
  await pool.execute(
    'INSERT INTO rooms (room_key, title, expires_at) VALUES (:roomKey, :title, :expiresAt) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP',
    { roomKey: key, title, expiresAt: expiresAt() }
  );
  const [rows] = await pool.execute('SELECT id, room_key AS roomKey, title, frozen FROM rooms WHERE room_key = :roomKey', { roomKey: key });
  return rows[0];
}

async function loadComplianceConfig() {
  try {
    const [rows] = await pool.query("SELECT config_json FROM compliance_config WHERE config_key = 'main' LIMIT 1");
    return rows[0] ? rows[0].config_json : {};
  } catch (e) { return {}; }
}

function asyncRoute(handler){
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

app.get(apiBasePath + '/health', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true, provider: 'mysql', time: new Date().toISOString() });
}));

app.post(apiBasePath + '/rooms', asyncRoute(async (req, res) => {
  const room = await ensureRoom(req.body.roomKey, req.body.title || null);
  res.json({ ok: true, room });
}));

app.get(apiBasePath + '/rooms/:roomKey/board', asyncRoute(async (req, res) => {
  const room = await ensureRoom(req.params.roomKey);
  const [rows] = await pool.execute(
    'SELECT board_json AS boardJson, created_at AS createdAt FROM board_snapshots WHERE room_id = :roomId ORDER BY created_at DESC, id DESC LIMIT 1',
    { roomId: room.id }
  );
  res.json({ ok: true, room, board: rows[0] ? rows[0].boardJson : null, createdAt: rows[0] ? rows[0].createdAt : null });
}));

app.put(apiBasePath + '/rooms/:roomKey/board', asyncRoute(async (req, res) => {
  const room = await ensureRoom(req.params.roomKey, req.body.title || null);
  if(!req.body.board) return res.status(400).json({ ok: false, error: 'board is required' });

  if (room.frozen) {
    await dsLogEvent('BOARD_WRITE_BLOCKED', { actor: req.body.createdBy || null, targetType: 'room', targetId: String(req.params.roomKey), metadata: { reason: 'frozen' } });
    return res.status(423).json({ ok: false, error: 'board_frozen' });
  }

  const config = await loadComplianceConfig();
  const safety = dsCheckBoardSafety(req.body.board, config);
  if (!safety.ok) {
    await dsLogEvent('TEXT_FILTER_HIT', { actor: req.body.createdBy || null, targetType: 'room', targetId: String(req.params.roomKey), metadata: { hits: safety.hits.slice(0, 10) } });
    return res.status(422).json({ ok: false, error: safety.reason || 'safety_block', hits: safety.hits });
  }

  await pool.execute(
    'INSERT INTO board_snapshots (room_id, board_json, created_by, expires_at) VALUES (:roomId, CAST(:boardJson AS JSON), :createdBy, :expiresAt)',
    {
      roomId: room.id,
      boardJson: JSON.stringify(req.body.board),
      createdBy: req.body.createdBy || null,
      expiresAt: req.body.expiresAt || expiresAt()
    }
  );
  realtime.publishBoard(req.params.roomKey, 'board.updated', { roomKey: req.params.roomKey, createdBy: req.body.createdBy || null, at: new Date().toISOString() });
  res.json({ ok: true, room });
}));

app.get(apiBasePath + '/templates', asyncRoute(async (_req, res) => {
  const [rows] = await pool.execute('SELECT id, name, template_json AS templateJson, updated_at AS updatedAt FROM templates ORDER BY updated_at DESC, id DESC LIMIT 200');
  res.json({ ok: true, templates: rows.map(row => ({ id: row.id, name: row.name, template: row.templateJson, updatedAt: row.updatedAt })) });
}));

app.post(apiBasePath + '/templates', asyncRoute(async (req, res) => {
  if(!req.body.name || !req.body.template) return res.status(400).json({ ok: false, error: 'name and template are required' });
  const [result] = await pool.execute(
    'INSERT INTO templates (name, template_json) VALUES (:name, CAST(:templateJson AS JSON))',
    { name: req.body.name, templateJson: JSON.stringify(req.body.template) }
  );
  res.json({ ok: true, templateId: result.insertId });
}));

app.get(apiBasePath + '/turnins', asyncRoute(async (_req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, student_name AS studentName, class_name AS className, title, status, created_at AS createdAt FROM turnins ORDER BY created_at DESC, id DESC LIMIT 200'
  );
  res.json({ ok: true, turnins: rows });
}));

app.post(apiBasePath + '/turnins', asyncRoute(async (req, res) => {
  if(!req.body.board) return res.status(400).json({ ok: false, error: 'board is required' });
  let roomId = null;
  if(req.body.roomKey) roomId = (await ensureRoom(req.body.roomKey)).id;
  const config = await loadComplianceConfig();
  const safety = dsCheckBoardSafety(req.body.board, config);
  if (!safety.ok) {
    await dsLogEvent('TEXT_FILTER_HIT', { actor: req.body.studentName || null, targetType: 'turnin', metadata: { hits: safety.hits.slice(0, 10) } });
    return res.status(422).json({ ok: false, error: safety.reason || 'safety_block', hits: safety.hits });
  }
  const [result] = await pool.execute(
    'INSERT INTO turnins (room_id, student_name, class_name, title, board_json, expires_at) VALUES (:roomId, :studentName, :className, :title, CAST(:boardJson AS JSON), :expiresAt)',
    {
      roomId,
      studentName: req.body.studentName || null,
      className: req.body.className || null,
      title: req.body.title || null,
      boardJson: JSON.stringify(req.body.board),
      expiresAt: req.body.expiresAt || null
    }
  );
  res.json({ ok: true, turninId: result.insertId });
}));

app.delete(apiBasePath + '/sessions/:roomKey', asyncRoute(async (req, res) => {
  const [rows] = await pool.execute('SELECT id FROM rooms WHERE room_key = :roomKey', { roomKey: req.params.roomKey });
  if(!rows[0]) return res.json({ ok: true, deleted: false });
  await pool.execute('DELETE FROM rooms WHERE id = :roomId', { roomId: rows[0].id });
  res.json({ ok: true, deleted: true });
}));

app.post(apiBasePath + '/maintenance/delete-expired', asyncRoute(async (_req, res) => {
  const [snapshots] = await pool.execute('DELETE FROM board_snapshots WHERE expires_at IS NOT NULL AND expires_at < NOW()');
  const [turnins] = await pool.execute('DELETE FROM turnins WHERE expires_at IS NOT NULL AND expires_at < NOW()');
  const [rooms] = await pool.execute('DELETE FROM rooms WHERE expires_at IS NOT NULL AND expires_at < NOW()');
  res.json({ ok: true, deleted: { snapshots: snapshots.affectedRows, turnins: turnins.affectedRows, rooms: rooms.affectedRows } });
}));

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ ok: false, error: status === 500 ? 'Server error' : err.message });
});

// Cron-style retention + time-limit enforcement.
if (process.env.DRAWSPLAT_CRON !== '0') {
  try {
    const cron = require('./cron-jobs');
    cron.start(pool, { logEvent: dsLogEvent, publishUser: realtime.publishUser });
    console.log('DrawSplatTM cron jobs scheduled (retention + time-limit enforcement).');
  } catch (err) {
    console.error('Failed to start cron jobs:', err.message);
  }
}

app.listen(port, () => {
  console.log(`DrawSplatTM MySQL backend listening on http://localhost:${port}${apiBasePath}`);
});
