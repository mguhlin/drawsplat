import {Plugin} from 'prosemirror-state';
import type {NodeSpec} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';
export const normalizeTabs=(value:unknown):number[]=>Array.isArray(value)?[...new Set(value.filter((n):n is number=>typeof n==='number'&&Number.isFinite(n)&&n>0&&n<=468))].sort((a,b)=>a-b).slice(0,32):[];
export const tabNode:NodeSpec={inline:true,group:'inline',atom:true,selectable:false,parseDOM:[{tag:'span[data-writer-tab]'}],toDOM(){return['span',{'data-writer-tab':'true',class:'writer-tab','aria-label':'Tab'},'\t'];}};
export function createTabPlugin():Plugin{
 const positions=new WeakMap<HTMLElement,()=>number|undefined>();let frame=0;
 function render(view:EditorView){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
  const root=view.dom.getBoundingClientRect(),zoom=root.width/view.dom.offsetWidth||1;
  for(const tab of view.dom.querySelectorAll<HTMLElement>('.writer-tab')){
   const pos=positions.get(tab)?.();if(pos===undefined)continue;const parent=view.state.doc.resolve(pos).parent,tabs=normalizeTabs(parent.attrs.tabs),rect=tab.getBoundingClientRect(),rtl=getComputedStyle(tab).direction==='rtl',x=(rtl?root.right-rect.right:rect.left-root.left)/zoom*.75;
   const target=tabs.find(n=>n>x+.5)??(Math.floor((x+.5)/36)+1)*36;tab.style.width=Math.max(1,(target-x)*4/3)+'px';
  }
 });}
 return new Plugin({props:{nodeViews:{tab(_node,_view,getPos){const dom=document.createElement('span');dom.className='writer-tab';dom.dataset.writerTab='true';dom.setAttribute('aria-label','Tab');dom.textContent='\t';positions.set(dom,getPos);return{dom,ignoreMutation:()=>true};}}},view(view){const update=()=>render(view);view.dom.addEventListener('writer-layout-change',update);window.addEventListener('resize',update);document.fonts?.addEventListener('loadingdone',update);update();return{update:()=>update(),destroy(){cancelAnimationFrame(frame);view.dom.removeEventListener('writer-layout-change',update);window.removeEventListener('resize',update);document.fonts?.removeEventListener('loadingdone',update);}};}});
}
