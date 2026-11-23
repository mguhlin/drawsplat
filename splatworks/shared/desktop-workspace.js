// SPDX-License-Identifier: MIT
// Optional adapter for installed SplatWorks; browser editions keep their own storage.
const transient = new Map();
export const desktopHost = () => globalThis.SplatDesktop || null;
export const transientStorage = {
 get length(){return transient.size;},key:index=>[...transient.keys()][index]??null,
 getItem:key=>transient.get(String(key))??null,setItem:(key,value)=>{transient.set(String(key),String(value));},
 removeItem:key=>{transient.delete(String(key));},clear:()=>transient.clear(),
};
function fingerprint(value){
 if(value&&typeof value==='object'&&!Array.isArray(value)){value={...value};delete value.createdAt;delete value.updatedAt;}
 return JSON.stringify(value);
}
export function createDesktopWorkspace(id,options){
 const host=desktopHost();if(!host)return null;
 const stamp=()=>fingerprint(options.snapshot());let saved=stamp();
 const status=message=>options.status?.(message);
 const workspace={
  isDirty:()=>stamp()!==saved||!!options.pending?.(),stamp,markSaved:value=>{saved=value;},
 };
 host.registerWorkspace(id,workspace);
 const api={
  get dirty(){return workspace.isDirty();},
  changed(){host.changed(id);},
  acceptCurrent(){saved=stamp();host.changed(id);},
  async beginReplace(){
   if(!await host.confirmReplace(id))return null;
   const generation=()=>stamp()+JSON.stringify(options.pending?.()||false);
   const expected=generation(),finish=host.beginOperation();let ended=false;
   return {verify(){if(expected!==generation())throw Error('Your workspace changed while the file was opening. Your edits were kept; choose the file again.');},finish(){if(!ended){ended=true;finish();host.changed(id);}}};
  },
  async save(){
   const finish=host.beginOperation();
   try{
    const snapshot=structuredClone(options.snapshot()),expected=fingerprint(snapshot),file=await options.file(snapshot);
    const ok=await host.saveBlob(file.blob,file.name,{tool:id,stamp:expected,complete:true});
    status(ok?(workspace.isDirty()?'Saved a copy. Newer changes still need saving.':'Saved successfully.'): 'Save cancelled. Your work is still open.');host.changed(id);return ok;
   }catch(error){status('Save failed: '+error.message+'. Your work is still open.');return false;}
   finally{finish();}
  },
 };
 host.registerCommands(id,{save:()=>api.save(),open:()=>options.open(),...(options.help?{help:()=>options.help()}: {})});
 host.registerFileReceiver?.(id,file=>options.openFile(file));
 addEventListener('desktop:export-result',event=>{if(event.detail?.ok===false)status(event.detail.error?'Save failed: '+event.detail.error+'. Your work is still open.':'Save cancelled. Your work is still open.');});
 return api;
}
