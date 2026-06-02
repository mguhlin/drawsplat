(function(){
  const status=document.getElementById('status');
  const say=msg=>{if(status)status.textContent=msg};
  const configUrl='config.json';
  function cleanUrl(url){return String(url||'').trim()}
  function launch(cfg){
    const provider=cfg.storageProvider||'google-apps-script';
    const target=new URL('../../app/whiteboard.html',location.href);
    target.searchParams.set('instance',cfg.instanceId||'');
    if(cfg.defaultRoom)target.searchParams.set('room',cfg.defaultRoom);
    if(provider==='google-apps-script'&&cleanUrl(cfg.googleScriptUrl)){
      target.searchParams.set('script',cleanUrl(cfg.googleScriptUrl));
    }
    if(provider==='mysql'&&cleanUrl(cfg.mysqlApiBase)){
      target.searchParams.set('storage','mysql');
      target.searchParams.set('api',cleanUrl(cfg.mysqlApiBase));
    }
    try{
      localStorage.setItem('drawsplat.instanceId',cfg.instanceId||'');
      localStorage.setItem('drawsplat.instanceName',cfg.displayName||cfg.instanceId||'');
      localStorage.setItem('drawsplat.storageMode',provider==='mysql'?'mysql':'google');
      if(cleanUrl(cfg.googleScriptUrl))localStorage.setItem('drawsplat.googleScriptUrl',cleanUrl(cfg.googleScriptUrl));
      if(cleanUrl(cfg.mysqlApiBase))localStorage.setItem('drawsplat.folderEndpoint',cleanUrl(cfg.mysqlApiBase));
    }catch(_){}
    say('Opening '+(cfg.displayName||'instance')+' whiteboard...');
    location.replace(target.toString());
  }
  async function registryConfig(cfg){
    const registry=cleanUrl(cfg.instanceRegistryUrl);
    if(!registry)return cfg;
    try{
      const res=await fetch(registry,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'instancePublicConfig',instanceId:cfg.instanceId})});
      const out=await res.json();
      if(out&&out.ok&&out.config)return Object.assign({},cfg,out.config);
    }catch(_){}
    return cfg;
  }
  fetch(configUrl,{cache:'no-cache'})
    .then(r=>r.ok?r.json():Promise.reject(new Error('Could not load config.json')))
    .then(registryConfig)
    .then(launch)
    .catch(err=>say('Instance configuration error: '+err.message));
})();
