const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const express=require('express');
const {createDatabasePool}=require('./db-config');
const {migrate}=require('./migrate');
const {passwordRecord}=require('./password');
const {securityHeaders,createRateLimiter,normalizeEmail,isValidEmail}=require('./security');
function settings(body,env) {
 const cfg={MYSQL_HOST:String(body.host||env.MYSQL_HOST||'db'),MYSQL_PORT:String(body.port||env.MYSQL_PORT||3306),MYSQL_DATABASE:String(body.database||env.MYSQL_DATABASE||'drawsplat'),MYSQL_USER:String(body.username||env.MYSQL_USER||'drawsplat_app'),MYSQL_PASSWORD:String(body.password||env.MYSQL_PASSWORD||''),MYSQL_SSL:body.ssl===true?'true':'false'};
 if(!cfg.MYSQL_PASSWORD||!/^\d+$/.test(cfg.MYSQL_PORT)||Number(cfg.MYSQL_PORT)>65535||!Number(cfg.MYSQL_PORT)||!cfg.MYSQL_DATABASE||!cfg.MYSQL_USER)throw Object.assign(new Error('Enter a database name, username, password, and valid port.'),{status:400});
 if(body.ca)cfg.MYSQL_SSL_CA=String(body.ca);
 return cfg;
}
function createSetupApp(env=process.env,onComplete=()=>process.exit(0)) {
 if(!env.SETUP_TOKEN||env.SETUP_TOKEN.length<32||!env.SETUP_CONFIG_FILE)throw new Error('Setup requires a generated setup key and a private configuration file.');
 const app=express();let working=false;
 app.disable('x-powered-by');app.use(securityHeaders);app.use(express.json({limit:'64kb'}));app.use((_req,res,next)=>{res.set('Cache-Control','no-store');next();});
 app.get('/api/drawsplat/mysql/health',(_req,res)=>res.status(503).json({ok:false,setupRequired:true}));
 app.get('/setup',(_req,res)=>res.sendFile(path.join(__dirname,'static/setup.html')));
 app.get('/setup.js',(_req,res)=>res.sendFile(path.join(__dirname,'static/setup.js')));
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
  }catch(error){res.status(error.status||400).json({ok:false,error:error.status?error.message:'Database connection or setup failed. Check server logs and connection settings.'});console.error('Setup database error:',error.code||error.name);}
  finally{if(pool)await pool.end();working=false;}
 });
 return app;
}
function startSetup(){createSetupApp().listen(Number(process.env.PORT||8787),process.env.HOST||'0.0.0.0',()=>console.log('First-run setup available at /setup. Use the setup key from your server.'));}
module.exports={createSetupApp,settings,startSetup};
