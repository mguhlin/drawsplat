const {test,expect}=require('@playwright/test');
const {readFile}=require('node:fs/promises');
async function audience(page){
 await page.goto('/splatworks/showsplat/?lang=en');
 const popup=page.waitForEvent('popup');await page.locator('.quick-actions [data-action="present-first"]').click();
 const deck=await popup;await expect(deck.locator('#counter')).toHaveText('1 / 2');return deck;
}
test('v5 audience controls retain themes, notes, reflow and print behavior',async({page})=>{
 const deck=await audience(page);
 await expect(deck.locator('#exitDeck')).toBeHidden();
 await expect(deck.locator('#controls button')).toHaveCount(6);
 await deck.getByRole('button',{name:'Next slide',exact:true}).click();
 await expect(deck.locator('#exitDeck')).toBeVisible();await expect(deck.locator('#exitDeck')).toHaveAttribute('href','https://drawsplat.org/splatworks/showsplat/');
 await deck.getByRole('button',{name:'Toggle presenter notes here (S)',exact:true}).click();
 await expect(deck.locator('#notesPanel')).toHaveClass(/open/);
 await expect(deck.locator('#notesPanel')).toContainText('main points');
 await deck.setViewportSize({width:390,height:844});await expect(deck.locator('.deck')).toHaveClass(/reflow/);
 await deck.emulateMedia({media:'print'});await expect(deck.locator('#exitDeck')).toBeHidden();await expect(deck.locator('#controls')).toBeHidden();
 await deck.emulateMedia({media:'screen'});await deck.screenshot({path:`/tmp/showsplat-v5-audience-${test.info().project.name}.png`});await deck.close();
});
test('v5 presenter previews, notes sizing, timer and cross-window navigation work',async({page})=>{
 const deck=await audience(page);
 const popup=deck.waitForEvent('popup');await deck.getByRole('button',{name:'Open presenter view for your laptop (V)',exact:true}).click();
 const presenter=await popup;await expect(presenter.locator('#pvCount')).toHaveText('1 / 2');
 await expect(presenter.locator('#pvCurrent .slide')).toHaveCount(1);await expect(presenter.locator('#pvNextFrame .slide')).toHaveCount(1);
 const notes=presenter.locator('#pvNotes');const size=()=>notes.evaluate(e=>parseFloat(getComputedStyle(e).fontSize));const initial=await size();
 await presenter.getByRole('button',{name:'Larger notes text',exact:true}).click();expect(await size()).toBeGreaterThan(initial);
 await presenter.keyboard.press('-');expect(await size()).toBe(initial);
 await presenter.keyboard.press('+');const larger=await size();await presenter.reload({waitUntil:'domcontentloaded'});await expect.poll(size).toBe(larger);
 await presenter.locator('#pvNext').click();await expect(presenter.locator('#pvCount')).toHaveText('2 / 2');await expect(deck.locator('#counter')).toHaveText('2 / 2');
 await deck.getByRole('button',{name:'Previous slide',exact:true}).click();await expect(presenter.locator('#pvCount')).toHaveText('1 / 2');
 await presenter.locator('#pvReset').click();await expect(presenter.locator('#pvTimer')).toHaveText('00:00');
 await presenter.setViewportSize({width:1280,height:720});await presenter.screenshot({path:`/tmp/showsplat-v5-presenter-${test.info().project.name}.png`});
 await presenter.close();await deck.close();
});
test('export embeds v5 and imports again with editable notes',async({page})=>{
 await page.goto('/splatworks/showsplat/?lang=en');page.on('dialog',dialog=>dialog.accept(''));
 await page.locator('summary').filter({hasText:/^File$/}).click();await page.locator('.submenu summary').filter({hasText:/^Export$/}).click();
 const pending=page.waitForEvent('download');await page.locator('[data-action="export-webdeck"]').first().click();
 const html=await readFile(await (await pending).path(),'utf8');expect(html).toContain('Web Deck Framework (v5)');expect(html).toContain('pvNotesUp');expect(html).toContain('exitDeck');
 await page.locator('#deckFileInput').setInputFiles({name:'v5.webdeck.html',mimeType:'text/html',buffer:Buffer.from(html)});
 await expect(page.locator('#statusText')).toContainText('Imported WebDeck HTML');
 await page.locator('.slide-rail [data-action="find-slides"]').click();await page.getByLabel('Search slides',{exact:true}).fill('main points');
 await expect(page.locator('.slide-search-result')).toHaveCount(1);await page.locator('.slide-search-result').click();await expect(page.locator('#speakerNotes')).toHaveValue(/main points/);
});
