// Local-only OCR. The PDF editor owns rendering and committing; recognition and
// review never mutate a document. Runtime, models and WASM are pinned siblings.
export const OCR_LIMITS = Object.freeze({pages:20,pixels:8000000,edge:3200,lines:2000,previewWidth:620,previewHeight:780,lowMemory:Object.freeze({pages:5,pixels:2000000,edge:2200,lines:500,previewWidth:400,previewHeight:540})});
import {createRecognitionWorker} from './ocr-worker.js';
export function recognitionLines(data,width,height){
  const lines=[];
  function visit(value){
    if(!value)return;
    if(Array.isArray(value)){value.forEach(visit);return;}
    if(Array.isArray(value.lines)){lines.push(...value.lines);return;}
    if(value.paragraphs)visit(value.paragraphs);else if(value.blocks)visit(value.blocks);
  }
  visit(data.blocks||data);
  return lines.map(line=>{
    const text=String(line.text??line.words?.map(word=>word.text).join(' ')??'').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,'').trim();
    const b=line.bbox||{},values=[b.x0,b.y0,b.x1,b.y1];
    if(!text||!values.every(Number.isFinite))return null;
    const pad=2,x0=Math.max(0,b.x0-pad),y0=Math.max(0,b.y0-pad),x1=Math.min(width,b.x1+pad),y1=Math.min(height,b.y1+pad);
    if(x1<=x0||y1<=y0)return null;
    const confidence=Number.isFinite(line.confidence)?Math.max(0,Math.min(100,line.confidence)):0;
    return {text:text.slice(0,4000),confidence,selected:confidence>=50,box:{x:x0/width,y:y0/height,w:(x1-x0)/width,h:(y1-y0)/height}};
  }).filter(Boolean);
}
export function overlaps(a,b){
  const w=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x));
  const h=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
  return w*h/Math.max(.0000001,Math.min(a.w*a.h,b.w*b.h));
}
export function setupOcr({button,targets,stamp,renderPage,apply,announce}){
  const dialog=document.createElement('dialog');dialog.id='ocrDialog';dialog.className='ocr-dialog';dialog.setAttribute('aria-labelledby','ocrTitle');dialog.setAttribute('aria-describedby','ocrSafetySummary ocrAccuracyNotice');
  dialog.innerHTML=`<div class="ocr-heading"><h2 id="ocrTitle">Recognize text (OCR)</h2><button id="ocrClose" type="button">Close</button></div>
    <section class="ocr-safety" role="note" aria-labelledby="ocrSafetyTitle"><h3 id="ocrSafetyTitle">Visual covers are not secure redaction</h3><p id="ocrSafetySummary">OCR covers leave the original content underneath. Text and images can remain recoverable in saved PDFs. <strong>Do not use covers to hide FERPA-protected or other sensitive records before sharing.</strong></p><p>Use a district-approved redaction tool to permanently remove sensitive text, images and hidden information, then verify the final copy.</p><details id="ocrRedactionWorkflow"><summary>Real redaction workflow for sensitive records</summary><ol><li>Keep the original in approved, access-controlled storage. Work on a separate copy using your district’s approved redaction tool.</li><li>Mark every sensitive text and image region, including scanned pages. <strong>Apply the redactions</strong>; markings, rectangles and changed OCR text alone do not remove content.</li><li>Remove hidden information such as metadata, comments, attachments and layers. Save a new redacted copy.</li><li>Reopen the final copy in a separate viewer. Check every page, search and copy text, and review extractable images and hidden information. Share only the verified copy under your district’s procedures.</li></ol><p>PDFSplat OCR, visual covers, passwords and its rasterized sanitize option are not a certified redaction or FERPA-compliance workflow. OCR alone does not create a tagged, accessible PDF.</p><p><a href="https://helpx.adobe.com/acrobat/desktop/protect-documents/redact-pdfs/redact.html" target="_blank" rel="noopener noreferrer">Example: Acrobat Redact, Apply and remove hidden information</a> · <a href="../../docs/pdfsplat-ocr.md#sensitive-records-and-real-redaction" target="_blank" rel="noopener">OCR safety and verification guide</a></p></details></section>
    <p>Read printed text in scanned pages and images, review it, then make selected lines editable. Recognition stays on this device. English and Spanish models are included; no upload or external connection is needed.</p>
    <p class="tool-hint" id="ocrAccuracyNotice">OCR spelling, accents, layout and reading order are approximate. Fonts and background colors can differ. Review every selected line and its order before applying. Existing selectable text is skipped. Rotate pages before OCR; fine rotation must be 0°. Up to 20 pages and 2,000 new lines per batch.</p>
    <div class="ocr-controls"><label>Pages<select id="ocrScope"><option value="current">Current page</option><option value="selected">Selected pages</option><option value="all">All pages</option></select></label>
    <label>Recognition language<select id="ocrLanguage"><option value="eng">English</option><option value="spa">Spanish</option><option value="eng+spa">English and Spanish</option></select></label>
    <button id="ocrRun" class="primary" type="button">Recognize text</button><button id="ocrStop" type="button" disabled>Stop</button></div>
    <label class="ocr-memory-choice"><input id="ocrLowMemory" type="checkbox" aria-describedby="ocrMemoryHint">Lower memory use</label><p class="tool-hint" id="ocrMemoryHint">For constrained devices: up to 5 pages/500 lines, 2 million pixels and a 2,200-pixel edge per page. Lower resolution can reduce accuracy. Automatically selected when the browser reports 4 GB RAM or less, or two CPU cores or fewer; it is not a device certification.</p>
    <progress id="ocrProgress" max="1" value="0" hidden aria-label="OCR progress"></progress><p id="ocrStatus" role="status" aria-live="polite">Choose pages and recognize text. The document stays unchanged until Apply.</p>
    <div class="ocr-review-actions" hidden id="ocrReviewActions"><button id="ocrSelectAll" type="button">Select all lines</button><button id="ocrSelectNone" type="button">Select none</button><button id="ocrDownload" type="button">Download recognized text</button></div>
    <div id="ocrResults" class="ocr-results"></div>
    <div class="ocr-footer"><p><strong>Apply does not redact.</strong> It adds editable text and visual covers while preserving original content. Review spelling, accents and reading order. One Undo restores the batch.</p><button id="ocrApply" class="primary" type="button" aria-describedby="ocrSafetySummary ocrAccuracyNotice" disabled>Apply selected text</button></div>`;
  document.body.append(dialog);
  const $=id=>dialog.querySelector('#'+id);
  const memory=Number(navigator.deviceMemory),cores=Number(navigator.hardwareConcurrency);
  $('ocrLowMemory').checked=(memory>0&&memory<=4)||(cores>0&&cores<=2);
  let generation=0,busy=false,worker=null,renderCancel=null,cancelJob=null,results=[],capture='',loading=false,retryFocus=false;
  const message=text=>{if($('ocrStatus').textContent!==text)$('ocrStatus').textContent=text;};
  const allLines=()=>results.flatMap(result=>result.lines.map(line=>({result,line})));
  function controls(){
    $('ocrRun').disabled=busy||loading||location.protocol==='file:';
    $('ocrStop').disabled=!busy;for(const id of ['ocrScope','ocrLanguage','ocrLowMemory'])$(id).disabled=busy;
    $('ocrApply').disabled=busy||!allLines().some(({line})=>line.selected&&line.text.trim());
    $('ocrReviewActions').hidden=!allLines().length;
    $('ocrResults').setAttribute('aria-busy',String(busy));
    for(const node of $('ocrResults').querySelectorAll('textarea,input'))node.disabled=busy;
  }
  function stop({clear=false,close=false}={}){
    const wasBusy=busy;generation++;busy=false;renderCancel?.();renderCancel=null;cancelJob?.();cancelJob=null;
    const owned=worker;worker=null;if(owned)void owned.terminate().catch(()=>{});
    if(clear||close)retryFocus=false;
    if(clear){results=[];capture='';$('ocrResults').replaceChildren();}
    $('ocrProgress').hidden=true;controls();
    if(wasBusy)message('Recognition stopped. Completed previews can still be reviewed; the document is unchanged.');
    if(close&&dialog.open)dialog.close();
  }
  function drawResults(){
    $('ocrResults').replaceChildren();
    for(const result of results){
      const section=document.createElement('section');section.className='ocr-page';
      const heading=document.createElement('h3');heading.textContent=`Page ${result.number} · ${result.lines.length} new text line${result.lines.length===1?'':'s'}`;section.append(heading);
      const grid=document.createElement('div');grid.className='ocr-page-grid';
      const preview=document.createElement('div');preview.className='ocr-preview';preview.append(result.preview);
      const entries=document.createElement('div');entries.className='ocr-lines';
      for(const [index,line]of result.lines.entries()){
        const row=document.createElement('div');row.className='ocr-line'+(line.confidence<75?' ocr-low-confidence':'');
        const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=line.selected;check.setAttribute('aria-label',`Include page ${result.number} line ${index+1}`);
        const meta=document.createElement('span');meta.id=`ocrLineMeta-${result.number}-${index+1}`;meta.textContent=`Line ${index+1} · ${Math.round(line.confidence)}% confidence${line.confidence<75?' · Check carefully':''}`;label.append(check,meta);
        const text=document.createElement('textarea');text.rows=2;text.value=line.text;text.maxLength=4000;text.setAttribute('aria-label',`Recognized text, page ${result.number}, line ${index+1}`);text.setAttribute('aria-describedby',meta.id);if(result.language==='spa'||result.language==='eng')text.lang=result.language==='spa'?'es':'en';
        check.onchange=()=>{line.selected=check.checked;controls();};text.oninput=()=>{line.text=text.value;controls();};
        const box=document.createElement('span');box.className='ocr-preview-box';Object.assign(box.style,{left:`${line.box.x*100}%`,top:`${line.box.y*100}%`,width:`${line.box.w*100}%`,height:`${line.box.h*100}%`});preview.append(box);
        row.append(label,text);entries.append(row);
      }
      if(!result.lines.length){const p=document.createElement('p');p.textContent='No new printed text detected. Existing selectable text and text outside the crop are skipped.';entries.append(p);}
      grid.append(preview,entries);section.append(grid);$('ocrResults').append(section);
    }
    controls();
  }
  async function run(){
    stop({clear:true});const token=generation;
    const limits=$('ocrLowMemory').checked?OCR_LIMITS.lowMemory:OCR_LIMITS,language=$('ocrLanguage').value;
    let pages;
    try{pages=targets($('ocrScope').value);if(!pages.length)throw Error('Open a PDF or image first.');if(pages.length>limits.pages)throw Error(`Choose ${limits.pages} pages or fewer for one OCR batch${$('ocrLowMemory').checked?' in lower-memory mode':''}.`);capture=stamp();}
    catch(error){message(error.message);return;}
    busy=true;loading=true;controls();$('ocrProgress').hidden=false;$('ocrProgress').value=0;
    message('Loading the local OCR engine…');$('ocrStop').focus();let owned;let lastProgress=-1;
    try{
      const base=new URL('vendor/ocr/',document.baseURI);
      owned=createRecognitionWorker({base,langs:language.split('+'),onProgress:entry=>{
        if(token===generation&&busy&&entry.status==='recognizing text'){const value=Math.floor((entry.progress||0)*10)*10;if(value!==lastProgress){lastProgress=value;message(`Recognizing page ${results.length+1} of ${pages.length} · ${value}%`);}}
      }});
      worker=owned;await owned.ready;
      if(token!==generation){await owned.terminate();return;}loading=false;
      await owned.setParameters({tessedit_pageseg_mode:'3',preserve_interword_spaces:'1',user_defined_dpi:'216'});
      let total=0;
      for(const target of pages){
        if(token!==generation)return;
        message(`Preparing page ${results.length+1} of ${pages.length}…`);lastProgress=-1;
        let image;
        try{
          image=await renderPage(target,{limits,cancel:fn=>{renderCancel=fn;},active:()=>token===generation});
          if(token!==generation)return;
          const {data}=await Promise.race([owned.recognize(image.canvas),new Promise((_,reject)=>{cancelJob=()=>reject(new DOMException('OCR stopped','AbortError'));})]);
          cancelJob=null;
          if(token!==generation)return;
          const lines=recognitionLines(data,image.canvas.width,image.canvas.height).filter(line=>image.visible(line.box)&&!image.existing.some(box=>overlaps(line.box,box)>.55));
          total+=lines.length;if(total>limits.lines)throw Error(`More than ${limits.lines.toLocaleString('en-US')} text lines were found. Recognize fewer pages at a time.`);
          for(const line of lines)Object.assign(line,image.appearance(line.box));
          results.push({target,language,number:target.number,lines,preview:image.preview,width:image.width,height:image.height});
          drawResults();$('ocrProgress').value=results.length/pages.length;
        }finally{renderCancel=null;image?.dispose();}
      }
      const count=allLines().length,low=allLines().filter(({line})=>line.confidence<75).length;
      message(count?`${count} new line${count===1?'':'s'} recognized.${low?` ${low} need careful review; lines below 50% start unchecked.`:''} Correct the text, choose lines and Apply. No document changes yet.`:'No new printed text detected. Try a clearer image or the other language. Existing selectable text is skipped.');
    }catch(error){if(token===generation)message(`OCR could not finish: ${error.message||'recognition failed'}. Completed previews remain available; the document is unchanged.`);}
    finally{
      if(worker===owned)worker=null;
      if(owned)await owned.terminate().catch(()=>{});
      loading=false;
      if(token===generation){const reviewFocus=document.activeElement===$('ocrStop');busy=false;$('ocrProgress').hidden=true;controls();if(reviewFocus){const field=$('ocrResults').querySelector('textarea');if(field)field.focus();else $('ocrRun').focus();}}else controls();
      if(retryFocus){const focus=document.activeElement;if(dialog.open&&!$('ocrRun').disabled&&(focus===$('ocrStop')||focus===document.body||focus===$('ocrRun')))$('ocrRun').focus();retryFocus=false;}
    }
  }
  async function commit(){
    if(busy)return;const chosen=allLines().filter(({line})=>line.selected&&line.text.trim());if(!chosen.length)return;
    if(capture!==stamp()){message('The document changed. Recognize text again before applying this preview.');return;}
    busy=true;controls();
    try{
      const token=generation;
      await apply(chosen,()=>token===generation&&dialog.open&&capture===stamp());
      const count=chosen.length;stop({clear:true,close:true});announce(`${count} OCR text box${count===1?'':'es'} added. Edit the text on the page or in Selected text. One Undo restores this batch.`);
    }catch(error){message(error.message||'OCR text could not be applied. No document changes were made.');}
    finally{busy=false;controls();}
  }
  button.onclick=()=>{
    stop({clear:true});dialog.showModal();
    message(location.protocol==='file:'?'OCR needs a local HTTP launcher or HTTPS site. Use START-HERE.html and the included launcher; direct-file PDF editing remains available.':'Choose pages and recognize text. The document stays unchanged until Apply.');controls();
  };
  $('ocrRun').onclick=run;$('ocrStop').onclick=()=>{retryFocus=true;stop();if(!$('ocrRun').disabled){$('ocrRun').focus();retryFocus=false;}};$('ocrApply').onclick=commit;$('ocrClose').onclick=()=>stop({clear:true,close:true});
  dialog.addEventListener('cancel',()=>stop({clear:true}));dialog.addEventListener('close',()=>stop({clear:true}));
  $('ocrSelectAll').onclick=()=>{allLines().forEach(({line})=>line.selected=true);drawResults();};$('ocrSelectNone').onclick=()=>{allLines().forEach(({line})=>line.selected=false);drawResults();};
  $('ocrDownload').onclick=()=>{
    const text=results.map(result=>`Page ${result.number}\n`+result.lines.filter(line=>line.selected).map(line=>line.text).join('\n')).join('\n\n');
    const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='recognized-text.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  window.addEventListener('pagehide',()=>stop({clear:true,close:true}));
  return {reset:()=>stop({clear:true,close:true})};
}
