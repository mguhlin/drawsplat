// Rich stories remain text plus validated inline ranges, never imported HTML.
export function appendRich(element, story, start, end, { first = false, style = story.style } = {}) {
  if (story.paragraphs?.length) {
    let offset = start;
    for (const p of story.paragraphs.filter(p => p.from < end && (p.to > start || p.to === p.from && p.from >= start))) {
      const from = Math.max(start, p.from), to = Math.min(end, p.to);
      // Paragraph separators are represented by blocks, not an extra empty line.
      if (from > offset && story.text.slice(offset, from).replace(/\n/g, '')) appendRich(element, { ...story, paragraphs: undefined }, offset, from, { first: first && offset === start, style });
      const block = document.createElement('div'), scale = style.size / story.style.size;
      block.style.boxSizing = 'content-box';
      block.style.lineHeight = p.lineMultiple ? String(p.lineMultiple) : `${p.leading * scale}pt`; block.style.textAlign = p.align;
      Object.assign(block.style, { paddingTop: `${from === p.from ? (p.spaceBefore || 0) * scale : 0}pt`, paddingBottom: `${to === p.to ? (p.spaceAfter || 0) * scale : 0}pt`, paddingLeft: `${(p.indentLeft || 0) * scale}pt`, paddingRight: `${(p.indentRight || 0) * scale}pt`, textIndent: `${from === p.from ? (p.firstLineIndent || 0) * scale : 0}pt` });
      // Each paragraph needs its own font strut. Keeping a large headline's font
      // on later small-print paragraphs can enlarge their line boxes and overflow.
      const run = (story.marks || []).find(m=>m.from<=from&&m.to>from);
      if(run?.size)block.style.fontSize=`${run.size * style.size / story.style.size}pt`;
      if(run?.font)block.style.fontFamily=`"${run.font}","LayoutSplat Arabic","LayoutSplat Indic","LayoutSplat CJK",sans-serif`;
      if(run?.bold!==undefined)block.style.fontWeight=run.bold?'bold':'normal';
      block.style.minHeight = `${(p.lineMultiple ? (run?.size || style.size / scale) * p.lineMultiple : p.leading) * scale}pt`;
      appendRich(block, { ...story, paragraphs: undefined }, from, to, { first: first && from === start, style }); element.append(block); offset = to;
    }
    if (offset < end && story.text.slice(offset, end).replace(/\n/g, '')) appendRich(element, { ...story, paragraphs: undefined }, offset, end, { first: false, style });
    return;
  }
  const text = story.text.slice(start, end), ranges = (story.marks || []).filter(m => m.from < end && m.to > start);
  const edges = [...new Set([start, end, ...ranges.flatMap(m => [Math.max(start, m.from), Math.min(end, m.to)])])].sort((a, b) => a - b);
  const firstLength = first && style.dropCap ? ([...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)][0]?.segment.length || 0) : 0;
  if (firstLength && !edges.includes(start + firstLength)) edges.push(start + firstLength), edges.sort((a, b) => a - b);
  for (let i = 0; i < edges.length - 1; i++) {
    const from = edges[i], to = edges[i + 1]; if (to <= from) continue;
    const active = ranges.filter(m => m.from <= from && m.to >= to), attrs = Object.assign({}, ...active);
    const span = document.createElement(attrs.link ? 'a' : 'span'); span.textContent = story.text.slice(from, to);
    if (attrs.bold !== undefined) span.style.fontWeight = attrs.bold ? 'bold' : 'normal';
    if (attrs.italic !== undefined) span.style.fontStyle = attrs.italic ? 'italic' : 'normal'; if (attrs.underline !== undefined) span.style.textDecoration = attrs.underline ? 'underline' : 'none';
    if (attrs.color) span.style.color = attrs.color; if (attrs.font) span.style.fontFamily = `"${attrs.font}","LayoutSplat Arabic","LayoutSplat Indic","LayoutSplat CJK",sans-serif`; if (attrs.size) span.style.fontSize = `${attrs.size * style.size / story.style.size}pt`;
    if (attrs.tracking !== undefined) span.style.letterSpacing = `${attrs.tracking * style.size / story.style.size}pt`;
    if (attrs.link) { span.href = attrs.link; span.rel = 'noopener noreferrer'; }
    if (firstLength && from === start) { span.style.cssFloat = style.direction === 'rtl' ? 'right' : 'left'; span.style.fontSize = `${style.size * style.lineHeight * style.dropCap}pt`; span.style.lineHeight = '0.85'; span.style.marginInlineEnd = '5pt'; }
    element.append(span);
  }
}
const paragraphKeys = ['leading','align','lineMultiple','spaceBefore','spaceAfter','indentLeft','indentRight','firstLineIndent'];
export function textToRichDocument(story) {
  let offset = 0;
  const paragraphs = story.paragraphs?.length ? story.paragraphs : story.text.split('\n').map(line => { const p = { from: offset, to: offset + line.length, align: story.style.align }; offset += line.length + 1; return p; });
  return { type: 'doc', content: paragraphs.map(p => {
    const start = p.from, end = p.to, ranges = (story.marks || []).filter(m => m.from < end && m.to > start), edges = [...new Set([start, end, ...ranges.flatMap(m => [Math.max(start, m.from), Math.min(end, m.to)])])].sort((a,b)=>a-b);
    const content = [];
    for (let i = 0; i < edges.length - 1; i++) {
      const from = edges[i], to = edges[i+1]; if (to <= from) continue;
      const active = Object.assign({ bold: story.style.weight === 'bold', italic: !!story.style.italic, underline: !!story.style.underline }, ...ranges.filter(m=>m.from<=from && m.to>=to)), marks = [];
      for (const [key,name] of [['bold','strong'],['italic','em'],['underline','underline']]) if (active[key]) marks.push({type:name});
      if (['color','size','font','tracking'].some(key=>active[key]!==undefined)) marks.push({type:'style',attrs:Object.fromEntries(['color','size','font','tracking'].map(key=>[key,active[key]??null]))});
      if (active.link) marks.push({type:'link',attrs:{href:active.link}});
      story.text.slice(from,to).split('\n').forEach((part,index)=>{ if(index)content.push({type:'hard_break'});if(part)content.push({type:'text',text:part,...(marks.length?{marks}:{})}); });
    }
    return {type:'paragraph',attrs:Object.fromEntries(paragraphKeys.map(key=>[key,p[key]??null])),...(content.length?{content}:{})};
  }) };
}
export function richDocumentToText(documentJson, style = {size:12,lineHeight:1.45,align:'left'}) {
  let text = '', marks = [], paragraphs = [];
  (documentJson.content || []).forEach((paragraph,i)=>{
    if(i)text+='\n'; const start=text.length;
    for(const node of paragraph.content||[]){
      if(node.type==='hard_break'){text+='\n';continue;} if(!node.text)continue;
      const from=text.length;text+=node.text;const range={from,to:text.length,bold:false,italic:false,underline:false};
      for(const mark of node.marks||[]){
        if(mark.type==='strong')range.bold=true;if(mark.type==='em')range.italic=true;if(mark.type==='underline')range.underline=true;
        if(mark.type==='link' && /^(https?:\/\/|mailto:)[^\s<>"']+$/i.test(mark.attrs.href))range.link=mark.attrs.href;
        if(mark.type==='style')for(const key of ['color','size','font','tracking'])if(mark.attrs[key]!==null && mark.attrs[key]!==undefined)range[key]=mark.attrs[key];
      }
      marks.push(range);
    }
    const attrs=paragraph.attrs||{};
    const p={from:start,to:text.length,leading:attrs.leading??style.size*style.lineHeight,align:attrs.align||style.align};
    for(const key of paragraphKeys)if(attrs[key]!==null && attrs[key]!==undefined)p[key]=attrs[key];
    paragraphs.push(p);
  });
  return {text,marks,paragraphs};
}
