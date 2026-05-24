/**
 * DrawSplat compliance routes for the MySQL backend (Phase 4b).
 *
 * Mounts the Phase 4 compliance endpoints on the same Express app as the
 * existing rooms / boards / templates / turnins routes in server.js. Mirrors
 * the surface area we built on the Apps Script side so the static client
 * can switch between backends by changing the URL.
 *
 * NOTE: This file is scaffolded but has not yet been exercised against a
 * live MySQL instance. The schema lives in migrations/002_compliance.sql.
 * Bugs may exist; once a real database is available, plan to run an
 * integration test suite before relying on this in production.
 */

const crypto = require('crypto');

function attachComplianceRoutes(app, pool, options = {}) {
  const basePath = (options.basePath || '/api/drawsplat/mysql').replace(/\/+$/, '');
  const sessionTtlHours = Number(options.sessionTtlHours || 24);
  const pepper = String(options.pepper || process.env.DRAWSPLAT_PEPPER || 'change-this-pepper');

  /* --- Auth helpers ----------------------------------------------------- */

  function hashPassword(password, salt) {
    return crypto.scryptSync(String(password), Buffer.concat([Buffer.from(pepper, 'utf8'), salt]), 64);
  }
  function generateSalt() { return crypto.randomBytes(32); }
  function generateSessionToken() { return crypto.randomBytes(32).toString('base64url'); }
  function sha256(value) { return crypto.createHash('sha256').update(String(value)).digest(); }
  function constantTimeEqual(a, b) {
    try { return Buffer.isBuffer(a) && Buffer.isBuffer(b) && a.length === b.length && crypto.timingSafeEqual(a, b); }
    catch (e) { return false; }
  }
  async function logEvent(conn, action, payload) {
    try {
      await conn.execute(
        `INSERT INTO audit_events (actor, actor_user_id, actor_role, action, target_type, target_id, metadata_json)
         VALUES (:actor, :actorUserId, :actorRole, :action, :targetType, :targetId, :metadata)`,
        {
          actor: String(payload.actor || ''),
          actorUserId: payload.actorUserId || null,
          actorRole: payload.actorRole || null,
          action: action,
          targetType: payload.targetType || null,
          targetId: payload.targetId || null,
          metadata: payload.metadata ? JSON.stringify(payload.metadata) : null
        }
      );
    } catch (err) {
      console.error('audit_events insert failed', err);
    }
  }
  async function sessionUserFromRequest(req) {
    const auth = String(req.headers.authorization || '');
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) return null;
    const token = m[1];
    const tokenHash = sha256(token);
    const [rows] = await pool.query(
      `SELECT s.id AS session_id, s.expires_at, u.*
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.session_token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );
    return rows[0] || null;
  }
  function requireRole(roles) {
    return async function(req, res, next) {
      const user = await sessionUserFromRequest(req);
      if (!user) return res.status(401).json({ ok: false, error: 'auth_required' });
      if (Array.isArray(roles) && roles.length && roles.indexOf(user.role) === -1) {
        return res.status(403).json({ ok: false, error: 'forbidden', role: user.role });
      }
      req.dsUser = user;
      next();
    };
  }

  /* --- Auth endpoints --------------------------------------------------- */

  app.post(basePath + '/auth/register', async (req, res) => {
    try {
      const { email, password, displayName, role } = req.body || {};
      if (!email || !password || password.length < 8) return res.status(400).json({ ok: false, error: 'Invalid email or short password.' });
      const salt = generateSalt();
      const hash = hashPassword(password, salt);
      const [r] = await pool.execute(
        `INSERT INTO users (email, display_name, role, provider, password_hash, password_salt)
         VALUES (:email, :displayName, :role, 'email', :hash, :salt)`,
        { email, displayName: displayName || '', role: role && ['district_admin','campus_admin','teacher','parent'].indexOf(role) !== -1 ? role : 'teacher', hash, salt }
      );
      await logEvent(pool, 'USER_CREATED', { actor: email, actorUserId: r.insertId, actorRole: role || 'teacher', targetType: 'user', targetId: String(r.insertId), metadata: { provider: 'email' } });
      res.json({ ok: true, userId: r.insertId });
    } catch (err) {
      res.status(err.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ ok: false, error: err.message });
    }
  });

  app.post(basePath + '/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body || {};
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1', [email]);
      const user = rows[0];
      if (!user || !user.password_hash || !user.password_salt) return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
      const computed = hashPassword(password, user.password_salt);
      if (!constantTimeEqual(computed, user.password_hash)) return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
      const token = generateSessionToken();
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + sessionTtlHours * 3600 * 1000);
      await pool.execute(
        `INSERT INTO sessions (id, user_id, session_token_hash, ip, user_agent, expires_at)
         VALUES (:id, :uid, :hash, :ip, :ua, :exp)`,
        { id: sessionId, uid: user.id, hash: sha256(token), ip: req.ip || null, ua: String(req.headers['user-agent'] || '').slice(0, 500), exp: expiresAt }
      );
      await pool.execute('UPDATE users SET last_seen_at = NOW() WHERE id = ?', [user.id]);
      await logEvent(pool, 'LOGIN', { actor: user.email, actorUserId: user.id, actorRole: user.role, targetType: 'session', targetId: sessionId });
      res.json({ ok: true, token, expiresAt: expiresAt.toISOString(), user: { id: user.id, email: user.email, role: user.role, displayName: user.display_name } });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.post(basePath + '/auth/logout', requireRole(), async (req, res) => {
    const auth = String(req.headers.authorization || '');
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (m) await pool.execute('UPDATE sessions SET revoked_at = NOW() WHERE session_token_hash = ?', [sha256(m[1])]);
    res.json({ ok: true });
  });

  /* --- Roster import (Phase 4a parity) ---------------------------------- */

  app.post(basePath + '/admin/roster-import', requireRole(['district_admin','campus_admin']), async (req, res) => {
    try {
      const { rows } = req.body || {};
      if (!Array.isArray(rows)) return res.status(400).json({ ok: false, error: 'Body must include rows: [...] of student objects.' });
      let created = 0, updated = 0;
      for (const row of rows) {
        const studentName = String(row.studentName || '').trim();
        if (!studentName) continue;
        const className = String(row.className || '').trim();
        const [existing] = await pool.query(
          'SELECT * FROM users WHERE student_name = ? AND class_name = ? AND role = "student" LIMIT 1',
          [studentName, className]
        );
        if (existing[0]) {
          await pool.execute(
            `UPDATE users SET email = COALESCE(?, email), age_band = COALESCE(?, age_band), age_source = ?, updated_at = NOW() WHERE id = ?`,
            [row.email || null, row.ageBand || null, row.ageSource || 'roster', existing[0].id]
          );
          updated++;
        } else {
          const [r] = await pool.execute(
            `INSERT INTO users (student_name, class_name, email, role, age_band, age_source, provider)
             VALUES (:name, :class, :email, 'student', :band, :src, 'manual')`,
            { name: studentName, class: className, email: row.email || null, band: row.ageBand || 'unknown_minor', src: row.ageSource || 'roster' }
          );
          created++;
          await logEvent(pool, 'USER_CREATED', { actor: req.dsUser.email, actorUserId: req.dsUser.id, actorRole: req.dsUser.role, targetType: 'user', targetId: String(r.insertId), metadata: { source: 'roster_import' } });
        }
      }
      await logEvent(pool, 'ROSTER_IMPORT', { actor: req.dsUser.email, actorUserId: req.dsUser.id, actorRole: req.dsUser.role, targetType: 'roster', metadata: { created, updated, totalRows: rows.length } });
      res.json({ ok: true, created, updated });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  /* --- Parent request flow --------------------------------------------- */

  app.post(basePath + '/parent/request', async (req, res) => {
    try {
      const id = crypto.randomUUID();
      const { parentName, parentEmail, studentName, className, requestType, details, verificationCode } = req.body || {};
      if (!parentName || !parentEmail || !studentName || !requestType) return res.status(400).json({ ok: false, error: 'Missing required fields.' });
      let status = 'pending_verification';
      let studentUserId = null;
      const [students] = await pool.query('SELECT * FROM users WHERE student_name = ? AND class_name = ? AND role = "student" LIMIT 1', [studentName, className || '']);
      if (students[0]) {
        studentUserId = students[0].id;
        if (verificationCode && students[0].parent_code_hash) {
          const hash = sha256(String(verificationCode || '').toUpperCase());
          if (constantTimeEqual(hash, students[0].parent_code_hash) && (!students[0].parent_code_expires_at || new Date(students[0].parent_code_expires_at) > new Date())) {
            status = 'verified';
            await pool.execute('UPDATE users SET parent_code_hash = NULL, parent_code_expires_at = NULL WHERE id = ?', [studentUserId]);
          }
        }
      }
      await pool.execute(
        `INSERT INTO parent_requests (id, parent_name, parent_email, student_user_id, student_name, class_name, request_type, details, status)
         VALUES (:id, :pn, :pe, :sid, :sn, :cn, :rt, :d, :s)`,
        { id, pn: parentName, pe: parentEmail, sid: studentUserId, sn: studentName, cn: className || null, rt: requestType, d: details || null, s: status }
      );
      await logEvent(pool, 'PARENT_REQUEST_CREATED', { actor: parentEmail, actorRole: 'parent', targetType: 'parent_request', targetId: id, metadata: { requestType, status } });
      res.json({ ok: true, id, status });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get(basePath + '/admin/parent-requests', requireRole(['district_admin','campus_admin','teacher']), async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM parent_requests ORDER BY created_at DESC LIMIT 200');
      res.json({ ok: true, requests: rows });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  /* --- Time-limit heartbeat + status ------------------------------------ */

  app.post(basePath + '/time/heartbeat', requireRole(['student','teacher']), async (req, res) => {
    try {
      const delta = Math.max(1, Math.min(90, Number(req.body && req.body.deltaSeconds) || 30));
      const day = new Date().toISOString().slice(0, 10);
      await pool.execute(
        `INSERT INTO time_usage (user_id, usage_date, seconds_today, session_start, last_beat)
         VALUES (:uid, :day, :delta, NOW(), NOW())
         ON DUPLICATE KEY UPDATE seconds_today = seconds_today + VALUES(seconds_today), last_beat = NOW()`,
        { uid: req.dsUser.id, day, delta }
      );
      const [rows] = await pool.query('SELECT seconds_today FROM time_usage WHERE user_id = ? AND usage_date = ? LIMIT 1', [req.dsUser.id, day]);
      res.json({ ok: true, secondsToday: rows[0] ? rows[0].seconds_today : 0 });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get(basePath + '/time/status', requireRole(), async (req, res) => {
    try {
      const day = new Date().toISOString().slice(0, 10);
      const [rows] = await pool.query('SELECT seconds_today FROM time_usage WHERE user_id = ? AND usage_date = ? LIMIT 1', [req.dsUser.id, day]);
      const [cfg] = await pool.query('SELECT config_json FROM compliance_config WHERE config_key = "main" LIMIT 1');
      const config = cfg[0] && cfg[0].config_json ? cfg[0].config_json : {};
      res.json({ ok: true, secondsToday: rows[0] ? rows[0].seconds_today : 0, config: config.timeLimits || {} });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  /* --- Compliance config get / set ------------------------------------- */

  app.get(basePath + '/admin/compliance-config', requireRole(['district_admin','campus_admin']), async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT config_json, updated_at FROM compliance_config WHERE config_key = "main" LIMIT 1');
      res.json({ ok: true, config: rows[0] ? rows[0].config_json : null, updatedAt: rows[0] ? rows[0].updated_at : null });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.put(basePath + '/admin/compliance-config', requireRole(['district_admin']), async (req, res) => {
    try {
      const config = req.body && req.body.config;
      if (!config || typeof config !== 'object') return res.status(400).json({ ok: false, error: 'Missing config object.' });
      await pool.execute(
        `INSERT INTO compliance_config (config_key, config_json, updated_by)
         VALUES ('main', :cfg, :uid)
         ON DUPLICATE KEY UPDATE config_json = VALUES(config_json), updated_by = VALUES(updated_by)`,
        { cfg: JSON.stringify(config), uid: req.dsUser.id }
      );
      await logEvent(pool, 'ADMIN_SETTING_CHANGED', { actor: req.dsUser.email, actorUserId: req.dsUser.id, actorRole: req.dsUser.role, targetType: 'compliance_config', metadata: { keys: Object.keys(config) } });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  /* --- Audit log read --------------------------------------------------- */

  app.get(basePath + '/admin/audit', requireRole(['district_admin','campus_admin']), async (req, res) => {
    try {
      const limit = Math.max(1, Math.min(1000, Number(req.query.limit) || 200));
      const params = [];
      const where = [];
      if (req.query.action) { where.push('action = ?'); params.push(String(req.query.action)); }
      if (req.query.actor) { where.push('actor LIKE ?'); params.push('%' + String(req.query.actor) + '%'); }
      if (req.query.since) { where.push('created_at >= ?'); params.push(String(req.query.since)); }
      const sql = 'SELECT * FROM audit_events' + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY created_at DESC LIMIT ' + limit;
      const [rows] = await pool.query(sql, params);
      res.json({ ok: true, events: rows });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  return { basePath };
}

module.exports = { attachComplianceRoutes };
