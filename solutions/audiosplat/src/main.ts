import './styles.css';
import { AudioEngine } from './audio/engine';
import { encodeWav, formatTime } from './audio/wav';
import { applyLanguage, languageOptions, setLanguage, t } from './i18n';
import { blobToDataUrl, clearWorkspace, dataUrlToBlob, loadWorkspace, saveWorkspace } from './persistence';
import { cloneProject, createProject, projectDuration, uid, validateProject, type AudioClip, type AudioProject, type AudioSourceRecord, type LanguageCode } from './types';

const appNode = document.querySelector<HTMLDivElement>('#app');
if (!appNode) throw new Error('Missing app root');
const app: HTMLDivElement = appNode;

let project = createProject();
let sources = new Map<string, AudioSourceRecord>();
let selectedClipId: string | null = null;
let selectedTrackId = project.tracks[0].id;
let playing = false;
let recorder: MediaRecorder | null = null;
let recordingStream: MediaStream | null = null;
let recordingChunks: Blob[] = [];
let meterFrame = 0;
let history: AudioProject[] = [];
let future: AudioProject[] = [];
let saveTimer = 0;
let workspaceTouched = false;
let recordingStartedAt = 0;
let recordingClock = 0;
let recordingInsertAt = 0;
const engine = new AudioEngine();
const MIC_STORAGE_KEY = 'audiosplat.microphone';

const icon = (symbol: string, label: string): string => `<span aria-hidden="true">${symbol}</span><span class="label" data-i18n="${label}">${t(label as never)}</span>`;

function shell(): void {
  app.innerHTML = `<div class="spectrum"></div><main class="app">
    <header class="site-header"><div class="title-block"><p class="eyebrow" data-i18n="tools"></p><h1 data-i18n="title"></h1><input class="project-title" id="project-title" value="${escapeHtml(project.metadata.title)}" aria-label="${t('projectTitle')}"><p class="tagline" data-i18n="tagline"></p></div>
      <div class="header-actions"><label class="visually-hidden" for="language" data-i18n="language"></label><select id="language" aria-label="Language">${languageOptions()}</select><button class="header-link" data-action="help" data-i18n="help"></button><a class="header-link primary" href="../../index.html" data-i18n="home"></a></div></header>
    <nav class="menu-bar" aria-label="Application menu">
      ${menu('file', [['new','newProject'],['open-project','openProject'],['download-project','saveProject'],['import','importAudio'],['export','exportWav']])}
      ${menu('edit', [['undo','undo'],['redo','redo'],['split','split'],['duplicate','duplicate'],['delete-clip','delete']])}
      ${menu('tracks', [['add-track','addTrack']])}
      ${menu('clip', [['split','split'],['trim-start','trimStart'],['trim-end','trimEnd'],['duplicate','duplicate'],['delete-clip','delete']])}
      ${menu('view', [['zoom-in','zoomIn'],['zoom-out','zoomOut']])}
    </nav>
    <section class="transport" aria-label="Transport controls">
      <button class="btn record" data-action="record" data-i18n-aria="record" aria-label="${t('record')}">${icon('●','record')}</button><button class="btn" data-action="pause-record" data-i18n-aria="pause" aria-label="${t('pause')}" disabled>${icon('❚❚','pause')}</button><button class="btn" data-action="play" data-i18n-aria="play" aria-label="${t('play')}">${icon('▶','play')}</button><button class="btn icon" data-action="stop" title="${t('stop')}">■<span class="visually-hidden" data-i18n="stop"></span></button><button class="btn icon" data-action="start" title="${t('start')}">|◀<span class="visually-hidden" data-i18n="start"></span></button>
      <span class="transport-time" id="time">0:00.00</span><div class="meter" role="meter" aria-label="Input level" aria-valuemin="0" aria-valuemax="100"><div class="meter-fill" id="meter"></div></div><label class="visually-hidden" for="mic-input" data-i18n="microphoneInput"></label><select class="mic-input" id="mic-input" aria-label="${t('microphoneInput')}"><option value="">${t('defaultMicrophone')}</option></select>
      <button class="btn icon" data-action="undo" title="${t('undo')}">↶</button><button class="btn icon" data-action="redo" title="${t('redo')}">↷</button>
      <button class="btn" data-action="import" data-i18n="importAudio"></button><button class="btn" data-action="add-track" data-i18n="addTrack"></button><button class="btn" data-action="split" data-i18n="split"></button><button class="btn" data-action="duplicate" data-i18n="duplicate"></button><button class="btn" data-action="delete-clip" data-i18n="delete"></button><button class="btn primary" data-action="export" data-i18n="exportWav"></button>
      <div class="zoom"><button class="btn icon" data-action="zoom-out" aria-label="${t('zoomOut')}">−</button><output id="zoom">${project.view.zoom}px/s</output><button class="btn icon" data-action="zoom-in" aria-label="${t('zoomIn')}">+</button></div>
    </section>
    <section class="workspace" id="workspace"></section>
    <footer class="statusbar"><span><span data-i18n="time"></span>: <strong id="status-time">0:00.00</strong></span><span class="optional"><span data-i18n="duration"></span>: <strong id="duration">0:00.00</strong></span><span class="optional"><span data-i18n="sampleRate"></span>: <strong>${project.metadata.sampleRate / 1000} kHz</strong></span><span><span data-i18n="autosave"></span>: <strong id="save-state" data-i18n="saved"></strong></span><span class="status-message" id="status" aria-live="polite" data-i18n="ready"></span></footer>
  </main><input class="visually-hidden" id="audio-input" type="file" accept="audio/*" multiple><input class="visually-hidden" id="project-input" type="file" accept=".json,.audiosplat.json,application/json"><div class="toast" id="toast" role="status" aria-live="polite"></div>`;
  applyLanguage();
  bindShell();
  renderWorkspace();
}

function menu(label: string, items: string[][]): string {
  return `<details class="menu"><summary data-i18n="${label}">${t(label as never)}</summary><div class="menu-panel">${items.map(([action,key])=>`<button data-action="${action}" data-i18n="${key}">${t(key as never)}</button>`).join('')}</div></details>`;
}

function bindShell(): void {
  document.querySelector('#language')?.addEventListener('change', (event) => setLanguage((event.target as HTMLSelectElement).value as LanguageCode));
  document.querySelector<HTMLInputElement>('#project-title')?.addEventListener('change', (event) => commit(() => project.metadata.title = (event.target as HTMLInputElement).value.trim() || t('untitled')));
  document.addEventListener('click', handleAction);
  document.querySelector<HTMLInputElement>('#audio-input')?.addEventListener('change', (event) => void importFiles(Array.from((event.target as HTMLInputElement).files ?? [])));
  document.querySelector<HTMLInputElement>('#project-input')?.addEventListener('change', (event) => void openProject((event.target as HTMLInputElement).files?.[0]));
  window.addEventListener('audiosplat:language', () => { applyLanguage(); renderWorkspace(); setStatus(t('ready')); });
  window.addEventListener('keydown', handleShortcut);
  window.addEventListener('beforeunload', stopRecordingStream);
  document.querySelector<HTMLSelectElement>('#mic-input')?.addEventListener('change', (event) => { try { localStorage.setItem(MIC_STORAGE_KEY, (event.target as HTMLSelectElement).value); } catch { /* storage may be blocked */ } });
  navigator.mediaDevices?.addEventListener?.('devicechange', () => void refreshMicrophones());
  void refreshMicrophones();
}

async function handleAction(event: Event): Promise<void> {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action !== 'help') workspaceTouched = true;
  document.querySelectorAll<HTMLDetailsElement>('details.menu[open]').forEach((detail) => detail.open = false);
  if (action === 'new') newProject();
  else if (action === 'open-project') document.querySelector<HTMLInputElement>('#project-input')?.click();
  else if (action === 'download-project') await downloadProject();
  else if (action === 'import') document.querySelector<HTMLInputElement>('#audio-input')?.click();
  else if (action === 'export') await exportMix();
  else if (action === 'add-track') addTrack();
  else if (action === 'undo') undo(); else if (action === 'redo') redo();
  else if (action === 'split') splitClip(); else if (action === 'duplicate') duplicateClip(); else if (action === 'delete-clip') deleteClip();
  else if (action === 'trim-start') trimClip('start'); else if (action === 'trim-end') trimClip('end');
  else if (action === 'zoom-in') setZoom(project.view.zoom * 1.25); else if (action === 'zoom-out') setZoom(project.view.zoom / 1.25);
  else if (action === 'record') await requestRecording(); else if (action === 'pause-record') toggleRecordingPause();
  else if (action === 'play') await togglePlay(); else if (action === 'stop') stopAll(); else if (action === 'start') setPlayhead(0);
  else if (action === 'help') showDialog(t('help'), `<p>${t('helpBody')}</p><p><strong>${t('privacy')}:</strong> ${t('localOnly')}</p>`);
}

function handleShortcut(event: KeyboardEvent): void {
  if ((event.target as HTMLElement).matches('input,select,textarea,[contenteditable=true]')) return;
  const modifier = event.ctrlKey || event.metaKey;
  if (modifier && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
  else if (event.code === 'Space') { event.preventDefault(); void togglePlay(); }
  else if (event.key.toLowerCase() === 'r') { event.preventDefault(); void requestRecording(); }
  else if (event.key.toLowerCase() === 's') { event.preventDefault(); splitClip(); }
  else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); deleteClip(); }
  else if (event.key === 'Home') { event.preventDefault(); setPlayhead(0); }
  else if (event.key === '+' || event.key === '=') setZoom(project.view.zoom * 1.25);
  else if (event.key === '-') setZoom(project.view.zoom / 1.25);
}

function renderWorkspace(): void {
  const workspace = document.querySelector<HTMLElement>('#workspace'); if (!workspace) return;
  const hasClips = project.tracks.some((track) => track.clips.length);
  if (!hasClips) {
    workspace.innerHTML = `<div class="empty-state"><img class="empty-icon" src="./audiosplat-icon.svg" alt=""><h2 data-i18n="emptyTitle"></h2><p data-i18n="emptyBody"></p><div class="empty-actions"><button class="btn record" data-action="record" data-i18n="record"></button><button class="btn primary" data-action="import" data-i18n="importAudio"></button><button class="btn" data-action="open-project" data-i18n="openProject"></button></div><span class="privacy-pill">🔒 <span data-i18n="privacy"></span></span></div>`;
    applyLanguage(); updateStatus(); return;
  }
  const width = Math.max(workspace.clientWidth - 230, Math.ceil((projectDuration(project) + 10) * project.view.zoom));
  workspace.innerHTML = `<div class="timeline" style="width:${width + 230}px"><div class="ruler-row"><div class="ruler-label"></div><div class="ruler" data-ruler>${renderTicks(width)}</div></div>${project.tracks.map((track) => renderTrack(track.id, width)).join('')}<div class="playhead" style="left:${230 + project.view.playhead * project.view.zoom}px"></div></div>`;
  workspace.querySelector('[data-ruler]')?.addEventListener('pointerdown', seekFromPointer);
  project.tracks.forEach((track) => bindTrack(track.id));
  drawAllWaveforms(); applyLanguage(); updateStatus();
}

function renderTicks(width: number): string {
  const seconds = Math.ceil(width / project.view.zoom); const step = project.view.zoom < 45 ? 5 : project.view.zoom < 100 ? 2 : 1;
  let output = ''; for (let time = 0; time <= seconds; time += step) output += `<span class="tick" style="left:${time * project.view.zoom}px">${formatTime(time)}</span>`; return output;
}

function renderTrack(trackId: string, width: number): string {
  const track = project.tracks.find((item) => item.id === trackId)!;
  return `<div class="track-row" data-track="${track.id}"><aside class="track-head"><input data-track-name value="${escapeHtml(track.name)}" aria-label="${t('trackName')}"><div class="track-actions"><button data-mute aria-pressed="${track.muted}" title="${t('mute')}">M</button><button data-solo aria-pressed="${track.solo}" title="${t('solo')}">S</button><button data-delete-track class="danger" title="${t('delete')}">×</button></div><div class="track-sliders"><label data-i18n="volume"></label><input data-gain type="range" min="0" max="1.5" step="0.01" value="${track.gain}" aria-label="${t('volume')}"><label data-i18n="pan"></label><input data-pan type="range" min="-1" max="1" step="0.01" value="${track.pan}" aria-label="${t('pan')}"></div></aside><div class="track-lane" style="width:${width}px" data-lane>${track.clips.map(renderClip).join('')}</div></div>`;
}

function renderClip(clip: AudioClip): string {
  return `<button class="clip${clip.id === selectedClipId ? ' selected' : ''}" data-clip="${clip.id}" style="left:${clip.start * project.view.zoom}px;width:${Math.max(8,clip.duration * project.view.zoom)}px" aria-label="${escapeHtml(clip.name)}, ${formatTime(clip.start)}, ${formatTime(clip.duration)}"><span class="clip-label">${escapeHtml(clip.name)}</span><canvas></canvas></button>`;
}

function bindTrack(trackId: string): void {
  const row = document.querySelector<HTMLElement>(`[data-track="${trackId}"]`); const track = project.tracks.find((item)=>item.id===trackId); if (!row || !track) return;
  row.querySelector<HTMLInputElement>('[data-track-name]')?.addEventListener('change',(event)=>commit(()=>track.name=(event.target as HTMLInputElement).value || t('trackDefault')));
  row.querySelector('[data-mute]')?.addEventListener('click',()=>commit(()=>track.muted=!track.muted)); row.querySelector('[data-solo]')?.addEventListener('click',()=>commit(()=>track.solo=!track.solo));
  row.querySelector<HTMLInputElement>('[data-gain]')?.addEventListener('change',(event)=>commit(()=>track.gain=Number((event.target as HTMLInputElement).value)));
  row.querySelector<HTMLInputElement>('[data-pan]')?.addEventListener('change',(event)=>commit(()=>track.pan=Number((event.target as HTMLInputElement).value)));
  row.querySelector('[data-delete-track]')?.addEventListener('click',()=>{ if (confirm(t('confirmDeleteTrack'))) commit(()=>{project.tracks=project.tracks.filter((item)=>item.id!==trackId);if(project.tracks.length===0){const id=uid('track');project.tracks.push({id,name:`${t('trackDefault')} 1`,muted:false,solo:false,gain:1,pan:0,clips:[]});project.view.playhead=0;}selectedTrackId=project.tracks[0].id;selectedClipId=null;cleanupUnusedSources();}); });
  row.querySelectorAll<HTMLElement>('[data-clip]').forEach((node)=>{ node.addEventListener('click',(event)=>{event.stopPropagation();selectedClipId=node.dataset.clip??null;selectedTrackId=trackId;renderWorkspace();}); node.addEventListener('pointerdown',(event)=>startClipDrag(event,node,trackId)); });
  row.querySelector('[data-lane]')?.addEventListener('pointerdown',(event)=>{if((event.target as HTMLElement).closest('[data-clip]'))return;selectedTrackId=trackId;seekFromPointer(event);});
}

function startClipDrag(event: PointerEvent, node: HTMLElement, trackId: string): void {
  if (event.button !== 0) return; const clipId=node.dataset.clip; const track=project.tracks.find((item)=>item.id===trackId); const clip=track?.clips.find((item)=>item.id===clipId); if(!clip)return;
  selectedClipId=clip.id; selectedTrackId=trackId; const startX=event.clientX; const original=clip.start; let moved=false; node.setPointerCapture(event.pointerId);
  const move=(next:PointerEvent)=>{const delta=(next.clientX-startX)/project.view.zoom;if(Math.abs(delta)>0.02)moved=true;clip.start=Math.max(0,original+delta);node.style.left=`${clip.start*project.view.zoom}px`;};
  const up=()=>{node.removeEventListener('pointermove',move);node.removeEventListener('pointerup',up);if(moved){const finalStart=clip.start;clip.start=original;commit(()=>clip.start=finalStart);}else renderWorkspace();};
  node.addEventListener('pointermove',move);node.addEventListener('pointerup',up);
}

function seekFromPointer(event: Event): void { const pointer=event as PointerEvent; const target=(event.currentTarget as HTMLElement); const rect=target.getBoundingClientRect(); setPlayhead(Math.max(0,(pointer.clientX-rect.left)/project.view.zoom)); }

function setPlayhead(time: number): void { project.view.playhead=Math.min(Math.max(0,time),Math.max(projectDuration(project),time)); document.querySelectorAll('#time,#status-time').forEach((node)=>node.textContent=formatTime(project.view.playhead)); const playhead=document.querySelector<HTMLElement>('.playhead');if(playhead)playhead.style.left=`${230+project.view.playhead*project.view.zoom}px`; }

function drawAllWaveforms(): void {
  document.querySelectorAll<HTMLElement>('[data-clip]').forEach((node)=>{const found=findClip(node.dataset.clip??'');const canvas=node.querySelector('canvas');const buffer=found?engine.getBuffer(found.clip.sourceId):undefined;if(canvas&&buffer&&found)drawWaveform(canvas,buffer,found.clip);});
}

function drawWaveform(canvas: HTMLCanvasElement, buffer: AudioBuffer, clip: AudioClip): void {
  const rect=canvas.getBoundingClientRect();const width=Math.max(1,Math.floor(rect.width*devicePixelRatio));const height=Math.max(1,Math.floor(rect.height*devicePixelRatio));canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,width,height);ctx.strokeStyle='#6d28d9';ctx.lineWidth=Math.max(1,devicePixelRatio);ctx.beginPath();const data=buffer.getChannelData(0);const start=Math.floor(clip.sourceOffset*buffer.sampleRate);const length=Math.floor(clip.duration*buffer.sampleRate);const step=Math.max(1,Math.floor(length/width));for(let x=0;x<width;x+=1){let min=1,max=-1;for(let i=0;i<step;i+=1){const value=data[start+x*step+i]??0;min=Math.min(min,value);max=Math.max(max,value);}ctx.moveTo(x,(1+min)*height/2);ctx.lineTo(x,(1+max)*height/2);}ctx.stroke();
}

async function importFiles(files: File[]): Promise<void> { for(const file of files){try{await addBlob(file,file.name);}catch{toast(t('importFailed'),true);}} }
async function addBlob(blob: Blob,name: string,newRecordingTrack=false): Promise<AudioBuffer> { const context=await engine.ensureContext();const buffer=await context.decodeAudioData(await blob.arrayBuffer());const source:AudioSourceRecord={id:uid('source'),name,mimeType:blob.type||'audio/*',duration:buffer.duration,channels:buffer.numberOfChannels,sampleRate:buffer.sampleRate,blob};sources.set(source.id,source);engine.setBuffer(source.id,buffer);commit(()=>{let track=project.tracks.find((item)=>item.id===selectedTrackId)??project.tracks[0];if(newRecordingTrack&&project.tracks.some((item)=>item.clips.length>0)){const id=uid('track');track={id,name:`${t('trackDefault')} ${project.tracks.length+1}`,muted:false,solo:false,gain:1,pan:0,clips:[]};project.tracks.push(track);selectedTrackId=id;}else if(!track){const id=uid('track');track={id,name:`${t('trackDefault')} 1`,muted:false,solo:false,gain:1,pan:0,clips:[]};project.tracks.push(track);selectedTrackId=id;}track.clips.push({id:uid('clip'),sourceId:source.id,name,start:project.view.playhead,sourceOffset:0,duration:buffer.duration,gain:1,fadeIn:0,fadeOut:0});selectedClipId=track.clips.at(-1)!.id;});return buffer; }

function addTrack():void{commit(()=>{const id=uid('track');project.tracks.push({id,name:`${t('trackDefault')} ${project.tracks.length+1}`,muted:false,solo:false,gain:1,pan:0,clips:[]});selectedTrackId=id;});}
function findClip(id:string):{trackId:string;clip:AudioClip}|null{for(const track of project.tracks){const clip=track.clips.find((item)=>item.id===id);if(clip)return{trackId:track.id,clip};}return null;}
function splitClip():void{const found=selectedClipId?findClip(selectedClipId):null;if(!found){toast(t('noSelection'));return;}const at=project.view.playhead-found.clip.start;if(at<=0||at>=found.clip.duration){toast(t('noSelection'));return;}commit(()=>{const track=project.tracks.find((item)=>item.id===found.trackId)!;const index=track.clips.indexOf(found.clip);const right={...found.clip,id:uid('clip'),start:project.view.playhead,sourceOffset:found.clip.sourceOffset+at,duration:found.clip.duration-at,name:`${found.clip.name} 2`};found.clip.duration=at;track.clips.splice(index+1,0,right);selectedClipId=right.id;});}
function duplicateClip():void{const found=selectedClipId?findClip(selectedClipId):null;if(!found){toast(t('noSelection'));return;}commit(()=>{const track=project.tracks.find((item)=>item.id===found.trackId)!;const copy={...found.clip,id:uid('clip'),start:found.clip.start+found.clip.duration+.1,name:`${found.clip.name} copy`};track.clips.push(copy);selectedClipId=copy.id;});}
function deleteClip():void{const found=selectedClipId?findClip(selectedClipId):null;if(!found){toast(t('noSelection'));return;}commit(()=>{const track=project.tracks.find((item)=>item.id===found.trackId)!;track.clips=track.clips.filter((item)=>item.id!==found.clip.id);selectedClipId=null;});}
function trimClip(edge:'start'|'end'):void{const found=selectedClipId?findClip(selectedClipId):null;if(!found){toast(t('noSelection'));return;}const delta=.1;if(found.clip.duration<=delta)return;commit(()=>{if(edge==='start'){found.clip.start+=delta;found.clip.sourceOffset+=delta;}found.clip.duration-=delta;});}
function setZoom(value:number):void{project.view.zoom=Math.max(20,Math.min(400,Math.round(value)));renderWorkspace();}

function commit(change:()=>void):void{workspaceTouched=true;history.push(cloneProject(project));if(history.length>100)history.shift();future=[];change();project.updatedAt=new Date().toISOString();renderWorkspace();scheduleSave();}
function undo():void{const previous=history.pop();if(!previous)return;future.push(cloneProject(project));project=previous;renderWorkspace();scheduleSave();}
function redo():void{const next=future.pop();if(!next)return;history.push(cloneProject(project));project=next;renderWorkspace();scheduleSave();}
function scheduleSave():void{const state=document.querySelector('#save-state');if(state)state.textContent=t('saving');window.clearTimeout(saveTimer);saveTimer=window.setTimeout(()=>void saveWorkspace(project,[...sources.values()]).then(()=>{const node=document.querySelector('#save-state');if(node)node.textContent=t('saved');}).catch(()=>toast('Autosave failed',true)),350);}

async function togglePlay():Promise<void>{if(playing){stopAll();return;}const duration=projectDuration(project);if(duration<=0)return;if(project.view.playhead>=duration-.01)setPlayhead(0);try{const started=await engine.play(project,sources,project.view.playhead,(time)=>setPlayhead(time),()=>{playing=false;updateTransport();});if(!started)throw new Error('No playable clips');playing=true;updateTransport();}catch{playing=false;updateTransport();toast(t('playbackFailed'),true);}}
function stopAll():void{engine.stop();playing=false;if(recorder&&recorder.state!=='inactive')recorder.stop();updateTransport();}
function updateTransport():void{document.querySelector('[data-action="play"]')?.classList.toggle('primary',playing);}

async function requestRecording():Promise<void>{if(recorder&&recorder.state!=='inactive'){stopAll();return;}showDialog(t('microphone'),`<p>${t('micIntro')}</p><div class="dialog-actions"><button class="btn" data-dialog-close data-i18n="cancel">${t('cancel')}</button><button class="btn primary" id="allow-mic" data-i18n="allowMic">${t('allowMic')}</button></div>`);document.querySelector('#allow-mic')?.addEventListener('click',()=>{closeDialog();void startRecording();});}
async function startRecording():Promise<void>{try{if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){toast(t('micUnsupported'),true);return;}recordingInsertAt=project.view.playhead;const selected=document.querySelector<HTMLSelectElement>('#mic-input')?.value;recordingStream=await acquireMicrophone(selected);await refreshMicrophones(recordingStream);const supported=typeof MediaRecorder.isTypeSupported==='function';const mime=supported?['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/mp4','audio/webm'].find((type)=>MediaRecorder.isTypeSupported(type)):undefined;recorder=new MediaRecorder(recordingStream,mime?{mimeType:mime}:undefined);recordingChunks=[];recorder.ondataavailable=(event)=>{if(event.data.size>0)recordingChunks.push(event.data);};recorder.onerror=()=>{toast(t('recordingFailed'),true);stopRecordingStream();};recorder.onstop=()=>void finishRecording();recorder.start(250);recordingStartedAt=performance.now();startRecordingClock();startMeter(recordingStream);document.querySelector('[data-action="record"]')?.classList.add('active');const pause=document.querySelector<HTMLButtonElement>('[data-action="pause-record"]');if(pause)pause.disabled=false;setStatus(t('recording'));}catch(error){const denied=error instanceof DOMException&&(error.name==='NotAllowedError'||error.name==='SecurityError');toast(denied?t('permissionDenied'):t('micUnavailable'),true);stopRecordingStream();}}
function toggleRecordingPause():void{if(!recorder)return;if(recorder.state==='recording'){recorder.pause();setStatus(t('paused'));}else if(recorder.state==='paused'){recorder.resume();setStatus(t('recording'));}}
async function finishRecording():Promise<void>{const mimeType=recorder?.mimeType||recordingChunks[0]?.type||'audio/webm';const blob=new Blob(recordingChunks,{type:mimeType});stopRecordingStream();if(blob.size===0){toast(t('recordingFailed'),true);setStatus(t('ready'));return;}try{project.view.playhead=recordingInsertAt;const buffer=await addBlob(blob,`${t('recordingDefault')} ${new Date().toLocaleTimeString()}`,true);setPlayhead(recordingInsertAt);if(hasAudioSignal(buffer)){setStatus(t('recordingReady'));}else{toast(t('noSignal'),true);setStatus(t('noSignal'));}}catch{toast(t('recordingFailed'),true);setStatus(t('ready'));}}
function stopRecordingStream():void{cancelAnimationFrame(meterFrame);cancelAnimationFrame(recordingClock);recordingStream?.getTracks().forEach((track)=>track.stop());recordingStream=null;recorder=null;document.querySelector('[data-action="record"]')?.classList.remove('active');const pause=document.querySelector<HTMLButtonElement>('[data-action="pause-record"]');if(pause)pause.disabled=true;const meter=document.querySelector<HTMLElement>('#meter');if(meter)meter.style.width='0';}
function startRecordingClock():void{const tick=()=>{if(!recorder||recorder.state==='inactive')return;const elapsed=(performance.now()-recordingStartedAt)/1000;const time=document.querySelector('#time');if(time)time.textContent=formatTime(elapsed);recordingClock=requestAnimationFrame(tick);};tick();}
function startMeter(stream:MediaStream):void{void engine.ensureContext().then((context)=>{const input=context.createMediaStreamSource(stream);const analyser=context.createAnalyser();analyser.fftSize=512;input.connect(analyser);const values=new Uint8Array(analyser.fftSize);const tick=()=>{analyser.getByteTimeDomainData(values);let sum=0;for(const value of values){const normalized=(value-128)/128;sum+=normalized*normalized;}const level=Math.min(100,Math.sqrt(sum/values.length)*240);const fill=document.querySelector<HTMLElement>('#meter');if(fill)fill.style.width=`${level}%`;meterFrame=requestAnimationFrame(tick);};tick();});}
async function acquireMicrophone(deviceId?:string):Promise<MediaStream>{if(!deviceId)return navigator.mediaDevices.getUserMedia({audio:true});try{return await navigator.mediaDevices.getUserMedia({audio:{deviceId:{exact:deviceId}}});}catch(error){const stale=error instanceof DOMException&&(error.name==='OverconstrainedError'||error.name==='NotFoundError');if(!stale)throw error;try{localStorage.removeItem(MIC_STORAGE_KEY);}catch{/* storage may be blocked */}const select=document.querySelector<HTMLSelectElement>('#mic-input');if(select)select.value='';return navigator.mediaDevices.getUserMedia({audio:true});}}
async function refreshMicrophones(stream?:MediaStream):Promise<void>{const select=document.querySelector<HTMLSelectElement>('#mic-input');if(!select||!navigator.mediaDevices?.enumerateDevices)return;try{const devices=(await navigator.mediaDevices.enumerateDevices()).filter((device)=>device.kind==='audioinput');let saved='';try{saved=localStorage.getItem(MIC_STORAGE_KEY)??'';}catch{/* storage may be blocked */}const active=stream?.getAudioTracks()[0]?.getSettings().deviceId??saved;select.innerHTML=`<option value="">${escapeHtml(t('defaultMicrophone'))}</option>`+devices.map((device,index)=>`<option value="${escapeHtml(device.deviceId)}">${escapeHtml(device.label||`${t('microphone')} ${index+1}`)}</option>`).join('');if(active&&devices.some((device)=>device.deviceId===active))select.value=active;}catch{/* Firefox can hide devices until permission is granted */}}
function hasAudioSignal(buffer:AudioBuffer):boolean{let peak=0;for(let channel=0;channel<buffer.numberOfChannels;channel+=1){const data=buffer.getChannelData(channel);const stride=Math.max(1,Math.floor(data.length/100000));for(let index=0;index<data.length;index+=stride){peak=Math.max(peak,Math.abs(data[index]));if(peak>=.002)return true;}}return false;}

async function downloadProject():Promise<void>{const embedded=await Promise.all([...sources.values()].map(async(source)=>({...source,blob:undefined,dataUrl:source.blob?await blobToDataUrl(source.blob):null})));download(new Blob([JSON.stringify({project,sources:embedded},null,2)],{type:'application/json'}),`${safeName(project.metadata.title)}.audiosplat.json`);toast(t('projectSaved'));}
async function openProject(file?:File):Promise<void>{if(!file)return;try{if(file.size>750_000_000)throw new Error('Too large');const data=JSON.parse(await file.text()) as {project:unknown;sources:Array<AudioSourceRecord&{dataUrl?:string}>};if(!validateProject(data.project)||!Array.isArray(data.sources)||data.sources.length>1000)throw new Error('Invalid');const loaded=new Map<string,AudioSourceRecord>();for(const source of data.sources){if(!source.dataUrl||typeof source.id!=='string'||!Number.isFinite(source.duration)||source.duration<=0||source.dataUrl.length>800_000_000)throw new Error('Missing audio');const blob=await dataUrlToBlob(source.dataUrl);loaded.set(source.id,{...source,blob});}for(const track of data.project.tracks)for(const clip of track.clips){const source=loaded.get(clip.sourceId);if(!source||clip.sourceOffset+clip.duration>source.duration+.01)throw new Error('Bad clip bounds');}project=data.project;sources=loaded;history=[];future=[];selectedClipId=null;selectedTrackId=project.tracks[0]?.id??'';for(const source of sources.values())await engine.loadSource(source);syncProjectTitle();renderWorkspace();scheduleSave();}catch{toast(t('projectFailed'),true);}}
async function exportMix():Promise<void>{if(projectDuration(project)<=0)return;setStatus('Rendering WAV…');try{const buffer=await engine.render(project,sources);download(encodeWav(buffer),`${safeName(project.metadata.title)}.wav`);toast(t('exportDone'));}catch{toast('WAV export failed.',true);}setStatus(t('ready'));}
function download(blob:Blob,name:string):void{const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

function newProject():void{if(!confirm(t('confirmNew')))return;stopAll();void clearWorkspace();project=createProject();project.metadata.title=t('untitled');sources=new Map();history=[];future=[];selectedClipId=null;selectedTrackId=project.tracks[0].id;syncProjectTitle();renderWorkspace();scheduleSave();}
function showDialog(title:string,body:string):void{closeDialog();document.body.insertAdjacentHTML('beforeend',`<div class="dialog-backdrop" id="dialog-backdrop"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">${escapeHtml(title)}</h2>${body.includes('dialog-actions')?body:`${body}<div class="dialog-actions"><button class="btn primary" data-dialog-close>${t('close')}</button></div>`}</section></div>`);document.querySelectorAll('[data-dialog-close]').forEach((node)=>node.addEventListener('click',closeDialog));}
function closeDialog():void{document.querySelector('#dialog-backdrop')?.remove();}
function toast(message:string,error=false):void{const node=document.querySelector<HTMLElement>('#toast');if(!node)return;node.textContent=message;node.classList.toggle('error',error);node.classList.add('show');setTimeout(()=>node.classList.remove('show'),3200);}
function setStatus(message:string):void{const node=document.querySelector('#status');if(node)node.textContent=message;}
function updateStatus():void{const duration=document.querySelector('#duration');if(duration)duration.textContent=formatTime(projectDuration(project));document.querySelectorAll('#time,#status-time').forEach((node)=>node.textContent=formatTime(project.view.playhead));const zoom=document.querySelector('#zoom');if(zoom)zoom.textContent=`${project.view.zoom}px/s`;}
function syncProjectTitle():void{const input=document.querySelector<HTMLInputElement>('#project-title');if(input)input.value=project.metadata.title;}
function cleanupUnusedSources():void{const used=new Set(project.tracks.flatMap((track)=>track.clips.map((clip)=>clip.sourceId)));for(const id of sources.keys())if(!used.has(id)){sources.delete(id);engine.removeBuffer(id);}}
function safeName(value:string):string{return(value||'audiosplat-project').replace(/[\\/:*?"<>|]+/g,'-').trim();}
function escapeHtml(value:string):string{return value.replace(/[&<>'"]/g,(character)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]!));}

shell();
void loadWorkspace().then(async(stored)=>{if(workspaceTouched||!stored||!validateProject(stored.project))return;project=stored.project;sources=new Map(stored.sources.map((source)=>[source.id,source]));selectedTrackId=project.tracks[0]?.id??'';for(const source of sources.values()){try{await engine.loadSource(source);}catch{/* preserve metadata and let UI recover */}}if(workspaceTouched)return;syncProjectTitle();renderWorkspace();}).catch(()=>setStatus(t('ready')));
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => void navigator.serviceWorker.register('./sw.js'));
}
