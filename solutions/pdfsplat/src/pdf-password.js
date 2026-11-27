// Standard PDF password protection using a pinned, stateless local Go/pdfcpu worker.
// The worker is terminated after each operation; passwords are never persisted.
let fileWorkerSource;
async function makeWorker(){
 if(location.protocol!=='file:')return new Worker('./pdf-security-worker.js');
 if(!fileWorkerSource)fileWorkerSource=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='./pdf-security-worker.js';script.onload=()=>resolve(globalThis.PDFSplatSecurityWorkerCode);script.onerror=()=>{fileWorkerSource=null;reject(Error('The local PDF security engine is missing. Extract the complete package.'));};document.head.append(script);
 });
 const source=await fileWorkerSource,url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
 try{return new Worker(url);}finally{setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
export function setupPdfPassword({buildPdf,state,downloadBytes,announce}){
 const dialog=document.createElement('dialog');dialog.id='pdfPasswordDialog';dialog.setAttribute('aria-labelledby','pdfPasswordTitle');dialog.innerHTML=`<form id="pdfPasswordForm"><h2 id="pdfPasswordTitle">Password-protected PDF</h2><p id="pdfPasswordIntro"></p><label class="dialog-field">Password<input id="pdfOpenPassword" type="password" autocomplete="new-password" required maxlength="127"></label><label class="dialog-field" id="pdfPasswordConfirmRow">Confirm password<input id="pdfOpenPasswordConfirm" type="password" autocomplete="new-password" maxlength="127"></label><p id="pdfPasswordStatus" role="status"></p><div class="dialog-actions"><button type="button" id="pdfPasswordCancel">Cancel</button><button type="submit" id="pdfPasswordRun">Save protected PDF</button></div></form>`;document.body.append(dialog);
 const $=id=>dialog.querySelector('#'+id),form=$('pdfPasswordForm'),password=$('pdfOpenPassword'),confirm=$('pdfOpenPasswordConfirm'),run=$('pdfPasswordRun'),status=$('pdfPasswordStatus');let request=null,generation=0,activeWorker=null,abortJob=null;
 function clear(){password.value=confirm.value='';}
 function stop(){generation++;activeWorker?.terminate();activeWorker=null;abortJob?.(Error('PDF security operation cancelled.'));abortJob=null;run.disabled=false;clear();}
 function cancel(){stop();const old=request;request=null;old?.reject(Error('Password entry cancelled. Your current document was kept.'));dialog.close();}
 $('pdfPasswordCancel').onclick=cancel;dialog.addEventListener('cancel',e=>{e.preventDefault();cancel();});
 function prompt(operation,bytes=null){
  if(request||dialog.open)return Promise.reject(Error('Finish the current password operation first.'));
  clear();status.textContent='';run.disabled=false;
  $('pdfPasswordTitle').textContent=operation==='encrypt'?'Save a password-protected PDF':'Open a password-protected PDF';
  $('pdfPasswordIntro').textContent=operation==='encrypt'?'Saves a standard AES-256 PDF that ordinary PDF readers can unlock. Use 8–127 UTF-8 bytes. Your original stays unchanged. The local engine accepts PDFs up to 16 MiB and does not store your password.':'Enter the PDF password. Decrypted bytes stay in memory for editing. Your original stays unchanged. The local engine accepts PDFs up to 16 MiB.';
  $('pdfPasswordConfirmRow').hidden=operation!=='encrypt';password.autocomplete=operation==='encrypt'?'new-password':'current-password';run.textContent=operation==='encrypt'?'Save protected PDF':'Unlock PDF';
  return new Promise((resolve,reject)=>{request={operation,bytes,resolve,reject};dialog.showModal();password.focus();});
 }
 form.onsubmit=async e=>{
  e.preventDefault();if(!request||run.disabled)return;
  const current=request,token=++generation,secret=password.value;
  const size=new TextEncoder().encode(secret).length;
  if(size<(current.operation==='encrypt'?8:1)||size>127){status.textContent='Enter a password within the stated length limit.';return;}
  if(current.operation==='encrypt'&&secret!==confirm.value){status.textContent='Passwords do not match.';confirm.focus();return;}
  run.disabled=true;status.textContent='Processing locally… Cancel stops the operation.';clear();
  try{
   const input=current.bytes||await buildPdf(state.pages);if(token!==generation)return;
   const bytes=input instanceof Uint8Array?input:new Uint8Array(input);if(!bytes.length||bytes.length>16*1024*1024)throw Error('Choose a PDF up to 16 MiB for password protection.');
   const worker=await makeWorker();if(token!==generation){worker.terminate();return;}activeWorker=worker;
   const output=await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{worker.terminate();reject(Error('PDF security operation timed out. Your document was kept.'));},45000);
    abortJob=error=>{clearTimeout(timer);reject(error);};
    worker.onmessage=event=>{clearTimeout(timer);event.data.error?reject(Error(event.data.error)):resolve(new Uint8Array(event.data.bytes));};
    worker.onerror=()=>{clearTimeout(timer);reject(Error('PDF security engine could not complete this file. Your document was kept.'));};
    // Transfer an operation-owned copy; never detach the editor's source buffer.
    const copy=bytes.slice();worker.postMessage({operation:current.operation,bytes:copy.buffer,password:secret},[copy.buffer]);
   });
   worker.terminate();activeWorker=null;abortJob=null;if(token!==generation)return;
   request=null;dialog.close();current.resolve(output);
  }catch(error){if(token===generation)status.textContent=error.message||'The PDF could not be processed.';}finally{if(token===generation){activeWorker?.terminate();activeWorker=null;abortJob=null;run.disabled=false;}clear();}
 };
 document.getElementById('pdfPasswordButton').onclick=()=>prompt('encrypt').then(async bytes=>{const saved=await downloadBytes(bytes,state.fileName.replace(/\.pdf$/i,'')+'-protected.pdf');if(saved===false){announce('Save cancelled. Your work is still open.');return;}announce('Password-protected PDF exported. The password was not saved.');}).catch(error=>announce(error.message));
 return {unlock:async file=>{if(file.size>16*1024*1024)throw Error('Password-protected PDFs are limited to 16 MiB.');return prompt('decrypt',new Uint8Array(await file.arrayBuffer()));},reset:()=>{if(request)cancel();}};
}
