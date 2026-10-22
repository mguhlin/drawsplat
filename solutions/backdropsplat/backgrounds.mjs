// SPDX-License-Identifier: AGPL-3.0-or-later
// Original, locally shipped artwork. No stock-image service or attribution dependency.
export const BACKGROUNDS = [
  { id: 'studio-paper', name: 'Studio Paper', description: 'Warm paper with soft studio lighting' },
  { id: 'soft-lavender', name: 'Soft Lavender', description: 'A quiet lavender and sky-blue wash' },
  { id: 'classroom-board', name: 'Classroom Board', description: 'Deep green with chalk details at the edges' },
  { id: 'splat-confetti', name: 'Splat Confetti', description: 'Colorful splashes around an open center' },
  { id: 'mountain-morning', name: 'Mountain Morning', description: 'Layered mountains under a pale morning sky' },
  { id: 'coastal-calm', name: 'Coastal Calm', description: 'Blue water and a warm stretch of sand' }
].map(background => ({ ...background, url: new URL(`./backgrounds/${background.id}.svg`, import.meta.url).href }));

export function backgroundRect(sourceWidth, sourceHeight, width, height, fit = 'cover') {
  if (![sourceWidth, sourceHeight, width, height].every(n => Number.isFinite(n) && n > 0)) throw new Error('Invalid background dimensions.');
  if (!['cover', 'contain'].includes(fit)) throw new Error('Choose fill frame or fit entire image.');
  const scale = Math[fit === 'contain' ? 'min' : 'max'](width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale, drawHeight = sourceHeight * scale;
  return { x: (width - drawWidth) / 2, y: (height - drawHeight) / 2, width: drawWidth, height: drawHeight };
}

export function drawBackground(ctx, width, height, { type = 'transparent', color = '#ffffff', image, fit = 'cover' } = {}, jpeg = false) {
  if (type === 'white' || type === 'color' || jpeg || (type === 'image' && fit === 'contain')) { ctx.fillStyle = type === 'color' ? color : '#ffffff'; ctx.fillRect(0, 0, width, height); }
  if (type === 'image') {
    if (!image) throw new Error('Choose a replacement background first.');
    const rect = backgroundRect(image.width, image.height, width, height, fit);
    ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  }
}
