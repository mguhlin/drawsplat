import type { Clip } from "../domain/project";
// Preview and export share this renderer, including wrapping and resolution scaling.
export function drawSubtitle(context: CanvasRenderingContext2D, clip: Clip, width: number, height: number) {
  const p = clip.properties, unit = height / 1080;
  const size = Number(p.fontSize ?? 42) * unit;
  context.save();
  context.font = `400 ${size}px system-ui`;
  context.textAlign = "center";
  context.textBaseline = "bottom";
  const maxWidth = width * .9;
  const lines: string[] = [];
  for (const paragraph of String(p.text ?? clip.name).split("\n")) {
    let line = "";
    for (const word of paragraph.split(/(\s+)/)) {
      if (line && context.measureText(line + word).width > maxWidth) { lines.push(line.trimEnd()); line = ""; }
      if (!line && !word.trim()) continue;
      for (const char of word) {
        if (line && context.measureText(line + char).width > maxWidth) { lines.push(line.trimEnd()); line = ""; }
        line += char;
      }
    }
    lines.push(line);
  }
  const lineHeight = size * 1.2;
  const bottom = height - Number(p.margin ?? 54) * unit;
  const top = bottom - lines.length * lineHeight;
  context.translate(width / 2 + Number(p.x ?? 0) * unit, height / 2 + Number(p.y ?? 0) * unit);
  context.rotate(Number(p.rotation ?? 0) * Math.PI / 180);
  context.scale(Number(p.scale ?? 1), Number(p.scale ?? 1));
  context.translate(-width / 2, -height / 2);
  if (p.background && p.background !== "transparent") {
    context.fillStyle = String(p.background);
    const boxWidth = Math.min(width, Math.max(...lines.map(line => context.measureText(line).width)) + 24 * unit);
    context.fillRect((width - boxWidth) / 2, top - 8 * unit, boxWidth, lines.length * lineHeight + 16 * unit);
  }
  context.lineJoin = "round";
  context.strokeStyle = "#000000";
  context.lineWidth = Number(p.outline ?? 2) * 2 * unit;
  context.fillStyle = String(p.color ?? "#ffffff");
  lines.forEach((line, index) => {
    const y = top + (index + 1) * lineHeight;
    if (context.lineWidth > 0 && Number(p.outline ?? 2) > 0) context.strokeText(line, width / 2, y);
    context.fillText(line, width / 2, y);
  });
  context.restore();
}
