// Supervise the API, including its first-install restart. Gateway runs separately.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
if(Number(process.versions.node.split('.')[0])<22)throw Error('Install Node.js 22 or newer before starting DrawSplat.');
const folder=path.join(__dirname,'native-private'),settingsFile=path.join(folder,'settings.json');
if(!fs.existsSync(settingsFile))throw Error('Run node selfhost/district/prepare-native.js first.');
const settings=JSON.parse(fs.readFileSync(settingsFile,'utf8'));
const backend=path.resolve(__dirname,'../../server/mysql-backend');
try{require.resolve('express',{paths:[backend]});require.resolve('mysql2',{paths:[backend]});}catch{throw Error('Install dependencies: npm ci --omit=dev --prefix server/mysql-backend');}
let child,timer,stopping=false;
const env={...process.env,NODE_ENV:'production',PORT:String(settings.apiPort),HOST:'127.0.0.1',CORS_ORIGIN:settings.origin,TRUST_PROXY:'true',SETUP_REQUIRED:'true',SETUP_TOKEN:settings.setupToken,SETUP_CONFIG_FILE:path.join(folder,'config.json'),MYSQL_HOST:'127.0.0.1',MYSQL_PORT:'3306',MYSQL_DATABASE:'drawsplat',MYSQL_USER:'drawsplat_app',ROSTER_ONLY:'true',PUBLIC_REGISTRATION:'false'};
function start(){child=spawn(process.execPath,['start.js'],{cwd:backend,env,stdio:'inherit'});child.on('error',error=>{console.error('API could not start:',error.message);stopping=true;process.exitCode=1;});child.on('exit',()=>{if(!stopping){console.log('Restarting API in 3 seconds.');timer=setTimeout(start,3000);}});}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{stopping=true;clearTimeout(timer);if(child&&!child.killed)child.kill('SIGTERM');});
start();
