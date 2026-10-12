// SPDX-License-Identifier: MIT
// Copyright (c) 2026 DrawSplat contributors. See LICENSE.txt in this directory.
export const APP_NAMES = {writesplat:'WriteSplat',showsplat:'ShowSplat',gridsplat:'GridSplat',listsplat:'ListSplat'};
const TYPES = {writesplat:['docx','odt','txt','text','md','markdown','html','htm','json'],showsplat:['pptx','odp','pdf','html','htm','md','markdown','json'],gridsplat:['xlsx','ods','csv','tsv','md','markdown','json'],listsplat:['csv','tsv','json']};
const TTL = 10 * 60 * 1000;
const PARAM = 'open-file';
const sessionKey = () => 'drawsplat.imported-tab.' + location.pathname;
let incomingToken;
if(typeof location !== 'undefined')incomingToken=new URL(location.href).searchParams.get(PARAM);
export function isTransferredWorkspace(){
  if(typeof window==='undefined')return false;
  if(incomingToken){sessionStorage.setItem(sessionKey(),'1');return true;}
  return sessionStorage.getItem(sessionKey())==='1';
}
export function workspaceStorage(){return isTransferredWorkspace()?window.sessionStorage:window.localStorage;}
export function fileOwner(name){
  const value=String(name).toLowerCase();
  for(const app of Object.keys(APP_NAMES))if(value.endsWith('.'+app+'.json'))return app;
  const extension=value.split('.').pop();
  if(['docx','odt'].includes(extension))return 'writesplat';
  if(['pptx','odp'].includes(extension))return 'showsplat';
  if(['xlsx','ods'].includes(extension))return 'gridsplat';
  return null;
}
export function nativeOwner(data){
  if(Array.isArray(data?.slides))return 'showsplat';
  if(data?.document && data?.teacher)return 'writesplat';
  if(Array.isArray(data?.sheets))return 'gridsplat';
  if(Array.isArray(data?.schema?.tables))return 'listsplat';
  return null;
}
export async function assertSupportedFile(file, app){
  const extension=file.name.toLowerCase().split('.').pop();
  if(!TYPES[app]?.includes(extension)){
    const owner=fileOwner(file.name);
    throw new Error(owner?`Open ${file.name} in ${APP_NAMES[owner]}.`:`${APP_NAMES[app]} cannot open this file type. Use ${TYPES[app].map(type=>'.'+type).join(', ')}. For older Office files, save a current DOCX, XLSX, PPTX, or CSV copy first.`);
  }
  if(file.size>20_000_000)throw new Error('File imports are limited to 20 MB.');
  if(!['docx','odt','pptx','odp','xlsx','ods','pdf'].includes(extension)){
    const bytes=new Uint8Array(await file.slice(0,512).arrayBuffer());
    if(bytes.includes(0) || (bytes[0]===0x50 && bytes[1]===0x4b && bytes[2]===3 && bytes[3]===4))throw new Error('This looks like a binary file with a text filename. Use its original Office extension, or export text/CSV as UTF-8.');
  }
}
function openDatabase(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('drawsplat-file-transfers',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('files',{keyPath:'id'});
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(new Error('Browser file transfer storage is unavailable. Open the correct app and choose the file there.'));
  });
}
async function storeFile(record){
  const db=await openDatabase();
  try{
    await new Promise((resolve,reject)=>{
      const transaction=db.transaction('files','readwrite'),store=transaction.objectStore('files');
      const cursor=store.openCursor();cursor.onsuccess=()=>{const entry=cursor.result;if(entry){if(Date.now()-entry.value.createdAt>TTL)entry.delete();entry.continue();}};
      store.put(record);transaction.oncomplete=resolve;transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error);
    });
  }finally{db.close();}
}
async function takeFile(id, app){
  const db=await openDatabase();
  try{
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction('files','readwrite'),store=tx.objectStore('files'),request=store.get(id);
      let record;request.onsuccess=()=>{record=request.result;if(record)store.delete(id);};
      tx.oncomplete=()=>{
        if(!record || record.app!==app || Date.now()-record.createdAt>TTL)reject(new Error('This file transfer expired or is unavailable. Choose the file again in its matching app.'));
        else resolve(new File([record.file],record.name,{type:record.type,lastModified:record.modified}));
      };tx.onerror=()=>reject(tx.error);
    });
  }finally{db.close();}
}
export async function routeFileToApp(file, currentApp){
  let owner=fileOwner(file.name);
  if(!owner && !TYPES[currentApp]?.includes(file.name.toLowerCase().split('.').pop())){
    if(/\.(csv|tsv)$/i.test(file.name))owner='gridsplat';
    else if(/\.pdf$/i.test(file.name))owner='showsplat';
    else if(/\.(txt|text|md|markdown|html|htm)$/i.test(file.name))owner='writesplat';
  }
  if(!owner && /\.json$/i.test(file.name) && file.size<=20_000_000){try{owner=nativeOwner(JSON.parse(await file.text()));}catch{/* The app parser supplies the invalid JSON message. */}}
  if(!owner || owner===currentApp)return false;
  if(file.size>20_000_000)throw new Error('File imports are limited to 20 MB.');
  if(!['http:','https:'].includes(location.protocol))throw new Error('Open SplatWorks through a local web server to transfer files between apps.');
  const target=window.open('about:blank','_blank');
  if(!target)throw new Error(`Your browser blocked the new tab. Allow popups, then choose the file again to open it in ${APP_NAMES[owner]}.`);
  target.opener=null;
  const marker=location.pathname.indexOf('/splatworks/');
  const base=marker>=0?location.pathname.slice(0,marker)+'/splatworks/':'/splatworks/';
  const url=new URL(base+owner+'/',location.origin);
  const id=crypto.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const n=crypto.getRandomValues(new Uint8Array(1))[0]&15;return (c==='x'?n:(n&3)|8).toString(16);});
  try{
    const response=await fetch(url,{cache:'no-cache'});
    if(!response.ok || !(await response.text()).includes('name="splatworks-app" content="'+owner+'"'))throw new Error(`${APP_NAMES[owner]} is not available at this school address. Install or enable it, then choose the file there.`);
    await storeFile({id,app:owner,file,name:file.name,type:file.type,modified:file.lastModified,createdAt:Date.now()});
    url.searchParams.set(PARAM,id);target.location.href=url.href;
    return true;
  }catch(error){target.close();throw error;}
}
export async function consumeTransferredFile(app){
  if(!incomingToken)return null;
  const token=incomingToken;
  isTransferredWorkspace();incomingToken=null;
  const url=new URL(location.href);url.searchParams.delete(PARAM);history.replaceState(history.state,'',url);
  if(!/^[0-9a-f-]{36}$/i.test(token))throw new Error('Invalid file transfer. Choose the file again.');
  return takeFile(token,app);
}
export const importedFileNotice = 'Save a project file before closing this imported tab. Your other projects have not been replaced.';
