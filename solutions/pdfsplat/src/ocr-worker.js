// Adapter for the pinned Tesseract.js 7 worker protocol (see vendor/ocr/README).
// Own the native Worker immediately so Stop also cancels model/core loading.
export function createRecognitionWorker({base,langs,onProgress=()=>{}}){
  const worker=new Worker(new URL('worker.min.js',base).href),pending=new Map();
  let serial=0,closed=false;
  function terminate(reason=new DOMException('OCR stopped','AbortError')){
    if(closed)return Promise.resolve();closed=true;worker.terminate();
    for(const entry of pending.values()){clearTimeout(entry.timer);entry.reject(reason);}pending.clear();return Promise.resolve();
  }
  function job(action,payload,transfer=[]){
    if(closed)return Promise.reject(new DOMException('OCR stopped','AbortError'));
    const jobId='pdfsplat-ocr-'+(++serial),key=action+'-'+jobId;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>void terminate(Error('OCR timed out. Try fewer pages or a clearer image.')),120000);
      pending.set(key,{resolve,reject,timer});
      try{worker.postMessage({workerId:'pdfsplat-ocr',jobId,action,payload},transfer);}catch(error){clearTimeout(timer);pending.delete(key);reject(error);}
    });
  }
  worker.onmessage=({data:packet})=>{
    if(closed)return;
    if(packet.status==='progress'){onProgress(packet.data||{});return;}
    const key=packet.action+'-'+packet.jobId,entry=pending.get(key);if(!entry)return;
    clearTimeout(entry.timer);pending.delete(key);
    if(packet.status==='resolve')entry.resolve({data:packet.data});else entry.reject(Error(String(packet.data||'Recognition failed.')));
  };
  worker.onerror=event=>{event.preventDefault();void terminate(Error(event.message||'The local OCR worker could not start.'));};
  worker.onmessageerror=()=>void terminate(Error('The OCR worker returned an unreadable result.'));
  const ready=(async()=>{
    try{
      await job('load',{options:{lstmOnly:true,corePath:base.href,logging:false}});
      await job('loadLanguage',{langs,options:{langPath:base.href.replace(/\/$/,''),cacheMethod:'none',gzip:false,lstmOnly:true}});
      await job('initialize',{langs,oem:1,config:{}});
    }catch(error){await terminate(error);throw error;}
  })();
  return {ready,terminate,setParameters:params=>job('setParameters',{params}),recognize:async canvas=>{
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Could not prepare the OCR page.')),'image/png'));
    const image=new Uint8Array(await blob.arrayBuffer());return job('recognize',{image,options:{},output:{text:true,blocks:true}},[image.buffer]);
  }};
}
