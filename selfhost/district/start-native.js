// One foreground launcher for the native API and Caddy gateway.
const fs=require('node:fs'),path=require('node:path'),net=require('node:net');
const {spawn,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');process.chdir(root);
const caddy=process.env.DRAWSPLAT_CADDY||'caddy';
if(Number(process.versions.node.split('.')[0])<22)throw Error('Install Node.js 22 or newer.');
try{execFileSync(caddy,['version'],{stdio:'pipe'});}catch{throw Error('Install Caddy 2 and make its command available before starting native setup.');}
console.log('Chapter 1/3: install the saving-service dependencies.');
const backend=path.join(root,'server/mysql-backend');
if(process.platform==='win32')execFileSync('cmd.exe',['/d','/s','/c','npm ci --omit=dev'],{cwd:backend,stdio:'inherit'});
else execFileSync('npm',['ci','--omit=dev'],{cwd:backend,stdio:'inherit'});
console.log('Chapter 2/3: prepare settings without changing database data.');
execFileSync(process.execPath,['selfhost/district/prepare-native.js',...process.argv.slice(2)],{stdio:'inherit'});
const settings=JSON.parse(fs.readFileSync(path.join(__dirname,'native-private/settings.json')));
const config=path.join(__dirname,'native-web/Caddyfile');
execFileSync(caddy,['validate','--config',config,'--adapter','caddyfile'],{stdio:'inherit'});
async function available(port){await new Promise((resolve,reject)=>{const socket=net.createServer();socket.once('error',()=>reject(Error('Local port '+port+' is occupied. Stop only this installation, or use --api-port and --web-port for a separate local native instance.')));socket.listen(port,'127.0.0.1',()=>socket.close(resolve));});}
(async()=>{
 await available(settings.apiPort);await available(settings.webPort);
 console.log('Chapter 3/3: start the API and gateway. Keep this terminal open; Ctrl+C stops both.');
 const api=spawn(process.execPath,['selfhost/district/run-native.js'],{stdio:'inherit'});
 const gateway=spawn(caddy,['run','--config',config,'--adapter','caddyfile'],{stdio:'inherit'});
 let stopping=false;
 function stop(code=0){if(stopping)return;stopping=true;process.exitCode=code;for(const child of [api,gateway])if(child.exitCode===null)child.kill('SIGTERM');}
 for(const child of [api,gateway]){child.on('error',error=>{console.error('Native service could not start:',error.message);stop(1)});child.on('exit',code=>{if(!stopping){console.error('A native service stopped. Check the message above.');stop(code||1)}});}
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>stop());
 let ready=false;
 for(let i=0;i<120&&!stopping;i++){try{const response=await fetch(settings.origin+'/api/drawsplat/mysql/health',{signal:AbortSignal.timeout(2000)});if(response.ok||(response.status===503&&(await response.json()).setupRequired)){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,500));}
 if(!ready){console.error('Native services did not become ready; review the logs above.');stop(1);return;}
 console.log('Local services ready: '+settings.origin+'/start-here.html');
 console.log('Service readiness is not completed installation. Finish /setup, then verify login, Save/Open and classrooms.');
 if(!process.env.DRAWSPLAT_NO_OPEN){const command=process.platform==='darwin'?'open':process.platform==='win32'?'explorer.exe':'xdg-open';const browser=spawn(command,[settings.origin+'/start-here.html'],{stdio:'ignore'});browser.on('error',()=>{});}
})().catch(error=>{console.error(error.message);process.exitCode=1});
