// Image-based office presentations: use the same measured page artwork as PDF/PNG.
// No conversion service or desktop office installation is needed at runtime.
const xml = value => String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const header = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const ns = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
const mime = { pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', odp: 'application/vnd.oasis.opendocument.presentation' };
const relationships = entries => header + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + entries.map(([id, type, target]) => `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${target}"/>`).join('') + '</Relationships>';
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
  zip.file('[Content_Types].xml', header + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>' + parts.map(([part, type]) => `<Override PartName="/ppt/${part}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.${type}+xml"/>`).join('') + '</Types>');
  zip.file('_rels/.rels', relationships([['rId1', 'officeDocument', 'ppt/presentation.xml']]));
  zip.file('ppt/presentation.xml', header + `<p:presentation ${ns}><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rIdMaster"/></p:sldMasterIdLst><p:sldIdLst>${Array.from({ length: count }, (_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`).join('')}</p:sldIdLst><p:sldSz cx="${cx}" cy="${cy}" type="custom"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`);
  zip.file('ppt/_rels/presentation.xml.rels', relationships([['rIdMaster', 'slideMaster', 'slideMasters/slideMaster1.xml'], ['rIdProps', 'presProps', 'presProps.xml'], ...Array.from({ length: count }, (_, i) => [`rId${i + 1}`, 'slide', `slides/slide${i + 1}.xml`])]));
  zip.file('ppt/presProps.xml', header + `<p:presentationPr ${ns}/>`);
  zip.file('ppt/slideMasters/slideMaster1.xml', header + `<p:sldMaster ${ns}><p:cSld name="LayoutSplat"><p:spTree>${group}</p:spTree></p:cSld>${colorMap}<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rIdLayout"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>`);
  zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', relationships([['rIdLayout', 'slideLayout', '../slideLayouts/slideLayout1.xml'], ['rIdTheme', 'theme', '../theme/theme1.xml']]));
  zip.file('ppt/slideLayouts/slideLayout1.xml', header + `<p:sldLayout ${ns} type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>${group}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`);
  zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', relationships([['rIdMaster', 'slideMaster', '../slideMasters/slideMaster1.xml']]));
  zip.file('ppt/theme/theme1.xml', theme());
  return (number, sourcePage, title) => {
    const description = xml(`${title} — page ${sourcePage + 1}. Flattened page artwork; text and objects are not separately editable.`);
    zip.file(`ppt/slides/slide${number}.xml`, header + `<p:sld ${ns}><p:cSld name="Page ${sourcePage + 1}"><p:spTree>${group}<p:pic><p:nvPicPr><p:cNvPr id="2" name="Page ${sourcePage + 1}" descr="${description}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rIdImage"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`);
    zip.file(`ppt/slides/_rels/slide${number}.xml.rels`, relationships([['rIdLayout', 'slideLayout', '../slideLayouts/slideLayout1.xml'], ['rIdImage', 'image', `../media/page${number}.png`]]));
    return `ppt/media/page${number}.png`;
  };
}
const odfNs = 'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" office:version="1.3"';
export async function exportPresentation(kind, doc, options, renderImage) {
  const { pages, bleed = 0, onProgress = () => {} } = options;
  const width = doc.width + 2 * bleed, height = doc.height + 2 * bleed, zip = new JSZip(), slides = [], images = [];
  let addSlide;
  if (kind === 'pptx') addSlide = pptxShell(zip, pages.length, width, height);
  else {
    // ODF requires this to be the first entry, stored without compression.
    zip.file('mimetype', mime.odp, { compression: 'STORE' });
    zip.file('styles.xml', header + `<office:document-styles ${odfNs}><office:styles/><office:automatic-styles><style:page-layout style:name="PageLayout"><style:page-layout-properties fo:page-width="${width}pt" fo:page-height="${height}pt" fo:margin="0pt" style:print-orientation="${width > height ? 'landscape' : 'portrait'}"/></style:page-layout></office:automatic-styles><office:master-styles><style:master-page style:name="Default" style:page-layout-name="PageLayout"/></office:master-styles></office:document-styles>`);
    addSlide = (number, sourcePage, title) => {
      const path = `Pictures/page${number}.png`; images.push(path);
      slides.push(`<draw:page draw:name="Page ${sourcePage + 1}" draw:style-name="Page" draw:master-page-name="Default"><draw:frame draw:name="Page ${sourcePage + 1}" draw:style-name="Artwork" svg:x="0pt" svg:y="0pt" svg:width="${width}pt" svg:height="${height}pt"><svg:title>${xml(title)} — page ${sourcePage + 1}</svg:title><svg:desc>Flattened page artwork; text and objects are not separately editable.</svg:desc><draw:image xlink:href="${path}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/></draw:frame></draw:page>`);
      return path;
    };
  }
  for (const [i, page] of pages.entries()) {
    onProgress(i + 1, pages.length);
    zip.file(addSlide(i + 1, page, doc.title), await (await renderImage(page)).arrayBuffer());
  }
  if (kind === 'odp') {
    zip.file('content.xml', header + `<office:document-content ${odfNs}><office:automatic-styles><style:style style:name="Page" style:family="drawing-page"><style:drawing-page-properties draw:fill="solid" draw:fill-color="#ffffff"/></style:style><style:style style:name="Artwork" style:family="graphic"><style:graphic-properties draw:stroke="none" draw:fill="none"/></style:style></office:automatic-styles><office:body><office:presentation>${slides.join('')}</office:presentation></office:body></office:document-content>`);
    zip.file('META-INF/manifest.xml', header + '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3">' + [['/', mime.odp], ['content.xml', 'text/xml'], ['styles.xml', 'text/xml'], ...images.map(path => [path, 'image/png'])].map(([path, type]) => `<manifest:file-entry manifest:full-path="${path}" manifest:media-type="${type}"/>`).join('') + '</manifest:manifest>');
  }
  return { blob: await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: mime[kind] }), extension: `.${kind}` };
}
