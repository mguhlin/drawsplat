import { CFB } from './compound-file.mjs';
// Antiword expects a big-block WordDocument stream; normalize the container only.
export function normalizeWordContainer(bytes){
 if(bytes.length<512||![0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1].every((v,i)=>bytes[i]===v))return bytes;
 const header=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),shift=header.getUint16(30,true);
 if(![9,12].includes(shift))throw Error('Unsupported Word compound-file sector size.');
 const sectors=Math.ceil(bytes.length/(2**shift));for(const offset of [40,44,64,72])if(header.getUint32(offset,true)>sectors)throw Error('Invalid Word compound-file sector count.');
 const container=CFB.parse(bytes),word=CFB.find(container,'WordDocument');
 if(!word?.content?.length)throw Error('The compound file has no Word document stream.');
 if(container.FileIndex.length>5000||container.FileIndex.some(entry=>entry.type===2&&(entry.content?.length>20000000||entry.size>20000000)))throw Error('The Word compound file is too complex.');
 if(word.size!==word.content.length)throw Error('The Word document stream is truncated.');
 if(word.content.length>=4096&&shift===9)return bytes;
 const padded=new Uint8Array(Math.max(4096,word.content.length));padded.set(word.content);word.content=padded;word.size=padded.length;
 const output=new Uint8Array(CFB.write(container));if(output.length>20016384)throw Error('The normalized Word document is too large.');return output;
}
