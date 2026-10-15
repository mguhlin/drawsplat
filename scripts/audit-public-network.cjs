/* Read-only startup network observations. Never submit forms or send write requests. */
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const base = new URL(process.argv[2] || 'https://splatworks.org');
  if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password || base.pathname !== '/') throw new Error('Supply a root HTTP(S) origin without credentials.');
  const output = process.argv[3] || path.join(root, 'data/privacy-network-observations.json');
  const items = JSON.parse(fs.readFileSync(path.join(root, 'data/privacy-inventory.json'))).components;
  const browser = await chromium.launch();
  const results = [];
  let cursor = 0;
  try {
    await Promise.all(Array.from({ length: 3 }, async () => {
      while (cursor < items.length) {
        const item = items[cursor++];
        const context = await browser.newContext({ serviceWorkers: 'block' });
        try {
          await context.addInitScript(() => localStorage.setItem('drawsplat.consent.accepted', '1'));
          const hosts = new Map(), attemptedHosts = new Map();
          let blockedWrites = 0, pageStatus = null, domContentLoaded = false, documentCacheControl = null;
          await context.route('**/*', async route => {
            const request = route.request();
            const url = new URL(request.url());
            if (/^https?:$/.test(url.protocol) && url.origin !== base.origin) {
              if (!hosts.has(url.hostname)) hosts.set(url.hostname, new Set());
              hosts.get(url.hostname).add(request.resourceType());
            }
            if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
              blockedWrites++; return route.abort();
            }
            return route.continue();
          });
          const page = await context.newPage();
          page.on('request', request => {
            const url = new URL(request.url());
            if (/^https?:$/.test(url.protocol) && url.origin !== base.origin) {
              if (!attemptedHosts.has(url.hostname)) attemptedHosts.set(url.hostname, new Set());
              attemptedHosts.get(url.hostname).add(request.resourceType());
            }
          });
          try {
            const response = await page.goto(new URL(item.path, base).href, { waitUntil: 'domcontentloaded', timeout: 15000 });
            pageStatus = response?.status() || null; documentCacheControl = response?.headers()['cache-control'] || null; domContentLoaded = true;
          } catch (_) { /* Partial observations are labeled, never treated as a pass. */ }
          await page.waitForTimeout(1200);
          const describe = map => [...map].sort(([a], [b]) => a.localeCompare(b)).map(([host, types]) => ({ host, resourceTypes: [...types].sort() }));
          results.push({ id: item.id, path: item.path, pageStatus, domContentLoaded, documentCacheControl, blockedWrites, attemptedExternalHosts: describe(attemptedHosts), externalHosts: describe(hosts) });
          if (results.length % 8 === 0) console.log('Observed', results.length, 'of', items.length);
        } finally { await context.close(); }
      }
    }));
  } finally { await browser.close(); }
  results.sort((a, b) => a.id.localeCompare(b.id));
  const report = { reviewed: new Date().toISOString(), baseOrigin: base.origin, method: 'Fresh anonymous Chromium contexts with service workers disabled; registered destinations; 1200 ms after DOMContentLoaded or a 15-second timeout. GET/HEAD/OPTIONS only; writes blocked. Attempted hosts include browser-blocked requests; externalHosts records requests reaching network interception. No user interaction, student content or credentials. Hostnames/resource types and document cache headers only; later feature, worker and user-selected flows require separate review.', components: results };
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log('Saved', results.length, 'startup observations to', output);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
