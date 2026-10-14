import { newPublication, uid, frame, shape, textStyle } from './engine.mjs';
export const TEMPLATE_TYPES = [
  { id: 'flyer', label: 'Flyers', description: 'Community events, school notices, and announcements.' },
  { id: 'brochure', label: 'Brochures', description: 'Two-sided, three-panel folded publications.' },
  { id: 'newsletter', label: 'Newsletters', description: 'Linked stories and reusable publication branding.' },
  { id: 'business-card', label: 'Business cards', description: 'Contact cards with front and back designs.' },
  { id: 'catalog', label: 'Catalogs', description: 'Product or project listings with pictures and descriptions.' },
  { id: 'greeting-card', label: 'Greeting cards', description: 'Folded cards with an outside and inside spread.' },
  { id: 'labels', label: 'Labels', description: 'Address labels with merge fields and sheet layouts.' },
];
export const THEMES = [
  { id: 'splatworks', name: 'SplatWorks', ink: '#34205c', accent: '#7c3aed', highlight: '#ff9f2f', pale: '#ede7fb' },
  { id: 'garden', name: 'Community garden', ink: '#173c35', accent: '#167363', highlight: '#e3b955', pale: '#e5f1ec' },
  { id: 'ocean', name: 'School blue', ink: '#19324b', accent: '#286f9f', highlight: '#ea9944', pale: '#e9f2f8' },
  { id: 'celebration', name: 'Celebration', ink: '#4c2341', accent: '#a93a79', highlight: '#eca156', pale: '#f9eaf1' },
];
export function makeTemplate(type, themeId = 'splatworks', language = 'en') {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0], d = newPublication(true);
  Object.assign(d, { title: `${TEMPLATE_TYPES.find(t => t.id === type)?.label || 'Publication'} · ${theme.name}`, publicationType: type, brand: { ...theme }, bleed: 9, masters: [], fonts: [], styles: { heading: { size: 28, weight: 'bold', color: theme.ink }, body: { size: 12, color: theme.ink } } });
  const text = (p, words, x, y, w, h, style = {}) => { const storyId = uid(), o = frame(storyId, x, y, w, h); o.padding = 0; d.stories[storyId] = { text: words, style: { ...textStyle(), color: theme.ink, ...style }, frames: [o.id], marks: [] }; p.objects.push(o); return o; };
  const rect = (p, x, y, w, h, color = theme.accent) => p.objects.push(shape(x, y, w, h, color));
  const page = () => { const p = { id: uid(), objects: [], groups: [], masterId: null, masterOverrides: [] }; d.pages.push(p); return p; };
  d.pages = []; let p;
  if (type === 'newsletter') {
    const sample = newPublication(); sample.publicationType = type; sample.brand = { ...theme }; sample.bleed = 9; sample.masters = []; sample.fonts = []; sample.styles = d.styles;
    for (const p of sample.pages) for (const o of p.objects) { if (o.type === 'shape') { o.fill = o.fill === '#ff9f2f' ? theme.highlight : theme.accent; o.stroke = o.fill; } }
    for (const s of Object.values(sample.stories)) { if (s.style.color === '#34205c') s.style.color = theme.ink; if (s.style.color === '#7c3aed') s.style.color = theme.accent; }
    return sample;
  }
  if (type === 'flyer') {
    p = page(); rect(p, 0, 0, d.width, 250, theme.pale); rect(p, 36, 36, 540, 8, theme.highlight);
    text(p, 'YOU ARE INVITED', 36, 64, 540, 28, { size: 12, color: theme.accent, weight: 'bold' });
    text(p, 'An afternoon\nof possibilities', 36, 112, 540, 115, { size: 38, weight: 'bold', lineHeight: 1.1 });
    text(p, 'Our community open house', 36, 284, 540, 45, { size: 23, weight: 'bold' });
    text(p, 'Saturday, October 24 · 1–4 p.m.\nCommunity Center · 120 Main Street', 36, 350, 540, 70, { size: 17 });
    text(p, 'Explore student projects, meet our neighbors, and find a new idea to take home. Everyone is welcome.\n\nBring your curiosity. We will bring the stories.', 36, 453, 540, 160, { size: 16 });
    rect(p, 36, 674, 540, 60); text(p, 'Learn more: your-website.example', 48, 690, 515, 35, { size: 16, color: '#ffffff', weight: 'bold' });
  } else if (type === 'brochure') {
    d.width = 792; d.height = 612; d.margin = 24; d.guides.columns = 3; d.guides.gap = 24; d.foldGuides = [264, 528];
    for (let side = 0; side < 2; side++) {
      p = page(); for (let col = 0; col < 3; col++) {
        const x = col * 264 + 24; rect(p, x, 36, 216, 7, theme.highlight);
        const headings = side ? ['What we offer', 'How to join', 'A place for everyone'] : ['Get in touch', 'Make a difference', 'Discover our community'];
        text(p, headings[col], x, 64, 216, 110, { size: 26, weight: 'bold', lineHeight: 1.1 });
        text(p, side ? 'Share the details that help your reader take the next step.\n\nUse short sections, clear pictures, and a welcoming invitation.\n\nAdd your own examples and contact information.' : 'Tell a story about the people, places, and ideas that make your organization special.\n\nReplace this text with the information your readers need.', x, 196, 216, 285, { size: 13 });
        text(p, 'your-website.example', x, 534, 216, 30, { size: 11, color: theme.accent });
      }
    }
    d.foldInstructions = 'Tri-fold: outside panels are back/contact, fold-in, and front cover from left to right. Inside panels read left to right. Print both spreads at actual size and test duplex orientation before a full run.';
  } else if (type === 'business-card') {
    d.width = 252; d.height = 144; d.margin = 12; d.guides.columns = 1;
    p = page(); rect(p, 0, 0, 8, 144); text(p, '{{Name}}', 22, 20, 210, 35, { size: 20, weight: 'bold' });
    text(p, '{{Role}}', 22, 58, 210, 23, { size: 11, color: theme.accent }); text(p, '{{Email}}\n{{Phone}}', 22, 94, 210, 37, { size: 9 });
    p = page(); rect(p, 0, 0, 252, 144, theme.pale); text(p, 'Your organization', 20, 43, 212, 64, { size: 23, weight: 'bold', align: 'center' });
  } else if (type === 'greeting-card') {
    d.width = 720; d.height = 504; d.margin = 24; d.guides.columns = 2; d.foldGuides = [360];
    p = page(); rect(p, 360, 0, 360, 504, theme.pale); text(p, 'A little kindness\ngoes a long way', 390, 143, 300, 160, { size: 33, weight: 'bold', align: 'center', lineHeight: 1.2 });
    text(p, 'Made with care', 24, 434, 312, 32, { size: 11, align: 'center', color: theme.accent });
    p = page(); text(p, 'Thank you for making\na difference.', 396, 162, 288, 140, { size: 24, align: 'center' });
    d.foldInstructions = 'Fold along the center guide. The front cover is the right panel of the outside spread. Test duplex orientation and folding before printing multiple copies.';
  } else if (type === 'catalog') {
    for (let i = 0; i < 2; i++) {
      p = page(); rect(p, 36, 36, 540, 8, theme.highlight); text(p, i ? 'More to discover' : 'Our project collection', 36, 64, 540, 62, { size: 29, weight: 'bold' });
      for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
        const x = 36 + col * 279, y = 156 + row * 260; rect(p, x, y, 261, 100, theme.pale);
        text(p, `Project ${i * 4 + row * 2 + col + 1}`, x, y + 118, 261, 42, { size: 18, weight: 'bold' });
        text(p, 'Add a picture and describe what makes this project worth exploring.\n\nPrice or reference: {{Price}}', x, y + 163, 261, 84, { size: 11 });
      }
    }
  } else if (type === 'labels') {
    d.margin = 18; d.guides.columns = 3; d.guides.rows = 10; d.guides.gap = 0; p = page();
    for (let row = 0; row < 10; row++) for (let col = 0; col < 3; col++) {
      const o = text(p, '{{Name}}\n{{Address}}\n{{City}}, {{Region}} {{PostalCode}}', 18 + col * 192, 18 + row * 75.6, 180, 65, { size: 10 }); o.labelSlot = row * 3 + col;
    }
    d.labelLayout = { columns: 3, rows: 10, perSheet: 30, instructions: 'Generic 3 × 10 Letter label sheet. Confirm the exact label stock dimensions in Page layout; print a plain-paper alignment test at actual size.' };
  } else throw new Error('Unknown publication template.');
  if (language === 'ar') for (const s of Object.values(d.stories)) { s.style.direction = 'rtl'; s.style.align = 'right'; }
  return d;
}
