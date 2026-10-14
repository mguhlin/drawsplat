const introduction='Start writing in WriteSplatTM. Your work saves locally and the readability panel updates as you type.';
interface JsonNode{type?:string;content?:Array<{type?:string;text?:string}>;}
const text=(node:JsonNode)=>node.content?.map(n=>n.text||'').join('')||'';
export function removeLegacyStarterHeading(json:unknown):unknown{
 if(!json||typeof json!=='object')return json;const doc=json as {type?:string;content?:JsonNode[]};
 if(doc.type!=='doc'||!Array.isArray(doc.content)||doc.content[0]?.type!=='heading'||text(doc.content[0])!=='Untitled Document'||doc.content[1]?.type!=='paragraph'||text(doc.content[1])!==introduction)return json;
 return {...doc,content:doc.content.slice(1)};
}
export function removeLegacyStarterHtml(html:string):string{
 const host=document.createElement('div');host.innerHTML=html;const first=host.firstElementChild,second=first?.nextElementSibling;
 if(first?.tagName==='H1'&&first.textContent==='Untitled Document'&&second?.tagName==='P'&&second.textContent===introduction)first.remove();
 return host.innerHTML;
}
