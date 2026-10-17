import {bookPath,validateBookSource} from './ebook-source-model.mjs';
const XHTML='http://www.w3.org/1999/xhtml',EPUB='http://www.idpf.org/2007/ops';
export const bookXML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function parseBookXml(source){
 if(typeof source!=='string'||source.length>8000000||/<!ENTITY|<!DOCTYPE[^>]*\[/i.test(source))throw Error('Invalid XHTML: entity declarations and oversized chapters are not supported.');
 source=source.replace(/<!DOCTYPE[^>]*>/gi,'').replace(/&([a-z][a-z\d]+);/gi,(match,name)=>{if(['amp','lt','gt','quot','apos'].includes(name))return match;const el=document.createElement('textarea');el.innerHTML=match;return el.value===match?match:[...el.value].map(c=>'&#'+c.codePointAt(0)+';').join('');});
 const doc=new DOMParser().parseFromString(source,'application/xhtml+xml');if(doc.querySelector('parsererror')||doc.getElementsByTagName('*').length>50000)throw Error('Invalid XHTML. Fix the XML error before saving.');return doc;
}
const props=new Set(('font font-family font-size font-style font-weight font-variant font-variant-caps font-feature-settings font-kerning font-variant-ligatures line-height letter-spacing word-spacing color background-color text-align text-align-last text-decoration text-decoration-line text-decoration-color text-transform text-indent text-shadow vertical-align white-space overflow-wrap word-break hyphens -epub-hyphens margin margin-top margin-bottom margin-left margin-right margin-inline margin-block padding padding-top padding-bottom padding-left padding-right padding-inline padding-block border border-top border-bottom border-left border-right border-color border-width border-style border-collapse border-spacing border-radius width max-width min-width height max-height min-height display float clear box-sizing list-style-type list-style-position break-before break-after break-inside page-break-before page-break-after page-break-inside orphans widows column-count column-gap direction writing-mode text-orientation src font-display').split(' '));
export function cleanBookCss(css,path,paths){
 if(typeof css!=='string'||css.length>2000000)throw Error('A stylesheet must be under 2 MB.');
 if(/<\/style|@import|expression\s*\(|-moz-binding|behavior\s*:/i.test(css))throw Error('Stylesheets cannot contain imports or active content.');
 const sheet=new CSSStyleSheet();sheet.replaceSync(css);let count=0;
 function declarations(style){const values=[];for(const key of Array.from({length:style.length},(_,i)=>style[i])){if(!props.has(key))continue;const value=style.getPropertyValue(key);if(/[\\]|expression|javascript:|var\(/i.test(value))continue;let safe=true;value.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi,(_,q,href)=>{const target=bookPath(path,href);if(!target||!paths.has(target.path))safe=false;return '';});if(safe)values.push(`${key}:${value}${style.getPropertyPriority(key)?' !important':''}`);}return values.join(';');}
 function rules(list){return [...list].map(rule=>{if(++count>4000)throw Error('Too many stylesheet rules.');if(rule.selectorText&&rule.style)return `${rule.selectorText}{${declarations(rule.style)}}`;if(rule.type===CSSRule.FONT_FACE_RULE)return `@font-face{${declarations(rule.style)}}`;if(rule.type===CSSRule.MEDIA_RULE)return `@media ${rule.conditionText}{${rules(rule.cssRules)}}`;if(rule.type===CSSRule.SUPPORTS_RULE)return `@supports ${rule.conditionText}{${rules(rule.cssRules)}}`;return '';}).join('\n');}
 return rules(sheet.cssRules);
}
const tags=new Set('html head title meta link style body main section article aside header footer nav h1 h2 h3 h4 h5 h6 p div span strong b em i u s sub sup small mark abbr cite q blockquote pre code kbd samp var br hr wbr a img figure figcaption ol ul li dl dt dd table caption colgroup col thead tbody tfoot tr th td ruby rt rp bdi bdo address time'.split(' '));
export function cleanBookChapter(source,path,paths,{strict=false}={}){
 const doc=parseBookXml(source);if(doc.documentElement.localName!=='html'||!doc.getElementsByTagNameNS('*','body').length)throw Error('A chapter needs an XHTML html element and body.');
 const ids=new Set();
 for(const node of [...doc.getElementsByTagName('*')]){
  if(node.localName==='meta'&&node.hasAttribute('http-equiv')){node.remove();continue;}
  if(!tags.has(node.localName)||node.namespaceURI!==XHTML){node.remove();continue;}
  for(const attr of [...node.attributes]){
   const key=attr.name,value=attr.value;
   if(key==='xmlns'||key==='xmlns:epub'||key==='xml:lang'||key==='lang'||key==='dir'||key==='class'||key==='title'||key==='alt'||key==='role'||key.startsWith('aria-')||['colspan','rowspan','scope','start','value','reversed','datetime'].includes(key))continue;
   if(key==='epub:type'||attr.namespaceURI===EPUB)continue;
   if(key==='id'){if(!value||ids.has(value)){if(strict)throw Error('Chapter IDs must be nonempty and unique.');node.removeAttribute(key);}else ids.add(value);continue;}
   if(key==='style'){try{const css=cleanBookCss(`p{${value}}`,path,paths);node.setAttribute(key,css.slice(css.indexOf('{')+1,css.lastIndexOf('}')));}catch{node.removeAttribute(key);}continue;}
   if(key==='href'||key==='src'){
    const external=key==='href'&&node.localName==='a'&&/^(https?:\/\/|mailto:)[^\s<>"']+$/i.test(value),target=bookPath(path,value);
    if(external||target&&paths.has(target.path))continue;if(strict)throw Error('Missing or unsupported link/image resource: '+value);
   }
   if(node.localName==='link'&&key==='rel'&&value==='stylesheet'||node.localName==='link'&&key==='type'&&value==='text/css')continue;
   if(node.localName==='meta'&&['name','content','charset'].includes(key)&&!/refresh/i.test(value))continue;
   node.removeAttributeNode(attr);
  }
  if(node.localName==='link'&&!node.hasAttribute('href'))node.remove();
  if(node.localName==='img'&&!node.hasAttribute('src'))node.remove();
  if(node.localName==='meta'&&!node.hasAttribute('charset')&&!node.hasAttribute('name'))node.remove();
  if(node.localName==='style')node.textContent=cleanBookCss(node.textContent,path,paths);
 }
 for(const nav of [...doc.getElementsByTagNameNS(XHTML,'nav')])if((nav.getAttributeNS(EPUB,'type')||nav.getAttribute('epub:type')||'').split(/\s+/).includes('landmarks')&&!nav.querySelector('a[href]'))nav.remove();
 if(!doc.getElementsByTagNameNS('*','head').length)doc.documentElement.prepend(doc.createElementNS(XHTML,'head'));
 doc.documentElement.setAttribute('xmlns:epub',EPUB);
 return '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n'+new XMLSerializer().serializeToString(doc.documentElement);
}
export async function captureBookSource(zip,spine,manifest,read){
 const chapters=[],styles=[],resources=[],paths=new Set([...manifest.values()].map(x=>x.path).filter(Boolean));
 const encrypted=new Set();if(zip.file('META-INF/encryption.xml')){const encryption=parseBookXml(await read('META-INF/encryption.xml'));for(const el of encryption.getElementsByTagNameNS('*','CipherReference')){const target=bookPath('',el.getAttribute('URI'));if(target)encrypted.add(target.path);}}
 const cssPaths=new Set([...manifest.values()].filter(i=>i.type==='text/css').map(i=>i.path));
 async function expandedCss(path,seen=new Set()){
  if(seen.has(path)||seen.size>=8)return '';const next=new Set([...seen,path]),raw=await read(path,2000000);let out='',offset=0;
  for(const match of raw.matchAll(/@import\s+(?:url\(\s*(['"]?)(.*?)\1\s*\)|(['"])(.*?)\3)\s*([^;]*);/gi)){
   out+=raw.slice(offset,match.index);offset=match.index+match[0].length;const target=bookPath(path,match[2]||match[4]);if(!target||!cssPaths.has(target.path))continue;
   const parts=path.split('/');parts.pop();const relative=dest=>{const b=parts.slice(),a=dest.split('/');while(b.length&&a.length&&b[0]===a[0]){b.shift();a.shift();}return '../'.repeat(b.length)+a.join('/');};
   let child=await expandedCss(target.path,next);child=child.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi,(_,q,href)=>{const resolved=bookPath(target.path,href);return resolved?'url("'+relative(resolved.path)+resolved.hash+'")':'url("")';});
   out+=match[5].trim()?'@media '+match[5]+'{'+child+'}':child;if(out.length>2000000)throw Error('Expanded stylesheet exceeds 2 MB.');
  }return out+raw.slice(offset);
 }
 const candidates=[...spine,...[...manifest.values()].filter(item=>!spine.some(s=>s.path===item.path))];
 for(const item of candidates)if(['application/xhtml+xml','text/html'].includes(item.type)){const source=await read(item.path),doc=parseBookXml(source);chapters.push({path:item.path,title:(doc.querySelector('title')?.textContent||doc.querySelector('h1,h2')?.textContent||item.path).slice(0,200),xhtml:cleanBookChapter(source,item.path,paths),linear:spine.some(s=>s.path===item.path&&s.linear!==false),...(item.properties.split(/\s+/).includes('nav')?{navigation:true}:{})});}
 if(!spine.every(s=>chapters.some(c=>c.path===s.path)))return null;
 for(const item of manifest.values()){
  if(item.type==='text/css'&&item.path&&zip.file(item.path)){try{styles.push({path:item.path,css:cleanBookCss(await expandedCss(item.path),item.path,paths)});}catch{/* Unsupported remote CSS is omitted. */}}
  else if(/^(image\/(png|jpeg|gif|webp)|font\/(ttf|otf|woff2?)|application\/(vnd.ms-opentype|font-sfnt|font-woff))$/.test(item.type)&&item.path&&zip.file(item.path)&&!encrypted.has(item.path)){
   const entry=zip.file(item.path);if(entry._data?.uncompressedSize>16000000)throw Error('Source ebook resources exceed import limits.');resources.push({path:item.path,type:item.type,data:await entry.async('base64')});
  }
 }
 const book=validateBookSource({version:1,chapters,styles,resources});return sanitizeBook(book);
}
export function sanitizeBook(book){
 validateBookSource(book);const paths=new Set([...book.chapters,...book.styles,...book.resources].map(x=>x.path));
 return {...book,chapters:book.chapters.map(c=>({...c,xhtml:cleanBookChapter(c.xhtml,c.path,paths)})),styles:book.styles.map(s=>({...s,css:cleanBookCss(s.css,s.path,paths)}))};
}
export function sourcePreview(book,index){
 const chapter=book.chapters[index],paths=new Set([...book.chapters,...book.styles,...book.resources].map(x=>x.path)),doc=parseBookXml(cleanBookChapter(chapter.xhtml,chapter.path,paths)),head=doc.getElementsByTagNameNS('*','head')[0],resource=new Map(book.resources.map(r=>[r.path,`data:${r.type};base64,${r.data}`]));
 const embed=(css,path)=>css.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi,(_,q,href)=>`url("${resource.get(bookPath(path,href)?.path)||''}")`);
 for(const style of doc.getElementsByTagNameNS('*','style'))style.textContent=embed(style.textContent,chapter.path);
 for(const element of doc.querySelectorAll('[style]'))element.setAttribute('style',embed(element.getAttribute('style'),chapter.path));
 for(const link of [...doc.getElementsByTagNameNS('*','link')]){const target=bookPath(chapter.path,link.getAttribute('href')),sheet=book.styles.find(s=>s.path===target?.path);link.remove();if(sheet){const el=doc.createElementNS(XHTML,'style');el.textContent=sheet.css.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi,(_,q,href)=>`url("${resource.get(bookPath(sheet.path,href)?.path)||''}")`);head.append(el);}}
 for(const image of doc.getElementsByTagNameNS('*','img')){const original=image.getAttribute('src');image.setAttribute('data-book-src',original);image.setAttribute('src',resource.get(bookPath(chapter.path,original)?.path)||'');}
 for(const anchor of doc.getElementsByTagNameNS('*','a')){anchor.setAttribute('data-book-href',anchor.getAttribute('href')||'');anchor.removeAttribute('href');}
 const csp=doc.createElementNS(XHTML,'meta');csp.setAttribute('http-equiv','Content-Security-Policy');csp.setAttribute('content',"default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; form-action 'none'; base-uri 'none'");head.prepend(csp);
 return new XMLSerializer().serializeToString(doc.documentElement);
}
export async function exportSourceBook(doc){
 const book=sanitizeBook(doc.ebookSource),zip=new JSZip(),xml=bookXML,lang=doc.ebookMetadata?.language||'en',identifier='urn:uuid:'+crypto.randomUUID(),items=[];
 const occupied=new Set([...book.chapters,...book.styles,...book.resources].map(r=>r.path));let packagePath='package.opf';while(occupied.has(packagePath))packagePath='_'+packagePath;
 zip.file('mimetype','application/epub+zip',{compression:'STORE'});zip.file('META-INF/container.xml','<?xml version="1.0"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"><rootfiles><rootfile full-path="'+xml(packagePath)+'" media-type="application/oebps-package+xml"/></rootfiles></container>');
 const put=(path,data,type,properties='',options={})=>{zip.file(path,data,options);items.push({path,type,properties,id:'s'+items.length});return items.at(-1).id;};
 for(const r of book.resources)put(r.path,r.data,r.type,'',{base64:true});for(const s of book.styles)put(s.path,s.css,'text/css');
 const chapterIds=book.chapters.map(c=>put(c.path,c.xhtml,'application/xhtml+xml',c.navigation?'nav':'')),spine=book.chapters.map((c,i)=>({c,id:chapterIds[i]})).filter(({c})=>!c.navigation),originalNav=book.chapters.find(c=>c.navigation);
 let nav='layoutsplat-contents.xhtml';while(occupied.has(nav)||nav===packagePath)nav='_'+nav;
 if(!originalNav)put(nav,`<?xml version="1.0"?><!DOCTYPE html><html xmlns="${XHTML}" xmlns:epub="${EPUB}" lang="${xml(lang)}" xml:lang="${xml(lang)}"><head><title>Contents</title></head><body><nav epub:type="toc"><h1>Contents</h1><ol>${book.chapters.map(c=>`<li><a href="${xml(c.path)}">${xml(c.title)}</a></li>`).join('')}</ol></nav></body></html>`,'application/xhtml+xml','nav');
 const metadata=['author','publisher','description','rights'].filter(k=>doc.ebookMetadata?.[k]).map(k=>`<dc:${k==='author'?'creator':k}>${xml(doc.ebookMetadata[k])}</dc:${k==='author'?'creator':k}>`).join('');
 zip.file(packagePath,`<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="${xml(lang)}"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">${identifier}</dc:identifier><dc:title>${xml(doc.title)}</dc:title><dc:language>${xml(lang)}</dc:language>${metadata}<meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/,'Z')}</meta></metadata><manifest>${items.map(i=>`<item id="${i.id}" href="${xml(i.path)}" media-type="${i.type}"${i.properties?` properties="${i.properties}"`:''}/>`).join('')}</manifest><spine>${spine.map(({c,id})=>`<itemref idref="${id}"${c.linear===false?' linear="no"':''}/>`).join('')}</spine></package>`);
 return {blob:await zip.generateAsync({type:'blob',mimeType:'application/epub+zip',compression:'DEFLATE'}),extension:'.epub',warnings:['The source edition includes saved chapter and stylesheet edits. Page-canvas edits belong to the reflowable or fixed-layout edition. Scripts and remote resources are omitted.']};
}
