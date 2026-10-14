import {fontFamily} from './compatibility.mjs';
export const normalizedFamily=value=>String(value||'').replace(/[\s"'_-]/g,'').toLowerCase();
export function matchImportedFont(family,customFonts={},weight=400,italic=false){
 if(Object.hasOwn(customFonts,family))return family;
 const names=String(family||'').split(',').map(normalizedFamily),targetWeight=Number(weight)||(String(weight)==='bold'?700:400);
 const matches=Object.entries(customFonts).filter(([,font])=>names.includes(normalizedFamily(font.family)));
 matches.sort((a,b)=>(Number(a[1].italic!==italic)*1000+Math.abs(a[1].weight-targetWeight))-(Number(b[1].italic!==italic)*1000+Math.abs(b[1].weight-targetWeight)));
 return matches[0]?.[0]||fontFamily(family);
}
