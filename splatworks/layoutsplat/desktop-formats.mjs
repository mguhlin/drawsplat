import { newPublication, validatePublication, uid, clone, frame, shape, textStyle } from './engine.mjs';
import { xml, parseXml, color, fontFamily } from './compatibility.mjs';
import { importMedia } from './media.mjs';
const NS = 'http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging', header = '<?xml version="1.0" encoding="UTF-8"?>\n';
const attrs = object => Object.entries(object).map(([key, value]) => `${key}="${xml(value)}"`).join(' ');
const points = (w, h) => [[0, 0], [w, 0], [w, h], [0, h]];
const path = (w, h) => `<Properties><PathGeometry><GeometryPathType PathOpen="false"><PathPointArray>${points(w, h).map(([x, y]) => `<PathPointType Anchor="${x} ${y}" LeftDirection="${x} ${y}" RightDirection="${x} ${y}"/>`).join('')}</PathPointArray></GeometryPathType></PathGeometry></Properties>`;
function runs(story, start = 0, end = story.text.length) {
  const marks = story.marks || [], edges = [...new Set([start, end, ...marks.flatMap(m => [Math.max(start, Math.min(end, m.from)), Math.max(start, Math.min(end, m.to))])])].sort((a, b) => a - b);
  return edges.slice(0, -1).map((from, i) => { const to = edges[i + 1], style = Object.assign({ bold: story.style.weight === 'bold', italic: !!story.style.italic, underline: !!story.style.underline, font: story.style.font, size: story.style.size, color: story.style.color }, ...marks.filter(m => m.from <= from && m.to >= to)); return { text: story.text.slice(from, to), style }; });
}
function flattened(doc) {
  const d = clone(doc); d.masters = [];
  d.pages.forEach((page, i) => {
    const master = (doc.masters || []).find(m => m.id === page.masterId), map = new Map();
    const objects = (master?.objects || []).filter(o => !(page.masterOverrides || []).includes(o.id)).map(original => { const o = clone(original); o.id = `master-${i}-${o.id}`; if (o.type === 'text') { if (!map.has(o.storyId)) { const id = `master-${i}-${o.storyId}`; map.set(o.storyId, id); d.stories[id] = { ...clone(doc.stories[o.storyId]), frames: [] }; } o.storyId = map.get(o.storyId); d.stories[o.storyId].frames.push(o.id); } return o; });
    page.objects.unshift(...objects); delete page.masterId; delete page.masterOverrides;
  }); return d;
}
export async function exportDesktop(kind, doc, layout) {
  const d = flattened(doc), packageZip = new JSZip(), links = new Map(), report = ['LayoutSplat desktop interchange', 'Keep this folder together and open publication.' + kind + '.', 'Editable text, frame geometry, pictures, and simple shapes are converted. Masters and groups are flattened. Advanced effects and tables become pictures. Fonts may be substituted and text may reflow in the receiving application.', 'Videos use poster pictures. Native JSON retains the complete LayoutSplat publication.', 'This is an interchange exporter, not a native .pub, .indd, or .afpub writer. Verify appearance in the target application before printing.'];
  const id = new Map(); let count = 1; d.pages.forEach(p => p.objects.forEach(o => id.set(o.id, 'u' + count++))); Object.keys(d.stories).forEach(key => id.set(key, 's' + count++));
  for (const page of d.pages) for (const o of page.objects) {
    if (o.type === 'image') { const a = d.assets[o.assetId], ext = a.src.startsWith('data:image/jpeg') ? 'jpg' : a.src.startsWith('data:image/webp') ? 'webp' : 'png', name = `Links/${o.assetId}.${ext}`; packageZip.file(name, a.src.split(',')[1], { base64: true }); links.set(o.id, { name, width: a.width, height: a.height }); }
    if (o.type === 'table' || o.type === 'shape' && !['rect', 'ellipse', 'line'].includes(o.kind) || o.type === 'text' && d.stories[o.storyId].style.wordArt && d.stories[o.storyId].style.wordArt !== 'none') {
      const { pageCanvas, canvasBlob } = await import('./exports.mjs'); const canvas = await pageCanvas({ ...d, width: o.w, height: o.h }, { objects: [{ ...o, x: 0, y: 0, rotation: 0 }] }, layout, 300); const name = `Links/${id.get(o.id)}.png`; packageZip.file(name, await canvasBlob(canvas)); links.set(o.id, { name, width: canvas.width, height: canvas.height }); report.push(`${id.get(o.id)}: ${o.type === 'table' ? 'table' : o.type === 'text' ? 'WordArt' : o.kind} converted to a 300 ppi picture.`); canvas.width = canvas.height = 1;
    }
  }
  if (kind === 'idml') {
    const zip = new JSZip(); zip.file('mimetype', 'application/vnd.adobe.indesign-idml-package', { compression: 'STORE' }); zip.file('META-INF/container.xml', header + '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="designmap.xml" media-type="text/xml"/></rootfiles></container>');
    const wrapper = (name, content) => header + `<idPkg:${name} xmlns:idPkg="${NS}" DOMVersion="7.0">${content}</idPkg:${name}>`;
    const colors = new Set(['#000000', '#ffffff']); Object.values(d.stories).forEach(s => { colors.add(s.style.color); (s.marks || []).forEach(m => m.color && colors.add(m.color)); }); d.pages.forEach(p => p.objects.forEach(o => { if (o.fill) colors.add(o.fill); if (o.stroke) colors.add(o.stroke); }));
    const colorId = c => `Color/${c.slice(1)}`; zip.file('Resources/Graphic.xml', wrapper('Graphic', '<Swatch Self="Swatch/None" Name="None"/>' + [...colors].map(c => `<Color Self="${colorId(c)}" Name="${c}" Model="Process" Space="RGB" ColorValue="${[1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)).join(' ')}"/>`).join('')));
    zip.file('Resources/Styles.xml', wrapper('Styles', '<RootCharacterStyleGroup Self="rc"><CharacterStyle Self="CharacterStyle/$ID/[No character style]" Name="$ID/[No character style]"/></RootCharacterStyleGroup><RootParagraphStyleGroup Self="rp"><ParagraphStyle Self="ParagraphStyle/$ID/[No paragraph style]" Name="$ID/[No paragraph style]"/></RootParagraphStyleGroup>'));
    zip.file('Resources/Preferences.xml', wrapper('Preferences', `<DocumentPreference PageWidth="${d.width}" PageHeight="${d.height}" FacingPages="false" PagesPerDocument="${d.pages.length}" DocumentBleedTopOffset="${d.bleed || 0}" DocumentBleedBottomOffset="${d.bleed || 0}" DocumentBleedInsideOrLeftOffset="${d.bleed || 0}" DocumentBleedOutsideOrRightOffset="${d.bleed || 0}"/>`));
    zip.file('Resources/Fonts.xml', wrapper('Fonts', ['Arial', 'Georgia', 'Verdana'].map(font => `<FontFamily Self="FontFamily/${font}" Name="${font}">${['Regular', 'Bold', 'Italic', 'Bold Italic'].map(style => `<Font Self="Font/${font}-${style.replaceAll(' ', '')}" Name="${font} ${style}" FontFamily="${font}" FontStyleName="${style}" FontType="TrueType"/>`).join('')}</FontFamily>`).join('')));
    const usedStories = new Set(); let spreads = '';
    for (let pageIndex = 0; pageIndex < d.pages.length; pageIndex++) {
      const p = d.pages[pageIndex], spreadId = `spread${pageIndex + 1}`; let objects = '';
      for (const o of p.objects) {
        const angle = o.rotation * Math.PI / 180, a = Math.cos(angle), b = Math.sin(angle), tx = o.x + o.w / 2 - a * o.w / 2 + b * o.h / 2, ty = o.y + o.h / 2 - b * o.w / 2 - a * o.h / 2;
        const common = { Self: id.get(o.id), ItemLayer: 'layer1', ItemTransform: `${a} ${b} ${-b} ${a} ${tx} ${ty}`, Locked: String(o.locked), StrokeWeight: o.strokeWidth || 0, FillColor: o.type === 'shape' && !o.noFill ? colorId(o.fill) : 'Swatch/None', StrokeColor: o.strokeWidth ? colorId(o.stroke) : 'Swatch/None' };
        if (o.type === 'text' && !links.has(o.id)) {
          const story = d.stories[o.storyId], index = story.frames.indexOf(o.id); usedStories.add(o.storyId);
          objects += `<TextFrame ${attrs({ ...common, ParentStory: id.get(o.storyId), PreviousTextFrame: id.get(story.frames[index - 1]) || 'n', NextTextFrame: id.get(story.frames[index + 1]) || 'n', ContentType: 'TextType' })}>${path(o.w, o.h)}<TextFramePreference TextColumnCount="${o.columns || 1}" TextColumnGutter="${o.columnGap ?? 12}"><Properties><InsetSpacing type="list">${Array(4).fill(`<ListItem type="unit">${o.padding}</ListItem>`).join('')}</InsetSpacing></Properties></TextFramePreference></TextFrame>`;
        } else if (links.has(o.id)) {
          const link = links.get(o.id), scale = o.fit === 'cover' ? Math.max(o.w / link.width, o.h / link.height) : Math.min(o.w / link.width, o.h / link.height), iw = link.width * scale, ih = link.height * scale;
          objects += `<Rectangle ${attrs({ ...common, ContentType: 'GraphicType' })}>${path(o.w, o.h)}<Image Self="image-${id.get(o.id)}" ItemTransform="1 0 0 1 ${(o.w - iw) / 2} ${(o.h - ih) / 2}" GraphicBounds="0 0 ${ih} ${iw}"><Properties><GraphicBounds Left="0" Top="0" Right="${iw}" Bottom="${ih}"/></Properties><Link Self="link-${id.get(o.id)}" LinkResourceURI="file:${xml(link.name)}" LinkResourceFormat="${link.name.endsWith('.jpg') ? 'JPEG' : 'PNG'}" LinkType="Normal"/></Image></Rectangle>`;
        } else objects += `<${o.kind === 'ellipse' ? 'Oval' : 'Rectangle'} ${attrs({ ...common, ContentType: 'Unassigned' })}>${path(o.w, o.h)}</${o.kind === 'ellipse' ? 'Oval' : 'Rectangle'}>`;
      }
      zip.file(`Spreads/${spreadId}.xml`, wrapper('Spread', `<Spread Self="${spreadId}" PageCount="1" ItemTransform="1 0 0 1 0 0" ShowMasterItems="true"><Page Self="page${pageIndex + 1}" Name="${pageIndex + 1}" GeometricBounds="0 0 ${d.height} ${d.width}" ItemTransform="1 0 0 1 0 0" AppliedMaster="n"><MarginPreference Top="${d.margin}" Bottom="${d.margin}" Left="${d.margin}" Right="${d.margin}" ColumnCount="${d.guides.columns}" ColumnGutter="${d.guides.gap}"/></Page>${objects}</Spread>`)); spreads += `<idPkg:Spread src="Spreads/${spreadId}.xml"/>`;
    }
    let stories = '';
    for (const key of usedStories) { const s = d.stories[key], style = s.style;
      const content = runs(s).map(run => `<CharacterStyleRange ${attrs({ AppliedCharacterStyle: 'CharacterStyle/$ID/[No character style]', PointSize: run.style.size, FontStyle: run.style.bold ? run.style.italic ? 'Bold Italic' : 'Bold' : run.style.italic ? 'Italic' : 'Regular', FillColor: colorId(run.style.color), Underline: String(run.style.underline) })}><Properties><AppliedFont type="string">${xml(run.style.font)}</AppliedFont></Properties>${run.text.split('\n').map(xml).join('</Content><Br/><Content>').replace(/^/, '<Content>').replace(/$/, '</Content>')}</CharacterStyleRange>`).join('');
      zip.file(`Stories/${id.get(key)}.xml`, wrapper('Story', `<Story Self="${id.get(key)}" AppliedTOCStyle="n"><StoryPreference StoryDirection="${style.direction === 'rtl' ? 'RightToLeftDirection' : 'LeftToRightDirection'}"/><ParagraphStyleRange AppliedParagraphStyle="ParagraphStyle/$ID/[No paragraph style]" Justification="${{ left: 'LeftAlign', right: 'RightAlign', center: 'CenterAlign', justify: 'FullyJustified' }[style.align]}" Leading="${style.size * style.lineHeight}">${content}</ParagraphStyleRange></Story>`)); stories += `<idPkg:Story src="Stories/${id.get(key)}.xml"/>`;
    }
    zip.file('designmap.xml', header + `<?aid style="50" type="document" readerVersion="6.0" featureSet="257" product="7.0"?><Document xmlns:idPkg="${NS}" DOMVersion="7.0" Self="d" ActiveLayer="layer1" StoryList="${[...usedStories].map(key => id.get(key)).join(' ')}"><Layer Self="layer1" Name="LayoutSplat" Visible="true" Locked="false" Printable="true"/><idPkg:Graphic src="Resources/Graphic.xml"/><idPkg:Fonts src="Resources/Fonts.xml"/><idPkg:Styles src="Resources/Styles.xml"/><idPkg:Preferences src="Resources/Preferences.xml"/>${spreads}${stories}</Document>`);
    zip.file('LayoutSplat/publication.json', JSON.stringify(doc)); packageZip.file('publication.idml', await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }));
  } else {
    const colors = new Set(['#000000']); Object.values(d.stories).forEach(s => { colors.add(s.style.color); (s.marks || []).forEach(m => m.color && colors.add(m.color)); }); d.pages.forEach(p => p.objects.forEach(o => { if (o.fill) colors.add(o.fill); if (o.stroke) colors.add(o.stroke); })); const fontName = s => `${s.font} ${s.bold ? s.italic ? 'Bold Italic' : 'Bold' : s.italic ? 'Italic' : 'Regular'}`;
    const cstyle = s => attrs({ FONT: fontName(s), FONTSIZE: s.size, FCOLOR: s.color, FEATURES: s.underline ? 'underline' : 'inherit' });
    let body = [...colors].map(c => `<COLOR NAME="${c}" RGB="${c}" Spot="0" Register="0"/>`).join('') + '<LAYERS NUMMER="0" LEVEL="0" NAME="LayoutSplat" SICHTBAR="1" DRUCKEN="1" EDIT="1" FLOW="1" TRANS="1"/>';
    d.pages.forEach((p, i) => {
      const y = i * (d.height + 40); body += `<PAGE ${attrs({ NUM: i, PAGEXPOS: 0, PAGEYPOS: y, PAGEWIDTH: d.width, PAGEHEIGHT: d.height, BORDERLEFT: d.margin, BORDERRIGHT: d.margin, BORDERTOP: d.margin, BORDERBOTTOM: d.margin, NAM: '', MNAM: '' })}/>`;
      for (const o of p.objects) {
        const story = d.stories[o.storyId], index = story?.frames.indexOf(o.id), image = links.get(o.id), common = { OwnPage: i, ItemID: count + Number(id.get(o.id).slice(1)), PTYPE: image ? 2 : o.type === 'text' ? 4 : o.kind === 'line' ? 5 : 6, XPOS: o.x, YPOS: y + o.y, WIDTH: o.w, HEIGHT: o.h, ROT: o.rotation, FRTYPE: o.kind === 'ellipse' ? 1 : 0, PWIDTH: o.strokeWidth || 0, PCOLOR: o.type === 'shape' && !o.noFill ? o.fill : 'None', PCOLOR2: o.strokeWidth ? o.stroke : 'None', LAYER: 0, LOCK: Number(o.locked), TransValue: 1 - (o.opacity ?? 1) };
        let content = '';
        if (image) Object.assign(common, { PFILE: image.name, LOCALSCX: o.w / image.width, LOCALSCY: o.h / image.height, LOCALX: 0, LOCALY: 0, SCALETYPE: 1, RATIO: 1, PICART: 1 });
        else if (story) {
          Object.assign(common, { COLUMNS: o.columns || 1, COLGAP: o.columnGap ?? 12, EXTRA: o.padding, TEXTRA: o.padding, BEXTRA: o.padding, REXTRA: o.padding, NEXTITEM: id.has(story.frames[index + 1]) ? count + Number(id.get(story.frames[index + 1]).slice(1)) : -1, BACKITEM: id.has(story.frames[index - 1]) ? count + Number(id.get(story.frames[index - 1]).slice(1)) : -1 });
          if (!index) content = `<StoryText><DefaultStyle ${cstyle({ ...story.style, bold: story.style.weight === 'bold' })} ALIGN="${['left', 'center', 'right', 'justify'].indexOf(story.style.align)}" LINESP="${story.style.size * story.style.lineHeight}"/>${runs(story).map(run => run.text.split('\n').map(line => `<ITEXT CH="${xml(line)}" ${cstyle(run.style)}/>`).join('<para/>')).join('')}<trail/></StoryText>`;
        }
        if (o.type === 'shape' && ['rect', 'line'].includes(o.kind)) common.path = `M0 0L${o.w} 0L${o.w} ${o.h}L0 ${o.h}Z`;
        body += `<PAGEOBJECT ${attrs(common)}>${content}</PAGEOBJECT>`;
      }
    });
    packageZip.file('publication.sla', header + `<SCRIBUSUTF8NEW Version="1.5.8"><DOCUMENT ${attrs({ ANZPAGES: d.pages.length, PAGEWIDTH: d.width, PAGEHEIGHT: d.height, BORDERLEFT: d.margin, BORDERRIGHT: d.margin, BORDERTOP: d.margin, BORDERBOTTOM: d.margin, FIRSTNUM: 1, BOOK: 0, UNITS: 2, DFONT: 'Arial Regular', DSIZE: 12, TITLE: d.title, BleedTop: d.bleed || 0, BleedLeft: d.bleed || 0, BleedRight: d.bleed || 0, BleedBottom: d.bleed || 0 })}>${body}</DOCUMENT></SCRIBUSUTF8NEW>`);
  }
  packageZip.file('publication.layoutsplat.json', JSON.stringify(doc, null, 2)); packageZip.file('CONVERSION-REPORT.txt', report.join('\n')); return { blob: await packageZip.generateAsync({ type: 'blob', compression: 'DEFLATE' }), extension: `.${kind}-package.zip` };
}
export async function readZip(file) { const zip = await JSZip.loadAsync(file); let size = 0; if (Object.keys(zip.files).length > 5000) throw Error('Too many archive entries.'); for (const item of Object.values(zip.files)) { size += item._data?.uncompressedSize || 0; if (size > 256000000 || /(^|\/)\.\.(\/|$)/.test(item.name)) throw Error('Archive is too large or has unsafe paths.'); } return zip; }
async function xmlEntry(zip, name) { const entry = zip.file(name); if (!entry || entry._data?.uncompressedSize > 24000000) throw Error('Missing or oversized XML component.'); return parseXml(await entry.async('string')); }
async function linkedAsset(zip, name, warnings) {
  if (!zip) return null; const path = decodeURIComponent(name || '').replace(/^file:(\/\/)?/i, ''), base = path.split(/[\\/]/).at(-1); const entry = zip.file(path) || Object.values(zip.files).find(item => !item.dir && item.name.split('/').at(-1) === base);
  if (!entry || entry._data?.uncompressedSize > 96000000) { warnings.push(`Missing local picture: ${base || 'unknown'}. No remote files were downloaded.`); return null; }
  try { const a = await importMedia(new File([await entry.async('uint8array')], base)); delete a.notes; return a; } catch { warnings.push(`Could not decode ${base}. Replace its placeholder.`); return null; }
}
const num = (el, key, fallback = 0) => Number(el.getAttribute(key) ?? fallback);
function textObject(doc, page, text, geom, style, marks = []) { const key = uid(), o = frame(key, geom.x, geom.y, Math.max(6, geom.w), Math.max(6, geom.h)); o.padding = 0; o.rotation = geom.rotation || 0; doc.stories[key] = { text, style: { ...textStyle(), ...style }, marks, frames: [o.id] }; page.objects.push(o); return o; }
export async function importSla(text, zip = null) {
  const parsed = parseXml(text), root = parsed.querySelector('DOCUMENT'); if (!root) throw Error('Not a Scribus publication.'); const doc = newPublication(true), warnings = ['Scribus text and basic frames are converted. Check fonts, wrapping, master items, groups, and effects.']; doc.width = num(root, 'PAGEWIDTH', 612); doc.height = num(root, 'PAGEHEIGHT', 792); doc.margin = num(root, 'BORDERLEFT', 36); doc.pages = [];
  const colors = new Map([...root.querySelectorAll('COLOR')].map(c => [c.getAttribute('NAME'), c.getAttribute('RGB') || '#25304b'])), pages = [...root.querySelectorAll(':scope > PAGE')], objectMap = new Map();
  for (const el of pages) doc.pages.push({ id: uid(), objects: [] }); if (!doc.pages.length) doc.pages.push({ id: uid(), objects: [] });
  for (const item of root.querySelectorAll('PAGEOBJECT')) {
    const index = Math.max(0, Math.min(doc.pages.length - 1, num(item, 'OwnPage'))), page = doc.pages[index], geom = { x: num(item, 'XPOS') - (pages[index] ? num(pages[index], 'PAGEXPOS') : 0), y: num(item, 'YPOS') - (pages[index] ? num(pages[index], 'PAGEYPOS') : 0), w: num(item, 'WIDTH', 100), h: num(item, 'HEIGHT', 100), rotation: num(item, 'ROT') }; let o;
    if (num(item, 'PTYPE') === 4 || item.querySelector('StoryText,ITEXT')) {
      let text = '', marks = []; const def = item.querySelector('DefaultStyle') || item;
      for (const node of item.querySelector('StoryText')?.children || item.children) {
        if (node.localName === 'ITEXT') { const from = text.length; text += node.getAttribute('CH') || (node.hasAttribute('Unicode') ? String.fromCharCode(num(node, 'Unicode')) : ''); if (text.length > from) marks.push({ from, to: text.length, font: fontFamily(node.getAttribute('FONT') || def.getAttribute('FONT') || ''), bold: /bold/i.test(node.getAttribute('FONT') || ''), italic: /italic|oblique/i.test(node.getAttribute('FONT') || ''), underline: /underline/.test(node.getAttribute('FEATURES') || ''), ...(node.hasAttribute('FONTSIZE') ? { size: num(node, 'FONTSIZE') } : {}), ...(node.hasAttribute('FCOLOR') ? { color: color(colors.get(node.getAttribute('FCOLOR'))) } : {}) }); }
        if (['para', 'breakline'].includes(node.localName)) text += '\n'; if (node.localName === 'tab') text += '\t';
      }
      o = textObject(doc, page, text, geom, { font: fontFamily(def.getAttribute('FONT') || ''), size: num(def, 'FONTSIZE', 12), weight: /bold/i.test(def.getAttribute('FONT') || '') ? 'bold' : 'normal', align: ['left', 'center', 'right', 'justify'][num(def, 'ALIGN')] || 'left', color: color(colors.get(def.getAttribute('FCOLOR'))) }, marks);
    } else if (num(item, 'PTYPE') === 2) { const asset = await linkedAsset(zip, item.getAttribute('PFILE'), warnings); if (asset) { const key = uid(); doc.assets[key] = asset; o = { id: uid(), type: 'image', assetId: key, ...geom, fit: 'contain', locked: false }; page.objects.push(o); } else { o = shape(geom.x, geom.y, geom.w, geom.h, '#eeeaf6'); page.objects.push(o); } }
    else { o = shape(geom.x, geom.y, geom.w, geom.h, color(colors.get(item.getAttribute('PCOLOR'))), num(item, 'FRTYPE') === 1 ? 'ellipse' : num(item, 'PTYPE') === 5 ? 'line' : 'rect'); o.rotation = geom.rotation; if (item.getAttribute('path') && num(item, 'FRTYPE') !== 1 && num(item, 'PTYPE') !== 5) { o.kind = 'path'; o.path = item.getAttribute('path'); } o.noFill = item.getAttribute('PCOLOR') === 'None'; page.objects.push(o); }
    objectMap.set(item.getAttribute('ItemID'), { o, next: item.getAttribute('NEXTITEM') });
  }
  // Restore Scribus story chains without introducing cycles.
  for (const { o, next } of objectMap.values()) { const target = objectMap.get(next)?.o; if (o.type === 'text' && target?.type === 'text' && o.storyId !== target.storyId) { const a = doc.stories[o.storyId], b = doc.stories[target.storyId]; const old = target.storyId; a.text += b.text; a.frames.push(...b.frames); b.frames.forEach(id => doc.pages.forEach(p => p.objects.forEach(f => { if (f.id === id) f.storyId = o.storyId; }))); delete doc.stories[old]; } }
  return { doc: validatePublication(doc), warnings };
}
export async function importIdml(zip, assetZip = zip) {
  const native = zip.file('LayoutSplat/publication.json'); if (native) return { doc: validatePublication(JSON.parse(await native.async('string'))), warnings: [] };
  const map = await xmlEntry(zip, 'designmap.xml'), doc = newPublication(true), warnings = ['IDML import converts text, basic page objects, and locally packaged pictures. Check typography, transforms, masters, clipping, and effects.']; doc.pages = []; doc.stories = {};
  const storyMap = new Map(), frameMap = new Map(), colors = new Map();
  const graphic = map.getElementsByTagNameNS(NS, 'Graphic')[0]; if (graphic) for (const c of (await xmlEntry(zip, graphic.getAttribute('src'))).querySelectorAll('Color')) { const values = (c.getAttribute('ColorValue') || '0 0 0').split(' ').map(Number); if (c.getAttribute('Space') === 'RGB') colors.set(c.getAttribute('Self'), '#' + values.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')); }
  for (const ref of map.getElementsByTagNameNS(NS, 'Story')) {
    const root = (await xmlEntry(zip, ref.getAttribute('src'))).querySelector('Story'); if (!root) continue; let text = '', marks = [], base;
    for (const range of root.querySelectorAll('CharacterStyleRange')) { const from = text.length; for (const child of range.children) { if (child.localName === 'Content') text += child.textContent; if (child.localName === 'Br') text += '\n'; } const style = { font: fontFamily(range.querySelector('AppliedFont')?.textContent || ''), size: Math.max(6, Math.min(120, num(range, 'PointSize', 12))), color: colors.get(range.getAttribute('FillColor')) || '#25304b', bold: /bold/i.test(range.getAttribute('FontStyle') || ''), italic: /italic|oblique/i.test(range.getAttribute('FontStyle') || ''), underline: range.getAttribute('Underline') === 'true' }; base ||= style; if (text.length > from) marks.push({ from, to: text.length, ...style }); }
    const id = uid(), direction = root.querySelector('StoryPreference')?.getAttribute('StoryDirection'); storyMap.set(root.getAttribute('Self'), id); doc.stories[id] = { text, marks, frames: [], style: { ...textStyle(), ...base, weight: base?.bold ? 'bold' : 'normal', direction: direction === 'RightToLeftDirection' ? 'rtl' : 'ltr' } };
  }
  const matrix = el => { const value = (el.getAttribute('ItemTransform') || '1 0 0 1 0 0').split(/\s+/).map(Number); return value.length === 6 && value.every(Number.isFinite) ? new DOMMatrix(value) : new DOMMatrix(); };
  for (const ref of map.getElementsByTagNameNS(NS, 'Spread')) {
    const spread = (await xmlEntry(zip, ref.getAttribute('src'))).querySelector('Spread'); if (!spread) continue; const pageEls = [...spread.querySelectorAll(':scope > Page')], pages = pageEls.map(el => { const bounds = (el.getAttribute('GeometricBounds') || '0 0 792 612').split(' ').map(Number), m = matrix(el), p = { id: uid(), objects: [] }; doc.pages.push(p); if (doc.pages.length === 1) { doc.width = bounds[3] - bounds[1]; doc.height = bounds[2] - bounds[0]; doc.margin = num(el.querySelector('MarginPreference') || el, 'Top', 36); } return { p, x: m.e + bounds[1], y: m.f + bounds[0], w: bounds[3] - bounds[1], h: bounds[2] - bounds[0] }; });
    for (const el of spread.querySelectorAll('TextFrame,Rectangle,Oval,Polygon,GraphicLine')) {
      let m = matrix(el); for (let parent = el.parentElement; parent && parent !== spread; parent = parent.parentElement) if (parent.localName === 'Group') m = matrix(parent).multiply(m);
      const anchors = [...el.querySelectorAll(':scope > Properties > PathGeometry PathPointType')].map(p => (p.getAttribute('Anchor') || '0 0').split(' ').map(Number)); if (!anchors.length) { warnings.push('An object without supported path geometry was skipped.'); continue; }
      const localX = Math.min(...anchors.map(p => p[0])), localY = Math.min(...anchors.map(p => p[1])), w = Math.max(...anchors.map(p => p[0])) - localX, h = Math.max(...anchors.map(p => p[1])) - localY, center = new DOMPoint(localX + w / 2, localY + h / 2).matrixTransform(m), target = pages.find(p => center.x >= p.x && center.x <= p.x + p.w && center.y >= p.y && center.y <= p.y + p.h) || pages[0]; if (!target) continue;
      const geom = { x: center.x - target.x - w * Math.hypot(m.a, m.b) / 2, y: center.y - target.y - h * Math.hypot(m.c, m.d) / 2, w: Math.max(6, w * Math.hypot(m.a, m.b)), h: Math.max(6, h * Math.hypot(m.c, m.d)), rotation: Math.atan2(m.b, m.a) * 180 / Math.PI }; let o;
      if (el.localName === 'TextFrame' && storyMap.has(el.getAttribute('ParentStory'))) { const storyId = storyMap.get(el.getAttribute('ParentStory')); o = frame(storyId, geom.x, geom.y, geom.w, geom.h); o.rotation = geom.rotation; const preference = el.querySelector('TextFramePreference'); if (preference) { o.columns = num(preference, 'TextColumnCount', 1); o.columnGap = num(preference, 'TextColumnGutter', 12); } doc.stories[storyId].frames.push(o.id); target.p.objects.push(o); frameMap.set(el.getAttribute('Self'), { o, next: el.getAttribute('NextTextFrame'), prev: el.getAttribute('PreviousTextFrame') }); }
      else if (el.querySelector('Link')) { const asset = await linkedAsset(assetZip, el.querySelector('Link').getAttribute('LinkResourceURI'), warnings); if (asset) { const id = uid(); doc.assets[id] = asset; o = { id: uid(), type: 'image', assetId: id, ...geom, fit: 'contain', locked: false }; target.p.objects.push(o); } else target.p.objects.push(shape(geom.x, geom.y, geom.w, geom.h, '#eeeaf6')); }
      else { o = shape(geom.x, geom.y, geom.w, geom.h, colors.get(el.getAttribute('FillColor')) || '#7c3aed', el.localName === 'Oval' ? 'ellipse' : el.localName === 'GraphicLine' ? 'line' : 'rect'); o.rotation = geom.rotation; target.p.objects.push(o); }
    }
  }
  for (const s of Object.values(doc.stories)) { const start = [...frameMap.entries()].find(([, f]) => s.frames.includes(f.o.id) && !frameMap.has(f.prev)); if (start) { const ordered = [], seen = new Set(); let current = start[1]; while (current && !seen.has(current.o.id)) { ordered.push(current.o.id); seen.add(current.o.id); current = frameMap.get(current.next); } s.frames = [...ordered, ...s.frames.filter(id => !seen.has(id))]; } }
  for (const [key, story] of Object.entries(doc.stories)) if (!story.frames.length) delete doc.stories[key];
  return { doc: validatePublication(doc), warnings };
}
