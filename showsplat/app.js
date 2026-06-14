(function () {
  'use strict';

  const STORAGE_KEY = 'showsplat.deck.v1';
  const SLIDE_W = 1600;
  const SLIDE_H = 900;
  const themes = {
    violet: { accent: '#7c3aed', accent2: '#ff9f2f', dark: '#1e1b4b', bg: '#ffffff' },
    sky: { accent: '#0284c7', accent2: '#f59e0b', dark: '#0f172a', bg: '#f8fbff' },
    forest: { accent: '#15803d', accent2: '#f97316', dark: '#13251a', bg: '#fbfff8' },
    slate: { accent: '#475569', accent2: '#8b5cf6', dark: '#111827', bg: '#ffffff' }
  };

  const els = {
    canvas: document.getElementById('slideCanvas'),
    thumbs: document.getElementById('thumbnailList'),
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
    imageFile: document.getElementById('imageFileInput'),
    videoFile: document.getElementById('videoFileInput'),
    deckFile: document.getElementById('deckFileInput')
  };

  let deck = loadDeck();
  let activeSlide = 0;
  let selectedId = null;
  let viewMode = 'normal';
  let autosaveTimer = null;

  function uid(prefix) {
    return prefix + '-' + Math.random().toString(36).slice(2, 9);
  }

  function defaultDeck() {
    return {
      version: 1,
      title: 'Untitled ShowSplat Deck',
      theme: 'violet',
      footer: 'ShowSplatTM by DrawSplatTM',
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
      elements: []
    };
    if (template === 'title') {
      slide.title = 'ShowSplatTM';
      slide.bg = 'section';
      slide.notes = 'I will open by naming the deck and giving the audience a quick sense of what we are going to build or explain. This title slide keeps the focus on the main idea before moving into the details.';
      slide.elements.push(textElement('ShowSplatTM', 150, 230, 920, 120, 72, true, '#ffffff'));
      slide.elements.push(textElement('A WebDeck-first presentation workspace', 158, 360, 900, 70, 34, false, '#f5f3ff'));
    } else if (template === 'section') {
      slide.title = 'Section Break';
      slide.bg = 'section';
      slide.elements.push(textElement('Section title', 140, 280, 900, 120, 64, true, '#ffffff'));
      slide.elements.push(textElement('One sentence that frames the next part.', 148, 410, 780, 70, 30, false, '#f5f3ff'));
    } else if (template === 'comparison') {
      slide.title = 'Comparison';
      slide.elements.push(textElement('Compare two options', 90, 70, 900, 70, 46, true));
      slide.elements.push(textElement('Option A\n- Strength\n- Tradeoff\n- Best use', 120, 210, 560, 360, 34));
      slide.elements.push(textElement('Option B\n- Strength\n- Tradeoff\n- Best use', 900, 210, 560, 360, 34));
    } else if (template === 'media') {
      slide.title = 'Media Focus';
      slide.elements.push(textElement('Media title', 90, 70, 820, 70, 46, true));
      slide.elements.push(shapeElement(120, 180, 1120, 560, 'Drop image or video here'));
    } else if (template === 'quote') {
      slide.title = 'Quote';
      slide.elements.push(textElement('“A short quote or key idea belongs here.”', 150, 240, 1050, 180, 54, true));
      slide.elements.push(textElement('Source or context', 160, 450, 500, 60, 26, false, '#6b7280'));
    } else if (template === 'table') {
      slide.title = 'Table';
      slide.elements.push(textElement('Table title', 90, 70, 820, 70, 46, true));
      slide.elements.push(tableElement(140, 180, 1080, 420));
    } else if (template === 'resources') {
      slide.title = 'Resources';
      slide.elements.push(textElement('Resources', 90, 70, 820, 70, 46, true));
      slide.elements.push(textElement('- Link or next step\n- Link or next step\n- Link or next step', 130, 190, 850, 260, 34));
    } else {
      slide.title = 'Title and Content';
      slide.elements.push(textElement('Slide title', 90, 70, 860, 70, 46, true));
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
      h,
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
      footer: value.footer || 'ShowSplatTM by DrawSplatTM',
      slides: value.slides.map(slide => ({
        id: slide.id || uid('slide'),
        title: slide.title || 'Slide',
        notes: slide.notes || '',
        bg: slide.bg || 'light',
        footer: slide.footer !== false,
        elements: Array.isArray(slide.elements) ? slide.elements.map(normalizeElement) : []
      }))
    };
  }

  function normalizeElement(el) {
    return Object.assign({
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
  }

  function saveSoon() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
      setStatus('Autosaved in this browser.');
    }, 250);
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function render() {
    const theme = themes[deck.theme] || themes.violet;
    document.documentElement.style.setProperty('--accent', theme.accent);
    document.documentElement.style.setProperty('--accent-2', theme.accent2);
    document.documentElement.style.setProperty('--dark', theme.dark);
    els.deckTitle.value = deck.title;
    renderThumbs();
    renderCanvas();
    renderInspector();
    renderSorter();
  }

  function renderThumbs() {
    els.thumbs.innerHTML = '';
    deck.slides.forEach((slide, index) => {
      const button = document.createElement('button');
      button.className = 'thumb' + (index === activeSlide ? ' active' : '');
      button.type = 'button';
      button.dataset.index = index;
      button.innerHTML = '<span class="thumb-num">' + (index + 1) + '</span><span class="thumb-preview">' + escapeHtml(slide.title) + '</span>';
      button.addEventListener('click', () => selectSlide(index));
      els.thumbs.appendChild(button);
    });
  }

  function renderCanvas() {
    const slide = currentSlide();
    els.canvas.className = 'slide-canvas ' + (slide.bg === 'section' ? 'section' : slide.bg === 'dark' ? 'dark' : '');
    els.canvas.innerHTML = '';
    const ordered = slide.elements.slice().sort((a, b) => (a.z || 0) - (b.z || 0));
    ordered.forEach(renderObject);
    if (slide.footer) {
      const footer = document.createElement('div');
      footer.className = 'slide-footer';
      footer.innerHTML = '<span>' + escapeHtml(deck.footer || '') + '</span><span>' + (activeSlide + 1) + ' / ' + deck.slides.length + '</span>';
      els.canvas.appendChild(footer);
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
    node.addEventListener('pointerdown', objectPointerDown);

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
    const handle = document.createElement('span');
    handle.className = 'resize-handle';
    handle.addEventListener('pointerdown', resizePointerDown);
    node.appendChild(handle);
    els.canvas.appendChild(node);
  }

  function tableHtml(el) {
    const rows = el.rows || [['A', 'B'], ['1', '2']];
    return '<table>' + rows.map((row, r) => '<tr>' + row.map((cell, c) => '<td data-r="' + r + '" data-c="' + c + '">' + escapeHtml(cell) + '</td>').join('') + '</tr>').join('') + '</table>';
  }

  function renderInspector() {
    const slide = currentSlide();
    els.notes.value = slide.notes || '';
    const obj = selectedObject();
    if (!obj) {
      els.selectionInfo.textContent = 'No object selected.';
      [els.altText, els.linkUrl, els.posX, els.posY, els.posW, els.posH].forEach(input => input.value = '');
      return;
    }
    els.selectionInfo.textContent = obj.type + ' object';
    els.altText.value = obj.alt || '';
    els.linkUrl.value = obj.href || '';
    els.posX.value = Math.round(obj.x);
    els.posY.value = Math.round(obj.y);
    els.posW.value = Math.round(obj.w);
    els.posH.value = Math.round(obj.h);
    els.fontFamily.value = obj.fontFamily || els.fontFamily.value;
    els.fontSize.value = obj.fontSize || 30;
    els.textColor.value = normalizeColor(obj.color || '#1f2937');
    els.fillColor.value = normalizeColor(obj.fill || '#ffffff');
  }

  function renderSorter() {
    if (viewMode !== 'sorter') return;
    els.sorter.innerHTML = '';
    deck.slides.forEach((slide, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'sorter-card' + (index === activeSlide ? ' active' : '');
      card.innerHTML = '<div class="thumb-preview">' + escapeHtml(slide.title) + '</div><strong>' + (index + 1) + '. ' + escapeHtml(slide.title) + '</strong>';
      card.addEventListener('click', () => {
        selectSlide(index);
        setView('normal');
      });
      els.sorter.appendChild(card);
    });
  }

  function selectSlide(index) {
    activeSlide = Math.max(0, Math.min(deck.slides.length - 1, index));
    selectedId = null;
    render();
  }

  function addSlide(template) {
    deck.slides.splice(activeSlide + 1, 0, makeTemplateSlide(template || 'title-content'));
    activeSlide += 1;
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
    saveSoon();
    render();
  }

  function deleteSlide() {
    if (deck.slides.length === 1) {
      setStatus('A deck needs at least one slide.');
      return;
    }
    deck.slides.splice(activeSlide, 1);
    activeSlide = Math.max(0, activeSlide - 1);
    selectedId = null;
    saveSoon();
    render();
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
    renderInspector();
    if (event.target.classList.contains('resize-handle')) return;
    if (event.target.closest('[contenteditable="true"]') && event.detail > 1) return;
    event.preventDefault();
    const obj = selectedObject();
    const rect = els.canvas.getBoundingClientRect();
    const start = {
      x: event.clientX,
      y: event.clientY,
      objX: obj.x,
      objY: obj.y
    };
    target.setPointerCapture(event.pointerId);
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', stop, { once: true });
    renderCanvas();

    function move(ev) {
      obj.x = clamp(start.objX + (ev.clientX - start.x) / rect.width * SLIDE_W, 0, SLIDE_W - obj.w);
      obj.y = clamp(start.objY + (ev.clientY - start.y) / rect.height * SLIDE_H, 0, SLIDE_H - obj.h);
      renderCanvas();
      renderInspector();
    }

    function stop(ev) {
      target.releasePointerCapture(ev.pointerId);
      target.removeEventListener('pointermove', move);
      saveSoon();
    }
  }

  function resizePointerDown(event) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget.closest('.slide-object');
    selectedId = target.dataset.id;
    const obj = selectedObject();
    const rect = els.canvas.getBoundingClientRect();
    const start = {
      x: event.clientX,
      y: event.clientY,
      w: obj.w,
      h: obj.h
    };
    target.setPointerCapture(event.pointerId);
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', stop, { once: true });

    function move(ev) {
      obj.w = clamp(start.w + (ev.clientX - start.x) / rect.width * SLIDE_W, 60, SLIDE_W - obj.x);
      obj.h = clamp(start.h + (ev.clientY - start.y) / rect.height * SLIDE_H, 40, SLIDE_H - obj.y);
      renderCanvas();
      renderInspector();
    }

    function stop(ev) {
      target.releasePointerCapture(ev.pointerId);
      target.removeEventListener('pointermove', move);
      saveSoon();
    }
  }

  function applyToSelected(mutator) {
    const obj = selectedObject();
    if (!obj) {
      setStatus('Select a slide object first.');
      return;
    }
    mutator(obj);
    saveSoon();
    render();
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

  function exportMarkdown() {
    return deck.slides.map(slide => {
      const lines = ['# ' + slide.title, ''];
      slide.elements.forEach(el => {
        if (el.type === 'list') String(el.text || '').split('\n').filter(Boolean).forEach(item => lines.push('- ' + item));
        if (el.type === 'text') lines.push(String(el.text || ''));
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
    const slides = deck.slides.map((slide, index) => ({
      title: slide.title,
      notes: slide.notes,
      bg: slide.bg,
      html: slideToWebDeckHtml(slide, index)
    }));
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escapeHtml(deck.title) + '</title><style>' +
      webDeckCss(theme) +
      '</style></head><body data-locked="' + (passwordHash ? 'true' : 'false') + '"><div id="lock"></div><main id="deck"></main><div class="progress"><span id="progress"></span></div><nav class="bar"><strong>' + escapeHtml(deck.title) + '</strong><button id="prev">‹</button><div id="dots"></div><span id="count"></span><button id="next">›</button><button id="notesBtn">Notes</button><button id="fullBtn">Full</button></nav><aside id="notes"></aside><script>const PASSWORD_HASH="' + passwordHash + '";const SLIDES=' + JSON.stringify(slides) + ';' + webDeckJs() + '<\/script></body></html>';
  }

  function slideToWebDeckHtml(slide, index) {
    const parts = slide.elements.slice().sort((a, b) => (a.z || 0) - (b.z || 0)).map(el => {
      const style = 'left:' + (el.x / SLIDE_W * 100) + '%;top:' + (el.y / SLIDE_H * 100) + '%;width:' + (el.w / SLIDE_W * 100) + '%;height:' + (el.h / SLIDE_H * 100) + '%;font-family:' + escapeAttr(el.fontFamily || 'Inter,Arial,sans-serif') + ';font-size:' + (el.fontSize || 30) + 'px;font-weight:' + (el.bold ? '900' : '600') + ';font-style:' + (el.italic ? 'italic' : 'normal') + ';text-decoration:' + (el.underline ? 'underline' : 'none') + ';color:' + escapeAttr(el.color || '#1f2937') + ';background:' + escapeAttr(el.fill || 'transparent') + ';text-align:' + escapeAttr(el.align || 'left') + ';';
      if (el.type === 'image') return '<div class="obj" style="' + style + '"><img src="' + escapeAttr(el.src || '') + '" alt="' + escapeAttr(el.alt || '') + '"></div>';
      if (el.type === 'youtube') return '<div class="obj" style="' + style + '"><iframe src="' + escapeAttr(el.src || '') + '" title="' + escapeAttr(el.title || 'YouTube video') + '" allowfullscreen></iframe></div>';
      if (el.type === 'video') return '<div class="obj" style="' + style + '"><video src="' + escapeAttr(el.src || '') + '" controls></video></div>';
      if (el.type === 'audio') return '<div class="obj" style="' + style + '"><audio src="' + escapeAttr(el.src || '') + '" controls></audio></div>';
      if (el.type === 'table') return '<div class="obj table" style="' + style + '">' + tableHtml(el) + '</div>';
      if (el.type === 'list') return '<div class="obj" style="' + style + '"><ul>' + String(el.text || '').split('\n').filter(Boolean).map(item => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul></div>';
      if (el.type === 'link') return '<a class="obj" style="' + style + '" href="' + escapeAttr(el.href || '#') + '" target="_blank" rel="noopener">' + escapeHtml(el.text || 'Link') + '</a>';
      return '<div class="obj" style="' + style + '">' + escapeHtml(el.text || '').replace(/\n/g, '<br>') + '</div>';
    });
    if (slide.footer) parts.push('<div class="footer"><span>' + escapeHtml(deck.footer || '') + '</span><span>' + (index + 1) + ' / ' + deck.slides.length + '</span></div>');
    return parts.join('');
  }

  function webDeckCss(theme) {
    return ':root{--accent:' + theme.accent + ';--dark:' + theme.dark + ';font-family:Inter,Arial,sans-serif;color:#1f2937;background:#111827}body{margin:0;overflow:hidden}.slide{position:fixed;inset:0;display:none;background:#fff}.slide.active{display:block}.slide.section,.slide.dark{background:linear-gradient(135deg,var(--dark),var(--accent));color:#fff}.obj{position:absolute;overflow:auto;padding:8px;line-height:1.18}.obj img,.obj video,.obj iframe{width:100%;height:100%;object-fit:contain;border:0}.obj table{width:100%;height:100%;border-collapse:collapse}.obj td{border:1px solid #c7d2fe;padding:6px}.footer{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;padding:9px 22px;background:rgba(17,24,39,.9);color:#fff;font-weight:800}.bar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:8px;align-items:center;max-width:calc(100vw - 28px);padding:9px 12px;border:1px solid rgba(255,255,255,.3);border-radius:999px;background:rgba(17,24,39,.76);backdrop-filter:blur(12px);color:#fff}.bar button{border:1px solid rgba(255,255,255,.28);border-radius:999px;background:rgba(255,255,255,.12);color:#fff;padding:7px 10px;font-weight:800}.bar strong{max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dot{width:10px;height:10px;border-radius:99px;border:0;background:#fff8;vertical-align:middle}.dot.active{width:28px;background:#fff}.progress{position:fixed;top:0;left:0;right:0;height:4px;background:#0003}.progress span{display:block;height:100%;background:var(--accent)}#notes{position:fixed;left:20px;right:20px;bottom:82px;max-height:35vh;overflow:auto;padding:16px;border-radius:14px;background:#fff;color:#1f2937;box-shadow:0 18px 44px #0004;transform:translateY(130%);pointer-events:none;transition:.2s}#notes.open{transform:translateY(0);pointer-events:auto}#lock{position:fixed;inset:0;z-index:10;display:none;place-items:center;background:#111827;color:#fff}body.locked #lock{display:grid}@media(max-width:640px){.bar strong{display:none}.bar{gap:5px}.dot{width:8px;height:8px}.dot.active{width:20px}.obj{font-size:max(16px,.8em)!important}}';
  }

  function webDeckJs() {
    return 'let i=0;const deck=document.getElementById("deck"),dots=document.getElementById("dots"),count=document.getElementById("count"),prog=document.getElementById("progress"),notes=document.getElementById("notes");async function sha(s){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("")}async function unlock(){if(!PASSWORD_HASH)return;document.body.classList.add("locked");const p=prompt("Password");if(await sha(p||"")===PASSWORD_HASH)document.body.classList.remove("locked");else document.getElementById("lock").textContent="Password required. Reload to try again."}function render(){deck.innerHTML=SLIDES.map((s,n)=>`<section class="slide ${s.bg||""} ${n===i?"active":""}">${s.html}</section>`).join("");dots.innerHTML=SLIDES.map((_,n)=>`<button class="dot ${n===i?"active":""}" data-i="${n}" aria-label="Slide ${n+1}"></button>`).join("");count.textContent=(i+1)+" / "+SLIDES.length;prog.style.width=((i+1)/SLIDES.length*100)+"%";notes.innerHTML="<strong>"+SLIDES[i].title+"</strong><p>"+(SLIDES[i].notes||"No notes.")+"</p>";location.hash=String(i+1)}function go(n){i=Math.max(0,Math.min(SLIDES.length-1,n));render()}document.addEventListener("click",e=>{if(e.target.closest(".bar,#notes,a,button,video,audio,iframe"))return;const x=e.clientX/window.innerWidth;if(x<.33)go(i-1);else if(x>.66)go(i+1)});document.addEventListener("keydown",e=>{if(["ArrowRight"," ","ArrowDown"].includes(e.key))go(i+1);if(["ArrowLeft","ArrowUp"].includes(e.key))go(i-1);if(e.key==="Home")go(0);if(e.key==="End")go(SLIDES.length-1);if(e.key.toLowerCase()==="n")notes.classList.toggle("open");if(e.key.toLowerCase()==="f")document.documentElement.requestFullscreen?.();});document.getElementById("prev").onclick=()=>go(i-1);document.getElementById("next").onclick=()=>go(i+1);document.getElementById("notesBtn").onclick=()=>notes.classList.toggle("open");document.getElementById("fullBtn").onclick=()=>document.documentElement.requestFullscreen?.();dots.onclick=e=>{if(e.target.dataset.i)go(Number(e.target.dataset.i))};window.onhashchange=()=>{const n=parseInt(location.hash.slice(1),10);if(n)go(n-1)};const start=parseInt(location.hash.slice(1),10);if(start)i=start-1;unlock();render();';
  }

  function printPdf() {
    const win = window.open('', '_blank');
    win.document.write(buildPrintDeck());
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  function buildPrintDeck() {
    return '<!doctype html><html><head><meta charset="utf-8"><title>' + escapeHtml(deck.title) + '</title><style>@page{size:landscape;margin:0}body{margin:0}.slide{position:relative;width:100vw;height:100vh;page-break-after:always;overflow:hidden;background:#fff}.slide.section,.slide.dark{background:#1e1b4b;color:#fff}.obj{position:absolute;padding:8px;overflow:hidden}.obj img,.obj video,.obj iframe{width:100%;height:100%;object-fit:contain;border:0}.footer{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;padding:9px 22px;background:#111827;color:#fff}</style></head><body>' + deck.slides.map((slide, i) => '<section class="slide ' + escapeAttr(slide.bg) + '">' + slideToWebDeckHtml(slide, i) + '</section>').join('') + '</body></html>';
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

  function closeMenus() {
    document.querySelectorAll('.menu[open]').forEach(menu => menu.open = false);
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
    if (action === 'open-deck') els.deckFile.click();
    if (action === 'add-slide') addSlide('title-content');
    if (action === 'duplicate-slide') duplicateSlide();
    if (action === 'delete-slide') deleteSlide();
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
    if (action === 'toggle-bold') applyToSelected(obj => obj.bold = !obj.bold);
    if (action === 'toggle-italic') applyToSelected(obj => obj.italic = !obj.italic);
    if (action === 'toggle-underline') applyToSelected(obj => obj.underline = !obj.underline);
    if (action === 'align-left') applyToSelected(obj => obj.align = 'left');
    if (action === 'align-center') applyToSelected(obj => obj.align = 'center');
    if (action === 'align-right') applyToSelected(obj => obj.align = 'right');
    if (action === 'bring-forward') applyToSelected(obj => obj.z = Date.now());
    if (action === 'send-backward') applyToSelected(obj => obj.z = 1);
    if (action === 'toggle-footer') {
      currentSlide().footer = !currentSlide().footer;
      saveSoon();
      render();
    }
    if (action === 'theme-gallery') {
      els.footerText.value = deck.footer || '';
      els.themeDialog.showModal();
    }
    if (action === 'apply-footer') {
      deck.footer = els.footerText.value;
      saveSoon();
      render();
    }
    if (action === 'open-markdown') openMarkdown();
    if (action === 'load-markdown-sample') els.markdownInput.value = '# ShowSplatTM\n\n- Build slides from Markdown\n- Insert media anywhere\n- Export WebDeck HTML\n\n---\n\n# Media slide\n\n- Add YouTube, MP4, WebM, PNG, JPG, and tables';
    if (action === 'import-markdown') importMarkdown();
    if (action === 'copy-markdown') navigator.clipboard?.writeText(exportMarkdown()).then(() => setStatus('Markdown copied.'));
    if (action === 'export-markdown') download((deck.title || 'showsplat-deck').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.md', exportMarkdown(), 'text/markdown');
    if (action === 'export-webdeck') exportWebDeck();
    if (action === 'print-pdf') printPdf();
    if (action === 'planned-export') alert(target.dataset.kind + ' export is planned after the ShowSplat deck model stabilizes. Use WebDeck HTML or browser PDF export in this first release.');
    if (action === 'present-first') present(0);
    if (action === 'present-current') present(activeSlide);
    if (action === 'view-normal') setView('normal');
    if (action === 'view-sorter') setView('sorter');
    if (action === 'view-notes') els.notes.focus();
    if (action === 'toggle-sidebar') els.workspace.classList.toggle('show-inspector');
    if (action === 'show-feature-plan') window.open('docs/plan.md', '_blank', 'noopener');
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
    viewMode = mode;
    els.sorter.hidden = mode !== 'sorter';
    els.stage.hidden = mode === 'sorter';
    render();
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
  els.textColor.addEventListener('input', () => applyToSelected(obj => obj.color = els.textColor.value));
  els.fillColor.addEventListener('input', () => applyToSelected(obj => obj.fill = els.fillColor.value));
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
  els.deckFile.addEventListener('change', () => {
    const file = els.deckFile.files[0];
    if (!file) return;
    file.text().then(text => {
      deck = normalizeDeck(JSON.parse(text));
      activeSlide = 0;
      selectedId = null;
      saveSoon();
      render();
    }).catch(() => setStatus('Could not open that deck file.'));
    els.deckFile.value = '';
  });

  window.addEventListener('beforeunload', () => localStorage.setItem(STORAGE_KEY, JSON.stringify(deck)));
  render();
})();
