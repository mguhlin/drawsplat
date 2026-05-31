/**
 * DrawSplatTM OAuth — Google + Microsoft token-verification routes.
 *
 * The browser performs the OAuth dance with Google Identity Services or
 * MSAL.js (same approach the /community/ board already uses), then POSTs the
 * resulting ID token to this backend. The server verifies the token against
 * the provider, upserts the user row, and issues the same HMAC-style bearer
 * session that /auth/login issues for email/password users.
 *
 * Network calls use the global fetch() built into Node 18+. No extra deps.
 */

const crypto = require('crypto');
const { createRateLimiter, normalizeEmail, chooseSelfRegisteredRole } = require('./security');

function generateSessionToken() { return crypto.randomBytes(32).toString('base64url'); }
function sha256(value) { return crypto.createHash('sha256').update(String(value)).digest(); }

async function verifyGoogle(idToken, expectedAudience) {
  const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken);
  const r = await fetch(url, { method: 'GET' });
  if (!r.ok) throw new Error('google_token_invalid');
  const payload = await r.json();
  if (expectedAudience && payload.aud !== expectedAudience) throw new Error('google_audience_mismatch');
  if (!payload.email_verified || payload.email_verified === 'false') throw new Error('google_email_unverified');
  return {
    provider: 'google',
    subject: payload.sub,
    email: normalizeEmail(payload.email),
    displayName: payload.name || payload.email,
    pictureUrl: payload.picture || null
  };
}

async function verifyMicrosoft(accessToken) {
  const r = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: 'Bearer ' + accessToken }
  });
  if (!r.ok) throw new Error('microsoft_token_invalid');
  const payload = await r.json();
  const email = payload.mail || payload.userPrincipalName || null;
  if (!email) throw new Error('microsoft_email_missing');
  return {
    provider: 'microsoft',
    subject: payload.id,
    email: String(email).toLowerCase(),
    displayName: payload.displayName || email,
    pictureUrl: null
  };
}

async function issueSession(pool, userRow, req, sessionTtlHours) {
  const token = generateSessionToken();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + Math.max(1, Number(sessionTtlHours || 24)) * 3600 * 1000);
  await pool.execute(
    `INSERT INTO sessions (id, user_id, session_token_hash, ip, user_agent, expires_at)
     VALUES (:id, :uid, :hash, :ip, :ua, :exp)`,
    {
      id: sessionId,
      uid: userRow.id,
      hash: sha256(token),
      ip: req.ip || null,
      ua: String(req.headers['user-agent'] || '').slice(0, 500),
      exp: expiresAt
    }
  );
  await pool.execute('UPDATE users SET last_seen_at = NOW() WHERE id = ?', [userRow.id]);
  return { token, expiresAt: expiresAt.toISOString() };
}

async function upsertProviderUser(pool, profile, defaultRole) {
  const assignedRole = chooseSelfRegisteredRole(defaultRole, profile.email);
  const [existing] = await pool.query(
    `SELECT * FROM users WHERE (provider = ? AND provider_subject = ?) OR (email = ? AND deleted_at IS NULL) LIMIT 1`,
    [profile.provider, profile.subject, profile.email]
  );
  if (existing[0]) {
    await pool.execute(
      `UPDATE users SET provider = ?, provider_subject = ?, display_name = COALESCE(?, display_name), updated_at = NOW() WHERE id = ?`,
      [profile.provider, profile.subject, profile.displayName || null, existing[0].id]
    );
    return existing[0];
  }
  const [r] = await pool.execute(
    `INSERT INTO users (email, display_name, role, provider, provider_subject)
     VALUES (?, ?, ?, ?, ?)`,
    [profile.email, profile.displayName || '', assignedRole, profile.provider, profile.subject]
  );
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [r.insertId]);
  return rows[0];
}

function attachOAuthRoutes(app, pool, options) {
  const basePath = options.basePath;
  const sessionTtlHours = options.sessionTtlHours || 24;
  const googleClientId = options.googleClientId || process.env.GOOGLE_CLIENT_ID || '';
  const logEvent = options.logEvent || (async () => {});
  const authLimiter = createRateLimiter({ scope: 'oauth', windowMs: 15 * 60 * 1000, max: Number(process.env.AUTH_RATE_LIMIT_PER_15_MIN || 20) });

  app.post(basePath + '/auth/google', authLimiter, async (req, res) => {
    try {
      const idToken = String((req.body && req.body.idToken) || '');
      if (!idToken) return res.status(400).json({ ok: false, error: 'idToken_required' });
      const profile = await verifyGoogle(idToken, googleClientId || null);
      const user = await upsertProviderUser(pool, profile, (req.body && req.body.role) || 'teacher');
      const { token, expiresAt } = await issueSession(pool, user, req, sessionTtlHours);
      await logEvent('LOGIN', { actor: user.email, actorUserId: user.id, actorRole: user.role, targetType: 'session', metadata: { provider: 'google' } });
      res.json({ ok: true, token, expiresAt, user: { id: user.id, email: user.email, role: user.role, displayName: user.display_name } });
    } catch (err) {
      res.status(401).json({ ok: false, error: 'invalid_oauth_token' });
    }
  });

  app.post(basePath + '/auth/microsoft', authLimiter, async (req, res) => {
    try {
      const accessToken = String((req.body && req.body.accessToken) || '');
      if (!accessToken) return res.status(400).json({ ok: false, error: 'accessToken_required' });
      const profile = await verifyMicrosoft(accessToken);
      const user = await upsertProviderUser(pool, profile, (req.body && req.body.role) || 'teacher');
      const { token, expiresAt } = await issueSession(pool, user, req, sessionTtlHours);
      await logEvent('LOGIN', { actor: user.email, actorUserId: user.id, actorRole: user.role, targetType: 'session', metadata: { provider: 'microsoft' } });
      res.json({ ok: true, token, expiresAt, user: { id: user.id, email: user.email, role: user.role, displayName: user.display_name } });
    } catch (err) {
      res.status(401).json({ ok: false, error: 'invalid_oauth_token' });
    }
  });
}

module.exports = { attachOAuthRoutes, verifyGoogle, verifyMicrosoft };
