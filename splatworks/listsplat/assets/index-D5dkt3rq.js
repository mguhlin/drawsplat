(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={text:``,longText:``,number:0,currency:0,percent:0,date:``,checkbox:!1,rating:0,choice:``,image:``,link:``,calculation:``,autoNumber:``,createdAt:``,updatedAt:``};function t(e){return`${e}_${Math.random().toString(36).slice(2,10)}`}function n(e,n=`text`){return{id:t(`field`),name:e,type:n,description:``,required:!1,hidden:!1,options:n===`choice`?[`Yes`,`No`]:void 0}}function r(n,r={}){let i=new Date().toISOString(),a=Object.fromEntries(n.map((t,n)=>t.type===`createdAt`||t.type===`updatedAt`?[t.id,r[t.id]??i]:t.type===`autoNumber`?[t.id,r[t.id]??n+1]:[t.id,r[t.id]??e[t.type]]));return{id:t(`record`),createdAt:i,updatedAt:i,values:a}}function i(e,i){let a=i.map(e=>n(e));return{id:t(`table`),name:e,fields:a,records:[r(a)]}}function a(e=`Animal Research Database`){let n=new Date().toISOString(),a=i(`Animals`,[`Animal`,`Habitat`,`Diet`,`Interesting Fact`]);return a.records=[r(a.fields,{[a.fields[0].id]:`Axolotl`,[a.fields[1].id]:`Freshwater lakes`,[a.fields[2].id]:`Worms and insects`,[a.fields[3].id]:`It can regrow some body parts.`}),r(a.fields,{[a.fields[0].id]:`Red panda`,[a.fields[1].id]:`Mountain forests`,[a.fields[2].id]:`Bamboo and fruit`,[a.fields[3].id]:`It uses its tail like a blanket.`})],{app:`ListSplatTM`,version:1,createdAt:n,updatedAt:n,metadata:{title:e,author:``,className:``},schema:{tables:[a],relationships:[]},layouts:[{id:t(`layout`),name:`Table View`,tableId:a.id,mode:`table`,locked:!1},{id:t(`layout`),name:`Record Form`,tableId:a.id,mode:`form`,locked:!1},{id:t(`layout`),name:`Research Cards`,tableId:a.id,mode:`cards`,locked:!1}],teacher:{studentView:!1,notes:[`Ask students to add source notes before printing a report.`],rubric:[]}}}function o(t,r,i=`text`){let a=n(r.trim()||`New Field`,i);return{...t,fields:[...t.fields,a],records:t.records.map(t=>({...t,updatedAt:new Date().toISOString(),values:{...t.values,[a.id]:e[i]}}))}}function s(e){return{...e,records:[...e.records,r(e.fields)]}}function c(e,t,n){return{...e,fields:e.fields.map(e=>e.id===t?{...e,...n}:e)}}function ee(e,t){let n=e.records.find(e=>e.id===t);return n?{...e,records:[...e.records,r(e.fields,n.values)]}:e}function te(e,t){return e.records.length<=1?e:{...e,records:e.records.filter(e=>e.id!==t)}}function l(e,t,n,r){let i=new Date().toISOString();return{...e,records:e.records.map(a=>a.id===t?{...a,updatedAt:i,values:Object.fromEntries(e.fields.map(e=>e.id===n?[e.id,r]:e.type===`updatedAt`?[e.id,i]:[e.id,a.values[e.id]]))}:a)}}function u(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t.id?t:e)}}}function ne(e,n){let r=i(n.trim()||`New Table`,[`Name`,`Notes`]);return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:[...e.schema.tables,r]},layouts:[...e.layouts,{id:t(`layout`),name:`${r.name} Table`,tableId:r.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${r.name} Form`,tableId:r.id,mode:`form`,locked:!1}]}}function d(e){if(!e||typeof e!=`object`)throw Error(`This is not a ListSplatTM project file.`);let t=e;if(t.app!==`ListSplatTM`||t.version!==1||!t.schema?.tables)throw Error(`This file is not a supported .listsplat.json project.`)}function f(e){let t=[],n=``,r=[],i=!1;for(let a=0;a<e.length;a+=1){let o=e[a],s=e[a+1];i&&o===`"`&&s===`"`?(n+=`"`,a+=1):o===`"`?i=!i:!i&&o===`,`?(r.push(n),n=``):!i&&(o===`
`||o===`\r`)?(o===`\r`&&s===`
`&&(a+=1),r.push(n),r.some(e=>e.length>0)&&t.push(r),r=[],n=``):n+=o}return r.push(n),r.some(e=>e.length>0)&&t.push(r),t}function re(e,t){let i=f(t),a=(i[0]?.map((e,t)=>e.trim()||`Field ${t+1}`)??[`Field 1`]).map(e=>n(e)),o=i.slice(1).map(e=>r(a,Object.fromEntries(a.map((t,n)=>[t.id,e[n]??``]))));return{id:`table_${Date.now().toString(36)}`,name:e,fields:a,records:o.length>0?o:[r(a)]}}function ie(e){let t=e==null?``:String(e);return/[",\n\r]/.test(t)?`"${t.replaceAll(`"`,`""`)}"`:t}function ae(e){return[e.fields.map(e=>ie(e.name)).join(`,`),...e.records.map(t=>e.fields.map(e=>ie(t.values[e.id])).join(`,`))].join(`
`)}var oe=`listsplat.autosave.v1`;function p(e){localStorage.setItem(oe,JSON.stringify(e))}function se(){let e=localStorage.getItem(oe);if(!e)return null;let t=JSON.parse(e);return d(t),t}function m(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,a.click(),URL.revokeObjectURL(i)}function ce(e){return e==null?``:String(e).trim().toLowerCase()}function le(e,n,r,i,a){return{id:t(`relationship`),name:e.trim()||`New Relationship`,fromTableId:n,fromFieldId:r,toTableId:i,toFieldId:a}}function ue(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,relationships:[...e.schema.relationships,t]}}}function de(e,t,n,r){let i=ce(n.values[e.fromFieldId]);return!i||t.id!==e.fromTableId||r.id!==e.toTableId?[]:r.records.filter(t=>ce(t.values[e.toFieldId])===i)}function fe(e,t){let n=e.schema.tables.find(e=>e.id===t.fromTableId),r=e.schema.tables.find(e=>e.id===t.toTableId),i=n?.fields.find(e=>e.id===t.fromFieldId),a=r?.fields.find(e=>e.id===t.toFieldId);return`${n?.name??`Table`}:${i?.name??`Field`} -> ${r?.name??`Table`}:${a?.name??`Field`}`}function pe(e,t){return e.records.map(e=>Number(e.values[t])).filter(e=>Number.isFinite(e))}function me(e){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)).map(t=>{let n=pe(e,t.id),r=n.reduce((e,t)=>e+t,0);return{fieldId:t.id,fieldName:t.name,count:n.length,sum:r,average:n.length?r/n.length:0,minimum:n.length?Math.min(...n):0,maximum:n.length?Math.max(...n):0}})}function he(e){let t=[],n=``,r=!1;for(let i=0;i<e.length;i+=1){let a=e[i],o=e[i-1];if(a===`"`&&o!==`\\`){r=!r,n+=a;continue}if(a===`,`&&!r){t.push(n.trim()),n=``;continue}n+=a}return(n.trim()||e.endsWith(`,`))&&t.push(n.trim()),t}function h(e){let t=e.trim();if(t.startsWith(`"`)&&t.endsWith(`"`))return t.slice(1,-1).replace(/\\"/g,`"`)}function ge(e,t,n){let r=n.trim().toLowerCase(),i=e.fields.find(e=>e.name.toLowerCase()===r);return i?String(t.values[i.id]??``):``}function g(e,t,n){return h(n)??ge(e,t,n)}function _(e,t,n){let r=Number(g(e,t,n));return Number.isFinite(r)?r:0}function _e(e,t){let n=t.trim().toLowerCase(),r=e.fields.find(e=>e.name.toLowerCase()===n);return r?pe(e,r.id):[]}function v(e){return Number.isFinite(e)?String(Number(e.toFixed(8))):`Formula error: not a number`}function ve(e){return e.toLowerCase().replace(/\b[a-z]/g,e=>e.toUpperCase())}function ye(e,t,n,r){if(!e)return[];let i=r.trim().toLowerCase(),a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===i),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0;return a&&o?de(a,t,n,o):[]}function be(e,t,n,r,i){if(!e)return``;let a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===r.trim().toLowerCase()),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0,s=ye(e,t,n,r)[0],c=o?.fields.find(e=>e.name.toLowerCase()===i.trim().toLowerCase());return s&&c?String(s.values[c.id]??``):``}function xe(e,t,n,r){let i=e.trim();if(!i)return``;let a=i.match(/^([A-Z_]+)\((.*)\)$/i);if(!a)return`Formula error: use a function like FIELD(Name)`;let o=a[1].toUpperCase(),s=he(a[2]),c=s[0]??``;if(o===`FIELD`)return ge(t,n,c);if(o===`JOIN`)return s.map(e=>g(t,n,e)).join(``);if(o===`UPPER`)return g(t,n,c).toUpperCase();if(o===`LOWER`)return g(t,n,c).toLowerCase();if(o===`TITLECASE`)return ve(g(t,n,c));if(o===`TRIM`)return g(t,n,c).trim();if(o===`LENGTH`)return String(g(t,n,c).length);if(o===`CONTAINS`)return g(t,n,c).toLowerCase().includes(g(t,n,s[1]??``).toLowerCase())?`Yes`:`No`;if(o===`IF_EMPTY`)return g(t,n,c).trim()?g(t,n,c):g(t,n,s[1]??``);if(o===`LOOKUP`)return be(r,t,n,h(c)??c,h(s[1]??``)??s[1]??``);if(o===`COUNT_RELATED`)return String(ye(r,t,n,h(c)??c).length);if(o===`ADD`)return v(s.reduce((e,r)=>e+_(t,n,r),0));if(o===`SUBTRACT`)return v(s.slice(1).reduce((e,r)=>e-_(t,n,r),_(t,n,c)));if(o===`MULTIPLY`)return v(s.reduce((e,r)=>e*_(t,n,r),1));if(o===`DIVIDE`){let e=_(t,n,s[1]??``);return e===0?`Formula error: divide by zero`:v(_(t,n,c)/e)}if(o===`ROUND`){let e=Math.max(0,Math.min(6,Math.round(_(t,n,s[1]??`"0"`))));return String(Number(_(t,n,c).toFixed(e)))}if([`SUM`,`AVERAGE`,`MIN`,`MAX`,`COUNT`].includes(o)){let e=_e(t,c);return o===`SUM`?v(e.reduce((e,t)=>e+t,0)):o===`AVERAGE`?v(e.length?e.reduce((e,t)=>e+t,0)/e.length:0):o===`MIN`?v(e.length?Math.min(...e):0):o===`MAX`?v(e.length?Math.max(...e):0):String(e.length)}return`Formula error: ${o} is not supported`}function y(e){return e==null?``:String(e)}function Se(e,t){let n=t.query.trim();if(!n)return e.records;let r=n.toLowerCase();return e.records.filter(n=>(t.fieldId===`all`?e.fields.map(e=>e.id):[t.fieldId]).some(e=>y(n.values[e]).toLowerCase().includes(r)))}function Ce(e,t,n){let r=n===`asc`?1:-1;return{...e,records:[...e.records].sort((e,n)=>{let i=y(e.values[t]),a=y(n.values[t]),o=Number(i),s=Number(a);return!Number.isNaN(o)&&!Number.isNaN(s)?(o-s)*r:i.localeCompare(a,void 0,{numeric:!0,sensitivity:`base`})*r})}}function we(e,t){let n=new Map;return e.records.forEach(e=>{let r=y(e.values[t]).trim().toLowerCase();r&&n.set(r,(n.get(r)??0)+1)}),e.records.filter(e=>{let r=y(e.values[t]).trim().toLowerCase();return r?(n.get(r)??0)>1:!1})}function Te(e,t){return e.records.filter(e=>!y(e.values[t]).trim())}function Ee(e,t){if(!t.find)return[];let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=[];return e.records.forEach(e=>{o.has(e.id)&&t.fieldIds.forEach(n=>{let r=y(e.values[n]),i=r.replace(a,t.replacement);i!==r&&s.push({recordId:e.id,fieldId:n,before:r,after:i})})}),s}function De(e,t){if(!t.find)return{table:e,count:0};let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=0,c=e.records.map(e=>{if(!o.has(e.id))return e;let n=!1,r={...e.values};return t.fieldIds.forEach(e=>{let i=y(r[e]),o=i.replace(a,()=>(s+=1,t.replacement));o!==i&&(n=!0,r[e]=o)}),n?{...e,updatedAt:new Date().toISOString(),values:r}:e});return{table:{...e,records:c},count:s}}function b(e,t,n,r,i,a){return{id:e,title:t,gradeBand:n,goal:r,table:re(t,i),reflectionQuestions:a}}var Oe=[b(`classroom-library`,`Classroom Library Catalog`,`Grades 3-8`,`Track books, genres, reading levels, and recommendations.`,`Title,Author,Genre,Pages,Who would enjoy it?
Charlotte's Web,E. B. White,Fiction,192,Readers who like animals
Hidden Figures,Margot Lee Shetterly,Biography,240,Readers who like history`,[`Which genre appears most often?`,`What book would you recommend first?`]),b(`science-observations`,`Science Observation Log`,`Grades 3-8`,`Collect observations over time and look for patterns.`,`Date,Object observed,Location,Measurement,Observation
2026-06-29,Bean plant,Window,8 cm,Two new leaves
2026-06-30,Bean plant,Window,8.5 cm,Stem leaned toward light`,[`What changed over time?`,`What might explain the pattern?`]),b(`state-facts`,`State Facts Database`,`Grades 4-8`,`Compare places using consistent fields.`,`State,Capital,Region,Population note,Interesting fact
Texas,Austin,South,Large population,Has many different ecosystems
New Mexico,Santa Fe,Southwest,Medium population,Capital is over 400 years old`,[`Which fields help compare states?`,`What new field would improve this database?`]),b(`book-reviews`,`Book Review Collection`,`Grades 3-8`,`Collect opinions and evidence from student reading.`,`Book,Reviewer,Rating,Favorite part,Would recommend?
Because of Winn-Dixie,Jordan,5,The friendship story,Yes
Wonder,Avery,4,The different points of view,Yes`,[`Which book has the strongest recommendation?`,`What evidence supports each rating?`]),b(`vocabulary-bank`,`Vocabulary Word Bank`,`Grades 2-8`,`Build a searchable word list with definitions and examples.`,`Word,Definition,Example sentence,Subject
evaporate,To change from liquid to gas,Water can evaporate in sunlight,Science
compare,To tell how things are alike,Compare two characters,Reading`,[`Which words belong to more than one subject?`,`Which examples help you remember the word?`]),b(`survey-results`,`Simple Survey Results`,`Grades 3-8`,`Organize survey answers and look for patterns.`,`Question,Answer,Student group,Count,Notes
Favorite recess activity,Soccer,Grade 4,12,Most common outdoor choice
Favorite recess activity,Drawing,Grade 4,6,Quiet activity choice`,[`Which answer appears most often?`,`What new question should the class ask next?`]),b(`museum-cards`,`Museum Exhibit Cards`,`Grades 4-8`,`Create printable exhibit cards for objects, images, or research topics.`,`Item,Creator or source,Year,Category,Why it matters
Printing press,Johannes Gutenberg,1440,Invention,Changed how books were made
Apollo 11 mission,NASA,1969,Space exploration,First humans walked on the Moon`,[`How should the exhibit be grouped?`,`What field would help visitors understand the item?`])];function ke(e){let t=e.table.fields.map(e=>({...e,id:`${e.id}_${Date.now().toString(36)}`})),n=e.table.records.map(n=>r(t,Object.fromEntries(e.table.fields.map((e,r)=>[t[r].id,n.values[e.id]??``]))));return{...e.table,id:`table_${e.id}_${Date.now().toString(36)}`,fields:t,records:n}}var Ae=`drawsplat.language`,x=[{code:`en`,label:`English`,dir:`ltr`,htmlLang:`en`},{code:`es`,label:`Español`,dir:`ltr`,htmlLang:`es`},{code:`vi`,label:`Tiếng Việt`,dir:`ltr`,htmlLang:`vi`},{code:`ar`,label:`العربية`,dir:`rtl`,htmlLang:`ar`},{code:`zh`,label:`中文`,dir:`ltr`,htmlLang:`zh`},{code:`uh`,label:`हिन्दी / اردو`,dir:`ltr`,htmlLang:`hi`}],je={es:{New:`Nuevo`,"Save JSON":`Guardar JSON`,"Open JSON":`Abrir JSON`,"Export CSV":`Exportar CSV`,File:`Archivo`,Edit:`Editar`,Data:`Datos`,Layout:`Diseño`,Tools:`Herramientas`,View:`Vista`,Teacher:`Docente`,Help:`Ayuda`,Title:`Título`,Search:`Buscar`,In:`En`,"All fields":`Todos los campos`,Sort:`Ordenar`,"Choose field":`Elegir campo`,"New field":`Campo nuevo`,"Field name":`Nombre del campo`,Type:`Tipo`,"Add field":`Agregar campo`,"Add record":`Agregar registro`,Table:`Tabla`,Form:`Formulario`,Cards:`Tarjetas`,Gallery:`Galería`,Labels:`Etiquetas`,Report:`Informe`,"Upload image":`Subir imagen`,"No image yet":`Sin imagen todavía`},vi:{New:`Mới`,"Save JSON":`Lưu JSON`,"Open JSON":`Mở JSON`,"Export CSV":`Xuất CSV`,File:`Tệp`,Edit:`Sửa`,Data:`Dữ liệu`,Layout:`Bố cục`,Tools:`Công cụ`,View:`Xem`,Teacher:`Giáo viên`,Help:`Trợ giúp`,Title:`Tiêu đề`,Search:`Tìm`,Sort:`Sắp xếp`,Table:`Bảng`,Form:`Biểu mẫu`,Cards:`Thẻ`,Gallery:`Thư viện ảnh`,Labels:`Nhãn`,Report:`Báo cáo`},ar:{New:`جديد`,"Save JSON":`حفظ JSON`,"Open JSON":`فتح JSON`,"Export CSV":`تصدير CSV`,File:`ملف`,Edit:`تحرير`,Data:`بيانات`,Layout:`تخطيط`,Tools:`أدوات`,View:`عرض`,Teacher:`المعلم`,Help:`مساعدة`,Title:`العنوان`,Search:`بحث`,Sort:`فرز`,Table:`جدول`,Form:`نموذج`,Cards:`بطاقات`,Gallery:`معرض`,Labels:`ملصقات`,Report:`تقرير`},zh:{New:`新建`,"Save JSON":`保存 JSON`,"Open JSON":`打开 JSON`,"Export CSV":`导出 CSV`,File:`文件`,Edit:`编辑`,Data:`数据`,Layout:`布局`,Tools:`工具`,View:`视图`,Teacher:`教师`,Help:`帮助`,Title:`标题`,Search:`搜索`,Sort:`排序`,Table:`表格`,Form:`表单`,Cards:`卡片`,Gallery:`图库`,Labels:`标签`,Report:`报告`},uh:{New:`नया`,File:`फ़ाइल`,Edit:`संपादन`,Data:`डेटा`,Layout:`लेआउट`,Tools:`औज़ार`,View:`दृश्य`,Teacher:`शिक्षक`,Help:`सहायता`,Search:`खोज`,Table:`तालिका`,Form:`फ़ॉर्म`,Cards:`कार्ड`,Gallery:`गैलरी`,Labels:`लेबल`,Report:`रिपोर्ट`}},Me=document.querySelector(`#app`);if(!Me)throw Error(`ListSplatTM app root was not found.`);var S=Me,C=se()??a(),w=C.schema.tables[0].id,T=C.schema.tables[0].records[0]?.id??``,E=`table`,D=`Saved locally`,O=``,k=`all`,A=``,j=`asc`,M=new Set,N=`none`,Ne=``,P=`Tip: Start with one table, then add relationships when your project needs them.`,F=[],I=[],Pe=w,L=C.schema.tables[1]?.id??w,R=null,Fe=``,z=Le();function B(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function Ie(e){let t=(e||``).toLowerCase();return t.startsWith(`es`)?`es`:t.startsWith(`vi`)?`vi`:t.startsWith(`ar`)?`ar`:t.startsWith(`zh`)?`zh`:t===`uh`||t.startsWith(`ur`)||t.startsWith(`hi`)?`uh`:`en`}function Le(){let e=new URLSearchParams(window.location.search);try{return Ie(e.get(`lang`)||localStorage.getItem(Ae)||navigator.language)}catch{return Ie(e.get(`lang`)||navigator.language)}}function Re(e){return x.map(({code:t,label:n})=>`<option value="${t}"${t===e?` selected`:``}>${n}</option>`).join(``)}function V(e){return z===`en`?e:je[z][e]??e}function ze(){let e=x.find(e=>e.code===z)??x[0];document.documentElement.lang=e.htmlLang,document.documentElement.dir=e.dir}function H(){return C.schema.tables.find(e=>e.id===w)??C.schema.tables[0]}function U(e){let t=Se(e,{query:O,fieldId:k});return M.size>0?t.filter(e=>M.has(e.id)):t}function W(e){e.records.some(e=>e.id===T)||(T=e.records[0]?.id??``)}function G(e){C=e,W(H()),p(C),D=`Saved locally`,$()}function K(e){F=[{label:e,project:structuredClone(C)},...F].slice(0,12)}function Be(){let e=F[0];if(!e){P=`Nothing to undo yet.`,$();return}F=F.slice(1),C=e.project,w=C.schema.tables.some(e=>e.id===w)?w:C.schema.tables[0].id,W(H()),p(C),P=`Undid ${e.label}.`,$()}function q(e){w=e.id,G(u(C,e))}function Ve(){document.querySelectorAll(`.menu[open]`).forEach(e=>{e.open=!1})}function He(e){G({...C,updatedAt:new Date().toISOString(),metadata:{...C.metadata,title:e||`Untitled Database`}})}function Ue(){m(`${C.metadata.title||`listsplat-project`}.listsplat.json`,JSON.stringify(C,null,2),`application/json`)}function We(){m(`${H().name}.csv`,ae(H()),`text/csv;charset=utf-8`)}function Ge(){let e=H(),t=U(e),n=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${B(C.metadata.title)}</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{color:#5b21b6}</style></head>
<body><h1>${B(C.metadata.title)}</h1><p>${B(e.name)} report from ListSplatTM.</p>
<table><thead><tr>${e.fields.map(e=>`<th>${B(e.name)}</th>`).join(``)}</tr></thead>
<tbody>${t.map(t=>`<tr>${e.fields.map(n=>`<td>${B(Y(e,t,n.id))}</td>`).join(``)}</tr>`).join(``)}</tbody></table></body></html>`;m(`${C.metadata.title||`listsplat-report`}.html`,n,`text/html;charset=utf-8`)}function Ke(){let e=C.schema.tables.map(e=>{let t=tt(e),n=t.reduce((e,t)=>e+t.missing,0),r=t.reduce((e,t)=>e+t.duplicates,0);return`
        <section>
          <h2>${B(e.name)}</h2>
          <p>${e.records.length} records, ${e.fields.length} fields, ${n} missing values, ${r} duplicate values.</p>
          <table>
            <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th><th>Missing</th><th>Duplicates</th></tr></thead>
            <tbody>${e.fields.map(e=>{let n=t.find(t=>t.field.id===e.id);return`<tr><td>${B(e.name)}</td><td>${B(e.type)}</td><td>${e.required?`Yes`:`No`}</td><td>${B(e.description)}</td><td>${n?.missing??0}</td><td>${n?.duplicates??0}</td></tr>`}).join(``)}</tbody>
          </table>
        </section>
      `}).join(``),t=C.schema.relationships.length?`<ul>${C.schema.relationships.map(e=>`<li>${B(e.name)}: ${B(fe(C,e))}</li>`).join(``)}</ul>`:`<p>No relationships have been created yet.</p>`,n=C.teacher.notes.length?`<ul>${C.teacher.notes.map(e=>`<li>${B(e)}</li>`).join(``)}</ul>`:`<p>No teacher notes yet.</p>`,r=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${B(C.metadata.title)} Project Packet</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937;line-height:1.5}h1,h2{color:#5b21b6}section{margin:0 0 28px}table{border-collapse:collapse;width:100%;margin-top:10px}th,td{border:1px solid #d8ccff;padding:8px;text-align:left;vertical-align:top}th{background:#f3edff;color:#4c1d95}.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.meta div{border:1px solid #d8ccff;border-radius:8px;padding:12px;background:#faf8ff}</style></head>
<body>
  <h1>${B(C.metadata.title||`ListSplat Project`)} Project Packet</h1>
  <div class="meta">
    <div><strong>Author</strong><br>${B(C.metadata.author||`Not set`)}</div>
    <div><strong>Class</strong><br>${B(C.metadata.className||`Not set`)}</div>
    <div><strong>Tables</strong><br>${C.schema.tables.length}</div>
    <div><strong>Relationships</strong><br>${C.schema.relationships.length}</div>
  </div>
  <section><h2>Teacher Notes</h2>${n}</section>
  <section><h2>Relationships</h2>${t}</section>
  ${e}
</body></html>`;m(`${C.metadata.title||`listsplat`}-project-packet.html`,r,`text/html;charset=utf-8`)}function qe(e){e.text().then(e=>{let t=JSON.parse(e);d(t),w=t.schema.tables[0].id,T=t.schema.tables[0].records[0]?.id??``,G(t)}).catch(e=>{window.alert(e instanceof Error?e.message:`Could not open this ListSplatTM file.`)})}function Je(e){e.text().then(t=>{let n=re(e.name.replace(/\.csv$/i,``),t);R=n,Fe=e.name,N=`csvImport`,P=`Previewing ${n.records.length} CSV record${n.records.length===1?``:`s`} from ${e.name}.`,$()})}function Ye(e){if(!R){N=`none`;return}if(K(`CSV import`),e===`new`){let e=R;w=e.id,T=e.records[0]?.id??``,R=null,N=`none`,P=`Imported ${e.records.length} records from ${Fe}.`,G({...C,updatedAt:new Date().toISOString(),schema:{...C.schema,tables:[...C.schema.tables,e]},layouts:[...C.layouts,{id:`layout_${Date.now().toString(36)}`,name:`${e.name} Table`,tableId:e.id,mode:`table`,locked:!1}]});return}let t=H(),n=new Map(R.fields.map(e=>[e.name.trim().toLowerCase(),e.id])),i=R.records.map(e=>r(t.fields,Object.fromEntries(t.fields.map(t=>{let r=n.get(t.name.trim().toLowerCase());return[t.id,r?e.values[r]??``:``]}))));R=null,N=`none`,P=`Appended ${i.length} CSV record${i.length===1?``:`s`} to ${t.name}.`,q({...t,records:[...t.records,...i]})}function Xe(e){let t=Oe.find(t=>t.id===e);if(!t)return;let n=ke(t);K(`template load`),w=n.id,T=n.records[0]?.id??``,P=`Loaded ${t.title}.`,G({...C,metadata:{...C.metadata,title:t.title},schema:{...C.schema,tables:[...C.schema.tables,n]},teacher:{...C.teacher,notes:t.reflectionQuestions}})}function J(e,t){return`
    <details class="menu">
      <summary>${B(V(e))}</summary>
      <div class="menu-panel">
        ${t.map(([e,t])=>`<button type="button" data-action="${e}">${B(V(t))}</button>`).join(``)}
      </div>
    </details>
  `}function Ze(e=`text`){return[[`text`,`Short text`],[`longText`,`Long text`],[`number`,`Number`],[`currency`,`Currency`],[`percent`,`Percent`],[`date`,`Date`],[`checkbox`,`Checkbox`],[`rating`,`Rating`],[`choice`,`Choice`],[`image`,`Image`],[`link`,`Link`],[`calculation`,`Calculation`],[`autoNumber`,`Auto number`],[`createdAt`,`Created time`],[`updatedAt`,`Updated time`]].map(([t,n])=>`<option value="${t}" ${e===t?`selected`:``}>${n}</option>`).join(``)}function Y(e,t,n){let r=e.fields.find(e=>e.id===n);return r?.type===`calculation`&&r.formula?xe(r.formula,e,t,C):t.values[n]??``}function X(){return C.layouts.find(e=>e.tableId===w&&e.mode===E)}function Qe(e){return!!e}function Z(e){let t=new Set(X()?.hiddenFieldIds??[]);return Q(e).filter(e=>!t.has(e.id))}function Q(e){let t=X()?.fieldOrder??e.fields.map(e=>e.id),n=new Map(e.fields.map(e=>[e.id,e]));return[...t.map(e=>n.get(e)).filter(Qe),...e.fields.filter(e=>!t.includes(e.id))].filter(e=>e&&!e.hidden)}function $e(e){return e.fields.filter(e=>e.type===`calculation`)}function et(e){return $e(e).reduce((t,n)=>n.formula?t+e.records.filter(t=>String(xe(n.formula??``,e,t,C)).startsWith(`Formula error:`)).length:t,0)}function tt(e){return e.fields.filter(e=>!e.hidden&&![`image`,`autoNumber`,`createdAt`,`updatedAt`,`calculation`].includes(e.type)).map(t=>({field:t,missing:Te(e,t.id).length,duplicates:we(e,t.id).length}))}function nt(e){return Z(e).filter(e=>e.type===`image`)}function rt(e,t){let n=nt(e)[0];return n?String(Y(e,t,n.id)??``):``}function it(e){let t=X();t&&G({...C,updatedAt:new Date().toISOString(),layouts:C.layouts.map(n=>n.id===t.id?{...n,...e}:n)})}function at(e,t){let n=e.fields.find(e=>!e.hidden)??e.fields[0],r=n?Y(e,t,n.id):``;return String(r||`Untitled record`)}function ot(e,t,n,r){let i=e.fields.find(e=>e.id===n),a=Y(e,t,n),o=`aria-label="${B(i?.name??`Field`)}, record ${r+1}" data-record-id="${t.id}" data-field-id="${n}"`;if(i?.type===`checkbox`)return`<input class="cell-checkbox" type="checkbox" ${o} ${a===!0||a===`true`?`checked`:``}>`;if(i?.type===`image`){let e=String(a??``);return`
      <div class="image-cell" tabindex="0" role="button" title="Click here and paste an image, or use Upload image." ${o}>
        ${e?`<img src="${B(e)}" alt="">`:`<span>${B(V(`No image yet`))}</span>`}
        <small>Paste an image here or upload one.</small>
        <label class="image-upload-label">
          ${B(V(`Upload image`))}
          <input class="image-input" type="file" accept="image/*" ${o}>
        </label>
      </div>
    `}return i?.type===`rating`?`<input class="cell-input" type="number" min="0" max="5" step="1" ${o} value="${B(a)}">`:i?.type===`choice`?`<select class="cell-input" ${o}>${(i.options?.length?i.options:[`Yes`,`No`]).map(e=>`<option value="${B(e)}" ${String(a)===e?`selected`:``}>${B(e)}</option>`).join(``)}</select>`:i?.type===`autoNumber`||i?.type===`createdAt`||i?.type===`updatedAt`?`<output class="calc-output">${B(a)}</output>`:i?.type===`longText`?`<textarea class="cell-input" ${o}>${B(a)}</textarea>`:i?.type===`date`?`<input class="cell-input" type="date" ${o} value="${B(a)}">`:i?.type===`number`||i?.type===`currency`||i?.type===`percent`?`<input class="cell-input" type="number" step="any" ${o} value="${B(a)}">`:i?.type===`calculation`?`<output class="calc-output">${B(a)}</output>`:`<input class="cell-input" ${o} value="${B(a)}">`}function st(e){return`
    <div class="table-tabs">
      ${C.schema.tables.map(t=>`<button type="button" class="table-tab ${t.id===e.id?`active`:``}" data-table-id="${t.id}">${B(t.name)}</button>`).join(``)}
    </div>
  `}function ct(e,t){return`
    <div class="data-grid-wrap">
      <table class="data-grid">
        <thead>
          <tr>
            <th>#</th>
            ${Z(e).map(e=>`
                  <th>
                    <button type="button" class="field-button" data-field-settings="${e.id}">
                      ${B(e.name)}<br><small>${B(e.type)}</small>
                    </button>
                  </th>
                `).join(``)}
            <th>Record</th>
          </tr>
        </thead>
        <tbody>
          ${t.map((t,n)=>`
                <tr class="${t.id===T?`active-row`:``}" data-record-row="${t.id}">
                  <td><button type="button" class="row-button" data-select-record="${t.id}">${n+1}</button></td>
                  ${Z(e).map(r=>`<td>${ot(e,t,r.id,n)}</td>`).join(``)}
                  <td class="record-actions">
                    <button type="button" data-action="duplicate-record" data-record-action-id="${t.id}">Copy</button>
                    <button type="button" data-action="delete-record" data-record-action-id="${t.id}">Delete</button>
                  </td>
                </tr>
              `).join(``)}
        </tbody>
      </table>
    </div>
  `}function lt(e){let t=e.records.find(e=>e.id===T)??e.records[0];if(!t)return`<div class="empty-panel">Add a record to use form view.</div>`;let n=C.schema.relationships.filter(t=>t.fromTableId===e.id).map(n=>{let r=C.schema.tables.find(e=>e.id===n.toTableId),i=r?de(n,e,t,r):[];return`
        <section class="related-records">
          <h3>${B(n.name)}</h3>
          <p>${i.length} related record${i.length===1?``:`s`} from ${B(r?.name??`another table`)}</p>
          ${i.length?`<div class="related-grid">${i.slice(0,6).map(e=>`
                      <article>
                        <strong>${B(at(r,e))}</strong>
                        ${r.fields.filter(e=>!e.hidden).slice(0,3).map(t=>`<span>${B(t.name)}: ${B(Y(r,e,t.id))}</span>`).join(``)}
                      </article>
                    `).join(``)}</div>`:`<p>No matches yet. Make sure the match fields use the same value.</p>`}
        </section>
      `}).join(``);return`
    <div class="form-view">
      <div class="form-nav">
        ${e.records.map((e,n)=>`<button type="button" class="${e.id===t.id?`active`:``}" data-select-record="${e.id}">Record ${n+1}</button>`).join(``)}
      </div>
      <div class="record-form">
        ${Z(e).map((n,r)=>`
              <label>
                <span>${B(n.name)}</span>
                ${ot(e,t,n.id,r)}
                ${n.description?`<small>${B(n.description)}</small>`:``}
              </label>
            `).join(``)}
        ${n}
      </div>
    </div>
  `}function ut(e,t){let n=(t,n)=>{let r=Y(e,n,t.id);if(t.type===`image`){let e=String(r??``);return`
        <figure class="card-image-field">
          ${e?`<img src="${B(e)}" alt="">`:`<span>No image yet</span>`}
          <figcaption>${B(t.name)}</figcaption>
        </figure>
      `}return`<p><strong>${B(t.name)}</strong><span>${B(r)}</span></p>`};return`
    <div class="cards-view ${E===`gallery`?`gallery-view`:``}">
      ${t.map(t=>{let r=rt(e,t);return`
            <article class="record-card" data-select-record="${t.id}">
              ${E===`gallery`?`<div class="gallery-image">${r?`<img src="${B(r)}" alt="">`:`<span>Add an image field, then upload a picture.</span>`}</div>`:``}
              ${Z(e).filter(e=>E!==`gallery`||e.type!==`image`).slice(0,E===`gallery`?4:8).map(e=>n(e,t)).join(``)}
            </article>
          `}).join(``)}
    </div>
  `}function dt(e,t){return`
    <div class="labels-view">
      ${t.map(t=>`
            <article class="print-label">
              ${Z(e).slice(0,4).map(n=>`<p><strong>${B(n.name)}:</strong> ${B(Y(e,t,n.id))}</p>`).join(``)}
            </article>
          `).join(``)}
    </div>
  `}function ft(e,t){let n=me(e);return`
    <div class="report-view">
      <header>
        <h2>${B(C.metadata.title)}</h2>
        <p>${B(e.name)} report. ${t.length} record${t.length===1?``:`s`} shown.</p>
      </header>
      ${ct(e,t)}
      ${n.length?`<section class="summary-strip">${n.map(e=>`<div><strong>${B(e.fieldName)}</strong><span>Sum ${e.sum.toLocaleString()} | Avg ${e.average.toFixed(2)}</span></div>`).join(``)}</section>`:`<p class="empty-panel">Add a number, currency, or percent field to see summaries.</p>`}
    </div>
  `}function pt(e){let t=U(e),n={table:`Table: spreadsheet-like rows and columns for fast data entry.`,form:`Form: focus on one record at a time.`,cards:`Cards: compact text-first record cards for browsing.`,gallery:`Gallery: image-first cards for collections and exhibits.`,labels:`Labels: printable small cards or shelf labels.`,report:`Report: printable table with title and summaries.`},r=E===`form`?lt(e):E===`cards`||E===`gallery`?ut(e,t):E===`labels`?dt(e,t):E===`report`?ft(e,t):ct(e,t);return`
    <section class="database-panel" aria-label="Database table">
      ${st(e)}
      <div class="view-tabs" role="group" aria-label="Layout modes">
        ${[`table`,`form`,`cards`,`gallery`,`labels`,`report`].map(e=>`<button type="button" class="${E===e?`active`:``}" data-view-mode="${e}" title="${B(n[e])}" aria-label="${B(n[e])}">${B(V(e[0].toUpperCase()+e.slice(1)))}</button>`).join(``)}
      </div>
      ${r}
    </section>
  `}function mt(e){let t=me(e),n=e.records.find(e=>e.id===T)??e.records[0],r=n?C.schema.relationships.filter(t=>t.fromTableId===e.id).map(t=>{let r=C.schema.tables.find(e=>e.id===t.toTableId),i=r?de(t,e,n,r).length:0;return`
            <div class="template-card">
              <strong>${B(t.name)}</strong>
              <span>${i} related record${i===1?``:`s`}</span>
              <p>${B(fe(C,t))}</p>
            </div>
          `}).join(``):``;return`
    <aside class="teacher-panel" aria-label="Teacher tools and database stats">
      <h2>Database Check</h2>
      <div class="stat-grid">
        <div class="stat-card"><strong>${U(e).length}</strong> shown</div>
        <div class="stat-card"><strong>${e.records.length}</strong> records</div>
        <div class="stat-card"><strong>${e.fields.length}</strong> fields</div>
        <div class="stat-card"><strong>${C.schema.tables.length}</strong> tables</div>
      </div>
      ${t.map(e=>`
            <div class="template-card">
              <strong>${B(e.fieldName)} summary</strong>
              <span>Sum: ${e.sum.toLocaleString()}</span>
              <span>Average: ${e.average.toFixed(2)}</span>
            </div>
          `).join(``)}
      ${r?`<h3>Related Records</h3>${r}`:``}
      <h3>Template Starters</h3>
      ${Oe.map(e=>`
            <div class="template-card">
              <strong>${B(e.title)}</strong>
              <span>${B(e.gradeBand)}</span>
              <p>${B(e.goal)}</p>
              <button type="button" data-template-id="${e.id}">Use template</button>
            </div>
          `).join(``)}
    </aside>
  `}function ht(e){if(N===`none`)return``;if(N===`replace`){let t=I.slice(0,8);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Replace values">
          <h2>Replace values</h2>
          <label>Find <input data-replace-find placeholder="Text to find"></label>
          <label>Replace with <input data-replace-with placeholder="New text"></label>
          <label>Field <select data-replace-field>${e.fields.map(e=>`<option value="${e.id}">${B(e.name)}</option>`).join(``)}</select></label>
          <label class="check-row"><input type="checkbox" data-replace-case-sensitive> Case-sensitive</label>
          <label class="check-row"><input type="checkbox" data-replace-whole-word> Whole word only</label>
          <p>Replacement applies to the current found set when search is active. Preview first, then apply. The last replace can be undone from Edit.</p>
          ${I.length?`<div class="replace-preview"><strong>${I.length} change${I.length===1?``:`s`} ready</strong>${t.map(t=>{let n=e.records.find(e=>e.id===t.recordId),r=e.fields.find(e=>e.id===t.fieldId);return`<p><span>${B(n?at(e,n):`Record`)} / ${B(r?.name??`Field`)}</span><del>${B(t.before)}</del><ins>${B(t.after)}</ins></p>`}).join(``)}</div>`:``}
          <div class="modal-actions">
            <button type="button" data-action="preview-replace">Preview</button>
            <button type="button" data-action="run-replace" ${I.length?``:`disabled`}>Apply Replace</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(N===`field`){let t=e.fields.find(e=>e.id===Ne)??e.fields[0];return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Field settings">
          <h2>Field settings</h2>
          <label>Name <input data-field-name value="${B(t.name)}"></label>
          <label>Type <select data-field-type>${Ze(t.type)}</select></label>
          <label>Description <textarea data-field-description>${B(t.description)}</textarea></label>
          <label>Choice options <input data-field-options value="${B(t.options?.join(`, `)??``)}" placeholder="Yes, No, Maybe"></label>
          <label class="check-row"><input type="checkbox" data-field-required ${t.required?`checked`:``}> Required field</label>
          <label class="check-row"><input type="checkbox" data-field-hidden ${t.hidden?`checked`:``}> Hide field</label>
          <label>Calculation formula <input data-field-formula value="${B(t.formula??``)}" placeholder='JOIN(First Name, " ", Last Name)'></label>
          <p>Try <code>FIELD(Animal)</code>, <code>JOIN(Animal, " lives in ", Habitat)</code>, <code>UPPER(Animal)</code>, <code>ADD(Score, Bonus)</code>, <code>AVERAGE(Score)</code>, or <code>LOOKUP("Book reviews", Rating)</code>.</p>
          <div class="modal-actions">
            <button type="button" data-action="save-field-settings">Save field</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(N===`layout`){let t=X(),n=Q(e),r=new Set(t?.hiddenFieldIds??[]);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Layout designer">
          <h2>Layout designer</h2>
          <p>Arrange and choose fields for the current ${B(E)} view. Locked layouts can still be viewed, but students should not change them.</p>
          <label class="check-row"><input type="checkbox" data-layout-locked ${t?.locked?`checked`:``}> Lock this layout</label>
          <div class="layout-field-list">
            ${n.map((e,t)=>`
                  <div class="layout-field-row">
                    <label class="check-row"><input type="checkbox" data-layout-field-visible="${e.id}" ${r.has(e.id)?``:`checked`}> <strong>${B(e.name)}</strong></label>
                    <span>${B(e.type)}</span>
                    <button type="button" data-action="layout-field-up" data-layout-field-id="${e.id}" ${t===0?`disabled`:``}>Up</button>
                    <button type="button" data-action="layout-field-down" data-layout-field-id="${e.id}" ${t===n.length-1?`disabled`:``}>Down</button>
                  </div>
                `).join(``)}
          </div>
          <div class="modal-actions">
            <button type="button" data-action="save-layout-settings">Save layout</button>
            <button type="button" data-action="close-dialog">Close</button>
          </div>
        </section>
      </div>
    `}if(N===`csvImport`&&R){let t=R.records.slice(0,5);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="CSV import preview">
          <h2>CSV import preview</h2>
          <p>${B(Fe)} has ${R.fields.length} field${R.fields.length===1?``:`s`} and ${R.records.length} record${R.records.length===1?``:`s`}.</p>
          <div class="preview-table-wrap">
            <table class="preview-table">
              <thead>
                <tr>${R.fields.map(e=>`<th>${B(e.name)}</th>`).join(``)}</tr>
              </thead>
              <tbody>
                ${t.map(e=>`<tr>${R.fields.map(t=>`<td>${B(e.values[t.id])}</td>`).join(``)}</tr>`).join(``)}
              </tbody>
            </table>
          </div>
          <p>New table keeps every CSV column. Append uses matching field names in the current table and leaves unmatched fields blank.</p>
          <div class="modal-actions">
            <button type="button" data-action="apply-csv-new">Create new table</button>
            <button type="button" data-action="apply-csv-append">Append to ${B(e.name)}</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(N===`projectIdeas`)return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Project ideas">
          <h2>Project ideas</h2>
          <ul>
            <li>Build a classroom library and find books by genre, author, or recommendation.</li>
            <li>Track science observations, then sort by date or measurement.</li>
            <li>Create animal trading cards with a label layout.</li>
            <li>Survey classmates and make a report showing the most common answers.</li>
            <li>Connect a Books table to a Reviews table after relationships are added.</li>
          </ul>
          <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
        </section>
      </div>
    `;if(N===`relationship`){let t=C.schema.tables.find(e=>e.id===Pe)??e,n=C.schema.tables.find(e=>e.id===L)??e,r=t.fields.map(e=>`<option value="${t.id}:${e.id}">${B(e.name)}</option>`).join(``),i=n.fields.map(e=>`<option value="${n.id}:${e.id}">${B(e.name)}</option>`).join(``);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Relationships">
          <h2>Relationships</h2>
          <p>Create a simple one-to-many relationship by matching values in two fields, such as Books:Title to Reviews:Book.</p>
          <label>Name <input data-relationship-name placeholder="Books to reviews"></label>
          <label>Parent table <select data-relationship-from-table>${C.schema.tables.map(e=>`<option value="${e.id}" ${e.id===t.id?`selected`:``}>${B(e.name)}</option>`).join(``)}</select></label>
          <label>Parent match field <select data-relationship-from-field>${r}</select></label>
          <label>Related table <select data-relationship-to-table>${C.schema.tables.map(e=>`<option value="${e.id}" ${e.id===n.id?`selected`:``}>${B(e.name)}</option>`).join(``)}</select></label>
          <label>Related match field <select data-relationship-to-field>${i}</select></label>
          ${C.schema.relationships.length?`<div class="relationship-list">${C.schema.relationships.map(e=>`<p><strong>${B(e.name)}</strong><br>${B(fe(C,e))}</p>`).join(``)}</div>`:`<p>No relationships yet. Add a second table first for the most useful results.</p>`}
          <div class="modal-actions">
            <button type="button" data-action="create-relationship">Create relationship</button>
            <button type="button" data-action="close-dialog">Close</button>
          </div>
        </section>
      </div>
    `}if(N===`functions`){let t=e.fields.filter(e=>![`image`,`createdAt`,`updatedAt`].includes(e.type)),n=t.find(e=>[`text`,`longText`,`choice`].includes(e.type))??t[0],r=t.find(e=>[`number`,`currency`,`percent`,`rating`].includes(e.type))??n,i=n?.name??`Field`,a=r?.name??`Score`;return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Functions">
          <h2>Calculation functions</h2>
          <p>Use a calculation field when students need a result made from other fields. Formulas are simple, offline, and do not run custom code.</p>
          <div class="formula-grid">
            <div>
              <strong>Text</strong>
              <code>FIELD(${B(i)})</code>
              <code>JOIN(${B(i)}, " report")</code>
              <code>UPPER(${B(i)})</code>
              <code>TITLECASE(${B(i)})</code>
              <code>CONTAINS(${B(i)}, "a")</code>
            </div>
            <div>
              <strong>Numbers</strong>
              <code>ADD(${B(a)}, "5")</code>
              <code>SUBTRACT(${B(a)}, "1")</code>
              <code>MULTIPLY(${B(a)}, "2")</code>
              <code>DIVIDE(${B(a)}, "2")</code>
              <code>ROUND(${B(a)}, "1")</code>
            </div>
            <div>
              <strong>Whole table</strong>
              <code>SUM(${B(a)})</code>
              <code>AVERAGE(${B(a)})</code>
              <code>MIN(${B(a)})</code>
              <code>MAX(${B(a)})</code>
              <code>COUNT(${B(a)})</code>
            </div>
            <div>
              <strong>Relationships</strong>
              <code>COUNT_RELATED("Relationship name")</code>
              <code>LOOKUP("Relationship name", Field)</code>
              <span>Use these after creating a relationship from Tools.</span>
            </div>
          </div>
          <p>To use one, add a new field, choose <strong>Calculation</strong>, then paste a formula into Field settings.</p>
          <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
        </section>
      </div>
    `}if(N===`quality`){let t=tt(e),n=et(e);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Data quality check">
          <h2>Data quality check</h2>
          <p>Use this before printing a report or exporting CSV. Click a count to highlight the records that need attention.</p>
          <div class="quality-summary">
            <div><strong>${t.reduce((e,t)=>e+t.missing,0)}</strong><span>missing values</span></div>
            <div><strong>${t.reduce((e,t)=>e+t.duplicates,0)}</strong><span>duplicate values</span></div>
            <div><strong>${n}</strong><span>formula errors</span></div>
          </div>
          <div class="quality-table" role="table" aria-label="Field quality">
            <div class="quality-row quality-head" role="row">
              <span>Field</span><span>Missing</span><span>Duplicates</span>
            </div>
            ${t.length?t.map(({field:e,missing:t,duplicates:n})=>`
                        <div class="quality-row" role="row">
                          <span><strong>${B(e.name)}</strong><small>${B(e.type)}</small></span>
                          <button type="button" data-quality-kind="missing" data-quality-field-id="${e.id}" ${t?``:`disabled`}>${t}</button>
                          <button type="button" data-quality-kind="duplicates" data-quality-field-id="${e.id}" ${n?``:`disabled`}>${n}</button>
                        </div>
                      `).join(``):`<p class="empty-panel">No editable data fields are available yet.</p>`}
          </div>
          <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
        </section>
      </div>
    `}return N===`teacherNotes`?`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Teacher notes">
          <h2>Teacher notes</h2>
          <p>Add one note per line. These notes are saved in the .listsplat.json file and included in the project packet.</p>
          <label>Notes <textarea data-teacher-notes rows="8" placeholder="Add setup directions, reflection questions, or grading reminders.">${B(C.teacher.notes.join(`
`))}</textarea></label>
          <div class="modal-actions">
            <button type="button" data-action="save-teacher-notes">Save notes</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `:`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="ListSplat help">
        <h2>ListSplatTM Help</h2>
        <p>Create fields to describe the information you want to collect. Add one record for each item, person, place, observation, or source.</p>
        <ul>
          <li>Use Table view for fast entry.</li>
          <li>Use Form view to focus on one record.</li>
          <li>Use Cards, Labels, and Report view to share or print.</li>
          <li>Save a .listsplat.json file when you need a reliable backup.</li>
          <li>CSV import/export lets you trade data with spreadsheets.</li>
        </ul>
        <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
      </section>
    </div>
  `}function $(){let e=H();W(e),ze(),S.innerHTML=`
    <header class="app-header">
      <a class="brand" href="../../pages/splatworks.html" aria-label="SplatWorks home">
        <img class="brand-icon" src="/splatworks/listsplat/assets/listsplat_icon-BGoZDMtc.svg" alt="">
        <span>
          <strong>ListSplat<sup>TM</sup></strong>
          <small>SplatWorks<sup>TM</sup> Database Studio</small>
        </span>
      </a>
      <div class="quick-actions">
        <button type="button" class="button primary" data-action="new">${B(V(`New`))}</button>
        <button type="button" class="button primary" data-action="save-json">${B(V(`Save JSON`))}</button>
        <button type="button" class="button primary" data-action="open-json">${B(V(`Open JSON`))}</button>
        <button type="button" class="button primary" data-action="export-csv">${B(V(`Export CSV`))}</button>
        <select id="languageSwitcher" class="lang-switcher" aria-label="Language">${Re(z)}</select>
      </div>
    </header>
    <main class="listsplat-app">
      <nav class="menu-bar" aria-label="Application menu">
        ${J(`File`,[[`new`,`New database`],[`save-json`,`Save .listsplat.json`],[`open-json`,`Open .listsplat.json`],[`import-csv`,`Import CSV`],[`export-csv`,`Export CSV`],[`export-report`,`Export report HTML`],[`print`,`Print`]])}
        ${J(`Edit`,[[`undo-change`,`Undo last change`],[`add-record`,`Add record`],[`add-field`,`Add field`],[`find`,`Find records`],[`replace`,`Replace values`]])}
        ${J(`Data`,[[`add-table`,`New table`],[`sort`,`Sort records`],[`missing`,`Find missing values`],[`duplicates`,`Find duplicates`],[`clear-find`,`Show all records`]])}
        ${J(`Layout`,[[`layout-designer`,`Design current layout`],[`table-view`,`Table view`],[`form-view`,`Form view`],[`cards-view`,`Card view`],[`gallery-view`,`Gallery view`],[`labels-view`,`Label view`],[`report-view`,`Report view`]])}
        ${J(`Tools`,[[`functions`,`Functions`],[`relationships`,`Relationships`],[`quality`,`Data quality check`]])}
        ${J(`View`,[[`student-view`,`Student view`],[`teacher-notes`,`Teacher notes`]])}
        <span class="menu-spacer"></span>
        ${J(`Teacher`,[[`templates`,`Template Library`],[`project-ideas`,`Project Ideas`],[`lock-layout`,`Lock Layout`],[`project-packet`,`Print Project Packet`]])}
        ${J(`Help`,[[`help-start`,`Start a database`],[`help-csv`,`Import and export CSV`],[`help-layouts`,`Forms and reports`],[`help-privacy`,`Privacy and saving`]])}
      </nav>
      <section class="toolbar" aria-label="Database toolbar">
        <label>${B(V(`Title`))} <input data-project-title value="${B(C.metadata.title)}"></label>
        <label>${B(V(`Search`))} <input data-search value="${B(O)}" placeholder="${B(V(`Find records`))}"></label>
        <label>${B(V(`In`))} <select data-search-field><option value="all">${B(V(`All fields`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${k===e.id?`selected`:``}>${B(e.name)}</option>`).join(``)}</select></label>
        <label>${B(V(`Sort`))} <select data-sort-field><option value="">${B(V(`Choose field`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${A===e.id?`selected`:``}>${B(e.name)}</option>`).join(``)}</select></label>
        <button type="button" data-action="toggle-sort">${j===`asc`?`A-Z`:`Z-A`}</button>
        <label>${B(V(`New field`))} <input data-new-field placeholder="${B(V(`Field name`))}"></label>
        <label>${B(V(`Type`))} <select data-new-field-type>${Ze()}</select></label>
        <button type="button" data-action="add-field">${B(V(`Add field`))}</button>
        <button type="button" data-action="add-record">${B(V(`Add record`))}</button>
      </section>
      <div class="workspace">
        ${pt(e)}
        ${mt(e)}
      </div>
      <footer class="status-bar">
        <span>${B(e.name)}: ${U(e).length} shown of ${e.records.length} records, ${e.fields.length} fields</span>
        <span>${B(P)}</span>
        <span>${D}</span>
      </footer>
    </main>
    <input class="hidden-file" type="file" accept=".listsplat.json,application/json" data-open-json>
    <input class="hidden-file" type="file" accept=".csv,text/csv" data-import-csv>
    ${ht(e)}
  `}function gt(e){return e instanceof HTMLInputElement&&e.type===`checkbox`?e.checked:e instanceof HTMLInputElement&&e.type===`number`?e.value===``?``:Number(e.value):e.value}function _t(e){let t=e.dataset.recordId,n=e.dataset.fieldId;!t||!n||(C=u(C,l(H(),t,n,gt(e))),p(C),D=`Saved locally`)}function vt(e,t,n,r){if(!n.type.startsWith(`image/`)){P=`That clipboard item is not an image.`,$();return}let i=new FileReader;i.addEventListener(`load`,()=>{K(r),C=u(C,l(H(),e,t,String(i.result??``))),p(C),P=`Image saved in this field.`,$()}),i.readAsDataURL(n)}function yt(){let e=H(),t=e.fields.find(e=>e.id===Ne);if(!t)return;let n=S.querySelector(`[data-field-name]`)?.value??t.name,r=S.querySelector(`[data-field-type]`)?.value??t.type,i=S.querySelector(`[data-field-description]`)?.value??``,a=S.querySelector(`[data-field-required]`)?.checked??!1,o=S.querySelector(`[data-field-hidden]`)?.checked??!1,s=S.querySelector(`[data-field-formula]`)?.value??``,ee=(S.querySelector(`[data-field-options]`)?.value??``).split(`,`).map(e=>e.trim()).filter(Boolean);q(c(e,t.id,{name:n,type:r,description:i,required:a,hidden:o,formula:s,options:ee})),N=`none`,P=`Updated ${n}.`,$()}function bt(){let e=S.querySelector(`[data-replace-find]`)?.value??``,t=S.querySelector(`[data-replace-with]`)?.value??``,n=S.querySelector(`[data-replace-field]`)?.value??H().fields[0]?.id,r=S.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=S.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=O?U(H()).map(e=>e.id):void 0;K(`replace`);let o=De(H(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i});N=`none`,I=[],P=`Replaced ${o.count} value${o.count===1?``:`s`}.`,q(o.table)}function xt(){let e=S.querySelector(`[data-replace-find]`)?.value??``,t=S.querySelector(`[data-replace-with]`)?.value??``,n=S.querySelector(`[data-replace-field]`)?.value??H().fields[0]?.id,r=S.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=S.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=O?U(H()).map(e=>e.id):void 0;I=Ee(H(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i}),P=`Preview found ${I.length} change${I.length===1?``:`s`}.`,$()}function St(){let e=(S.querySelector(`[data-teacher-notes]`)?.value??``).split(`
`).map(e=>e.trim()).filter(Boolean);K(`teacher notes`),N=`none`,P=`Saved ${e.length} teacher note${e.length===1?``:`s`}.`,G({...C,updatedAt:new Date().toISOString(),teacher:{...C.teacher,notes:e}})}function Ct(e){let t=S.querySelector(e)?.value;if(!t)return null;let[n,r]=t.split(`:`);return n&&r?{tableId:n,fieldId:r}:null}function wt(){let e=S.querySelector(`[data-relationship-from-table]`)?.value??``,t=S.querySelector(`[data-relationship-to-table]`)?.value??``,n=Ct(`[data-relationship-from-field]`),r=Ct(`[data-relationship-to-field]`),i=S.querySelector(`[data-relationship-name]`)?.value??``;if(!e||!t||!n||!r){P=`Choose both tables and both match fields.`,$();return}if(n.tableId!==e||r.tableId!==t){P=`Match fields must belong to the tables you chose.`,$();return}K(`relationship create`);let a=le(i,e,n.fieldId,t,r.fieldId);P=`Created relationship: ${a.name}.`,G(ue(C,a))}function Tt(){Pe=S.querySelector(`[data-relationship-from-table]`)?.value??Pe,L=S.querySelector(`[data-relationship-to-table]`)?.value??L,$()}S.addEventListener(`click`,e=>{let t=e.target,n=t.closest(`[data-action]`)?.dataset.action,r=t.closest(`[data-table-id]`)?.dataset.tableId,i=t.closest(`[data-template-id]`)?.dataset.templateId,c=t.closest(`[data-view-mode]`)?.dataset.viewMode,l=t.closest(`[data-select-record]`)?.dataset.selectRecord,u=t.closest(`[data-field-settings]`)?.dataset.fieldSettings,d=t.closest(`[data-record-action-id]`)?.dataset.recordActionId,f=t.closest(`[data-quality-field-id]`);if(r){w=r,M=new Set,W(H()),$();return}if(i){Xe(i);return}if(c){E=c,$();return}if(l){T=l,E===`table`&&$();return}if(u){Ne=u,N=`field`,$();return}if(f){let e=f.dataset.qualityFieldId,t=f.dataset.qualityKind;if(e&&t){let n=t===`duplicates`?we(H(),e):Te(H(),e);M=new Set(n.map(e=>e.id));let r=H().fields.find(t=>t.id===e);P=`Highlighted ${n.length} ${t===`duplicates`?`duplicate`:`missing`} record${n.length===1?``:`s`} in ${r?.name??`this field`}.`,N=`none`,$();return}}if(n)if(Ve(),n===`new`){K(`new database`);let e=a(`Untitled Database`);w=e.schema.tables[0].id,T=e.schema.tables[0].records[0]?.id??``,M=new Set,G(e)}else if(n===`save-json`)Ue();else if(n===`open-json`)S.querySelector(`[data-open-json]`)?.click();else if(n===`import-csv`)S.querySelector(`[data-import-csv]`)?.click();else if(n===`export-csv`)We();else if(n===`export-report`)Ge();else if(n===`project-packet`)Ke();else if(n===`print`)window.print();else if(n===`add-record`)K(`add record`),q(s(H()));else if(n===`add-field`){let e=S.querySelector(`[data-new-field]`),t=S.querySelector(`[data-new-field-type]`)?.value;K(`add field`),q(o(H(),e?.value||`New Field`,t??`text`))}else if(n===`add-table`){let e=window.prompt(`New table name?`,`New Table`)??``;K(`add table`);let t=ne(C,e);w=t.schema.tables.at(-1)?.id??w,T=H().records[0]?.id??``,G(t)}else if(n===`duplicate-record`&&d)K(`duplicate record`),q(ee(H(),d));else if(n===`delete-record`&&d)K(`delete record`),q(te(H(),d));else if(n===`toggle-sort`)j=j===`asc`?`desc`:`asc`,$();else if(n===`sort`)A&&q(Ce(H(),A,j));else if(n===`duplicates`){let e=k===`all`?H().fields[0]?.id:k;M=new Set(we(H(),e).map(e=>e.id)),P=`Found ${M.size} duplicate record${M.size===1?``:`s`}.`,$()}else if(n===`missing`){let e=k===`all`?H().fields[0]?.id:k;M=new Set(Te(H(),e).map(e=>e.id)),P=`Found ${M.size} record${M.size===1?``:`s`} with missing values.`,$()}else if(n===`clear-find`)O=``,M=new Set,P=`Showing all records.`,$();else if(n===`replace`)I=[],N=`replace`,$();else if(n===`preview-replace`)xt();else if(n===`run-replace`)bt();else if(n===`save-teacher-notes`)St();else if(n===`apply-csv-new`)Ye(`new`);else if(n===`apply-csv-append`)Ye(`append`);else if(n===`save-field-settings`)K(`field settings`),yt();else if(n===`layout-designer`||n===`lock-layout`)N=`layout`,$();else if(n===`layout-field-up`||n===`layout-field-down`){let e=t.closest(`[data-layout-field-id]`)?.dataset.layoutFieldId,r=X();if(e&&r){let t=Q(H()).map(e=>e.id),r=t.indexOf(e),i=n===`layout-field-up`?r-1:r+1;r>=0&&i>=0&&i<t.length&&([t[r],t[i]]=[t[i],t[r]],K(`layout order`),N=`layout`,it({fieldOrder:t}))}}else if(n===`save-layout-settings`){let e=S.querySelector(`[data-layout-locked]`)?.checked??!1,t=new Set([...S.querySelectorAll(`[data-layout-field-visible]:checked`)].map(e=>e.dataset.layoutFieldVisible??``)),n=Q(H()).map(e=>e.id),r=n.filter(e=>!t.has(e));K(`layout settings`),N=`none`,it({locked:e,fieldOrder:n,hiddenFieldIds:r})}else n===`create-relationship`?wt():n===`undo-change`?Be():n===`close-dialog`?(N=`none`,I=[],R=null,$()):n.endsWith(`-view`)?(E=n.replace(`-view`,``),$()):n===`templates`?(P=`Template starters are in the Teacher panel.`,$()):n===`project-ideas`?(N=`projectIdeas`,$()):n===`relationships`?(N=`relationship`,$()):n===`functions`?(N=`functions`,$()):n===`quality`?(N=`quality`,$()):n===`teacher-notes`?(N=`teacherNotes`,$()):n.startsWith(`help-`)?(N=`help`,$()):(P=`This ListSplatTM tool is planned for a later build.`,$())}),S.addEventListener(`change`,e=>{let t=e.target;if(t.matches(`#languageSwitcher`)&&t instanceof HTMLSelectElement){z=Ie(t.value);try{localStorage.setItem(Ae,z)}catch{}$()}else if(t.matches(`[data-open-json]`)&&t instanceof HTMLInputElement&&t.files?.[0])qe(t.files[0]);else if(t.matches(`[data-import-csv]`)&&t instanceof HTMLInputElement&&t.files?.[0])Je(t.files[0]);else if(t.matches(`[data-search-field]`))k=t.value,M=new Set,$();else if(t.matches(`[data-sort-field]`))A=t.value,A&&q(Ce(H(),A,j));else if(t.matches(`[data-relationship-from-table], [data-relationship-to-table]`))Tt();else if(t.matches(`.cell-input, .cell-checkbox, .image-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement))if(t instanceof HTMLInputElement&&t.type===`file`&&t.files?.[0]){let e=t.dataset.recordId,n=t.dataset.fieldId,r=t.files[0];e&&n&&vt(e,n,r,`image upload`)}else _t(t)}),S.addEventListener(`paste`,e=>{let t=e.target.closest(`.image-cell`);if(!t)return;let n=t.dataset.recordId,r=t.dataset.fieldId,i=Array.from(e.clipboardData?.items??[]).find(e=>e.type.startsWith(`image/`))?.getAsFile();n&&r&&i&&(e.preventDefault(),vt(n,r,i,`image paste`))}),S.addEventListener(`input`,e=>{let t=e.target;if(t.matches(`[data-project-title]`)){He(t.value);return}if(t.matches(`[data-search]`)){O=t.value,M=new Set,$();return}t.matches(`.cell-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)&&_t(t)}),document.addEventListener(`click`,e=>{e.target.closest(`.menu`)||Ve()}),document.addEventListener(`toggle`,e=>{let t=e.target;!(t instanceof HTMLDetailsElement)||!t.matches(`.menu`)||!t.open||document.querySelectorAll(`.menu[open]`).forEach(e=>{e!==t&&(e.open=!1)})},!0),$();