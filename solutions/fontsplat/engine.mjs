import {composeImageArt} from './image-layout.mjs';
// FontSplat's original vector text effects. No third-party generator or service.
export const PRESETS = [
 ['splat','Splat shine','#9f3aff','#4d17b1','gloss'],['neon','Neon nights','#ff4cca','#65f3fa','neon'],
 ['chrome','Chrome studio','#f5f7ff','#56627e','chrome'],['gold','Liquid gold','#fff5a3','#be7314','gold'],
 ['retro','Retro print','#ffe4b8','#ef6c76','retro'],['comic','Comic pop','#ffcf45','#ff8d3a','comic'],
 ['rainbow','Rainbow ribbon','#8b4dff','#17bebb','rainbow'],['sunset','Sunset glow','#ffbf65','#dc4a92','gradient'],
 ['outline','Outline only','#7c3aed','#35b9ab','outline'],['glitch','RGB glitch','#4a257c','#32d9df','glitch'],
 ['ice','Ice lettering','#d9fdff','#4286da','ice'],['ink','Ink stamp','#34205c','#34205c','ink'],
 ['stack','Dimensional','#be78ff','#5e23af','stack'],['sticker','Sticker cutout','#8c42e9','#e28cfc','sticker'],
 ['blueburst','Blue burst','#76ddff','#1461d9','gloss',{outline:'#174c9a',outlineWidth:2,depth:13,skew:-10,rotate:0,weight:900,font:'display',italic:false}],
 ['spectrum','Spectrum serif','#ef435b','#5bce67','rainbow',{outline:'#ffffff',outlineWidth:0,depth:0,skew:0,rotate:0,weight:700,font:'serif',italic:false}],
 ['bronze','Golden rise','#ffe467','#d66b14','gold',{outline:'#713216',outlineWidth:2,depth:15,skew:-12,rotate:-7,weight:900,font:'display',italic:false}],
 ['silverpress','Silver press','#ffffff','#798a9e','chrome',{outline:'#3c4654',outlineWidth:2,depth:12,skew:-13,rotate:0,weight:900,font:'display',italic:false}],
 ['forest','Forest carved','#a7ce61','#1b4b2e','gradient',{outline:'#193522',outlineWidth:2,depth:14,skew:0,rotate:-4,weight:900,font:'display',italic:false}],
 ['swift','Swift outline','#35303f','#c6c3cf','outline',{outline:'#35303f',outlineWidth:2,depth:0,skew:15,rotate:-4,weight:700,font:'serif',italic:true}],
 ['satin','Satin gradient','#ff81b7','#676bea','gradient'],['shadow','Soft shadow','#176f72','#33c1a2','shadow'],
].map(([id,name,primary,secondary,effect,defaults={}])=>({id,name,primary,secondary,effect,defaults}));
export const TEXT_PATHS=[['straight','Straight'],['arch-up','Arch up'],['arch-down','Arch down'],['circle','Circle'],['oval','Oval'],['wave','Wave'],['banner','Banner curve'],['chevron','Chevron']].map(([id,name])=>({id,name}));
export const FONTS = [
 {id:'sans',name:'Liberation Sans',file:'LiberationSans-Regular.ttf'},
 {id:'comic',name:'Comic Neue',file:'ComicNeue-Regular.ttf'},
 {id:'serif',name:'Liberation Serif',file:'LiberationSerif-Regular.ttf'},
 {id:'display',name:'DejaVu Sans',file:'DejaVuSans.ttf'},
 {id:'arabic',name:'Arabic · Noto',file:'LayoutSplatArabic.woff'},
 {id:'indic',name:'Devanagari · Noto',file:'LayoutSplatIndic.woff'},
 {id:'cjk',name:'CJK · Noto',file:'LayoutSplatCJK.woff'},
];
export const DEFAULT_PROJECT = Object.freeze({app:'FontSplat',version:1,text:'Make a splash',preset:'splat',font:'display',size:96,weight:900,italic:false,primary:'#9f3aff',secondary:'#4d17b1',outline:'#34205c',outlineWidth:2,spacing:0,curve:0,rotate:0,skew:0,depth:7,background:'#ffffff',transparent:true,above:2,through:0,below:1,seed:1,applyGlitch:false,pulse:false,fontData:'',fontName:'',images:[],shape:'none',shapeFill:'#ede7ff',shapeStroke:'#7c3aed',textPath:'straight',pathOffset:50,pathFit:false,bendStrength:85,imageLayout:'free',imageGap:10,bottomText:'',textTransforms:{}});
const clamp=(value,min,max,fallback)=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Number(value))):fallback;
const hex=(value,fallback)=>/^#[0-9a-f]{6}$/i.test(value||'')?value:fallback;
export const xml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function normalizeProject(input={}) {
 const d=DEFAULT_PROJECT,p={...d};
 if(input.app!==undefined&&(input.app!=='FontSplat'||input.version!==1))throw Error('Choose a FontSplat version 1 project.');
 p.text=String(input.text??d.text).replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,'').slice(0,400).split('\n').slice(0,8).join('\n');
 p.preset=PRESETS.some(s=>s.id===input.preset)?input.preset:d.preset;
 p.font=FONTS.some(f=>f.id===input.font)||input.font==='custom'?input.font:d.font;
 for(const [key,min,max] of [['size',24,160],['weight',400,900],['outlineWidth',0,12],['spacing',-2,16],['curve',-100,100],['rotate',-20,20],['skew',-25,25],['depth',0,20],['above',0,8],['through',0,4],['below',0,8],['seed',1,999999]])p[key]=clamp(input[key]??d[key],min,max,d[key]);
 for(const key of ['italic','transparent','applyGlitch','pulse','pathFit'])p[key]=input[key]===undefined?d[key]:input[key]===true;
 for(const key of ['primary','secondary','outline','background','shapeFill','shapeStroke'])p[key]=hex(input[key],d[key]);
 p.fontData=typeof input.fontData==='string'?input.fontData:'';
 if(p.fontData&&(!/^data:font\/(ttf|otf|woff2?);base64,[A-Za-z0-9+/=]+$/.test(p.fontData)||p.fontData.length>8000000))throw Error('Embedded fonts must be local TTF, OTF, WOFF or WOFF2 files under 6 MB.');
 p.fontName=typeof input.fontName==='string'?input.fontName.slice(0,100):'';
 if(p.font==='custom'&&!p.fontData)p.font=d.font;
 p.textPath=TEXT_PATHS.some(path=>path.id===input.textPath)?input.textPath:'straight';
 p.bendStrength=clamp(input.bendStrength,0,100,85);
 p.pathOffset=clamp(input.pathOffset,0,100,50);
 p.imageLayout=['free','above','below','around'].includes(input.imageLayout)?input.imageLayout:'free';
 p.imageGap=clamp(input.imageGap,-140,140,10);
 p.bottomText=String(input.bottomText||'').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,'').slice(0,200).split('\n').slice(0,4).join('\n');
 p.shape=['none','banner','ribbon','oval','circle','badge','rounded'].includes(input.shape)?input.shape:'none';
 p.textTransforms=Object.fromEntries(['main','bottom'].map(key=>{const t=input.textTransforms?.[key]||{};return [key,{x:clamp(t.x,-150,150,0),y:clamp(t.y,-150,150,0),scale:clamp(t.scale,.2,3,1),rotation:clamp(t.rotation,-180,180,0)}];}));
 p.images=(Array.isArray(input.images)?input.images:[]).slice(0,6).map((im,i)=>{
  if(typeof im.src!=='string'||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(im.src)||im.src.length>6000000)throw Error('Use embedded PNG, JPEG or WebP pictures under 4 MB each.');
  return {id:String(im.id||i).replace(/[^a-z0-9-]/gi,'').slice(0,70),name:String(im.name||'Picture').slice(0,100),src:im.src,x:clamp(im.x,-100,200,50),y:clamp(im.y,-100,200,50),width:clamp(im.width,5,200,50),aspect:clamp(im.aspect,.05,20,1),opacity:clamp(im.opacity,0,100,100),rotation:clamp(im.rotation,-180,180,0),layer:im.layer==='front'?'front':'behind'};
 });
 if(p.images.reduce((n,im)=>n+im.src.length,0)>18000000)throw Error('Pictures in a project are limited to 13 MB total.');
 return p;
}
const ABOVE=['\u0300','\u0301','\u0302','\u0303','\u0304','\u0306','\u0307','\u0308','\u030a','\u030b','\u030c','\u0311'];
const THROUGH=['\u0334','\u0335','\u0336','\u0337','\u0338'];
const BELOW=['\u0316','\u0317','\u0318','\u0319','\u0320','\u0323','\u0324','\u0325','\u0326','\u0329','\u032d','\u0331'];
export function glitchText(text,{above=2,through=0,below=1,seed=1}={}) {
 let state=Math.floor(clamp(seed,1,999999,1));const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 return [...String(text).slice(0,400)].map(c=>{if(/\s|\p{Mark}/u.test(c))return c;let out=c;for(const [list,n] of [[ABOVE,clamp(above,0,8,2)],[THROUGH,clamp(through,0,4,0)],[BELOW,clamp(below,0,8,1)]])for(let i=0;i<Math.floor(n);i++)out+=list[Math.floor(random()*list.length)];return out;}).join('');
}
export function renderWordArt(input,{fontData='',measure,motionOpacity=1}={}) {
 const p=normalizeProject(input);if(p.imageLayout!=='free'&&p.images.length)return composeImageArt(p,{fontData,measure,motionOpacity},renderWordArt);
 const preset=PRESETS.find(s=>s.id===p.preset),glitch=glitchText(p.text,p),lines=(p.applyGlitch?glitch:p.text).split('\n'),plain=p.text||'Your words';
 const maxWidth=Math.max(80,...lines.map(line=>measure?measure(line,p):[...line].filter(c=>!/\p{Mark}/u.test(c)).length*p.size*.65));
 const textWidth=Math.min(2100,maxWidth+Math.max(0,p.spacing)*Math.max(1,[...plain].length)),padding=Math.ceil(p.size*(['arch-up','arch-down','circle','oval'].includes(p.textPath)?1.7:.65)+p.depth+Math.abs(p.curve)*1.3+(p.applyGlitch?(p.above+p.below)*p.size*.15:0));
 const arch=['arch-up','arch-down'].includes(p.textPath),arcAngle=Math.PI*Math.max(.001,p.bendStrength/100),arcRadius=textWidth/(2*Math.sin(arcAngle/2)),arcRise=p.bendStrength?arcRadius*(1-Math.cos(arcAngle/2)):0;
 const lineHeight=p.size*1.4,ring=['circle','oval'].includes(p.textPath),ringInset=(lines.length-1)*lineHeight,
 radiusX=Math.max(p.size*(p.textPath==='oval'?4:2.8),textWidth/(p.textPath==='oval'?4.5:5.3))+ringInset,
 radiusY=p.textPath==='oval'?Math.max(p.size*2.8,textWidth/7.5)+ringInset:radiusX,
 pathRise=ring?0:arch?arcRise:p.textPath==='straight'?Math.abs(p.curve):p.textPath==='chevron'?p.size*1.1:p.size*.85,
 baseWidth=ring?radiusX*2+padding*2:textWidth+padding*2,
 baseHeight=ring?radiusY*2+padding*2:lines.length*lineHeight+padding*2+pathRise*(arch?1:2),
 radians=p.rotate*Math.PI/180,skewRoom=baseHeight*Math.abs(Math.tan(p.skew*Math.PI/180)),
 rawWidth=Math.ceil(Math.abs((baseWidth+skewRoom)*Math.cos(radians))+Math.abs(baseHeight*Math.sin(radians))),
 rawHeight=Math.ceil(Math.abs((baseWidth+skewRoom)*Math.sin(radians))+Math.abs(baseHeight*Math.cos(radians))),font=fontData||p.fontData;
 const height=p.shape==='circle'?Math.max(rawWidth,rawHeight):rawHeight,width=p.shape==='circle'?height:rawWidth;
 if(font&&!/^data:font\/(ttf|otf|woff2?);base64,[A-Za-z0-9+/=]+$/.test(font))throw Error('Unsupported embedded font.');
 const stops=preset.effect==='rainbow'?['#ff6277','#ffc856','#31c8a4','#41aaff','#9962ed']:preset.effect==='chrome'?[p.primary,p.secondary,'#ffffff',p.secondary,p.primary]:preset.effect==='gold'?[p.primary,p.secondary,'#fff7ba',p.secondary]:preset.effect==='gloss'?[p.primary,'#d6a3ff',p.secondary,p.primary]:[p.primary,p.secondary];
 const defs=`<linearGradient id="ink" x2="${preset.id==='spectrum'?1:0}" y2="${preset.id==='spectrum'?0:1}">${stops.map((color,i)=>`<stop offset="${i/(stops.length-1)}" stop-color="${color}"/>`).join('')}</linearGradient><filter id="soft" x="-60%" y="-100%" width="220%" height="300%"><feDropShadow dx="0" dy="5" stdDeviation="${preset.effect==='neon'?7:3}" flood-color="${preset.effect==='neon'?p.primary:'#1c123b'}" flood-opacity="${preset.effect==='neon'?.85:.3}"/></filter>`;
 const family=font?'FontSplatFace':'Arial,sans-serif',style=font?`<style>@font-face{font-family:FontSplatFace;src:url('${font}')}text{font-family:FontSplatFace,Arial,sans-serif}</style>`:'';
 const common=`font-family="${family}" font-size="${p.size}" font-weight="${p.weight}" font-style="${p.italic?'italic':'normal'}" letter-spacing="${p.spacing}" text-anchor="middle" stroke-linejoin="round" paint-order="stroke"`;
 const fill=preset.effect==='outline'?'none':preset.effect==='ink'?p.primary:'url(#ink)';
 let paths='',content='';
 lines.forEach((line,i)=>{
  const y=(height-lines.length*lineHeight)/2+p.size+i*lineHeight+(p.textPath==='arch-up'?pathRise/2:p.textPath==='arch-down'?-pathRise/2:0),x=width/2,estimated=maxWidth>2100?' textLength="2100" lengthAdjust="spacingAndGlyphs"':'';
  let path='',pathLength=0;
  const left=(width-textWidth)/2,right=(width+textWidth)/2,rise=pathRise||Math.abs(p.curve),mid=width/2;
  if(ring){const rx=radiusX-i*lineHeight,ry=radiusY-i*lineHeight,cy=height/2,loop=`A${rx} ${ry} 0 1 1 ${mid} ${cy-ry}A${rx} ${ry} 0 1 1 ${mid} ${cy+ry}`;path=`M${mid} ${cy+ry}`+loop.repeat(3);pathLength=Math.PI*(3*(rx+ry)-Math.sqrt((3*rx+ry)*(rx+3*ry)));}
  else if(arch){path=p.bendStrength?`M${left} ${y}A${arcRadius} ${arcRadius} 0 0 ${p.textPath==='arch-up'?1:0} ${right} ${y}`:`M${left} ${y}L${right} ${y}`;pathLength=p.bendStrength?arcRadius*arcAngle:textWidth;}
  else if(p.textPath==='straight'&&p.curve){path=`M${left} ${y}Q${mid} ${y-p.curve*2} ${right} ${y}`;pathLength=textWidth;}
  else if(p.textPath==='wave'){path=`M${left} ${y}C${left+textWidth*.17} ${y-rise*2} ${left+textWidth*.33} ${y-rise*2} ${mid} ${y}S${right-textWidth*.17} ${y+rise*2} ${right} ${y}`;pathLength=textWidth;}
  else if(p.textPath==='banner'){path=`M${left} ${y+rise*.4}C${left+textWidth*.28} ${y-rise} ${right-textWidth*.28} ${y+rise} ${right} ${y-rise*.4}`;pathLength=textWidth;}
  else if(p.textPath==='chevron'){path=`M${left} ${y+rise*.5}L${mid} ${y-rise*.5}L${right} ${y+rise*.5}`;pathLength=Math.hypot(textWidth/2,rise)*2;}
  const lineWidth=(measure?measure(line,p):[...line].filter(c=>!/\p{Mark}/u.test(c)).length*p.size*.65)+Math.max(0,p.spacing)*Math.max(0,[...line].length-1),available=pathLength*(ring?.86:.94),fit=path&&(lineWidth>available||p.pathFit)?` textLength="${available}" lengthAdjust="${lineWidth>available?'spacingAndGlyphs':'spacing'}"`:estimated;
  const offset=ring?(100+p.pathOffset)/3:50;
  const inner=path?`<textPath href="#arc${i}" startOffset="${offset}%"${fit}>${xml(line||' ')}</textPath>`:xml(line||' ');
  if(path)paths+=`<path id="arc${i}" d="${path}"/>`;
  const text=(attrs,dx=0,dy=0)=>`<text ${common}${path?'':` x="${x}" y="${y}"`}${path?'':fit} ${attrs}${dx||dy?` transform="translate(${dx} ${dy})"`:''}>${inner}</text>`;
  if(['stack','retro','splat','comic','blueburst','bronze','silverpress','forest'].includes(preset.id))for(let k=Math.round(p.depth);k>0;k--)content+=text(`fill="${preset.effect==='retro'?(k>p.depth/2?'#2d8e97':'#e66f78'):p.outline}" stroke="${p.outline}" stroke-width="${p.outlineWidth}"`,k*.65,k*.8);
  if(preset.effect==='glitch'){content+=text('fill="#18dce0"',-5,1)+text('fill="#ff4e95"',5,-1);}
  if(preset.effect==='sticker')content+=text('fill="white" stroke="white" stroke-width="15"');
  const stroke=preset.effect==='outline'?p.primary:preset.effect==='comic'?'#2a1c3d':p.outline,sw=preset.effect==='outline'?Math.max(2,p.outlineWidth):p.outlineWidth;
  content+=text(`fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${['neon','shadow','ice','sticker'].includes(preset.effect)?' filter="url(#soft)"':''}`);
 });
 const backdrop=p.transparent?'':`<rect width="${width}" height="${height}" fill="${p.background}"/>`,pulse=p.pulse?'<animate attributeName="opacity" values="1;.6;1" dur="2s" repeatCount="indefinite"/>':'';
 const images=layer=>p.images.filter(im=>im.layer===layer).map(im=>{const w=width*im.width/100,h=w/im.aspect,x=width*im.x/100,y=height*im.y/100;return `<image data-layer="image:${im.id}" data-reference-width="${width}" data-reference-height="${height}" data-rotation="${im.rotation}" data-scale="1" href="${im.src}" x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" opacity="${im.opacity/100}" transform="rotate(${im.rotation} ${x} ${y})"/>`;}).join('');
 const plateAttrs=`fill="${p.shapeFill}" stroke="${p.shapeStroke}" stroke-width="3"`,inset=12;
 const plate=p.shape==='none'?'':['oval','circle'].includes(p.shape)?`<ellipse cx="${width/2}" cy="${height/2}" rx="${width/2-inset}" ry="${height/2-inset}" ${plateAttrs}/>`:p.shape==='banner'?`<path d="M12 12H${width-12}L${width-45} ${height/2}L${width-12} ${height-12}H12L45 ${height/2}Z" ${plateAttrs}/>`:p.shape==='ribbon'?`<path d="M12 35L65 12H${width-65}L${width-12} 35L${width-45} ${height/2}L${width-12} ${height-35}L${width-65} ${height-12}H65L12 ${height-35}L45 ${height/2}Z" ${plateAttrs}/>`:p.shape==='badge'?`<path d="M${width/2} 12L${width-12} ${height*.2}V${height*.7}L${width/2} ${height-12}L12 ${height*.7}V${height*.2}Z" ${plateAttrs}/>`:`<rect x="12" y="12" width="${width-24}" height="${height-24}" rx="${Math.min(50,height*.15)}" ${plateAttrs}/>`;
 const transform=p.textTransforms.main,textTransform=`translate(${width*transform.x/100} ${height*transform.y/100}) translate(${width/2} ${height/2}) rotate(${transform.rotation}) scale(${transform.scale}) translate(${-width/2} ${-height/2})`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title"><title id="title">${xml(plain)}</title><desc>Original FontSplat text artwork. ${xml(preset.name)}.</desc>${style}<defs>${defs}${paths}</defs>${backdrop}${images('behind')}${plate}<g data-layer="text-main" data-reference-width="${width}" data-reference-height="${height}" data-rotation="${transform.rotation}" data-scale="${transform.scale}" transform="${textTransform}"><g opacity="${clamp(motionOpacity,0,1,1)}" transform="translate(${width/2} ${height/2}) rotate(${p.rotate}) skewX(${p.skew}) translate(${-width/2} ${-height/2})">${pulse}${content}</g></g>${images('front')}</svg>`;
 const firstBaseline=(height-lines.length*lineHeight)/2+p.size+(p.textPath==='arch-up'?pathRise/2:p.textPath==='arch-down'?-pathRise/2:0),lastBaseline=firstBaseline+(lines.length-1)*lineHeight,up=p.textPath==='arch-up'?pathRise:p.textPath==='wave'?pathRise*1.5:p.textPath==='banner'?pathRise:p.textPath==='chevron'?pathRise*.5:p.textPath==='straight'?Math.max(0,p.curve):0,down=p.textPath==='arch-down'?pathRise:p.textPath==='wave'?pathRise*1.5:p.textPath==='banner'?pathRise:p.textPath==='chevron'?pathRise*.5:p.textPath==='straight'?Math.max(0,-p.curve):0,canCrop=!ring&&!p.rotate&&!p.skew&&p.shape==='none',cropTop=canCrop?Math.max(0,Math.floor(firstBaseline-up-p.size*1.2-p.outlineWidth-10-(p.applyGlitch?p.above*p.size*.2:0))):0,cropBottom=canCrop?Math.max(0,Math.floor(height-lastBaseline-down-p.size*.45-p.depth-p.outlineWidth-10-(p.applyGlitch?p.below*p.size*.2:0))):0;
 return {svg,width,height,plainText:plain,glitchText:glitch,cropTop,cropBottom};
}
