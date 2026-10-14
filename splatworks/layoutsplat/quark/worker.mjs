import createQuark from './quark-decoder.mjs';
self.onmessage=async({data})=>{
 try{
  if(!(data instanceof ArrayBuffer)||!data.byteLength||data.byteLength>32000000)throw Error('Choose a QuarkXPress file smaller than 32 MB.');
  const response=await fetch(new URL('../publisher/unicode-data.dat',import.meta.url));if(!response.ok)throw Error('The local QuarkXPress language data could not load.');const unicode=new Uint8Array(await response.arrayBuffer());
  const module=await createQuark({print:()=>{},printErr:()=>{}});module.FS.writeFile('/unicode.dat',unicode);if(module.ccall('load_unicode_data','number',['string'],['/unicode.dat']))throw Error('Invalid QuarkXPress language data.');
  module.FS.writeFile('/input.qxd',new Uint8Array(data));const result=module.ccall('parse_qxp','string',['string'],['/input.qxd']);if(result.length>64000000)throw Error('Decoded QuarkXPress data is too large.');self.postMessage(JSON.parse(result));
 }catch(error){self.postMessage({error:error?.message||String(error)});}
};
