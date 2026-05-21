(function(){
  const SCRIPT_URL_STORAGE_KEY='drawsplat.googleScriptUrl';
  const STORAGE_MODE_KEY='drawsplat.storageMode';
  const SESSION_HOURS_KEY='drawsplat.sessionHours';
  const SESSION_EXPIRES_KEY='drawsplat.sessionExpiresAt';
  const FOLDER_ENDPOINT_KEY='drawsplat.folderEndpoint';
  const $=id=>document.getElementById(id);
  const scriptInput=$('adminScriptUrl');
  const status=$('adminStatus');
  const roomInput=$('adminRoom');
  const studentInput=$('adminStudentName');
  const storageMode=$('storageMode');
  const sessionHours=$('sessionHours');
  const folderEndpoint=$('folderEndpoint');
  const mysqlAdminEndpoint=$('mysqlAdminEndpoint');

  function setStatus(msg,cls=''){
    if(!status) return;
    status.textContent=msg;
    status.className='hint '+cls;
  }

  function cleanUrl(){
    return (scriptInput?.value||'').trim();
  }

  function loadSettings(){
    try{
      const saved=localStorage.getItem(SCRIPT_URL_STORAGE_KEY)||'';
      if(scriptInput) scriptInput.value=saved;
      if(storageMode) storageMode.value=localStorage.getItem(STORAGE_MODE_KEY)||'google';
      if(sessionHours) sessionHours.value=localStorage.getItem(SESSION_HOURS_KEY)||'24';
      if(folderEndpoint) folderEndpoint.value=localStorage.getItem(FOLDER_ENDPOINT_KEY)||'';
      if(mysqlAdminEndpoint) mysqlAdminEndpoint.value=localStorage.getItem(FOLDER_ENDPOINT_KEY)||'';
    }catch(_){}
    syncStorageModeUi();
  }

  function saveSettings(){
    const url=cleanUrl();
    try{
      if(url) localStorage.setItem(SCRIPT_URL_STORAGE_KEY,url);
      else localStorage.removeItem(SCRIPT_URL_STORAGE_KEY);
      setStatus(url?'Google Apps Script URL saved for this browser.':'Google Apps Script URL cleared.','success');
    }catch(err){
      setStatus('Could not save settings: '+err.message,'danger');
    }
  }

  async function testConnection(){
    const url=cleanUrl();
    if(!url) return setStatus('Paste and save a Google Apps Script URL first.','danger');
    setStatus('Testing connection...');
    try{
      const res=await fetch(url+(url.includes('?')?'&':'?')+'action=ping',{method:'GET'});
      const out=await res.json();
      if(out&&out.ok) setStatus('Connection works. Backend responded at '+(out.time||'unknown time')+'.','success');
      else setStatus((out&&out.error)||'Backend responded, but not with ok=true.','danger');
    }catch(err){
      setStatus('Connection failed: '+err.message,'danger');
    }
  }

  function sessionExpiryFromHours(){
    const hours=Math.max(1,parseInt(sessionHours?.value||'24',10));
    return String(Date.now()+hours*60*60*1000);
  }

  function syncStorageModeUi(){
    const mode=storageMode?.value||'google';
    if(sessionHours) sessionHours.disabled=mode!=='browser-session';
    if(folderEndpoint) folderEndpoint.disabled=!(mode==='standalone-folder'||mode==='mysql');
  }

  function saveStorageSettings(){
    const mode=storageMode?.value||'google';
    try{
      localStorage.setItem(STORAGE_MODE_KEY,mode);
      localStorage.setItem(SESSION_HOURS_KEY,sessionHours?.value||'24');
      localStorage.setItem(FOLDER_ENDPOINT_KEY,(folderEndpoint?.value||'').trim());
      if(mode==='browser-session') localStorage.setItem(SESSION_EXPIRES_KEY,sessionExpiryFromHours());
      else localStorage.removeItem(SESSION_EXPIRES_KEY);
      const msg=mode==='browser-session'
        ? 'Browser-only timed session saved. Current autosave will expire after '+(sessionHours?.value||'24')+' hour(s).'
        : mode==='mysql'
          ? 'MySQL backend mode saved. A server API endpoint is required before the board can use it.'
        : mode==='standalone-folder'
          ? 'Standalone folder mode saved. A backend endpoint is required before the board can use it.'
          : 'Google storage mode saved.';
      setStatus(msg,'success');
    }catch(err){
      setStatus('Could not save storage mode: '+err.message,'danger');
    }
    syncStorageModeUi();
  }

  function resetSessionTimer(){
    try{
      localStorage.setItem(STORAGE_MODE_KEY,'browser-session');
      if(storageMode) storageMode.value='browser-session';
      localStorage.setItem(SESSION_HOURS_KEY,sessionHours?.value||'24');
      localStorage.setItem(SESSION_EXPIRES_KEY,sessionExpiryFromHours());
      syncStorageModeUi();
      setStatus('Session timer reset. Browser autosave will expire after '+(sessionHours?.value||'24')+' hour(s).','success');
    }catch(err){
      setStatus('Could not reset session timer: '+err.message,'danger');
    }
  }

  function boardUrl(params={}){
    const url=new URL('whiteboard.html',location.href);
    Object.entries(params).forEach(([k,v])=>{if(v) url.searchParams.set(k,v)});
    return url.toString();
  }

  function copyText(text,msg){
    if(navigator.clipboard?.writeText){
      navigator.clipboard.writeText(text).then(()=>setStatus(msg,'success')).catch(()=>window.prompt(msg,text));
    }else{
      window.prompt(msg,text);
    }
  }

  function copyStudentLink(){
    const room=(roomInput?.value||'').trim();
    if(!room) return setStatus('Enter a room name first.','danger');
    const params={role:'student',room};
    const student=(studentInput?.value||'').trim();
    if(student) params.student=student;
    copyText(boardUrl(params),'Student link copied.');
  }

  function copyTeacherLink(){
    const room=(roomInput?.value||'').trim();
    copyText(boardUrl(room?{room}:{}),'Teacher board link copied.');
  }

  $('saveScriptUrlBtn')?.addEventListener('click',saveSettings);
  $('testScriptUrlBtn')?.addEventListener('click',testConnection);
  $('clearScriptUrlBtn')?.addEventListener('click',()=>{if(scriptInput) scriptInput.value=''; saveSettings()});
  $('copyStudentLinkBtn')?.addEventListener('click',copyStudentLink);
  $('copyTeacherLinkBtn')?.addEventListener('click',copyTeacherLink);
  $('saveStorageBtn')?.addEventListener('click',saveStorageSettings);
  $('resetSessionBtn')?.addEventListener('click',resetSessionTimer);
  storageMode?.addEventListener('change',syncStorageModeUi);
  loadSettings();
})();
