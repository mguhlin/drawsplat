const {chromium}=require('../../../node_modules/@playwright/test');
const assert=require('node:assert/strict');
const {mkdtempSync}=require('node:fs');
const {execFileSync}=require('node:child_process');
const {join}=require('node:path');
const origin=process.env.CLIPSPLAT_ORIGIN||'http://127.0.0.1:4186';
const temp=mkdtempSync('/tmp/clipsplat-accessibility-');
const image=join(temp,'card.png');
execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=yellow:s=320x240','-frames:v','1','-y',image]);
(async()=>{
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/solutions/clipsplat/');
 await page.locator('#settings').waitFor({state:'attached'});
 await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').textContent(),'Skip to editor');
 await page.keyboard.press('Enter');assert.equal(await page.locator(':focus').getAttribute('id'),'main');
 await page.locator('.workflow-step').evaluateAll(nodes=>nodes.forEach(n=>n.open=true));
 assert.equal(await page.locator('#choose-file').evaluate(n=>n.tagName),'BUTTON');
 const picker=page.waitForEvent('filechooser');await page.locator('#choose-file').focus();await page.keyboard.press('Space');await picker;
 assert.equal(await page.locator('#timeline-track').getAttribute('role'),'group');
 assert.match(await page.locator('#timeline-track').getAttribute('aria-describedby'),/timeline-keyboard-help/);
 await page.locator('#creator').fill('Creator');
 await page.locator('.text-overlay [data-role=creator]').focus();
 await page.waitForFunction(()=>document.querySelector('.text-overlay [data-role=creator]').getAttribute('aria-pressed')==='true');
 await page.locator('#image-cards-file').setInputFiles(image);
 await page.locator('[data-field=title]').fill('Keep my focus');
 await page.locator('[data-field=title]').evaluate(n=>n.setSelectionRange(3,7));
 await page.locator('#image-cards-file').setInputFiles(image);
 assert.equal(await page.locator(':focus').getAttribute('data-field'),'title');
 assert.deepEqual(await page.locator(':focus').evaluate(n=>[n.value,n.selectionStart,n.selectionEnd]),['Keep my focus',3,7]);
 await page.locator('[data-action=remove]').first().focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator(':focus').getAttribute('data-action'),'remove');
 await page.keyboard.press('Enter');assert.equal(await page.locator(':focus').getAttribute('id'),'add-image-cards');
 await page.locator('#intro-image').setInputFiles(image);await page.locator('#intro-remove-image').click();assert.equal(await page.locator(':focus').getAttribute('id'),'intro-choose-image');
 await page.locator('#image-cards-file').setInputFiles(image);
 if(process.env.CLIPSPLAT_AXE){
  await page.addScriptTag({path:process.env.CLIPSPLAT_AXE});
  for(const lang of ['en','ar']){
   await page.locator('#language').selectOption(lang);
   const results=await page.evaluate(()=>axe.run(document.getElementById('app'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
   assert.deepEqual(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],lang+' automated audit');
  }
 }
 await page.setViewportSize({width:320,height:850});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'320px layout');
 await page.emulateMedia({forcedColors:'active'});await page.keyboard.press('Tab');await page.locator('#intro-preview').focus();
 assert.equal(await page.locator('#intro-preview').evaluate(n=>getComputedStyle(n).outlineStyle),'solid');
 assert.deepEqual(errors,[]);
 console.log('PASS: skip link, keyboard file picker, timeline semantics, selected text, image-card focus/caret, removal focus, mobile/RTL/forced-colors'+(process.env.CLIPSPLAT_AXE?', axe WCAG A/AA checks':''));
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
