const {test,expect}=require('@playwright/test');
for(const slug of ['typing-games','cipher-chase','wordfall-reactor','story-sprint','paws-and-keys-adventure']){
 test(`${slug}: assets, six languages and responsive layout`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Cloudflare injects its analytics beacon in production. The self-only CSP
  // intentionally blocks it; keep all other console and runtime errors fatal.
  page.on('console',m=>{if(m.type()==='error'&&!/^Loading the script 'https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js\/.*violates the following Content Security Policy/.test(m.text()))errors.push(m.text())});
  await page.goto(`/games/${slug}/`);await expect(page.locator('h1')).toBeVisible();await expect(page.locator('[data-i18n-picker] select option')).toHaveCount(6);
  for(const code of ['es','vi','ar','zh','uh','en']){await page.locator('[data-i18n-picker] select').selectOption(code);const key=slug==='typing-games'?'menu':({'cipher-chase':'road','wordfall-reactor':'blocks','story-sprint':'coach','paws-and-keys-adventure':'paws'}[slug]+'.title');await expect(page.locator('h1')).toHaveText(await page.evaluate(k=>WidgetI18n.t(k),key));await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()}
  expect(await page.locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0))).toBeTruthy();
  for(const width of [390,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:`/tmp/typing-${slug}-${width}.png`,fullPage:true})}expect(errors).toEqual([]);
 });
}
test('menu links to four separate experiences',async({page})=>{await page.goto('/games/typing-games/');await expect(page.locator('canvas')).toHaveCount(0);await expect(page.locator('.game-card')).toHaveCount(4)});
test('Cipher Chase typing, controls, pause and reset',async({page})=>{
 await page.goto('/games/cipher-chase/');await page.locator('#start').click();await expect(page.locator('#overlay')).toBeHidden();await page.locator('#word').fill('wrongword');await page.locator('#word').press('Enter');await expect(page.locator('#feedback')).toContainText('No match');await expect(page.locator('#word')).toHaveValue('wrongword');await expect(page.locator('#targets')).not.toBeEmpty();const target=await page.locator('#targets').textContent();await page.locator('#word').fill(target.split(' · ')[0]);await page.locator('#word').press('Enter');await expect(page.locator('#feedback')).toHaveText('Target cleared!');await page.locator('#word').press('ArrowRight');await page.screenshot({path:'/tmp/cipher-chase-gameplay.png',fullPage:true});await page.locator('[data-action=smoke]').click();await page.locator('#pause').click();await expect(page.locator('#overlayTitle')).toHaveText('Paused');const score=await page.locator('#score').textContent();await page.waitForTimeout(200);await expect(page.locator('#score')).toHaveText(score);await page.locator('#pause').click();await expect(page.locator('#overlay')).toBeHidden();await page.locator('#reset').click();await expect(page.locator('#lives')).toHaveText('5');
});
test('Wordfall Reactor board, preview, scoring and computer opponent',async({page})=>{
 await page.goto('/games/wordfall-reactor/');await expect(page.locator('#board button')).toHaveCount(225);await expect(page.locator('#rack button')).toHaveCount(7);
 await page.locator('#reactorWord').fill('notaword');await expect(page.locator('#playWord')).toBeDisabled();await page.locator('#wordBank button.playable').first().click();await expect(page.locator('#board .preview')).not.toHaveCount(0);await expect(page.locator('#placement')).toContainText('Legal move');await page.locator('#playWord').click();await expect(page.locator('#round')).toHaveText('2 / 10');expect(Number(await page.locator('#playerScore').textContent())).toBeGreaterThan(0);expect(Number(await page.locator('#computerScore').textContent())).toBeGreaterThan(0);await expect(page.locator('#board .cpu')).not.toHaveCount(0);await expect(page.locator('#moveLog li')).toHaveCount(2);await expect(page.locator('#reactorDefinition')).toBeVisible();await expect(page.locator('#definitionSource')).toBeHidden();
 await page.locator('#reset').click();await expect(page.locator('#board .filled')).toHaveCount(0);await expect(page.locator('#playerScore')).toHaveText('0');await page.locator('#subject').selectOption('science');await page.locator('#vocabBand').selectOption('9-12');await expect(page.locator('#wordBank')).toContainText('enzyme');await expect(page.locator('#wordBank')).not.toContainText('fraction');await page.locator('#wordBank button.playable').first().click();await expect(page.locator('#playWord')).toBeEnabled();
});
test('Wordfall Reactor completes a connected ten-turn match',async({page})=>{
 test.setTimeout(60000);await page.goto('/games/wordfall-reactor/');
 for(let i=0;i<10;i++){if(await page.locator('#hint').isDisabled())break;await page.locator('#wordBank button.playable').first().click();await page.locator('#playWord').click();await expect(page.locator('#feedback')).not.toHaveText('Computer is choosing a word…');}
 await expect(page.locator('#feedback')).toContainText('Match complete');await expect(page.locator('#playWord')).toBeDisabled();await expect(page.locator('#exchange')).toBeDisabled();
});
test('Story Sprint correction, pause, exact completion and deliberate next',async({page})=>{
 await page.goto('/games/story-sprint/');await page.locator('summary').click();await page.locator('#custom').fill('A cat.');await page.locator('#load').click();await page.locator('#practice').fill('A dog.');await expect(page.locator('#errors')).not.toHaveText('0');await page.locator('#pause').click();await expect(page.locator('#practice')).toBeDisabled();await page.locator('#pause').click();await page.locator('#practice').fill('A cat.');await expect(page.locator('#progress')).toHaveText('100%');await expect(page.locator('#accuracy')).toHaveText('100%');await expect(page.locator('#feedback')).toContainText('Passage complete');await page.waitForTimeout(1100);await expect(page.locator('#practice')).toHaveValue('A cat.');await page.locator('#next').click();await expect(page.locator('#practice')).toHaveValue('');
 await page.locator('#file').setInputFiles({name:'passages.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify([{title:'Custom story',text:'<b>Hello</b>'}]))});await expect(page.locator('#passageTitle')).toHaveText('Custom story');await expect(page.locator('#passage b')).toHaveCount(0);await expect(page.locator('#passage')).toHaveText('<b>Hello</b>');await page.locator('#file').setInputFiles({name:'passages.csv',mimeType:'text/csv',buffer:Buffer.from('title,text\nTest,"A cat, a dog."')});await expect(page.locator('#passage')).toHaveText('A cat, a dog.');
});
test('Paws & Keys gentle mistake, unlock, persistence, pet and age',async({page})=>{
 await page.goto('/games/paws-and-keys-adventure/');await expect(page.locator('#trailSelect option').nth(1)).toHaveAttribute('disabled','');await page.locator('#keyboard [data-key=a]').click();await expect(page.locator('#pawsFeedback')).toContainText('Try the glowing key');await expect(page.locator('#trailProgress')).toHaveAttribute('value','0');for(let i=0;i<8;i++){const key=await page.locator('#keyboard .glow').getAttribute('data-key');await page.locator(`#keyboard [data-key="${key}"]`).click()}await expect(page.locator('#celebration')).toBeVisible();await expect(page.locator('#trailSelect option').nth(1)).not.toHaveAttribute('disabled','');await page.locator('#nextTrail').click();await expect(page.locator('#trailLabel')).toContainText('Trail 2');await page.locator('#pet').selectOption('puppy');await expect(page.locator('#petRunner')).toHaveAttribute('src',/puppy/);await page.reload();await expect(page.locator('#trailSelect option').nth(1)).not.toHaveAttribute('disabled','');await page.locator('#age').selectOption('big');await expect(page.locator('#trailSelect option').nth(1)).toHaveAttribute('disabled','');await page.locator('#pawsPause').click();await expect(page.locator('#keyboard [data-key=f]')).toBeDisabled();await page.locator('#pawsPause').click();await expect(page.locator('#keyboard [data-key=f]')).toBeEnabled();
});
test('Paws & Keys all twelve trails, real keyboard, stars and four worlds',async({page})=>{
 test.setTimeout(60000);await page.goto('/games/paws-and-keys-adventure/');
 for(let trail=0;trail<12;trail++){
  await expect(page.locator('.pet-landscape')).toHaveAttribute('src',`../typing-games/assets/world-${Math.floor(trail/3)+1}.webp`);
  for(let i=0;i<8;i++){const word=await page.locator('#keyPrompt').textContent();await page.keyboard.type(word.toLowerCase())}
  await expect(page.locator('#celebration')).toBeVisible();await expect(page.locator('#earnedStars')).toHaveText('★★★');if(trail<11)await page.locator('#nextTrail').click();
 }
 await expect(page.locator('#nextTrail')).toBeDisabled();await expect(page.locator('#starCount')).toHaveText('★ 36');await page.reload();await expect(page.locator('#trailSelect option').last()).not.toHaveAttribute('disabled','');
});
test('Story Sprint XLSX inline strings and sparse columns',async({page})=>{
 const JSZip=require('../vendor/jszip.min.js');const zip=new JSZip();zip.file('xl/worksheets/sheet1.xml','<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>title</t></is></c><c r="B1" t="inlineStr"><is><t>text</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>A spreadsheet story</t></is></c><c r="B2" t="inlineStr"><is><t>A puppy naps.</t></is></c></row></sheetData></worksheet>');
 await page.goto('/games/story-sprint/');await page.locator('summary').click();await page.locator('#file').setInputFiles({name:'stories.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:await zip.generateAsync({type:'nodebuffer'})});await expect(page.locator('#passageTitle')).toHaveText('A spreadsheet story');await expect(page.locator('#passage')).toHaveText('A puppy naps.');
});

test('Cipher Chase accepts spaces in Vietnamese targets',async({page})=>{await page.goto('/games/cipher-chase/?lang=vi');await page.locator('#subject').selectOption('general');await page.locator('#difficulty').selectOption('intermediate');await page.locator('#start').click();await expect(page.locator('#targets')).not.toBeEmpty();const target=(await page.locator('#targets').textContent()).split(' · ')[0];expect(target).toContain(' ');await page.locator('#word').pressSequentially(target);await expect(page.locator('#word')).toHaveValue(target);await page.locator('#word').press('Enter');await expect(page.locator('#feedback')).toHaveText(await page.evaluate(()=>WidgetI18n.t('hit')))});
const legacyGames={'road-rally':'cipher-chase','block-zap':'wordfall-reactor','passage-coach':'story-sprint','paws-and-keys':'paws-and-keys-adventure'};
for(const [oldSlug,newSlug] of Object.entries(legacyGames)){
 test(`${oldSlug} redirects before expiry, keeping language and fragment`,async({page})=>{
  await page.clock.setFixedTime(new Date('2027-04-08T04:59:59.999Z'));
  await page.goto(`/games/${oldSlug}/?lang=es#practice`);
  await expect(page).toHaveURL(new RegExp(`/games/${newSlug}/\\?lang=es#practice$`));
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',`https://drawsplat.org/games/${newSlug}/`);
 });
 test(`${oldSlug} stops redirecting at the six-month cutoff`,async({page})=>{
  await page.clock.setFixedTime(new Date('2027-04-08T05:00:00Z'));
  await page.goto(`/games/${oldSlug}/`);
  await expect(page.locator('#redirect-title')).toHaveText('This old game link has expired');
  await expect(page).toHaveURL(new RegExp(`/games/${oldSlug}/$`));
  await expect(page.locator(`a[href="../${newSlug}/"]`)).toBeVisible();
 });
}
test('legacy link does not revive after expiry or without JavaScript',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL});const page=await context.newPage();
 await page.clock.setFixedTime(new Date('2028-01-01T00:00:00Z'));
 await page.goto('/games/road-rally/');await expect(page.locator('#redirect-title')).toContainText('expired');await context.close();
 const noJS=await browser.newContext({baseURL,javaScriptEnabled:false});const fallback=await noJS.newPage();
 await fallback.goto('/games/road-rally/');await expect(fallback.locator('a[href="../cipher-chase/"]')).toBeVisible();await expect(fallback).toHaveURL(/\/games\/road-rally\/$/);await noJS.close();
});

test('Cipher Chase TEKS sets and success definition',async({page})=>{
 await page.goto('/games/cipher-chase/');
 const entries=await page.evaluate(()=>CipherVocabulary);expect(entries).toHaveLength(72);for(const subject of ['science','math','social'])for(const band of ['3-5','6-8','9-12']){
  await page.locator('#subject').selectOption(subject);await page.locator('#vocabBand').selectOption(band);await page.locator('#start').click();await expect(page.locator('#targets')).not.toBeEmpty();const word=(await page.locator('#targets').textContent()).split(' · ')[0];const entry=entries.find(e=>e.word===word&&e.subject===subject&&e.band===band);expect(entry).toBeTruthy();await page.locator('#word').fill(word);await page.locator('#word').press('Enter');await expect(page.locator('#definitionWord')).toHaveText(word);await expect(page.locator('#definitionText')).toHaveText(entry.definition);await expect(page.locator('#definitionSource')).toHaveAttribute('href',entry.source);
 }
});
test('Cipher Chase starts sound on, generates audible samples and honors mute',async({page})=>{
 await page.addInitScript(()=>{
  const Audio=window.AudioContext;window.audioChecks={starts:0,peak:0,state:''};
  window.AudioContext=class extends Audio{constructor(){super();const analyser=this.createAnalyser();analyser.fftSize=2048;analyser.connect(this.destination);const oscillator=this.createOscillator.bind(this);this.createOscillator=()=>{const o=oscillator(),start=o.start.bind(o);o.connect(analyser);o.start=(...args)=>{window.audioChecks.starts++;window.audioChecks.state=this.state;start(...args)};return o};const samples=new Float32Array(analyser.fftSize);setInterval(()=>{analyser.getFloatTimeDomainData(samples);window.audioChecks.peak=Math.max(window.audioChecks.peak,...samples.map(Math.abs))},10)}};
 });
 await page.goto('/games/cipher-chase/');await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','true');await page.locator('#start').click();await expect.poll(()=>page.evaluate(()=>audioChecks.starts)).toBeGreaterThan(0);await expect.poll(()=>page.evaluate(()=>audioChecks.peak)).toBeGreaterThan(.01);expect(await page.evaluate(()=>audioChecks.state)).toBe('running');await page.locator('#sound').click();const count=await page.evaluate(()=>audioChecks.starts);await page.locator('#word').fill('wrong');await page.locator('#word').press('Enter');await page.waitForTimeout(100);expect(await page.evaluate(()=>audioChecks.starts)).toBe(count);await page.locator('#testSound').click();await expect(page.locator('#audioStatus')).toContainText('Test tone played');await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','true');
});
test('Story Sprint rejects paste and drop but keeps teacher imports and typed completion',async({page})=>{
 await page.goto('/games/story-sprint/');await page.locator('summary').click();await page.locator('#custom').fill('A cat.');await page.locator('#load').click();
 for(const type of ['paste','drop','beforeinput']){const prevented=await page.locator('#practice').evaluate((el,type)=>{const e=type==='beforeinput'?new InputEvent(type,{bubbles:true,cancelable:true,inputType:'insertFromPaste',data:'A cat.'}):new Event(type,{bubbles:true,cancelable:true});return!el.dispatchEvent(e)},type);expect(prevented).toBeTruthy();await expect(page.locator('#practice')).toHaveValue('');await expect(page.locator('#progress')).toHaveText('0%');await expect(page.locator('#feedback')).toContainText('Pasting and dropping');}
 await page.locator('#practice').press('Control+v');await expect(page.locator('#practice')).toHaveValue('');await page.locator('#practice').pressSequentially('A cat.');await expect(page.locator('#progress')).toHaveText('100%');
});

test('Wordfall Reactor forms connected dictionary words in both directions',async({page})=>{
 await page.goto('/games/wordfall-reactor/');await page.locator('#wordBank button.playable').first().click();const points=Number((await page.locator('#placement').textContent()).match(/— (\d+) points/)[1]);await page.locator('#playWord').click();await expect(page.locator('#round')).toHaveText('2 / 10');await expect(page.locator('#playerScore')).toHaveText(String(points));
 const valid=await page.evaluate(()=>{
  const words=new Set([...RegularVocabulary,...CipherVocabulary].map(v=>v.word));const tiles=[...document.querySelectorAll('#board button')].map(b=>b.classList.contains('filled')?b.firstChild.textContent.toLowerCase():'');const filled=tiles.map((v,i)=>v?i:-1).filter(i=>i>=0),seen=new Set(),queue=[filled[0]];
  while(queue.length){const i=queue.pop();if(seen.has(i))continue;seen.add(i);for(const j of [i-15,i+15,i%15>0?i-1:-1,i%15<14?i+1:-1])if(j>=0&&j<225&&tiles[j]&&!seen.has(j))queue.push(j)}
  if(seen.size!==filled.length)return false;
  for(let row=0;row<15;row++)for(const down of [false,true]){let run='';for(let col=0;col<=15;col++){const ch=col===15?'':tiles[down?col*15+row:row*15+col];if(ch)run+=ch;else{if(run.length>1&&!words.has(run))return false;run=''}}}return true;
 });expect(valid).toBeTruthy();
});
test('Cipher Chase reports unavailable browser audio',async({page})=>{
 await page.addInitScript(()=>{window.AudioContext=undefined;window.webkitAudioContext=undefined});await page.goto('/games/cipher-chase/');await page.locator('#testSound').click();await expect(page.locator('#audioStatus')).toContainText('Sound could not start');
});

test('Wordfall hint gives only a stable definition and preserves the student placement',async({page})=>{
 await page.goto('/games/wordfall-reactor/');await page.locator('#board button[data-row="2"][data-col="4"]').click();await page.locator('#direction').click();await page.locator('#reactorWord').fill('myguess');const position=await page.locator('#placement').textContent();const selected=await page.locator('#board .selected').getAttribute('aria-label');
 await page.locator('#hint').click();await expect(page.locator('#reactorHint')).toBeVisible();await expect(page.locator('#reactorHint h2')).toHaveText('Definition clue');const clue=await page.locator('#hintText').textContent();const words=await page.locator('#wordBank button.playable').allTextContents();expect(await page.evaluate(({clue,words})=>[...RegularVocabulary,...CipherVocabulary].some(e=>e.definition===clue&&words.includes(e.word)),{clue,words})).toBeTruthy();await expect(page.locator('#reactorWord')).toHaveValue('myguess');await expect(page.locator('#placement')).toHaveText(position);await expect(page.locator('#board .selected')).toHaveAttribute('aria-label',selected);await expect(page.locator('#board .preview')).toHaveCount(0);await expect(page.locator('#reactorDefinition')).toBeHidden();await expect(page.locator('#playerScore')).toHaveText('0');await page.locator('#hint').click();await expect(page.locator('#hintText')).toHaveText(clue);
 await page.locator('#wordBank button.playable').first().click();await page.locator('#playWord').click();await expect(page.locator('#reactorHint')).toBeHidden();await expect(page.locator('#round')).toHaveText('2 / 10');await page.locator('#hint').click();await expect(page.locator('#reactorHint')).toBeVisible();await page.locator('#exchange').click();await expect(page.locator('#reactorHint')).toBeHidden();await expect(page.locator('#round')).toHaveText('3 / 10');await page.locator('#hint').click();await page.locator('#reset').click();await expect(page.locator('#reactorHint')).toBeHidden();await expect(page.locator('#hintText')).toBeEmpty();
});

test('Wordfall defaults to regular words and allows switching back from TEKS',async({page})=>{
 await page.goto('/games/wordfall-reactor/');await expect(page.locator('#subject')).toHaveValue('general');await expect(page.locator('#vocabBand')).toBeDisabled();await expect(page.locator('#bankHeading')).toHaveText('Everyday word bank');await expect(page.locator('#wordBank')).toContainText('apple');await expect(page.locator('#wordBank')).not.toContainText('polynomial');await page.locator('#hint').click();const clue=await page.locator('#hintText').textContent();expect(await page.evaluate(clue=>RegularVocabulary.some(e=>e.definition===clue),clue)).toBeTruthy();await expect(page.locator('#reactorWord')).toHaveValue('');
 await page.locator('#subject').selectOption('math');await expect(page.locator('#vocabBand')).toBeEnabled();await expect(page.locator('#bankHeading')).toHaveText('TEKS word bank');await expect(page.locator('#wordBank')).toContainText('polynomial');await expect(page.locator('#wordBank')).not.toContainText('apple');await expect(page.locator('#reactorHint')).toBeHidden();await page.locator('#hint').click();const teksClue=await page.locator('#hintText').textContent();expect(await page.evaluate(clue=>CipherVocabulary.some(e=>e.subject==='math'&&e.definition===clue),teksClue)).toBeTruthy();await page.locator('#wordBank button.playable').first().click();await expect(page.locator('#definitionSource')).toHaveAttribute('href',/ch111/);await page.locator('#subject').selectOption('general');await expect(page.locator('#wordBank')).toContainText('apple');await expect(page.locator('#reactorHint')).toBeHidden();
});
