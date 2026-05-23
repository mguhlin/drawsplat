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
    const url=new URL('../app/whiteboard.html',location.href);
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

  /* --- Compliance: Activity Records viewer (Day 1.8) + Privacy Packet (3.6) - */
  const ADMIN_PASSCODE_KEY='drawsplat.complianceAdminPasscode';
  function getAdminPasscode(){
    const pc=(localStorage.getItem(ADMIN_PASSCODE_KEY)||'').trim();
    if(pc) return Promise.resolve(pc);
    const dialog=document.getElementById('adminPasscodeDialog');
    const form=document.getElementById('adminPasscodeForm');
    const input=document.getElementById('adminPasscodeInput');
    if(!dialog||!dialog.showModal||!form||!input){
      const fallback=(window.prompt('Enter the ADMIN_PASSCODE set in the Apps Script project (saved in this browser only). Note: this prompt is not masked.')||'').trim();
      if(fallback) localStorage.setItem(ADMIN_PASSCODE_KEY,fallback);
      return Promise.resolve(fallback);
    }
    input.value='';
    return new Promise(resolve=>{
      function onSubmit(ev){
        ev.preventDefault();
        const decision=(ev.submitter&&ev.submitter.value)||'cancel';
        const value=input.value.trim();
        dialog.close(decision);
        if(decision==='ok'&&value){
          localStorage.setItem(ADMIN_PASSCODE_KEY,value);
          resolve(value);
        }else{
          resolve('');
        }
        form.removeEventListener('submit',onSubmit);
        input.value='';
      }
      form.addEventListener('submit',onSubmit);
      dialog.showModal();
      try{ input.focus(); }catch(e){}
    });
  }
  function clearAdminPasscode(){ try{ localStorage.removeItem(ADMIN_PASSCODE_KEY); }catch(e){} }
  async function loadAuditEvents(){
    const url=cleanUrl();
    const target=document.getElementById('complianceAuditViewer');
    if(!target) return;
    if(!url){ target.textContent='Save a Web App URL above first.'; return; }
    const pc=await getAdminPasscode();
    if(!pc){ target.textContent='Admin passcode required.'; return; }
    target.textContent='Loading…';
    try{
      const params=new URLSearchParams({action:'auditList',passcode:pc,limit:'200'});
      const res=await fetch(url+'?'+params.toString());
      const data=await res.json();
      if(!data.ok) throw new Error(data.error||'Could not load Activity Records.');
      renderAuditTable(target,data.events||[]);
    }catch(err){ target.textContent=String(err.message||err); }
  }
  function renderAuditTable(host,events){
    if(!events.length){ host.textContent='No matching events.'; return; }
    const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const rows=events.map(e=>`<tr><td>${esc(e.timestamp)}</td><td>${esc(e.action)}</td><td>${esc(e.actor)}</td><td>${esc(e.actorRole)}</td><td>${esc(e.entityType)}</td><td>${esc(e.entityId)}</td></tr>`).join('');
    host.innerHTML=`<div class="compliance-table-wrap"><table class="compliance-table"><thead><tr><th>Timestamp</th><th>Action</th><th>Actor</th><th>Role</th><th>Entity</th><th>ID</th></tr></thead><tbody>${rows}</tbody></table></div><div class="admin-actions"><button id="downloadAuditCsvBtn" type="button">Download CSV</button><button id="refreshAuditBtn" type="button">Refresh</button></div>`;
    document.getElementById('refreshAuditBtn')?.addEventListener('click',loadAuditEvents);
    document.getElementById('downloadAuditCsvBtn')?.addEventListener('click',()=>downloadAuditCsv(events));
  }
  function downloadAuditCsv(events){
    const headers=['timestamp','action','actor','actorRole','entityType','entityId','before','after','userAgent'];
    const esc=v=>{const s=v==null?'':String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
    const lines=[headers.join(',')];
    events.forEach(e=>lines.push(headers.map(h=>esc(e[h])).join(',')));
    const blob=new Blob([lines.join('\n')],{type:'text/csv'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='drawsplat-activity-records-'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(a);a.click();a.remove();
  }
  async function downloadPrivacyPacket(){
    const status=document.getElementById('privacyPacketStatus');
    const url=cleanUrl();
    if(!url){ if(status) status.textContent='Save a Web App URL above first.'; return; }
    const pc=await getAdminPasscode();
    if(!pc){ if(status) status.textContent='Admin passcode required.'; return; }
    if(status) status.textContent='Generating packet…';
    try{
      const params=new URLSearchParams({action:'privacyPacket',passcode:pc,actor:'admin'});
      const fetchUrl=url+'?'+params.toString();
      console.log('[Privacy Packet] requesting', fetchUrl);
      const res=await fetch(fetchUrl);
      const text=await res.text();
      console.log('[Privacy Packet] response length', text.length, 'first 60 chars:', text.slice(0,60));
      let data;
      try{ data=JSON.parse(text); }catch(e){ throw new Error('Server did not return JSON. First 120 chars: '+text.slice(0,120)); }
      if(!data.ok) throw new Error(data.error||'Generation failed.');
      if(!data.contentBase64) throw new Error('Response missing contentBase64 field.');
      const filename=data.filename||('DrawSplat-District-Privacy-Packet-'+new Date().toISOString().slice(0,10)+'.zip');
      const bytes=Uint8Array.from(atob(data.contentBase64),c=>c.charCodeAt(0));
      console.log('[Privacy Packet] decoded bytes:', bytes.length, 'filename:', filename);
      const blob=new Blob([bytes],{type:'application/zip'});
      const blobUrl=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=blobUrl;
      a.download=filename;
      a.rel='noopener';
      a.style.display='none';
      document.body.appendChild(a);
      a.click();
      // Delay cleanup so the browser's download pipeline finishes.
      setTimeout(()=>{ try{ document.body.removeChild(a); URL.revokeObjectURL(blobUrl); }catch(e){} }, 4000);
      if(status){
        const note=document.createElement('span');
        note.textContent='Packet downloaded ('+bytes.length+' bytes, '+(data.auditRowsIncluded||0)+' audit rows, '+(data.parentRowsIncluded||0)+' parent requests). ';
        const fallback=document.createElement('a');
        fallback.href=blobUrl;
        fallback.download=filename;
        fallback.textContent='Click here if the download did not start.';
        status.textContent='';
        status.appendChild(note);
        status.appendChild(fallback);
      }
    }catch(err){
      console.error('[Privacy Packet] error', err);
      if(status) status.textContent=String(err.message||err);
    }
  }
  document.getElementById('complianceAudit')?.addEventListener('toggle',function(){ if(this.open) loadAuditEvents(); });
  document.getElementById('downloadPrivacyPacketBtn')?.addEventListener('click',downloadPrivacyPacket);

  /* --- Compliance: Safety Review boards + freeze (Day 1.6/1.9) ------------ */
  async function loadSafetyBoards(){
    const host=document.getElementById('safetyBoardsList');
    const url=cleanUrl();
    if(!host) return;
    if(!url){ host.textContent='Save a Web App URL above first.'; return; }
    const pc=await getAdminPasscode();
    if(!pc){ host.textContent='Admin passcode required.'; return; }
    host.textContent='Loading…';
    try{
      const params=new URLSearchParams({action:'boardList',passcode:pc,limit:'100'});
      const res=await fetch(url+'?'+params.toString());
      const data=await res.json();
      if(!data.ok) throw new Error(data.error||'Could not load boards.');
      renderSafetyBoards(host,data.boards||[],data.rooms||[]);
    }catch(err){ host.textContent=String(err.message||err); }
  }
  function renderSafetyBoards(host,boards,rooms){
    const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const rowFor=(item,kind)=>{
      const cls=item.frozen?' frozen':'';
      const status=item.frozen?'<span class="badge-freeze">Frozen</span> by '+esc(item.frozenBy||'')+' &middot; '+esc(item.frozenReason||'no reason'):'';
      const action=item.frozen?
        `<button type="button" data-kind="${kind}" data-id="${esc(item.id)}" data-act="unfreeze">Unfreeze</button>`:
        `<button type="button" data-kind="${kind}" data-id="${esc(item.id)}" data-act="freeze" class="primary">Freeze</button>`;
      return `<tr class="safety-row${cls}"><td><strong>${esc(item.title||item.id)}</strong>${kind==='board'&&item.className?' &middot; '+esc(item.className):''}<br><small style="color:var(--muted)">${kind}: ${esc(item.id)} &middot; updated ${esc(item.updatedAt||'')}</small>${item.frozen?'<div class="hint" style="color:#b91c1c;margin-top:4px">'+status+'</div>':''}</td><td style="text-align:right">${action}</td></tr>`;
    };
    if(!boards.length && !rooms.length){ host.textContent='No saved boards or rooms.'; return; }
    host.innerHTML='<div class="compliance-table-wrap"><table class="compliance-table"><thead><tr><th>Item</th><th style="text-align:right">Action</th></tr></thead><tbody>'+
      boards.map(b=>rowFor(b,'board')).join('')+
      rooms.map(r=>rowFor(r,'room')).join('')+
      '</tbody></table></div><div class="admin-actions"><button id="refreshSafetyBoardsBtn" type="button">Refresh</button></div>';
    document.getElementById('refreshSafetyBoardsBtn')?.addEventListener('click',loadSafetyBoards);
    host.querySelectorAll('button[data-act]').forEach(btn=>{
      btn.addEventListener('click',async()=>{
        const id=btn.dataset.id, kind=btn.dataset.kind, act=btn.dataset.act;
        let reason='';
        if(act==='freeze'){ reason=(window.prompt('Reason for freezing this '+kind+'?')||'').trim(); if(reason==='') return; }
        btn.disabled=true; btn.textContent='Working…';
        try{
          const url=cleanUrl(); const pc=await getAdminPasscode();
          const body=new URLSearchParams({action:kind==='room'?'freezeRoom':'freezeBoard',passcode:pc,actor:'admin',frozen:act==='freeze'?'true':'false',reason:reason});
          if(kind==='room') body.set('room',id); else body.set('boardId',id);
          const res=await fetch(url,{method:'POST',body});
          const data=await res.json();
          if(!data.ok) throw new Error(data.error||'Action failed.');
          await loadSafetyBoards();
        }catch(err){
          alert(err.message||err);
          btn.disabled=false; btn.textContent=act==='freeze'?'Freeze':'Unfreeze';
        }
      });
    });
  }
  document.getElementById('loadSafetyBoardsBtn')?.addEventListener('click',loadSafetyBoards);
  document.getElementById('filterSafetyAuditBtn')?.addEventListener('click',async()=>{
    document.getElementById('complianceAudit')?.setAttribute('open','');
    await loadAuditEvents();
  });

  loadSettings();
})();
