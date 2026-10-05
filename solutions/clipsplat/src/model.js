const PRESETS = { reel: { label: "Reel", width: 1080, height: 1920, max: 180 }, story: { label: "Story", width: 1080, height: 1920, max: 60 }, feed: { label: "Feed portrait", width: 1080, height: 1350, max: 180 } };
function timeline(duration, start, end, intro, outro, preset, cuts = [], cards = []) {
  const values = [duration, start, end, intro, outro];
  if (values.some((v) => !Number.isFinite(v))) throw new Error("Enter valid times.");
  if (start < 0 || end > duration + 0.05 || end <= start) throw new Error("The end time must follow the start and stay within your video.");
  if (intro < 0 || outro < 0 || intro > 10 || outro > 10) throw new Error("Title panels must last between 0 and 10 seconds.");
  const segments = retainedSegments(duration, start, end, cuts);
  const clipDuration = segments.reduce((sum, part) => sum + part.end - part.start, 0);
  if (clipDuration < 1 / 30) throw new Error("Keep at least one frame of video.");
  if (cards.some(card => !Number.isFinite(card.seconds) || card.seconds < 0 || card.seconds > 10 || !Number.isFinite(card.at))) throw new Error("Image cards must last between 0 and 10 seconds.");
  const cardDuration = cards.reduce((sum, card) => sum + card.seconds, 0);
  const total = clipDuration + intro + outro + cardDuration;
  const sequence = composeSequence(segments, cards);
  if (total < 3) throw new Error("Use at least 3 seconds including title panels.");
  if (total > PRESETS[preset].max + 0.01) throw new Error(`This preset allows ${PRESETS[preset].max} seconds including panels. Shorten the clip or panels.`);
  return { start, end, intro, outro, total, segments, clipDuration, cardDuration, sequence };
}
// Cuts use original source times; selection and scrubbing use the remaining video.
function retainedSegments(duration, start, end, cuts = []) {
  if (![duration, start, end].every(Number.isFinite) || start < 0 || end > duration + .05 || end <= start) return [];
  let segments = [{ start, end }];
  for (const cut of cuts) {
    segments = segments.flatMap(part => {
      if (cut.end <= part.start || cut.start >= part.end) return [part];
      const remaining = [];
      if (cut.start > part.start) remaining.push({start: part.start, end: cut.start});
      if (cut.end < part.end) remaining.push({start: cut.end, end: part.end});
      return remaining;
    });
  }
  return segments.filter(part => part.end - part.start >= 1 / 30 - .00001);
}
function sourceTimeAt(segments, time) {
  let offset = Math.max(0, time);
  for (const part of segments) {
    const length = part.end - part.start;
    if (offset < length) return part.start + offset;
    offset -= length;
  }
  return segments.at(-1)?.end ?? 0;
}
function editedTimeAt(segments, sourceTime) {
  let time = 0;
  for (const part of segments) {
    if (sourceTime < part.end) return time + Math.max(0, sourceTime - part.start);
    time += part.end - part.start;
  }
  return time;
}
function selectionCuts(segments, start, end) {
  const total = segments.reduce((sum, part) => sum + part.end - part.start, 0);
  if (![start, end].every(Number.isFinite) || start < 0 || end > total + .001 || end - start < .1) throw new Error("Select at least 0.1 seconds to delete.");
  let offset = 0;
  const cuts = [];
  for (const part of segments) {
    const length = part.end - part.start;
    const from = Math.max(start, offset), to = Math.min(end, offset + length);
    if (to > from) cuts.push({start: part.start + from - offset, end: part.start + to - offset});
    offset += length;
  }
  return cuts;
}
// Image anchors use original video times, so earlier cuts move them with the footage.
function composeSequence(segments, cards = []) {
  const length = segments.reduce((sum, part) => sum + part.end - part.start, 0);
  const placements = cards.filter(card => card.seconds > 0).map((card, index) => {
    let at = Math.max(0, Math.min(length, editedTimeAt(segments, card.at)));
    let offset = 0;
    for (const part of segments) {
      const span = part.end - part.start;
      if (at <= offset + span) {
        const local = at - offset;
        const snapped = Math.round(local * 30) / 30;
        at = offset + (local < 1 / 30 ? 0 : span - local < 1 / 30 ? span : Math.min(span, snapped));
        if (offset + span - at < 1 / 30) at = offset + span;
        break;
      }
      offset += span;
    }
    return {card, index, at};
  }).sort((a,b) => a.at - b.at || a.index - b.index);
  const sequence = [];
  let offset = 0, cursor = 0;
  for (const part of segments) {
    const span = part.end - part.start;
    let start = part.start;
    while (cursor < placements.length && placements[cursor].at <= offset + span + .00001) {
      const placement = placements[cursor++];
      const end = Math.max(start, Math.min(part.end, part.start + placement.at - offset));
      if (end - start > .00001) sequence.push({kind:'video', start, end});
      sequence.push({kind:'card', id:placement.card.id, seconds:placement.card.seconds, at:placement.at});
      start = end;
    }
    if (part.end - start > .00001) sequence.push({kind:'video', start, end:part.end});
    offset += span;
  }
  return sequence;
}
function videoFilter(width, height, fit) {
  return fit === "crop" ? `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1,fps=30,format=yuv420p` : `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=0x4720a4,setsar=1,fps=30,format=yuv420p`;
}
export {
  PRESETS,
  timeline,
  videoFilter,
  retainedSegments, sourceTimeAt, editedTimeAt, selectionCuts, composeSequence
};
