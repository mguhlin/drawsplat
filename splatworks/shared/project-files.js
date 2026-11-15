/* Explicit portable projects. Nothing is persisted until the user chooses Save. */
(()=>{
 'use strict';
 const browserWorkspaces=new Map();let operations=0;
 const browser={native:false,get busy(){return operations>0;},beginOperation(){operations++;let done=false;return()=>{if(!done){done=true;operations--;}};},registerWorkspace:(id,workspace)=>browserWorkspaces.set(id,workspace),changed:()=>{},get dirty(){return [...browserWorkspaces].filter(([,w])=>w.isDirty()).map(([id])=>id);},confirmReplace:async id=>!browserWorkspaces.get(id)?.isDirty()||confirm('This will replace unsaved work. Save a project first, or choose OK to discard it.'),saveBlob:async(blob,name)=>{const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);return true;},registerCommands:(id,commands)=>document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&!event.altKey&&!event.shiftKey&&!document.querySelector('dialog[open]')){const action=event.key.toLowerCase()==='s'?commands.save:event.key.toLowerCase()==='o'?commands.open:null;if(action){event.preventDefault();action();}}})};
 const desktop=window.SplatDesktop||browser,MAX_BYTES=64*1024*1024;window.SplatWorkspace=desktop;
 if(!desktop.native)window.addEventListener('beforeunload',event=>{if(browser.busy||browser.dirty.length){event.preventDefault();event.returnValue='';}});
 const requireValue=(ok,message)=>{if(!ok)throw Error(message);};
 const number=(value,min,max,label='number')=>{requireValue(typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max,'Invalid project '+label+'.');return value;};
 const text=(value,max=1000)=>{requireValue(typeof value==='string'&&value.length<=max,'Invalid project text.');return value;};
 const choice=(value,choices)=>{requireValue(choices.includes(value),'Unsupported project setting.');return value;};
 async function image(src){
  requireValue(typeof src==='string'&&src.length<=48*1024*1024&&/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(src),'Project images must be embedded PNG, JPEG, WebP or GIF data.');
  const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('A project image could not be decoded.'));img.src=src;});
  number(img.naturalWidth,1,8192,'image width');number(img.naturalHeight,1,8192,'image height');requireValue(img.naturalWidth*img.naturalHeight<=24000000,'A project image exceeds 24 megapixels.');return img;
 }
 function install({id,extension,serialize,prepare,commit,stamp,clean,status,note='',complete=()=>true}){
  const bar=document.createElement('section');bar.className='desktop-project-bar';bar.setAttribute('aria-label','Editable project files');
  const open=document.createElement('button'),save=document.createElement('button'),input=document.createElement('input'),hint=document.createElement('span');
  open.id='desktopOpenProject';open.type=save.type='button';open.textContent='Open project';save.id='desktopSaveProject';save.textContent='Save project';input.id='desktopProjectInput';input.type='file';input.accept='.'+extension+',application/json';input.hidden=true;
  hint.textContent='Keep an editable copy · Ctrl/Cmd+S to save · Ctrl/Cmd+O to open'+(note?' · '+note:'');bar.append(open,save,hint,input);document.body.prepend(bar);
  let name=id+'.'+extension,loading=false;
  const allowed=()=>{if(loading||desktop.busy||document.querySelector('dialog[open]')){status('Finish the current operation or dialog before opening a project.');return false;}return true;};
  open.onclick=()=>{if(allowed())input.click();};
  async function saveProject(){
   if(loading||document.querySelector('dialog[open]'))return false;
   const done=desktop.beginOperation();save.disabled=true;
   try{const savedStamp=stamp(),savedComplete=complete(),data=serialize();await prepare(data);const json=JSON.stringify({format:'SplatWorks-project',version:1,tool:id,data});const blob=new Blob([json],{type:'application/json'});requireValue(blob.size<=MAX_BYTES,'This project exceeds the 64 MB file limit. Export artwork or use fewer/smaller images.');const ok=await desktop.saveBlob(blob,name,{tool:id,stamp:savedStamp,complete:savedComplete});status(ok?(desktop.native?'Saved editable project ':'Download requested for ')+name:'Save cancelled. Your work is still open.');return ok;}
   catch(error){status('Project save failed: '+error.message);return false;}finally{save.disabled=false;done();}
  }
  async function openFile(file){
   if(!file||!allowed())return false;const before=stamp(),done=desktop.beginOperation();loading=true;const inert=document.body.inert;document.body.inert=true;
   try{requireValue(file.size<=MAX_BYTES,'This project exceeds the 64 MB file limit.');let envelope;try{envelope=JSON.parse(await file.text());}catch{throw Error('This file is not a valid project.');}
    requireValue(envelope?.format==='SplatWorks-project'&&envelope.version===1&&envelope.tool===id,'Choose a supported '+id+' project.');
    const prepared=await prepare(envelope.data);requireValue(stamp()===before,'Your workspace changed while opening. Open the project again when the operation finishes.');
    if(!await desktop.confirmReplace(id)){status('Open cancelled. Your work is still open.');return false;}
    requireValue(stamp()===before,'Your workspace changed. Open the project again.');commit(prepared);clean(stamp());name=file.name.replace(/\.[^.]*$/,'')+'.'+extension;desktop.changed(id);status('Opened editable project '+file.name);return true;
   }catch(error){status('Project open failed: '+error.message);return false;}finally{loading=false;document.body.inert=inert;input.value='';done();}
  }
  input.onchange=()=>void openFile(input.files[0]);save.onclick=()=>void saveProject();
  desktop.registerCommands(id,{open:()=>open.click(),save:()=>save.click()});
  return{openFile,save:saveProject};
 }
 async function importImage(file){
  requireValue(file&&file.size<=32*1024*1024,'Choose an image no larger than 32 MB.');
  requireValue(/^image\/(png|jpeg|webp|gif|svg\+xml)$/.test(file.type)||(!file.type&&/\.(png|jpe?g|webp|gif|svg)$/i.test(file.name)),'Choose a PNG, JPEG, WebP, GIF or SVG image.');
  const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('The image could not be read.'));reader.readAsDataURL(file);});
  const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('The image could not be decoded.'));img.src=src;});number(img.naturalWidth,1,8192);number(img.naturalHeight,1,8192);requireValue(img.naturalWidth*img.naturalHeight<=24000000,'Choose an image no larger than 24 megapixels.');
  if(!/^data:image\/(png|jpeg|webp);base64,/.test(src)){const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);return await image(c.toDataURL('image/png'));}return img;
 }
 window.DesktopProjects={install,image,importImage,number,text,choice,require:requireValue};
})();
