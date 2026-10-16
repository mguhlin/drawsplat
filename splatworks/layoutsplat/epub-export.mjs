import {readingHtml,pageCanvas,canvasBlob} from './exports.mjs';
import {readingObjects} from './publication-fields.mjs';
export const EBOOK_CSS='html{color-scheme:light dark}body{font-family:serif;line-height:1.6;margin:5%;overflow-wrap:break-word}article{margin:1em 0}p{white-space:pre-wrap;margin:.7em 0}h1,h2,h3,h4,h5,h6{line-height:1.2;break-after:avoid}img{max-width:100%;height:auto}table{border-collapse:collapse;max-width:100%}td,th{border:1px solid #888;padding:.4em}.page-image{display:block;width:100%;height:100%;object-fit:contain}.fixed{margin:0;padding:0}';
export const xml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const NS='http://www.w3.org/1999/xhtml';
export function ebookXhtml(title,body,language='en',{fixed=false,width,height,css='styles.css'}={}){
 return `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html><html xmlns="${NS}" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${xml(language)}" lang="${xml(language)}"><head><title>${xml(title)}</title><meta charset="utf-8"/>${fixed?`<meta name="viewport" content="width=${width},height=${height}"/>`:''}<link rel="stylesheet" type="text/css" href="${css}"/></head><body${fixed?' class="fixed"':''}>${body}</body></html>`;
}
// The same content drives preview and export. Never serialize executable source HTML.
export function ebookSections(doc,pages=doc.pages.map((_,i)=>i)){
 const selected={...doc,pages:pages.map(i=>doc.pages[i])},html=new DOMParser().parseFromString(readingHtml(selected),'text/html');
 const source=pages.flatMap(i=>readingObjects(doc.pages[i]).filter(o=>!o.readingExcluded&&o.type==='text')),seen=new Set(),stories=source.filter(o=>!seen.has(o.storyId)&&seen.add(o.storyId));
 [...html.querySelectorAll('article')].forEach((article,i)=>{const role=stories[i]?.readingHeading;if(role){const first=article.firstElementChild;if(first){const h=html.createElement('h'+role);h.append(...first.childNodes);first.replaceWith(h);}}});
 const allowed=new Set(['section','article','p','div','h1','h2','h3','h4','h5','h6','strong','b','em','i','u','span','br','a','table','thead','tbody','tr','th','td','img']);
 const convert=node=>{if(node.nodeType===3)return xml(node.nodeValue);if(node.nodeType!==1)return '';let tag=node.localName;if(tag==='video'){tag='img';node.setAttribute('src',node.getAttribute('poster')||'');node.setAttribute('alt','Video poster');}if(!allowed.has(tag))return [...node.childNodes].map(convert).join('');
  const attrs=[];for(const key of ['id','src','alt','scope','dir','colspan','rowspan'])if(node.hasAttribute(key))attrs.push(`${key}="${xml(node.getAttribute(key))}"`);
  const href=node.getAttribute('href');if(tag==='a'&&/^(https?:\/\/|mailto:)[^\s<>"']+$/i.test(href||''))attrs.push(`href="${xml(href)}"`);
  // Relative type sizes remain adjustable in reading systems. Layout geometry is removed.
  if(!node.hasAttribute('dir')&&['ltr','rtl'].includes(node.style.direction))attrs.push(`dir="${node.style.direction}"`);
  const css=[];for(const key of ['font-weight','font-style','text-decoration','text-align','white-space'])if(node.style.getPropertyValue(key))css.push(`${key}:${node.style.getPropertyValue(key)}`);
  if(tag==='span'&&node.style.fontSize){const size=parseFloat(node.style.fontSize);if(Number.isFinite(size))css.push(`font-size:${Math.max(.5,Math.min(6,size/12))}em`);}
  if(css.length)attrs.push(`style="${xml(css.join(';'))}"`);
  return `<${tag}${attrs.length?' '+attrs.join(' '):''}${['img','br'].includes(tag)?'/>':'>'+[...node.childNodes].map(convert).join('')+`</${tag}>`}`;
 };
 return [...html.body.querySelectorAll(':scope > section')].map((section,i)=>{const headings=[...section.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h,n)=>{h.id='heading-'+n;return {id:h.id,level:Number(h.tagName[1]),title:h.textContent.trim().slice(0,200)};});return {page:pages[i],title:headings[0]?.title||`Page ${pages[i]+1}`,headings,body:[...section.childNodes].map(convert).join('')};}).filter(s=>s.body.trim());
}
export function ebookChecks(doc){
 const objects=doc.pages.flatMap(p=>p.objects),reading=objects.filter(o=>!o.readingExcluded),messages=[];
 if(!reading.some(o=>o.readingHeading))messages.push('No ebook headings are marked. Set heading levels in Reading order to build a structured table of contents.');
 const missing=reading.filter(o=>o.type==='image'&&!doc.assets[o.assetId].alt?.trim()).length;if(missing)messages.push(`${missing} picture(s) have no description. Add alternative text before sharing.`);
 const omitted=objects.filter(o=>o.readingExcluded).length;if(omitted)messages.push(`${omitted} object(s) are omitted from the reading edition by Reading order settings.`);
 if(!doc.ebookMetadata?.author?.trim())messages.push('Add the author in Ebook tools.');
 return messages;
}
export async function exportEpub(doc,layout,{pages=doc.pages.map((_,i)=>i),epubMode='reflowable',onProgress=()=>{},ppi=150}={}){
 const fixed=epubMode==='fixed',meta=doc.ebookMetadata||{},language=meta.language||(doc.language==='uh'?'hi':doc.language)||'en';
 if(!/^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*$/.test(language))throw Error('Enter a valid book language code, such as en, es, or zh-Hans.');
 const zip=new JSZip(),items=[],sections=[],warnings=new Set(ebookChecks(doc));let bytes=0;
 zip.file('mimetype','application/epub+zip',{compression:'STORE'});
 zip.file('META-INF/container.xml','<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
 const put=(name,value,type,properties='')=>{zip.file('EPUB/'+name,value);items.push({name,type,properties,id:'r'+items.length});return items.at(-1);};
 put('styles.css',EBOOK_CSS,'text/css');
 if(fixed){warnings.add('Fixed-layout EPUB preserves each page as a picture. Text is not selectable. Keep the LayoutSplat project for complete editing.');
  for(const [i,index]of pages.entries()){onProgress(i+1,pages.length);const canvas=await pageCanvas(doc,doc.pages[index],layout,ppi,0);try{const blob=await canvasBlob(canvas);bytes+=blob.size;if(bytes>128000000)throw Error('EPUB pictures exceed 128 MB. Choose a lower resolution or fewer pages.');const image=`images/page-${i+1}.png`;put(image,blob,'image/png',i===0?'cover-image':'');const title=doc.pages[index].objects.map(o=>doc.stories[o.storyId]?.text).find(Boolean)?.slice(0,200)||`Page ${index+1}`;sections.push({title,body:`<img class="page-image" src="${image}" alt="${xml(title)}"/>`});}finally{canvas.width=canvas.height=1;}}
 }else{
  warnings.add('Reflowable EPUB follows Reading order. Linked stories appear once with their complete text, including overflow. Decorative shapes and master furniture are omitted; motion media use posters. Fonts and page breaks adapt to the reader.');
  const images=new Map();for(const section of ebookSections(doc,pages)){const parsed=new DOMParser().parseFromString(`<body xmlns="${NS}">${section.body}</body>`,'application/xhtml+xml');for(const image of parsed.querySelectorAll('img')){const src=image.getAttribute('src');if(!/^data:image\/(png|jpeg|webp);base64,/.test(src||''))throw Error('EPUB pictures must be embedded in the publication.');if(!images.has(src)){let blob=await (await fetch(src)).blob(),extension=blob.type==='image/jpeg'?'jpg':'png';if(blob.type==='image/webp'){const bitmap=await createImageBitmap(blob),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.getContext('2d').drawImage(bitmap,0,0);bitmap.close();blob=await canvasBlob(canvas);canvas.width=canvas.height=1;}bytes+=blob.size;if(bytes>128000000)throw Error('EPUB pictures exceed 128 MB.');const name=`images/picture-${images.size+1}.${extension}`;put(name,blob,blob.type);images.set(src,name);}image.setAttribute('src',images.get(src));}section.body=[...parsed.documentElement.childNodes].map(n=>new XMLSerializer().serializeToString(n)).join('');sections.push(section);}
 }
 if(!sections.length)throw Error('The selected pages have no content for the reading edition.');
 const toc=sections.map((section,i)=>{const name=`chapter-${i+1}.xhtml`,entry=put(name,ebookXhtml(section.title,section.body,language,{fixed,width:Math.round(doc.width*4/3),height:Math.round(doc.height*4/3)}),'application/xhtml+xml');return {...section,name,id:entry.id};});
 const links=toc.map(s=>{const root={children:[]},stack=[{level:0,node:root}];for(const h of (s.headings||[]).slice(1)){while(stack.length>1&&stack.at(-1).level>=h.level)stack.pop();const node={title:h.title,href:s.name+'#'+h.id,children:[]};stack.at(-1).node.children.push(node);stack.push({level:h.level,node});}const list=nodes=>nodes.length?'<ol>'+nodes.map(n=>`<li><a href="${xml(n.href)}">${xml(n.title)}</a>${list(n.children)}</li>`).join('')+'</ol>':'';return `<li><a href="${s.name}">${xml(s.title)}</a>${list(root.children)}</li>`;}).join('');
 put('nav.xhtml',ebookXhtml('Contents',`<nav epub:type="toc" id="toc"><h1>Contents</h1><ol>${links}</ol></nav>`,language),'application/xhtml+xml','nav');
 const identifier='urn:uuid:'+crypto.randomUUID(),modified=new Date().toISOString().replace(/\.\d{3}Z$/,'Z');
 put('toc.ncx',`<?xml version="1.0"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${identifier}"/></head><docTitle><text>${xml(doc.title)}</text></docTitle><navMap>${toc.map((s,i)=>`<navPoint id="n${i+1}" playOrder="${i+1}"><navLabel><text>${xml(s.title)}</text></navLabel><content src="${s.name}"/></navPoint>`).join('')}</navMap></ncx>`,'application/x-dtbncx+xml');
 const metadata=['author','publisher','description','rights'].filter(k=>meta[k]).map(k=>`<dc:${k==='author'?'creator':k}>${xml(meta[k])}</dc:${k==='author'?'creator':k}>`).join('');
 zip.file('EPUB/package.opf',`<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="${xml(language)}"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">${identifier}</dc:identifier><dc:title>${xml(doc.title)}</dc:title><dc:language>${xml(language)}</dc:language>${metadata}<meta property="dcterms:modified">${modified}</meta><meta property="rendition:layout">${fixed?'pre-paginated':'reflowable'}</meta>${fixed?'<meta property="rendition:spread">none</meta>':''}</metadata><manifest>${items.map(e=>`<item id="${e.id}" href="${e.name}" media-type="${e.type}"${e.properties?` properties="${e.properties}"`:''}/>`).join('')}</manifest><spine toc="${items.find(e=>e.name==='toc.ncx').id}"${doc.language==='ar'?' page-progression-direction="rtl"':''}>${toc.map(e=>`<itemref idref="${e.id}"/>`).join('')}</spine></package>`);
 return {blob:await zip.generateAsync({type:'blob',mimeType:'application/epub+zip',compression:'DEFLATE'}),extension:'.epub',warnings:[...warnings]};
}
