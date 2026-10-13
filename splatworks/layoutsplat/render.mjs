import { applyTextStyle } from './layout.mjs';
const pt = n => `${n}pt`;
export function objectElement(doc, object, layout) {
  const el = document.createElement('div'); el.className = `object ${object.type}${object.locked ? ' locked' : ''}`; el.dataset.objectId = object.id;
  Object.assign(el.style, { left: pt(object.x), top: pt(object.y), width: pt(object.w), height: pt(object.h), transform: `rotate(${object.rotation}deg)` });
  if (object.type === 'text') {
    const body = document.createElement('div'); body.className = 'text-content'; body.style.padding = pt(object.padding);
    applyTextStyle(body, doc.stories[object.storyId].style); body.textContent = layout.fragments.get(object.id)?.text || ''; el.append(body);
  } else if (object.type === 'image') {
    const image = document.createElement('img'); image.className = 'object-image'; image.src = doc.assets[object.assetId].src; image.alt = doc.assets[object.assetId].name; image.draggable = false; image.style.objectFit = object.fit; el.append(image);
  } else {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', `0 0 ${object.w} ${object.h}`); svg.setAttribute('preserveAspectRatio', 'none'); svg.classList.add('object-shape');
    const item = document.createElementNS(svg.namespaceURI, object.kind === 'ellipse' ? 'ellipse' : object.kind === 'line' ? 'line' : 'rect');
    const inset = object.strokeWidth / 2;
    const attrs = object.kind === 'ellipse' ? { cx: object.w / 2, cy: object.h / 2, rx: Math.max(0, object.w / 2 - inset), ry: Math.max(0, object.h / 2 - inset) } : object.kind === 'line' ? { x1: 0, y1: object.h / 2, x2: object.w, y2: object.h / 2 } : { x: inset, y: inset, width: Math.max(0, object.w - object.strokeWidth), height: Math.max(0, object.h - object.strokeWidth) };
    Object.entries(attrs).forEach(([k, v]) => item.setAttribute(k, v)); item.setAttribute('fill', object.fill); item.setAttribute('stroke', object.stroke); item.setAttribute('stroke-width', object.kind === 'line' ? Math.max(1, object.strokeWidth) : object.strokeWidth); svg.style.opacity = String(object.opacity); svg.append(item); el.append(svg);
  }
  return el;
}
export function publicationPage(doc, page, layout) {
  const el = document.createElement('section'); el.className = 'publication-page'; el.style.width = pt(doc.width); el.style.height = pt(doc.height);
  page.objects.forEach(object => el.append(objectElement(doc, object, layout))); return el;
}
export function exportHtml(doc, layout) {
  const style = `@page{size:${doc.width}pt ${doc.height}pt;margin:0}*{box-sizing:border-box}body{margin:0;background:#ece8f4;padding:24px;direction:ltr}.publication-page{position:relative;background:white;overflow:hidden;margin:0 auto 24px;break-after:page;break-inside:avoid}.object{position:absolute;transform-origin:center}.text-content{width:100%;height:100%;overflow:hidden}.object-image,.object-shape{display:block;width:100%;height:100%}.object-shape{stroke:none;fill:none} @media print{body{padding:0;background:white}.publication-page{margin:0;print-color-adjust:exact;-webkit-print-color-adjust:exact}.publication-page:last-child{break-after:auto}}`;
  const documentOut = document.implementation.createHTMLDocument(doc.title); documentOut.documentElement.lang = 'en';
  const meta = documentOut.createElement('meta'); meta.name = 'viewport'; meta.content = 'width=device-width,initial-scale=1'; documentOut.head.append(meta);
  const charset = documentOut.createElement('meta'); charset.setAttribute('charset', 'utf-8'); documentOut.head.prepend(charset);
  const css = documentOut.createElement('style'); css.textContent = style; documentOut.head.append(css);
  doc.pages.forEach(page => documentOut.body.append(publicationPage(doc, page, layout)));
  return '<!doctype html>\n' + documentOut.documentElement.outerHTML;
}
