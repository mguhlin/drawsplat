export function sortSelectOptions(select,locale=document.documentElement.lang||'en'){
 const value=select.value,collator=new Intl.Collator(locale,{sensitivity:'base',numeric:true}),options=[...select.options];
 options.sort((a,b)=>a.value===''?-1:b.value===''?1:collator.compare(a.textContent,b.textContent));
 select.replaceChildren(...options);select.value=value;
}
