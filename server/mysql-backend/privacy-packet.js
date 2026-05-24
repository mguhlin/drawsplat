/**
 * DrawSplatTM Privacy Packet — server-side ZIP generator (Phase 4 mirror of
 * the Apps Script privacyPacketResponse_).
 *
 * Uses Node's built-in zlib + a hand-rolled ZIP store writer so we don't need
 * to add the `archiver` dependency. The packet contains the same documents
 * the Apps Script side bundles, plus a live config snapshot and the audit
 * window the reviewer cares about.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const STATIC_DOCS_RELATIVE = [
  '../../legal/terms-privacy.html',
  '../../legal/district-addendum.html',
  '../../legal/texas-compliance.html',
  '../../legal/privacy-builder.html',
  '../../COMPLIANCE-ROADMAP.md',
  '../../docs/COMPLIANCE.md'
];

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c >>> 0;
    }
    crc32.table = table;
  }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function dosTime(date) {
  const t = ((date.getHours() & 0x1F) << 11) | ((date.getMinutes() & 0x3F) << 5) | ((date.getSeconds() / 2) & 0x1F);
  const d = (((date.getFullYear() - 1980) & 0x7F) << 9) | (((date.getMonth() + 1) & 0x0F) << 5) | (date.getDate() & 0x1F);
  return { t, d };
}

function buildZip(entries) {
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;
  const now = new Date();
  const dt = dosTime(now);

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(String(entry.data), 'utf8');
    const crc = crc32(data);

    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(0x04034b50, 0);
    lfh.writeUInt16LE(20, 4);
    lfh.writeUInt16LE(0, 6);
    lfh.writeUInt16LE(0, 8);
    lfh.writeUInt16LE(dt.t, 10);
    lfh.writeUInt16LE(dt.d, 12);
    lfh.writeUInt32LE(crc, 14);
    lfh.writeUInt32LE(data.length, 18);
    lfh.writeUInt32LE(data.length, 22);
    lfh.writeUInt16LE(nameBuf.length, 26);
    lfh.writeUInt16LE(0, 28);

    localChunks.push(lfh, nameBuf, data);
    const localOffset = offset;
    offset += lfh.length + nameBuf.length + data.length;

    const cdh = Buffer.alloc(46);
    cdh.writeUInt32LE(0x02014b50, 0);
    cdh.writeUInt16LE(0x0314, 4);
    cdh.writeUInt16LE(20, 6);
    cdh.writeUInt16LE(0, 8);
    cdh.writeUInt16LE(0, 10);
    cdh.writeUInt16LE(dt.t, 12);
    cdh.writeUInt16LE(dt.d, 14);
    cdh.writeUInt32LE(crc, 16);
    cdh.writeUInt32LE(data.length, 20);
    cdh.writeUInt32LE(data.length, 24);
    cdh.writeUInt16LE(nameBuf.length, 28);
    cdh.writeUInt16LE(0, 30);
    cdh.writeUInt16LE(0, 32);
    cdh.writeUInt16LE(0, 34);
    cdh.writeUInt16LE(0, 36);
    cdh.writeUInt32LE(0, 38);
    cdh.writeUInt32LE(localOffset, 42);
    centralChunks.push(cdh, nameBuf);
  }

  const central = Buffer.concat(centralChunks);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(central.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localChunks, central, eocd]);
}

function tryReadStaticDoc(filename) {
  try {
    const full = path.resolve(__dirname, filename);
    return fs.readFileSync(full);
  } catch (e) {
    return null;
  }
}

async function buildPacket(pool, options = {}) {
  const generatedAt = new Date().toISOString();
  const [cfgRows] = await pool.query("SELECT config_json, updated_at FROM compliance_config WHERE config_key = 'main' LIMIT 1");
  const config = cfgRows[0] ? cfgRows[0].config_json : {};

  const auditWindowDays = Number(options.auditWindowDays || 90);
  const [auditRows] = await pool.query(
    `SELECT id, actor, actor_role, action, target_type, target_id, created_at
     FROM audit_events
     WHERE created_at >= (NOW() - INTERVAL ? DAY)
     ORDER BY created_at DESC
     LIMIT 5000`,
    [auditWindowDays]
  );

  const entries = [];
  entries.push({
    name: 'README.txt',
    data: [
      'DrawSplatTM District Privacy Packet',
      '',
      `Generated: ${generatedAt}`,
      `Audit window: last ${auditWindowDays} days (${auditRows.length} events)`,
      '',
      'Contents:',
      '  README.txt                       — this file',
      '  config-snapshot.json             — live compliance configuration',
      '  audit-window.csv                 — recent audit events',
      '  legal/terms-privacy.html         — DrawSplatTM Terms & Privacy',
      '  legal/district-addendum.html     — district-facing addendum',
      '  legal/texas-compliance.html      — Texas SCOPE / FERPA / COPPA explainer',
      '  legal/privacy-builder.html       — local privacy notice builder',
      '  COMPLIANCE-ROADMAP.md            — implementation status',
      '  docs/COMPLIANCE.md               — operator notes',
      '',
      'This packet is for district counsel and procurement review. It is not a contract.',
      ''
    ].join('\n')
  });
  entries.push({ name: 'config-snapshot.json', data: JSON.stringify({ generatedAt, config }, null, 2) });

  const csvHeader = 'id,timestamp,actor,actorRole,action,targetType,targetId\n';
  const csvBody = auditRows.map(r => [
    r.id,
    r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    JSON.stringify(r.actor || ''),
    r.actor_role || '',
    r.action || '',
    r.target_type || '',
    r.target_id || ''
  ].join(',')).join('\n');
  entries.push({ name: 'audit-window.csv', data: csvHeader + csvBody });

  for (const rel of STATIC_DOCS_RELATIVE) {
    const buf = tryReadStaticDoc(rel);
    if (!buf) continue;
    const name = rel.replace(/^(\.\.\/)+/, '');
    entries.push({ name, data: buf });
  }

  return { zip: buildZip(entries), generatedAt, eventsIncluded: auditRows.length };
}

function attachPrivacyPacketRoute(app, pool, options) {
  const basePath = options.basePath;
  const auth = options.auth;
  const logEvent = options.logEvent || (async () => {});

  app.get(basePath + '/admin/privacy-packet', auth.requirePermission('privacy_packet.download'), async (req, res) => {
    try {
      const result = await buildPacket(pool);
      await logEvent('PRIVACY_PACKET_GENERATED', {
        actor: req.dsUser.email,
        actorUserId: req.dsUser.id,
        actorRole: req.dsUser.role,
        targetType: 'privacy_packet',
        metadata: { eventsIncluded: result.eventsIncluded }
      });
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="drawsplat-privacy-packet-${result.generatedAt.slice(0, 10)}.zip"`,
        'Cache-Control': 'no-store'
      });
      res.send(result.zip);
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });
}

module.exports = { buildPacket, attachPrivacyPacketRoute };
