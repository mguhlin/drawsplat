// FontSplat's original vector text effects. No third-party generator or service.
export const PRESETS = [
 ['splat','Splat shine','#9f3aff','#4d17b1','gloss'],['neon','Neon nights','#ff4cca','#65f3fa','neon'],
 ['chrome','Chrome studio','#f5f7ff','#56627e','chrome'],['gold','Liquid gold','#fff5a3','#be7314','gold'],
 ['retro','Retro print','#ffe4b8','#ef6c76','retro'],['comic','Comic pop','#ffcf45','#ff8d3a','comic'],
 ['rainbow','Rainbow ribbon','#8b4dff','#17bebb','rainbow'],['sunset','Sunset glow','#ffbf65','#dc4a92','gradient'],
 ['outline','Outline only','#7c3aed','#35b9ab','outline'],['glitch','RGB glitch','#4a257c','#32d9df','glitch'],
 ['ice','Ice lettering','#d9fdff','#4286da','ice'],['ink','Ink stamp','#34205c','#34205c','ink'],
 ['stack','Dimensional','#be78ff','#5e23af','stack'],['sticker','Sticker cutout','#8c42e9','#e28cfc','sticker'],
 ['satin','Satin gradient','#ff81b7','#676bea','gradient'],['shadow','Soft shadow','#176f72','#33c1a2','shadow'],
].map(([id,name,primary,secondary,effect])=>({id,name,primary,secondary,effect}));
export const FONTS = [
 {id:'sans',name:'Liberation Sans',file:'LiberationSans-Regular.ttf'},
 {id:'comic',name:'Comic Neue',file:'ComicNeue-Regular.ttf'},
 {id:'serif',name:'Liberation Serif',file:'LiberationSerif-Regular.ttf'},
 {id:'display',name:'DejaVu Sans',file:'DejaVuSans.ttf'},
 {id:'arabic',name:'Arabic · Noto',file:'LayoutSplatArabic.woff'},
 {id:'indic',name:'Devanagari · Noto',file:'LayoutSplatIndic.woff'},
 {id:'cjk',name:'CJK · Noto',file:'LayoutSplatCJK.woff'},
];
export const DEFAULT_PROJECT = Object.freeze({app:'FontSplat',version:1,text:'Make a splash',preset:'splat',font:'display',size:96,weight:900,italic:false,primary:'#9f3aff',secondary:'#4d17b1',outline:'#34205c',outlineWidth:2,spacing:0,curve:0,rotate:0,skew:0,depth:7,background:'#ffffff',transparent:true,above:2,through:0,below:1,seed:1,applyGlitch:false,pulse:false,fontData:'',fontName:''});
const clamp=(value,min,max,fallback)=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Number(value))):fallback;
const hex=(value,fallback)=>/^#[0-9a-f]{6}$/i.test(value||'')?value:fallback;
export const xml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function normalizeProject(input={}) {
 const d=DEFAULT_PROJECT,p={...d};
 if(input.app!==undefined&&(input.app!=='FontSplat'||input.version!==1))throw Error('Choose a FontSplat version 1 project.');
 p.text=String(input.text??d.text).replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,'').slice(0,220).split('\n').slice(0,4).join('\n');
 p.preset=PRESETS.some(s=>s.id===input.preset)?input.preset:d.preset;
 p.font=FONTS.some(f=>f.id===input.font)||input.font==='custom'?input.font:d.font;
 for(const [key,min,max] of [['size',24,160],['weight',400,900],['outlineWidth',0,12],['spacing',-2,16],['curve',-100,100],['rotate',-20,20],['skew',-25,25],['depth',0,20],['above',0,8],['through',0,4],['below',0,8],['seed',1,999999]])p[key]=clamp(input[key]??d[key],min,max,d[key]);
 for(const key of ['italic','transparent','applyGlitch','pulse'])p[key]=input[key]===undefined?d[key]:input[key]===true;
 for(const key of ['primary','secondary','outline','background'])p[key]=hex(input[key],d[key]);
 p.fontData=typeof input.fontData==='string'?input.fontData:'';
 if(p.fontData&&(!/^data:font\/(ttf|otf|woff2?);base64,[A-Za-z0-9+/=]+$/.test(p.fontData)||p.fontData.length>8000000))throw Error('Embedded fonts must be local TTF, OTF, WOFF or WOFF2 files under 6 MB.');
 p.fontName=typeof input.fontName==='string'?input.fontName.slice(0,100):'';
 if(p.font==='custom'&&!p.fontData)p.font=d.font;
 return p;
}
const ABOVE=['\u0300','\u0301','\u0302','\u0303','\u0304','\u0306','\u0307','\u0308','\u030a','\u030b','\u030c','\u0311'];
const THROUGH=['\u0334','\u0335','\u0336','\u0337','\u0338'];
const BELOW=['\u0316','\u0317','\u0318','\u0319','\u0320','\u0323','\u0324','\u0325','\u0326','\u0329','\u032d','\u0331'];
export function glitchText(text,{above=2,through=0,below=1,seed=1}={}) {
 let state=Math.floor(clamp(seed,1,999999,1));const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 return [...String(text).slice(0,220)].map(c=>{if(/\s|\p{Mark}/u.test(c))return c;let out=c;for(const [list,n] of [[ABOVE,clamp(above,0,8,2)],[THROUGH,clamp(through,0,4,0)],[BELOW,clamp(below,0,8,1)]])for(let i=0;i<Math.floor(n);i++)out+=list[Math.floor(random()*list.length)];return out;}).join('');
}
export function renderWordArt(input,{fontData='',measure}={}) {
 const p=normalizeProject(input),preset=PRESETS.find(s=>s.id===p.preset),glitch=glitchText(p.text,p),lines=(p.applyGlitch?glitch:p.text).split('\n'),plain=p.text||'Your words';
 const maxWidth=Math.max(80,...lines.map(line=>measure?measure(line,p):[...line].filter(c=>!/\p{Mark}/u.test(c)).length*p.size*.65));
 const textWidth=Math.min(2100,maxWidth+Math.max(0,p.spacing)*Math.max(1,[...plain].length)),padding=Math.ceil(p.size*.65+p.depth+Math.abs(p.curve)*1.3+(p.applyGlitch?(p.above+p.below)*p.size*.15:0));
 const lineHeight=p.size*1.4,baseWidth=textWidth+padding*2,baseHeight=lines.length*lineHeight+padding*2,radians=p.rotate*Math.PI/180,skewRoom=baseHeight*Math.abs(Math.tan(p.skew*Math.PI/180)),width=Math.ceil(Math.abs((baseWidth+skewRoom)*Math.cos(radians))+Math.abs(baseHeight*Math.sin(radians))),height=Math.ceil(Math.abs((baseWidth+skewRoom)*Math.sin(radians))+Math.abs(baseHeight*Math.cos(radians))),font=fontData||p.fontData;
 if(font&&!/^data:font\/(ttf|otf|woff2?);base64,[A-Za-z0-9+/=]+$/.test(font))throw Error('Unsupported embedded font.');
 const stops=preset.effect==='rainbow'?['#ff6277','#ffc856','#31c8a4','#41aaff','#9962ed']:preset.effect==='chrome'?[p.primary,p.secondary,'#ffffff',p.secondary,p.primary]:preset.effect==='gold'?[p.primary,p.secondary,'#fff7ba',p.secondary]:preset.effect==='gloss'?[p.primary,'#d6a3ff',p.secondary,p.primary]:[p.primary,p.secondary];
 const defs=`<linearGradient id="ink" x2="0" y2="1">${stops.map((color,i)=>`<stop offset="${i/(stops.length-1)}" stop-color="${color}"/>`).join('')}</linearGradient><filter id="soft" x="-60%" y="-100%" width="220%" height="300%"><feDropShadow dx="0" dy="5" stdDeviation="${preset.effect==='neon'?7:3}" flood-color="${preset.effect==='neon'?p.primary:'#1c123b'}" flood-opacity="${preset.effect==='neon'?.85:.3}"/></filter>`;
 const family=font?'FontSplatFace':'Arial,sans-serif',style=font?`<style>@font-face{font-family:FontSplatFace;src:url('${font}')}text{font-family:FontSplatFace,Arial,sans-serif}</style>`:'';
 const common=`font-family="${family}" font-size="${p.size}" font-weight="${p.weight}" font-style="${p.italic?'italic':'normal'}" letter-spacing="${p.spacing}" text-anchor="middle" stroke-linejoin="round" paint-order="stroke"`;
 const fill=preset.effect==='outline'?'none':preset.effect==='ink'?p.primary:'url(#ink)';
 let paths='',content='';
 lines.forEach((line,i)=>{
  const y=(height-lines.length*lineHeight)/2+p.size+i*lineHeight,x=width/2,estimated=maxWidth>2100?' textLength="2100" lengthAdjust="spacingAndGlyphs"':'';
  const inner=p.curve?`<textPath href="#arc${i}" startOffset="50%">${xml(line||' ')}</textPath>`:xml(line||' ');
  if(p.curve)paths+=`<path id="arc${i}" d="M${(width-textWidth)/2} ${y}Q${width/2} ${y-p.curve*2} ${(width+textWidth)/2} ${y}"/>`;
  const text=(attrs,dx=0,dy=0)=>`<text ${common}${p.curve?'':` x="${x}" y="${y}"`}${estimated} ${attrs}${dx||dy?` transform="translate(${dx} ${dy})"`:''}>${inner}</text>`;
  if(['stack','retro','splat','comic'].includes(preset.id))for(let k=Math.round(p.depth);k>0;k--)content+=text(`fill="${preset.effect==='retro'?(k>p.depth/2?'#2d8e97':'#e66f78'):p.outline}" stroke="${p.outline}" stroke-width="${p.outlineWidth}"`,k*.65,k*.8);
  if(preset.effect==='glitch'){content+=text('fill="#18dce0"',-5,1)+text('fill="#ff4e95"',5,-1);}
  if(preset.effect==='sticker')content+=text('fill="white" stroke="white" stroke-width="15"');
  const stroke=preset.effect==='outline'?p.primary:preset.effect==='comic'?'#2a1c3d':p.outline,sw=preset.effect==='outline'?Math.max(2,p.outlineWidth):p.outlineWidth;
  content+=text(`fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${['neon','shadow','ice','sticker'].includes(preset.effect)?' filter="url(#soft)"':''}`);
 });
 const backdrop=p.transparent?'':`<rect width="${width}" height="${height}" fill="${p.background}"/>`,pulse=p.pulse?'<animate attributeName="opacity" values="1;.6;1" dur="2s" repeatCount="indefinite"/>':'';
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title"><title id="title">${xml(plain)}</title><desc>Original FontSplat text artwork. ${xml(preset.name)}.</desc>${style}<defs>${defs}${paths}</defs>${backdrop}<g transform="translate(${width/2} ${height/2}) rotate(${p.rotate}) skewX(${p.skew}) translate(${-width/2} ${-height/2})">${pulse}${content}</g></svg>`;
 return {svg,width,height,plainText:plain,glitchText:glitch};
}
