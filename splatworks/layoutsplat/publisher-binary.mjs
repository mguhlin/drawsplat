// Publisher 2000 compound-file writer. Native records follow libmspub's
// reverse-engineered Contents/Quill readers; MS-CFB and MS-WMF define containers.
import {CFB} from '../shared/word-legacy/compound-file.mjs';
const encoder=new TextEncoder();
export class Bytes {
 constructor(size){this.bytes=new Uint8Array(size);this.view=new DataView(this.bytes.buffer);}
 u16(at,n){this.view.setUint16(at,n,true);return this;}
 u32(at,n){this.view.setUint32(at,n>>>0,true);return this;}
 put(at,bytes){this.bytes.set(bytes,at);return this;}
}
const join=parts=>{const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;};
const u32=n=>new Bytes(4).u32(0,n).bytes;
const utf16=text=>{const b=new Bytes(text.length*2);for(let i=0;i<text.length;i++)b.u16(i*2,text.charCodeAt(i));return b.bytes;};
const block=(id,n)=>new Bytes(6).put(0,[id,0x20]).u32(2,n).bytes;
const container=(id,parts)=>{const data=join(parts);return new Bytes(6+data.length).put(0,[id,0x88]).u32(2,4+data.length).put(6,data).bytes;};
const style=parts=>{const b=join(parts);return new Bytes(4+b.length).u32(0,b.length+4).put(4,b).bytes;};
const emu=n=>Math.round(n*12700);
const rgb=hex=>parseInt(hex.slice(1,3),16)|(parseInt(hex.slice(3,5),16)<<8)|(parseInt(hex.slice(5,7),16)<<16);
const nativeColor=hex=>0x20000000|rgb(hex);
function fd(entries,textOffset){
 const list=[];
 // Chunk-relative style offsets are uint16. Split style tables before overflow.
 for(let first=0;first<entries.length;){
  let count=0,size=8;
  while(first+count<entries.length&&count<2000&&size+6+entries[first+count].style.length<64000){size+=6+entries[first+count].style.length;count++;}
  if(!count)throw Error('A Publisher text style exceeds the native record limit.');
  const b=new Bytes(size).u16(0,count);let at=8+count*6;
  for(let i=0;i<count;i++){const e=entries[first+i];b.u32(8+i*4,textOffset+e.end*2).u16(8+count*4+i*2,at).put(at,e.style);at+=e.style.length;}
  list.push(b.bytes);first+=count;
 }
 return list;
}
function quill(stories){
 const fonts=[],charEntries=[],paraEntries=[],lengths=[],ids=[];let text='';
 const index=(a,v)=>{let i=a.indexOf(v);if(i<0){i=a.length;a.push(v);}return i;};
 for(const [id,paragraphs] of stories.entries()){
  const start=text.length;ids.push(id);
  for(const p of paragraphs){
   const base=p.style||{},runs=p.runs.length?p.runs:[{text:'',style:base}];
   for(let i=0;i<runs.length;i++){
    const run=runs[i],s=run.style;const value=run.text.replace(/\r/g,'')+(i===runs.length-1?'\r':'');text+=value;
    if(!value.length)continue;
    if(text.length>2000000||charEntries.length>100000)throw Error('Publisher text exceeds the two-million-character or 100,000-run limit.');
    const fields=[block(0x0c,emu(s.size||12)),block(0x2e,nativeColor(s.color||'#000000')),container(0x24,[container(0,[block(0,index(fonts,s.font||'Arial'))])])];
    if(s.bold)fields.push(block(2,1));if(s.italic)fields.push(block(3,1));if(s.underline)fields.push(block(0x1e,1));
    charEntries.push({end:text.length,style:style(fields)});
   }
   const fields=[block(4,({left:0,center:2,right:1,justify:6})[p.align]||0),block(0x34,emu(p.leading||base.size*(p.lineMultiple||1.45))*8+1),block(0x12,emu(p.spaceBefore||0)),block(0x13,emu(p.spaceAfter||0)),block(0x0c,emu(p.firstLineIndent||0)),block(0x0d,emu(p.indentLeft||0)),block(0x0e,emu(p.indentRight||0))];
   paraEntries.push({end:text.length,style:style(fields)});
  }
  lengths.push(text.length-start);
 }
 if(!stories.length){return null;}
 const strs=new Bytes(8+lengths.length*4).u32(0,lengths.length).u32(4,4);lengths.forEach((n,i)=>strs.u32(8+i*4,n));
 const syid=new Bytes(8+ids.length*4).u32(4,ids.length);ids.forEach((n,i)=>syid.u32(8+i*4,n));
 const fontParts=[new Bytes(20+fonts.length*4).u32(4,fonts.length).bytes,...fonts.map(f=>{const n=utf16(f);return new Bytes(n.length+6).u16(0,f.length).put(2,n).bytes;})];
 const stsh=new Bytes(20).bytes;
 // Record offsets are absolute in the Quill stream; compute after the table count.
 const fixed=[['STRS',strs.bytes],['SYID',syid.bytes],['FONT',join(fontParts)],['STSH',stsh],['STSH',stsh]];
 const charCount=fd(charEntries,0).length,paraCount=fd(paraEntries,0).length,count=fixed.length+1+charCount+paraCount;
 const textOffset=0x20+count*24+fixed.reduce((n,[,b])=>n+b.length,0);
 const chunks=[...fixed,['TEXT',utf16(text)],...fd(charEntries,textOffset).map(b=>['FDPC',b]),...fd(paraEntries,textOffset).map(b=>['FDPP',b])];
 let offset=0x20+chunks.length*24;const b=new Bytes(offset+chunks.reduce((n,[,v])=>n+v.length,0));
 b.put(0,encoder.encode('CHNKINK ')).u16(0x1a,chunks.length).u32(0x1c,0xffffffff);
 chunks.forEach(([name,data],i)=>{const at=0x20+i*24;b.put(at+2,encoder.encode(name)).u32(at+8,1).put(at+12,encoder.encode(name)).u32(at+16,offset).u32(at+20,data.length).put(offset,data);offset+=data.length;});
 return b.bytes;
}
export function wmfBitmap({width,height,data}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>16384||height>16384||width*height>8000000||data.length!==width*height*4)throw Error('Publisher picture exceeds the 8-megapixel limit. Choose a lower resolution.');
 const stride=(width*3+3)&~3,dib=new Bytes(40+stride*height).u32(0,40).u32(4,width).u32(8,height).u16(12,1).u16(14,24).u32(20,stride*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const a=(y*width+x)*4,b=40+(height-1-y)*stride+x*3,alpha=data[a+3]/255;dib.bytes[b]=Math.round(data[a+2]*alpha+255*(1-alpha));dib.bytes[b+1]=Math.round(data[a+1]*alpha+255*(1-alpha));dib.bytes[b+2]=Math.round(data[a]*alpha+255*(1-alpha));}
 const record=(fn,params)=>new Bytes(6+params.length).u32(0,(6+params.length)/2).u16(4,fn).put(6,params).bytes;
 const dims=new Bytes(4).u16(0,height).u16(2,width).bytes;
 const bitmap=new Bytes(22+dib.bytes.length).u32(0,0x00cc0020).u16(4,0).u16(6,height).u16(8,width).u16(10,0).u16(12,0).u16(14,height).u16(16,width).u16(18,0).u16(20,0).put(22,dib.bytes).bytes;
 const records=[record(0x0103,new Bytes(2).u16(0,8).bytes),record(0x020b,new Bytes(4).bytes),record(0x020c,dims),record(0x0f43,bitmap),record(0,new Uint8Array())];
 const body=join(records);return new Bytes(18+body.length).u16(0,1).u16(2,9).u16(4,0x300).u32(6,(18+body.length)/2).u16(10,0).u32(12,Math.max(...records.map(r=>r.length/2))).put(18,body).bytes;
}
export function publisherContainer(width,height,pages){
 let next=1;const chunks=[],stories=[];
 const add=(data,parent=0)=>{const id=next++;if(next>65535)throw Error('Publication exceeds the Publisher object limit.');chunks.push({id,parent,data});return id;};
 const document=new Bytes(64).u16(0,0x15).u32(0x14,emu(width)).u32(0x18,emu(height));const documentId=add(document.bytes);
 for(const objects of pages){
  // These IDs are reserved as dummy/master pages in the legacy format.
  while([0x108,0x109,0x10b,0x10d,0x116,0x119].includes(next))next++;
  const page=add(new Bytes(32).u16(0,0x14).bytes,documentId);
  for(const o of objects){
   const type=o.bitmap?2:o.type==='text'?8:o.kind==='ellipse'?7:o.kind==='line'?4:5,b=new Bytes(0x80).u16(0,type).u16(4,Math.round(((360-o.rotation)%360+360)%360*10));
   const pad=o.type==='text'?2.88:0;
   b.u32(6,emu(o.x-pad-width/2)).u32(10,emu(o.y-pad-height/2)).u32(14,emu(o.x+o.w+pad-width/2)).u32(18,emu(o.y+o.h+pad-height/2));
   if(o.type==='text'){b.u16(0x58,stories.length);stories.push(o.paragraphs);}
   if(o.type==='shape'){
    if(!o.noFill&&o.kind!=='line')b.u32(0x22,nativeColor(o.fill)).put(0x2a,[2]);
    for(const at of [0x2c,0x35,0x3b,0x41])b.put(at,[Math.min(80,Math.round(o.strokeWidth||0))]).u32(at+1,nativeColor(o.stroke||'#000000'));
   }
   const shapeId=add(b.bytes,page);
   if(o.bitmap)add(new Bytes(8+o.bitmap.length).u16(0,0x21).u32(4,o.bitmap.length).put(8,o.bitmap).bytes,shapeId);
  }
 }
 // The last sentinel gives the previous chunk its end offset in legacy readers.
 add(new Bytes(16).u16(0,0x7f).bytes);
 let offset=64;chunks.forEach(c=>{c.offset=offset;offset+=c.data.length;});const trailer=offset;
 const contents=new Bytes(trailer+2+chunks.length*10).put(0,[0xe8,0xac,0x22,0]).u16(4,300).u32(0x16,trailer).u16(trailer,chunks.length);
 chunks.forEach((c,i)=>contents.put(c.offset,c.data).u16(trailer+2+i*10+2,c.id).u16(trailer+2+i*10+4,c.parent).u32(trailer+2+i*10+6,c.offset));
 const cfb=CFB.utils.cfb_new();cfb.FileIndex[0].clsid='011202000000000000c0000000000046';CFB.utils.cfb_add(cfb,'Contents',contents.bytes);
 const text=quill(stories);if(text)CFB.utils.cfb_add(cfb,'Quill/QuillSub/CONTENTS',text);
 else { // An empty Quill stream still selects the Unicode Publisher 2000 reader.
  CFB.utils.cfb_add(cfb,'Quill/QuillSub/CONTENTS',new Bytes(32).put(0,encoder.encode('CHNKINK ')).u32(0x1c,0xffffffff).bytes);
 }
 return cfb;
}
export async function publisherFingerprint(cfb){
 const streams=cfb.FileIndex.map((entry,i)=>({entry,path:cfb.FullPaths[i].split('/').slice(1).join('/')})).filter(({entry,path})=>entry.type===2&&path!=='LayoutSplat').sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
 const parts=[];for(const {entry,path}of streams){const name=encoder.encode(path),data=new Uint8Array(entry.content);parts.push(u32(name.length),name,u32(data.length),data);}
 const digest=await crypto.subtle.digest('SHA-256',join(parts));return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function finishPublisher(cfb,doc,warnings){
 CFB.utils.cfb_add(cfb,'LayoutSplat Report',encoder.encode(warnings.join('\n')));
 const fingerprint=await publisherFingerprint(cfb),payload=JSON.stringify({version:1,fingerprint,publication:doc});if(payload.length>24000000)throw Error('The embedded project exceeds the Publisher export limit. Reduce embedded media or use the native LayoutSplat project.');CFB.utils.cfb_add(cfb,'LayoutSplat',encoder.encode(payload));
 const bytes=new Uint8Array(CFB.write(cfb));if(bytes.length>32000000)throw Error('Publisher export exceeds 32 MB. Reduce picture resolution or publication size.');return bytes;
}
export async function publisherNativeProject(bytes){
 if(bytes.length<512||bytes.length>32000000||![0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1].every((v,i)=>bytes[i]===v))return null;
 const header=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),shift=header.getUint16(30,true);if(![9,12].includes(shift))return null;
 const sectors=Math.ceil(bytes.length/(2**shift));for(const at of [40,44,64,72])if(header.getUint32(at,true)>sectors)return null;
 const cfb=CFB.parse(bytes),entry=CFB.find(cfb,'LayoutSplat');if(!entry?.content||entry.size>32000000||entry.content.length!==entry.size)return null;
 if(cfb.FileIndex.length>5000)return null;
 const data=JSON.parse(new TextDecoder().decode(new Uint8Array(entry.content)));
 if(data.version!==1||typeof data.fingerprint!=='string'||data.fingerprint!==await publisherFingerprint(cfb))return null;
 return data.publication;
}
