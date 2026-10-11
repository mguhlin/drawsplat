const {test,expect}=require('@playwright/test');

const pages=[
  ['/admin/admin.html','admin'],
  ['/admin/access.html','access'],
  ['/admin/compliance.html','compliance'],
  ['/admin/district-roster.html','district-roster'],
  ['/admin/mysql-setup.html','mysql-setup'],
  ['/hub/admin.html','district-roster'],
  ['/hub/teacher-admin.html','admin'],
  ['/hub/hubcampus/admin.html','district-roster'],
  ['/community/Admin.html','compliance'],
];

test.beforeEach(async({page,baseURL})=>{
  // Header checks never need a live school backend, Google account, or remote font.
  const origin=new URL(baseURL).origin;
  await page.route('**/*',route=>new URL(route.request().url()).origin===origin
    ?route.continue():route.abort());
});

for(const width of [390,1280]){
  for(const [path,asset] of pages){
    test(`${path} has a decorative responsive header at ${width}px`,async({page})=>{
      await page.setViewportSize({width,height:900});
      await page.goto(path);
      const art=page.locator('.admin-header-art');
      await expect(art).toHaveCount(1);
      await expect(art).toBeVisible();
      await expect(art).toHaveAttribute('src',new RegExp(`/admin-headers/${asset}\\.png$`));
      await expect(art).toHaveAttribute('alt','');
      await expect.poll(()=>art.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
      const bounds=await art.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);
      expect(Math.abs(bounds.width/bounds.height-4)).toBeLessThan(.03);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
      await expect(page.locator('h1').first()).toBeVisible();
    });
  }
}

for(const path of ['/admin/admin.html','/admin/compliance.html','/admin/mysql-setup.html']){
  test(`${path} keeps its header through preview, reload, and relock`,async({page})=>{
    await page.goto(path);
    const art=page.locator('.admin-header-art');
    await expect(page.locator('.admin-gate')).toBeVisible();
    await expect(page.locator('.admin-shell')).toBeHidden();
    await page.locator('#adminViewerPreviewBtn').click();
    await expect(page.locator('.admin-shell')).toBeVisible();
    await expect(page.locator('.admin-viewer-banner')).toBeVisible();
    await expect(art).toBeVisible();
    await page.reload();
    await expect(page.locator('.admin-viewer-banner')).toBeVisible();
    await expect(art).toBeVisible();
    await page.locator('#adminSignOutBtn').click();
    await expect(page.locator('.admin-gate')).toBeVisible();
    await expect(page.locator('.admin-shell')).toBeHidden();
    await expect(art).toBeVisible();
    await page.locator('#adminViewerPreviewBtn').click();
    await expect(page.locator('.admin-viewer-banner')).toBeVisible();
  });
}
