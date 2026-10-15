const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const apps = ['gridsplat', 'showsplat', 'writesplat', 'listsplat', 'layoutsplat'];
const scope = 'https://www.googleapis.com/auth/drive.file';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('drawsplat.consent.accepted', '1');
    localStorage.setItem('drawsplat.language', 'en');
    document.addEventListener('DOMContentLoaded', () => { const meta = document.createElement('meta'); meta.name = 'google-drive-client-id'; meta.content = 'synthetic-client.apps.googleusercontent.com'; document.head.append(meta); }, { once: true });
    Object.defineProperty(window, 'showSaveFilePicker', { value: undefined, configurable: true });
  });
});

async function google(page, response = { access_token: 'synthetic-drive-token', scope }) {
  const seen = { identity: 0, uploads: [], permissions: 0 };
  await page.route('https://accounts.google.com/gsi/client', route => {
    seen.identity++;
    return route.fulfill({ contentType: 'application/javascript', body: `window.google={accounts:{oauth2:{hasGrantedAllScopes:(r,s)=>r.scope?.split(' ').includes(s),initTokenClient:config=>{window.driveAuthConfig={client_id:config.client_id,scope:config.scope};return{requestAccessToken:()=>{window.driveAuthCount=(window.driveAuthCount||0)+1;config.callback(${JSON.stringify(response)})}}}}}};` });
  });
  await page.route('https://www.googleapis.com/**', async route => {
    const request = route.request();
    if (request.url().includes('/permissions')) seen.permissions++;
    if (request.url().includes('/upload/')) {
      seen.uploads.push(request);
      return route.fulfill({ contentType: 'application/json', body: '{"id":"synthetic-file-123"}' });
    }
    return route.abort();
  });
  return seen;
}

async function openApp(page, app) {
  await page.goto('/splatworks/' + app + '/?lang=en');
  if (app === 'gridsplat') {
    await page.getByRole('button', { name: 'New Sheet', exact: true }).click();
    await page.getByTestId('cell-A1').dblclick();
    await page.getByLabel('Edit cell A1').fill('Synthetic classroom project');
    await page.getByLabel('Edit cell A1').press('Enter');
  } else if (app === 'writesplat') {
    await page.locator('#docTitle').fill('Synthetic classroom project');
    await page.getByRole('textbox', { name: 'WriteSplat document editor' }).click();
    await page.keyboard.type('A careful local writing project.');
  } else if (app === 'showsplat') {
    await page.locator('#deckTitle').fill('Synthetic classroom project');
    await page.locator('#deckTitle').dispatchEvent('input');
  } else if (app === 'listsplat') {
    await page.locator('[data-project-title]').fill('Synthetic classroom project');
    await page.locator('[data-project-title]').dispatchEvent('change');
  } else {
    await expect.poll(() => page.evaluate(() => !!window.LayoutSplat)).toBe(true);
    await page.locator('#publicationTitle').fill('Synthetic classroom project');
    await page.locator('#publicationTitle').dispatchEvent('input');
  }
}

async function driveMenu(page, app, open = false) {
  if (app === 'gridsplat') {
    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByRole('menuitem', { name: open ? 'Open' : 'Save', exact: true }).click();
    await page.getByRole('menuitem', { name: open ? 'Open Google Drive' : 'Save Google Drive', exact: true }).click();
  } else if (app === 'layoutsplat') {
    await page.locator('#fileMenu > summary').click();
    await page.locator('#fileMenu [data-action="save-drive"]').click();
  } else if (app === 'showsplat') {
    await page.locator('.menu-bar > .menu > summary').filter({ hasText: /^File$/ }).click();
    await page.locator('[data-action="save-drive"]').click();
  } else {
    await page.locator('.menu-bar > .menu > summary').filter({ hasText: /^File$/ }).click();
    await page.locator('[data-action="save-drive"]').click();
  }
  return page.getByRole('dialog', { name: open ? 'Open from Google Drive' : 'Save to Google Drive', exact: true });
}

async function localSave(page, app) {
  const pending = page.waitForEvent('download');
  if (app === 'gridsplat') {
    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Save', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Save file', exact: true }).click();
  } else if (app === 'layoutsplat') {
    await page.locator('#fileMenu > summary').click();
    await page.locator('#fileMenu [data-action="save"]').click();
  } else if (app === 'showsplat') await page.locator('.quick-actions [data-action="save-deck"]').click();
  else await page.locator(app === 'writesplat' ? '.toolbar [data-action="save-json"]' : '.quick-actions [data-action="save-json"]').click();
  return fs.readFileSync(await (await pending).path());
}

function multipart(request) {
  const boundary = request.headers()['content-type'].split('boundary=')[1];
  const body = request.postDataBuffer();
  const marker = Buffer.from('\r\n--' + boundary + '\r\n');
  const metaEnd = body.indexOf(marker);
  const metadata = JSON.parse(body.subarray(body.indexOf('\r\n\r\n') + 4, metaEnd).toString());
  const start = body.indexOf('\r\n\r\n', metaEnd + marker.length) + 4;
  const end = body.lastIndexOf(Buffer.from('\r\n--' + boundary + '--'));
  return { metadata, file: body.subarray(start, end) };
}

async function native(page, app, bytes) {
  if (app === 'layoutsplat') return page.evaluate(async base64 => JSON.parse(await (await window.JSZip.loadAsync(Uint8Array.from(atob(base64), c => c.charCodeAt(0)))).file('publication.json').async('string')), bytes.toString('base64'));
  const data = JSON.parse(bytes.toString());
  delete data.createdAt; delete data.updatedAt;
  if (data.metadata) delete data.metadata.createdAt;
  return data;
}

for (const app of apps) {
  test(app + ': explicit Drive save uploads the native project and local saving remains equivalent', async ({ page }) => {
    const seen = await google(page); await openApp(page, app); expect(seen.identity).toBe(0);
    const dialog = await driveMenu(page, app);
    await expect(dialog.getByRole('button', { name: 'Save to Google Drive', exact: true })).toBeEnabled();
    expect(seen.identity).toBe(1); expect(seen.uploads).toHaveLength(0);
    await dialog.getByRole('button', { name: 'Save to Google Drive', exact: true }).click();
    await expect(dialog.getByRole('status')).toContainText('Saved ');
    expect(seen.uploads).toHaveLength(1);
    const request = seen.uploads[0], uploaded = multipart(request);
    expect(request.headers().authorization).toBe('Bearer synthetic-drive-token');
    expect(uploaded.metadata.name).toMatch(new RegExp(app === 'layoutsplat' ? '\\.layoutsplat$' : '\\.' + app + '\\.json$'));
    expect(await page.evaluate(() => window.driveAuthConfig.scope)).toBe(scope);
    expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain('synthetic-drive-token');
    expect(seen.permissions).toBe(0);
    await expect(dialog.getByRole('link', { name: 'Open in Google Drive' })).toHaveAttribute('href', 'https://drive.google.com/file/d/synthetic-file-123/view');
    await dialog.getByRole('button', { name: 'Done' }).click();
    const downloaded = await localSave(page, app);
    const project = await native(page, app, uploaded.file);
    expect(JSON.stringify(project)).toContain('Synthetic classroom project');
    expect(project).toEqual(await native(page, app, downloaded));
    expect(seen.uploads).toHaveLength(1);
  });

  test(app + ': cancelling Drive keeps saved work and sends no project', async ({ page }) => {
    const seen = await google(page); await openApp(page, app);
    const before = await page.evaluate(() => JSON.stringify({ ...localStorage }));
    const dialog = await driveMenu(page, app);
    await expect(dialog.getByRole('button', { name: 'Save to Google Drive', exact: true })).toBeEnabled();
    await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
    expect(seen.uploads).toHaveLength(0); expect(await page.evaluate(() => window.driveAuthCount || 0)).toBe(0);
    expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).toBe(before);
  });

  test(app + ': connection opt-out prevents even loading Google sign-in', async ({ page }) => {
    const seen = await google(page); await openApp(page, app);
    await page.evaluate(() => SplatPrivacy.setConnections(false));
    const dialog = await driveMenu(page, app);
    await expect(dialog.getByRole('status')).toContainText('External connections are off');
    await expect(dialog.getByRole('button', { name: 'Save to Google Drive', exact: true })).toBeDisabled();
    expect(seen.identity).toBe(0); expect(seen.uploads).toHaveLength(0);
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    expect((await localSave(page, app)).length).toBeGreaterThan(20);
  });
}

test('Google permission denial keeps the dialog recoverable and sends no file', async ({ page }) => {
  const seen = await google(page, { error: 'access_denied' }); await openApp(page, 'showsplat');
  const dialog = await driveMenu(page, 'showsplat');
  await expect(dialog.getByRole('button', { name: 'Save to Google Drive', exact: true })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Save to Google Drive', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('permission was not granted');
  expect(seen.uploads).toHaveLength(0);
  await expect(dialog.getByRole('button', { name: 'Save to Google Drive', exact: true })).toBeEnabled();
});

test('Drive upload errors preserve the project and do not show a success link', async ({ page }) => {
  await google(page); await page.route('https://www.googleapis.com/upload/**', route => route.fulfill({ status: 403, body: '{}' }));
  await openApp(page, 'showsplat'); const dialog = await driveMenu(page, 'showsplat');
  await expect(dialog.getByRole('button', { name: 'Save to Google Drive', exact: true })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Save to Google Drive', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('denied this action');
  await expect(dialog.getByRole('link', { name: 'Open in Google Drive' })).toBeHidden();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  expect((await localSave(page, 'showsplat')).toString()).toContain('Synthetic classroom project');
});

test('GridSplat reopens the last Drive save and retires its old persisted Google token', async ({ page }) => {
  await google(page); await page.addInitScript(() => localStorage.setItem('gridsplat:google-drive:token', '{"accessToken":"retired-secret"}'));
  await openApp(page, 'gridsplat'); expect(await page.evaluate(() => localStorage.getItem('gridsplat:google-drive:token'))).toBeNull();
  let dialog = await driveMenu(page, 'gridsplat');
  await expect(dialog.getByRole('button', { name: 'Save to Google Drive', exact: true })).toBeEnabled();
  let uploaded;
  await page.route('https://www.googleapis.com/upload/**', route => { uploaded = multipart(route.request()).file.toString(); return route.fulfill({ contentType: 'application/json', body: '{"id":"reopen-file-456"}' }); });
  await dialog.getByRole('button', { name: 'Save to Google Drive', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('Saved '); await dialog.getByRole('button', { name: 'Done' }).click();
  await page.route('https://www.googleapis.com/drive/v3/files/reopen-file-456?alt=media', route => route.fulfill({ contentType: 'application/json', body: uploaded }));
  await page.getByTestId('cell-A1').dblclick(); await page.getByLabel('Edit cell A1').fill('Changed after save'); await page.getByLabel('Edit cell A1').press('Enter');
  dialog = await driveMenu(page, 'gridsplat', true);
  await expect(dialog.getByRole('button', { name: 'Open from Google Drive', exact: true })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Open from Google Drive', exact: true }).click();
  await expect(dialog).toHaveCount(0); await expect(page.getByTestId('cell-A1')).toHaveText('Synthetic classroom project');
});

test('large project uploads use a resumable session and reject token forwarding to another host', async ({ page }) => {
  await google(page); await page.goto('/privacy/');
  let transferred = 0;
  await page.route('https://www.googleapis.com/upload/**', route => {
    if (route.request().method() === 'POST') return route.fulfill({ status: 200, headers: { Location: 'https://www.googleapis.com/upload/drive/v3/files?upload_id=synthetic', 'Access-Control-Expose-Headers': 'Location' }, body: '' });
    transferred = route.request().postDataBuffer().length;
    return route.fulfill({ contentType: 'application/json', body: '{"id":"large-file-789"}' });
  });
  await page.evaluate(() => { import('/splatworks/shared/google-drive.js').then(module => { window.savedDrive = module.saveToGoogleDrive({ appName: 'Test project', fileName: 'large.layoutsplat', buildFile: () => new Blob([new Uint8Array(6 * 1024 * 1024)], { type: 'application/zip' }) }); }); });
  const dialog = page.getByRole('dialog', { name: 'Save to Google Drive', exact: true });
  await expect(dialog.getByRole('button', { name: 'Save to Google Drive', exact: true })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Save to Google Drive', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('Saved '); expect(transferred).toBe(6 * 1024 * 1024);
  await dialog.getByRole('button', { name: 'Done' }).click();
  let forwarded = 0;
  await page.route('https://www.googleapis.com/upload/**', route => route.fulfill({ status: 200, headers: { Location: 'https://unexpected.example.test/receive', 'Access-Control-Expose-Headers': 'Location' }, body: '' }));
  await page.route('https://unexpected.example.test/**', route => { forwarded++; return route.abort(); });
  await page.evaluate(() => { import('/splatworks/shared/google-drive.js').then(module => { window.savedDrive = module.saveToGoogleDrive({ appName: 'Test project', fileName: 'large.layoutsplat', buildFile: () => new Blob([new Uint8Array(6 * 1024 * 1024)]) }); }); });
  await expect(dialog.getByRole('button', { name: 'Save to Google Drive', exact: true })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Save to Google Drive', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('unexpected upload address'); expect(forwarded).toBe(0);
});

test('the Drive dialog fits a phone and uses a configured district OAuth client', async ({ page }) => {
  const seen = await google(page); await page.setViewportSize({ width: 380, height: 820 }); await page.goto('/privacy/');
  await page.evaluate(() => {
    document.querySelector('meta[name="google-drive-client-id"]').content = 'district-client.apps.googleusercontent.com';
    import('/splatworks/shared/google-drive.js').then(module => { window.savedDrive = module.saveToGoogleDrive({ appName: 'Test project', fileName: 'classroom.writesplat.json', buildFile: () => new Blob(['{}'], { type: 'application/json' }) }); });
  });
  const dialog = page.getByRole('dialog', { name: 'Save to Google Drive', exact: true });
  await expect(dialog.getByRole('button', { name: 'Save to Google Drive', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(380);
  const box = await dialog.boundingBox(); expect(box.x).toBeGreaterThanOrEqual(0); expect(box.width).toBeLessThanOrEqual(380);
  await dialog.getByLabel('File name').fill('Portable project');
  await dialog.getByRole('button', { name: 'Save to Google Drive', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('Saved ');
  expect(await page.evaluate(() => window.driveAuthConfig.client_id)).toBe('district-client.apps.googleusercontent.com');
  expect(multipart(seen.uploads[0]).metadata.name).toBe('Portable project.writesplat.json');
});

test('closing a pending Google sign-in prevents a late callback from uploading a project', async ({ page }) => {
  const seen = await google(page);
  await page.route('https://accounts.google.com/gsi/client', route => route.fulfill({ contentType: 'application/javascript', body: `window.google={accounts:{oauth2:{initTokenClient:config=>({requestAccessToken:()=>{window.finishDriveAuth=()=>config.callback({access_token:'late-synthetic-token',scope:${JSON.stringify(scope)}})}})}}};` }));
  await openApp(page, 'showsplat'); const dialog = await driveMenu(page, 'showsplat');
  await expect(dialog.getByRole('button', { name: 'Save to Google Drive', exact: true })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Save to Google Drive', exact: true }).click();
  await dialog.getByRole('button', { name: 'Cancel' }).click(); await expect(dialog).toHaveCount(0);
  await page.evaluate(() => window.finishDriveAuth());
  expect(seen.uploads).toHaveLength(0);
  expect((await localSave(page, 'showsplat')).toString()).toContain('Synthetic classroom project');
});

test('an existing offline cache cannot hide the new ShowSplat Drive action or replace a saved deck', async ({ page, baseURL }, testInfo) => {
  test.skip(new URL(baseURL).port !== '4183', 'Legacy worker fixture requires the local repository test server.');
  const filename = `legacy-show-cache-test-${testInfo.workerIndex}.js`;
  const workerPath = require('node:path').join(__dirname, '..', 'splatworks', filename);
  // Model the old worker's cache-first behavior independently of today's worker.
  fs.writeFileSync(workerPath, `self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));self.addEventListener('fetch',event=>{if(new URL(event.request.url).pathname==='/splatworks/showsplat/app.js')event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));});`);
  try {
    await page.addInitScript(() => { window.google = { accounts: { oauth2: {} } }; });
    await page.goto('/privacy/');
    await page.evaluate(async filename => {
      const registration = await navigator.serviceWorker.register('/splatworks/'+filename, { scope: '/splatworks/' });
      const worker = registration.installing || registration.waiting || registration.active;
      if (worker.state !== 'activated') await new Promise(resolve => worker.addEventListener('statechange', () => { if (worker.state === 'activated') resolve(); }));
      const cache = await caches.open('synthetic-legacy-showsplat');
      await cache.put('/splatworks/showsplat/app.js?v=20261011-file-routing', new Response('window.legacyShowCached = true;', { headers: { 'Content-Type': 'application/javascript' } }));
      localStorage.setItem('showsplat.deck.v1', JSON.stringify({ version: 1, title: 'Keep this classroom deck', theme: 'violet', slides: [{ id: 'slide-1', title: 'Preserved slide', notes: 'Preserved teacher notes', elements: [] }] }));
    }, filename);
    await page.goto('/splatworks/showsplat/?lang=en');
    expect(await page.evaluate(() => window.legacyShowCached || false)).toBe(false);
    await expect(page.locator('#deckTitle')).toHaveValue('Keep this classroom deck');
    const dialog = await driveMenu(page, 'showsplat'); await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    expect(await page.evaluate(() => localStorage.getItem('showsplat.deck.v1'))).toContain('Preserved teacher notes');
  } finally { fs.unlinkSync(workerPath); }
});
