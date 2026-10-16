import {pageObjects} from './presentation-model.mjs';
import {pageContext} from './publication-fields.mjs';
import {publisherContainer,finishPublisher,wmfBitmap} from './publisher-binary.mjs';
import {pageCanvas} from './exports.mjs';
// Write on-device; native text/shapes plus per-object WMF bitmap fallbacks.
export async function exportPublisher(doc,layout,options={}){
 const warnings=new Set(['Experimental Publisher 2000 binary export. Supported text and basic rectangles/ellipses/lines are native editable objects; verify the file in your Publisher version before production use. Microsoft Publisher itself has not been tested here.','Masters are copied onto pages; linked stories and columns become independent visible text fragments. Fonts are named, not embedded. Text metrics, paragraph composition and line widths may differ. The embedded LayoutSplat copy preserves the full publication when the native Publisher streams are unchanged.']);
 const warn=s=>warnings.add(s),pages=[],ppi=options.ppi||150;
 let pixelBytes=0;
 for(const [i,page]of doc.pages.entries()){
  options.onProgress?.(i+1,doc.pages.length);const objects=pageObjects(doc,page,layout,0,warn),out=[];
  for(const object of objects){
   const original=[...page.objects,...(doc.masters?.find(m=>m.id===page.masterId)?.objects||[])].find(o=>`${o.type} ${o.id}`===object.name.replace(/ column \d+$/,''));
   const supportedText=(object.opacity??1)===1&&object.type==='text'&&!object.paragraphs.some(p=>p.direction==='rtl')&&(!doc.stories[original?.storyId]?.style.wordArt||doc.stories[original?.storyId]?.style.wordArt==='none')&&!doc.stories[original?.storyId]?.style.dropCap;
   const supportedShape=object.type==='shape'&&['rect','ellipse','line'].includes(object.kind)&&!object.path&&!object.gradient&&(object.opacity??1)===1&&!object.strokeDash;
   if(supportedText||supportedShape){out.push(object);continue;}
   // Render each original once: columns in a decorative text box share its picture.
   if(!original||out.some(o=>o.rasterSource===original.id))continue;
   const context=pageContext(doc,page,layout),rasterDoc={...context.doc,width:original.w,height:original.h},rasterPage={objects:[{...original,x:0,y:0,rotation:0}]};
   const canvas=await pageCanvas(rasterDoc,rasterPage,context.layout,ppi,0,'#ffffff');
   try{
    const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);pixelBytes+=data.width*data.height*3;
    if(pixelBytes>24000000)throw Error('Publisher pictures exceed 24 MB. Choose a lower resolution or fewer picture-heavy pages.');
    out.push({...original,bitmap:wmfBitmap(data),rasterSource:original.id});
   }finally{canvas.width=canvas.height=1;}
   warn(`Page ${i+1}, ${object.name}: ${object.type} or advanced effect becomes a picture on a white background. Its internal content is retained in the embedded LayoutSplat copy.`);
  }
  pages.push(out);
 }
 if(options.pages?.length!==undefined&&(options.pages.length!==doc.pages.length||options.pages.some((p,i)=>p!==i)))warn('PUB contains the entire publication. The page-range setting applies to visual exports.');
 if(options.bleed||options.cropMarks||options.profile)warn('PUB uses trim dimensions. Bleed, crop marks and printer profiles are PDF preparation settings.');
 if(layout.overflows?.length)warn('Overflowing text is retained in the embedded LayoutSplat copy but is not visible in native Publisher frames.');
 const report=[...warnings],bytes=await finishPublisher(publisherContainer(doc.width,doc.height,pages),doc,report);
 return {blob:new Blob([bytes],{type:'application/x-mspublisher'}),extension:'.pub',warnings:report};
}
