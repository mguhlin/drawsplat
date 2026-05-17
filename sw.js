/* DrawSplat v3.0 — minimal offline shell. Caches the static app on first load. */
const CACHE = 'drawsplat-v3.0.2';
const SHELL = [
  './',
  './index.html',
  './start.html',
  './background-templates.html',
  './pricing.html',
  './terms-privacy.html',
  './district-addendum.html',
  './admin-access.html',
  './mysql-setup.html',
  './whiteboard.html','./index-sp.html','./index-vn.html','./index-ab.html','./index-cn.html','./index.uh.html',
  './admin.html','./admin.js','./admin-gate.js','./mysql-setup.js',
  './app.js','./app.css','./i18n.js','./locales.js','./DrawSplat_logo.png',
  './assets/backgrounds/kwl-chart.svg',
  './assets/backgrounds/frayer-model.svg',
  './assets/backgrounds/t-chart.svg',
  './assets/backgrounds/storyboard.svg',
  './assets/backgrounds/venn-diagram.svg',
  './assets/backgrounds/timeline.svg',
  './assets/backgrounds/cornell-notes.svg',
  './assets/backgrounds/exit-ticket.svg',
  './assets/backgrounds/lab-notes.svg',
  './assets/backgrounds/vocabulary-builder.svg',
  './assets/backgrounds/coordinate-plane.svg',
  './assets/backgrounds/reading-response.svg',
  './assets/backgrounds/choice-board.svg',
  './assets/backgrounds/blank-anchor-chart.svg'
  /* './mermaid.min.js' — add manually after downloading; not in SHELL by default so the SW install doesn't fail when it's absent */
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

const NETWORK_FIRST_PATHS = ['/app.js','/app.css','/locales.js','/i18n.js'];
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  /* Same-origin only — never intercept Apps Script POSTs or any third-party. */
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;
  const isShellScript = NETWORK_FIRST_PATHS.some(p => url.pathname.endsWith(p));
  e.respondWith((async()=>{
    /* Network first for HTML and app-shell scripts so edits land on next reload. */
    if(req.mode === 'navigate' || req.destination === 'document' || isShellScript){
      try{ const fresh = await fetch(req); if(fresh && fresh.ok){ const c = await caches.open(CACHE); c.put(req, fresh.clone()) } return fresh }
      catch(_){ const cached = await caches.match(req); return cached || (req.mode==='navigate'?caches.match('./index.html'):new Response('', {status: 504})) }
    }
    /* Cache first for vendor and other static assets. */
    const cached = await caches.match(req);
    if(cached) return cached;
    try{ const fresh = await fetch(req); if(fresh && fresh.ok){ const c = await caches.open(CACHE); c.put(req, fresh.clone()) } return fresh }
    catch(_){ return cached || new Response('', {status: 504}) }
  })());
});
