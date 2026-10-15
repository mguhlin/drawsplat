import { pageObjects, pictureGeometry } from './presentation-model.mjs';
import { pptxObject } from './presentation-pptx.mjs';
import { OdpObjects } from './presentation-odp.mjs';
import { readData } from './media.mjs';
// Native editable office presentations, with an optional page-image mode.
// No conversion service or desktop office installation is needed at runtime.
const xml = value => String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const header = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const ns = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
const mime = { pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', odp: 'application/vnd.oasis.opendocument.presentation' };
const relationships = entries => header + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + entries.map(([id, type, target, mode]) => `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${xml(target)}"${mode ? ` TargetMode="${mode}"` : ''}/>`).join('') + '</Relationships>';
const group = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
const colorMap = '<p:clrMap accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" bg1="lt1" bg2="lt2" folHlink="folHlink" hlink="hlink" tx1="dk1" tx2="dk2"/>';
function theme() {
  const colors = ['000000', 'FFFFFF', '25304B', 'F4F1FA', '7C3AED', 'EA580C', '15803D', '2563EB', 'BE185D', 'CA8A04', '2563EB', '7C3AED'];
  const names = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'];
  const fill = '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>';
  return header + `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="LayoutSplat"><a:themeElements><a:clrScheme name="LayoutSplat">${names.map((name, i) => `<a:${name}><a:srgbClr val="${colors[i]}"/></a:${name}>`).join('')}</a:clrScheme><a:fontScheme name="LayoutSplat"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="LayoutSplat"><a:fillStyleLst>${fill.repeat(3)}</a:fillStyleLst><a:lnStyleLst>${`<a:ln w="9525" cap="flat" cmpd="sng" algn="ctr">${fill}<a:prstDash val="solid"/><a:miter lim="800000"/></a:ln>`.repeat(3)}</a:lnStyleLst><a:effectStyleLst>${'<a:effectStyle><a:effectLst/></a:effectStyle>'.repeat(3)}</a:effectStyleLst><a:bgFillStyleLst>${fill.repeat(3)}</a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;
}
function pptxShell(zip, count, width, height) {
  const cx = Math.round(width * 12700), cy = Math.round(height * 12700);
  // PresentationML ST_SlideSizeCoordinate is limited to 1–56 inches.
  if (width < 72 || height < 72 || width > 4032 || height > 4032) throw Error('PowerPoint slide dimensions must be between 1 and 56 inches. Change the page size or use ODP.');
  const parts = [['presentation', 'presentation.main'], ['slideMasters/slideMaster1', 'slideMaster'], ['slideLayouts/slideLayout1', 'slideLayout'], ['presProps', 'presProps']];
  for (let i = 1; i <= count; i++) parts.push([`slides/slide${i}`, 'slide']);
  zip.file('[Content_Types].xml', header + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>' + parts.map(([part, type]) => `<Override PartName="/ppt/${part}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.${type}+xml"/>`).join('') + '</Types>');
  zip.file('_rels/.rels', relationships([['rId1', 'officeDocument', 'ppt/presentation.xml']]));
  zip.file('ppt/presentation.xml', header + `<p:presentation ${ns}><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rIdMaster"/></p:sldMasterIdLst><p:sldIdLst>${Array.from({ length: count }, (_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`).join('')}</p:sldIdLst><p:sldSz cx="${cx}" cy="${cy}" type="custom"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`);
  zip.file('ppt/_rels/presentation.xml.rels', relationships([['rIdMaster', 'slideMaster', 'slideMasters/slideMaster1.xml'], ['rIdProps', 'presProps', 'presProps.xml'], ...Array.from({ length: count }, (_, i) => [`rId${i + 1}`, 'slide', `slides/slide${i + 1}.xml`])]));
  zip.file('ppt/presProps.xml', header + `<p:presentationPr ${ns}/>`);
  zip.file('ppt/slideMasters/slideMaster1.xml', header + `<p:sldMaster ${ns}><p:cSld name="LayoutSplat"><p:spTree>${group}</p:spTree></p:cSld>${colorMap}<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rIdLayout"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>`);
  zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', relationships([['rIdLayout', 'slideLayout', '../slideLayouts/slideLayout1.xml'], ['rIdTheme', 'theme', '../theme/theme1.xml']]));
  zip.file('ppt/slideLayouts/slideLayout1.xml', header + `<p:sldLayout ${ns} type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>${group}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`);
  zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', relationships([['rIdMaster', 'slideMaster', '../slideMasters/slideMaster1.xml']]));
  zip.file('ppt/theme/theme1.xml', theme());
  return (number, sourcePage, title, native) => {
    const description = xml(`${title} — page ${sourcePage + 1}. Flattened page artwork; text and objects are not separately editable.`);
    const artwork = `<p:pic><p:nvPicPr><p:cNvPr id="2" name="Page ${sourcePage + 1}" descr="${description}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rIdImage"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
    zip.file(`ppt/slides/slide${number}.xml`, header + `<p:sld ${ns}><p:cSld name="${xml(title)} — Page ${sourcePage + 1}"><p:spTree>${group}${native ? native.body : artwork}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`);
    zip.file(`ppt/slides/_rels/slide${number}.xml.rels`, relationships([['rIdLayout', 'slideLayout', '../slideLayouts/slideLayout1.xml'], ...(native ? native.rels : [['rIdImage', 'image', `../media/page${number}.png`]])]));
    return `ppt/media/page${number}.png`;
  };
}
const odfNs = 'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" office:version="1.3"';
export async function exportPresentation(kind, doc, options, renderImage, layout, renderObject) {
  const { pages, bleed = 0, onProgress = () => {}, presentationMode = 'editable' } = options;
  if (!['editable', 'image'].includes(presentationMode)) throw Error('Choose editable objects or page images for presentation export.');
  const editable = presentationMode === 'editable', warnings = new Set(), warn = message => warnings.add(message);
  const width = doc.width + 2 * bleed, height = doc.height + 2 * bleed, zip = new JSZip(), slides = [], images = new Map(), imageCache = new Map();
  const odp = new OdpObjects(warn);
  if (kind === 'odp') zip.file('mimetype', mime.odp, { compression: 'STORE' });
  const addSlide = kind === 'pptx' ? pptxShell(zip, pages.length, width, height) : null;
  async function embedImage(asset) {
    if (imageCache.has(asset.src)) return imageCache.get(asset.src);
    let src = asset.src;
    if (!/^data:image\/(png|jpeg);base64,/.test(src)) {
      const image = new Image(); image.src = src; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      try { canvas.getContext('2d').drawImage(image, 0, 0); src = canvas.toDataURL('image/png'); }
      finally { canvas.width = canvas.height = 1; }
    }
    const jpeg = src.startsWith('data:image/jpeg'), path = `${kind === 'pptx' ? 'ppt/media' : 'Pictures'}/object${images.size + 1}.${jpeg ? 'jpg' : 'png'}`;
    zip.file(path, src.slice(src.indexOf(',') + 1), { base64: true }); images.set(path, jpeg ? 'image/jpeg' : 'image/png'); imageCache.set(asset.src, path); return path;
  }
  if (editable) {
    warn('Editable text, pictures, shapes and tables are converted. Office text metrics and table row heights may differ; review the presentation in the receiving application.');
    if (Object.keys(doc.customFonts || {}).length) warn('Custom font family names are retained, but font files are not embedded. Install those fonts on the receiving device.');
    if (layout.overflows?.length) warn('Story text that overflows the publication is not visible on exported slides. Keep the native LayoutSplat project for complete stories.');
  }
  for (const [i, page] of pages.entries()) {
    onProgress(i + 1, pages.length);
    let body, rels = [];
    if (editable) {
      const objects = pageObjects(doc, doc.pages[page], layout, bleed, warn), parts = [];
      let id = 2;
      const addLink = target => {
        let rel = rels.find(r => r[1] === 'hyperlink' && r[2] === target);
        if (!rel) { rel = [`rIdLink${rels.length + 1}`, 'hyperlink', target, 'External']; rels.push(rel); }
        return rel[0];
      };
      for (let object of objects) {
        let content, imageId, path;
        const write = () => kind === 'pptx' ? pptxObject(object, id, { imageId, addLink, warn }) : odp.object(object, `p${i + 1}o${id}`, path);
        const rasterReason = object.type === 'shape' && object.kind === 'border' ? 'decorative border' : object.type === 'image' && object.path ? 'masked picture' : null;
        if (!rasterReason && object.type === 'image') {
          object = pictureGeometry(object); path = await embedImage(object.asset);
          imageId = `rIdImage${id}`; rels.push([imageId, 'image', '../media/' + path.split('/').at(-1)]);
        }
        content = rasterReason ? null : write();
        if (content === null) {
          const reason = rasterReason || (object.gradient ? 'gradient effect' : 'custom path with unsupported commands');
          warn(`Page ${page + 1}, ${object.name}: ${reason} becomes an individual editable picture; its internal geometry is flattened.`);
          const raster = await renderObject(object), asset = { src: await readData(raster.blob), width: raster.width, height: raster.height, name: object.name, alt: reason };
          object = { ...object, type: 'image', asset, fit: 'stretch', crop: null }; delete object.path;
          path = await embedImage(asset); imageId = `rIdImage${id}`; rels.push([imageId, 'image', '../media/' + path.split('/').at(-1)]); content = write();
        }
        parts.push(content); id++;
      }
      body = parts.join('');
    } else {
      const path = kind === 'pptx' ? `ppt/media/page${i + 1}.png` : `Pictures/page${i + 1}.png`;
      zip.file(path, await (await renderImage(page)).arrayBuffer()); images.set(path, 'image/png');
      body = `<draw:frame draw:name="Page ${page + 1}" draw:style-name="Artwork" svg:x="0pt" svg:y="0pt" svg:width="${width}pt" svg:height="${height}pt"><draw:image xlink:href="${path}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/><svg:title>${xml(doc.title)} — page ${page + 1}</svg:title><svg:desc>Flattened page artwork; text and objects are not separately editable.</svg:desc></draw:frame>`;
    }
    if (kind === 'pptx') addSlide(i + 1, page, doc.title, editable ? { body, rels } : null);
    else slides.push(`<draw:page draw:name="Page ${page + 1}" draw:style-name="Page" draw:master-page-name="Default">${body}</draw:page>`);
  }
  if (editable) zip.file('LayoutSplat-conversion.txt', ['LayoutSplat editable presentation conversion', ...warnings].join('\n'));
  if (kind === 'odp') {
    zip.file('styles.xml', header + `<office:document-styles ${odfNs}><office:styles>${odp.definitions.join('')}</office:styles><office:automatic-styles><style:page-layout style:name="PageLayout"><style:page-layout-properties fo:page-width="${width}pt" fo:page-height="${height}pt" fo:margin="0pt" style:print-orientation="${width > height ? 'landscape' : 'portrait'}"/></style:page-layout></office:automatic-styles><office:master-styles><style:master-page style:name="Default" style:page-layout-name="PageLayout"/></office:master-styles></office:document-styles>`);
    zip.file('content.xml', header + `<office:document-content ${odfNs}><office:font-face-decls>${odp.fontDeclarations()}</office:font-face-decls><office:automatic-styles><style:style style:name="Page" style:family="drawing-page"><style:drawing-page-properties draw:fill="solid" draw:fill-color="#ffffff"/></style:style><style:style style:name="Artwork" style:family="graphic"><style:graphic-properties draw:stroke="none" draw:fill="none"/></style:style>${odp.styles.join('')}</office:automatic-styles><office:body><office:presentation>${slides.join('')}</office:presentation></office:body></office:document-content>`);
    const entries = [['/', mime.odp], ['content.xml', 'text/xml'], ['styles.xml', 'text/xml'], ...images, ...(editable ? [['LayoutSplat-conversion.txt', 'text/plain']] : [])];
    zip.file('META-INF/manifest.xml', header + '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3">' + entries.map(([path, type]) => `<manifest:file-entry manifest:full-path="${path}" manifest:media-type="${type}"/>`).join('') + '</manifest:manifest>');
  }
  return { blob: await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: mime[kind] }), extension: `.${kind}`, ...(editable ? { warnings: [...warnings] } : {}) };
}
