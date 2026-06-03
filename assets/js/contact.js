/* DrawSplat contact / information request form.
   Posts to the same Apps Script Web App used by the rest of the site when
   configured. If no endpoint is available, it opens a prefilled email draft
   so the public site still has a working contact path. */
(function(){
  const STORAGE_KEY='drawsplat.googleScriptUrl';
  const DEFAULT_CONTACT_SCRIPT_URL='PUT CONTACT APPS SCRIPT WEB APP URL HERE';
  const CONTACT_SCRIPT_URL_PLACEHOLDER='PUT CONTACT APPS SCRIPT WEB APP URL HERE';
  const CONTACT_EMAIL='mguhlin@gmail.com';
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
    let local='';
    try{ local=(localStorage.getItem(STORAGE_KEY)||'').trim(); }catch(e){}
    const fallback=(DEFAULT_CONTACT_SCRIPT_URL||'').trim();
    const url=local||fallback;
    return url===CONTACT_SCRIPT_URL_PLACEHOLDER?'':url;
  }
  function openEmailFallback(payload){
    const subject='DrawSplat contact request: '+payload.topic;
    const body=[
      'Name: '+payload.name,
      'Email: '+payload.email,
      'Organization: '+(payload.organization||''),
      'Role: '+(payload.role||''),
      'Topic: '+payload.topic,
      'Source page: '+payload.sourcePage,
      '',
      payload.details
    ].join('\n');
    location.href='mailto:'+CONTACT_EMAIL+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
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
      openEmailFallback(payload);
      setStatus('Opening your email app with this request addressed to '+CONTACT_EMAIL+'.','ok');
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
