const {test,expect}=require('@playwright/test');
const {PDFDocument,rgb,PDFCheckBox,PDFTextField,PDFDropdown}=require('../vendor/pdf-lib.min.js');
const fs=require('fs/promises');
async function open(page,bytes){await page.goto('/solutions/pdfsplat/');await page.locator('#fileInput').setInputFiles({name:'form.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)});await expect(page.locator('#formFieldsButton')).toBeEnabled();}
async function editor(page){await page.locator('#toolGroup-edit').evaluate(e=>e.open=true);await page.locator('#formFieldsButton').click();}
async function save(page){const download=page.waitForEvent('download');await page.locator('#saveAsSelect').selectOption('pdf');return Buffer.from(await fs.readFile(await(await download).path()));}

test('detects printed lines, checkboxes and character boxes; fills and exports standard fields offline',async({page,context})=>{
 const doc=await PDFDocument.create(),p=doc.addPage([500,600]);p.drawText('Name',{x:40,y:530,size:12});p.drawLine({start:{x:100,y:520},end:{x:400,y:520},thickness:1});
 p.drawRectangle({x:50,y:440,width:14,height:14,borderWidth:1,borderColor:rgb(0,0,0)});
 for(let i=0;i<5;i++)p.drawRectangle({x:50+i*18,y:380,width:16,height:22,borderWidth:1,borderColor:rgb(0,0,0)});
 await open(page,await doc.save());await context.setOffline(true);await editor(page);await page.locator('#detectFormFields').click();await expect(page.locator('#formFieldsStatus')).toContainText('candidate fields added');
 const rows=page.locator('#formFieldsList fieldset');expect(await rows.count()).toBeGreaterThanOrEqual(3);
 const checkbox=rows.filter({has:page.locator('select option:checked[value="checkbox"]')}).first();await expect(checkbox).toBeVisible();
 await checkbox.getByLabel('Accessible label',{exact:true}).fill('Agreed');await checkbox.getByLabel('Accessible label',{exact:true}).press('Tab');
 await page.locator('#formFieldsDialog form button').click();
 await page.locator('.pdf-form-field[type=text]').first().fill('Synthetic Person');await page.locator('.pdf-form-field[type=text]').first().press('Tab');await page.getByRole('checkbox',{name:'Agreed',exact:true}).check();
 const bytes=await save(page),result=await PDFDocument.load(bytes);const fields=result.getForm().getFields();expect(fields.length).toBeGreaterThanOrEqual(3);expect(fields.some(f=>f instanceof PDFCheckBox&&f.isChecked())).toBeTruthy();expect(fields.some(f=>f instanceof PDFTextField&&f.getText()==='Synthetic Person')).toBeTruthy();expect(fields.some(f=>f instanceof PDFTextField&&f.getMaxLength()===5)).toBeTruthy();
 await page.locator('#fileInput').setInputFiles({name:'roundtrip.pdf',mimeType:'application/pdf',buffer:bytes});await expect(page.getByRole('checkbox',{name:'Agreed',exact:true})).toBeChecked();await expect(page.locator('.pdf-form-field[type=text]').first()).toHaveValue('Synthetic Person');
});

test('manual fields, required labels, dropdown choices, undo and rotated exports',async({page})=>{
 const doc=await PDFDocument.create();doc.addPage([400,600]);await open(page,await doc.save());await editor(page);await page.locator('#addFormField').click();
 const row=page.locator('#formFieldsList fieldset');await row.getByLabel('Field name',{exact:true}).fill('FullName');await row.getByLabel('Accessible label',{exact:true}).fill('Full name');await row.getByLabel('Required',{exact:true}).check();await row.getByLabel('Value',{exact:true}).fill('Example');await row.getByLabel('Value',{exact:true}).press('Tab');
 await page.locator('#addFormField').click();const drop=page.locator('#formFieldsList fieldset').last();await drop.getByLabel('Field type',{exact:true}).selectOption('dropdown');await drop.getByLabel('Options (separate with |)',{exact:true}).fill('One|Two');await drop.getByLabel('Options (separate with |)',{exact:true}).press('Tab');await drop.getByLabel('Value',{exact:true}).fill('Two');await drop.getByLabel('Value',{exact:true}).press('Tab');
 await page.locator('#formFieldsDialog form button').click();await expect(page.locator('.pdf-form-field')).toHaveCount(2);const result=await PDFDocument.load(await save(page));expect(result.getForm().getTextField('FullName').isRequired()).toBeTruthy();expect(result.getForm().getTextField('FullName').getText()).toBe('Example');expect(result.getForm().getFields().find(f=>f instanceof PDFDropdown).getSelected()).toEqual(['Two']);
 await page.locator('#toolGroup-pages').evaluate(e=>e.open=true);await page.locator('#rotateRightButton').click();await expect(page.locator('#status')).toContainText('rotated');const rotated=await PDFDocument.load(await save(page));expect(rotated.getForm().getTextField('FullName').getText()).toBe('Example');const r=rotated.getForm().getTextField('FullName').acroField.getWidgets()[0].getRectangle();expect(r.width).toBeGreaterThan(0);expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(400.1);
 await page.locator('#undoButton').click();await expect(page.locator('.pdf-form-field')).toHaveCount(2);
});

test('imports existing fields and keeps values after export',async({page})=>{
 const doc=await PDFDocument.create(),p=doc.addPage([400,600]),f=doc.getForm().createTextField('Existing');f.setText('Keep me');f.addToPage(p,{x:40,y:400,width:200,height:24});await open(page,await doc.save());await expect(page.getByRole('textbox',{name:'Existing',exact:true})).toHaveValue('Keep me');const result=await PDFDocument.load(await save(page));expect(result.getForm().getTextField('Existing').getText()).toBe('Keep me');
});


test('sample form and local detection are usable without supplying a personal file',async({page})=>{await page.goto('/solutions/pdfsplat/');await page.locator('#sampleFormButton').click();await expect(page.locator('#formFieldsStatus')).toContainText('candidate fields added');expect(await page.locator('#formFieldsList fieldset').count()).toBeGreaterThanOrEqual(3);});
