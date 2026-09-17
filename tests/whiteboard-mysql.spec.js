const { test, expect } = require('@playwright/test');
const api = 'https://saving.example.test/api/drawsplat/mysql';
let records;
test.beforeEach(async ({ page }) => {
  records = new Map();
  await page.addInitScript(api => {
    localStorage.setItem('drawsplat.welcomed', '1');localStorage.setItem('drawsplat.consent.accepted', '1');localStorage.setItem('drawsplat.startupTipDate', new Date().toISOString().slice(0, 10));
    localStorage.setItem('drawsplat.storageMode', 'mysql');localStorage.setItem('drawsplat.folderEndpoint', api);
  }, api);
  await page.route(api + '/**', async route => {
    const req = route.request(), suffix = req.url().slice(api.length), body = req.postDataJSON();
    if (suffix === '/health') return route.fulfill({ json: { ok: true, provider: 'mysql', capabilities: ['private-boards-v1'] } });
    if (suffix === '/auth/login') return route.fulfill({ json: { ok: true, token: 'test-session', expiresAt: new Date(Date.now() + 3600000).toISOString(), user: { id: 1, email: body.email } } });
    if (req.headers().authorization !== 'Bearer test-session') return route.fulfill({ status: 401, json: { ok: false, error: 'auth_required' } });
    if (suffix === '/auth/logout') return route.fulfill({ json: { ok: true } });
    if (suffix === '/boards') return route.fulfill({ json: { ok: true, boards: [...records].map(([boardKey, v]) => ({ boardKey, title: v.board.title, revision: v.revision, updatedAt: new Date().toISOString() })) } });
    const key = suffix.slice('/boards/'.length), prior = records.get(key);
    if (req.method() === 'PUT') {
      if (body.revision !== (prior?.revision || 0)) return route.fulfill({ status: 409, json: { ok: false, error: 'The online copy changed on another device. Download your current work, then open the online copy.' } });
      records.set(key, { board: body.board, revision: body.revision + 1 });return route.fulfill({ json: { ok: true, revision: body.revision + 1 } });
    }
    return route.fulfill({ status: prior ? 200 : 404, json: prior ? { ok: true, ...prior } : { ok: false, error: 'not found' } });
  });
});
async function rename(page, title) { await page.evaluate(title => {const input=document.getElementById('boardTitle');input.value=title;input.dispatchEvent(new Event('input',{bubbles:true}));},title); }
async function file(page, target) { await page.locator('#topMenuBar summary').filter({ hasText: /^File$/ }).click();await page.locator(`[data-menu-target="${target}"]`).click(); }
async function signIn(page) { const dialog = page.locator('.mysql-cloud-dialog');await dialog.locator('input[type=email]').fill('teacher@example.test');await dialog.locator('input[type=password]').fill('test-password-1234');await dialog.getByRole('button', { name: 'Sign in', exact: true }).click(); }
test('online saving signs in, opens a named board, and signs out on shared devices', async ({ page }) => {
  await page.goto('/app/whiteboard.html');await rename(page, 'Atoms and molecules');
  await file(page, 'saveDriveBtn');await expect(page.locator('.mysql-cloud-dialog')).toContainText('saving.example.test');await signIn(page);
  await expect(page.locator('#classroomSaveChip')).toHaveText('Saved online');expect(records.size).toBe(1);
  await page.reload();await rename(page, 'Local changes');
  await file(page, 'loadDriveBtn');await page.getByRole('button', { name: /Atoms and molecules/ }).click();await expect(page.locator('#boardTitle')).toHaveValue('Atoms and molecules');
  await file(page, 'onlineAccountBtn');await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  expect(await page.evaluate(() => sessionStorage.getItem('drawsplat.mysqlSession'))).toBeNull();
  await file(page, 'saveDriveBtn');await expect(page.locator('.mysql-cloud-dialog input[type=email]')).toBeVisible();
});
test('conflicts keep current work and never silently overwrite another device', async ({ page }) => {
  await page.goto('/app/whiteboard.html');await file(page, 'saveDriveBtn');await signIn(page);await expect(page.locator('#classroomSaveChip')).toHaveText('Saved online');
  const key = [...records.keys()][0];records.get(key).revision++;
  await rename(page, 'Unsaved local work');await file(page, 'saveDriveBtn');
  await expect(page.locator('#statusToast')).toContainText('another device');await expect(page.locator('#boardTitle')).toHaveValue('Unsaved local work');
  expect(records.get(key).board.title).not.toBe('Unsaved local work');
});
test('wizard only enables a compatible service and leaves database credentials out of browser storage', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('drawsplat.adminAccess', 'admin'));
  await page.goto('/admin/mysql-setup.html');await page.locator('#mysqlEndpoint').fill(api);await page.locator('#saveMysqlEndpointBtn').click();
  await expect(page.locator('#mysqlWizardStatus')).toContainText('Connected!');
  await page.locator('#mysqlPassword').fill('database-secret-not-for-browser-storage');
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain('database-secret-not-for-browser-storage');
  await page.route(api + '/health', route => route.fulfill({ json: { ok: true, provider: 'mysql' } }));
  await page.evaluate(() => localStorage.setItem('drawsplat.storageMode', 'google'));await page.locator('#saveMysqlEndpointBtn').click();
  await expect(page.locator('#mysqlWizardStatus')).toContainText('Update the backend');expect(await page.evaluate(() => localStorage.getItem('drawsplat.storageMode'))).toBe('google');
});
test('phone online saving has readable controls without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });await page.goto('/app/whiteboard.html');
  await page.evaluate(() => document.getElementById('saveDriveBtn').click());await expect(page.locator('.mysql-cloud-dialog')).toBeVisible();
  expect(await page.locator('.mysql-cloud-dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await signIn(page);await expect(page.locator('#classroomSaveChip')).toHaveText('Saved online');
});
test('student saving links carry the API address without account or database secrets',async({page})=>{
  await page.goto('/app/whiteboard.html');
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>window.copiedSavingLink=value}}));
  await page.evaluate(()=>document.getElementById('createStudentLinkBtn').click());
  await expect.poll(()=>page.evaluate(()=>window.copiedSavingLink)).toBeTruthy();
  const link=new URL(await page.evaluate(()=>window.copiedSavingLink));expect(link.searchParams.get('api')).toBe(api);expect(link.searchParams.get('storage')).toBe('mysql');expect(link.searchParams.get('role')).toBe('student');expect(link.searchParams.has('room')).toBe(false);expect(link.searchParams.has('password')).toBe(false);
  await expect(page.locator('#statusToast')).toContainText('does not share your board');
});
test('Teacher Admin validates MySQL before changing the current storage connection',async({page})=>{
  await page.addInitScript(()=>sessionStorage.setItem('drawsplat.adminAccess','admin'));
  await page.goto('/admin/admin.html');await page.locator('.admin-advanced > summary').click();
  await page.locator('#storageMode').selectOption('mysql');await page.locator('#folderEndpoint').fill(api);await page.locator('#saveStorageBtn').click();
  await expect(page.locator('#adminStatus')).toContainText('MySQL online saving enabled');
  await page.evaluate(()=>localStorage.setItem('drawsplat.storageMode','google'));await page.locator('#folderEndpoint').fill('http://untrusted.example/api');await page.locator('#saveStorageBtn').click();
  await expect(page.locator('#adminStatus')).toContainText('HTTPS');expect(await page.evaluate(()=>localStorage.getItem('drawsplat.storageMode'))).toBe('google');
});
test('editing a pending wizard test never enables a stale or untested API address',async({page})=>{
  await page.addInitScript(()=>sessionStorage.setItem('drawsplat.adminAccess','admin'));
  let pending;await page.route(api+'/health',route=>{pending=route});
  await page.goto('/admin/mysql-setup.html');await page.evaluate(()=>localStorage.setItem('drawsplat.storageMode','google'));
  await page.locator('#saveMysqlEndpointBtn').click();await expect.poll(()=>!!pending).toBe(true);
  await page.locator('#mysqlEndpoint').fill('https://new-host.example/api/drawsplat/mysql');
  await pending.fulfill({json:{ok:true,provider:'mysql',capabilities:['private-boards-v1']}});
  await expect(page.locator('#mysqlWizardStatus')).toContainText('API address changed');expect(await page.evaluate(()=>localStorage.getItem('drawsplat.storageMode'))).toBe('google');
});
