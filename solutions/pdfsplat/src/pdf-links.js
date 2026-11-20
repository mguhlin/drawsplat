// Real PDF link annotations. Rectangles are invisible in the exported document.
export function normalizeLinkUrl(value) {
  const input = value.trim();
  if (!/^(https?:\/\/|file:\/\/)/i.test(input) || /[\u0000-\u001f\u007f]/.test(input))
    throw Error('Enter a complete http://, https://, or file:// URL.');
  let url;
  try { url = new URL(input); } catch { throw Error('Enter a valid URL.'); }
  if (url.protocol !== 'file:' && !url.hostname) throw Error('Enter a valid URL.');
  return url.href;
}

export function appendPdfLinks(document, items, geometries) {
  const {PDFName, PDFHexString, PDFString} = globalThis.PDFLib;
  for (let index = 0; index < items.length; index++) {
    const item = items[index], page = document.getPage(index), geometry = geometries[index];
    for (const link of item.annotations.filter(o => o.type === 'link')) {
      const target = link.targetPageId ? items.findIndex(p => p.id === link.targetPageId) : -1;
      // A separately extracted page cannot jump to a page outside its new PDF.
      if (link.targetPageId && target < 0) continue;
      let corners = [[link.x,link.y],[link.x+link.w,link.y],[link.x,link.y+link.h],[link.x+link.w,link.y+link.h]]
        .map(([x,y]) => geometry.viewport.convertToPdfPoint(x*geometry.viewport.width,y*geometry.viewport.height));
      if (item.crop || item.fineRotation) {
        const box = geometry.box, radians = -geometry.rotation*Math.PI/180;
        const rotate = ([x,y],r) => [x*Math.cos(r)-y*Math.sin(r),x*Math.sin(r)+y*Math.cos(r)];
        const bounds = [[0,0],[box.width,0],[0,box.height],[box.width,box.height]].map(p=>rotate(p,radians));
        const minX = Math.min(...bounds.map(p=>p[0])), minY = Math.min(...bounds.map(p=>p[1]));
        const width = Math.max(...bounds.map(p=>p[0]))-minX, height = Math.max(...bounds.map(p=>p[1]))-minY;
        const crop = item.crop || {left:0,bottom:0,right:0,top:0};
        const left=crop.left*width, bottom=crop.bottom*height, w=width*(1-crop.left-crop.right), h=height*(1-crop.top-crop.bottom);
        corners = corners.map(([x,y])=>rotate([x-box.x,y-box.y],radians)).map(([x,y])=>[x-minX-left,y-minY-bottom]);
        const x0=Math.max(0,Math.min(...corners.map(p=>p[0]))), y0=Math.max(0,Math.min(...corners.map(p=>p[1])));
        const x1=Math.min(w,Math.max(...corners.map(p=>p[0]))), y1=Math.min(h,Math.max(...corners.map(p=>p[1])));
        if (x1<=x0 || y1<=y0) continue;
        const fine=(item.fineRotation||0)*Math.PI/180;
        const finalBounds=[[0,0],[w,0],[0,h],[w,h]].map(p=>rotate(p,fine));
        const fx=Math.min(...finalBounds.map(p=>p[0])), fy=Math.min(...finalBounds.map(p=>p[1]));
        corners=[[x0,y0],[x1,y0],[x0,y1],[x1,y1]].map(p=>rotate(p,fine)).map(([x,y])=>[x-fx,y-fy]);
      }
      const annotation = {
        Type:'Annot', Subtype:'Link', Border:[0,0,0],
        Rect:[Math.min(...corners.map(p=>p[0])),Math.min(...corners.map(p=>p[1])),Math.max(...corners.map(p=>p[0])),Math.max(...corners.map(p=>p[1]))],
        Contents:PDFHexString.fromText(link.label || (target>=0 ? `Page ${target+1}` : link.url)),
        ...(target>=0 ? {Dest:[document.getPage(target).ref,...(link.destination || [{name:'Fit'}]).map(value=>value?.name ? PDFName.of(value.name) : value)]} : {A:{Type:'Action',S:'URI',URI:PDFString.of(normalizeLinkUrl(link.url))}}),
      };
      page.node.addAnnot(document.context.register(document.context.obj(annotation)));
    }
  }
}

export async function readPdfLinks(pdf) {
  const pages=[];
  for(let number=1;number<=pdf.numPages;number++) {
    const page=await pdf.getPage(number), viewport=page.getViewport({scale:1}), links=[];
    for(const a of await page.getAnnotations()) {
      if(a.subtype!=='Link' || !a.rect)continue;
      let targetIndex, destination, url='';
      if(a.dest) {
        try {
          destination=typeof a.dest==='string' ? await pdf.getDestination(a.dest) : a.dest;
          if(!Array.isArray(destination))continue;
          targetIndex=typeof destination[0]==='number' ? destination[0] : await pdf.getPageIndex(destination[0]);
          if(targetIndex<0 || targetIndex>=pdf.numPages)continue;
        }catch {continue;}
      } else {
        try {url=normalizeLinkUrl(a.unsafeUrl || a.url || '');}catch {continue;}
      }
      const r=viewport.convertToViewportRectangle(a.rect);
      links.push({sourceLinkId:a.id,type:'link',x:Math.min(r[0],r[2])/viewport.width,y:Math.min(r[1],r[3])/viewport.height,
        w:Math.abs(r[2]-r[0])/viewport.width,h:Math.abs(r[3]-r[1])/viewport.height,url,targetIndex,
        destination:destination?.slice(1),label:a.contentsObj?.str || ''});
    }
    pages.push(links);
  }
  return pages;
}

export function removeImportedPdfLinks(page, ids) {
  if(!ids?.length)return;
  const refs=page.node.Annots()?.asArray() || [];
  for(const ref of refs) {
    const id=`${ref.objectNumber}R${ref.generationNumber || ''}`;
    if(ids.includes(id))page.node.removeAnnot(ref);
  }
}
