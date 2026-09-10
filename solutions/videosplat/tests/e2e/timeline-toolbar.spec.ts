import { test, expect } from "@playwright/test";
test("editing controls remain usable after scrolling a long timeline", async ({page}) => {
 await page.addInitScript(()=>sessionStorage.setItem("videosplat-splash-seen","1"));
 await page.goto("./");
 await page.locator('input[accept="video/*,audio/*,image/*"]').setInputFiles({name:"long.svg",mimeType:"image/svg+xml",buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="green"/></svg>')});
 await page.locator('.timeline-clip').click({position:{x:30,y:25}});
 await page.getByLabel('Clip duration',{exact:true}).fill('300');
 const toolbar=page.getByRole('toolbar',{name:'Timeline editing'});
 const before=await toolbar.boundingBox();
 await page.getByLabel('Timeline tracks',{exact:true}).evaluate(el=>{el.scrollLeft=8000;el.scrollTop=100;});
 await expect.poll(()=>page.getByLabel('Timeline tracks',{exact:true}).evaluate(el=>el.scrollLeft)).toBeGreaterThan(7000);
 const after=await toolbar.boundingBox();expect(after!.x).toBe(before!.x);expect(after!.y).toBe(before!.y);
 await page.locator('.ruler').click({position:{x:8200,y:20},force:true});
 await toolbar.getByRole('button',{name:'Split',exact:true}).click();
 await expect(page.locator('.timeline-clip')).toHaveCount(2);
 await toolbar.getByRole('button',{name:'Delete',exact:true}).click();
 await expect(page.locator('.timeline-clip')).toHaveCount(1);
});
