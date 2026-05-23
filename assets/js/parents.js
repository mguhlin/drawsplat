/* Parents Request Center (Day 2.3/2.4 client). Submits the form to the
   DrawSplatTM Apps Script web app stored under
   localStorage['drawsplat.googleScriptUrl']. If no URL is configured locally
   (typical for parents visiting the public site) the form falls back to
   asking the parent to email the school directly. */
(function(){
  const STORAGE_KEY='drawsplat.googleScriptUrl';
  const form=document.getElementById('parentRequestForm');
  if(!form) return;
  const status=document.getElementById('parentRequestStatus');
  const submitBtn=document.getElementById('parentSubmitBtn');
  const details=document.getElementById('requestDetails');
  const detailsCount=document.getElementById('parentDetailsCount');
  if(details && detailsCount){
    details.addEventListener('input',()=>detailsCount.textContent=String(details.value.length));
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
      action:'parentRequest',
      parentName:document.getElementById('parentName').value.trim(),
      parentEmail:document.getElementById('parentEmail').value.trim(),
      studentName:document.getElementById('studentName').value.trim(),
      studentId:document.getElementById('studentId').value.trim(),
      requestType:document.getElementById('requestType').value,
      details:document.getElementById('requestDetails').value.trim()
    };
    if(!payload.parentName||!payload.parentEmail||!payload.studentName||!payload.requestType){
      setStatus('Please fill in the required fields.','error'); return;
    }
    const url=getScriptUrl();
    if(!url){
      setStatus('This site has no backend configured. Please email the school’s compliance contact directly with the details above. Your school’s administrator can configure the Apps Script Web App URL in the Teacher Admin page so this form delivers automatically.','error');
      return;
    }
    submitBtn.disabled=true;
    submitBtn.textContent='Sending…';
    try{
      const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data=await res.json();
      if(!data.ok) throw new Error(data.error||'Submission failed.');
      setStatus('Request submitted. Ticket '+data.id+' — the school will follow up by email.','ok');
      form.reset();
      if(detailsCount) detailsCount.textContent='0';
    }catch(err){
      setStatus(String(err.message||err),'error');
    }finally{
      submitBtn.disabled=false;
      submitBtn.textContent='Submit request';
    }
  });
})();
