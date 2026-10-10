// Runs in a Node container, so the district host needs Docker only.
const fs=require('node:fs'),crypto=require('node:crypto');
const folder=__dirname,file=folder+'/.env';
if(!fs.existsSync(file)){
 const secret=()=>crypto.randomBytes(32).toString('hex');
 const mysql=process.argv.includes('--mysql');
 fs.writeFileSync(file,`DB_IMAGE=${mysql?'mysql:8.4':'mariadb:11.8'}\nDB_PASSWORD=${secret()}\nDB_ROOT_PASSWORD=${secret()}\nSETUP_TOKEN=${secret()}\nSITE_ADDRESS=:8080\nSITE_ORIGIN=http://localhost:8080\nWEB_BIND=127.0.0.1\n`,{mode:0o600,flag:'wx'});
 console.log('Created private server settings. Existing settings are never overwritten.');
}
const env=fs.readFileSync(file,'utf8');console.log('Setup address: '+(env.match(/^SITE_ORIGIN=(.+)$/m)?.[1]||'http://localhost:8080')+'/setup');console.log('Setup key: '+env.match(/^SETUP_TOKEN=(.+)$/m)[1]);
