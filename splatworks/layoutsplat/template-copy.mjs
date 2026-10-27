// Neutral typesetter's copy belongs to new templates, never to a user's saved work.
export const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
export function loremCopy(characters = 350) {
  const sentences = LOREM.match(/[^.]+\./g); let text = '', i = 0;
  while (text.length < Math.max(60, characters)) {
    const next = sentences[i++ % sentences.length].trim();
    if (text && text.length + next.length > characters) break;
    text += (text ? (i % 4 === 0 ? '\n\n' : ' ') : '') + next;
  }
  return text;
}
export function templateBodyCopy(doc) {
  const objects = doc.pages.flatMap(p => p.objects);
  for (const story of Object.values(doc.stories)) {
    const frames = objects.filter(o => o.storyId && story.frames.includes(o.id));
    if (!frames.length || frames.some(o => o.readingHeading) || /\{\{|\}\}/.test(story.text)) continue;
    const size = story.style.size, body = frames.some(f => f.h >= size * 3.7);
    if (!body || size > 17 || story.text.length < 75) continue;
    const capacity = frames.reduce((sum, f) => sum + Math.max(0, f.w - 2 * (f.padding || 0)) / (size * .53) * Math.max(0, f.h - 2 * (f.padding || 0)) / (size * (story.style.lineHeight || 1.4)), 0);
    story.text = loremCopy(Math.min(12000, Math.floor(capacity * .7)));
    story.marks = []; delete story.paragraphs;
  }
  return doc;
}
