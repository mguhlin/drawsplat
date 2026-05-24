/**
 * DrawSplatTM RBAC — five-role permission tree for the MySQL backend.
 *
 * Each role inherits the privileges of less-powerful roles, except for
 * `parent`, which is a separate trust path (verified per student).
 *
 *   district_admin > campus_admin > teacher > student
 *                                         > parent (lateral, scoped)
 *
 * Endpoint owners pass either a role list to requireRoles([...]) or a named
 * permission to requirePermission('something') and this module decides who
 * passes. Anything not on the matrix is treated as district_admin-only.
 */

const crypto = require('crypto');

const ROLES = ['district_admin', 'campus_admin', 'teacher', 'student', 'parent'];

const RANK = {
  district_admin: 4,
  campus_admin: 3,
  teacher: 2,
  student: 1,
  parent: 1
};

const PERMISSIONS = {
  'config.read': ['district_admin', 'campus_admin'],
  'config.write': ['district_admin'],

  'roster.import': ['district_admin', 'campus_admin'],
  'roster.read': ['district_admin', 'campus_admin', 'teacher'],

  'user.list': ['district_admin', 'campus_admin'],
  'user.read.self': ['district_admin', 'campus_admin', 'teacher', 'student', 'parent'],
  'user.delete': ['district_admin'],
  'user.age_band.set': ['district_admin', 'campus_admin', 'teacher'],

  'audit.read': ['district_admin', 'campus_admin'],
  'audit.export': ['district_admin', 'campus_admin'],

  'parent.requests.list': ['district_admin', 'campus_admin', 'teacher'],
  'parent.requests.decide': ['district_admin', 'campus_admin', 'teacher'],
  'parent.requests.create': null,
  'parent.code.issue': ['district_admin', 'campus_admin', 'teacher'],

  'board.read': ['district_admin', 'campus_admin', 'teacher', 'student'],
  'board.write': ['district_admin', 'campus_admin', 'teacher', 'student'],
  'board.freeze': ['district_admin', 'campus_admin', 'teacher'],
  'board.delete': ['district_admin', 'campus_admin', 'teacher'],

  'time.heartbeat': ['district_admin', 'campus_admin', 'teacher', 'student'],
  'time.status.read': ['district_admin', 'campus_admin', 'teacher', 'student'],

  'sis.connect': ['district_admin'],
  'sis.sync.run': ['district_admin', 'campus_admin'],

  'realtime.subscribe': ['district_admin', 'campus_admin', 'teacher', 'student', 'parent'],

  'privacy_packet.download': ['district_admin', 'campus_admin'],

  'data.export.student': ['district_admin', 'campus_admin', 'teacher'],
  'data.delete.student': ['district_admin', 'campus_admin']
};

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest();
}

function constantTimeEqual(a, b) {
  try {
    return Buffer.isBuffer(a) && Buffer.isBuffer(b) && a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
}

function buildAuth(pool) {
  async function sessionUserFromRequest(req) {
    const auth = String(req.headers.authorization || '');
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) return null;
    const token = m[1];
    const [rows] = await pool.query(
      `SELECT s.id AS session_id, s.expires_at, u.*
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.session_token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > NOW()
       LIMIT 1`,
      [sha256(token)]
    );
    return rows[0] || null;
  }

  function requireRoles(roles) {
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

  function requirePermission(permName) {
    const allowed = PERMISSIONS[permName];
    if (allowed === null) {
      return async function(_req, _res, next) { next(); };
    }
    if (!allowed) return requireRoles(['district_admin']);
    return requireRoles(allowed);
  }

  function rolesFor(permName) {
    if (!(permName in PERMISSIONS)) return ['district_admin'];
    return PERMISSIONS[permName];
  }

  function hasRank(role, minimumRole) {
    return (RANK[role] || 0) >= (RANK[minimumRole] || 99);
  }

  return { sessionUserFromRequest, requireRoles, requirePermission, rolesFor, hasRank, sha256, constantTimeEqual };
}

module.exports = { buildAuth, PERMISSIONS, ROLES, RANK };
