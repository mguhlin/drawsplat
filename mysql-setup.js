(function(){
  const STORAGE_MODE_KEY='drawsplat.storageMode';
  const FOLDER_ENDPOINT_KEY='drawsplat.folderEndpoint';
  const $=id=>document.getElementById(id);
  const endpoint=$('mysqlEndpoint');
  const status=$('mysqlWizardStatus');
  const envOutput=$('mysqlEnvOutput');

  function setStatus(msg,cls=''){
    if(!status) return;
    status.textContent=msg;
    status.className='hint '+cls;
  }

  function endpointValue(){
    return (endpoint?.value||'').trim().replace(/\/+$/,'');
  }

  function loadSettings(){
    try{
      const saved=localStorage.getItem(FOLDER_ENDPOINT_KEY)||'';
      if(endpoint) endpoint.value=saved;
    }catch(_){}
    generateEnv();
  }

  function saveEndpoint(){
    const url=endpointValue();
    if(!url) return setStatus('Enter the backend API endpoint first.','danger');
    try{
      localStorage.setItem(STORAGE_MODE_KEY,'mysql');
      localStorage.setItem(FOLDER_ENDPOINT_KEY,url);
      setStatus('MySQL backend endpoint saved. Storage mode is now MySQL.','success');
    }catch(err){
      setStatus('Could not save endpoint: '+err.message,'danger');
    }
  }

  async function testEndpoint(){
    const url=endpointValue();
    if(!url) return setStatus('Enter the backend API endpoint first.','danger');
    setStatus('Testing MySQL backend endpoint...');
    try{
      const res=await fetch(url+'/health',{method:'GET'});
      const out=await res.json();
      if(res.ok&&out&&out.ok) setStatus('Endpoint works. Backend responded with '+(out.provider||'mysql')+'.','success');
      else setStatus((out&&out.error)||'Endpoint responded, but not with ok=true.','danger');
    }catch(err){
      setStatus('Endpoint test failed: '+err.message,'danger');
    }
  }

  function value(id,fallback=''){
    const el=$(id);
    return (el?.value||fallback).trim();
  }

  function generateEnv(){
    const host=value('mysqlHost','127.0.0.1')||'127.0.0.1';
    const port=value('mysqlPort','3306')||'3306';
    const database=value('mysqlDatabase','drawsplat')||'drawsplat';
    const user=value('mysqlUser','drawsplat_app')||'drawsplat_app';
    const password=value('mysqlPassword','CHANGE_ME')||'CHANGE_ME';
    const ssl=value('mysqlSsl','false')||'false';
    const endpointPath=new URL(endpointValue()||'http://localhost:8787/api/drawsplat/mysql').pathname.replace(/\/+$/,'')||'/api/drawsplat/mysql';
    if(envOutput){
      envOutput.value=[
        'PORT=8787',
        'API_BASE_PATH='+endpointPath,
        'MYSQL_HOST='+host,
        'MYSQL_PORT='+port,
        'MYSQL_DATABASE='+database,
        'MYSQL_USER='+user,
        'MYSQL_PASSWORD='+password,
        'MYSQL_SSL='+ssl,
        'SESSION_TTL_HOURS=24',
        'CORS_ORIGIN=http://localhost:8000'
      ].join('\n');
    }
  }

  function copyEnv(){
    const text=envOutput?.value||'';
    if(!text) return;
    if(navigator.clipboard?.writeText){
      navigator.clipboard.writeText(text).then(()=>setStatus('.env template copied.','success')).catch(()=>window.prompt('Copy .env template',text));
    }else{
      window.prompt('Copy .env template',text);
    }
  }

  $('saveMysqlEndpointBtn')?.addEventListener('click',saveEndpoint);
  $('testMysqlEndpointBtn')?.addEventListener('click',testEndpoint);
  $('generateEnvBtn')?.addEventListener('click',generateEnv);
  $('copyEnvBtn')?.addEventListener('click',copyEnv);
  ['mysqlEndpoint','mysqlHost','mysqlPort','mysqlDatabase','mysqlUser','mysqlPassword','mysqlSsl'].forEach(id=>{
    $(id)?.addEventListener('input',generateEnv);
    $(id)?.addEventListener('change',generateEnv);
  });
  loadSettings();
})();
