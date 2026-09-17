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
test('audio progress supports seeking and keeps playback position through redraws',async({page})=>{
  const b=fixture();b.panels[0].objects.push({id:'voice2',type:'audio',x:230,y:100,w:220,h:100,audioSrc:'data:audio/wav;base64,UklGRg==',opacity:1});await load(page,b);
  await page.evaluate(()=>{window.Audio=class extends EventTarget {constructor(){super();this.paused=true;this.currentTime=0;this.duration=12;window.testPlayer=this}play(){this.paused=false;this.dispatchEvent(new Event('play'));return Promise.resolve()}pause(){this.paused=true;this.dispatchEvent(new Event('pause'))}}});
  const note=page.locator('.audio-controls');await expect(note.locator('.audio-time')).toHaveText('0:00');await expect(note.getByRole('slider',{name:'Playback position'})).toBeDisabled();await note.getByRole('button',{name:'Play voice note',exact:true}).click();
  await note.getByRole('slider',{name:'Playback position'}).evaluate(el=>{el.value=7;el.dispatchEvent(new Event('input',{bubbles:true}))});await expect(note.locator('.audio-time')).toHaveText('0:07 / 0:12');expect(await page.evaluate(()=>window.testPlayer.currentTime)).toBe(7);
  await note.getByRole('button',{name:'Pause voice note',exact:true}).click();await click(page,'learnerHome');await expect(note.getByRole('slider',{name:'Playback position'})).toHaveValue('7');await expect(note).toContainText('Paused');
  await note.getByRole('button',{name:'Stop voice note',exact:true}).click();await expect(note.locator('.audio-time')).toHaveText('0:00 / 0:12');
});
test('empty notes record in place and protected teacher notes stay read-only',async({page})=>{
  const b=fixture({view:'beginner',tools:['select','audio']});b.assignmentMode=true;b.panels[0].objects.push({id:'voice3',type:'audio',x:230,y:120,w:220,h:100,layer:'student',audioSrc:'',opacity:1},{id:'protectedVoice',type:'audio',x:230,y:320,w:220,h:100,layer:'teacher',audioSrc:'',opacity:1});await load(page,b);await page.goto('/app/whiteboard.html?role=student');
  await page.evaluate(()=>{Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>({getTracks:()=>[{stop:()=>window.micStopped=true}]})}});window.MediaRecorder=class {constructor(){this.state='inactive';this.mimeType='audio/webm'}start(){this.state='recording'}stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['voice'],{type:this.mimeType})});this.onstop?.()}}});await page.clock.install();
  await expect(page.locator('.object[data-id=protectedVoice]').getByRole('button',{name:'Record my voice'})).toHaveCount(0);await page.locator('.object[data-id=voice3]').getByRole('button',{name:'Record my voice'}).click();await expect(page.locator('#learnerAudioDialog')).toBeVisible();await page.locator('#learnerRecordAudio').click();await expect(page.locator('#learnerAudioStatus')).toContainText('Recording.');await page.clock.fastForward(2200);await page.locator('#learnerRecordAudio').click();await expect(page.locator('#learnerAudioStatus')).toContainText('saved');await page.locator('#learnerAudioDialog .close').click();
  await expect(page.locator('.object[data-id=voice3] .audio-time')).toHaveText('0:00 / 0:02');const objects=(await saved(page)).panels[0].objects;expect(objects).toHaveLength(3);expect(objects.find(o=>o.id==='voice3').audioDuration).toBeGreaterThanOrEqual(2);expect(objects.find(o=>o.id==='protectedVoice').audioSrc).toBe('');
});
for(const width of [390,1280])test(`selected item cards support copying removing and undo at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});const b=fixture({view:'beginner',tools:['select','pen']});b.panels[0].objects[0].layer='student';await load(page,b);await page.goto('/app/whiteboard.html?role=student');
  await expect(page.locator('#learnerSelection')).toBeHidden();await click(page,'learnerObjects');await page.locator('#learnerObjectList button').first().click();await page.locator('#learnerSelection').click();await expect(page.locator('#learnerSelectionDialog')).toBeVisible();await expect(page.locator('#learnerSelectionCopy')).toContainText('Keep this item');await page.locator('#learnerSelectionCopy').click();expect((await saved(page)).panels[0].objects).toHaveLength(2);
  await page.locator('#learnerSelection').click();await page.locator('#learnerSelectionRemove').click();expect((await saved(page)).panels[0].objects).toHaveLength(1);await click(page,'learnerUndo');expect((await saved(page)).panels[0].objects).toHaveLength(2);
  await click(page,'learnerObjects');await page.locator('#learnerObjectList button').first().click();await page.locator('#learnerSelection').click();await page.locator('#learnerSelectionDone').click();await expect(page.locator('#learnerSelection')).toBeHidden();
});
test('selection movement moves visible pencil strokes and keyboard changes can be undone',async({page})=>{
  const b=fixture();b.panels[0].objects=[{id:'stroke1',type:'path',x:80,y:100,w:100,h:100,d:'M 80 100 L 180 200',stroke:'#111827',strokeWidth:4,fill:'none',opacity:1,clipBox:{x:80,y:100,w:100,h:100}}];await load(page,b);await click(page,'learnerObjects');await page.locator('#learnerObjectList button').first().click();await page.locator('#learnerSelection').click();await page.locator('#learnerNudgeStep').selectOption('10');await page.getByRole('button',{name:'Move right',exact:true}).click();let o=(await saved(page)).panels[0].objects[0];expect(o.x).toBe(90);expect(o.d).toBe('M 90 100 L 190 200');expect(o.clipBox.x).toBe(90);await page.locator('#learnerSelectionDialog .close').click();await click(page,'learnerUndo');expect((await saved(page)).panels[0].objects[0].d).toBe('M 80 100 L 180 200');
  await click(page,'learnerObjects');await page.locator('#learnerObjectList button').first().click();await page.keyboard.press('ArrowDown');expect((await saved(page)).panels[0].objects[0].d).toBe('M 80 101 L 180 201');await click(page,'learnerUndo');expect((await saved(page)).panels[0].objects[0].d).toBe('M 80 100 L 180 200');
});
test('protected selections disable editing and ordering preserves protected items',async({page})=>{
  const b=fixture();b.assignmentMode=true;b.panels[0].objects.push({id:'own',type:'rect',x:250,y:250,w:120,h:80,layer:'student',fill:'#00ff00',opacity:1});await load(page,b);await page.goto('/app/whiteboard.html?role=student');await click(page,'learnerObjects');await page.locator('#learnerObjectList button').first().click();await page.locator('#learnerSelection').click();await expect(page.locator('#learnerSelectionSummary')).toContainText('protected');for(const id of ['Copy','Remove','Front','Back'])await expect(page.locator('#learnerSelection'+id)).toBeDisabled();await page.locator('#learnerSelectionDialog .close').click();await click(page,'frontBtn');expect((await saved(page)).panels[0].objects.map(o=>o.id)).toEqual(['r1','own']);await expect(page.locator('#floatDeleteBtn')).toBeDisabled();
});
for(const width of [390,1280])test(`picture and page toolbar buttons have distinct icons and labels at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await expect(page.locator('#insertToolGroup>summary .tool-short-label')).toHaveText('ADD');await expect(page.locator('#backgroundToolGroup>summary .tool-short-label')).toHaveText('PAGE');await expect(page.locator('#insertToolGroup>summary img')).toHaveAttribute('src','../assets/icons/tools/add-pictures.svg');await expect(page.locator('#backgroundToolGroup>summary img')).toHaveAttribute('src','../assets/icons/tools/page-background.svg');await expect(page.locator('#funStampToolBtn')).toBeVisible();
});
test('stamp trays filter repeat place undo and save student-owned stamps',async({page})=>{
  const b=fixture({view:'beginner',tools:['select','image']});b.assignmentMode=true;await load(page,b);await page.goto('/app/whiteboard.html?role=student');await page.locator('#learnerStamps').click();await page.locator('#stampTheme').selectOption('Space');await page.locator('#stampSearch').fill('rocket');await expect(page.locator('#funStampGrid button')).toHaveCount(1);await page.getByRole('button',{name:'Rocket stamp',exact:true}).click();await expect(page.locator('body')).toHaveAttribute('data-tool','stamp');await expect(page.locator('#stampActiveBar')).toBeVisible();await page.locator('#stampSize').selectOption('120');
  await page.locator('#boardSvg').click({position:{x:140,y:160}});await page.locator('#boardSvg').click({position:{x:240,y:260}});let objects=(await saved(page)).panels[0].objects;expect(objects).toHaveLength(3);expect(objects[0].id).toBe('r1');for(const o of objects.slice(1)){expect(o.type).toBe('stamp');expect(o.stampLabel).toBe('Rocket');expect(o.stampPlain).toBe(true);expect(o.w).toBe(120);expect(o.layer).toBe('student');expect(o.studentOwner).toBeTruthy()}
  await click(page,'learnerUndo');expect((await saved(page)).panels[0].objects).toHaveLength(2);await page.locator('#boardSvg').focus();await page.keyboard.press('Enter');expect((await saved(page)).panels[0].objects).toHaveLength(3);await page.locator('#stampChoose').click();await page.locator('#stampSearch').fill('');await page.locator('#stampTheme').selectOption('Recent');await expect(page.getByRole('button',{name:'Rocket stamp',exact:true})).toBeVisible();await page.locator('#funStampDialog .close').click();await page.locator('#stampDone').click();await expect(page.locator('body')).toHaveAttribute('data-tool','select');await expect(page.locator('#stampActiveBar')).toBeHidden();await page.reload();expect((await saved(page)).panels[0].objects.filter(o=>o.type==='stamp')).toHaveLength(2);
});
test('stamp tray follows teacher image tool restrictions',async({page})=>{
  await load(page,fixture({view:'simple',tools:['select','pen']}));await page.goto('/app/whiteboard.html?role=student');await expect(page.locator('#learnerStamps')).toBeHidden();await expect(page.locator('#funStampToolBtn')).toBeHidden();await click(page,'learnerStamps');await expect(page.locator('#funStampDialog')).toBeHidden();
});
async function learnerPngBytes(page){const waiting=page.waitForEvent('download');await click(page,'exportBtn');const file=await waiting;return require('node:fs/promises').readFile(await file.path())}
test('stamp preview is temporary and never appears in downloads or saved work',async({page})=>{
  await load(page,fixture());await page.locator('#learnerStamps').click();await page.getByRole('button',{name:'Frog stamp',exact:true}).click();const baseline=await learnerPngBytes(page);const rect=await page.locator('#boardSvg').boundingBox();await page.mouse.move(rect.x+150,rect.y+200);await expect(page.locator('.stamp-preview')).toBeVisible();expect((await saved(page)).panels[0].objects).toHaveLength(1);const exported=await learnerPngBytes(page);expect(exported.equals(baseline)).toBe(true);
  await page.locator('#stampDone').evaluate(el=>el.click());await expect(page.locator('.stamp-preview')).toHaveCount(0);await expect(page.locator('body')).toHaveAttribute('data-tool','select');
});
test('turned and flipped stamps keep their appearance after saving and undo',async({page})=>{
  await load(page,fixture());await page.locator('#learnerStamps').click();await page.getByRole('button',{name:'Rocket stamp',exact:true}).click();await page.locator('#stampTurnRight').click();await page.locator('#stampFlip').click();await expect(page.locator('#stampFlip')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#stampActiveLabel')).toContainText('45°');await page.locator('#stampMiddle').click();let o=(await saved(page)).panels[0].objects.at(-1);expect(o.stampRotation).toBe(45);expect(o.stampFlipped).toBe(true);
  const glyph=page.locator('.object').last().locator('foreignObject>div>div').first();await expect(glyph).toHaveCSS('transform','matrix(-0.707107, -0.707107, -0.707107, 0.707107, 0, 0)');await page.reload();o=(await saved(page)).panels[0].objects.at(-1);expect(o.stampRotation).toBe(45);expect(o.stampFlipped).toBe(true);await expect(page.locator('.object').last().locator('foreignObject>div>div').first()).toHaveCSS('transform','matrix(-0.707107, -0.707107, -0.707107, 0.707107, 0, 0)');
  await page.locator('#learnerStamps').click();await page.getByRole('button',{name:'Dog stamp',exact:true}).click();await page.locator('#stampTurnLeft').click();await page.locator('#stampFlip').click();await page.locator('#stampSize').selectOption('120');await page.locator('#stampReset').click();await expect(page.locator('#stampFlip')).toHaveAttribute('aria-pressed','false');await expect(page.locator('#stampSize')).toHaveValue('80');await page.locator('#stampMiddle').click();expect((await saved(page)).panels[0].objects.at(-1).stampRotation).toBe(0);await click(page,'learnerUndo');expect((await saved(page)).panels[0].objects).toHaveLength(2);
});
