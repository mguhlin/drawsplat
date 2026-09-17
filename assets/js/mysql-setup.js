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

  async function saveEndpoint(){
    const button=$('saveMysqlEndpointBtn'),requestedEndpoint=endpointValue();button.disabled=true;
    try{
      setStatus('Testing your saving service…');
      await window.DrawSplatMySQL.test(requestedEndpoint);
      if(requestedEndpoint!==endpointValue())throw new Error('The API address changed. Test the new address before enabling.');
      const url=window.DrawSplatMySQL.endpoint(requestedEndpoint);
      localStorage.setItem(FOLDER_ENDPOINT_KEY,url);
      localStorage.setItem(STORAGE_MODE_KEY,'mysql');
      setStatus('Connected! Open the whiteboard, then choose File → Save online and sign in.','success');
    }catch(err){setStatus('Connection not enabled. '+err.message,'danger')}
    finally{button.disabled=false}
  }
  async function testEndpoint(){
    try{setStatus('Testing your saving service…');await window.DrawSplatMySQL.test(endpointValue());setStatus('Connection works. Account-owned online saving is supported. Choose Test & Enable to use it.','success')}
    catch(err){setStatus('Connection test failed. '+err.message,'danger')}
  }
  async function createAccount(){
    const button=$('mysqlCreateAccount'),requestedEndpoint=endpointValue();button.disabled=true;
    try{
      const email=value('mysqlAccountEmail'),password=$('mysqlAccountPassword').value;
      if(!email||password.length<8)throw new Error('Enter your email and a password of at least 8 characters.');
      await window.DrawSplatMySQL.test(requestedEndpoint);
      await window.DrawSplatMySQL.register({email,password,displayName:value('mysqlAccountName')},requestedEndpoint);
      setStatus('Saving account created. Test & Enable the connection, then sign in using File → Save online on the whiteboard.','success');
    }catch(err){setStatus('Account not created. '+err.message,'danger')}
    finally{button.disabled=false;$('mysqlAccountPassword').value=''}
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
    let endpointPath='/api/drawsplat/mysql';try{endpointPath=new URL(endpointValue()||'http://localhost:8787/api/drawsplat/mysql',location.origin).pathname.replace(/\/+$/,'')||endpointPath}catch(_){}
    const quote=v=>{
      for(const delimiter of ["'",'"',String.fromCharCode(96)]){if(!v.includes(delimiter)&&(delimiter!=='"'||!/[\\]/.test(v)))return delimiter+v+delimiter}
      throw new Error('Use a database URL on the server for values containing all quote styles.');
    };
    if(envOutput){
      try{envOutput.value=[
        'PORT=8787',
        'API_BASE_PATH='+endpointPath,
        'MYSQL_HOST='+quote(host),
        'MYSQL_PORT='+port,
        'MYSQL_DATABASE='+quote(database),
        'MYSQL_USER='+quote(user),
        'MYSQL_PASSWORD='+quote(password),
        'MYSQL_SSL='+ssl,
        'SESSION_TTL_HOURS=24',
        'CORS_ORIGIN='+location.origin,
        'DRAWSPLAT_PEPPER=REPLACE_WITH_A_LONG_RANDOM_SECRET',
        'AUTO_MIGRATE=true',
        'NODE_ENV=production',
        'TRUST_PROXY=true'
      ].join('\n')}catch(err){envOutput.value='';setStatus(err.message,'danger')}
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

  $('mysqlCreateAccount')?.addEventListener('click',createAccount);
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
