// Local document import. No remote resources, scripts, or conversion service.
import {standardTextFont} from './text-appearance.js';
const LIMIT = 50 * 1024 * 1024, ZIP_LIMIT = 100 * 1024 * 1024;
const IMAGE_TYPES = {png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',bmp:'image/bmp',svg:'image/svg+xml',avif:'image/avif',ico:'image/x-icon'};
export const importAccept = '.pdf,.docx,.pptx,.epub,.md,.markdown,.txt,.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,.avif,.ico,application/pdf,image/*';
const all = (node,name) => node ? [...node.getElementsByTagNameNS('*',name)] : [];
const first = (node,name) => all(node,name)[0];
const attribute = (node,name) => [...(node?.attributes||[])].find(a=>a.localName===name)?.value;
const xml = text => {const d=new DOMParser().parseFromString(text,'application/xml');if(d.getElementsByTagName('parsererror').length)throw Error('The document contains invalid XML.');return d;};
const enabled = node => node && !['0','false','off'].includes(attribute(node,'val'));
function pathFrom(base,target){
 if(!target||/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(target))return null;
 let decoded;try{decoded=decodeURIComponent(target.split(/[?#]/)[0]);}catch{return null;}
 const parts=base.split('/').slice(0,-1);for(const p of decoded.split('/')){if(p==='..'){if(!parts.length)return null;parts.pop();}else if(p&&p!=='.')parts.push(p);}return parts.join('/');
}
async function archive(file){
 let zip;try{zip=await globalThis.JSZip.loadAsync(await file.arrayBuffer());}catch{throw Error('This document could not be read. It may be damaged or encrypted.');}let total=0;
 const files=Object.values(zip.files);if(files.length>4000)throw Error('This document contains too many archive entries.');
 for(const entry of files){total+=entry._data?.uncompressedSize||0;if(total>ZIP_LIMIT)throw Error('This document is too large after decompression.');}
 return zip;
}
async function readXml(zip,path){const f=zip.file(path);if(!f)throw Error(`Missing document component: ${path}`);const text=await f.async('string');if(text.length>10*1024*1024)throw Error('A document component is too large.');return xml(text);}
async function relationships(zip,part){
 const pos=part.lastIndexOf('/'),rel=part.slice(0,pos+1)+'_rels/'+part.slice(pos+1)+'.rels',map=new Map();
 if(!zip.file(rel))return map;for(const r of all(await readXml(zip,rel),'Relationship'))if(r.getAttribute('TargetMode')!=='External'){const path=pathFrom(part,r.getAttribute('Target'));if(path)map.set(r.getAttribute('Id'),path);}return map;
}
function fontFamily(name=''){return /courier|mono|consolas/i.test(name)?'Courier':/times|georgia|serif/i.test(name.replace(/sans-serif/gi,''))?'Times':'Helvetica';}
function hex(value,fallback='#172033'){return /^[0-9a-f]{6}$/i.test(value||'')?'#'+value:fallback;}
async function imageData(blob){
 if(blob.type==='image/svg+xml'){
  const d=xml(await blob.text());for(const n of [...all(d,'script'),...all(d,'foreignObject')])n.remove();
  for(const n of d.getElementsByTagName('*'))for(const a of [...n.attributes])if(/^on/i.test(a.name)||(/href|src/i.test(a.localName)&&!a.value.startsWith('#')&&!/^data:image\/(png|jpeg|webp);base64,/i.test(a.value))||(/url\(/i.test(a.value)&&!/url\(['"]?#/i.test(a.value)))n.removeAttributeNode(a);
  for(const style of all(d,'style'))if(/url\(|@import/i.test(style.textContent))style.remove();blob=new Blob([new XMLSerializer().serializeToString(d)],{type:'image/svg+xml'});
 }
 const url=URL.createObjectURL(blob),image=new Image();
 try{image.src=url;await image.decode();if(!image.width||!image.height)throw Error('Empty image');const scale=Math.min(1,4096/Math.max(image.width,image.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(image.width*scale));c.height=Math.max(1,Math.round(image.height*scale));c.getContext('2d').drawImage(image,0,0,c.width,c.height);return {bytes:await new Promise((resolve,reject)=>c.toBlob(b=>{if(!b)return reject(Error('Image could not be rendered.'));b.arrayBuffer().then(buffer=>resolve(new Uint8Array(buffer)),reject);},'image/png')),width:image.width,height:image.height};}
 catch{throw Error('This image format cannot be decoded by this browser. Try PNG, JPEG, WebP, GIF, BMP, SVG, or AVIF.');}finally{URL.revokeObjectURL(url);}
}
async function zipImage(zip,path){const entry=path&&zip.file(path);if(!entry)return null;return imageData(new Blob([await entry.async('uint8array')],{type:IMAGE_TYPES[path.split('.').pop().toLowerCase()]||'application/octet-stream'}));}
function inlineMarkdown(text){
 const result=[],pattern=/(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\([^)]*\))/g;let at=0;
 for(const m of text.matchAll(pattern)){if(m.index>at)result.push({text:text.slice(at,m.index)});result.push({text:m[2]||m[3]||m[4]||m[5]||m[6],bold:!!(m[2]||m[3]),italic:!!m[4],pdfFontFamily:m[5]?'Courier':'Helvetica'});at=m.index+m[0].length;}if(at<text.length)result.push({text:text.slice(at)});return result;
}
function markdownBlocks(text,plain=false){
 const blocks=[];let code=false,paragraph=[];
 const flush=()=>{if(paragraph.length){blocks.push({runs:plain?[{text:paragraph.join(' ')}]:inlineMarkdown(paragraph.join(' '))});paragraph=[];}};
 for(const line of text.replace(/\r/g,'').split('\n')){
  if(!plain&&/^```/.test(line)){flush();code=!code;continue;}
  if(code){blocks.push({runs:[{text:line||' ',pdfFontFamily:'Courier'}],size:10,after:2});continue;}
  if(!line.trim()){flush();continue;}
  const heading=!plain&&line.match(/^(#{1,6})\s+(.+)$/),list=!plain&&line.match(/^\s*(?:[-*+] |\d+[.)] )(.+)$/);
  if(heading){flush();blocks.push({runs:inlineMarkdown(heading[2]).map(r=>({...r,bold:true})),size:Math.max(14,26-heading[1].length*2),after:12});}
  else if(list){flush();blocks.push({runs:inlineMarkdown('• '+list[1]),indent:14});}
  else if(!plain&&/^!\[.*\]\(.*\)\s*$/.test(line)){flush();blocks.push({runs:[{text:line.replace(/^!\[([^\]]*)\].*$/,'[Image: $1]'),italic:true}]});}
  else paragraph.push(line);
 }
 flush();return blocks;
}
async function docxBlocks(zip){
 const part='word/document.xml',d=await readXml(zip,part),rels=await relationships(zip,part),blocks=[];
 for(const p of all(d,'p')){
  const style=attribute(first(first(p,'pPr')||p,'pStyle'),'val')||'',heading=style.match(/heading([1-6])/i),runs=[];
  for(const r of all(p,'r')){
   const props=first(r,'rPr')||r;const text=[...r.childNodes].map(n=>n.localName==='t'?n.textContent:n.localName==='tab'?'    ':n.localName==='br'?'\n':'').join('');
   if(text)runs.push({text,bold:!!heading||!!enabled(first(props,'b')),italic:!!enabled(first(props,'i')),size:Number(attribute(first(props,'sz'),'val'))/2||undefined,color:hex(attribute(first(props,'color'),'val')),pdfFontFamily:fontFamily(attribute(first(props,'rFonts'),'ascii'))});
   for(const image of all(r,'blip')){if(runs.length){blocks.push({runs:runs.splice(0),size:heading?26-Number(heading[1])*2:12});}const data=await zipImage(zip,rels.get(attribute(image,'embed')));if(data)blocks.push({image:data});}
  }
  if(runs.length)blocks.push({runs,size:heading?26-Number(heading[1])*2:12,align:attribute(first(first(p,'pPr')||p,'jc'),'val')});
  if(all(p,'br').some(b=>attribute(b,'type')==='page'))blocks.push({break:true});
 }
 return blocks;
}
async function epubBlocks(zip){
 const container=await readXml(zip,'META-INF/container.xml'),root=first(container,'rootfile')?.getAttribute('full-path');if(!root)throw Error('EPUB has no package document.');
 const opf=await readXml(zip,root),manifest=new Map(all(opf,'item').map(i=>[i.getAttribute('id'),pathFrom(root,i.getAttribute('href'))])),blocks=[];
 async function walk(node,part,runs,style={}){
  if(node.nodeType===3){runs.push({text:node.nodeValue.replace(/\s+/g,' '),...style});return;}
  if(node.nodeType!==1||['script','style','iframe','object','audio','video'].includes(node.localName))return;
  const tag=node.localName.toLowerCase();if(tag==='img'){if(runs.length)blocks.push({runs:runs.splice(0)});const data=await zipImage(zip,pathFrom(part,node.getAttribute('src')));if(data)blocks.push({image:data});return;}
  if(tag==='br'){runs.push({text:'\n',...style});return;}
  const block=/^(p|div|section|h[1-6]|li|pre|tr)$/.test(tag),heading=tag.match(/^h([1-6])$/);if(block&&runs.length)blocks.push({runs:runs.splice(0)});
  const next={...style,bold:style.bold||!!heading||['b','strong'].includes(tag),italic:style.italic||['i','em'].includes(tag)};
  if(tag==='li')runs.push({text:'• '});for(const child of node.childNodes)await walk(child,part,runs,next);
  if(block&&runs.length)blocks.push({runs:runs.splice(0),size:heading?26-Number(heading[1])*2:12});
 }
 for(const ref of all(opf,'itemref')){const part=manifest.get(ref.getAttribute('idref'));if(!part||ref.getAttribute('linear')==='no')continue;const d=await readXml(zip,part),runs=[];await walk(first(d,'body')||d.documentElement,part,runs);if(runs.length)blocks.push({runs});blocks.push({break:true});}
 return blocks;
}
async function flowPdf(blocks){
 const {PDFDocument,StandardFonts,rgb}=globalThis.PDFLib,doc=await PDFDocument.create(),fonts=new Map();let page,y=790;
 const newPage=()=>{page=doc.addPage([595,842]);y=790;};newPage();
 const color=hex=>{const n=parseInt((hex||'#172033').slice(1),16);return rgb((n>>16&255)/255,(n>>8&255)/255,(n&255)/255);};
 async function fontFor(run){const name=StandardFonts[standardTextFont(run)];if(!fonts.has(name))fonts.set(name,await doc.embedFont(name));return fonts.get(name);}
 async function measure(text,run,size){const font=await fontFor(run);try{return {width:font.widthOfTextAtSize(text,size),font};}catch{const c=document.createElement('canvas'),ctx=c.getContext('2d');ctx.font=`${run.italic?'italic ':''}${run.bold?'bold ':''}${size*2}px ${run.pdfFontFamily==='Times'?'serif':run.pdfFontFamily==='Courier'?'monospace':'sans-serif'}`;return {width:ctx.measureText(text).width/2,ctx,canvas:c};}}
 for(const block of blocks){
  if(block.break){if(y<790)newPage();continue;}
  if(block.image){const image=await doc.embedPng(block.image.bytes),scale=Math.min(499/image.width,650/image.height,1),w=image.width*scale,h=image.height*scale;if(y-h<48)newPage();page.drawImage(image,{x:48,y:y-h,width:w,height:h});y-=h+12;continue;}
  const lines=[[]],max=499-(block.indent||0);let width=0;
  for(const run of block.runs||[]){const size=Math.max(6,Math.min(72,run.size||block.size||12));for(const word of run.text.replace(/\t/g,'    ').split(/(\s+)/).filter(Boolean)){
   if(word.includes('\n')){lines.push([]);width=0;continue;}
   const unit=await measure(word,run,size);let chunks=[word];if(unit.width>max)chunks=[...word];
   for(const chunk of chunks){const item=chunk===word?unit:await measure(chunk,run,size);if(width+item.width>max&&lines.at(-1).length){lines.push([]);width=0;}if(!width&&!chunk.trim())continue;lines.at(-1).push({...item,text:chunk,size,run});width+=item.width;}
  }}
  for(const line of lines){const height=Math.max(block.size||12,...line.map(t=>t.size))*1.4;if(y-height<48)newPage();const total=line.reduce((n,t)=>n+t.width,0);let x=48+(block.indent||0)+(block.align==='center'?(max-total)/2:block.align==='right'?max-total:0);
   for(const t of line){if(t.font)page.drawText(t.text,{x,y:y-t.size,size:t.size,font:t.font,color:color(t.run.color)});else{const c=t.canvas;c.width=Math.max(1,Math.ceil(t.width*2+4));c.height=Math.ceil(t.size*3);const ctx=c.getContext('2d');ctx.font=`${t.run.italic?'italic ':''}${t.run.bold?'bold ':''}${t.size*2}px ${t.run.pdfFontFamily==='Times'?'serif':t.run.pdfFontFamily==='Courier'?'monospace':'sans-serif'}`;ctx.fillStyle=t.run.color||'#172033';ctx.fillText(t.text,0,t.size*2);const data=c.toDataURL().split(',')[1],image=await doc.embedPng(Uint8Array.from(atob(data),n=>n.charCodeAt(0)));page.drawImage(image,{x,y:y-t.size*1.5,width:c.width/2,height:c.height/2});}x+=t.width;}y-=height;
  }y-=block.after??8;
 }
 // Avoid a trailing empty page after the last chapter/page break.
 if(doc.getPageCount()>1&&y===790)doc.removePage(doc.getPageCount()-1);return doc;
}
async function pptxPdf(zip){
 const {PDFDocument,rgb,degrees}=globalThis.PDFLib,doc=await PDFDocument.create(),part='ppt/presentation.xml',d=await readXml(zip,part),rels=await relationships(zip,part),sz=first(d,'sldSz'),w=(Number(sz?.getAttribute('cx'))||9144000)/12700,h=(Number(sz?.getAttribute('cy'))||6858000)/12700;
 for(const id of all(d,'sldId')){
  const path=rels.get([...id.attributes].find(a=>a.localName==='id'&&a.namespaceURI?.includes('relationships'))?.value);if(!path)throw Error('A PowerPoint slide relationship is missing.');const slide=await readXml(zip,path),slideRels=await relationships(zip,path),canvas=document.createElement('canvas');const factor=Math.min(2,4096/Math.max(w,h));canvas.width=Math.ceil(w*factor);canvas.height=Math.ceil(h*factor);const ctx=canvas.getContext('2d');ctx.scale(factor,factor);ctx.fillStyle=hex(first(first(slide,'bg'),'srgbClr')?.getAttribute('val'),'#ffffff');ctx.fillRect(0,0,w,h);
  const layoutPath=[...slideRels.values()].find(p=>p.includes('slideLayouts/'));const layout=layoutPath&&zip.file(layoutPath)?await readXml(zip,layoutPath):null;
  const layoutRels=layoutPath?await relationships(zip,layoutPath):new Map(),masterPath=[...layoutRels.values()].find(p=>p.includes('slideMasters/'));const master=masterPath&&zip.file(masterPath)?await readXml(zip,masterPath):null;
  const inherited=(shape)=>{const ph=first(shape,'ph');if(!ph)return null;for(const parent of [layout,master]){if(!parent)continue;const match=all(parent,'sp').find(n=>{const candidate=first(n,'ph');return candidate&&((ph.getAttribute('idx')&&candidate.getAttribute('idx')===ph.getAttribute('idx'))||(!ph.getAttribute('idx')&&(candidate.getAttribute('type')||'body')===(ph.getAttribute('type')||'body')));});const tx=match&&first(match,'xfrm');if(tx)return tx;}return null;};
  let fallbackIndex=0;const tree=first(slide,'spTree');if(!tree)throw Error('A PowerPoint slide has no content tree.');
  for(const shape of tree.children){if(!['sp','pic','graphicFrame'].includes(shape.localName))continue;const tx=first(shape,'xfrm')||inherited(shape),off=tx&&first(tx,'off'),ext=tx&&first(tx,'ext');const x=off?Number(off.getAttribute('x')||0)/12700:36,y=off?Number(off.getAttribute('y')||0)/12700:36+fallbackIndex*90,sw=Number(ext?.getAttribute('cx')||0)/12700||w-72,sh=Number(ext?.getAttribute('cy')||0)/12700||100;
   fallbackIndex++;ctx.save();const angle=Number(tx?.getAttribute('rot')||0)/60000;if(angle){ctx.translate(x+sw/2,y+sh/2);ctx.rotate(angle*Math.PI/180);ctx.translate(-x-sw/2,-y-sh/2);}
   if(shape.localName==='pic'){const image=await zipImage(zip,slideRels.get(attribute(first(shape,'blip'),'embed')));if(image){const url=URL.createObjectURL(new Blob([image.bytes],{type:'image/png'})),img=new Image();try{img.src=url;await img.decode();ctx.drawImage(img,x,y,sw,sh);}finally{URL.revokeObjectURL(url);}}}
   else{const props=first(shape,'spPr'),fill=props&&[...props.children].find(n=>n.localName==='solidFill'),fillColor=fill&&first(fill,'srgbClr');if(fillColor){ctx.fillStyle=hex(fillColor.getAttribute('val'));ctx.fillRect(x,y,sw,sh);}let baseline=y+4;
    for(const p of all(shape,'p')){const runs=all(p,'r'),text=runs.map(r=>first(r,'t')?.textContent||'').join('')||all(p,'t').map(t=>t.textContent).join('');if(!text)continue;const props=first(runs[0]||p,'rPr')||first(p,'defRPr'),size=Math.max(8,Number(props?.getAttribute('sz')||1800)/100),bold=props?.getAttribute('b')==='1',italic=props?.getAttribute('i')==='1';ctx.font=`${italic?'italic ':''}${bold?'bold ':''}${size}px ${fontFamily(first(props||p,'latin')?.getAttribute('typeface'))==='Times'?'serif':'sans-serif'}`;ctx.fillStyle=hex(first(props||p,'srgbClr')?.getAttribute('val'));const words=text.split(/\s+/);let line='';for(const word of words){if(line&&ctx.measureText(line+' '+word).width>sw-8){baseline+=size*1.25;ctx.fillText(line,x+4,baseline);line='';}line+=(line?' ':'')+word;}if(line){baseline+=size*1.25;ctx.fillText(line,x+4,baseline);}}
   }ctx.restore();
  }
  const image=await doc.embedPng(Uint8Array.from(atob(canvas.toDataURL().split(',')[1]),c=>c.charCodeAt(0))),page=doc.addPage([w,h]);page.drawImage(image,{x:0,y:0,width:w,height:h});
 }
 if(!doc.getPageCount())throw Error('No slides found in this PowerPoint file.');return doc;
}
export async function convertToPdf(file){
 if(!file)throw Error('Choose a file to open.');const ext=file.name.split('.').pop().toLowerCase();
 if(ext==='pdf'||file.type==='application/pdf')return {file:ext==='pdf'?file:new File([file],file.name+'.pdf',{type:'application/pdf'}),converted:false};
 if(file.size>LIMIT)throw Error('Choose a file smaller than 50 MB.');
 let doc,notice='';const {PDFDocument}=globalThis.PDFLib;
 if(IMAGE_TYPES[ext]||file.type.startsWith('image/')){const image=await imageData(new Blob([file],{type:IMAGE_TYPES[ext]||file.type})),pdf=await PDFDocument.create(),embedded=await pdf.embedPng(image.bytes),scale=Math.min(1,14400/Math.max(image.width,image.height));pdf.addPage([image.width*scale,image.height*scale]).drawImage(embedded,{x:0,y:0,width:image.width*scale,height:image.height*scale});doc=pdf;notice='Images become PDF pages. Animated images use their first frame.';}
 else if(['md','markdown','txt'].includes(ext)){doc=await flowPdf(markdownBlocks(await file.text(),ext==='txt'));notice='Text is laid out for PDF. Linked images are not fetched.';}
 else if(['docx','epub','pptx'].includes(ext)){const zip=await archive(file);doc=ext==='pptx'?await pptxPdf(zip):await flowPdf(await(ext==='docx'?docxBlocks(zip):epubBlocks(zip)));notice=ext==='pptx'?'Slides become page images. Complex layouts, themes, charts, and animations may differ.':'Document text and embedded images are reflowed. Complex layouts and styling may differ.';}
 else throw Error('Unsupported format. Choose PDF, DOCX, PPTX, EPUB, Markdown, TXT, or an image. Older DOC/PPT and encrypted ebooks are not supported.');
 return {file:new File([await doc.save()],file.name.replace(/\.[^.]+$/, '')+'.pdf',{type:'application/pdf'}),converted:true,notice};
}
export async function prepareFiles(files,onProgress=()=>{}){
 const list=[...files];if(!list.length)return null;if(list.length>20)throw Error('Choose up to 20 files at once.');if(list.length>1&&list.reduce((sum,f)=>sum+f.size,0)>ZIP_LIMIT)throw Error('Choose files totaling less than 100 MB.');const results=[];
 for(const file of list){onProgress(file.name);results.push(await convertToPdf(file));}
 if(results.length===1)return {...results[0],originalName:list[0].name};
 const doc=await globalThis.PDFLib.PDFDocument.create();for(const result of results){const part=await globalThis.PDFLib.PDFDocument.load(await result.file.arrayBuffer());for(const page of await doc.copyPages(part,part.getPageIndices()))doc.addPage(page);}
 return {file:new File([await doc.save()],'combined.pdf',{type:'application/pdf'}),originalName:'combined.pdf',converted:results.some(r=>r.converted),notice:[...new Set(results.map(r=>r.notice).filter(Boolean))].join('\n')};
}
