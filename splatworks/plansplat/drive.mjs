import {loadIdentity,connectionsAllowed} from '../shared/google-drive-auth.js';
import {newPlanner,validatePlanner,mergePlanners} from './model.mjs';
import {readDraft,writeDraft} from './storage.mjs';
const SCOPE='https://www.googleapis.com/auth/drive.file',API='https://www.googleapis.com/drive/v3/files',UPLOAD='https://www.googleapis.com/upload/drive/v3/files';
const CLIENT='31274545407-l338d2doafet21gv8u4qmq2jk3j03jq3.apps.googleusercontent.com';
const id=value=>{if(typeof value!=='string'||! /^[\w-]+$/.test(value))throw Error('Google returned an invalid file ID.');return value;};
export async function authorizeGoogle({scope=SCOPE,title="Connect your planner",message="Choose your Google account. PlanSplat will load your planner and automatically save changes to the same Drive file."}={}){
  connectionsAllowed();const clientId=document.querySelector('meta[name="google-drive-client-id"]')?.content||(/^(splatworks\.org|drawsplat\.org)$/.test(location.hostname)?CLIENT:'');if(!clientId)throw Error('Google sign-in needs a configured OAuth client on this host. Use a device backup for now.');
  // Loading uses a separate Continue button so token requests retain activation.
  await loadIdentity();return new Promise((resolve,reject)=>{
   const dialog=document.createElement('dialog');dialog.className='connect-dialog';dialog.innerHTML='<form method="dialog"><h2>Connect your planner</h2><p>Choose your Google account. PlanSplat will load your planner and automatically save changes to the same Drive file.</p><p>Google may ask you to reconnect later. Pending edits stay on this device.</p><div class="dialog-actions"><button value="cancel">Cancel</button><button type="button" class="primary">Continue with Google</button></div></form>';dialog.querySelector('h2').textContent=title;dialog.querySelector('p').textContent=message;document.body.append(dialog);let settled=false;
   const finish=(error,result)=>{if(settled)return;settled=true;clearTimeout(timeout);dialog.close();dialog.remove();error?reject(error):resolve(result);};
   const timeout=setTimeout(()=>finish(Error('Google sign-in timed out. Try connecting again.')),120000);dialog.addEventListener('close',()=>finish(Error('Google sign-in cancelled. Device work is preserved.')));
   dialog.querySelector('button[type=button]').onclick=()=>{const client=google.accounts.oauth2.initTokenClient({client_id:clientId,scope,include_granted_scopes:false,callback:r=>{if(r.error||!r.access_token||!google.accounts.oauth2.hasGrantedAllScopes(r,...scope.split(" "))){finish(Error('Allow the requested Google permissions to connect.'));return;}finish(null,r);},error_callback:()=>finish(Error('Google sign-in was closed or blocked. Allow the popup and reconnect.'))});client.requestAccessToken({prompt:'select_account'});};dialog.showModal();
  });
 }
export class DriveSync{
 constructor({getDoc,onDocument,onState,onAccount,deviceId}){Object.assign(this,{getDoc,onDocument,onState,onAccount,deviceId});this.generation=0;this.account=null;this.token=null;this.fileId=null;this.replicaId=null;this.running=null;this.timer=null;this.retry=null;this.backoff=2000;this.expiry=0;this.abort=new AbortController();}
 state(kind,message){this.onState({kind,message});}
 async authorize(){return authorizeGoogle();}
 async fetch(url,options={}){
  connectionsAllowed();if(!this.token||Date.now()>=this.expiry){this.token=null;const error=Error('Reconnect Google to save pending changes.');error.reconnect=true;throw error;}
  const response=await fetch(url,{...options,signal:this.abort.signal,redirect:'error',headers:{...options.headers,Authorization:'Bearer '+this.token}});
  if(response.status===401){this.token=null;const e=Error('Google authorization expired. Reconnect to save pending edits.');e.reconnect=true;throw e;}
  if(response.status===403){this.token=null;const e=Error('Google Drive denied access. Check school account permissions or reconnect.');e.reconnect=true;throw e;}
  if(!response.ok){const e=Error(response.status===404?'The Drive planner was moved to trash or removed. Reconnect to recover it; your device draft is preserved.':`Google Drive could not sync (${response.status}). Your device draft is preserved.`);e.status=response.status;if(response.status===404){this.token=null;e.reconnect=true;}throw e;}return response;
 }
 async connect(){
  if(this.connecting)return;this.connecting=true;this.state('connecting','Connecting to Google…');
  try{
   const auth=await this.authorize();this.generation++;this.abort.abort();this.abort=new AbortController();if(this.running)await this.running;this.again=false;this.token=auth.access_token;this.expiry=Date.now()+Math.max(1,Number(auth.expires_in)||3600)*1000-10000;
   const response=await this.fetch('https://www.googleapis.com/drive/v3/about?fields=user(permissionId,emailAddress,displayName)'),{user}=await response.json();if(!user?.permissionId)throw Error('Google could not identify this account.');
   this.account={id:id(user.permissionId),name:user.displayName||'Student',email:user.emailAddress||''};this.fileId=null;this.replicaId=null;
   const local=await readDraft('account:'+this.account.id);this.onAccount(this.account);this.onDocument(local?validatePlanner(local):newPlanner());await this.discover();await this.sync();
  }catch(error){this.token=null;this.state(error.reconnect?'reconnect':'error',error.message);}finally{this.connecting=false;}
 }
 async discover(){
  const generation=this.generation,check=()=>{if(generation!==this.generation)throw new DOMException('Account changed','AbortError');};
  const query="trashed = false and appProperties has { key='splatworksApp' and value='plansplat' }";let next='',files=[];
  do{const url=API+'?q='+encodeURIComponent(query)+'&fields=nextPageToken,files(id,name,modifiedTime,appProperties)&pageSize=100'+(next?'&pageToken='+encodeURIComponent(next):'');const result=await(await this.fetch(url)).json();check();files.push(...(result.files||[]));if(files.length>100)throw Error('More than 100 planner files were found. Keep a backup and remove unneeded copies in Drive.');next=result.nextPageToken||'';}while(next);
  files.sort((a,b)=>a.id.localeCompare(b.id));
  for(const file of files){const remote=await this.readFile(file.id);check();this.onDocument(mergePlanners(remote,this.getDoc()));}
  const primary=files.filter(f=>f.appProperties?.kind!=='replica'),replica=files.find(f=>f.appProperties?.kind==='replica'&&f.appProperties?.device===this.deviceId);
  check();this.fileId=primary.length?id(primary[0].id):await this.createFile('PlanSplat.plansplat.json',{kind:'primary'});
  check();this.replicaId=replica?id(replica.id):await this.createFile('PlanSplat recovery '+this.deviceId.slice(0,8)+'.plansplat.json',{kind:'replica',device:this.deviceId});
  if(primary.length>1)this.state('warning','Multiple main planners were merged. Other copies remain in Drive.');
 }
 async createFile(name,properties){
  const content=JSON.stringify(this.getDoc()),boundary='plansplat_'+crypto.randomUUID(),metadata=JSON.stringify({name,mimeType:'application/json',appProperties:{splatworksApp:'plansplat',schema:'1',...properties}}),body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${content}\r\n--${boundary}--\r\n`;
  const result=await(await this.fetch(UPLOAD+'?uploadType=multipart&fields=id',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body})).json();return id(result.id);
 }

 async calendarSettings(values){
  if(!this.account||!this.fileId||!this.token)throw Error('Connect Google Drive before connecting Calendar.');
  const generation=this.generation,url=API+'/'+id(this.fileId)+'?fields=appProperties',properties=(await(await this.fetch(url)).json()).appProperties||{};
  if(generation!==this.generation)throw new DOMException('Account changed','AbortError');
  if(values){Object.assign(properties,values);await this.fetch(url,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({appProperties:properties})});}
  return properties;
 }

 async readFile(fileId){const response=await this.fetch(API+'/'+id(fileId)+'?alt=media');if(Number(response.headers.get('Content-Length'))>6000000)throw Error('This Drive planner exceeds 6 MB.');const text=await response.text();if(text.length>6000000)throw Error('This Drive planner exceeds 6 MB.');return validatePlanner(JSON.parse(text));}
 changed(){clearTimeout(this.timer);if(this.account&&this.token){this.state('saving','Saving to Google Drive…');this.timer=setTimeout(()=>this.sync(),1200);}else if(this.account)this.state('reconnect','Saved on this device. Reconnect Google to sync.');}
 async sync(){
  if(!this.account||!this.fileId)return;if(this.running){this.again=true;return this.running;}
  const generation=this.generation,accountId=this.account.id;const perform=async()=>{
   try{
    if(generation!==this.generation)return;
    this.state('saving','Syncing Google Drive…');
    // Each browser owns a stable recovery file. Concurrent main-file writes can
    // never erase the other browser's checkpoint. Merge all checkpoints on pull.
    await this.discover();let remote=await this.readFile(this.fileId);if(generation!==this.generation)return;
    let merged=mergePlanners(remote,this.getDoc());this.onDocument(merged);await writeDraft('account:'+accountId,merged);
    await this.fetch(UPLOAD+'/'+id(this.replicaId)+'?uploadType=media',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(merged)});
    if(generation!==this.generation)return;
    remote=await this.readFile(this.fileId);if(generation!==this.generation)return;merged=mergePlanners(remote,this.getDoc());this.onDocument(merged);
    if(JSON.stringify(merged)!==JSON.stringify(remote))await this.fetch(UPLOAD+'/'+id(this.fileId)+'?uploadType=media',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(merged)});
    if(generation!==this.generation)return;
    this.backoff=2000;this.state(Object.keys(this.getDoc().conflicts).length?'conflict':'saved',Object.keys(this.getDoc().conflicts).length?'Changes saved. Review conflicting edits.':'Saved to Google Drive');
   }catch(error){if(generation!==this.generation||error.name==='AbortError')return;this.state(error.reconnect?'reconnect':navigator.onLine===false?'offline':'error',error.message);if(!error.reconnect&&error.status!==404){clearTimeout(this.retry);this.retry=setTimeout(()=>this.sync(),this.backoff);this.backoff=Math.min(60000,this.backoff*2);}}
   finally{this.running=null;if(this.again&&generation===this.generation){this.again=false;this.changed();}}
  };this.running=navigator.locks?navigator.locks.request('plansplat-drive-'+accountId,perform):perform();return this.running;
 }
 disconnect(){this.generation++;this.abort.abort();this.abort=new AbortController();this.token=null;this.account=null;this.fileId=null;this.replicaId=null;this.again=false;clearTimeout(this.timer);clearTimeout(this.retry);this.onAccount(null);this.state('local','Saved on this device');}
}
