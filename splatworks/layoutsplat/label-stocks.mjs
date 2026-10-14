import { newPublication, uid, frame, textStyle, validatePublication } from './engine.mjs';
// Geometry facts and attribution: label-stocks.json; derived from the pinned
// LibreOffice label database (MPL-2.0 / Apache-2.0), checked against Avery sizes.
import { LABEL_STOCK_DATA } from './label-stock-data.mjs';
export const LABEL_STOCKS = LABEL_STOCK_DATA.map(s => ({ ...s, perSheet: s.geometry[6] * s.geometry[7] }));
export const labelDescription = stock => {
  const [, , w, h] = stock.geometry, dimension = stock.paper === 'Letter' ? `${+(w / 72).toFixed(3)} × ${+(h / 72).toFixed(3)} in` : `${+(w * 25.4 / 72).toFixed(2)} × ${+(h * 25.4 / 72).toFixed(2)} mm`;
  return `${stock.name} · ${dimension} · ${stock.perSheet}/sheet · ${stock.paper}`;
};
export function labelPublication(code, { language = 'en', content = 'auto', offsetX = 0, offsetY = 0, startAt = 0 } = {}) {
  const stock = LABEL_STOCKS.find(s => s.id === code || s.codes.includes(code)); if (!stock) throw Error('Unknown label stock.');
  const [pitchX, pitchY, width, height, left, top, columns, rows, pageWidth, pageHeight] = stock.geometry;
  const doc = newPublication(true); doc.pages[0].objects = []; doc.title = `Avery ${stock.id} · ${stock.name}`; doc.publicationType = 'labels'; doc.templateId = `avery-${stock.id}`; doc.language = language; doc.width = pageWidth; doc.height = pageHeight; doc.margin = 0; doc.bleed = 0; doc.safeArea = 0;
  doc.guides = { ...doc.guides, columns: 1, rows: 1, gap: 0, vertical: [...new Set(Array.from({ length: columns }, (_, n) => [left + n * pitchX, left + n * pitchX + width]).flat())], horizontal: [...new Set(Array.from({ length: rows }, (_, n) => [top + n * pitchY, top + n * pitchY + height]).flat())] };
  const badge = stock.category === 'name-badge', small = height < 50, kind = content === 'auto' ? badge ? 'badge' : small ? 'name' : 'address' : content;
  const text = kind === 'badge' ? '{{Name}}\n{{Role}}\n{{Organization}}' : kind === 'address' ? '{{Name}}\n{{Address}}\n{{City}}, {{Region}} {{PostalCode}}' : '{{Name}}';
  const inset = Math.min(6, height / 8), size = kind === 'badge' ? 13 : kind === 'name' ? Math.min(11, (height - 2 * inset) / 1.2) : Math.min(11, (height - 2 * inset) / 3.6);
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const key = uid(), o = frame(key, left + col * pitchX + offsetX, top + row * pitchY + offsetY, width, height); o.padding = inset; o.labelSlot = row * columns + col;
    const story = { text, frames: [o.id], marks: [], style: { ...textStyle(), size: Math.max(6, size), color: '#17263d', lineHeight: 1.15, direction: language === 'ar' ? 'rtl' : 'ltr', align: kind === 'badge' ? 'center' : language === 'ar' ? 'right' : 'left', autoFit: 'shrink', minSize: 6 } };
    if (kind === 'badge') story.marks.push({ from: 0, to: 8, bold: true, size: 24 });
    doc.stories[key] = story; doc.pages[0].objects.push(o);
  }
  doc.labelLayout = { stock: stock.id, compatibleCodes: stock.codes, columns, rows, perSheet: stock.perSheet, width, height, left, top, pitchX, pitchY, offsetX, offsetY, startAt, category: stock.category, source: stock.source, productUrl: stock.productUrl, instructions: 'Print on the matching paper size at Actual size / 100%. Disable Fit to page, headers, and footers. Test on plain paper against your stock before printing labels. Printer feed may require a small X/Y adjustment.' };
  return validatePublication(doc);
}
