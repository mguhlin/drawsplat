import type {WriterEditor} from './writerEditor';
import {normalizeTabs} from './tabPlugin';
import {workspaceStorage} from '../../../shared/file-bridge.js';
const factors:Record<string,number>={in:72,cm:72/2.54,pt:1};
export function setupWriterRuler(mount:HTMLElement,writer:WriterEditor,translate:(text:string)=>string=text=>text){
 const tools=document.createElement('div');tools.className='writer-ruler-tools';tools.setAttribute('aria-label','Paragraph ruler controls');
 tools.innerHTML='<strong>Letter page guides</strong><label>Units <select id="writerRulerUnit"><option value="in">Inches</option><option value="cm">Centimeters</option><option value="pt">Points</option></select></label><label>Left indent <input id="writerIndentLeft" type="number" step="0.05" value="0"></label><label>First line <input id="writerFirstLine" type="number" step="0.05" value="0"></label><label>Right indent <input id="writerIndentRight" type="number" step="0.05" value="0"></label><button type="button" id="writerInsertTab">Insert tab</button><button type="button" id="writerClearTabs">Clear tab stops</button>';
 const viewport=document.createElement('div');viewport.className='writer-canvas-viewport';const ruler=document.createElement('div');ruler.id='writerRuler';ruler.className='writer-ruler';ruler.setAttribute('aria-label','Paragraph ruler: click to add a tab stop');ruler.title='Click to add a left tab. Drag indent markers. Drag a tab down or double-click it to remove it.';
 mount.before(tools,viewport);viewport.append(ruler,mount);const guides=document.createElement('div');guides.className='writer-page-guides';guides.setAttribute('aria-hidden','true');mount.prepend(guides);
 const unit=tools.querySelector<HTMLSelectElement>('#writerRulerUnit')!,fields={indentLeft:tools.querySelector<HTMLInputElement>('#writerIndentLeft')!,firstLineIndent:tools.querySelector<HTMLInputElement>('#writerFirstLine')!,indentRight:tools.querySelector<HTMLInputElement>('#writerIndentRight')!};let pending=0,drag:{key:string,index?:number,value:number,downY:number}|null=null;
 try{unit.value=workspaceStorage().getItem('writesplat.ruler.units')||'in';if(!factors[unit.value])unit.value='in';}catch{}
 const scale=()=>mount.getBoundingClientRect().width/816||1;
 const point=(event:PointerEvent)=>Math.max(0,Math.min(468,(event.clientX-ruler.getBoundingClientRect().left)/scale()*.75-72));
 const value=(attrs:Record<string,unknown>,key:string)=>typeof attrs[key]==='number'?attrs[key] as number:0;
 function change(key:string,n:number){const attrs=writer.getParagraphLayout(),left=value(attrs,'indentLeft'),right=value(attrs,'indentRight');if(key==='indentLeft')n=Math.max(0,Math.min(456-right,n));if(key==='indentRight')n=Math.max(0,Math.min(456-left,n));if(key==='firstLineIndent')n=Math.max(-left,Math.min(456-left-right,n));writer.setParagraphLayout({[key]:Math.round(n*100)/100});update();}
 for(const[key,field]of Object.entries(fields))field.addEventListener('change',()=>{const n=Number(field.value);if(Number.isFinite(n))change(key,n*factors[unit.value]);});
 tools.addEventListener('mousedown',event=>{if((event.target as HTMLElement).closest('button'))event.preventDefault();});
 tools.querySelector('#writerInsertTab')!.addEventListener('click',()=>writer.insertTab());tools.querySelector('#writerClearTabs')!.addEventListener('click',()=>{writer.setParagraphLayout({tabs:[]});update();});
 unit.addEventListener('change',()=>{try{workspaceStorage().setItem('writesplat.ruler.units',unit.value);}catch{}update();});
 ruler.addEventListener('pointerdown',event=>{if(event.button!==0)return;const target=(event.target as HTMLElement).closest<HTMLElement>('[data-ruler-key]');event.preventDefault();if(target){drag={key:target.dataset.rulerKey!,index:target.dataset.tabIndex!==undefined?Number(target.dataset.tabIndex):undefined,value:point(event),downY:event.clientY};ruler.setPointerCapture(event.pointerId);}else{const tabs=normalizeTabs(writer.getParagraphLayout().tabs);writer.setParagraphLayout({tabs:[...tabs,Math.round(point(event))]});update();}});
 ruler.addEventListener('pointermove',event=>{if(!drag)return;drag.value=point(event);const marker=ruler.querySelector<HTMLElement>(drag.index===undefined?`[data-ruler-key="${drag.key}"]`:`[data-tab-index="${drag.index}"]`);if(marker)marker.style.left=(72+drag.value)*4/3*scale()+'px';});
 ruler.addEventListener('pointerup',event=>{if(!drag)return;const current=drag;drag=null;if(ruler.hasPointerCapture(event.pointerId))ruler.releasePointerCapture(event.pointerId);if(current.key==='tab'){const tabs=normalizeTabs(writer.getParagraphLayout().tabs);if(event.clientY-current.downY>30)tabs.splice(current.index!,1);else tabs[current.index!]=Math.round(current.value);writer.setParagraphLayout({tabs});}else if(current.key==='firstLineIndent')change(current.key,current.value-value(writer.getParagraphLayout(),'indentLeft'));else if(current.key==='indentRight')change(current.key,468-current.value);else change(current.key,current.value);update();});
 ruler.addEventListener('pointercancel',()=>{drag=null;update();});
 ruler.addEventListener('dblclick',event=>{const tab=(event.target as HTMLElement).closest<HTMLElement>('[data-tab-index]');if(tab){const tabs=normalizeTabs(writer.getParagraphLayout().tabs);tabs.splice(Number(tab.dataset.tabIndex),1);writer.setParagraphLayout({tabs});update();}});
 ruler.addEventListener('keydown',event=>{
  const marker=(event.target as HTMLElement).closest<HTMLElement>('[data-ruler-key]');if(!marker)return;
  const key=marker.dataset.rulerKey!,index=Number(marker.dataset.tabIndex),attrs=writer.getParagraphLayout();
  if(key==='tab'&&(event.key==='Delete'||event.key==='Backspace')){event.preventDefault();const tabs=normalizeTabs(attrs.tabs);tabs.splice(index,1);writer.setParagraphLayout({tabs});ruler.focus();update();return;}
  if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;event.preventDefault();const delta=(event.key==='ArrowRight'?1:-1)*(event.shiftKey?9:1);
  if(key==='tab'){const tabs=normalizeTabs(attrs.tabs);tabs[index]=Math.max(1,Math.min(468,tabs[index]+delta));writer.setParagraphLayout({tabs});update();}
  else change(key,value(attrs,key)+(key==='indentRight'?-delta:delta));
  marker.focus({preventScroll:true});
 });ruler.tabIndex=-1;
 function update(){cancelAnimationFrame(pending);pending=requestAnimationFrame(()=>{
  if(drag)return;writer.view.dom.dataset.empty=String(writer.view.state.doc.childCount===1&&writer.view.state.doc.firstChild?.type.name==='paragraph'&&writer.view.state.doc.firstChild.content.size===0);const requested=mount.dataset.zoom;const zoom=requested==='fit'?Math.max(.25,Math.min(1.3,(viewport.clientWidth-20)/816)):Number(requested)||1;mount.style.setProperty('--editor-zoom',String(zoom));ruler.style.width=816*zoom+'px';
  const attrs=writer.getParagraphLayout();for(const[key,field]of Object.entries(fields))if(document.activeElement!==field)field.value=String(Math.round(value(attrs,key)/factors[unit.value]*100)/100);
  const focused=(document.activeElement as HTMLElement)?.closest<HTMLElement>('[data-ruler-key]'),focusKey=focused?.dataset.rulerKey,focusIndex=focused?.dataset.tabIndex;
  ruler.replaceChildren();const step=unit.value==='cm'?72/25.4:unit.value==='pt'?6:9,major=unit.value==='cm'?10:unit.value==='pt'?6:8;
  for(let i=0;i*step<=468;i++){const tick=document.createElement('span');tick.className='ruler-tick'+(i%major===0?' major':'');tick.style.left=(72+i*step)*4/3*zoom+'px';if(i%major===0)tick.textContent=String(Math.round(i*step/factors[unit.value]*10)/10);ruler.append(tick);}
  const positions={indentLeft:value(attrs,'indentLeft'),firstLineIndent:value(attrs,'indentLeft')+value(attrs,'firstLineIndent'),indentRight:468-value(attrs,'indentRight')};
  for(const[key,n]of Object.entries(positions)){const marker=document.createElement('button');marker.type='button';marker.className='ruler-marker '+key;marker.dataset.rulerKey=key;marker.setAttribute('aria-label',translate(key==='indentLeft'?'Left indent':key==='indentRight'?'Right indent':'First-line indent'));marker.style.left=(72+n)*4/3*zoom+'px';ruler.append(marker);}
  normalizeTabs(attrs.tabs).forEach((n,index)=>{const marker=document.createElement('button');marker.type='button';marker.className='ruler-marker tab';marker.dataset.rulerKey='tab';marker.dataset.tabIndex=String(index);marker.setAttribute('aria-label',`Tab stop ${Math.round(n/factors[unit.value]*100)/100} ${unit.value}`);marker.style.left=(72+n)*4/3*zoom+'px';ruler.append(marker);});
  const pages=Math.max(1,Math.min(500,Math.ceil((writer.view.dom.scrollHeight*zoom+192*zoom)/(1056*zoom))));if(guides.children.length!==pages){guides.replaceChildren(...Array.from({length:pages},(_,i)=>{const outline=document.createElement('div');outline.className='writer-page-outline';outline.dataset.page=String(i+1);return outline;}));}guides.querySelectorAll<HTMLElement>('.writer-page-outline').forEach((outline,i)=>{outline.style.top=i*1056*zoom+'px';outline.style.height=1056*zoom+'px';});
  if(focusKey){const next=ruler.querySelector<HTMLElement>(focusKey==='tab'?`[data-tab-index="${focusIndex}"]`:`[data-ruler-key="${focusKey}"]`);next?.focus({preventScroll:true});}
  writer.view.dom.dispatchEvent(new Event('writer-layout-change'));
 });}
 for(const type of ['keyup','pointerup','input'])mount.addEventListener(type,update);document.addEventListener('selectionchange',update);new ResizeObserver(update).observe(viewport);document.fonts?.addEventListener('loadingdone',update);update();return{update};
}
