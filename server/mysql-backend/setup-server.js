const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const express=require('express');
const {createDatabasePool}=require('./db-config');
const {migrate}=require('./migrate');
const {passwordRecord}=require('./password');
const {securityHeaders,createRateLimiter,normalizeEmail,isValidEmail}=require('./security');
function defaultDatabaseMode(env){return env.SETUP_DATABASE_MODE|| (env.MYSQL_PASSWORD?'bundled':'external');}
function settings(body,env) {
 const mode=body.databaseMode||defaultDatabaseMode(env);
 if(!['bundled','external'].includes(mode))throw Object.assign(new Error('Choose bundled or external database mode.'),{status:400});
 if(mode==='bundled'&&!env.MYSQL_PASSWORD)throw Object.assign(new Error('Bundled database settings are unavailable. Choose your own database and enter its connection settings.'),{status:400});
 // Bundled mode never reads browser connection fields, including autofilled values.
 const source=mode==='bundled'?{}:body;
 const cfg={MYSQL_HOST:String(source.host||env.MYSQL_HOST||'db'),MYSQL_PORT:String(source.port||env.MYSQL_PORT||3306),MYSQL_DATABASE:String(source.database||env.MYSQL_DATABASE||'drawsplat'),MYSQL_USER:String(source.username||env.MYSQL_USER||'drawsplat_app'),MYSQL_PASSWORD:String(source.password||env.MYSQL_PASSWORD||''),MYSQL_SSL:mode==='bundled'?String(env.MYSQL_SSL||'false'):(source.ssl===true?'true':'false')};
 if(!cfg.MYSQL_PASSWORD||!/^\d+$/.test(cfg.MYSQL_PORT)||Number(cfg.MYSQL_PORT)>65535||!Number(cfg.MYSQL_PORT)||!cfg.MYSQL_DATABASE||!cfg.MYSQL_USER)throw Object.assign(new Error('Enter a database name, username, password, and valid port.'),{status:400});
 const ca=mode==='bundled'?env.MYSQL_SSL_CA:source.ca;if(ca)cfg.MYSQL_SSL_CA=String(ca);
 return cfg;
}
function connectionError(error,mode){
 if(error.status)return error.message;
 const messages={
  ER_ACCESS_DENIED_ERROR:mode==='bundled'?'The bundled database rejected its generated login. Browser database fields were ignored. Preserve existing volumes and check that the API and database use the same saved server settings.':'The database rejected the application username or password. Check the database user, password and permitted host; do not use the database root account.',
  ER_DBACCESS_DENIED_ERROR:'The application user cannot access this database. Check its database-specific grants.',
  ER_BAD_DB_ERROR:'The database does not exist. Create an empty database, then test again.',
  ECONNREFUSED:'The database is not accepting connections. Check that its service is running and the host and port are correct.',
  ENOTFOUND:'The database host could not be found. Check its hostname and network connection.',
  ETIMEDOUT:'The database connection timed out. Check service readiness, network access and the selected port.',
  ER_TABLEACCESS_DENIED_ERROR:'The application user lacks a required database permission. Check the migration and record-access grants in the installation guide.',
  HANDSHAKE_SSL_ERROR:'Database TLS verification failed. Check the certificate and CA settings.'
 };
 if(/CERT|TLS|SSL/.test(error.code||''))return 'Database TLS verification failed. Check the certificate and CA settings.';
 return messages[error.code]||'Database setup failed. Check the server logs using the diagnostic code below; keep existing configuration and database data.';
}
function createSetupApp(env=process.env,onComplete=()=>process.exit(0)) {
 if(!env.SETUP_TOKEN||env.SETUP_TOKEN.length<32||!env.SETUP_CONFIG_FILE)throw new Error('Setup requires a generated setup key and a private configuration file.');
 const app=express();let working=false;
 app.disable('x-powered-by');app.use(securityHeaders);app.use(express.json({limit:'64kb'}));app.use((_req,res,next)=>{res.set('Cache-Control','no-store');next();});
 app.get('/api/drawsplat/mysql/health',(_req,res)=>res.status(503).json({ok:false,setupRequired:true}));
 app.get('/setup',(_req,res)=>res.sendFile(path.join(__dirname,'static/setup.html')));
 app.get('/setup.js',(_req,res)=>res.sendFile(path.join(__dirname,'static/setup.js')));
 app.get('/setup/options',(_req,res)=>res.json({databaseMode:defaultDatabaseMode(env),bundledAvailable:!!env.MYSQL_PASSWORD}));
 app.post('/setup',createRateLimiter({scope:'setup',max:10}),async(req,res)=>{
  const actual=Buffer.from(String(req.body.setupKey||'')),expected=Buffer.from(env.SETUP_TOKEN);
  if(actual.length!==expected.length||!crypto.timingSafeEqual(actual,expected))return res.status(403).json({ok:false,error:'Setup key is incorrect.'});
  if(working||fs.existsSync(env.SETUP_CONFIG_FILE))return res.status(409).json({ok:false,error:'Setup is already running or complete.'});
  let pool;working=true;
  try{
   const cfg=settings(req.body,env);pool=createDatabasePool(cfg);const [version]=await pool.query('SELECT VERSION() AS version');
   if(req.body.action==='test')return res.json({ok:true,database:/mariadb/i.test(version[0].version)?'MariaDB':'MySQL'});
   if(req.body.action!=='finish')throw Object.assign(new Error('Unknown setup action.'),{status:400});
   const email=normalizeEmail(req.body.adminEmail),password=String(req.body.adminPassword||'');if(!isValidEmail(email)||password.length<12||password.length>200)throw Object.assign(new Error('Use a valid administrator email and a password of 12–200 characters.'),{status:400});
   const [tables]=await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type='BASE TABLE'");
   if(tables.some(t=>String(t.table_name||t.TABLE_NAME)==='users')) { const [accounts]=await pool.query('SELECT COUNT(*) AS count FROM users'); if(Number(accounts[0].count))throw Object.assign(new Error('Use an empty database for first-run setup. Existing installations must follow the migration guide.'),{status:409}); }
   await migrate(pool);
   const [users]=await pool.query('SELECT COUNT(*) AS count FROM users');if(Number(users[0].count))throw Object.assign(new Error('This database already has accounts. Use an empty database for first-run setup; migrate existing installations using the hosting guide.'),{status:409});
   cfg.DRAWSPLAT_PEPPER=crypto.randomBytes(48).toString('hex');cfg.AUTO_MIGRATE='true';cfg.ROSTER_ONLY='true';cfg.PUBLIC_REGISTRATION='false';cfg.GOOGLE_CLIENT_ID=String(req.body.googleClientId||'').trim();cfg.GOOGLE_ALLOWED_DOMAINS=String(req.body.googleDomains||'').trim().toLowerCase();
   const {salt,hash}=passwordRecord(password,cfg.DRAWSPLAT_PEPPER);
   // Persist configuration first, exclusively, so a failed account insert can safely remove it.
   fs.mkdirSync(path.dirname(env.SETUP_CONFIG_FILE),{recursive:true,mode:0o700});
   fs.writeFileSync(env.SETUP_CONFIG_FILE,JSON.stringify(cfg),{mode:0o600,flag:'wx'});
   try{await pool.execute("INSERT INTO users (email,display_name,role,provider,age_band,password_hash,password_salt) VALUES (?,'District administrator','district_admin','email','18_plus',?,?)",[email,hash,salt]);}catch(error){fs.unlinkSync(env.SETUP_CONFIG_FILE);throw error;}
   res.on('finish',()=>setTimeout(onComplete,300));
   res.json({ok:true,message:'Setup complete. The saving service is restarting. Open the whiteboard and sign in with your administrator account.'});
  }catch(error){res.status(error.status||400).json({ok:false,error:connectionError(error,req.body.databaseMode||defaultDatabaseMode(env)),diagnostic:/^[A-Z0-9_]{1,64}$/.test(error.code||'')?error.code:undefined});console.error('Setup database error:',error.code||error.name);}
  finally{if(pool)await pool.end();working=false;}
 });
 return app;
}
function startSetup(){createSetupApp().listen(Number(process.env.PORT||8787),process.env.HOST||'0.0.0.0',()=>console.log('First-run setup available at /setup. Use the setup key from your server.'));}
module.exports={createSetupApp,settings,connectionError,startSetup};
