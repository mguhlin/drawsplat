import { chromium, firefox } from '@playwright/test';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
const root = resolve(process.argv[2] || '.tmp/offline-audit');
const results = [];
for (const dir of (await readdir(root)).sort()) {
 const folder = resolve(root, dir);
 const config = JSON.parse(await readFile(resolve(folder, 'offline-app.json')));
 if(process.env.AUDIT_PACKAGES && !process.env.AUDIT_PACKAGES.split(',').includes(config.name)) continue;
 const server = spawn('python3', ['offline-server.py','--no-browser','--port','0'], {cwd:folder});
 try {
 const url = await new Promise((res,rej)=>{let output='';const timer=setTimeout(()=>rej(Error('Launcher timeout')),10000);server.stdout.on('data',data=>{output+=data;const match=output.match(/http:\/\/127\.0\.0\.1:\d+\/\S*/);if(match){clearTimeout(timer);res(match[0]);}});server.on('exit',code=>rej(Error(`Launcher exited ${code}`)));});
 for (const [name,type] of Object.entries({chromium,firefox})) {
 const browser=await type.launch();
 try {
 const context=await browser.newContext();
 await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).hostname==='127.0.0.1')errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(url); await page.waitForTimeout(1500);
 const body=await page.locator('body').innerText();
 if(body.length<100)errors.push('Empty app body');
 if(config.name==='WriteSplat') {const editor=page.getByRole('textbox',{name:'WriteSplat document editor'});await editor.click();await page.keyboard.press('Control+A');await page.keyboard.type('Offline writing works.');await page.waitForTimeout(300);if(await page.locator('#statusWords').innerText()!=='3')errors.push('Word count did not update');}
 if(config.name==='GridSplat') {await page.getByRole('button',{name:'New Sheet',exact:true}).click();await page.getByTestId('cell-A1').dblclick();await page.keyboard.type('Offline');await page.keyboard.press('Enter');if(!(await page.getByTestId('cell-A1').innerText()).includes('Offline'))errors.push('Cell edit failed');}
 results.push({app:config.name,browser:name,errors:[...errors],body:body.slice(0,1800)});
 console.log(`${config.name} ${name}: ${errors.length?JSON.stringify(errors):'PASS'}`);
 if(!process.env.AUDIT_STARTUP_ONLY && name==='chromium' && ['Tools','Widgets','Games'].includes(config.name)) {
 const registry=JSON.parse(await readFile(resolve(folder,'data/drawsplat-tools.json')));
 for(const tool of registry.tools) {
 errors.length=0;
 await page.goto(new URL(tool.url,url).href);await page.waitForTimeout(700);
 const toolErrors=[...errors];
 results.push({app:tool.name,browser:name,package:config.name,errors:toolErrors});
 console.log(`  ${tool.name}: ${toolErrors.length?JSON.stringify(toolErrors):'PASS'}`);
 }
 }

 } finally {await browser.close();}
 }
 } finally {server.kill();}
}
await writeFile('/tmp/selfhost-audit-results.json',JSON.stringify(results,null,2));
if(results.some(r=>r.errors.length))process.exitCode=1;
