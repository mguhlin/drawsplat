const fs = require('node:fs');

function databaseConfig(env = process.env) {
  const address = env.MYSQL_URL || env.DATABASE_URL;
  let url;
  if (address) {
    try { url = new URL(address); } catch (_) { throw new Error('Invalid database URL. Check the server connection settings.'); }
    if (url.protocol !== 'mysql:') throw new Error('Database URL must use mysql://');
  }
  const sslRequired = env.MYSQL_SSL === 'true' || url?.searchParams.get('ssl') === 'true' || ['REQUIRED','VERIFY_CA','VERIFY_IDENTITY'].includes(url?.searchParams.get('ssl-mode')?.toUpperCase());
  const ca = env.MYSQL_SSL_CA || (env.MYSQL_SSL_CA_FILE ? fs.readFileSync(env.MYSQL_SSL_CA_FILE, 'utf8') : undefined);
  return {
    host: url?.hostname.replace(/^\[|\]$/g, '') || env.MYSQL_HOST || env.MYSQLHOST || '127.0.0.1',
    port: Number(url?.port || env.MYSQL_PORT || env.MYSQLPORT || 3306),
    database: url ? decodeURIComponent(url.pathname.slice(1)) : env.MYSQL_DATABASE || env.MYSQLDATABASE || 'drawsplat',
    user: url ? decodeURIComponent(url.username) : env.MYSQL_USER || env.MYSQLUSER || 'drawsplat_app',
    password: url ? decodeURIComponent(url.password) : env.MYSQL_PASSWORD || env.MYSQLPASSWORD || '',
    ssl: sslRequired || ca ? { rejectUnauthorized: true, verifyIdentity: true, ...(ca ? { ca } : {}) } : undefined,
    waitForConnections: true,
    connectionLimit: Number(env.MYSQL_CONNECTION_LIMIT || 5),
    namedPlaceholders: true,
    timezone: 'Z',
    enableKeepAlive: true
  };
}
function createDatabasePool(env = process.env) {
  const pool = require('mysql2/promise').createPool(databaseConfig(env));
  // Keep NOW(), Date bindings, and TIMESTAMP results consistent across hosts.
  pool.on('connection', connection => {
    connection.query("SET time_zone = '+00:00'", error => { if (error) connection.destroy(); });
  });
  return pool;
}
module.exports = { databaseConfig, createDatabasePool };
