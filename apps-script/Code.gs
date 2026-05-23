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
  parentRequests: 'ParentRequests'
};

const DS_AUDIT_HEADERS = ['id', 'timestamp', 'actor', 'actorRole', 'action', 'entityType', 'entityId', 'before', 'after', 'userAgent'];
const DS_PARENT_HEADERS = ['id', 'parentName', 'parentEmail', 'studentName', 'studentId', 'requestType', 'details', 'status', 'assignedTo', 'createdAt', 'decidedAt', 'decisionNote'];

/* One-time initializer. Creates or repairs the spreadsheet tabs and the Drive
 * folder used by every backend action below. */
function setup() {
  const ss = getSpreadsheet_();
  getFolder_();
  ensureSheet_(ss, DS_SHEETS.boards, ['boardId', 'title', 'className', 'updatedAt', 'jsonFileId', 'pngFileId', 'folderUrl']);
  ensureSheet_(ss, DS_SHEETS.rooms, ['room', 'updatedAt', 'jsonFileId', 'instanceId', 'passwordHash']);
  ensureSheet_(ss, DS_SHEETS.templates, ['templateId', 'name', 'updatedAt', 'jsonFileId']);
  ensureSheet_(ss, DS_SHEETS.turnins, ['turninId', 'studentName', 'className', 'title', 'updatedAt', 'jsonFileId', 'pngFileId']);
  ensureSheet_(ss, DS_SHEETS.audit, DS_AUDIT_HEADERS);
  ensureSheet_(ss, DS_SHEETS.parentRequests, DS_PARENT_HEADERS);
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
      default: return json_({ ok: false, error: 'Unknown action.' });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

/* Board save/load persists full board JSON plus an optional PNG preview. */
function saveBoard_(board, png) {
  if (!board) throw new Error('Missing board.');
  const folder = getFolder_();
  const boardId = 'board_' + Utilities.getUuid();
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
    folderUrl: folder.getUrl()
  });
  return { ok: true, boardId, fileUrl: jsonFile.getUrl(), folderUrl: folder.getUrl(), pngUrl: pngFile ? pngFile.getUrl() : '' };
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
    if (existing) requireRoomPassword_(existing, password);

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
  const row = {
    id: id,
    parentName: parentName,
    parentEmail: parentEmail,
    studentName: studentName,
    studentId: String((body && body.studentId) || '').trim(),
    requestType: requestType,
    details: String((body && body.details) || '').slice(0, 2000),
    status: 'pending_verification',
    assignedTo: '',
    createdAt: now_(),
    decidedAt: '',
    decisionNote: ''
  };
  upsertRow_(DS_SHEETS.parentRequests, 'id', id, row);
  logEvent_('PARENT_REQUEST_CREATED', {
    actor: parentEmail,
    actorRole: 'parent',
    entityType: 'parent_request',
    entityId: id,
    after: { requestType: requestType, studentName: studentName }
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
