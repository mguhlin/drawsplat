const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const registry = require('../data/drawsplat-tools.json');
const renamed = [
 ['concept-map','ConceptSplat','Concept Map Studio','concept-map'],
 ['markdown-studio','MarkdownSplat','Markdown Studio','markdown-studio'],
 ['mermaid','DiagramSplat','Mermaid Diagram Studio','mermaid'],
 ['quiz-flashcards','QuizSplat','Quiz & Flashcard Studio','quiz-flashcard-studio'],
 ['rubric-builder','RubricSplat','Rubric Builder','rubric-builder'],
 ['sketchspace-vr','SketchSplat VR','SketchSpace VR','sketchspace-VR'],
];

test('former and current names find the same tool without changing saved favorite IDs', async ({page}) => {
 await page.goto('/studio/');
 await expect(page.locator('h1')).toHaveText('SplatWorks Studio');
 for (const [id,name,former,slug] of renamed) {
  const entry=registry.tools.find(t=>t.id===id);
  expect(entry.name).toBe(name);expect(entry.aliases).toContain(former);expect(entry.url).toBe(`/solutions/${slug}/`);
  for(const query of [name,former]) {
   await page.locator('#toolSearch').fill(query);
   await expect(page.locator(`.ds-tool-card[data-id="${id}"] h3`)).toHaveText(name);
  }
 }
 await page.locator('#toolSearch').fill('Concept Map Studio');
 await page.locator('.ds-tool-card[data-id="concept-map"] .ds-favorite').click();
 await page.reload();await expect(page.locator('#favoritesShelf')).toContainText('ConceptSplat');
});

for (const [id,name,former,slug] of renamed) {
 test(`${name} keeps its brand in translated interfaces and its original route`, async ({page}) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const lang of ['en','es','ar']) {
   await page.goto(`/solutions/${slug}/?lang=${lang}`);
   await expect(page).toHaveTitle(new RegExp(name));
   if(id==='markdown-studio')await expect(page.locator('.topnav-brand')).toContainText(name);
   else await expect(page.locator('h1').first()).toHaveText(name);
   await expect(page.locator('html')).toHaveAttribute('lang',lang);
  }
  expect(errors).toEqual([]);
 });
}

test('QuizSplat can reopen an old draft and export using the existing interchange filename', async ({page}) => {
 await page.addInitScript(()=>localStorage.setItem('drawsplat.quizFlashcardStudio',JSON.stringify({title:'Existing school quiz',timer:20,questions:[{type:'short-answer',question:'Keep existing work?',answer:'yes',wrong:[],points:1}],reports:[]})));
 await page.goto('/solutions/quiz-flashcard-studio/');
 await page.locator('#loadDraft').click();await expect(page.locator('#quizTitle')).toHaveValue('Existing school quiz');
 const download=page.waitForEvent('download');await page.locator('#exportJson').click();const saved=await download;
 expect(saved.suggestedFilename()).toBe('drawsplat-quiz-flashcard_v1.json');
 const content=JSON.parse(fs.readFileSync(await saved.path(),'utf8'));expect(content.title).toBe('Existing school quiz');expect(content.questions).toHaveLength(1);
});

test('notice builder preserves old drafts and includes approved components, services, and local-copy handling',async({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('drawsplatPrivacyBuilderDraft'))localStorage.setItem('drawsplatPrivacyBuilderDraft',JSON.stringify({organization:'Example school',owner:'School IT',retention:'Term plus 30 days'}))});
 await page.goto('/legal/privacy-builder.html');
 await expect(page.locator('[name=organization]')).toHaveValue('Example school');
 await page.locator('[name=approvedComponents]').fill('DrawSplat whiteboard; ConceptSplat');
 await page.locator('[name=approvedServices]').fill('District-hosted only; AI connections disabled');
 await page.locator('[name=localCopies]').fill('Clear shared profiles at sign-out; manage exports separately');
 const preview=page.locator('#privacyMarkdownPreview');
 for(const text of ['# SplatWorks Deployment Privacy Notice','DrawSplat whiteboard; ConceptSplat','AI connections disabled','Clear shared profiles','Term plus 30 days','request metadata','no ecosystem-wide 24-hour expiry'])await expect(preview).toContainText(text);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download Markdown',exact:true}).click();
 const saved=await download;expect(saved.suggestedFilename()).toBe('example-school-splatworks-privacy-notice.md');
 expect(fs.readFileSync(await saved.path(),'utf8')).toContain('District-hosted only; AI connections disabled');
 await page.reload();await expect(page.locator('[name=approvedComponents]')).toHaveValue('DrawSplat whiteboard; ConceptSplat');
});

test('policy packet preserves review status and separates hosting, local work and optional services',async({page})=>{
 await page.goto('/legal/privacy-agreements.html');
 await expect(page.locator('main')).toContainText('Springdale');
 await expect(page.locator('main')).toContainText('under review');
 await page.goto('/legal/combined-policy.html');
 for(const text of ['DrawSplat is the whiteboard','Cloudflare','approved','external AI','not executed agreements'])await expect(page.locator('main')).toContainText(text);
 const ids=await page.locator('main [id]').evaluateAll(es=>es.map(e=>e.id));expect(new Set(ids).size).toBe(ids.length);
 await page.goto('/wiki/?q=Concept+Map+Studio');await expect(page.locator('.wiki-results')).toContainText('Ecosystem tools, widgets and features');
 for(const width of [1440,390]) {
  await page.setViewportSize({width,height:900});
  for(const url of ['/studio/','/legal/privacy-builder.html','/legal/widgets-security.html','/pages/splatworks.html']){
   await page.goto(url);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),url).toBeTruthy();
  }
 }
});

test('MarkdownSplat still hands an editable outline to ConceptSplat through the existing local channel', async({page,context})=>{
 await page.goto('/solutions/markdown-studio/');
 await page.locator('#md-input').fill('# Existing lesson\n## First branch\n- Keep this idea');
 const opened=context.waitForEvent('page');await page.locator('#btn-open-concept-map').click();
 const map=await opened;await map.waitForLoadState('domcontentloaded');
 await expect(map.locator('h1')).toHaveText('ConceptSplat');
 await expect(map.getByRole('img',{name:'Concept map canvas'})).toContainText('Existing lesson');
 await expect(map.getByRole('img',{name:'Concept map canvas'})).toContainText('Keep this idea');
 expect(await map.evaluate(()=>localStorage.getItem('drawsplat.handoff'))).toBeNull();
 const download=map.waitForEvent('download');await map.locator('#quickSaveWorkBtn').click();
 const saved=await download;const data=JSON.parse(fs.readFileSync(await saved.path(),'utf8'));
 expect(JSON.stringify(data)).toContain('Existing lesson');expect(data.nodes.length).toBeGreaterThan(1);
});

 test('shared storage notice discloses hosting and optional AI instead of promising zero transfers',async({page})=>{
  await page.goto('/legal/privacy-builder.html');
  const notice=page.getByRole('dialog',{name:'Browser storage notice'});
  await expect(notice).toContainText('SplatWorks keeps app drafts and settings');
  await expect(notice).toContainText('Public hosting receives request metadata');
  await expect(notice).toContainText('cloud, AI');
  await expect(notice.getByRole('link',{name:'Review storage and connections →'})).toHaveAttribute('href','/legal/widgets-security.html');
  await notice.getByRole('button',{name:'Got it'}).click();await page.reload();await expect(notice).toHaveCount(0);
 });
