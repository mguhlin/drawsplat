const crypto = require('crypto');

const DEFAULT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function parseAllowedOrigins(value) {
  return String(value || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

function buildCorsOptions() {
  const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);

  return {
    origin(origin, callback) {
      if (allowedOrigins.length === 0) return callback(null, true);
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('cors_origin_not_allowed'));
    },
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600
  };
}

function securityHeaders(_req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
  });
  next();
}

function clientKey(req, scope) {
  const auth = String(req.headers.authorization || '');
  const tokenPrefix = auth ? crypto.createHash('sha256').update(auth).digest('hex').slice(0, 16) : '';
  return [scope, req.ip || req.socket.remoteAddress || 'unknown', tokenPrefix].join(':');
}

function createRateLimiter(options = {}) {
  const requestedWindow = Number(options.windowMs);
  const requestedMax = Number(options.max);
  const windowMs = Number.isFinite(requestedWindow) ? Math.max(1000, requestedWindow) : DEFAULT_RATE_LIMIT_WINDOW_MS;
  const max = Number.isFinite(requestedMax) ? Math.max(1, requestedMax) : 100;
  const scope = options.scope || 'global';
  const buckets = new Map();

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const key = clientKey(req, scope);
    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    current.count += 1;
    if (current.count > max) {
      res.set('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
      return res.status(429).json({ ok: false, error: 'rate_limited' });
    }
    next();
  };
}

function requireMaintenanceAuth(auth) {
  return async function(req, res, next) {
    const token = String(process.env.MAINTENANCE_TOKEN || '');
    if (token) {
      const supplied = String(req.headers['x-maintenance-token'] || '');
      const expected = Buffer.from(token);
      const actual = Buffer.from(supplied);
      if (expected.length === actual.length && crypto.timingSafeEqual(expected, actual)) return next();
      return res.status(401).json({ ok: false, error: 'maintenance_auth_required' });
    }
    if (auth && auth.requireRoles) return auth.requireRoles(['district_admin', 'campus_admin'])(req, res, next);
    return res.status(503).json({ ok: false, error: 'maintenance_auth_unconfigured' });
  };
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

function safeString(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function isValidRoomKey(value) {
  return /^[A-Za-z0-9_-]{1,80}$/.test(String(value || ''));
}

function chooseSelfRegisteredRole(requestedRole, email) {
  const role = String(requestedRole || 'teacher');
  if (role === 'teacher' || role === 'parent') return role;

  const bootstrapEmails = String(process.env.BOOTSTRAP_ADMIN_EMAILS || '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);
  const adminRoles = ['district_admin', 'campus_admin'];
  if (
    process.env.ALLOW_ADMIN_SELF_REGISTRATION === 'true' &&
    adminRoles.includes(role) &&
    bootstrapEmails.includes(normalizeEmail(email))
  ) {
    return role;
  }
  return 'teacher';
}

module.exports = {
  buildCorsOptions,
  securityHeaders,
  createRateLimiter,
  requireMaintenanceAuth,
  normalizeEmail,
  isValidEmail,
  safeString,
  isValidRoomKey,
  chooseSelfRegisteredRole
};
