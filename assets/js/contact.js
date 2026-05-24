/* DrawSplat contact / information request form.
   Posts to the same Apps Script Web App used by the rest of the site.
   The Web App URL is stored once per browser in localStorage by an
   administrator. If it isn't configured locally, the form falls back
   to a clear "ask the school admin to set this up" message — the
   form will not silently fail. */
(function(){
  const STORAGE_KEY='drawsplat.googleScriptUrl';
  const form=document.getElementById('contactForm');
  if(!form) return;
  const status=document.getElementById('contactStatus');
  const submitBtn=document.getElementById('contactSubmit');
  const details=document.getElementById('contactDetails');
  const countEl=document.getElementById('contactCount');
  if(details && countEl){
    details.addEventListener('input',()=>countEl.textContent=String(details.value.length));
  }
  function setStatus(text,kind){
    if(!status) return;
    status.textContent=text;
    status.style.color = kind==='error' ? '#b91c1c' : (kind==='ok' ? '#16a34a' : '');
  }
  function getScriptUrl(){
    try{ return (localStorage.getItem(STORAGE_KEY)||'').trim(); }catch(e){ return ''; }
  }
  form.addEventListener('submit',async function(ev){
    ev.preventDefault();
    setStatus('');
    const payload={
      action:'contactRequest',
      name:document.getElementById('contactName').value.trim(),
      email:document.getElementById('contactEmail').value.trim(),
      organization:document.getElementById('contactOrg').value.trim(),
      role:document.getElementById('contactRole').value.trim(),
      topic:document.getElementById('contactTopic').value,
      details:details.value.trim(),
      sourcePage:location.href
    };
    if(!payload.name || !payload.email || !payload.topic || !payload.details){
      setStatus('Please fill in the required fields.','error'); return;
    }
    const url=getScriptUrl();
    if(!url){
      setStatus('This site has no backend configured in this browser. Ask the school’s administrator to paste the Apps Script Web App URL into Teacher Admin → Google Drive + Sheets. They only need to do it once.','error');
      return;
    }
    submitBtn.disabled=true;
    submitBtn.textContent='Sending…';
    try{
      const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data=await res.json();
      if(!data.ok) throw new Error(data.error||'Submission failed.');
      setStatus('Request submitted. Ticket '+data.id+' — we will reply at the email you provided.','ok');
      form.reset();
      if(countEl) countEl.textContent='0';
    }catch(err){
      setStatus(String(err.message||err),'error');
    }finally{
      submitBtn.disabled=false;
      submitBtn.textContent='Submit request';
    }
  });
})();
