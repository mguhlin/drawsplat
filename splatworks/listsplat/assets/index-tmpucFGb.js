(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={text:``,longText:``,number:0,currency:0,percent:0,date:``,checkbox:!1,rating:0,choice:``,image:``,link:``,calculation:``,autoNumber:``,createdAt:``,updatedAt:``};function t(e){return`${e}_${Math.random().toString(36).slice(2,10)}`}function n(e,n=`text`){return{id:t(`field`),name:e,type:n,description:``,required:!1,hidden:!1,options:n===`choice`?[`Yes`,`No`]:void 0}}function r(n,r={}){let i=new Date().toISOString(),a=Object.fromEntries(n.map((t,n)=>t.type===`createdAt`||t.type===`updatedAt`?[t.id,r[t.id]??i]:t.type===`autoNumber`?[t.id,r[t.id]??n+1]:[t.id,r[t.id]??e[t.type]]));return{id:t(`record`),createdAt:i,updatedAt:i,values:a}}function i(e,i){let a=i.map(e=>n(e));return{id:t(`table`),name:e,fields:a,records:[r(a)]}}function a(e=`Animal Research Database`){let n=new Date().toISOString(),a=i(`Animals`,[`Animal`,`Habitat`,`Diet`,`Interesting Fact`]);return a.records=[r(a.fields,{[a.fields[0].id]:`Axolotl`,[a.fields[1].id]:`Freshwater lakes`,[a.fields[2].id]:`Worms and insects`,[a.fields[3].id]:`It can regrow some body parts.`}),r(a.fields,{[a.fields[0].id]:`Red panda`,[a.fields[1].id]:`Mountain forests`,[a.fields[2].id]:`Bamboo and fruit`,[a.fields[3].id]:`It uses its tail like a blanket.`})],{app:`ListSplatTM`,version:1,createdAt:n,updatedAt:n,metadata:{title:e,author:``,className:``},schema:{tables:[a],relationships:[]},layouts:[{id:t(`layout`),name:`Table View`,tableId:a.id,mode:`table`,locked:!1},{id:t(`layout`),name:`Record Form`,tableId:a.id,mode:`form`,locked:!1},{id:t(`layout`),name:`Research Cards`,tableId:a.id,mode:`cards`,locked:!1}],teacher:{studentView:!1,notes:[`Ask students to add source notes before printing a report.`],rubric:[]}}}function o(t,r,i=`text`){let a=n(r.trim()||`New Field`,i);return{...t,fields:[...t.fields,a],records:t.records.map(t=>({...t,updatedAt:new Date().toISOString(),values:{...t.values,[a.id]:e[i]}}))}}function s(e){return{...e,records:[...e.records,r(e.fields)]}}function c(e,t,n){return{...e,fields:e.fields.map(e=>e.id===t?{...e,...n}:e)}}function ee(e,t){let n=e.records.find(e=>e.id===t);return n?{...e,records:[...e.records,r(e.fields,n.values)]}:e}function te(e,t){return e.records.length<=1?e:{...e,records:e.records.filter(e=>e.id!==t)}}function l(e,t,n,r){let i=new Date().toISOString();return{...e,records:e.records.map(a=>a.id===t?{...a,updatedAt:i,values:Object.fromEntries(e.fields.map(e=>e.id===n?[e.id,r]:e.type===`updatedAt`?[e.id,i]:[e.id,a.values[e.id]]))}:a)}}function u(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t.id?t:e)}}}function ne(e,n){let r=i(n.trim()||`New Table`,[`Name`,`Notes`]);return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:[...e.schema.tables,r]},layouts:[...e.layouts,{id:t(`layout`),name:`${r.name} Table`,tableId:r.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${r.name} Form`,tableId:r.id,mode:`form`,locked:!1}]}}function d(e){if(!e||typeof e!=`object`)throw Error(`This is not a ListSplatTM project file.`);let t=e;if(t.app!==`ListSplatTM`||t.version!==1||!t.schema?.tables)throw Error(`This file is not a supported .listsplat.json project.`)}function re(e){let t=[],n=``,r=[],i=!1;for(let a=0;a<e.length;a+=1){let o=e[a],s=e[a+1];i&&o===`"`&&s===`"`?(n+=`"`,a+=1):o===`"`?i=!i:!i&&o===`,`?(r.push(n),n=``):!i&&(o===`
`||o===`\r`)?(o===`\r`&&s===`
`&&(a+=1),r.push(n),r.some(e=>e.length>0)&&t.push(r),r=[],n=``):n+=o}return r.push(n),r.some(e=>e.length>0)&&t.push(r),t}function ie(e,t){let i=re(t),a=(i[0]?.map((e,t)=>e.trim()||`Field ${t+1}`)??[`Field 1`]).map(e=>n(e)),o=i.slice(1).map(e=>r(a,Object.fromEntries(a.map((t,n)=>[t.id,e[n]??``]))));return{id:`table_${Date.now().toString(36)}`,name:e,fields:a,records:o.length>0?o:[r(a)]}}function ae(e){let t=e==null?``:String(e);return/[",\n\r]/.test(t)?`"${t.replaceAll(`"`,`""`)}"`:t}function oe(e){return[e.fields.map(e=>ae(e.name)).join(`,`),...e.records.map(t=>e.fields.map(e=>ae(t.values[e.id])).join(`,`))].join(`
`)}var se=`listsplat.autosave.v1`;function f(e){localStorage.setItem(se,JSON.stringify(e))}function ce(){let e=localStorage.getItem(se);if(!e)return null;let t=JSON.parse(e);return d(t),t}function p(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,a.click(),URL.revokeObjectURL(i)}function le(e,t){return e.records.map(e=>Number(e.values[t])).filter(e=>Number.isFinite(e))}function ue(e){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)).map(t=>{let n=le(e,t.id),r=n.reduce((e,t)=>e+t,0);return{fieldId:t.id,fieldName:t.name,count:n.length,sum:r,average:n.length?r/n.length:0,minimum:n.length?Math.min(...n):0,maximum:n.length?Math.max(...n):0}})}function de(e,t,n){let r=e.trim(),i=r.match(/^FIELD\(([^)]+)\)$/i);if(i){let e=i[1].trim().toLowerCase(),r=t.fields.find(t=>t.name.toLowerCase()===e);return r?String(n.values[r.id]??``):``}let a=r.match(/^JOIN\((.+)\)$/i);return a?a[1].split(`,`).map(e=>{let r=e.trim();if(r.startsWith(`"`)&&r.endsWith(`"`))return r.slice(1,-1);let i=t.fields.find(e=>e.name.toLowerCase()===r.toLowerCase());return i?String(n.values[i.id]??``):r}).join(``):``}function m(e){return e==null?``:String(e)}function fe(e,t){let n=t.query.trim();if(!n)return e.records;let r=n.toLowerCase();return e.records.filter(n=>(t.fieldId===`all`?e.fields.map(e=>e.id):[t.fieldId]).some(e=>m(n.values[e]).toLowerCase().includes(r)))}function pe(e,t,n){let r=n===`asc`?1:-1;return{...e,records:[...e.records].sort((e,n)=>{let i=m(e.values[t]),a=m(n.values[t]),o=Number(i),s=Number(a);return!Number.isNaN(o)&&!Number.isNaN(s)?(o-s)*r:i.localeCompare(a,void 0,{numeric:!0,sensitivity:`base`})*r})}}function me(e,t){let n=new Map;return e.records.forEach(e=>{let r=m(e.values[t]).trim().toLowerCase();r&&n.set(r,(n.get(r)??0)+1)}),e.records.filter(e=>{let r=m(e.values[t]).trim().toLowerCase();return r?(n.get(r)??0)>1:!1})}function he(e,t){return e.records.filter(e=>!m(e.values[t]).trim())}function ge(e,t){if(!t.find)return[];let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=[];return e.records.forEach(e=>{o.has(e.id)&&t.fieldIds.forEach(n=>{let r=m(e.values[n]),i=r.replace(a,t.replacement);i!==r&&s.push({recordId:e.id,fieldId:n,before:r,after:i})})}),s}function _e(e,t){if(!t.find)return{table:e,count:0};let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=0,c=e.records.map(e=>{if(!o.has(e.id))return e;let n=!1,r={...e.values};return t.fieldIds.forEach(e=>{let i=m(r[e]),o=i.replace(a,()=>(s+=1,t.replacement));o!==i&&(n=!0,r[e]=o)}),n?{...e,updatedAt:new Date().toISOString(),values:r}:e});return{table:{...e,records:c},count:s}}function ve(e){return e==null?``:String(e).trim().toLowerCase()}function ye(e,n,r,i,a){return{id:t(`relationship`),name:e.trim()||`New Relationship`,fromTableId:n,fromFieldId:r,toTableId:i,toFieldId:a}}function be(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,relationships:[...e.schema.relationships,t]}}}function xe(e,t,n,r){let i=ve(n.values[e.fromFieldId]);return!i||t.id!==e.fromTableId||r.id!==e.toTableId?[]:r.records.filter(t=>ve(t.values[e.toFieldId])===i)}function h(e,t){let n=e.schema.tables.find(e=>e.id===t.fromTableId),r=e.schema.tables.find(e=>e.id===t.toTableId),i=n?.fields.find(e=>e.id===t.fromFieldId),a=r?.fields.find(e=>e.id===t.toFieldId);return`${n?.name??`Table`}:${i?.name??`Field`} -> ${r?.name??`Table`}:${a?.name??`Field`}`}function g(e,t,n,r,i,a){return{id:e,title:t,gradeBand:n,goal:r,table:ie(t,i),reflectionQuestions:a}}var Se=[g(`classroom-library`,`Classroom Library Catalog`,`Grades 3-8`,`Track books, genres, reading levels, and recommendations.`,`Title,Author,Genre,Pages,Who would enjoy it?
Charlotte's Web,E. B. White,Fiction,192,Readers who like animals
Hidden Figures,Margot Lee Shetterly,Biography,240,Readers who like history`,[`Which genre appears most often?`,`What book would you recommend first?`]),g(`science-observations`,`Science Observation Log`,`Grades 3-8`,`Collect observations over time and look for patterns.`,`Date,Object observed,Location,Measurement,Observation
2026-06-29,Bean plant,Window,8 cm,Two new leaves
2026-06-30,Bean plant,Window,8.5 cm,Stem leaned toward light`,[`What changed over time?`,`What might explain the pattern?`]),g(`state-facts`,`State Facts Database`,`Grades 4-8`,`Compare places using consistent fields.`,`State,Capital,Region,Population note,Interesting fact
Texas,Austin,South,Large population,Has many different ecosystems
New Mexico,Santa Fe,Southwest,Medium population,Capital is over 400 years old`,[`Which fields help compare states?`,`What new field would improve this database?`]),g(`book-reviews`,`Book Review Collection`,`Grades 3-8`,`Collect opinions and evidence from student reading.`,`Book,Reviewer,Rating,Favorite part,Would recommend?
Because of Winn-Dixie,Jordan,5,The friendship story,Yes
Wonder,Avery,4,The different points of view,Yes`,[`Which book has the strongest recommendation?`,`What evidence supports each rating?`]),g(`vocabulary-bank`,`Vocabulary Word Bank`,`Grades 2-8`,`Build a searchable word list with definitions and examples.`,`Word,Definition,Example sentence,Subject
evaporate,To change from liquid to gas,Water can evaporate in sunlight,Science
compare,To tell how things are alike,Compare two characters,Reading`,[`Which words belong to more than one subject?`,`Which examples help you remember the word?`]),g(`survey-results`,`Simple Survey Results`,`Grades 3-8`,`Organize survey answers and look for patterns.`,`Question,Answer,Student group,Count,Notes
Favorite recess activity,Soccer,Grade 4,12,Most common outdoor choice
Favorite recess activity,Drawing,Grade 4,6,Quiet activity choice`,[`Which answer appears most often?`,`What new question should the class ask next?`]),g(`museum-cards`,`Museum Exhibit Cards`,`Grades 4-8`,`Create printable exhibit cards for objects, images, or research topics.`,`Item,Creator or source,Year,Category,Why it matters
Printing press,Johannes Gutenberg,1440,Invention,Changed how books were made
Apollo 11 mission,NASA,1969,Space exploration,First humans walked on the Moon`,[`How should the exhibit be grouped?`,`What field would help visitors understand the item?`])];function Ce(e){let t=e.table.fields.map(e=>({...e,id:`${e.id}_${Date.now().toString(36)}`})),n=e.table.records.map(n=>r(t,Object.fromEntries(e.table.fields.map((e,r)=>[t[r].id,n.values[e.id]??``]))));return{...e.table,id:`table_${e.id}_${Date.now().toString(36)}`,fields:t,records:n}}var we=`drawsplat.language`,_=[{code:`en`,label:`English`,dir:`ltr`,htmlLang:`en`},{code:`es`,label:`Español`,dir:`ltr`,htmlLang:`es`},{code:`vi`,label:`Tiếng Việt`,dir:`ltr`,htmlLang:`vi`},{code:`ar`,label:`العربية`,dir:`rtl`,htmlLang:`ar`},{code:`zh`,label:`中文`,dir:`ltr`,htmlLang:`zh`},{code:`uh`,label:`हिन्दी / اردو`,dir:`ltr`,htmlLang:`hi`}],Te={es:{New:`Nuevo`,"Save JSON":`Guardar JSON`,"Open JSON":`Abrir JSON`,"Export CSV":`Exportar CSV`,File:`Archivo`,Edit:`Editar`,Data:`Datos`,Layout:`Diseño`,Tools:`Herramientas`,View:`Vista`,Teacher:`Docente`,Help:`Ayuda`,Title:`Título`,Search:`Buscar`,In:`En`,"All fields":`Todos los campos`,Sort:`Ordenar`,"Choose field":`Elegir campo`,"New field":`Campo nuevo`,"Field name":`Nombre del campo`,Type:`Tipo`,"Add field":`Agregar campo`,"Add record":`Agregar registro`,Table:`Tabla`,Form:`Formulario`,Cards:`Tarjetas`,Gallery:`Galería`,Labels:`Etiquetas`,Report:`Informe`,"Upload image":`Subir imagen`,"No image yet":`Sin imagen todavía`},vi:{New:`Mới`,"Save JSON":`Lưu JSON`,"Open JSON":`Mở JSON`,"Export CSV":`Xuất CSV`,File:`Tệp`,Edit:`Sửa`,Data:`Dữ liệu`,Layout:`Bố cục`,Tools:`Công cụ`,View:`Xem`,Teacher:`Giáo viên`,Help:`Trợ giúp`,Title:`Tiêu đề`,Search:`Tìm`,Sort:`Sắp xếp`,Table:`Bảng`,Form:`Biểu mẫu`,Cards:`Thẻ`,Gallery:`Thư viện ảnh`,Labels:`Nhãn`,Report:`Báo cáo`},ar:{New:`جديد`,"Save JSON":`حفظ JSON`,"Open JSON":`فتح JSON`,"Export CSV":`تصدير CSV`,File:`ملف`,Edit:`تحرير`,Data:`بيانات`,Layout:`تخطيط`,Tools:`أدوات`,View:`عرض`,Teacher:`المعلم`,Help:`مساعدة`,Title:`العنوان`,Search:`بحث`,Sort:`فرز`,Table:`جدول`,Form:`نموذج`,Cards:`بطاقات`,Gallery:`معرض`,Labels:`ملصقات`,Report:`تقرير`},zh:{New:`新建`,"Save JSON":`保存 JSON`,"Open JSON":`打开 JSON`,"Export CSV":`导出 CSV`,File:`文件`,Edit:`编辑`,Data:`数据`,Layout:`布局`,Tools:`工具`,View:`视图`,Teacher:`教师`,Help:`帮助`,Title:`标题`,Search:`搜索`,Sort:`排序`,Table:`表格`,Form:`表单`,Cards:`卡片`,Gallery:`图库`,Labels:`标签`,Report:`报告`},uh:{New:`नया`,File:`फ़ाइल`,Edit:`संपादन`,Data:`डेटा`,Layout:`लेआउट`,Tools:`औज़ार`,View:`दृश्य`,Teacher:`शिक्षक`,Help:`सहायता`,Search:`खोज`,Table:`तालिका`,Form:`फ़ॉर्म`,Cards:`कार्ड`,Gallery:`गैलरी`,Labels:`लेबल`,Report:`रिपोर्ट`}},v=document.querySelector(`#app`);if(!v)throw Error(`ListSplatTM app root was not found.`);var y=v,b=ce()??a(),x=b.schema.tables[0].id,S=b.schema.tables[0].records[0]?.id??``,C=`table`,w=`Saved locally`,T=``,E=`all`,D=``,O=`asc`,k=new Set,A=`none`,j=``,M=`Tip: Start with one table, then add relationships when your project needs them.`,N=[],P=[],F=x,I=b.schema.tables[1]?.id??x,L=null,R=``,z=Ee();function B(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function V(e){let t=(e||``).toLowerCase();return t.startsWith(`es`)?`es`:t.startsWith(`vi`)?`vi`:t.startsWith(`ar`)?`ar`:t.startsWith(`zh`)?`zh`:t===`uh`||t.startsWith(`ur`)||t.startsWith(`hi`)?`uh`:`en`}function Ee(){let e=new URLSearchParams(window.location.search);try{return V(e.get(`lang`)||localStorage.getItem(we)||navigator.language)}catch{return V(e.get(`lang`)||navigator.language)}}function De(e){return _.map(({code:t,label:n})=>`<option value="${t}"${t===e?` selected`:``}>${n}</option>`).join(``)}function H(e){return z===`en`?e:Te[z][e]??e}function Oe(){let e=_.find(e=>e.code===z)??_[0];document.documentElement.lang=e.htmlLang,document.documentElement.dir=e.dir}function U(){return b.schema.tables.find(e=>e.id===x)??b.schema.tables[0]}function W(e){let t=fe(e,{query:T,fieldId:E});return k.size>0?t.filter(e=>k.has(e.id)):t}function G(e){e.records.some(e=>e.id===S)||(S=e.records[0]?.id??``)}function K(e){b=e,G(U()),f(b),w=`Saved locally`,$()}function q(e){N=[{label:e,project:structuredClone(b)},...N].slice(0,12)}function ke(){let e=N[0];if(!e){M=`Nothing to undo yet.`,$();return}N=N.slice(1),b=e.project,x=b.schema.tables.some(e=>e.id===x)?x:b.schema.tables[0].id,G(U()),f(b),M=`Undid ${e.label}.`,$()}function J(e){x=e.id,K(u(b,e))}function Ae(){document.querySelectorAll(`.menu[open]`).forEach(e=>{e.open=!1})}function je(e){K({...b,updatedAt:new Date().toISOString(),metadata:{...b.metadata,title:e||`Untitled Database`}})}function Me(){p(`${b.metadata.title||`listsplat-project`}.listsplat.json`,JSON.stringify(b,null,2),`application/json`)}function Ne(){p(`${U().name}.csv`,oe(U()),`text/csv;charset=utf-8`)}function Pe(){let e=U(),t=W(e),n=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${B(b.metadata.title)}</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{color:#5b21b6}</style></head>
<body><h1>${B(b.metadata.title)}</h1><p>${B(e.name)} report from ListSplatTM.</p>
<table><thead><tr>${e.fields.map(e=>`<th>${B(e.name)}</th>`).join(``)}</tr></thead>
<tbody>${t.map(t=>`<tr>${e.fields.map(n=>`<td>${B(X(e,t,n.id))}</td>`).join(``)}</tr>`).join(``)}</tbody></table></body></html>`;p(`${b.metadata.title||`listsplat-report`}.html`,n,`text/html;charset=utf-8`)}function Fe(e){e.text().then(e=>{let t=JSON.parse(e);d(t),x=t.schema.tables[0].id,S=t.schema.tables[0].records[0]?.id??``,K(t)}).catch(e=>{window.alert(e instanceof Error?e.message:`Could not open this ListSplatTM file.`)})}function Ie(e){e.text().then(t=>{let n=ie(e.name.replace(/\.csv$/i,``),t);L=n,R=e.name,A=`csvImport`,M=`Previewing ${n.records.length} CSV record${n.records.length===1?``:`s`} from ${e.name}.`,$()})}function Le(e){if(!L){A=`none`;return}if(q(`CSV import`),e===`new`){let e=L;x=e.id,S=e.records[0]?.id??``,L=null,A=`none`,M=`Imported ${e.records.length} records from ${R}.`,K({...b,updatedAt:new Date().toISOString(),schema:{...b.schema,tables:[...b.schema.tables,e]},layouts:[...b.layouts,{id:`layout_${Date.now().toString(36)}`,name:`${e.name} Table`,tableId:e.id,mode:`table`,locked:!1}]});return}let t=U(),n=new Map(L.fields.map(e=>[e.name.trim().toLowerCase(),e.id])),i=L.records.map(e=>r(t.fields,Object.fromEntries(t.fields.map(t=>{let r=n.get(t.name.trim().toLowerCase());return[t.id,r?e.values[r]??``:``]}))));L=null,A=`none`,M=`Appended ${i.length} CSV record${i.length===1?``:`s`} to ${t.name}.`,J({...t,records:[...t.records,...i]})}function Re(e){let t=Se.find(t=>t.id===e);if(!t)return;let n=Ce(t);q(`template load`),x=n.id,S=n.records[0]?.id??``,M=`Loaded ${t.title}.`,K({...b,metadata:{...b.metadata,title:t.title},schema:{...b.schema,tables:[...b.schema.tables,n]},teacher:{...b.teacher,notes:t.reflectionQuestions}})}function Y(e,t){return`
    <details class="menu">
      <summary>${B(H(e))}</summary>
      <div class="menu-panel">
        ${t.map(([e,t])=>`<button type="button" data-action="${e}">${B(H(t))}</button>`).join(``)}
      </div>
    </details>
  `}function ze(e=`text`){return[[`text`,`Short text`],[`longText`,`Long text`],[`number`,`Number`],[`currency`,`Currency`],[`percent`,`Percent`],[`date`,`Date`],[`checkbox`,`Checkbox`],[`rating`,`Rating`],[`choice`,`Choice`],[`image`,`Image`],[`link`,`Link`],[`calculation`,`Calculation`],[`autoNumber`,`Auto number`],[`createdAt`,`Created time`],[`updatedAt`,`Updated time`]].map(([t,n])=>`<option value="${t}" ${e===t?`selected`:``}>${n}</option>`).join(``)}function X(e,t,n){let r=e.fields.find(e=>e.id===n);return r?.type===`calculation`&&r.formula?de(r.formula,e,t):t.values[n]??``}function Z(){return b.layouts.find(e=>e.tableId===x&&e.mode===C)}function Be(e){return!!e}function Q(e){let t=Z()?.fieldOrder??e.fields.map(e=>e.id),n=new Map(e.fields.map(e=>[e.id,e]));return[...t.map(e=>n.get(e)).filter(Be),...e.fields.filter(e=>!t.includes(e.id))].filter(e=>e&&!e.hidden)}function Ve(e){return Q(e).filter(e=>e.type===`image`)}function He(e,t){let n=Ve(e)[0];return n?String(X(e,t,n.id)??``):``}function Ue(e){let t=Z();t&&K({...b,updatedAt:new Date().toISOString(),layouts:b.layouts.map(n=>n.id===t.id?{...n,...e}:n)})}function We(e,t){let n=e.fields.find(e=>!e.hidden)??e.fields[0],r=n?X(e,t,n.id):``;return String(r||`Untitled record`)}function Ge(e,t,n,r){let i=e.fields.find(e=>e.id===n),a=X(e,t,n),o=`aria-label="${B(i?.name??`Field`)}, record ${r+1}" data-record-id="${t.id}" data-field-id="${n}"`;if(i?.type===`checkbox`)return`<input class="cell-checkbox" type="checkbox" ${o} ${a===!0||a===`true`?`checked`:``}>`;if(i?.type===`image`){let e=String(a??``);return`
      <div class="image-cell" tabindex="0" role="button" title="Click here and paste an image, or use Upload image." ${o}>
        ${e?`<img src="${B(e)}" alt="">`:`<span>${B(H(`No image yet`))}</span>`}
        <small>Paste an image here or upload one.</small>
        <label class="image-upload-label">
          ${B(H(`Upload image`))}
          <input class="image-input" type="file" accept="image/*" ${o}>
        </label>
      </div>
    `}return i?.type===`rating`?`<input class="cell-input" type="number" min="0" max="5" step="1" ${o} value="${B(a)}">`:i?.type===`choice`?`<select class="cell-input" ${o}>${(i.options?.length?i.options:[`Yes`,`No`]).map(e=>`<option value="${B(e)}" ${String(a)===e?`selected`:``}>${B(e)}</option>`).join(``)}</select>`:i?.type===`autoNumber`||i?.type===`createdAt`||i?.type===`updatedAt`?`<output class="calc-output">${B(a)}</output>`:i?.type===`longText`?`<textarea class="cell-input" ${o}>${B(a)}</textarea>`:i?.type===`date`?`<input class="cell-input" type="date" ${o} value="${B(a)}">`:i?.type===`number`||i?.type===`currency`||i?.type===`percent`?`<input class="cell-input" type="number" step="any" ${o} value="${B(a)}">`:i?.type===`calculation`?`<output class="calc-output">${B(a)}</output>`:`<input class="cell-input" ${o} value="${B(a)}">`}function Ke(e){return`
    <div class="table-tabs">
      ${b.schema.tables.map(t=>`<button type="button" class="table-tab ${t.id===e.id?`active`:``}" data-table-id="${t.id}">${B(t.name)}</button>`).join(``)}
    </div>
  `}function qe(e,t){return`
    <div class="data-grid-wrap">
      <table class="data-grid">
        <thead>
          <tr>
            <th>#</th>
            ${Q(e).map(e=>`
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
                <tr class="${t.id===S?`active-row`:``}" data-record-row="${t.id}">
                  <td><button type="button" class="row-button" data-select-record="${t.id}">${n+1}</button></td>
                  ${Q(e).map(r=>`<td>${Ge(e,t,r.id,n)}</td>`).join(``)}
                  <td class="record-actions">
                    <button type="button" data-action="duplicate-record" data-record-action-id="${t.id}">Copy</button>
                    <button type="button" data-action="delete-record" data-record-action-id="${t.id}">Delete</button>
                  </td>
                </tr>
              `).join(``)}
        </tbody>
      </table>
    </div>
  `}function Je(e){let t=e.records.find(e=>e.id===S)??e.records[0];if(!t)return`<div class="empty-panel">Add a record to use form view.</div>`;let n=b.schema.relationships.filter(t=>t.fromTableId===e.id).map(n=>{let r=b.schema.tables.find(e=>e.id===n.toTableId),i=r?xe(n,e,t,r):[];return`
        <section class="related-records">
          <h3>${B(n.name)}</h3>
          <p>${i.length} related record${i.length===1?``:`s`} from ${B(r?.name??`another table`)}</p>
          ${i.length?`<div class="related-grid">${i.slice(0,6).map(e=>`
                      <article>
                        <strong>${B(We(r,e))}</strong>
                        ${r.fields.filter(e=>!e.hidden).slice(0,3).map(t=>`<span>${B(t.name)}: ${B(X(r,e,t.id))}</span>`).join(``)}
                      </article>
                    `).join(``)}</div>`:`<p>No matches yet. Make sure the match fields use the same value.</p>`}
        </section>
      `}).join(``);return`
    <div class="form-view">
      <div class="form-nav">
        ${e.records.map((e,n)=>`<button type="button" class="${e.id===t.id?`active`:``}" data-select-record="${e.id}">Record ${n+1}</button>`).join(``)}
      </div>
      <div class="record-form">
        ${Q(e).map((n,r)=>`
              <label>
                <span>${B(n.name)}</span>
                ${Ge(e,t,n.id,r)}
                ${n.description?`<small>${B(n.description)}</small>`:``}
              </label>
            `).join(``)}
        ${n}
      </div>
    </div>
  `}function Ye(e,t){let n=(t,n)=>{let r=X(e,n,t.id);if(t.type===`image`){let e=String(r??``);return`
        <figure class="card-image-field">
          ${e?`<img src="${B(e)}" alt="">`:`<span>No image yet</span>`}
          <figcaption>${B(t.name)}</figcaption>
        </figure>
      `}return`<p><strong>${B(t.name)}</strong><span>${B(r)}</span></p>`};return`
    <div class="cards-view ${C===`gallery`?`gallery-view`:``}">
      ${t.map(t=>{let r=He(e,t);return`
            <article class="record-card" data-select-record="${t.id}">
              ${C===`gallery`?`<div class="gallery-image">${r?`<img src="${B(r)}" alt="">`:`<span>Add an image field, then upload a picture.</span>`}</div>`:``}
              ${Q(e).filter(e=>C!==`gallery`||e.type!==`image`).slice(0,C===`gallery`?4:8).map(e=>n(e,t)).join(``)}
            </article>
          `}).join(``)}
    </div>
  `}function Xe(e,t){return`
    <div class="labels-view">
      ${t.map(t=>`
            <article class="print-label">
              ${Q(e).slice(0,4).map(n=>`<p><strong>${B(n.name)}:</strong> ${B(X(e,t,n.id))}</p>`).join(``)}
            </article>
          `).join(``)}
    </div>
  `}function Ze(e,t){let n=ue(e);return`
    <div class="report-view">
      <header>
        <h2>${B(b.metadata.title)}</h2>
        <p>${B(e.name)} report. ${t.length} record${t.length===1?``:`s`} shown.</p>
      </header>
      ${qe(e,t)}
      ${n.length?`<section class="summary-strip">${n.map(e=>`<div><strong>${B(e.fieldName)}</strong><span>Sum ${e.sum.toLocaleString()} | Avg ${e.average.toFixed(2)}</span></div>`).join(``)}</section>`:`<p class="empty-panel">Add a number, currency, or percent field to see summaries.</p>`}
    </div>
  `}function Qe(e){let t=W(e),n={table:`Table: spreadsheet-like rows and columns for fast data entry.`,form:`Form: focus on one record at a time.`,cards:`Cards: compact text-first record cards for browsing.`,gallery:`Gallery: image-first cards for collections and exhibits.`,labels:`Labels: printable small cards or shelf labels.`,report:`Report: printable table with title and summaries.`},r=C===`form`?Je(e):C===`cards`||C===`gallery`?Ye(e,t):C===`labels`?Xe(e,t):C===`report`?Ze(e,t):qe(e,t);return`
    <section class="database-panel" aria-label="Database table">
      ${Ke(e)}
      <div class="view-tabs" role="group" aria-label="Layout modes">
        ${[`table`,`form`,`cards`,`gallery`,`labels`,`report`].map(e=>`<button type="button" class="${C===e?`active`:``}" data-view-mode="${e}" title="${B(n[e])}" aria-label="${B(n[e])}">${B(H(e[0].toUpperCase()+e.slice(1)))}</button>`).join(``)}
      </div>
      ${r}
    </section>
  `}function $e(e){let t=ue(e),n=e.records.find(e=>e.id===S)??e.records[0],r=n?b.schema.relationships.filter(t=>t.fromTableId===e.id).map(t=>{let r=b.schema.tables.find(e=>e.id===t.toTableId),i=r?xe(t,e,n,r).length:0;return`
            <div class="template-card">
              <strong>${B(t.name)}</strong>
              <span>${i} related record${i===1?``:`s`}</span>
              <p>${B(h(b,t))}</p>
            </div>
          `}).join(``):``;return`
    <aside class="teacher-panel" aria-label="Teacher tools and database stats">
      <h2>Database Check</h2>
      <div class="stat-grid">
        <div class="stat-card"><strong>${W(e).length}</strong> shown</div>
        <div class="stat-card"><strong>${e.records.length}</strong> records</div>
        <div class="stat-card"><strong>${e.fields.length}</strong> fields</div>
        <div class="stat-card"><strong>${b.schema.tables.length}</strong> tables</div>
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
      ${Se.map(e=>`
            <div class="template-card">
              <strong>${B(e.title)}</strong>
              <span>${B(e.gradeBand)}</span>
              <p>${B(e.goal)}</p>
              <button type="button" data-template-id="${e.id}">Use template</button>
            </div>
          `).join(``)}
    </aside>
  `}function et(e){if(A===`none`)return``;if(A===`replace`){let t=P.slice(0,8);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Replace values">
          <h2>Replace values</h2>
          <label>Find <input data-replace-find placeholder="Text to find"></label>
          <label>Replace with <input data-replace-with placeholder="New text"></label>
          <label>Field <select data-replace-field>${e.fields.map(e=>`<option value="${e.id}">${B(e.name)}</option>`).join(``)}</select></label>
          <label class="check-row"><input type="checkbox" data-replace-case-sensitive> Case-sensitive</label>
          <label class="check-row"><input type="checkbox" data-replace-whole-word> Whole word only</label>
          <p>Replacement applies to the current found set when search is active. Preview first, then apply. The last replace can be undone from Edit.</p>
          ${P.length?`<div class="replace-preview"><strong>${P.length} change${P.length===1?``:`s`} ready</strong>${t.map(t=>{let n=e.records.find(e=>e.id===t.recordId),r=e.fields.find(e=>e.id===t.fieldId);return`<p><span>${B(n?We(e,n):`Record`)} / ${B(r?.name??`Field`)}</span><del>${B(t.before)}</del><ins>${B(t.after)}</ins></p>`}).join(``)}</div>`:``}
          <div class="modal-actions">
            <button type="button" data-action="preview-replace">Preview</button>
            <button type="button" data-action="run-replace" ${P.length?``:`disabled`}>Apply Replace</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(A===`field`){let t=e.fields.find(e=>e.id===j)??e.fields[0];return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Field settings">
          <h2>Field settings</h2>
          <label>Name <input data-field-name value="${B(t.name)}"></label>
          <label>Type <select data-field-type>${ze(t.type)}</select></label>
          <label>Description <textarea data-field-description>${B(t.description)}</textarea></label>
          <label>Choice options <input data-field-options value="${B(t.options?.join(`, `)??``)}" placeholder="Yes, No, Maybe"></label>
          <label class="check-row"><input type="checkbox" data-field-required ${t.required?`checked`:``}> Required field</label>
          <label class="check-row"><input type="checkbox" data-field-hidden ${t.hidden?`checked`:``}> Hide field</label>
          <label>Calculation formula <input data-field-formula value="${B(t.formula??``)}" placeholder='JOIN(First Name, " ", Last Name)'></label>
          <p>Supported starter formulas: <code>FIELD(Field Name)</code> and <code>JOIN(Field, " text ", Other Field)</code>.</p>
          <div class="modal-actions">
            <button type="button" data-action="save-field-settings">Save field</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(A===`layout`){let t=Z(),n=Q(e);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Layout designer">
          <h2>Layout designer</h2>
          <p>Arrange fields for the current ${B(C)} view. Locked layouts can still be viewed, but students should not change them.</p>
          <label class="check-row"><input type="checkbox" data-layout-locked ${t?.locked?`checked`:``}> Lock this layout</label>
          <div class="layout-field-list">
            ${n.map((e,t)=>`
                  <div class="layout-field-row">
                    <strong>${B(e.name)}</strong>
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
    `}if(A===`csvImport`&&L){let t=L.records.slice(0,5);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="CSV import preview">
          <h2>CSV import preview</h2>
          <p>${B(R)} has ${L.fields.length} field${L.fields.length===1?``:`s`} and ${L.records.length} record${L.records.length===1?``:`s`}.</p>
          <div class="preview-table-wrap">
            <table class="preview-table">
              <thead>
                <tr>${L.fields.map(e=>`<th>${B(e.name)}</th>`).join(``)}</tr>
              </thead>
              <tbody>
                ${t.map(e=>`<tr>${L.fields.map(t=>`<td>${B(e.values[t.id])}</td>`).join(``)}</tr>`).join(``)}
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
    `}if(A===`projectIdeas`)return`
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
    `;if(A===`relationship`){let t=b.schema.tables.find(e=>e.id===F)??e,n=b.schema.tables.find(e=>e.id===I)??e,r=t.fields.map(e=>`<option value="${t.id}:${e.id}">${B(e.name)}</option>`).join(``),i=n.fields.map(e=>`<option value="${n.id}:${e.id}">${B(e.name)}</option>`).join(``);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Relationships">
          <h2>Relationships</h2>
          <p>Create a simple one-to-many relationship by matching values in two fields, such as Books:Title to Reviews:Book.</p>
          <label>Name <input data-relationship-name placeholder="Books to reviews"></label>
          <label>Parent table <select data-relationship-from-table>${b.schema.tables.map(e=>`<option value="${e.id}" ${e.id===t.id?`selected`:``}>${B(e.name)}</option>`).join(``)}</select></label>
          <label>Parent match field <select data-relationship-from-field>${r}</select></label>
          <label>Related table <select data-relationship-to-table>${b.schema.tables.map(e=>`<option value="${e.id}" ${e.id===n.id?`selected`:``}>${B(e.name)}</option>`).join(``)}</select></label>
          <label>Related match field <select data-relationship-to-field>${i}</select></label>
          ${b.schema.relationships.length?`<div class="relationship-list">${b.schema.relationships.map(e=>`<p><strong>${B(e.name)}</strong><br>${B(h(b,e))}</p>`).join(``)}</div>`:`<p>No relationships yet. Add a second table first for the most useful results.</p>`}
          <div class="modal-actions">
            <button type="button" data-action="create-relationship">Create relationship</button>
            <button type="button" data-action="close-dialog">Close</button>
          </div>
        </section>
      </div>
    `}return`
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
  `}function $(){let e=U();G(e),Oe(),y.innerHTML=`
    <header class="app-header">
      <a class="brand" href="../../pages/splatworks.html" aria-label="SplatWorks home">
        <img class="brand-icon" src="listsplat_icon.svg" alt="">
        <span>
          <strong>ListSplat<sup>TM</sup></strong>
          <small>SplatWorks<sup>TM</sup> Database Studio</small>
        </span>
      </a>
      <div class="quick-actions">
        <button type="button" class="button primary" data-action="new">${B(H(`New`))}</button>
        <button type="button" class="button primary" data-action="save-json">${B(H(`Save JSON`))}</button>
        <button type="button" class="button primary" data-action="open-json">${B(H(`Open JSON`))}</button>
        <button type="button" class="button primary" data-action="export-csv">${B(H(`Export CSV`))}</button>
        <select id="languageSwitcher" class="lang-switcher" aria-label="Language">${De(z)}</select>
      </div>
    </header>
    <main class="listsplat-app">
      <nav class="menu-bar" aria-label="Application menu">
        ${Y(`File`,[[`new`,`New database`],[`save-json`,`Save .listsplat.json`],[`open-json`,`Open .listsplat.json`],[`import-csv`,`Import CSV`],[`export-csv`,`Export CSV`],[`export-report`,`Export report HTML`],[`print`,`Print`]])}
        ${Y(`Edit`,[[`undo-change`,`Undo last change`],[`add-record`,`Add record`],[`add-field`,`Add field`],[`find`,`Find records`],[`replace`,`Replace values`]])}
        ${Y(`Data`,[[`add-table`,`New table`],[`sort`,`Sort records`],[`missing`,`Find missing values`],[`duplicates`,`Find duplicates`],[`clear-find`,`Show all records`]])}
        ${Y(`Layout`,[[`layout-designer`,`Design current layout`],[`table-view`,`Table view`],[`form-view`,`Form view`],[`cards-view`,`Card view`],[`gallery-view`,`Gallery view`],[`labels-view`,`Label view`],[`report-view`,`Report view`]])}
        ${Y(`Tools`,[[`functions`,`Functions`],[`relationships`,`Relationships`],[`quality`,`Data quality check`]])}
        ${Y(`View`,[[`student-view`,`Student view`],[`teacher-notes`,`Teacher notes`]])}
        <span class="menu-spacer"></span>
        ${Y(`Teacher`,[[`templates`,`Template Library`],[`project-ideas`,`Project Ideas`],[`lock-layout`,`Lock Layout`],[`project-packet`,`Print Project Packet`]])}
        ${Y(`Help`,[[`help-start`,`Start a database`],[`help-csv`,`Import and export CSV`],[`help-layouts`,`Forms and reports`],[`help-privacy`,`Privacy and saving`]])}
      </nav>
      <section class="toolbar" aria-label="Database toolbar">
        <label>${B(H(`Title`))} <input data-project-title value="${B(b.metadata.title)}"></label>
        <label>${B(H(`Search`))} <input data-search value="${B(T)}" placeholder="${B(H(`Find records`))}"></label>
        <label>${B(H(`In`))} <select data-search-field><option value="all">${B(H(`All fields`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${E===e.id?`selected`:``}>${B(e.name)}</option>`).join(``)}</select></label>
        <label>${B(H(`Sort`))} <select data-sort-field><option value="">${B(H(`Choose field`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${D===e.id?`selected`:``}>${B(e.name)}</option>`).join(``)}</select></label>
        <button type="button" data-action="toggle-sort">${O===`asc`?`A-Z`:`Z-A`}</button>
        <label>${B(H(`New field`))} <input data-new-field placeholder="${B(H(`Field name`))}"></label>
        <label>${B(H(`Type`))} <select data-new-field-type>${ze()}</select></label>
        <button type="button" data-action="add-field">${B(H(`Add field`))}</button>
        <button type="button" data-action="add-record">${B(H(`Add record`))}</button>
      </section>
      <div class="workspace">
        ${Qe(e)}
        ${$e(e)}
      </div>
      <footer class="status-bar">
        <span>${B(e.name)}: ${W(e).length} shown of ${e.records.length} records, ${e.fields.length} fields</span>
        <span>${B(M)}</span>
        <span>${w}</span>
      </footer>
    </main>
    <input class="hidden-file" type="file" accept=".listsplat.json,application/json" data-open-json>
    <input class="hidden-file" type="file" accept=".csv,text/csv" data-import-csv>
    ${et(e)}
  `}function tt(e){return e instanceof HTMLInputElement&&e.type===`checkbox`?e.checked:e instanceof HTMLInputElement&&e.type===`number`?e.value===``?``:Number(e.value):e.value}function nt(e){let t=e.dataset.recordId,n=e.dataset.fieldId;!t||!n||(b=u(b,l(U(),t,n,tt(e))),f(b),w=`Saved locally`)}function rt(e,t,n,r){if(!n.type.startsWith(`image/`)){M=`That clipboard item is not an image.`,$();return}let i=new FileReader;i.addEventListener(`load`,()=>{q(r),b=u(b,l(U(),e,t,String(i.result??``))),f(b),M=`Image saved in this field.`,$()}),i.readAsDataURL(n)}function it(){let e=U(),t=e.fields.find(e=>e.id===j);if(!t)return;let n=y.querySelector(`[data-field-name]`)?.value??t.name,r=y.querySelector(`[data-field-type]`)?.value??t.type,i=y.querySelector(`[data-field-description]`)?.value??``,a=y.querySelector(`[data-field-required]`)?.checked??!1,o=y.querySelector(`[data-field-hidden]`)?.checked??!1,s=y.querySelector(`[data-field-formula]`)?.value??``,ee=(y.querySelector(`[data-field-options]`)?.value??``).split(`,`).map(e=>e.trim()).filter(Boolean);J(c(e,t.id,{name:n,type:r,description:i,required:a,hidden:o,formula:s,options:ee})),A=`none`,M=`Updated ${n}.`,$()}function at(){let e=y.querySelector(`[data-replace-find]`)?.value??``,t=y.querySelector(`[data-replace-with]`)?.value??``,n=y.querySelector(`[data-replace-field]`)?.value??U().fields[0]?.id,r=y.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=y.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=T?W(U()).map(e=>e.id):void 0;q(`replace`);let o=_e(U(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i});A=`none`,P=[],M=`Replaced ${o.count} value${o.count===1?``:`s`}.`,J(o.table)}function ot(){let e=y.querySelector(`[data-replace-find]`)?.value??``,t=y.querySelector(`[data-replace-with]`)?.value??``,n=y.querySelector(`[data-replace-field]`)?.value??U().fields[0]?.id,r=y.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=y.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=T?W(U()).map(e=>e.id):void 0;P=ge(U(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i}),M=`Preview found ${P.length} change${P.length===1?``:`s`}.`,$()}function st(e){let t=y.querySelector(e)?.value;if(!t)return null;let[n,r]=t.split(`:`);return n&&r?{tableId:n,fieldId:r}:null}function ct(){let e=y.querySelector(`[data-relationship-from-table]`)?.value??``,t=y.querySelector(`[data-relationship-to-table]`)?.value??``,n=st(`[data-relationship-from-field]`),r=st(`[data-relationship-to-field]`),i=y.querySelector(`[data-relationship-name]`)?.value??``;if(!e||!t||!n||!r){M=`Choose both tables and both match fields.`,$();return}if(n.tableId!==e||r.tableId!==t){M=`Match fields must belong to the tables you chose.`,$();return}q(`relationship create`);let a=ye(i,e,n.fieldId,t,r.fieldId);M=`Created relationship: ${a.name}.`,K(be(b,a))}function lt(){F=y.querySelector(`[data-relationship-from-table]`)?.value??F,I=y.querySelector(`[data-relationship-to-table]`)?.value??I,$()}y.addEventListener(`click`,e=>{let t=e.target,n=t.closest(`[data-action]`)?.dataset.action,r=t.closest(`[data-table-id]`)?.dataset.tableId,i=t.closest(`[data-template-id]`)?.dataset.templateId,c=t.closest(`[data-view-mode]`)?.dataset.viewMode,l=t.closest(`[data-select-record]`)?.dataset.selectRecord,u=t.closest(`[data-field-settings]`)?.dataset.fieldSettings,d=t.closest(`[data-record-action-id]`)?.dataset.recordActionId;if(r){x=r,k=new Set,G(U()),$();return}if(i){Re(i);return}if(c){C=c,$();return}if(l){S=l,C===`table`&&$();return}if(u){j=u,A=`field`,$();return}if(n)if(Ae(),n===`new`){q(`new database`);let e=a(`Untitled Database`);x=e.schema.tables[0].id,S=e.schema.tables[0].records[0]?.id??``,k=new Set,K(e)}else if(n===`save-json`)Me();else if(n===`open-json`)y.querySelector(`[data-open-json]`)?.click();else if(n===`import-csv`)y.querySelector(`[data-import-csv]`)?.click();else if(n===`export-csv`)Ne();else if(n===`export-report`||n===`project-packet`)Pe();else if(n===`print`)window.print();else if(n===`add-record`)q(`add record`),J(s(U()));else if(n===`add-field`){let e=y.querySelector(`[data-new-field]`),t=y.querySelector(`[data-new-field-type]`)?.value;q(`add field`),J(o(U(),e?.value||`New Field`,t??`text`))}else if(n===`add-table`){let e=window.prompt(`New table name?`,`New Table`)??``;q(`add table`);let t=ne(b,e);x=t.schema.tables.at(-1)?.id??x,S=U().records[0]?.id??``,K(t)}else if(n===`duplicate-record`&&d)q(`duplicate record`),J(ee(U(),d));else if(n===`delete-record`&&d)q(`delete record`),J(te(U(),d));else if(n===`toggle-sort`)O=O===`asc`?`desc`:`asc`,$();else if(n===`sort`)D&&J(pe(U(),D,O));else if(n===`duplicates`){let e=E===`all`?U().fields[0]?.id:E;k=new Set(me(U(),e).map(e=>e.id)),M=`Found ${k.size} duplicate record${k.size===1?``:`s`}.`,$()}else if(n===`missing`){let e=E===`all`?U().fields[0]?.id:E;k=new Set(he(U(),e).map(e=>e.id)),M=`Found ${k.size} record${k.size===1?``:`s`} with missing values.`,$()}else if(n===`clear-find`)T=``,k=new Set,M=`Showing all records.`,$();else if(n===`replace`)P=[],A=`replace`,$();else if(n===`preview-replace`)ot();else if(n===`run-replace`)at();else if(n===`apply-csv-new`)Le(`new`);else if(n===`apply-csv-append`)Le(`append`);else if(n===`save-field-settings`)q(`field settings`),it();else if(n===`layout-designer`||n===`lock-layout`)A=`layout`,$();else if(n===`layout-field-up`||n===`layout-field-down`){let e=t.closest(`[data-layout-field-id]`)?.dataset.layoutFieldId,r=Z();if(e&&r){let t=Q(U()).map(e=>e.id),r=t.indexOf(e),i=n===`layout-field-up`?r-1:r+1;r>=0&&i>=0&&i<t.length&&([t[r],t[i]]=[t[i],t[r]],q(`layout order`),Ue({fieldOrder:t}),A=`layout`)}}else if(n===`save-layout-settings`){let e=y.querySelector(`[data-layout-locked]`)?.checked??!1;q(`layout settings`),Ue({locked:e,fieldOrder:Q(U()).map(e=>e.id)}),A=`none`}else n===`create-relationship`?ct():n===`undo-change`?ke():n===`close-dialog`?(A=`none`,P=[],L=null,$()):n.endsWith(`-view`)?(C=n.replace(`-view`,``),$()):n===`templates`?(M=`Template starters are in the Teacher panel.`,$()):n===`project-ideas`?(A=`projectIdeas`,$()):n===`relationships`?(A=`relationship`,$()):n.startsWith(`help-`)||n===`functions`||n===`quality`?(A=`help`,$()):(M=`This ListSplatTM tool is planned for a later build.`,$())}),y.addEventListener(`change`,e=>{let t=e.target;if(t.matches(`#languageSwitcher`)&&t instanceof HTMLSelectElement){z=V(t.value);try{localStorage.setItem(we,z)}catch{}$()}else if(t.matches(`[data-open-json]`)&&t instanceof HTMLInputElement&&t.files?.[0])Fe(t.files[0]);else if(t.matches(`[data-import-csv]`)&&t instanceof HTMLInputElement&&t.files?.[0])Ie(t.files[0]);else if(t.matches(`[data-search-field]`))E=t.value,k=new Set,$();else if(t.matches(`[data-sort-field]`))D=t.value,D&&J(pe(U(),D,O));else if(t.matches(`[data-relationship-from-table], [data-relationship-to-table]`))lt();else if(t.matches(`.cell-input, .cell-checkbox, .image-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement))if(t instanceof HTMLInputElement&&t.type===`file`&&t.files?.[0]){let e=t.dataset.recordId,n=t.dataset.fieldId,r=t.files[0];e&&n&&rt(e,n,r,`image upload`)}else nt(t)}),y.addEventListener(`paste`,e=>{let t=e.target.closest(`.image-cell`);if(!t)return;let n=t.dataset.recordId,r=t.dataset.fieldId,i=Array.from(e.clipboardData?.items??[]).find(e=>e.type.startsWith(`image/`))?.getAsFile();n&&r&&i&&(e.preventDefault(),rt(n,r,i,`image paste`))}),y.addEventListener(`input`,e=>{let t=e.target;if(t.matches(`[data-project-title]`)){je(t.value);return}if(t.matches(`[data-search]`)){T=t.value,k=new Set,$();return}t.matches(`.cell-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)&&nt(t)}),document.addEventListener(`click`,e=>{e.target.closest(`.menu`)||Ae()}),document.addEventListener(`toggle`,e=>{let t=e.target;!(t instanceof HTMLDetailsElement)||!t.matches(`.menu`)||!t.open||document.querySelectorAll(`.menu[open]`).forEach(e=>{e!==t&&(e.open=!1)})},!0),$();