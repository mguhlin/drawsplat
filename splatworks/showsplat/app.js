(function () {
  'use strict';

  const STORAGE_KEY = 'showsplat.deck.v1';
  const SLIDE_W = 1600;
  const SLIDE_H = 900;
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
    markdownDialog: document.getElementById('markdownDialog'),
    markdownInput: document.getElementById('markdownInput'),
    themeDialog: document.getElementById('themeDialog'),
    footerText: document.getElementById('footerText'),
    slideBgColor: document.getElementById('slideBgColor'),
    slideBarColor: document.getElementById('slideBarColor'),
    slideDefaultTextColor: document.getElementById('slideDefaultTextColor'),
    imageFile: document.getElementById('imageFileInput'),
    videoFile: document.getElementById('videoFileInput'),
    audioFile: document.getElementById('audioFileInput'),
    globalAudioFile: document.getElementById('globalAudioFileInput'),
    deckFile: document.getElementById('deckFileInput')
  };

  let deck = loadDeck();
  let activeSlide = 0;
  let selectedId = null;
  let viewMode = 'normal';
  let autosaveTimer = null;
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
    } else if (template === 'resources') {
      slide.title = 'Resources';
      slide.elements.push(textElement('Resources', 90, 82, 820, 92, 46, true));
      slide.elements.push(textElement('- Link or next step\n- Link or next step\n- Link or next step', 130, 190, 850, 260, 34));
    } else {
      slide.title = 'Title and Content';
      slide.elements.push(textElement('Slide title', 90, 82, 860, 92, 46, true));
      slide.elements.push(listElement(['First point', 'Second point', 'Third point'], 125, 190, 900, 360));
      slide.notes = 'I will use this slide to explain the main points in order, keeping the audience focused on the relationships between the bullets rather than reading every word.';
    }
    return slide;
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
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
        setStatus('Autosaved in this browser.');
      } catch (err) {
        console.warn(err);
        setStatus('Deck is too large for browser autosave. Use File > Save .showsplat.json.');
      }
    }, 250);
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function render() {
    normalizeSlideSelection();
    const theme = themes[deck.theme] || themes.violet;
    document.documentElement.style.setProperty('--accent', theme.accent);
    document.documentElement.style.setProperty('--accent-2', theme.accent2);
    document.documentElement.style.setProperty('--dark', theme.dark);
    els.deckTitle.value = deck.title;
    applyZoom();
    renderThumbs();
    renderCanvas();
    renderInspector();
    renderSorter();
  }

  function renderThumbs() {
    els.thumbs.innerHTML = '';
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
    slide.elements.slice().sort((a, b) => (a.z || 0) - (b.z || 0)).forEach(el => {
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
        item.innerHTML = miniHtmlPreview(el.html || '');
      } else {
        item.textContent = String(el.text || '').slice(0, 80);
      }
      mini.appendChild(item);
    });
    if (slide.footer) {
      const footer = document.createElement('span');
      footer.className = 'mini-footer';
      footer.textContent = String(index + 1);
      mini.appendChild(footer);
    }
    return mini;
  }

  function miniHtmlPreview(html) {
    const doc = new DOMParser().parseFromString('<div>' + String(html || '') + '</div>', 'text/html');
    const media = doc.querySelector('img, video, iframe');
    if (media) {
      const tag = media.tagName.toLowerCase();
      if (tag === 'img') return '<img src="' + escapeAttr(media.getAttribute('src') || '') + '" alt="">';
      if (tag === 'video') return '<video src="' + escapeAttr(media.getAttribute('src') || '') + '"></video>';
      return '<iframe src="' + escapeAttr(media.getAttribute('src') || '') + '" title=""></iframe>';
    }
    return '<span class="mini-html-content">' + sanitizeImportedHtml(html) + '</span>';
  }

  function renderCanvas() {
    const slide = currentSlide();
    els.canvas.className = 'slide-canvas ' + (slide.bg === 'section' ? 'section' : slide.bg === 'dark' ? 'dark' : '');
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
    node.className = 'slide-object ' + el.type + (el.id === selectedId ? ' selected' : '');
    node.dataset.id = el.id;
    node.style.left = (el.x / SLIDE_W * 100) + '%';
    node.style.top = (el.y / SLIDE_H * 100) + '%';
    node.style.width = (el.w / SLIDE_W * 100) + '%';
    node.style.height = (el.h / SLIDE_H * 100) + '%';
    node.style.zIndex = String(el.z || 1);
    node.style.transform = 'rotate(' + (Number(el.rotate) || 0) + 'deg)';
    node.style.transformOrigin = 'center center';
    if (el.id === cropTargetId) node.classList.add('crop-mode');
    node.addEventListener('pointerdown', objectPointerDown);
    if (el.type === 'image') {
      node.addEventListener('dblclick', event => {
        event.preventDefault();
        selectedId = el.id;
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
      content.innerHTML = '<div class="imported-webdeck-slide" contenteditable="true">' + sanitizeImportedHtml(el.html || '') + '</div>';
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
      return;
    }
    els.selectionInfo.textContent = obj.type + ' object selected. Drag to move, use corner handles to resize, and use the top handle to rotate.';
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

  function deleteSlide() {
    if (selectedSlideIndexes().length > 1) return deleteSelectedSlides();
    if (deck.slides.length === 1) {
      setStatus('A deck needs at least one slide.');
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
    if (!indexes.length || indexes.length >= deck.slides.length) {
      setStatus('Keep at least one slide in the deck.');
      return;
    }
    if (!confirm('Delete ' + indexes.length + ' selected slide' + (indexes.length === 1 ? '?' : 's?'))) return;
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
        if (el.type === 'text' || el.type === 'list' || el.type === 'shape' || el.type === 'link') {
          if (!el.color || el.color === '#1f2937' || el.color === '#ffffff') el.color = text;
        }
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
    selectedId = el.id;
    saveSoon();
    render();
  }

  function deleteObject() {
    if (!selectedId) return;
    currentSlide().elements = currentSlide().elements.filter(el => el.id !== selectedId);
    selectedId = null;
    saveSoon();
    render();
  }

  function objectPointerDown(event) {
    const target = event.currentTarget;
    const id = target.dataset.id;
    selectedId = id;
    if (cropTargetId && cropTargetId !== id) cropTargetId = null;
    els.canvas.querySelectorAll('.slide-object.selected').forEach(node => {
      if (node !== target) node.classList.remove('selected');
    });
    els.canvas.querySelector('.slide-footer.selected')?.classList.remove('selected');
    target.classList.add('selected');
    renderInspector();
    if (event.target.classList.contains('resize-handle') || event.target.classList.contains('rotate-handle')) return;
    if (event.target.closest('[contenteditable="true"]')) {
      setStatus('Editing ' + (selectedObject()?.type || 'object') + '. Use the grip above it to move.');
      return;
    }
    event.preventDefault();
    const obj = selectedObject();
    const rect = els.canvas.getBoundingClientRect();
    const start = {
      x: event.clientX,
      y: event.clientY,
      objX: obj.x,
      objY: obj.y,
      cropX: obj.cropX ?? 50,
      cropY: obj.cropY ?? 50
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', stop, { once: true });
    target.classList.add('selected');

    function move(ev) {
      if (cropTargetId === obj.id && obj.type === 'image') {
        obj.cropX = clamp(start.cropX - (ev.clientX - start.x) / rect.width * 100, 0, 100);
        obj.cropY = clamp(start.cropY - (ev.clientY - start.y) / rect.height * 100, 0, 100);
        renderCanvas();
        return;
      }
      obj.x = clamp(start.objX + (ev.clientX - start.x) / rect.width * SLIDE_W, 0, SLIDE_W - obj.w);
      obj.y = clamp(start.objY + (ev.clientY - start.y) / rect.height * SLIDE_H, 0, SLIDE_H - obj.h);
      renderCanvas();
      renderInspector();
    }

    function stop() {
      document.removeEventListener('pointermove', move);
      saveSoon();
      render();
    }
  }

  function resizePointerDown(event) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget.closest('.slide-object');
    selectedId = target.dataset.id;
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
      if (handle.includes('e')) obj.w = clamp(start.w + dx, 60, SLIDE_W - obj.x);
      if (handle.includes('s')) obj.h = clamp(start.h + dy, 40, SLIDE_H - obj.y);
      if (handle.includes('w')) {
        const nextX = clamp(start.objX + dx, 0, start.objX + start.w - 60);
        obj.w = start.w + (start.objX - nextX);
        obj.x = nextX;
      }
      if (handle.includes('n')) {
        const nextY = clamp(start.objY + dy, 0, start.objY + start.h - 40);
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
    selectedId = target.dataset.id;
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
    const obj = selectedObject();
    if (!obj) {
      setStatus('Select a slide object first.');
      return;
    }
    mutator(obj);
    saveSoon();
    render();
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
    const sourceSlides = extractWebDeckSlides(html);
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
    const bg = source.bg === 'hero' || source.bg === 'section' ? 'section' : source.bg === 'dark' ? 'dark' : 'light';
    const textColor = bg === 'light' ? '#1f2937' : '#ffffff';
    const footerInfo = extractImportedFooter(source.html);
    const html = sanitizeImportedHtml(footerInfo.html || '<h1>' + escapeHtml(source.title || 'Slide') + '</h1>', baseUrl);
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
        autoFit: true,
        importScale: 1,
        fontFamily: 'Inter, Arial, sans-serif',
        fontSize: 30,
        bold: false,
        italic: false,
        underline: false,
        color: textColor,
        fill: '#ffffff',
        align: 'left',
        z: Date.now() + index
      }]
    };
  }

  function extractImportedFooter(html) {
    const doc = new DOMParser().parseFromString('<div>' + String(html || '') + '</div>', 'text/html');
    const footer = doc.querySelector('.footer, [data-showsplat-footer="true"]');
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

  async function resolveImportHtml(html) {
    try {
      if (extractWebDeckSlides(html).length) return { html, baseUrl: extractBaseUrl(html) };
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

  function pptxXfrm(node, slideCx, slideCy) {
    const xfrm = firstXml(node, 'xfrm');
    const off = xfrm ? firstXml(xfrm, 'off') : null;
    const ext = xfrm ? firstXml(xfrm, 'ext') : null;
    return {
      x: emuToPx(off?.getAttribute('x'), slideCx, SLIDE_W),
      y: emuToPx(off?.getAttribute('y'), slideCy, SLIDE_H),
      w: emuToPx(ext?.getAttribute('cx') || 2000000, slideCx, SLIDE_W),
      h: emuToPx(ext?.getAttribute('cy') || 600000, slideCy, SLIDE_H)
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
    return {
      fontSize: rPr?.getAttribute('sz') ? Math.max(12, Math.round(Number(rPr.getAttribute('sz')) / 100)) : 30,
      bold: rPr?.getAttribute('b') === '1',
      italic: rPr?.getAttribute('i') === '1',
      color: srgb?.getAttribute('val') ? '#' + srgb.getAttribute('val') : '#1f2937',
      align: ({ ctr: 'center', r: 'right' }[pPr?.getAttribute('algn')]) || 'left'
    };
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
      xmlNodes(doc, 'sp').forEach((shape, shapeIndex) => {
        const text = pptxTextFromShape(shape);
        if (!text) return;
        const box = pptxXfrm(shape, slideCx, slideCy);
        const style = pptxShapeStyle(shape);
        const el = Object.assign(textElement(text, box.x, box.y, box.w, box.h, style.fontSize, style.bold, style.color), {
          italic: style.italic,
          align: style.align,
          z: index * 1000 + shapeIndex
        });
        slide.elements.push(el);
        if (slide.title === 'Slide ' + (index + 1)) slide.title = text.split('\n')[0].slice(0, 80);
      });
      for (const [picIndex, pic] of xmlNodes(doc, 'pic').entries()) {
        const blip = firstXml(pic, 'blip');
        const relId = blip?.getAttribute('r:embed') || blip?.getAttribute('embed');
        const mediaPath = rels[relId];
        const media = mediaPath ? zip.file(mediaPath) : null;
        if (!media) continue;
        const ext = (mediaPath.split('.').pop() || 'png').toLowerCase();
        const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'gif' ? 'image/gif' : ext === 'svg' ? 'image/svg+xml' : 'image/png';
        const src = 'data:' + mime + ';base64,' + await media.async('base64');
        const box = pptxXfrm(pic, slideCx, slideCy);
        slide.elements.push(Object.assign(textElement('', box.x, box.y, box.w, box.h, 24), {
          type: 'image',
          src,
          alt: 'Imported PPTX image',
          fill: 'transparent',
          z: index * 1000 + 500 + picIndex
        }));
      }
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
    const pages = xmlNodes(doc, 'page');
    const slides = [];
    for (const [index, page] of pages.entries()) {
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
      for (const [frameIndex, frame] of xmlNodes(page, 'frame').entries()) {
        const box = odpBox(frame);
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

  function odpBox(frame) {
    return {
      x: odpLength(frame.getAttribute('svg:x'), SLIDE_W),
      y: odpLength(frame.getAttribute('svg:y'), SLIDE_H),
      w: odpLength(frame.getAttribute('svg:width'), SLIDE_W) || 500,
      h: odpLength(frame.getAttribute('svg:height'), SLIDE_H) || 160
    };
  }

  function odpLength(value, totalPx) {
    const text = String(value || '').trim();
    const num = parseFloat(text) || 0;
    if (text.endsWith('in')) return num / 13.333333 * totalPx;
    if (text.endsWith('cm')) return num / 33.866667 * totalPx;
    if (text.endsWith('mm')) return num / 338.66667 * totalPx;
    if (text.endsWith('pt')) return num / 960 * totalPx;
    return num;
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
    const css = deck.slides.map(slide => slide.importedCss || '').filter(Boolean);
    return css.length ? css.map(scopeImportedCss).join('\n') : '';
  }

  function scopeImportedCss(css) {
    return String(css || '').split('}').map(block => {
      const parts = block.split('{');
      if (parts.length < 2) return '';
      const selector = parts.shift().trim();
      const body = parts.join('{').trim();
      if (!selector || selector.startsWith('@')) return selector + '{' + body + '}';
      const scoped = selector.split(',').map(part => {
        const trimmed = part.trim();
        if (!trimmed || /^(html|body|#deck|\.slide(?:[.:#\s]|$)|\.navbar|\.progress|\.notes-panel|\.help-panel|\.presenter)/.test(trimmed)) return '';
        return '.imported-webdeck-slide ' + trimmed;
      }).filter(Boolean).join(',');
      return scoped ? scoped + '{' + body + '}' : '';
    }).filter(Boolean).join('\n');
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

  function buildWebDeck(passwordHash) {
    const theme = themes[deck.theme] || themes.violet;
    const exportSlides = deck.slides.filter(slide => !slide.hidden);
    const slides = exportSlides.map((slide, index) => ({
      title: slide.title,
      notes: slide.notes,
      bg: slide.bg,
      html: '<div class="slide-bg" style="position:absolute;inset:0;background:' + escapeAttr(slide.backgroundColor || 'transparent') + ';color:' + escapeAttr(slide.defaultTextColor || 'inherit') + '">' + slideToWebDeckHtml(slide, index, exportSlides.length) + '</div>'
    }));
    const globalAudio = deck.globalAudio?.src ? '<audio class="global-audio" src="' + escapeAttr(deck.globalAudio.src) + '" controls loop preload="metadata"></audio>' : '';
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escapeHtml(deck.title) + '</title><style>' +
      webDeckCss(theme) + importedCssForDeck() +
      '</style></head><body data-locked="' + (passwordHash ? 'true' : 'false') + '"><div id="lock"></div><main id="deck"></main>' + globalAudio + '<div class="progress"><span id="progress"></span></div><nav class="bar"><strong>' + escapeHtml(deck.title) + '</strong><button id="prev">‹</button><div id="dots"></div><span id="count"></span><button id="next">›</button><button id="notesBtn">Notes</button><button id="fullBtn">Full</button></nav><aside id="notes"></aside><script>const PASSWORD_HASH="' + passwordHash + '";const SLIDES=' + JSON.stringify(slides) + ';' + webDeckJs() + '<\/script></body></html>';
  }

  function slideToWebDeckHtml(slide, index, totalSlides) {
    const parts = slide.elements.slice().sort((a, b) => (a.z || 0) - (b.z || 0)).map(el => {
      const style = 'left:' + (el.x / SLIDE_W * 100) + '%;top:' + (el.y / SLIDE_H * 100) + '%;width:' + (el.w / SLIDE_W * 100) + '%;height:' + (el.h / SLIDE_H * 100) + '%;font-family:' + escapeAttr(el.fontFamily || 'Inter,Arial,sans-serif') + ';font-size:' + (el.fontSize || 30) + 'px;font-weight:' + (el.bold ? '900' : '600') + ';font-style:' + (el.italic ? 'italic' : 'normal') + ';text-decoration:' + (el.underline ? 'underline' : 'none') + ';color:' + escapeAttr(el.color || slide.defaultTextColor || '#1f2937') + ';background:' + escapeAttr(el.fill || 'transparent') + ';text-align:' + escapeAttr(el.align || 'left') + ';transform:rotate(' + (Number(el.rotate) || 0) + 'deg);transform-origin:center center;';
      if (el.type === 'image') return '<div class="obj" style="' + style + '"><img src="' + escapeAttr(el.src || '') + '" alt="' + escapeAttr(el.alt || '') + '" style="object-fit:' + escapeAttr(el.fit || 'contain') + ';object-position:' + (el.cropX ?? 50) + '% ' + (el.cropY ?? 50) + '%"></div>';
      if (el.type === 'youtube') return '<div class="obj" style="' + style + '"><iframe src="' + escapeAttr(el.src || '') + '" title="' + escapeAttr(el.title || 'YouTube video') + '" allowfullscreen></iframe></div>';
      if (el.type === 'video') return '<div class="obj" style="' + style + '"><video src="' + escapeAttr(el.src || '') + '" controls></video></div>';
      if (el.type === 'audio') return '<div class="obj" style="' + style + '"><audio src="' + escapeAttr(el.src || '') + '" controls></audio></div>';
      if (el.type === 'table') return '<div class="obj table" style="' + style + '">' + tableHtml(el) + '</div>';
      if (el.type === 'html') {
        const scale = clamp(Number(el.importScale) || 1, 0.1, 1);
        const scaleStyle = 'transform-origin:top left;transform:scale(' + scale + ');width:' + (100 / scale) + '%;height:' + (100 / scale) + '%;';
        return '<div class="obj html" style="' + style + '"><div class="imported-webdeck-slide" style="' + scaleStyle + '">' + sanitizeImportedHtml(el.html || '') + '</div></div>';
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

  function webDeckCss(theme) {
    return [
      ':root{--accent:' + theme.accent + ';--dark:' + theme.dark + ';font-family:Inter,Arial,sans-serif;color:#1f2937;background:#111827}',
      'body{margin:0;overflow:hidden}',
      '.slide{position:fixed;inset:0;display:none;background:#fff}.slide.active{display:block}.slide.section,.slide.dark{background:linear-gradient(135deg,var(--dark),var(--accent));color:#fff}',
      '.obj{position:absolute;overflow:hidden;padding:8px;line-height:1.18}.obj img,.obj video,.obj iframe{width:100%;height:100%;object-fit:contain;border:0}.obj table{width:100%;height:100%;border-collapse:collapse}.obj td{border:1px solid #c7d2fe;padding:6px}',
      '.slide-audio{position:absolute;right:20px;bottom:54px;display:grid;gap:6px}.slide-audio audio{width:260px}.global-audio{position:fixed;left:18px;bottom:18px;z-index:3;width:240px}',
      '.footer{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;padding:9px 22px;background:rgba(17,24,39,.9);color:#fff;font-weight:800}',
      '.bar{position:fixed;left:50%;bottom:18px;z-index:5;transform:translateX(-50%);display:flex;gap:8px;align-items:center;max-width:calc(100vw - 28px);padding:9px 12px;border:1px solid rgba(255,255,255,.3);border-radius:999px;background:rgba(17,24,39,.76);backdrop-filter:blur(12px);color:#fff;opacity:1;transition:opacity .18s,transform .18s}.bar:hover{opacity:1;transform:translateX(-50%)}body.controls-hidden .bar{opacity:0;pointer-events:none;transform:translate(-50%,130%)}.bar button{border:1px solid rgba(255,255,255,.28);border-radius:999px;background:rgba(255,255,255,.12);color:#fff;padding:7px 10px;font-weight:800}.bar strong{max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dot{width:10px;height:10px;border-radius:99px;border:0;background:#fff8;vertical-align:middle}.dot.active{width:28px;background:#fff}.progress{position:fixed;top:0;left:0;right:0;height:4px;background:#0003}.progress span{display:block;height:100%;background:var(--accent)}',
      '#notes{position:fixed;left:24px;top:72px;width:min(420px,calc(100vw - 48px));max-height:calc(100vh - 110px);overflow:auto;border-radius:14px;background:#fff;color:#1f2937;box-shadow:0 18px 44px #0004;transform:translateY(-130%);pointer-events:none;transition:.2s;z-index:6}#notes.open{transform:translateY(0);pointer-events:auto}.notes-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 14px;background:#f3f4f6;cursor:move;font-weight:800}.notes-head button{border:1px solid #d1d5db;border-radius:8px;background:#fff;color:#111827;padding:4px 8px}.notes-body{padding:16px}.notes-body p{white-space:pre-wrap}',
      '#lock{position:fixed;inset:0;z-index:10;display:none;place-items:center;background:#111827;color:#fff}body.locked #lock{display:grid}',
      '@media(max-width:640px){.bar strong{display:none}.bar{gap:5px}.dot{width:8px;height:8px}.dot.active{width:20px}.obj{font-size:max(16px,.8em)!important}.global-audio{display:none}}'
    ].join('');
  }

  function webDeckJs() {
    return [
      'let i=0,hideTimer=null,notesWin=null,drag=null;',
      'const deck=document.getElementById("deck"),dots=document.getElementById("dots"),count=document.getElementById("count"),prog=document.getElementById("progress"),notes=document.getElementById("notes");',
      'async function sha(s){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("")}',
      'async function unlock(){if(!PASSWORD_HASH)return;document.body.classList.add("locked");const p=prompt("Password");if(await sha(p||"")===PASSWORD_HASH)document.body.classList.remove("locked");else document.getElementById("lock").textContent="Password required. Reload to try again."}',
      'function esc(s){return String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",\'"\':"&quot;"}[c]))}',
      'function notesHtml(){return "<strong>"+esc(SLIDES[i].title)+"</strong><p>"+esc(SLIDES[i].notes||"No notes.")+"</p>"}',
      'function updateNotes(){notes.innerHTML="<div class=\\"notes-head\\"><span>Notes</span><button id=\\"closeNotes\\" type=\\"button\\">Close</button></div><div class=\\"notes-body\\">"+notesHtml()+"</div>";const close=document.getElementById("closeNotes");if(close)close.onclick=()=>notes.classList.remove("open");if(notesWin&&!notesWin.closed){notesWin.document.body.innerHTML=notesHtml();notesWin.document.title="Notes - "+(SLIDES[i].title||"Slide "+(i+1));}}',
      'function render(){deck.innerHTML=SLIDES.map((s,n)=>`<section class="slide ${s.bg||""} ${n===i?"active":""}">${s.html}</section>`).join("");dots.innerHTML=SLIDES.map((_,n)=>`<button class="dot ${n===i?"active":""}" data-i="${n}" aria-label="Slide ${n+1}"></button>`).join("");count.textContent=(i+1)+" / "+SLIDES.length;prog.style.width=((i+1)/SLIDES.length*100)+"%";updateNotes();location.hash=String(i+1)}',
      'function go(n){i=Math.max(0,Math.min(SLIDES.length-1,n));render()}',
      'function showControls(){document.body.classList.remove("controls-hidden");clearTimeout(hideTimer);hideTimer=setTimeout(()=>document.body.classList.add("controls-hidden"),2600)}',
      'function openNotes(){notesWin=notesWin&&!notesWin.closed?notesWin:window.open("","showsplatNotes","popup=yes,width=440,height=620,left=80,top=80");if(notesWin){notesWin.document.head.innerHTML="<title>Notes</title><style>body{box-sizing:border-box;margin:0;padding:20px;font:18px/1.45 Inter,Arial,sans-serif;color:#111827;background:#fff}strong{display:block;margin-bottom:14px;font-size:22px}p{white-space:pre-wrap}</style>";updateNotes();notesWin.focus();return}notes.classList.toggle("open")}',
      'document.addEventListener("mousemove",e=>{if(e.clientY>window.innerHeight-96)showControls()});document.addEventListener("touchstart",showControls,{passive:true});showControls();',
      'document.addEventListener("click",e=>{if(e.target.closest(".bar,#notes,a,button,video,audio,iframe"))return;const x=e.clientX/window.innerWidth;if(x<.33)go(i-1);else if(x>.66)go(i+1)});',
      'document.addEventListener("keydown",e=>{if(["ArrowRight"," ","ArrowDown"].includes(e.key))go(i+1);if(["ArrowLeft","ArrowUp"].includes(e.key))go(i-1);if(e.key==="Home")go(0);if(e.key==="End")go(SLIDES.length-1);if(e.key.toLowerCase()==="n")openNotes();if(e.key.toLowerCase()==="f")document.documentElement.requestFullscreen?.();});',
      'document.addEventListener("pointerdown",e=>{const head=e.target.closest(".notes-head");if(!head)return;const r=notes.getBoundingClientRect();drag={x:e.clientX-r.left,y:e.clientY-r.top};notes.setPointerCapture?.(e.pointerId)});',
      'document.addEventListener("pointermove",e=>{if(!drag)return;notes.style.left=Math.max(0,Math.min(window.innerWidth-80,e.clientX-drag.x))+"px";notes.style.top=Math.max(0,Math.min(window.innerHeight-60,e.clientY-drag.y))+"px";notes.style.right="auto";notes.style.bottom="auto"});document.addEventListener("pointerup",()=>drag=null);',
      'document.getElementById("prev").onclick=()=>go(i-1);document.getElementById("next").onclick=()=>go(i+1);document.getElementById("notesBtn").onclick=openNotes;document.getElementById("fullBtn").onclick=()=>document.documentElement.requestFullscreen?.();dots.onclick=e=>{if(e.target.dataset.i)go(Number(e.target.dataset.i))};',
      'window.onhashchange=()=>{const n=parseInt(location.hash.slice(1),10);if(n)go(n-1)};const start=parseInt(location.hash.slice(1),10);if(start)i=start-1;unlock();render();'
    ].join('');
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
    return '<!doctype html><html><head><meta charset="utf-8"><title>' + escapeHtml(deck.title) + '</title><style>@page{size:landscape;margin:0}body{margin:0}.slide{position:relative;width:100vw;height:100vh;page-break-after:always;overflow:hidden;background:#fff}.slide.section,.slide.dark{background:#1e1b4b;color:#fff}.obj{position:absolute;padding:8px;overflow:hidden}.obj img,.obj video,.obj iframe{width:100%;height:100%;object-fit:contain;border:0}.footer{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;padding:9px 22px;background:#111827;color:#fff}' + importedCssForDeck() + '</style></head><body>' + exportSlides.map((slide, i) => '<section class="slide ' + escapeAttr(slide.bg) + '">' + slideToWebDeckHtml(slide, i, exportSlides.length) + '</section>').join('') + '</body></html>';
  }

  function present(startIndex) {
    const html = buildWebDeck('');
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const win = window.open(url + '#' + (startIndex + 1), '_blank');
    if (!win) setStatus('Allow pop-ups to present in a new window.');
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
    if (action === 'open-deck' || action === 'import-webdeck' || action === 'import-pptx' || action === 'import-odp') els.deckFile.click();
    if (action === 'add-slide') addSlide('title-content');
    if (action === 'duplicate-slide') duplicateSlide();
    if (action === 'delete-slide') deleteSlide();
    if (action === 'delete-selected-slides') deleteSelectedSlides();
    if (action === 'delete-object') deleteObject();
    if (action === 'add-text') addObject(textElement('Text box', 160, 150, 560, 130, 36));
    if (action === 'add-list') addObject(listElement(['First point', 'Second point', 'Third point'], 170, 170, 650, 250));
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
      syncSlideColorInputs();
      els.themeDialog.showModal();
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
    if (action === 'show-feature-plan') window.open('docs/plan.md', '_blank', 'noopener');
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
      addSlide(templateTarget.dataset.template);
    }
    const themeTarget = event.target.closest('[data-theme]');
    if (themeTarget) {
      deck.theme = themeTarget.dataset.theme;
      saveSoon();
      render();
    }
    const slidePaletteTarget = event.target.closest('[data-slide-palette]');
    if (slidePaletteTarget) applySlidePalette(slidePaletteTarget.dataset.slidePalette);
  });

  document.addEventListener('keydown', event => {
    if (event.target.matches('input, textarea, [contenteditable="true"]')) return;
    if (event.key === 'Delete' || event.key === 'Backspace') deleteObject();
    if (event.key.toLowerCase() === 'n') addSlide('title-content');
    if (event.key.toLowerCase() === 'd') duplicateSlide();
    if (event.key === 'ArrowUp') selectSlide(activeSlide - 1);
    if (event.key === 'ArrowDown') selectSlide(activeSlide + 1);
    if (event.key.toLowerCase() === 'p') present(activeSlide);
    if (event.key === 'Escape') closeMenus();
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
    const reader = /\.(pptx|odp)$/i.test(file.name) ? file.arrayBuffer() : file.text();
    reader.then(content => importDeckFile(file, content)).catch(err => {
      console.warn(err);
      setStatus('Could not open that deck file.');
    });
    els.deckFile.value = '';
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
  render();
})();
