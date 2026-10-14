// Original SplatWorks design systems. No StockLayouts artwork, files, or copy is used.
import { newPublication, uid, frame, shape, textStyle, validatePublication } from './engine.mjs';
import { LABEL_STOCKS, labelPublication, labelDescription } from './label-stocks.mjs';
import { MENU_DESIGNS, RESTAURANT_MENUS, menuPublication } from './menu-designs.mjs';
import { addBrandMark } from './brand-mark.mjs';
export const CATALOG_TYPES = ['flyer', 'brochure', 'newsletter', 'business-card', 'catalog', 'greeting-card', 'labels', 'postcard', 'poster', 'letterhead', 'rack-card', 'datasheet', 'menu', 'invitation', 'certificate'];
export const SECTORS = [
  ['education', 'Education & training', 'Learning opens doors', 'Explore programs, meet the people behind them, and find your next opportunity to learn.', ['Programs for every learner', 'Family connections', 'Student projects'], '#285a89', '#18344e', '#e9f1f8'],
  ['community', 'Community & civic', 'Good things happen together', 'Meet your neighbors, share an idea, and take part in the work that makes our community stronger.', ['Neighborhood events', 'Volunteer opportunities', 'Community resources'], '#7c3aed', '#34205c', '#ede7fb'],
  ['nonprofit', 'Nonprofit & causes', 'Small actions. Lasting change.', 'Connect with a cause, discover ways to contribute, and see what a shared purpose can make possible.', ['Our mission', 'Ways to participate', 'Stories of impact'], '#176c66', '#173f3b', '#e7f3ee'],
  ['technology', 'Technology & innovation', 'Build what comes next', 'Discover practical ideas, useful tools, and people who turn thoughtful questions into new possibilities.', ['Useful solutions', 'Creative projects', 'People and ideas'], '#2b6288', '#15354b', '#e7f2f8'],
  ['professional', 'Professional services', 'A clearer path forward', 'Learn about our approach, meet our team, and start a conversation about the work you want to accomplish.', ['Our approach', 'Services and support', 'Working together'], '#4d556e', '#232c45', '#eef0f5'],
  ['real-estate', 'Real estate & property', 'Find your place', 'Explore available spaces, compare the details that matter, and imagine the possibilities of a new place.', ['Featured spaces', 'Neighborhood highlights', 'Viewing information'], '#366954', '#183d30', '#e9f2ea'],
  ['wellness', 'Health & wellness', 'Make space for well-being', 'Meet our team, explore available programs, and find clear information about scheduling and community support.', ['Our team', 'Programs and appointments', 'Community support'], '#247581', '#1a4650', '#e8f4f4'],
  ['food', 'Food & restaurants', 'A seat at our table', 'Discover seasonal choices, familiar favorites, and the care that goes into every gathering around the table.', ['Seasonal selections', 'House favorites', 'Gatherings and events'], '#9a4f31', '#4d2e24', '#fbefe3'],
  ['retail', 'Retail & shops', 'Discover your next favorite', 'Browse a thoughtful collection, discover the details behind each item, and find something that feels right for you.', ['New arrivals', 'Featured collection', 'Visit the shop'], '#895274', '#412b3b', '#f5eaf1'],
  ['arts', 'Arts & culture', 'Make room for imagination', 'Step into a world of making, performing, and sharing stories. Discover work that invites a fresh perspective.', ['Exhibitions and events', 'Meet the artists', 'Workshops and making'], '#913f64', '#4a2437', '#f9eaf0'],
  ['travel', 'Travel & hospitality', 'A new view awaits', 'Discover places to explore, experiences to remember, and thoughtful details that make a visit feel welcoming.', ['Places to discover', 'Local experiences', 'Plan your visit'], '#256f77', '#17424a', '#e8f3f1'],
  ['sports', 'Sports & recreation', 'Move. Connect. Belong.', 'Find a program, join a team, or explore a new activity. There is room to build confidence and enjoy the journey.', ['Teams and activities', 'Programs and schedules', 'Community events'], '#386645', '#1c3e27', '#edf4e9'],
  ['environment', 'Environment & sustainability', 'Care for the places we share', 'Explore local projects, learn about community initiatives, and find practical ways to take part.', ['Local projects', 'Learning and awareness', 'Ways to participate'], '#487046', '#243d27', '#eff4e7'],
  ['construction', 'Construction & trades', 'Thoughtful work. Solid foundations.', 'Explore our work, learn about the process, and talk with the people who bring each project together.', ['Our work', 'Planning and process', 'Meet the team'], '#81593b', '#403327', '#f5ede3'],
  ['finance', 'Financial & business', 'Plan for what matters', 'Meet our team and learn about available services. Start with clear questions and a conversation about your goals.', ['Services overview', 'Our approach', 'Get in touch'], '#3c5976', '#26384d', '#eaf0f7'],
  ['library', 'Libraries & literacy', 'Your next chapter starts here', 'Discover a book, join a conversation, and explore resources that help our community read, learn, and create.', ['Books and resources', 'Programs for all ages', 'Community stories'], '#755a8f', '#3c2d50', '#f0eaf8'],
  ['celebration', 'Events & celebrations', 'An occasion worth sharing', 'Bring people together for a memorable occasion. Share the details, welcome your guests, and make it your own.', ['Event details', 'Guest information', 'A warm welcome'], '#a04f63', '#522d39', '#faebed'],
  ['manufacturing', 'Manufacturing & engineering', 'Ideas made tangible', 'Explore our capabilities, learn how we work, and discover the people and processes behind every project.', ['Capabilities', 'Process and quality', 'Project highlights'], '#4b6978', '#263e4b', '#eaf1f4'],
].map(([id, name, headline, overview, topics, accent, ink, pale], index) => ({ id, name, headline, overview, topics, accent, ink, pale, index }));
const CARD_NAMES = ['Classic horizontal','Bold color band','Logo & contact columns','Centered logo','Color block sidebar','Elegant framed card'];
const COLOR_NAMES = ['Harbor blue','SplatWorks purple','Evergreen teal','Ocean blue','Slate','Forest green','Fresh teal','Warm terracotta','Plum','Rose','Coastal teal','Field green','Olive','Copper','Navy','Lavender','Berry','Steel blue'];
const DESIGN_NAMES = { brochure: 'Two-sided tri-fold with photo panels', newsletter: 'Two-page editorial with linked columns', catalog: 'Photo grid product catalog', 'greeting-card': 'Center-fold greeting with photo cover', postcard: 'Two-sided photo postcard', poster: 'Large photo poster', letterhead: 'Logo letterhead with contact header', 'rack-card': 'Two-sided tall photo rack card', datasheet: 'Photo & specifications sheet', invitation: 'Framed event invitation', certificate: 'Decorative recognition certificate' };
export const TEMPLATE_CATALOG = [
  ...SECTORS.flatMap(sector => CATALOG_TYPES.filter(type => type !== 'labels').map(type => {
    const index = CATALOG_TYPES.indexOf(type), variant = (sector.index + index) % 6, menu = MENU_DESIGNS[sector.index % MENU_DESIGNS.length];
    const designName = `${type === 'business-card' ? CARD_NAMES[variant] : type === 'menu' ? menu.name : type === 'flyer' ? variant === 1 ? 'Side panel photo flyer' : variant === 5 ? 'Full-width photo flyer' : 'Headline & photo flyer' : DESIGN_NAMES[type]} · ${COLOR_NAMES[sector.index]}`;
    return { id: `${sector.id}-${type}`, type, sector: sector.id, designName, name: designName, variant, ...(type === 'menu' ? {menuDesign:menu.id} : {}), orientation: ['brochure', 'greeting-card', 'business-card', 'postcard', 'certificate'].includes(type) || type === 'menu' && ['pizza','buffet'].includes(menu.id) ? 'landscape' : 'portrait' };
  })),
  ...RESTAURANT_MENUS,
  ...LABEL_STOCKS.map(stock => ({id:`avery-${stock.id}`,type:'labels',sector:'labels',stock:stock.id,name:`Avery ${stock.codes.slice(0,2).join(' / ')}`,designName:`Avery ${stock.codes.slice(0,2).join(' / ')}`,description:labelDescription(stock),searchCodes:stock.codes.join(' '),orientation:stock.geometry[8]>stock.geometry[9]?'landscape':'portrait',variant:0})),
];
const editions = {
  en: ['Discover the possibilities', 'Share the details that help your reader take the next step. Replace this text with your own story, dates, services, and contact information.', 'Learn more', 'Your organization', 'You are invited', 'Thank you for being part of our story', 'Made with care', 'Certificate of recognition', 'Presented to', 'In appreciation of your contribution', 'Featured collection', 'Contact us'],
  es: ['Descubre las posibilidades', 'Comparte los detalles que ayudan al lector a dar el siguiente paso. Añade tu historia, fechas, servicios y contacto.', 'Más información', 'Tu organización', 'Te invitamos', 'Gracias por ser parte de nuestra historia', 'Hecho con cariño', 'Certificado de reconocimiento', 'Se otorga a', 'En agradecimiento por tu contribución', 'Colección destacada', 'Contáctanos'],
  vi: ['Khám phá những khả năng', 'Chia sẻ chi tiết giúp người đọc thực hiện bước tiếp theo. Thêm câu chuyện, ngày giờ, dịch vụ và thông tin liên hệ.', 'Tìm hiểu thêm', 'Tổ chức của bạn', 'Trân trọng mời bạn', 'Cảm ơn bạn đã là một phần câu chuyện', 'Làm bằng sự quan tâm', 'Chứng nhận ghi nhận', 'Trao tặng', 'Trân trọng đóng góp của bạn', 'Bộ sưu tập nổi bật', 'Liên hệ'],
  ar: ['اكتشف الإمكانات', 'شارك التفاصيل التي تساعد القارئ على اتخاذ الخطوة التالية. أضف قصتك والمواعيد والخدمات ومعلومات الاتصال.', 'اعرف المزيد', 'مؤسستك', 'أنت مدعو', 'شكراً لكونك جزءاً من قصتنا', 'صُنع بعناية', 'شهادة تقدير', 'تُقدّم إلى', 'تقديراً لمساهمتك', 'المجموعة المميزة', 'اتصل بنا'],
  zh: ['发现更多可能', '分享帮助读者迈出下一步的详情。请添加自己的故事、日期、服务和联系信息。', '了解更多', '您的组织', '诚邀您参加', '感谢您成为我们故事的一部分', '用心制作', '表彰证书', '颁发给', '感谢您的贡献', '精选系列', '联系我们'],
  uh: ['संभावनाएँ खोजें', 'पाठक को अगला कदम लेने में मदद करने वाली जानकारी दें। अपनी कहानी, तारीखें, सेवाएँ और संपर्क जोड़ें।', 'और जानें', 'आपका संगठन', 'आप आमंत्रित हैं', 'हमारी कहानी का हिस्सा बनने के लिए धन्यवाद', 'ध्यान से बनाया गया', 'सम्मान प्रमाणपत्र', 'प्रदान किया जाता है', 'आपके योगदान के लिए आभार', 'विशेष संग्रह', 'संपर्क करें'],
};
export function catalogPublication(id, { theme, language = 'en' } = {}) {
  const entry = TEMPLATE_CATALOG.find(item => item.id === id); if (!entry) throw Error('Unknown template.');
  if(entry.stock)return labelPublication(entry.stock,{language});
  const sector = SECTORS.find(s => s.id === entry.sector); if(entry.type==='menu')return menuPublication(entry,{language,theme,sector});
  const words = editions[language] || editions.en, rtl = language === 'ar', translated = language !== 'en', palette = theme || sector;
  const d = newPublication(true); d.pages = []; d.title = entry.name; d.templateId = id; d.publicationType = entry.type; d.language = language; d.brand = { ...palette }; d.bleed = 9; d.safeArea = 12; d.masters = []; d.styles = { heading: { size: 28, weight: 'bold', color: palette.ink }, body: { size: 12, color: palette.ink } };
  const headline = translated ? words[0] : sector.headline, overview = translated ? words[1] : sector.overview, topics = translated ? [words[0], words[2], words[11]] : sector.topics, website = `${sector.id}.example`, variant = entry.variant;
  const page = () => { const p = { id: uid(), objects: [] }; d.pages.push(p); return p; };
  const text = (p, content, x, y, w, h, size = 12, options = {}) => { const key = uid(), f = frame(key, x, y, w, h); f.padding = 0; d.stories[key] = { text: content, frames: [f.id], marks: [], style: { ...textStyle(), size, color: palette.ink, lineHeight: 1.3, font: variant === 4 ? 'Georgia' : 'Arial', direction: rtl ? 'rtl' : 'ltr', align: rtl ? 'right' : 'left', ...options } }; p.objects.push(f); return f; };
  const box = (p, x, y, w, h, fill = palette.accent, kind = 'rect') => { const o = shape(x, y, Math.max(6, w), Math.max(6, h), fill, kind); p.objects.push(o); return o; };
  const picture = (p, x, y, w, h) => { const key = uid(); d.assets[key] = { name: `${sector.name} picture placeholder`, alt: 'Decorative community illustration; replace with your own picture.', width: 1080, height: 420, src: 'sample-art.svg', sample: true }; const o = { id: uid(), type: 'image', assetId: key, x, y, w, h, rotation: 0, fit: 'cover', locked: false }; p.objects.push(o); return o; };
  const heading = (p, label = headline, y = 64, size = 34) => text(p, label, d.margin, y, d.width - 2 * d.margin, size * 3, size, { weight: 'bold', lineHeight: 1.08 });
  const footer = p => {addBrandMark(d,p,d.margin,d.height-d.margin-22,18);text(p, `${words[11]} · ${website}`, d.margin+24, d.height - d.margin - 22, d.width - 2 * d.margin-24, 22, 10, { color: palette.accent });};
  let p;
  switch (entry.type) {
    case 'flyer': case 'poster': {
      if (entry.type === 'poster') { d.width = 864; d.height = 1296; d.margin = 48; }
      p = page(); const scale = d.width / 612, w = d.width - 2 * d.margin;
      if (variant === 1) { box(p, 0, 0, d.width * .22, d.height, palette.pale); box(p, 0, 0, 8, d.height); const x = d.width * .28, tw = d.width - x - d.margin; text(p, words[3], x, 42 * scale, tw, 35 * scale, 12 * scale, { color: palette.accent }); text(p, headline, x, 110 * scale, tw, 170 * scale, 36 * scale, { weight: 'bold', lineHeight: 1.12 }); picture(p, x, 304 * scale, tw, 190 * scale); text(p, overview, x, 528 * scale, tw, 105 * scale, 15 * scale); text(p, `{{Date}} · {{Time}}\n{{Location}}`, x, 659 * scale, tw, 72 * scale, 14 * scale); }
      else { box(p, 0, 0, d.width, (variant === 5 ? 450 : 250) * scale, palette.pale); if (variant === 5) picture(p, 0, 0, d.width, 370 * scale); const hy = variant === 5 ? 415 : 95; text(p, words[3], d.margin, (variant === 5 ? 380 : 48) * scale, w, 30 * scale, 12 * scale, { color: palette.accent }); text(p, headline, d.margin, hy * scale, w, 138 * scale, 39 * scale, { weight: 'bold', lineHeight: 1.1 }); if (variant !== 5) picture(p, d.margin, 280 * scale, w, 205 * scale); text(p, overview, d.margin, (variant === 5 ? 580 : 514) * scale, w, 95 * scale, 16 * scale); if (variant !== 5) text(p, `{{Date}} · {{Time}}\n{{Location}}`, d.margin, 626 * scale, w, 67 * scale, 16 * scale); }
      box(p, d.margin, d.height - d.margin - 64 * scale, w, 48 * scale); text(p, `${words[2]} · ${website}`, d.margin + 12 * scale, d.height - d.margin - 51 * scale, w - 24 * scale, 32 * scale, 14 * scale, { color: '#ffffff', weight: 'bold' }); break;
    }
    case 'brochure': {
      d.width = 792; d.height = 612; d.margin = 24; d.guides.columns = 3; d.guides.gap = 24; d.foldGuides = [264, 528]; d.foldInstructions = 'Tri-fold. Outside: contact/back, fold-in, cover. Inside: three reading panels. Test duplex orientation and folds at actual size.';
      for (let side = 0; side < 2; side++) { p = page(); for (let col = 0; col < 3; col++) { const x = 24 + col * 264; box(p, x, 30, 216, 6); text(p, side ? topics[col] : col === 2 ? headline : col === 0 ? words[11] : topics[1], x, 56, 216, 95, 25, { weight: 'bold', lineHeight: 1.12 }); picture(p, x, 173, 216, 108); text(p, `${overview}\n\n${words[1]}`, x, 308, 216, 212, 12); text(p, website, x, 550, 216, 26, 10, { color: palette.accent }); } } break;
    }
    case 'newsletter': {
      p = page(); box(p, 36, 36, 540, 6); heading(p, translated ? words[3] : `${sector.name}\nThe shared edition`, 63, 29); picture(p, 36, 190, 540, 180); text(p, topics[0], 36, 394, 540, 35, 21, { weight: 'bold' }); const story = text(p, `${overview}\n\n${words[1]}\n\n${overview}\n\n${words[1]}\n\n${overview}`, 36, 454, 261, 260, 12); text(p, `${topics[1]}\n\n${overview}`, 315, 454, 261, 230, 13); footer(p);
      p = page(); box(p, 36, 36, 540, 6); heading(p, topics[2], 64, 25); for (const x of [36, 315]) { const f = frame(story.storyId, x, 156, 261, 552); f.padding = 0; p.objects.push(f); d.stories[story.storyId].frames.push(f.id); } footer(p); break;
    }
    case 'business-card': {
      d.width = 252; d.height = 144; d.margin = 12; d.guides.columns = 1; p = page();
      if(variant===0){addBrandMark(d,p,20,16,32);text(p,'SplatWorks',60,22,172,25,13,{weight:'bold'});text(p,'{{Name}}',20,62,212,28,19,{weight:'bold'});text(p,'{{Role}}',20,91,212,17,9,{color:palette.accent});text(p,'{{Email}} · {{Phone}}',20,118,212,18,8);}
      if(variant===1){box(p,0,0,252,46,palette.pale);addBrandMark(d,p,16,7,32);text(p,'SplatWorks',57,16,179,24,13,{weight:'bold'});text(p,'{{Name}}',16,60,220,29,19,{weight:'bold'});text(p,'{{Role}}',16,93,220,17,9,{color:palette.accent});text(p,'{{Email}} · {{Phone}}',16,120,220,16,8);}
      if(variant===2){addBrandMark(d,p,20,32,54);text(p,'SplatWorks',12,93,80,22,10,{align:'center',weight:'bold'});box(p,102,16,2,112,palette.pale);text(p,'{{Name}}',120,22,116,44,17,{weight:'bold'});text(p,'{{Role}}',120,70,116,18,9,{color:palette.accent});text(p,'{{Email}}\n{{Phone}}',120,103,116,31,8);}
      if(variant===3){addBrandMark(d,p,107,10,38);text(p,'SplatWorks',16,52,220,22,12,{align:'center',weight:'bold'});text(p,'{{Name}}',16,81,220,26,17,{align:'center',weight:'bold'});text(p,'{{Role}} · {{Phone}}',16,115,220,18,9,{align:'center',color:palette.accent});}
      if(variant===4){box(p,0,0,82,144,palette.pale);addBrandMark(d,p,15,35,52);text(p,'SplatWorks',8,96,66,30,9,{align:'center'});text(p,'{{Name}}',99,19,137,43,18,{weight:'bold'});text(p,'{{Role}}',99,73,137,20,9,{color:palette.accent});text(p,'{{Email}}\n{{Phone}}',99,105,137,29,8);}
      if(variant===5){const border=box(p,6,6,240,132,palette.accent,'border');border.opacity=.65;addBrandMark(d,p,107,17,38);text(p,'{{Name}}',24,65,204,28,19,{weight:'bold',align:'center'});text(p,'{{Role}}',24,97,204,18,9,{align:'center',color:palette.accent});text(p,'{{Email}} · {{Phone}}',24,120,204,15,8,{align:'center'});}
      p=page();box(p,0,0,252,144,palette.pale);addBrandMark(d,p,103,13,46);text(p,'SplatWorks',20,72,212,30,20,{weight:'bold',align:'center'});text(p,website,20,116,212,18,9,{align:'center',color:palette.accent});d.templateDescription='3.5 × 2 in · two-sided · replaceable SplatWorks logo';break;
    }
    case 'catalog': {
      for (let side = 0; side < 2; side++) { p = page(); box(p, 36, 36, 540, 6); heading(p, words[10], 65, 29); for (let row = 0; row < 3; row++) for (let col = 0; col < 2; col++) { const x = 36 + col * 279, y = 151 + row * 185, n = side * 6 + row * 2 + col + 1; picture(p, x, y, 261, 83); text(p, `${topics[(n - 1) % 3]} ${n}`, x, y + 96, 261, 32, 16, { weight: 'bold' }); text(p, `${words[1]}\n{{Price}}`, x, y + 135, 261, 40, 9); } footer(p); } break;
    }
    case 'greeting-card': {
      d.width = 720; d.height = 504; d.margin = 24; d.guides.columns = 2; d.foldGuides = [360]; d.foldInstructions = 'Center fold; front cover on the right of the outside spread. Test duplex orientation.'; p = page(); box(p, 360, 0, 360, 504, palette.pale); picture(p, 390, 48, 300, 125); text(p, words[5], 390, 215, 300, 170, 29, { weight: 'bold', align: 'center' }); text(p, words[6], 24, 445, 312, 30, 10, { align: 'center', color: palette.accent }); p = page(); text(p, `${words[5]}\n\n{{Message}}`, 396, 137, 288, 230, 22, { align: 'center' }); break;
    }
    case 'postcard': {
      d.width = 432; d.height = 288; d.margin = 18; d.guides.columns = 1; p = page(); picture(p, 0, 0, 432, 137); text(p, headline, 18, 158, 396, 76, 27, { weight: 'bold', lineHeight: 1.1 }); footer(p); p = page(); text(p, overview, 18, 25, 190, 163, 12); box(p, 220, 18, 1, 244, palette.pale); text(p, '{{Name}}\n{{Address}}\n{{City}}, {{Region}} {{PostalCode}}', 238, 109, 176, 120, 11); text(p, website, 18, 243, 190, 26, 9, { color: palette.accent }); break;
    }
    case 'letterhead': {
      p = page(); box(p, 36, 36, 540, 5); text(p, words[3], 36, 63, 360, 50, 23, { weight: 'bold' }); text(p, `${website}\n{{Phone}}`, 408, 63, 168, 44, 9, { color: palette.accent }); text(p, `{{Date}}\n\n{{Name}}\n\n${words[1]}\n\n${overview}\n\n{{Signature}}`, 36, 181, 540, 470, 12); footer(p); break;
    }
    case 'rack-card': {
      d.width = 288; d.height = 648; d.margin = 18; d.guides.columns = 1; for (let side = 0; side < 2; side++) { p = page(); box(p, 0, 0, 288, 80, palette.pale); text(p, words[3], 18, 27, 252, 36, 14, { color: palette.accent, weight: 'bold' }); text(p, side ? topics[1] : headline, 18, 108, 252, 119, 29, { weight: 'bold', lineHeight: 1.12 }); picture(p, 18, 248, 252, 148); text(p, `${overview}\n\n${words[1]}`, 18, 423, 252, 150, 12); footer(p); } break;
    }
    case 'datasheet': {
      p = page(); box(p, 36, 36, 540, 6); heading(p, topics[0], 64, 30); picture(p, 36, 184, 261, 183); text(p, overview, 315, 184, 261, 183, 14); text(p, topics[1], 36, 400, 540, 39, 22, { weight: 'bold' }); p.objects.push({ id: uid(), type: 'table', x: 36, y: 460, w: 540, h: 197, rotation: 0, locked: false, header: true, fontSize: 11, cells: [['Item', 'Details'], ...topics.map(label => [label, words[1].slice(0, 55)])] }); footer(p); break;
    }
    case 'invitation': {
      d.width = 360; d.height = 504; d.margin = 24; d.guides.columns = 1; p = page(); box(p, 0, 0, 360, 504, palette.pale); box(p, 16, 16, 328, 472, '#ffffff'); text(p, words[4], 36, 52, 288, 70, 28, { align: 'center', weight: 'bold' }); text(p, headline, 36, 155, 288, 116, 26, { align: 'center', lineHeight: 1.12 }); text(p, '{{Date}} · {{Time}}\n{{Location}}\n\n{{RSVP}}', 36, 311, 288, 112, 14, { align: 'center' }); text(p, website, 36, 447, 288, 26, 10, { align: 'center', color: palette.accent }); break;
    }
    case 'certificate': {
      d.width = 792; d.height = 612; d.margin = 36; d.guides.columns = 1; p = page(); box(p, 16, 16, 760, 580, palette.pale); box(p, 30, 30, 732, 552, '#ffffff'); box(p, 36, 36, 720, 540, palette.accent, 'border'); text(p, words[7], 92, 92, 608, 89, 32, { weight: 'bold', align: 'center' }); text(p, words[8], 92, 205, 608, 36, 16, { align: 'center' }); const recipient = text(p, '{{Name}}', 92, 267, 608, 82, 39, { weight: 'bold', align: 'center' }); d.stories[recipient.storyId].style.autoFit = 'shrink'; d.stories[recipient.storyId].style.minSize = 18; text(p, words[9], 92, 377, 608, 53, 17, { align: 'center' }); text(p, '{{Date}}', 112, 471, 240, 32, 12, { align: 'center' }); text(p, '{{Signature}}', 440, 471, 240, 32, 12, { align: 'center' }); break;
    }
  }
  // Publications without a footer receive a small brand mark in unused space.
  if(!Object.values(d.assets).some(a=>a.brandExample)) for(const p of d.pages) addBrandMark(d,p,entry.type==='certificate'?54:Math.max(12,d.width-d.margin-24),entry.type==='certificate'?52:8,18);
  return validatePublication(d);
}
