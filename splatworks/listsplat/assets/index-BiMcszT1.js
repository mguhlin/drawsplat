(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={text:``,longText:``,number:0,currency:0,percent:0,date:``,checkbox:!1,rating:0,choice:``,image:``,link:``,calculation:``,autoNumber:``,createdAt:``,updatedAt:``};function t(e){return`${e}_${Math.random().toString(36).slice(2,10)}`}function n(e,n=`text`){return{id:t(`field`),name:e,type:n,description:``,required:!1,hidden:!1,options:n===`choice`?[`Yes`,`No`]:void 0}}function r(n,r={}){let i=new Date().toISOString(),a=Object.fromEntries(n.map((t,n)=>t.type===`createdAt`||t.type===`updatedAt`?[t.id,r[t.id]??i]:t.type===`autoNumber`?[t.id,r[t.id]??n+1]:[t.id,r[t.id]??e[t.type]]));return{id:t(`record`),createdAt:i,updatedAt:i,values:a}}function i(e,i){let a=i.map(e=>n(e));return{id:t(`table`),name:e,fields:a,records:[r(a)]}}function a(e=`Animal Research Database`){let n=new Date().toISOString(),a=i(`Animals`,[`Animal`,`Habitat`,`Diet`,`Interesting Fact`]);return a.records=[r(a.fields,{[a.fields[0].id]:`Axolotl`,[a.fields[1].id]:`Freshwater lakes`,[a.fields[2].id]:`Worms and insects`,[a.fields[3].id]:`It can regrow some body parts.`}),r(a.fields,{[a.fields[0].id]:`Red panda`,[a.fields[1].id]:`Mountain forests`,[a.fields[2].id]:`Bamboo and fruit`,[a.fields[3].id]:`It uses its tail like a blanket.`})],{app:`ListSplatTM`,version:1,createdAt:n,updatedAt:n,metadata:{title:e,author:``,className:``},schema:{tables:[a],relationships:[]},layouts:[{id:t(`layout`),name:`Table View`,tableId:a.id,mode:`table`,locked:!1},{id:t(`layout`),name:`Record Form`,tableId:a.id,mode:`form`,locked:!1},{id:t(`layout`),name:`Research Cards`,tableId:a.id,mode:`cards`,locked:!1}],teacher:{studentView:!1,notes:[`Ask students to add source notes before printing a report.`],rubric:[]}}}function o(t,r,i=`text`){let a=n(r.trim()||`New Field`,i);return{...t,fields:[...t.fields,a],records:t.records.map(t=>({...t,updatedAt:new Date().toISOString(),values:{...t.values,[a.id]:e[i]}}))}}function s(e){return{...e,records:[...e.records,r(e.fields)]}}function c(e,t,n){return{...e,fields:e.fields.map(e=>e.id===t?{...e,...n}:e)}}function ee(e,t){let n=e.records.find(e=>e.id===t);return n?{...e,records:[...e.records,r(e.fields,n.values)]}:e}function te(e,t){return e.records.length<=1?e:{...e,records:e.records.filter(e=>e.id!==t)}}function l(e,t,n,r){let i=new Date().toISOString();return{...e,records:e.records.map(a=>a.id===t?{...a,updatedAt:i,values:Object.fromEntries(e.fields.map(e=>e.id===n?[e.id,r]:e.type===`updatedAt`?[e.id,i]:[e.id,a.values[e.id]]))}:a)}}function u(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t.id?t:e)}}}function ne(e,n){let r=i(n.trim()||`New Table`,[`Name`,`Notes`]);return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:[...e.schema.tables,r]},layouts:[...e.layouts,{id:t(`layout`),name:`${r.name} Table`,tableId:r.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${r.name} Form`,tableId:r.id,mode:`form`,locked:!1}]}}function d(e){if(!e||typeof e!=`object`)throw Error(`This is not a ListSplatTM project file.`);let t=e;if(t.app!==`ListSplatTM`||t.version!==1||!t.schema?.tables)throw Error(`This file is not a supported .listsplat.json project.`)}function f(e){let t=[],n=``,r=[],i=!1;for(let a=0;a<e.length;a+=1){let o=e[a],s=e[a+1];i&&o===`"`&&s===`"`?(n+=`"`,a+=1):o===`"`?i=!i:!i&&o===`,`?(r.push(n),n=``):!i&&(o===`
`||o===`\r`)?(o===`\r`&&s===`
`&&(a+=1),r.push(n),r.some(e=>e.length>0)&&t.push(r),r=[],n=``):n+=o}return r.push(n),r.some(e=>e.length>0)&&t.push(r),t}function re(e,t){let i=f(t),a=(i[0]?.map((e,t)=>e.trim()||`Field ${t+1}`)??[`Field 1`]).map(e=>n(e)),o=i.slice(1).map(e=>r(a,Object.fromEntries(a.map((t,n)=>[t.id,e[n]??``]))));return{id:`table_${Date.now().toString(36)}`,name:e,fields:a,records:o.length>0?o:[r(a)]}}function ie(e){let t=e==null?``:String(e);return/[",\n\r]/.test(t)?`"${t.replaceAll(`"`,`""`)}"`:t}function ae(e){return[e.fields.map(e=>ie(e.name)).join(`,`),...e.records.map(t=>e.fields.map(e=>ie(t.values[e.id])).join(`,`))].join(`
`)}var oe=`listsplat.autosave.v1`;function p(e){localStorage.setItem(oe,JSON.stringify(e))}function se(){let e=localStorage.getItem(oe);if(!e)return null;let t=JSON.parse(e);return d(t),t}function m(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,a.click(),URL.revokeObjectURL(i)}function ce(e){return e==null?``:String(e).trim().toLowerCase()}function le(e,n,r,i,a){return{id:t(`relationship`),name:e.trim()||`New Relationship`,fromTableId:n,fromFieldId:r,toTableId:i,toFieldId:a}}function ue(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,relationships:[...e.schema.relationships,t]}}}function h(e,t,n,r){let i=ce(n.values[e.fromFieldId]);return!i||t.id!==e.fromTableId||r.id!==e.toTableId?[]:r.records.filter(t=>ce(t.values[e.toFieldId])===i)}function de(e,t){let n=e.schema.tables.find(e=>e.id===t.fromTableId),r=e.schema.tables.find(e=>e.id===t.toTableId),i=n?.fields.find(e=>e.id===t.fromFieldId),a=r?.fields.find(e=>e.id===t.toFieldId);return`${n?.name??`Table`}:${i?.name??`Field`} -> ${r?.name??`Table`}:${a?.name??`Field`}`}function fe(e,t){return e.records.map(e=>Number(e.values[t])).filter(e=>Number.isFinite(e))}function pe(e){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)).map(t=>{let n=fe(e,t.id),r=n.reduce((e,t)=>e+t,0);return{fieldId:t.id,fieldName:t.name,count:n.length,sum:r,average:n.length?r/n.length:0,minimum:n.length?Math.min(...n):0,maximum:n.length?Math.max(...n):0}})}function me(e){let t=[],n=``,r=!1;for(let i=0;i<e.length;i+=1){let a=e[i],o=e[i-1];if(a===`"`&&o!==`\\`){r=!r,n+=a;continue}if(a===`,`&&!r){t.push(n.trim()),n=``;continue}n+=a}return(n.trim()||e.endsWith(`,`))&&t.push(n.trim()),t}function g(e){let t=e.trim();if(t.startsWith(`"`)&&t.endsWith(`"`))return t.slice(1,-1).replace(/\\"/g,`"`)}function he(e,t,n){let r=n.trim().toLowerCase(),i=e.fields.find(e=>e.name.toLowerCase()===r);return i?String(t.values[i.id]??``):``}function _(e,t,n){return g(n)??he(e,t,n)}function v(e,t,n){let r=Number(_(e,t,n));return Number.isFinite(r)?r:0}function ge(e,t){let n=t.trim().toLowerCase(),r=e.fields.find(e=>e.name.toLowerCase()===n);return r?fe(e,r.id):[]}function y(e){return Number.isFinite(e)?String(Number(e.toFixed(8))):`Formula error: not a number`}function _e(e){return e.toLowerCase().replace(/\b[a-z]/g,e=>e.toUpperCase())}function ve(e,t,n,r){if(!e)return[];let i=r.trim().toLowerCase(),a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===i),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0;return a&&o?h(a,t,n,o):[]}function ye(e,t,n,r,i){if(!e)return``;let a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===r.trim().toLowerCase()),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0,s=ve(e,t,n,r)[0],c=o?.fields.find(e=>e.name.toLowerCase()===i.trim().toLowerCase());return s&&c?String(s.values[c.id]??``):``}function be(e,t,n,r){let i=e.trim();if(!i)return``;let a=i.match(/^([A-Z_]+)\((.*)\)$/i);if(!a)return`Formula error: use a function like FIELD(Name)`;let o=a[1].toUpperCase(),s=me(a[2]),c=s[0]??``;if(o===`FIELD`)return he(t,n,c);if(o===`JOIN`)return s.map(e=>_(t,n,e)).join(``);if(o===`UPPER`)return _(t,n,c).toUpperCase();if(o===`LOWER`)return _(t,n,c).toLowerCase();if(o===`TITLECASE`)return _e(_(t,n,c));if(o===`TRIM`)return _(t,n,c).trim();if(o===`LENGTH`)return String(_(t,n,c).length);if(o===`CONTAINS`)return _(t,n,c).toLowerCase().includes(_(t,n,s[1]??``).toLowerCase())?`Yes`:`No`;if(o===`IF_EMPTY`)return _(t,n,c).trim()?_(t,n,c):_(t,n,s[1]??``);if(o===`LOOKUP`)return ye(r,t,n,g(c)??c,g(s[1]??``)??s[1]??``);if(o===`COUNT_RELATED`)return String(ve(r,t,n,g(c)??c).length);if(o===`ADD`)return y(s.reduce((e,r)=>e+v(t,n,r),0));if(o===`SUBTRACT`)return y(s.slice(1).reduce((e,r)=>e-v(t,n,r),v(t,n,c)));if(o===`MULTIPLY`)return y(s.reduce((e,r)=>e*v(t,n,r),1));if(o===`DIVIDE`){let e=v(t,n,s[1]??``);return e===0?`Formula error: divide by zero`:y(v(t,n,c)/e)}if(o===`ROUND`){let e=Math.max(0,Math.min(6,Math.round(v(t,n,s[1]??`"0"`))));return String(Number(v(t,n,c).toFixed(e)))}if([`SUM`,`AVERAGE`,`MIN`,`MAX`,`COUNT`].includes(o)){let e=ge(t,c);return o===`SUM`?y(e.reduce((e,t)=>e+t,0)):o===`AVERAGE`?y(e.length?e.reduce((e,t)=>e+t,0)/e.length:0):o===`MIN`?y(e.length?Math.min(...e):0):o===`MAX`?y(e.length?Math.max(...e):0):String(e.length)}return`Formula error: ${o} is not supported`}function b(e){return e==null?``:String(e)}function xe(e,t){let n=t.query.trim();if(!n)return e.records;let r=n.toLowerCase();return e.records.filter(n=>(t.fieldId===`all`?e.fields.map(e=>e.id):[t.fieldId]).some(e=>b(n.values[e]).toLowerCase().includes(r)))}function Se(e,t,n){let r=n===`asc`?1:-1;return{...e,records:[...e.records].sort((e,n)=>{let i=b(e.values[t]),a=b(n.values[t]),o=Number(i),s=Number(a);return!Number.isNaN(o)&&!Number.isNaN(s)?(o-s)*r:i.localeCompare(a,void 0,{numeric:!0,sensitivity:`base`})*r})}}function Ce(e,t){let n=new Map;return e.records.forEach(e=>{let r=b(e.values[t]).trim().toLowerCase();r&&n.set(r,(n.get(r)??0)+1)}),e.records.filter(e=>{let r=b(e.values[t]).trim().toLowerCase();return r?(n.get(r)??0)>1:!1})}function we(e,t){return e.records.filter(e=>!b(e.values[t]).trim())}function Te(e,t){if(!t.find)return[];let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=[];return e.records.forEach(e=>{o.has(e.id)&&t.fieldIds.forEach(n=>{let r=b(e.values[n]),i=r.replace(a,t.replacement);i!==r&&s.push({recordId:e.id,fieldId:n,before:r,after:i})})}),s}function Ee(e,t){if(!t.find)return{table:e,count:0};let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=0,c=e.records.map(e=>{if(!o.has(e.id))return e;let n=!1,r={...e.values};return t.fieldIds.forEach(e=>{let i=b(r[e]),o=i.replace(a,()=>(s+=1,t.replacement));o!==i&&(n=!0,r[e]=o)}),n?{...e,updatedAt:new Date().toISOString(),values:r}:e});return{table:{...e,records:c},count:s}}function x(e,t,n,r,i,a){return{id:e,title:t,gradeBand:n,goal:r,table:re(t,i),reflectionQuestions:a}}var De=[x(`classroom-library`,`Classroom Library Catalog`,`Grades 3-8`,`Track books, genres, reading levels, and recommendations.`,`Title,Author,Genre,Pages,Who would enjoy it?
Charlotte's Web,E. B. White,Fiction,192,Readers who like animals
Hidden Figures,Margot Lee Shetterly,Biography,240,Readers who like history`,[`Which genre appears most often?`,`What book would you recommend first?`]),x(`science-observations`,`Science Observation Log`,`Grades 3-8`,`Collect observations over time and look for patterns.`,`Date,Object observed,Location,Measurement,Observation
2026-06-29,Bean plant,Window,8 cm,Two new leaves
2026-06-30,Bean plant,Window,8.5 cm,Stem leaned toward light`,[`What changed over time?`,`What might explain the pattern?`]),x(`state-facts`,`State Facts Database`,`Grades 4-8`,`Compare places using consistent fields.`,`State,Capital,Region,Population note,Interesting fact
Texas,Austin,South,Large population,Has many different ecosystems
New Mexico,Santa Fe,Southwest,Medium population,Capital is over 400 years old`,[`Which fields help compare states?`,`What new field would improve this database?`]),x(`book-reviews`,`Book Review Collection`,`Grades 3-8`,`Collect opinions and evidence from student reading.`,`Book,Reviewer,Rating,Favorite part,Would recommend?
Because of Winn-Dixie,Jordan,5,The friendship story,Yes
Wonder,Avery,4,The different points of view,Yes`,[`Which book has the strongest recommendation?`,`What evidence supports each rating?`]),x(`vocabulary-bank`,`Vocabulary Word Bank`,`Grades 2-8`,`Build a searchable word list with definitions and examples.`,`Word,Definition,Example sentence,Subject
evaporate,To change from liquid to gas,Water can evaporate in sunlight,Science
compare,To tell how things are alike,Compare two characters,Reading`,[`Which words belong to more than one subject?`,`Which examples help you remember the word?`]),x(`survey-results`,`Simple Survey Results`,`Grades 3-8`,`Organize survey answers and look for patterns.`,`Question,Answer,Student group,Count,Notes
Favorite recess activity,Soccer,Grade 4,12,Most common outdoor choice
Favorite recess activity,Drawing,Grade 4,6,Quiet activity choice`,[`Which answer appears most often?`,`What new question should the class ask next?`]),x(`museum-cards`,`Museum Exhibit Cards`,`Grades 4-8`,`Create printable exhibit cards for objects, images, or research topics.`,`Item,Creator or source,Year,Category,Why it matters
Printing press,Johannes Gutenberg,1440,Invention,Changed how books were made
Apollo 11 mission,NASA,1969,Space exploration,First humans walked on the Moon`,[`How should the exhibit be grouped?`,`What field would help visitors understand the item?`])];function Oe(e){let t=e.table.fields.map(e=>({...e,id:`${e.id}_${Date.now().toString(36)}`})),n=e.table.records.map(n=>r(t,Object.fromEntries(e.table.fields.map((e,r)=>[t[r].id,n.values[e.id]??``]))));return{...e.table,id:`table_${e.id}_${Date.now().toString(36)}`,fields:t,records:n}}var ke=`drawsplat.language`,S=[{code:`en`,label:`English`,dir:`ltr`,htmlLang:`en`},{code:`es`,label:`Español`,dir:`ltr`,htmlLang:`es`},{code:`vi`,label:`Tiếng Việt`,dir:`ltr`,htmlLang:`vi`},{code:`ar`,label:`العربية`,dir:`rtl`,htmlLang:`ar`},{code:`zh`,label:`中文`,dir:`ltr`,htmlLang:`zh`},{code:`uh`,label:`हिन्दी / اردو`,dir:`ltr`,htmlLang:`hi`}],Ae={es:{New:`Nuevo`,"Save JSON":`Guardar JSON`,"Open JSON":`Abrir JSON`,"Export CSV":`Exportar CSV`,File:`Archivo`,Edit:`Editar`,Data:`Datos`,Layout:`Diseño`,Tools:`Herramientas`,View:`Vista`,Teacher:`Docente`,Help:`Ayuda`,Title:`Título`,Search:`Buscar`,In:`En`,"All fields":`Todos los campos`,Sort:`Ordenar`,"Choose field":`Elegir campo`,"New field":`Campo nuevo`,"Field name":`Nombre del campo`,Type:`Tipo`,"Add field":`Agregar campo`,"Add record":`Agregar registro`,Table:`Tabla`,Form:`Formulario`,Cards:`Tarjetas`,Gallery:`Galería`,Labels:`Etiquetas`,Report:`Informe`,"Upload image":`Subir imagen`,"No image yet":`Sin imagen todavía`},vi:{New:`Mới`,"Save JSON":`Lưu JSON`,"Open JSON":`Mở JSON`,"Export CSV":`Xuất CSV`,File:`Tệp`,Edit:`Sửa`,Data:`Dữ liệu`,Layout:`Bố cục`,Tools:`Công cụ`,View:`Xem`,Teacher:`Giáo viên`,Help:`Trợ giúp`,Title:`Tiêu đề`,Search:`Tìm`,Sort:`Sắp xếp`,Table:`Bảng`,Form:`Biểu mẫu`,Cards:`Thẻ`,Gallery:`Thư viện ảnh`,Labels:`Nhãn`,Report:`Báo cáo`},ar:{New:`جديد`,"Save JSON":`حفظ JSON`,"Open JSON":`فتح JSON`,"Export CSV":`تصدير CSV`,File:`ملف`,Edit:`تحرير`,Data:`بيانات`,Layout:`تخطيط`,Tools:`أدوات`,View:`عرض`,Teacher:`المعلم`,Help:`مساعدة`,Title:`العنوان`,Search:`بحث`,Sort:`فرز`,Table:`جدول`,Form:`نموذج`,Cards:`بطاقات`,Gallery:`معرض`,Labels:`ملصقات`,Report:`تقرير`},zh:{New:`新建`,"Save JSON":`保存 JSON`,"Open JSON":`打开 JSON`,"Export CSV":`导出 CSV`,File:`文件`,Edit:`编辑`,Data:`数据`,Layout:`布局`,Tools:`工具`,View:`视图`,Teacher:`教师`,Help:`帮助`,Title:`标题`,Search:`搜索`,Sort:`排序`,Table:`表格`,Form:`表单`,Cards:`卡片`,Gallery:`图库`,Labels:`标签`,Report:`报告`},uh:{New:`नया`,File:`फ़ाइल`,Edit:`संपादन`,Data:`डेटा`,Layout:`लेआउट`,Tools:`औज़ार`,View:`दृश्य`,Teacher:`शिक्षक`,Help:`सहायता`,Search:`खोज`,Table:`तालिका`,Form:`फ़ॉर्म`,Cards:`कार्ड`,Gallery:`गैलरी`,Labels:`लेबल`,Report:`रिपोर्ट`}},je=document.querySelector(`#app`);if(!je)throw Error(`ListSplatTM app root was not found.`);var C=je,w=se()??a(),T=w.schema.tables[0].id,E=w.schema.tables[0].records[0]?.id??``,D=`table`,O=`Saved locally`,k=``,A=`all`,j=``,M=`asc`,N=new Set,P=`none`,Me=``,F=`Tip: Start with one table, then add relationships when your project needs them.`,I=[],L=[],Ne=T,R=w.schema.tables[1]?.id??T,z=null,Pe=``,B=Ie();function V(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function Fe(e){let t=(e||``).toLowerCase();return t.startsWith(`es`)?`es`:t.startsWith(`vi`)?`vi`:t.startsWith(`ar`)?`ar`:t.startsWith(`zh`)?`zh`:t===`uh`||t.startsWith(`ur`)||t.startsWith(`hi`)?`uh`:`en`}function Ie(){let e=new URLSearchParams(window.location.search);try{return Fe(e.get(`lang`)||localStorage.getItem(ke)||navigator.language)}catch{return Fe(e.get(`lang`)||navigator.language)}}function Le(e){return S.map(({code:t,label:n})=>`<option value="${t}"${t===e?` selected`:``}>${n}</option>`).join(``)}function H(e){return B===`en`?e:Ae[B][e]??e}function Re(){let e=S.find(e=>e.code===B)??S[0];document.documentElement.lang=e.htmlLang,document.documentElement.dir=e.dir}function U(){return w.schema.tables.find(e=>e.id===T)??w.schema.tables[0]}function W(e){let t=xe(e,{query:k,fieldId:A});return N.size>0?t.filter(e=>N.has(e.id)):t}function G(e){e.records.some(e=>e.id===E)||(E=e.records[0]?.id??``)}function K(e){w=e,G(U()),p(w),O=`Saved locally`,$()}function q(e){I=[{label:e,project:structuredClone(w)},...I].slice(0,12)}function ze(){let e=I[0];if(!e){F=`Nothing to undo yet.`,$();return}I=I.slice(1),w=e.project,T=w.schema.tables.some(e=>e.id===T)?T:w.schema.tables[0].id,G(U()),p(w),F=`Undid ${e.label}.`,$()}function J(e){T=e.id,K(u(w,e))}function Be(){document.querySelectorAll(`.menu[open]`).forEach(e=>{e.open=!1})}function Ve(e){K({...w,updatedAt:new Date().toISOString(),metadata:{...w.metadata,title:e||`Untitled Database`}})}function He(){m(`${w.metadata.title||`listsplat-project`}.listsplat.json`,JSON.stringify(w,null,2),`application/json`)}function Ue(){m(`${U().name}.csv`,ae(U()),`text/csv;charset=utf-8`)}function We(){let e=U(),t=W(e),n=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${V(w.metadata.title)}</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{color:#5b21b6}</style></head>
<body><h1>${V(w.metadata.title)}</h1><p>${V(e.name)} report from ListSplatTM.</p>
<table><thead><tr>${e.fields.map(e=>`<th>${V(e.name)}</th>`).join(``)}</tr></thead>
<tbody>${t.map(t=>`<tr>${e.fields.map(n=>`<td>${V(X(e,t,n.id))}</td>`).join(``)}</tr>`).join(``)}</tbody></table></body></html>`;m(`${w.metadata.title||`listsplat-report`}.html`,n,`text/html;charset=utf-8`)}function Ge(e){e.text().then(e=>{let t=JSON.parse(e);d(t),T=t.schema.tables[0].id,E=t.schema.tables[0].records[0]?.id??``,K(t)}).catch(e=>{window.alert(e instanceof Error?e.message:`Could not open this ListSplatTM file.`)})}function Ke(e){e.text().then(t=>{let n=re(e.name.replace(/\.csv$/i,``),t);z=n,Pe=e.name,P=`csvImport`,F=`Previewing ${n.records.length} CSV record${n.records.length===1?``:`s`} from ${e.name}.`,$()})}function qe(e){if(!z){P=`none`;return}if(q(`CSV import`),e===`new`){let e=z;T=e.id,E=e.records[0]?.id??``,z=null,P=`none`,F=`Imported ${e.records.length} records from ${Pe}.`,K({...w,updatedAt:new Date().toISOString(),schema:{...w.schema,tables:[...w.schema.tables,e]},layouts:[...w.layouts,{id:`layout_${Date.now().toString(36)}`,name:`${e.name} Table`,tableId:e.id,mode:`table`,locked:!1}]});return}let t=U(),n=new Map(z.fields.map(e=>[e.name.trim().toLowerCase(),e.id])),i=z.records.map(e=>r(t.fields,Object.fromEntries(t.fields.map(t=>{let r=n.get(t.name.trim().toLowerCase());return[t.id,r?e.values[r]??``:``]}))));z=null,P=`none`,F=`Appended ${i.length} CSV record${i.length===1?``:`s`} to ${t.name}.`,J({...t,records:[...t.records,...i]})}function Je(e){let t=De.find(t=>t.id===e);if(!t)return;let n=Oe(t);q(`template load`),T=n.id,E=n.records[0]?.id??``,F=`Loaded ${t.title}.`,K({...w,metadata:{...w.metadata,title:t.title},schema:{...w.schema,tables:[...w.schema.tables,n]},teacher:{...w.teacher,notes:t.reflectionQuestions}})}function Y(e,t){return`
    <details class="menu">
      <summary>${V(H(e))}</summary>
      <div class="menu-panel">
        ${t.map(([e,t])=>`<button type="button" data-action="${e}">${V(H(t))}</button>`).join(``)}
      </div>
    </details>
  `}function Ye(e=`text`){return[[`text`,`Short text`],[`longText`,`Long text`],[`number`,`Number`],[`currency`,`Currency`],[`percent`,`Percent`],[`date`,`Date`],[`checkbox`,`Checkbox`],[`rating`,`Rating`],[`choice`,`Choice`],[`image`,`Image`],[`link`,`Link`],[`calculation`,`Calculation`],[`autoNumber`,`Auto number`],[`createdAt`,`Created time`],[`updatedAt`,`Updated time`]].map(([t,n])=>`<option value="${t}" ${e===t?`selected`:``}>${n}</option>`).join(``)}function X(e,t,n){let r=e.fields.find(e=>e.id===n);return r?.type===`calculation`&&r.formula?be(r.formula,e,t,w):t.values[n]??``}function Z(){return w.layouts.find(e=>e.tableId===T&&e.mode===D)}function Xe(e){return!!e}function Q(e){let t=Z()?.fieldOrder??e.fields.map(e=>e.id),n=new Map(e.fields.map(e=>[e.id,e]));return[...t.map(e=>n.get(e)).filter(Xe),...e.fields.filter(e=>!t.includes(e.id))].filter(e=>e&&!e.hidden)}function Ze(e){return e.fields.filter(e=>e.type===`calculation`)}function Qe(e){return Ze(e).reduce((t,n)=>n.formula?t+e.records.filter(t=>String(be(n.formula??``,e,t,w)).startsWith(`Formula error:`)).length:t,0)}function $e(e){return e.fields.filter(e=>!e.hidden&&![`image`,`autoNumber`,`createdAt`,`updatedAt`,`calculation`].includes(e.type)).map(t=>({field:t,missing:we(e,t.id).length,duplicates:Ce(e,t.id).length}))}function et(e){return Q(e).filter(e=>e.type===`image`)}function tt(e,t){let n=et(e)[0];return n?String(X(e,t,n.id)??``):``}function nt(e){let t=Z();t&&K({...w,updatedAt:new Date().toISOString(),layouts:w.layouts.map(n=>n.id===t.id?{...n,...e}:n)})}function rt(e,t){let n=e.fields.find(e=>!e.hidden)??e.fields[0],r=n?X(e,t,n.id):``;return String(r||`Untitled record`)}function it(e,t,n,r){let i=e.fields.find(e=>e.id===n),a=X(e,t,n),o=`aria-label="${V(i?.name??`Field`)}, record ${r+1}" data-record-id="${t.id}" data-field-id="${n}"`;if(i?.type===`checkbox`)return`<input class="cell-checkbox" type="checkbox" ${o} ${a===!0||a===`true`?`checked`:``}>`;if(i?.type===`image`){let e=String(a??``);return`
      <div class="image-cell" tabindex="0" role="button" title="Click here and paste an image, or use Upload image." ${o}>
        ${e?`<img src="${V(e)}" alt="">`:`<span>${V(H(`No image yet`))}</span>`}
        <small>Paste an image here or upload one.</small>
        <label class="image-upload-label">
          ${V(H(`Upload image`))}
          <input class="image-input" type="file" accept="image/*" ${o}>
        </label>
      </div>
    `}return i?.type===`rating`?`<input class="cell-input" type="number" min="0" max="5" step="1" ${o} value="${V(a)}">`:i?.type===`choice`?`<select class="cell-input" ${o}>${(i.options?.length?i.options:[`Yes`,`No`]).map(e=>`<option value="${V(e)}" ${String(a)===e?`selected`:``}>${V(e)}</option>`).join(``)}</select>`:i?.type===`autoNumber`||i?.type===`createdAt`||i?.type===`updatedAt`?`<output class="calc-output">${V(a)}</output>`:i?.type===`longText`?`<textarea class="cell-input" ${o}>${V(a)}</textarea>`:i?.type===`date`?`<input class="cell-input" type="date" ${o} value="${V(a)}">`:i?.type===`number`||i?.type===`currency`||i?.type===`percent`?`<input class="cell-input" type="number" step="any" ${o} value="${V(a)}">`:i?.type===`calculation`?`<output class="calc-output">${V(a)}</output>`:`<input class="cell-input" ${o} value="${V(a)}">`}function at(e){return`
    <div class="table-tabs">
      ${w.schema.tables.map(t=>`<button type="button" class="table-tab ${t.id===e.id?`active`:``}" data-table-id="${t.id}">${V(t.name)}</button>`).join(``)}
    </div>
  `}function ot(e,t){return`
    <div class="data-grid-wrap">
      <table class="data-grid">
        <thead>
          <tr>
            <th>#</th>
            ${Q(e).map(e=>`
                  <th>
                    <button type="button" class="field-button" data-field-settings="${e.id}">
                      ${V(e.name)}<br><small>${V(e.type)}</small>
                    </button>
                  </th>
                `).join(``)}
            <th>Record</th>
          </tr>
        </thead>
        <tbody>
          ${t.map((t,n)=>`
                <tr class="${t.id===E?`active-row`:``}" data-record-row="${t.id}">
                  <td><button type="button" class="row-button" data-select-record="${t.id}">${n+1}</button></td>
                  ${Q(e).map(r=>`<td>${it(e,t,r.id,n)}</td>`).join(``)}
                  <td class="record-actions">
                    <button type="button" data-action="duplicate-record" data-record-action-id="${t.id}">Copy</button>
                    <button type="button" data-action="delete-record" data-record-action-id="${t.id}">Delete</button>
                  </td>
                </tr>
              `).join(``)}
        </tbody>
      </table>
    </div>
  `}function st(e){let t=e.records.find(e=>e.id===E)??e.records[0];if(!t)return`<div class="empty-panel">Add a record to use form view.</div>`;let n=w.schema.relationships.filter(t=>t.fromTableId===e.id).map(n=>{let r=w.schema.tables.find(e=>e.id===n.toTableId),i=r?h(n,e,t,r):[];return`
        <section class="related-records">
          <h3>${V(n.name)}</h3>
          <p>${i.length} related record${i.length===1?``:`s`} from ${V(r?.name??`another table`)}</p>
          ${i.length?`<div class="related-grid">${i.slice(0,6).map(e=>`
                      <article>
                        <strong>${V(rt(r,e))}</strong>
                        ${r.fields.filter(e=>!e.hidden).slice(0,3).map(t=>`<span>${V(t.name)}: ${V(X(r,e,t.id))}</span>`).join(``)}
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
                <span>${V(n.name)}</span>
                ${it(e,t,n.id,r)}
                ${n.description?`<small>${V(n.description)}</small>`:``}
              </label>
            `).join(``)}
        ${n}
      </div>
    </div>
  `}function ct(e,t){let n=(t,n)=>{let r=X(e,n,t.id);if(t.type===`image`){let e=String(r??``);return`
        <figure class="card-image-field">
          ${e?`<img src="${V(e)}" alt="">`:`<span>No image yet</span>`}
          <figcaption>${V(t.name)}</figcaption>
        </figure>
      `}return`<p><strong>${V(t.name)}</strong><span>${V(r)}</span></p>`};return`
    <div class="cards-view ${D===`gallery`?`gallery-view`:``}">
      ${t.map(t=>{let r=tt(e,t);return`
            <article class="record-card" data-select-record="${t.id}">
              ${D===`gallery`?`<div class="gallery-image">${r?`<img src="${V(r)}" alt="">`:`<span>Add an image field, then upload a picture.</span>`}</div>`:``}
              ${Q(e).filter(e=>D!==`gallery`||e.type!==`image`).slice(0,D===`gallery`?4:8).map(e=>n(e,t)).join(``)}
            </article>
          `}).join(``)}
    </div>
  `}function lt(e,t){return`
    <div class="labels-view">
      ${t.map(t=>`
            <article class="print-label">
              ${Q(e).slice(0,4).map(n=>`<p><strong>${V(n.name)}:</strong> ${V(X(e,t,n.id))}</p>`).join(``)}
            </article>
          `).join(``)}
    </div>
  `}function ut(e,t){let n=pe(e);return`
    <div class="report-view">
      <header>
        <h2>${V(w.metadata.title)}</h2>
        <p>${V(e.name)} report. ${t.length} record${t.length===1?``:`s`} shown.</p>
      </header>
      ${ot(e,t)}
      ${n.length?`<section class="summary-strip">${n.map(e=>`<div><strong>${V(e.fieldName)}</strong><span>Sum ${e.sum.toLocaleString()} | Avg ${e.average.toFixed(2)}</span></div>`).join(``)}</section>`:`<p class="empty-panel">Add a number, currency, or percent field to see summaries.</p>`}
    </div>
  `}function dt(e){let t=W(e),n={table:`Table: spreadsheet-like rows and columns for fast data entry.`,form:`Form: focus on one record at a time.`,cards:`Cards: compact text-first record cards for browsing.`,gallery:`Gallery: image-first cards for collections and exhibits.`,labels:`Labels: printable small cards or shelf labels.`,report:`Report: printable table with title and summaries.`},r=D===`form`?st(e):D===`cards`||D===`gallery`?ct(e,t):D===`labels`?lt(e,t):D===`report`?ut(e,t):ot(e,t);return`
    <section class="database-panel" aria-label="Database table">
      ${at(e)}
      <div class="view-tabs" role="group" aria-label="Layout modes">
        ${[`table`,`form`,`cards`,`gallery`,`labels`,`report`].map(e=>`<button type="button" class="${D===e?`active`:``}" data-view-mode="${e}" title="${V(n[e])}" aria-label="${V(n[e])}">${V(H(e[0].toUpperCase()+e.slice(1)))}</button>`).join(``)}
      </div>
      ${r}
    </section>
  `}function ft(e){let t=pe(e),n=e.records.find(e=>e.id===E)??e.records[0],r=n?w.schema.relationships.filter(t=>t.fromTableId===e.id).map(t=>{let r=w.schema.tables.find(e=>e.id===t.toTableId),i=r?h(t,e,n,r).length:0;return`
            <div class="template-card">
              <strong>${V(t.name)}</strong>
              <span>${i} related record${i===1?``:`s`}</span>
              <p>${V(de(w,t))}</p>
            </div>
          `}).join(``):``;return`
    <aside class="teacher-panel" aria-label="Teacher tools and database stats">
      <h2>Database Check</h2>
      <div class="stat-grid">
        <div class="stat-card"><strong>${W(e).length}</strong> shown</div>
        <div class="stat-card"><strong>${e.records.length}</strong> records</div>
        <div class="stat-card"><strong>${e.fields.length}</strong> fields</div>
        <div class="stat-card"><strong>${w.schema.tables.length}</strong> tables</div>
      </div>
      ${t.map(e=>`
            <div class="template-card">
              <strong>${V(e.fieldName)} summary</strong>
              <span>Sum: ${e.sum.toLocaleString()}</span>
              <span>Average: ${e.average.toFixed(2)}</span>
            </div>
          `).join(``)}
      ${r?`<h3>Related Records</h3>${r}`:``}
      <h3>Template Starters</h3>
      ${De.map(e=>`
            <div class="template-card">
              <strong>${V(e.title)}</strong>
              <span>${V(e.gradeBand)}</span>
              <p>${V(e.goal)}</p>
              <button type="button" data-template-id="${e.id}">Use template</button>
            </div>
          `).join(``)}
    </aside>
  `}function pt(e){if(P===`none`)return``;if(P===`replace`){let t=L.slice(0,8);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Replace values">
          <h2>Replace values</h2>
          <label>Find <input data-replace-find placeholder="Text to find"></label>
          <label>Replace with <input data-replace-with placeholder="New text"></label>
          <label>Field <select data-replace-field>${e.fields.map(e=>`<option value="${e.id}">${V(e.name)}</option>`).join(``)}</select></label>
          <label class="check-row"><input type="checkbox" data-replace-case-sensitive> Case-sensitive</label>
          <label class="check-row"><input type="checkbox" data-replace-whole-word> Whole word only</label>
          <p>Replacement applies to the current found set when search is active. Preview first, then apply. The last replace can be undone from Edit.</p>
          ${L.length?`<div class="replace-preview"><strong>${L.length} change${L.length===1?``:`s`} ready</strong>${t.map(t=>{let n=e.records.find(e=>e.id===t.recordId),r=e.fields.find(e=>e.id===t.fieldId);return`<p><span>${V(n?rt(e,n):`Record`)} / ${V(r?.name??`Field`)}</span><del>${V(t.before)}</del><ins>${V(t.after)}</ins></p>`}).join(``)}</div>`:``}
          <div class="modal-actions">
            <button type="button" data-action="preview-replace">Preview</button>
            <button type="button" data-action="run-replace" ${L.length?``:`disabled`}>Apply Replace</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(P===`field`){let t=e.fields.find(e=>e.id===Me)??e.fields[0];return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Field settings">
          <h2>Field settings</h2>
          <label>Name <input data-field-name value="${V(t.name)}"></label>
          <label>Type <select data-field-type>${Ye(t.type)}</select></label>
          <label>Description <textarea data-field-description>${V(t.description)}</textarea></label>
          <label>Choice options <input data-field-options value="${V(t.options?.join(`, `)??``)}" placeholder="Yes, No, Maybe"></label>
          <label class="check-row"><input type="checkbox" data-field-required ${t.required?`checked`:``}> Required field</label>
          <label class="check-row"><input type="checkbox" data-field-hidden ${t.hidden?`checked`:``}> Hide field</label>
          <label>Calculation formula <input data-field-formula value="${V(t.formula??``)}" placeholder='JOIN(First Name, " ", Last Name)'></label>
          <p>Try <code>FIELD(Animal)</code>, <code>JOIN(Animal, " lives in ", Habitat)</code>, <code>UPPER(Animal)</code>, <code>ADD(Score, Bonus)</code>, <code>AVERAGE(Score)</code>, or <code>LOOKUP("Book reviews", Rating)</code>.</p>
          <div class="modal-actions">
            <button type="button" data-action="save-field-settings">Save field</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(P===`layout`){let t=Z(),n=Q(e);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Layout designer">
          <h2>Layout designer</h2>
          <p>Arrange fields for the current ${V(D)} view. Locked layouts can still be viewed, but students should not change them.</p>
          <label class="check-row"><input type="checkbox" data-layout-locked ${t?.locked?`checked`:``}> Lock this layout</label>
          <div class="layout-field-list">
            ${n.map((e,t)=>`
                  <div class="layout-field-row">
                    <strong>${V(e.name)}</strong>
                    <span>${V(e.type)}</span>
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
    `}if(P===`csvImport`&&z){let t=z.records.slice(0,5);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="CSV import preview">
          <h2>CSV import preview</h2>
          <p>${V(Pe)} has ${z.fields.length} field${z.fields.length===1?``:`s`} and ${z.records.length} record${z.records.length===1?``:`s`}.</p>
          <div class="preview-table-wrap">
            <table class="preview-table">
              <thead>
                <tr>${z.fields.map(e=>`<th>${V(e.name)}</th>`).join(``)}</tr>
              </thead>
              <tbody>
                ${t.map(e=>`<tr>${z.fields.map(t=>`<td>${V(e.values[t.id])}</td>`).join(``)}</tr>`).join(``)}
              </tbody>
            </table>
          </div>
          <p>New table keeps every CSV column. Append uses matching field names in the current table and leaves unmatched fields blank.</p>
          <div class="modal-actions">
            <button type="button" data-action="apply-csv-new">Create new table</button>
            <button type="button" data-action="apply-csv-append">Append to ${V(e.name)}</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(P===`projectIdeas`)return`
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
    `;if(P===`relationship`){let t=w.schema.tables.find(e=>e.id===Ne)??e,n=w.schema.tables.find(e=>e.id===R)??e,r=t.fields.map(e=>`<option value="${t.id}:${e.id}">${V(e.name)}</option>`).join(``),i=n.fields.map(e=>`<option value="${n.id}:${e.id}">${V(e.name)}</option>`).join(``);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Relationships">
          <h2>Relationships</h2>
          <p>Create a simple one-to-many relationship by matching values in two fields, such as Books:Title to Reviews:Book.</p>
          <label>Name <input data-relationship-name placeholder="Books to reviews"></label>
          <label>Parent table <select data-relationship-from-table>${w.schema.tables.map(e=>`<option value="${e.id}" ${e.id===t.id?`selected`:``}>${V(e.name)}</option>`).join(``)}</select></label>
          <label>Parent match field <select data-relationship-from-field>${r}</select></label>
          <label>Related table <select data-relationship-to-table>${w.schema.tables.map(e=>`<option value="${e.id}" ${e.id===n.id?`selected`:``}>${V(e.name)}</option>`).join(``)}</select></label>
          <label>Related match field <select data-relationship-to-field>${i}</select></label>
          ${w.schema.relationships.length?`<div class="relationship-list">${w.schema.relationships.map(e=>`<p><strong>${V(e.name)}</strong><br>${V(de(w,e))}</p>`).join(``)}</div>`:`<p>No relationships yet. Add a second table first for the most useful results.</p>`}
          <div class="modal-actions">
            <button type="button" data-action="create-relationship">Create relationship</button>
            <button type="button" data-action="close-dialog">Close</button>
          </div>
        </section>
      </div>
    `}if(P===`functions`){let t=e.fields.filter(e=>![`image`,`createdAt`,`updatedAt`].includes(e.type)),n=t.find(e=>[`text`,`longText`,`choice`].includes(e.type))??t[0],r=t.find(e=>[`number`,`currency`,`percent`,`rating`].includes(e.type))??n,i=n?.name??`Field`,a=r?.name??`Score`;return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Functions">
          <h2>Calculation functions</h2>
          <p>Use a calculation field when students need a result made from other fields. Formulas are simple, offline, and do not run custom code.</p>
          <div class="formula-grid">
            <div>
              <strong>Text</strong>
              <code>FIELD(${V(i)})</code>
              <code>JOIN(${V(i)}, " report")</code>
              <code>UPPER(${V(i)})</code>
              <code>TITLECASE(${V(i)})</code>
              <code>CONTAINS(${V(i)}, "a")</code>
            </div>
            <div>
              <strong>Numbers</strong>
              <code>ADD(${V(a)}, "5")</code>
              <code>SUBTRACT(${V(a)}, "1")</code>
              <code>MULTIPLY(${V(a)}, "2")</code>
              <code>DIVIDE(${V(a)}, "2")</code>
              <code>ROUND(${V(a)}, "1")</code>
            </div>
            <div>
              <strong>Whole table</strong>
              <code>SUM(${V(a)})</code>
              <code>AVERAGE(${V(a)})</code>
              <code>MIN(${V(a)})</code>
              <code>MAX(${V(a)})</code>
              <code>COUNT(${V(a)})</code>
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
    `}if(P===`quality`){let t=$e(e),n=Qe(e);return`
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
                          <span><strong>${V(e.name)}</strong><small>${V(e.type)}</small></span>
                          <button type="button" data-quality-kind="missing" data-quality-field-id="${e.id}" ${t?``:`disabled`}>${t}</button>
                          <button type="button" data-quality-kind="duplicates" data-quality-field-id="${e.id}" ${n?``:`disabled`}>${n}</button>
                        </div>
                      `).join(``):`<p class="empty-panel">No editable data fields are available yet.</p>`}
          </div>
          <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
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
  `}function $(){let e=U();G(e),Re(),C.innerHTML=`
    <header class="app-header">
      <a class="brand" href="../../pages/splatworks.html" aria-label="SplatWorks home">
        <img class="brand-icon" src="listsplat_icon.svg" alt="">
        <span>
          <strong>ListSplat<sup>TM</sup></strong>
          <small>SplatWorks<sup>TM</sup> Database Studio</small>
        </span>
      </a>
      <div class="quick-actions">
        <button type="button" class="button primary" data-action="new">${V(H(`New`))}</button>
        <button type="button" class="button primary" data-action="save-json">${V(H(`Save JSON`))}</button>
        <button type="button" class="button primary" data-action="open-json">${V(H(`Open JSON`))}</button>
        <button type="button" class="button primary" data-action="export-csv">${V(H(`Export CSV`))}</button>
        <select id="languageSwitcher" class="lang-switcher" aria-label="Language">${Le(B)}</select>
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
        <label>${V(H(`Title`))} <input data-project-title value="${V(w.metadata.title)}"></label>
        <label>${V(H(`Search`))} <input data-search value="${V(k)}" placeholder="${V(H(`Find records`))}"></label>
        <label>${V(H(`In`))} <select data-search-field><option value="all">${V(H(`All fields`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${A===e.id?`selected`:``}>${V(e.name)}</option>`).join(``)}</select></label>
        <label>${V(H(`Sort`))} <select data-sort-field><option value="">${V(H(`Choose field`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${j===e.id?`selected`:``}>${V(e.name)}</option>`).join(``)}</select></label>
        <button type="button" data-action="toggle-sort">${M===`asc`?`A-Z`:`Z-A`}</button>
        <label>${V(H(`New field`))} <input data-new-field placeholder="${V(H(`Field name`))}"></label>
        <label>${V(H(`Type`))} <select data-new-field-type>${Ye()}</select></label>
        <button type="button" data-action="add-field">${V(H(`Add field`))}</button>
        <button type="button" data-action="add-record">${V(H(`Add record`))}</button>
      </section>
      <div class="workspace">
        ${dt(e)}
        ${ft(e)}
      </div>
      <footer class="status-bar">
        <span>${V(e.name)}: ${W(e).length} shown of ${e.records.length} records, ${e.fields.length} fields</span>
        <span>${V(F)}</span>
        <span>${O}</span>
      </footer>
    </main>
    <input class="hidden-file" type="file" accept=".listsplat.json,application/json" data-open-json>
    <input class="hidden-file" type="file" accept=".csv,text/csv" data-import-csv>
    ${pt(e)}
  `}function mt(e){return e instanceof HTMLInputElement&&e.type===`checkbox`?e.checked:e instanceof HTMLInputElement&&e.type===`number`?e.value===``?``:Number(e.value):e.value}function ht(e){let t=e.dataset.recordId,n=e.dataset.fieldId;!t||!n||(w=u(w,l(U(),t,n,mt(e))),p(w),O=`Saved locally`)}function gt(e,t,n,r){if(!n.type.startsWith(`image/`)){F=`That clipboard item is not an image.`,$();return}let i=new FileReader;i.addEventListener(`load`,()=>{q(r),w=u(w,l(U(),e,t,String(i.result??``))),p(w),F=`Image saved in this field.`,$()}),i.readAsDataURL(n)}function _t(){let e=U(),t=e.fields.find(e=>e.id===Me);if(!t)return;let n=C.querySelector(`[data-field-name]`)?.value??t.name,r=C.querySelector(`[data-field-type]`)?.value??t.type,i=C.querySelector(`[data-field-description]`)?.value??``,a=C.querySelector(`[data-field-required]`)?.checked??!1,o=C.querySelector(`[data-field-hidden]`)?.checked??!1,s=C.querySelector(`[data-field-formula]`)?.value??``,ee=(C.querySelector(`[data-field-options]`)?.value??``).split(`,`).map(e=>e.trim()).filter(Boolean);J(c(e,t.id,{name:n,type:r,description:i,required:a,hidden:o,formula:s,options:ee})),P=`none`,F=`Updated ${n}.`,$()}function vt(){let e=C.querySelector(`[data-replace-find]`)?.value??``,t=C.querySelector(`[data-replace-with]`)?.value??``,n=C.querySelector(`[data-replace-field]`)?.value??U().fields[0]?.id,r=C.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=C.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=k?W(U()).map(e=>e.id):void 0;q(`replace`);let o=Ee(U(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i});P=`none`,L=[],F=`Replaced ${o.count} value${o.count===1?``:`s`}.`,J(o.table)}function yt(){let e=C.querySelector(`[data-replace-find]`)?.value??``,t=C.querySelector(`[data-replace-with]`)?.value??``,n=C.querySelector(`[data-replace-field]`)?.value??U().fields[0]?.id,r=C.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=C.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=k?W(U()).map(e=>e.id):void 0;L=Te(U(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i}),F=`Preview found ${L.length} change${L.length===1?``:`s`}.`,$()}function bt(e){let t=C.querySelector(e)?.value;if(!t)return null;let[n,r]=t.split(`:`);return n&&r?{tableId:n,fieldId:r}:null}function xt(){let e=C.querySelector(`[data-relationship-from-table]`)?.value??``,t=C.querySelector(`[data-relationship-to-table]`)?.value??``,n=bt(`[data-relationship-from-field]`),r=bt(`[data-relationship-to-field]`),i=C.querySelector(`[data-relationship-name]`)?.value??``;if(!e||!t||!n||!r){F=`Choose both tables and both match fields.`,$();return}if(n.tableId!==e||r.tableId!==t){F=`Match fields must belong to the tables you chose.`,$();return}q(`relationship create`);let a=le(i,e,n.fieldId,t,r.fieldId);F=`Created relationship: ${a.name}.`,K(ue(w,a))}function St(){Ne=C.querySelector(`[data-relationship-from-table]`)?.value??Ne,R=C.querySelector(`[data-relationship-to-table]`)?.value??R,$()}C.addEventListener(`click`,e=>{let t=e.target,n=t.closest(`[data-action]`)?.dataset.action,r=t.closest(`[data-table-id]`)?.dataset.tableId,i=t.closest(`[data-template-id]`)?.dataset.templateId,c=t.closest(`[data-view-mode]`)?.dataset.viewMode,l=t.closest(`[data-select-record]`)?.dataset.selectRecord,u=t.closest(`[data-field-settings]`)?.dataset.fieldSettings,d=t.closest(`[data-record-action-id]`)?.dataset.recordActionId,f=t.closest(`[data-quality-field-id]`);if(r){T=r,N=new Set,G(U()),$();return}if(i){Je(i);return}if(c){D=c,$();return}if(l){E=l,D===`table`&&$();return}if(u){Me=u,P=`field`,$();return}if(f){let e=f.dataset.qualityFieldId,t=f.dataset.qualityKind;if(e&&t){let n=t===`duplicates`?Ce(U(),e):we(U(),e);N=new Set(n.map(e=>e.id));let r=U().fields.find(t=>t.id===e);F=`Highlighted ${n.length} ${t===`duplicates`?`duplicate`:`missing`} record${n.length===1?``:`s`} in ${r?.name??`this field`}.`,P=`none`,$();return}}if(n)if(Be(),n===`new`){q(`new database`);let e=a(`Untitled Database`);T=e.schema.tables[0].id,E=e.schema.tables[0].records[0]?.id??``,N=new Set,K(e)}else if(n===`save-json`)He();else if(n===`open-json`)C.querySelector(`[data-open-json]`)?.click();else if(n===`import-csv`)C.querySelector(`[data-import-csv]`)?.click();else if(n===`export-csv`)Ue();else if(n===`export-report`||n===`project-packet`)We();else if(n===`print`)window.print();else if(n===`add-record`)q(`add record`),J(s(U()));else if(n===`add-field`){let e=C.querySelector(`[data-new-field]`),t=C.querySelector(`[data-new-field-type]`)?.value;q(`add field`),J(o(U(),e?.value||`New Field`,t??`text`))}else if(n===`add-table`){let e=window.prompt(`New table name?`,`New Table`)??``;q(`add table`);let t=ne(w,e);T=t.schema.tables.at(-1)?.id??T,E=U().records[0]?.id??``,K(t)}else if(n===`duplicate-record`&&d)q(`duplicate record`),J(ee(U(),d));else if(n===`delete-record`&&d)q(`delete record`),J(te(U(),d));else if(n===`toggle-sort`)M=M===`asc`?`desc`:`asc`,$();else if(n===`sort`)j&&J(Se(U(),j,M));else if(n===`duplicates`){let e=A===`all`?U().fields[0]?.id:A;N=new Set(Ce(U(),e).map(e=>e.id)),F=`Found ${N.size} duplicate record${N.size===1?``:`s`}.`,$()}else if(n===`missing`){let e=A===`all`?U().fields[0]?.id:A;N=new Set(we(U(),e).map(e=>e.id)),F=`Found ${N.size} record${N.size===1?``:`s`} with missing values.`,$()}else if(n===`clear-find`)k=``,N=new Set,F=`Showing all records.`,$();else if(n===`replace`)L=[],P=`replace`,$();else if(n===`preview-replace`)yt();else if(n===`run-replace`)vt();else if(n===`apply-csv-new`)qe(`new`);else if(n===`apply-csv-append`)qe(`append`);else if(n===`save-field-settings`)q(`field settings`),_t();else if(n===`layout-designer`||n===`lock-layout`)P=`layout`,$();else if(n===`layout-field-up`||n===`layout-field-down`){let e=t.closest(`[data-layout-field-id]`)?.dataset.layoutFieldId,r=Z();if(e&&r){let t=Q(U()).map(e=>e.id),r=t.indexOf(e),i=n===`layout-field-up`?r-1:r+1;r>=0&&i>=0&&i<t.length&&([t[r],t[i]]=[t[i],t[r]],q(`layout order`),nt({fieldOrder:t}),P=`layout`)}}else if(n===`save-layout-settings`){let e=C.querySelector(`[data-layout-locked]`)?.checked??!1;q(`layout settings`),nt({locked:e,fieldOrder:Q(U()).map(e=>e.id)}),P=`none`}else n===`create-relationship`?xt():n===`undo-change`?ze():n===`close-dialog`?(P=`none`,L=[],z=null,$()):n.endsWith(`-view`)?(D=n.replace(`-view`,``),$()):n===`templates`?(F=`Template starters are in the Teacher panel.`,$()):n===`project-ideas`?(P=`projectIdeas`,$()):n===`relationships`?(P=`relationship`,$()):n===`functions`?(P=`functions`,$()):n===`quality`?(P=`quality`,$()):n.startsWith(`help-`)?(P=`help`,$()):(F=`This ListSplatTM tool is planned for a later build.`,$())}),C.addEventListener(`change`,e=>{let t=e.target;if(t.matches(`#languageSwitcher`)&&t instanceof HTMLSelectElement){B=Fe(t.value);try{localStorage.setItem(ke,B)}catch{}$()}else if(t.matches(`[data-open-json]`)&&t instanceof HTMLInputElement&&t.files?.[0])Ge(t.files[0]);else if(t.matches(`[data-import-csv]`)&&t instanceof HTMLInputElement&&t.files?.[0])Ke(t.files[0]);else if(t.matches(`[data-search-field]`))A=t.value,N=new Set,$();else if(t.matches(`[data-sort-field]`))j=t.value,j&&J(Se(U(),j,M));else if(t.matches(`[data-relationship-from-table], [data-relationship-to-table]`))St();else if(t.matches(`.cell-input, .cell-checkbox, .image-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement))if(t instanceof HTMLInputElement&&t.type===`file`&&t.files?.[0]){let e=t.dataset.recordId,n=t.dataset.fieldId,r=t.files[0];e&&n&&gt(e,n,r,`image upload`)}else ht(t)}),C.addEventListener(`paste`,e=>{let t=e.target.closest(`.image-cell`);if(!t)return;let n=t.dataset.recordId,r=t.dataset.fieldId,i=Array.from(e.clipboardData?.items??[]).find(e=>e.type.startsWith(`image/`))?.getAsFile();n&&r&&i&&(e.preventDefault(),gt(n,r,i,`image paste`))}),C.addEventListener(`input`,e=>{let t=e.target;if(t.matches(`[data-project-title]`)){Ve(t.value);return}if(t.matches(`[data-search]`)){k=t.value,N=new Set,$();return}t.matches(`.cell-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)&&ht(t)}),document.addEventListener(`click`,e=>{e.target.closest(`.menu`)||Be()}),document.addEventListener(`toggle`,e=>{let t=e.target;!(t instanceof HTMLDetailsElement)||!t.matches(`.menu`)||!t.open||document.querySelectorAll(`.menu[open]`).forEach(e=>{e!==t&&(e.open=!1)})},!0),$();