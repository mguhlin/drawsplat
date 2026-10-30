// OpenDocument Text -> the PDF editor's existing reflow blocks. No remote assets.
const NS={office:'urn:oasis:names:tc:opendocument:xmlns:office:1.0',text:'urn:oasis:names:tc:opendocument:xmlns:text:1.0',style:'urn:oasis:names:tc:opendocument:xmlns:style:1.0',fo:'urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0',draw:'urn:oasis:names:tc:opendocument:xmlns:drawing:1.0',manifest:'urn:oasis:names:tc:opendocument:xmlns:manifest:1.0',svg:'urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0',link:'http://www.w3.org/1999/xlink'};
const attr=(node,space,key)=>node?.getAttributeNS(NS[space],key)||'';
const nodes=(node,space,key)=>[...(node?.getElementsByTagNameNS(NS[space],key)||[])];
const child=(node,space,key)=>[...(node?.children||[])].find(n=>n.namespaceURI===NS[space]&&n.localName===key);
function points(raw){const m=/^([\d.]+)(pt|in|cm|mm|pc|px)$/.exec(raw||'');const value=m?Number(m[1])*({pt:1,in:72,cm:72/2.54,mm:72/25.4,pc:12,px:.75}[m[2]]):NaN;return Number.isFinite(value)&&value>=0?value:undefined;}
export async function odtBlocks(zip,{readXml,zipImage,pathFrom,fontFamily}){
 const parse=async path=>{const entry=zip.file(path);if(!entry)throw Error('Missing OpenDocument component: '+path);const text=await entry.async('string');if(text.length>10*1024*1024)throw Error('An OpenDocument component is too large.');if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('OpenDocument imports do not accept XML document types or entities.');return readXml(zip,path);};
 if(zip.file('mimetype')&&(await zip.file('mimetype').async('string')).trim()!=='application/vnd.oasis.opendocument.text')throw Error('This file is not an OpenDocument Text (.odt) document.');
 if(zip.file('META-INF/manifest.xml')&&nodes(await parse('META-INF/manifest.xml'),'manifest','encryption-data').length)throw Error('Encrypted ODT files are not supported. Save an unencrypted copy first.');
 const content=await parse('content.xml'),named=zip.file('styles.xml')?await parse('styles.xml'):null;
 const body=child(child(content.documentElement,'office','body'),'office','text');if(!body)throw Error('This OpenDocument file has no text body.');
 const styles=new Map(),defaults=new Map(),fonts=new Map(),lists=new Map(),blocks=[];
 for(const source of [named,content]){
  for(const f of nodes(source,'style','font-face'))fonts.set(attr(f,'style','name'),attr(f,'svg','font-family'));
  for(const s of nodes(source,'style','style'))styles.set(attr(s,'style','family')+':'+attr(s,'style','name'),s);
  for(const s of nodes(source,'style','default-style'))defaults.set(attr(s,'style','family'),s);
  for(const s of nodes(source,'text','list-style'))lists.set(attr(s,'style','name'),s);
 }
 function properties(s){
  const r=child(s,'style','text-properties'),p=child(s,'style','paragraph-properties'),o={};
  const family=attr(r,'fo','font-family')||fonts.get(attr(r,'style','font-name'));if(family)o.pdfFontFamily=fontFamily(family);
  const size=points(attr(r,'fo','font-size'));if(size>0)o.size=Math.max(6,Math.min(72,size));
  const weight=attr(r,'fo','font-weight'),italic=attr(r,'fo','font-style'),color=attr(r,'fo','color');
  if(weight)o.bold=weight==='bold'||Number(weight)>=600;if(italic)o.italic=['italic','oblique'].includes(italic);if(/^#[\da-f]{6}$/i.test(color))o.color=color;
  const align=attr(p,'fo','text-align');if(['left','right','center','start','end'].includes(align))o.align=({start:'left',end:'right'})[align]||align;
  const indent=points(attr(p,'fo','margin-left'));if(Number.isFinite(indent))o.indent=Math.min(240,indent);
  if(attr(p,'fo','break-before')==='page')o.breakBefore=true;if(attr(p,'fo','break-after')==='page')o.breakAfter=true;return o;
 }
 function resolve(family,id,seen=new Set()){
  const key=family+':'+id;if(!id||seen.has(key)||seen.size>=16)return{};seen.add(key);const s=styles.get(key);return s?{...resolve(family,attr(s,'style','parent-style-name'),seen),...properties(s)}:{};
 }
 const base={...properties(defaults.get('text')),...properties(defaults.get('paragraph'))};
 function add(block){if(blocks.length>=10000)throw Error('This ODT has too many paragraphs or images. Split it into smaller documents.');blocks.push(block);}
 async function paragraph(p,{indent=0,prefix=''}={}){
  const heading=p.localName==='h',level=Math.max(1,Math.min(6,Number(attr(p,'text','outline-level'))||1));
  const style={...base,...(heading?{bold:true,size:26-level*2}:{}),...resolve('paragraph',attr(p,'text','style-name'))};let runs=prefix?[{text:prefix,...style}]:[];
  const flush=()=>{if(runs.length)add({runs:runs.splice(0),size:style.size||12,align:style.align,indent:Math.min(240,indent+(style.indent||0))});};
  async function inline(n,current){
   if(n.nodeType===3){if(n.nodeValue)runs.push({text:n.nodeValue.replace(/[\t\r\n ]+/g,' '),...current});return;}if(n.nodeType!==1)return;
   if(n.namespaceURI===NS.text){
    if(n.localName==='s'){runs.push({text:' '.repeat(Math.max(1,Math.min(1000,Number(attr(n,'text','c'))||1))),...current});return;}
    if(n.localName==='tab'||n.localName==='line-break'){runs.push({text:n.localName==='tab'?'\t':'\n',...current});return;}
    if(['tracked-changes','change-start','change-end','note','bookmark','bookmark-start','bookmark-end'].includes(n.localName))return;
   }
   if(n.namespaceURI===NS.draw&&n.localName==='image'){
    const path=pathFrom('content.xml',attr(n,'link','href')),image=await zipImage(zip,path);if(image){flush();const frame=n.parentElement;add({image,width:points(attr(frame,'svg','width')),height:points(attr(frame,'svg','height'))});}return;
   }
   if(n.namespaceURI===NS.draw&&n.localName!=='frame')return;
   if(n.namespaceURI!==NS.text&&n.namespaceURI!==NS.draw)return;
   const next={...current,...resolve('text',attr(n,'text','style-name'))};for(const c of n.childNodes)await inline(c,next);
  }
  if(style.breakBefore)add({break:true});for(const n of p.childNodes)await inline(n,style);flush();if(style.breakAfter)add({break:true});
 }
 async function walk(n,context={}){
  if(n.namespaceURI===NS.text&&['p','h'].includes(n.localName)){await paragraph(n,context);return;}
  if(n.namespaceURI===NS.text&&n.localName==='list'){
   const level=(context.level||0)+1,id=attr(n,'text','style-name')||context.list||'',definition=[...(lists.get(id)?.children||[])].find(s=>Number(attr(s,'text','level'))===level),ordered=definition?.localName==='list-level-style-number';let number=Number(attr(definition,'text','start-value'))||1;
   for(const item of n.children){if(item.namespaceURI!==NS.text||item.localName!=='list-item')continue;let first=true;for(const block of item.children){const prefix=first&&['p','h'].includes(block.localName)?(ordered?(number++)+'. ':'• '):'';await walk(block,{level,list:id,indent:Math.min(200,level*16),prefix});if(prefix)first=false;}}return;
  }
  if(n.namespaceURI===NS.text&&['tracked-changes','deletion','note'].includes(n.localName))return;
  if(n.namespaceURI===NS.draw)return;
  for(const c of n.children||[])await walk(c,context);
 }
 for(const n of body.children)await walk(n);return blocks;
}
