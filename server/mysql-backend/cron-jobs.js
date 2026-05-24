/**
 * DrawSplatTM cron — scheduled retention + time-limit enforcement.
 *
 * Uses the built-in setInterval rather than pulling in node-cron, since the
 * jobs run at fixed daily / minute intervals. For multi-instance deployments,
 * give exactly one node process the env flag DRAWSPLAT_CRON=1 so the jobs
 * don't double-run.
 */

const TWENTY_FOUR_H = 24 * 60 * 60 * 1000;
const ONE_MIN = 60 * 1000;

async function loadConfig(pool) {
  const [rows] = await pool.query("SELECT config_json FROM compliance_config WHERE config_key = 'main' LIMIT 1");
  if (!rows[0]) return {};
  return rows[0].config_json || {};
}

async function dailyAuditCleanup(pool, logEvent) {
  const cfg = await loadConfig(pool);
  const retention = cfg.retention || {};
  const auditKeepDays = Number(retention.audit && retention.audit.keepDays) || 365;
  const requestKeepDays = Number(retention.parentRequests && retention.parentRequests.keepDays) || 1095;
  const sessionKeepDays = 30;

  const [audit] = await pool.execute(
    `DELETE FROM audit_events WHERE created_at < (NOW() - INTERVAL ? DAY)`,
    [auditKeepDays]
  );
  const [pr] = await pool.execute(
    `DELETE FROM parent_requests WHERE created_at < (NOW() - INTERVAL ? DAY) AND status IN ('completed','denied')`,
    [requestKeepDays]
  );
  const [sessions] = await pool.execute(
    `DELETE FROM sessions WHERE expires_at < (NOW() - INTERVAL ? DAY) OR revoked_at IS NOT NULL`,
    [sessionKeepDays]
  );
  const [rateLimits] = await pool.execute(
    `DELETE FROM rate_limits WHERE expires_at < NOW()`
  );

  await logEvent('RETENTION_ACTION', {
    actor: 'system',
    actorRole: 'system',
    targetType: 'retention',
    metadata: {
      auditDeleted: audit.affectedRows,
      parentRequestsDeleted: pr.affectedRows,
      expiredSessionsDeleted: sessions.affectedRows,
      rateLimitsDeleted: rateLimits.affectedRows,
      auditKeepDays
    }
  });
}

async function dailyBoardCleanup(pool, logEvent) {
  const cfg = await loadConfig(pool);
  const retention = cfg.retention || {};
  const archiveAfter = Number(retention.boards && retention.boards.archiveAfterDays) || 90;
  const deleteAfter = Number(retention.boards && retention.boards.deleteAfterDays) || 365;

  const [archived] = await pool.execute(
    `UPDATE board_snapshots SET expires_at = COALESCE(expires_at, NOW() + INTERVAL ? DAY)
       WHERE created_at < (NOW() - INTERVAL ? DAY) AND expires_at IS NULL`,
    [Math.max(0, deleteAfter - archiveAfter), archiveAfter]
  );
  const [deleted] = await pool.execute(
    `DELETE FROM board_snapshots WHERE created_at < (NOW() - INTERVAL ? DAY)`,
    [deleteAfter]
  );

  await logEvent('RETENTION_ACTION', {
    actor: 'system',
    actorRole: 'system',
    targetType: 'boards',
    metadata: { archived: archived.affectedRows, deleted: deleted.affectedRows, archiveAfter, deleteAfter }
  });
}

async function enforceTimeLimits(pool, publishUser) {
  const cfg = await loadConfig(pool);
  const limits = cfg.timeLimits || {};
  if (!limits.enabled) return;
  const dailyMax = Number(limits.dailySeconds) || 0;
  if (dailyMax <= 0) return;
  const today = new Date().toISOString().slice(0, 10);
  const [rows] = await pool.query(
    `SELECT user_id, seconds_today FROM time_usage WHERE usage_date = ? AND seconds_today >= ?`,
    [today, dailyMax]
  );
  for (const row of rows) {
    publishUser(row.user_id, 'session-lock', { reason: 'daily_limit_reached', secondsToday: row.seconds_today, dailyMax });
  }
}

function start(pool, deps) {
  const logEvent = deps.logEvent || (async () => {});
  const publishUser = deps.publishUser || (() => 0);

  const enforce = () => enforceTimeLimits(pool, publishUser).catch(err => console.error('enforceTimeLimits failed', err.message));
  const audit = () => dailyAuditCleanup(pool, logEvent).catch(err => console.error('dailyAuditCleanup failed', err.message));
  const boards = () => dailyBoardCleanup(pool, logEvent).catch(err => console.error('dailyBoardCleanup failed', err.message));

  const everyMinute = setInterval(enforce, ONE_MIN);
  const everyDay = setInterval(() => { audit(); boards(); }, TWENTY_FOUR_H);

  setTimeout(() => { audit(); boards(); }, 30 * 1000);

  return {
    stop() { clearInterval(everyMinute); clearInterval(everyDay); },
    runNow: { enforce, audit, boards }
  };
}

module.exports = { start, dailyAuditCleanup, dailyBoardCleanup, enforceTimeLimits };
