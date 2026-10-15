import { xml } from './presentation-model.mjs';
const emu = n => Math.round(n * 12700), hundred = n => Math.round(n * 100);
const rgb = (color = '#000000', opacity = 1) => `<a:srgbClr val="${color.slice(1)}"><a:alpha val="${Math.round(opacity * 100000)}"/></a:srgbClr>`;
const solid = (color, opacity) => `<a:solidFill>${rgb(color, opacity)}</a:solidFill>`;
const transform = (o, tag = 'a:xfrm') => `<${tag} rot="${Math.round((o.rotation || 0) * 60000)}"><a:off x="${emu(o.x)}" y="${emu(o.y)}"/><a:ext cx="${emu(o.w)}" cy="${emu(o.h)}"/></${tag}>`;
const nonvisual = (o, id, kind = 'Sp') => `<p:nv${kind}Pr><p:cNvPr id="${id}" name="${xml(o.name)}" descr="${xml(o.description || '')}"/><p:cNv${kind}Pr${kind === 'Sp' && o.type === 'text' ? ' txBox="1"' : ''}/><p:nvPr/></p:nv${kind}Pr>`;

// Exact native freeform geometry for SVG move/line/Bezier commands. Elliptical
// arc paths fall back to an individual picture instead of a guessed geometry.
export function drawingPath(path, viewBox) {
  if (/[aA]/.test(path)) return null;
  const tokens = path.match(/[MmLlHhVvCcSsQqTtZz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g) || [];
  let at = 0, command, x = 0, y = 0, startX = 0, startY = 0, previous, control;
  const out = [], [vx, vy, w, h] = viewBox;
  const point = (px, py) => `<a:pt x="${Math.round((px - vx) * 1000)}" y="${Math.round((py - vy) * 1000)}"/>`;
  const sizes = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2 };
  while (at < tokens.length) {
    if (/^[a-z]$/i.test(tokens[at])) command = tokens[at++];
    if (!command) return null;
    const code = command.toUpperCase(), relative = command !== code;
    if (code === 'Z') { out.push('<a:close/>'); x = startX; y = startY; previous = code; control = null; command = null; continue; }
    const count = sizes[code]; if (!count || at + count > tokens.length) return null;
    const values = tokens.slice(at, at + count).map(Number); if (values.some(n => !Number.isFinite(n))) return null; at += count;
    const p = i => [values[i] + (relative ? x : 0), values[i + 1] + (relative ? y : 0)];
    let end, nextControl;
    if (code === 'M' || code === 'L') { end = p(0); out.push(`<a:${code === 'M' ? 'moveTo' : 'lnTo'}>${point(...end)}</a:${code === 'M' ? 'moveTo' : 'lnTo'}>`); if (code === 'M') { [startX, startY] = end; command = relative ? 'l' : 'L'; } }
    if (code === 'H' || code === 'V') { end = code === 'H' ? [values[0] + (relative ? x : 0), y] : [x, values[0] + (relative ? y : 0)]; out.push(`<a:lnTo>${point(...end)}</a:lnTo>`); }
    if (code === 'C' || code === 'S') {
      const first = code === 'C' ? p(0) : ['C', 'S'].includes(previous) ? [2 * x - control[0], 2 * y - control[1]] : [x, y];
      nextControl = p(code === 'C' ? 2 : 0); end = p(code === 'C' ? 4 : 2);
      out.push(`<a:cubicBezTo>${point(...first)}${point(...nextControl)}${point(...end)}</a:cubicBezTo>`);
    }
    if (code === 'Q' || code === 'T') {
      nextControl = code === 'Q' ? p(0) : ['Q', 'T'].includes(previous) ? [2 * x - control[0], 2 * y - control[1]] : [x, y]; end = p(code === 'Q' ? 2 : 0);
      out.push(`<a:quadBezTo>${point(...nextControl)}${point(...end)}</a:quadBezTo>`);
    }
    [x, y] = end; control = nextControl; previous = code;
  }
  return `<a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/><a:rect l="0" t="0" r="r" b="b"/><a:pathLst><a:path w="${Math.round(w * 1000)}" h="${Math.round(h * 1000)}">${out.join('')}</a:path></a:pathLst></a:custGeom>`;
}
function runProperties(style, opacity, link, tag = 'a:rPr') {
  return `<${tag} sz="${hundred(style.size)}" b="${style.bold ? 1 : 0}" i="${style.italic ? 1 : 0}" u="${style.underline ? 'sng' : 'none'}" spc="${hundred(style.tracking || 0)}">${solid(style.color, opacity)}<a:latin typeface="${xml(style.font)}"/><a:ea typeface="${xml(style.font)}"/><a:cs typeface="${xml(style.font)}"/>${link ? `<a:hlinkClick r:id="${link}"/>` : ''}</${tag}>`;
}
function textParagraphs(paragraphs, opacity, addLink) {
  return paragraphs.map(p => {
    const spacing = (name, value) => `<a:${name}><a:spcPts val="${hundred(value || 0)}"/></a:${name}>`;
    const props = `<a:pPr algn="${({ center: 'ctr', right: 'r', justify: 'just' })[p.align] || 'l'}" rtl="${p.direction === 'rtl' ? 1 : 0}" marL="${emu(p.indentLeft || 0)}" marR="${emu(p.indentRight || 0)}" indent="${emu(p.firstLineIndent || 0)}"><a:lnSpc>${p.lineMultiple ? `<a:spcPct val="${Math.round(p.lineMultiple * 100000)}"/>` : `<a:spcPts val="${hundred(p.leading || p.style.size * 1.45)}"/>`}</a:lnSpc>${spacing('spcBef', p.spaceBefore)}${spacing('spcAft', p.spaceAfter)}<a:buNone/>${runProperties(p.style, opacity, null, 'a:defRPr')}</a:pPr>`;
    const content = p.runs.map(run => run.text.split('\n').map((part, i) => (i ? `<a:br>${runProperties(run.style, opacity)}</a:br>` : '') + (part ? `<a:r>${runProperties(run.style, opacity, run.style.link ? addLink(run.style.link) : null)}<a:t xml:space="preserve">${xml(part)}</a:t></a:r>` : '')).join('')).join('');
    return `<a:p>${props}${content}${runProperties(p.style, opacity, null, 'a:endParaRPr')}</a:p>`;
  }).join('');
}
const body = content => `<a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="t" vertOverflow="clip" horzOverflow="clip"><a:noAutofit/></a:bodyPr><a:lstStyle/>${content}`;
function fill(o) {
  if (o.noFill || o.kind === 'line') return '<a:noFill/>';
  if (!o.gradient) return solid(o.fill, o.opacity);
  const g = o.gradient;
  return `<a:gradFill rotWithShape="1"><a:gsLst>${g.stops.map(s => `<a:gs pos="${Math.round(s.offset * 100000)}">${rgb(s.color, s.opacity * o.opacity)}</a:gs>`).join('')}</a:gsLst>${g.type === 'radial' ? '<a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path><a:tileRect/>' : `<a:lin ang="${Math.round(((g.angle % 360 + 360) % 360) * 60000)}" scaled="1"/>`}</a:gradFill>`;
}
export function pptxObject(o, id, context) {
  if (o.type === 'text') return `<p:sp>${nonvisual(o, id)}<p:spPr>${transform(o)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody>${body(textParagraphs(o.paragraphs, o.opacity, context.addLink))}</p:txBody></p:sp>`;
  if (o.type === 'image') return `<p:pic>${nonvisual({ ...o, description: o.asset.alt || o.asset.name }, id, 'Pic')}<p:blipFill><a:blip r:embed="${context.imageId}"><a:alphaModFix amt="${Math.round(o.opacity * 100000)}"/></a:blip>${o.crop ? `<a:srcRect l="${Math.round(o.crop.l * 100000)}" t="${Math.round(o.crop.t * 100000)}" r="${Math.round(o.crop.r * 100000)}" b="${Math.round(o.crop.b * 100000)}"/>` : ''}<a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr>${transform(o)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
  if (o.type === 'table') {
    const rows = o.cells.map((row, i) => `<a:tr h="${emu(o.h / o.cells.length)}">${row.map(text => {
      const heading = o.header && i === 0, style = { font: 'Liberation Sans', size: o.fontSize, color: heading ? '#34205c' : '#25304b', bold: heading };
      const p = text.split('\n').map(line => ({ runs: [{ text: line, style }], style, direction: o.direction, align: 'left', lineMultiple: 1.4 }));
      const line = edge => `<a:ln${edge} w="9525">${solid('#b9b1cd', o.opacity)}<a:prstDash val="solid"/></a:ln${edge}>`;
      return `<a:tc><a:txBody>${body(textParagraphs(p, o.opacity, context.addLink))}</a:txBody><a:tcPr marL="76200" marR="76200" marT="76200" marB="76200" anchor="t">${['L', 'R', 'T', 'B'].map(line).join('')}${solid(heading ? '#ede7fb' : '#ffffff', o.opacity)}</a:tcPr></a:tc>`;
    }).join('')}</a:tr>`).join('');
    return `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${id}" name="${xml(o.name)}"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr>${transform(o, 'p:xfrm')}<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr firstRow="${o.header ? 1 : 0}"/><a:tblGrid>${o.cells[0].map(() => `<a:gridCol w="${emu(o.w / o.cells[0].length)}"/>`).join('')}</a:tblGrid>${rows}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;
  }
  let geometry = o.path ? drawingPath(o.path, o.pathViewBox) : `<a:prstGeom prst="${o.kind === 'ellipse' ? 'ellipse' : o.kind === 'line' ? 'line' : 'rect'}"><a:avLst/></a:prstGeom>`;
  if (!geometry) return null;
  const lineWidth = o.kind === 'line' ? Math.max(1, o.strokeWidth) : o.strokeWidth;
  const stroke = `<a:ln w="${emu(lineWidth)}">${lineWidth ? solid(o.stroke, o.opacity) : '<a:noFill/>'}${o.strokeDash ? '<a:prstDash val="dash"/>' : '<a:prstDash val="solid"/>'}</a:ln>`;
  if (o.strokeDash) context.warn('Custom dash patterns use the office application’s native dashed stroke.');
  // LayoutSplat's line lies at mid-height; a zero-height native line avoids a diagonal.
  const box = o.kind === 'line' ? { ...o, y: o.y + o.h / 2, h: 0 } : o;
  return `<p:sp>${nonvisual(o, id)}<p:spPr>${transform(box)}${geometry}${fill(o)}${stroke}</p:spPr></p:sp>`;
}
