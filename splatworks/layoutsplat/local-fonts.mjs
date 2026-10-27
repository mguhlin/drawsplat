import { uid } from './engine.mjs';
import { readData } from './media.mjs';
const loaded=new Map();
export const fontCategory=(doc,id)=>doc.customFonts?.[id]?.category|| (id==='Georgia'?'serif':'sans-serif');
export const fontName=(doc,id)=>doc.customFonts?.[id]?.family||id;
export async function loadProjectFonts(doc){
  if(Object.values(doc.stories).some(s=>s.style.font==='Comic Neue'||s.marks?.some(m=>m.font==='Comic Neue')))await Promise.all([400,700].map(weight=>document.fonts.load(`${weight} 12px "Comic Neue"`)));
  for(const[id,item]of loaded)if(!Object.hasOwn(doc.customFonts||{},id)){document.fonts.delete(item.face);loaded.delete(id);}
  for(const [id,font]of Object.entries(doc.customFonts||{})){
    if(loaded.get(id)?.src===font.src)continue;
    const face=new FontFace(id,`url("${font.src}")`,{weight:String(font.weight||400),style:font.italic?'italic':'normal'});await face.load();if(loaded.has(id))document.fonts.delete(loaded.get(id).face);document.fonts.add(face);loaded.set(id,{src:font.src,face});
  }
}
export function fontNames(bytes){
  const view=new DataView(bytes), tag=new TextDecoder().decode(new Uint8Array(bytes).slice(0,4)), result={};if(tag!=='OTTO'&&view.getUint32(0)!==0x00010000)return result;
  const count=view.getUint16(4);if(count>256||12+count*16>bytes.byteLength)return result;
  for(let i=0;i<count;i++){
    const table=12+i*16,type=new TextDecoder().decode(new Uint8Array(bytes,table,4)),offset=view.getUint32(table+8),length=view.getUint32(table+12);if(offset+length>bytes.byteLength)continue;
    if(type==='OS/2'&&length>=64){result.weight=Math.max(100,Math.min(900,Math.round(view.getUint16(offset+4)/100)*100));result.italic=!!(view.getUint16(offset+62)&1);}
    if(type==='name'&&length>=6){const records=view.getUint16(offset+2),strings=offset+view.getUint16(offset+4);if(6+records*12>length)continue;let preferred=false;
      for(let j=0;j<records;j++){const r=offset+6+j*12,platform=view.getUint16(r),nameId=view.getUint16(r+6),n=view.getUint16(r+8),at=strings+view.getUint16(r+10);if(![0,3].includes(platform)||![1,6,16].includes(nameId)||at+n>offset+length||n>400)continue;const family=new TextDecoder('utf-16be').decode(new Uint8Array(bytes,at,n)).replace(/\0/g,'').trim();if(nameId===6){result.postscript=family;continue;}if(family&&(!result.family||nameId===16&&!preferred)){result.family=family;preferred=nameId===16;}}
    }
  }return result;
}
export async function importFont(file,doc){
  if(!file.size||file.size>16000000)throw Error('Choose a TTF, OTF, WOFF, or WOFF2 font smaller than 16 MB.');
  if(Object.keys(doc.customFonts||{}).length>=16)throw Error('A publication can embed up to 16 font files.');
  const bytes=await file.arrayBuffer();if(bytes.byteLength<12)throw Error('Invalid font file.');const signature=new DataView(bytes).getUint32(0),kind=signature===0x00010000?'ttf':({0x4f54544f:'otf',0x774f4646:'woff',0x774f4632:'woff2'})[signature];if(!kind)throw Error('Unsupported font signature. Use TTF, OTF, WOFF, or WOFF2.');
  const info=fontNames(bytes),id=`LayoutSplatFont-${uid()}`,font={name:file.name.slice(0,200),family:info.family||file.name.replace(/\.[^.]+$/,'').slice(0,200),format:kind,category:/serif|times|georgia|garamond|cambria|baskerville/i.test(info.family||file.name)&&!/sans/i.test(info.family||file.name)?'serif':'sans-serif',weight:info.weight||400,italic:!!info.italic,src:await readData(new Blob([bytes],{type:`font/${kind}`}))};
  if(Object.values(doc.customFonts||{}).reduce((n,f)=>n+f.src.length,0)+font.src.length>88000000)throw Error('Embedded fonts are limited to 64 MB per project.');
  const face=new FontFace(id,bytes,{weight:String(font.weight),style:font.italic?'italic':'normal'});await face.load();document.fonts.add(face);loaded.set(id,{src:font.src,face});return {id,font};
}
export function setupFontTools(api){
  const $=id=>document.getElementById(id);document.body.insertAdjacentHTML('beforeend','<input id="localFontInput" type="file" accept=".ttf,.otf,.woff,.woff2" hidden>');
  $('localFontInput').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{const result=await importFont(file,api.getDoc());api.mutate(()=>{const d=api.getDoc();(d.customFonts||={})[result.id]=result.font;const o=api.getSelectedObject();if(o?.type==='text'&&!o.locked){d.stories[o.storyId].style.font=result.id;for(const mark of d.stories[o.storyId].marks||[])delete mark.font;}});}catch(e){api.showReport([e.message]);}};
  $('propFontCategory').onchange=()=>{const d=api.getDoc(),o=api.getSelectedObject();if(o?.type!=='text'||o.locked)return;const category=$('propFontCategory').value,font=['Arial','Georgia','Verdana','Comic Neue',...Object.keys(d.customFonts||{})].find(id=>fontCategory(d,id)===category);if(font)api.mutate(()=>{d.stories[o.storyId].style.font=font;for(const mark of d.stories[o.storyId].marks||[])delete mark.font;});};
  return {open(){ $('localFontInput').click(); },render(){const d=api.getDoc(),o=api.getSelectedObject(),selected=o?.type==='text'?d.stories[o.storyId].style.font:'Arial';$('propFont').replaceChildren(...['Arial','Georgia','Verdana','Comic Neue',...Object.keys(d.customFonts||{})].map(id=>new Option(`${fontName(d,id)} · ${api.t(fontCategory(d,id)==='serif'?'serif':'sansSerif')}`,id)));$('propFont').value=selected;$('propFontCategory').value=fontCategory(d,selected);}};
}
