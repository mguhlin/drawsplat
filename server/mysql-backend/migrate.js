const fs = require('node:fs');
const path = require('node:path');

async function migrate(pool) {
  const connection = await pool.getConnection();
  try {
    const [lock] = await connection.query("SELECT GET_LOCK('drawsplat-schema', 60) AS acquired");
    if (!Number(lock[0].acquired)) throw new Error('Another deployment is updating the schema; retry startup.');
    await connection.query('CREATE TABLE IF NOT EXISTS drawsplat_migrations (name VARCHAR(190) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    for (const name of ['schema.sql', 'migrations/002_compliance.sql', 'migrations/003_freeze_and_polish.sql', 'migrations/004_cloud_boards.sql']) {
      const [done] = await connection.query('SELECT name FROM drawsplat_migrations WHERE name = ?', [name]);
      if (done.length) continue;
      // The bundled DDL has no procedures or semicolons inside quoted values.
      const sql = fs.readFileSync(path.join(__dirname, name), 'utf8').replace(/^\s*--.*$/gm, '');
      for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) {
        try { await connection.query(statement); }
        catch (err) {
          // Resume an interrupted DDL migration or adopt an existing compose database.
          if (!/^ALTER TABLE (rooms|audit_events) ADD (COLUMN|INDEX)|^CREATE INDEX idx_parent_requests_parent_email/.test(statement) || !['ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME'].includes(err.code)) throw err;
        }
      }
      await connection.query('INSERT INTO drawsplat_migrations (name) VALUES (?)', [name]);
      console.log('Applied schema:', name);
    }
  } finally {
    await connection.query("SELECT RELEASE_LOCK('drawsplat-schema')").catch(() => {});
    connection.release();
  }
}
module.exports = { migrate };
if (require.main === module) {
  require('dotenv').config();
  const pool = require('mysql2/promise').createPool(require('./db-config').databaseConfig());
  migrate(pool).then(() => pool.end()).catch(async err => { console.error(err.message); await pool.end(); process.exitCode = 1; });
}
