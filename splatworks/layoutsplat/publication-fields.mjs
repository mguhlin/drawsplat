// Page folios are generated text. Reading order is independent of stacking.
export function pageNumberStory(story,index,total){
 const text=story.pageNumberFormat.replaceAll('{page}',String(index+1)).replaceAll('{total}',String(total)),previous=story.text.length;
 return {...story,text,pageNumberValue:text,...Object.fromEntries(['marks','paragraphs'].filter(key=>story[key]).map(key=>[key,story[key].map(range=>({...range,from:Math.min(range.from,text.length),to:range.to===previous?text.length:Math.min(range.to,text.length)})).filter(range=>range.to>range.from||key==='paragraphs')]))};
}
// Master templates stay unchanged; every rendered page receives its own field values.
export function masterPageStories(doc,page){
 const master=doc.masters?.find(m=>m.id===page.masterId),stories={};
 for(const object of master?.objects||[]){const story=doc.stories[object.storyId];if(story?.pageNumberFormat&&!page.masterOverrides?.includes(object.id))stories[object.storyId]=pageNumberStory(story,doc.pages.indexOf(page),doc.pages.length);}
 return stories;
}
export function pageContext(doc,page,layout){return layout.pageViews?.get(page.id)||{doc,layout};}
export function refreshPageNumbers(doc){
 doc.pages.forEach((page,index)=>{for(const object of page.objects){const story=object.type==='text'&&doc.stories[object.storyId];if(!story?.pageNumberFormat)continue;
  if(story.pageNumberValue!==undefined&&story.text!==story.pageNumberValue){delete story.pageNumberFormat;delete story.pageNumberValue;continue;}
  Object.assign(story,pageNumberStory(story,index,doc.pages.length));
 }});
}
export const readingObjects=page=>page.objects.filter(o=>['text','image','table'].includes(o.type)).sort((a,b)=>(a.readingOrder??a.y*10000+a.x)-(b.readingOrder??b.y*10000+b.x));
export function moveReadingObject(page,id,delta){const list=readingObjects(page),index=list.findIndex(o=>o.id===id),target=Math.max(0,Math.min(list.length-1,index+delta));if(index<0||index===target)return false;const [object]=list.splice(index,1);list.splice(target,0,object);list.forEach((o,i)=>o.readingOrder=i);return true;}
