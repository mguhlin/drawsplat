import {bookPath} from './ebook-source-model.mjs';
import {cleanBookChapter,cleanBookCss,parseBookXml,sourcePreview,sanitizeBook} from './ebook-source.mjs';
import {exportEpub} from './epub-export.mjs';
import {importEpub} from './epub-import.mjs';
export function checkBookLinks(book){
 const documents=new Map(book.chapters.map(c=>[c.path,parseBookXml(c.xhtml)])),paths=new Set([...book.chapters,...book.styles,...book.resources].map(r=>r.path)),issues=[];
 for(const chapter of book.chapters)for(const element of documents.get(chapter.path).querySelectorAll('[href],[src]')){
  const href=element.getAttribute('href')||element.getAttribute('src');if(/^(https?:\/\/|mailto:)/i.test(href))continue;
  const target=bookPath(chapter.path,href);if(!target||!paths.has(target.path)){issues.push(chapter.path+': '+href);continue;}
  if(target.hash&&documents.has(target.path)){let id;try{id=decodeURIComponent(target.hash.slice(1));}catch{id='';}if(!documents.get(target.path).getElementById(id))issues.push(chapter.path+': '+href);}
 }
 return issues;
}
export function setupBookSource(api){
 const $=id=>document.getElementById(id),t=api.t;
 document.body.insertAdjacentHTML('beforeend',`<dialog id="bookSourceDialog"><form method="dialog"><div class="dialog-head"><h2 data-i18n="bookSourceEditor">Book source editor</h2><button value="cancel" data-i18n-aria-label="close">×</button></div><p class="hint" data-i18n="sourceEditionHint">Source chapters and page layouts are separate editions. Export Source book to include saved XHTML, CSS, links and footnotes.</p><div class="book-source-toolbar"><label><span data-i18n="bookResource">Chapter or stylesheet</span><select id="bookSourceResource"></select></label><label><span data-i18n="bookEditMode">Edit mode</span><select id="bookSourceMode"><option value="code" data-i18n="sourceCode">XHTML / CSS</option><option value="visual" data-i18n="visualChapter">Visual chapter</option></select></label><button id="bookSourceSave" type="button" data-i18n="saveBookSource">Save resource</button><button id="bookSourceRevert" type="button" data-i18n="discardSourceEdits">Discard resource edits</button><button id="bookSourceCheck" type="button" data-i18n="checkBookLinks">Check links</button></div><div class="book-source-workspace"><label id="bookSourceCodeLabel"><span data-i18n="sourceCode">XHTML / CSS</span><textarea id="bookSourceCode" spellcheck="false" aria-label="XHTML / CSS"></textarea></label><iframe id="bookSourcePreview" title="Source chapter preview" sandbox="allow-same-origin" referrerpolicy="no-referrer"></iframe></div><p id="bookSourceStatus" role="status"></p><div class="dialog-actions"><button id="bookSourceExport" type="button" data-i18n="sourceEpub">Source book — XHTML and CSS</button><button value="cancel" data-i18n="close">Close</button></div></form></dialog>`);
 let draft=null,resourceIndex=0,previewIndex=0,editingMode='code';
 const resources=()=>[...draft.chapters.map((r,i)=>({r,i,kind:'chapter'})),...draft.styles.map((r,i)=>({r,i,kind:'style'}))];
 function paths(){return new Set([...draft.chapters,...draft.styles,...draft.resources].map(r=>r.path));}
 function current(){return resources()[resourceIndex];}
 function visual(){return $('bookSourceMode').value==='visual'&&current()?.kind==='chapter';}
 function preview(){
  $('bookSourceCodeLabel').hidden=visual();$('bookSourceMode').querySelector('[value=visual]').disabled=current()?.kind!=='chapter';
  const iframe=$('bookSourcePreview');for(const id of ['bookSourceResource','bookSourceMode','bookSourceSave','bookSourceRevert','bookSourceCheck','bookSourceExport'])$(id).disabled=true;
  iframe.onload=()=>{const doc=iframe.contentDocument;if(!doc)return;for(const id of ['bookSourceResource','bookSourceMode','bookSourceSave','bookSourceRevert','bookSourceCheck','bookSourceExport'])$(id).disabled=false;doc.body.contentEditable=String(visual());doc.addEventListener('click',event=>{const anchor=event.target.closest('a');if(!anchor)return;event.preventDefault();if(visual())return;const target=bookPath(draft.chapters[previewIndex].path,anchor.dataset.bookHref),index=draft.chapters.findIndex(c=>c.path===target?.path);if(index>=0){previewIndex=index;resourceIndex=index;$('bookSourceResource').value=String(index);load();}});};iframe.srcdoc=sourcePreview(draft,previewIndex);
 }
 function load(){const value=current();$('bookSourceCode').value=value.kind==='chapter'?value.r.xhtml:value.r.css;if(value.kind==='chapter')previewIndex=value.i;else $('bookSourceMode').value='code';editingMode=$('bookSourceMode').value;$('bookSourceCode').setSelectionRange(0,0);$('bookSourceCode').scrollTop=$('bookSourceCode').scrollLeft=0;preview();$('bookSourceStatus').textContent='';}
 function save(){
  try{
   const value=current(),next=structuredClone(draft);
   if(value.kind==='style')next.styles[value.i].css=cleanBookCss($('bookSourceCode').value,value.r.path,paths());
   else{
    let source=$('bookSourceCode').value;
    if(visual()){
     const doc=parseBookXml(value.r.xhtml),body=doc.getElementsByTagNameNS('*','body')[0],edited=$('bookSourcePreview').contentDocument.body.cloneNode(true);edited.removeAttribute('contenteditable');edited.setAttributeNS('http://www.w3.org/2000/xmlns/','xmlns:epub','http://www.idpf.org/2007/ops');
     for(const image of edited.querySelectorAll('[data-book-src],[data-book-poster]'))for(const key of ['src','poster'])if(image.hasAttribute('data-book-'+key)){image.setAttribute(key,image.getAttribute('data-book-'+key));image.removeAttribute('data-book-'+key);}
     for(const anchor of edited.querySelectorAll('[data-book-href]')){anchor.setAttribute('href',anchor.dataset.bookHref);anchor.removeAttribute('data-book-href');}
     const parser=new DOMParser().parseFromString(new XMLSerializer().serializeToString(edited),'application/xhtml+xml');if(parser.querySelector('parsererror'))throw Error(t('invalidSourceVisual'));
     body.replaceChildren(...[...parser.documentElement.childNodes].map(n=>doc.importNode(n,true)));source=new XMLSerializer().serializeToString(doc);
    }
    const xhtml=cleanBookChapter(source,value.r.path,paths(),{strict:true});next.chapters[value.i].xhtml=xhtml;next.chapters[value.i].title=(parseBookXml(xhtml).querySelector('title')?.textContent||value.r.title).slice(0,200);
   }
   if(JSON.stringify(next)===JSON.stringify(draft)){load();return true;}draft=sanitizeBook(next);api.mutate(()=>{api.getDoc().ebookSource=structuredClone(draft);});load();$('bookSourceStatus').textContent=t('bookSourceSaved');return true;
  }catch(error){$('bookSourceStatus').textContent=error.message;return false;}
 }
 $('bookSourceResource').onchange=()=>{const selected=Number($('bookSourceResource').value);if(save()){resourceIndex=selected;load();}else $('bookSourceResource').value=String(resourceIndex);};
 $('bookSourceMode').onchange=()=>{const next=$('bookSourceMode').value;$('bookSourceMode').value=editingMode;if(save()){editingMode=next;$('bookSourceMode').value=next;preview();}};$('bookSourceSave').onclick=save;$('bookSourceRevert').onclick=load;
 $('bookSourceCheck').onclick=()=>{if(!save())return;const issues=checkBookLinks(draft);$('bookSourceStatus').textContent=issues.length?issues.join('\n'):t('bookLinksReady');};
 $('bookSourceDialog').querySelector('form').addEventListener('submit',event=>{if(!save())event.preventDefault();});
 $('bookSourceDialog').addEventListener('cancel',event=>{if(!save())event.preventDefault();});
 $('bookSourceExport').onclick=()=>{if(!save())return;$('bookSourceDialog').close();api.openExports('epub');document.getElementById('exportEpubMode').value='source';document.getElementById('exportDialog').dispatchEvent(new Event('change'));};
 return {async open(){
  try{
   if(!api.getDoc().ebookSource){const result=await exportEpub(api.getDoc(),api.getLayout()),imported=await importEpub(new File([result.blob],'source.epub',{type:'application/epub+zip'}));if(!imported.doc.ebookSource)throw Error('Could not create source chapters.');api.mutate(()=>{api.getDoc().ebookSource=imported.doc.ebookSource;});}
   draft=sanitizeBook(api.getDoc().ebookSource);resourceIndex=previewIndex=0;$('bookSourceResource').replaceChildren(...resources().map(({r},i)=>new Option(r.path,String(i))));$('bookSourceMode').value='code';load();WidgetI18n.refresh();$('bookSourceDialog').showModal();
  }catch(error){api.showReport?.([error.message]);}
 }};
}
