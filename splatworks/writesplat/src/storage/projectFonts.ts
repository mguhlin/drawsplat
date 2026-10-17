export interface ProjectFont {name:string;family:string;category:'serif'|'sans-serif';format:'ttf'|'otf'|'woff'|'woff2';weight:number;italic:boolean;src:string;}
export type ProjectFonts=Record<string,ProjectFont>;
export function assertProjectFonts(value:unknown):asserts value is ProjectFonts {
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>16)throw new Error('Invalid embedded project fonts.');
 let total=0;for(const [id,font] of Object.entries(value)){
  const f=font as ProjectFont;if(!/^LayoutSplatFont-[0-9a-f-]{36}$/i.test(id)||!f||typeof f.family!=='string'||!f.family||f.family.length>200||/["\\\n\r]/.test(f.family)||typeof f.name!=='string'||f.name.length>200||!['serif','sans-serif'].includes(f.category)||!['ttf','otf','woff','woff2'].includes(f.format)||!Number.isFinite(f.weight)||f.weight<100||f.weight>900||typeof f.italic!=='boolean'||typeof f.src!=='string'||!new RegExp(`^data:font/${f.format};base64,[A-Za-z0-9+/=]+$`).test(f.src)||f.src.length>22000000)throw new Error('Invalid embedded project font.');total+=f.src.length;
 }if(total>88000000)throw new Error('Embedded project fonts exceed 88 MB.');
}
let generation=0;const active=new Set<FontFace>();
export async function activateProjectFonts(fonts:ProjectFonts):Promise<void>{
 assertProjectFonts(fonts);const epoch=++generation;for(const face of active)document.fonts.delete(face);active.clear();
 const loaded=await Promise.all(Object.values(fonts).map(f=>new FontFace(f.family,`url("${f.src}")`,{weight:String(f.weight),style:f.italic?'italic':'normal'}).load()));
 if(epoch!==generation)return;for(const face of loaded){document.fonts.add(face);active.add(face);}
}
