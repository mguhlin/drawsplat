'use strict';
// Only authenticated CipherSplat ZIP wrappers are unpacked automatically. The
// original file may itself be a ZIP; its contents remain the original file.
const validateRestoreTree=CipherSplatArchives.validateRestoreTree;
async function unpackZipResult(){
 if(!resultBlob||!CipherSplatArchives.isArchiveType(resultBlob.type))return;
 const {files,directories:dirs}=await CipherSplatArchives.unpack(resultBlob);
 if(files.length===1&&!dirs.length&&!files[0].path.includes('/')){
  resultBlob=files[0].blob;resultName=files[0].path;resultFiles=[];resultDirectories=[];
  $('#resultMeta').textContent='Authenticated, unzipped and restored: '+resultName;
 }else{
  resultFiles=files;resultDirectories=dirs;resultBlob=new Blob([]);
  $('#resultMeta').textContent='Authenticated and unzipped '+files.length+' file(s).';
 }
}
async function restoreToDirectory(parent){
 const items=[...resultDirectories.map(path=>({path,dir:true,size:0})),...resultFiles.map(file=>({...file,dir:false,size:file.blob.size}))];
 validateRestoreTree(items);
 let folder,name;
 for(let n=0;n<10;n++){
  name='CipherSplat-restored-'+Array.from(crypto.getRandomValues(new Uint8Array(12)),b=>b.toString(16).padStart(2,'0')).join('');
  try{await parent.getDirectoryHandle(name);continue}catch(error){if(error.name!=='NotFoundError')throw error}
  folder=await parent.getDirectoryHandle(name,{create:true});break;
 }
 if(!folder)throw Error('A new restoration folder could not be created.');
 for(const item of items){
  const parts=item.path.split('/');let dir=folder;
  for(const part of item.dir?parts:parts.slice(0,-1))dir=await dir.getDirectoryHandle(part,{create:true});
  if(item.dir)continue;
  const handle=await dir.getFileHandle(parts.at(-1),{create:true}),writer=await handle.createWritable();
  try{await writer.write(item.blob);await writer.close()}catch(error){try{await writer.abort()}catch{};throw Error('Restoration stopped in '+name+'. Some restored files may remain: '+error.message)}
 }
 $('#statusCopy').textContent='Unzipped files restored in the new folder '+name+'. Existing files were not replaced.';
 return name;
}
function showRestoredFileList(){
 const area=$('#restoredFilesArea'),list=$('#restoredFilesList');list.replaceChildren();area.classList.remove('hidden');
 for(const item of resultFiles){
  const row=document.createElement('li'),name=document.createElement('span'),button=document.createElement('button');
  name.textContent=item.path;button.type='button';button.className='secondary';button.textContent='Save file';button.setAttribute('aria-label','Save '+item.path);button.addEventListener('click',()=>downloadBlob(item.blob,item.path.split('/').at(-1)));row.append(name,button);list.append(row);
 }
 $('#statusCopy').textContent='Your files are authenticated and unzipped. This browser cannot write a folder directly. Save the files below, or use the native app to restore their complete folder structure.';
 $('#downloadResult').textContent='Download ZIP instead';
}
