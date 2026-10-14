import { uid } from './engine.mjs';
export const BRAND_LOGO = 'splatworks-logo.png';
export function addBrandMark(doc, page, x, y, size = 24) {
  let id = Object.keys(doc.assets).find(id => doc.assets[id].brandExample);
  if (!id) { id = uid(); doc.assets[id] = { name: 'SplatWorks example logo — replace with your own', alt: 'SplatWorks example logo', width: 160, height: 160, src: BRAND_LOGO, sample: true, brandExample: true }; }
  const o = { id: uid(), type: 'image', assetId: id, x, y, w: size, h: size, rotation: 0, fit: 'contain', locked: false }; page.objects.push(o); return o;
}
