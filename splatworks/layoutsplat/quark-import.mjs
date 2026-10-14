import {publicationFromPublisher} from './publisher.mjs';
import {readData} from './media.mjs';
import {validatePublication} from './engine.mjs';
const label=value=>value.replaceAll('Publisher','QuarkXPress').replaceAll('PUB','QXP');
export async function importQuark(file,{signal,onProgress=()=>{},customFonts={}}={}){
 if(!file.size||file.size>32000000)throw Error('Choose a QuarkXPress document smaller than 32 MB.');const bytes=await file.arrayBuffer();signal?.throwIfAborted();onProgress('Decoding QuarkXPress 3.1–4.1 locally…');
 const worker=new Worker(new URL('./quark/worker.mjs',import.meta.url),{type:'module'});
 const data=await new Promise((resolve,reject)=>{
  const clean=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);worker.terminate();},abort=()=>{clean();reject(Error('QuarkXPress import cancelled.'));},timer=setTimeout(()=>{clean();reject(Error('QuarkXPress decoding timed out.'));},45000);
  signal?.addEventListener('abort',abort,{once:true});worker.onmessage=e=>{clean();e.data.error?reject(Error(e.data.error+' Browser-native QuarkXPress import supports versions 3.1–4.1. For newer files, export PDF or supported SVG objects.')):resolve(e.data);};worker.onerror=e=>{clean();reject(Error(e.message||'QuarkXPress decoding failed.'));};worker.postMessage(bytes,[bytes]);
 });
 signal?.throwIfAborted();onProgress('Building editable QuarkXPress objects…');let result;try{result=await publicationFromPublisher(data.events,file.name,{customFonts});}catch(error){throw Error(label(error.message));}
 result.doc.title=file.name.replace(/\.(qxp|qxd|qxt)$/i,'').slice(0,200);result.doc.importedFrom='QuarkXPress';for(const asset of Object.values(result.doc.assets))asset.name=label(asset.name);
 result.doc.originalQuark={name:file.name.slice(0,200),src:await readData(new Blob([file],{type:'application/octet-stream'}))};
 result.warnings=result.warnings.map(label);result.warnings.push('Native QuarkXPress 3.1–4.1 import uses libqxp 0.0.3. Linked stories, hyphenation, text paths, linked external pictures and advanced effects require review. Source bytes are preserved; later QXP versions are not supported.');result.doc=validatePublication(result.doc);return result;
}
