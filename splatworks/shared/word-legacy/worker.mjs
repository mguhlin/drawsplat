import { normalizeWordContainer } from './normalize.mjs';
import createAntiword from './antiword-decoder.mjs';
onmessage=async event=>{
 const output=[],diagnostics=[];let length=0;
 try{
  if(!(event.data instanceof ArrayBuffer)||!event.data.byteLength||event.data.byteLength>20000000)throw Error('Choose a binary Word document under 20 MB.');
  const module=await createAntiword({print:value=>{length+=value.length;if(length>8000000)throw Error('Decoded Word text exceeds 8 MB.');output.push(value);},printErr:value=>{if(diagnostics.join('').length<8000)diagnostics.push(value);},preRun:[m=>{m.ENV.ANTIWORDHOME='/resources';}]});
  module.FS.writeFile('/input.doc',normalizeWordContainer(new Uint8Array(event.data)));let code=0;
  try{code=module.callMain(['-x','db','/input.doc']);}catch(error){if(error.name==='ExitStatus')code=error.status;else throw error;}
  if(code)throw Error(diagnostics.join('\n')||'This binary Word file could not be decoded.');
  const xml=output.join('\n');if(!xml.includes('<book'))throw Error('This binary Word variant is not supported.');
  postMessage({xml,diagnostics});
 }catch(error){postMessage({error:error.message||String(error)});}
};
