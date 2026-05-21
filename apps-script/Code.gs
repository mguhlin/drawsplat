/* DrawSplat Google Apps Script backend.
 *
 * Deploy as a Web app:
 *   Execute as: Me
 *   Who has access: your classroom/district setting
 *
 * Run setup() once before using the web app.
 */

const DS_FOLDER_NAME = 'DrawSplat Saves';
const DS_PROPS = PropertiesService.getScriptProperties();
const DS_SHEETS = {
  boards: 'Boards',
  rooms: 'Rooms',
  templates: 'Templates',
  turnins: 'TurnIns'
};

/* One-time initializer. Creates or repairs the spreadsheet tabs and the Drive
 * folder used by every backend action below. */
function setup() {
  const ss = getSpreadsheet_();
  getFolder_();
  ensureSheet_(ss, DS_SHEETS.boards, ['boardId', 'title', 'className', 'updatedAt', 'jsonFileId', 'pngFileId', 'folderUrl']);
  ensureSheet_(ss, DS_SHEETS.rooms, ['room', 'updatedAt', 'jsonFileId', 'instanceId', 'passwordHash']);
  ensureSheet_(ss, DS_SHEETS.templates, ['templateId', 'name', 'updatedAt', 'jsonFileId']);
  ensureSheet_(ss, DS_SHEETS.turnins, ['turninId', 'studentName', 'className', 'title', 'updatedAt', 'jsonFileId', 'pngFileId']);
  if (!DS_PROPS.getProperty('PASSWORD_SALT')) DS_PROPS.setProperty('PASSWORD_SALT', Utilities.getUuid());
  return 'DrawSplat setup complete.';
}

/* Read endpoints for board loads, room polling, template gallery, and turn-in
 * review. All responses are JSON so the static front end can call them with
 * fetch() from any hosted DrawSplat page. */
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
      case 'ping': return json_({ ok: true, app: 'DrawSplat', time: now_() });
      default: return json_({ ok: true, app: 'DrawSplat' });
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
  const title = cleanName_(board.title || 'DrawSplat Board');
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
  const salt = DS_PROPS.getProperty('PASSWORD_SALT') || 'DrawSplat';
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + password);
  return bytes.map(b => ('0' + ((b < 0 ? b + 256 : b).toString(16))).slice(-2)).join('');
}

/* Storage primitives. These wrap Drive, Sheets, JSON serialization, and data
 * URL decoding so the endpoint handlers stay focused on DrawSplat concepts. */
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
  const ss = SpreadsheetApp.create('DrawSplat Saves');
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
  return String(name || 'DrawSplat').replace(/[\\/:*?"<>|#%{}^~[\]`]+/g, '-').slice(0, 120);
}

function now_() {
  return new Date().toISOString();
}
