require('dotenv').config();

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
  const [rows] = await pool.execute('SELECT id, room_key AS roomKey, title FROM rooms WHERE room_key = :roomKey', { roomKey: key });
  return rows[0];
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
  await pool.execute(
    'INSERT INTO board_snapshots (room_id, board_json, created_by, expires_at) VALUES (:roomId, CAST(:boardJson AS JSON), :createdBy, :expiresAt)',
    {
      roomId: room.id,
      boardJson: JSON.stringify(req.body.board),
      createdBy: req.body.createdBy || null,
      expiresAt: req.body.expiresAt || expiresAt()
    }
  );
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

app.listen(port, () => {
  console.log(`DrawSplatTM MySQL backend listening on http://localhost:${port}${apiBasePath}`);
});
