// Page folios are generated text. Reading order is independent of stacking.
export function refreshPageNumbers(doc){
 doc.pages.forEach((page,index)=>{for(const object of page.objects){const story=object.type==='text'&&doc.stories[object.storyId];if(!story?.pageNumberFormat)continue;
  if(story.pageNumberValue!==undefined&&story.text!==story.pageNumberValue){delete story.pageNumberFormat;delete story.pageNumberValue;continue;}
  const previous=story.text.length,text=story.pageNumberFormat.replaceAll('{page}',String(index+1)).replaceAll('{total}',String(doc.pages.length));
  if(story.text!==text){story.text=text;for(const key of ['marks','paragraphs'])if(story[key])story[key]=story[key].map(range=>({...range,from:Math.min(range.from,text.length),to:range.to===previous?text.length:Math.min(range.to,text.length)})).filter(range=>range.to>range.from||key==='paragraphs');}
  story.pageNumberValue=text;
 }});
}
export const readingObjects=page=>page.objects.filter(o=>['text','image','table'].includes(o.type)).sort((a,b)=>(a.readingOrder??a.y*10000+a.x)-(b.readingOrder??b.y*10000+b.x));
export function moveReadingObject(page,id,delta){const list=readingObjects(page),index=list.findIndex(o=>o.id===id),target=Math.max(0,Math.min(list.length-1,index+delta));if(index<0||index===target)return false;const [object]=list.splice(index,1);list.splice(target,0,object);list.forEach((o,i)=>o.readingOrder=i);return true;}
