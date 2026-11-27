import {pdfAnnotationRectangle} from './pdf-links.js';

// Read supported standard widgets into the same page snapshots used by Undo.
export async function readPdfForms(pdf) {
 const pages=[];
 for(let n=1;n<=pdf.numPages;n++){
  const page=await pdf.getPage(n),v=page.getViewport({scale:1}),fields=[];
  for(const a of await page.getAnnotations()){
   if(a.subtype!=='Widget'||!a.rect)continue;
   if(a.fieldType==='Sig')throw Error('This PDF contains a digital signature field. Editing signed PDFs is not supported; use an unsigned original.');
   const kind=a.fieldType==='Tx'?'text':a.fieldType==='Ch'?'dropdown':a.checkBox?'checkbox':a.radioButton?'radio':null;
   if(!kind)throw Error('This PDF contains an unsupported interactive field. Use a copy without buttons or scripts.');
   const r=v.convertToViewportRectangle(a.rect),options=(a.options||[]).map(o=>o.exportValue||o.displayValue||String(o));
   if(fields.length>=200)throw Error('This page exceeds the 200-field editing limit. Your current document was kept.');
   fields.push({name:a.fieldName||`Field ${fields.length+1}`,label:a.alternativeText||a.fieldName||`Field ${fields.length+1}`,kind,
    value:kind==='checkbox'?!!a.fieldValue&&a.fieldValue!=='Off':kind==='radio'?a.fieldValue===a.buttonValue:Array.isArray(a.fieldValue)?a.fieldValue[0]||'':a.fieldValue||'',
    group:a.radioButton?a.fieldName:undefined,option:a.buttonValue||a.exportValue||'Choice',options,required:!!a.required,readOnly:!!a.readOnly,multiline:!!a.multiLine,maxLength:a.maxLen||0,comb:!!a.comb,
    x:Math.min(r[0],r[2])/v.width,y:Math.min(r[1],r[3])/v.height,w:Math.abs(r[2]-r[0])/v.width,h:Math.abs(r[3]-r[1])/v.height});
  }
  pages.push(fields);
 }
 return pages;
}
export function removePdfWidgets(page){
 const {PDFName}=globalThis.PDFLib;
 for(const ref of page.node.Annots()?.asArray()||[]){
  const node=page.doc.context.lookup(ref);
  if(node?.get?.(PDFName.of('Subtype'))?.toString()==='/Widget')page.node.removeAnnot(ref);
 }
}
export function appendPdfForms(document,items,geometries){
 const {rgb,PDFName,PDFHexString}=globalThis.PDFLib,form=document.getForm(),names=new Map();
 for(let n=0;n<items.length;n++){
  const item=items[n],page=document.getPage(n);
  for(const field of item.fields||[]){
   const rect=pdfAnnotationRectangle(item,geometries[n],field);if(!rect)continue;
   const key=field.group||field.id;let f=names.get(key);
   if(!f){
    let name=(field.name||field.label||'Field').slice(0,180).replace(/[\x00-\x1f]/g,'');
    if(form.getFieldMaybe(name))name+='_'+field.id;
    f=field.kind==='checkbox'?form.createCheckBox(name):field.kind==='dropdown'?form.createDropdown(name):field.kind==='radio'?form.createRadioGroup(name):form.createTextField(name);
    f.acroField.dict.set(PDFName.of('TU'),PDFHexString.fromText(field.label||name));
    if(field.required)f.enableRequired();if(field.readOnly)f.enableReadOnly();names.set(key,f);
    if(field.kind==='dropdown'){if(field.options?.length)f.addOptions(field.options);if(field.value&&field.options?.includes(field.value))f.select(field.value);}
    else if(field.kind==='text'){
     if(field.multiline)f.enableMultiline();if(field.maxLength>0)f.setMaxLength(field.maxLength);if(field.comb&&field.maxLength>0&&!field.multiline)f.enableCombing();f.setText(String(field.value||''));
    }
   }
   const opts={x:rect[0],y:rect[1],width:Math.max(2,rect[2]-rect[0]),height:Math.max(2,rect[3]-rect[1]),borderWidth:.5,borderColor:rgb(.35,.35,.35),textColor:rgb(0,0,0),backgroundColor:rgb(1,1,1)};
   if(field.kind==='radio'){f.addOptionToPage(field.option||field.id,page,opts);if(field.value)f.select(field.option||field.id);}
   else {f.addToPage(page,opts);if(field.kind==='text')f.setFontSize(11);if(field.kind==='checkbox'&&field.value)f.check();}
  }
 }
 form.updateFieldAppearances();
}

// Conservative image-based line/box detection. Works on local rendered vectors or scans.
// Results are candidates for review, never a measured-accuracy or accessibility claim.
export function detectFormCandidates(image){
 const {width:w,height:h,data}=image;
 const ink=(x,y)=>{if(x<0||x>=w||y<0||y>=h)return false;const i=(y*w+x)*4;return data[i+3]>128&&(data[i]+data[i+1]+data[i+2])<480;};
 const lines=[];
 for(let y=2;y<h-2;y++){
  let start=-1;
  for(let x=1;x<=w;x++){
   if(x<w&&ink(x,y)){if(start<0)start=x;}
   else if(start>=0){let len=x-start;if(len>=8&&len<w*.94&&!lines.some(l=>Math.abs(l.y-y)<=2&&Math.abs(l.x-start)<3&&Math.abs(l.end-x)<3))lines.push({x:start,end:x,y});start=-1;}
  }
  if(lines.length>5000)break;
 }
 const boxes=[],used=new Set();
 const vertical=(x,a,b)=>{let count=0;for(let y=a;y<=b;y++)if(ink(x,y)||ink(x-1,y)||ink(x+1,y))count++;return count/(b-a+1)>.8;};
 for(let i=0;i<lines.length;i++){
  const a=lines[i];
  for(let j=i+1;j<lines.length;j++){
   const b=lines[j],height=b.y-a.y;if(height<7)continue;if(height>100)break;
   if(Math.abs(a.x-b.x)>3||Math.abs(a.end-b.end)>3||!vertical(a.x,a.y,b.y)||!vertical(a.end-1,a.y,b.y))continue;
   const width=a.end-a.x;if(width<8)continue;
   boxes.push({x:a.x,y:a.y,w:width,h:height,kind:width<28&&height<28&&width/height>.65&&width/height<1.5?'checkbox':'text'});used.add(i);used.add(j);break;
  }
 }
 // Adjacent character boxes become one combed field, with a real PDF MaxLen.
 const result=[],consumed=new Set();
 for(let i=0;i<boxes.length;i++){
  if(consumed.has(i))continue;const box=boxes[i],group=[i];let last=box;
  if(box.w<35&&box.h<40)for(let j=i+1;j<boxes.length;j++){
   const b=boxes[j];if(Math.abs(b.y-box.y)<3&&Math.abs(b.h-box.h)<3&&b.x>=last.x+last.w-2&&b.x-last.x-last.w<8&&Math.abs(b.w-box.w)<4){group.push(j);last=b;}
  }
  if(group.length>=3){group.forEach(n=>consumed.add(n));result.push({...box,w:last.x+last.w-box.x,kind:'text',comb:true,maxLength:group.length});}
  else result.push(box);
 }
 for(let i=0;i<lines.length;i++){
  const l=lines[i],width=l.end-l.x;if(used.has(i)||width<45||l.y<18)continue;
  if(result.some(b=>l.x<b.x+b.w+3&&l.end>b.x-3&&l.y>=b.y-3&&l.y<=b.y+b.h+3))continue;
  let count=0,total=0;for(let y=l.y-16;y<l.y-3;y++)for(let x=l.x+2;x<l.end-2;x++){total++;if(ink(x,y))count++;}
  if(count/total<.03)result.push({x:l.x,y:l.y-18,w:width,h:18,kind:'text'});
 }
 return result.slice(0,200).map(b=>({...b,x:b.x/w,y:b.y/h,w:b.w/w,h:b.h/h}));
}

export function setupForms(api){
 const {state,currentPage,sourcePage,mutate,renderAnnotations,announce,uid,selectedPageIndexes,setMode}=api;
 const dialog=document.createElement('dialog');dialog.id='formFieldsDialog';dialog.className='form-fields-dialog';dialog.setAttribute('aria-labelledby','formFieldsTitle');
 dialog.innerHTML=`<form method="dialog" class="form-fields-heading"><h2 id="formFieldsTitle">Fillable form fields</h2><button>Close</button></form>
 <p>Detect lines and boxes on selected pages, then review every field. Fill values on the PDF or here. Save as PDF keeps standard fields editable in other readers. Your file stays on this device.</p>
 <div class="form-fields-actions"><button type="button" id="detectFormFields">Make it fillable</button><button type="button" id="cancelFormDetection" hidden>Stop detection</button><button type="button" id="addFormField">Add field</button><button type="button" id="clearFormFields">Remove fields on this page</button></div>
 <p id="formFieldsStatus" role="status"></p><div id="formFieldsList"></div>`;
 document.body.append(dialog);let generation=0,detecting=false;
 const status=dialog.querySelector('#formFieldsStatus'),list=dialog.querySelector('#formFieldsList'),detect=dialog.querySelector('#detectFormFields'),stop=dialog.querySelector('#cancelFormDetection');
 function input(label,type,value,change){const wrapper=document.createElement('label');wrapper.textContent=label;const control=document.createElement('input');control.type=type;if(type==='checkbox')control.checked=!!value;else control.value=value??'';control.onchange=()=>change(type==='checkbox'?control.checked:control.value);wrapper.append(control);return wrapper;}
 function update(field,key,value){mutate('Edit form field',()=>{field[key]=value;});renderAnnotations();}
 function drawList(){
  list.replaceChildren();const item=currentPage();if(!item)return;
  status.textContent=`Page ${state.current+1}: ${(item.fields||[]).length} fields. Detection is approximate; check labels, boxes and reading order.`;
  for(const field of item.fields||[]){
   const row=document.createElement('fieldset'),legend=document.createElement('legend');legend.dataset.pdfContent='true';legend.textContent=field.label||field.name;row.append(legend);
   const change=(key,value)=>update(field,key,value);
   row.append(input('Field name','text',field.name,v=>change('name',v.slice(0,180))),input('Accessible label','text',field.label,v=>change('label',v.slice(0,250))));
   const kind=document.createElement('label');kind.textContent='Field type';const select=document.createElement('select');select.setAttribute('aria-label','Field type');for(const [value,label]of [['text','Text'],['checkbox','Check box'],['dropdown','Dropdown'],['radio','Radio button']]){const o=new Option(label,value);select.add(o);}select.value=field.kind;select.onchange=()=>{mutate('Change field type',()=>{field.kind=select.value;field.value=select.value==='checkbox'||select.value==='radio'?false:'';});renderAnnotations();drawList();};kind.append(select);row.append(kind);
   row.append(input(field.kind==='radio'?'Selected':field.kind==='checkbox'?'Checked':'Value',field.kind==='checkbox'||field.kind==='radio'?'checkbox':'text',field.value,v=>change('value',v)));
   row.append(input('Required','checkbox',field.required,v=>change('required',v)),input('Read only','checkbox',field.readOnly,v=>change('readOnly',v)));
   if(field.kind==='text')row.append(input('Multiple lines','checkbox',field.multiline,v=>change('multiline',v)),input('Maximum characters (0 = unlimited)','number',field.maxLength||0,v=>change('maxLength',Math.max(0,Math.min(10000,Number(v)||0)))));
   if(field.kind==='dropdown')row.append(input('Options (separate with |)','text',(field.options||[]).join('|'),v=>change('options',v.split('|').map(x=>x.trim()).filter(Boolean).slice(0,100))));
   if(field.kind==='radio')row.append(input('Radio group name','text',field.group||field.id,v=>change('group',v)),input('Option value','text',field.option||field.id,v=>change('option',v)));
   for(const [key,label]of [['x','Left (%)'],['y','Top (%)'],['w','Width (%)'],['h','Height (%)']]){const box=input(label,'number',+(field[key]*100).toFixed(2),v=>{let n=Number(v);if(!Number.isFinite(n))return;mutate('Position form field',()=>{field[key]=Math.min(1,Math.max((key==='w'||key==='h') ? .005 : 0,n/100));field.x=Math.min(field.x,1-field.w);field.y=Math.min(field.y,1-field.h);});renderAnnotations();});box.querySelector('input').step='.1';box.querySelector('input').min=key==='w'||key==='h'?'0.5':'0';box.querySelector('input').max='100';row.append(box);}
   const remove=document.createElement('button');remove.type='button';remove.textContent='Delete field';remove.onclick=()=>{mutate('Delete form field',()=>{item.fields=item.fields.filter(f=>f.id!==field.id);});renderAnnotations();drawList();};row.append(remove);list.append(row);
  }
 }
 function add(){const item=currentPage();if(!item)return;if((item.fields||[]).length>=200)return announce('Limit: 200 fields per page.');mutate('Add form field',()=>{item.fields||=[];item.fields.push({id:uid(),kind:'text',name:`Field ${item.fields.length+1}`,label:`Field ${item.fields.length+1}`,value:'',x:.15,y:.2,w:.4,h:.05});});renderAnnotations();drawList();list.lastElementChild?.querySelector('input')?.focus();}
 async function find(){
  if(detecting)return;const pages=selectedPageIndexes().map(i=>state.pages[i]);if(pages.length>20){status.textContent='Select at most 20 pages per detection batch.';return;}
  const originalPages=state.pages,token=++generation;detecting=true;detect.disabled=true;stop.hidden=false;const candidates=[];
  try{
   for(const item of pages){
    const page=await sourcePage(item),base=page.getViewport({scale:1,rotation:page.rotate+item.rotation+(item.fineRotation||0)}),scale=Math.min(1.5,1400/base.width,1800/base.height),v=page.getViewport({scale,rotation:base.rotation}),canvas=document.createElement('canvas');canvas.width=Math.ceil(v.width);canvas.height=Math.ceil(v.height);
    await page.render({canvasContext:canvas.getContext('2d'),viewport:v,annotationMode:0}).promise;
    if(token!==generation||originalPages!==state.pages)return;
    const found=detectFormCandidates(canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height));canvas.width=canvas.height=1;
    candidates.push({item,fields:found.filter(f=>!(item.fields||[]).some(old=>Math.abs(old.x-f.x)<.02&&Math.abs(old.y-f.y)<.02))});
    status.textContent=`Reviewed ${candidates.length} of ${pages.length} pages…`;await new Promise(r=>setTimeout(r,0));
   }
   if(token!==generation||originalPages!==state.pages)return;
   let count=0;mutate('Make PDF fillable',()=>{for(const {item,fields}of candidates){item.fields||=[];for(const field of fields){if(item.fields.length>=200)break;count++;item.fields.push({...field,id:uid(),name:`Field ${state.pages.indexOf(item)+1}-${item.fields.length+1}`,label:`Field ${state.pages.indexOf(item)+1}-${item.fields.length+1}`,value:field.kind==='checkbox'?false:''});}}});renderAnnotations();drawList();status.textContent=`${count} candidate fields added. Review labels, positions and field types; add anything missed. Undo is available.`;
  }catch(e){status.textContent=e.message||'Detection failed. Existing fields were kept.';}finally{if(token===generation){detecting=false;detect.disabled=false;stop.hidden=true;}}
 }
 function open(){if(!currentPage())return;setMode('select');drawList();dialog.showModal();detect.focus();}
 function cancel(){generation++;detecting=false;detect.disabled=false;stop.hidden=true;}
 dialog.addEventListener('close',cancel);dialog.addEventListener('cancel',cancel);stop.onclick=()=>{cancel();status.textContent='Detection stopped. Existing fields were kept.';};detect.onclick=find;dialog.querySelector('#addFormField').onclick=add;
 dialog.querySelector('#clearFormFields').onclick=()=>{const item=currentPage();mutate('Remove form fields',()=>{item.fields=[];});renderAnnotations();drawList();};
 document.getElementById('formFieldsButton').onclick=open;
 function render(){
  const item=currentPage();if(!item)return;const layer=document.getElementById('annotationLayer');
  for(const f of [...(item.fields||[])].sort((a,b)=>Math.abs(a.y-b.y)>.01?a.y-b.y:a.x-b.x)){
   const control=document.createElement(f.kind==='dropdown'?'select':f.kind==='text'&&f.multiline?'textarea':'input');
   control.className='pdf-form-field';control.dataset.fieldId=f.id;control.setAttribute('aria-label',f.label||f.name);control.title=f.label||f.name;control.required=!!f.required;control.disabled=!!f.readOnly;
   if(f.kind==='checkbox'||f.kind==='radio'){control.type=f.kind;control.name=f.kind==='radio'?f.group||f.id:f.id;control.checked=!!f.value;}
   else if(f.kind==='dropdown'){control.add(new Option('',''));for(const value of f.options||[])control.add(new Option(value,value));control.value=f.value||'';}
   else {if(control.tagName==='INPUT')control.type='text';control.value=f.value||'';if(f.maxLength>0)control.maxLength=f.maxLength;}
   Object.assign(control.style,{left:`${f.x*100}%`,top:`${f.y*100}%`,width:`${f.w*100}%`,height:`${f.h*100}%`,fontSize:`${Math.max(9,11*state.renderScale)}px`});
   control.onpointerdown=e=>e.stopPropagation();control.onclick=e=>e.stopPropagation();control.onkeydown=e=>e.stopPropagation();
   control.onchange=()=>{mutate('Fill form field',()=>{if(f.kind==='radio'){for(const p of state.pages)for(const other of p.fields||[])if((other.group||other.id)===(f.group||f.id))other.value=other===f;}else f.value=f.kind==='checkbox'?control.checked:control.value;});};
   layer.append(control);
  }
 }
 document.getElementById('sampleFormButton').onclick=async()=>{
  try{const {PDFDocument,rgb}=globalThis.PDFLib,doc=await PDFDocument.create(),page=doc.addPage([500,600]);
   page.drawText('Sample registration form',{x:40,y:550,size:20});page.drawText('Name',{x:40,y:505,size:12});page.drawLine({start:{x:100,y:500},end:{x:440,y:500},thickness:1});
   page.drawRectangle({x:40,y:435,width:14,height:14,borderWidth:1,borderColor:rgb(0,0,0)});page.drawText('I agree',{x:65,y:438,size:12});page.drawText('Code',{x:40,y:385,size:12});
   for(let n=0;n<5;n++)page.drawRectangle({x:100+n*20,y:375,width:18,height:24,borderWidth:1,borderColor:rgb(0,0,0)});
   if(await api.openFile(new File([await doc.save()],'sample-form.pdf',{type:'application/pdf'}))){open();await find();}
  }catch(error){announce(error.message||'Sample form could not open.');}
 };
 return {render,open,reset:cancel};
}
