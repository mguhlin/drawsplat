const {test,expect}=require('@playwright/test');
const fixture=(policy)=>({title:'Student work',active:0,mode:'teacher',studentWorkspace:policy,panels:[{id:'p1',name:'Panel 1',bg:'blank',objects:[{id:'r1',type:'rect',x:80,y:100,w:120,h:80,fill:'#ff0000',stroke:'#000000',strokeWidth:2,opacity:1,layer:'teacher'}]}]});
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{localStorage.setItem('drawsplat.welcomed','1');localStorage.setItem('drawsplat.consent.accepted','1');localStorage.setItem('drawsplat.startupTipDate',new Date().toISOString().slice(0,10))});
  await page.goto('/app/whiteboard.html');await expect(page.locator('#learnerToolbar')).toBeVisible();
});
async function load(page,b){await page.locator('#jsonInput').setInputFiles({name:'student.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(b))});await expect(page.locator('#statusToast')).toContainText('Board loaded')}
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('drawsplat.autosave')));
async function click(page,id){await page.locator('#'+id).evaluate(el=>el.click())}
test('teacher lesson choices travel in boards and student links',async({page})=>{
  await load(page,fixture());await click(page,'optionsBtn');
  await page.locator('.learner-teaching > summary').click();await page.locator('#learnerStartView').selectOption('beginner');await page.locator('#learnerPreset').selectOption('explain');await page.locator('#learnerSaveTools').click();
  const board=await saved(page);expect(board.studentWorkspace.tools).toContain('audio');expect(board.studentWorkspace.tools).not.toContain('graph');
  await page.locator('#closeOptions').click();
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.studentLink=text}});document.querySelector('#collabRoom').value='learner-test'});
  await click(page,'createStudentLinkBtn');const link=await page.evaluate(()=>window.studentLink);expect(link).toContain('learner=beginner');expect(link).toContain('tools=');
  await page.goto(link);await expect(page.locator('body')).toHaveAttribute('data-learner-view','beginner');
  await expect(page.locator('#learnerVoiceResponse')).not.toHaveAttribute('hidden','');
  await expect(page.locator('#learnerStarters')).toBeHidden();await expect(page.locator('#simpleTntBtn')).toBeHidden();
  await click(page,'openGraphDialogBtn'); // Direct invocation cannot change tool availability.
  await expect(page.locator('#graphDialog')).toBeHidden();await click(page,'optionsBtn');await expect(page.locator('.learner-teaching')).toBeHidden();
});
for(const width of [390,1280])test(`Beginner keeps drawing and help usable at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await load(page,fixture({view:'beginner',tools:['select','pen','eraser','text','image']}));await page.goto('/app/whiteboard.html?role=student');
  await expect(page.locator('#learnerPrimaryTools')).toBeVisible();await expect(page.locator('.sidebar')).toBeHidden();
  await page.locator('[data-learner-tool="pen"]').click();await page.locator('#learnerPenSize').selectOption('8');await page.locator('#learnerHelp').click();await expect(page.locator('#learnerHelpText')).toContainText('Pencil');await page.locator('#learnerTryTool').click();
  const box=await page.locator('#boardSvg').boundingBox();expect(box.width).toBeGreaterThan(width===390?300:700);expect(box.height).toBeGreaterThan(180);
  await page.mouse.move(box.x+60,box.y+70);await page.mouse.down();await page.mouse.move(box.x+120,box.y+110,{steps:4});await page.mouse.up();const path=(await saved(page)).panels[0].objects.find(o=>o.type==='path');expect(path).toBeTruthy();expect(path.strokeWidth).toBe(8);expect(path.layer).toBe('student');expect(path.studentOwner).toBeTruthy();
  await page.locator('#learnerUndo').click();expect((await saved(page)).panels[0].objects).toHaveLength(1);
  await page.screenshot({path:`.tmp/learner-beginner-${width}.png`});
});
test('clearing and reset keep checkpoints and support Undo',async({page})=>{
  await load(page,fixture());await click(page,'clearPanelBtn');await page.locator('#confirmDialogOk').click();expect((await saved(page)).panels[0].objects).toHaveLength(0);expect((await saved(page)).restorePoints[0].state.panels[0].objects).toHaveLength(1);
  await page.locator('#learnerUndoClear').click();expect((await saved(page)).panels[0].objects).toHaveLength(1);
  await click(page,'resetBoardBtn');await page.locator('#confirmDialogOk').click();expect((await saved(page)).title).toBe('');expect((await saved(page)).restorePoints).toHaveLength(1);
  await page.reload();expect((await saved(page)).restorePoints[0].state.title).toBe('Student work');
  await click(page,'restorePointBtn');await page.locator('#confirmDialogOk').click();expect((await saved(page)).title).toBe('Student work');
});
test('lesson starters add a page while preserving existing work',async({page})=>{
  await load(page,fixture());await page.locator('#learnerStarters').click();await page.locator('#learnerStarterList button').filter({hasText:'Show your math'}).click();
  const b=await saved(page);expect(b.panels).toHaveLength(2);expect(b.panels[0].objects).toHaveLength(1);expect(b.panels[1].name).toBe('Show your math');expect(b.panels[1].objects.some(o=>o.text==='Show your steps here')).toBe(true);
});
test('panning and keyboard selection do not change stored object positions',async({page})=>{
  await load(page,fixture());await page.locator('#learnerPan').click();const box=await page.locator('#boardSvg').boundingBox();await page.mouse.move(box.x+160,box.y+150);await page.mouse.down();await page.mouse.move(box.x+220,box.y+180,{steps:3});await page.mouse.up();await expect(page.locator('#boardSvg #viewport')).toHaveAttribute('transform',/translate\(60 30\)/);
  expect((await saved(page)).panels[0].objects[0].x).toBe(80);await page.locator('#learnerHome').click();await expect(page.locator('#boardSvg #viewport')).toHaveAttribute('transform',/translate\(0 0\)/);
  await page.locator('#learnerObjects').click();await page.locator('#learnerObjectList button').first().click();await page.keyboard.press('ArrowRight');expect((await saved(page)).panels[0].objects[0].x).toBe(81);
});
test('turn-in requires review, confirms receipt, and prevents duplicate sends',async({page})=>{
  let sends=0;await page.route('https://script.google.com/macros/s/learner-test/exec',async route=>{sends++;await new Promise(r=>setTimeout(r,350));await route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true})})});
  await page.goto('/app/whiteboard.html?role=student&script=https%3A%2F%2Fscript.google.com%2Fmacros%2Fs%2Flearner-test%2Fexec');await click(page,'learnerTurnIn');await expect(page.locator('#learnerSendWork')).toBeDisabled();await page.locator('#learnerStudentName').fill('Test Learner');await page.locator('#learnerCheckedWork').check();await click(page,'learnerSendWork');await click(page,'learnerSendWork');await expect(page.locator('#learnerTurnInStatus')).toContainText('Received!');expect(sends).toBe(1);await expect(page.locator('#learnerSendWork')).toBeDisabled();await expect(page.locator('#saveStateChip')).toContainText('Saved on this device');
});
test('turn-in failure preserves local work and permits retry without claiming receipt',async({page})=>{
  let fail=true;await page.route('https://script.google.com/macros/s/learner-test/exec',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(fail?{ok:false,error:'Offline'}:{ok:true})}));
  await load(page,fixture());await page.goto('/app/whiteboard.html?role=student&script=https%3A%2F%2Fscript.google.com%2Fmacros%2Fs%2Flearner-test%2Fexec');await click(page,'learnerTurnIn');await page.locator('#learnerStudentName').fill('Test Learner');await page.locator('#learnerCheckedWork').check();await page.locator('#learnerSendWork').click();await expect(page.locator('#learnerTurnInStatus')).toContainText('Receipt was not confirmed');expect((await saved(page)).title).toBe('Student work');await expect(page.locator('#learnerSendWork')).toBeEnabled();fail=false;await page.locator('#learnerSendWork').click();await expect(page.locator('#learnerTurnInStatus')).toContainText('Received!');
});
test('classroom acknowledgement does not claim newer edits are saved',async({page})=>{
  let release;const response=new Promise(resolve=>release=resolve);let sent=false;
  await page.route('https://script.google.com/macros/s/learner-test/exec',async route=>{sent=true;await response;await route.fulfill({contentType:'application/json',body:'{"ok":true}'})});
  await page.goto('/app/whiteboard.html?script=https%3A%2F%2Fscript.google.com%2Fmacros%2Fs%2Flearner-test%2Fexec');await load(page,fixture());await click(page,'saveDriveBtn');await expect.poll(()=>sent).toBe(true);
  await page.locator('#boardTitle').evaluate(el=>{el.value='New edits';el.dispatchEvent(new Event('input',{bubbles:true}))});release();await expect(page.locator('#classroomSaveChip')).toContainText('changes not sent');await expect(page.locator('#saveStateChip')).toContainText('Saved on this device');
});
test('voice responses save audio and release the microphone',async({page})=>{
  await page.reload();await load(page,fixture({view:'simple',tools:['select','audio']}));await page.goto('/app/whiteboard.html?role=student');
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>({getTracks:()=>[{stop:()=>window.micStopped=true}]})}});
    window.MediaRecorder=class {constructor(stream){this.stream=stream;this.state='inactive';this.mimeType='audio/webm'}start(){this.state='recording'}stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['voice'],{type:this.mimeType})});this.onstop?.()}};
  });
  await page.locator('#learnerResponse').click();await page.locator('#learnerVoiceResponse').click();await page.locator('#learnerRecordAudio').click();await expect(page.locator('#learnerAudioStatus')).toContainText('Recording.');await page.locator('#learnerRecordAudio').click();await expect(page.locator('#learnerAudioStatus')).toContainText('saved on this page');expect(await page.evaluate(()=>window.micStopped)).toBe(true);expect((await saved(page)).panels[0].objects.at(-1).audioSrc).toMatch(/^data:audio/);
});
test('voice permission errors are visible inside the response dialog',async({page})=>{
  await load(page,fixture({tools:['select','audio']}));await page.goto('/app/whiteboard.html?role=student');
  await page.evaluate(()=>{window.MediaRecorder=class {};Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{throw new DOMException('Microphone permission denied','NotAllowedError')}}})});
  await page.locator('#learnerResponse').click();await page.locator('#learnerVoiceResponse').click();await page.locator('#learnerRecordAudio').click();await expect(page.locator('#learnerAudioStatus')).toContainText('permission denied');await expect(page.locator('#learnerRecordAudio')).toHaveText('Record');
});
test('closing a voice dialog during permission request releases a late microphone grant',async({page})=>{
  await load(page,fixture({tools:['select','audio']}));await page.goto('/app/whiteboard.html?role=student');
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:()=>new Promise(resolve=>window.grantMic=()=>resolve({getTracks:()=>[{stop:()=>window.lateMicStopped=true}]}))}});
    window.MediaRecorder=class {constructor(){window.recorderStarted=true}start(){}};
  });
  await page.locator('#learnerResponse').click();await page.locator('#learnerVoiceResponse').click();await page.locator('#learnerRecordAudio').click();await page.locator('#learnerAudioDialog .close').click();await page.evaluate(()=>window.grantMic());await expect.poll(()=>page.evaluate(()=>window.lateMicStopped)).toBe(true);expect(await page.evaluate(()=>window.recorderStarted)).toBeUndefined();
});
test('turn-in timeout also covers a stalled image export and allows recovery',async({page})=>{
  let release;const delay=new Promise(resolve=>release=resolve);let sends=0;
  await page.route('**/late-picture.png',async route=>{await delay;await route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')})});
  await page.route('https://script.google.com/macros/s/learner-test/exec',async route=>{sends++;await route.fulfill({contentType:'application/json',body:'{"ok":true}'})});
  await page.goto('/app/whiteboard.html?role=student&script=https%3A%2F%2Fscript.google.com%2Fmacros%2Fs%2Flearner-test%2Fexec');
  const b=fixture();b.panels[0].objects.push({id:'image1',type:'image',x:250,y:80,w:90,h:90,src:new URL('/late-picture.png',page.url()).href,opacity:1});await load(page,b);await page.clock.install();await click(page,'learnerTurnIn');await page.locator('#learnerStudentName').fill('Test Learner');await page.locator('#learnerCheckedWork').check();await page.locator('#learnerSendWork').click();await expect(page.locator('#learnerTurnInStatus')).toContainText('Sending');await page.clock.fastForward(30001);await expect(page.locator('#learnerTurnInStatus')).toContainText('Receipt was not confirmed');await expect(page.locator('#learnerSendWork')).toBeEnabled();expect(sends).toBe(0);release();
});
test('closing an active voice recording keeps the answer and releases the microphone',async({page})=>{
  await load(page,fixture({tools:['select','audio']}));await page.goto('/app/whiteboard.html?role=student');
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>({getTracks:()=>[{stop:()=>window.micStopped=true}]})}});
    window.MediaRecorder=class {constructor(stream){this.stream=stream;this.state='inactive';this.mimeType='audio/webm'}start(){this.state='recording'}stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['answer'],{type:this.mimeType})});this.onstop?.()}};
  });
  await page.locator('#learnerResponse').click();await page.locator('#learnerVoiceResponse').click();await page.locator('#learnerRecordAudio').click();await expect(page.locator('#learnerAudioStatus')).toContainText('Recording.');await page.locator('#learnerAudioDialog .close').click();await expect.poll(async()=>!!(await saved(page)).panels[0].objects.at(-1).audioSrc).toBe(true);expect(await page.evaluate(()=>window.micStopped)).toBe(true);
});
test('recorded notes offer play pause and stop on the canvas without editing the board',async({page})=>{
  const b=fixture({view:'beginner',tools:['select','pen','eraser','audio']});b.panels[0].objects.push({id:'voice1',type:'audio',x:230,y:120,w:220,h:100,fill:'#eff6ff',opacity:1,layer:'student',audioSrc:'data:audio/wav;base64,UklGRg==',text:'My answer'});await load(page,b);await page.goto('/app/whiteboard.html?role=student');
  await page.evaluate(()=>{window.Audio=class extends EventTarget {constructor(src){super();this.src=src;this.paused=true;this.currentTime=0;window.testPlayer=this;window.playersCreated=(window.playersCreated||0)+1}play(){this.paused=false;this.dispatchEvent(new Event('play'));return Promise.resolve()}pause(){this.paused=true;this.dispatchEvent(new Event('pause'))}}});
  const controls=page.locator('.audio-controls');await expect(controls).toBeVisible();await expect(controls.getByRole('button',{name:'Pause voice note',exact:true})).toBeDisabled();
  await page.locator('[data-learner-tool=eraser]').click();await controls.getByRole('button',{name:'Play voice note',exact:true}).click();await expect(controls).toContainText('Playing');expect((await saved(page)).panels[0].objects).toHaveLength(2);
  await page.locator('#boardTitle').evaluate(el=>{el.value='Updated title';el.dispatchEvent(new Event('input',{bubbles:true}))});await click(page,'learnerHome');await expect(controls).toContainText('Playing');
  await controls.getByRole('button',{name:'Pause voice note',exact:true}).click();await expect(controls).toContainText('Paused');expect(await page.evaluate(()=>window.testPlayer.paused)).toBe(true);
  await page.evaluate(()=>window.testPlayer.currentTime=2);await controls.getByRole('button',{name:'Play voice note',exact:true}).click();expect(await page.evaluate(()=>window.playersCreated)).toBe(1);expect(await page.evaluate(()=>window.testPlayer.currentTime)).toBe(2);
  await controls.getByRole('button',{name:'Stop voice note',exact:true}).click();await expect(controls).toContainText('Ready to listen');expect(await page.evaluate(()=>window.testPlayer.currentTime)).toBe(0);
  await controls.getByRole('button',{name:'Play voice note',exact:true}).click();await page.evaluate(()=>window.testPlayer.dispatchEvent(new Event('ended')));await expect(controls).toContainText('Ready to listen');
});
