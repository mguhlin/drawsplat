/* Short, portable video notes. Camera access is requested only by a user click. */
window.DrawSplatVideoNotes=(()=>{
  const MAX_SECONDS=30,MAX_BYTES=5*1024*1024;
  const NS='http://www.w3.org/2000/svg',HTML='http://www.w3.org/1999/xhtml';
  const validSource=source=>typeof source==='string'&&source.length<MAX_BYTES*1.4+256&&/^data:video\/(webm|mp4)(;\s*codecs=[^;,]+)?;base64,[a-z0-9+/]+=*$/i.test(source);
  const validPoster=source=>typeof source==='string'&&/^data:image\/(jpeg|png);base64,[a-z0-9+/]+=*$/i.test(source);
  let api,dialog,stream,recorder,draft=null,token=0,timer,started=0,finishing=false,poster='',activePanel,activeBoardId,draftKey,draftSaved=false,draftWrite=0,lastDraftState=false,pendingObject=null;
  const players=new Map();
  const get=id=>document.getElementById(id);
  function message(text){get('videoNoteStatus').textContent=text}
  function stopTracks(){if(stream)stream.getTracks().forEach(track=>track.stop());stream=null;get('videoNotePreview').srcObject=null}
  function stopRecording(){if(recorder?.state==='recording'&&!poster)poster=posterFrame();clearInterval(timer);if(recorder?.state==='recording'){finishing=true;message('Preparing your clip for review…');recorder.stop()}stopTracks();refresh()}
  function close(){token++;stopRecording();if(dialog.open)dialog.close()}
  function refresh(){
    if(draft&&draftKey!==api.draftKey()){pendingObject=null;draft=null;draftWrite++;draftSaved=false;const preview=get('videoNotePreview');preview.pause();preview.removeAttribute('src');preview.load();get('videoNoteDraftStatus').textContent='';restoreDraft()}
    const recording=recorder?.state==='recording',busy=recording||finishing||!!stream;
    get('videoNoteRecord').disabled=busy||!!draft;get('videoNoteRecord').hidden=!!draft;get('videoNoteStop').disabled=!recording;get('videoNoteStop').hidden=!recording;
    const sameBoard=activeBoardId===api.getBoard().recordingBoardId,onPage=sameBoard&&activePanel===api.getPanel().id;get('videoNoteAdd').disabled=!draft||busy||!onPage;get('videoNoteReturnPage').hidden=!draft||onPage||!sameBoard||!api.getBoard().panels.some(p=>p.id===activePanel);if(draft&&!onPage)message('Your clip belongs on the page where you recorded it. Return to that page to add it.');get('videoNoteRetake').disabled=!draft||busy;
    get('videoNotePreview').controls=!!draft&&!busy;get('videoNoteMic').disabled=busy||!!draft;
    get('videoNoteName').disabled=busy;get('videoNoteCaption').disabled=busy;
    get('videoNoteWatch').hidden=!draft;get('videoNoteWatch').disabled=busy;syncWatchLabel();
    get('videoNoteRetake').hidden=!draft;get('videoNoteDiscard').hidden=!draft;get('videoNoteDiscard').disabled=busy;
    get('videoNoteCountdown').hidden=!recording;
    const stage=draft?'watch':'record';dialog.dataset.stage=stage;
    dialog.querySelectorAll('[data-video-step]').forEach(step=>{if(step.dataset.videoStep===stage)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current')});
    if(lastDraftState!==!!draft){lastDraftState=!!draft;api.draftChanged?.(lastDraftState)}
  }
  function syncWatchLabel(){get('videoNoteWatch').textContent=get('videoNotePreview').paused?'Watch clip':'Pause clip'}
  function posterFrame(){const video=get('videoNotePreview');if(!video.videoWidth)return '';try{const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;c.getContext('2d').drawImage(video,0,0);return c.toDataURL('image/jpeg',.75)}catch(_){return ''}}
  function readBlob(blob){return new Promise((resolve,reject)=>{const r=new FileReader;r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('The recording could not be read.'));r.readAsDataURL(blob)})}
  async function record(){
    if(!api.allowed())return message('Your teacher has not enabled video notes for this lesson.');
    if(finishing||recorder?.state==='recording'||stream)return;if(api.otherRecording?.())return message('Stop your audio recording before starting a video note.');
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)return message('This browser cannot record video. Try a current browser on a device with a camera.');
    window.DrawSplatRecordingSupport.pauseAll();const request=++token;activePanel=api.getPanel().id;activeBoardId=api.getBoard().recordingBoardId;draftKey=api.draftKey();api.persistBoard();finishing=true;refresh();get('videoNoteRecord').disabled=true;message('Opening your camera…');
    let granted;
    try{
      granted=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:480},height:{ideal:360},frameRate:{ideal:15,max:20},facingMode:'user'},audio:get('videoNoteMic').checked});
      if(request!==token||!dialog.open||!api.allowed()){granted.getTracks().forEach(t=>t.stop());return}
      stream=granted;draft=null;poster='';const preview=get('videoNotePreview');preview.removeAttribute('src');preview.srcObject=stream;preview.muted=true;preview.controls=false;await preview.play();
      if(request!==token||!dialog.open||!api.allowed()){stopTracks();return}
      const mime=[stream.getAudioTracks().length?'video/webm;codecs=vp8,opus':'video/webm;codecs=vp8','video/webm','video/mp4'].find(type=>MediaRecorder.isTypeSupported(type));
      recorder=new MediaRecorder(stream,{...(mime?{mimeType:mime}:{}),videoBitsPerSecond:350000,audioBitsPerSecond:48000});
      const chunks=[];let bytes=0,tooBig=false;const thisRecorder=recorder;started=Date.now();finishing=false;
      recorder.ondataavailable=e=>{if(e.data?.size){bytes+=e.data.size;chunks.push(e.data);if(bytes>MAX_BYTES){tooBig=true;stopRecording()}}};
      recorder.onerror=()=>{message('Recording stopped unexpectedly. Try recording again.');stopRecording()};
      recorder.onstop=async()=>{
        clearInterval(timer);if(!poster)poster=posterFrame();stopTracks();finishing=true;refresh();
        try{
          // Codec lists contain commas, which would break a data URL header.
          const blob=new Blob(chunks,{type:(thisRecorder.mimeType||mime||'video/webm').split(';')[0].trim()});
          if(tooBig||blob.size>MAX_BYTES)throw new Error('This clip is too large. Try a shorter recording (maximum 5 MB).');
          if(!blob.size)throw new Error('No video was recorded. Please try again.');
          const src=await readBlob(blob);if(!validSource(src))throw new Error('This recording format is not supported. Try another browser.');
          draft={src,poster,duration:Math.min(MAX_SECONDS,(Date.now()-started)/1000)};persistDraft();
          const preview=get('videoNotePreview');preview.pause();preview.srcObject=null;preview.src=src;preview.muted=false;preview.controls=true;
          message(dialog.open?'Your clip is ready. Watch it, then add it or try again.':'Choose Finish video to add or discard your unfinished clip.');
        }catch(error){draft=null;message(error.message)}finally{recorder=null;finishing=false;refresh()}
      };
      recorder.start(500);updateTime(0);message('Recording… 0 / 30 seconds');refresh();
      timer=setInterval(()=>{const seconds=Math.floor((Date.now()-started)/1000);updateTime(seconds);message('Recording… '+seconds+' / 30 seconds');if(!api.allowed()||seconds>=MAX_SECONDS){poster=posterFrame();stopRecording()}},250);
    }catch(error){recorder=null;finishing=false;if(granted&&granted!==stream)granted.getTracks().forEach(t=>t.stop());stopTracks();if(request===token)message(error.name==='NotAllowedError'?'Camera or microphone access was not allowed. Check browser permissions and try again.':error.name==='NotFoundError'?'No camera was found. Connect a camera and try again.':'Could not start the camera. '+(error.message||''));}
    finally{if(!recorder){finishing=false;refresh()}}
  }
  function updateTime(seconds){get('videoNoteProgress').value=Math.min(MAX_SECONDS,seconds);get('videoNoteTime').textContent=Math.max(0,MAX_SECONDS-seconds)+' seconds left'}
  function clearDraft(resetFields=false){
    pendingObject=null;draftWrite++;draftSaved=false;if(draftKey)window.DrawSplatRecordingSupport.drafts.remove(draftKey).catch(()=>api.status('Could not clear the saved video draft. Browser storage is unavailable.','danger'));get('videoNoteDraftStatus').textContent='';draft=null;const preview=get('videoNotePreview');preview.pause();preview.removeAttribute('src');preview.load();
    if(resetFields){get('videoNoteName').value='Video note';get('videoNoteCaption').value=''}
    refresh();
  }
  async function add(){
    if(!draft||finishing||recorder?.state==='recording'||!api.allowed())return;
    if(activeBoardId!==api.getBoard().recordingBoardId||draftKey!==api.draftKey()||activePanel!==api.getPanel().id){message('The page changed. Return to the page where you recorded this clip, or choose Try again.');return}
    const width=Math.min(300,Math.max(160,api.canvasWidth()-32));
    const object=pendingObject||api.makeObject('video',16,60,width,Math.round(width*.75)+100,{videoSrc:draft.src,videoPoster:draft.poster,videoDuration:draft.duration,videoName:get('videoNoteName').value.trim().slice(0,80)||'Video note',videoCaption:get('videoNoteCaption').value.trim().slice(0,500),fill:'none',stroke:'none',strokeWidth:0});
    pendingObject=object;Object.assign(object,{videoName:get('videoNoteName').value.trim().slice(0,80)||'Video note',videoCaption:get('videoNoteCaption').value.trim().slice(0,500)});const original=draft,key=draftKey;finishing=true;refresh();const saved=await api.addObject(object);finishing=false;if(!saved){message('The board could not be saved. Close this window and use File → Save File. Your video draft is still kept.');refresh();return}if(draft!==original||draftKey!==key){window.DrawSplatRecordingSupport.drafts.remove(key).catch(()=>{});return}clearDraft(true);close();api.status('Video note added. Play it on the board.','success');
  }
  function persistDraft(){
    if(!draft||!draftKey)return;
    const sequence=++draftWrite;draftSaved=false;get('videoNoteDraftStatus').textContent='Keeping your unfinished clip on this device…';
    window.DrawSplatRecordingSupport.drafts.put(draftKey,{draft,panelId:activePanel,boardId:activeBoardId,name:get('videoNoteName').value,caption:get('videoNoteCaption').value},api.draftExpiry()).then(()=>{if(sequence!==draftWrite||!draft)return;draftSaved=true;get('videoNoteDraftStatus').textContent='Unfinished clip kept on this device. You can return after a refresh.'}).catch(()=>{if(sequence!==draftWrite||!draft)return;get('videoNoteDraftStatus').textContent='This device could not keep your clip. Add it to your board before leaving.'})
  }
  async function restoreDraft(){
    if(!api.allowed()||draft||finishing)return;const key=api.draftKey();let saved;try{saved=await window.DrawSplatRecordingSupport.drafts.get(key)}catch(_){return}
    if(key!==api.draftKey()||!api.allowed()||draft||finishing||!saved||!validSource(saved.draft?.src)||!api.getBoard().panels.some(p=>p.id===saved.panelId))return;
    draft=saved.draft;activePanel=saved.panelId;activeBoardId=api.getBoard().recordingBoardId;draftKey=key;draftSaved=true;const preview=get('videoNotePreview');preview.src=draft.src;preview.muted=false;if(validPoster(draft.poster))preview.poster=draft.poster;get('videoNoteName').value=saved.name||'Video note';get('videoNoteCaption').value=saved.caption||'';get('videoNoteDraftStatus').textContent='Recovered your unfinished video. Watch, then add or discard it.';refresh()
  }
  function open(){if(!api.allowed())return api.status('Your teacher has not enabled video notes for this lesson.','danger');if(!dialog.open)dialog.showModal();message(draft?'Your clip is ready. Watch it, then add it to the board.':'Record up to 30 seconds. You can review it before adding it.');refresh()}
  function init(adapter){
    api=adapter;dialog=document.createElement('dialog');dialog.id='videoNoteDialog';dialog.className='learner-dialog';dialog.setAttribute('aria-labelledby','videoNoteTitle');
    dialog.innerHTML=`
      <div class="modal-head"><h2 id="videoNoteTitle">Record a video note</h2><button type="button" id="videoNoteClose" class="close">Close</button></div>
      <ol class="video-note-steps" aria-label="Video note steps"><li data-video-step="record">Record</li><li data-video-step="watch">Watch</li><li data-video-step="add">Add</li></ol>
      <p>Record a short clip. Watch it, then add it to your page.</p>
      <video id="videoNotePreview" playsinline muted aria-label="Camera preview or recorded clip"></video>
      <div id="videoNoteCountdown" hidden><progress id="videoNoteProgress" max="30" value="0" aria-label="Recording time"></progress><strong id="videoNoteTime">30 seconds left</strong></div>
      <label class="learner-check"><input type="checkbox" id="videoNoteMic" checked>Include my voice</label>
      <p id="videoNoteStatus" role="status" aria-live="polite"></p>
      <button type="button" id="videoNoteReturnPage" hidden>Return to my recording page</button><div class="learner-dialog-actions"><button type="button" id="videoNoteRecord">● Record</button><button type="button" id="videoNoteStop" disabled>■ Stop</button><button type="button" id="videoNoteWatch" hidden>Watch clip</button><button type="button" id="videoNoteRetake" disabled>Try again</button><button type="button" id="videoNoteDiscard" hidden>Discard clip</button><button type="button" id="videoNoteAdd" class="primary" disabled>Add to board</button></div>
      <details id="videoNoteDetails"><summary>Name &amp; describe (optional)</summary><label for="videoNoteName">Video title</label><input id="videoNoteName" maxlength="80" value="Video note"><label for="videoNoteCaption">Describe your video</label><textarea id="videoNoteCaption" maxlength="500" rows="2" placeholder="Tell others what your clip shows."></textarea></details>
      <p id="videoNoteDraftStatus" class="hint" role="status"></p><p class="hint">The camera turns off when you stop or close. Add your clip to save it.</p>
      <details class="video-note-help"><summary>About saving video</summary><p class="hint">Maximum 30 seconds and 5 MB. Stopped recordings can be recovered on this device after a refresh, until this browser session expires. Add your clip to keep it with your board. Saved board files keep the video; PNG and PDF exports show a still picture.</p></details>`;
    document.body.append(dialog);window.DrawSplatRecordingSupport.register(get('videoNotePreview'));get('videoNoteName').oninput=persistDraft;get('videoNoteCaption').oninput=persistDraft;get('videoNoteReturnPage').onclick=()=>{if(activeBoardId!==api.getBoard().recordingBoardId)return;api.returnToPanel(activePanel);message('Watch your clip, then add it to this page.');refresh()};get('videoNoteRecord').onclick=record;get('videoNoteStop').onclick=()=>{poster=posterFrame();stopRecording()};get('videoNoteAdd').onclick=add;get('videoNoteClose').onclick=close;
    get('videoNoteWatch').onclick=()=>{const preview=get('videoNotePreview');if(preview.paused)preview.play().catch(()=>message('This browser cannot play this clip. Try another browser.'));else preview.pause()};
    for(const event of ['play','pause','emptied','ended','loadedmetadata'])get('videoNotePreview').addEventListener(event,syncWatchLabel);
    get('videoNoteRetake').onclick=()=>{clearDraft();message('Ready for another try. Choose Record.');get('videoNoteRecord').focus()};
    get('videoNoteDiscard').onclick=()=>{clearDraft(true);message('Clip discarded. Choose Record when you are ready.');get('videoNoteRecord').focus()};
    dialog.addEventListener('cancel',e=>{e.preventDefault();close()});dialog.addEventListener('close',()=>{token++;stopRecording();get('videoNotePreview').pause()});
    window.addEventListener('pagehide',()=>{token++;stopRecording();players.forEach(p=>p.video.pause())});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){if(recorder?.state==='recording')poster=posterFrame();token++;stopRecording();players.forEach(p=>p.video.pause())}});
    return {open,refreshPermissions,createObject,beforeRender,afterRender,restoreDraft,busy:()=>finishing||!!stream||recorder?.state==='recording',needsProtection:()=>finishing&&!!recorder||!!stream||recorder?.state==='recording'||draft&&!draftSaved};
  }
  function refreshPermissions(){if(draft&&draftKey!==api.draftKey())refresh();if(!api.allowed()&&dialog.open){close();api.status('Video recording is off for this lesson.','danger')}}
  function createObject(object,box){
    const foreign=document.createElementNS(NS,'foreignObject');for(const [key,value] of Object.entries({x:box.x,y:box.y,width:Math.max(160,box.w),height:Math.max(180,box.h),opacity:object.opacity??1}))foreign.setAttribute(key,value);
    const card=document.createElementNS(HTML,'div');card.setAttribute('xmlns',HTML);card.className='video-note-card';card.dataset.videoNoteId=object.id;
    const title=document.createElementNS(HTML,'strong');title.textContent=object.videoName||'Video note';card.append(title);
    if(validSource(object.videoSrc)){
      let player=players.get(object.id);if(!player||player.source!==object.videoSrc){if(player){player.video.pause();window.DrawSplatRecordingSupport.unregister(player.video)}const video=document.createElementNS(HTML,'video');video.src=object.videoSrc;video.controls=true;video.playsInline=true;video.preload='metadata';window.DrawSplatRecordingSupport.register(video);video.setAttribute('aria-label',(object.videoName||'Video note')+' playback');player={video,source:object.videoSrc,resume:false};players.set(object.id,player)}
      if(validPoster(object.videoPoster))player.video.poster=object.videoPoster;card.append(player.video);
      const actions=document.createElementNS(HTML,'div');actions.className='video-note-actions';actions.setAttribute('role','group');actions.setAttribute('aria-label','Video playback controls');for(const action of ['Play','Pause','Stop']){const button=document.createElementNS(HTML,'button');button.type='button';button.textContent=action;button.onclick=()=>{if(action==='Play')player.video.play().catch(()=>api.status('This browser cannot play this video format. Try the browser that recorded it.','danger'));else{player.video.pause();if(action==='Stop')player.video.currentTime=0}};actions.append(button)}card.append(actions);
    }else{const empty=document.createElementNS(HTML,'p');empty.textContent='No playable video attached.';card.append(empty)}
    if(object.videoCaption){const caption=document.createElementNS(HTML,'p');caption.className='video-note-caption';caption.textContent=object.videoCaption;card.append(caption)}
    for(const event of ['pointerdown','pointerup','click','dblclick'])card.addEventListener(event,e=>{if(e.target.closest('video,button'))e.stopPropagation()});foreign.append(card);return foreign;
  }
  function beforeRender(){players.forEach(player=>{player.resume=!player.video.paused&&!player.video.ended})}
  function afterRender(){players.forEach((player,id)=>{const shown=document.querySelector('[data-video-note-id="'+CSS.escape(id)+'"]');if(!shown){player.video.pause();player.video.removeAttribute('src');player.video.load();window.DrawSplatRecordingSupport.unregister(player.video);players.delete(id)}else if(player.resume)player.video.play().catch(()=>{})})}
  return {init,validSource,validPoster,MAX_SECONDS,MAX_BYTES};
})();
