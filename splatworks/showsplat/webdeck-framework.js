/* ============================================================
   Web Deck Framework — navigation, presenter view, sync, print
   No dependencies. Include once per deck, after the slides.
   Two-monitor use: press V (or the 🖥 button) to open the
   presenter window on your laptop; drag the main window to the
   projector and press F for fullscreen. Both stay in sync.
   ============================================================ */
(function () {
  'use strict';

  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  if (!slides.length) return;
  var TOTAL = slides.length;

  // ── Cross-window sync (same origin) ─────────────────────
  var CH = 'webdeck:' + location.pathname;
  var bc = ('BroadcastChannel' in window) ? new BroadcastChannel(CH) : null;
  function send(msg) {
    if (bc) { try { bc.postMessage(msg); } catch (e) {} }
    try { localStorage.setItem(CH, JSON.stringify(Object.assign({ _t: Date.now() }, msg))); } catch (e) {}
  }
  function onMsg(fn) {
    if (bc) bc.onmessage = function (e) { fn(e.data); };
    window.addEventListener('storage', function (e) {
      if (e.key === CH && e.newValue) { try { fn(JSON.parse(e.newValue)); } catch (_) {} }
    });
  }

  var isPresenter = /[?&]presenter=1/.test(location.search);
  if (isPresenter) { initPresenter(); return; }

  /* ==========================================================
     MAIN DECK
     ========================================================== */
  var deck = document.querySelector('.deck');
  var SLIDE_W = 1280, SLIDE_H = 720, idx = 0;

  var progress = el('div', { id: 'progress' });
  var counter = el('span', { id: 'counter' });
  var controls = el('div', { id: 'controls' });
  controls.appendChild(btn('‹', 'Previous slide', prev));
  controls.appendChild(counter);
  controls.appendChild(btn('›', 'Next slide', next));
  controls.appendChild(btn('🗒', 'Toggle presenter notes here (S)', toggleNotes));
  controls.appendChild(btn('🖥', 'Open presenter view for your laptop (V)', openPresenter));
  controls.appendChild(btn('⛶', 'Fullscreen (F)', toggleFull));
  controls.appendChild(btn('?', 'Keyboard help', toggleHelp));

  var notesPanel = el('div', { id: 'notesPanel' });
  var npHead = el('div', { class: 'np-head' });
  var npTitle = document.createElement('span'); npTitle.textContent = 'Speaker Notes';
  var npSlide = el('span', { class: 'np-slide' });
  npHead.appendChild(npTitle); npHead.appendChild(npSlide);
  var npBody = el('div', { class: 'np-body' });
  notesPanel.appendChild(npHead); notesPanel.appendChild(npBody);

  var help = el('div', { id: 'help' });
  help.innerHTML = '<div class="help-card"><h3>Keyboard shortcuts</h3>' +
    '<table>' +
    '<tr><td><kbd>→</kbd> <kbd>Space</kbd></td><td>Next slide</td></tr>' +
    '<tr><td><kbd>←</kbd></td><td>Previous slide</td></tr>' +
    '<tr><td><kbd>Home</kbd> / <kbd>End</kbd></td><td>First / last slide</td></tr>' +
    '<tr><td><kbd>V</kbd></td><td>Open presenter view (second monitor)</td></tr>' +
    '<tr><td><kbd>S</kbd></td><td>Toggle notes on this screen</td></tr>' +
    '<tr><td><kbd>F</kbd></td><td>Fullscreen</td></tr>' +
    '<tr><td><kbd>P</kbd></td><td>Print / export to PDF</td></tr>' +
    '</table><div class="close-hint">Press any key or click to close</div></div>';

  // live region for slide-change announcements (WCAG 4.1.3)
  var liveRegion = el('div', { id: 'slideLive', 'aria-live': 'polite', 'aria-atomic': 'true', class: 'sr-only' });

  document.body.appendChild(progress);
  document.body.appendChild(controls);
  document.body.appendChild(notesPanel);
  document.body.appendChild(help);
  document.body.appendChild(liveRegion);

  function fit() {
    var pad = 24;
    var raw = Math.min((window.innerWidth - pad) / SLIDE_W, (window.innerHeight - pad) / SLIDE_H);
    // Reflow when the screen is narrow or zoom shrinks the fit below a usable scale (WCAG 1.4.10 / 1.4.4).
    var reflow = window.innerWidth < 800 || raw < 0.55;
    deck.classList.toggle('reflow', reflow);
    slides.forEach(function (s) {
      if (reflow) {
        s.style.transform = ''; s.style.left = ''; s.style.top = '';
      } else {
        s.style.transform = 'translate(-50%, -50%) scale(' + Math.max(0.2, raw) + ')';
        s.style.left = '50%'; s.style.top = '50%';
      }
    });
  }
  window.addEventListener('resize', fit);

  function show(n, fromSync) {
    idx = Math.max(0, Math.min(TOTAL - 1, n));
    slides.forEach(function (s, i) { s.classList.toggle('current', i === idx); });
    counter.textContent = (idx + 1) + ' / ' + TOTAL;
    progress.style.width = ((idx + 1) / TOTAL * 100) + '%';
    var titleEl = slides[idx].querySelector('.slide-title, h1, h2');
    liveRegion.textContent = 'Slide ' + (idx + 1) + ' of ' + TOTAL + (titleEl ? ': ' + titleEl.textContent.trim() : '');
    updateNotes();
    if (history.replaceState) history.replaceState(null, '', '#' + (idx + 1));
    if (!fromSync) send({ type: 'goto', idx: idx });
  }
  function next() { show(idx + 1); }
  function prev() { show(idx - 1); }

  function updateNotes() {
    var src = slides[idx].querySelector('.notes');
    npSlide.textContent = 'Slide ' + (idx + 1) + ' of ' + TOTAL;
    npBody.innerHTML = src ? src.innerHTML : '<p class="muted">No notes for this slide.</p>';
  }

  function toggleNotes() { notesPanel.classList.toggle('open'); }
  function toggleHelp() { help.classList.toggle('open'); }
  function toggleFull() {
    if (!document.fullscreenElement) { (document.documentElement.requestFullscreen || function () {}).call(document.documentElement); }
    else if (document.exitFullscreen) { document.exitFullscreen(); }
  }
  var presenterWin = null;
  function openPresenter() {
    presenterWin = window.open(location.pathname + '?presenter=1', 'webdeck-presenter',
      'width=1280,height=800,menubar=no,toolbar=no,location=no');
    if (presenterWin) setTimeout(function () { send({ type: 'goto', idx: idx }); }, 400);
  }

  document.addEventListener('keydown', function (e) {
    if (help.classList.contains('open')) { help.classList.remove('open'); return; }
    switch (e.key) {
      case 'ArrowRight': case ' ': case 'PageDown': next(); e.preventDefault(); break;
      case 'ArrowLeft': case 'PageUp': prev(); e.preventDefault(); break;
      case 'Home': show(0); break;
      case 'End': show(TOTAL - 1); break;
      case 's': case 'S': case 'n': case 'N': toggleNotes(); break;
      case 'v': case 'V': openPresenter(); break;
      case 'f': case 'F': toggleFull(); break;
      case 'p': case 'P': window.print(); break;
      case '?': toggleHelp(); break;
    }
  });

  deck.addEventListener('click', function (e) {
    if (e.target.closest('a, button, input, textarea, select, .no-advance')) return;
    if (e.clientX < window.innerWidth * 0.32) prev(); else next();
  });
  help.addEventListener('click', function () { help.classList.remove('open'); });

  onMsg(function (m) {
    if (!m) return;
    if (m.type === 'goto' && m.idx !== idx) show(m.idx, true);
    else if (m.type === 'hello') send({ type: 'goto', idx: idx });
  });

  fit();
  var start = parseInt((location.hash || '').replace('#', ''), 10);
  show(isNaN(start) ? 0 : start - 1, true);
  window.__deck = { show: show, next: next, prev: prev, presenter: openPresenter };

  function el(tag, attrs) { var e = document.createElement(tag); if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function btn(label, title, fn) { var b = el('button', { title: title, 'aria-label': title }); b.textContent = label; b.addEventListener('click', function (ev) { ev.stopPropagation(); fn(); }); return b; }

  /* ==========================================================
     PRESENTER WINDOW
     ========================================================== */
  function initPresenter() {
    document.body.classList.add('presenter-mode');
    var pIdx = 0;
    var wrap = document.createElement('div'); wrap.id = 'presenter';
    wrap.innerHTML =
      '<div class="pv-top">' +
        '<span class="brand">✦ Presenter</span>' +
        '<div class="pv-nav">' +
          '<button class="pv-btn icon" id="pvPrev" title="Previous">‹</button>' +
          '<button class="pv-btn icon" id="pvNext" title="Next">›</button>' +
        '</div>' +
        '<span class="pv-count" id="pvCount">1 / ' + TOTAL + '</span>' +
        '<span class="pv-spacer"></span>' +
        '<div class="pv-metrics">' +
          '<span class="pv-timer" id="pvTimer" title="Click to pause or resume">00:00</span>' +
          '<button class="pv-btn" id="pvReset">Reset timer</button>' +
          '<span class="pv-clock" id="pvClock">--:--</span>' +
        '</div>' +
      '</div>' +
      '<div class="pv-main">' +
        '<div class="pv-left">' +
          '<div class="pv-label"><span class="dot"></span>Current slide</div>' +
          '<div class="pv-frame" id="pvCurrent"></div>' +
        '</div>' +
        '<div class="pv-right">' +
          '<div class="pv-next-wrap">' +
            '<div class="pv-label"><span class="dot"></span>Next up</div>' +
            '<div class="pv-frame" id="pvNext"></div>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;min-height:0;flex:1;">' +
            '<div class="pv-label"><span class="dot"></span>Speaker notes</div>' +
            '<div class="pv-notes"><div class="pv-notes-body" id="pvNotes"></div></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="pv-hint">Navigate with <kbd>←</kbd> <kbd>→</kbd> or <kbd>Space</kbd>. This window and the projector stay in sync. Put the other window on the projector and press <kbd>F</kbd> to go fullscreen.</div>';
    document.body.appendChild(wrap);

    var elCur = document.getElementById('pvCurrent');
    var elNext = document.getElementById('pvNext');
    var elNotes = document.getElementById('pvNotes');
    var elCount = document.getElementById('pvCount');

    function preview(container, i, big) {
      container.innerHTML = '';
      if (i < 0 || i >= TOTAL) { container.innerHTML = '<div class="pv-end">End of deck</div>'; container.style.height = (big ? 300 : 150) + 'px'; return; }
      var holder = document.createElement('div'); holder.className = 'pv-holder';
      var clone = slides[i].cloneNode(true);
      clone.classList.add('current');
      clone.style.position = 'absolute'; clone.style.left = '0'; clone.style.top = '0'; clone.style.margin = '0';
      var notesInClone = clone.querySelector('.notes'); if (notesInClone) notesInClone.remove();
      holder.appendChild(clone);
      container.appendChild(holder);
      scale(container, holder);
    }
    function scale(container, holder) {
      var w = container.clientWidth || 600;
      var s = w / 1280;
      holder.style.width = '1280px'; holder.style.height = '720px';
      holder.style.transform = 'scale(' + s + ')'; holder.style.transformOrigin = 'top left';
      container.style.height = (720 * s) + 'px';
    }
    function render() {
      preview(elCur, pIdx, true);
      preview(elNext, pIdx + 1, false);
      var src = slides[pIdx] && slides[pIdx].querySelector('.notes');
      elNotes.innerHTML = src ? src.innerHTML : '<p style="color:#8FA6C8">No notes for this slide.</p>';
      elCount.textContent = (pIdx + 1) + ' / ' + TOTAL;
    }
    function goto(n, fromSync) {
      pIdx = Math.max(0, Math.min(TOTAL - 1, n));
      render();
      if (!fromSync) send({ type: 'goto', idx: pIdx });
    }

    document.getElementById('pvPrev').onclick = function () { goto(pIdx - 1); };
    document.getElementById('pvNext').onclick = function () { goto(pIdx + 1); };
    document.getElementById('pvCurrent').onclick = function () { goto(pIdx + 1); };
    document.addEventListener('keydown', function (e) {
      switch (e.key) {
        case 'ArrowRight': case ' ': case 'PageDown': goto(pIdx + 1); e.preventDefault(); break;
        case 'ArrowLeft': case 'PageUp': goto(pIdx - 1); e.preventDefault(); break;
        case 'Home': goto(0); break;
        case 'End': goto(TOTAL - 1); break;
        case 't': case 'T': resetTimer(); break;
      }
    });
    window.addEventListener('resize', render);

    onMsg(function (m) { if (m && m.type === 'goto') goto(m.idx, true); });
    send({ type: 'hello' });
    var last = null; try { last = JSON.parse(localStorage.getItem(CH)); } catch (e) {}
    goto(last && typeof last.idx === 'number' ? last.idx : 0, true);

    // Timer + clock
    var elapsed = 0, running = true;
    var elTimer = document.getElementById('pvTimer'), elClock = document.getElementById('pvClock');
    function fmt(s) { var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r; }
    function tick() {
      if (running) { elapsed++; elTimer.textContent = fmt(elapsed); }
      var d = new Date();
      elClock.textContent = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    }
    function resetTimer() { elapsed = 0; elTimer.textContent = '00:00'; }
    elTimer.onclick = function () { running = !running; elTimer.classList.toggle('paused', !running); };
    document.getElementById('pvReset').onclick = resetTimer;
    setInterval(tick, 1000); tick();
    render();
  }
})();

/* Copy-to-clipboard used by prompt blocks across decks and pages */
function copyText(btn, ev) {
  if (ev) ev.stopPropagation();
  var target = btn.getAttribute('data-target');
  var node = target ? document.getElementById(target)
                    : btn.parentElement.querySelector('.prompt, .copytext');
  if (!node) return;
  var clone = node.cloneNode(true);                 // strip the Copy button from the copied text
  var b = clone.querySelector('.copy-btn'); if (b) b.parentNode.removeChild(b);
  var text = (clone.innerText || clone.textContent || '').trim();
  if (!text) return;
  navigator.clipboard.writeText(text).then(function () {
    var old = btn.textContent;
    btn.textContent = 'Copied';
    btn.classList.add('copied');
    setTimeout(function () { btn.textContent = old; btn.classList.remove('copied'); }, 1600);
  });
}