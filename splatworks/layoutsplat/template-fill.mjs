import {LOREM} from './template-copy.mjs';
import {createMeasurer,layoutStories} from './layout.mjs';
const fitted=new Map();let measurer;
globalThis.document?.fonts?.addEventListener('loadingdone',()=>fitted.clear());
export function fillTemplateFrames(doc){
 if(!globalThis.document?.body)return doc;
 const objects=new Map(doc.pages.flatMap(p=>p.objects).map(o=>[o.id,o]));
 for(const [id,story] of Object.entries(doc.stories)){
  const at=story.text.indexOf('Lorem ipsum');if(at<0)continue;const frames=story.frames.map(id=>objects.get(id)).filter(Boolean);
  if(!frames.length||frames.some(f=>f.readingHeading)||frames.every(f=>f.h<story.style.size*3))continue;
  const font=`${story.style.italic?'italic ':''}${story.style.weight==='bold'?700:400} 12px "${story.style.font}"`;if(!document.fonts.check(font))continue;
  const prefix=story.text.slice(0,at),wraps=doc.pages.flatMap(p=>p.objects.filter(o=>o.type==='image'&&o.wrap)),key=JSON.stringify([prefix,story.style,doc.language,doc.margin,doc.guides.baseline,frames.map(f=>{const {id,storyId,...geometry}=f;return geometry;}),wraps]);
  if(fitted.has(key)){story.text=fitted.get(key);story.marks=(story.marks||[]).filter(m=>m.to<=prefix.length);delete story.paragraphs;continue;}
  const candidate=prefix+(LOREM+' ').repeat(250),probe={...story,text:candidate,style:{...story.style,autoFit:'none'},marks:(story.marks||[]).filter(m=>m.to<=prefix.length)};
  measurer||=createMeasurer();const testDoc={...doc,stories:{[id]:probe},masters:[]},layout=layoutStories(testDoc,measurer,measurer,false),end=Math.max(0,...story.frames.map(fid=>layout.fragments.get(fid)?.end||0));
  if(end>=prefix.length){story.text=candidate.slice(0,end).trimEnd();story.marks=probe.marks;delete story.paragraphs;if(fitted.size>1800)fitted.clear();fitted.set(key,story.text);}
 }
 return doc;
}
export async function prepareTemplate(doc){
 const fonts=[...new Set(Object.values(doc.stories).filter(s=>s.text.includes('Lorem ipsum')).map(s=>`${s.style.italic?'italic ':''}${s.style.weight==='bold'?700:400} 12px "${s.style.font}"`))];
 await Promise.all(fonts.map(font=>document.fonts.load(font)));return fillTemplateFrames(doc);
}
