export const FRAME_OPTIONS = [
  ['none', 'Plain · no frame'],
  ['confetti', 'Party confetti'],
  ['stars', 'Star sparkle'],
  ['splat', 'Paint splats'],
  ['film', 'Movie night']
];

// Deterministic decorations stay outside the title/image area, in every format.
export function drawPanelFrame(ctx, width, height, style, foreground, accent) {
  if (style === 'none' || !FRAME_OPTIONS.some(([key]) => key === style)) return;
  ctx.save();
  const unit = Math.min(width, height);
  const colors = [accent, '#c4b5fd', '#fb7185', '#a3e635', '#38bdf8'];
  let seed = 47;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  function star(x, y, radius) {
    ctx.beginPath();
    for (let point = 0; point < 10; point++) {
      const angle = -Math.PI / 2 + point * Math.PI / 5;
      const r = point % 2 ? radius * .45 : radius;
      const px = x + Math.cos(angle) * r, py = y + Math.sin(angle) * r;
      point ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fill();
  }
  function splat(x, y, radius) {
    ctx.beginPath();
    for (let point = 0; point < 48; point++) {
      const angle = point * Math.PI / 24;
      const r = radius * (.72 + .24 * Math.cos(angle * 8));
      const px = x + Math.cos(angle) * r, py = y + Math.sin(angle) * r;
      point ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x + radius * 1.2, y - radius * .75, radius * .12, 0, Math.PI * 2); ctx.fill();
  }
  if (style === 'film') {
    ctx.fillStyle = '#172033';
    ctx.fillRect(0, 0, width, height * .075);
    ctx.fillRect(0, height * .925, width, height * .075);
    ctx.fillRect(0, 0, width * .065, height);
    ctx.fillRect(width * .935, 0, width * .065, height);
    ctx.fillStyle = '#faf8ff';
    for (let i = 0; i < 12; i++) {
      const x = width * (.09 + i * .074);
      for (const y of [height * .024, height * .947]) {
        ctx.beginPath(); ctx.roundRect(x, y, width * .04, height * .03, unit * .006); ctx.fill();
      }
    }
    for (let i = 0; i < 10; i++) {
      const y = height * (.105 + i * .08);
      for (const x of [width * .017, width * .95]) {
        ctx.beginPath(); ctx.roundRect(x, y, width * .032, height * .045, unit * .006); ctx.fill();
      }
    }
    ctx.strokeStyle = accent; ctx.lineWidth = unit * .004;
    ctx.strokeRect(width * .082, height * .09, width * .836, height * .82);
  } else {
    ctx.strokeStyle = style === 'stars' ? accent : foreground;
    ctx.globalAlpha = .55; ctx.lineWidth = unit * .004;
    ctx.beginPath(); ctx.roundRect(width * .028, height * .022, width * .944, height * .956, unit * .03); ctx.stroke();
    ctx.globalAlpha = 1;
    const count = style === 'confetti' ? 56 : style === 'stars' ? 24 : 16;
    for (let i = 0; i < count; i++) {
      // Alternating top, right, bottom, left keeps the center free.
      const side = i % 4;
      const position = .07 + random() * .86;
      const x = side === 1 ? width * .90 : side === 3 ? width * .055 : width * position;
      const y = side === 0 ? height * .07 : side === 2 ? height * .89 : height * position;
      ctx.fillStyle = colors[i % colors.length];
      const size = unit * (.012 + random() * .009);
      if (style === 'stars') star(x, y, size * 1.2);
      else if (style === 'splat') splat(x, y, size * 1.5);
      else {
        ctx.save(); ctx.translate(x, y); ctx.rotate(random() * Math.PI);
        if (i % 3 === 0) { ctx.beginPath(); ctx.arc(0, 0, size * .5, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-size / 2, -size / 4, size, size / 2);
        ctx.restore();
      }
    }
  }
  ctx.restore();
}
