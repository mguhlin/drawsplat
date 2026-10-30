async function clickToolbar(page,id){
 const button=page.locator('#'+id),menu=button.locator('xpath=ancestor::details[contains(@class,"pdf-toolbar-menu")]');
 if(await menu.count()&&!await menu.evaluate(n=>n.open))await menu.locator('summary').click();
 await button.click();
}
async function selectLanguage(page,value){const picker=page.locator('[data-pdf-language]'),menu=picker.locator('xpath=ancestor::details[contains(@class,"pdf-toolbar-menu")]');if(await menu.count()&&!await menu.evaluate(n=>n.open))await menu.locator('summary').click();await picker.selectOption(value);}
module.exports={clickToolbar,selectLanguage};
