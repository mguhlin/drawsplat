(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={text:``,longText:``,number:0,currency:0,percent:0,date:``,checkbox:!1,rating:0,choice:``,image:``,link:``,calculation:``,autoNumber:``,createdAt:``,updatedAt:``};function t(e){return`${e}_${Math.random().toString(36).slice(2,10)}`}function n(e,n=`text`){return{id:t(`field`),name:e,type:n,description:``,required:!1,hidden:!1,options:n===`choice`?[`Yes`,`No`]:void 0}}function r(n,r={}){let i=new Date().toISOString(),a=Object.fromEntries(n.map((t,n)=>t.type===`createdAt`||t.type===`updatedAt`?[t.id,r[t.id]??i]:t.type===`autoNumber`?[t.id,r[t.id]??n+1]:[t.id,r[t.id]??e[t.type]]));return{id:t(`record`),createdAt:i,updatedAt:i,values:a}}function i(e,i){let a=i.map(e=>n(e));return{id:t(`table`),name:e,fields:a,records:[r(a)]}}function a(e=`Animal Research Database`){let n=new Date().toISOString(),a=i(`Animals`,[`Animal`,`Habitat`,`Diet`,`Interesting Fact`]);return a.records=[r(a.fields,{[a.fields[0].id]:`Axolotl`,[a.fields[1].id]:`Freshwater lakes`,[a.fields[2].id]:`Worms and insects`,[a.fields[3].id]:`It can regrow some body parts.`}),r(a.fields,{[a.fields[0].id]:`Red panda`,[a.fields[1].id]:`Mountain forests`,[a.fields[2].id]:`Bamboo and fruit`,[a.fields[3].id]:`It uses its tail like a blanket.`})],{app:`ListSplatTM`,version:1,createdAt:n,updatedAt:n,metadata:{title:e,author:``,className:``},schema:{tables:[a],relationships:[]},layouts:[{id:t(`layout`),name:`Table View`,tableId:a.id,mode:`table`,locked:!1},{id:t(`layout`),name:`Record Form`,tableId:a.id,mode:`form`,locked:!1},{id:t(`layout`),name:`Research Cards`,tableId:a.id,mode:`cards`,locked:!1}],teacher:{studentView:!1,notes:[`Ask students to add source notes before printing a report.`],rubric:[]}}}function o(t,r,i=`text`){let a=n(r.trim()||`New Field`,i);return{...t,fields:[...t.fields,a],records:t.records.map(t=>({...t,updatedAt:new Date().toISOString(),values:{...t.values,[a.id]:e[i]}}))}}function s(e,t){return e.records.reduce((e,n)=>{let r=Number(n.values[t]);return Number.isFinite(r)?Math.max(e,r):e},0)+1}function c(e){let t={};return e.fields.filter(e=>e.type===`autoNumber`).forEach(n=>{t[n.id]=s(e,n.id)}),t}function l(e){return{...e,records:[...e.records,r(e.fields,c(e))]}}function u(t,n,r){let i=t==null?``:String(t);if(i.trim()===``)return{value:e[n],lost:!1};switch(n){case`number`:case`currency`:case`percent`:case`rating`:{let t=Number(i.replace(/[$,%\s]/g,``));return Number.isFinite(t)?{value:n===`rating`?Math.max(0,Math.min(5,Math.round(t))):t,lost:!1}:{value:e[n],lost:!0}}case`checkbox`:{let e=i.trim().toLowerCase();return[`true`,`yes`,`1`,`y`,`checked`].includes(e)?{value:!0,lost:!1}:[`false`,`no`,`0`,`n`].includes(e)?{value:!1,lost:!1}:{value:!1,lost:!0}}case`choice`:{let e=r?.find(e=>e.toLowerCase()===i.trim().toLowerCase());return e?{value:e,lost:!1}:{value:``,lost:!!(r&&r.length)}}case`date`:{let e=new Date(i);return Number.isNaN(e.getTime())?{value:``,lost:!0}:{value:e.toISOString().slice(0,10),lost:!1}}case`text`:case`longText`:case`link`:return{value:i,lost:!1};default:return{value:i,lost:!1}}}function d(e,t,n,r){return{...e,records:e.records.map(e=>({...e,values:{...e.values,[t]:u(e.values[t],n,r).value}}))}}function ee(e,t,n){return{...e,fields:e.fields.map(e=>e.id===t?{...e,...n}:e)}}function te(e,t){let n=e.records.find(e=>e.id===t);return n?{...e,records:[...e.records,r(e.fields,{...n.values,...c(e)})]}:e}function ne(e,t){return e.records.length<=1?e:{...e,records:e.records.filter(e=>e.id!==t)}}function re(e,t,n,r){let i=new Date().toISOString();return{...e,records:e.records.map(a=>a.id===t?{...a,updatedAt:i,values:Object.fromEntries(e.fields.map(e=>e.id===n?[e.id,r]:e.type===`updatedAt`?[e.id,i]:[e.id,a.values[e.id]]))}:a)}}function ie(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t.id?t:e)}}}function ae(e,n){let r=i(n.trim()||`New Table`,[`Name`,`Notes`]);return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:[...e.schema.tables,r]},layouts:[...e.layouts,{id:t(`layout`),name:`${r.name} Table`,tableId:r.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${r.name} Form`,tableId:r.id,mode:`form`,locked:!1}]}}function oe(e){if(!e||typeof e!=`object`)throw Error(`This is not a ListSplatTM project file.`);let t=e;if(t.app!==`ListSplatTM`||t.version!==1||!t.schema?.tables)throw Error(`This file is not a supported .listsplat.json project.`)}function se(e){let t=e.split(/\r?\n/,1)[0]??``,n=[`,`,`	`,`;`],r=`,`,i=-1;for(let e of n){let n=t.split(e).length-1;n>i&&(i=n,r=e)}return r}function ce(e,t=se(e)){let n=[],r=``,i=[],a=!1;for(let o=0;o<e.length;o+=1){let s=e[o],c=e[o+1];a&&s===`"`&&c===`"`?(r+=`"`,o+=1):s===`"`?a=!a:!a&&s===t?(i.push(r),r=``):!a&&(s===`
`||s===`\r`)?(s===`\r`&&c===`
`&&(o+=1),i.push(r),i.some(e=>e.length>0)&&n.push(i),i=[],r=``):r+=s}return i.push(r),i.some(e=>e.length>0)&&n.push(i),n}function le(e,t){let i=ce(t),a=(i[0]?.map((e,t)=>e.trim()||`Field ${t+1}`)??[`Field 1`]).map(e=>n(e)),o=i.slice(1).map(e=>r(a,Object.fromEntries(a.map((t,n)=>[t.id,e[n]??``]))));return{id:`table_${Date.now().toString(36)}`,name:e,fields:a,records:o.length>0?o:[r(a)]}}function ue(e){let t=e==null?``:String(e);return/[",\n\r]/.test(t)?`"${t.replaceAll(`"`,`""`)}"`:t}function de(e){return[e.fields.map(e=>ue(e.name)).join(`,`),...e.records.map(t=>e.fields.map(e=>ue(t.values[e.id])).join(`,`))].join(`
`)}var fe=`listsplat.autosave.v1`;function pe(e){localStorage.setItem(fe,JSON.stringify(e))}function me(){let e=localStorage.getItem(fe);if(!e)return null;let t=JSON.parse(e);return oe(t),t}function he(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,a.click(),URL.revokeObjectURL(i)}function ge(e){return e==null?``:String(e).trim().toLowerCase()}function _e(e,n,r,i,a){return{id:t(`relationship`),name:e.trim()||`New Relationship`,fromTableId:n,fromFieldId:r,toTableId:i,toFieldId:a}}function ve(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,relationships:[...e.schema.relationships,t]}}}function ye(e,t,n,r){let i=ge(n.values[e.fromFieldId]);return!i||t.id!==e.fromTableId||r.id!==e.toTableId?[]:r.records.filter(t=>ge(t.values[e.toFieldId])===i)}function be(e,t){let n=e.schema.tables.find(e=>e.id===t.fromTableId),r=e.schema.tables.find(e=>e.id===t.toTableId),i=n?.fields.find(e=>e.id===t.fromFieldId),a=r?.fields.find(e=>e.id===t.toFieldId);return`${n?.name??`Table`}:${i?.name??`Field`} -> ${r?.name??`Table`}:${a?.name??`Field`}`}function xe(e,t){return e.records.map(e=>Number(e.values[t])).filter(e=>Number.isFinite(e))}function Se(e){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)).map(t=>{let n=xe(e,t.id),r=n.reduce((e,t)=>e+t,0);return{fieldId:t.id,fieldName:t.name,count:n.length,sum:r,average:n.length?r/n.length:0,minimum:n.length?Math.min(...n):0,maximum:n.length?Math.max(...n):0}})}function Ce(e){let t=[],n=``,r=!1;for(let i=0;i<e.length;i+=1){let a=e[i],o=e[i-1];if(a===`"`&&o!==`\\`){r=!r,n+=a;continue}if(a===`,`&&!r){t.push(n.trim()),n=``;continue}n+=a}return(n.trim()||e.endsWith(`,`))&&t.push(n.trim()),t}function we(e){let t=e.trim();if(t.startsWith(`"`)&&t.endsWith(`"`))return t.slice(1,-1).replace(/\\"/g,`"`)}function Te(e,t,n){let r=n.trim().toLowerCase(),i=e.fields.find(e=>e.name.toLowerCase()===r);return i?String(t.values[i.id]??``):``}function f(e,t,n){return we(n)??Te(e,t,n)}function p(e,t,n){let r=Number(f(e,t,n));return Number.isFinite(r)?r:0}function Ee(e,t){let n=t.trim().toLowerCase(),r=e.fields.find(e=>e.name.toLowerCase()===n);return r?xe(e,r.id):[]}function m(e){return Number.isFinite(e)?String(Number(e.toFixed(8))):`Formula error: not a number`}function De(e){return e.toLowerCase().replace(/\b[a-z]/g,e=>e.toUpperCase())}function Oe(e,t,n,r){if(!e)return[];let i=r.trim().toLowerCase(),a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===i),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0;return a&&o?ye(a,t,n,o):[]}function ke(e,t,n,r,i){if(!e)return``;let a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===r.trim().toLowerCase()),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0,s=Oe(e,t,n,r)[0],c=o?.fields.find(e=>e.name.toLowerCase()===i.trim().toLowerCase());return s&&c?String(s.values[c.id]??``):``}function Ae(e,t,n,r){let i=e.trim();if(!i)return``;let a=i.match(/^([A-Z_]+)\((.*)\)$/i);if(!a)return`Formula error: use a function like FIELD(Name)`;let o=a[1].toUpperCase(),s=Ce(a[2]),c=s[0]??``;if(o===`FIELD`)return Te(t,n,c);if(o===`JOIN`)return s.map(e=>f(t,n,e)).join(``);if(o===`UPPER`)return f(t,n,c).toUpperCase();if(o===`LOWER`)return f(t,n,c).toLowerCase();if(o===`TITLECASE`)return De(f(t,n,c));if(o===`TRIM`)return f(t,n,c).trim();if(o===`LENGTH`)return String(f(t,n,c).length);if(o===`CONTAINS`)return f(t,n,c).toLowerCase().includes(f(t,n,s[1]??``).toLowerCase())?`Yes`:`No`;if(o===`IF_EMPTY`)return f(t,n,c).trim()?f(t,n,c):f(t,n,s[1]??``);if(o===`LOOKUP`)return ke(r,t,n,we(c)??c,we(s[1]??``)??s[1]??``);if(o===`COUNT_RELATED`)return String(Oe(r,t,n,we(c)??c).length);if(o===`ADD`)return m(s.reduce((e,r)=>e+p(t,n,r),0));if(o===`SUBTRACT`)return m(s.slice(1).reduce((e,r)=>e-p(t,n,r),p(t,n,c)));if(o===`MULTIPLY`)return m(s.reduce((e,r)=>e*p(t,n,r),1));if(o===`DIVIDE`){let e=p(t,n,s[1]??``);return e===0?`Formula error: divide by zero`:m(p(t,n,c)/e)}if(o===`ROUND`){let e=Math.max(0,Math.min(6,Math.round(p(t,n,s[1]??`"0"`))));return String(Number(p(t,n,c).toFixed(e)))}if([`SUM`,`AVERAGE`,`MIN`,`MAX`,`COUNT`].includes(o)){let e=Ee(t,c);return o===`SUM`?m(e.reduce((e,t)=>e+t,0)):o===`AVERAGE`?m(e.length?e.reduce((e,t)=>e+t,0)/e.length:0):o===`MIN`?m(e.length?Math.min(...e):0):o===`MAX`?m(e.length?Math.max(...e):0):String(e.length)}return`Formula error: ${o} is not supported`}function h(e){return e==null?``:String(e)}function je(e,t){let n=t.query.trim();if(!n)return e.records;let r=n.toLowerCase();return e.records.filter(n=>(t.fieldId===`all`?e.fields.map(e=>e.id):[t.fieldId]).some(e=>h(n.values[e]).toLowerCase().includes(r)))}function Me(e,t){let n=Number(e),r=Number(t);return e!==``&&t!==``&&!Number.isNaN(n)&&!Number.isNaN(r)?n-r:e.localeCompare(t,void 0,{numeric:!0,sensitivity:`base`})}function Ne(e,t){return t.length?[...e].sort((e,n)=>{for(let r of t){let t=h(e.values[r.fieldId]).trim(),i=h(n.values[r.fieldId]).trim();if(t===``&&i!==``)return 1;if(t!==``&&i===``)return-1;let a=Me(t,i)*(r.direction===`asc`?1:-1);if(a!==0)return a}return 0}):e}function Pe(e,t){let n=h(e.values[t.fieldId]),r=n.trim().toLowerCase(),i=t.value.trim().toLowerCase(),a=Number(n),o=Number(t.value),s=n.trim()!==``&&t.value.trim()!==``&&!Number.isNaN(a)&&!Number.isNaN(o);switch(t.operator){case`contains`:return r.includes(i);case`equals`:return s?a===o:r===i;case`startsWith`:return r.startsWith(i);case`endsWith`:return r.endsWith(i);case`greaterThan`:return s?a>o:r>i;case`lessThan`:return s?a<o:r<i;case`between`:{let e=Number(t.value),n=Number(t.value2);return!Number.isNaN(e)&&!Number.isNaN(n)&&!Number.isNaN(a)?a>=Math.min(e,n)&&a<=Math.max(e,n):r>=i&&r<=(t.value2??``).trim().toLowerCase()}case`isEmpty`:return n.trim()===``;case`isNotEmpty`:return n.trim()!==``;default:return!0}}function Fe(e,t){return!t||t.rules.length===0?e:e.filter(e=>t.match===`all`?t.rules.every(t=>Pe(e,t)):t.rules.some(t=>Pe(e,t)))}function Ie(e,t){let n=new Map;return e.records.forEach(e=>{let r=h(e.values[t]).trim().toLowerCase();r&&n.set(r,(n.get(r)??0)+1)}),e.records.filter(e=>{let r=h(e.values[t]).trim().toLowerCase();return r?(n.get(r)??0)>1:!1})}function Le(e,t){return e.records.filter(e=>!h(e.values[t]).trim())}function Re(e,t){if(!t.find)return[];let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=[];return e.records.forEach(e=>{o.has(e.id)&&t.fieldIds.forEach(n=>{let r=h(e.values[n]),i=r.replace(a,t.replacement);i!==r&&s.push({recordId:e.id,fieldId:n,before:r,after:i})})}),s}function ze(e,t){if(!t.find)return{table:e,count:0};let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=0,c=e.records.map(e=>{if(!o.has(e.id))return e;let n=!1,r={...e.values};return t.fieldIds.forEach(e=>{let i=h(r[e]),o=i.replace(a,()=>(s+=1,t.replacement));o!==i&&(n=!0,r[e]=o)}),n?{...e,updatedAt:new Date().toISOString(),values:r}:e});return{table:{...e,records:c},count:s}}function g(e,t,n,r,i,a){return{id:e,title:t,gradeBand:n,goal:r,table:le(t,i),reflectionQuestions:a}}var Be=[g(`classroom-library`,`Classroom Library Catalog`,`Grades 3-8`,`Track books, genres, reading levels, and recommendations.`,`Title,Author,Genre,Pages,Who would enjoy it?
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
Apollo 11 mission,NASA,1969,Space exploration,First humans walked on the Moon`,[`How should the exhibit be grouped?`,`What field would help visitors understand the item?`])];function Ve(e){let t=e.table.fields.map(e=>({...e,id:`${e.id}_${Date.now().toString(36)}`})),n=e.table.records.map(n=>r(t,Object.fromEntries(e.table.fields.map((e,r)=>[t[r].id,n.values[e.id]??``]))));return{...e.table,id:`table_${e.id}_${Date.now().toString(36)}`,fields:t,records:n}}var He=`drawsplat.language`,Ue=[{code:`en`,label:`English`,dir:`ltr`,htmlLang:`en`},{code:`es`,label:`Español`,dir:`ltr`,htmlLang:`es`},{code:`vi`,label:`Tiếng Việt`,dir:`ltr`,htmlLang:`vi`},{code:`ar`,label:`العربية`,dir:`rtl`,htmlLang:`ar`},{code:`zh`,label:`中文`,dir:`ltr`,htmlLang:`zh`},{code:`uh`,label:`हिन्दी / اردو`,dir:`ltr`,htmlLang:`hi`}],We={es:{New:`Nuevo`,"Save JSON":`Guardar JSON`,"Open JSON":`Abrir JSON`,"Export CSV":`Exportar CSV`,File:`Archivo`,Edit:`Editar`,Data:`Datos`,Layout:`Diseño`,Tools:`Herramientas`,View:`Vista`,Teacher:`Docente`,Help:`Ayuda`,Title:`Título`,Search:`Buscar`,In:`En`,"All fields":`Todos los campos`,Sort:`Ordenar`,"Choose field":`Elegir campo`,"New field":`Campo nuevo`,"Field name":`Nombre del campo`,Type:`Tipo`,"Add field":`Agregar campo`,"Add record":`Agregar registro`,Table:`Tabla`,Form:`Formulario`,Cards:`Tarjetas`,Gallery:`Galería`,Labels:`Etiquetas`,Report:`Informe`,"Upload image":`Subir imagen`,"No image yet":`Sin imagen todavía`},vi:{New:`Mới`,"Save JSON":`Lưu JSON`,"Open JSON":`Mở JSON`,"Export CSV":`Xuất CSV`,File:`Tệp`,Edit:`Sửa`,Data:`Dữ liệu`,Layout:`Bố cục`,Tools:`Công cụ`,View:`Xem`,Teacher:`Giáo viên`,Help:`Trợ giúp`,Title:`Tiêu đề`,Search:`Tìm`,Sort:`Sắp xếp`,Table:`Bảng`,Form:`Biểu mẫu`,Cards:`Thẻ`,Gallery:`Thư viện ảnh`,Labels:`Nhãn`,Report:`Báo cáo`},ar:{New:`جديد`,"Save JSON":`حفظ JSON`,"Open JSON":`فتح JSON`,"Export CSV":`تصدير CSV`,File:`ملف`,Edit:`تحرير`,Data:`بيانات`,Layout:`تخطيط`,Tools:`أدوات`,View:`عرض`,Teacher:`المعلم`,Help:`مساعدة`,Title:`العنوان`,Search:`بحث`,Sort:`فرز`,Table:`جدول`,Form:`نموذج`,Cards:`بطاقات`,Gallery:`معرض`,Labels:`ملصقات`,Report:`تقرير`},zh:{New:`新建`,"Save JSON":`保存 JSON`,"Open JSON":`打开 JSON`,"Export CSV":`导出 CSV`,File:`文件`,Edit:`编辑`,Data:`数据`,Layout:`布局`,Tools:`工具`,View:`视图`,Teacher:`教师`,Help:`帮助`,Title:`标题`,Search:`搜索`,Sort:`排序`,Table:`表格`,Form:`表单`,Cards:`卡片`,Gallery:`图库`,Labels:`标签`,Report:`报告`},uh:{New:`नया`,File:`फ़ाइल`,Edit:`संपादन`,Data:`डेटा`,Layout:`लेआउट`,Tools:`औज़ार`,View:`दृश्य`,Teacher:`शिक्षक`,Help:`सहायता`,Search:`खोज`,Table:`तालिका`,Form:`फ़ॉर्म`,Cards:`कार्ड`,Gallery:`गैलरी`,Labels:`लेबल`,Report:`रिपोर्ट`}},Ge=document.querySelector(`#app`);if(!Ge)throw Error(`ListSplatTM app root was not found.`);var _=Ge,v=me()??a(),y=v.schema.tables[0].id,b=v.schema.tables[0].records[0]?.id??``,x=`table`,Ke=`Saved locally`,S=``,C=`all`,w=[],T=null,E={match:`all`,rules:[]},D=[],qe=``,O=new Set,k=[],A=new Set,j=`none`,Je=``,M=`Tip: Start with one table, then add relationships when your project needs them.`,N=[],P=[],Ye=``,Xe=null,F=[],Ze=y,Qe=v.schema.tables[1]?.id??y,I=null,$e=``,L=tt();function R(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function et(e){let t=(e||``).toLowerCase();return t.startsWith(`es`)?`es`:t.startsWith(`vi`)?`vi`:t.startsWith(`ar`)?`ar`:t.startsWith(`zh`)?`zh`:t===`uh`||t.startsWith(`ur`)||t.startsWith(`hi`)?`uh`:`en`}function tt(){let e=new URLSearchParams(window.location.search);try{return et(e.get(`lang`)||localStorage.getItem(He)||navigator.language)}catch{return et(e.get(`lang`)||navigator.language)}}function nt(e){return Ue.map(({code:t,label:n})=>`<option value="${t}"${t===e?` selected`:``}>${n}</option>`).join(``)}function z(e){return L===`en`?e:We[L][e]??e}function rt(){let e=Ue.find(e=>e.code===L)??Ue[0];document.documentElement.lang=e.htmlLang,document.documentElement.dir=e.dir}function B(){return v.schema.tables.find(e=>e.id===y)??v.schema.tables[0]}function V(e){let t=je(e,{query:S,fieldId:C});return t=Fe(t,T),A.size>0&&(t=t.filter(e=>A.has(e.id))),Ne(t,w.filter(t=>e.fields.some(e=>e.id===t.fieldId)))}function it(){return!!S||!!(T&&T.rules.length)||A.size>0}function at(){S=``,T=null,A=new Set}function H(e){e.records.some(e=>e.id===b)||(b=e.records[0]?.id??``)}function U(e){v=e,H(B()),pe(v),Ke=`Saved locally`,Z()}function W(e){N=[{label:e,project:structuredClone(v)},...N].slice(0,25),P=[]}function ot(e,t){let n=`${e}:${t}`;Ye!==n&&(W(`edit ${B().fields.find(e=>e.id===t)?.name??`cell`}`),Ye=n,st())}function st(){let e=_.querySelector(`[data-action="undo-change"]`),t=_.querySelector(`[data-action="redo-change"]`);e&&(e.disabled=N.length===0),t&&(t.disabled=P.length===0)}function ct(e){v=e,y=v.schema.tables.some(e=>e.id===y)?y:v.schema.tables[0].id,H(B()),pe(v),Z()}function lt(){let e=N[0];if(!e){M=`Nothing to undo yet.`,Z();return}P=[{label:e.label,project:structuredClone(v)},...P].slice(0,25),N=N.slice(1),M=`Undid ${e.label}.`,ct(e.project)}function ut(){let e=P[0];if(!e){M=`Nothing to redo.`,Z();return}N=[{label:e.label,project:structuredClone(v)},...N].slice(0,25),P=P.slice(1),M=`Redid ${e.label}.`,ct(e.project)}function G(e){y=e.id,U(ie(v,e))}function dt(){document.querySelectorAll(`.menu[open]`).forEach(e=>{e.open=!1})}function ft(e){U({...v,updatedAt:new Date().toISOString(),metadata:{...v.metadata,title:e||`Untitled Database`}})}function pt(){he(`${v.metadata.title||`listsplat-project`}.listsplat.json`,JSON.stringify(v,null,2),`application/json`)}function mt(){he(`${B().name}.csv`,de(B()),`text/csv;charset=utf-8`)}function ht(){let e=B(),t=V(e),n=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${R(v.metadata.title)}</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{color:#5b21b6}</style></head>
<body><h1>${R(v.metadata.title)}</h1><p>${R(e.name)} report from ListSplatTM.</p>
<table><thead><tr>${e.fields.map(e=>`<th>${R(e.name)}</th>`).join(``)}</tr></thead>
<tbody>${t.map(t=>`<tr>${e.fields.map(n=>`<td>${R(q(e,t,n.id))}</td>`).join(``)}</tr>`).join(``)}</tbody></table></body></html>`;he(`${v.metadata.title||`listsplat-report`}.html`,n,`text/html;charset=utf-8`)}function gt(){let e=v.schema.tables.map(e=>{let t=Et(e),n=t.reduce((e,t)=>e+t.missing,0),r=t.reduce((e,t)=>e+t.duplicates,0);return`
        <section>
          <h2>${R(e.name)}</h2>
          <p>${e.records.length} records, ${e.fields.length} fields, ${n} missing values, ${r} duplicate values.</p>
          <table>
            <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th><th>Missing</th><th>Duplicates</th></tr></thead>
            <tbody>${e.fields.map(e=>{let n=t.find(t=>t.field.id===e.id);return`<tr><td>${R(e.name)}</td><td>${R(e.type)}</td><td>${e.required?`Yes`:`No`}</td><td>${R(e.description)}</td><td>${n?.missing??0}</td><td>${n?.duplicates??0}</td></tr>`}).join(``)}</tbody>
          </table>
        </section>
      `}).join(``),t=v.schema.relationships.length?`<ul>${v.schema.relationships.map(e=>`<li>${R(e.name)}: ${R(be(v,e))}</li>`).join(``)}</ul>`:`<p>No relationships have been created yet.</p>`,n=v.teacher.notes.length?`<ul>${v.teacher.notes.map(e=>`<li>${R(e)}</li>`).join(``)}</ul>`:`<p>No teacher notes yet.</p>`,r=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${R(v.metadata.title)} Project Packet</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937;line-height:1.5}h1,h2{color:#5b21b6}section{margin:0 0 28px}table{border-collapse:collapse;width:100%;margin-top:10px}th,td{border:1px solid #d8ccff;padding:8px;text-align:left;vertical-align:top}th{background:#f3edff;color:#4c1d95}.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.meta div{border:1px solid #d8ccff;border-radius:8px;padding:12px;background:#faf8ff}</style></head>
<body>
  <h1>${R(v.metadata.title||`ListSplat Project`)} Project Packet</h1>
  <div class="meta">
    <div><strong>Author</strong><br>${R(v.metadata.author||`Not set`)}</div>
    <div><strong>Class</strong><br>${R(v.metadata.className||`Not set`)}</div>
    <div><strong>Tables</strong><br>${v.schema.tables.length}</div>
    <div><strong>Relationships</strong><br>${v.schema.relationships.length}</div>
  </div>
  <section><h2>Teacher Notes</h2>${n}</section>
  <section><h2>Relationships</h2>${t}</section>
  ${e}
</body></html>`;he(`${v.metadata.title||`listsplat`}-project-packet.html`,r,`text/html;charset=utf-8`)}function _t(e){e.text().then(e=>{let t=JSON.parse(e);oe(t),y=t.schema.tables[0].id,b=t.schema.tables[0].records[0]?.id??``,U(t)}).catch(e=>{window.alert(e instanceof Error?e.message:`Could not open this ListSplatTM file.`)})}function vt(e){e.text().then(t=>{let n=le(e.name.replace(/\.csv$/i,``),t);I=n,$e=e.name;let r=B();k=n.fields.map(e=>{let t=n.records.slice(0,12).map(t=>String(t.values[e.id]??``)),i=r.fields.find(t=>t.name.trim().toLowerCase()===e.name.trim().toLowerCase());return{header:e.name,action:i?`existing`:`new`,type:wn(t),fieldId:i?.id??``}}),j=`csvImport`,M=`Previewing ${n.records.length} CSV record${n.records.length===1?``:`s`} from ${e.name}.`,Z()})}function yt(e){if(!I){j=`none`;return}Tn();let i=I;if(W(`CSV import`),e===`new`){let e=k.filter(e=>e.action!==`skip`).map((e,t)=>{let r=i.fields[k.indexOf(e)];return{field:n(e.header||`Field ${t+1}`,e.type),sourceFieldId:r.id}}),a=i.records.map(t=>r(e.map(e=>e.field),Object.fromEntries(e.map(e=>[e.field.id,u(t.values[e.sourceFieldId],e.field.type).value])))),o={id:t(`table`),name:i.name,fields:e.map(e=>e.field),records:a.length?a:[r(e.map(e=>e.field))]};y=o.id,b=o.records[0]?.id??``,I=null,at(),w=[],O=new Set,j=`none`,M=`Imported ${o.records.length} records from ${$e}.`,U({...v,updatedAt:new Date().toISOString(),schema:{...v.schema,tables:[...v.schema.tables,o]},layouts:[...v.layouts,{id:t(`layout`),name:`${o.name} Table`,tableId:o.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${o.name} Form`,tableId:o.id,mode:`form`,locked:!1}]});return}let a=B();k.forEach((e,t)=>{if(e.action===`new`){let r=n(e.header||`Field ${t+1}`,e.type);a={...a,fields:[...a.fields,r]},e.fieldId=r.id}});let o=new Map(a.fields.map(e=>[e.id,e])),s=i.records.map(e=>r(a.fields,Object.fromEntries(k.filter(e=>e.action!==`skip`&&e.fieldId&&o.has(e.fieldId)).map((t,n)=>{let r=i.fields[k.indexOf(t)],a=o.get(t.fieldId);return[t.fieldId,u(e.values[r.id],a.type,a.options).value]}))));I=null,j=`none`,M=`Appended ${s.length} CSV record${s.length===1?``:`s`} to ${a.name}.`,G({...a,records:[...a.records,...s]})}function bt(e){let t=Be.find(t=>t.id===e);if(!t)return;let n=Ve(t);W(`template load`),y=n.id,b=n.records[0]?.id??``,M=`Loaded ${t.title}.`,U({...v,metadata:{...v.metadata,title:t.title},schema:{...v.schema,tables:[...v.schema.tables,n]},teacher:{...v.teacher,notes:t.reflectionQuestions}})}function K(e,t){return`
    <details class="menu">
      <summary>${R(z(e))}</summary>
      <div class="menu-panel">
        ${t.map(([e,t])=>`<button type="button" data-action="${e}">${R(z(t))}</button>`).join(``)}
      </div>
    </details>
  `}function xt(e=`text`){return[[`text`,`Short text`],[`longText`,`Long text`],[`number`,`Number`],[`currency`,`Currency`],[`percent`,`Percent`],[`date`,`Date`],[`checkbox`,`Checkbox`],[`rating`,`Rating`],[`choice`,`Choice`],[`image`,`Image`],[`link`,`Link`],[`calculation`,`Calculation`],[`autoNumber`,`Auto number`],[`createdAt`,`Created time`],[`updatedAt`,`Updated time`]].map(([t,n])=>`<option value="${t}" ${e===t?`selected`:``}>${n}</option>`).join(``)}function q(e,t,n){let r=e.fields.find(e=>e.id===n);return r?.type===`calculation`&&r.formula?Ae(r.formula,e,t,v):t.values[n]??``}function St(e,t){if(t===``||t==null)return``;if(!e)return String(t);let n=typeof t==`number`?t:Number(t);return e.type===`currency`&&Number.isFinite(n)?n.toLocaleString(void 0,{style:`currency`,currency:`USD`}):e.type===`percent`&&Number.isFinite(n)?`${n.toLocaleString()}%`:e.type===`number`&&Number.isFinite(n)?n.toLocaleString():e.type===`checkbox`?t===!0||t===`true`?`Yes`:`No`:String(t)}function J(){return v.layouts.find(e=>e.tableId===y&&e.mode===x)}function Ct(e){return!!e}function Y(e){let t=new Set(J()?.hiddenFieldIds??[]);return X(e).filter(e=>!t.has(e.id))}function X(e){let t=J()?.fieldOrder??e.fields.map(e=>e.id),n=new Map(e.fields.map(e=>[e.id,e]));return[...t.map(e=>n.get(e)).filter(Ct),...e.fields.filter(e=>!t.includes(e.id))].filter(e=>e&&!e.hidden)}function wt(e){return e.fields.filter(e=>e.type===`calculation`)}function Tt(e){return wt(e).reduce((t,n)=>n.formula?t+e.records.filter(t=>String(Ae(n.formula??``,e,t,v)).startsWith(`Formula error:`)).length:t,0)}function Et(e){return e.fields.filter(e=>!e.hidden&&![`image`,`autoNumber`,`createdAt`,`updatedAt`,`calculation`].includes(e.type)).map(t=>({field:t,missing:Le(e,t.id).length,duplicates:Ie(e,t.id).length}))}function Dt(e){return Y(e).filter(e=>e.type===`image`)}function Ot(e,t){let n=Dt(e)[0];return n?String(q(e,t,n.id)??``):``}function kt(e){let t=J();t&&U({...v,updatedAt:new Date().toISOString(),layouts:v.layouts.map(n=>n.id===t.id?{...n,...e}:n)})}function At(e,t){let n=e.fields.find(e=>!e.hidden)??e.fields[0],r=n?q(e,t,n.id):``;return String(r||`Untitled record`)}function jt(e,t,n,r){let i=e.fields.find(e=>e.id===n),a=q(e,t,n),o=`aria-label="${R(i?.name??`Field`)}, record ${r+1}" data-record-id="${t.id}" data-field-id="${n}"`,s=i?.required&&(a===``||a==null)?`cell-input cell-required-empty`:`cell-input`;if(i?.type===`checkbox`)return`<input class="cell-checkbox" type="checkbox" ${o} ${a===!0||a===`true`?`checked`:``}>`;if(i?.type===`link`){let e=String(a??``),t=/^https?:\/\//i.test(e)?e:e?`https://${e}`:``;return`<div class="link-cell"><input class="${s}" type="url" ${o} value="${R(e)}" placeholder="https://…">${t?`<a class="link-open" href="${R(t)}" target="_blank" rel="noopener" title="Open link" aria-label="Open link">↗</a>`:``}</div>`}if(i?.type===`image`){let e=String(a??``);return`
      <div class="image-cell" tabindex="0" role="button" title="Click here and paste an image, or use Upload image." ${o}>
        ${e?`<img src="${R(e)}" alt="">`:`<span>${R(z(`No image yet`))}</span>`}
        <small>Paste an image here or upload one.</small>
        <label class="image-upload-label">
          ${R(z(`Upload image`))}
          <input class="image-input" type="file" accept="image/*" ${o}>
        </label>
      </div>
    `}if(i?.type===`rating`)return`<input class="${s}" type="number" min="0" max="5" step="1" ${o} value="${R(a)}">`;if(i?.type===`choice`){let e=i.options?.length?i.options:[`Yes`,`No`];return`<select class="${s}" ${o}><option value=""${a===``?` selected`:``}>—</option>${e.map(e=>`<option value="${R(e)}" ${String(a)===e?`selected`:``}>${R(e)}</option>`).join(``)}</select>`}if(i?.type===`autoNumber`||i?.type===`createdAt`||i?.type===`updatedAt`)return`<output class="calc-output">${R(a)}</output>`;if(i?.type===`longText`)return`<textarea class="${s}" ${o}>${R(a)}</textarea>`;if(i?.type===`date`)return`<input class="${s}" type="date" ${o} value="${R(a)}">`;if(i?.type===`number`||i?.type===`currency`||i?.type===`percent`){let e=i.type===`currency`?`<span class="cell-affix">$</span>`:``,t=i.type===`percent`?`<span class="cell-affix">%</span>`:``;return`<span class="num-cell">${e}<input class="${s}" type="number" step="any" ${o} value="${R(a)}">${t}</span>`}return i?.type===`calculation`?`<output class="calc-output">${R(a)}</output>`:`<input class="${s}" ${o} value="${R(a)}">`}function Mt(e){return`
    <div class="table-tabs">
      ${v.schema.tables.map(t=>`<button type="button" class="table-tab ${t.id===e.id?`active`:``}" data-table-id="${t.id}">${R(t.name)}</button>`).join(``)}
    </div>
  `}function Nt(e,t){if(t.length===0){let e=it();return`
      <div class="data-grid-wrap">
        <div class="empty-state">
          <h3>${R(z(e?`No records match your find`:`No records yet`))}</h3>
          <p>${R(z(e?`Try a different search, or show all records.`:`Add your first record to start building this database.`))}</p>
          <button type="button" class="button primary" data-action="${e?`clear-find`:`add-record`}">${e?R(z(`Show all records`)):`+ ${R(z(`Add first record`))}`}</button>
        </div>
      </div>
    `}let n=Y(e);return`
    <div class="data-grid-wrap">
      <table class="data-grid">
        <thead>
          <tr>
            <th class="select-col"><input type="checkbox" data-select-all aria-label="Select all records" ${t.length>0&&t.every(e=>O.has(e.id))?`checked`:``}></th>
            <th class="row-num-col">#</th>
            ${n.map(e=>`
                  <th class="col-head" data-col-field="${e.id}" draggable="true" style="${Pt(e.id)}">
                    <button type="button" class="field-button" data-field-settings="${e.id}">
                      ${R(e.name)}${e.required?`<span class="req" title="Required field" aria-label="required">*</span>`:``}<br><small>${R(e.type)}</small>
                    </button>
                    <span class="col-resize" data-col-resize="${e.id}" title="Drag to resize" aria-hidden="true"></span>
                  </th>
                `).join(``)}
            <th>Record</th>
          </tr>
        </thead>
        <tbody>
          ${t.map((t,r)=>`
                <tr class="${t.id===b?`active-row`:``}${O.has(t.id)?` selected-row`:``}" data-record-row="${t.id}">
                  <td class="select-col"><input type="checkbox" data-select-row="${t.id}" aria-label="Select record ${r+1}" ${O.has(t.id)?`checked`:``}></td>
                  <td class="row-num-col"><button type="button" class="row-button" data-select-record="${t.id}">${r+1}</button></td>
                  ${n.map(n=>`<td style="${Pt(n.id)}">${jt(e,t,n.id,r)}</td>`).join(``)}
                  <td class="record-actions">
                    <button type="button" data-action="duplicate-record" data-record-action-id="${t.id}">Copy</button>
                    <button type="button" data-action="delete-record" data-record-action-id="${t.id}">Delete</button>
                  </td>
                </tr>
              `).join(``)}
        </tbody>
      </table>
    </div>
  `}function Pt(e){let t=J()?.columnWidths?.[e];return t?`width:${t}px;min-width:${t}px;`:``}function Ft(e){let t=e.records.find(e=>e.id===b)??e.records[0];if(!t)return`<div class="empty-panel">Add a record to use form view.</div>`;let n=v.schema.relationships.filter(t=>t.fromTableId===e.id).map(n=>{let r=v.schema.tables.find(e=>e.id===n.toTableId),i=r?ye(n,e,t,r):[];return`
        <section class="related-records">
          <h3>${R(n.name)}</h3>
          <p>${i.length} related record${i.length===1?``:`s`} from ${R(r?.name??`another table`)}</p>
          ${i.length?`<div class="related-grid">${i.slice(0,6).map(e=>`
                      <article>
                        <strong>${R(At(r,e))}</strong>
                        ${r.fields.filter(e=>!e.hidden).slice(0,3).map(t=>`<span>${R(t.name)}: ${R(q(r,e,t.id))}</span>`).join(``)}
                      </article>
                    `).join(``)}</div>`:`<p>No matches yet. Make sure the match fields use the same value.</p>`}
        </section>
      `}).join(``);return`
    <div class="form-view">
      <div class="form-nav">
        ${e.records.map((e,n)=>`<button type="button" class="${e.id===t.id?`active`:``}" data-select-record="${e.id}">Record ${n+1}</button>`).join(``)}
      </div>
      <div class="record-form">
        ${Y(e).map((n,r)=>`
              <label>
                <span>${R(n.name)}</span>
                ${jt(e,t,n.id,r)}
                ${n.description?`<small>${R(n.description)}</small>`:``}
              </label>
            `).join(``)}
        ${n}
      </div>
    </div>
  `}function It(e,t){let n=(t,n)=>{let r=q(e,n,t.id);if(t.type===`image`){let e=String(r??``);return`
        <figure class="card-image-field">
          ${e?`<img src="${R(e)}" alt="">`:`<span>No image yet</span>`}
          <figcaption>${R(t.name)}</figcaption>
        </figure>
      `}if(t.type===`link`&&String(r??``)){let e=String(r),n=/^https?:\/\//i.test(e)?e:`https://${e}`;return`<p><strong>${R(t.name)}</strong><a href="${R(n)}" target="_blank" rel="noopener">${R(e)}</a></p>`}return`<p><strong>${R(t.name)}</strong><span>${R(St(t,r))}</span></p>`};return`
    <div class="cards-view ${x===`gallery`?`gallery-view`:``}">
      ${t.map(t=>{let r=Ot(e,t);return`
            <article class="record-card" data-select-record="${t.id}">
              ${x===`gallery`?`<div class="gallery-image">${r?`<img src="${R(r)}" alt="">`:`<span>Add an image field, then upload a picture.</span>`}</div>`:``}
              ${Y(e).filter(e=>x!==`gallery`||e.type!==`image`).slice(0,x===`gallery`?4:8).map(e=>n(e,t)).join(``)}
            </article>
          `}).join(``)}
    </div>
  `}function Lt(e,t){return`
    <div class="labels-view">
      ${t.map(t=>`
            <article class="print-label">
              ${Y(e).slice(0,4).map(n=>`<p><strong>${R(n.name)}:</strong> ${R(St(n,q(e,t,n.id)))}</p>`).join(``)}
            </article>
          `).join(``)}
    </div>
  `}function Rt(e,t){let n=Se(e);return`
    <div class="report-view">
      <header>
        <h2>${R(v.metadata.title)}</h2>
        <p>${R(e.name)} report. ${t.length} record${t.length===1?``:`s`} shown.</p>
      </header>
      ${Nt(e,t)}
      ${n.length?`<section class="summary-strip">${n.map(e=>`<div><strong>${R(e.fieldName)}</strong><span>Sum ${e.sum.toLocaleString()} | Avg ${e.average.toFixed(2)}</span></div>`).join(``)}</section>`:`<p class="empty-panel">Add a number, currency, or percent field to see summaries.</p>`}
    </div>
  `}function zt(e){let t=V(e),n={table:`Table: spreadsheet-like rows and columns for fast data entry.`,form:`Form: focus on one record at a time.`,cards:`Cards: compact text-first record cards for browsing.`,gallery:`Gallery: image-first cards for collections and exhibits.`,labels:`Labels: printable small cards or shelf labels.`,report:`Report: printable table with title and summaries.`},r=x===`form`?Ft(e):x===`cards`||x===`gallery`?It(e,t):x===`labels`?Lt(e,t):x===`report`?Rt(e,t):Nt(e,t);return`
    <section class="database-panel" aria-label="Database table">
      ${Mt(e)}
      <div class="view-tabs" role="group" aria-label="Layout modes">
        ${[`table`,`form`,`cards`,`gallery`,`labels`,`report`].map(e=>`<button type="button" class="${x===e?`active`:``}" data-view-mode="${e}" title="${R(n[e])}" aria-label="${R(n[e])}">${R(z(e[0].toUpperCase()+e.slice(1)))}</button>`).join(``)}
      </div>
      ${Bt()}
      ${Vt(e)}
      ${r}
    </section>
  `}function Bt(){let e=[];if(S&&e.push(`<span class="chip">Search: “${R(S)}”</span>`),T&&T.rules.length){let t=T.match===`all`?` AND `:` OR `,n=T.rules.map(e=>`${dn(e.fieldId)} ${fn(e.operator)}${e.operator===`isEmpty`||e.operator===`isNotEmpty`?``:` `+e.value}${e.operator===`between`?`–`+(e.value2??``):``}`).join(t);e.push(`<button type="button" class="chip chip-button" data-action="find" title="Edit find">Find: ${R(n)}</button>`)}return A.size&&e.push(`<span class="chip">${A.size} highlighted</span>`),w.filter(e=>B().fields.some(t=>t.id===e.fieldId)).forEach(t=>{e.push(`<button type="button" class="chip chip-button" data-action="sort-dialog" title="Edit sort">Sort: ${R(dn(t.fieldId))} ${t.direction===`asc`?`↑`:`↓`}</button>`)}),e.length?`<div class="filter-chips">${e.join(``)}${it()?`<button type="button" class="chip chip-clear" data-action="clear-find">Clear find</button>`:``}${w.length?`<button type="button" class="chip chip-clear" data-action="sort-dialog">Edit sort</button>`:``}</div>`:``}function Vt(e){let t=Q(e).length;return t===0||x===`form`?``:`
    <div class="bulk-bar" role="group" aria-label="Bulk actions">
      <strong>${t} selected</strong>
      <button type="button" class="button" data-action="bulk-fill">Fill a field…</button>
      <button type="button" class="button" data-action="bulk-duplicate">Duplicate</button>
      <button type="button" class="button danger" data-action="bulk-delete">Delete</button>
      <button type="button" class="button ghost" data-action="bulk-clear">Clear selection</button>
    </div>
  `}function Ht(e){let t=Se(e),n=e.records.find(e=>e.id===b)??e.records[0],r=n?v.schema.relationships.filter(t=>t.fromTableId===e.id).map(t=>{let r=v.schema.tables.find(e=>e.id===t.toTableId),i=r?ye(t,e,n,r).length:0;return`
            <div class="template-card">
              <strong>${R(t.name)}</strong>
              <span>${i} related record${i===1?``:`s`}</span>
              <p>${R(be(v,t))}</p>
            </div>
          `}).join(``):``;return`
    <aside class="teacher-panel" aria-label="Teacher tools and database stats">
      <h2>Database Check</h2>
      <div class="stat-grid">
        <div class="stat-card"><strong>${V(e).length}</strong> shown</div>
        <div class="stat-card"><strong>${e.records.length}</strong> records</div>
        <div class="stat-card"><strong>${e.fields.length}</strong> fields</div>
        <div class="stat-card"><strong>${v.schema.tables.length}</strong> tables</div>
      </div>
      ${t.map(e=>`
            <div class="template-card">
              <strong>${R(e.fieldName)} summary</strong>
              <span>Sum: ${e.sum.toLocaleString()}</span>
              <span>Average: ${e.average.toFixed(2)}</span>
            </div>
          `).join(``)}
      ${r?`<h3>Related Records</h3>${r}`:``}
      <h3>Template Starters</h3>
      ${Be.map(e=>`
            <div class="template-card">
              <strong>${R(e.title)}</strong>
              <span>${R(e.gradeBand)}</span>
              <p>${R(e.goal)}</p>
              <button type="button" data-template-id="${e.id}">Use template</button>
            </div>
          `).join(``)}
    </aside>
  `}function Ut(e,t,n){if(n===t.type||[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(n))return``;let r=(_.querySelector(`[data-field-options]`)?.value??t.options?.join(`, `)??``).split(`,`).map(e=>e.trim()).filter(Boolean),i=e.records.filter(e=>String(e.values[t.id]??``).trim()!==``).slice(0,4).map(e=>{let i=String(e.values[t.id]??``),a=u(e.values[t.id],n,r),o=a.value===!0?`Yes`:a.value===!1?`No`:String(a.value??``);return`<li><span>${R(i)}</span> → <span class="${a.lost?`preview-lost`:``}">${a.lost?`cleared`:R(o||`(empty)`)}</span></li>`}),a=e.records.filter(e=>String(e.values[t.id]??``).trim()===``?!1:u(e.values[t.id],n,r).lost).length;return`
    <div class="type-preview">
      <strong>Change ${R(t.type)} → ${R(n)}</strong>
      ${i.length?`<ul>${i.join(``)}</ul>`:`<p>No values to convert yet.</p>`}
      ${a?`<p class="preview-warn">${a} value${a===1?``:`s`} cannot convert and will be cleared.</p>`:`<p>All values convert cleanly.</p>`}
    </div>
  `}function Wt(e){let t=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${R(e.name)}</option>`).join(``),n=E.rules.map((e,n)=>{let r=un.find(t=>t.value===e.operator)??un[0];return`
        <div class="find-rule" data-rule-index="${n}">
          <select data-find-field aria-label="Field">${t(e.fieldId)}</select>
          <select data-find-op aria-label="Condition">${un.map(t=>`<option value="${t.value}" ${t.value===e.operator?`selected`:``}>${R(t.label)}</option>`).join(``)}</select>
          <input data-find-value type="text" value="${R(e.value)}" placeholder="value" ${r.needsValue?``:`hidden`}>
          <input data-find-value2 type="text" value="${R(e.value2??``)}" placeholder="and" ${r.needsSecond?``:`hidden`}>
          <button type="button" class="button ghost" data-action="find-remove-rule">Remove</button>
        </div>
      `}).join(``);return`
    <div class="modal-backdrop">
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Advanced find">
        <h2>Find records</h2>
        <label>Match <select data-find-match>
          <option value="all" ${E.match===`all`?`selected`:``}>all conditions (AND)</option>
          <option value="any" ${E.match===`any`?`selected`:``}>any condition (OR)</option>
        </select></label>
        <div class="find-rules">${n||`<p>Add a condition to start.</p>`}</div>
        <button type="button" class="button" data-action="find-add-rule">+ Add condition</button>
        <div class="modal-actions">
          <button type="button" class="button primary" data-action="apply-find">Apply find</button>
          <button type="button" data-action="clear-find">Show all</button>
          <button type="button" data-action="close-dialog">Cancel</button>
        </div>
      </section>
    </div>
  `}function Gt(e){let t=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${R(e.name)}</option>`).join(``);return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Sort records">
        <h2>Sort records</h2>
        <div class="sort-levels">${D.map((e,n)=>`
        <div class="sort-level" data-level-index="${n}">
          <span class="sort-level-num">${n===0?`Sort by`:`then by`}</span>
          <select data-sort-level-field aria-label="Sort field">${t(e.fieldId)}</select>
          <select data-sort-level-dir aria-label="Direction">
            <option value="asc" ${e.direction===`asc`?`selected`:``}>A → Z / low → high</option>
            <option value="desc" ${e.direction===`desc`?`selected`:``}>Z → A / high → low</option>
          </select>
          <button type="button" class="button ghost" data-action="sort-remove-level">Remove</button>
        </div>
      `).join(``)||`<p>Add a sort level to order records.</p>`}</div>
        <button type="button" class="button" data-action="sort-add-level">+ Add sort level</button>
        <div class="modal-actions">
          <button type="button" class="button primary" data-action="apply-sort">Apply sort</button>
          <button type="button" data-action="clear-sort">Clear sort</button>
          <button type="button" data-action="close-dialog">Cancel</button>
        </div>
      </section>
    </div>
  `}function Kt(){let e=_n();return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Saved views">
        <h2>Saved views</h2>
        <p>A view remembers the current table, layout, search, find, and sort. Save it, then reopen it any time.</p>
        <div class="saved-views">
          ${e.length?e.map(e=>`
                      <div class="saved-view" data-view-id="${e.id}">
                        <div><strong>${R(e.name)}</strong><span>${R(e.mode)}${e.sortKeys.length?` · sorted`:``}${e.find&&e.find.rules.length?` · found`:``}</span></div>
                        <button type="button" class="button" data-action="apply-view" data-view-id="${e.id}">Open</button>
                        <button type="button" class="button ghost" data-action="delete-view" data-view-id="${e.id}">Delete</button>
                      </div>
                    `).join(``):`<p>No saved views yet.</p>`}
        </div>
        <label>Name this view <input data-view-name placeholder="e.g. Needs review"></label>
        <div class="modal-actions">
          <button type="button" class="button primary" data-action="save-view">Save current view</button>
          <button type="button" data-action="close-dialog">Close</button>
        </div>
      </section>
    </div>
  `}function qt(e){let t=Q(e).length;return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Fill a field">
        <h2>Fill a field</h2>
        <p>Set the same value in ${t} selected record${t===1?``:`s`}.</p>
        <label>Field <select data-bulk-field>${e.fields.filter(e=>![`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(e.type)).map(e=>`<option value="${e.id}">${R(e.name)}</option>`).join(``)}</select></label>
        <label>Value <input data-bulk-value type="text" placeholder="value to fill in"></label>
        <div class="modal-actions">
          <button type="button" class="button primary" data-action="apply-bulk-fill">Fill selected</button>
          <button type="button" data-action="close-dialog">Cancel</button>
        </div>
      </section>
    </div>
  `}function Jt(e){if(j===`none`)return``;if(j===`find`)return Wt(e);if(j===`sort`)return Gt(e);if(j===`views`)return Kt();if(j===`bulkFill`)return qt(e);if(j===`replace`){let t=F.slice(0,8);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Replace values">
          <h2>Replace values</h2>
          <label>Find <input data-replace-find placeholder="Text to find"></label>
          <label>Replace with <input data-replace-with placeholder="New text"></label>
          <label>Field <select data-replace-field>${e.fields.map(e=>`<option value="${e.id}">${R(e.name)}</option>`).join(``)}</select></label>
          <label class="check-row"><input type="checkbox" data-replace-case-sensitive> Case-sensitive</label>
          <label class="check-row"><input type="checkbox" data-replace-whole-word> Whole word only</label>
          <p>Replacement applies to the current found set when search is active. Preview first, then apply. The last replace can be undone from Edit.</p>
          ${F.length?`<div class="replace-preview"><strong>${F.length} change${F.length===1?``:`s`} ready</strong>${t.map(t=>{let n=e.records.find(e=>e.id===t.recordId),r=e.fields.find(e=>e.id===t.fieldId);return`<p><span>${R(n?At(e,n):`Record`)} / ${R(r?.name??`Field`)}</span><del>${R(t.before)}</del><ins>${R(t.after)}</ins></p>`}).join(``)}</div>`:``}
          <div class="modal-actions">
            <button type="button" data-action="preview-replace">Preview</button>
            <button type="button" data-action="run-replace" ${F.length?``:`disabled`}>Apply Replace</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(j===`field`){let t=e.fields.find(e=>e.id===Je)??e.fields[0],n=qe||t.type;return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Field settings">
          <h2>Field settings</h2>
          <label>Name <input data-field-name value="${R(t.name)}"></label>
          <label>Type <select data-field-type>${xt(n)}</select></label>
          ${Ut(e,t,n)}
          <label>Description <textarea data-field-description>${R(t.description)}</textarea></label>
          <label>Choice options <input data-field-options value="${R(t.options?.join(`, `)??``)}" placeholder="Yes, No, Maybe"></label>
          <label class="check-row"><input type="checkbox" data-field-required ${t.required?`checked`:``}> Required field</label>
          <label class="check-row"><input type="checkbox" data-field-hidden ${t.hidden?`checked`:``}> Hide field</label>
          <label>Calculation formula <input data-field-formula value="${R(t.formula??``)}" placeholder='JOIN(First Name, " ", Last Name)'></label>
          <p>Try <code>FIELD(Animal)</code>, <code>JOIN(Animal, " lives in ", Habitat)</code>, <code>UPPER(Animal)</code>, <code>ADD(Score, Bonus)</code>, <code>AVERAGE(Score)</code>, or <code>LOOKUP("Book reviews", Rating)</code>.</p>
          <div class="modal-actions">
            <button type="button" data-action="save-field-settings">Save field</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(j===`layout`){let t=J(),n=X(e),r=new Set(t?.hiddenFieldIds??[]);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Layout designer">
          <h2>Layout designer</h2>
          <p>Arrange and choose fields for the current ${R(x)} view. Locked layouts can still be viewed, but students should not change them.</p>
          <label class="check-row"><input type="checkbox" data-layout-locked ${t?.locked?`checked`:``}> Lock this layout</label>
          <div class="layout-field-list">
            ${n.map((e,t)=>`
                  <div class="layout-field-row">
                    <label class="check-row"><input type="checkbox" data-layout-field-visible="${e.id}" ${r.has(e.id)?``:`checked`}> <strong>${R(e.name)}</strong></label>
                    <span>${R(e.type)}</span>
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
    `}if(j===`csvImport`&&I){let t=I.records.slice(0,4),n=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${R(e.name)}</option>`).join(``),r=k.map((e,t)=>`
          <div class="csv-map-row" data-map-index="${t}">
            <span class="csv-map-header">${R(e.header||`Column ${t+1}`)}</span>
            <select data-map-action aria-label="What to do with ${R(e.header)}">
              <option value="new" ${e.action===`new`?`selected`:``}>New field</option>
              <option value="existing" ${e.action===`existing`?`selected`:``}>Existing field</option>
              <option value="skip" ${e.action===`skip`?`selected`:``}>Skip</option>
            </select>
            <select data-map-type aria-label="Type for ${R(e.header)}" ${e.action===`new`?``:`hidden`}>${xt(e.type)}</select>
            <select data-map-existing aria-label="Existing field for ${R(e.header)}" ${e.action===`existing`?``:`hidden`}>${n(e.fieldId)}</select>
          </div>
        `).join(``);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="CSV import">
          <h2>Import CSV</h2>
          <p>${R($e)} has ${I.fields.length} column${I.fields.length===1?``:`s`} and ${I.records.length} row${I.records.length===1?``:`s`}. Choose how each column maps.</p>
          <div class="csv-map">${r}</div>
          <div class="preview-table-wrap">
            <table class="preview-table">
              <thead>
                <tr>${I.fields.map(e=>`<th>${R(e.name)}</th>`).join(``)}</tr>
              </thead>
              <tbody>
                ${t.map(e=>`<tr>${I.fields.map(t=>`<td>${R(e.values[t.id])}</td>`).join(``)}</tr>`).join(``)}
              </tbody>
            </table>
          </div>
          <p><strong>Create new table</strong> builds a fresh table from the columns you keep. <strong>Append</strong> adds the rows to ${R(e.name)} using your field mapping.</p>
          <div class="modal-actions">
            <button type="button" class="button primary" data-action="apply-csv-new">Create new table</button>
            <button type="button" class="button" data-action="apply-csv-append">Append to ${R(e.name)}</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(j===`projectIdeas`)return`
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
    `;if(j===`relationship`){let t=v.schema.tables.find(e=>e.id===Ze)??e,n=v.schema.tables.find(e=>e.id===Qe)??e,r=t.fields.map(e=>`<option value="${t.id}:${e.id}">${R(e.name)}</option>`).join(``),i=n.fields.map(e=>`<option value="${n.id}:${e.id}">${R(e.name)}</option>`).join(``);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Relationships">
          <h2>Relationships</h2>
          <p>Create a simple one-to-many relationship by matching values in two fields, such as Books:Title to Reviews:Book.</p>
          <label>Name <input data-relationship-name placeholder="Books to reviews"></label>
          <label>Parent table <select data-relationship-from-table>${v.schema.tables.map(e=>`<option value="${e.id}" ${e.id===t.id?`selected`:``}>${R(e.name)}</option>`).join(``)}</select></label>
          <label>Parent match field <select data-relationship-from-field>${r}</select></label>
          <label>Related table <select data-relationship-to-table>${v.schema.tables.map(e=>`<option value="${e.id}" ${e.id===n.id?`selected`:``}>${R(e.name)}</option>`).join(``)}</select></label>
          <label>Related match field <select data-relationship-to-field>${i}</select></label>
          ${v.schema.relationships.length?`<div class="relationship-list">${v.schema.relationships.map(e=>`<p><strong>${R(e.name)}</strong><br>${R(be(v,e))}</p>`).join(``)}</div>`:`<p>No relationships yet. Add a second table first for the most useful results.</p>`}
          <div class="modal-actions">
            <button type="button" data-action="create-relationship">Create relationship</button>
            <button type="button" data-action="close-dialog">Close</button>
          </div>
        </section>
      </div>
    `}if(j===`functions`){let t=e.fields.filter(e=>![`image`,`createdAt`,`updatedAt`].includes(e.type)),n=t.find(e=>[`text`,`longText`,`choice`].includes(e.type))??t[0],r=t.find(e=>[`number`,`currency`,`percent`,`rating`].includes(e.type))??n,i=n?.name??`Field`,a=r?.name??`Score`;return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Functions">
          <h2>Calculation functions</h2>
          <p>Use a calculation field when students need a result made from other fields. Formulas are simple, offline, and do not run custom code.</p>
          <div class="formula-grid">
            <div>
              <strong>Text</strong>
              <code>FIELD(${R(i)})</code>
              <code>JOIN(${R(i)}, " report")</code>
              <code>UPPER(${R(i)})</code>
              <code>TITLECASE(${R(i)})</code>
              <code>CONTAINS(${R(i)}, "a")</code>
            </div>
            <div>
              <strong>Numbers</strong>
              <code>ADD(${R(a)}, "5")</code>
              <code>SUBTRACT(${R(a)}, "1")</code>
              <code>MULTIPLY(${R(a)}, "2")</code>
              <code>DIVIDE(${R(a)}, "2")</code>
              <code>ROUND(${R(a)}, "1")</code>
            </div>
            <div>
              <strong>Whole table</strong>
              <code>SUM(${R(a)})</code>
              <code>AVERAGE(${R(a)})</code>
              <code>MIN(${R(a)})</code>
              <code>MAX(${R(a)})</code>
              <code>COUNT(${R(a)})</code>
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
    `}if(j===`quality`){let t=Et(e),n=Tt(e);return`
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
                          <span><strong>${R(e.name)}</strong><small>${R(e.type)}</small></span>
                          <button type="button" data-quality-kind="missing" data-quality-field-id="${e.id}" ${t?``:`disabled`}>${t}</button>
                          <button type="button" data-quality-kind="duplicates" data-quality-field-id="${e.id}" ${n?``:`disabled`}>${n}</button>
                        </div>
                      `).join(``):`<p class="empty-panel">No editable data fields are available yet.</p>`}
          </div>
          <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
        </section>
      </div>
    `}return j===`teacherNotes`?`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Teacher notes">
          <h2>Teacher notes</h2>
          <p>Add one note per line. These notes are saved in the .listsplat.json file and included in the project packet.</p>
          <label>Notes <textarea data-teacher-notes rows="8" placeholder="Add setup directions, reflection questions, or grading reminders.">${R(v.teacher.notes.join(`
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
  `}function Z(){let e=B();H(e),rt();let t=v.teacher.studentView;if(_.innerHTML=`
    <header class="app-header">
      <a class="brand" href="../../pages/splatworks.html" aria-label="SplatWorks home">
        <img class="brand-icon" src="listsplat_icon.png" alt="">
        <span>
          <strong>ListSplat<sup>TM</sup></strong>
          <small>SplatWorks<sup>TM</sup> Database Studio</small>
        </span>
      </a>
      <div class="quick-actions">
        <button type="button" class="button" data-action="undo-change"${N.length?``:` disabled`} title="Undo (Ctrl+Z)" aria-label="Undo">↶ ${R(z(`Undo`))}</button>
        <button type="button" class="button" data-action="redo-change"${P.length?``:` disabled`} title="Redo (Ctrl+Y)" aria-label="Redo">↷ ${R(z(`Redo`))}</button>
        <button type="button" class="button primary" data-action="new">${R(z(`New`))}</button>
        <button type="button" class="button primary" data-action="save-json">${R(z(`Save JSON`))}</button>
        <button type="button" class="button primary" data-action="open-json">${R(z(`Open JSON`))}</button>
        <button type="button" class="button primary" data-action="export-csv">${R(z(`Export CSV`))}</button>
        <select id="languageSwitcher" class="lang-switcher" aria-label="Language">${nt(L)}</select>
      </div>
    </header>
    <main class="listsplat-app">
      <nav class="menu-bar" aria-label="Application menu">
        ${K(`File`,[[`new`,`New database`],[`save-json`,`Save .listsplat.json`],[`open-json`,`Open .listsplat.json`],[`import-csv`,`Import CSV`],[`export-csv`,`Export CSV`],[`export-report`,`Export report HTML`],[`print`,`Print`]])}
        ${K(`Edit`,[[`undo-change`,`Undo last change`],[`redo-change`,`Redo last change`],[`add-record`,`Add record`],[`add-field`,`Add field`],[`find`,`Find records`],[`replace`,`Replace values`]])}
        ${K(`Data`,[[`add-table`,`New table`],[`sort`,`Sort records`],[`missing`,`Find missing values`],[`duplicates`,`Find duplicates`],[`clear-find`,`Show all records`]])}
        ${K(`Layout`,[[`layout-designer`,`Design current layout`],[`table-view`,`Table view`],[`form-view`,`Form view`],[`cards-view`,`Card view`],[`gallery-view`,`Gallery view`],[`labels-view`,`Label view`],[`report-view`,`Report view`]])}
        ${K(`Tools`,[[`functions`,`Functions`],[`relationships`,`Relationships`],[`quality`,`Data quality check`]])}
        ${K(`View`,[[`student-view`,t?`Exit student view`:`Student view`],[`teacher-notes`,`Teacher notes`]])}
        <span class="menu-spacer"></span>
        ${t?``:K(`Teacher`,[[`templates`,`Template Library`],[`project-ideas`,`Project Ideas`],[`lock-layout`,`Lock Layout`],[`project-packet`,`Print Project Packet`]])}
        ${K(`Help`,[[`help-start`,`Start a database`],[`help-csv`,`Import and export CSV`],[`help-layouts`,`Forms and reports`],[`help-privacy`,`Privacy and saving`]])}
      </nav>
      <section class="toolbar" aria-label="Database toolbar">
        <label>${R(z(`Title`))} <input data-project-title value="${R(v.metadata.title)}"></label>
        <label>${R(z(`Search`))} <input data-search value="${R(S)}" placeholder="${R(z(`Find records`))}"></label>
        <label>${R(z(`In`))} <select data-search-field><option value="all">${R(z(`All fields`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${C===e.id?`selected`:``}>${R(e.name)}</option>`).join(``)}</select></label>
        <label>${R(z(`Sort`))} <select data-sort-field><option value="">${R(z(`Choose field`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${w[0]?.fieldId===e.id?`selected`:``}>${R(e.name)}</option>`).join(``)}</select></label>
        <button type="button" data-action="toggle-sort" title="${R(z(`Sort direction`))}">${w[0]?.direction===`desc`?`Z-A`:`A-Z`}</button>
        <button type="button" data-action="sort-dialog" title="${R(z(`Sort by more than one field`))}">${R(z(`Sort…`))}</button>
        <button type="button" data-action="find" title="${R(z(`Advanced find with conditions`))}">${R(z(`Find…`))}</button>
        <button type="button" data-action="views" title="${R(z(`Save and reuse this view`))}">${R(z(`Views`))}</button>
        <label>${R(z(`New field`))} <input data-new-field placeholder="${R(z(`Field name`))}"></label>
        <label>${R(z(`Type`))} <select data-new-field-type>${xt()}</select></label>
        <button type="button" data-action="add-field">${R(z(`Add field`))}</button>
        <button type="button" data-action="add-record">${R(z(`Add record`))}</button>
      </section>
      <div class="workspace${t?` student-workspace`:``}">
        ${zt(e)}
        ${t?``:Ht(e)}
      </div>
      <footer class="status-bar">
        <span>${R(e.name)}: ${V(e).length} shown of ${e.records.length} records, ${e.fields.length} fields</span>
        ${t?`<span>Student view hides teacher notes and teacher tools.</span>`:``}
        <span>${R(M)}</span>
        <span>${Ke}</span>
      </footer>
    </main>
    <input class="hidden-file" type="file" accept=".listsplat.json,application/json" data-open-json>
    <input class="hidden-file" type="file" accept=".csv,text/csv" data-import-csv>
    ${Jt(e)}
  `,Ye=``,Xe){let e=Xe;Xe=null,sn(e.recordId,e.fieldId)}}function Yt(e){return e instanceof HTMLInputElement&&e.type===`checkbox`?e.checked:e instanceof HTMLInputElement&&e.type===`number`?e.value===``?``:Number(e.value):e.value}function Xt(e){let t=e.dataset.recordId,n=e.dataset.fieldId;!t||!n||(v=ie(v,re(B(),t,n,Yt(e))),pe(v),Ke=`Saved locally`)}function Zt(e,t,n,r){if(!n.type.startsWith(`image/`)){M=`That clipboard item is not an image.`,Z();return}let i=new FileReader;i.addEventListener(`load`,()=>{W(r),v=ie(v,re(B(),e,t,String(i.result??``))),pe(v),M=`Image saved in this field.`,Z()}),i.readAsDataURL(n)}function Qt(){let e=B(),t=e.fields.find(e=>e.id===Je);if(!t)return;let n=_.querySelector(`[data-field-name]`)?.value??t.name,r=_.querySelector(`[data-field-type]`)?.value??t.type,i=_.querySelector(`[data-field-description]`)?.value??``,a=_.querySelector(`[data-field-required]`)?.checked??!1,o=_.querySelector(`[data-field-hidden]`)?.checked??!1,s=_.querySelector(`[data-field-formula]`)?.value??``,c=(_.querySelector(`[data-field-options]`)?.value??``).split(`,`).map(e=>e.trim()).filter(Boolean),l=r!==t.type,u=ee(e,t.id,{name:n,type:r,description:i,required:a,hidden:o,formula:s,options:c});l&&![`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(r)&&(u=d(u,t.id,r,c)),G(u),j=`none`,M=l?`Updated ${n} and converted values to ${r}.`:`Updated ${n}.`,Z()}function $t(){let e=_.querySelector(`[data-replace-find]`)?.value??``,t=_.querySelector(`[data-replace-with]`)?.value??``,n=_.querySelector(`[data-replace-field]`)?.value??B().fields[0]?.id,r=_.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=_.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=S?V(B()).map(e=>e.id):void 0;W(`replace`);let o=ze(B(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i});j=`none`,F=[],M=`Replaced ${o.count} value${o.count===1?``:`s`}.`,G(o.table)}function en(){let e=_.querySelector(`[data-replace-find]`)?.value??``,t=_.querySelector(`[data-replace-with]`)?.value??``,n=_.querySelector(`[data-replace-field]`)?.value??B().fields[0]?.id,r=_.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=_.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=S?V(B()).map(e=>e.id):void 0;F=Re(B(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i}),M=`Preview found ${F.length} change${F.length===1?``:`s`}.`,Z()}function tn(){let e=(_.querySelector(`[data-teacher-notes]`)?.value??``).split(`
`).map(e=>e.trim()).filter(Boolean);W(`teacher notes`),j=`none`,M=`Saved ${e.length} teacher note${e.length===1?``:`s`}.`,U({...v,updatedAt:new Date().toISOString(),teacher:{...v.teacher,notes:e}})}function nn(e){let t=_.querySelector(e)?.value;if(!t)return null;let[n,r]=t.split(`:`);return n&&r?{tableId:n,fieldId:r}:null}function rn(){let e=_.querySelector(`[data-relationship-from-table]`)?.value??``,t=_.querySelector(`[data-relationship-to-table]`)?.value??``,n=nn(`[data-relationship-from-field]`),r=nn(`[data-relationship-to-field]`),i=_.querySelector(`[data-relationship-name]`)?.value??``;if(!e||!t||!n||!r){M=`Choose both tables and both match fields.`,Z();return}if(n.tableId!==e||r.tableId!==t){M=`Match fields must belong to the tables you chose.`,Z();return}W(`relationship create`);let a=_e(i,e,n.fieldId,t,r.fieldId);M=`Created relationship: ${a.name}.`,U(ve(v,a))}function an(){Ze=_.querySelector(`[data-relationship-from-table]`)?.value??Ze,Qe=_.querySelector(`[data-relationship-to-table]`)?.value??Qe,Z()}function on(e){return window.CSS&&typeof CSS.escape==`function`?CSS.escape(e):e.replace(/["\\]/g,`\\$&`)}function sn(e,t){let n=_.querySelector(`.data-grid`);if(!n)return!1;let r=n.querySelector(`tr[data-record-row="${on(e)}"]`);if(!r)return!1;let i=r.querySelector(`.cell-input[data-field-id="${on(t)}"], .cell-checkbox[data-field-id="${on(t)}"]`);return i||=r.querySelector(`.cell-input, .cell-checkbox`),i?(i.focus(),i instanceof HTMLInputElement&&i.type!==`checkbox`&&i.select(),!0):!1}function cn(e){W(`add record`);let t=l(B()),n=t.records.at(-1);n&&(b=n.id,Xe={recordId:n.id,fieldId:e}),G(t)}function ln(e,t,n,r){let i=Array.from(_.querySelectorAll(`.data-grid tbody tr[data-record-row]`)),a=i.findIndex(t=>t.dataset.recordRow===e),o=Y(B()).map(e=>e.id),s=o.indexOf(t);if(a<0||s<0)return;let c=a+n,l=s+r;if(r>0&&l>=o.length?(l=0,c=a+1):r<0&&l<0&&(l=o.length-1,c=a-1),c>=i.length){cn(o[l]??o[0]);return}c<0||sn(i[c].dataset.recordRow??e,o[l]??t)}var un=[{value:`contains`,label:`contains`,needsValue:!0,needsSecond:!1},{value:`equals`,label:`is exactly`,needsValue:!0,needsSecond:!1},{value:`startsWith`,label:`starts with`,needsValue:!0,needsSecond:!1},{value:`endsWith`,label:`ends with`,needsValue:!0,needsSecond:!1},{value:`greaterThan`,label:`greater than`,needsValue:!0,needsSecond:!1},{value:`lessThan`,label:`less than`,needsValue:!0,needsSecond:!1},{value:`between`,label:`between`,needsValue:!0,needsSecond:!0},{value:`isEmpty`,label:`is empty`,needsValue:!1,needsSecond:!1},{value:`isNotEmpty`,label:`is not empty`,needsValue:!1,needsSecond:!1}];function dn(e){return B().fields.find(t=>t.id===e)?.name??`field`}function fn(e){return un.find(t=>t.value===e)?.label??e}function pn(){let e=_.querySelector(`[data-find-match]`)?.value??`all`,t=[];_.querySelectorAll(`.find-rule`).forEach(e=>{let n=e.querySelector(`[data-find-field]`)?.value??``,r=e.querySelector(`[data-find-op]`)?.value??`contains`,i=e.querySelector(`[data-find-value]`)?.value??``,a=e.querySelector(`[data-find-value2]`)?.value??``;n&&t.push({fieldId:n,operator:r,value:i,value2:a})}),E={match:e,rules:t}}function mn(){pn(),T=E.rules.length?E:null,A=new Set,j=`none`;let e=V(B()).length;M=T?`Find is on: ${e} record${e===1?``:`s`} match.`:`Find cleared.`,Z()}function hn(){let e=[];_.querySelectorAll(`.sort-level`).forEach(t=>{let n=t.querySelector(`[data-sort-level-field]`)?.value??``,r=t.querySelector(`[data-sort-level-dir]`)?.value??`asc`;n&&e.push({fieldId:n,direction:r})}),D=e}function gn(){hn(),w=D,j=`none`,M=w.length?`Sorting by ${w.map(e=>dn(e.fieldId)).join(`, `)}.`:`Sort cleared.`,Z()}function _n(){return v.views??[]}function vn(){let e=_.querySelector(`[data-view-name]`)?.value.trim()||`View ${_n().length+1}`,n={id:t(`view`),name:e,tableId:y,mode:x,search:S,searchFieldId:C,find:T,sortKeys:w};W(`save view`),M=`Saved view: ${e}.`,U({...v,updatedAt:new Date().toISOString(),views:[..._n(),n]})}function yn(e){let t=_n().find(t=>t.id===e);t&&(v.schema.tables.some(e=>e.id===t.tableId)&&(y=t.tableId,H(B())),x=t.mode,S=t.search,C=t.searchFieldId,T=t.find,w=t.sortKeys,A=new Set,j=`none`,M=`Opened view: ${t.name}.`,Z())}function bn(e){W(`delete view`),M=`Deleted a saved view.`,U({...v,updatedAt:new Date().toISOString(),views:_n().filter(t=>t.id!==e)})}function Q(e){let t=new Set(e.records.map(e=>e.id));return[...O].filter(e=>t.has(e))}function xn(){let e=B(),t=new Set(Q(e));if(t.size===0)return;let n=e.records.filter(e=>!t.has(e.id));if(n.length===0){M=`Keep at least one record. Some rows were not deleted.`,Z();return}window.confirm(`Delete ${t.size} selected record${t.size===1?``:`s`}? You can undo right after.`)&&(W(`bulk delete`),O=new Set,M=`Deleted ${e.records.length-n.length} records.`,G({...e,records:n}))}function Sn(){let e=B(),t=Q(e);if(t.length===0)return;W(`bulk duplicate`);let n=t.reduce((e,t)=>te(e,t),e);O=new Set,M=`Duplicated ${t.length} record${t.length===1?``:`s`}.`,G(n)}function Cn(){let e=B(),t=new Set(Q(e)),n=_.querySelector(`[data-bulk-field]`)?.value??``,r=_.querySelector(`[data-bulk-value]`)?.value??``,i=e.fields.find(e=>e.id===n);if(!i||t.size===0){j=`none`,Z();return}let a=u(r,i.type,i.options).value;W(`bulk fill`);let o=e.records.map(e=>t.has(e.id)?{...e,updatedAt:new Date().toISOString(),values:{...e.values,[n]:a}}:e);j=`none`,M=`Filled ${i.name} for ${t.size} record${t.size===1?``:`s`}.`,G({...e,records:o})}function wn(e){let t=e.filter(e=>e.trim()!==``);return t.length===0?`text`:t.every(e=>!Number.isNaN(Number(e.replace(/[$,%\s]/g,``))))?`number`:t.every(e=>!Number.isNaN(new Date(e).getTime())&&/\d/.test(e))?`date`:t.every(e=>/^(yes|no|true|false)$/i.test(e.trim()))?`checkbox`:`text`}function Tn(){_.querySelectorAll(`.csv-map-row`).forEach((e,t)=>{k[t]&&(k[t].action=e.querySelector(`[data-map-action]`)?.value??`new`,k[t].type=e.querySelector(`[data-map-type]`)?.value??`text`,k[t].fieldId=e.querySelector(`[data-map-existing]`)?.value??``)})}_.addEventListener(`click`,e=>{let t=e.target,n=t.closest(`[data-action]`)?.dataset.action,r=t.closest(`[data-table-id]`)?.dataset.tableId,i=t.closest(`[data-template-id]`)?.dataset.templateId,s=t.closest(`[data-view-mode]`)?.dataset.viewMode,c=t.closest(`[data-select-record]`)?.dataset.selectRecord,u=t.closest(`[data-field-settings]`)?.dataset.fieldSettings,d=t.closest(`[data-record-action-id]`)?.dataset.recordActionId,ee=t.closest(`[data-quality-field-id]`);if(r){y=r,at(),w=[],O=new Set,H(B()),Z();return}if(i){bt(i);return}if(s){x=s,Z();return}if(c){b=c,x===`table`&&Z();return}if(u){Je=u,qe=``,j=`field`,Z();return}if(ee){let e=ee.dataset.qualityFieldId,t=ee.dataset.qualityKind;if(e&&t){let n=t===`duplicates`?Ie(B(),e):Le(B(),e);A=new Set(n.map(e=>e.id));let r=B().fields.find(t=>t.id===e);M=`Highlighted ${n.length} ${t===`duplicates`?`duplicate`:`missing`} record${n.length===1?``:`s`} in ${r?.name??`this field`}.`,j=`none`,Z();return}}if(n)if(dt(),n===`new`){if(!window.confirm(`Start a new database? Your current one is replaced here — export it first if you want to keep a copy. You can also undo right after.`))return;W(`new database`);let e=a(`Untitled Database`);y=e.schema.tables[0].id,b=e.schema.tables[0].records[0]?.id??``,A=new Set,U(e)}else if(n===`save-json`)pt();else if(n===`open-json`)_.querySelector(`[data-open-json]`)?.click();else if(n===`import-csv`)_.querySelector(`[data-import-csv]`)?.click();else if(n===`export-csv`)mt();else if(n===`export-report`)ht();else if(n===`project-packet`)gt();else if(n===`print`)window.print();else if(n===`add-record`)W(`add record`),G(l(B()));else if(n===`add-field`){let e=_.querySelector(`[data-new-field]`),t=_.querySelector(`[data-new-field-type]`)?.value;W(`add field`),G(o(B(),e?.value||`New Field`,t??`text`))}else if(n===`add-table`){let e=window.prompt(`New table name?`,`New Table`)??``;W(`add table`);let t=ae(v,e);y=t.schema.tables.at(-1)?.id??y,b=B().records[0]?.id??``,U(t)}else if(n===`duplicate-record`&&d)W(`duplicate record`),G(te(B(),d));else if(n===`delete-record`&&d){if(B().records.length<=1){M=`Keep at least one record. Add another before deleting this one.`,Z();return}if(!window.confirm(`Delete this record? You can undo right after with Ctrl+Z.`))return;W(`delete record`),G(ne(B(),d))}else if(n===`toggle-sort`){if(w.length)w=[{...w[0],direction:w[0].direction===`asc`?`desc`:`asc`},...w.slice(1)];else{let e=B().fields[0];e&&(w=[{fieldId:e.id,direction:`asc`}])}Z()}else if(n===`sort`||n===`sort-dialog`)D=w.length?w.map(e=>({...e})):[{fieldId:B().fields[0]?.id??``,direction:`asc`}],j=`sort`,Z();else if(n===`find`)E=T?{match:T.match,rules:T.rules.map(e=>({...e}))}:{match:`all`,rules:[{fieldId:B().fields[0]?.id??``,operator:`contains`,value:``}]},j=`find`,Z();else if(n===`views`)j=`views`,Z();else if(n===`sort-add-level`)hn(),D.push({fieldId:B().fields[0]?.id??``,direction:`asc`}),Z();else if(n===`sort-remove-level`){hn();let e=Number(t.closest(`[data-level-index]`)?.dataset.levelIndex??`-1`);e>=0&&D.splice(e,1),Z()}else if(n===`apply-sort`)gn();else if(n===`clear-sort`)hn(),D=[],Z();else if(n===`find-add-rule`)pn(),E.rules.push({fieldId:B().fields[0]?.id??``,operator:`contains`,value:``}),Z();else if(n===`find-remove-rule`){pn();let e=Number(t.closest(`[data-rule-index]`)?.dataset.ruleIndex??`-1`);e>=0&&E.rules.splice(e,1),Z()}else if(n===`apply-find`)mn();else if(n===`save-view`)vn();else if(n===`apply-view`){let e=t.closest(`[data-view-id]`)?.dataset.viewId;e&&yn(e)}else if(n===`delete-view`){let e=t.closest(`[data-view-id]`)?.dataset.viewId;e&&bn(e)}else if(n===`bulk-delete`)xn();else if(n===`bulk-duplicate`)Sn();else if(n===`bulk-fill`)Q(B()).length&&(j=`bulkFill`,Z());else if(n===`apply-bulk-fill`)Cn();else if(n===`bulk-clear`)O=new Set,Z();else if(n===`duplicates`){let e=C===`all`?B().fields[0]?.id:C;A=new Set(Ie(B(),e).map(e=>e.id)),M=`Found ${A.size} duplicate record${A.size===1?``:`s`}.`,Z()}else if(n===`missing`){let e=C===`all`?B().fields[0]?.id:C;A=new Set(Le(B(),e).map(e=>e.id)),M=`Found ${A.size} record${A.size===1?``:`s`} with missing values.`,Z()}else if(n===`clear-find`)at(),M=`Showing all records.`,Z();else if(n===`replace`)F=[],j=`replace`,Z();else if(n===`preview-replace`)en();else if(n===`run-replace`)$t();else if(n===`save-teacher-notes`)tn();else if(n===`apply-csv-new`)yt(`new`);else if(n===`apply-csv-append`)yt(`append`);else if(n===`save-field-settings`)W(`field settings`),Qt();else if(n===`layout-designer`||n===`lock-layout`)j=`layout`,Z();else if(n===`layout-field-up`||n===`layout-field-down`){let e=t.closest(`[data-layout-field-id]`)?.dataset.layoutFieldId,r=J();if(e&&r){let t=X(B()).map(e=>e.id),r=t.indexOf(e),i=n===`layout-field-up`?r-1:r+1;r>=0&&i>=0&&i<t.length&&([t[r],t[i]]=[t[i],t[r]],W(`layout order`),j=`layout`,kt({fieldOrder:t}))}}else if(n===`save-layout-settings`){let e=_.querySelector(`[data-layout-locked]`)?.checked??!1,t=new Set([..._.querySelectorAll(`[data-layout-field-visible]:checked`)].map(e=>e.dataset.layoutFieldVisible??``)),n=X(B()).map(e=>e.id),r=n.filter(e=>!t.has(e));W(`layout settings`),j=`none`,kt({locked:e,fieldOrder:n,hiddenFieldIds:r})}else n===`create-relationship`?rn():n===`undo-change`?lt():n===`redo-change`?ut():n===`close-dialog`?(j=`none`,F=[],I=null,Z()):n.endsWith(`-view`)?(x=n.replace(`-view`,``),Z()):n===`templates`?(M=`Template starters are in the Teacher panel.`,Z()):n===`student-view`?(W(`student view toggle`),M=v.teacher.studentView?`Teacher tools are visible again.`:`Student view is on.`,U({...v,updatedAt:new Date().toISOString(),teacher:{...v.teacher,studentView:!v.teacher.studentView}})):n===`project-ideas`?(j=`projectIdeas`,Z()):n===`relationships`?(j=`relationship`,Z()):n===`functions`?(j=`functions`,Z()):n===`quality`?(j=`quality`,Z()):n===`teacher-notes`?(j=`teacherNotes`,Z()):n.startsWith(`help-`)?(j=`help`,Z()):(M=`That ListSplatTM control is not available in this workspace.`,Z())}),_.addEventListener(`change`,e=>{let t=e.target;if(t.matches(`#languageSwitcher`)&&t instanceof HTMLSelectElement){L=et(t.value);try{localStorage.setItem(He,L)}catch{}Z()}else if(t.matches(`[data-open-json]`)&&t instanceof HTMLInputElement&&t.files?.[0])_t(t.files[0]);else if(t.matches(`[data-import-csv]`)&&t instanceof HTMLInputElement&&t.files?.[0])vt(t.files[0]);else if(t.matches(`[data-search-field]`))C=t.value,A=new Set,Z();else if(t.matches(`[data-sort-field]`)){let e=w[0]?.direction??`asc`;w=t.value?[{fieldId:t.value,direction:e}]:[],Z()}else if(t.matches(`[data-select-all]`)&&t instanceof HTMLInputElement){let e=V(B()).map(e=>e.id);O=t.checked?new Set(e):new Set,Z()}else if(t.matches(`[data-select-row]`)&&t instanceof HTMLInputElement){let e=t.dataset.selectRow??``;t.checked?O.add(e):O.delete(e),Z()}else if(t.matches(`[data-field-type]`))qe=t.value,Z();else if(t.matches(`[data-find-op]`))pn(),Z();else if(t.matches(`[data-map-action]`))Tn(),Z();else if(t.matches(`[data-relationship-from-table], [data-relationship-to-table]`))an();else if(t.matches(`.cell-input, .cell-checkbox, .image-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement))if(t instanceof HTMLInputElement&&t.type===`file`&&t.files?.[0]){let e=t.dataset.recordId,n=t.dataset.fieldId,r=t.files[0];e&&n&&Zt(e,n,r,`image upload`)}else t.dataset.recordId&&t.dataset.fieldId&&ot(t.dataset.recordId,t.dataset.fieldId),Xt(t)}),_.addEventListener(`paste`,e=>{let t=e.target.closest(`.image-cell`);if(!t)return;let n=t.dataset.recordId,r=t.dataset.fieldId,i=Array.from(e.clipboardData?.items??[]).find(e=>e.type.startsWith(`image/`))?.getAsFile();n&&r&&i&&(e.preventDefault(),Zt(n,r,i,`image paste`))}),_.addEventListener(`input`,e=>{let t=e.target;if(t.matches(`[data-project-title]`)){ft(t.value);return}if(t.matches(`[data-search]`)){S=t.value,A=new Set,Z();return}t.matches(`.cell-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)&&(t.dataset.recordId&&t.dataset.fieldId&&ot(t.dataset.recordId,t.dataset.fieldId),Xt(t))}),_.addEventListener(`focusout`,e=>{e.target.matches?.(`.cell-input, .cell-checkbox`)&&(Ye=``)}),_.addEventListener(`pointerdown`,e=>{let t=e.target.closest(`[data-col-resize]`);if(!t)return;e.preventDefault(),e.stopPropagation();let n=t.dataset.colResize??``,r=t.closest(`th`);if(!r)return;r.setAttribute(`draggable`,`false`);let i=e.clientX,a=r.getBoundingClientRect().width,o=Math.round(a),s=e=>{o=Math.max(80,Math.round(a+(e.clientX-i))),r.style.width=`${o}px`,r.style.minWidth=`${o}px`},c=()=>{document.removeEventListener(`pointermove`,s),document.removeEventListener(`pointerup`,c),r.setAttribute(`draggable`,`true`);let e=J();e&&(W(`resize column`),kt({columnWidths:{...e.columnWidths??{},[n]:o}}))};document.addEventListener(`pointermove`,s),document.addEventListener(`pointerup`,c)});var $=null;_.addEventListener(`dragstart`,e=>{let t=e.target;if(t.closest(`[data-col-resize]`))return;let n=t.closest(`.col-head[data-col-field]`);n&&($=n.dataset.colField??null,e.dataTransfer?.setData(`text/plain`,$??``))}),_.addEventListener(`dragover`,e=>{$&&e.target.closest(`.col-head[data-col-field]`)&&e.preventDefault()}),_.addEventListener(`drop`,e=>{let t=e.target.closest(`.col-head[data-col-field]`);if(!t||!$)return;e.preventDefault();let n=t.dataset.colField??``,r=$;if($=null,!n||n===r)return;let i=X(B()).map(e=>e.id),a=i.indexOf(r),o=i.indexOf(n);a<0||o<0||(i.splice(o,0,i.splice(a,1)[0]),W(`reorder columns`),kt({fieldOrder:i}))}),_.addEventListener(`keydown`,e=>{let t=e.target;if(!t.matches?.(`.cell-input, .cell-checkbox`))return;let n=t.dataset.recordId,r=t.dataset.fieldId;if(!n||!r)return;let i=t instanceof HTMLTextAreaElement,a=t instanceof HTMLSelectElement;switch(e.key){case`Enter`:i||(e.preventDefault(),ln(n,r,e.shiftKey?-1:1,0));break;case`ArrowDown`:!i&&!a&&(e.preventDefault(),ln(n,r,1,0));break;case`ArrowUp`:!i&&!a&&(e.preventDefault(),ln(n,r,-1,0));break;case`Tab`:e.preventDefault(),ln(n,r,0,e.shiftKey?-1:1);break;default:break}}),document.addEventListener(`keydown`,e=>{if(!(e.ctrlKey||e.metaKey))return;let t=e.key.toLowerCase();t===`z`&&!e.shiftKey?(e.preventDefault(),lt()):t===`y`||t===`z`&&e.shiftKey?(e.preventDefault(),ut()):t===`s`&&(e.preventDefault(),pt(),M=`Saved a .listsplat.json file to your downloads.`,Z())}),document.addEventListener(`click`,e=>{e.target.closest(`.menu`)||dt()}),document.addEventListener(`toggle`,e=>{let t=e.target;!(t instanceof HTMLDetailsElement)||!t.matches(`.menu`)||!t.open||document.querySelectorAll(`.menu[open]`).forEach(e=>{e!==t&&(e.open=!1)})},!0),Z();