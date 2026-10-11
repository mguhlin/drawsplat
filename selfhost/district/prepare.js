// Runs in a Node container, so the district host needs Docker only.
const fs=require('node:fs'),crypto=require('node:crypto');
const folder=__dirname,file=folder+'/.env';
const {inventory,validatePlan,applyComponents}=require('./components');
const planFile=require('node:path').resolve(__dirname,'../../drawsplat-district-plan.json');
const plan=validatePlan(fs.existsSync(planFile)?JSON.parse(fs.readFileSync(planFile,'utf8')):{version:1,components:inventory().map(t=>t.id),database:process.argv.includes('--mysql')?'mysql':'mariadb',domain:''});
if(fs.existsSync(file)){const current=fs.readFileSync(file,'utf8');const engine=current.match(/^DB_IMAGE=(.+)$/m)?.[1].startsWith('mysql:')?'mysql':'mariadb';if(fs.existsSync(planFile)&&engine!==plan.database)throw Error('Database engine changes require a separate migration. Keep the existing engine in your plan.');if(!fs.existsSync(planFile)){plan.database=engine;const address=current.match(/^SITE_ADDRESS=(.+)$/m)?.[1]||'';plan.domain=address.startsWith(':')?'':address;}}

if(!fs.existsSync(file)){
 const secret=()=>crypto.randomBytes(32).toString('hex');
 const mysql=plan.database==='mysql';
 fs.writeFileSync(file,`DB_IMAGE=${mysql?'mysql:8.4':'mariadb:11.8'}\nDB_PASSWORD=${secret()}\nDB_ROOT_PASSWORD=${secret()}\nSETUP_TOKEN=${secret()}\nSITE_ADDRESS=:8080\nSITE_ORIGIN=http://localhost:8080\nWEB_BIND=127.0.0.1\n`,{mode:0o600,flag:'wx'});
 console.log('Created private server settings. Existing settings are never overwritten.');
}
let env=fs.readFileSync(file,'utf8');
if(plan.domain||fs.existsSync(planFile)){for(const [key,value] of Object.entries({SITE_ADDRESS:plan.domain||':8080',SITE_ORIGIN:plan.domain?'https://'+plan.domain:'http://localhost:8080',WEB_BIND:plan.domain?'0.0.0.0':'127.0.0.1'}))env=env.replace(new RegExp('^'+key+'=.*$','m'),key+'='+value);fs.writeFileSync(file,env,{mode:0o600});}
applyComponents(plan);
console.log('Enabled '+plan.components.length+' components. Existing accounts, secrets and database volumes are preserved.');
console.log('Setup hub: '+(env.match(/^SITE_ORIGIN=(.+)$/m)?.[1]||'http://localhost:8080')+'/start-here.html');
console.log('Setup address: '+(env.match(/^SITE_ORIGIN=(.+)$/m)?.[1]||'http://localhost:8080')+'/setup');console.log('Setup key: '+env.match(/^SETUP_TOKEN=(.+)$/m)[1]);
