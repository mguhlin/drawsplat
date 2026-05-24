#!/usr/bin/env node
/**
 * DrawSplatTM Apps Script → MySQL migration CLI.
 *
 * Reads a directory of Sheet exports (CSV) and Drive exports (JSON board
 * files) produced by the existing Apps Script backend, then inserts the
 * rows into the MySQL schema. The intended workflow:
 *
 *   1. From the Apps Script Sheet, File > Download > CSV for each tab:
 *        Users, ParentRequests, Audit, TimeUsage, ContactRequests
 *      Save them in one folder, named exactly as above with .csv suffix.
 *   2. Optionally export the Boards folder as JSON files into ./boards/.
 *   3. Run:
 *        node migrate-from-apps-script.mjs --src ./export --dry-run
 *        node migrate-from-apps-script.mjs --src ./export
 *
 * Requires the same environment as server.js (.env with MYSQL_* + DRAWSPLAT_PEPPER).
 */

import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const mysql = require('mysql2/promise');

const argv = process.argv.slice(2);
const opts = {};
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === '--src') opts.src = argv[++i];
  else if (arg === '--dry-run') opts.dryRun = true;
  else if (arg === '--help' || arg === '-h') { printHelp(); process.exit(0); }
}
if (!opts.src) { printHelp(); process.exit(1); }

function printHelp() {
  console.log('Usage: node migrate-from-apps-script.mjs --src <folder> [--dry-run]');
  console.log('Expects Users.csv, ParentRequests.csv, Audit.csv, TimeUsage.csv, ContactRequests.csv in <folder>.');
  console.log('Boards (per-board JSON) optional, under <folder>/boards/.');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).filter(r => r.some(v => v !== '')).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
}

async function tryRead(srcDir, name) {
  try { return await fs.readFile(path.join(srcDir, name), 'utf8'); }
  catch (e) { return null; }
}

async function main() {
  const srcDir = path.resolve(opts.src);
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DATABASE || 'drawsplat',
    user: process.env.MYSQL_USER || 'drawsplat_app',
    password: process.env.MYSQL_PASSWORD || '',
    namedPlaceholders: true,
    waitForConnections: true,
    connectionLimit: 4
  });

  const stats = { users: 0, parentRequests: 0, audit: 0, timeUsage: 0, contactRequests: 0, boards: 0 };
  const importStudents = async (rows) => {
    for (const r of rows) {
      const name = (r.displayName || r.studentName || '').trim();
      if (!name) continue;
      const className = (r.className || '').trim();
      const ageBand = r.ageBand || 'unknown_minor';
      if (opts.dryRun) { stats.users++; continue; }
      await pool.execute(
        `INSERT INTO users (student_name, class_name, email, role, age_band, age_source, provider)
         VALUES (:name, :class, :email, 'student', :band, :src, 'manual')
         ON DUPLICATE KEY UPDATE student_name = VALUES(student_name), age_band = VALUES(age_band), updated_at = NOW()`,
        { name, class: className || null, email: (r.email || '').toLowerCase() || null, band: ageBand, src: r.ageSource || 'imported' }
      );
      stats.users++;
    }
  };

  const importParentRequests = async (rows) => {
    for (const r of rows) {
      if (!r.parentEmail || !r.studentName || !r.requestType) continue;
      if (opts.dryRun) { stats.parentRequests++; continue; }
      const id = r.id && r.id.length === 36 ? r.id : crypto.randomUUID();
      await pool.execute(
        `INSERT IGNORE INTO parent_requests (id, parent_name, parent_email, student_name, class_name, request_type, details, status)
         VALUES (:id, :pn, :pe, :sn, :cn, :rt, :d, :s)`,
        { id, pn: r.parentName || 'Imported', pe: r.parentEmail, sn: r.studentName, cn: r.className || null, rt: r.requestType, d: r.details || null, s: r.status || 'pending_verification' }
      );
      stats.parentRequests++;
    }
  };

  const importAudit = async (rows) => {
    for (const r of rows) {
      if (!r.action) continue;
      if (opts.dryRun) { stats.audit++; continue; }
      await pool.execute(
        `INSERT INTO audit_events (actor, actor_role, action, target_type, target_id, metadata_json, created_at)
         VALUES (:actor, :role, :action, :tt, :tid, CAST(:meta AS JSON), :ts)`,
        {
          actor: r.actor || null,
          role: r.actorRole || null,
          action: r.action,
          tt: r.entityType || null,
          tid: r.entityId || null,
          meta: r.metadata ? r.metadata : JSON.stringify({ legacy: true }),
          ts: r.timestamp || new Date().toISOString().slice(0, 19).replace('T', ' ')
        }
      );
      stats.audit++;
    }
  };

  const importTimeUsage = async (rows) => {
    for (const r of rows) {
      if (!r.userId && !r.userEmail) continue;
      const day = (r.date || r.usageDate || new Date().toISOString().slice(0, 10)).slice(0, 10);
      const seconds = Number(r.secondsToday || r.seconds || 0);
      if (opts.dryRun) { stats.timeUsage++; continue; }
      const [u] = await pool.query('SELECT id FROM users WHERE email = ? OR external_id = ? LIMIT 1', [r.userEmail || null, r.userId || null]);
      if (!u[0]) continue;
      await pool.execute(
        `INSERT INTO time_usage (user_id, usage_date, seconds_today)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE seconds_today = VALUES(seconds_today)`,
        [u[0].id, day, seconds]
      );
      stats.timeUsage++;
    }
  };

  const importBoards = async (boardsDir) => {
    let entries;
    try { entries = await fs.readdir(boardsDir); } catch (e) { return; }
    for (const file of entries) {
      if (!file.endsWith('.json')) continue;
      const roomKey = file.replace(/\.json$/, '');
      const raw = await fs.readFile(path.join(boardsDir, file), 'utf8');
      if (opts.dryRun) { stats.boards++; continue; }
      await pool.execute(
        `INSERT INTO rooms (room_key, title) VALUES (?, ?) ON DUPLICATE KEY UPDATE updated_at = NOW()`,
        [roomKey, roomKey]
      );
      const [room] = await pool.query('SELECT id FROM rooms WHERE room_key = ?', [roomKey]);
      await pool.execute(
        `INSERT INTO board_snapshots (room_id, board_json, created_by) VALUES (?, CAST(? AS JSON), 'migration')`,
        [room[0].id, raw]
      );
      stats.boards++;
    }
  };

  const tasks = [
    ['Users.csv', importStudents],
    ['ParentRequests.csv', importParentRequests],
    ['Audit.csv', importAudit],
    ['TimeUsage.csv', importTimeUsage]
  ];
  for (const [name, fn] of tasks) {
    const text = await tryRead(srcDir, name);
    if (!text) { console.log(`skip ${name} (not found)`); continue; }
    const rows = parseCsv(text);
    console.log(`read ${name}: ${rows.length} rows`);
    await fn(rows);
  }
  await importBoards(path.join(srcDir, 'boards'));

  console.log(opts.dryRun ? 'Dry run — counts only:' : 'Migration complete:');
  console.log(stats);
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
