// DrawingML slide rendering stays local. Read only direct properties: descendants
// may be unrelated run colors, picture dimensions, or Office extension metadata.
const children = (node, name) => [...(node?.children || [])].filter(n => !name || n.localName === name);
const child = (node, name) => children(node, name)[0];
const at = (node, name, fallback) => node?.getAttribute(name) ?? fallback;
const value = (nodes, name, fallback) => nodes.find(n => n?.hasAttribute(name))?.getAttribute(name) ?? fallback;
const pick = (nodes, name) => nodes.map(n => child(n, name)).find(Boolean);
const pt = value => Number(value || 0) / 12700;
const truth = value => value === '1' || value === 'true';
const shapeProps = shape => child(shape, shape?.localName === 'grpSp' ? 'grpSpPr' : 'spPr');
const placeholder = shape => child(child(shape, 'nvSpPr') || child(shape, 'nvPicPr'), 'nvPr')?.getElementsByTagNameNS('*', 'ph')[0];
const tree = doc => child(child(doc?.documentElement, 'cSld'), 'spTree');
const fills = ['noFill', 'solidFill', 'gradFill', 'blipFill'];
const fillNode = nodes => nodes.flatMap(n => children(n).filter(c => fills.includes(c.localName)))[0];

function colors(theme, master, layout, slide) {
 const scheme = child(child(theme?.documentElement, 'themeElements'), 'clrScheme');
 const palette = Object.fromEntries(children(scheme).map(n => [n.localName, at(n.firstElementChild, 'val', at(n.firstElementChild, 'lastClr', '000000'))]));
 const map = {bg1:'lt1',tx1:'dk1',bg2:'lt2',tx2:'dk2'};
 for (const doc of [master, layout, slide]) {
  const override = child(doc?.documentElement, 'clrMap') || child(child(doc?.documentElement, 'clrMapOvr'), 'overrideClrMapping');
  for (const attr of override?.attributes || []) map[attr.localName] = attr.value;
 }
 return (container, fallback = '#000000', reference) => {
  const node = children(container).find(n => ['srgbClr','schemeClr','sysClr','prstClr'].includes(n.localName));
  if (!node) return fallback;
  const key = at(node, 'val');
  let hex = node.localName === 'schemeClr' ? (key === 'phClr' ? reference?.replace('#','') : palette[map[key] || key]) : node.localName === 'sysClr' ? at(node,'lastClr') : key;
  hex = ({black:'000000',white:'FFFFFF',red:'FF0000',blue:'0000FF',yellow:'FFFF00'})[hex] || hex;
  if (!/^[\da-f]{6}$/i.test(hex || '')) return fallback;
  let channels = [0,2,4].map(i => parseInt(hex.slice(i,i+2),16) / 255), alpha = 1;
  for (const transform of children(node)) {
   const n = Number(at(transform,'val',0)) / 100000;
   if (transform.localName === 'alpha') alpha = n;
   else if (transform.localName === 'tint') channels = channels.map(c => c + (1-c)*n);
   else if (transform.localName === 'shade') channels = channels.map(c => c*n);
   else if (transform.localName === 'lumMod') channels = channels.map(c => c*n);
   else if (transform.localName === 'lumOff') channels = channels.map(c => c+n);
  }
  return `rgba(${channels.map(c => Math.round(Math.max(0,Math.min(1,c))*255)).join(',')},${alpha})`;
 };
}

function matching(shape, doc, byIndex) {
 const ph = placeholder(shape); if (!ph) return;
 return children(tree(doc)).find(candidate => {
  const other = placeholder(candidate); if (!other) return false;
  return byIndex ? at(other,'idx','0') === at(ph,'idx','0') : at(other,'type','body') === at(ph,'type','body');
 });
}
function fontFamily(name, theme) {
 if (/^\+m[jn]-/.test(name)) name = at(child(child(child(theme?.documentElement,'themeElements'),'fontScheme'),name[2] === 'j' ? 'majorFont':'minorFont')?.getElementsByTagNameNS('*','latin')[0], 'typeface', 'Arial');
 // Keep installed source fonts; use metric-compatible Office fallbacks where possible.
 const fallback = /courier|mono|consolas/i.test(name) ? 'monospace' : /times|cambria|georgia|serif/i.test(name) ? 'serif' : /calibri|aptos/i.test(name) ? 'Carlito, Calibri, Arial, sans-serif' : 'Arial, sans-serif';
 return `${JSON.stringify(name || 'Arial')}, ${fallback}`;
}
function setFont(ctx, style) { ctx.font = `${style.italic ? 'italic ' : ''}${style.bold ? 'bold ' : ''}${style.size}px ${style.family}`; }
function runStyle(nodes, color, theme, scale = 1) {
 const baseline = Number(value(nodes,'baseline',0)) / 100000;
 const nominal = Math.max(1,Number(value(nodes,'sz',1800))/100) * scale;
 return {size:nominal * (baseline ? .65:1),nominal,baseline,bold:truth(value(nodes,'b','0')),italic:truth(value(nodes,'i','0')),underline:value(nodes,'u','none') !== 'none',family:fontFamily(at(pick(nodes,'latin'),'typeface','Arial'),theme),color:color(pick(nodes,'solidFill')),spacing:Number(value(nodes,'spc',0))/100*scale};
}
function spacing(nodes, name, size, fallback) {
 const node = pick(nodes,name); if (!node) return fallback;
 const points = child(node,'spcPts'); return points ? Number(at(points,'val'))/100 : Number(at(child(node,'spcPct'),'val',0))/100000*size;
}

function drawText(ctx, shape, chain, box, env) {
 const body = child(shape,'txBody'); if (!body) return;
 const bodies = chain.map(n => child(n,'txBody'));
 const bodyProps = bodies.map(n => child(n,'bodyPr'));
 const inset = (name, fallback) => pt(value(bodyProps,name,fallback));
 const left = inset('lIns',91440), right = inset('rIns',91440), top = inset('tIns',45720), bottom = inset('bIns',45720);
 const width = Math.max(1,box.w-left-right), height = Math.max(1,box.h-top-bottom);
 const auto = pick(bodyProps,'normAutofit'), scale = Number(at(auto,'fontScale',100000))/100000;
 const paragraphs = children(body,'p'), lines = []; let y = 0;
 for (const p of paragraphs) {
  const pPr = child(p,'pPr'), level = Number(at(pPr,'lvl',0)) + 1;
  const phType = at(placeholder(shape),'type','other');
  const masterStyle = child(child(env.master?.documentElement,'txStyles'), /^(title|ctrTitle)$/.test(phType) ? 'titleStyle' : phType === 'body' ? 'bodyStyle' : 'otherStyle');
  const props = [pPr,...bodies.map(n => child(child(n,'lstStyle'),`lvl${level}pPr`)),child(masterStyle,`lvl${level}pPr`),child(env.defaultText,`lvl${level}pPr`)];
  const defaults = props.map(n => child(n,'defRPr'));
  const baseStyle = runStyle(defaults,env.color,env.theme,scale);
  const marL = pt(value(props,'marL',0)), marR = pt(value(props,'marR',0)), indent = pt(value(props,'indent',0));
  const bullet = props.flatMap(n => children(n).filter(c => ['buNone','buChar','buAutoNum'].includes(c.localName)))[0];
  const bulletText = bullet?.localName === 'buChar' ? at(bullet,'char','•') : bullet?.localName === 'buAutoNum' ? `${Number(at(bullet,'startAt',1)) + paragraphs.indexOf(p)}.` : '';
  const pieces = [];
  for (const run of children(p)) {
   if (run.localName === 'br') { pieces.push({break:true}); continue; }
   if (!['r','fld'].includes(run.localName)) continue;
   const style = runStyle([child(run,'rPr'),...defaults],env.color,env.theme,scale);
   for (const text of (child(run,'t')?.textContent || '').split(/(\s+)/).filter(Boolean)) pieces.push({text,style});
  }
  const sizes = pieces.filter(t=>t.style).map(t=>t.style.nominal);
  const paraSize = sizes.length ? Math.max(...sizes) : runStyle([child(p,'endParaRPr'),...defaults],env.color,env.theme,scale).nominal;
  if (lines.length) y += spacing(props,'spcBef',paraSize,0);
  let current = [], used = 0, firstLine = true;
  const start = () => marL + (firstLine && !bulletText ? indent : 0);
  const flush = () => {
   const size = Math.max(paraSize,...current.map(t => t.style.nominal));
   const natural = size * 1.16;
   const advance = spacing(props,'lnSpc',natural,natural) * (1-Number(at(auto,'lnSpcReduction',0))/100000);
   while (current.length && /^\s+$/.test(current.at(-1).text)) used -= current.pop().width;
   lines.push({items:current,x:start(),y,size,width:used,align:value(props,'algn','l'),bullet:firstLine ? bulletText:'',bulletX:marL+indent,bulletStyle:current[0]?.style || baseStyle,advance});
   y += advance; current = []; used = 0; firstLine = false;
  };
  for (const piece of pieces) {
   if (piece.break) { flush(); continue; }
   setFont(ctx,piece.style);
   const measure = text => ctx.measureText(text).width + Math.max(0,text.length-1)*piece.style.spacing;
   let tokens = [piece.text];
   if (measure(piece.text) > width-marL-marR && !/^\s+$/.test(piece.text)) tokens = [...piece.text];
   for (const text of tokens) {
    const measured = measure(text);
    if (value(bodyProps,'wrap','square') !== 'none' && used+measured > width-start()-marR && current.length && text.trim()) flush();
    if (!current.length && !text.trim()) continue;
    current.push({...piece,text,width:measured}); used += measured;
   }
  }
  if (current.length || !pieces.length || pieces.at(-1)?.break) flush();
  y += spacing(props,'spcAft',paraSize,0);
 }
 const anchor = value(bodyProps,'anchor','t');
 const offset = anchor === 'ctr' ? Math.max(0,(height-y)/2) : anchor === 'b' ? Math.max(0,height-y):0;
 ctx.save();
 // Text is constrained to its shape, including source padding and vertical anchoring.
 ctx.beginPath(); ctx.rect(box.x,box.y,box.w,box.h); ctx.clip();
 for (const line of lines) {
  let x = box.x+left+line.x;
  const available = width-line.x;
  if (line.align === 'ctr') x += (available-line.width)/2;
  else if (line.align === 'r') x += available-line.width;
  const baseline = box.y+top+offset+line.y+line.size*.91;
  if (line.bullet) {setFont(ctx,line.bulletStyle);ctx.fillStyle=line.bulletStyle.color;ctx.fillText(line.bullet,box.x+left+line.bulletX,baseline);}
  for (const item of line.items) {
   setFont(ctx,item.style);ctx.fillStyle=item.style.color;
   const by = baseline-item.style.nominal*item.style.baseline;
   if (item.style.spacing) {let sx=x;for(const character of item.text){ctx.fillText(character,sx,by);sx+=ctx.measureText(character).width+item.style.spacing;}}
   else ctx.fillText(item.text,x,by);
   if (item.style.underline) {ctx.fillRect(x,by+item.style.size*.1,item.width,Math.max(.5,item.style.size/18));}
   x += item.width;
  }
 }
 ctx.restore();
}

function geometry(ctx, props, box, connector) {
 const {x,y,w,h} = box, preset = at(pick(props,'prstGeom'),'prst','rect');
 ctx.beginPath();
 if (connector || /^(line|straightConnector1|bentConnector\d)$/.test(preset)) {
  ctx.moveTo(x,y);
  if (/bentConnector/.test(preset)) {ctx.lineTo(x+w/2,y);ctx.lineTo(x+w/2,y+h);}
  ctx.lineTo(x+w,y+h); return;
 }
 if (preset === 'ellipse') {ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);return;}
 if (preset === 'roundRect') {ctx.roundRect(x,y,w,h,Math.min(w,h)*.16);return;}
 const paths = children(pick(props,'custGeom') && child(pick(props,'custGeom'),'pathLst'),'path');
 if (paths.length) {
  for (const path of paths) {
   const pw=Number(at(path,'w',w*12700)),ph=Number(at(path,'h',h*12700));
   const point = p => [x+Number(at(p,'x',0))/pw*w,y+Number(at(p,'y',0))/ph*h];
   for (const cmd of children(path)) {
    const points=children(cmd,'pt').flatMap(point);
    if (cmd.localName==='moveTo') ctx.moveTo(...points);
    else if (cmd.localName==='lnTo') ctx.lineTo(...points);
    else if (cmd.localName==='cubicBezTo') ctx.bezierCurveTo(...points);
    else if (cmd.localName==='quadBezTo') ctx.quadraticCurveTo(...points);
    else if (cmd.localName==='close') ctx.closePath();
   }
  }
 } else ctx.rect(x,y,w,h);
}

export async function pptxPdf(zip, helpers) {
 const {readXml,relationships,zipImage,attribute} = helpers, {PDFDocument} = globalThis.PDFLib;
 const docs = new Map(), rels = new Map(), images = new Map();
 const read = async path => {if(!path || !zip.file(path))return null;if(!docs.has(path))docs.set(path,await readXml(zip,path));return docs.get(path);};
 const relations = async path => {if(!path)return new Map();if(!rels.has(path))rels.set(path,await relationships(zip,path));return rels.get(path);};
 const related = (map, directory) => [...map.values()].find(p => p.includes(directory+'/'));
 const presentation = await readXml(zip,'ppt/presentation.xml'), presentationRels = await relations('ppt/presentation.xml');
 const sz = child(presentation.documentElement,'sldSz'), w = pt(at(sz,'cx',9144000)), h = pt(at(sz,'cy',6858000));
 if (!Number.isFinite(w) || !Number.isFinite(h) || w<=0 || h<=0 || Math.max(w,h)>14400) throw Error('Invalid PowerPoint slide dimensions.');
 const doc = await PDFDocument.create();
 async function picture(ctx, fill, box, map) {
  const path = map.get(attribute(child(fill,'blip'),'embed')); if (!path) return;
  if (!images.has(path)) {
   const data = await zipImage(zip,path);if(!data)return;
   const url=URL.createObjectURL(new Blob([data.bytes],{type:'image/png'})),image=new Image();
   try{image.src=url;await image.decode();images.set(path,image);}finally{URL.revokeObjectURL(url);}
  }
  const image=images.get(path),crop=child(fill,'srcRect');
  const l=Number(at(crop,'l',0))/100000,t=Number(at(crop,'t',0))/100000,r=Number(at(crop,'r',0))/100000,b=Number(at(crop,'b',0))/100000;
  if(l+r<1 && t+b<1)ctx.drawImage(image,l*image.width,t*image.height,(1-l-r)*image.width,(1-t-b)*image.height,box.x,box.y,box.w,box.h);
 }
 for (const id of children(child(presentation.documentElement,'sldIdLst'),'sldId')) {
  const path = presentationRels.get([...id.attributes].find(a=>a.localName==='id'&&a.namespaceURI?.includes('relationships'))?.value);
  if (!path) throw Error('A PowerPoint slide relationship is missing.');
  const slide=await read(path);if(!slide)throw Error('A PowerPoint slide is missing.');
  const slideRels=await relations(path),layoutPath=related(slideRels,'slideLayouts'),layout=await read(layoutPath),layoutRels=await relations(layoutPath),masterPath=related(layoutRels,'slideMasters'),master=await read(masterPath),masterRels=await relations(masterPath);
  const theme=await read(related(masterRels,'theme') || related(presentationRels,'theme'));
  const env={color:colors(theme,master,layout,slide),theme,master,defaultText:child(presentation.documentElement,'defaultTextStyle')};
  const canvas=document.createElement('canvas'),factor=Math.min(2,4096/Math.max(w,h));canvas.width=Math.ceil(w*factor);canvas.height=Math.ceil(h*factor);
  const ctx=canvas.getContext('2d');ctx.scale(canvas.width/w,canvas.height/h);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);
  const paint = async (fill, box, map, reference) => {
   if(!fill || fill.localName==='noFill')return false;
   if(fill.localName==='blipFill') {await picture(ctx,fill,box,map);return false;}
   if(fill.localName==='gradFill') {
    const angle=Number(at(child(fill,'lin'),'ang',0))/60000*Math.PI/180,dx=Math.cos(angle)*box.w/2,dy=Math.sin(angle)*box.h/2;
    const gradient=ctx.createLinearGradient(box.x+box.w/2-dx,box.y+box.h/2-dy,box.x+box.w/2+dx,box.y+box.h/2+dy);
    for(const stop of children(child(fill,'gsLst'),'gs'))gradient.addColorStop(Math.max(0,Math.min(1,Number(at(stop,'pos',0))/100000)),env.color(stop,'#000000',reference));
    ctx.fillStyle=gradient;
   } else ctx.fillStyle=env.color(fill,'#000000',reference);
   return true;
  };
  for(const [part,map] of [[slide,slideRels],[layout,layoutRels],[master,masterRels]]) {
   const bg=child(child(part?.documentElement,'cSld'),'bg');if(!bg)continue;
   const fill=fillNode([child(bg,'bgPr')]);
   if(await paint(fill,{x:0,y:0,w,h},map))ctx.fillRect(0,0,w,h);break;
  }
  async function draw(shape, map, inheritedLayer=false) {
   if(truth(at(child(shape,'cNvPr'),'hidden')) || truth(at(shape.getElementsByTagNameNS('*','cNvPr')[0],'hidden')))return;
   if(inheritedLayer && placeholder(shape))return;
   if(shape.localName==='grpSp') {
    const tx=child(shapeProps(shape),'xfrm'),off=child(tx,'off'),ext=child(tx,'ext'),co=child(tx,'chOff'),ce=child(tx,'chExt');
    ctx.save();ctx.translate(pt(at(off,'x')),pt(at(off,'y')));
    const gw=pt(at(ext,'cx')),gh=pt(at(ext,'cy')),cw=pt(at(ce,'cx')),ch=pt(at(ce,'cy'));
    const angle=Number(at(tx,'rot',0))/60000*Math.PI/180;
    ctx.translate(gw/2,gh/2);ctx.rotate(angle);ctx.scale(truth(at(tx,'flipH'))?-1:1,truth(at(tx,'flipV'))?-1:1);ctx.translate(-gw/2,-gh/2);
    ctx.scale(cw?gw/cw:1,ch?gh/ch:1);ctx.translate(-pt(at(co,'x')),-pt(at(co,'y')));
    for(const n of children(shape))await draw(n,map,inheritedLayer);ctx.restore();return;
   }
   if(!['sp','pic','cxnSp','graphicFrame'].includes(shape.localName))return;
   const layoutShape=matching(shape,layout,true),masterShape=matching(layoutShape||shape,master,false),chain=[shape,layoutShape,masterShape].filter(Boolean),props=chain.map(shapeProps);
   const tx=child(shape,'xfrm') || pick(props,'xfrm'),off=child(tx,'off'),ext=child(tx,'ext');if(!tx||!off||!ext)return;
   const box={x:pt(at(off,'x')),y:pt(at(off,'y')),w:pt(at(ext,'cx')),h:pt(at(ext,'cy'))};
   ctx.save();ctx.translate(box.x+box.w/2,box.y+box.h/2);ctx.rotate(Number(at(tx,'rot',0))/60000*Math.PI/180);
   ctx.scale(truth(at(tx,'flipH'))?-1:1,truth(at(tx,'flipV'))?-1:1);ctx.translate(-box.x-box.w/2,-box.y-box.h/2);
   if(shape.localName==='pic')await picture(ctx,child(shape,'blipFill'),box,map);
   else if(shape.localName==='graphicFrame') {
    const table=child(child(shape,'graphic'),'graphicData')?.getElementsByTagNameNS('*','tbl')[0];
    const columns=children(child(table,'tblGrid'),'gridCol').map(n=>pt(at(n,'w'))),rows=children(table,'tr');
    const totalWidth=columns.reduce((a,b)=>a+b,0),totalHeight=rows.reduce((n,row)=>n+pt(at(row,'h')),0);
    let cy=box.y;
    for(const row of rows) {
     const rh=totalHeight?pt(at(row,'h'))/totalHeight*box.h:0;let cx=box.x;
     for(const [index,cell] of children(row,'tc').entries()) {
      const cw=totalWidth?(columns[index]||0)/totalWidth*box.w:0,rect={x:cx,y:cy,w:cw,h:rh};
      if(await paint(fillNode([child(cell,'tcPr')]),rect,map))ctx.fillRect(cx,cy,cw,rh);
      drawText(ctx,cell,[cell],rect,env);cx+=cw;
     }
     cy+=rh;
    }
   } else {
    const connector=shape.localName==='cxnSp',style=pick(chain,'style'),fillRef=child(style,'fillRef');
    let fill=fillNode(props);
    if(!fill && fillRef && Number(at(fillRef,'idx',0))>0)fill=children(child(child(child(theme?.documentElement,'themeElements'),'fmtScheme'),'fillStyleLst'))[Number(at(fillRef,'idx'))-1];
    geometry(ctx,props,box,connector);
    if(await paint(fill,box,map,env.color(fillRef)))ctx.fill();
    const line=pick(props,'ln');
    if(line && !child(line,'noFill')) {
     geometry(ctx,props,box,connector);ctx.strokeStyle=env.color(child(line,'solidFill'),'#000000');ctx.lineWidth=pt(at(line,'w',12700));
     const dash=at(child(line,'prstDash'),'val','solid');ctx.setLineDash(dash==='solid'?[]:dash==='dot'?[ctx.lineWidth,ctx.lineWidth*2]:[ctx.lineWidth*4,ctx.lineWidth*3]);ctx.stroke();ctx.setLineDash([]);
    }
    // Shape flips affect geometry, not the direction of its text.
    ctx.restore();ctx.save();ctx.translate(box.x+box.w/2,box.y+box.h/2);ctx.rotate(Number(at(tx,'rot',0))/60000*Math.PI/180);ctx.translate(-box.x-box.w/2,-box.y-box.h/2);
    drawText(ctx,shape,chain,box,env);
   }
   ctx.restore();
  }
  if(!tree(slide))throw Error('A PowerPoint slide has no content tree.');
  if(!['0','false'].includes(at(slide.documentElement,'showMasterSp','1')) && !['0','false'].includes(at(layout?.documentElement,'showMasterSp','1')))for(const shape of children(tree(master)))await draw(shape,masterRels,true);
  for(const shape of children(tree(layout)))await draw(shape,layoutRels,true);
  for(const shape of children(tree(slide)))await draw(shape,slideRels);
  const image=await doc.embedPng(Uint8Array.from(atob(canvas.toDataURL().split(',')[1]),c=>c.charCodeAt(0)));
  doc.addPage([w,h]).drawImage(image,{x:0,y:0,width:w,height:h});
 }
 if(!doc.getPageCount())throw Error('No slides found in this PowerPoint file.');return doc;
}
