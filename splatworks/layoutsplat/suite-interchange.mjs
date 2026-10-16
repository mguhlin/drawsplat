import { pageContext } from './publication-fields.mjs';
import { newPublication, uid, frame, shape, textStyle, validatePublication } from './engine.mjs';
import { fontFamily, color } from './compatibility.mjs';
import { importMedia } from './media.mjs';
import {textToRichDocument} from './rich.mjs';
import {fontName} from './local-fonts.mjs';
import {officeHtmlToStory} from './office-story.mjs';
import {matchImportedFont,normalizedFamily} from './font-matching.mjs';

const clamp = (n, a, b, fallback = a) => Number.isFinite(Number(n)) ? Math.max(a, Math.min(b, Number(n))) : fallback;
const localImage = src => typeof src === 'string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(src) && src.length <= 64000000;
const safeText = value => String(value ?? '').slice(0, 100000);
function listNumber(value,type){if(!value)return '0';if(type==='a'||type==='A'){let out='';while(value>0){value--;out=String.fromCharCode(65+value%26)+out;value=Math.floor(value/26);}return type==='a'?out.toLowerCase():out;}if(type==='i'||type==='I'){let out='';for(const[n,letters]of [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']])while(value>=n){out+=letters;value-=n;}return type==='i'?out.toLowerCase():out;}return String(value);}
export function writeSplatText(data,customFonts={}) {
 if(!data?.document||!/WriteSplat/i.test(data.app||''))throw Error('Choose a WriteSplat project.');
 const notes=['WriteSplat text, supported character/paragraph formatting and list labels imported. Flow documents are repaginated; embedded pictures, comments, citations and teacher tools need separate review.'];
 if(data.document.format==='html'){const result=officeHtmlToStory(data.document.body||'',customFonts);if(result.substitutedFonts.length)notes.push('Unavailable source fonts were substituted: '+result.substitutedFonts.join(', ')+'.');return {...result,notes};}
 if(data.document.format!=='prosemirror-json')throw Error('Unsupported WriteSplat document format.');
 let text='',marks=[],paragraphs=[],nodes=0,firstStyle;const substituted=new Set();const family=(value,weight=400,italic=false)=>{const source=String(value||'Arial').slice(0,120),id=matchImportedFont(source,customFonts,weight,italic);if(!Object.hasOwn(customFonts,id)&&!source.split(',').map(normalizedFamily).includes(normalizedFamily(id)))substituted.add(source+' → '+id);return id;};
 const pt=(value,fallback=0)=>clamp(parseFloat(value)*(/px$/.test(String(value))?.75:1),0,360,fallback);
 function visit(node,depth=0,base={font:'Arial',size:12,color:'#25304b'},prefix='',listDepth=0){
  if(!node||++nodes>100000||depth>100)throw Error('The writing document is too complex.');
  if(node.type==='text'){const from=text.length;text+=safeText(node.text);const mark={from,to:text.length,...base};for(const item of node.marks||[]){if(item.type==='strong')mark.bold=true;if(item.type==='em')mark.italic=true;if(item.type==='underline')mark.underline=true;if(item.type==='fontFamily')mark.fontSource=String(item.attrs?.family||'Arial').slice(0,120);if(item.type==='fontSize')mark.size=clamp(parseFloat(item.attrs?.size)*(/px$/.test(item.attrs?.size)?.75:1),6,120,base.size);if(item.type==='textColor')mark.color=color(item.attrs?.color,'#25304b');if(item.type==='link'&&/^(https?:\/\/|mailto:)[^\s<>"']+$/i.test(item.attrs?.href||''))mark.link=item.attrs.href;}mark.font=family(mark.fontSource||base.fontSource||base.font,mark.bold?700:400,!!mark.italic);delete mark.fontSource;if(text.length>from)marks.push(mark);}
  else if(node.type==='tab')text+='\t';else if(node.type==='hard_break')text+='\n';
  else if(['paragraph','heading'].includes(node.type)){
   if(paragraphs.length)text+='\n';const from=text.length,a=node.attrs||{},style={font:family(a.fontFamily||base.fontSource||base.font),fontSource:String(a.fontFamily||base.fontSource||base.font).slice(0,120),size:typeof a.fontSize==='number'?clamp(a.fontSize,6,120,base.size):node.type==='heading'?[24,20,18,16,14,12][clamp(a.level,1,6,1)-1]:base.size,color:base.color};firstStyle||=style;
   if(prefix){text+=prefix;marks.push({from,to:text.length,font:style.font,size:style.size,color:style.color});}for(const child of node.content||[])visit(child,depth+1,style);
   const multiple=typeof a.lineMultiple==='number'?clamp(a.lineMultiple,.5,6,1.45):undefined,inset=listDepth*18;
   paragraphs.push({from,to:text.length,leading:typeof a.leading==='number'?clamp(a.leading,6,360,style.size*1.45):style.size*(multiple||1.45),...(multiple?{lineMultiple:multiple}:{}),align:['left','center','right','justify'].includes(a.align)?a.align:'left',spaceBefore:pt(a.spaceBefore),spaceAfter:pt(a.spaceAfter),indentLeft:Math.min(360,pt(a.indentLeft)+inset),indentRight:pt(a.indentRight),firstLineIndent:Math.max(-360,clamp(a.firstLineIndent,-360,360,0)-inset)});
   if(a.tabs?.length)notes.push('Custom tab-stop positions are not applied to LayoutSplat text flow; tab characters are retained.');
  }else if(['ordered_list','bullet_list'].includes(node.type)){
   let number=Number.isInteger(node.attrs?.order)?clamp(node.attrs.order,0,100000,1):1;for(const item of node.content||[]){if(++nodes>100000)throw Error('The writing document is too complex.');const override=item.attrs?.numberOverride;if(Number.isInteger(override))number=clamp(override,0,100000,number);let label=node.type==='bullet_list'?'•  ':listNumber(number++,node.attrs?.numberStyle)+'.  ';for(const child of item.content||[]){visit(child,depth+1,base,label,listDepth+1);label='';}}
  }else{if(node.type==='image')text+=`[${safeText(node.attrs?.alt||'Picture')}]`;for(const child of node.content||[])visit(child,depth+1,base,prefix,listDepth);}
  if(text.length>100000||marks.length>10000||paragraphs.length>10000)throw Error('A story supports 100,000 characters and 10,000 formatting ranges/paragraphs.');
 }
 visit(data.document.content);if(!paragraphs.length)paragraphs.push({from:0,to:text.length,leading:17.4,align:'left'});const base=firstStyle||{font:'Arial',size:12,color:'#25304b'};
 if(substituted.size)notes.push('Unavailable source font families were substituted: '+[...substituted].join(', ')+'.');delete base.fontSource;return {text,marks,paragraphs,style:{...textStyle(),...base,align:paragraphs[0].align,lineHeight:clamp(paragraphs[0].leading/base.size,1,3,1.45)},notes:[...new Set(notes)]};
}

export function suiteTables(data) {
  if (Array.isArray(data?.sheets)) return data.sheets.map(s => ({ name: safeText(s.name), cells: s.cells }));
  if (Array.isArray(data?.schema?.tables)) return data.schema.tables.map(t => ({ name: safeText(t.name), cells: [t.fields.map(f => safeText(f.name)), ...t.records.map(r => t.fields.map(f => safeText(r.values?.[f.id])))] }));
  throw Error('Choose a GridSplat or ListSplat project.');
}

export async function importSuite(data,{customFonts={}}={}) {
  const d = newPublication(true), warnings = []; d.title = safeText(data?.metadata?.title || data?.title || 'Imported publication').slice(0, 200);
  if (/WriteSplat/i.test(data?.app || '')) {
    const imported = writeSplatText(data,customFonts), key = uid();if(Object.keys(customFonts).length)d.customFonts=structuredClone(customFonts); warnings.push(...imported.notes);
    d.stories[key] = { text: imported.text, marks: imported.marks, paragraphs: imported.paragraphs, style: {...textStyle(),...imported.style}, frames: [] };
    const count = Math.max(1, Math.ceil(imported.text.length / 1700)); d.pages = [];
    for (let i = 0; i < count; i++) { const f = frame(key, 36, 36, 540, 720); f.padding = 0; d.stories[key].frames.push(f.id); d.pages.push({ id: uid(), objects: [f] }); }
    warnings.push('Frames are linked so all source text is retained. Use the design checker and Continue on next page if the final frame overflows.');
  } else if (Array.isArray(data?.slides)) {
    if (!data.slides.length || data.slides.length > 500) throw Error('Choose a deck with 1–500 slides.');
    d.width = 1200; d.height = 675; d.margin = 24; d.pages = [];
    for (const slide of data.slides) {
      const p = { id: uid(), objects: [] }; d.pages.push(p);
      p.objects.push(shape(0, 0, d.width, d.height, color(slide.backgroundColor, slide.bg === 'section' ? '#34205c' : '#ffffff')));
      for (const el of slide.elements || []) {
        if (p.objects.length >= 200) throw Error('A publication page supports up to 200 objects.');
        const g = { x: clamp(el.x, -500, 3000, 0) * .75, y: clamp(el.y, -500, 3000, 0) * .75, w: clamp(el.w, 8, 2666, 300) * .75, h: clamp(el.h, 8, 2666, 100) * .75, rotation: clamp(el.rotate, -360, 360, 0), locked: false };
        if (['text', 'list', 'link', 'html'].includes(el.type)) {
          let text = safeText(el.text); if (el.type === 'html') { const html = new DOMParser().parseFromString(el.html || '', 'text/html'); html.querySelectorAll('script,style,iframe,object').forEach(e => e.remove()); text = safeText(html.body.textContent); warnings.push('Imported slide HTML becomes editable text; review its layout.'); }
          const key = uid(), f = Object.assign(frame(key, g.x, g.y, g.w, g.h), g); f.padding = 0;
          d.stories[key] = { text, frames: [f.id], style: { ...textStyle(), size: clamp(el.fontSize * .75, 6, 120, 22.5), font: fontFamily(el.fontFamily), weight: el.bold ? 'bold' : 'normal', italic: !!el.italic, underline: !!el.underline, color: color(el.color, '#25304b'), align: ['left','right','center','justify'].includes(el.align) ? el.align : 'left' } }; p.objects.push(f);
        } else if (el.type === 'image' && localImage(el.src)) {
          const im = new Image(); im.src = el.src; await im.decode(); const key = uid(); d.assets[key] = { name: 'ShowSplat picture', alt: safeText(el.alt).slice(0, 2000), width: im.naturalWidth, height: im.naturalHeight, src: el.src }; p.objects.push({ id: uid(), type: 'image', assetId: key, ...g, fit: el.fit === 'cover' ? 'cover' : 'contain' });
        } else if (el.type === 'video' && /^data:video\/(mp4|webm|ogg);base64,/.test(el.src || '')) {
          const mime = el.src.slice(5, el.src.indexOf(';')), ext = mime.split('/')[1], bytes = Uint8Array.from(atob(el.src.split(',')[1]), c => c.charCodeAt(0)), a = await importMedia(new File([bytes], `Slide video.${ext}`, { type: mime })); warnings.push(...a.notes); delete a.notes; const key = uid(); d.assets[key] = a; p.objects.push({ id: uid(), type: 'image', assetId: key, ...g, fit: 'contain' });
        } else if (el.type === 'table' && Array.isArray(el.rows)) p.objects.push({ id: uid(), type: 'table', ...g, cells: el.rows.map(r => r.map(v => safeText(v).slice(0, 5000))), header: true, fontSize: clamp(el.fontSize * .75, 6, 36, 12) });
        else if (el.type === 'shape') p.objects.push(Object.assign(shape(g.x, g.y, g.w, g.h, color(el.fill, '#ede7fb')), g));
        else { p.objects.push(Object.assign(shape(g.x, g.y, g.w, g.h, '#eeeaf6'), g)); warnings.push(`A ${el.type || 'unknown'} slide object needs replacement. External media is not downloaded.`); }
      }
    }
    warnings.push('Slides use their 1600 × 900 pixel canvas at 96 pixels/inch. Review text flow, shapes, and crop positions. Speaker notes and presentation controls are not publication objects.');
  } else {
    const tables = suiteTables(data); d.pages = [];
    for (const table of tables) {
      if (!Array.isArray(table.cells) || table.cells.length > 10000) throw Error('Table source supports up to 10,000 rows.');
      const maxCols = Math.max(0, ...table.cells.map(r => r.length)); if (maxCols > 200) throw Error('Table source supports up to 200 columns.');
      for (let col = 0; col < maxCols; col += 6) for (let row = 1; row < Math.max(2, table.cells.length); row += 25) {
        if (d.pages.length >= 500) throw Error('Import would exceed 500 pages. Select a smaller source table.');
        const cells = [table.cells[0] || [], ...table.cells.slice(row, row + 25)].map(r => Array.from({ length: Math.min(6, maxCols - col) }, (_, c) => safeText(r[col + c]).slice(0, 5000)));
        const key = uid(), heading = frame(key, 36, 36, 540, 40); heading.padding = 0; d.stories[key] = { text: table.name || 'Table', frames: [heading.id], style: { ...textStyle(), size: 20, weight: 'bold' } };
        d.pages.push({ id: uid(), objects: [heading, { id: uid(), type: 'table', x: 36, y: 90, w: 540, h: 640, rotation: 0, locked: false, cells, header: true, fontSize: 9 }] });
      }
    }
    if (!d.pages.length) throw Error('The source contains no table cells.');
    warnings.push('Source values imported as editable tables, split across pages with repeated headers. Formulas are retained as text; charts, cell styles, merges, database relationships, and field types are not converted. Check row heights before printing.');
  }
  return { doc: validatePublication(d), warnings: [...new Set(warnings)] };
}

export function exportSuite(kind, doc, layout) {
  const date = new Date().toISOString(), warnings = [], tables = doc.pages.flatMap(p => p.objects.filter(o => o.type === 'table')), seen = new Set(); let data;
  if (kind === 'writesplat') {
    const content=[];
    for(const s of Object.values(doc.stories))for(const paragraph of textToRichDocument(s).content){
      const source=paragraph.attrs||{},attrs={align:source.align||s.style.align,leading:source.leading??null,lineMultiple:source.lineMultiple??(source.leading?null:s.style.lineHeight),spaceBefore:source.spaceBefore??0,spaceAfter:source.spaceAfter??0,indentLeft:source.indentLeft??0,indentRight:source.indentRight??0,firstLineIndent:source.firstLineIndent??0,fontFamily:fontName(doc,s.style.font),fontSize:s.style.size};
      const children=[];for(const run of paragraph.content||[]){let style={font:s.style.font,size:s.style.size,color:s.style.color};const marks=[];for(const m of run.marks||[]){if(m.type==='style')style={...style,...Object.fromEntries(Object.entries(m.attrs).filter(([,value])=>value!==null))};else if(['strong','em','underline'].includes(m.type))marks.push(m);else if(m.type==='link')marks.push({type:'link',attrs:{href:m.attrs.href,title:null}});}
        marks.push({type:'fontFamily',attrs:{family:fontName(doc,style.font)}},{type:'fontSize',attrs:{size:style.size+'pt'}},{type:'textColor',attrs:{color:style.color}});for(const part of run.text.split(/(\t)/)){if(part==='\t')children.push({type:'tab',marks});else if(part)children.push({type:'text',text:part,marks});}
      }
      content.push({type:'paragraph',attrs,...(children.length?{content:children}:{})});
    }
    if(!content.length)content.push({type:'paragraph'});
    data={app:'WriteSplatTM',version:1,createdAt:date,updatedAt:date,metadata:{title:doc.title,author:'',targetGrade:'6'},document:{format:'prosemirror-json',content:{type:'doc',content}},teacher:{studentView:false,citations:[],answerKey:[]}};
    warnings.push('WriteSplat receives complete stories with supported character and paragraph formatting. Page positions, masters, pictures, shapes and tables are not part of this text export.');
    if(Object.keys(doc.customFonts||{}).length)warnings.push('Embedded font files are not transferred to WriteSplat. Original family names are retained; that app uses fonts available on its device.');
    if(Object.values(doc.stories).some(s=>s.style.tracking||s.style.wordSpacing||s.style.textScale&&s.style.textScale!==1||s.marks?.some(m=>m.tracking)))warnings.push('Tracking, word spacing and horizontal text scaling are not transferred to WriteSplat.');
  } else if (kind === 'showsplat') {
    const scale = Math.min(1600 / doc.width, 900 / doc.height), dx = (1600 - doc.width * scale) / 2, dy = (900 - doc.height * scale) / 2;
    const slides = doc.pages.map((p, index) => { const master = (doc.masters || []).find(m => m.id === p.masterId), objects = [...(master?.objects || []).filter(o => !(p.masterOverrides || []).includes(o.id)), ...p.objects]; const elements = objects.map((o,z) => {
      const el = { id: uid(), x: dx + o.x * scale, y: dy + o.y * scale, w: o.w * scale, h: o.h * scale, rotate: o.rotation, z };
      if (o.type === 'text') { const context = pageContext(doc,p,layout), s = context.doc.stories[o.storyId]; return { ...el, type: 'text', text: context.layout.fragments.get(o.id)?.text || '', fontFamily: s.style.font, fontSize: s.style.size * scale, bold: s.style.weight === 'bold', italic: !!s.style.italic, underline: !!s.style.underline, color: s.style.color, align: s.style.align, fill: 'transparent' }; }
      if (o.type === 'image') { const a = doc.assets[o.assetId]; return { ...el, type: a.media?.kind === 'video' ? 'video' : 'image', src: a.media?.kind === 'video' ? a.media.src : a.src, alt: a.alt || a.name, fit: o.fit }; }
      if (o.type === 'table') return { ...el, type: 'table', rows: o.cells, fontSize: o.fontSize * scale, fill: '#ffffff', color: '#25304b' };
      return { ...el, type: 'shape', text: '', fill: o.noFill ? 'transparent' : o.fill, color: o.stroke, fontSize: 12 };
    }); return { id: uid(), title: `${doc.title} · ${index+1}`, notes: '', bg: 'light', backgroundColor: '#ffffff', footer: false, audio: [], elements }; });
    data = { version: 1, title: doc.title, theme: 'violet', footer: '', globalAudio: null, slides }; warnings.push('Pages fit the ShowSplat slide canvas. Masters are copied into slides; review reflow, rich formatting, shapes, borders, opacity, crops, and typography. Overflowing story text is not visible on exported slides.');
  } else if (kind === 'gridsplat') {
    if (!tables.length) throw Error('Add a table before exporting to GridSplat.');
    const literal = v => /^\s*=/.test(v) ? "'" + v : v;
    data = { version: 1, metadata: { createdAt: date, title: doc.title }, sheets: tables.map((t,i) => ({ id: `sheet-${i+1}`, name: `Table ${i+1}`, cells: t.cells.map(r => r.map(literal)), rows: t.cells.length, cols: t.cells[0].length })), charts: [], pictureGraphs: [] }; warnings.push('Editable tables exported as workbook sheets. GridSplat currently opens the first sheet. Formula-like publication text is escaped to remain literal. Other page objects are omitted.');
  } else if (kind === 'listsplat') {
    if (!tables.length) throw Error('Add a table before exporting to ListSplat.');
    const nativeTables = tables.map((t,i) => { const fields = t.cells[0].map((name,c) => ({ id: uid(), name: t.header && name ? name : `Column ${c+1}`, type: 'text', description: '', required: false, hidden: false })); return { id: uid(), name: `Table ${i+1}`, fields, records: t.cells.slice(t.header ? 1 : 0).map(row => ({ id: uid(), createdAt: date, updatedAt: date, values: Object.fromEntries(fields.map((f,c) => [f.id,row[c] || ''])) })) }; });
    data = { app: 'ListSplatTM', version: 1, createdAt: date, updatedAt: date, metadata: { title: doc.title, author: '', className: '' }, schema: { tables: nativeTables, relationships: [] }, layouts: nativeTables.map(t => ({ id: uid(), name: 'Table View', tableId: t.id, mode: 'table', locked: false })), teacher: { studentView: false, notes: [], rubric: [] } }; warnings.push('Editable tables become database tables with text fields. Other publication objects and formatting are omitted.');
  } else throw Error('Unknown SplatWorks export.');
  data.conversionWarnings = warnings;
  return { blob: new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), extension: `.${kind}.json`, warnings };
}

export function setupSuiteImport(api) {
  const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'; input.hidden = true; input.id = 'suiteImportInput'; document.body.append(input);
  input.onchange = async () => { const file = input.files[0]; input.value = ''; if (!file) return;
    try { if (file.size > 20000000) throw Error('SplatWorks imports are limited to 20 MB.'); const result = await importSuite(JSON.parse(await file.text()),{customFonts:api.getDoc().customFonts||{}}); if (confirm(api.t('replaceConfirm'))) { await api.replaceDoc(result.doc); api.showReport(result.warnings); } }
    catch (error) { api.showReport([error.message]); }
  };
  return { open() { input.click(); } };
}
