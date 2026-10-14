export async function decodeLegacyWord(file){
 if(!file.size||file.size>20000000)throw Error('Choose a binary Word document under 20 MB.');
 const worker=new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'});
 try{return await new Promise(async(resolve,reject)=>{
  const timeout=setTimeout(()=>{worker.terminate();reject(Error('Word decoding exceeded 45 seconds.'));},45000);
  const finish=(error,value)=>{clearTimeout(timeout);error?reject(error):resolve(value);};
  worker.onerror=event=>finish(Error(event.message||'The local Word decoder could not load.'));
  worker.onmessage=event=>{const data=event.data;if(data?.error)finish(Error(data.error));else if(typeof data?.xml==='string'&&data.xml.length<=8000000)finish(null,data.xml);else finish(Error('Invalid Word decoder output.'));};
  try{const bytes=await file.arrayBuffer();worker.postMessage(bytes,[bytes]);}catch(error){finish(error);}
 });}finally{worker.terminate();}
}
