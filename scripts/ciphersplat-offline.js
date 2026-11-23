/* Offline package navigation. Cryptography remains local in either position. */
(()=>{
 'use strict';
 const nav=document.querySelector('header.nav');if(!nav)return;
 const control=document.createElement('label');control.id='offlineControls';
 const input=document.createElement('input');input.type='checkbox';input.id='internetToggle';
 const caption=document.createElement('span');caption.id='connectionLabel';
 control.append(input,caption);nav.append(control);
 const links=[...document.querySelectorAll('a[href]')].filter(link=>/^https?:/.test(link.href));
 for(const link of links)link.dataset.onlineHref=link.href;
 function sync(){
  caption.textContent='Internet Connection — '+(input.checked?'ON':'OFF');
  for(const link of links){if(input.checked){link.href=link.dataset.onlineHref;link.removeAttribute('aria-disabled');link.removeAttribute('tabindex')}else{link.removeAttribute('href');link.setAttribute('aria-disabled','true');link.tabIndex=-1}}
 }
 input.addEventListener('change',sync);sync();
})();
