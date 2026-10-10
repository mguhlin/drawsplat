const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createSetupApp}=require('../server/mysql-backend/setup-server');const {createDatabasePool,databaseConfig}=require('../server/mysql-backend/db-config');
test('first-run wizard validates its key, installs once, stores private credentials and creates an admin',{skip:!process.env.MYSQL_SETUP_TEST_URL},async()=>{
 const db=databaseConfig({MYSQL_URL:process.env.MYSQL_SETUP_TEST_URL}),dir=fs.mkdtempSync(path.join(os.tmpdir(),'drawsplat-setup-')),file=dir+'/config.json',key='integration-only-setup-key-32characters',password='administrator-test-password';
 const pool=createDatabasePool({MYSQL_URL:process.env.MYSQL_SETUP_TEST_URL});const [tables]=await pool.query('SHOW TABLES');assert.equal(tables.length,0,'Use a disposable EMPTY database');
 let completed=false;const listener=createSetupApp({SETUP_TOKEN:key,SETUP_CONFIG_FILE:file,MYSQL_HOST:db.host,MYSQL_PORT:db.port,MYSQL_DATABASE:db.database,MYSQL_USER:db.user,MYSQL_PASSWORD:db.password},()=>completed=true).listen(0,'127.0.0.1');await new Promise(r=>listener.once('listening',r));const base='http://127.0.0.1:'+listener.address().port;
 const post=async body=>{const r=await fetch(base+'/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
 try{
 assert.equal((await post({action:'test',setupKey:'wrong'})).status,403);
 assert.equal((await post({action:'test',setupKey:key})).status,200);assert.equal(fs.existsSync(file),false);
 assert.equal((await post({action:'finish',setupKey:key,adminEmail:'admin@example.test',adminPassword:password})).status,200);
 const cfg=JSON.parse(fs.readFileSync(file));assert.equal(cfg.ROSTER_ONLY,'true');assert.equal(cfg.PUBLIC_REGISTRATION,'false');assert.equal(fs.statSync(file).mode&0o777,0o600);assert.ok(cfg.DRAWSPLAT_PEPPER.length>=32);
 const [users]=await pool.query('SELECT role,password_hash FROM users');assert.equal(users[0].role,'district_admin');assert.ok(users[0].password_hash);
 assert.equal((await post({action:'test',setupKey:key})).status,409);await new Promise(r=>setTimeout(r,400));assert.ok(completed);
 }finally{await new Promise(r=>listener.close(r));await pool.end();fs.rmSync(dir,{recursive:true});}
});
