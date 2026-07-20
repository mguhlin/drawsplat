(function () {
  'use strict';

  const STORAGE_KEY = 'showsplat.deck.v1';
  const SLIDE_W = 1600;
  const SLIDE_H = 900;
  // How far objects may sit outside the slide, on the surrounding "holding area".
  const BOARD_MARGIN_X = 560;
  const BOARD_MARGIN_Y = 340;
  const FOOTER_ID = '__showsplat_footer__';
  const themes = {
    violet: { accent: '#7c3aed', accent2: '#ff9f2f', dark: '#1e1b4b', bg: '#ffffff' },
    sky: { accent: '#0284c7', accent2: '#f59e0b', dark: '#0f172a', bg: '#f8fbff' },
    forest: { accent: '#15803d', accent2: '#f97316', dark: '#13251a', bg: '#fbfff8' },
    slate: { accent: '#475569', accent2: '#8b5cf6', dark: '#111827', bg: '#ffffff' }
  };

  const els = {
    canvas: document.getElementById('slideCanvas'),
    thumbs: document.getElementById('thumbnailList'),
    rail: document.querySelector('.slide-rail'),
    railSplitter: document.getElementById('railSplitter'),
    sorter: document.getElementById('slideSorter'),
    stage: document.getElementById('stage'),
    workspace: document.querySelector('.workspace'),
    deckTitle: document.getElementById('deckTitle'),
    status: document.getElementById('statusText'),
    notes: document.getElementById('speakerNotes'),
    selectionInfo: document.getElementById('selectionInfo'),
    arrangePanel: document.getElementById('arrangePanel'),
    fontFamily: document.getElementById('fontFamily'),
    fontSize: document.getElementById('fontSize'),
    textColor: document.getElementById('textColor'),
    fillColor: document.getElementById('fillColor'),
    zoomSlider: document.getElementById('zoomSlider'),
    zoomValue: document.getElementById('zoomValue'),
    altText: document.getElementById('altText'),
    linkUrl: document.getElementById('linkUrl'),
    posX: document.getElementById('posX'),
    posY: document.getElementById('posY'),
    posW: document.getElementById('posW'),
    posH: document.getElementById('posH'),
    templatePickerDialog: document.getElementById('templatePickerDialog'),
    markdownDialog: document.getElementById('markdownDialog'),
    markdownInput: document.getElementById('markdownInput'),
    helpDialog: document.getElementById('helpDialog'),
    shortcutsDialog: document.getElementById('shortcutsDialog'),
    themeDialog: document.getElementById('themeDialog'),
    footerText: document.getElementById('footerText'),
    slideBgColor: document.getElementById('slideBgColor'),
    slideBarColor: document.getElementById('slideBarColor'),
    slideDefaultTextColor: document.getElementById('slideDefaultTextColor'),
    themeAccentColor: document.getElementById('themeAccentColor'),
    themeHighlightColor: document.getElementById('themeHighlightColor'),
    themeDarkColor: document.getElementById('themeDarkColor'),
    themeCanvasColor: document.getElementById('themeCanvasColor'),
    imageFile: document.getElementById('imageFileInput'),
    videoFile: document.getElementById('videoFileInput'),
    audioFile: document.getElementById('audioFileInput'),
    globalAudioFile: document.getElementById('globalAudioFileInput'),
    deckFile: document.getElementById('deckFileInput'),
    csvFile: document.getElementById('csvFileInput')
  };

  let deck = loadDeck();
  let activeSlide = 0;
  let selectedId = null;
  // All selected object ids on the current slide. `selectedId` is the primary
  // (anchor) selection used for the inspector, resize/rotate, and text editing.
  // Invariant: a real object id in `selectedId` is also in `selectedObjectIds`.
  let selectedObjectIds = new Set();
  let viewMode = 'normal';
  let autosaveTimer = null;
  let history = [];
  let historyIndex = -1;
  const HISTORY_LIMIT = 100;
  let cropTargetId = null;
  let zoomLevel = Number(localStorage.getItem('showsplat.zoomLevel') || 50);
  let draggedSlideIndex = null;
  let selectedSlideIds = new Set();
  let lastSlideSelectionIndex = 0;
  const slidePalettes = {
    paper: { bg: '#ffffff', bar: '#312e5f', text: '#1f2937' },
    lavender: { bg: '#f4f1ff', bar: '#5b21b6', text: '#241047' },
    mint: { bg: '#ecfdf5', bar: '#047857', text: '#12372a' },
    sky: { bg: '#eff6ff', bar: '#1d4ed8', text: '#172554' },
    peach: { bg: '#fff7ed', bar: '#c2410c', text: '#431407' },
    charcoal: { bg: '#111827', bar: '#7c3aed', text: '#ffffff' }
  };

  function uid(prefix) {
    return prefix + '-' + Math.random().toString(36).slice(2, 9);
  }

  function defaultDeck() {
    return {
      version: 1,
      title: 'Untitled ShowSplat Deck',
      theme: 'violet',
      footer: 'ShowSplat™ by DrawSplat™',
      globalAudio: null,
      slides: [
        makeTemplateSlide('title'),
        makeTemplateSlide('title-content')
      ]
    };
  }

  function makeTemplateSlide(template) {
    const slide = {
      id: uid('slide'),
      title: 'New Slide',
      notes: '',
      bg: 'light',
      footer: true,
      audio: [],
      elements: []
    };
    if (template === 'title') {
      slide.title = 'ShowSplat™';
      slide.bg = 'section';
      slide.notes = 'I will open by naming the deck and giving the audience a quick sense of what we are going to build or explain. This title slide keeps the focus on the main idea before moving into the details.';
      slide.elements.push(textElement('ShowSplat™', 150, 230, 920, 120, 72, true, '#ffffff'));
      slide.elements.push(textElement('A WebDeck-first presentation workspace', 158, 360, 900, 70, 34, false, '#f5f3ff'));
    } else if (template === 'section') {
      slide.title = 'Section Break';
      slide.bg = 'section';
      slide.elements.push(textElement('Section title', 140, 280, 900, 120, 64, true, '#ffffff'));
      slide.elements.push(textElement('One sentence that frames the next part.', 148, 410, 780, 70, 30, false, '#f5f3ff'));
    } else if (template === 'comparison') {
      slide.title = 'Comparison';
      slide.elements.push(textElement('Compare two options', 90, 82, 900, 92, 46, true));
      slide.elements.push(textElement('Option A\n- Strength\n- Tradeoff\n- Best use', 120, 210, 560, 360, 34));
      slide.elements.push(textElement('Option B\n- Strength\n- Tradeoff\n- Best use', 900, 210, 560, 360, 34));
    } else if (template === 'media') {
      slide.title = 'Media Focus';
      slide.elements.push(textElement('Media title', 90, 82, 820, 92, 46, true));
      slide.elements.push(shapeElement(120, 180, 1120, 560, 'Drop image or video here'));
    } else if (template === 'graph') {
      slide.title = 'Graph or Data Story';
      slide.elements.push(textElement('What the data shows', 90, 82, 860, 92, 46, true));
      slide.elements.push(shapeElement(100, 175, 780, 540, 'Place a graph from GridSplat, Graph Maker, or Chart Studio'));
      slide.elements.push(textElement('Key takeaways\n- Pattern\n- Evidence\n- Why it matters', 950, 210, 480, 330, 32));
    } else if (template === 'concept-map') {
      slide.title = 'Concept Map Explanation';
      slide.elements.push(textElement('How the ideas connect', 90, 82, 900, 92, 46, true));
      slide.elements.push(shapeElement(100, 175, 920, 540, 'Import a Concept Map Studio image here'));
      slide.elements.push(textElement('Explain the relationships and examples here.', 1070, 205, 390, 280, 30));
    } else if (template === 'purple-title') {
      slide.title = 'Purple Title';
      slide.bg = 'section';
      slide.elements.push(textElement('Big idea', 135, 235, 1000, 130, 76, true, '#ffffff'));
      slide.elements.push(textElement('Short supporting line with no scrolling text box.', 145, 380, 900, 78, 34, false, '#f5f3ff'));
    } else if (template === 'purple-steps') {
      slide.title = 'Purple Process';
      slide.bg = 'section';
      slide.elements.push(textElement('Process or sequence', 95, 82, 900, 96, 48, true, '#ffffff'));
      slide.elements.push(textElement('1. Start with the idea\n2. Add evidence\n3. Explain the result', 130, 190, 1020, 360, 42, true, '#ffffff'));
      slide.elements.push(shapeElement(1190, 200, 250, 250, 'Visual'));
      slide.elements[2].color = '#ffffff';
      slide.elements[2].fill = 'rgba(255,255,255,.16)';
    } else if (template === 'quote') {
      slide.title = 'Quote';
      slide.elements.push(textElement('“A short quote or key idea belongs here.”', 150, 240, 1050, 180, 54, true));
      slide.elements.push(textElement('Source or context', 160, 450, 500, 60, 26, false, '#6b7280'));
    } else if (template === 'table') {
      slide.title = 'Table';
      slide.elements.push(textElement('Table title', 90, 82, 820, 92, 46, true));
      slide.elements.push(tableElement(140, 180, 1080, 420));
    } else if (template === 'agenda') {
      slide.title = 'Agenda';
      slide.elements.push(textElement('Today’s agenda', 90, 82, 900, 92, 46, true));
      slide.elements.push(listElement(['Opening idea', 'Key concepts', 'Practice or discussion', 'Next steps'], 135, 200, 980, 430));
    } else if (template === 'two-column') {
      slide.title = 'Two Columns';
      slide.elements.push(textElement('Two-part story', 90, 82, 900, 92, 46, true));
      slide.elements.push(textElement('Left idea\nAdd evidence or examples here.', 110, 210, 620, 390, 32, true));
      slide.elements.push(textElement('Right idea\nAdd evidence or examples here.', 870, 210, 620, 390, 32, true));
    } else if (template === 'three-cards') {
      slide.title = 'Three Cards';
      slide.elements.push(textElement('Three key ideas', 90, 82, 900, 92, 46, true));
      [120, 580, 1040].forEach((x, i) => {
        const card = shapeElement(x, 220, 360, 350, 'Idea ' + (i + 1) + '\nShort explanation');
        card.fill = ['#ede9fe', '#dbeafe', '#dcfce7'][i];
        slide.elements.push(card);
      });
    } else if (template === 'steps') {
      slide.title = 'Numbered Steps';
      slide.elements.push(textElement('A clear process', 90, 82, 900, 92, 46, true));
      slide.elements.push(textElement('1', 130, 220, 100, 100, 58, true, '#7c3aed'));
      slide.elements.push(textElement('Start\nDescribe the first action.', 250, 220, 300, 170, 30, true));
      slide.elements.push(textElement('2', 600, 220, 100, 100, 58, true, '#7c3aed'));
      slide.elements.push(textElement('Build\nDescribe the middle action.', 720, 220, 300, 170, 30, true));
      slide.elements.push(textElement('3', 1070, 220, 100, 100, 58, true, '#7c3aed'));
      slide.elements.push(textElement('Finish\nDescribe the result.', 1190, 220, 300, 170, 30, true));
    } else if (template === 'do-dont') {
      slide.title = 'Do and Do Not';
      slide.elements.push(textElement('Helpful guardrails', 90, 82, 900, 92, 46, true));
      const yes = shapeElement(120, 210, 620, 410, 'DO\n- Recommended action\n- Recommended action\n- Recommended action');
      yes.fill = '#dcfce7'; yes.color = '#14532d';
      const no = shapeElement(860, 210, 620, 410, 'DO NOT\n- Avoid this choice\n- Avoid this choice\n- Avoid this choice');
      no.fill = '#fee2e2'; no.color = '#7f1d1d';
      slide.elements.push(yes, no);
    } else if (template === 'callout') {
      slide.title = 'Key Callout';
      slide.elements.push(textElement('KEY IDEA', 150, 170, 400, 60, 26, true, '#7c3aed'));
      slide.elements.push(textElement('One memorable statement belongs here.', 150, 260, 1200, 240, 62, true));
    } else if (template === 'image-caption') {
      slide.title = 'Image and Caption';
      slide.elements.push(shapeElement(80, 70, 1000, 700, 'Drop an image here'));
      slide.elements.push(textElement('Image headline', 1140, 180, 360, 100, 42, true));
      slide.elements.push(textElement('Use this space for context, a caption, or the key takeaway.', 1140, 310, 350, 260, 28));
    } else if (template === 'reflection') {
      slide.title = 'Reflection Prompt';
      slide.bg = 'section';
      slide.elements.push(textElement('Pause and reflect', 150, 180, 900, 90, 34, true, '#ddd6fe'));
      slide.elements.push(textElement('What will you try next—and why?', 150, 290, 1180, 220, 62, true, '#ffffff'));
    } else if (template === 'resources') {
      slide.title = 'Resources';
      slide.elements.push(textElement('Resources', 90, 82, 820, 92, 46, true));
      slide.elements.push(textElement('- Link or next step\n- Link or next step\n- Link or next step', 130, 190, 850, 260, 34));
    } else if (template === 'certificate') {
      slide.title = 'Certificate';
      slide.bg = 'light';
      slide.backgroundColor = '#fffef7';
      slide.footer = false;
      slide.elements.push(shapeElement(60, 50, 1480, 800, ''));
      slide.elements.push(textElement('Certificate of Achievement', 200, 130, 1200, 110, 58, true, '#5b21b6'));
      slide.elements.push(textElement('This certificate is proudly presented to', 200, 280, 1200, 60, 30, false, '#374151'));
      slide.elements.push(textElement('{{Name}}', 200, 350, 1200, 120, 72, true, '#111827'));
      slide.elements.push(textElement('for {{Award}}', 200, 500, 1200, 70, 36, false, '#374151'));
      slide.elements.push(textElement('Date: {{Date}}', 200, 700, 500, 60, 26, false, '#6b7280'));
      slide.elements.push(textElement('Signed: {{Teacher}}', 900, 700, 500, 60, 26, false, '#6b7280'));
    } else if (template === 'name-tag') {
      slide.title = 'Name Tag';
      slide.bg = 'section';
      slide.footer = false;
      slide.elements.push(textElement('HELLO', 150, 150, 1300, 120, 64, true, '#ffffff'));
      slide.elements.push(textElement('my name is', 150, 300, 1300, 70, 36, false, '#ede9fe'));
      slide.elements.push(textElement('{{Name}}', 150, 400, 1300, 200, 96, true, '#ffffff'));
      slide.elements.push(textElement('{{Class}}', 150, 640, 1300, 80, 40, false, '#ede9fe'));
    } else if (template === 'flyer') {
      slide.title = 'Flyer';
      slide.elements.push(textElement('{{Headline}}', 120, 90, 1360, 160, 84, true, '#5b21b6'));
      slide.elements.push(shapeElement(120, 280, 700, 480, 'Add an image'));
      slide.elements.push(textElement('What: {{What}}\nWhen: {{When}}\nWhere: {{Where}}', 900, 300, 580, 300, 40, false));
      slide.elements.push(textElement('{{Details}}', 900, 620, 580, 160, 28, false, '#374151'));
    } else if (template === 'poster') {
      slide.title = 'Poster';
      slide.bg = 'section';
      slide.footer = false;
      slide.elements.push(textElement('{{Headline}}', 120, 240, 1360, 300, 120, true, '#ffffff'));
      slide.elements.push(textElement('{{Subtext}}', 120, 580, 1360, 160, 44, false, '#ede9fe'));
    } else {
      slide.title = 'Title and Content';
      slide.elements.push(textElement('Slide title', 90, 82, 860, 92, 46, true));
      slide.elements.push(listElement(['First point', 'Second point', 'Third point'], 125, 190, 900, 360));
      slide.notes = 'I will use this slide to explain the main points in order, keeping the audience focused on the relationships between the bullets rather than reading every word.';
    }
    return slide;
  }

  function makeBlankTitleSlide() {
    const slide = makeTemplateSlide('title');
    slide.title = 'Title slide';
    slide.notes = '';
    slide.elements = [
      textElement('Title', 150, 245, 920, 110, 72, true, '#ffffff'),
      textElement('Subtitle', 158, 370, 900, 70, 34, false, '#f5f3ff')
    ];
    return slide;
  }

  function resetToBlankTitleSlide(message) {
    const slide = makeBlankTitleSlide();
    deck.slides = [slide];
    activeSlide = 0;
    selectedSlideIds = new Set([slide.id]);
    lastSlideSelectionIndex = 0;
    selectedId = null;
    saveSoon();
    render();
    setStatus(message || 'Started a new blank title slide.');
  }

  function textElement(text, x, y, w, h, fontSize, bold, color) {
    return {
      id: uid('obj'),
      type: 'text',
      text,
      x,
      y,
      w,
      h: Math.max(h, Math.ceil(fontSize * 1.45) + 20),
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize,
      bold: Boolean(bold),
      italic: false,
      underline: false,
      color: color || '#1f2937',
      fill: 'transparent',
      align: 'left',
      z: Date.now()
    };
  }

  function listElement(items, x, y, w, h) {
    const el = textElement(items.join('\n'), x, y, w, h, 34, false);
    el.type = 'list';
    return el;
  }

  function shapeElement(x, y, w, h, text) {
    const el = textElement(text, x, y, w, h, 30, true, '#6d28d9');
    el.type = 'shape';
    el.fill = '#f4f1ff';
    el.align = 'center';
    return el;
  }

  function tableElement(x, y, w, h) {
    return {
      id: uid('obj'),
      type: 'table',
      x,
      y,
      w,
      h,
      rows: [['Topic', 'Notes', 'Owner'], ['One', 'Details', 'Name'], ['Two', 'Details', 'Name']],
      fontSize: 24,
      color: '#1f2937',
      fill: '#ffffff',
      z: Date.now()
    };
  }

  function currentSlide() {
    return deck.slides[activeSlide];
  }

  function selectedObject() {
    const slide = currentSlide();
    return slide.elements.find(el => el.id === selectedId) || null;
  }

  // All selected elements on the current slide, in slide (z-order) order.
  function selectedObjects() {
    return currentSlide().elements.filter(el => selectedObjectIds.has(el.id));
  }

  // Make `id` the only selected object (or clear when falsy/footer).
  function selectOnly(id) {
    selectedId = id || null;
    selectedObjectIds = new Set(id && id !== FOOTER_ID ? [id] : []);
  }

  // Clear every selection.
  function clearSelection() {
    selectedId = null;
    selectedObjectIds.clear();
  }

  // Drop ids that no longer exist on the current slide (e.g. after a slide
  // switch or deletion) so multi-selection state can never leak across slides.
  function pruneSelection() {
    const ids = new Set(currentSlide().elements.map(el => el.id));
    selectedObjectIds.forEach(id => { if (!ids.has(id)) selectedObjectIds.delete(id); });
    if (selectedId && selectedId !== FOOTER_ID && !ids.has(selectedId)) selectedId = null;
    if (!selectedId && selectedObjectIds.size) selectedId = [...selectedObjectIds][selectedObjectIds.size - 1];
  }

  function loadDeck() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return normalizeDeck(JSON.parse(raw));
    } catch (err) {
      console.warn(err);
    }
    return defaultDeck();
  }

  function normalizeDeck(value) {
    if (!value || !Array.isArray(value.slides)) return defaultDeck();
    return {
      version: 1,
      title: value.title || 'Untitled ShowSplat Deck',
      theme: value.theme || 'violet',
      themeColors: value.themeColors && typeof value.themeColors === 'object' ? value.themeColors : null,
      footer: value.footer || 'ShowSplat™ by DrawSplat™',
      globalAudio: normalizeAudio(value.globalAudio),
      slides: value.slides.map(slide => ({
        id: slide.id || uid('slide'),
        title: slide.title || 'Slide',
        notes: slide.notes || '',
        bg: slide.bg || 'light',
        importedCss: slide.importedCss || '',
        backgroundColor: slide.backgroundColor || '',
        footerColor: slide.footerColor || '',
        footerTextColor: slide.footerTextColor || '',
        defaultTextColor: slide.defaultTextColor || '',
        footer: slide.footer !== false,
        hidden: Boolean(slide.hidden),
        indent: clamp(Number(slide.indent) || 0, 0, 4),
        collapsed: Boolean(slide.collapsed),
        audio: Array.isArray(slide.audio) ? slide.audio.map(normalizeAudio).filter(Boolean) : [],
        elements: Array.isArray(slide.elements) ? slide.elements.map(normalizeElement) : []
      }))
    };
  }

  function normalizeAudio(audio) {
    if (!audio || !audio.src) return null;
    return {
      id: audio.id || uid('audio'),
      src: audio.src,
      name: audio.name || audio.title || 'Audio',
      title: audio.title || audio.name || 'Audio'
    };
  }

  function normalizeElement(el) {
    const normalized = Object.assign({
      id: uid('obj'),
      type: 'text',
      x: 100,
      y: 100,
      w: 500,
      h: 160,
      text: '',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: 32,
      bold: false,
      italic: false,
      underline: false,
      color: '#1f2937',
      fill: 'transparent',
      align: 'left',
      z: Date.now()
    }, el);
    if (['text', 'list', 'link', 'shape', 'html'].includes(normalized.type)) {
      const minHeight = Math.ceil((Number(normalized.fontSize) || 32) * 1.45) + 20;
      normalized.h = Math.max(Number(normalized.h) || 0, minHeight);
    }
    return normalized;
  }

  function saveSoon() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      const json = JSON.stringify(deck);
      recordHistory(json);
      try {
        localStorage.setItem(STORAGE_KEY, json);
        setStatus('Autosaved in this browser.');
      } catch (err) {
        console.warn(err);
        setStatus('Deck is too large for browser autosave. Use File > Save .showsplat.json.');
      }
    }, 250);
  }

  function recordHistory(json) {
    if (json === history[historyIndex]) return;
    history = history.slice(0, historyIndex + 1);
    history.push(json);
    if (history.length > HISTORY_LIMIT) history.shift();
    historyIndex = history.length - 1;
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;
    document.querySelectorAll('[data-action="undo"]').forEach(btn => { btn.disabled = !canUndo; });
    document.querySelectorAll('[data-action="redo"]').forEach(btn => { btn.disabled = !canRedo; });
  }

  function undo() {
    if (historyIndex <= 0) { setStatus('Nothing to undo.'); return; }
    historyIndex--;
    restoreHistory('Undid the last change.');
  }

  function redo() {
    if (historyIndex >= history.length - 1) { setStatus('Nothing to redo.'); return; }
    historyIndex++;
    restoreHistory('Redid the change.');
  }

  function restoreHistory(message) {
    const json = history[historyIndex];
    deck = JSON.parse(json);
    activeSlide = clamp(activeSlide, 0, deck.slides.length - 1);
    selectedId = null;
    cropTargetId = null;
    selectedSlideIds = new Set();
    try {
      localStorage.setItem(STORAGE_KEY, json);
    } catch (err) {
      console.warn(err);
    }
    render();
    updateHistoryButtons();
    setStatus(message);
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function getDeckTheme() {
    return Object.assign({}, themes[deck.theme] || themes.violet, deck.themeColors || {});
  }

  function render() {
    normalizeSlideSelection();
    const theme = getDeckTheme();
    document.documentElement.style.setProperty('--accent', theme.accent);
    document.documentElement.style.setProperty('--accent-2', theme.accent2);
    document.documentElement.style.setProperty('--dark', theme.dark);
    els.deckTitle.value = deck.title;
    applyZoom();
    renderThumbs();
    renderCanvas();
    renderInspector();
    renderSorter();
    requestAnimationFrame(scaleMiniHtmlPreviews);
  }

  function scaleMiniHtmlPreviews() {
    document.querySelectorAll('.mini-html-scale').forEach(inner => {
      const host = inner.parentElement;
      if (!host) return;
      const width = host.clientWidth;
      if (width > 0) inner.style.transform = 'scale(' + (width / SLIDE_W) + ')';
    });
  }

  function renderThumbs() {
    els.thumbs.innerHTML = '';
    const previewCss = importedCssForDeck();
    if (previewCss) {
      const style = document.createElement('style');
      style.textContent = previewCss;
      els.thumbs.appendChild(style);
    }
    deck.slides.forEach((slide, index) => {
      if (isCollapsedChild(index)) return;
      const button = document.createElement('button');
      button.className = slideCardClass('thumb', slide, index);
      button.type = 'button';
      button.dataset.index = index;
      button.dataset.slideId = slide.id;
      button.draggable = true;
      button.style.setProperty('--indent', slide.indent || 0);
      button.innerHTML = '<span class="thumb-num">' + (index + 1) + '</span>' + slideStateBadges(slide);
      button.appendChild(buildMiniSlide(slide, index));
      button.addEventListener('click', event => handleSlideClick(event, index));
      button.addEventListener('dragstart', slideDragStart);
      button.addEventListener('dragover', slideDragOver);
      button.addEventListener('dragleave', slideDragLeave);
      button.addEventListener('drop', slideDrop);
      button.addEventListener('dragend', slideDragEnd);
      els.thumbs.appendChild(button);
    });
  }

  function buildMiniSlide(slide, index) {
    const mini = document.createElement('span');
    mini.className = 'thumb-preview mini-slide ' + (slide.bg === 'section' ? 'section' : slide.bg === 'dark' ? 'dark' : '');
    if (slide.backgroundColor) mini.style.background = slide.backgroundColor;
    if (slide.defaultTextColor) mini.style.color = slide.defaultTextColor;
    onSlideElements(slide).slice().sort((a, b) => (a.z || 0) - (b.z || 0)).forEach(el => {
      const item = document.createElement('span');
      item.className = 'mini-obj ' + el.type;
      item.style.left = (el.x / SLIDE_W * 100) + '%';
      item.style.top = (el.y / SLIDE_H * 100) + '%';
      item.style.width = (el.w / SLIDE_W * 100) + '%';
      item.style.height = (el.h / SLIDE_H * 100) + '%';
      item.style.color = el.color || '#1f2937';
      item.style.background = el.fill || 'transparent';
      item.style.transform = 'rotate(' + (Number(el.rotate) || 0) + 'deg)';
      item.style.fontWeight = el.bold ? '900' : '700';
      if (el.type === 'image' && el.src) {
        item.innerHTML = '<img src="' + escapeAttr(el.src) + '" alt="">';
        const image = item.querySelector('img');
        image.style.objectFit = el.fit || 'contain';
        image.style.objectPosition = (el.cropX ?? 50) + '% ' + (el.cropY ?? 50) + '%';
      } else if (el.type === 'video' || el.type === 'youtube') {
        item.textContent = 'Video';
      } else if (el.type === 'table') {
        item.textContent = 'Table';
      } else if (el.type === 'html') {
        const inner = document.createElement('div');
        inner.className = 'imported-webdeck-slide mini-html-scale ' + (el.importedClasses || '');
        inner.style.width = SLIDE_W + 'px';
        inner.style.height = SLIDE_H + 'px';
        inner.style.fontSize = (el.fontSize || 30) + 'px';
        inner.style.transformOrigin = 'top left';
        inner.innerHTML = sanitizeImportedHtml(el.html || '');
        item.appendChild(inner);
      } else {
        item.textContent = String(el.text || '').slice(0, 80);
      }
      mini.appendChild(item);
    });
    if (slide.footer) {
      const footer = document.createElement('span');
      footer.className = 'mini-footer';
      footer.textContent = String(index + 1);
      if (slide.footerColor) footer.style.background = slide.footerColor;
      footer.style.color = slide.footerTextColor || contrastText(slide.footerColor || '#312e5f');
      mini.appendChild(footer);
    }
    return mini;
  }

  function renderCanvas() {
    const slide = currentSlide();
    pruneSelection();
    els.canvas.className = 'slide-canvas ' + (slide.bg === 'section' ? 'section' : slide.bg === 'dark' ? 'dark' : '') + (selectedObjectIds.size > 1 ? ' multi-select' : '');
    els.canvas.style.background = slide.backgroundColor || '';
    els.canvas.style.color = slide.defaultTextColor || '';
    els.canvas.innerHTML = '';
    if (slide.importedCss) {
      const style = document.createElement('style');
      style.textContent = scopeImportedCss(slide.importedCss);
      els.canvas.appendChild(style);
    }
    const ordered = slide.elements.slice().sort((a, b) => (a.z || 0) - (b.z || 0));
    ordered.forEach(renderObject);
    if (slide.footer) {
      const footer = document.createElement('div');
      footer.className = 'slide-footer' + (selectedId === FOOTER_ID ? ' selected' : '');
      footer.dataset.id = FOOTER_ID;
      footer.style.background = slide.footerColor || '';
      footer.style.color = slide.footerTextColor || contrastText(slide.footerColor || '#312e5f');
      footer.innerHTML = '<span class="footer-text" contenteditable="true" spellcheck="true">' + escapeHtml(deck.footer || '') + '</span><span class="footer-count">' + (activeSlide + 1) + ' / ' + deck.slides.length + '</span>';
      footer.addEventListener('pointerdown', () => {
        selectedId = FOOTER_ID;
        selectedObjectIds.clear();
        els.canvas.classList.remove('multi-select');
        els.canvas.querySelectorAll('.slide-object.selected').forEach(node => node.classList.remove('selected'));
        footer.classList.add('selected');
        renderInspector();
        setStatus('Editing information bar. Use text and fill colors to style it.');
      });
      footer.querySelector('.footer-text').addEventListener('input', event => {
        deck.footer = event.currentTarget.textContent;
        if (els.footerText) els.footerText.value = deck.footer;
        saveSoon();
      });
      els.canvas.appendChild(footer);
    }
    if (slide.audio && slide.audio.length) {
      const audioBar = document.createElement('div');
      audioBar.className = 'slide-audio-bar';
      audioBar.innerHTML = slide.audio.map(audio => '<span>Slide audio: ' + escapeHtml(audio.name) + '</span>').join('');
      els.canvas.appendChild(audioBar);
    }
  }

  function renderObject(el) {
    const node = document.createElement('div');
    node.className = 'slide-object ' + el.type + (selectedObjectIds.has(el.id) ? ' selected' : '') + (el.id === selectedId ? ' sel-primary' : '') + (isOnSlide(el) ? '' : ' off-slide');
    node.dataset.id = el.id;
    node.style.left = (el.x / SLIDE_W * 100) + '%';
    node.style.top = (el.y / SLIDE_H * 100) + '%';
    node.style.width = (el.w / SLIDE_W * 100) + '%';
    node.style.height = (el.h / SLIDE_H * 100) + '%';
    node.style.zIndex = String(el.z || 1);
    node.style.transform = 'rotate(' + (Number(el.rotate) || 0) + 'deg)';
    node.style.transformOrigin = 'center center';
    node.style.opacity = String(el.opacity ?? 1);
    if (el.id === cropTargetId) node.classList.add('crop-mode');
    node.addEventListener('pointerdown', objectPointerDown);
    if (el.type === 'image') {
      node.addEventListener('dblclick', event => {
        event.preventDefault();
        selectOnly(el.id);
        cropTargetId = el.id;
        el.fit = 'cover';
        el.cropX = el.cropX ?? 50;
        el.cropY = el.cropY ?? 50;
        saveSoon();
        render();
        setStatus('Crop mode: drag inside the image to reposition, then click off the image.');
      });
    }

    const content = document.createElement('div');
    content.className = 'object-content';
    content.style.fontFamily = el.fontFamily || 'Inter, Arial, sans-serif';
    content.style.fontSize = (el.fontSize || 30) + 'px';
    content.style.fontWeight = el.bold ? '900' : '600';
    content.style.fontStyle = el.italic ? 'italic' : 'normal';
    content.style.textDecoration = el.underline ? 'underline' : 'none';
    content.style.color = el.color || '#1f2937';
    content.style.background = el.fill || 'transparent';
    content.style.textAlign = el.align || 'left';

    if (el.type === 'list') {
      content.contentEditable = 'true';
      content.innerHTML = '<ul>' + String(el.text || '').split('\n').filter(Boolean).map(item => '<li>' + escapeHtml(item.replace(/^[-*]\s*/, '')) + '</li>').join('') + '</ul>';
      content.addEventListener('input', () => {
        const items = Array.from(content.querySelectorAll('li')).map(li => li.textContent.trim()).filter(Boolean);
        el.text = items.join('\n');
        slideTitleFromFirstText();
        saveSoon();
        renderThumbs();
      });
    } else if (el.type === 'image') {
      content.innerHTML = '<img src="' + escapeAttr(el.src || '') + '" alt="' + escapeAttr(el.alt || '') + '">';
      const image = content.querySelector('img');
      image.style.objectFit = el.fit || 'contain';
      image.style.objectPosition = (el.cropX ?? 50) + '% ' + (el.cropY ?? 50) + '%';
    } else if (el.type === 'youtube') {
      content.innerHTML = '<iframe src="' + escapeAttr(el.src || '') + '" title="' + escapeAttr(el.title || 'YouTube video') + '" allowfullscreen></iframe>';
    } else if (el.type === 'video') {
      content.innerHTML = '<video src="' + escapeAttr(el.src || '') + '" controls></video>';
    } else if (el.type === 'audio') {
      content.innerHTML = '<audio src="' + escapeAttr(el.src || '') + '" controls></audio>';
    } else if (el.type === 'table') {
      content.innerHTML = tableHtml(el);
      content.querySelectorAll('td').forEach(cell => {
        cell.contentEditable = 'true';
        cell.addEventListener('input', () => {
          const r = Number(cell.dataset.r);
          const c = Number(cell.dataset.c);
          el.rows[r][c] = cell.textContent;
          saveSoon();
        });
      });
    } else if (el.type === 'html') {
      content.innerHTML = '<div class="imported-webdeck-slide ' + escapeAttr(el.importedClasses || '') + '" contenteditable="true">' + sanitizeImportedHtml(el.html || '') + '</div>';
      const importedRoot = content.querySelector('.imported-webdeck-slide');
      applyImportedScale(importedRoot, el.importScale || 1);
      if (el.autoFit !== false) {
        requestAnimationFrame(() => fitImportedHtml(el, importedRoot));
        importedRoot.querySelectorAll('img, video, iframe').forEach(media => {
          media.addEventListener('load', () => fitImportedHtml(el, importedRoot), { once: true });
          media.addEventListener('loadedmetadata', () => fitImportedHtml(el, importedRoot), { once: true });
        });
      }
      importedRoot.addEventListener('input', () => {
        el.html = importedRoot.innerHTML;
        el.importScale = 1;
        saveSoon();
        if (el.autoFit !== false) requestAnimationFrame(() => fitImportedHtml(el, importedRoot));
        renderThumbs();
      });
    } else if (el.type === 'link') {
      content.contentEditable = 'true';
      content.textContent = el.text || 'Link text';
      content.addEventListener('input', () => {
        el.text = content.textContent;
        saveSoon();
      });
    } else {
      content.contentEditable = el.type !== 'shape' ? 'true' : 'true';
      content.textContent = el.text || '';
      content.addEventListener('input', () => {
        el.text = content.textContent;
        slideTitleFromFirstText();
        saveSoon();
        renderThumbs();
      });
    }

    node.appendChild(content);
    const moveHandle = document.createElement('span');
    moveHandle.className = 'move-handle';
    moveHandle.title = 'Drag to move';
    moveHandle.setAttribute('aria-hidden', 'true');
    node.appendChild(moveHandle);
    ['nw', 'ne', 'se', 'sw'].forEach(handleName => {
      const handle = document.createElement('span');
      handle.className = 'resize-handle ' + handleName;
      handle.dataset.handle = handleName;
      handle.addEventListener('pointerdown', resizePointerDown);
      node.appendChild(handle);
    });
    const rotate = document.createElement('span');
    rotate.className = 'rotate-handle';
    rotate.addEventListener('pointerdown', rotatePointerDown);
    node.appendChild(rotate);
    els.canvas.appendChild(node);
  }

  function tableHtml(el) {
    const rows = normalizeTableRows(el);
    return '<table>' + rows.map((row, r) => '<tr>' + row.map((cell, c) => '<td data-r="' + r + '" data-c="' + c + '" tabindex="0">' + escapeHtml(cell) + '</td>').join('') + '</tr>').join('') + '</table>';
  }

  function normalizeTableRows(el) {
    const sourceRows = Array.isArray(el.rows) && el.rows.length ? el.rows : [['A', 'B'], ['1', '2']];
    const maxColumns = Math.max(1, ...sourceRows.map(row => Array.isArray(row) ? row.length : 1));
    el.rows = sourceRows.map(row => {
      const cells = Array.isArray(row) ? row.slice() : [row];
      while (cells.length < maxColumns) cells.push('');
      return cells.map(cell => String(cell ?? ''));
    });
    return el.rows;
  }

  function applyImportedScale(root, scale) {
    const safeScale = clamp(Number(scale) || 1, 0.1, 1);
    root.style.transformOrigin = 'top left';
    root.style.transform = 'scale(' + safeScale + ')';
    root.style.width = (100 / safeScale) + '%';
    root.style.height = (100 / safeScale) + '%';
  }

  function fitImportedHtml(el, root) {
    if (!root?.isConnected) return;
    applyImportedScale(root, 1);
    const widthRatio = root.clientWidth / Math.max(root.scrollWidth, 1);
    const heightRatio = root.clientHeight / Math.max(root.scrollHeight, 1);
    const scale = clamp(Math.min(1, widthRatio, heightRatio) - 0.015, 0.1, 1);
    if (Math.abs((el.importScale || 1) - scale) > 0.01) {
      el.importScale = scale;
      saveSoon();
    }
    applyImportedScale(root, scale);
  }

  function renderInspector() {
    const slide = currentSlide();
    els.notes.value = slide.notes || '';
    if (selectedId === FOOTER_ID) {
      els.selectionInfo.textContent = 'Information bar selected. Edit its text on the slide, or use text and fill colors to style it.';
      [els.altText, els.linkUrl, els.posX, els.posY, els.posW, els.posH].forEach(input => input.value = '');
      els.textColor.value = normalizeColor(slide.footerTextColor || contrastText(slide.footerColor || '#312e5f'));
      els.fillColor.value = normalizeColor(slide.footerColor || '#312e5f');
      return;
    }
    const obj = selectedObject();
    if (!obj) {
      els.selectionInfo.textContent = 'No object selected.';
      [els.altText, els.linkUrl, els.posX, els.posY, els.posW, els.posH].forEach(input => input.value = '');
      if (els.arrangePanel) els.arrangePanel.hidden = true;
      return;
    }
    if (els.arrangePanel) els.arrangePanel.hidden = selectedObjectIds.size < 2;
    if (selectedObjectIds.size > 1) {
      els.selectionInfo.textContent = selectedObjectIds.size + ' objects selected. Drag to move them together, or use Arrange to align and distribute. Color and font changes apply to all.';
    } else {
      els.selectionInfo.textContent = obj.type + ' object selected. Drag to move, use corner handles to resize, and use the top handle to rotate. Shift+click another object to multi-select.';
    }
    els.altText.value = obj.alt || '';
    els.linkUrl.value = obj.href || '';
    if (els.posX) els.posX.value = Math.round(obj.x);
    if (els.posY) els.posY.value = Math.round(obj.y);
    if (els.posW) els.posW.value = Math.round(obj.w);
    if (els.posH) els.posH.value = Math.round(obj.h);
    els.fontFamily.value = obj.fontFamily || els.fontFamily.value;
    els.fontSize.value = obj.fontSize || 30;
    els.textColor.value = normalizeColor(obj.color || '#1f2937');
    els.fillColor.value = normalizeColor(obj.fill || '#ffffff');
  }

  function renderSorter() {
    if (viewMode !== 'sorter') return;
    els.sorter.innerHTML = '';
    deck.slides.forEach((slide, index) => {
      if (isCollapsedChild(index)) return;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = slideCardClass('sorter-card', slide, index);
      card.dataset.index = index;
      card.dataset.slideId = slide.id;
      card.draggable = true;
      card.style.setProperty('--indent', slide.indent || 0);
      card.appendChild(buildMiniSlide(slide, index));
      card.insertAdjacentHTML('beforeend', '<strong>' + (index + 1) + '. ' + escapeHtml(slide.title) + '</strong>' + slideStateBadges(slide));
      card.addEventListener('click', event => handleSlideClick(event, index));
      card.addEventListener('dragstart', slideDragStart);
      card.addEventListener('dragover', slideDragOver);
      card.addEventListener('dragleave', slideDragLeave);
      card.addEventListener('drop', slideDrop);
      card.addEventListener('dragend', slideDragEnd);
      els.sorter.appendChild(card);
    });
  }

  function slideDragStart(event) {
    draggedSlideIndex = Number(event.currentTarget.dataset.index);
    if (!selectedSlideIds.has(deck.slides[draggedSlideIndex]?.id)) {
      selectedSlideIds = new Set([deck.slides[draggedSlideIndex]?.id].filter(Boolean));
      renderThumbs();
      renderSorter();
    }
    event.currentTarget.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(draggedSlideIndex));
  }

  function slideDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const target = event.currentTarget;
    if (!target.classList.contains('dragging')) target.classList.add('drop-target');
  }

  function slideDragLeave(event) {
    event.currentTarget.classList.remove('drop-target');
  }

  function slideDrop(event) {
    event.preventDefault();
    const from = draggedSlideIndex ?? Number(event.dataTransfer.getData('text/plain'));
    const to = Number(event.currentTarget.dataset.index);
    clearSlideDragClasses();
    if (!Number.isInteger(from) || !Number.isInteger(to) || from === to) return;
    moveSelectedSlides(from, to);
  }

  function slideDragEnd() {
    draggedSlideIndex = null;
    clearSlideDragClasses();
  }

  function clearSlideDragClasses() {
    document.querySelectorAll('.thumb,.sorter-card').forEach(node => node.classList.remove('dragging', 'drop-target'));
  }

  function slideCardClass(base, slide, index) {
    return base +
      (index === activeSlide ? ' active' : '') +
      (selectedSlideIds.has(slide.id) ? ' selected-slide' : '') +
      (slide.hidden ? ' hidden-slide' : '') +
      (slide.collapsed ? ' collapsed-slide' : '');
  }

  function slideStateBadges(slide) {
    const badges = [];
    if (slide.hidden) badges.push('<span class="slide-badge">Hidden</span>');
    if (slide.collapsed) badges.push('<span class="slide-badge">Collapsed</span>');
    if (slide.indent) badges.push('<span class="slide-badge">Level ' + (slide.indent + 1) + '</span>');
    return badges.length ? '<span class="slide-badges">' + badges.join('') + '</span>' : '';
  }

  function isCollapsedChild(index) {
    const indent = Number(deck.slides[index]?.indent) || 0;
    if (!indent) return false;
    for (let i = index - 1; i >= 0; i -= 1) {
      const previousIndent = Number(deck.slides[i]?.indent) || 0;
      if (previousIndent < indent) return Boolean(deck.slides[i].collapsed);
    }
    return false;
  }

  function handleSlideClick(event, index) {
    if (event.shiftKey) {
      const start = Math.min(lastSlideSelectionIndex, index);
      const end = Math.max(lastSlideSelectionIndex, index);
      selectedSlideIds = new Set(deck.slides.slice(start, end + 1).map(slide => slide.id));
    } else if (event.metaKey || event.ctrlKey) {
      const id = deck.slides[index].id;
      selectedSlideIds = new Set(selectedSlideIds);
      if (selectedSlideIds.has(id)) selectedSlideIds.delete(id);
      else selectedSlideIds.add(id);
      lastSlideSelectionIndex = index;
    } else {
      selectedSlideIds = new Set([deck.slides[index].id]);
      lastSlideSelectionIndex = index;
    }
    activeSlide = index;
    selectedId = null;
    render();
  }

  function selectedSlideIndexes() {
    if (!selectedSlideIds.size && deck.slides[activeSlide]) return [activeSlide];
    return deck.slides.map((slide, index) => selectedSlideIds.has(slide.id) ? index : -1).filter(index => index >= 0);
  }

  function normalizeSlideSelection() {
    const ids = new Set(deck.slides.map(slide => slide.id));
    selectedSlideIds = new Set(Array.from(selectedSlideIds).filter(id => ids.has(id)));
    if (!selectedSlideIds.size && deck.slides[activeSlide]) selectedSlideIds.add(deck.slides[activeSlide].id);
  }

  function moveSlide(from, to) {
    const max = deck.slides.length - 1;
    const source = clamp(from, 0, max);
    const target = clamp(to, 0, max);
    const [slide] = deck.slides.splice(source, 1);
    deck.slides.splice(target, 0, slide);
    if (activeSlide === source) activeSlide = target;
    else if (source < activeSlide && target >= activeSlide) activeSlide -= 1;
    else if (source > activeSlide && target <= activeSlide) activeSlide += 1;
    selectedId = null;
    saveSoon();
    render();
    setStatus('Moved slide ' + (source + 1) + ' to position ' + (target + 1) + '.');
  }

  function moveSelectedSlides(from, to) {
    const indexes = selectedSlideIndexes();
    if (!indexes.includes(from)) return moveSlide(from, to);
    const selected = new Set(indexes);
    const moving = deck.slides.filter((_, index) => selected.has(index));
    const remaining = deck.slides.filter((_, index) => !selected.has(index));
    const beforeTarget = deck.slides.slice(0, to).filter((_, index) => !selected.has(index)).length;
    deck.slides = remaining.slice(0, beforeTarget).concat(moving, remaining.slice(beforeTarget));
    activeSlide = deck.slides.findIndex(slide => slide.id === moving[0].id);
    selectedSlideIds = new Set(moving.map(slide => slide.id));
    selectedId = null;
    saveSoon();
    render();
    setStatus('Moved ' + moving.length + ' selected slide' + (moving.length === 1 ? '' : 's') + '.');
  }

  function selectSlide(index) {
    activeSlide = Math.max(0, Math.min(deck.slides.length - 1, index));
    selectedSlideIds = new Set([deck.slides[activeSlide]?.id].filter(Boolean));
    lastSlideSelectionIndex = activeSlide;
    selectedId = null;
    render();
  }

  function addSlide(template) {
    deck.slides.splice(activeSlide + 1, 0, makeTemplateSlide(template || 'title-content'));
    activeSlide += 1;
    selectedSlideIds = new Set([deck.slides[activeSlide].id]);
    lastSlideSelectionIndex = activeSlide;
    selectedId = null;
    saveSoon();
    render();
  }

  function duplicateSlide() {
    const clone = JSON.parse(JSON.stringify(currentSlide()));
    clone.id = uid('slide');
    clone.title += ' Copy';
    clone.elements.forEach(el => el.id = uid('obj'));
    deck.slides.splice(activeSlide + 1, 0, clone);
    activeSlide += 1;
    selectedSlideIds = new Set([clone.id]);
    lastSlideSelectionIndex = activeSlide;
    saveSoon();
    render();
  }

  // Parse CSV text into an array of row objects keyed by the header row.
  // Handles quoted fields, embedded commas/newlines, and "" escapes.
  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (let i = 0; i < src.length; i += 1) {
      const ch = src[i];
      if (inQuotes) {
        if (ch === '"') {
          if (src[i + 1] === '"') { field += '"'; i += 1; }
          else inQuotes = false;
        } else field += ch;
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field); field = '';
      } else if (ch === '\n') {
        row.push(field); field = '';
        rows.push(row); row = [];
      } else field += ch;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    const nonEmpty = rows.filter(r => r.some(c => c.trim() !== ''));
    if (!nonEmpty.length) return [];
    const headers = nonEmpty[0].map(h => h.trim());
    return nonEmpty.slice(1).map(cells => {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = (cells[idx] ?? '').trim(); });
      return obj;
    });
  }

  // Replace {{Header}} tokens (case-insensitive, whitespace-tolerant) in a
  // string using values from a CSV row object.
  function fillMergeTokens(str, rowObj) {
    if (typeof str !== 'string' || str.indexOf('{{') === -1) return str;
    return str.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, key) => {
      const wanted = key.trim().toLowerCase();
      const found = Object.keys(rowObj).find(k => k.toLowerCase() === wanted);
      return found !== undefined ? rowObj[found] : match;
    });
  }

  // Mail merge: use the current slide as a template and generate one new slide
  // per CSV data row, substituting {{Header}} tokens in text/list/html fields.
  function mailMergeFromCsv(csvText) {
    let rows;
    try {
      rows = parseCsv(csvText);
    } catch (err) {
      console.warn(err);
      setStatus('Could not read that CSV file.');
      return;
    }
    if (!rows.length) {
      setStatus('No data rows found in that CSV. The first row should be column headers.');
      return;
    }
    const template = currentSlide();
    const generated = rows.map((rowObj, rowIndex) => {
      const clone = JSON.parse(JSON.stringify(template));
      clone.id = uid('slide');
      clone.title = fillMergeTokens(template.title || 'Slide', rowObj) + ' ' + (rowIndex + 1);
      clone.elements.forEach(el => {
        el.id = uid('obj');
        if (typeof el.text === 'string') el.text = fillMergeTokens(el.text, rowObj);
        if (typeof el.html === 'string') el.html = fillMergeTokens(el.html, rowObj);
        if (typeof el.href === 'string') el.href = fillMergeTokens(el.href, rowObj);
        if (Array.isArray(el.items)) el.items = el.items.map(item => fillMergeTokens(item, rowObj));
      });
      return clone;
    });
    deck.slides.splice(activeSlide + 1, 0, ...generated);
    activeSlide += 1;
    selectedSlideIds = new Set([generated[0].id]);
    lastSlideSelectionIndex = activeSlide;
    selectedId = null;
    saveSoon();
    render();
    setStatus('Mail merge created ' + generated.length + ' slide' + (generated.length === 1 ? '' : 's') + ' from your CSV.');
  }

  function deleteSlide() {
    if (selectedSlideIndexes().length > 1) return deleteSelectedSlides();
    if (deck.slides.length === 1) {
      resetToBlankTitleSlide('Deleted the last slide and added a blank title slide.');
      return;
    }
    deck.slides.splice(activeSlide, 1);
    activeSlide = Math.max(0, activeSlide - 1);
    selectedSlideIds = new Set([deck.slides[activeSlide].id]);
    selectedId = null;
    saveSoon();
    render();
  }

  function deleteSelectedSlides() {
    const indexes = selectedSlideIndexes();
    if (!indexes.length) {
      return;
    }
    if (!confirm('Delete ' + indexes.length + ' selected slide' + (indexes.length === 1 ? '?' : 's?'))) return;
    if (indexes.length >= deck.slides.length) {
      resetToBlankTitleSlide('Deleted all selected slides and added a blank title slide.');
      return;
    }
    const remove = new Set(indexes);
    deck.slides = deck.slides.filter((_, index) => !remove.has(index));
    activeSlide = clamp(Math.min(...indexes), 0, deck.slides.length - 1);
    selectedSlideIds = new Set([deck.slides[activeSlide].id]);
    selectedId = null;
    saveSoon();
    render();
  }

  function updateSelectedSlides(updater, message) {
    const indexes = selectedSlideIndexes();
    indexes.forEach(index => updater(deck.slides[index], index));
    selectedSlideIds = new Set(indexes.map(index => deck.slides[index].id));
    selectedId = null;
    saveSoon();
    render();
    setStatus(message || 'Updated selected slides.');
  }

  function setSelectedSlideBg(bg) {
    updateSelectedSlides(slide => {
      slide.bg = bg;
      const dark = bg === 'dark' || bg === 'section';
      slide.elements.forEach(el => {
        if ((el.type === 'text' || el.type === 'list' || el.type === 'shape') && (!el.color || el.color === '#1f2937' || el.color === '#ffffff')) {
          el.color = dark ? '#ffffff' : '#1f2937';
        }
      });
    }, 'Rethemed selected slides.');
  }

  function applySlidePalette(name) {
    const palette = slidePalettes[name];
    if (!palette) return;
    els.slideBgColor.value = palette.bg;
    els.slideBarColor.value = palette.bar;
    els.slideDefaultTextColor.value = palette.text;
    applySlideColorsToSelection(palette);
  }

  function applySlideColorsToSelection(colors) {
    const bg = colors?.bg || els.slideBgColor.value;
    const bar = colors?.bar || els.slideBarColor.value;
    const text = colors?.text || els.slideDefaultTextColor.value;
    updateSelectedSlides(slide => {
      slide.backgroundColor = bg;
      slide.footerColor = bar;
      slide.footerTextColor = contrastText(bar);
      slide.defaultTextColor = text;
      slide.elements.forEach(el => {
        if (el.type === 'text' || el.type === 'list' || el.type === 'link') el.color = text;
        if (el.type === 'shape' && (!el.color || el.color === '#1f2937' || el.color === '#ffffff')) el.color = text;
      });
    }, 'Applied slide colors.');
  }

  function syncSlideColorInputs() {
    const slide = currentSlide();
    if (!slide) return;
    els.slideBgColor.value = normalizeColor(slide.backgroundColor || (slide.bg === 'dark' || slide.bg === 'section' ? '#1e1b4b' : '#ffffff'));
    els.slideBarColor.value = normalizeColor(slide.footerColor || '#312e5f');
    els.slideDefaultTextColor.value = normalizeColor(slide.defaultTextColor || (slide.bg === 'dark' || slide.bg === 'section' ? '#ffffff' : '#1f2937'));
  }

  function indentSelectedSlides(delta) {
    updateSelectedSlides(slide => {
      slide.indent = clamp((Number(slide.indent) || 0) + delta, 0, 4);
    }, delta > 0 ? 'Indented selected slides.' : 'Outdented selected slides.');
  }

  function addObject(el) {
    currentSlide().elements.push(el);
    selectOnly(el.id);
    saveSoon();
    render();
  }

  function deleteObject() {
    // Delete every selected object (supports multi-select), footer excepted.
    const ids = selectedObjectIds.size ? new Set(selectedObjectIds) : (selectedId && selectedId !== FOOTER_ID ? new Set([selectedId]) : null);
    if (!ids || !ids.size) return;
    currentSlide().elements = currentSlide().elements.filter(el => !ids.has(el.id));
    clearSelection();
    saveSoon();
    render();
  }

  function toggleBulletsForSelection() {
    const obj = selectedObject();
    if (!obj || !['text', 'list', 'shape', 'link'].includes(obj.type)) {
      addObject(listElement(['First point', 'Second point', 'Third point'], 170, 170, 650, 250));
      return;
    }
    const lines = String(obj.text || '').split('\n').map(line => line.replace(/^\s*(?:[-*•]\s*)?/, '')).filter(Boolean);
    obj.text = lines.join('\n') || 'First point';
    obj.type = obj.type === 'list' ? 'text' : 'list';
    selectOnly(obj.id);
    saveSoon();
    render();
    setStatus(obj.type === 'list' ? 'Bullets on.' : 'Bullets off.');
  }

  function objectPointerDown(event) {
    const target = event.currentTarget;
    const id = target.dataset.id;
    const additive = event.shiftKey || event.ctrlKey || event.metaKey;

    // Resize/rotate handles imply a single object; let their own handlers run.
    if (event.target.classList.contains('resize-handle') || event.target.classList.contains('rotate-handle')) {
      selectOnly(id);
      return;
    }

    // Shift/Ctrl/Cmd-click toggles this object in the selection (no drag).
    if (additive) {
      event.preventDefault();
      if (selectedObjectIds.has(id) && selectedObjectIds.size > 1) {
        selectedObjectIds.delete(id);
        if (selectedId === id) selectedId = [...selectedObjectIds][selectedObjectIds.size - 1] || null;
      } else {
        selectedObjectIds.add(id);
        selectedId = id;
      }
      if (cropTargetId) cropTargetId = null;
      render();
      return;
    }

    // Plain click: keep an existing multi-selection if this object is part of
    // it (so you can drag the whole group); otherwise select just this one.
    if (!(selectedObjectIds.has(id) && selectedObjectIds.size > 1)) {
      selectOnly(id);
    } else {
      selectedId = id;
    }
    if (cropTargetId && cropTargetId !== id) cropTargetId = null;
    els.canvas.querySelector('.slide-footer.selected')?.classList.remove('selected');
    els.canvas.classList.toggle('multi-select', selectedObjectIds.size > 1);
    els.canvas.querySelectorAll('.slide-object').forEach(node => {
      node.classList.toggle('selected', selectedObjectIds.has(node.dataset.id));
      node.classList.toggle('sel-primary', node.dataset.id === selectedId);
    });
    renderInspector();

    if (event.target.closest('[contenteditable="true"]')) {
      setStatus('Editing ' + (selectedObject()?.type || 'object') + '. Use the grip above it to move.');
      return;
    }
    event.preventDefault();
    const primary = selectedObject();
    const rect = els.canvas.getBoundingClientRect();
    const starts = selectedObjects().map(o => ({ o, x: o.x, y: o.y }));
    const start = {
      x: event.clientX,
      y: event.clientY,
      cropX: primary.cropX ?? 50,
      cropY: primary.cropY ?? 50
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', stop, { once: true });

    function move(ev) {
      if (cropTargetId === primary.id && primary.type === 'image') {
        primary.cropX = clamp(start.cropX - (ev.clientX - start.x) / rect.width * 100, 0, 100);
        primary.cropY = clamp(start.cropY - (ev.clientY - start.y) / rect.height * 100, 0, 100);
        renderCanvas();
        return;
      }
      const dx = (ev.clientX - start.x) / rect.width * SLIDE_W;
      const dy = (ev.clientY - start.y) / rect.height * SLIDE_H;
      starts.forEach(s => {
        s.o.x = clamp(s.x + dx, -BOARD_MARGIN_X, SLIDE_W + BOARD_MARGIN_X - 40);
        s.o.y = clamp(s.y + dy, -BOARD_MARGIN_Y, SLIDE_H + BOARD_MARGIN_Y - 40);
      });
      renderCanvas();
      renderInspector();
    }

    function stop() {
      document.removeEventListener('pointermove', move);
      const moved = selectedObject();
      if (moved) setStatus(starts.length > 1 ? 'Moved ' + starts.length + ' objects.' : isOnSlide(moved) ? 'Moved object.' : 'Object is on the holding area — it will not appear when you present.');
      saveSoon();
      render();
    }
  }

  function resizePointerDown(event) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget.closest('.slide-object');
    selectOnly(target.dataset.id);
    const obj = selectedObject();
    const rect = els.canvas.getBoundingClientRect();
    const handle = event.currentTarget.dataset.handle || 'se';
    const start = {
      x: event.clientX,
      y: event.clientY,
      objX: obj.x,
      objY: obj.y,
      w: obj.w,
      h: obj.h
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', stop, { once: true });

    function move(ev) {
      const dx = (ev.clientX - start.x) / rect.width * SLIDE_W;
      const dy = (ev.clientY - start.y) / rect.height * SLIDE_H;
      if (handle.includes('e')) obj.w = clamp(start.w + dx, 60, SLIDE_W + BOARD_MARGIN_X - obj.x);
      if (handle.includes('s')) obj.h = clamp(start.h + dy, 40, SLIDE_H + BOARD_MARGIN_Y - obj.y);
      if (handle.includes('w')) {
        const nextX = clamp(start.objX + dx, -BOARD_MARGIN_X, start.objX + start.w - 60);
        obj.w = start.w + (start.objX - nextX);
        obj.x = nextX;
      }
      if (handle.includes('n')) {
        const nextY = clamp(start.objY + dy, -BOARD_MARGIN_Y, start.objY + start.h - 40);
        obj.h = start.h + (start.objY - nextY);
        obj.y = nextY;
      }
      renderCanvas();
      renderInspector();
    }

    function stop() {
      document.removeEventListener('pointermove', move);
      saveSoon();
      render();
    }
  }

  function rotatePointerDown(event) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget.closest('.slide-object');
    selectOnly(target.dataset.id);
    const obj = selectedObject();
    const rect = target.getBoundingClientRect();
    const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', stop, { once: true });

    function move(ev) {
      const angle = Math.atan2(ev.clientY - center.y, ev.clientX - center.x) * 180 / Math.PI + 90;
      obj.rotate = Math.round(angle);
      renderCanvas();
      renderInspector();
    }

    function stop() {
      document.removeEventListener('pointermove', move);
      saveSoon();
      render();
    }
  }

  function applyToSelected(mutator) {
    if (selectedId === FOOTER_ID) {
      setStatus('Information bar selected. Use text color, fill color, or edit the bar text directly.');
      return;
    }
    const targets = selectedObjects();
    if (!targets.length) {
      setStatus('Select a slide object first.');
      return;
    }
    targets.forEach(mutator);
    saveSoon();
    render();
  }

  // Align every selected object (need 2+) relative to the group's bounding box.
  function alignSelected(mode) {
    const objs = selectedObjects();
    if (objs.length < 2) {
      setStatus('Select two or more objects (Shift+click or drag a box) to align them.');
      return;
    }
    const minX = Math.min(...objs.map(o => o.x));
    const maxX = Math.max(...objs.map(o => o.x + o.w));
    const minY = Math.min(...objs.map(o => o.y));
    const maxY = Math.max(...objs.map(o => o.y + o.h));
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    objs.forEach(o => {
      if (mode === 'left') o.x = minX;
      else if (mode === 'right') o.x = maxX - o.w;
      else if (mode === 'center-h') o.x = cx - o.w / 2;
      else if (mode === 'top') o.y = minY;
      else if (mode === 'bottom') o.y = maxY - o.h;
      else if (mode === 'middle-v') o.y = cy - o.h / 2;
    });
    saveSoon();
    render();
    setStatus('Aligned ' + objs.length + ' objects.');
  }

  // Evenly space selected objects (need 3+) between the first and last centers.
  function distributeSelected(axis) {
    const objs = selectedObjects();
    if (objs.length < 3) {
      setStatus('Select three or more objects to distribute them evenly.');
      return;
    }
    const key = axis === 'h' ? 'x' : 'y';
    const size = axis === 'h' ? 'w' : 'h';
    const sorted = objs.slice().sort((a, b) => (a[key] + a[size] / 2) - (b[key] + b[size] / 2));
    const firstCenter = sorted[0][key] + sorted[0][size] / 2;
    const lastCenter = sorted[sorted.length - 1][key] + sorted[sorted.length - 1][size] / 2;
    const step = (lastCenter - firstCenter) / (sorted.length - 1);
    sorted.forEach((o, i) => { o[key] = firstCenter + i * step - o[size] / 2; });
    saveSoon();
    render();
    setStatus('Distributed ' + objs.length + ' objects ' + (axis === 'h' ? 'horizontally' : 'vertically') + '.');
  }

  function applyTextColor(value) {
    if (selectedId === FOOTER_ID) {
      currentSlide().footerTextColor = value;
      saveSoon();
      render();
      return;
    }
    applyToSelected(obj => obj.color = value);
  }

  function applyFillColor(value) {
    if (selectedId === FOOTER_ID) {
      currentSlide().footerColor = value;
      saveSoon();
      render();
      return;
    }
    applyToSelected(obj => obj.fill = value);
  }

  function insertImageFile(file) {
    readAsDataUrl(file).then(src => addObject(Object.assign(textElement('', 180, 150, 640, 360, 24), {
      type: 'image',
      src,
      alt: file.name,
      fill: 'transparent'
    })));
  }

  // Is an element's center inside the slide? Off-slide elements live on the
  // holding area and are excluded from presentation and exports.
  function isOnSlide(el) {
    const cx = el.x + el.w / 2;
    const cy = el.y + el.h / 2;
    return cx >= 0 && cx <= SLIDE_W && cy >= 0 && cy <= SLIDE_H;
  }

  function onSlideElements(slide) {
    return slide.elements.filter(isOnSlide);
  }

  // Convert a viewport point to slide coordinates (may be negative / off-slide).
  function pointToSlide(clientX, clientY) {
    if (clientX == null || clientY == null) return null;
    const rect = els.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: (clientX - rect.left) / rect.width * SLIDE_W,
      y: (clientY - rect.top) / rect.height * SLIDE_H
    };
  }

  function insertImageAt(src, alt, clientX, clientY) {
    const w = 640;
    const h = 360;
    const point = pointToSlide(clientX, clientY);
    const x = point ? clamp(point.x - w / 2, -BOARD_MARGIN_X, SLIDE_W + BOARD_MARGIN_X - 40) : 180;
    const y = point ? clamp(point.y - h / 2, -BOARD_MARGIN_Y, SLIDE_H + BOARD_MARGIN_Y - 40) : 150;
    addObject(Object.assign(textElement('', x, y, w, h, 24), { type: 'image', src, alt: alt || 'Image', fill: 'transparent' }));
  }

  function insertVideoAt(src, title, clientX, clientY) {
    const w = 720;
    const h = 405;
    const point = pointToSlide(clientX, clientY);
    const x = point ? clamp(point.x - w / 2, -BOARD_MARGIN_X, SLIDE_W + BOARD_MARGIN_X - 40) : 200;
    const y = point ? clamp(point.y - h / 2, -BOARD_MARGIN_Y, SLIDE_H + BOARD_MARGIN_Y - 40) : 180;
    addObject(Object.assign(textElement('', x, y, w, h, 24), { type: 'video', src, title: title || 'Video' }));
  }

  function insertVideoFile(file) {
    readAsDataUrl(file).then(src => addObject(Object.assign(textElement('', 200, 180, 720, 405, 24), {
      type: 'video',
      src,
      title: file.name
    })));
  }

  function insertAudioFile(file) {
    readAsDataUrl(file).then(src => {
      currentSlide().audio = currentSlide().audio || [];
      currentSlide().audio.push({ id: uid('audio'), src, name: file.name, title: file.name });
      saveSoon();
      render();
      setStatus('Added slide audio.');
    });
  }

  function setGlobalAudioFile(file) {
    readAsDataUrl(file).then(src => {
      deck.globalAudio = { id: uid('audio'), src, name: file.name, title: file.name };
      saveSoon();
      render();
      setStatus('Added presentation soundtrack.');
    });
  }

  async function recordSlideAudio() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setStatus('Audio recording is not available in this browser.');
      return;
    }
    try {
      setStatus('Recording. Speak now, then confirm to stop.');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.addEventListener('dataavailable', event => {
        if (event.data.size) chunks.push(event.data);
      });
      recorder.start();
      window.setTimeout(() => {
        if (recorder.state === 'recording' && confirm('Stop slide audio recording?')) recorder.stop();
      }, 1200);
      recorder.addEventListener('stop', () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          currentSlide().audio = currentSlide().audio || [];
          currentSlide().audio.push({ id: uid('audio'), src: reader.result, name: 'Recorded slide audio', title: 'Recorded slide audio' });
          saveSoon();
          render();
          setStatus('Added recorded slide audio.');
        };
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn(err);
      setStatus('Could not start audio recording.');
    }
  }

  function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function parseYoutube(url) {
    const trimmed = String(url || '').trim();
    const watch = trimmed.match(/[?&]v=([^&]+)/);
    const short = trimmed.match(/youtu\.be\/([^?]+)/);
    const embed = trimmed.match(/youtube\.com\/embed\/([^?]+)/);
    const id = (watch && watch[1]) || (short && short[1]) || (embed && embed[1]);
    return id ? 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) : '';
  }

  function openMarkdown() {
    els.markdownInput.value = exportMarkdown();
    els.markdownDialog.showModal();
  }

  function importMarkdown() {
    const slides = markdownToSlides(els.markdownInput.value);
    if (!slides.length) {
      setStatus('Markdown did not contain any slides.');
      return;
    }
    deck.slides = slides;
    activeSlide = 0;
    selectedId = null;
    saveSoon();
    render();
    setStatus('Built deck from Markdown.');
  }

  function markdownToSlides(markdown) {
    return String(markdown || '').split(/^---$/m).map(part => part.trim()).filter(Boolean).map(part => {
      const lines = part.split(/\r?\n/);
      const titleLine = lines.find(line => /^#\s+/.test(line)) || lines[0] || 'Slide';
      const title = titleLine.replace(/^#+\s*/, '').trim() || 'Slide';
      const bullets = lines.filter(line => /^[-*]\s+/.test(line)).map(line => line.replace(/^[-*]\s+/, '').trim());
      const body = lines.filter(line => !/^#/.test(line) && !/^[-*]\s+/.test(line)).join('\n').trim();
      const slide = {
        id: uid('slide'),
        title,
        notes: '',
        bg: /^##\s+/.test(titleLine) ? 'section' : 'light',
        footer: true,
        elements: [textElement(title, 90, 70, 900, 80, 48, true, /^##\s+/.test(titleLine) ? '#ffffff' : '#1f2937')]
      };
      if (bullets.length) slide.elements.push(listElement(bullets, 130, 190, 980, 360));
      if (body) slide.elements.push(textElement(body, 130, bullets.length ? 560 : 190, 960, 170, 28));
      return slide;
    });
  }

  async function importDeckFile(file, text) {
    if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
      deck = normalizeDeck(await pdfToDeck(text, file.name));
      activeSlide = 0;
      selectedId = null;
      saveSoon();
      render();
      setStatus('Imported PDF pages as image slides. Save as .showsplat.json to keep editing.');
      return;
    }
    if (/\.pptx$/i.test(file.name)) {
      deck = normalizeDeck(await pptxToDeck(text, file.name));
      activeSlide = 0;
      selectedId = null;
      saveSoon();
      render();
      setStatus('Imported PowerPoint. Review layout and save as .showsplat.json.');
      return;
    }
    if (/\.odp$/i.test(file.name)) {
      deck = normalizeDeck(await odpToDeck(text, file.name));
      activeSlide = 0;
      selectedId = null;
      saveSoon();
      render();
      setStatus('Imported ODP. Review layout and save as .showsplat.json.');
      return;
    }
    const trimmed = String(text || '').trim();
    if (/\.html?$/i.test(file.name) || /^<!doctype html/i.test(trimmed) || /const\s+SLIDES\s*=/.test(trimmed)) {
      const source = await resolveImportHtml(trimmed);
      const canImport = await verifyWebDeckImportPassword(source.html);
      if (!canImport) return;
      deck = normalizeDeck(webDeckHtmlToDeck(source.html, file.name, source.baseUrl));
      activeSlide = 0;
      selectedId = null;
      saveSoon();
      render();
      setStatus('Imported WebDeck HTML. Save as .showsplat.json to keep editing.');
      return;
    }
    deck = normalizeDeck(JSON.parse(trimmed));
    activeSlide = 0;
    selectedId = null;
    saveSoon();
    render();
    setStatus('Opened ShowSplat deck.');
  }

  async function pdfToDeck(buffer, fileName) {
    const pdfjs = requirePdf();
    const loadingTask = pdfjs.getDocument({
      data: buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer),
      useWorkerFetch: false,
      isEvalSupported: false
    });
    loadingTask.onPassword = (updatePassword, reason) => {
      const retry = reason === pdfjs.PasswordResponses?.INCORRECT_PASSWORD;
      const password = prompt(retry ? 'Incorrect password. Enter the PDF password:' : 'Enter the PDF password:');
      if (password) updatePassword(password);
      else loadingTask.destroy();
    };
    const pdf = await loadingTask.promise;
    const slides = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min(SLIDE_W / viewport.width, SLIDE_H / viewport.height, 2.5);
      const renderViewport = page.getViewport({ scale });
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = Math.ceil(renderViewport.width);
      pageCanvas.height = Math.ceil(renderViewport.height);
      await page.render({ canvasContext: pageCanvas.getContext('2d'), viewport: renderViewport }).promise;

      const slideCanvas = document.createElement('canvas');
      slideCanvas.width = SLIDE_W;
      slideCanvas.height = SLIDE_H;
      const ctx = slideCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);
      ctx.drawImage(pageCanvas, (SLIDE_W - pageCanvas.width) / 2, (SLIDE_H - pageCanvas.height) / 2);
      slides.push({
        id: uid('slide'),
        title: 'Page ' + pageNumber,
        notes: '',
        bg: 'light',
        footer: false,
        audio: [],
        elements: [Object.assign(textElement('', 0, 0, SLIDE_W, SLIDE_H, 24), {
          type: 'image',
          src: slideCanvas.toDataURL('image/jpeg', 0.82),
          alt: 'PDF page ' + pageNumber,
          fill: 'transparent',
          fit: 'contain',
          z: pageNumber
        })]
      });
      page.cleanup?.();
    }
    pdf.cleanup?.();
    return {
      version: 1,
      title: (fileName || 'Imported PDF').replace(/\.[^.]+$/, ''),
      theme: 'violet',
      footer: '',
      globalAudio: null,
      slides: slides.length ? slides : [makeBlankTitleSlide()]
    };
  }

  async function verifyWebDeckImportPassword(html) {
    const hash = extractWebDeckPasswordHash(html);
    if (!hash) return true;
    if (!crypto?.subtle) {
      setStatus('This browser cannot verify the WebDeck password for import.');
      return false;
    }
    const password = prompt('This WebDeck is password protected. Enter the password to import it.');
    if (password === null) {
      setStatus('WebDeck import canceled.');
      return false;
    }
    if (await sha256(password) === hash) return true;
    alert('Incorrect WebDeck password. Import canceled.');
    setStatus('Incorrect WebDeck password. Import canceled.');
    return false;
  }

  function extractWebDeckPasswordHash(html) {
    const match = String(html || '').match(/\bPASSWORD_HASH\s*=\s*["']([a-f0-9]{64})["']/i);
    return match ? match[1].toLowerCase() : '';
  }

  function webDeckHtmlToDeck(html, fileName, baseUrl) {
    const sourceSlides = extractAnyWebDeckSlides(html);
    if (!sourceSlides.length) throw new Error('No WebDeck slides found.');
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const importedCss = styleMatch ? styleMatch[1] : '';
    const resolvedBaseUrl = baseUrl || extractBaseUrl(html);
    const fallbackTitle = (fileName || 'Imported WebDeck').replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
    const importedSlides = sourceSlides.map((source, index) => webDeckSlideToShowSplatSlide(source, importedCss, index, resolvedBaseUrl));
    const footerText = importedSlides.find(slide => slide.footer)?.importedFooterText || '';
    importedSlides.forEach(slide => delete slide.importedFooterText);
    return {
      version: 1,
      title: decodeHtml(titleMatch ? titleMatch[1] : fallbackTitle) || fallbackTitle,
      theme: 'violet',
      footer: footerText || 'ShowSplat™ by DrawSplat™',
      slides: importedSlides
    };
  }

  function webDeckSlideToShowSplatSlide(source, importedCss, index, baseUrl) {
    const sourceClasses = String(source.classes || source.bg || '');
    const bg = /\b(hero|section|cover|divider)\b/.test(sourceClasses) ? 'section' : /\bdark\b/.test(sourceClasses) ? 'dark' : 'light';
    const textColor = bg === 'light' ? '#1f2937' : '#ffffff';
    const footerInfo = extractImportedFooter(source.html);
    const importedClasses = sourceClasses.replace(/\b(current|active|slide)\b/g, '').trim();
    const html = enhanceImportedContrast(
      sanitizeImportedHtml(footerInfo.html || '<h1>' + escapeHtml(source.title || 'Slide') + '</h1>', baseUrl),
      importedClasses,
      importedCss,
      bg
    );
    return {
      id: uid('slide'),
      title: source.title || 'Slide ' + (index + 1),
      notes: source.notes || '',
      bg,
      importedCss,
      footer: footerInfo.hasFooter,
      footerColor: footerInfo.background || '',
      footerTextColor: footerInfo.color || '',
      importedFooterText: footerInfo.text,
      audio: [],
      elements: [{
        id: uid('obj'),
        type: 'html',
        x: 0,
        y: 0,
        w: 1600,
        h: footerInfo.hasFooter ? 850 : 900,
        html,
        importedClasses,
        contrastFixed: true,
        autoFit: true,
        importScale: 1,
        fontFamily: 'Inter, Arial, sans-serif',
        fontSize: 30,
        bold: false,
        italic: false,
        underline: false,
        color: textColor,
        // Transparent object fill: the imported `.imported-webdeck-slide`
        // wrapper carries the deck's own background (paper for content slides,
        // the dark gradient for cover/section slides) via the scoped CSS, so a
        // white fill here would just hide a dark cover. The canvas bg is the
        // fallback for slides whose imported CSS sets no wrapper background.
        fill: 'transparent',
        align: 'left',
        z: Date.now() + index
      }]
    };
  }

  function extractImportedFooter(html) {
    const doc = new DOMParser().parseFromString('<div>' + String(html || '') + '</div>', 'text/html');
    const footer = doc.querySelector('.footer, .slide-footer, [data-showsplat-footer="true"]');
    if (!footer) return { hasFooter: false, html: String(html || ''), text: '', background: '', color: '' };
    const spans = Array.from(footer.querySelectorAll('span'));
    const text = (spans[0]?.textContent || footer.textContent || '').replace(/\s+\d+\s*\/\s*\d+\s*$/, '').trim();
    const background = footer.style.background || footer.style.backgroundColor || '';
    const color = footer.style.color || '';
    footer.remove();
    return {
      hasFooter: true,
      html: doc.body.firstElementChild ? doc.body.firstElementChild.innerHTML : '',
      text,
      background,
      color
    };
  }

  function extractWebDeckSlides(html) {
    const assignment = html.search(/\b(?:const|let|var)\s+SLIDES\s*=/);
    if (assignment < 0) return [];
    const start = html.indexOf('[', assignment);
    if (start < 0) return [];
    const slideSource = readBalancedArray(html, start);
    return parseSlideArraySource(slideSource);
  }

  function extractStaticWebDeckSlides(html) {
    const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
    return Array.from(doc.querySelectorAll('.deck > section.slide, section.slide')).map((section, index) => {
      const copy = section.cloneNode(true);
      const notes = copy.querySelector('.notes');
      const footer = copy.querySelector('.slide-footer');
      const heading = copy.querySelector('h1,h2,h3,.slide-title');
      const title = (heading?.textContent || 'Slide ' + (index + 1)).trim();
      const noteText = (notes?.textContent || '').trim();
      notes?.remove();
      return {
        title,
        notes: noteText,
        bg: /\b(cover|divider)\b/.test(section.className) ? 'section' : 'light',
        classes: section.className,
        html: copy.innerHTML,
        staticFooter: footer?.outerHTML || ''
      };
    });
  }

  function extractAnyWebDeckSlides(html) {
    const dataSlides = extractWebDeckSlides(html);
    return dataSlides.length ? dataSlides : extractStaticWebDeckSlides(html);
  }

  async function resolveImportHtml(html) {
    try {
      if (extractAnyWebDeckSlides(html).length) return { html, baseUrl: extractBaseUrl(html) };
    } catch (err) {
      console.warn(err);
    }
    const rawUrl = extractGithubRawUrl(html);
    if (!rawUrl) return { html, baseUrl: extractBaseUrl(html) };
    setStatus('Loading raw WebDeck from GitHub...');
    const response = await fetch(rawUrl);
    if (!response.ok) throw new Error('Could not fetch raw WebDeck.');
    return { html: await response.text(), baseUrl: rawUrl };
  }

  function extractBaseUrl(html) {
    const baseMatch = String(html || '').match(/<base[^>]+href=["']([^"']+)["']/i);
    if (baseMatch) return decodeHtml(baseMatch[1]);
    const canonical = String(html || '').match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
      String(html || '').match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i);
    return canonical ? decodeHtml(canonical[1]) : '';
  }

  function extractGithubRawUrl(html) {
    const direct = String(html || '').match(/href=["'](https:\/\/github\.com\/[^"']+\/raw\/[^"']+)["']/i);
    if (direct) return githubRawToUserContent(direct[1].replace(/&amp;/g, '&'));
    const rawPath = String(html || '').match(/href=["'](\/[^"']+\/raw\/[^"']+)["']/i);
    if (rawPath) return githubRawToUserContent('https://github.com' + rawPath[1].replace(/&amp;/g, '&'));
    const title = decodeHtml((String(html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
    const titleMatch = title.match(/^([^/]+)\/(.+?) at ([^·]+) · ([^/]+)\/([^/]+)$/);
    if (!titleMatch) return '';
    const path = titleMatch[2].replace(/^\/+/, '').replace(/\/?$/, '/index.html');
    const branch = titleMatch[3].trim();
    const owner = titleMatch[4].trim();
    const repo = titleMatch[5].trim();
    return 'https://raw.githubusercontent.com/' + owner + '/' + repo + '/' + encodeURIComponent(branch) + '/' + path;
  }

  function githubRawToUserContent(url) {
    const match = String(url || '').match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/raw\/refs\/heads\/([^/]+)\/(.+)$/);
    if (!match) return url;
    return 'https://raw.githubusercontent.com/' + match[1] + '/' + match[2] + '/' + match[3] + '/' + match[4];
  }

  function parseSlideArraySource(source) {
    try {
      return JSON.parse(source);
    } catch (jsonError) {
      try {
        const parsed = Function('"use strict";let __blank;__blank=new Proxy(function(){return "";},{get(_target,prop){if(prop===Symbol.toPrimitive)return ()=>\"\";if(prop===\"toString\")return ()=>\"\";if(prop===\"valueOf\")return ()=>\"\";return __blank;},apply(){return \"\";}});const motif=__blank;const art=__blank;const ART=__blank;const IMAGES=__blank;const ASSETS=__blank;const SOURCES=__blank;const colors=__blank;const hubNodes=__blank;const artHero=__blank;const artQuote=__blank;const artMap=__blank;const artTexas=__blank;const artAgencies=__blank;const artFunding=__blank;const artDecision=__blank;const artTimeline=__blank;const artClose=__blank;return (' + source + ');')();
        if (Array.isArray(parsed)) return parsed;
      } catch (literalError) {
        console.warn(jsonError, literalError);
      }
      throw new Error('Could not parse WebDeck slide data.');
    }
  }

  function readBalancedArray(text, start) {
    let depth = 0;
    let quote = '';
    let escaped = false;
    for (let i = start; i < text.length; i += 1) {
      const ch = text[i];
      if (quote) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === quote) {
          quote = '';
        }
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        quote = ch;
      } else if (ch === '[') {
        depth += 1;
      } else if (ch === ']') {
        depth -= 1;
        if (depth === 0) return text.slice(start, i + 1);
      }
    }
    throw new Error('Could not read WebDeck slide data.');
  }

  function sanitizeImportedHtml(html, baseUrl) {
    const doc = new DOMParser().parseFromString('<div>' + String(html || '') + '</div>', 'text/html');
    doc.querySelectorAll('script, style, link, meta, object, embed').forEach(node => node.remove());
    doc.querySelectorAll('*').forEach(node => {
      Array.from(node.attributes).forEach(attr => {
        const name = attr.name.toLowerCase();
        const value = String(attr.value || '').trim().toLowerCase();
        if (name.startsWith('on') || value.startsWith('javascript:')) node.removeAttribute(attr.name);
      });
    });
    normalizeImportedMedia(doc.body.firstElementChild, baseUrl);
    return doc.body.firstElementChild.innerHTML;
  }

  function normalizeImportedMedia(root, baseUrl) {
    if (!root) return;
    root.querySelectorAll('img, video, audio, source, iframe').forEach(node => {
      const fallback = node.getAttribute('src') ||
        node.getAttribute('data-src') ||
        node.getAttribute('data-lazy-src') ||
        node.getAttribute('data-original') ||
        firstSrcsetUrl(node.getAttribute('srcset') || node.getAttribute('data-srcset') || '');
      if (fallback) node.setAttribute('src', resolveImportedUrl(fallback, baseUrl));
      node.removeAttribute('srcset');
      node.removeAttribute('data-srcset');
      node.removeAttribute('data-src');
      node.removeAttribute('data-lazy-src');
      node.removeAttribute('data-original');
      if (node.tagName.toLowerCase() === 'img' && !node.getAttribute('alt')) node.setAttribute('alt', '');
    });
  }

  function firstSrcsetUrl(srcset) {
    return String(srcset || '').split(',').map(part => part.trim().split(/\s+/)[0]).find(Boolean) || '';
  }

  function resolveImportedUrl(url, baseUrl) {
    const value = String(url || '').trim();
    if (!value || /^(data:|blob:|https?:|mailto:|tel:|#)/i.test(value)) return value;
    if (value.startsWith('//')) return window.location.protocol + value;
    if (!baseUrl) return value;
    try {
      return new URL(value, baseUrl).href;
    } catch (err) {
      console.warn(err);
      return value;
    }
  }

  function htmlToText(html) {
    const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function decodeHtml(html) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = String(html || '');
    return textarea.value.trim();
  }

  function requireZip() {
    if (!window.JSZip) throw new Error('JSZip is not loaded.');
    return window.JSZip;
  }

  function requirePdf() {
    if (!window.pdfjsLib) throw new Error('PDF.js is not loaded.');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = '../../vendor/pdf.worker.min.js';
    return window.pdfjsLib;
  }

  function xmlDoc(xml) {
    return new DOMParser().parseFromString(String(xml || ''), 'application/xml');
  }

  function xmlText(value) {
    return escapeHtml(value).replace(/\r?\n/g, '&#10;');
  }

  function xmlAttr(value) {
    return escapeAttr(value).replace(/\r?\n/g, ' ');
  }

  function xmlNodes(root, localName) {
    return Array.from(root.getElementsByTagName('*')).filter(node => node.localName === localName);
  }

  function firstXml(root, localName) {
    return xmlNodes(root, localName)[0] || null;
  }

  function directXmlNodes(root, localName) {
    return Array.from(root?.children || []).filter(node => node.localName === localName);
  }

  function relsPathFor(partPath) {
    const parts = partPath.split('/');
    const file = parts.pop();
    return parts.concat('_rels', file + '.rels').join('/');
  }

  async function readRels(zip, relsPath) {
    const file = zip.file(relsPath);
    if (!file) return {};
    const doc = xmlDoc(await file.async('text'));
    const base = relsPath.replace(/\/_rels\/[^/]+\.rels$/, '/');
    const rels = {};
    xmlNodes(doc, 'Relationship').forEach(rel => {
      rels[rel.getAttribute('Id')] = resolveZipPath(base, rel.getAttribute('Target') || '');
    });
    return rels;
  }

  function resolveZipPath(base, target) {
    if (!target || /^[a-z]+:/i.test(target)) return target || '';
    const stack = (target.startsWith('/') ? target.slice(1) : base + target).split('/');
    const out = [];
    stack.forEach(part => {
      if (!part || part === '.') return;
      if (part === '..') out.pop();
      else out.push(part);
    });
    return out.join('/');
  }

  function pxToEmu(value, totalPx, totalEmu) {
    return Math.round((Number(value) || 0) / totalPx * totalEmu);
  }

  function emuToPx(value, totalEmu, totalPx) {
    return Number(value || 0) / totalEmu * totalPx;
  }

  function pptxXfrm(node, slideCx, slideCy, context) {
    const xfrm = firstXml(node, 'xfrm');
    const off = xfrm ? firstXml(xfrm, 'off') : null;
    const ext = xfrm ? firstXml(xfrm, 'ext') : null;
    const x = Number(off?.getAttribute('x') || 0);
    const y = Number(off?.getAttribute('y') || 0);
    const w = Number(ext?.getAttribute('cx') || 2000000);
    const h = Number(ext?.getAttribute('cy') || 600000);
    if (context) {
      return {
        x: context.x + (x - context.chOffX) / context.chExtX * context.w,
        y: context.y + (y - context.chOffY) / context.chExtY * context.h,
        w: w / context.chExtX * context.w,
        h: h / context.chExtY * context.h,
        rotate: (context.rotate || 0) + Number(xfrm?.getAttribute('rot') || 0) / 60000
      };
    }
    return {
      x: emuToPx(x, slideCx, SLIDE_W),
      y: emuToPx(y, slideCy, SLIDE_H),
      w: emuToPx(w, slideCx, SLIDE_W),
      h: emuToPx(h, slideCy, SLIDE_H),
      rotate: Number(xfrm?.getAttribute('rot') || 0) / 60000
    };
  }

  function pptxGroupContext(group, slideCx, slideCy, parentContext) {
    const box = pptxXfrm(group, slideCx, slideCy, parentContext);
    const xfrm = firstXml(group, 'xfrm');
    const chOff = xfrm ? firstXml(xfrm, 'chOff') : null;
    const chExt = xfrm ? firstXml(xfrm, 'chExt') : null;
    return {
      x: box.x,
      y: box.y,
      w: box.w || 1,
      h: box.h || 1,
      chOffX: Number(chOff?.getAttribute('x') || 0),
      chOffY: Number(chOff?.getAttribute('y') || 0),
      chExtX: Number(chExt?.getAttribute('cx') || 1),
      chExtY: Number(chExt?.getAttribute('cy') || 1),
      rotate: box.rotate || 0
    };
  }

  function pptxTextFromShape(shape) {
    const txBody = firstXml(shape, 'txBody');
    const paragraphs = txBody ? xmlNodes(txBody, 'p') : [];
    return paragraphs.map(p => xmlNodes(p, 't').map(t => t.textContent || '').join('')).filter(Boolean).join('\n').trim();
  }

  function pptxShapeStyle(shape) {
    const rPr = firstXml(shape, 'rPr');
    const srgb = firstXml(shape, 'srgbClr');
    const pPr = firstXml(shape, 'pPr');
    const latin = firstXml(shape, 'latin');
    const typeface = latin?.getAttribute('typeface') || '';
    return {
      fontSize: rPr?.getAttribute('sz') ? Math.max(12, Math.round(Number(rPr.getAttribute('sz')) / 100)) : 30,
      bold: rPr?.getAttribute('b') === '1',
      italic: rPr?.getAttribute('i') === '1',
      color: srgb?.getAttribute('val') ? '#' + srgb.getAttribute('val') : '#1f2937',
      align: ({ ctr: 'center', r: 'right' }[pPr?.getAttribute('algn')]) || 'left',
      fontFamily: typeface ? '"' + typeface + '", "Arial Narrow", Inter, Arial, sans-serif' : '"Arial Narrow", Inter, Arial, sans-serif'
    };
  }

  function pptxBlipOpacity(node) {
    const alpha = firstXml(node, 'alphaModFix');
    if (!alpha?.getAttribute('amt')) return 1;
    return clamp(Number(alpha.getAttribute('amt')) / 100000, 0, 1);
  }

  function fitImportedTextElement(el, widthFactor, heightFactor) {
    const lines = String(el.text || '').split('\n').filter(Boolean);
    const longest = Math.max(1, ...lines.map(line => line.length));
    const byWidth = (el.w - 12) / (longest * (widthFactor || 0.74));
    const availableHeight = Math.max(12, Math.min(el.h, SLIDE_H - el.y - 6));
    const edgeHeightFactor = el.y > SLIDE_H * 0.88 ? Math.max(heightFactor || 1.08, 3) : (heightFactor || 1.08);
    const byHeight = (availableHeight - 12) / Math.max(1, lines.length) / edgeHeightFactor;
    el.fontSize = clamp(Math.floor(Math.min(el.fontSize || 30, byWidth, byHeight)), 10, 96);
    return el;
  }

  async function pptxImportChildren(zip, rels, slide, root, slideCx, slideCy, context, slideIndex, zStart) {
    let z = zStart;
    for (const node of Array.from(root?.children || [])) {
      if (node.localName === 'sp') {
        await pptxImportShape(zip, rels, slide, node, slideCx, slideCy, context, slideIndex * 1000 + z++);
      } else if (node.localName === 'pic') {
        await pptxImportPicture(zip, rels, slide, node, slideCx, slideCy, context, slideIndex * 1000 + z++);
      } else if (node.localName === 'grpSp') {
        z = await pptxImportChildren(zip, rels, slide, node, slideCx, slideCy, pptxGroupContext(node, slideCx, slideCy, context), slideIndex, z);
      }
    }
    return z;
  }

  async function pptxImportShape(zip, rels, slide, shape, slideCx, slideCy, context, z) {
    const text = pptxTextFromShape(shape);
    const box = pptxXfrm(shape, slideCx, slideCy, context);
    const blip = firstXml(shape, 'blip');
    const relId = blip?.getAttribute('r:embed') || blip?.getAttribute('embed');
    const mediaPath = rels[relId];
    const media = mediaPath ? zip.file(mediaPath) : null;
    if (media) {
      const ext = (mediaPath.split('.').pop() || 'png').toLowerCase();
      slide.elements.push(Object.assign(textElement('', box.x, box.y, box.w, box.h, 24), {
        type: 'image',
        src: 'data:' + imageMime(ext) + ';base64,' + await media.async('base64'),
        alt: 'Imported PPTX image',
        fill: 'transparent',
        fit: 'cover',
        opacity: pptxBlipOpacity(blip),
        rotate: box.rotate,
        z
      }));
    }
    if (text) {
      const style = pptxShapeStyle(shape);
      const el = Object.assign(textElement(text, box.x, box.y, box.w, box.h, style.fontSize, style.bold, style.color), {
        italic: style.italic,
        align: style.align,
        fontFamily: style.fontFamily,
        rotate: box.rotate,
        z: z + 250
      });
      slide.elements.push(fitImportedTextElement(el));
      if (/^Slide \d+$/.test(slide.title)) slide.title = text.split('\n')[0].slice(0, 80);
    } else if (!media) {
      const fill = pptxShapeFill(shape);
      if (fill && !firstXml(shape, 'ph')) {
        const el = shapeElement(box.x, box.y, box.w, box.h, '');
        el.fill = fill;
        el.color = 'transparent';
        el.rotate = box.rotate;
        el.z = z;
        slide.elements.push(el);
      }
    }
  }

  async function pptxImportPicture(zip, rels, slide, pic, slideCx, slideCy, context, z) {
    const blip = firstXml(pic, 'blip');
    const relId = blip?.getAttribute('r:embed') || blip?.getAttribute('embed');
    const mediaPath = rels[relId];
    const media = mediaPath ? zip.file(mediaPath) : null;
    if (!media) return;
    const ext = (mediaPath.split('.').pop() || 'png').toLowerCase();
    const box = pptxXfrm(pic, slideCx, slideCy, context);
    slide.elements.push(Object.assign(textElement('', box.x, box.y, box.w, box.h, 24), {
      type: 'image',
      src: 'data:' + imageMime(ext) + ';base64,' + await media.async('base64'),
      alt: 'Imported PPTX image',
      fill: 'transparent',
      fit: 'cover',
      opacity: pptxBlipOpacity(blip),
      rotate: box.rotate,
      z
    }));
  }

  async function pptxToDeck(buffer, fileName) {
    const JSZip = requireZip();
    const zip = await JSZip.loadAsync(buffer);
    const presXml = await zip.file('ppt/presentation.xml')?.async('text');
    if (!presXml) throw new Error('No PPTX presentation.xml found.');
    const pres = xmlDoc(presXml);
    const size = firstXml(pres, 'sldSz');
    const slideCx = Number(size?.getAttribute('cx')) || 12192000;
    const slideCy = Number(size?.getAttribute('cy')) || 6858000;
    const presRels = await readRels(zip, 'ppt/_rels/presentation.xml.rels');
    const slidePaths = xmlNodes(pres, 'sldId').map(node => presRels[node.getAttribute('r:id')]).filter(Boolean);
    const slides = [];
    for (const [index, slidePath] of slidePaths.entries()) {
      const xml = await zip.file(slidePath)?.async('text');
      if (!xml) continue;
      const doc = xmlDoc(xml);
      const rels = await readRels(zip, relsPathFor(slidePath));
      const slide = {
        id: uid('slide'),
        title: 'Slide ' + (index + 1),
        notes: '',
        bg: 'light',
        footer: false,
        elements: []
      };
      const bgClr = firstXml(firstXml(doc, 'bgPr') || doc, 'srgbClr');
      if (bgClr?.getAttribute('val')) slide.backgroundColor = '#' + bgClr.getAttribute('val');
      const spTree = firstXml(doc, 'spTree') || doc;
      await pptxImportChildren(zip, rels, slide, spTree, slideCx, slideCy, null, index, 0);
      slides.push(slide);
    }
    return {
      version: 1,
      title: (fileName || 'Imported PowerPoint').replace(/\.[^.]+$/, ''),
      theme: 'violet',
      footer: 'ShowSplat™ by DrawSplat™',
      slides: slides.length ? slides : defaultDeck().slides
    };
  }

  function pptxShapeFill(shape) {
    const spPr = firstXml(shape, 'spPr') || shape;
    const solid = firstXml(spPr, 'solidFill');
    const srgb = solid ? firstXml(solid, 'srgbClr') : null;
    if (srgb?.getAttribute('val')) return '#' + srgb.getAttribute('val');
    return '';
  }

  async function exportPptx() {
    try {
      const blob = await buildPptx();
      downloadBlob(safeFileName(deck.title, 'showsplat') + '.pptx', blob);
      setStatus('Exported PowerPoint.');
    } catch (err) {
      console.warn(err);
      setStatus('Could not export PowerPoint.');
    }
  }

  async function buildPptx() {
    const JSZip = requireZip();
    const zip = new JSZip();
    const exportSlides = deck.slides.filter(slide => !slide.hidden);
    const media = [];
    const slideCx = 12192000;
    const slideCy = 6858000;
    zip.file('[Content_Types].xml', pptxContentTypes(exportSlides.length, media));
    zip.folder('_rels').file('.rels', relsXml([{ id: 'rId1', type: 'officeDocument', target: 'ppt/presentation.xml' }]));
    zip.folder('ppt').file('presentation.xml', pptxPresentationXml(exportSlides.length, slideCx, slideCy));
    zip.folder('ppt').folder('_rels').file('presentation.xml.rels', relsXml(exportSlides.map((_, i) => ({ id: 'rId' + (i + 1), type: 'slide', target: 'slides/slide' + (i + 1) + '.xml' }))));
    zip.folder('ppt').file('presProps.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentationPr xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>');
    zip.folder('ppt').file('viewProps.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:viewPr xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>');
    zip.folder('ppt').file('tableStyles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>');
    for (const [i, slide] of exportSlides.entries()) {
      const slideMedia = [];
      const slideXml = await pptxSlideXml(slide, i + 1, slideCx, slideCy, slideMedia);
      zip.folder('ppt').folder('slides').file('slide' + (i + 1) + '.xml', slideXml);
      zip.folder('ppt').folder('slides').folder('_rels').file('slide' + (i + 1) + '.xml.rels', relsXml(slideMedia.map((item, index) => ({ id: item.rId, type: 'image', target: '../media/' + item.name }))));
      slideMedia.forEach(item => {
        media.push(item);
        zip.folder('ppt').folder('media').file(item.name, item.bytes, { base64: true });
      });
    }
    zip.file('[Content_Types].xml', pptxContentTypes(exportSlides.length, media));
    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  }

  function pptxContentTypes(slideCount, media) {
    const defaults = '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
      Array.from(new Set(media.map(item => item.ext))).map(ext => '<Default Extension="' + ext + '" ContentType="' + imageMime(ext) + '"/>').join('');
    const slides = Array.from({ length: slideCount }, (_, i) => '<Override PartName="/ppt/slides/slide' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>').join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' + defaults + '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/><Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/><Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>' + slides + '</Types>';
  }

  function relsXml(items) {
    const typeBase = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + items.map(item => '<Relationship Id="' + item.id + '" Type="' + typeBase + item.type + '" Target="' + item.target + '"/>').join('') + '</Relationships>';
  }

  function pptxPresentationXml(count, cx, cy) {
    const ids = Array.from({ length: count }, (_, i) => '<p:sldId id="' + (256 + i) + '" r:id="rId' + (i + 1) + '"/>').join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldIdLst>' + ids + '</p:sldIdLst><p:sldSz cx="' + cx + '" cy="' + cy + '" type="wide"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>';
  }

  async function pptxSlideXml(slide, slideNumber, slideCx, slideCy, slideMedia) {
    const bg = colorNoHash(slide.backgroundColor || '#ffffff');
    let id = 2;
    const shapes = [];
    for (const el of slide.elements.slice().sort((a, b) => (a.z || 0) - (b.z || 0))) {
      if (['text', 'list', 'link', 'shape'].includes(el.type)) shapes.push(pptxTextShape(el, id++, slideCx, slideCy));
      if (el.type === 'image' && el.src) {
        const media = dataUrlParts(el.src);
        if (!media) continue;
        const ext = media.ext;
        const name = 'image' + (slideMedia.length + 1) + '-' + slideNumber + '.' + ext;
        const rId = 'rId' + (slideMedia.length + 1);
        slideMedia.push({ rId, name, ext, bytes: media.base64 });
        shapes.push(pptxPicture(el, id++, rId, slideCx, slideCy));
      }
    }
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="' + bg + '"/></a:solidFill></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>' + shapes.join('') + '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
  }

  function pptxTextShape(el, id, slideCx, slideCy) {
    const off = 'x="' + pxToEmu(el.x, SLIDE_W, slideCx) + '" y="' + pxToEmu(el.y, SLIDE_H, slideCy) + '"';
    const ext = 'cx="' + pxToEmu(el.w, SLIDE_W, slideCx) + '" cy="' + pxToEmu(el.h, SLIDE_H, slideCy) + '"';
    const paragraphs = String(el.type === 'list' ? el.text : el.text || '').split('\n').filter(line => line.length || el.type !== 'list').map(line => {
      const body = el.type === 'list' ? '• ' + line.replace(/^[-*]\s*/, '') : line;
      return '<a:p><a:pPr algn="' + ({ center: 'ctr', right: 'r' }[el.align] || 'l') + '"/><a:r><a:rPr lang="en-US" sz="' + Math.round((el.fontSize || 30) * 100) + '" b="' + (el.bold ? '1' : '0') + '" i="' + (el.italic ? '1' : '0') + '"><a:solidFill><a:srgbClr val="' + colorNoHash(el.color || '#1f2937') + '"/></a:solidFill></a:rPr><a:t>' + xmlText(body) + '</a:t></a:r></a:p>';
    }).join('') || '<a:p/>';
    return '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="TextBox ' + id + '"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off ' + off + '/><a:ext ' + ext + '/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>' + paragraphs + '</p:txBody></p:sp>';
  }

  function pptxPicture(el, id, rId, slideCx, slideCy) {
    const off = 'x="' + pxToEmu(el.x, SLIDE_W, slideCx) + '" y="' + pxToEmu(el.y, SLIDE_H, slideCy) + '"';
    const ext = 'cx="' + pxToEmu(el.w, SLIDE_W, slideCx) + '" cy="' + pxToEmu(el.h, SLIDE_H, slideCy) + '"';
    return '<p:pic><p:nvPicPr><p:cNvPr id="' + id + '" name="' + xmlAttr(el.alt || 'Image') + '"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="' + rId + '"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off ' + off + '/><a:ext ' + ext + '/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>';
  }

  async function odpToDeck(buffer, fileName) {
    const JSZip = requireZip();
    const zip = await JSZip.loadAsync(buffer);
    const content = await zip.file('content.xml')?.async('text');
    if (!content) throw new Error('No ODP content.xml found.');
    const doc = xmlDoc(content);
    const stylesText = await zip.file('styles.xml')?.async('text').catch(() => '');
    const stylesDoc = stylesText ? xmlDoc(stylesText) : null;
    const odpStyles = parseOdpStyles(stylesDoc, doc);
    const pages = xmlNodes(doc, 'page');
    const slides = [];
    for (const [index, page] of pages.entries()) {
      const masterName = page.getAttribute('draw:master-page-name') || '';
      const pageSize = odpPageSize(stylesDoc, masterName);
      const slide = {
        id: uid('slide'),
        title: page.getAttribute('draw:name') || 'Slide ' + (index + 1),
        notes: '',
        bg: 'light',
        footer: false,
        elements: []
      };
      const bg = page.getAttribute('draw:style-name') || '';
      if (bg) slide.backgroundColor = '#ffffff';
      slide.elements.push(...odpMasterElements(stylesDoc, odpStyles, masterName, pageSize, index));
      for (const [shapeIndex, shape] of xmlNodes(page, 'custom-shape').entries()) {
        if (isInsideXml(shape, 'notes')) continue;
        await odpAddShapeElement(zip, slide, shape, odpStyles, pageSize, index * 1000 + shapeIndex);
      }
      for (const [frameIndex, frame] of xmlNodes(page, 'frame').entries()) {
        if (isInsideXml(frame, 'notes')) continue;
        const box = odpBox(frame, pageSize);
        const image = firstXml(frame, 'image');
        if (image) {
          const href = image.getAttribute('xlink:href') || image.getAttribute('href');
          const media = href ? zip.file(href.replace(/^\.\//, '')) : null;
          if (!media) continue;
          const ext = (href.split('.').pop() || 'png').toLowerCase();
          const src = 'data:' + imageMime(ext) + ';base64,' + await media.async('base64');
          slide.elements.push(Object.assign(textElement('', box.x, box.y, box.w, box.h, 24), {
            type: 'image',
            src,
            alt: 'Imported ODP image',
            fill: 'transparent',
            z: index * 1000 + frameIndex
          }));
          continue;
        }
        const text = xmlNodes(frame, 'p').map(p => p.textContent || '').filter(Boolean).join('\n').trim();
        if (text) {
          slide.elements.push(Object.assign(textElement(text, box.x, box.y, box.w, box.h, 30), { z: index * 1000 + frameIndex }));
          if (slide.title === 'Slide ' + (index + 1)) slide.title = text.split('\n')[0].slice(0, 80);
        }
      }
      slides.push(slide);
    }
    return {
      version: 1,
      title: (fileName || 'Imported ODP').replace(/\.[^.]+$/, ''),
      theme: 'violet',
      footer: 'ShowSplat™ by DrawSplat™',
      slides: slides.length ? slides : defaultDeck().slides
    };
  }

  function parseOdpStyles(...styleDocs) {
    const styles = { graphic: {}, gradients: {}, fillImages: {}, text: {} };
    styleDocs.filter(Boolean).forEach(stylesDoc => {
      xmlNodes(stylesDoc, 'fill-image').forEach(fillImage => {
        const name = fillImage.getAttribute('draw:name') || fillImage.getAttribute('name');
        const href = fillImage.getAttribute('xlink:href') || fillImage.getAttribute('href');
        if (name && href) styles.fillImages[name] = href.replace(/^\.\//, '');
      });
      xmlNodes(stylesDoc, 'gradient').forEach(gradient => {
        const name = gradient.getAttribute('draw:name') || gradient.getAttribute('name');
        if (!name) return;
        styles.gradients[name] = {
          start: gradient.getAttribute('draw:start-color') || gradient.getAttribute('start-color') || '',
          end: gradient.getAttribute('draw:end-color') || gradient.getAttribute('end-color') || ''
        };
      });
      xmlNodes(stylesDoc, 'style').forEach(style => {
        const name = style.getAttribute('style:name') || style.getAttribute('name');
        if (!name) return;
        if (style.getAttribute('style:family') === 'graphic') {
          const props = firstXml(style, 'graphic-properties');
          styles.graphic[name] = {
            parent: style.getAttribute('style:parent-style-name') || '',
            fill: props?.getAttribute('draw:fill') || '',
            fillColor: props?.getAttribute('draw:fill-color') || '',
            fillImage: props?.getAttribute('draw:fill-image-name') || '',
            gradient: props?.getAttribute('draw:fill-gradient-name') || '',
            opacity: odpPercent(props?.getAttribute('draw:opacity'), 1),
            stroke: props?.getAttribute('svg:stroke-color') || ''
          };
        }
        if (style.getAttribute('style:family') === 'text') {
          const props = firstXml(style, 'text-properties');
          styles.text[name] = {
            fontSize: odpCssLength(props?.getAttribute('fo:font-size')),
            color: props?.getAttribute('fo:color') || '',
            bold: props?.getAttribute('fo:font-weight') === 'bold',
            italic: props?.getAttribute('fo:font-style') === 'italic',
            fontFamily: props?.getAttribute('style:font-name') || ''
          };
        }
      });
    });
    return styles;
  }

  function resolveOdpGraphicStyle(styles, name, seen) {
    if (!name || !styles.graphic[name] || (seen || []).includes(name)) return {};
    const style = styles.graphic[name];
    const parent = resolveOdpGraphicStyle(styles, style.parent, (seen || []).concat(name));
    return Object.assign({}, parent, Object.fromEntries(Object.entries(style).filter(([, value]) => value)));
  }

  function odpStyleFill(styles, name) {
    const style = resolveOdpGraphicStyle(styles, name);
    if (style.fill === 'none') return 'transparent';
    if (style.fillColor) return style.fillColor;
    if (style.gradient && styles.gradients[style.gradient]) {
      return styles.gradients[style.gradient].start || styles.gradients[style.gradient].end || '#e5e7eb';
    }
    return style.stroke || '#e5e7eb';
  }

  function odpStyleImage(styles, name) {
    const style = resolveOdpGraphicStyle(styles, name);
    if (!style.fillImage || style.opacity <= 0) return '';
    return styles.fillImages[style.fillImage] || '';
  }

  function odpStyleOpacity(styles, name) {
    const style = resolveOdpGraphicStyle(styles, name);
    return style.opacity ?? 1;
  }

  async function odpAddShapeElement(zip, slide, shape, styles, pageSize, z) {
    const box = odpBox(shape, pageSize);
    const styleName = shape.getAttribute('draw:style-name') || shape.getAttribute('presentation:style-name') || '';
    const imagePath = odpStyleImage(styles, styleName);
    if (imagePath) {
      const media = zip.file(imagePath);
      if (media) {
        const ext = (imagePath.split('.').pop() || 'png').toLowerCase();
        slide.elements.push(Object.assign(textElement('', box.x, box.y, box.w, box.h, 24), {
          type: 'image',
          src: 'data:' + imageMime(ext) + ';base64,' + await media.async('base64'),
          alt: shape.getAttribute('draw:name') || 'Imported ODP image',
          fill: 'transparent',
          fit: 'cover',
          opacity: odpStyleOpacity(styles, styleName),
          z
        }));
      }
    }
    const text = xmlNodes(shape, 'p').map(p => (p.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n').trim();
    if (text) {
      const spanStyle = firstXml(shape, 'span')?.getAttribute('text:style-name') || '';
      const textStyle = styles.text[spanStyle] || {};
      const el = textElement(text, box.x, box.y, box.w, box.h, textStyle.fontSize || 30, textStyle.bold, textStyle.color || undefined);
      el.italic = Boolean(textStyle.italic);
      if (textStyle.fontFamily) el.fontFamily = '"' + textStyle.fontFamily + '", Inter, Arial, sans-serif';
      el.z = z + 250;
      slide.elements.push(fitImportedTextElement(el, 1.25, 1.7));
      if (/^Slide \d+$/.test(slide.title) || /^page\d+$/i.test(slide.title)) slide.title = text.split('\n')[0].slice(0, 80);
      return;
    }
    if (!imagePath) {
      const fill = odpStyleFill(styles, styleName);
      if (fill && fill !== 'transparent') {
        const el = shapeElement(box.x, box.y, box.w, box.h, '');
        el.fill = fill;
        el.color = 'transparent';
        el.z = z;
        slide.elements.push(el);
      }
    }
  }

  function odpMasterElements(stylesDoc, styles, masterName, pageSize, slideIndex) {
    const master = odpMasterPage(stylesDoc, masterName);
    if (!master) return [];
    return Array.from(master.children || []).flatMap((node, nodeIndex) => {
      if (!['custom-shape', 'rect'].includes(node.localName)) return [];
      const box = odpBox(node, pageSize);
      const styleName = node.getAttribute('draw:style-name') || node.getAttribute('presentation:style-name') || '';
      const text = xmlNodes(node, 'p').map(p => p.textContent || '').filter(Boolean).join('\n').trim();
      const el = shapeElement(box.x, box.y, box.w, box.h, text);
      el.fill = odpStyleFill(styles, styleName);
      el.color = text ? '#1f2937' : 'transparent';
      el.z = slideIndex * 1000 - 200 + nodeIndex;
      return [el];
    });
  }

  function odpMasterPage(stylesDoc, masterName) {
    if (!stylesDoc || !masterName) return null;
    return xmlNodes(stylesDoc, 'master-page').find(master => (master.getAttribute('style:name') || master.getAttribute('name')) === masterName) || null;
  }

  function odpPageSize(stylesDoc, masterName) {
    const fallback = { wIn: 13.333333, hIn: 7.5 };
    const master = odpMasterPage(stylesDoc, masterName);
    const layoutName = master?.getAttribute('style:page-layout-name') || '';
    if (!stylesDoc || !layoutName) return fallback;
    const layout = xmlNodes(stylesDoc, 'page-layout').find(item => (item.getAttribute('style:name') || item.getAttribute('name')) === layoutName);
    const props = layout ? firstXml(layout, 'page-layout-properties') : null;
    const wIn = odpLengthToIn(props?.getAttribute('fo:page-width'));
    const hIn = odpLengthToIn(props?.getAttribute('fo:page-height'));
    return wIn && hIn ? { wIn, hIn } : fallback;
  }

  function isInsideXml(node, localName) {
    for (let current = node.parentNode; current; current = current.parentNode) {
      if (current.localName === localName) return true;
    }
    return false;
  }

  function odpBox(frame, pageSize) {
    return {
      x: odpLength(frame.getAttribute('svg:x'), SLIDE_W, pageSize?.wIn),
      y: odpLength(frame.getAttribute('svg:y'), SLIDE_H, pageSize?.hIn),
      w: odpLength(frame.getAttribute('svg:width'), SLIDE_W, pageSize?.wIn) || 500,
      h: odpLength(frame.getAttribute('svg:height'), SLIDE_H, pageSize?.hIn) || 160
    };
  }

  function odpLength(value, totalPx, pageIn) {
    const inches = odpLengthToIn(value);
    if (inches && pageIn) return inches / pageIn * totalPx;
    if (inches) return inches / 13.333333 * totalPx;
    return parseFloat(String(value || '').trim()) || 0;
  }

  function odpLengthToIn(value) {
    const text = String(value || '').trim();
    const num = parseFloat(text) || 0;
    if (!num) return 0;
    if (text.endsWith('in')) return num;
    if (text.endsWith('cm')) return num / 2.54;
    if (text.endsWith('mm')) return num / 25.4;
    if (text.endsWith('pt')) return num / 72;
    return 0;
  }

  function odpCssLength(value) {
    const text = String(value || '').trim();
    const num = parseFloat(text) || 0;
    if (!num) return 0;
    if (text.endsWith('pt')) return Math.round(num * 96 / 72);
    if (text.endsWith('in')) return Math.round(num * 96);
    if (text.endsWith('cm')) return Math.round(num / 2.54 * 96);
    if (text.endsWith('mm')) return Math.round(num / 25.4 * 96);
    return Math.round(num);
  }

  function odpPercent(value, fallback) {
    const text = String(value || '').trim();
    if (!text) return fallback;
    const num = parseFloat(text);
    if (!Number.isFinite(num)) return fallback;
    return text.endsWith('%') ? num / 100 : num;
  }

  function pxToIn(value, totalPx) {
    return ((Number(value) || 0) / totalPx * 13.333333).toFixed(4) + 'in';
  }

  async function exportOdp() {
    try {
      const blob = await buildOdp();
      downloadBlob(safeFileName(deck.title, 'showsplat') + '.odp', blob);
      setStatus('Exported ODP.');
    } catch (err) {
      console.warn(err);
      setStatus('Could not export ODP.');
    }
  }

  async function buildOdp() {
    const JSZip = requireZip();
    const zip = new JSZip();
    const exportSlides = deck.slides.filter(slide => !slide.hidden);
    const media = [];
    const pages = [];
    for (const [slideIndex, slide] of exportSlides.entries()) {
      const frames = [];
      for (const [elementIndex, el] of slide.elements.slice().sort((a, b) => (a.z || 0) - (b.z || 0)).entries()) {
        if (['text', 'list', 'link', 'shape'].includes(el.type)) {
          frames.push(odpTextFrame(el, slideIndex, elementIndex));
        }
        if (el.type === 'image' && el.src) {
          const part = dataUrlParts(el.src);
          if (!part) continue;
          const name = 'Pictures/image' + (media.length + 1) + '.' + part.ext;
          media.push({ name, ext: part.ext, bytes: part.base64 });
          frames.push(odpImageFrame(el, slideIndex, elementIndex, name));
        }
      }
      pages.push('<draw:page draw:name="' + xmlAttr(slide.title || 'Slide ' + (slideIndex + 1)) + '" draw:style-name="dp1" draw:master-page-name="Default">' + frames.join('') + '</draw:page>');
    }
    zip.file('mimetype', 'application/vnd.oasis.opendocument.presentation', { compression: 'STORE' });
    zip.folder('META-INF').file('manifest.xml', odpManifest(media));
    zip.file('content.xml', odpContentXml(pages.join('')));
    zip.file('styles.xml', '<?xml version="1.0" encoding="UTF-8"?><office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" office:version="1.2"><office:styles/><office:automatic-styles/><office:master-styles><style:master-page xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" style:name="Default"/></office:master-styles></office:document-styles>');
    media.forEach(item => zip.file(item.name, item.bytes, { base64: true }));
    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.oasis.opendocument.presentation' });
  }

  function odpContentXml(pages) {
    return '<?xml version="1.0" encoding="UTF-8"?><office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:presentation="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" office:version="1.2"><office:automatic-styles><style:style style:name="dp1" style:family="drawing-page"/></office:automatic-styles><office:body><office:presentation>' + pages + '</office:presentation></office:body></office:document-content>';
  }

  function odpManifest(media) {
    return '<?xml version="1.0" encoding="UTF-8"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"><manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.presentation"/><manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/><manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>' + media.map(item => '<manifest:file-entry manifest:full-path="' + xmlAttr(item.name) + '" manifest:media-type="' + imageMime(item.ext) + '"/>').join('') + '</manifest:manifest>';
  }

  function odpTextFrame(el, slideIndex, elementIndex) {
    const paras = String(el.type === 'list' ? el.text : el.text || '').split('\n').map(line => '<text:p>' + xmlText(el.type === 'list' ? line.replace(/^[-*]\s*/, '') : line) + '</text:p>').join('');
    return '<draw:frame draw:name="Text ' + slideIndex + '-' + elementIndex + '" svg:x="' + pxToIn(el.x, SLIDE_W) + '" svg:y="' + pxToIn(el.y, SLIDE_H) + '" svg:width="' + pxToIn(el.w, SLIDE_W) + '" svg:height="' + pxToIn(el.h, SLIDE_H) + '"><draw:text-box>' + (paras || '<text:p/>') + '</draw:text-box></draw:frame>';
  }

  function odpImageFrame(el, slideIndex, elementIndex, href) {
    return '<draw:frame draw:name="Image ' + slideIndex + '-' + elementIndex + '" svg:x="' + pxToIn(el.x, SLIDE_W) + '" svg:y="' + pxToIn(el.y, SLIDE_H) + '" svg:width="' + pxToIn(el.w, SLIDE_W) + '" svg:height="' + pxToIn(el.h, SLIDE_H) + '"><draw:image xlink:href="' + xmlAttr(href) + '" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/></draw:frame>';
  }

  function importedCssForDeck() {
    const seen = new Set();
    const css = deck.slides.map(slide => slide.importedCss || '').filter(css => {
      if (!css || seen.has(css)) return false;
      seen.add(css);
      return true;
    });
    return css.length ? css.map(scopeImportedCss).join('\n') : '';
  }

  function scopeImportedCss(css) {
    // Scope every imported WebDeck rule under `.imported-webdeck-slide`. The old
    // implementation used a naive split('}') which desynced on nested at-rules
    // (@media/@keyframes) and comments, leaving rules like `.slide.cover`
    // un-scoped so imported dark cover slides lost their background. This walks
    // the CSS tracking brace depth (comments stripped first) and drops at-rule
    // blocks entirely: @media queries key off the browser window, not the fixed
    // slide, so they'd fire wrongly inside the scaled object; @keyframes/@print
    // aren't needed for a static slide (ShowSplat neutralizes the imported
    // `.slide` box model itself — see .imported-webdeck-slide in styles.css).
    const src = String(css || '').replace(/\/\*[\s\S]*?\*\//g, '');
    const scopeSelector = (selector) => selector.split(',').map(part => {
      const trimmed = part.trim();
      if (!trimmed || /^(html|body|#deck|\.navbar|\.progress|\.notes-panel|\.help-panel|\.presenter)/.test(trimmed)) return '';
      if (trimmed === ':root') return '.imported-webdeck-slide';
      if (/^\.slide(?:[.:#\s]|$)/.test(trimmed)) return trimmed.replace(/^\.slide/, '.imported-webdeck-slide');
      return '.imported-webdeck-slide ' + trimmed;
    }).filter(Boolean).join(',');
    const out = [];
    let i = 0;
    const n = src.length;
    while (i < n) {
      const start = i;
      while (i < n && src[i] !== '{' && src[i] !== '}') i += 1;
      if (i >= n) break;
      if (src[i] === '}') { i += 1; continue; }
      const prelude = src.slice(start, i).trim();
      let depth = 0;
      const bodyStart = i;
      do {
        if (src[i] === '{') depth += 1;
        else if (src[i] === '}') depth -= 1;
        i += 1;
      } while (i < n && depth > 0);
      if (prelude.startsWith('@')) continue;
      const scoped = scopeSelector(prelude);
      if (scoped) out.push(scoped + '{' + src.slice(bodyStart + 1, i - 1).trim() + '}');
    }
    return out.join('\n');
  }

  function exportMarkdown() {
    return deck.slides.map(slide => {
      const lines = ['# ' + slide.title, ''];
      slide.elements.forEach(el => {
        if (el.type === 'list') String(el.text || '').split('\n').filter(Boolean).forEach(item => lines.push('- ' + item));
        if (el.type === 'text') lines.push(String(el.text || ''));
        if (el.type === 'html') lines.push(htmlToText(el.html || ''));
        if (el.type === 'image') lines.push('![image](' + (el.src || '') + ')');
        if (el.type === 'youtube' || el.type === 'video') lines.push('[Video](' + (el.src || '') + ')');
      });
      if (slide.notes) lines.push('', 'Notes:', slide.notes);
      return lines.join('\n').trim();
    }).join('\n\n---\n\n');
  }

  async function exportWebDeck() {
    const password = prompt('Optional WebDeck password. Leave blank for no password. This is a convenience prompt, not encryption.');
    const passwordHash = password ? await sha256(password) : '';
    download(deck.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() + '.webdeck.html', buildWebDeck(passwordHash), 'text/html');
  }

  // Exports a self-contained WebDeck using the reference framework (Appendix A CSS
  // + Appendix B JS) so every deck ships the standard seven-control toolbar,
  // slide-up notes, and two-monitor presenter view. ShowSplat renders its own
  // positioned slide objects inside each slide's .ss-stage.
  function buildWebDeck(passwordHash) {
    const fw = window.WEBDECK_FRAMEWORK || { css: '', js: '' };
    const exportSlides = deck.slides.filter(slide => !slide.hidden);
    const sections = exportSlides.map((slide, index) => buildFrameworkSlide(slide, index, exportSlides.length)).join('');
    const globalAudio = deck.globalAudio?.src ? '<audio class="global-audio no-advance" src="' + escapeAttr(deck.globalAudio.src) + '" controls loop preload="metadata"></audio>' : '';
    const fontLink = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Libre+Franklin:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">';
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escapeHtml(deck.title) + '</title>' + fontLink + '<style>' +
      fw.css + showSplatObjectCss() + webDeckPasswordCss() + importedCssForDeck() +
      '</style></head><body data-locked="' + (passwordHash ? 'true' : 'false') + '"><div id="lock"></div><div class="deck">' + sections + '</div>' + globalAudio +
      '<script>' + webDeckPasswordJs(passwordHash) + fw.js + '<\/script></body></html>';
  }

  function buildFrameworkSlide(slide, index, total) {
    const theme = getDeckTheme();
    const bg = frameworkSlideBackground(slide, theme);
    const current = index === 0 ? ' current' : '';
    const title = escapeHtml(slide.title || 'Slide ' + (index + 1));
    const stage = '<div class="ss-stage">' + slideToWebDeckHtml(slide, index, total) + '</div>';
    const notes = '<div class="notes"><p>' + escapeHtml(slide.notes || '') + '</p></div>';
    return '<section class="slide' + current + '" data-title="' + escapeAttr(slide.title || '') + '" style="' + bg + '"><h2 class="sr-only">' + title + '</h2>' + stage + notes + '</section>';
  }

  function frameworkSlideBackground(slide, theme) {
    if (slide.bg === 'section') return 'background:linear-gradient(135deg,' + theme.dark + ',' + theme.accent + ');color:' + (slide.defaultTextColor || '#ffffff') + ';';
    if (slide.bg === 'dark') return 'background:' + (slide.backgroundColor || theme.dark) + ';color:' + (slide.defaultTextColor || '#ffffff') + ';';
    return 'background:' + (slide.backgroundColor || '#ffffff') + ';color:' + (slide.defaultTextColor || '#1f2937') + ';';
  }

  // ShowSplat's positioned-object layer, layered on top of the framework slide.
  function showSplatObjectCss() {
    return [
      '.slide .ss-stage{position:absolute;inset:0;z-index:1;}',
      '.slide .obj{position:absolute;overflow:hidden;padding:8px;line-height:1.18;}',
      '.slide .obj img,.slide .obj video,.slide .obj iframe{width:100%;height:100%;object-fit:contain;border:0;display:block;}',
      '.slide .obj ul{margin:0;padding-left:1.1em;}',
      '.slide .obj table{width:100%;height:100%;border-collapse:collapse;table-layout:fixed;}',
      '.slide .obj td{border:1px solid #c7d2fe;padding:6px;vertical-align:top;}',
      // Neutralize the imported .slide box model in exports too — the source
      // decks keep slides display:none/absolute and rely on a @media print rule
      // that scopeImportedCss now drops, so force the wrapper visible and static.
      '.slide .imported-webdeck-slide{background:transparent;display:flex!important;flex-direction:column!important;position:relative!important;inset:auto!important;width:100%;height:100%;}',
      '.slide .footer{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;align-items:center;padding:9px 22px;font-weight:800;font-family:Inter,Arial,sans-serif;z-index:2;}',
      '.slide .slide-audio{position:absolute;right:20px;bottom:54px;display:grid;gap:6px;z-index:3;}.slide .slide-audio audio{width:260px;}',
      '.global-audio{position:fixed;left:18px;bottom:18px;z-index:65;width:240px;}',
      '.deck.reflow .slide{background:var(--paper);}',
      '.deck.reflow .slide .ss-stage{position:relative;inset:auto;min-height:60vh;}',
      '.deck.reflow .slide .obj{position:relative!important;left:auto!important;top:auto!important;width:auto!important;height:auto!important;transform:none!important;margin:0 0 14px;font-size:max(18px,.8em)!important;}',
      '.deck.reflow .slide .obj img{height:auto!important;}',
      '.deck.reflow .slide .footer{position:relative;margin-top:auto;}',
      '.deck.reflow .global-audio{display:none;}',
      '@media print{.slide .obj{overflow:visible;}}'
    ].join('');
  }

  function webDeckPasswordCss() {
    return '#lock{position:fixed;inset:0;z-index:200;display:none;place-items:center;padding:24px;text-align:center;background:#0b1d33;color:#fff;font:600 20px/1.5 system-ui,sans-serif;}body.locked #lock{display:grid;}body.locked .deck{filter:blur(10px);}';
  }

  function webDeckPasswordJs(passwordHash) {
    if (!passwordHash) return '';
    return '(async function(){var HASH="' + passwordHash + '";if(/[?&]presenter=1/.test(location.search))return;' +
      'function sha(s){return crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)).then(function(b){return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,"0")}).join("")})}' +
      'document.body.classList.add("locked");var lock=document.getElementById("lock");var p=prompt("Password");' +
      'if(p!=null&&await sha(p)===HASH)document.body.classList.remove("locked");else if(lock)lock.textContent="Password required. Reload to try again.";})();';
  }

  function slideToWebDeckHtml(slide, index, totalSlides) {
    const parts = onSlideElements(slide).slice().sort((a, b) => (a.z || 0) - (b.z || 0)).map(el => {
      const style = 'left:' + (el.x / SLIDE_W * 100) + '%;top:' + (el.y / SLIDE_H * 100) + '%;width:' + (el.w / SLIDE_W * 100) + '%;height:' + (el.h / SLIDE_H * 100) + '%;font-family:' + escapeAttr(el.fontFamily || 'Inter,Arial,sans-serif') + ';font-size:' + (el.fontSize || 30) + 'px;font-weight:' + (el.bold ? '900' : '600') + ';font-style:' + (el.italic ? 'italic' : 'normal') + ';text-decoration:' + (el.underline ? 'underline' : 'none') + ';color:' + escapeAttr(el.color || slide.defaultTextColor || '#1f2937') + ';background:' + escapeAttr(el.fill || 'transparent') + ';text-align:' + escapeAttr(el.align || 'left') + ';transform:rotate(' + (Number(el.rotate) || 0) + 'deg);transform-origin:center center;';
      if (el.type === 'image') return '<div class="obj" style="' + style + '"><img src="' + escapeAttr(el.src || '') + '" alt="' + escapeAttr(el.alt || '') + '" style="object-fit:' + escapeAttr(el.fit || 'contain') + ';object-position:' + (el.cropX ?? 50) + '% ' + (el.cropY ?? 50) + '%"></div>';
      if (el.type === 'youtube') return '<div class="obj no-advance" style="' + style + '"><iframe src="' + escapeAttr(el.src || '') + '" title="' + escapeAttr(el.title || 'YouTube video') + '" allowfullscreen></iframe></div>';
      if (el.type === 'video') return '<div class="obj no-advance" style="' + style + '"><video src="' + escapeAttr(el.src || '') + '" controls></video></div>';
      if (el.type === 'audio') return '<div class="obj no-advance" style="' + style + '"><audio src="' + escapeAttr(el.src || '') + '" controls></audio></div>';
      if (el.type === 'table') return '<div class="obj table no-advance" style="' + style + '">' + tableHtml(el) + '</div>';
      if (el.type === 'html') {
        const scale = clamp(Number(el.importScale) || 1, 0.1, 1);
        const scaleStyle = 'transform-origin:top left;transform:scale(' + scale + ');width:' + (100 / scale) + '%;height:' + (100 / scale) + '%;';
        return '<div class="obj html no-advance" style="' + style + '"><div class="imported-webdeck-slide ' + escapeAttr(el.importedClasses || '') + '" style="' + scaleStyle + '">' + sanitizeImportedHtml(el.html || '') + '</div></div>';
      }
      if (el.type === 'list') return '<div class="obj" style="' + style + '"><ul>' + String(el.text || '').split('\n').filter(Boolean).map(item => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul></div>';
      if (el.type === 'link') return '<a class="obj" style="' + style + '" href="' + escapeAttr(el.href || '#') + '" target="_blank" rel="noopener">' + escapeHtml(el.text || 'Link') + '</a>';
      return '<div class="obj" style="' + style + '">' + escapeHtml(el.text || '').replace(/\n/g, '<br>') + '</div>';
    });
    if (slide.footer) parts.push('<div class="footer" style="background:' + escapeAttr(slide.footerColor || 'rgba(17,24,39,.9)') + ';color:' + escapeAttr(slide.footerTextColor || contrastText(slide.footerColor || '#111827')) + '"><span>' + escapeHtml(deck.footer || '') + '</span><span>' + (index + 1) + ' / ' + (totalSlides || deck.slides.length) + '</span></div>');
    if (slide.audio && slide.audio.length) {
      parts.push('<div class="slide-audio">' + slide.audio.map(audio => '<audio src="' + escapeAttr(audio.src || '') + '" controls preload="metadata"></audio>').join('') + '</div>');
    }
    return parts.join('');
  }

  function printPdf() {
    const win = window.open('', '_blank');
    win.document.write(buildPrintDeck());
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  function buildPrintDeck() {
    const exportSlides = deck.slides.filter(slide => !slide.hidden);
    return '<!doctype html><html><head><meta charset="utf-8"><title>' + escapeHtml(deck.title) + '</title><style>@page{size:landscape;margin:0}body{margin:0}.slide{position:relative;width:100vw;height:100vh;page-break-after:always;overflow:hidden;background:#fff}.slide.section,.slide.dark{background:#1e1b4b;color:#fff}.obj{position:absolute;padding:8px;overflow:hidden}.obj img,.obj video,.obj iframe{width:100%;height:100%;object-fit:contain;border:0}.footer{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;padding:9px 22px;background:#111827;color:#fff}.imported-webdeck-slide{display:flex!important;flex-direction:column!important;position:relative!important;inset:auto!important;width:100%;height:100%;background:transparent!important;}' + importedCssForDeck() + '</style></head><body>' + exportSlides.map((slide, i) => '<section class="slide ' + escapeAttr(slide.bg) + '">' + slideToWebDeckHtml(slide, i, exportSlides.length) + '</section>').join('') + '</body></html>';
  }

  function present(startIndex) {
    const html = buildWebDeck('');
    // Route through the same-origin present.html bootstrap so the WebDeck
    // framework's presenter view can reopen present.html?presenter=1 and stay in
    // sync (a blob URL cannot carry the ?presenter=1 query). Fall back to a blob
    // when IndexedDB is unavailable (e.g. some file:// contexts).
    if (!window.indexedDB) {
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      const fallbackWin = window.open(url + '#' + (startIndex + 1), '_blank');
      if (!fallbackWin) setStatus('Allow pop-ups to present in a new window.');
      return;
    }
    const win = window.open('present.html#' + (startIndex + 1), '_blank');
    if (!win) { setStatus('Allow pop-ups to present in a new window.'); return; }
    storePresentation(html)
      .then(() => setStatus('Presenting. Press V or the 🖥 button for presenter view with notes.'))
      .catch(err => {
        console.warn(err);
        setStatus('Could not open the presenter window. Export the WebDeck to present with two monitors.');
      });
  }

  function storePresentation(html) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('showsplat-present', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('decks');
      req.onsuccess = () => {
        const db = req.result;
        try {
          const tx = db.transaction('decks', 'readwrite');
          tx.objectStore('decks').put(html, 'current');
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => { db.close(); reject(tx.error); };
        } catch (err) {
          db.close();
          reject(err);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  function download(name, content, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function downloadBlob(name, blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function safeFileName(value, fallback) {
    return String(value || fallback || 'showsplat').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || fallback || 'showsplat';
  }

  function colorNoHash(value) {
    const color = normalizeColor(value || '#ffffff');
    return color.slice(1).toUpperCase();
  }

  function imageMime(ext) {
    const clean = String(ext || 'png').toLowerCase();
    if (clean === 'jpg' || clean === 'jpeg') return 'image/jpeg';
    if (clean === 'gif') return 'image/gif';
    if (clean === 'svg') return 'image/svg+xml';
    if (clean === 'webp') return 'image/webp';
    return 'image/png';
  }

  function dataUrlParts(src) {
    const match = String(src || '').match(/^data:([^;,]+);base64,(.+)$/);
    if (!match) return null;
    const mime = match[1].toLowerCase();
    const ext = mime.includes('jpeg') ? 'jpg' : mime.includes('gif') ? 'gif' : mime.includes('svg') ? 'svg' : mime.includes('webp') ? 'webp' : 'png';
    return { mime, ext, base64: match[2] };
  }

  function closeMenus() {
    document.querySelectorAll('.menu[open]').forEach(menu => menu.open = false);
  }

  function initMenus() {
    document.querySelectorAll('.menu').forEach(menu => {
      menu.addEventListener('toggle', () => {
        if (!menu.open) return;
        document.querySelectorAll('.menu[open]').forEach(other => {
          if (other !== menu) other.open = false;
        });
      });
    });
    document.querySelectorAll('.submenu').forEach(submenu => {
      submenu.addEventListener('toggle', () => {
        if (!submenu.open) return;
        submenu.parentElement?.querySelectorAll('.submenu[open]').forEach(other => {
          if (other !== submenu) other.open = false;
        });
      });
    });
    document.addEventListener('pointerdown', event => {
      if (!event.target.closest('.menu')) closeMenus();
    });
  }

  function runAction(action, target) {
    closeMenus();
    if (action === 'undo') undo();
    if (action === 'redo') redo();
    if (action === 'new-deck' && confirm('Start a new deck?')) {
      deck = defaultDeck();
      activeSlide = 0;
      selectedId = null;
      saveSoon();
      render();
    }
    if (action === 'save-deck') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
      download((deck.title || 'showsplat-deck').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.showsplat.json', JSON.stringify(deck, null, 2), 'application/json');
    }
    if (action === 'open-deck' || action === 'import-webdeck' || action === 'import-pdf' || action === 'import-pptx' || action === 'import-odp') els.deckFile.click();
    if (action === 'add-slide') addSlide('title-content');
    if (action === 'mail-merge') els.csvFile.click();
    if (action === 'pick-template') els.templatePickerDialog.showModal();
    if (action === 'duplicate-slide') duplicateSlide();
    if (action === 'delete-slide') deleteSlide();
    if (action === 'delete-selected-slides') deleteSelectedSlides();
    if (action === 'delete-object') deleteObject();
    if (action === 'add-text') addObject(textElement('Text box', 160, 150, 560, 130, 36));
    if (action === 'add-list') toggleBulletsForSelection();
    if (action === 'add-table') addObject(tableElement(170, 180, 720, 300));
    if (action === 'add-link') {
      const href = prompt('Link URL');
      if (href) addObject(Object.assign(textElement('Link text', 180, 160, 420, 80, 32, true, '#2563eb'), { type: 'link', href }));
    }
    if (action === 'add-slide-number') addObject(textElement(String(activeSlide + 1), 1420, 790, 80, 50, 24, true));
    if (action === 'add-header') addObject(textElement('Header', 80, 35, 640, 50, 24, true, '#6b7280'));
    if (action === 'insert-image-upload') els.imageFile.click();
    if (action === 'insert-video-upload') els.videoFile.click();
    if (action === 'insert-audio-upload') els.audioFile.click();
    if (action === 'set-global-audio') els.globalAudioFile.click();
    if (action === 'record-slide-audio') recordSlideAudio();
    if (action === 'insert-image-url') {
      const src = prompt('Image URL');
      if (src) addObject(Object.assign(textElement('', 180, 160, 640, 360, 24), { type: 'image', src, alt: 'Image from URL' }));
    }
    if (action === 'insert-youtube') {
      const src = parseYoutube(prompt('YouTube URL'));
      if (src) addObject(Object.assign(textElement('', 190, 160, 720, 405, 24), { type: 'youtube', src, title: 'YouTube video' }));
      else setStatus('That does not look like a YouTube URL.');
    }
    if (action === 'insert-video-url') {
      const src = prompt('MP4 or WebM URL');
      if (src) addObject(Object.assign(textElement('', 190, 160, 720, 405, 24), { type: 'video', src, title: 'Video' }));
    }
    if (action === 'insert-audio-url') {
      const src = prompt('Audio URL');
      if (src) addObject(Object.assign(textElement('', 220, 240, 620, 90, 24), { type: 'audio', src, title: 'Audio' }));
    }
    if (action === 'insert-splatimage') insertHandoffImage(['splatimage.selectedPng', 'splatimage.lastExport', 'drawsplat.splatimage.export']);
    if (action === 'insert-concept') insertHandoffImage(['drawsplat.concept.png', 'conceptMap.exportPng', 'drawsplat.conceptMap.export']);
    if (action === 'insert-graph') insertHandoffImage(['gridsplat.chart.png', 'drawsplat.graph.png', 'drawsplat.chart.png', 'chartStudio.exportPng', 'graphMaker.exportPng']);
    if (action === 'toggle-bold') applyToSelected(obj => obj.bold = !obj.bold);
    if (action === 'toggle-italic') applyToSelected(obj => obj.italic = !obj.italic);
    if (action === 'toggle-underline') applyToSelected(obj => obj.underline = !obj.underline);
    if (action === 'align-left') applyToSelected(obj => obj.align = 'left');
    if (action === 'align-center') applyToSelected(obj => obj.align = 'center');
    if (action === 'align-right') applyToSelected(obj => obj.align = 'right');
    if (action === 'decrease-font-size') changeSelectedFontSize(-2);
    if (action === 'increase-font-size') changeSelectedFontSize(2);
    if (action === 'autofit-textbox') autofitTextBox();
    if (action === 'fit-text-to-box') fitTextToBox();
    if (action === 'bring-forward') applyToSelected(obj => obj.z = Date.now());
    if (action === 'send-backward') applyToSelected(obj => obj.z = 1);
    if (action === 'select-all-objects') {
      const ids = currentSlide().elements.map(el => el.id);
      selectedObjectIds = new Set(ids);
      selectedId = ids[ids.length - 1] || null;
      render();
      setStatus(ids.length ? 'Selected ' + ids.length + ' objects.' : 'This slide has no objects yet.');
    }
    if (action === 'align-left') alignSelected('left');
    if (action === 'align-center-h') alignSelected('center-h');
    if (action === 'align-right') alignSelected('right');
    if (action === 'align-top') alignSelected('top');
    if (action === 'align-middle-v') alignSelected('middle-v');
    if (action === 'align-bottom') alignSelected('bottom');
    if (action === 'distribute-h') distributeSelected('h');
    if (action === 'distribute-v') distributeSelected('v');
    if (action === 'hide-selected-slides') updateSelectedSlides(slide => { slide.hidden = true; }, 'Hid selected slides.');
    if (action === 'show-selected-slides') updateSelectedSlides(slide => { slide.hidden = false; }, 'Showed selected slides.');
    if (action === 'indent-selected-slides') indentSelectedSlides(1);
    if (action === 'outdent-selected-slides') indentSelectedSlides(-1);
    if (action === 'collapse-selected-slides') updateSelectedSlides(slide => { slide.collapsed = true; }, 'Collapsed selected slides.');
    if (action === 'expand-selected-slides') updateSelectedSlides(slide => { slide.collapsed = false; }, 'Expanded selected slides.');
    if (action === 'set-selected-bg-light') setSelectedSlideBg('light');
    if (action === 'set-selected-bg-dark') setSelectedSlideBg('dark');
    if (action === 'set-selected-bg-section') setSelectedSlideBg('section');
    if (action === 'toggle-footer') {
      currentSlide().footer = !currentSlide().footer;
      saveSoon();
      render();
    }
    if (action === 'theme-gallery') {
      els.footerText.value = deck.footer || '';
      const theme = getDeckTheme();
      els.themeAccentColor.value = normalizeColor(theme.accent);
      els.themeHighlightColor.value = normalizeColor(theme.accent2);
      els.themeDarkColor.value = normalizeColor(theme.dark);
      els.themeCanvasColor.value = normalizeColor(theme.bg);
      syncSlideColorInputs();
      els.themeDialog.showModal();
    }
    if (action === 'apply-theme-colors') {
      deck.themeColors = {
        accent: els.themeAccentColor.value,
        accent2: els.themeHighlightColor.value,
        dark: els.themeDarkColor.value,
        bg: els.themeCanvasColor.value
      };
      saveSoon();
      render();
      setStatus('Applied custom colors to the deck theme.');
    }
    if (action === 'apply-footer') {
      deck.footer = els.footerText.value;
      saveSoon();
      render();
    }
    if (action === 'apply-slide-colors') applySlideColorsToSelection();
    if (action === 'open-markdown') openMarkdown();
    if (action === 'load-markdown-sample') els.markdownInput.value = '# ShowSplat™\n\n- Build slides from Markdown\n- Insert media anywhere\n- Export WebDeck HTML\n\n---\n\n# Media slide\n\n- Add YouTube, MP4, WebM, PNG, JPG, and tables';
    if (action === 'import-markdown') importMarkdown();
    if (action === 'copy-markdown') navigator.clipboard?.writeText(exportMarkdown()).then(() => setStatus('Markdown copied.'));
    if (action === 'export-markdown') download((deck.title || 'showsplat-deck').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.md', exportMarkdown(), 'text/markdown');
    if (action === 'export-webdeck') exportWebDeck();
    if (action === 'print-pdf') printPdf();
    if (action === 'export-pptx') exportPptx();
    if (action === 'export-odp') exportOdp();
    if (action === 'planned-import') alert(target.dataset.kind + ' import is planned after the ShowSplat deck model stabilizes. Use WebDeck HTML, Markdown Studio, or .showsplat.json for editable decks right now.');
    if (action === 'planned-export') alert(target.dataset.kind + ' export is planned after the ShowSplat deck model stabilizes. Use WebDeck HTML or browser PDF export in this first release.');
    if (action === 'present-first') present(0);
    if (action === 'present-current') present(activeSlide);
    if (action === 'view-normal') setView('normal');
    if (action === 'view-sorter') setView('sorter');
    if (action === 'view-notes') setView('notes');
    if (action === 'toggle-sidebar') els.workspace.classList.toggle('show-inspector');
    if (action === 'show-help') els.helpDialog.showModal();
    if (action === 'show-shortcuts') els.shortcutsDialog.showModal();
  }

  function autofitTextBox() {
    applyToSelected(obj => {
      if (!['text', 'list', 'link', 'shape'].includes(obj.type)) return;
      const lines = String(obj.text || '').split('\n');
      const longest = Math.max(1, ...lines.map(line => line.length));
      const fontSize = Number(obj.fontSize) || 30;
      obj.w = clamp(Math.ceil(longest * fontSize * 0.62) + 32, 100, SLIDE_W - obj.x);
      obj.h = clamp(Math.ceil(lines.length * fontSize * 1.28) + 28, 50, SLIDE_H - obj.y);
    });
  }

  function changeSelectedFontSize(delta) {
    applyToSelected(obj => {
      if (!['text', 'list', 'link', 'shape', 'table', 'html'].includes(obj.type)) return;
      obj.fontSize = clamp((Number(obj.fontSize) || 30) + delta, 12, 96);
      if (els.fontSize) els.fontSize.value = obj.fontSize;
    });
  }

  function fitTextToBox() {
    applyToSelected(obj => {
      if (!['text', 'list', 'link', 'shape'].includes(obj.type)) return;
      const lines = String(obj.text || '').split('\n');
      const longest = Math.max(1, ...lines.map(line => line.length));
      const byWidth = (obj.w - 28) / (longest * 0.62);
      const byHeight = (obj.h - 24) / Math.max(1, lines.length) / 1.25;
      obj.fontSize = clamp(Math.floor(Math.min(byWidth, byHeight)), 12, 96);
    });
  }

  function insertHandoffImage(keys) {
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value && /^data:image\//.test(value)) {
        addObject(Object.assign(textElement('', 180, 160, 640, 360, 24), { type: 'image', src: value, alt: 'Imported SplatWorks image' }));
        return;
      }
    }
    setStatus('No compatible handoff image found. Export or copy from the source tool first.');
  }

  function setView(mode) {
    viewMode = ['sorter', 'notes'].includes(mode) ? mode : 'normal';
    const isSorter = viewMode === 'sorter';
    const isNotes = viewMode === 'notes';
    els.workspace.classList.toggle('sorter-mode', isSorter);
    els.workspace.classList.toggle('notes-mode', isNotes);
    els.workspace.classList.toggle('normal-mode', viewMode === 'normal');
    els.workspace.classList.toggle('show-inspector', isNotes);
    els.sorter.hidden = !isSorter;
    els.stage.hidden = isSorter;
    els.sorter.style.display = isSorter ? 'grid' : 'none';
    els.stage.style.display = isSorter ? 'none' : 'grid';
    render();
    if (isNotes) {
      els.notes.focus();
      setStatus('Notes view.');
    } else {
      setStatus(isSorter ? 'Slide Sorter view.' : 'Normal view.');
    }
  }

  function centerSlideInStage() {
    if (!els.stage || !els.canvas) return;
    const stageRect = els.stage.getBoundingClientRect();
    const canvasRect = els.canvas.getBoundingClientRect();
    els.stage.scrollLeft += (canvasRect.left + canvasRect.width / 2) - (stageRect.left + stageRect.width / 2);
    els.stage.scrollTop += (canvasRect.top + canvasRect.height / 2) - (stageRect.top + stageRect.height / 2);
  }

  function applyZoom() {
    zoomLevel = clamp(Number(zoomLevel) || 50, 0, 100);
    const scale = 0.5 + (zoomLevel / 100);
    els.stage.style.setProperty('--canvas-zoom', scale.toFixed(2));
    if (els.zoomSlider) els.zoomSlider.value = String(Math.round(zoomLevel));
    if (els.zoomValue) {
      els.zoomValue.value = Math.round(scale * 100) + '%';
      els.zoomValue.textContent = Math.round(scale * 100) + '%';
    }
  }

  function initRailSplitter() {
    if (!els.rail || !els.railSplitter) return;
    const savedHeight = Number(localStorage.getItem('showsplat.railHeight') || 0);
    if (savedHeight) setRailHeight(savedHeight);
    els.railSplitter.addEventListener('pointerdown', event => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = els.rail.getBoundingClientRect().height;
      els.railSplitter.setPointerCapture(event.pointerId);
      els.railSplitter.classList.add('dragging');
      const move = moveEvent => setRailHeight(startHeight + moveEvent.clientY - startY);
      const done = () => {
        els.railSplitter.classList.remove('dragging');
        els.railSplitter.removeEventListener('pointermove', move);
        els.railSplitter.removeEventListener('pointerup', done);
        els.railSplitter.removeEventListener('pointercancel', done);
        localStorage.setItem('showsplat.railHeight', String(Math.round(els.rail.getBoundingClientRect().height)));
      };
      els.railSplitter.addEventListener('pointermove', move);
      els.railSplitter.addEventListener('pointerup', done);
      els.railSplitter.addEventListener('pointercancel', done);
    });
    els.railSplitter.addEventListener('keydown', event => {
      const current = els.rail.getBoundingClientRect().height;
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setRailHeight(current - 24);
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setRailHeight(current + 24);
      }
      localStorage.setItem('showsplat.railHeight', String(Math.round(els.rail.getBoundingClientRect().height)));
    });
  }

  function setRailHeight(height) {
    if (!els.rail) return;
    els.rail.style.setProperty('--rail-height', clamp(height, 120, 420) + 'px');
  }

  function slideTitleFromFirstText() {
    const slide = currentSlide();
    const first = slide.elements.find(el => el.type === 'text' && String(el.text || '').trim());
    if (first) slide.title = String(first.text).split('\n')[0].slice(0, 80);
  }

  async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function normalizeColor(value) {
    return /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#ffffff';
  }

  function contrastText(hex) {
    const value = normalizeColor(hex);
    const r = parseInt(value.slice(1, 3), 16);
    const g = parseInt(value.slice(3, 5), 16);
    const b = parseInt(value.slice(5, 7), 16);
    return ((r * 299 + g * 587 + b * 114) / 1000) > 150 ? '#1f2937' : '#ffffff';
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  // Imported WebDeck/AI decks often ship low-contrast "muted" text (light gray or
  // low opacity) that is hard to read once it lands on a ShowSplat slide. This
  // measures the rendered contrast of each text element against its real
  // background and bakes in a readable color where it falls below WCAG AA.
  function enhanceImportedContrast(html, importedClasses, importedCss, bg) {
    const source = String(html || '');
    if (!source.trim() || typeof document === 'undefined' || !document.body) return source;
    const baseBg = bg === 'light' ? '#ffffff' : '#1e1b4b';
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:fixed;left:-99999px;top:0;width:1600px;height:900px;overflow:hidden;pointer-events:none;opacity:0;';
    if (importedCss) {
      const style = document.createElement('style');
      style.textContent = scopeImportedCss(importedCss);
      host.appendChild(style);
    }
    const root = document.createElement('div');
    root.className = 'imported-webdeck-slide ' + (importedClasses || '');
    root.style.width = '1600px';
    root.style.height = '900px';
    root.style.background = baseBg;
    root.innerHTML = source;
    host.appendChild(root);
    document.body.appendChild(host);
    try {
      root.querySelectorAll('*').forEach(node => {
        const tag = node.tagName.toLowerCase();
        if (['img', 'video', 'iframe', 'svg', 'br', 'hr'].includes(tag)) return;
        const hasOwnText = Array.from(node.childNodes).some(child => child.nodeType === 3 && child.textContent.trim());
        if (!hasOwnText) return;
        const styles = getComputedStyle(node);
        const fg = parseRenderedColor(styles.color);
        if (!fg) return;
        const opacity = clamp(Number(styles.opacity) || 1, 0, 1);
        const effectiveBg = nearestOpaqueBackground(node, baseBg);
        const shown = blendColors(fg, effectiveBg, fg.a * opacity);
        if (contrastRatio(shown, effectiveBg) >= 4.5) return;
        node.style.setProperty('color', relativeLuminance(effectiveBg) > 0.4 ? '#1f2937' : '#f8fafc', 'important');
        if (opacity < 0.85) node.style.setProperty('opacity', '1', 'important');
      });
      return root.innerHTML;
    } catch (err) {
      console.warn(err);
      return source;
    } finally {
      host.remove();
    }
  }

  function migrateImportedContrast() {
    if (typeof document === 'undefined' || !document.body) return;
    let changed = false;
    deck.slides.forEach(slide => {
      if (!slide.importedCss) return;
      slide.elements.forEach(el => {
        if (el.type !== 'html' || el.contrastFixed) return;
        el.html = enhanceImportedContrast(el.html || '', el.importedClasses || '', slide.importedCss, slide.bg);
        el.contrastFixed = true;
        changed = true;
      });
    });
    if (changed) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
      } catch (err) {
        console.warn(err);
      }
    }
  }

  function nearestOpaqueBackground(node, fallback) {
    let el = node;
    while (el && el.nodeType === 1) {
      const bg = parseRenderedColor(getComputedStyle(el).backgroundColor);
      if (bg && bg.a > 0.2) return { r: bg.r, g: bg.g, b: bg.b };
      el = el.parentElement;
    }
    return parseRenderedColor(fallback) || { r: 255, g: 255, b: 255 };
  }

  function parseRenderedColor(value) {
    const str = String(value || '').trim();
    let match = str.match(/^rgba?\(([^)]+)\)$/i);
    if (match) {
      const parts = match[1].split(',').map(part => parseFloat(part.trim()));
      if (parts.length >= 3) return { r: parts[0], g: parts[1], b: parts[2], a: parts.length >= 4 ? parts[3] : 1 };
    }
    match = str.match(/^#([0-9a-f]{6})$/i);
    if (match) return { r: parseInt(match[1].slice(0, 2), 16), g: parseInt(match[1].slice(2, 4), 16), b: parseInt(match[1].slice(4, 6), 16), a: 1 };
    match = str.match(/^#([0-9a-f]{3})$/i);
    if (match) return { r: parseInt(match[1][0] + match[1][0], 16), g: parseInt(match[1][1] + match[1][1], 16), b: parseInt(match[1][2] + match[1][2], 16), a: 1 };
    return null;
  }

  function blendColors(fg, bg, alpha) {
    const a = clamp(alpha, 0, 1);
    return {
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a)
    };
  }

  function relativeLuminance(color) {
    const channel = value => {
      const scaled = clamp(value, 0, 255) / 255;
      return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
  }

  function contrastRatio(a, b) {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  document.addEventListener('click', event => {
    if (cropTargetId && !event.target.closest('.slide-object[data-id="' + cropTargetId + '"]')) {
      cropTargetId = null;
      render();
    }
    const actionTarget = event.target.closest('[data-action]');
    if (actionTarget) runAction(actionTarget.dataset.action, actionTarget);
    const templateTarget = event.target.closest('[data-template]');
    if (templateTarget) {
      closeMenus();
      if (els.templatePickerDialog?.open) els.templatePickerDialog.close();
      addSlide(templateTarget.dataset.template);
    }
    const themeTarget = event.target.closest('[data-theme]');
    if (themeTarget) {
      deck.theme = themeTarget.dataset.theme;
      deck.themeColors = null;
      saveSoon();
      render();
    }
    const slidePaletteTarget = event.target.closest('[data-slide-palette]');
    if (slidePaletteTarget) applySlidePalette(slidePaletteTarget.dataset.slidePalette);
  });

  document.addEventListener('keydown', event => {
    if (event.target.matches('input, textarea, [contenteditable="true"]')) return;
    const mod = event.ctrlKey || event.metaKey;
    if (mod && (event.key === 'z' || event.key === 'Z')) { event.preventDefault(); if (event.shiftKey) redo(); else undo(); return; }
    if (mod && (event.key === 'y' || event.key === 'Y')) { event.preventDefault(); redo(); return; }
    if (mod && (event.key === 'a' || event.key === 'A')) { event.preventDefault(); runAction('select-all-objects'); return; }
    if (mod) return;
    // Arrow keys nudge every selected object; with none selected they move
    // between slides. Shift = coarse (large) step, plain = fine step.
    const nudgeObjs = selectedObjects();
    if (nudgeObjs.length && (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      const step = event.shiftKey ? 20 : 4;
      const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
      const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
      nudgeObjs.forEach(o => {
        o.x = clamp((o.x || 0) + dx, -BOARD_MARGIN_X, SLIDE_W + BOARD_MARGIN_X - 40);
        o.y = clamp((o.y || 0) + dy, -BOARD_MARGIN_Y, SLIDE_H + BOARD_MARGIN_Y - 40);
      });
      saveSoon();
      render();
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') deleteObject();
    if (event.key.toLowerCase() === 'n') addSlide('title-content');
    if (event.key.toLowerCase() === 'd') duplicateSlide();
    if (event.key === 'ArrowUp') selectSlide(activeSlide - 1);
    if (event.key === 'ArrowDown') selectSlide(activeSlide + 1);
    if (event.key.toLowerCase() === 'p') present(activeSlide);
    if (event.key === 'Escape') { if (selectedObjectIds.size) { clearSelection(); render(); } closeMenus(); }
  });

  document.addEventListener('paste', event => {
    const items = event.clipboardData && event.clipboardData.items;
    if (!items) return;
    for (const item of items) {
      if (item.type && item.type.indexOf('image/') === 0) {
        const file = item.getAsFile();
        if (file) {
          event.preventDefault();
          readAsDataUrl(file).then(src => {
            insertImageAt(src, 'Pasted image');
            setStatus('Pasted image onto the slide.');
          });
          return;
        }
      }
    }
  });

  ['dragenter', 'dragover'].forEach(type => els.stage.addEventListener(type, event => {
    const types = event.dataTransfer ? Array.from(event.dataTransfer.types) : [];
    if (types.includes('Files') || types.includes('text/uri-list')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      els.stage.classList.add('drop-active');
    }
  }));
  els.stage.addEventListener('dragleave', event => {
    if (!els.stage.contains(event.relatedTarget)) els.stage.classList.remove('drop-active');
  });
  els.stage.addEventListener('drop', event => {
    els.stage.classList.remove('drop-active');
    const dt = event.dataTransfer;
    if (!dt) return;
    const files = Array.from(dt.files || []);
    const imageFile = files.find(file => file.type.indexOf('image/') === 0);
    const videoFile = files.find(file => file.type.indexOf('video/') === 0);
    if (imageFile) {
      event.preventDefault();
      readAsDataUrl(imageFile).then(src => {
        insertImageAt(src, imageFile.name, event.clientX, event.clientY);
        setStatus('Dropped image onto the slide.');
      });
      return;
    }
    if (videoFile) {
      event.preventDefault();
      readAsDataUrl(videoFile).then(src => insertVideoAt(src, videoFile.name, event.clientX, event.clientY));
      return;
    }
    const uri = dt.getData('text/uri-list') || dt.getData('text/plain');
    if (uri && /^https?:\/\/\S+/.test(uri.trim())) {
      event.preventDefault();
      insertImageAt(uri.trim(), 'Image from URL', event.clientX, event.clientY);
      setStatus('Dropped image link onto the slide.');
    }
  });

  // Marquee-select: drag on blank canvas to rubber-band a group of objects.
  // A plain click on blank canvas deselects. Shift/Ctrl/Cmd adds to selection.
  els.canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    if (event.target !== els.canvas && !event.target.classList.contains('slide-board')) return;
    const additive = event.shiftKey || event.ctrlKey || event.metaKey;
    const rect = els.canvas.getBoundingClientRect();
    const startX = event.clientX, startY = event.clientY;
    const base = new Set(selectedObjectIds);
    const box = document.createElement('div');
    box.className = 'marquee-box';
    els.canvas.appendChild(box);
    let moved = false;

    function toSlide(clientX, clientY) {
      return {
        x: (clientX - rect.left) / rect.width * SLIDE_W,
        y: (clientY - rect.top) / rect.height * SLIDE_H
      };
    }

    function move(ev) {
      if (Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) > 4) moved = true;
      const x1 = Math.min(startX, ev.clientX), y1 = Math.min(startY, ev.clientY);
      const x2 = Math.max(startX, ev.clientX), y2 = Math.max(startY, ev.clientY);
      box.style.left = (x1 - rect.left) + 'px';
      box.style.top = (y1 - rect.top) + 'px';
      box.style.width = (x2 - x1) + 'px';
      box.style.height = (y2 - y1) + 'px';
      const a = toSlide(x1, y1), b = toSlide(x2, y2);
      const hits = currentSlide().elements.filter(el =>
        !(b.x < el.x || a.x > el.x + el.w || b.y < el.y || a.y > el.y + el.h)
      ).map(el => el.id);
      selectedObjectIds = new Set(additive ? [...base, ...hits] : hits);
      selectedId = hits.length ? hits[hits.length - 1] : (additive ? selectedId : null);
      els.canvas.classList.toggle('multi-select', selectedObjectIds.size > 1);
      els.canvas.querySelectorAll('.slide-object').forEach(node => {
        node.classList.toggle('selected', selectedObjectIds.has(node.dataset.id));
        node.classList.toggle('sel-primary', node.dataset.id === selectedId);
      });
    }

    function stop() {
      document.removeEventListener('pointermove', move);
      box.remove();
      if (!moved && !additive) clearSelection();
      renderCanvas();
      renderInspector();
      if (selectedObjectIds.size > 1) setStatus('Selected ' + selectedObjectIds.size + ' objects. Use Arrange to align or distribute them.');
    }

    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', stop, { once: true });
  });

  els.deckTitle.addEventListener('input', () => {
    deck.title = els.deckTitle.value;
    saveSoon();
  });
  els.notes.addEventListener('input', () => {
    currentSlide().notes = els.notes.value;
    saveSoon();
  });
  els.fontFamily.addEventListener('change', () => applyToSelected(obj => obj.fontFamily = els.fontFamily.value));
  els.fontSize.addEventListener('change', () => applyToSelected(obj => obj.fontSize = Number(els.fontSize.value) || 30));
  els.textColor.addEventListener('input', () => applyTextColor(els.textColor.value));
  els.fillColor.addEventListener('input', () => applyFillColor(els.fillColor.value));
  if (els.zoomSlider) {
    els.zoomSlider.addEventListener('input', () => {
      zoomLevel = Number(els.zoomSlider.value) || 0;
      localStorage.setItem('showsplat.zoomLevel', String(zoomLevel));
      applyZoom();
      requestAnimationFrame(centerSlideInStage);
    });
  }
  [els.altText, els.linkUrl, els.posX, els.posY, els.posW, els.posH].forEach(input => input.addEventListener('change', () => {
    const obj = selectedObject();
    if (!obj) return;
    obj.alt = els.altText.value;
    obj.href = els.linkUrl.value;
    obj.x = Number(els.posX.value) || obj.x;
    obj.y = Number(els.posY.value) || obj.y;
    obj.w = Number(els.posW.value) || obj.w;
    obj.h = Number(els.posH.value) || obj.h;
    saveSoon();
    render();
  }));
  els.imageFile.addEventListener('change', () => {
    const file = els.imageFile.files[0];
    if (file) insertImageFile(file);
    els.imageFile.value = '';
  });
  els.videoFile.addEventListener('change', () => {
    const file = els.videoFile.files[0];
    if (file) insertVideoFile(file);
    els.videoFile.value = '';
  });
  els.audioFile.addEventListener('change', () => {
    const file = els.audioFile.files[0];
    if (file) insertAudioFile(file);
    els.audioFile.value = '';
  });
  els.globalAudioFile.addEventListener('change', () => {
    const file = els.globalAudioFile.files[0];
    if (file) setGlobalAudioFile(file);
    els.globalAudioFile.value = '';
  });
  els.deckFile.addEventListener('change', () => {
    const file = els.deckFile.files[0];
    if (!file) return;
    const reader = /\.(pdf|pptx|odp)$/i.test(file.name) || file.type === 'application/pdf' ? file.arrayBuffer() : file.text();
    reader.then(content => importDeckFile(file, content)).catch(err => {
      console.warn(err);
      setStatus('Could not open that deck file.');
    });
    els.deckFile.value = '';
  });
  els.csvFile.addEventListener('change', () => {
    const file = els.csvFile.files[0];
    if (file) {
      file.text().then(text => mailMergeFromCsv(text)).catch(err => {
        console.warn(err);
        setStatus('Could not read that CSV file.');
      });
    }
    els.csvFile.value = '';
  });

  window.addEventListener('beforeunload', () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
    } catch (err) {
      console.warn(err);
    }
  });
  initRailSplitter();
  initMenus();
  migrateImportedContrast();
  recordHistory(JSON.stringify(deck));
  render();
  requestAnimationFrame(centerSlideInStage);
})();
