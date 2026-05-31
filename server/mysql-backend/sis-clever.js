/**
 * DrawSplatTM SIS connector — Clever scaffold.
 *
 * Clever sits in front of district SIS systems (Skyward, PowerSchool, etc).
 * Once a district adds DrawSplatTM through their Clever district portal,
 * Clever issues a district token and we can pull rosters via:
 *
 *   GET https://api.clever.com/v3.0/users?role=student|teacher
 *   GET https://api.clever.com/v3.0/sections
 *   GET https://api.clever.com/v3.0/users/:id/contacts   (guardians)
 *
 * Auth is Bearer with the district token. This module exposes two surfaces:
 *
 *   1. /sis/clever/connect   — admin posts { districtToken } once after the
 *                              district approves the app inside Clever.
 *   2. /sis/clever/sync      — runs a sync now (and the scheduled job uses
 *                              the same function under the hood).
 *
 * Production deployments should swap the in-memory token store for a row
 * in `compliance_config` (config_key = 'sis:clever') or its own table.
 */

const CLEVER_BASE = 'https://api.clever.com/v3.0';

async function cleverGet(path, token) {
  const r = await fetch(CLEVER_BASE + path, { headers: { Authorization: 'Bearer ' + token } });
  if (!r.ok) throw new Error('clever_request_failed:' + r.status);
  return r.json();
}

async function loadDistrictToken(pool) {
  const [rows] = await pool.query("SELECT config_json FROM compliance_config WHERE config_key = 'sis:clever' LIMIT 1");
  if (!rows[0]) return null;
  const cfg = rows[0].config_json || {};
  return cfg.districtToken || null;
}

async function saveDistrictToken(pool, token, adminUserId) {
  await pool.execute(
    `INSERT INTO compliance_config (config_key, config_json, updated_by)
     VALUES ('sis:clever', CAST(:cfg AS JSON), :uid)
     ON DUPLICATE KEY UPDATE config_json = VALUES(config_json), updated_by = VALUES(updated_by)`,
    { cfg: JSON.stringify({ districtToken: token, connectedAt: new Date().toISOString() }), uid: adminUserId || null }
  );
}

async function runRosterSync(pool, logEvent) {
  const token = await loadDistrictToken(pool);
  if (!token) return { ok: false, error: 'no_district_token' };
  const counts = { teachersUpserted: 0, studentsUpserted: 0, sectionsSeen: 0 };

  let next = '/users?role=teacher&limit=100';
  while (next) {
    const page = await cleverGet(next, token);
    for (const teacher of (page.data || [])) {
      const t = teacher.data || teacher;
      if (!t.email) continue;
      await pool.execute(
        `INSERT INTO users (email, display_name, role, provider, external_id)
         VALUES (?, ?, 'teacher', 'clever', ?)
         ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), provider = 'clever', external_id = VALUES(external_id), updated_at = NOW()`,
        [String(t.email).toLowerCase(), `${t.name && t.name.first || ''} ${t.name && t.name.last || ''}`.trim() || t.email, t.id]
      );
      counts.teachersUpserted++;
    }
    next = page.links && page.links.find && page.links.find(l => l.rel === 'next') ? page.links.find(l => l.rel === 'next').uri.replace(CLEVER_BASE, '') : null;
  }

  next = '/users?role=student&limit=100';
  while (next) {
    const page = await cleverGet(next, token);
    for (const student of (page.data || [])) {
      const s = student.data || student;
      const name = `${s.name && s.name.first || ''} ${s.name && s.name.last || ''}`.trim() || s.id;
      const ageBand = computeAgeBand(s.grade);
      await pool.execute(
        `INSERT INTO users (student_name, email, role, provider, external_id, age_band, age_source)
         VALUES (?, ?, 'student', 'clever', ?, ?, 'sis')
         ON DUPLICATE KEY UPDATE student_name = VALUES(student_name), provider = 'clever', age_band = VALUES(age_band), age_source = 'sis', updated_at = NOW()`,
        [name, s.email ? String(s.email).toLowerCase() : null, s.id, ageBand]
      );
      counts.studentsUpserted++;
    }
    next = page.links && page.links.find && page.links.find(l => l.rel === 'next') ? page.links.find(l => l.rel === 'next').uri.replace(CLEVER_BASE, '') : null;
  }

  await logEvent('SIS_SYNC', { actor: 'system', actorRole: 'system', targetType: 'sis_clever', metadata: counts });
  return { ok: true, counts };
}

function computeAgeBand(grade) {
  const g = String(grade || '').trim().toLowerCase();
  const numeric = Number(g);
  if (g === 'kindergarten' || g === 'k' || g === 'prek' || g === 'pre-k') return 'under_13';
  if (!Number.isNaN(numeric)) {
    if (numeric <= 7) return 'under_13';
    if (numeric <= 12) return '13_to_17';
  }
  return 'unknown_minor';
}

function attachSisRoutes(app, pool, options) {
  const basePath = options.basePath;
  const auth = options.auth;
  const logEvent = options.logEvent || (async () => {});

  app.post(basePath + '/sis/clever/connect', auth.requirePermission('sis.connect'), async (req, res) => {
    try {
      const token = String((req.body && req.body.districtToken) || '').trim();
      if (!token) return res.status(400).json({ ok: false, error: 'districtToken_required' });
      await saveDistrictToken(pool, token, req.dsUser.id);
      await logEvent('SIS_CONNECTED', { actor: req.dsUser.email, actorUserId: req.dsUser.id, actorRole: req.dsUser.role, targetType: 'sis_clever' });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Server error' });
    }
  });

  app.post(basePath + '/sis/clever/sync', auth.requirePermission('sis.sync.run'), async (req, res) => {
    try {
      const result = await runRosterSync(pool, async (action, payload) => {
        await logEvent(action, Object.assign({ actor: req.dsUser.email, actorUserId: req.dsUser.id, actorRole: req.dsUser.role }, payload));
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Server error' });
    }
  });

  app.get(basePath + '/sis/clever/status', auth.requirePermission('sis.connect'), async (_req, res) => {
    const token = await loadDistrictToken(pool);
    res.json({ ok: true, connected: !!token });
  });
}

module.exports = { attachSisRoutes, runRosterSync };
