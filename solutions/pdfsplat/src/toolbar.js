export function setupToolbar(){
 const menus=[...document.querySelectorAll('.pdf-toolbar-menu')];
 const close=except=>menus.forEach(menu=>{if(menu!==except)menu.open=false;});
 for(const menu of menus){
  const summary=menu.querySelector('summary');
  menu.addEventListener('toggle',()=>{summary.setAttribute('aria-expanded',String(menu.open));if(menu.open)close(menu);});
  menu.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||button.disabled)return;menu.open=false;});
  menu.addEventListener('keydown',event=>{
   if(event.target.matches('select,input'))return;
   const choices=[...menu.querySelectorAll('button:not(:disabled):not([hidden]),select:not(:disabled)')];if(!choices.length)return;
   if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
    event.preventDefault();menu.open=true;close(menu);const index=choices.indexOf(document.activeElement);
    choices[event.key==='Home'?0:event.key==='End'?choices.length-1:event.key==='ArrowDown'?(index+1)%choices.length:(index<0?choices.length-1:(index-1+choices.length)%choices.length)].focus();
   }
  });
 }
 document.addEventListener('pointerdown',event=>{if(!event.target.closest('.pdf-toolbar-menu'))close();});
 document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;if(document.querySelector('dialog[open]')){close();return;}const open=menus.find(menu=>menu.open);if(open){event.preventDefault();event.stopImmediatePropagation();close();open.querySelector('summary').focus();}},true);
 document.addEventListener('focusin',event=>{if(!event.target.closest('.pdf-toolbar-menu'))close();});
}
