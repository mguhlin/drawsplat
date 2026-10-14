// Bounded local Office XML conversion shared by WriteSplat and LayoutSplat.
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const T='urn:oasis:names:tc:opendocument:xmlns:text:1.0';
const S='urn:oasis:names:tc:opendocument:xmlns:style:1.0';
const F='urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0';
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const children=(el,name,ns)=>[...(el?.children||[])].filter(e=>e.localName===name&&(!ns||e.namespaceURI===ns));
const child=(el,name,ns)=>children(el,name,ns)[0];
const descendants=(el,name,ns)=>[...(el?.getElementsByTagNameNS(ns||'*',name)||[])];
const attr=(el,name,ns=W)=>el?.getAttributeNS(ns,name)||'';
const bounded=(n,min,max)=>Number.isFinite(n)?Math.max(min,Math.min(max,n)):undefined;
function xml(text){if(!text)return null;if(text.length>8e6||/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('Unsupported or oversized document XML.');const d=new DOMParser().parseFromString(text,'application/xml');if(d.querySelector('parsererror'))throw Error('Invalid document XML.');return d;}
function css(style){return Object.entries(style).filter(([,v])=>v!==undefined&&v!==null&&v!=='').map(([k,v])=>k+':'+v).join(';');}
function styled(tag,inner,style={},attrs=''){const c=css(style);return `<${tag}${attrs}${c?' style="'+esc(c)+'"':''}>${inner}</${tag}>`;}
function font(value){return String(value||'').replace(/["'<>;{}\\]/g,'').slice(0,120);}
function wordRun(pr){const o={};if(!pr)return o;for(const [key,cssKey]of[['b','font-weight'],['i','font-style'],['u','text-decoration']]){const p=child(pr,key,W);if(p){const yes=!['0','false','off','none'].includes(attr(p,'val'));o[cssKey]=key==='b'?(yes?'bold':'normal'):key==='i'?(yes?'italic':'normal'):(yes?'underline':'none');}}
 const rawSize=attr(child(pr,'sz',W),'val'),size=rawSize?bounded(Number(rawSize)/2,6,120):undefined;if(size)o['font-size']=size+'pt';const color=attr(child(pr,'color',W),'val');if(/^[a-f0-9]{6}$/i.test(color))o.color='#'+color;const fonts=child(pr,'rFonts',W),family=font(attr(fonts,'ascii')||attr(fonts,'hAnsi'));if(family)o['font-family']=family;
 const highlight=attr(child(pr,'highlight',W),'val');if(['yellow','green','cyan','magenta','blue','red','darkBlue','darkCyan','darkGreen','darkMagenta','darkRed','darkYellow','darkGray','lightGray','black','white'].includes(highlight))o['background-color']=({darkYellow:'#808000',darkGray:'#808080',lightGray:'#c0c0c0'})[highlight]||highlight;
 if(child(pr,'strike',W)&&!['0','false','off'].includes(attr(child(pr,'strike',W),'val')))o['text-decoration']=((o['text-decoration']==='underline'?'underline ':'')+'line-through');return o;}
function wordParagraph(pr){const o={};if(!pr)return o;const spacing=child(pr,'spacing',W);for(const[k,c]of[['before','margin-top'],['after','margin-bottom']]){const a=attr(spacing,k);if(a!=='')o[c]=bounded(Number(a)/20,0,360)+'pt';}const line=Number(attr(spacing,'line'));if(line>0)o['line-height']=attr(spacing,'lineRule')==='exact'||attr(spacing,'lineRule')==='atLeast'?bounded(line/20,6,360)+'pt':String(bounded(line/240,.5,6));
 const indent=child(pr,'ind',W);for(const[k,c]of[['left','margin-left'],['right','margin-right']]){const a=attr(indent,k);if(a!=='')o[c]=bounded(Number(a)/20,0,360)+'pt';}if(attr(indent,'firstLine')!=='')o['text-indent']=bounded(Number(attr(indent,'firstLine'))/20,-360,360)+'pt';if(attr(indent,'hanging')!=='')o['text-indent']=bounded(-Number(attr(indent,'hanging'))/20,-360,360)+'pt';const tabContainer=child(pr,'tabs',W);if(tabContainer){const stops=children(tabContainer,'tab',W).filter(t=>attr(t,'val')==='left').map(t=>Number(attr(t,'pos'))/20).filter(n=>n>0&&n<=468).slice(0,32);if(stops.length)o['--writer-tabs']=JSON.stringify(stops);}const align=attr(child(pr,'jc',W),'val');if(['left','right','center','both','start','end'].includes(align))o['text-align']=({both:'justify',start:'left',end:'right'})[align]||align;return o;}
export function wordXmlToHtml(documentXml,stylesXml=null,numberingXml=null,relationshipsXml=null){
 const d=xml(documentXml),styles=xml(stylesXml),numbering=xml(numberingXml),rels=xml(relationshipsXml),styleMap=new Map(),links=new Map();
 for(const s of descendants(styles,'style',W))styleMap.set(attr(s,'styleId'),s);
 const defaults=descendants(styles,'docDefaults',W)[0],baseRun=wordRun(descendants(defaults,'rPr',W)[0]),baseParagraph={...wordParagraph(descendants(defaults,'pPr',W)[0])};
 function inherited(id,seen=new Set()){if(!id||seen.has(id)||seen.size>=16)return{run:{},paragraph:{}};seen.add(id);const s=styleMap.get(id);if(!s)return{run:{},paragraph:{}};const parent=inherited(attr(child(s,'basedOn',W),'val'),seen);return {run:{...parent.run,...wordRun(child(s,'rPr',W))},paragraph:{...parent.paragraph,...wordParagraph(child(s,'pPr',W))}};}
 const normal=[...styleMap.values()].find(s=>attr(s,'type')==='paragraph'&&attr(s,'default')==='1');const normalStyle=inherited(attr(normal,'styleId'));
 for(const r of descendants(rels,'Relationship')){const href=r.getAttribute('Target')||'';if(/^(https?:\/\/|mailto:)[^\s<>"']+$/i.test(href)&&r.getAttribute('Type')?.endsWith('/hyperlink'))links.set(r.getAttribute('Id'),href);}
 const definitions=new Map(),abstracts=new Map();for(const a of descendants(numbering,'abstractNum',W)){const levels=new Map();for(const l of children(a,'lvl',W))levels.set(Number(attr(l,'ilvl')),{kind:attr(child(l,'numFmt',W),'val')==='bullet'?'ul':'ol',format:attr(child(l,'numFmt',W),'val'),start:Number(attr(child(l,'start',W),'val'))||1,indent:wordParagraph(child(l,'pPr',W))});abstracts.set(attr(a,'abstractNumId'),levels);}
 for(const n of descendants(numbering,'num',W)){const levels=new Map(abstracts.get(attr(child(n,'abstractNumId',W),'val'))||[]);for(const override of children(n,'lvlOverride',W)){const level=Number(attr(override,'ilvl')),start=Number(attr(child(override,'startOverride',W),'val'));if(start>0)levels.set(level,{...(levels.get(level)||{kind:'ol',format:'decimal',indent:{}}),start});}definitions.set(attr(n,'numId'),levels);}
 const counters=new Map();
 function inline(node,base){if(node.namespaceURI!==W)return '';if(node.localName==='r'){const pr=child(node,'rPr',W),run={...base,...inherited(attr(child(pr,'rStyle',W),'val')).run,...wordRun(pr)};let inner=[...node.children].map(e=>e.localName==='t'?esc(e.textContent):e.localName==='tab'?'&#9;':['br','cr'].includes(e.localName)?'<br>':'').join('');const strong=run['font-weight']==='bold',em=run['font-style']==='italic',under=run['text-decoration']==='underline';if(strong){inner='<strong>'+inner+'</strong>';delete run['font-weight'];}if(em){inner='<em>'+inner+'</em>';delete run['font-style'];}if(under){inner='<u>'+inner+'</u>';delete run['text-decoration'];}return styled('span',inner,run);}
 const inner=[...node.children].map(e=>inline(e,base)).join('');if(node.localName==='hyperlink'){const href=links.get(node.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id'));return href?styled('a',inner,{},' href="'+esc(href)+'"'):inner;}return inner;}
 function blocks(nodes){const holder=document.createElement('div');let stack=[];for(const node of nodes){if(node.namespaceURI!==W)continue;if(node.localName==='p'){const pr=child(node,'pPr',W),s=inherited(attr(child(pr,'pStyle',W),'val')),run={...baseRun,...normalStyle.run,...s.run,...wordRun(child(pr,'rPr',W))},pStyle={'margin-top':'0pt','margin-bottom':'0pt','font-size':run['font-size'],'font-family':run['font-family'],...baseParagraph,...normalStyle.paragraph,...s.paragraph,...wordParagraph(pr)};const inner=[...node.children].filter(e=>e.localName!=='pPr').map(e=>inline(e,run)).join(''),heading=/Heading([1-6])/i.exec(attr(child(pr,'pStyle',W),'val')),num=child(pr,'numPr',W);const stops=pStyle['--writer-tabs'];delete pStyle['--writer-tabs'];const tabAttrs=stops?' data-writer-tabs="'+esc(stops)+'"':'';
 if(num&&attr(child(num,'numId',W),'val')!=='0'){const id=attr(child(num,'numId',W),'val'),level=Math.max(0,Math.min(8,Number(attr(child(num,'ilvl',W),'val'))||0)),definition=definitions.get(id)?.get(level)||{kind:'ol',format:'decimal',start:1,indent:{}},key=id+':'+level,index=counters.get(key)??definition.start;counters.set(key,index+1);for(let deeper=level+1;deeper<9;deeper++)counters.delete(id+':'+deeper);
 while(stack.length&&(stack.at(-1).level>level||stack.at(-1).id!==id||stack.at(-1).level===level&&stack.at(-1).kind!==definition.kind))stack.pop();let entry=stack.at(-1);if(!entry||entry.level!==level){const list=document.createElement(definition.kind);if(definition.kind==='ol'){list.start=index;const type={lowerLetter:'a',upperLetter:'A',lowerRoman:'i',upperRoman:'I'}[definition.format];if(type)list.type=type;}list.style.margin='0';list.style.fontSize=run['font-size']||'';list.style.fontFamily=run['font-family']||'';list.style.paddingLeft=definition.indent['margin-left']||'36pt';if(entry?.item)entry.item.append(list);else holder.append(list);entry={id,level,kind:definition.kind,list,item:null};stack.push(entry);}const li=document.createElement('li');li.innerHTML=styled('p',inner,{...pStyle,'margin-left':'0pt','text-indent':'0pt'},tabAttrs);entry.list.append(li);entry.item=li;
 }else{stack=[];holder.insertAdjacentHTML('beforeend',styled(heading?'h'+heading[1]:'p',inner,pStyle,tabAttrs));}}
 else if(node.localName==='tbl'){stack=[];const table=document.createElement('table'),body=document.createElement('tbody');for(const row of children(node,'tr',W)){const tr=document.createElement('tr');for(const cell of children(row,'tc',W)){const td=document.createElement('td'),span=Number(attr(descendants(cell,'gridSpan',W)[0],'val'));if(span>1)td.colSpan=Math.min(100,span);td.innerHTML=blocks([...cell.children].filter(e=>e.localName!=='tcPr'));tr.append(td);}body.append(tr);}table.append(body);holder.append(table);}}
 return holder.innerHTML;}
 const body=descendants(d,'body',W)[0];if(!body)throw Error('The Word document has no body.');return blocks([...body.children])||'<p></p>';
}
function points(raw){const m=/^(-?[\d.]+)(pt|in|cm|mm|pc)?$/.exec(raw||'');if(!m)return undefined;return Number(m[1])*({pt:1,in:72,cm:72/2.54,mm:72/25.4,pc:12}[m[2]]||1);}
export function odtXmlToHtml(contentXml,stylesXml=null){
 const d=xml(contentXml),named=xml(stylesXml),styles=new Map(),defaults=new Map(),fonts=new Map(),listStyles=new Map();for(const source of [named,d]){
 for(const f of descendants(source,'font-face',S))fonts.set(attr(f,'name',S),[...(f.attributes||[])].find(a=>a.localName==='font-family')?.value||attr(f,'name',S));
 for(const s of descendants(source,'style',S))styles.set(attr(s,'name',S),s);for(const s of descendants(source,'default-style',S))defaults.set(attr(s,'family',S),s);for(const s of descendants(source,'list-style',T))listStyles.set(attr(s,'name',S),s);}
 function properties(s){const run={},paragraph={};const r=child(s,'text-properties',S),p=child(s,'paragraph-properties',S),family=font(attr(r,'font-family',F)||fonts.get(attr(r,'font-name',S)));if(family)run['font-family']=family;const size=bounded(points(attr(r,'font-size',F)),6,120);if(size)run['font-size']=size+'pt';for(const k of ['font-weight','font-style','color','background-color']){const v=attr(r,k,F);if(k.endsWith('color')?/^#[\da-f]{6}$/i.test(v):['bold','normal','italic'].includes(v))run[k]=v;}
 const underline=attr(r,'text-underline-style',S);if(underline)run['text-decoration']=underline==='none'?'none':'underline';for(const k of ['margin-top','margin-bottom','margin-left','margin-right','text-indent']){const n=points(attr(p,k,F));if(n!==undefined)paragraph[k]=bounded(n,k==='text-indent'?-360:0,360)+'pt';}const line=attr(p,'line-height',F);if(/^[\d.]+%$/.test(line))paragraph['line-height']=String(bounded(parseFloat(line)/100,.5,6));else if(points(line)!==undefined)paragraph['line-height']=bounded(points(line),6,360)+'pt';const align=attr(p,'text-align',F);if(['left','right','center','justify','start','end'].includes(align))paragraph['text-align']=({start:'left',end:'right'})[align]||align;return{run,paragraph};}
 function resolve(id,seen=new Set()){if(!id||seen.has(id)||seen.size>=16)return{run:{},paragraph:{}};seen.add(id);const s=styles.get(id);if(!s)return{run:{},paragraph:{}};const parent=resolve(attr(s,'parent-style-name',S),seen),own=properties(s);return{run:{...parent.run,...own.run},paragraph:{...parent.paragraph,...own.paragraph}};}
 const defaultP=properties(defaults.get('paragraph')),defaultT=properties(defaults.get('text'));
 function inline(el,base){return [...el.childNodes].map(n=>{if(n.nodeType===3)return esc(n.textContent);if(n.nodeType!==1)return '';if(n.namespaceURI===T){if(n.localName==='line-break')return'<br>';if(n.localName==='tab')return'&#9;';if(n.localName==='s')return' '.repeat(Math.max(1,Math.min(10000,Number(attr(n,'c',T))||1)));}const own=resolve(attr(n,'style-name',T)),run={...base,...own.run},inner=inline(n,run);if(n.namespaceURI===T&&n.localName==='a'){const href=attr(n,'href','http://www.w3.org/1999/xlink');return /^(https?:\/\/|mailto:)[^\s<>"']+$/i.test(href)?styled('a',inner,{},' href="'+esc(href)+'"'):inner;}return styled('span',inner,run);}).join('');}
 const counters=new Map();function block(el,level=1,inheritedList=''){if(el.namespaceURI===T&&['p','h'].includes(el.localName)){const own=resolve(attr(el,'style-name',T)),run={...defaultT.run,...defaultP.run,...own.run},tag=el.localName==='h'?'h'+Math.max(1,Math.min(6,Number(attr(el,'outline-level',T))||1)):'p';return styled(tag,styled('span',inline(el,run),run),{'margin-top':'0pt','margin-bottom':'0pt','font-size':run['font-size'],'font-family':run['font-family'],...defaultP.paragraph,...own.paragraph});}
 if(el.namespaceURI===T&&el.localName==='list'){const id=attr(el,'style-name',T)||inheritedList,definition=[...(listStyles.get(id)?.children||[])].find(n=>Number(attr(n,'level',T))===level),ordered=definition?.localName==='list-level-style-number',start=attr(el,'continue-numbering',T)==='true'?(counters.get(id+':'+level)||1):(Number(attr(definition,'start-value',T))||1),items=children(el,'list-item',T),tag=ordered?'ol':'ul';counters.set(id+':'+level,start+items.length);return styled(tag,items.map(item=>'<li>'+[...item.children].map(n=>block(n,level+1,id)).join('')+'</li>').join(''),{'margin-top':'0pt','margin-bottom':'0pt'},ordered?' start="'+start+'"':'');}
 if(el.localName==='table'&&el.namespaceURI?.includes('table'))return'<table><tbody>'+[...el.children].filter(n=>n.localName==='table-row').map(row=>'<tr>'+[...row.children].filter(n=>n.localName==='table-cell').map(cell=>'<td>'+[...cell.children].map(n=>block(n,level)).join('')+'</td>').join('')+'</tr>').join('')+'</tbody></table>';return [...el.children].map(n=>block(n,level)).join('');}
 const body=descendants(d,'text').find(n=>n.namespaceURI?.includes('office'));if(!body)throw Error('The OpenDocument file has no text body.');return [...body.children].map(n=>block(n)).join('')||'<p></p>';
}

// Only decoder-generated DocBook is accepted; original DOC bytes are handled in a worker.
export function legacyWordXmlToHtml(decoded){
 const input=decoded.replace(/<!DOCTYPE book PUBLIC "-\/\/OASIS\/\/DTD DocBook XML V4\.1\.2\/\/EN"\s+"http:\/\/www\.oasis-open\.org\/docbook\/xml\/4\.1\.2\/docbookx\.dtd">/,'');
 const d=xml(input);if(d.documentElement.localName!=='book')throw Error('Invalid legacy Word decoder output.');
 let lastSize=12,pendingMetrics;
 const bool=(el,key)=>el.getAttribute(key)==='1';
 function inline(el){return [...el.childNodes].map(n=>{
  if(n.nodeType===3)return el.localName!=='phrase'&&/^\s*$/.test(n.textContent)?'':esc(n.textContent);if(n.nodeType!==1)return '';
  if(n.localName==='phrase'&&n.getAttribute('role')==='splatworks-paragraph')return '';
  if(n.localName==='phrase'){
   const size=bounded(Number(n.getAttribute('font-size')),6,120),family=font(n.getAttribute('font-family')),color=n.getAttribute('color');
   return styled('span',inline(n),{'font-size':size?size+'pt':undefined,'font-family':family||undefined,color:/^#[\da-f]{6}$/i.test(color||'')?color:undefined,'font-weight':bool(n,'bold')?'bold':'normal','font-style':bool(n,'italic')?'italic':'normal','text-decoration':[bool(n,'underline')?'underline':'',bool(n,'strike')?'line-through':''].filter(Boolean).join(' ')||'none'});
  }
  if(['imagedata','mediaobject','imageobject'].includes(n.localName))return '';
  // Every decoded text run has its own explicit flags, including normal overrides.
  return inline(n);
 }).join('');}
 function paragraph(el,tag='p',inList=false){
  const metrics=el.querySelector('phrase[role="splatworks-paragraph"]')||pendingMetrics,firstRun=el.querySelector('phrase[font-size]'),size=bounded(Number(metrics?.getAttribute('size')||firstRun?.getAttribute('font-size')||lastSize),6,120)||12;lastSize=size;
  pendingMetrics=null;
  const props={'margin-top':'0pt','margin-bottom':'0pt','font-size':size+'pt','line-height':'1.2','font-family':font(firstRun?.getAttribute('font-family'))||undefined,color:/^#[\da-f]{6}$/i.test(firstRun?.getAttribute('color')||'')?firstRun.getAttribute('color'):undefined,'font-weight':firstRun&&bool(firstRun,'bold')?'bold':'normal','font-style':firstRun&&bool(firstRun,'italic')?'italic':'normal','text-decoration':firstRun&&bool(firstRun,'underline')?'underline':'none'};
  if(metrics){for(const[key,cssKey]of[['before','margin-top'],['after','margin-bottom'],['left','margin-left'],['right','margin-right'],['first','text-indent']])props[cssKey]=(bounded(Number(metrics.getAttribute(key)),key==='first'?-360:0,360)||0)+'pt';props['text-align']=['left','center','right','justify'][Number(metrics.getAttribute('align'))]||'left';}
  if(inList){props['margin-left']='0pt';props['text-indent']='0pt';}
  return styled(tag,inline(el).replace(/^\s*\n|\n\s*$/g,''),props);
 }
 function block(el,inList=false){
  if(el.localName==='phrase'&&el.getAttribute('role')==='splatworks-paragraph'){pendingMetrics=el;return '';}
  if(el.localName==='bookinfo')return '';
  if(el.localName==='title')return el.parentElement.localName==='book'||!el.textContent.trim()?'':paragraph(el,'h2');
  if(el.localName==='para')return paragraph(el,'p',inList);
  if(['orderedlist','itemizedlist'].includes(el.localName)){
   const ordered=el.localName==='orderedlist',type={loweralpha:'a',upperalpha:'A',lowerroman:'i',upperroman:'I'}[el.getAttribute('numeration')],items=[...el.children].filter(e=>e.localName==='listitem'),number=items[0]?.getAttribute('override');
   return styled(ordered?'ol':'ul',items.map(item=>'<li'+(/^\d+$/.test(item.getAttribute('override')||'')?' value="'+item.getAttribute('override')+'"':'')+'>'+[...item.children].map(n=>block(n,true)).join('')+'</li>').join(''),{'margin-top':'0pt','margin-bottom':'0pt','padding-left':'36pt'},ordered?' start="'+(/^\d+$/.test(number||'')?number:1)+'"'+(type?' type="'+type+'"':''):'');
  }
  if(el.localName==='entry')return'<td>'+[...el.children].map(n=>block(n)).join('')+'</td>';
  if(el.localName==='row')return'<tr>'+[...el.children].map(n=>block(n)).join('')+'</tr>';
  if(el.localName==='table'||el.localName==='informaltable')return'<table><tbody>'+[...el.children].map(n=>block(n)).join('')+'</tbody></table>';
  return [...el.children].map(n=>block(n,inList)).join('');
 }
 return [...d.documentElement.children].map(n=>block(n)).join('')||'<p></p>';
}
