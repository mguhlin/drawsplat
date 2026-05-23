/* DrawSplatTM Google Apps Script backend.
 *
 * Deploy as a Web app:
 *   Execute as: Me
 *   Who has access: your classroom/district setting
 *
 * Run setup() once before using the web app.
 */

const DS_FOLDER_NAME = 'DrawSplatTM Saves';
const DS_PROPS = PropertiesService.getScriptProperties();
const DS_SHEETS = {
  boards: 'Boards',
  rooms: 'Rooms',
  templates: 'Templates',
  turnins: 'TurnIns',
  audit: 'Audit',
  parentRequests: 'ParentRequests',
  users: 'Users'
};

const DS_AUDIT_HEADERS = ['id', 'timestamp', 'actor', 'actorRole', 'action', 'entityType', 'entityId', 'before', 'after', 'userAgent'];
const DS_PARENT_HEADERS = ['id', 'parentName', 'parentEmail', 'studentName', 'studentId', 'requestType', 'details', 'status', 'assignedTo', 'createdAt', 'decidedAt', 'decisionNote'];
const DS_USER_HEADERS = ['id', 'studentName', 'className', 'email', 'ageBand', 'ageSource', 'ageLocked', 'ageChangedBy', 'ageChangedAt', 'ageChangeReason', 'parentCodeHash', 'parentCodeExpiresAt', 'lastSeen', 'createdAt', 'notes'];
const ALLOWED_AGE_BANDS = ['under_13', '13_to_17', '18_plus', 'unknown_minor'];

/* One-time initializer. Creates or repairs the spreadsheet tabs and the Drive
 * folder used by every backend action below. */
function setup() {
  const ss = getSpreadsheet_();
  getFolder_();
  ensureSheet_(ss, DS_SHEETS.boards, ['boardId', 'title', 'className', 'updatedAt', 'jsonFileId', 'pngFileId', 'folderUrl', 'frozen', 'frozenBy', 'frozenAt', 'frozenReason']);
  ensureSheet_(ss, DS_SHEETS.rooms, ['room', 'updatedAt', 'jsonFileId', 'instanceId', 'passwordHash', 'frozen', 'frozenBy', 'frozenAt', 'frozenReason']);
  ensureSheet_(ss, DS_SHEETS.templates, ['templateId', 'name', 'updatedAt', 'jsonFileId']);
  ensureSheet_(ss, DS_SHEETS.turnins, ['turninId', 'studentName', 'className', 'title', 'updatedAt', 'jsonFileId', 'pngFileId']);
  ensureSheet_(ss, DS_SHEETS.audit, DS_AUDIT_HEADERS);
  ensureSheet_(ss, DS_SHEETS.parentRequests, DS_PARENT_HEADERS);
  ensureSheet_(ss, DS_SHEETS.users, DS_USER_HEADERS);
  if (!DS_PROPS.getProperty('PASSWORD_SALT')) DS_PROPS.setProperty('PASSWORD_SALT', Utilities.getUuid());
  return 'DrawSplatTM setup complete.';
}

/* Read endpoints for board loads, room polling, template gallery, and turn-in
 * review. All responses are JSON so the static front end can call them with
 * fetch() from any hosted DrawSplatTM page. */
function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    switch (p.action) {
      case 'load': return json_(loadBoard_(p.boardId));
      case 'roomLoad': return json_(loadRoom_(p.room, p.password, p.since));
      case 'templateList': return json_(listTemplates_());
      case 'templateLoad': return json_(loadTemplate_(p.templateId));
      case 'turnInList': return json_(listTurnIns_());
      case 'turnInLoad': return json_(loadTurnIn_(p.turninId));
      case 'ping': return json_({ ok: true, app: 'DrawSplatTM', time: now_() });
      case 'auditList': return json_(adminAuditList_(p));
      case 'parentRequestList': return json_(adminParentRequestList_(p));
      case 'privacyPacket': return privacyPacketResponse_(p);
      case 'boardList': return json_(adminBoardList_(p));
      case 'userList': return json_(adminUserList_(p));
      default: return json_({ ok: true, app: 'DrawSplatTM' });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

/* Write endpoints for board saves, room state, templates, and student turn-ins.
 * Locking in saveRoom_ protects teacher-layer data during concurrent saves. */
function doPost(e) {
  try {
    const body = parseBody_(e);
    switch (body.action) {
      case 'save': return json_(saveBoard_(body.board, body.png));
      case 'roomSave': return json_(saveRoom_(body.room, body.password, body.role, body.instanceId, body.board));
      case 'templateSave': return json_(saveTemplate_(body.template));
      case 'turnInSave': return json_(saveTurnIn_(body.turnin, body.png));
      case 'parentRequest': return json_(createParentRequest_(body));
      case 'parentRequestDecide': return json_(decideParentRequest_(body));
      case 'freezeBoard': return json_(freezeBoard_(body));
      case 'freezeRoom': return json_(freezeRoom_(body));
      case 'setAgeBand': return json_(setAgeBand_(body));
      case 'userUpsert': return json_(adminUserUpsert_(body));
      case 'issueParentCode': return json_(issueParentCode_(body));
      case 'deleteStudentData': return json_(deleteStudentData_(body));
      default: return json_({ ok: false, error: 'Unknown action.' });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

/* Board save/load persists full board JSON plus an optional PNG preview. */
function saveBoard_(board, png) {
  if (!board) throw new Error('Missing board.');
  const incomingId = String(board.boardId || '');
  if (incomingId) {
    const existing = findRow_(DS_SHEETS.boards, 'boardId', incomingId);
    if (existing && String(existing.frozen) === 'true') {
      throw new Error('This board is frozen. Saves are blocked: ' + (existing.frozenReason || 'no reason given'));
    }
  }
  const violations = scanBoardForSafety_(board);
  if (violations.length) {
    logEvent_('TEXT_FILTER_HIT', { actor: board.studentName || '', actorRole: board.mode === 'student' ? 'student' : 'teacher', entityType: 'board', entityId: incomingId || 'pending', after: { violations: violations } });
    if (safetyConfigBlocks_()) throw new Error('Content blocked by safety filter: ' + violations[0].reason);
  }
  const folder = getFolder_();
  const boardId = incomingId || ('board_' + Utilities.getUuid());
  const title = cleanName_(board.title || 'DrawSplatTM Board');
  const jsonFile = writeJsonFile_(folder, boardId + '.drawsplat.json', board);
  let pngFile = null;
  if (png) pngFile = writeDataUrlFile_(folder, boardId + '.png', png);
  upsertRow_(DS_SHEETS.boards, 'boardId', boardId, {
    boardId,
    title,
    className: board.className || '',
    updatedAt: now_(),
    jsonFileId: jsonFile.getId(),
    pngFileId: pngFile ? pngFile.getId() : '',
    folderUrl: folder.getUrl(),
    frozen: '',
    frozenBy: '',
    frozenAt: '',
    frozenReason: ''
  });
  logEvent_('BOARD_SAVE', { actor: board.studentName || '', actorRole: board.mode === 'student' ? 'student' : 'teacher', entityType: 'board', entityId: boardId, after: { title: title, hasViolations: violations.length > 0 } });
  return { ok: true, boardId, fileUrl: jsonFile.getUrl(), folderUrl: folder.getUrl(), pngUrl: pngFile ? pngFile.getUrl() : '', violations: violations };
}

function loadBoard_(boardId) {
  if (!boardId) throw new Error('Missing boardId.');
  const row = findRow_(DS_SHEETS.boards, 'boardId', boardId);
  if (!row) throw new Error('Board not found.');
  return { ok: true, board: readJsonFile_(row.jsonFileId), updatedAt: row.updatedAt };
}

/* Room collaboration stores one canonical board per room. Student saves are
 * normalized and merged into the student layer rather than replacing teacher
 * backgrounds, prompts, and answer-key objects. */
function saveRoom_(room, password, role, instanceId, board) {
  if (!room) throw new Error('Missing room.');
  if (!board) throw new Error('Missing board.');
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const existing = findRow_(DS_SHEETS.rooms, 'room', room);
    const isStudent = role === 'student' || board.mode === 'student';
    if (!existing && isStudent) throw new Error('Room not found. Ask the teacher to start the room first.');
    if (existing && String(existing.frozen) === 'true') {
      throw new Error('This room is frozen. Saves are blocked: ' + (existing.frozenReason || 'no reason given'));
    }
    if (existing) requireRoomPassword_(existing, password);
    const violations = scanBoardForSafety_(board);
    if (violations.length) {
      logEvent_('TEXT_FILTER_HIT', { actor: board.studentName || '', actorRole: isStudent ? 'student' : 'teacher', entityType: 'room', entityId: room, after: { violations: violations } });
      if (safetyConfigBlocks_()) throw new Error('Content blocked by safety filter: ' + violations[0].reason);
    }

    const folder = getFolder_();
    const updatedAt = now_();
    const incoming = normalizeRoomBoard_(board, isStudent);
    const finalBoard = existing && isStudent
      ? mergeStudentBoard_(readJsonFile_(existing.jsonFileId), incoming)
      : incoming;
    const jsonFile = existing && existing.jsonFileId
      ? updateJsonFile_(existing.jsonFileId, finalBoard)
      : writeJsonFile_(folder, 'room_' + cleanName_(room) + '.drawsplat.json', finalBoard);
    const passwordHash = existing && existing.passwordHash
      ? existing.passwordHash
      : (password ? hashPassword_(password) : '');

    upsertRow_(DS_SHEETS.rooms, 'room', room, {
      room,
      updatedAt,
      jsonFileId: jsonFile.getId(),
      instanceId: instanceId || '',
      passwordHash
    });
    return { ok: true, room, updatedAt, instanceId: instanceId || '', fileUrl: jsonFile.getUrl() };
  } finally {
    lock.releaseLock();
  }
}

function loadRoom_(room, password, since) {
  if (!room) throw new Error('Missing room.');
  const row = findRow_(DS_SHEETS.rooms, 'room', room);
  if (!row) throw new Error('Room not found.');
  requireRoomPassword_(row, password);
  if (since && row.updatedAt && String(since) === String(row.updatedAt)) {
    return { ok: true, room, updatedAt: row.updatedAt, instanceId: row.instanceId || '' };
  }
  return { ok: true, room, board: readJsonFile_(row.jsonFileId), updatedAt: row.updatedAt, instanceId: row.instanceId || '' };
}

/* Template and turn-in helpers use the same Drive JSON + Sheets index pattern
 * as board saves so the front end only has to track IDs. */
function saveTemplate_(template) {
  if (!template) throw new Error('Missing template.');
  const folder = getFolder_();
  const templateId = 'template_' + Utilities.getUuid();
  const name = cleanName_(template.name || 'Template');
  const jsonFile = writeJsonFile_(folder, templateId + '.json', template);
  upsertRow_(DS_SHEETS.templates, 'templateId', templateId, {
    templateId,
    name,
    updatedAt: now_(),
    jsonFileId: jsonFile.getId()
  });
  return { ok: true, templateId, fileUrl: jsonFile.getUrl() };
}

function listTemplates_() {
  return { ok: true, templates: readRows_(DS_SHEETS.templates).map(r => ({
    templateId: r.templateId,
    name: r.name,
    updatedAt: r.updatedAt
  })) };
}

function loadTemplate_(templateId) {
  if (!templateId) throw new Error('Missing templateId.');
  const row = findRow_(DS_SHEETS.templates, 'templateId', templateId);
  if (!row) throw new Error('Template not found.');
  return { ok: true, template: readJsonFile_(row.jsonFileId), updatedAt: row.updatedAt };
}

function saveTurnIn_(turnin, png) {
  if (!turnin || !turnin.board) throw new Error('Missing turn-in.');
  const folder = getFolder_();
  const turninId = 'turnin_' + Utilities.getUuid();
  const jsonFile = writeJsonFile_(folder, turninId + '.json', turnin);
  let pngFile = null;
  if (png) pngFile = writeDataUrlFile_(folder, turninId + '.png', png);
  upsertRow_(DS_SHEETS.turnins, 'turninId', turninId, {
    turninId,
    studentName: turnin.studentName || '',
    className: turnin.className || '',
    title: turnin.title || '',
    updatedAt: now_(),
    jsonFileId: jsonFile.getId(),
    pngFileId: pngFile ? pngFile.getId() : ''
  });
  upsertUserFromTurnIn_(turnin);
  return { ok: true, turninId, fileUrl: jsonFile.getUrl(), pngUrl: pngFile ? pngFile.getUrl() : '' };
}

function listTurnIns_() {
  return { ok: true, turnins: readRows_(DS_SHEETS.turnins).map(r => ({
    turninId: r.turninId,
    studentName: r.studentName,
    className: r.className,
    title: r.title,
    updatedAt: r.updatedAt
  })) };
}

function loadTurnIn_(turninId) {
  if (!turninId) throw new Error('Missing turninId.');
  const row = findRow_(DS_SHEETS.turnins, 'turninId', turninId);
  if (!row) throw new Error('Turn-in not found.');
  return { ok: true, turnin: readJsonFile_(row.jsonFileId), updatedAt: row.updatedAt };
}

/* Student normalization is the main backend guardrail. It strips non-student
 * objects before merge so hidden front-end controls are not treated as security. */
function normalizeRoomBoard_(board, isStudent) {
  const b = JSON.parse(JSON.stringify(board || {}));
  if (isStudent) {
    b.mode = 'student';
    b.assignmentMode = true;
    b.currentLayer = 'student';
    b.showAnswerKey = false;
    (b.panels || []).forEach(p => {
      p.objects = (p.objects || []).filter(o => !o.layer || o.layer === 'student').map(o => {
        o.layer = 'student';
        o.locked = false;
        return o;
      });
    });
  }
  return b;
}

function mergeStudentBoard_(baseBoard, studentBoard) {
  const base = JSON.parse(JSON.stringify(baseBoard || {}));
  const incomingPanels = studentBoard.panels || [];
  base.studentName = studentBoard.studentName || base.studentName || '';
  base.mode = 'teacher';
  base.assignmentMode = true;
  base.currentLayer = base.currentLayer || 'teacher';
  (base.panels || []).forEach((panel, i) => {
    const incoming = incomingPanels[i] || {};
    const protectedObjects = (panel.objects || []).filter(o => (o.layer || 'shared') !== 'student');
    const studentMap = {};
    (panel.objects || []).filter(o => (o.layer || 'shared') === 'student').forEach(o => studentMap[o.id] = o);
    (incoming.objects || []).filter(o => !o.layer || o.layer === 'student').forEach(o => {
      o.layer = 'student';
      o.locked = false;
      studentMap[o.id] = o;
    });
    panel.objects = protectedObjects.concat(Object.keys(studentMap).map(id => studentMap[id]));
  });
  return base;
}

function requireRoomPassword_(row, password) {
  if (!row.passwordHash) return;
  if (!password) throw new Error('Room password required.');
  if (hashPassword_(password) !== row.passwordHash) throw new Error('Incorrect room password.');
}

function hashPassword_(password) {
  const salt = DS_PROPS.getProperty('PASSWORD_SALT') || 'DrawSplatTM';
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + password);
  return bytes.map(b => ('0' + ((b < 0 ? b + 256 : b).toString(16))).slice(-2)).join('');
}

/* Storage primitives. These wrap Drive, Sheets, JSON serialization, and data
 * URL decoding so the endpoint handlers stay focused on DrawSplatTM concepts. */
function parseBody_(e) {
  const raw = e && e.postData && e.postData.contents;
  if (!raw) return {};
  return JSON.parse(raw);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet_() {
  const id = DS_PROPS.getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    DS_PROPS.setProperty('SPREADSHEET_ID', active.getId());
    return active;
  }
  const ss = SpreadsheetApp.create('DrawSplatTM Saves');
  DS_PROPS.setProperty('SPREADSHEET_ID', ss.getId());
  return ss;
}

function getFolder_() {
  const id = DS_PROPS.getProperty('FOLDER_ID');
  if (id) return DriveApp.getFolderById(id);
  const folder = DriveApp.createFolder(DS_FOLDER_NAME);
  DS_PROPS.setProperty('FOLDER_ID', folder.getId());
  return folder;
}

function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  const current = sheet.getRange(1, 1, 1, Math.max(headers.length, sheet.getLastColumn() || 1)).getValues()[0];
  if (current.slice(0, headers.length).join('|') !== headers.join('|')) {
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function sheet_(name) {
  setup();
  return getSpreadsheet_().getSheetByName(name);
}

function readRows_(sheetName) {
  const sheet = sheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(r => r.some(v => v !== '')).map(r => rowObject_(headers, r));
}

function findRow_(sheetName, key, value) {
  return readRows_(sheetName).find(r => String(r[key]) === String(value)) || null;
}

function upsertRow_(sheetName, key, keyValue, obj) {
  const sheet = sheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const keyCol = headers.indexOf(key);
  if (keyCol < 0) throw new Error('Missing key column: ' + key);
  const row = headers.map(h => obj[h] == null ? '' : obj[h]);
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][keyCol]) === String(keyValue)) {
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([row]);
      return;
    }
  }
  sheet.appendRow(row);
}

function rowObject_(headers, row) {
  const obj = {};
  headers.forEach((h, i) => obj[h] = row[i]);
  return obj;
}

function writeJsonFile_(folder, name, obj) {
  return folder.createFile(name, JSON.stringify(obj, null, 2), MimeType.PLAIN_TEXT);
}

function updateJsonFile_(fileId, obj) {
  const file = DriveApp.getFileById(fileId);
  file.setContent(JSON.stringify(obj, null, 2));
  return file;
}

function readJsonFile_(fileId) {
  return JSON.parse(DriveApp.getFileById(fileId).getBlob().getDataAsString());
}

function writeDataUrlFile_(folder, name, dataUrl) {
  const m = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error('Invalid data URL.');
  const bytes = Utilities.base64Decode(m[2]);
  return folder.createFile(Utilities.newBlob(bytes, m[1], name));
}

function cleanName_(name) {
  return String(name || 'DrawSplatTM').replace(/[\\/:*?"<>|#%{}^~[\]`]+/g, '-').slice(0, 120);
}

function now_() {
  return new Date().toISOString();
}

/* --- Compliance: Activity Records (Day 1.7) --------------------------------- */

/* logEvent_(action, payload) appends an audit row. Call from any endpoint that
 * needs to leave a trail. `payload` accepts actor, actorRole, entityType,
 * entityId, before, after, userAgent (optional). */
function logEvent_(action, payload) {
  try {
    const p = payload || {};
    const row = {
      id: 'evt_' + Utilities.getUuid(),
      timestamp: now_(),
      actor: String(p.actor || ''),
      actorRole: String(p.actorRole || ''),
      action: String(action || ''),
      entityType: String(p.entityType || ''),
      entityId: String(p.entityId || ''),
      before: typeof p.before === 'string' ? p.before : (p.before == null ? '' : JSON.stringify(p.before)),
      after: typeof p.after === 'string' ? p.after : (p.after == null ? '' : JSON.stringify(p.after)),
      userAgent: String(p.userAgent || '')
    };
    upsertRow_(DS_SHEETS.audit, 'id', row.id, row);
  } catch (err) {
    // Auditing must never break the calling endpoint.
  }
}

/* adminAuditList_ returns recent audit rows for the Activity Records viewer.
 * Requires the ADMIN_PASSCODE script property (same passcode used by the
 * Teacher Admin page). Supports filters: action, actor, since, limit. */
function adminAuditList_(p) {
  requireAdmin_(p);
  const rows = readRows_(DS_SHEETS.audit);
  const action = String((p && p.actionFilter) || '').trim();
  const actor = String((p && p.actor) || '').trim().toLowerCase();
  const since = String((p && p.since) || '').trim();
  const limit = Math.max(1, Math.min(parseInt((p && p.limit) || '200', 10), 1000));
  let filtered = rows;
  if (action) filtered = filtered.filter(r => String(r.action) === action);
  if (actor) filtered = filtered.filter(r => String(r.actor || '').toLowerCase().indexOf(actor) !== -1);
  if (since) filtered = filtered.filter(r => String(r.timestamp || '') >= since);
  filtered.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  return { ok: true, events: filtered.slice(0, limit), totalMatched: filtered.length };
}

/* --- Compliance: Parent Request Center (Days 2.3 / 2.4) -------------------- */

/* Creates a parent request ticket. Open endpoint (anyone can submit); details
 * are stored as `pending_verification` until a teacher-issued code matches
 * (verification flow added in Day 2.5). */
function createParentRequest_(body) {
  const allowedTypes = ['view', 'export', 'correct', 'delete', 'pause', 'safety_report', 'privacy_question'];
  const requestType = String((body && body.requestType) || '');
  if (allowedTypes.indexOf(requestType) === -1) throw new Error('Unsupported request type.');
  const parentEmail = String((body && body.parentEmail) || '').trim().toLowerCase();
  const parentName = String((body && body.parentName) || '').trim();
  const studentName = String((body && body.studentName) || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) throw new Error('Valid parent email is required.');
  if (!parentName) throw new Error('Parent name is required.');
  if (!studentName) throw new Error('Student name is required.');
  const id = 'req_' + Utilities.getUuid();
  const code = String((body && body.verificationCode) || '').trim().toUpperCase();
  const className = String((body && body.className) || '').trim();
  let verified = false;
  if (code) {
    const matchedUser = verifyParentCode_(studentName, className, code);
    if (matchedUser) verified = true;
  }
  const row = {
    id: id,
    parentName: parentName,
    parentEmail: parentEmail,
    studentName: studentName,
    studentId: String((body && body.studentId) || '').trim(),
    requestType: requestType,
    details: String((body && body.details) || '').slice(0, 2000),
    status: verified ? 'verified' : 'pending_verification',
    assignedTo: '',
    createdAt: now_(),
    decidedAt: '',
    decisionNote: verified ? 'Verified via teacher-issued code.' : ''
  };
  upsertRow_(DS_SHEETS.parentRequests, 'id', id, row);
  logEvent_('PARENT_REQUEST_CREATED', {
    actor: parentEmail,
    actorRole: 'parent',
    entityType: 'parent_request',
    entityId: id,
    after: { requestType: requestType, studentName: studentName, verified: verified }
  });
  notifyComplianceAdmin_('New parent request: ' + requestType,
    'Ticket ' + id + ' from ' + parentName + ' <' + parentEmail + '> for student ' + studentName + '.\n\nDetails:\n' + (row.details || '(none)'));
  return { ok: true, id: id, status: row.status };
}

/* Teacher / district admin decides a parent request. Requires ADMIN_PASSCODE. */
function decideParentRequest_(body) {
  requireAdmin_(body);
  const id = String((body && body.id) || '');
  const decision = String((body && body.decision) || '');
  if (['approved', 'denied', 'completed'].indexOf(decision) === -1) throw new Error('Invalid decision.');
  const existing = findRow_(DS_SHEETS.parentRequests, 'id', id);
  if (!existing) throw new Error('Request not found.');
  const patch = {
    id: id,
    parentName: existing.parentName,
    parentEmail: existing.parentEmail,
    studentName: existing.studentName,
    studentId: existing.studentId,
    requestType: existing.requestType,
    details: existing.details,
    status: decision,
    assignedTo: String((body && body.assignedTo) || existing.assignedTo || ''),
    createdAt: existing.createdAt,
    decidedAt: now_(),
    decisionNote: String((body && body.decisionNote) || '').slice(0, 2000)
  };
  upsertRow_(DS_SHEETS.parentRequests, 'id', id, patch);
  logEvent_('PARENT_REQUEST_DECIDED', {
    actor: String((body && body.actor) || 'admin'),
    actorRole: 'admin',
    entityType: 'parent_request',
    entityId: id,
    before: { status: existing.status },
    after: { status: decision, decisionNote: patch.decisionNote }
  });
  return { ok: true, id: id, status: decision };
}

function adminParentRequestList_(p) {
  requireAdmin_(p);
  const rows = readRows_(DS_SHEETS.parentRequests);
  rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return { ok: true, requests: rows };
}

/* --- Compliance: District Privacy Packet (Day 3.6) -------------------------- */

/* Returns a downloadable ZIP file via Apps Script ContentService. Bundle
 * contents: the current compliance config snapshot, the last 90 days of
 * Activity Records as CSV, the parent-requests roster as CSV, and a
 * generated README listing what's inside and how to read it. Static legal
 * documents (Terms & Privacy, District Addendum, Compliance Roadmap) are
 * referenced by URL because they live with the site, not the script. */
function privacyPacketResponse_(p) {
  try {
    requireAdmin_(p);
    const zipName = 'DrawSplat-District-Privacy-Packet-' + new Date().toISOString().slice(0, 10) + '.zip';
    const cfg = readComplianceConfig_();
    const auditSince = Utilities.formatDate(new Date(Date.now() - 90 * 86400000), 'UTC', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const auditRows = readRows_(DS_SHEETS.audit).filter(r => String(r.timestamp || '') >= auditSince);
    const parentRows = readRows_(DS_SHEETS.parentRequests);
    const readme = [
      'DrawSplat District Privacy Packet',
      'Generated: ' + now_(),
      '',
      'Contents:',
      '  compliance-config.json   Current compliance configuration snapshot.',
      '  activity-records.csv     Activity Records (audit log) for the last 90 days.',
      '  parent-requests.csv      Parent Request Center tickets (all statuses).',
      '  README.txt               This file.',
      '',
      'Companion documents (hosted on the DrawSplat site):',
      '  Terms & Privacy          https://drawsplat.org/legal/terms-privacy.html',
      '  District Addendum        https://drawsplat.org/legal/district-addendum.html',
      '  Compliance Roadmap       https://drawsplat.org/COMPLIANCE-ROADMAP.md',
      '',
      'How to use:',
      '  Open the CSV files in any spreadsheet. The config JSON is the source',
      '  of truth for what safety, parent-access, age-lock, time-limit, and',
      '  retention controls are active. Review the Activity Records to spot',
      '  unusual patterns. Track parent requests for SLA compliance.'
    ].join('\n');
    const blobs = [
      Utilities.newBlob(JSON.stringify(cfg, null, 2), 'application/json', 'compliance-config.json'),
      Utilities.newBlob(rowsToCsv_(DS_AUDIT_HEADERS, auditRows), 'text/csv', 'activity-records.csv'),
      Utilities.newBlob(rowsToCsv_(DS_PARENT_HEADERS, parentRows), 'text/csv', 'parent-requests.csv'),
      Utilities.newBlob(readme, 'text/plain', 'README.txt')
    ];
    const zip = Utilities.zip(blobs, zipName);
    logEvent_('DATA_EXPORT', {
      actor: String((p && p.actor) || 'admin'),
      actorRole: 'admin',
      entityType: 'privacy_packet',
      after: { auditRowsIncluded: auditRows.length, parentRowsIncluded: parentRows.length }
    });
    return json_({
      ok: true,
      filename: zipName,
      contentBase64: Utilities.base64Encode(zip.getBytes()),
      auditRowsIncluded: auditRows.length,
      parentRowsIncluded: parentRows.length
    });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function readComplianceConfig_() {
  const stored = DS_PROPS.getProperty('COMPLIANCE_CONFIG');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return { note: 'No server-side compliance configuration set. Default ships in compliance.config.json at the repo root.' };
}

function rowsToCsv_(headers, rows) {
  const escape = v => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [headers.join(',')];
  rows.forEach(r => lines.push(headers.map(h => escape(r[h])).join(',')));
  return lines.join('\n');
}

/* --- Compliance: shared admin guard and notifier --------------------------- */

function requireAdmin_(p) {
  const configured = String(DS_PROPS.getProperty('ADMIN_PASSCODE') || '').trim();
  if (!configured) throw new Error('ADMIN_PASSCODE script property is not set.');
  const supplied = String((p && p.passcode) || '').trim();
  if (supplied !== configured) throw new Error('Invalid admin passcode.');
}

function notifyComplianceAdmin_(subject, body) {
  const to = String(DS_PROPS.getProperty('COMPLIANCE_ADMIN_EMAIL') || '').trim();
  if (!to) return;
  try {
    MailApp.sendEmail({ to: to, subject: '[DrawSplat] ' + subject, body: body });
  } catch (err) {
    // Notification failures are non-fatal.
  }
}

/* --- Compliance: Safety filters (Days 1.1 / 1.2 / 1.5) -------------------- */

/* safetyConfig_() returns the active text + link safety configuration. If a
 * COMPLIANCE_CONFIG Script Property is set (typically pushed from Teacher
 * Admin in Day 3.2), that config wins. Otherwise we use the same defaults
 * that ship in compliance.config.json. */
function safetyConfig_() {
  const stored = DS_PROPS.getProperty('COMPLIANCE_CONFIG');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.safety) return parsed.safety;
    } catch (e) {}
  }
  return {
    text: {
      enabled: true,
      patterns: [
        '\\b(kill myself|suicide|self harm|self-harm)\\b',
        '\\b(nude|porn|sexually explicit)\\b',
        '\\b(cocaine|meth|fentanyl|heroin)\\b',
        '\\b(harass|stalk|doxx|doxxing)\\b'
      ],
      words: [],
      blockOnMatch: true,
      logOnMatch: true,
      appliesTo: ['sticky', 'text', 'comment', 'boardTitle']
    },
    links: {
      enabled: true,
      blockUnapproved: true,
      allowedDomains: ['tcea.org', 'edu.google.com', 'khanacademy.org', 'loc.gov', 'nasa.gov', 'smithsonian.org', 'drawsplat.org']
    }
  };
}

function safetyConfigBlocks_() {
  const cfg = safetyConfig_();
  if (!cfg || !cfg.text) return false;
  return cfg.text.blockOnMatch !== false;
}

/* scanBoardForSafety_(board) walks every panel.objects[] and the board
 * title, checks each text field against the active safety config, and
 * returns a list of {surface, type, sample, reason} violations. Returns
 * an empty array if nothing is flagged. */
function scanBoardForSafety_(board) {
  const cfg = safetyConfig_();
  const text = cfg && cfg.text && cfg.text.enabled !== false ? cfg.text : null;
  const links = cfg && cfg.links && cfg.links.enabled !== false ? cfg.links : null;
  const violations = [];
  if (!text && !links) return violations;
  const textPatterns = text ? compilePatterns_(text.patterns || []) : [];
  const wordsPattern = text ? wordsToPattern_(text.words || []) : null;
  const allowedDomains = links ? (links.allowedDomains || []).map(d => String(d).toLowerCase()) : [];
  const checkOne = (val, surface, type, entityId) => {
    const s = String(val == null ? '' : val);
    if (!s) return;
    if (text && text.appliesTo && text.appliesTo.indexOf(surface) === -1) {
      // skip text-pattern check for surfaces opted out
    } else if (text) {
      for (let i = 0; i < textPatterns.length; i++) {
        const m = s.match(textPatterns[i]);
        if (m) { violations.push({ surface: surface, type: type, entityId: entityId, sample: m[0], reason: 'flagged-text' }); break; }
      }
      if (wordsPattern) {
        const m = s.match(wordsPattern);
        if (m) violations.push({ surface: surface, type: type, entityId: entityId, sample: m[0], reason: 'flagged-word' });
      }
    }
    if (links && links.blockUnapproved) {
      const urls = (s.match(/\bhttps?:\/\/[^\s<>"')]+/gi) || []);
      urls.forEach(u => {
        let host = '';
        try { host = u.split('/')[2].toLowerCase(); } catch (e) { host = ''; }
        if (!host) return;
        const ok = allowedDomains.some(d => host === d || host.indexOf('.' + d) !== -1);
        if (!ok) violations.push({ surface: surface, type: type, entityId: entityId, sample: host, reason: 'blocked-link' });
      });
    }
  };
  if (board && board.title) checkOne(board.title, 'boardTitle', 'board', '');
  (board && board.panels ? board.panels : []).forEach(panel => {
    (panel.objects || []).forEach(obj => {
      const surface = obj.type === 'sticky' ? 'sticky' : (obj.type === 'text' ? 'text' : (obj.type === 'comment' ? 'comment' : (obj.type === 'connector' ? 'connectorLabel' : obj.type)));
      const value = obj.type === 'connector' ? (obj.connectorLabel || '') : (obj.text || '');
      checkOne(value, surface, obj.type || 'unknown', obj.id || '');
    });
  });
  return violations;
}

function compilePatterns_(list) {
  const out = [];
  (list || []).forEach(src => {
    try { out.push(new RegExp(src, 'i')); } catch (e) {}
  });
  return out;
}

function wordsToPattern_(words) {
  if (!words || !words.length) return null;
  const escaped = words.map(w => String(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  try { return new RegExp('\\b(' + escaped.join('|') + ')\\b', 'i'); } catch (e) { return null; }
}

/* --- Compliance: Board freeze (Day 1.6) ----------------------------------- */

function freezeBoard_(body) {
  requireAdmin_(body);
  const id = String((body && body.boardId) || '');
  const frozen = String((body && body.frozen) || 'true').toLowerCase() !== 'false';
  const reason = String((body && body.reason) || '').slice(0, 500);
  const actor = String((body && body.actor) || 'admin');
  const existing = findRow_(DS_SHEETS.boards, 'boardId', id);
  if (!existing) throw new Error('Board not found.');
  upsertRow_(DS_SHEETS.boards, 'boardId', id, {
    boardId: id,
    title: existing.title || '',
    className: existing.className || '',
    updatedAt: existing.updatedAt || '',
    jsonFileId: existing.jsonFileId || '',
    pngFileId: existing.pngFileId || '',
    folderUrl: existing.folderUrl || '',
    frozen: frozen ? 'true' : '',
    frozenBy: frozen ? actor : '',
    frozenAt: frozen ? now_() : '',
    frozenReason: frozen ? reason : ''
  });
  logEvent_(frozen ? 'BOARD_FREEZE' : 'BOARD_UNFREEZE', { actor: actor, actorRole: 'admin', entityType: 'board', entityId: id, after: { frozen: frozen, reason: reason } });
  return { ok: true, boardId: id, frozen: frozen };
}

function freezeRoom_(body) {
  requireAdmin_(body);
  const room = String((body && body.room) || '');
  const frozen = String((body && body.frozen) || 'true').toLowerCase() !== 'false';
  const reason = String((body && body.reason) || '').slice(0, 500);
  const actor = String((body && body.actor) || 'admin');
  const existing = findRow_(DS_SHEETS.rooms, 'room', room);
  if (!existing) throw new Error('Room not found.');
  upsertRow_(DS_SHEETS.rooms, 'room', room, {
    room: room,
    updatedAt: existing.updatedAt || '',
    jsonFileId: existing.jsonFileId || '',
    instanceId: existing.instanceId || '',
    passwordHash: existing.passwordHash || '',
    frozen: frozen ? 'true' : '',
    frozenBy: frozen ? actor : '',
    frozenAt: frozen ? now_() : '',
    frozenReason: frozen ? reason : ''
  });
  logEvent_(frozen ? 'BOARD_FREEZE' : 'BOARD_UNFREEZE', { actor: actor, actorRole: 'admin', entityType: 'room', entityId: room, after: { frozen: frozen, reason: reason } });
  return { ok: true, room: room, frozen: frozen };
}

function adminBoardList_(p) {
  requireAdmin_(p);
  const limit = Math.max(1, Math.min(parseInt((p && p.limit) || '100', 10), 500));
  const boards = readRows_(DS_SHEETS.boards);
  boards.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  const rooms = readRows_(DS_SHEETS.rooms).map(r => ({
    kind: 'room', id: r.room, title: r.room, updatedAt: r.updatedAt || '',
    frozen: String(r.frozen) === 'true', frozenBy: r.frozenBy || '', frozenAt: r.frozenAt || '', frozenReason: r.frozenReason || ''
  }));
  const boardSlim = boards.slice(0, limit).map(b => ({
    kind: 'board', id: b.boardId, title: b.title || '(untitled)', className: b.className || '', updatedAt: b.updatedAt || '',
    frozen: String(b.frozen) === 'true', frozenBy: b.frozenBy || '', frozenAt: b.frozenAt || '', frozenReason: b.frozenReason || '',
    fileUrl: b.jsonFileId ? 'https://drive.google.com/file/d/' + b.jsonFileId + '/view' : ''
  }));
  return { ok: true, boards: boardSlim, rooms: rooms };
}

/* --- Compliance: Users + Age Band Lock (Days 2.1 / 2.2) -------------------- */

function userKey_(studentName, className) {
  return cleanName_(String(studentName || '')).toLowerCase() + '||' + cleanName_(String(className || '')).toLowerCase();
}

function findUserByStudent_(studentName, className) {
  if (!studentName) return null;
  const target = userKey_(studentName, className);
  const rows = readRows_(DS_SHEETS.users);
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (userKey_(r.studentName, r.className) === target) return r;
  }
  return null;
}

function upsertUserFromTurnIn_(turnin) {
  try {
    const studentName = String(turnin.studentName || '').trim();
    if (!studentName) return null;
    const className = String(turnin.className || '').trim();
    const existing = findUserByStudent_(studentName, className);
    const now = now_();
    if (existing) {
      upsertRow_(DS_SHEETS.users, 'id', existing.id, Object.assign({}, existing, { lastSeen: now }));
      return existing.id;
    }
    const id = 'user_' + Utilities.getUuid();
    upsertRow_(DS_SHEETS.users, 'id', id, {
      id: id,
      studentName: studentName,
      className: className,
      email: '',
      ageBand: 'unknown_minor',
      ageSource: 'turnin',
      ageLocked: 'true',
      ageChangedBy: '',
      ageChangedAt: '',
      ageChangeReason: '',
      parentCodeHash: '',
      parentCodeExpiresAt: '',
      lastSeen: now,
      createdAt: now,
      notes: ''
    });
    return id;
  } catch (err) {
    return null;
  }
}

function adminUserList_(p) {
  requireAdmin_(p);
  const rows = readRows_(DS_SHEETS.users);
  // Hide the password-style fields from the wire response.
  const slim = rows.map(r => ({
    id: r.id,
    studentName: r.studentName,
    className: r.className,
    email: r.email,
    ageBand: r.ageBand || 'unknown_minor',
    ageSource: r.ageSource || '',
    ageLocked: String(r.ageLocked) !== 'false',
    ageChangedBy: r.ageChangedBy || '',
    ageChangedAt: r.ageChangedAt || '',
    ageChangeReason: r.ageChangeReason || '',
    hasParentCode: !!r.parentCodeHash,
    parentCodeExpiresAt: r.parentCodeExpiresAt || '',
    lastSeen: r.lastSeen || '',
    createdAt: r.createdAt || '',
    notes: r.notes || ''
  }));
  slim.sort((a, b) => String(a.studentName || '').localeCompare(String(b.studentName || '')));
  return { ok: true, users: slim };
}

function adminUserUpsert_(p) {
  requireAdmin_(p);
  const studentName = clean_(p.studentName || '');
  if (!studentName) throw new Error('Student name is required.');
  const className = clean_(p.className || '');
  const existing = findUserByStudent_(studentName, className);
  const now = now_();
  const id = existing ? existing.id : ('user_' + Utilities.getUuid());
  const before = existing ? { ageBand: existing.ageBand, email: existing.email, notes: existing.notes } : null;
  const ageBand = ALLOWED_AGE_BANDS.indexOf(p.ageBand) !== -1 ? p.ageBand : (existing && existing.ageBand) || 'unknown_minor';
  const row = {
    id: id,
    studentName: studentName,
    className: className,
    email: clean_(p.email || (existing && existing.email) || ''),
    ageBand: ageBand,
    ageSource: clean_(p.ageSource || (existing && existing.ageSource) || (existing ? existing.ageSource : 'admin')),
    ageLocked: existing ? existing.ageLocked : 'true',
    ageChangedBy: existing ? existing.ageChangedBy : '',
    ageChangedAt: existing ? existing.ageChangedAt : '',
    ageChangeReason: existing ? existing.ageChangeReason : '',
    parentCodeHash: existing ? existing.parentCodeHash : '',
    parentCodeExpiresAt: existing ? existing.parentCodeExpiresAt : '',
    lastSeen: existing ? existing.lastSeen : now,
    createdAt: existing ? existing.createdAt : now,
    notes: clean_(p.notes || (existing && existing.notes) || '')
  };
  upsertRow_(DS_SHEETS.users, 'id', id, row);
  logEvent_(existing ? 'USER_UPDATED' : 'USER_CREATED', {
    actor: String((p && p.actor) || 'admin'), actorRole: 'admin',
    entityType: 'user', entityId: id,
    before: before, after: { ageBand: ageBand, studentName: studentName, className: className }
  });
  return { ok: true, id: id };
}

function setAgeBand_(p) {
  requireAdmin_(p);
  const id = clean_(p.id || '');
  const newBand = String(p.ageBand || '');
  const reason = clean_(p.reason || '');
  const actor = String((p && p.actor) || 'admin');
  if (ALLOWED_AGE_BANDS.indexOf(newBand) === -1) throw new Error('Invalid age band.');
  if (!reason) throw new Error('A reason is required for age-band changes.');
  const existing = findRow_(DS_SHEETS.users, 'id', id);
  if (!existing) throw new Error('User not found.');
  // Server is the gatekeeper for the lock even when called by admin: allow only
  // when the caller is the admin (already validated by requireAdmin_).
  const updated = Object.assign({}, existing, {
    ageBand: newBand,
    ageSource: 'admin',
    ageLocked: 'true',
    ageChangedBy: actor,
    ageChangedAt: now_(),
    ageChangeReason: reason
  });
  upsertRow_(DS_SHEETS.users, 'id', id, updated);
  logEvent_('AGE_BAND_CHANGED', {
    actor: actor, actorRole: 'admin',
    entityType: 'user', entityId: id,
    before: { ageBand: existing.ageBand || '' },
    after: { ageBand: newBand, reason: reason }
  });
  return { ok: true, id: id, ageBand: newBand };
}

/* --- Compliance: Teacher-issued parent verification code (Day 2.5) --------- */

function issueParentCode_(p) {
  requireAdmin_(p);
  const id = clean_(p.id || '');
  const actor = String((p && p.actor) || 'admin');
  const existing = findRow_(DS_SHEETS.users, 'id', id);
  if (!existing) throw new Error('User not found.');
  // 8-char alphanumeric code, unambiguous (no 0/O/1/I).
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  const salt = String(DS_PROPS.getProperty('PASSWORD_SALT') || 'drawsplat-default-salt');
  const hash = hashCode_(code, salt);
  const expiresAt = new Date(Date.now() + 14 * 86400000).toISOString();
  const updated = Object.assign({}, existing, {
    parentCodeHash: hash,
    parentCodeExpiresAt: expiresAt
  });
  upsertRow_(DS_SHEETS.users, 'id', id, updated);
  logEvent_('PARENT_CODE_ISSUED', {
    actor: actor, actorRole: 'admin',
    entityType: 'user', entityId: id,
    after: { expiresAt: expiresAt }
  });
  return { ok: true, id: id, code: code, expiresAt: expiresAt };
}

function verifyParentCode_(studentName, className, code) {
  if (!code) return null;
  const existing = findUserByStudent_(studentName, className);
  if (!existing) return null;
  const hash = existing.parentCodeHash;
  if (!hash) return null;
  if (existing.parentCodeExpiresAt && existing.parentCodeExpiresAt < now_()) return null;
  const salt = String(DS_PROPS.getProperty('PASSWORD_SALT') || 'drawsplat-default-salt');
  const supplied = hashCode_(String(code || '').toUpperCase(), salt);
  if (supplied !== hash) return null;
  // Single-use code: clear after successful verification.
  upsertRow_(DS_SHEETS.users, 'id', existing.id, Object.assign({}, existing, { parentCodeHash: '', parentCodeExpiresAt: '' }));
  return existing;
}

function hashCode_(value, salt) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(salt) + ':' + String(value));
  return Utilities.base64Encode(bytes);
}

/* --- Compliance: Data deletion (Day 2.7) ----------------------------------- */

function deleteStudentData_(p) {
  requireAdmin_(p);
  const studentName = clean_(p.studentName || '');
  const className = clean_(p.className || '');
  if (!studentName) throw new Error('Student name is required.');
  const actor = String((p && p.actor) || 'admin');
  let boardsDeleted = 0, turninsDeleted = 0, userDeleted = 0;
  const matches = function(row) {
    const sn = String(row.studentName || '').trim().toLowerCase();
    const cn = String(row.className || '').trim().toLowerCase();
    if (className) return sn === studentName.toLowerCase() && cn === className.toLowerCase();
    return sn === studentName.toLowerCase();
  };
  // Trash and remove turn-in files matching the student.
  const turninSheet = sheet_(DS_SHEETS.turnins);
  const turninValues = turninSheet.getDataRange().getValues();
  for (let i = turninValues.length - 1; i >= 1; i--) {
    const row = rowObject_(turninValues[0], turninValues[i]);
    if (matches(row)) {
      try { if (row.jsonFileId) DriveApp.getFileById(row.jsonFileId).setTrashed(true); } catch (e) {}
      try { if (row.pngFileId) DriveApp.getFileById(row.pngFileId).setTrashed(true); } catch (e) {}
      turninSheet.deleteRow(i + 1);
      turninsDeleted++;
    }
  }
  // Boards keyed by className — limited to className match if provided.
  const boardSheet = sheet_(DS_SHEETS.boards);
  const boardValues = boardSheet.getDataRange().getValues();
  if (className) {
    for (let i = boardValues.length - 1; i >= 1; i--) {
      const row = rowObject_(boardValues[0], boardValues[i]);
      if (String(row.className || '').trim().toLowerCase() === className.toLowerCase()
          && String(row.title || '').toLowerCase().indexOf(studentName.toLowerCase()) !== -1) {
        try { if (row.jsonFileId) DriveApp.getFileById(row.jsonFileId).setTrashed(true); } catch (e) {}
        try { if (row.pngFileId) DriveApp.getFileById(row.pngFileId).setTrashed(true); } catch (e) {}
        boardSheet.deleteRow(i + 1);
        boardsDeleted++;
      }
    }
  }
  // Remove the user row.
  const userSheet = sheet_(DS_SHEETS.users);
  const userValues = userSheet.getDataRange().getValues();
  for (let i = userValues.length - 1; i >= 1; i--) {
    const row = rowObject_(userValues[0], userValues[i]);
    if (matches(row)) { userSheet.deleteRow(i + 1); userDeleted++; }
  }
  logEvent_('DATA_DELETED', {
    actor: actor, actorRole: 'admin',
    entityType: 'student_data',
    entityId: studentName + '|' + className,
    after: { boardsDeleted: boardsDeleted, turninsDeleted: turninsDeleted, userDeleted: userDeleted, reason: clean_(p.reason || '') }
  });
  return { ok: true, boardsDeleted: boardsDeleted, turninsDeleted: turninsDeleted, userDeleted: userDeleted };
}
