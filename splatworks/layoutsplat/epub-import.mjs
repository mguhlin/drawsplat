import {newPublication,uid,frame,textStyle,validatePublication} from './engine.mjs';
import {readZip} from './desktop-formats.mjs';
import {officeHtmlToStory} from './office-story.mjs';
import {createMeasurer,layoutStories,applyTextStyle} from './layout.mjs';
import {appendRich} from './rich.mjs';
import {importMedia} from './media.mjs';
import {captureBookSource} from './ebook-source.mjs';
const elements=(node,name)=>[...node.getElementsByTagNameNS('*',name)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function parse(source){
 if(source.length>8000000||/<!ENTITY|<!DOCTYPE[^>]*\[/i.test(source))throw Error('EPUB XML is too large or contains unsupported entity declarations.');
 source=source.replace(/<!DOCTYPE[^>]*>/gi,'').replace(/&([a-z][a-z\d]+);/gi,(match,name)=>{if(['amp','lt','gt','quot','apos'].includes(name))return match;const el=document.createElement('textarea');el.innerHTML=match;return el.value===match?match:[...el.value].map(c=>'&#'+c.codePointAt(0)+';').join('');});
 const doc=new DOMParser().parseFromString(source,'application/xml');if(doc.querySelector('parsererror'))throw Error('The EPUB contains invalid XML/XHTML.');if(doc.getElementsByTagName('*').length>50000)throw Error('An EPUB component exceeds 50,000 elements.');return doc;
}
export function epubPath(base,href){
 if(typeof href!=='string'||!href||/^[a-z][a-z\d+.-]*:|^\/\/|[\\\0]/i.test(href))return null;
 try{const url=new URL(href,'https://epub.invalid/'+base);if(url.origin!=='https://epub.invalid')return null;const path=decodeURIComponent(url.pathname.slice(1));return /(^|\/)\.\.(\/|$)|[\\\0]/.test(path)?null:path;}catch{return null;}
}
const supportedCSS=['font-family','font-size','font-weight','font-style','color','text-decoration','text-align','line-height','margin-top','margin-bottom','margin-left','margin-right','text-indent','direction'];
function safeStyle(source){const out=document.createElement('span');out.setAttribute('style',source||'');return supportedCSS.map(key=>{const value=out.style.getPropertyValue(key);return value&&!/url\s*\(|expression|var\(/i.test(value)?key+':'+value:'';}).filter(Boolean).join(';');}
function rulesFrom(css,warnings){
 if(css.length>2000000)throw Error('An EPUB stylesheet exceeds 2 MB.');
 if(/@import|@font-face|url\s*\(/i.test(css))warnings.add('Embedded fonts, CSS imports and background images are not loaded. Supported text styling and packaged inline pictures are retained.');
 const sheet=new CSSStyleSheet();sheet.replaceSync(css.replace(/@import[^;]*;/gi,''));
 const out=[];for(const rule of sheet.cssRules)if(rule.selectorText&&rule.style)out.push({selector:rule.selectorText,style:safeStyle(rule.style.cssText)});if(out.length>2000)throw Error('An EPUB stylesheet exceeds 2,000 rules.');return out;
}
export async function importEpub(file,{signal,onProgress=()=>{}}={}){
 if(!file.size||file.size>96000000)throw Error('Choose an EPUB under 96 MB.');
 const zip=await readZip(file),warnings=new Set(['EPUB chapters are imported in spine order as editable text and packaged pictures. Source typography and page breaks may change. Scripts, remote resources, embedded fonts and audio/video playback are not imported. Internal link labels remain text; external HTTP(S)/email links remain usable.']);
 for(const entry of Object.values(zip.files))if(/(^|\/)\.\.(\/|$)|\\|\0/.test(entry.unsafeOriginalName||entry.name))throw Error('EPUB contains an unsafe archive path.');
 const read=async(path,max=8000000)=>{signal?.throwIfAborted();const entry=path&&zip.file(path);if(!entry||entry._data?.uncompressedSize>max)throw Error('Missing or oversized EPUB resource: '+(path||'unknown'));const text=await entry.async('string');if(text.length>max)throw Error('EPUB resource exceeds its size limit.');return text;};
 if((await read('mimetype',100)).trim()!=='application/epub+zip')throw Error('This archive is not an EPUB.');
 const container=parse(await read('META-INF/container.xml')),root=elements(container,'rootfile').find(e=>e.getAttribute('media-type')==='application/oebps-package+xml')||elements(container,'rootfile')[0],opfPath=epubPath('',root?.getAttribute('full-path'));
 if(!opfPath)throw Error('EPUB has no local package document.');const opf=parse(await read(opfPath));
 const manifest=new Map(elements(opf,'item').map(el=>[el.getAttribute('id'),{path:epubPath(opfPath,el.getAttribute('href')),type:el.getAttribute('media-type'),properties:el.getAttribute('properties')||''}]));
 const allSpine=elements(opf,'itemref').map(e=>({...manifest.get(e.getAttribute('idref')),linear:e.getAttribute('linear')!=='no'})),spine=allSpine.filter(e=>e.linear);if(!spine.length||spine.length>500||spine.some(e=>!e?.path))throw Error('EPUB needs a valid local spine of 1–500 chapters.');
 if(zip.file('META-INF/encryption.xml')){const encrypted=parse(await read('META-INF/encryption.xml'));if(elements(encrypted,'CipherReference').some(e=>!manifest.size||! /\.(otf|ttf|woff2?)(?:$|\?)/i.test(e.getAttribute('URI')||'')))throw Error('Encrypted or DRM-protected EPUB content cannot be imported.');warnings.add('Protected/obfuscated fonts were skipped.');}
 const d=newPublication(true);d.pages=[];d.width=432;d.height=648;d.margin=36;d.guides.columns=1;d.publicationType='ebook';d.title=(elements(opf,'title')[0]?.textContent.trim()||file.name.replace(/\.epub$/i,'')).slice(0,200);const lang=elements(opf,'language')[0]?.textContent.trim()||'en';d.language=lang;d.ebookMetadata={language:/^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*$/.test(lang)?lang:'en',...Object.fromEntries(['creator','publisher','description','rights'].map(k=>[k==='creator'?'author':k,(elements(opf,k)[0]?.textContent||'').slice(0,k==='description'?4000:500)]))};
 const fixed=elements(opf,'meta').some(e=>e.getAttribute('property')==='rendition:layout'&&e.textContent.trim()==='pre-paginated');if(fixed)warnings.add('Fixed-layout source text is repaginated. Single-picture pages retain their page appearance.');
 let p,y=36,totalText=0,decodedBytes=0,styleWork=0;const measurer=createMeasurer(),assets=new Map();
 const page=()=>{if(d.pages.length>=500)throw Error('EPUB import exceeds 500 publication pages.');p={id:uid(),objects:[]};d.pages.push(p);y=d.margin;return p;};
 const ensure=height=>{if(!p||p.objects.length>=190||y+height>d.height-d.margin)page();};
 async function text(html,heading=0,rtl=false){
  const value=officeHtmlToStory(html);if(!value.text.trim())return;totalText+=value.text.length;if(totalText>2000000)throw Error('EPUB text exceeds two million characters.');ensure(heading?72:48);
  const key=uid(),story={...value,style:{...textStyle(),...value.style,direction:rtl?'rtl':'ltr'},frames:[]};delete story.fonts;delete story.substitutedFonts;d.stories[key]=story;
  const firstPage=d.pages.length-1;let last,previous=-1;
  while(true){signal?.throwIfAborted();last=frame(key,d.margin,y,d.width-2*d.margin,d.height-d.margin-y);last.padding=0;if(heading)last.readingHeading=heading;p.objects.push(last);story.frames.push(last.id);const currentStoryDoc={...d,masters:[],stories:{[key]:story},pages:d.pages.slice(firstPage).map(page=>({...page,objects:page.objects.filter(o=>o.storyId===key)}))},layout=layoutStories(currentStoryDoc,measurer),overflow=layout.overflows.find(o=>o.storyId===key),fragment=layout.fragments.get(last.id);
   if(!overflow){applyTextStyle(measurer,story.style);measurer.style.width=last.w+'pt';measurer.replaceChildren();appendRich(measurer,story,fragment.start,fragment.end,{first:fragment.start===0,style:story.style});last.h=Math.min(last.h,Math.max(6,measurer.getBoundingClientRect().height*.75+2));y=last.y+last.h+12;break;}
   if(fragment.end===previous)throw Error('An EPUB text block cannot fit the publication page.');previous=fragment.end;page();
  }
 }
 async function image(path,alt='',whole=false){
  if(!path){warnings.add('A remote or invalid picture was skipped; no network resource was fetched.');return;}
  if(!assets.has(path)){const entry=zip.file(path);if(!entry){warnings.add('Missing packaged picture: '+path);return;}if(entry._data?.uncompressedSize>16000000||assets.size>=500)throw Error('EPUB pictures exceed import limits.');try{const asset=await importMedia(new File([await entry.async('uint8array')],path.split('/').at(-1)),{signal});delete asset.notes;asset.alt=alt.slice(0,2000);decodedBytes+=asset.src.length;if(decodedBytes>128000000)throw new RangeError('Decoded EPUB pictures exceed 128 MB.');const key=uid();d.assets[key]=asset;assets.set(path,key);}catch(error){if(signal?.aborted||error instanceof RangeError)throw error;warnings.add('Could not decode packaged picture: '+path);return;}}
  const key=assets.get(path),asset=d.assets[key],width=whole?d.width:d.width-2*d.margin,height=whole?d.height:Math.min(d.height-2*d.margin,width*asset.height/asset.width);if(!whole)ensure(height);else if(!p||p.objects.length)page();
  p.objects.push({id:uid(),type:'image',assetId:key,x:whole?0:d.margin,y:whole?0:y,w:width,h:height,rotation:0,fit:'contain',locked:false});y=whole?d.height:y+height+12;
 }
 try{
  await document.fonts.ready;
  for(const[index,item]of spine.entries()){
   signal?.throwIfAborted();onProgress(`Importing ebook chapter ${index+1} of ${spine.length}…`);page();
   if(item.type==='image/svg+xml'){await image(item.path,`Page ${index+1}`,true);continue;}
   if(!['application/xhtml+xml','text/html'].includes(item.type))throw Error('Unsupported EPUB spine resource: '+item.type);
   const source=parse(await read(item.path)),body=elements(source,'body')[0];if(!body)throw Error('An EPUB chapter has no body.');
   const viewport=elements(source,'meta').find(e=>e.getAttribute('name')==='viewport')?.getAttribute('content'),width=/width\s*=\s*([\d.]+)/i.exec(viewport||''),height=/height\s*=\s*([\d.]+)/i.exec(viewport||'');if(index===0&&fixed&&width&&height){d.width=Math.max(72,Math.min(2000,Number(width[1])*.75));d.height=Math.max(72,Math.min(2000,Number(height[1])*.75));d.margin=Math.min(36,d.width/5,d.height/5);y=d.margin;}
   let rules=[];for(const link of elements(source,'link').filter(e=>(e.getAttribute('rel')||'').split(/\s+/).includes('stylesheet'))){const path=epubPath(item.path,link.getAttribute('href'));if(path&&zip.file(path))rules.push(...rulesFrom(await read(path,2000000),warnings));else warnings.add('A remote or missing stylesheet was skipped.');}
   for(const style of elements(source,'style'))rules.push(...rulesFrom(style.textContent,warnings));if(rules.length>4000)throw Error('An EPUB chapter exceeds 4,000 CSS rules.');
   const blocks=[],pictures=[];let group='';const flush=()=>{if(group){blocks.push({html:group});group='';}};
   function clean(node,inherited=''){
    if(node.nodeType===3)return esc(node.textContent.replace(/\s+/g,' '));if(node.nodeType!==1)return '';const tag=node.localName.toLowerCase();
    if(tag==='svg'){const picture=elements(node,'image')[0];if(picture){const href=[...picture.attributes].find(a=>a.localName==='href')?.value;pictures.push({image:epubPath(item.path,href),alt:node.getAttribute('aria-label')||''});return `<span data-epub-image="${pictures.length-1}"></span>`;}}
    if(['script','style','iframe','object','embed','link','form','input','button','audio','video','template','svg','math'].includes(tag)){warnings.add('Active content, unsupported formulas or embedded media were skipped.');return '';}
    styleWork+=rules.length;if(styleWork>8000000)throw Error('EPUB styling exceeds eight million selector checks. Simplify the source stylesheets.');
    const matched=[];for(const rule of rules)try{if(node.matches(rule.selector))matched.push(rule.style);}catch{}const defaults=/^h[1-6]$/.test(tag)?`font-weight:bold;font-size:${Math.max(14,28-Number(tag[1])*2)}pt;`:'';const own=safeStyle(node.getAttribute('style')),css=safeStyle(inherited+';'+defaults+matched.join(';')+';'+own);
    if(tag==='img'){pictures.push({image:epubPath(item.path,node.getAttribute('src')),alt:node.getAttribute('alt')||''});return `<span data-epub-image="${pictures.length-1}"></span>`;}
    if(tag==='table'){warnings.add('Table cells become editable paragraph text; source table geometry is not retained.');return elements(node,'tr').map(row=>'<p>'+[...row.children].map(cell=>esc(cell.textContent.trim())).join(' · ')+'</p>').join('');}
    const inner=[...node.childNodes].map(n=>clean(n,css)).join('');if(tag==='br')return '<br>';const safe=['p','h1','h2','h3','h4','h5','h6','pre','strong','b','em','i','u','a','span','ol','ul','li','blockquote','div','section','article','table','tbody','thead','tr','td','th'].includes(tag)?tag:'span';const href=node.getAttribute('href');return `<${safe} style="${esc(css)}"${safe==='a'&&/^(https?:\/\/|mailto:)[^\s<>"']+$/i.test(href||'')?` href="${esc(href)}"`:''}>${inner}</${safe}>`;
   }
   // Flatten structural containers in reading order; keep each heading as a native item.
   function add(html,heading=0){const holder=document.createElement('div');holder.innerHTML=html;let marker;while((marker=holder.querySelector('[data-epub-image]'))){const range=document.createRange();range.setStart(holder,0);range.setEndBefore(marker);const before=document.createElement('div');before.append(range.extractContents());if(before.textContent.trim()){flush();blocks.push({html:before.innerHTML,heading});}flush();blocks.push(pictures[Number(marker.dataset.epubImage)]);marker.remove();}if(!holder.textContent.trim())return;if(heading){flush();blocks.push({html:holder.innerHTML,heading});}else{if(group.length+holder.innerHTML.length>80000)flush();group+=holder.innerHTML;}}
   function walk(parent){for(const node of parent.childNodes){if(node.nodeType===3){if(node.textContent.trim())add('<p>'+esc(node.textContent.trim())+'</p>');}else if(node.nodeType===1){const tag=node.localName.toLowerCase();if(['div','section','article','main','figure','aside','header','footer','body'].includes(tag)){walk(node);continue;}add(clean(node,'font-family:Georgia;font-size:12pt'),/^h[1-6]$/.test(tag)?Number(tag[1]):0);}}flush();}
   walk(body);const onlyPicture=blocks.length===1&&Object.hasOwn(blocks[0],'image');for(const block of blocks){signal?.throwIfAborted();if(Object.hasOwn(block,'image'))await image(block.image,block.alt,fixed&&onlyPicture);else await text(block.html,block.heading||0,(body.getAttribute('dir')||source.documentElement.getAttribute('dir'))==='rtl'||/^(ar|he|fa|ur)(-|$)/i.test(lang));}
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  if(!Object.keys(d.stories).length&&!Object.keys(d.assets).length)throw Error('No supported ebook text or pictures were found.');
  if(!fixed)try{d.ebookSource=await captureBookSource(zip,allSpine,manifest,read);if(!d.ebookSource)delete d.ebookSource;else warnings.add('The source edition retains chapter XHTML, CSS, local links and footnotes. Edit it in Ebook tools and choose Source book at export. Page edits use the separate page editions.');}catch(error){warnings.add('Source editing was not available for this book: '+error.message);}
  return {doc:validatePublication(d),warnings:[...warnings]};
 }finally{measurer.remove();}
}
