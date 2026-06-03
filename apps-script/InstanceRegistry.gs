/***************************************************************
 * DrawSplat(TM) Instance Registry - Apps Script starter
 *
 * Purpose:
 * - Give each /hub/<slug>/ admin page a server-side login.
 * - Verify a one-time setup password.
 * - Bind the instance admin to a Google OAuth account.
 * - Store instance storage config separately from drawsplat.org.
 *
 * Script Properties to set before first use:
 * - GOOGLE_CLIENT_ID: OAuth web client ID used by the instance admin page.
 * - INSTANCE_SESSION_SECRET: long random secret, or let setup() create one.
 * - INSTANCE_hubcampus_SETUP_PASSWORD: one-time password for the DrawSplat Hub Campus admin.
 * - HUB_ADMIN_EMAILS: comma-separated Hub admin emails. Default:
 *   mguhlin@gmail.com,jeguhlin@gmail.com.
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
    if (action === 'hubAdminGoogleAuth') return json_(hubAdminGoogleAuth_(payload));
    if (action === 'hubInstancesGet') return json_(hubInstancesGet_(payload));
    if (action === 'hubTeacherAdd') return json_(hubTeacherAdd_(payload));
    if (action === 'hubTeacherRemove') return json_(hubTeacherRemove_(payload));
    return json_({ ok: false, error: 'Unknown action.' });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function hubAdminGoogleAuth_(payload) {
  const profile = verifyGoogleToken_(String(payload.idToken || ''));
  if (hubAdminEmails_().indexOf(profile.email) === -1) throw new Error('This Google account is not approved for DrawSplat Hub admin.');
  return {
    ok: true,
    sessionToken: signSession_({ kind: 'hubAdmin', sub: profile.sub, email: profile.email, exp: nowSeconds_() + INSTANCE_SESSION_TTL_SECONDS }),
    user: { email: profile.email, name: profile.name, provider: 'google', providerId: profile.sub }
  };
}

function hubInstancesGet_(payload) {
  requireHubAdminSession_(payload);
  return { ok: true, instances: hubInstances_() };
}

function hubTeacherAdd_(payload) {
  const session = requireHubAdminSession_(payload);
  const teacher = payload.teacher || {};
  const name = clean_(teacher.name).slice(0, 120);
  const email = clean_(teacher.email).toLowerCase();
  const slug = clean_(teacher.slug).toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  const category = clean_(teacher.category) === 'Campus' ? 'Campus' : 'Classroom';
  const parentSlug = clean_(teacher.parentSlug || 'hubcampus').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!name) throw new Error('Teacher name is required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Valid teacher email is required.');
  if (!slug) throw new Error('Teacher slug is required.');

  const drive = createTeacherDriveConfig_(slug, name, email, session.email, category);
  const child = {
    slug: slug,
    name: name + ' Classroom',
    teacher: name,
    teacherEmail: email,
    status: 'Invited',
    summary: 'Teacher classroom setup shared with ' + email + '.',
    folderUrl: drive.folderUrl,
    configFileUrl: drive.configFileUrl,
    setupDocUrl: drive.setupDocUrl,
    adminPath: drive.teacherAdminUrl,
    whiteboardPath: drive.teacherBoardUrl
  };
  const instances = hubInstances_();
  if (category === 'Campus') {
    let campus = null;
    for (let i = 0; i < instances.length; i++) {
      if (instances[i].slug === parentSlug) campus = instances[i];
    }
    if (!campus) {
      campus = {
        slug: parentSlug || 'hubcampus',
        name: 'DrawSplat Hub Campus',
        category: 'Campus',
        status: 'Setup',
        lastActivity: now_(),
        licenseModel: 'Campus-managed classrooms',
        ownerType: 'Campus admin',
        summary: 'Campus-managed teacher classroom setups.',
        path: (parentSlug || 'hubcampus') + '/',
        adminPath: (parentSlug || 'hubcampus') + '/admin.html',
        whiteboardPath: (parentSlug || 'hubcampus') + '/whiteboard.html',
        configPath: (parentSlug || 'hubcampus') + '/config.json',
        teachers: []
      };
      instances.push(campus);
    }
    campus.teachers = replaceBySlug_(campus.teachers || [], child);
    campus.lastActivity = now_();
  } else {
    const classroom = {
      slug: slug,
      name: name + ' Classroom',
      category: 'Classroom',
      status: 'Invited',
      lastActivity: now_(),
      licenseModel: 'Free classroom teacher',
      ownerType: 'Teacher',
      summary: 'Independent classroom teacher setup shared with ' + email + '.',
      path: '',
      adminPath: '',
      whiteboardPath: '',
      configPath: '',
      teacherEmail: email,
      folderUrl: drive.folderUrl,
      configFileUrl: drive.configFileUrl,
      setupDocUrl: drive.setupDocUrl,
      adminPath: drive.teacherAdminUrl,
      whiteboardPath: drive.teacherBoardUrl
    };
    const others = instances.filter(function(item) { return (item.category || 'Campus') !== 'Classroom'; });
    const classrooms = instances.filter(function(item) { return (item.category || 'Campus') === 'Classroom'; });
    const updatedClassrooms = replaceBySlug_(classrooms, classroom);
    instances.length = 0;
    Array.prototype.push.apply(instances, others.concat(updatedClassrooms));
  }
  saveHubInstances_(instances);
  return { ok: true, instances: instances, folderUrl: drive.folderUrl, configFileUrl: drive.configFileUrl, setupDocUrl: drive.setupDocUrl, teacherAdminUrl: drive.teacherAdminUrl };
}

function hubTeacherRemove_(payload) {
  requireHubAdminSession_(payload);
  const slug = clean_(payload.slug).toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const parentSlug = clean_(payload.parentSlug || 'hubcampus').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!slug) throw new Error('Teacher slug is required.');
  const instances = hubInstances_();
  let removed = null;
  for (let i = instances.length - 1; i >= 0; i--) {
    const item = instances[i];
    if ((item.category || 'Campus') === 'Classroom' && item.slug === slug) {
      removed = item;
      instances.splice(i, 1);
      continue;
    }
    const teachers = item.teachers || item.classrooms || [];
    const keep = [];
    let changed = false;
    for (let j = 0; j < teachers.length; j++) {
      if (teachers[j].slug === slug && (!parentSlug || item.slug === parentSlug)) {
        removed = teachers[j];
        changed = true;
      } else {
        keep.push(teachers[j]);
      }
    }
    if (changed) {
      item.teachers = keep;
      item.lastActivity = now_();
    }
  }
  if (!removed) throw new Error('Teacher record was not found.');
  const access = revokeTeacherDriveAccess_(removed);
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty(prop_(slug, 'SETUP_PASSWORD'));
  props.deleteProperty(prop_(slug, 'ADMIN_GOOGLE_SUB'));
  props.deleteProperty(prop_(slug, 'ADMIN_EMAIL'));
  props.deleteProperty(prop_(slug, 'ADMIN_NAME'));
  props.deleteProperty(prop_(slug, 'CONFIG'));
  saveHubInstances_(instances);
  return { ok: true, instances: instances, revoked: access };
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

function requireHubAdminSession_(payload) {
  const session = verifySession_(payload.sessionToken || '');
  if (!session || session.kind !== 'hubAdmin') throw new Error('Invalid Hub admin session.');
  if (hubAdminEmails_().indexOf(String(session.email || '').toLowerCase()) === -1) throw new Error('This Google account is not approved for DrawSplat Hub admin.');
  return session;
}

function hubAdminEmails_() {
  const raw = clean_(PropertiesService.getScriptProperties().getProperty('HUB_ADMIN_EMAILS')) || 'mguhlin@gmail.com,jeguhlin@gmail.com';
  return raw.split(',').map(function(s) { return clean_(s).toLowerCase(); }).filter(Boolean);
}

function hubInstances_() {
  const raw = PropertiesService.getScriptProperties().getProperty('HUB_INSTANCES_JSON') || '';
  if (raw) return JSON.parse(raw);
  return [{
    slug: 'hubcampus',
    name: 'DrawSplat Hub Campus',
    category: 'Campus',
    status: 'Setup',
    lastActivity: 'Not connected yet',
    licenseModel: 'Campus-managed classrooms',
    ownerType: 'Campus admin',
    summary: 'Demo campus where a single admin manages multiple teacher classroom setups.',
    path: 'hubcampus/',
    adminPath: 'hubcampus/admin.html',
    whiteboardPath: 'hubcampus/whiteboard.html',
    configPath: 'hubcampus/config.json',
    teachers: []
  }];
}

function saveHubInstances_(instances) {
  PropertiesService.getScriptProperties().setProperty('HUB_INSTANCES_JSON', JSON.stringify(instances || []));
}

function replaceBySlug_(items, item) {
  items = items || [];
  const out = [];
  let replaced = false;
  for (let i = 0; i < items.length; i++) {
    if (items[i].slug === item.slug) {
      out.push(item);
      replaced = true;
    } else {
      out.push(items[i]);
    }
  }
  if (!replaced) out.push(item);
  return out;
}

function createTeacherDriveConfig_(slug, name, email, addedBy, category) {
  const rootName = 'DrawSplat Hub Teachers';
  const root = getOrCreateFolder_(DriveApp, rootName);
  const folder = getOrCreateFolder_(root, slug + ' - ' + name);
  folder.addEditor(email);
  const setupPassword = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
  const room = slug + '-classroom';
  const teacherAdminUrl = hubUrl_('hub/teacher-admin.html?instance=' + encodeURIComponent(slug));
  const teacherBoardUrl = hubUrl_('app/whiteboard.html?instance=' + encodeURIComponent(slug) + '&room=' + encodeURIComponent(room));
  const studentStarterUrl = hubUrl_('app/whiteboard.html?instance=' + encodeURIComponent(slug) + '&role=student&room=' + encodeURIComponent(room));
  const cfg = {
    slug: slug,
    instanceId: slug,
    displayName: name + ' Classroom',
    teacherName: name,
    teacherEmail: email,
    category: category || 'Classroom',
    addedBy: addedBy || '',
    addedAt: now_(),
    status: 'invited',
    defaultRoom: room,
    teacherAdminUrl: teacherAdminUrl,
    teacherBoardUrl: teacherBoardUrl,
    studentStarterUrl: studentStarterUrl,
    setupPassword: setupPassword,
    nextStep: 'Open the setup document in this folder, then use the teacher admin link to connect storage and copy student links.',
    note: 'DrawSplat Hub teacher classroom setup. This file is shared so the teacher can edit or copy it into their own Drive.'
  };
  const filename = 'drawsplat-hub-' + slug + '.json';
  let file = null;
  const existing = folder.getFilesByName(filename);
  if (existing.hasNext()) file = existing.next();
  if (file) file.setContent(JSON.stringify(cfg, null, 2));
  else file = folder.createFile(filename, JSON.stringify(cfg, null, 2), MimeType.PLAIN_TEXT);
  file.addEditor(email);
  const setupDoc = createOrUpdateTeacherSetupDoc_(folder, cfg);
  PropertiesService.getScriptProperties().setProperty(prop_(slug, 'SETUP_PASSWORD'), setupPassword);
  return {
    folderUrl: folder.getUrl(),
    configFileUrl: file.getUrl(),
    setupDocUrl: setupDoc.getUrl(),
    teacherAdminUrl: teacherAdminUrl,
    teacherBoardUrl: teacherBoardUrl,
    studentStarterUrl: studentStarterUrl,
    setupPassword: setupPassword
  };
}

function createOrUpdateTeacherSetupDoc_(folder, cfg) {
  const title = 'DrawSplat Teacher Setup - ' + cfg.teacherName;
  const existing = folder.getFilesByName(title);
  let doc = null;
  if (existing.hasNext()) {
    doc = DocumentApp.openById(existing.next().getId());
    doc.getBody().clear();
  } else {
    doc = DocumentApp.create(title);
    DriveApp.getFileById(doc.getId()).moveTo(folder);
  }
  const body = doc.getBody();
  body.appendParagraph('DrawSplat Teacher Setup').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('Teacher: ' + cfg.teacherName + ' <' + cfg.teacherEmail + '>');
  body.appendParagraph('Instance slug: ' + cfg.slug);
  body.appendParagraph('One-time setup password: ' + cfg.setupPassword);
  body.appendParagraph('Teacher admin link').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(cfg.teacherAdminUrl);
  body.appendParagraph('Use this first. Verify the one-time setup password, sign in with Google, then paste the teacher whiteboard storage Web App URL from apps-script/Code.gs. Do not paste the DrawSplat Hub registry URL; the storage backend ping must report app: "DrawSplatTM". Test it and save the instance config.');
  body.appendParagraph('Teacher board link').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(cfg.teacherBoardUrl);
  body.appendParagraph('Use this after storage is configured. The teacher admin page can copy a teacher link and a student link that include the saved room and backend settings.');
  body.appendParagraph('Student starter link').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(cfg.studentStarterUrl);
  body.appendParagraph('Use this only after the backend URL has been configured. For regular classroom use, copy the student link from the teacher admin page so it includes the current room and backend.');
  body.appendParagraph('What is in this folder').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph('This setup document gives the teacher the steps and links. The JSON file is the machine-readable setup record for support and audit purposes.');
  doc.saveAndClose();
  const file = DriveApp.getFileById(doc.getId());
  file.addEditor(cfg.teacherEmail);
  return file;
}

function hubUrl_(path) {
  const base = clean_(PropertiesService.getScriptProperties().getProperty('HUB_SITE_BASE_URL')) || 'https://drawsplat.org';
  return base.replace(/\/+$/, '') + '/' + String(path || '').replace(/^\/+/, '');
}

function revokeTeacherDriveAccess_(teacher) {
  const email = clean_(teacher.teacherEmail || teacher.email).toLowerCase();
  const result = { email: email, folder: false, files: 0, warnings: [] };
  if (!email) return result;
  try {
    const folderId = driveIdFromUrl_(teacher.folderUrl);
    if (folderId) {
      const folder = DriveApp.getFolderById(folderId);
      try { folder.removeEditor(email); result.folder = true; } catch (err) { result.warnings.push('Folder access: ' + String(err && err.message || err)); }
      const files = folder.getFiles();
      while (files.hasNext()) {
        const file = files.next();
        try { file.removeEditor(email); result.files++; } catch (err) { result.warnings.push(file.getName() + ': ' + String(err && err.message || err)); }
      }
    }
  } catch (err) {
    result.warnings.push(String(err && err.message || err));
  }
  return result;
}

function driveIdFromUrl_(url) {
  const text = clean_(url);
  const match = text.match(/\/(?:folders|d)\/([A-Za-z0-9_-]+)/) || text.match(/[?&]id=([A-Za-z0-9_-]+)/);
  return match ? match[1] : '';
}

function getOrCreateFolder_(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
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

function now_() {
  return new Date().toISOString();
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
