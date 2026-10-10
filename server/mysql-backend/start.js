require('dotenv').config();
const fs=require('node:fs');
const file=process.env.SETUP_CONFIG_FILE;
if(file && fs.existsSync(file)) {
 const saved=JSON.parse(fs.readFileSync(file,'utf8'));
 for(const key of ['MYSQL_HOST','MYSQL_PORT','MYSQL_DATABASE','MYSQL_USER','MYSQL_PASSWORD','MYSQL_SSL','MYSQL_SSL_CA','DRAWSPLAT_PEPPER','AUTO_MIGRATE','GOOGLE_CLIENT_ID','GOOGLE_ALLOWED_DOMAINS','ROSTER_ONLY','PUBLIC_REGISTRATION'])if(saved[key]!==undefined)process.env[key]=String(saved[key]);
 require('./server');
}else if(process.env.SETUP_REQUIRED==='true'){
 require('./setup-server').startSetup();
}else require('./server');
