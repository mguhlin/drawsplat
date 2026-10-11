// Prepare native Node + MariaDB/MySQL + Caddy. No Docker or database mutation.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {inventory,validatePlan,applyComponents}=require('./components');
const root=path.resolve(__dirname,'../..'),state=path.join(__dirname,'native-private'),web=path.join(__dirname,'native-web');
const file=path.join(state,'settings.json'),planFile=path.join(root,'drawsplat-district-plan.json');
const previous=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;
const plan=validatePlan(fs.existsSync(planFile)?JSON.parse(fs.readFileSync(planFile,'utf8')):{version:1,components:inventory().map(t=>t.id),database:previous?.database||(process.argv.includes('--mysql')?'mysql':'mariadb'),domain:previous?.domain||'',hosting:'native'});
if(plan.hosting!=='native')throw Error('This plan selects Docker. Choose Without Docker in start-here.html and save the updated plan first.');
if(previous&&previous.database!==plan.database)throw Error('Database engine changes require a separate migration. Keep the existing engine in your plan.');
const readPort=(flag,fallback)=>{const index=process.argv.indexOf(flag),value=index<0?fallback:Number(process.argv[index+1]);if(!Number.isInteger(value)||value<1024||value>65535)throw Error('Local ports must be between 1024 and 65535.');return value;};
const apiPort=readPort('--api-port',previous?.apiPort||8787),webPort=readPort('--web-port',previous?.webPort||8080);
if(apiPort===webPort)throw Error('API and web ports must differ.');
const settings={version:1,database:plan.database,domain:plan.domain,apiPort,webPort,setupToken:previous?.setupToken||crypto.randomBytes(32).toString('hex'),origin:plan.domain?'https://'+plan.domain:'http://localhost:'+webPort};
fs.mkdirSync(state,{recursive:true,mode:0o700});fs.mkdirSync(web,{recursive:true});
fs.writeFileSync(file,JSON.stringify(settings,null,2),{mode:0o600});
if(process.platform!=='win32'){fs.chmodSync(state,0o700);fs.chmodSync(file,0o600);}
applyComponents(plan,{siteRoot:root,routingFolder:web});
const quoted=value=>JSON.stringify(value.replaceAll('\\','/'));
let caddy=fs.readFileSync(path.join(__dirname,'Caddyfile'),'utf8').replace('{$SITE_ADDRESS}',plan.domain||':'+webPort).replace('/etc/caddy/components.caddy',quoted(path.join(web,'components.caddy'))).replace('/etc/caddy/app-headers.caddy',quoted(path.join(web,'app-headers.caddy'))).replaceAll('api:8787','127.0.0.1:'+apiPort).replace('root * /srv','root * '+quoted(root));
if(!plan.domain)caddy=caddy.replace(' {\n',' {\n  bind 127.0.0.1\n');
fs.writeFileSync(path.join(web,'Caddyfile'),caddy);
console.log('Native settings prepared. Existing accounts and secrets are preserved.');
console.log('Setup hub: '+settings.origin+'/start-here.html');
console.log('Setup address: '+settings.origin+'/setup');
console.log('Setup key: '+settings.setupToken);
console.log('API: node selfhost/district/run-native.js');
console.log('Gateway: caddy run --config selfhost/district/native-web/Caddyfile --adapter caddyfile');
