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
      slide.elements.push(textElement('Compare two options', 90, 70, 900, 70, 46, true));
      slide.elements.push(textElement('Option A\n- Strength\n- Tradeoff\n- Best use', 120, 210, 560, 360, 34));
      slide.elements.push(textElement('Option B\n- Strength\n- Tradeoff\n- Best use', 900, 210, 560, 360, 34));
    } else if (template === 'media') {
      slide.title = 'Media Focus';
      slide.elements.push(textElement('Media title', 90, 70, 820, 70, 46, true));
      slide.elements.push(shapeElement(120, 180, 1120, 560, 'Drop image or video here'));
    } else if (template === 'graph') {
      slide.title = 'Graph or Data Story';
      slide.elements.push(textElement('What the data shows', 90, 70, 860, 70, 46, true));
      slide.elements.push(shapeElement(100, 175, 780, 540, 'Place a graph from GridSplat, Graph Maker, or Chart Studio'));
      slide.elements.push(textElement('Key takeaways\n- Pattern\n- Evidence\n- Why it matters', 950, 210, 480, 330, 32));
    } else if (template === 'concept-map') {
      slide.title = 'Concept Map Explanation';
      slide.elements.push(textElement('How the ideas connect', 90, 70, 900, 70, 46, true));
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
      slide.elements.push(textElement('Process or sequence', 95, 65, 900, 72, 48, true, '#ffffff'));
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
      footer: value.footer || 'ShowSplat™ by DrawSplat™',
      globalAudio: normalizeAudio(value.globalAudio),
      slides: value.slides.map(slide => ({
        id: slide.id || uid('slide'),
        title: slide.title || 'Slide',
        notes: slide.notes || '',
        bg: slide.bg || 'light',
        footer: slide.footer !== false,
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
      button.innerHTML = '<span class="thumb-num">' + (index + 1) + '</span>';
      button.appendChild(buildMiniSlide(slide, index));
      button.addEventListener('click', () => selectSlide(index));
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
    if (el.id === selectedId) {
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
    }
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
    if (cropTargetId && cropTargetId !== id) cropTargetId = null;
    renderInspector();
    if (event.target.classList.contains('resize-handle') || event.target.classList.contains('rotate-handle')) return;
    if (event.target.closest('[contenteditable="true"]') && event.detail > 1) return;
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
    const globalAudio = deck.globalAudio?.src ? '<audio class="global-audio" src="' + escapeAttr(deck.globalAudio.src) + '" controls loop preload="metadata"></audio>' : '';
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escapeHtml(deck.title) + '</title><style>' +
      webDeckCss(theme) +
      '</style></head><body data-locked="' + (passwordHash ? 'true' : 'false') + '"><div id="lock"></div><main id="deck"></main>' + globalAudio + '<div class="progress"><span id="progress"></span></div><nav class="bar"><strong>' + escapeHtml(deck.title) + '</strong><button id="prev">‹</button><div id="dots"></div><span id="count"></span><button id="next">›</button><button id="notesBtn">Notes</button><button id="fullBtn">Full</button></nav><aside id="notes"></aside><script>const PASSWORD_HASH="' + passwordHash + '";const SLIDES=' + JSON.stringify(slides) + ';' + webDeckJs() + '<\/script></body></html>';
  }

  function slideToWebDeckHtml(slide, index) {
    const parts = slide.elements.slice().sort((a, b) => (a.z || 0) - (b.z || 0)).map(el => {
      const style = 'left:' + (el.x / SLIDE_W * 100) + '%;top:' + (el.y / SLIDE_H * 100) + '%;width:' + (el.w / SLIDE_W * 100) + '%;height:' + (el.h / SLIDE_H * 100) + '%;font-family:' + escapeAttr(el.fontFamily || 'Inter,Arial,sans-serif') + ';font-size:' + (el.fontSize || 30) + 'px;font-weight:' + (el.bold ? '900' : '600') + ';font-style:' + (el.italic ? 'italic' : 'normal') + ';text-decoration:' + (el.underline ? 'underline' : 'none') + ';color:' + escapeAttr(el.color || '#1f2937') + ';background:' + escapeAttr(el.fill || 'transparent') + ';text-align:' + escapeAttr(el.align || 'left') + ';transform:rotate(' + (Number(el.rotate) || 0) + 'deg);transform-origin:center center;';
      if (el.type === 'image') return '<div class="obj" style="' + style + '"><img src="' + escapeAttr(el.src || '') + '" alt="' + escapeAttr(el.alt || '') + '" style="object-fit:' + escapeAttr(el.fit || 'contain') + ';object-position:' + (el.cropX ?? 50) + '% ' + (el.cropY ?? 50) + '%"></div>';
      if (el.type === 'youtube') return '<div class="obj" style="' + style + '"><iframe src="' + escapeAttr(el.src || '') + '" title="' + escapeAttr(el.title || 'YouTube video') + '" allowfullscreen></iframe></div>';
      if (el.type === 'video') return '<div class="obj" style="' + style + '"><video src="' + escapeAttr(el.src || '') + '" controls></video></div>';
      if (el.type === 'audio') return '<div class="obj" style="' + style + '"><audio src="' + escapeAttr(el.src || '') + '" controls></audio></div>';
      if (el.type === 'table') return '<div class="obj table" style="' + style + '">' + tableHtml(el) + '</div>';
      if (el.type === 'list') return '<div class="obj" style="' + style + '"><ul>' + String(el.text || '').split('\n').filter(Boolean).map(item => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul></div>';
      if (el.type === 'link') return '<a class="obj" style="' + style + '" href="' + escapeAttr(el.href || '#') + '" target="_blank" rel="noopener">' + escapeHtml(el.text || 'Link') + '</a>';
      return '<div class="obj" style="' + style + '">' + escapeHtml(el.text || '').replace(/\n/g, '<br>') + '</div>';
    });
    if (slide.footer) parts.push('<div class="footer"><span>' + escapeHtml(deck.footer || '') + '</span><span>' + (index + 1) + ' / ' + deck.slides.length + '</span></div>');
    if (slide.audio && slide.audio.length) {
      parts.push('<div class="slide-audio">' + slide.audio.map(audio => '<audio src="' + escapeAttr(audio.src || '') + '" controls preload="metadata"></audio>').join('') + '</div>');
    }
    return parts.join('');
  }

  function webDeckCss(theme) {
    return ':root{--accent:' + theme.accent + ';--dark:' + theme.dark + ';font-family:Inter,Arial,sans-serif;color:#1f2937;background:#111827}body{margin:0;overflow:hidden}.slide{position:fixed;inset:0;display:none;background:#fff}.slide.active{display:block}.slide.section,.slide.dark{background:linear-gradient(135deg,var(--dark),var(--accent));color:#fff}.obj{position:absolute;overflow:hidden;padding:8px;line-height:1.18}.obj img,.obj video,.obj iframe{width:100%;height:100%;object-fit:contain;border:0}.obj table{width:100%;height:100%;border-collapse:collapse}.obj td{border:1px solid #c7d2fe;padding:6px}.slide-audio{position:absolute;right:20px;bottom:54px;display:grid;gap:6px}.slide-audio audio{width:260px}.global-audio{position:fixed;left:18px;bottom:18px;z-index:3;width:240px}.footer{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;padding:9px 22px;background:rgba(17,24,39,.9);color:#fff;font-weight:800}.bar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:8px;align-items:center;max-width:calc(100vw - 28px);padding:9px 12px;border:1px solid rgba(255,255,255,.3);border-radius:999px;background:rgba(17,24,39,.76);backdrop-filter:blur(12px);color:#fff}.bar button{border:1px solid rgba(255,255,255,.28);border-radius:999px;background:rgba(255,255,255,.12);color:#fff;padding:7px 10px;font-weight:800}.bar strong{max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dot{width:10px;height:10px;border-radius:99px;border:0;background:#fff8;vertical-align:middle}.dot.active{width:28px;background:#fff}.progress{position:fixed;top:0;left:0;right:0;height:4px;background:#0003}.progress span{display:block;height:100%;background:var(--accent)}#notes{position:fixed;left:20px;right:20px;bottom:82px;max-height:35vh;overflow:auto;padding:16px;border-radius:14px;background:#fff;color:#1f2937;box-shadow:0 18px 44px #0004;transform:translateY(130%);pointer-events:none;transition:.2s}#notes.open{transform:translateY(0);pointer-events:auto}#lock{position:fixed;inset:0;z-index:10;display:none;place-items:center;background:#111827;color:#fff}body.locked #lock{display:grid}@media(max-width:640px){.bar strong{display:none}.bar{gap:5px}.dot{width:8px;height:8px}.dot.active{width:20px}.obj{font-size:max(16px,.8em)!important}.global-audio{display:none}}';
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
    if (action === 'autofit-textbox') autofitTextBox();
    if (action === 'fit-text-to-box') fitTextToBox();
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
    if (action === 'load-markdown-sample') els.markdownInput.value = '# ShowSplat™\n\n- Build slides from Markdown\n- Insert media anywhere\n- Export WebDeck HTML\n\n---\n\n# Media slide\n\n- Add YouTube, MP4, WebM, PNG, JPG, and tables';
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
