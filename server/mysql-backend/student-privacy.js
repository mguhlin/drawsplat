'use strict';
const { jsonValue } = require('./json-value');
const error = (status, message) => Object.assign(new Error(message), { status });
function studentId(value) {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) throw error(400, 'invalid_student_id');
  return Number(value);
}
async function student(conn, id, lock = false) {
  const [rows] = await conn.query('SELECT id, email, display_name, student_name, class_name, external_id, role, age_band, age_source, created_at FROM users WHERE id = ? AND deleted_at IS NULL' + (lock ? ' FOR UPDATE' : ''), [id]);
  if (!rows[0]) throw error(404, 'student_not_found');
  if (rows[0].role !== 'student') throw error(400, 'student_account_required');
  return rows[0];
}
async function exportStudent(conn, value) {
  const id = studentId(value), user = await student(conn, id);
  const [boards] = await conn.query('SELECT board_key, title, board_json, revision, updated_at FROM cloud_boards WHERE user_id = ?', [id]);
  const [submissions] = await conn.query('SELECT s.assignment_id, s.board_json, s.revision, s.feedback, s.submitted_at, a.title AS assignment_title, a.classroom_id FROM classroom_submissions s JOIN classroom_assignments a ON a.id = s.assignment_id WHERE s.student_user_id = ?', [id]);
  const [memberships] = await conn.query('SELECT m.classroom_id, m.joined_at, c.title FROM classroom_members m JOIN classrooms c ON c.id = m.classroom_id WHERE m.user_id = ?', [id]);
  const [requests] = await conn.query('SELECT id, request_type, status, details, decision_note, created_at, decided_at FROM parent_requests WHERE student_user_id = ?', [id]);
  const [usage] = await conn.query('SELECT usage_date, seconds_today FROM time_usage WHERE user_id = ?', [id]);
  const [activity] = await conn.query('SELECT action, target_type, created_at FROM audit_events WHERE actor_user_id = ?', [id]);
  const [sessions] = await conn.query('SELECT issued_at, expires_at, revoked_at FROM sessions WHERE user_id = ?', [id]);
  return { ok: true, exportedAt: new Date().toISOString(), user,
    boards: boards.map(r => ({ ...r, board_json: jsonValue(r.board_json) })),
    submissions: submissions.map(r => ({ ...r, board_json: jsonValue(r.board_json) })), memberships, requests, usage, activity, sessions,
    turnins: [], manualReview: ['Legacy turn-ins identify students by free-text name, not account ID. Verify identity and the precise records before a separate export/delete; same-name records are never automatically included.', 'Browser drafts, downloaded files, Apps Script/Drive copies, external media objects, unlinked requests, cloud integrations and backups require the operator record-location checklist.'] };
}
async function deleteStudent(pool, value, actor) {
  const id = studentId(value), conn = await pool.getConnection();
  try {
    await conn.beginTransaction(); await student(conn, id, true);
    const [boards] = await conn.execute('DELETE FROM cloud_boards WHERE user_id = ?', [id]);
    const [submissions] = await conn.execute('DELETE FROM classroom_submissions WHERE student_user_id = ?', [id]);
    const [memberships] = await conn.execute('DELETE FROM classroom_members WHERE user_id = ?', [id]);
    const [sessions] = await conn.execute('DELETE FROM sessions WHERE user_id = ?', [id]);
    const [usage] = await conn.execute('DELETE FROM time_usage WHERE user_id = ?', [id]);
    // Retain only a non-identifying completion receipt, not a deleted student's request narrative.
    await conn.execute("UPDATE parent_requests SET student_user_id = NULL, parent_name = '[erased]', parent_email = '', student_name = '[erased]', class_name = NULL, details = NULL, decision_note = 'Student erasure completed', status = 'completed', decided_at = NOW() WHERE student_user_id = ?", [id]);
    await conn.execute('UPDATE audit_events SET actor = NULL, actor_user_id = NULL, target_id = NULL, metadata_json = NULL WHERE actor_user_id = ? OR (target_type = \'user\' AND target_id = ?)', [id, String(id)]);
    await conn.execute('DELETE FROM image_queue WHERE uploaded_by = ?', [id]);
    await conn.execute('DELETE FROM users WHERE id = ?', [id]);
    const deleted = { boards: boards.affectedRows, submissions: submissions.affectedRows, memberships: memberships.affectedRows, sessions: sessions.affectedRows, usage: usage.affectedRows };
    await conn.execute("INSERT INTO audit_events (actor_user_id, actor_role, action, target_type, metadata_json) VALUES (?, ?, 'DATA_DELETED', 'privacy', ?)", [actor.id, actor.role, JSON.stringify({ deleted })]);
    await conn.commit();
    return { ok: true, deleted, manualReview: ['Delete verified legacy turn-ins, stored media objects, downloads, cloud copies and backups separately. This receipt covers account-linked database records only.'] };
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
}
module.exports = { studentId, exportStudent, deleteStudent };
