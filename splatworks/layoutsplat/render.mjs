import { applyTextStyle } from './layout.mjs';
import { appendRich } from './rich.mjs';
const pt = n => `${n}pt`;
export function objectElement(doc, object, layout) {
  const el = document.createElement('div'); el.className = `object ${object.type}${object.locked ? ' locked' : ''}`; el.dataset.objectId = object.id;
  Object.assign(el.style, { left: pt(object.x), top: pt(object.y), width: pt(object.w), height: pt(object.h), transform: `rotate(${object.rotation}deg)` });
  el.style.opacity = object.opacity ?? 1;
  if (object.type === 'text') {
    const story = doc.stories[object.storyId], fragment = layout.fragments.get(object.id), style = layout.styles?.get(object.storyId) || story.style;
    if (style.wordArt === 'curve') {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.classList.add('object-shape'); svg.setAttribute('viewBox', `0 0 ${object.w} ${object.h}`);
      const path = document.createElementNS(svg.namespaceURI, 'path'), id = `curve-${crypto.randomUUID()}`; path.id = id; path.setAttribute('d', `M4 ${object.h * .8}Q${object.w / 2} ${object.h * -.2} ${object.w - 4} ${object.h * .8}`); path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'none');
      const text = document.createElementNS(svg.namespaceURI, 'text'), along = document.createElementNS(svg.namespaceURI, 'textPath'); text.setAttribute('fill', style.color); text.setAttribute('stroke', 'none'); text.setAttribute('font-size', style.size); text.setAttribute('font-family', style.font); text.setAttribute('font-weight', style.weight); text.setAttribute('text-anchor', 'middle'); along.setAttribute('href', `#${id}`); along.setAttribute('startOffset', '50%'); along.textContent = fragment?.text.replace(/\s+/g, ' ') || ''; text.append(along); svg.append(path, text); el.append(svg); return el;
    }
    for (const column of fragment?.columns || [{ start: fragment?.start || 0, end: fragment?.end || 0, x: object.padding, y: object.padding, w: object.w - 2 * object.padding, h: object.h - 2 * object.padding }]) {
      const body = document.createElement('div'); body.className = 'text-content'; Object.assign(body.style, { position: 'absolute', left: pt(column.x), top: pt(column.y), width: pt(column.w), height: pt(column.h) });
      const columnStyle = column.noDropCap ? { ...(column.style || style), dropCap: 0 } : column.style || style;
      applyTextStyle(body, columnStyle); appendRich(body, story, column.start, column.end, { first: column.start === 0, style: columnStyle }); el.append(body);
      if (columnStyle.textScale && columnStyle.textScale !== 1) { body.style.width = pt(column.w / columnStyle.textScale); body.style.transform = `scaleX(${columnStyle.textScale})`; body.style.transformOrigin = '0 0'; }
    }
  } else if (object.type === 'image') {
    const image = document.createElement('img'); image.className = 'object-image'; image.src = doc.assets[object.assetId].src; image.alt = doc.assets[object.assetId].alt || doc.assets[object.assetId].name; image.draggable = false; image.style.objectFit = object.fit === 'stretch' ? 'fill' : object.fit; el.append(image);
    if (object.crop) { const c = object.crop; el.style.overflow = 'hidden'; Object.assign(image.style, { position: 'absolute', left: `${c.x * 100}%`, top: `${c.y * 100}%`, width: `${c.w * 100}%`, height: `${c.h * 100}%`, objectFit: 'fill' }); }
    if (object.path && object.pathViewBox && !doc.assets[object.assetId].media) {
      // Inline SVG keeps the crop and arbitrary mask in browser print and raster exports.
      const [x,y,w,h]=object.pathViewBox,id=`clip-${crypto.randomUUID()}`,svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),defs=document.createElementNS(svg.namespaceURI,'defs'),clip=document.createElementNS(svg.namespaceURI,'clipPath'),path=document.createElementNS(svg.namespaceURI,'path'),picture=document.createElementNS(svg.namespaceURI,'image'),c=object.crop||{x:0,y:0,w:1,h:1};
      svg.setAttribute('viewBox',`0 0 ${object.w} ${object.h}`);svg.setAttribute('preserveAspectRatio','none');svg.classList.add('object-image');svg.setAttribute('role','img');svg.setAttribute('aria-label',image.alt);clip.id=id;path.setAttribute('d',object.path);path.setAttribute('transform',`scale(${object.w/w} ${object.h/h}) translate(${-x} ${-y})`);clip.append(path);defs.append(clip);svg.append(defs);
      for(const [key,value]of Object.entries({href:image.src,x:c.x*object.w,y:c.y*object.h,width:c.w*object.w,height:c.h*object.h,preserveAspectRatio:object.fit==='stretch'||object.crop?'none':object.fit==='cover'?'xMidYMid slice':'xMidYMid meet','clip-path':`url(#${id})`}))picture.setAttribute(key,value);svg.append(picture);el.replaceChildren(svg);
    }
  } else if (object.type === 'table') {
    const table = document.createElement('table'); table.className = 'object-table'; table.style.fontSize = pt(object.fontSize); table.style.direction = object.direction || 'ltr';
    object.cells.forEach((row, index) => { const tr = document.createElement('tr'); row.forEach(value => { const cell = document.createElement(object.header && !index ? 'th' : 'td'); cell.textContent = value; if (cell.tagName === 'TH') cell.scope = 'col'; tr.append(cell); }); table.append(tr); }); el.style.overflow = 'hidden'; el.append(table);
  } else {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', object.pathViewBox ? object.pathViewBox.join(' ') : `0 0 ${object.w} ${object.h}`); svg.setAttribute('preserveAspectRatio', 'none'); svg.classList.add('object-shape');
    const paths = { triangle: `M${object.w / 2} 0L${object.w} ${object.h}H0Z`, arrow: `M0 ${object.h * .3}H${object.w * .6}V0L${object.w} ${object.h / 2}L${object.w * .6} ${object.h}V${object.h * .7}H0Z`, heart: `M${object.w / 2} ${object.h}C${-object.w * .3} ${object.h * .4} 0 ${-object.h * .2} ${object.w / 2} ${object.h * .25}C${object.w} ${-object.h * .2} ${object.w * 1.3} ${object.h * .4} ${object.w / 2} ${object.h}Z`, callout: `M0 0H${object.w}V${object.h * .75}H${object.w * .4}L${object.w * .2} ${object.h}V${object.h * .75}H0Z` };
    paths.star = Array.from({ length: 10 }, (_, i) => { const a = Math.PI * i / 5 - Math.PI / 2, r = i % 2 ? .22 : .5; return `${i ? 'L' : 'M'}${object.w / 2 + Math.cos(a) * object.w * r} ${object.h / 2 + Math.sin(a) * object.h * r}`; }).join('') + 'Z';
    paths.hexagon = `M${object.w * .25} 0H${object.w * .75}L${object.w} ${object.h / 2}L${object.w * .75} ${object.h}H${object.w * .25}L0 ${object.h / 2}Z`;
    const path = object.path || paths[object.kind];
    const item = document.createElementNS(svg.namespaceURI, path ? 'path' : object.kind === 'ellipse' ? 'ellipse' : object.kind === 'line' ? 'line' : 'rect');
    const inset = object.strokeWidth / 2;
    const attrs = object.kind === 'ellipse' ? { cx: object.w / 2, cy: object.h / 2, rx: Math.max(0, object.w / 2 - inset), ry: Math.max(0, object.h / 2 - inset) } : object.kind === 'line' ? { x1: 0, y1: object.h / 2, x2: object.w, y2: object.h / 2 } : { x: inset, y: inset, width: Math.max(0, object.w - object.strokeWidth), height: Math.max(0, object.h - object.strokeWidth) };
    Object.entries(attrs).forEach(([k, v]) => item.setAttribute(k, v)); item.setAttribute('fill', object.noFill ? 'none' : object.fill); item.setAttribute('stroke', object.stroke); item.setAttribute('stroke-width', object.kind === 'line' ? Math.max(1, object.strokeWidth) : object.strokeWidth); svg.append(item); el.append(svg);
    if (object.gradient && !object.noFill) { const g = object.gradient, defs = document.createElementNS(svg.namespaceURI, 'defs'), gradient = document.createElementNS(svg.namespaceURI, g.type === 'radial' ? 'radialGradient' : 'linearGradient'), id = `gradient-${crypto.randomUUID()}`; gradient.id = id;
      if (g.type === 'linear') { const angle = g.angle * Math.PI / 180, x = Math.cos(angle) / 2, y = Math.sin(angle) / 2; for (const [key, value] of Object.entries({ x1: .5 - x, y1: .5 - y, x2: .5 + x, y2: .5 + y })) gradient.setAttribute(key, value); }
      for (const s of g.stops) { const stop = document.createElementNS(svg.namespaceURI, 'stop'); stop.setAttribute('offset', s.offset); stop.setAttribute('stop-color', s.color); stop.setAttribute('stop-opacity', s.opacity); gradient.append(stop); } defs.append(gradient); svg.prepend(defs); item.setAttribute('fill', `url(#${id})`); }
    if (path) item.setAttribute('d', path);
    if (object.kind === 'border') {
      item.setAttribute('fill', 'none'); item.setAttribute('stroke-width', '2');
      for (let x = 8; x < object.w - 6; x += 16) for (const y of [6, object.h - 6]) { const dot = document.createElementNS(svg.namespaceURI, 'circle'); dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('r', '3'); dot.setAttribute('fill', object.fill); svg.append(dot); }
      for (let y = 22; y < object.h - 6; y += 16) for (const x of [6, object.w - 6]) { const dot = document.createElementNS(svg.namespaceURI, 'circle'); dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('r', '3'); dot.setAttribute('fill', object.fill); svg.append(dot); }
    }
  }
  return el;
}
export function publicationPage(doc, page, layout) {
  const el = document.createElement('section'); el.className = 'publication-page'; el.style.width = pt(doc.width); el.style.height = pt(doc.height);
  const master = (doc.masters || []).find(m => m.id === page.masterId);
  for (const object of master?.objects || []) if (!(page.masterOverrides || []).includes(object.id)) el.append(objectElement(doc, object, layout));
  page.objects.forEach(object => el.append(objectElement(doc, object, layout))); return el;
}
export function exportHtml(doc, layout, { interactive = false, nativeDoc = doc } = {}) {
  const style = `@page{size:${doc.width}pt ${doc.height}pt;margin:0}*{box-sizing:border-box}body{margin:0;background:#ece8f4;padding:24px;direction:ltr}.publication-page{position:relative;background:white;overflow:hidden;margin:0 auto 24px;break-after:page;break-inside:avoid}.object{position:absolute;transform-origin:center}.text-content{width:100%;height:100%;overflow:hidden}.object-image,.object-shape{display:block;width:100%;height:100%}.object-shape{stroke:none;fill:none}.object-table{border-collapse:collapse;width:100%;table-layout:fixed;font:12pt/1.4 Arial}.object-table td,.object-table th{border:.75pt solid #b9b1cd;padding:6pt;vertical-align:top;overflow-wrap:anywhere}.object-table th{background:#ede7fb;color:#34205c;text-align:start}.motion-poster{display:none} @media print{body{padding:0;background:white}.publication-page{margin:0;print-color-adjust:exact;-webkit-print-color-adjust:exact}.publication-page:last-child{break-after:auto}.motion-player{display:none}.motion-poster{display:block}}`;
  const documentOut = document.implementation.createHTMLDocument(doc.title); documentOut.documentElement.lang = 'en';
  const meta = documentOut.createElement('meta'); meta.name = 'viewport'; meta.content = 'width=device-width,initial-scale=1'; documentOut.head.append(meta);
  const charset = documentOut.createElement('meta'); charset.setAttribute('charset', 'utf-8'); documentOut.head.prepend(charset);
  const css = documentOut.createElement('style'); css.textContent = style; documentOut.head.append(css);
  doc.pages.forEach(page => {
    const rendered = publicationPage(doc, page, layout);
    if (interactive) rendered.querySelectorAll('.object.image').forEach(el => {
      const o = [...page.objects, ...((doc.masters || []).find(m => m.id === page.masterId)?.objects || [])].find(o => o.id === el.dataset.objectId), a = doc.assets[o.assetId]; if (!a.media) return;
      const poster = el.querySelector('img'), player = documentOut.createElement(a.media.kind === 'video' ? 'video' : 'img'); player.className = 'object-image motion-player'; player.style.objectFit = o.fit; player.src = a.media.src;
      if (player.tagName === 'VIDEO') { player.controls = true; player.preload = 'metadata'; player.poster = a.src; player.setAttribute('aria-label', a.alt || a.name); } else player.alt = a.alt || a.name;
      poster.classList.add('motion-poster'); el.append(player);
    }); documentOut.body.append(rendered);
  });
  const metadata = documentOut.createElement('template'); metadata.id = 'layoutsplat-document'; metadata.content.append(documentOut.createTextNode(JSON.stringify(nativeDoc))); documentOut.body.append(metadata);
  return '<!doctype html>\n' + documentOut.documentElement.outerHTML;
}
