import { chromium, firefox } from '@playwright/test';
import { readdir, readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
const root=resolve(process.argv[2]);
for(const [engine,type] of Object.entries({chromium,firefox})) {
 const browser=await type.launch();
 try {
 for(const name of await readdir(root)) {
  const folder=resolve(root,name);const links=[];
  for(const file of await readdir(folder)) {
   if(!/^(index|OPEN-APP|Open-.*)\.html$/.test(file))continue;
   const html=await readFile(resolve(folder,file),'utf8');
   const host=html.match(/data-host="([^"]+)"/);const local=html.match(/data-file="([^"]+)"/);
   if(host&&local)links.push({file,host:host[1],local:local[1]});
  }
  if(!links.some(link=>link.file==='OPEN-APP.html'))throw Error(`Missing shortcut: ${name}`);
  const server=spawn('python3',['offline-server.py','--no-browser','--port','0'],{cwd:folder});
  try {
   const origin=await new Promise((yes,no)=>{const timer=setTimeout(()=>no(Error('Launcher timeout')),10000);server.stdout.on('data',data=>{const match=String(data).match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);yes(match[0]);}});});
   for(const protocol of ['file','http']) {
    const context=await browser.newContext({offline:protocol==='file'});
    const page=await context.newPage();
    for(const link of links) {
     const target=protocol==='file'?link.local:link.host;
     await access(resolve(folder,target.split(/[?#]/)[0]));
     const base=protocol==='file'?pathToFileURL(resolve(folder,link.file)).href:`${origin}/${link.file}`;
     const expected=new URL(target,base).href;
     await page.goto(base,{waitUntil:'domcontentloaded'}).catch(error=>{if(!error.message.includes('interrupted by another navigation'))throw error;});
     await page.waitForURL(expected,{waitUntil:'domcontentloaded'});
     if(target==='START-HERE.html')await page.getByRole('heading',{name:'Local launcher',exact:true}).waitFor();
    }
    await context.close();
   }
   console.log(`${name} ${engine}: ${links.length} shortcuts passed over file and HTTP`);
  } finally {server.kill();}
 }
 } finally {await browser.close();}
}
