import { clone, uid, validatePublication } from './engine.mjs';
export function parseDelimited(text, delimiter = ',') {
  if (typeof text !== 'string' || text.length > 20000000) throw Error('Data file is too large.');
  const rows = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') field += '"', i++; else if (!field || quoted) quoted = !quoted; else field += c; }
    else if (c === delimiter && !quoted) row.push(field), field = '';
    else if ((c === '\n' || c === '\r') && !quoted) { if (c === '\r' && text[i + 1] === '\n') i++; row.push(field); if (row.some(Boolean)) rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (quoted) throw Error('Unclosed quoted field.');
  row.push(field); if (row.some(Boolean)) rows.push(row);
  if (rows.length > 10001) throw Error('Use at most 10,000 records.');
  const fields = rows.shift()?.map(value => value.replace(/^\uFEFF/, '').trim()) || [];
  if (!fields.length || fields.some(value => !value || value.length > 200) || new Set(fields).size !== fields.length || fields.length > 100) throw Error('Use unique, nonempty column headings.');
  return { fields, records: rows.map(row => Object.fromEntries(fields.map((name, i) => [name, row[i] || '']))) };
}
export function mergeFields(doc) { return [...new Set(Object.values(doc.stories).flatMap(story => [...story.text.matchAll(/\{\{([^{}]+)\}\}/g)].map(match => match[1].trim())))]; }
export function mergeRows(rows) {
  if (!Array.isArray(rows) || rows.length > 10001 || rows.some(row => !Array.isArray(row) || row.length > 100 || row.some(value => typeof value !== 'string' || value.length > 100000))) throw Error('Use at most 10,000 records and 100 columns.');
  const fields = (rows[0] || []).map(value => value.replace(/^\uFEFF/, '').trim());
  if (!fields.length || fields.some(value => !value || value.length > 200) || new Set(fields).size !== fields.length) throw Error('Use unique, nonempty column headings.');
  return { fields, records: rows.slice(1).filter(row => row.some(value => value !== '')).map(row => Object.fromEntries(fields.map((name, i) => [name, row[i] || '']))) };
}
export function substituteStory(story, record, mapping = {}) {
  const matches = [...story.text.matchAll(/\{\{([^{}]+)\}\}/g)], replacements = matches.map(match => ({ from: match.index, to: match.index + match[0].length, value: record[mapping[match[1].trim()] || match[1].trim()] ?? match[0] }));
  let text = '', old = 0;
  for (const r of replacements) { text += story.text.slice(old, r.from) + String(r.value); old = r.to; } text += story.text.slice(old);
  const position = (offset, end = false) => { let shift = 0; for (const r of replacements) { if (offset <= r.from) break; if (offset < r.to) return r.from + shift + (end ? String(r.value).length : 0); shift += String(r.value).length - (r.to - r.from); } return offset + shift; };
  return { ...clone(story), text, marks: (story.marks || []).map(mark => ({ ...mark, from: position(mark.from), to: position(mark.to, true) })).filter(mark => mark.to > mark.from), ...(story.paragraphs ? { paragraphs: story.paragraphs.map(p => ({ ...p, from: position(p.from), to: position(p.to, true) })).filter(p => p.to >= p.from) } : {}) };
}
export function previewRecord(doc, record, mapping = {}) {
  const copy = clone(doc); for (const [id, story] of Object.entries(copy.stories)) copy.stories[id] = substituteStory(story, record, mapping); return copy;
}
export function generateMerge(doc, records, mapping = {}) {
  if (!records.length || records.length > 10000) throw Error('Choose 1–10,000 records.');
  const result = clone(doc); result.id = uid(); result.title += ' · Merged'; result.pages = []; result.stories = {}; result.masters = [];
  const appendPage = (source, record) => {
    const p = clone(source); p.id = uid(); p.masterId = null; p.masterOverrides = [];
    const master = (doc.masters || []).find(m => m.id === source.masterId);
    const masterObjects = (master?.objects || []).filter(o => !(source.masterOverrides || []).includes(o.id)).map(clone); p._masterCount = masterObjects.length;
    p.objects = [...masterObjects, ...p.objects];
    return p;
  };
  if (doc.labelLayout) {
    const source = doc.pages[0], slots = source.objects.filter(o => o.labelSlot !== undefined).sort((a, b) => a.labelSlot - b.labelSlot);
    if (!slots.length) throw Error('Label template has no slots.');
    const skip = Number.isInteger(doc.labelLayout.startAt) ? doc.labelLayout.startAt : 0; if (skip < 0 || skip >= slots.length) throw Error('First unused label is outside this sheet.');
    if(Math.ceil((records.length+skip)/slots.length)>500)throw Error('Generate at most 500 label sheets per batch.');
    let cursor=0, firstSheet=true;
    while(cursor<records.length) {
      const p = { id: uid(), objects: [], masterId: null, masterOverrides: [] };
      slots.forEach((slot, index) => { if(firstSheet&&index<skip||cursor>=records.length)return;const record=records[cursor++],o = clone(slot); o.id = uid(); const id = uid(); o.storyId = id; result.stories[id] = { ...substituteStory(doc.stories[slot.storyId], record, mapping), frames: [o.id] }; p.objects.push(o); });
      result.pages.push(p);
      firstSheet=false;
    }
    result.labelLayout.startAt=0;
  } else {
    if (doc.pages.length * records.length > 500) throw Error('Generate at most 500 pages per batch.');
    for (const record of records) {
      const storyIds = new Map(), frameIds = new Map(), pages = doc.pages.map(source => appendPage(source, record));
      for (const p of pages) { const masterStories = new Map(); for (let index = 0; index < p.objects.length; index++) { const o = p.objects[index], oldId = o.id; o.id = uid(); o.groupIds = [];
        if (index < p._masterCount && o.type === 'text') { const oldStory = o.storyId; if (!masterStories.has(oldStory)) { const id = uid(); masterStories.set(oldStory, id); result.stories[id] = { ...substituteStory(doc.stories[oldStory], record, mapping), frames: [] }; } o.storyId = masterStories.get(oldStory); result.stories[o.storyId].frames.push(o.id); }
        else { frameIds.set(oldId, o.id); if (o.type === 'text') { const oldStory = o.storyId; if (!storyIds.has(oldStory)) storyIds.set(oldStory, uid()); o.storyId = storyIds.get(oldStory); } }
      } delete p._masterCount; }
      for (const [oldId, id] of storyIds) { const s = substituteStory(doc.stories[oldId], record, mapping); s.frames = s.frames.map(frame => frameIds.get(frame)).filter(Boolean); result.stories[id] = s; }
      result.pages.push(...pages);
    }
  }
  result.mergeInfo = { records: records.length, generatedAt: new Date().toISOString(), fields: mergeFields(doc) };
  // Records are deliberately omitted from the generated publication.
  return validatePublication(result);
}
