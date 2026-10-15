'use strict';
const { jsonValue } = require('./json-value');
function days(value, fallback) {
  const n = Number(value ?? fallback);
  if (!Number.isInteger(n) || n < 1 || n > 3650) throw new Error('Retention days must be an integer from 1 to 3650.');
  return n;
}
async function cleanupDistrictRecords(pool, logEvent) {
  const [rows] = await pool.query("SELECT config_json FROM compliance_config WHERE config_key = 'main' LIMIT 1");
  const config = rows[0] ? jsonValue(rows[0].config_json) : {};
  const policy = config?.retention?.districtRecords;
  // An upgrade never activates destructive cleanup without the operator choosing it.
  if (!policy || policy.enabled !== true) return { enabled: false, deleted: {} };
  const boardDays = days(policy.boardDays, 365), submissionDays = days(policy.submissionDays, 365);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [boards] = await conn.execute('DELETE FROM cloud_boards WHERE updated_at < (UTC_TIMESTAMP() - INTERVAL ? DAY)', [boardDays]);
    const [submissions] = await conn.execute('DELETE FROM classroom_submissions WHERE submitted_at < (UTC_TIMESTAMP() - INTERVAL ? DAY)', [submissionDays]);
    const deleted = { boards: boards.affectedRows, submissions: submissions.affectedRows };
    await conn.execute("INSERT INTO audit_events (actor, actor_role, action, target_type, metadata_json) VALUES ('system', 'system', 'RETENTION_ACTION', 'district-records', ?)", [JSON.stringify({ deleted, boardDays, submissionDays })]);
    await conn.commit(); return { enabled: true, deleted };
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
}
module.exports = { cleanupDistrictRecords, days };
