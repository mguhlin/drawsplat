/***************************************************************
 * DrawSplat(TM) Community - Google Apps Script backend
 * Static front end: index.html, Admin.html
 * Sheets: Posts, Replies, Users (created automatically)
 ***************************************************************/

const PROJECT_NAME = 'DrawSplat Community';
const SHEET_NAME = 'DrawSplat Community';
const SHEET_POSTS = 'Posts';
const SHEET_REPLIES = 'Replies';
const SHEET_USERS = 'Users';

const MAX_TITLE_CHARS = 120;
const MAX_BODY_CHARS = 2000;
const MAX_REPLY_CHARS = 1500;
const MAX_NAME_CHARS = 60;

const ALLOWED_CATEGORIES = [
  'General',
  'Classroom and Pedagogy',
  'Tools',
  'Administration',
  'Suggestion Box'
];

const POST_HEADERS = [
  'id', 'timestamp', 'status', 'category', 'title', 'body',
  'authorName', 'authorEmail', 'updatedAt'
];

const REPLY_HEADERS = [
  'id', 'postId', 'timestamp', 'status', 'body',
  'authorName', 'authorEmail', 'updatedAt'
];

const USER_HEADERS = [
  'id', 'name', 'email', 'provider', 'providerId',
  'createdAt', 'lastSeen', 'postCount', 'replyCount',
  'passwordSalt', 'passwordHash'
];

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_DEFAULT_ITERATIONS = 100;
const SIGNIN_FAILURE_LIMIT = 5;
const SIGNIN_FAILURE_WINDOW_SECONDS = 900;

function setupNow() {
  const ss = getOrCreateSpreadsheet_();
  ensureSheet_(ss, SHEET_POSTS, POST_HEADERS);
  ensureSheet_(ss, SHEET_REPLIES, REPLY_HEADERS);
  ensureSheet_(ss, SHEET_USERS, USER_HEADERS);
  getOrCreateSessionSecret_();
  getOrCreatePasswordPepper_();
  PropertiesService.getScriptProperties().setProperty('PROJECT_READY', 'true');
  return 'Setup complete for ' + PROJECT_NAME + '. Spreadsheet: ' + ss.getUrl();
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  const action = String(p.action || 'list');
  try {
    if (action === 'ping') return jsonResponse(ping_());
    if (action === 'list') return publicList_(p);
    if (action === 'adminList') return adminList_(p);
    return jsonResponse({ ok: false, error: 'Unknown action.' });
  } catch (err) {
    const body = { ok: false, error: errorText_(err) };
    if (err && err.code) body.code = err.code;
    return jsonResponse(body);
  }
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  const action = String(p.action || '');
  try {
    if (action === 'signIn') return signIn_(p);
    if (action === 'registerEmail') return registerEmail_(p);
    if (action === 'post') return createPost_(p);
    if (action === 'reply') return createReply_(p);
    if (action === 'adminList') return adminList_(p);
    if (action === 'setStatus') return setStatus_(p);
    if (action === 'update') return updateItem_(p);
    if (action === 'delete') return deleteItem_(p);
    if (action === 'setModeration') return setModeration_(p);
    return jsonResponse({ ok: false, error: 'Unknown action.' });
  } catch (err) {
    const body = { ok: false, error: errorText_(err) };
    if (err && err.code) body.code = err.code;
    return jsonResponse(body);
  }
}

function ping_() {
  const props = PropertiesService.getScriptProperties();
  return {
    ok: true,
    project: PROJECT_NAME,
    categories: ALLOWED_CATEGORIES,
    moderationEnabled: isModerationEnabled_(),
    passcodeSet: !!getAdminPasscode_(),
    providers: {
      google: !!String(props.getProperty('GOOGLE_CLIENT_ID') || '').trim(),
      microsoft: !!String(props.getProperty('MICROSOFT_CLIENT_ID') || '').trim()
    },
    time: new Date().toISOString()
  };
}

function publicList_(p) {
  const posts = readSheet_(SHEET_POSTS).filter(function(x) { return x.status === 'approved'; });
  const replies = readSheet_(SHEET_REPLIES).filter(function(x) { return x.status === 'approved'; });
  const repliesByPost = {};
  replies.forEach(function(r) {
    if (!repliesByPost[r.postId]) repliesByPost[r.postId] = [];
    repliesByPost[r.postId].push(publicReplyShape_(r));
  });
  Object.keys(repliesByPost).forEach(function(k) {
    repliesByPost[k].sort(function(a, b) { return new Date(a.timestamp) - new Date(b.timestamp); });
  });
  posts.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
  const shaped = posts.map(function(post) {
    const out = publicPostShape_(post);
    out.replies = repliesByPost[post.id] || [];
    return out;
  });
  return jsonResponse({ ok: true, moderationEnabled: isModerationEnabled_(), categories: ALLOWED_CATEGORIES, posts: shaped });
}

function signIn_(p) {
  const provider = clean_(p.provider || '').toLowerCase();
  let info;
  if (provider === 'google') {
    info = verifyGoogleToken_(String(p.idToken || ''));
  } else if (provider === 'microsoft') {
    info = verifyMicrosoftToken_(String(p.accessToken || ''));
  } else if (provider === 'email') {
    info = verifyEmailPassword_(p);
  } else {
    return jsonResponse({ ok: false, error: 'Unsupported provider.' });
  }
  if (!info || !info.email) return jsonResponse({ ok: false, error: 'No email returned from provider.' });
  const email = info.email.toLowerCase();
  const name = clean_(info.name || email).slice(0, MAX_NAME_CHARS) || email;
  const sheet = getSheet_(SHEET_USERS);
  const existing = findRowInfo_(sheet, USER_HEADERS, 'email', email);
  const now = new Date().toISOString();
  if (existing) {
    updateRow_(sheet, USER_HEADERS, existing.rowNumber, {
      name: name, lastSeen: now, provider: provider, providerId: info.providerId
    });
  } else {
    appendRow_(sheet, USER_HEADERS, {
      id: Utilities.getUuid(),
      name: name, email: email,
      provider: provider, providerId: info.providerId,
      createdAt: now, lastSeen: now,
      postCount: 0, replyCount: 0
    });
  }
  const sessionToken = issueSession_({ email: email, name: name, provider: provider });
  return jsonResponse({
    ok: true,
    sessionToken: sessionToken,
    user: { email: email, name: name, provider: provider }
  });
}

function verifyGoogleToken_(idToken) {
  if (!idToken) throw new Error('Missing Google ID token.');
  const expectedAud = String(PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID') || '').trim();
  if (!expectedAud) throw new Error('Google sign-in is not configured on the server.');
  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('Google rejected the sign-in token.');
  const claims = JSON.parse(res.getContentText() || '{}');
  if (String(claims.aud) !== expectedAud) throw new Error('Google token audience does not match.');
  const verified = claims.email_verified;
  if (verified !== true && String(verified).toLowerCase() !== 'true') throw new Error('Google account email is not verified.');
  if (parseInt(claims.exp, 10) < Math.floor(Date.now() / 1000)) throw new Error('Google token has expired.');
  return {
    email: String(claims.email || '').toLowerCase(),
    name: String(claims.name || claims.email || 'User'),
    providerId: String(claims.sub || claims.email || '')
  };
}

function verifyMicrosoftToken_(accessToken) {
  if (!accessToken) throw new Error('Missing Microsoft access token.');
  const expectedClient = String(PropertiesService.getScriptProperties().getProperty('MICROSOFT_CLIENT_ID') || '').trim();
  if (!expectedClient) throw new Error('Microsoft sign-in is not configured on the server.');
  const claims = decodeJwtPayload_(accessToken);
  if (!claims) throw new Error('Microsoft token is not in the expected format.');
  const appId = String(claims.appid || claims.azp || '');
  if (appId !== expectedClient) throw new Error('Microsoft token was not issued to this application.');
  if (claims.exp && parseInt(claims.exp, 10) < Math.floor(Date.now() / 1000)) throw new Error('Microsoft token has expired.');
  const issuer = String(claims.iss || '');
  if (issuer.indexOf('https://sts.windows.net/') !== 0 && issuer.indexOf('https://login.microsoftonline.com/') !== 0) {
    throw new Error('Microsoft token issuer is not recognized.');
  }
  const res = UrlFetchApp.fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: 'Bearer ' + accessToken },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error('Microsoft rejected the sign-in token.');
  const me = JSON.parse(res.getContentText() || '{}');
  const email = String(me.mail || me.userPrincipalName || '').toLowerCase();
  if (!email) throw new Error('Microsoft account did not return an email.');
  return {
    email: email,
    name: String(me.displayName || email),
    providerId: String(me.id || email)
  };
}

function decodeJwtPayload_(token) {
  const parts = String(token || '').split('.');
  if (parts.length < 2) return null;
  let segment = parts[1];
  while (segment.length % 4) segment += '=';
  try {
    const bytes = Utilities.base64DecodeWebSafe(segment);
    const json = Utilities.newBlob(bytes).getDataAsString();
    return JSON.parse(json);
  } catch (err) {
    return null;
  }
}

function registerEmail_(p) {
  const email = clean_(p.email || '').toLowerCase();
  const password = String(p.password || '');
  const name = clean_(p.name || '').slice(0, MAX_NAME_CHARS);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonResponse({ ok: false, error: 'Please enter a valid email.' });
  if (!name) return jsonResponse({ ok: false, error: 'Display name is required.' });
  if (password.length < PASSWORD_MIN_LENGTH) return jsonResponse({ ok: false, error: 'Password must be at least ' + PASSWORD_MIN_LENGTH + ' characters.' });
  if (password.length > 200) return jsonResponse({ ok: false, error: 'Password is too long.' });
  const sheet = getSheet_(SHEET_USERS);
  const existing = findRowInfo_(sheet, USER_HEADERS, 'email', email);
  if (existing) return jsonResponse({ ok: false, error: 'That email is already registered. Try signing in instead.' });
  const salt = generateSalt_();
  const hash = hashPassword_(password, salt);
  const id = Utilities.getUuid();
  const now = new Date().toISOString();
  appendRow_(sheet, USER_HEADERS, {
    id: id, name: name, email: email,
    provider: 'email', providerId: id,
    createdAt: now, lastSeen: now,
    postCount: 0, replyCount: 0,
    passwordSalt: salt, passwordHash: hash
  });
  clearRateLimit_(email);
  const sessionToken = issueSession_({ email: email, name: name, provider: 'email' });
  return jsonResponse({
    ok: true,
    sessionToken: sessionToken,
    user: { email: email, name: name, provider: 'email' }
  });
}

function verifyEmailPassword_(p) {
  const email = clean_(p.email || '').toLowerCase();
  const password = String(p.password || '');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email.');
  if (!password) throw new Error('Please enter your password.');
  checkRateLimit_(email);
  const sheet = getSheet_(SHEET_USERS);
  const info = findRowInfo_(sheet, USER_HEADERS, 'email', email);
  if (!info || !info.item.passwordHash || !info.item.passwordSalt) {
    recordFailure_(email);
    throw new Error('Invalid email or password.');
  }
  const computed = hashPassword_(password, info.item.passwordSalt);
  if (!constantTimeCompare_(computed, info.item.passwordHash)) {
    recordFailure_(email);
    throw new Error('Invalid email or password.');
  }
  clearRateLimit_(email);
  return {
    email: email,
    name: info.item.name || email,
    providerId: info.item.id || email
  };
}

function hashPassword_(password, salt) {
  const pepper = getOrCreatePasswordPepper_();
  const iterRaw = PropertiesService.getScriptProperties().getProperty('PASSWORD_ITERATIONS');
  const iter = Math.max(1, parseInt(iterRaw || String(PASSWORD_DEFAULT_ITERATIONS), 10));
  let current = String(salt) + ':' + String(password);
  for (let i = 0; i < iter; i++) {
    const sig = Utilities.computeHmacSha256Signature(current, pepper);
    current = Utilities.base64EncodeWebSafe(sig);
  }
  return current.replace(/=+$/, '');
}

function generateSalt_() {
  return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
}

function getOrCreatePasswordPepper_() {
  const props = PropertiesService.getScriptProperties();
  let pepper = props.getProperty('PASSWORD_PEPPER');
  if (!pepper) {
    pepper = (Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
    props.setProperty('PASSWORD_PEPPER', pepper);
  }
  return pepper;
}

function constantTimeCompare_(a, b) {
  const sa = String(a);
  const sb = String(b);
  if (sa.length !== sb.length) return false;
  let result = 0;
  for (let i = 0; i < sa.length; i++) {
    result |= sa.charCodeAt(i) ^ sb.charCodeAt(i);
  }
  return result === 0;
}

function checkRateLimit_(email) {
  const cache = CacheService.getScriptCache();
  const key = 'fail:' + String(email).toLowerCase();
  const current = parseInt(cache.get(key) || '0', 10);
  if (current >= SIGNIN_FAILURE_LIMIT) {
    throw new Error('Too many failed sign-in attempts. Wait 15 minutes and try again.');
  }
}

function recordFailure_(email) {
  const cache = CacheService.getScriptCache();
  const key = 'fail:' + String(email).toLowerCase();
  const current = parseInt(cache.get(key) || '0', 10);
  cache.put(key, String(current + 1), SIGNIN_FAILURE_WINDOW_SECONDS);
}

function clearRateLimit_(email) {
  CacheService.getScriptCache().remove('fail:' + String(email).toLowerCase());
}

function issueSession_(user) {
  const payload = {
    email: user.email,
    name: user.name,
    provider: user.provider,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  };
  const body = base64UrlEncode_(JSON.stringify(payload));
  const sigBytes = Utilities.computeHmacSha256Signature(body, getOrCreateSessionSecret_());
  return body + '.' + base64UrlEncodeBytes_(sigBytes);
}

function verifySession_(token) {
  if (!token) return null;
  const parts = String(token).split('.');
  if (parts.length !== 2) return null;
  const body = parts[0];
  const sigPart = parts[1];
  const expectedBytes = Utilities.computeHmacSha256Signature(body, getOrCreateSessionSecret_());
  const expected = base64UrlEncodeBytes_(expectedBytes);
  if (sigPart !== expected) return null;
  try {
    const decoded = Utilities.newBlob(base64UrlDecode_(body)).getDataAsString();
    const payload = JSON.parse(decoded);
    if (parseInt(payload.exp, 10) < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

function getOrCreateSessionSecret_() {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty('SESSION_SECRET');
  if (!secret) {
    secret = (Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
    props.setProperty('SESSION_SECRET', secret);
  }
  return secret;
}

function base64UrlEncode_(str) {
  return Utilities.base64EncodeWebSafe(str).replace(/=+$/, '');
}

function base64UrlEncodeBytes_(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '');
}

function base64UrlDecode_(str) {
  return Utilities.base64DecodeWebSafe(str);
}

function requireSession_(p) {
  const session = verifySession_(p.sessionToken || '');
  if (!session) {
    const err = new Error('Please sign in.');
    err.code = 'auth_required';
    throw err;
  }
  return session;
}

function createPost_(p) {
  const session = requireSession_(p);
  const category = clean_(p.category || '');
  const title = clean_(p.title || '').slice(0, MAX_TITLE_CHARS);
  const body = clean_(p.body || '').slice(0, MAX_BODY_CHARS);
  if (ALLOWED_CATEGORIES.indexOf(category) === -1) return jsonResponse({ ok: false, error: 'Please choose a valid category.' });
  if (!title) return jsonResponse({ ok: false, error: 'Title is required.' });
  if (!body) return jsonResponse({ ok: false, error: 'Message is required.' });
  const status = isModerationEnabled_() ? 'pending' : 'approved';
  const now = new Date().toISOString();
  const item = {
    id: Utilities.getUuid(), timestamp: now, status: status, category: category, title: title, body: body,
    authorName: session.name, authorEmail: session.email, updatedAt: now
  };
  appendRow_(getSheet_(SHEET_POSTS), POST_HEADERS, item);
  touchUserCount_(session.email, session.name, 'postCount');
  return jsonResponse({ ok: true, status: status, id: item.id });
}

function createReply_(p) {
  const session = requireSession_(p);
  const postId = clean_(p.postId || '');
  const body = clean_(p.body || '').slice(0, MAX_REPLY_CHARS);
  if (!postId) return jsonResponse({ ok: false, error: 'Reply target missing.' });
  if (!body) return jsonResponse({ ok: false, error: 'Reply cannot be empty.' });
  const parent = findRowInfo_(getSheet_(SHEET_POSTS), POST_HEADERS, 'id', postId);
  if (!parent) return jsonResponse({ ok: false, error: 'Original post not found.' });
  const status = isModerationEnabled_() ? 'pending' : 'approved';
  const now = new Date().toISOString();
  const item = {
    id: Utilities.getUuid(), postId: postId, timestamp: now, status: status, body: body,
    authorName: session.name, authorEmail: session.email, updatedAt: now
  };
  appendRow_(getSheet_(SHEET_REPLIES), REPLY_HEADERS, item);
  touchUserCount_(session.email, session.name, 'replyCount');
  return jsonResponse({ ok: true, status: status, id: item.id });
}

function adminList_(p) {
  const auth = checkAdmin_(p);
  if (auth) return jsonResponse({ ok: false, error: auth });
  const posts = readSheet_(SHEET_POSTS);
  const replies = readSheet_(SHEET_REPLIES);
  posts.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
  replies.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
  return jsonResponse({
    ok: true,
    moderationEnabled: isModerationEnabled_(),
    categories: ALLOWED_CATEGORIES,
    posts: posts,
    replies: replies
  });
}

function setStatus_(p) {
  const auth = checkAdmin_(p);
  if (auth) return jsonResponse({ ok: false, error: auth });
  const type = String(p.type || '');
  const id = clean_(p.id || '');
  const status = clean_(p.status || '');
  if (['pending', 'approved', 'hidden'].indexOf(status) === -1) return jsonResponse({ ok: false, error: 'Invalid status.' });
  const sheetName = type === 'post' ? SHEET_POSTS : type === 'reply' ? SHEET_REPLIES : null;
  const headers = type === 'post' ? POST_HEADERS : REPLY_HEADERS;
  if (!sheetName) return jsonResponse({ ok: false, error: 'Invalid type.' });
  const sheet = getSheet_(sheetName);
  const info = findRowInfo_(sheet, headers, 'id', id);
  if (!info) return jsonResponse({ ok: false, error: 'Item not found.' });
  updateRow_(sheet, headers, info.rowNumber, { status: status, updatedAt: new Date().toISOString() });
  return jsonResponse({ ok: true });
}

function updateItem_(p) {
  const type = String(p.type || '');
  const id = clean_(p.id || '');
  const now = new Date().toISOString();
  const adminErr = checkAdmin_(p);
  const isAdmin = !adminErr;
  let session = null;
  if (!isAdmin) {
    try { session = verifySession_(String(p.sessionToken || '')); } catch (e) {}
    if (!session) return jsonResponse({ ok: false, error: adminErr || 'Sign in or admin passcode required to edit.' });
  }
  if (type === 'post') {
    const sheet = getSheet_(SHEET_POSTS);
    const info = findRowInfo_(sheet, POST_HEADERS, 'id', id);
    if (!info) return jsonResponse({ ok: false, error: 'Post not found.' });
    const ownerEmail = String(info.item.authorEmail || '').toLowerCase();
    if (!isAdmin && (!ownerEmail || ownerEmail !== String(session.email).toLowerCase())) {
      return jsonResponse({ ok: false, error: 'Only the original author or an admin can edit this post.' });
    }
    /* Admin can rewrite category/title/author; authors keep them locked. */
    const category = isAdmin ? clean_(p.category || info.item.category) : info.item.category;
    const title = isAdmin
      ? clean_(p.title || info.item.title).slice(0, MAX_TITLE_CHARS)
      : info.item.title;
    const body = clean_(p.body || '').slice(0, MAX_BODY_CHARS);
    if (ALLOWED_CATEGORIES.indexOf(category) === -1) return jsonResponse({ ok: false, error: 'Invalid category.' });
    if (!title) return jsonResponse({ ok: false, error: 'Title required.' });
    if (!body) return jsonResponse({ ok: false, error: 'Body required.' });
    const authorName = isAdmin ? (clean_(p.authorName || info.item.authorName).slice(0, MAX_NAME_CHARS) || 'Anonymous') : info.item.authorName;
    const authorEmail = isAdmin ? (clean_(p.authorEmail || info.item.authorEmail).toLowerCase()) : info.item.authorEmail;
    updateRow_(sheet, POST_HEADERS, info.rowNumber, {
      category: category, title: title, body: body,
      authorName: authorName, authorEmail: authorEmail,
      updatedAt: now
    });
    return jsonResponse({ ok: true });
  }
  if (type === 'reply') {
    const sheet = getSheet_(SHEET_REPLIES);
    const info = findRowInfo_(sheet, REPLY_HEADERS, 'id', id);
    if (!info) return jsonResponse({ ok: false, error: 'Reply not found.' });
    const ownerEmail = String(info.item.authorEmail || '').toLowerCase();
    if (!isAdmin && (!ownerEmail || ownerEmail !== String(session.email).toLowerCase())) {
      return jsonResponse({ ok: false, error: 'Only the original author or an admin can edit this reply.' });
    }
    const body = clean_(p.body || '').slice(0, MAX_REPLY_CHARS);
    if (!body) return jsonResponse({ ok: false, error: 'Reply body required.' });
    const authorName = isAdmin ? (clean_(p.authorName || info.item.authorName).slice(0, MAX_NAME_CHARS) || 'Anonymous') : info.item.authorName;
    const authorEmail = isAdmin ? (clean_(p.authorEmail || info.item.authorEmail).toLowerCase()) : info.item.authorEmail;
    updateRow_(sheet, REPLY_HEADERS, info.rowNumber, {
      body: body,
      authorName: authorName,
      authorEmail: authorEmail,
      updatedAt: now
    });
    return jsonResponse({ ok: true });
  }
  return jsonResponse({ ok: false, error: 'Invalid type.' });
}

function deleteItem_(p) {
  const auth = checkAdmin_(p);
  if (auth) return jsonResponse({ ok: false, error: auth });
  const type = String(p.type || '');
  const id = clean_(p.id || '');
  if (type === 'post') {
    const sheet = getSheet_(SHEET_POSTS);
    const info = findRowInfo_(sheet, POST_HEADERS, 'id', id);
    if (!info) return jsonResponse({ ok: false, error: 'Post not found.' });
    sheet.deleteRow(info.rowNumber);
    deleteRepliesForPost_(id);
    return jsonResponse({ ok: true });
  }
  if (type === 'reply') {
    const sheet = getSheet_(SHEET_REPLIES);
    const info = findRowInfo_(sheet, REPLY_HEADERS, 'id', id);
    if (!info) return jsonResponse({ ok: false, error: 'Reply not found.' });
    sheet.deleteRow(info.rowNumber);
    return jsonResponse({ ok: true });
  }
  return jsonResponse({ ok: false, error: 'Invalid type.' });
}

function deleteRepliesForPost_(postId) {
  const sheet = getSheet_(SHEET_REPLIES);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return;
  const headers = values[0].map(String);
  const idCol = headers.indexOf('postId');
  if (idCol === -1) return;
  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][idCol]) === postId) sheet.deleteRow(i + 1);
  }
}

function setModeration_(p) {
  const auth = checkAdmin_(p);
  if (auth) return jsonResponse({ ok: false, error: auth });
  const enabled = String(p.enabled || '').toLowerCase() === 'true';
  PropertiesService.getScriptProperties().setProperty('MODERATION_ENABLED', String(enabled));
  return jsonResponse({ ok: true, moderationEnabled: enabled });
}

function publicPostShape_(item) {
  return {
    id: item.id,
    timestamp: item.timestamp,
    category: item.category,
    title: item.title,
    body: item.body,
    authorName: item.authorName
  };
}

function publicReplyShape_(item) {
  return {
    id: item.id,
    postId: item.postId,
    timestamp: item.timestamp,
    body: item.body,
    authorName: item.authorName
  };
}

function touchUserCount_(email, name, field) {
  if (!email) return;
  const sheet = getSheet_(SHEET_USERS);
  const info = findRowInfo_(sheet, USER_HEADERS, 'email', email);
  const now = new Date().toISOString();
  if (info) {
    const current = parseInt(info.item[field] || '0', 10) || 0;
    const patch = { lastSeen: now };
    patch[field] = current + 1;
    updateRow_(sheet, USER_HEADERS, info.rowNumber, patch);
  } else {
    const id = Utilities.getUuid();
    const row = { id: id, name: name || 'Anonymous', email: email, createdAt: now, lastSeen: now, postCount: 0, replyCount: 0 };
    row[field] = 1;
    appendRow_(sheet, USER_HEADERS, row);
  }
}

function getOrCreateSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SHEET_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (ignore) {}
  }
  const ss = SpreadsheetApp.create(SHEET_NAME);
  props.setProperty('SHEET_ID', ss.getId());
  const first = ss.getSheets()[0];
  first.setName(SHEET_POSTS);
  return ss;
}

function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  const lastCol = sheet.getLastColumn();
  if (sheet.getLastRow() === 0 || lastCol === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return sheet;
  }
  const existing = sheet.getRange(1, 1, 1, Math.max(lastCol, headers.length)).getValues()[0].map(String);
  let changed = false;
  headers.forEach(function(h) { if (existing.indexOf(h) === -1) { existing.push(h); changed = true; } });
  if (changed) sheet.getRange(1, 1, 1, existing.length).setValues([existing]);
  sheet.setFrozenRows(1);
  return sheet;
}

function getSheet_(name) {
  const ss = getOrCreateSpreadsheet_();
  const headers = name === SHEET_POSTS ? POST_HEADERS : name === SHEET_REPLIES ? REPLY_HEADERS : USER_HEADERS;
  return ensureSheet_(ss, name, headers);
}

function readSheet_(name) {
  const sheet = getSheet_(name);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).map(function(row) {
    const obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i] == null ? '' : String(row[i]); });
    return obj;
  }).filter(function(obj) { return obj.id; });
}

function appendRow_(sheet, headers, item) {
  sheet.appendRow(headers.map(function(h) { return item[h] == null ? '' : item[h]; }));
}

function updateRow_(sheet, headers, rowNumber, patch) {
  const lastCol = sheet.getLastColumn();
  const existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  Object.keys(patch).forEach(function(key) {
    let col = existing.indexOf(key) + 1;
    if (col <= 0) {
      existing.push(key);
      col = existing.length;
      sheet.getRange(1, col).setValue(key);
    }
    sheet.getRange(rowNumber, col).setValue(patch[key]);
  });
}

function findRowInfo_(sheet, headers, keyField, keyValue) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return null;
  const sheetHeaders = values[0].map(String);
  const keyCol = sheetHeaders.indexOf(keyField);
  if (keyCol === -1) return null;
  const target = String(keyValue).toLowerCase();
  const isEmail = keyField === 'email';
  for (let i = 1; i < values.length; i++) {
    const cell = String(values[i][keyCol] || '');
    const match = isEmail ? cell.toLowerCase() === target : cell === String(keyValue);
    if (match) {
      const item = {};
      sheetHeaders.forEach(function(h, j) { item[h] = values[i][j] == null ? '' : String(values[i][j]); });
      return { rowNumber: i + 1, item: item };
    }
  }
  return null;
}

function isModerationEnabled_() {
  const value = PropertiesService.getScriptProperties().getProperty('MODERATION_ENABLED');
  if (value === null || value === '') return true;
  return String(value).toLowerCase() !== 'false';
}

function getAdminPasscode_() {
  return String(PropertiesService.getScriptProperties().getProperty('ADMIN_PASSCODE') || '').trim();
}

function checkAdmin_(p) {
  const configured = getAdminPasscode_();
  if (!configured) return 'Moderator passcode not configured.';
  const supplied = String(p.passcode || '').trim();
  if (supplied !== configured) return 'Invalid passcode.';
  return '';
}

function clean_(value) {
  return String(value == null ? '' : value)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .trim();
}

function errorText_(err) {
  return String(err && err.message ? err.message : err);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
