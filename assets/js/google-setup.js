(function(){
  const root=document.getElementById('googleSetup');
  if(!root) return;
  const key='drawsplat.googleSetupStep';
  const $=id=>document.getElementById(id);
  function showStep(step,remember=true){
    step=Math.min(4,Math.max(1,Number(step)||1));
    root.querySelectorAll('[data-setup-panel]').forEach(el=>el.hidden=Number(el.dataset.setupPanel)!==step);
    root.querySelectorAll('[data-setup-step]').forEach(el=>{if(Number(el.dataset.setupStep)===step)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current')});
    $('setupProgress').textContent='Step '+step+' of 4';
    if(remember){try{if(!document.body.classList.contains('admin-viewer'))localStorage.setItem(key,String(step))}catch(_){};root.querySelector(`[data-setup-panel="${step}"] h3`).setAttribute('tabindex','-1');root.querySelector(`[data-setup-panel="${step}"] h3`).focus()}
  }
  root.querySelectorAll('[data-setup-step],[data-setup-next]').forEach(el=>el.addEventListener('click',()=>showStep(el.dataset.setupStep||el.dataset.setupNext)));
  try{showStep(localStorage.getItem('drawsplat.googleScriptUrl')?4:localStorage.getItem(key),false)}catch(_){showStep(1,false)}
  let script='';
  async function loadScript(){
    if(!script){const res=await fetch('../apps-script/Code.gs');if(!res.ok)throw new Error('Script unavailable');script=await res.text();$('setupScriptFallback').value=script}
    return script;
  }
  $('copySetupScriptBtn').addEventListener('click',async()=>{
    const status=$('copySetupScriptStatus');
    status.textContent='Loading the setup script…';
    try{
      const code=await loadScript();
      if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(code);
      status.textContent='Copied. Paste it into the Google script editor, replacing the starter text.';
    }catch(_){
      status.textContent=script?'Automatic copying is unavailable. Open “Copy button not working?” below and select the script.':'Could not load the script. Open the script link below, or try again.';
      if(script){$('setupScriptFallback').closest('details').open=true;$('setupScriptFallback').focus();$('setupScriptFallback').select()}
    }
  });
  $('setupScriptFallback').closest('details').addEventListener('toggle',()=>{if($('setupScriptFallback').closest('details').open)loadScript().catch(()=>{})});
  // Deployers may supply a verified, clean Sheet with the current bound script.
  // No placeholder or existing classroom file is exposed as a public template.
  fetch('../apps-script/setup-template.json').then(res=>res.ok?res.json():null).then(config=>{
    if(!config?.spreadsheetId||!/^[-\w]{20,}$/.test(config.spreadsheetId))return;
    $('setupTemplateLink').href='https://docs.google.com/spreadsheets/d/'+config.spreadsheetId+'/copy';
    $('setupTemplateRoute').hidden=false;$('setupManualRoute').hidden=true;
  }).catch(()=>{});
})();
