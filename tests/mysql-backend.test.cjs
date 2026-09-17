const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { databaseConfig } = require('../server/mysql-backend/db-config');
const { spawn } = require('node:child_process');
const path = require('node:path');

test('database configuration accepts provider-neutral URLs and Railway variables', () => {
  const config = databaseConfig({ MYSQL_URL: 'mysql://teacher:p%40ss%23word@database.example:25060/whiteboards', MYSQL_SSL: 'true' });
  assert.equal(config.host, 'database.example');assert.equal(config.port, 25060);assert.equal(config.password, 'p@ss#word');assert.equal(config.database, 'whiteboards');assert.equal(config.ssl.rejectUnauthorized, true);assert.equal(config.ssl.verifyIdentity, true);
  assert.equal(databaseConfig({MYSQL_URL:'mysql://user:password@localhost/db?ssl-mode=REQUIRED'}).ssl.verifyIdentity,true);
  assert.equal(databaseConfig({ DATABASE_URL: 'mysql://user:secret@host/boards' }).user, 'user');
  assert.equal(databaseConfig({ MYSQLHOST: 'private.railway.internal', MYSQLDATABASE: 'railway', MYSQLPASSWORD: 'secret' }).database, 'railway');
  assert.throws(() => databaseConfig({ MYSQL_URL: 'postgres://host/db' }), /mysql/);
});

test('school text filtering reads captions rather than encoded recording bytes',()=>{
  const {checkBoardSafety}=require('../server/mysql-backend/safety');
  const config={safety:{text:{enabled:true,blockOnMatch:true,words:['AAAA']},links:{enabled:false}}};
  const board={panels:[{objects:[{type:'video',videoSrc:'data:video/mp4;base64,AAAA',videoCaption:'My science answer'},{type:'audio',audioSrc:'data:audio/wav;base64,AAAA'}]}]};
  assert.equal(checkBoardSafety(board,config).ok,true);
  board.panels[0].objects[0].videoCaption='AAAA';assert.equal(checkBoardSafety(board,config).ok,false);
});

const live = Boolean(process.env.MYSQL_TEST_URL);
let child;
const base = 'http://127.0.0.1:18788/api/drawsplat/mysql';
let logs = '';
before(async () => {
  if (!live) return;
  child = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '../server/mysql-backend'), env: { ...process.env, MYSQL_URL: process.env.MYSQL_TEST_URL, NODE_ENV: 'test', PORT: '18788', CORS_ORIGIN: 'http://127.0.0.1:4183', DRAWSPLAT_CRON: '0', DRAWSPLAT_PEPPER: 'integration-test-only-not-a-production-secret' } });
  child.stdout.on('data', data => { logs += data; });child.stderr.on('data', data => { logs += data; });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(logs);
    try { if ((await fetch(base + '/health')).ok) return; } catch (_) {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Test API did not start: ' + logs);
});
after(async () => { if (child && child.exitCode === null) { const ended = new Promise(resolve => child.once('exit', resolve));child.kill('SIGTERM');await ended; } });
async function call(route, method = 'GET', body, token) {
  const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json() };
}
async function account(label) {
  const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  assert.equal((await call('/auth/register', 'POST', { email, password: 'test-password-1234', role: 'teacher' })).status, 200);
  return (await call('/auth/login', 'POST', { email, password: 'test-password-1234' })).data.token;
}
test('real MySQL: boards persist, remain account-owned, and reject stale or concurrent saves', { skip: !live }, async () => {
  const token = await account('owner'), other = await account('other');
  const video='data:video/mp4;base64,'+require('node:fs').readFileSync(path.join(__dirname,'fixtures/video-note.mp4')).toString('base64');
  const board = { title: 'Chemistry lesson', panels: [{ id: 'p1', name: 'Atoms', objects: [{id:'formula',type:'text',text:'H₂O ⚛'},{id:'clip',type:'video',videoSrc:video}] }] };
  assert.equal((await call('/boards')).status, 401);
  assert.equal((await call('/rooms', 'POST', { roomKey: 'unguarded-room' })).status, 401);
  assert.equal((await call('/rooms', 'POST', { roomKey: 'unguarded-room' }, token)).status, 403);
  const health = await call('/health');assert.ok(health.data.capabilities.includes('private-boards-v1'));
  let saved = await call('/boards/lesson', 'PUT', { board, revision: 0 }, token);assert.equal(saved.status, 200);assert.equal(saved.data.revision, 1);
  assert.equal((await call('/boards/lesson', 'GET', null, other)).status, 404);
  assert.equal((await call('/boards', 'GET', null, other)).data.boards.length, 0);
  assert.equal((await call('/boards/lesson', 'PUT', { board, revision: 0 }, token)).status, 409);
  const races = await Promise.all([call('/boards/lesson', 'PUT', { board: { ...board, title: 'Newer work' }, revision: 1 }, token), call('/boards/lesson', 'PUT', { board: { ...board, title: 'Other device' }, revision: 1 }, token)]);
  assert.deepEqual(races.map(r => r.status).sort(), [200, 409]);
  const loaded = await call('/boards/lesson', 'GET', null, token);assert.equal(loaded.data.revision, 2);assert.equal(loaded.data.board.panels[0].name, 'Atoms');assert.equal(loaded.data.board.panels[0].objects[0].text,'H₂O ⚛');assert.equal(loaded.data.board.panels[0].objects[1].videoSrc,video);
  assert.equal((await call('/boards/lesson', 'DELETE', null, other)).status, 200);
  assert.equal((await call('/boards/lesson', 'GET', null, token)).status, 200);
  assert.equal((await call('/boards/lesson', 'PUT', { board, revision: -1 }, token)).status, 400);
  assert.equal((await call('/boards/lesson', 'PUT', { board: { panels: [] }, revision: 2 }, token)).status, 400);
  const cors = await fetch(base + '/health', { headers: { Origin: 'https://unapproved.example' } });assert.equal(cors.status, 403);
  const pool = require('../server/mysql-backend/db-config').createDatabasePool({ MYSQL_URL: process.env.MYSQL_TEST_URL });
  try { const [clock]=await pool.query('SELECT @@session.time_zone AS timezone');assert.equal(clock[0].timezone,'+00:00');await require('../server/mysql-backend/migrate').migrate(pool);assert.equal((await call('/boards/lesson', 'GET', null, token)).status, 200); } finally { await pool.end(); }
  assert.equal((await call('/auth/logout', 'POST', {}, token)).status, 200);
  assert.equal((await call('/boards', 'GET', null, token)).status, 401);
});
test('real MySQL TLS verifies the CA and rejects a mismatched server identity', { skip: !live || !process.env.MYSQL_TEST_CA_FILE }, async () => {
  const mysql=require('../server/mysql-backend/node_modules/mysql2/promise');
  const config=databaseConfig({MYSQL_URL:process.env.MYSQL_TEST_URL,MYSQL_SSL:'true',MYSQL_SSL_CA_FILE:process.env.MYSQL_TEST_CA_FILE});
  const connection=await mysql.createConnection(config);
  try{const [rows]=await connection.query("SHOW SESSION STATUS LIKE 'Ssl_cipher'");assert.ok(rows[0].Value)}finally{await connection.end()}
  await assert.rejects(mysql.createConnection({...config,ssl:{rejectUnauthorized:true,verifyIdentity:true}}),/certificate|self.signed/i);
  const net=require('node:net');
  await assert.rejects(mysql.createConnection({...config,host:'not-the-certificate.example.test',stream:()=>net.connect({host:config.host,port:config.port})}),/certificate|Hostname|altnames/i);
});
