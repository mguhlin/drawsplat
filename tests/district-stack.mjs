// Smoke test the actual container gateway and first-run setup, without logging secrets.
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const origin='http://localhost:8080',base=origin+'/api/drawsplat/mysql';
const env=fs.readFileSync('selfhost/district/.env','utf8');const setupKey=env.match(/^SETUP_TOKEN=(.+)$/m)[1];
const password=crypto.randomBytes(20).toString('hex');
async function request(url,body,token){const r=await fetch(url,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};}
for(let i=0;i<120;i++){try{const r=await fetch(origin+'/setup');if(r.ok)break;}catch{}if(i===119)throw Error('Setup not ready');await new Promise(r=>setTimeout(r,1000));}
assert.equal((await request(origin+'/setup',{action:'test',setupKey:'incorrect'})).status,403);
assert.equal((await request(origin+'/setup',{action:'test',setupKey,databaseMode:'bundled',username:'autofill-wrong',password:'autofill-wrong',host:'wrong',ssl:true})).status,200);
assert.equal((await request(origin+'/setup',{action:'finish',setupKey,adminEmail:'admin@example.test',adminPassword:password})).status,200);
let healthy=false;for(let i=0;i<120;i++){try{if((await fetch(base+'/health')).ok){healthy=true;break;}}catch{}await new Promise(r=>setTimeout(r,1000));}assert.ok(healthy,'Installed service restarted');
const login=await request(base+'/auth/login',{email:'admin@example.test',password});assert.equal(login.status,200);const token=login.data.token;fs.writeFileSync('/tmp/drawsplat-ci-login.json',JSON.stringify({password}),{mode:0o600});
const savedBoard={title:'Installer verification board',active:0,panels:[{id:'verification',name:'Page 1',bg:'blank',objects:[]}]};
const save=await fetch(base+'/boards/install-check',{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({board:savedBoard,revision:0})});assert.equal(save.status,200);
assert.equal((await request(base+'/boards/install-check',null,token)).data.board.title,savedBoard.title);
assert.equal((await request(base+'/auth/register',{email:'unauthorized@example.test',password})).status,403);
const rows=[{teacher_email:'teacher@example.test',class_name:'Science',student_email:'student@example.test'}];
assert.equal((await request(base+'/district/roster',{rows},token)).data.classesCreated,1);
assert.equal((await request(base+'/district/roster',{rows},token)).data.classesCreated,0);
assert.equal((await request(base+'/district/roster',null,token)).data.classes.length,1);
assert.equal((await fetch(origin+'/selfhost/district/.env')).status,404);
assert.equal((await fetch(origin+'/server/mysql-backend/server.js')).status,404);
assert.equal((await fetch(origin+'/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({setupKey,action:'test'})})).status,404);
const board=await fetch(origin+'/app/whiteboard.html',{redirect:'manual'});assert.equal(board.status,302);assert.ok(board.headers.get('location').includes('storage=mysql'));
console.log('District stack: installation, restart, admin roster, registration lock, gateway privacy and board routing passed.');

const {inventory}=await import('../selfhost/district/components.js');for(const tool of inventory()){const r=await fetch(origin+tool.url,{method:'HEAD'});assert.equal(r.status,200,'Selected component entry: '+tool.name);}console.log('All selected component entry pages available, including all four SplatWorks apps.');
