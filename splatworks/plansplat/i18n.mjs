import {dictionaries} from './locales.mjs';
const shared=window.WidgetI18n;
export const escapeUI=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function t(key,vars){
 if(Object.hasOwn(dictionaries.en,key))return shared.t(key,vars);
 // Keep Google's diagnostic details intact while translating the surrounding status.
 if(String(key).startsWith('Calendar could not sync'))return String(key).replace('Calendar could not sync',shared.t('Calendar could not sync')).replace('Your planner is saved separately.',shared.t('Your planner is saved separately.'));
 return String(key??'');
}
export const ht=(key,vars)=>escapeUI(t(key,vars));
export const locale=()=>({en:'en-US',es:'es',vi:'vi',ar:'ar',zh:'zh-CN',uh:'hi'}[shared.getLang()]||'en-US');
// Call only for app-authored static markup, before inserting any student content.
export function localizeUI(root){
 for(const el of root.querySelectorAll('*')){
  if(el.closest('script,style,svg,[data-i18n]'))continue;
  for(const attr of ['placeholder','title','aria-label','alt'])if(Object.hasOwn(dictionaries.en,el.getAttribute(attr))){const key=el.getAttribute(attr);el.setAttribute('data-i18n-'+attr,key);el.setAttribute(attr,t(key));}
  for(const node of [...el.childNodes]){
   if(node.nodeType!==Node.TEXT_NODE)continue;const key=node.textContent.trim();if(!key||!Object.hasOwn(dictionaries.en,key))continue;
   if(el.tagName==='OPTION'){el.dataset.i18n=key;el.textContent=t(key);break;}
   const span=document.createElement('span');span.dataset.i18n=key;span.textContent=t(key);node.replaceWith(document.createTextNode(node.textContent.match(/^\s*/)[0]),span,document.createTextNode(node.textContent.match(/\s*$/)[0]));
  }
 }
}
export function ui(staticMarkup){const template=document.createElement('template');template.innerHTML=staticMarkup;localizeUI(template.content);return template.innerHTML;}
shared.register('plansplat',dictionaries);
localizeUI(document.body);
shared.refresh();
const themes=new Set(['purple','ocean','forest','contrast']);
export function setTheme(theme){const selected=themes.has(theme)?theme:'purple';document.documentElement.dataset.theme=selected;document.getElementById('themePicker').value=selected;document.querySelector('meta[name="theme-color"]').content={purple:'#6d28d9',ocean:'#1d4ed8',forest:'#166534',contrast:'#111827'}[selected];try{localStorage.setItem('plansplat.theme.v1',selected);}catch{}}
let savedTheme;try{savedTheme=localStorage.getItem('plansplat.theme.v1');}catch{}setTheme(savedTheme);
document.getElementById('themePicker').addEventListener('change',e=>setTheme(e.target.value));
window.addEventListener('widget-i18n:changed',()=>{const url=new URL(location.href);if(url.searchParams.has('lang')){url.searchParams.set('lang',shared.getLang());history.replaceState(null,'',url);} });
