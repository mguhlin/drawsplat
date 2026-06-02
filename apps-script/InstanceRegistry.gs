/***************************************************************
 * DrawSplat(TM) Instance Registry - Apps Script starter
 *
 * Purpose:
 * - Give each /instances/<slug>/ admin page a server-side login.
 * - Verify a one-time setup password.
 * - Bind the instance admin to a Google OAuth account.
 * - Store instance storage config separately from drawsplat.org.
 *
 * Script Properties to set before first use:
 * - GOOGLE_CLIENT_ID: OAuth web client ID used by the instance admin page.
 * - INSTANCE_SESSION_SECRET: long random secret, or let setup() create one.
 * - INSTANCE_comenio_SETUP_PASSWORD: one-time password for the Comenio admin.
 *
 * Optional:
 * - INSTANCE_ALLOWED_ORIGINS: comma-separated origins allowed by policy docs.
 ***************************************************************/

const INSTANCE_REGISTRY_VERSION = '0.1.0';
const INSTANCE_SESSION_TTL_SECONDS = 60 * 60 * 8;

function setup() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('INSTANCE_SESSION_SECRET')) {
    props.setProperty('INSTANCE_SESSION_SECRET', Utilities.getUuid() + Utilities.getUuid());
  }
  return 'DrawSplat instance registry ready. Version ' + INSTANCE_REGISTRY_VERSION;
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === 'ping') return json_({ ok: true, app: 'DrawSplat Instance Registry', version: INSTANCE_REGISTRY_VERSION, time: new Date().toISOString() });
    return json_({ ok: false, error: 'Unknown action.' });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function doPost(e) {
  try {
    const payload = parseBody_(e);
    const action = clean_(payload.action);
    if (action === 'instanceBootstrap') return json_(instanceBootstrap_(payload));
    if (action === 'instanceGoogleBind') return json_(instanceGoogleBind_(payload));
    if (action === 'instanceSession') return json_(instanceSession_(payload));
    if (action === 'instancePublicConfig') return json_(instancePublicConfig_(payload));
    if (action === 'instanceConfigGet') return json_(instanceConfigGet_(payload));
    if (action === 'instanceConfigSet') return json_(instanceConfigSet_(payload));
    return json_({ ok: false, error: 'Unknown action.' });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function instanceBootstrap_(payload) {
  const instanceId = instanceId_(payload.instanceId);
  const password = String(payload.setupPassword || '');
  const props = PropertiesService.getScriptProperties();
  const expected = String(props.getProperty(prop_(instanceId, 'SETUP_PASSWORD')) || '');
  if (!expected) throw new Error('Setup password is not configured for ' + instanceId + '.');
  if (!constantTimeEqual_(password, expected)) throw new Error('Invalid setup password.');
  return {
    ok: true,
    setupToken: signSession_({ instanceId: instanceId, kind: 'setup', exp: nowSeconds_() + 15 * 60 })
  };
}

function instanceGoogleBind_(payload) {
  const instanceId = instanceId_(payload.instanceId);
  const props = PropertiesService.getScriptProperties();
  const existingAdminSub = String(props.getProperty(prop_(instanceId, 'ADMIN_GOOGLE_SUB')) || '');
  const setup = payload.setupToken ? verifySession_(payload.setupToken) : null;
  const prior = payload.sessionToken ? verifySession_(payload.sessionToken) : null;
  if (!existingAdminSub && (!setup || setup.instanceId !== instanceId || setup.kind !== 'setup')) {
    throw new Error('Valid setup token required before first Google binding.');
  }
  if (existingAdminSub && (!prior || prior.instanceId !== instanceId || prior.kind !== 'admin')) {
    throw new Error('Existing instance admin must sign in before rebinding.');
  }
  const profile = verifyGoogleToken_(String(payload.idToken || ''));
  if (existingAdminSub && profile.sub !== existingAdminSub) throw new Error('This Google account is not the bound admin for this instance.');
  props.setProperty(prop_(instanceId, 'ADMIN_GOOGLE_SUB'), profile.sub);
  props.setProperty(prop_(instanceId, 'ADMIN_EMAIL'), profile.email);
  props.setProperty(prop_(instanceId, 'ADMIN_NAME'), profile.name);
  props.deleteProperty(prop_(instanceId, 'SETUP_PASSWORD'));
  const sessionToken = signSession_({ instanceId: instanceId, kind: 'admin', sub: profile.sub, email: profile.email, exp: nowSeconds_() + INSTANCE_SESSION_TTL_SECONDS });
  return {
    ok: true,
    sessionToken: sessionToken,
    user: { email: profile.email, name: profile.name, provider: 'google', providerId: profile.sub }
  };
}

function instanceSession_(payload) {
  const instanceId = instanceId_(payload.instanceId);
  const session = verifySession_(payload.sessionToken || '');
  if (!session || session.instanceId !== instanceId || session.kind !== 'admin') throw new Error('Invalid admin session.');
  return { ok: true, user: { email: session.email, provider: 'google', providerId: session.sub } };
}

function instancePublicConfig_(payload) {
  const instanceId = instanceId_(payload.instanceId);
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty(prop_(instanceId, 'CONFIG')) || '{}';
  const cfg = sanitizeConfig_(JSON.parse(raw));
  return { ok: true, config: cfg };
}

function instanceConfigGet_(payload) {
  const session = requireAdminSession_(payload);
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty(prop_(session.instanceId, 'CONFIG')) || '{}';
  return { ok: true, config: JSON.parse(raw) };
}

function instanceConfigSet_(payload) {
  const session = requireAdminSession_(payload);
  const cfg = sanitizeConfig_(payload.config || {});
  PropertiesService.getScriptProperties().setProperty(prop_(session.instanceId, 'CONFIG'), JSON.stringify(cfg));
  return { ok: true, config: cfg };
}

function requireAdminSession_(payload) {
  const instanceId = instanceId_(payload.instanceId);
  const session = verifySession_(payload.sessionToken || '');
  if (!session || session.instanceId !== instanceId || session.kind !== 'admin') throw new Error('Invalid admin session.');
  return session;
}

function sanitizeConfig_(cfg) {
  if (typeof cfg === 'string') cfg = JSON.parse(cfg || '{}');
  const provider = clean_(cfg.storageProvider) === 'mysql' ? 'mysql' : 'google-apps-script';
  return {
    storageProvider: provider,
    googleScriptUrl: cleanUrl_(cfg.googleScriptUrl),
    mysqlApiBase: cleanUrl_(cfg.mysqlApiBase),
    defaultRoom: clean_(cfg.defaultRoom).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80)
  };
}

function verifyGoogleToken_(idToken) {
  if (!idToken) throw new Error('Missing Google ID token.');
  const expectedAud = clean_(PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID'));
  if (!expectedAud) throw new Error('GOOGLE_CLIENT_ID is not configured.');
  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('Google rejected the sign-in token.');
  const claims = JSON.parse(res.getContentText() || '{}');
  if (String(claims.aud) !== expectedAud) throw new Error('Google token audience does not match.');
  const verified = claims.email_verified;
  if (verified !== true && String(verified).toLowerCase() !== 'true') throw new Error('Google account email is not verified.');
  if (parseInt(claims.exp, 10) < nowSeconds_()) throw new Error('Google token has expired.');
  return {
    sub: String(claims.sub || ''),
    email: String(claims.email || '').toLowerCase(),
    name: String(claims.name || claims.email || 'Instance admin')
  };
}

function signSession_(payload) {
  const body = Utilities.base64EncodeWebSafe(JSON.stringify(payload));
  const sig = hmac_(body);
  return body + '.' + sig;
}

function verifySession_(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return null;
  if (!constantTimeEqual_(hmac_(parts[0]), parts[1])) return null;
  const payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
  if (!payload.exp || payload.exp < nowSeconds_()) return null;
  return payload;
}

function hmac_(body) {
  const secret = PropertiesService.getScriptProperties().getProperty('INSTANCE_SESSION_SECRET') || 'change-me';
  const raw = Utilities.computeHmacSha256Signature(body, secret);
  return Utilities.base64EncodeWebSafe(raw);
}

function parseBody_(e) {
  const text = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  try { return JSON.parse(text || '{}'); } catch (err) { throw new Error('Invalid JSON request.'); }
}

function instanceId_(value) {
  const id = clean_(value).toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!id) throw new Error('Missing instanceId.');
  return id;
}

function prop_(instanceId, suffix) {
  return 'INSTANCE_' + instanceId + '_' + suffix;
}

function clean_(value) {
  return String(value == null ? '' : value).trim();
}

function cleanUrl_(value) {
  const url = clean_(value);
  if (!url) return '';
  if (!/^https:\/\//i.test(url)) throw new Error('Backend URLs must start with https://');
  return url;
}

function nowSeconds_() {
  return Math.floor(Date.now() / 1000);
}

function constantTimeEqual_(a, b) {
  a = String(a || '');
  b = String(b || '');
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
