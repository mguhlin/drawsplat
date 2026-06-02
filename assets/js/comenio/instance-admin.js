(function(){
  const $=id=>document.getElementById(id);
  const slug=document.body.dataset.instanceSlug||location.pathname.split('/').filter(Boolean).slice(-2,-1)[0]||'instance';
  const state={config:null,setupToken:'',sessionToken:'',user:null};
  const storageKey='drawsplat.instanceAdmin.'+slug;
  const msg=(id,text,cls='')=>{const el=$(id);if(el){el.textContent=text;el.className='msg '+cls}};
  const clean=s=>String(s||'').trim();
  const configured=s=>clean(s)&&clean(s).indexOf('PASTE_')!==0;

  function registryUrl(){return clean(state.config&&state.config.instanceRegistryUrl)}
  function googleClientId(){return clean(state.config&&state.config.googleClientId)}
  function loadLocalSession(){
    try{
      const raw=localStorage.getItem(storageKey);
      if(raw)Object.assign(state,JSON.parse(raw));
    }catch(_){}
  }
  function saveLocalSession(){
    try{localStorage.setItem(storageKey,JSON.stringify({setupToken:state.setupToken,sessionToken:state.sessionToken,user:state.user}))}catch(_){}
  }
  function clearLocalSession(){
    state.setupToken='';state.sessionToken='';state.user=null;
    try{localStorage.removeItem(storageKey)}catch(_){}
    msg('googleMsg','Local instance admin session cleared.');
  }
  async function api(action,payload={},method='POST'){
    const url=registryUrl();
    if(!url)throw new Error('Instance registry URL is not configured in config.json.');
    const body={action,instanceId:state.config.instanceId||slug,...payload};
    const res=await fetch(url,{method,headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)});
    const out=await res.json();
    if(!out.ok)throw new Error(out.error||'Instance registry request failed.');
    return out;
  }
  function hydrate(cfg){
    state.config=cfg;
    $('storageProvider').value=cfg.storageProvider||'google-apps-script';
    $('googleScriptUrl').value=cfg.googleScriptUrl||'';
    $('mysqlApiBase').value=cfg.mysqlApiBase||'';
    $('defaultRoom').value=cfg.defaultRoom||((cfg.instanceId||slug||'instance')+'-classroom');
    msg('instanceStatus','Loaded '+(cfg.displayName||cfg.instanceId||slug)+' config.','ok');
    if(!registryUrl())msg('setupMsg','No instanceRegistryUrl is configured yet. The wizard can preview settings, but production login/config writes need the registry backend.','err');
    else msg('setupMsg','Registry configured. Enter the one-time setup password.');
    loadLocalSession();
    if(state.user)msg('googleMsg','Signed in locally as '+state.user.email+'.','ok');
    initGoogle();
  }
  function fillStorageForm(cfg){
    if(!cfg)return;
    if(cfg.storageProvider)$('storageProvider').value=cfg.storageProvider;
    if(cfg.googleScriptUrl!=null)$('googleScriptUrl').value=cfg.googleScriptUrl;
    if(cfg.mysqlApiBase!=null)$('mysqlApiBase').value=cfg.mysqlApiBase;
    if(cfg.defaultRoom!=null)$('defaultRoom').value=cfg.defaultRoom;
    Object.assign(state.config,cfg);
  }
  async function loadRegistryConfig(){
    if(!registryUrl()||!state.sessionToken)return;
    const out=await api('instanceConfigGet',{sessionToken:state.sessionToken});
    fillStorageForm(out.config);
  }
  async function verifySetup(){
    const password=clean($('setupPassword').value);
    if(!password)return msg('setupMsg','Enter the one-time setup password.','err');
    try{
      const out=await api('instanceBootstrap',{setupPassword:password});
      state.setupToken=out.setupToken||'';
      saveLocalSession();
      msg('setupMsg','Setup password verified. Now bind the Google admin account.','ok');
    }catch(err){msg('setupMsg',err.message,'err')}
  }
  function whenReady(check,cb,tries=60){
    if(check())return cb();
    if(tries<=0)return;
    setTimeout(()=>whenReady(check,cb,tries-1),120);
  }
  function initGoogle(){
    if(!configured(googleClientId())){
      msg('googleMsg','Google OAuth client ID is not configured in config.json.','err');
      return;
    }
    whenReady(()=>window.google&&google.accounts&&google.accounts.id,()=>{
      try{
        google.accounts.id.initialize({
          client_id:googleClientId(),
          callback:resp=>bindGoogle(resp.credential)
        });
        google.accounts.id.renderButton($('googleBindHost'),{theme:'outline',size:'large',shape:'pill',text:'continue_with',width:260});
      }catch(err){msg('googleMsg','Google sign-in init failed: '+err.message,'err')}
    });
  }
  async function bindGoogle(idToken){
    if(!idToken)return msg('googleMsg','Google did not return an ID token.','err');
    if(!state.setupToken&&!state.sessionToken)return msg('googleMsg','Verify the setup password before binding Google.','err');
    try{
      const out=await api('instanceGoogleBind',{idToken,setupToken:state.setupToken,sessionToken:state.sessionToken});
      state.sessionToken=out.sessionToken||state.sessionToken;
      state.user=out.user||null;
      state.setupToken='';
      saveLocalSession();
      msg('googleMsg','Google admin bound: '+(state.user&&state.user.email?state.user.email:'verified account')+'.','ok');
      try{await loadRegistryConfig();msg('storageMsg','Loaded saved registry settings.','ok')}catch(_){}
    }catch(err){msg('googleMsg',err.message,'err')}
  }
  function googlePrompt(){
    if(!window.google||!google.accounts||!google.accounts.id)return msg('googleMsg','Google sign-in library is still loading.','err');
    try{google.accounts.id.prompt()}catch(err){msg('googleMsg',err.message,'err')}
  }
  async function saveConfig(){
    const cfg={
      storageProvider:$('storageProvider').value,
      googleScriptUrl:clean($('googleScriptUrl').value),
      mysqlApiBase:clean($('mysqlApiBase').value),
      defaultRoom:clean($('defaultRoom').value)
    };
    try{
      if(registryUrl()){
        if(!state.sessionToken)throw new Error('Sign in with the bound Google admin account before saving.');
        await api('instanceConfigSet',{sessionToken:state.sessionToken,config:cfg});
      }
      try{
        localStorage.setItem('drawsplat.instanceId',state.config.instanceId||slug);
        localStorage.setItem('drawsplat.storageMode',cfg.storageProvider==='mysql'?'mysql':'google');
        if(cfg.googleScriptUrl)localStorage.setItem('drawsplat.googleScriptUrl',cfg.googleScriptUrl);
        if(cfg.mysqlApiBase)localStorage.setItem('drawsplat.folderEndpoint',cfg.mysqlApiBase);
      }catch(_){}
      Object.assign(state.config,cfg);
      msg('storageMsg','Instance storage settings saved'+(registryUrl()?' to registry.':' locally for this browser preview.') ,'ok');
    }catch(err){msg('storageMsg',err.message,'err')}
  }
  async function testBackend(){
    const provider=$('storageProvider').value;
    const url=provider==='mysql'?clean($('mysqlApiBase').value):clean($('googleScriptUrl').value);
    if(!url)return msg('storageMsg','Enter a backend URL first.','err');
    try{
      const testUrl=provider==='mysql'?url.replace(/\/+$/,'')+'/health':url+(url.includes('?')?'&':'?')+'action=ping';
      const res=await fetch(testUrl);
      const out=await res.json();
      if(out&&out.ok)msg('storageMsg','Backend test passed.','ok');
      else msg('storageMsg',(out&&out.error)||'Backend responded without ok=true.','err');
    }catch(err){msg('storageMsg','Backend test failed: '+err.message,'err')}
  }
  function instanceLink(role){
    const url=new URL('whiteboard.html',location.href);
    const room=clean($('defaultRoom').value);
    if(room)url.searchParams.set('room',room);
    if(role)url.searchParams.set('role',role);
    return url.toString();
  }
  function copy(text,ok){
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(()=>msg('linksMsg',ok,'ok')).catch(()=>prompt(ok,text));
    else prompt(ok,text);
  }
  fetch('config.json',{cache:'no-cache'})
    .then(r=>r.ok?r.json():Promise.reject(new Error('Could not load config.json')))
    .then(hydrate)
    .catch(err=>msg('instanceStatus',err.message,'err'));
  $('verifySetupBtn').addEventListener('click',verifySetup);
  $('googlePromptBtn').addEventListener('click',googlePrompt);
  $('clearSessionBtn').addEventListener('click',clearLocalSession);
  $('saveConfigBtn').addEventListener('click',saveConfig);
  $('testBackendBtn').addEventListener('click',testBackend);
  $('copyTeacherLinkBtn').addEventListener('click',()=>copy(instanceLink('teacher'),'Teacher link copied.'));
  $('copyStudentLinkBtn').addEventListener('click',()=>copy(instanceLink('student'),'Student link copied.'));
})();
