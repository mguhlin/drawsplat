(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={text:``,longText:``,number:0,currency:0,percent:0,date:``,checkbox:!1,rating:0,choice:``,image:``,link:``,calculation:``,autoNumber:``,createdAt:``,updatedAt:``};function t(e){return`${e}_${Math.random().toString(36).slice(2,10)}`}function n(e,n=`text`){return{id:t(`field`),name:e,type:n,description:``,required:!1,hidden:!1,options:n===`choice`?[`Yes`,`No`]:void 0}}function r(n,r={}){let i=new Date().toISOString(),a=Object.fromEntries(n.map((t,n)=>t.type===`createdAt`||t.type===`updatedAt`?[t.id,r[t.id]??i]:t.type===`autoNumber`?[t.id,r[t.id]??n+1]:[t.id,r[t.id]??e[t.type]]));return{id:t(`record`),createdAt:i,updatedAt:i,values:a}}function i(e,i){let a=i.map(e=>n(e));return{id:t(`table`),name:e,fields:a,records:[r(a)]}}function a(e=`Animal Research Database`){let n=new Date().toISOString(),a=i(`Animals`,[`Animal`,`Habitat`,`Diet`,`Interesting Fact`]);return a.records=[r(a.fields,{[a.fields[0].id]:`Axolotl`,[a.fields[1].id]:`Freshwater lakes`,[a.fields[2].id]:`Worms and insects`,[a.fields[3].id]:`It can regrow some body parts.`}),r(a.fields,{[a.fields[0].id]:`Red panda`,[a.fields[1].id]:`Mountain forests`,[a.fields[2].id]:`Bamboo and fruit`,[a.fields[3].id]:`It uses its tail like a blanket.`})],{app:`ListSplatTM`,version:1,createdAt:n,updatedAt:n,metadata:{title:e,author:``,className:``},schema:{tables:[a],relationships:[]},layouts:[{id:t(`layout`),name:`Table View`,tableId:a.id,mode:`table`,locked:!1},{id:t(`layout`),name:`Record Form`,tableId:a.id,mode:`form`,locked:!1},{id:t(`layout`),name:`Research Cards`,tableId:a.id,mode:`cards`,locked:!1}],teacher:{studentView:!1,notes:[`Ask students to add source notes before printing a report.`],rubric:[]}}}function o(t,r,i=`text`){let a=n(r.trim()||`New Field`,i);return{...t,fields:[...t.fields,a],records:t.records.map(t=>({...t,updatedAt:new Date().toISOString(),values:{...t.values,[a.id]:e[i]}}))}}function s(e){return{...e,records:[...e.records,r(e.fields)]}}function c(e,t,n){return{...e,fields:e.fields.map(e=>e.id===t?{...e,...n}:e)}}function ee(e,t){let n=e.records.find(e=>e.id===t);return n?{...e,records:[...e.records,r(e.fields,n.values)]}:e}function te(e,t){return e.records.length<=1?e:{...e,records:e.records.filter(e=>e.id!==t)}}function l(e,t,n,r){let i=new Date().toISOString();return{...e,records:e.records.map(a=>a.id===t?{...a,updatedAt:i,values:Object.fromEntries(e.fields.map(e=>e.id===n?[e.id,r]:e.type===`updatedAt`?[e.id,i]:[e.id,a.values[e.id]]))}:a)}}function u(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t.id?t:e)}}}function ne(e,n){let r=i(n.trim()||`New Table`,[`Name`,`Notes`]);return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:[...e.schema.tables,r]},layouts:[...e.layouts,{id:t(`layout`),name:`${r.name} Table`,tableId:r.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${r.name} Form`,tableId:r.id,mode:`form`,locked:!1}]}}function d(e){if(!e||typeof e!=`object`)throw Error(`This is not a ListSplatTM project file.`);let t=e;if(t.app!==`ListSplatTM`||t.version!==1||!t.schema?.tables)throw Error(`This file is not a supported .listsplat.json project.`)}function re(e){let t=[],n=``,r=[],i=!1;for(let a=0;a<e.length;a+=1){let o=e[a],s=e[a+1];i&&o===`"`&&s===`"`?(n+=`"`,a+=1):o===`"`?i=!i:!i&&o===`,`?(r.push(n),n=``):!i&&(o===`
`||o===`\r`)?(o===`\r`&&s===`
`&&(a+=1),r.push(n),r.some(e=>e.length>0)&&t.push(r),r=[],n=``):n+=o}return r.push(n),r.some(e=>e.length>0)&&t.push(r),t}function ie(e,t){let i=re(t),a=(i[0]?.map((e,t)=>e.trim()||`Field ${t+1}`)??[`Field 1`]).map(e=>n(e)),o=i.slice(1).map(e=>r(a,Object.fromEntries(a.map((t,n)=>[t.id,e[n]??``]))));return{id:`table_${Date.now().toString(36)}`,name:e,fields:a,records:o.length>0?o:[r(a)]}}function ae(e){let t=e==null?``:String(e);return/[",\n\r]/.test(t)?`"${t.replaceAll(`"`,`""`)}"`:t}function oe(e){return[e.fields.map(e=>ae(e.name)).join(`,`),...e.records.map(t=>e.fields.map(e=>ae(t.values[e.id])).join(`,`))].join(`
`)}var f=`listsplat.autosave.v1`;function p(e){localStorage.setItem(f,JSON.stringify(e))}function se(){let e=localStorage.getItem(f);if(!e)return null;let t=JSON.parse(e);return d(t),t}function m(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,a.click(),URL.revokeObjectURL(i)}function ce(e,t){return e.records.map(e=>Number(e.values[t])).filter(e=>Number.isFinite(e))}function h(e){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)).map(t=>{let n=ce(e,t.id),r=n.reduce((e,t)=>e+t,0);return{fieldId:t.id,fieldName:t.name,count:n.length,sum:r,average:n.length?r/n.length:0,minimum:n.length?Math.min(...n):0,maximum:n.length?Math.max(...n):0}})}function le(e,t,n){let r=e.trim(),i=r.match(/^FIELD\(([^)]+)\)$/i);if(i){let e=i[1].trim().toLowerCase(),r=t.fields.find(t=>t.name.toLowerCase()===e);return r?String(n.values[r.id]??``):``}let a=r.match(/^JOIN\((.+)\)$/i);return a?a[1].split(`,`).map(e=>{let r=e.trim();if(r.startsWith(`"`)&&r.endsWith(`"`))return r.slice(1,-1);let i=t.fields.find(e=>e.name.toLowerCase()===r.toLowerCase());return i?String(n.values[i.id]??``):r}).join(``):``}function g(e){return e==null?``:String(e)}function ue(e,t){let n=t.query.trim();if(!n)return e.records;let r=n.toLowerCase();return e.records.filter(n=>(t.fieldId===`all`?e.fields.map(e=>e.id):[t.fieldId]).some(e=>g(n.values[e]).toLowerCase().includes(r)))}function de(e,t,n){let r=n===`asc`?1:-1;return{...e,records:[...e.records].sort((e,n)=>{let i=g(e.values[t]),a=g(n.values[t]),o=Number(i),s=Number(a);return!Number.isNaN(o)&&!Number.isNaN(s)?(o-s)*r:i.localeCompare(a,void 0,{numeric:!0,sensitivity:`base`})*r})}}function fe(e,t){let n=new Map;return e.records.forEach(e=>{let r=g(e.values[t]).trim().toLowerCase();r&&n.set(r,(n.get(r)??0)+1)}),e.records.filter(e=>{let r=g(e.values[t]).trim().toLowerCase();return r?(n.get(r)??0)>1:!1})}function pe(e,t){return e.records.filter(e=>!g(e.values[t]).trim())}function me(e,t){if(!t.find)return[];let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=[];return e.records.forEach(e=>{o.has(e.id)&&t.fieldIds.forEach(n=>{let r=g(e.values[n]),i=r.replace(a,t.replacement);i!==r&&s.push({recordId:e.id,fieldId:n,before:r,after:i})})}),s}function he(e,t){if(!t.find)return{table:e,count:0};let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=0,c=e.records.map(e=>{if(!o.has(e.id))return e;let n=!1,r={...e.values};return t.fieldIds.forEach(e=>{let i=g(r[e]),o=i.replace(a,()=>(s+=1,t.replacement));o!==i&&(n=!0,r[e]=o)}),n?{...e,updatedAt:new Date().toISOString(),values:r}:e});return{table:{...e,records:c},count:s}}function ge(e){return e==null?``:String(e).trim().toLowerCase()}function _e(e,n,r,i,a){return{id:t(`relationship`),name:e.trim()||`New Relationship`,fromTableId:n,fromFieldId:r,toTableId:i,toFieldId:a}}function ve(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,relationships:[...e.schema.relationships,t]}}}function ye(e,t,n,r){let i=ge(n.values[e.fromFieldId]);return!i||t.id!==e.fromTableId||r.id!==e.toTableId?[]:r.records.filter(t=>ge(t.values[e.toFieldId])===i)}function _(e,t){let n=e.schema.tables.find(e=>e.id===t.fromTableId),r=e.schema.tables.find(e=>e.id===t.toTableId),i=n?.fields.find(e=>e.id===t.fromFieldId),a=r?.fields.find(e=>e.id===t.toFieldId);return`${n?.name??`Table`}:${i?.name??`Field`} -> ${r?.name??`Table`}:${a?.name??`Field`}`}function v(e,t,n,r,i,a){return{id:e,title:t,gradeBand:n,goal:r,table:ie(t,i),reflectionQuestions:a}}var y=[v(`classroom-library`,`Classroom Library Catalog`,`Grades 3-8`,`Track books, genres, reading levels, and recommendations.`,`Title,Author,Genre,Pages,Who would enjoy it?
Charlotte's Web,E. B. White,Fiction,192,Readers who like animals
Hidden Figures,Margot Lee Shetterly,Biography,240,Readers who like history`,[`Which genre appears most often?`,`What book would you recommend first?`]),v(`science-observations`,`Science Observation Log`,`Grades 3-8`,`Collect observations over time and look for patterns.`,`Date,Object observed,Location,Measurement,Observation
2026-06-29,Bean plant,Window,8 cm,Two new leaves
2026-06-30,Bean plant,Window,8.5 cm,Stem leaned toward light`,[`What changed over time?`,`What might explain the pattern?`]),v(`state-facts`,`State Facts Database`,`Grades 4-8`,`Compare places using consistent fields.`,`State,Capital,Region,Population note,Interesting fact
Texas,Austin,South,Large population,Has many different ecosystems
New Mexico,Santa Fe,Southwest,Medium population,Capital is over 400 years old`,[`Which fields help compare states?`,`What new field would improve this database?`]),v(`book-reviews`,`Book Review Collection`,`Grades 3-8`,`Collect opinions and evidence from student reading.`,`Book,Reviewer,Rating,Favorite part,Would recommend?
Because of Winn-Dixie,Jordan,5,The friendship story,Yes
Wonder,Avery,4,The different points of view,Yes`,[`Which book has the strongest recommendation?`,`What evidence supports each rating?`]),v(`vocabulary-bank`,`Vocabulary Word Bank`,`Grades 2-8`,`Build a searchable word list with definitions and examples.`,`Word,Definition,Example sentence,Subject
evaporate,To change from liquid to gas,Water can evaporate in sunlight,Science
compare,To tell how things are alike,Compare two characters,Reading`,[`Which words belong to more than one subject?`,`Which examples help you remember the word?`]),v(`survey-results`,`Simple Survey Results`,`Grades 3-8`,`Organize survey answers and look for patterns.`,`Question,Answer,Student group,Count,Notes
Favorite recess activity,Soccer,Grade 4,12,Most common outdoor choice
Favorite recess activity,Drawing,Grade 4,6,Quiet activity choice`,[`Which answer appears most often?`,`What new question should the class ask next?`]),v(`museum-cards`,`Museum Exhibit Cards`,`Grades 4-8`,`Create printable exhibit cards for objects, images, or research topics.`,`Item,Creator or source,Year,Category,Why it matters
Printing press,Johannes Gutenberg,1440,Invention,Changed how books were made
Apollo 11 mission,NASA,1969,Space exploration,First humans walked on the Moon`,[`How should the exhibit be grouped?`,`What field would help visitors understand the item?`])];function be(e){let t=e.table.fields.map(e=>({...e,id:`${e.id}_${Date.now().toString(36)}`})),n=e.table.records.map(n=>r(t,Object.fromEntries(e.table.fields.map((e,r)=>[t[r].id,n.values[e.id]??``]))));return{...e.table,id:`table_${e.id}_${Date.now().toString(36)}`,fields:t,records:n}}var b=document.querySelector(`#app`);if(!b)throw Error(`ListSplatTM app root was not found.`);var x=b,S=se()??a(),C=S.schema.tables[0].id,w=S.schema.tables[0].records[0]?.id??``,T=`table`,E=`Saved locally`,D=``,O=`all`,k=``,A=`asc`,j=new Set,M=`none`,N=``,P=`Tip: Start with one table, then add relationships when your project needs them.`,F=[],I=[],L=C,R=S.schema.tables[1]?.id??C,z=null,B=``;function V(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function H(){return S.schema.tables.find(e=>e.id===C)??S.schema.tables[0]}function U(e){let t=ue(e,{query:D,fieldId:O});return j.size>0?t.filter(e=>j.has(e.id)):t}function W(e){e.records.some(e=>e.id===w)||(w=e.records[0]?.id??``)}function G(e){S=e,W(H()),p(S),E=`Saved locally`,$()}function K(e){F=[{label:e,project:structuredClone(S)},...F].slice(0,12)}function xe(){let e=F[0];if(!e){P=`Nothing to undo yet.`,$();return}F=F.slice(1),S=e.project,C=S.schema.tables.some(e=>e.id===C)?C:S.schema.tables[0].id,W(H()),p(S),P=`Undid ${e.label}.`,$()}function q(e){C=e.id,G(u(S,e))}function Se(){document.querySelectorAll(`.menu[open]`).forEach(e=>{e.open=!1})}function Ce(e){G({...S,updatedAt:new Date().toISOString(),metadata:{...S.metadata,title:e||`Untitled Database`}})}function we(){m(`${S.metadata.title||`listsplat-project`}.listsplat.json`,JSON.stringify(S,null,2),`application/json`)}function Te(){m(`${H().name}.csv`,oe(H()),`text/csv;charset=utf-8`)}function Ee(){let e=H(),t=U(e),n=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${V(S.metadata.title)}</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{color:#5b21b6}</style></head>
<body><h1>${V(S.metadata.title)}</h1><p>${V(e.name)} report from ListSplatTM.</p>
<table><thead><tr>${e.fields.map(e=>`<th>${V(e.name)}</th>`).join(``)}</tr></thead>
<tbody>${t.map(t=>`<tr>${e.fields.map(n=>`<td>${V(Y(e,t,n.id))}</td>`).join(``)}</tr>`).join(``)}</tbody></table></body></html>`;m(`${S.metadata.title||`listsplat-report`}.html`,n,`text/html;charset=utf-8`)}function De(e){e.text().then(e=>{let t=JSON.parse(e);d(t),C=t.schema.tables[0].id,w=t.schema.tables[0].records[0]?.id??``,G(t)}).catch(e=>{window.alert(e instanceof Error?e.message:`Could not open this ListSplatTM file.`)})}function Oe(e){e.text().then(t=>{let n=ie(e.name.replace(/\.csv$/i,``),t);z=n,B=e.name,M=`csvImport`,P=`Previewing ${n.records.length} CSV record${n.records.length===1?``:`s`} from ${e.name}.`,$()})}function ke(e){if(!z){M=`none`;return}if(K(`CSV import`),e===`new`){let e=z;C=e.id,w=e.records[0]?.id??``,z=null,M=`none`,P=`Imported ${e.records.length} records from ${B}.`,G({...S,updatedAt:new Date().toISOString(),schema:{...S.schema,tables:[...S.schema.tables,e]},layouts:[...S.layouts,{id:`layout_${Date.now().toString(36)}`,name:`${e.name} Table`,tableId:e.id,mode:`table`,locked:!1}]});return}let t=H(),n=new Map(z.fields.map(e=>[e.name.trim().toLowerCase(),e.id])),i=z.records.map(e=>r(t.fields,Object.fromEntries(t.fields.map(t=>{let r=n.get(t.name.trim().toLowerCase());return[t.id,r?e.values[r]??``:``]}))));z=null,M=`none`,P=`Appended ${i.length} CSV record${i.length===1?``:`s`} to ${t.name}.`,q({...t,records:[...t.records,...i]})}function Ae(e){let t=y.find(t=>t.id===e);if(!t)return;let n=be(t);K(`template load`),C=n.id,w=n.records[0]?.id??``,P=`Loaded ${t.title}.`,G({...S,metadata:{...S.metadata,title:t.title},schema:{...S.schema,tables:[...S.schema.tables,n]},teacher:{...S.teacher,notes:t.reflectionQuestions}})}function J(e,t){return`
    <details class="menu">
      <summary>${e}</summary>
      <div class="menu-panel">
        ${t.map(([e,t])=>`<button type="button" data-action="${e}">${t}</button>`).join(``)}
      </div>
    </details>
  `}function je(e=`text`){return[[`text`,`Short text`],[`longText`,`Long text`],[`number`,`Number`],[`currency`,`Currency`],[`percent`,`Percent`],[`date`,`Date`],[`checkbox`,`Checkbox`],[`rating`,`Rating`],[`choice`,`Choice`],[`image`,`Image`],[`link`,`Link`],[`calculation`,`Calculation`],[`autoNumber`,`Auto number`],[`createdAt`,`Created time`],[`updatedAt`,`Updated time`]].map(([t,n])=>`<option value="${t}" ${e===t?`selected`:``}>${n}</option>`).join(``)}function Y(e,t,n){let r=e.fields.find(e=>e.id===n);return r?.type===`calculation`&&r.formula?le(r.formula,e,t):t.values[n]??``}function X(){return S.layouts.find(e=>e.tableId===C&&e.mode===T)}function Me(e){return!!e}function Z(e){let t=X()?.fieldOrder??e.fields.map(e=>e.id),n=new Map(e.fields.map(e=>[e.id,e]));return[...t.map(e=>n.get(e)).filter(Me),...e.fields.filter(e=>!t.includes(e.id))].filter(e=>e&&!e.hidden)}function Ne(e){return Z(e).filter(e=>e.type===`image`)}function Pe(e,t){let n=Ne(e)[0];return n?String(Y(e,t,n.id)??``):``}function Fe(e){let t=X();t&&G({...S,updatedAt:new Date().toISOString(),layouts:S.layouts.map(n=>n.id===t.id?{...n,...e}:n)})}function Q(e,t){let n=e.fields.find(e=>!e.hidden)??e.fields[0],r=n?Y(e,t,n.id):``;return String(r||`Untitled record`)}function Ie(e,t,n,r){let i=e.fields.find(e=>e.id===n),a=Y(e,t,n),o=`aria-label="${V(i?.name??`Field`)}, record ${r+1}" data-record-id="${t.id}" data-field-id="${n}"`;if(i?.type===`checkbox`)return`<input class="cell-checkbox" type="checkbox" ${o} ${a===!0||a===`true`?`checked`:``}>`;if(i?.type===`image`){let e=String(a??``);return`
      <div class="image-cell">
        ${e?`<img src="${V(e)}" alt="">`:`<span>No image yet</span>`}
        <label class="image-upload-label">
          Upload image
          <input class="image-input" type="file" accept="image/*" ${o}>
        </label>
      </div>
    `}return i?.type===`rating`?`<input class="cell-input" type="number" min="0" max="5" step="1" ${o} value="${V(a)}">`:i?.type===`choice`?`<select class="cell-input" ${o}>${(i.options?.length?i.options:[`Yes`,`No`]).map(e=>`<option value="${V(e)}" ${String(a)===e?`selected`:``}>${V(e)}</option>`).join(``)}</select>`:i?.type===`autoNumber`||i?.type===`createdAt`||i?.type===`updatedAt`?`<output class="calc-output">${V(a)}</output>`:i?.type===`longText`?`<textarea class="cell-input" ${o}>${V(a)}</textarea>`:i?.type===`date`?`<input class="cell-input" type="date" ${o} value="${V(a)}">`:i?.type===`number`||i?.type===`currency`||i?.type===`percent`?`<input class="cell-input" type="number" step="any" ${o} value="${V(a)}">`:i?.type===`calculation`?`<output class="calc-output">${V(a)}</output>`:`<input class="cell-input" ${o} value="${V(a)}">`}function Le(e){return`
    <div class="table-tabs">
      ${S.schema.tables.map(t=>`<button type="button" class="table-tab ${t.id===e.id?`active`:``}" data-table-id="${t.id}">${V(t.name)}</button>`).join(``)}
    </div>
  `}function Re(e,t){return`
    <div class="data-grid-wrap">
      <table class="data-grid">
        <thead>
          <tr>
            <th>#</th>
            ${Z(e).map(e=>`
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
                <tr class="${t.id===w?`active-row`:``}" data-record-row="${t.id}">
                  <td><button type="button" class="row-button" data-select-record="${t.id}">${n+1}</button></td>
                  ${Z(e).map(r=>`<td>${Ie(e,t,r.id,n)}</td>`).join(``)}
                  <td class="record-actions">
                    <button type="button" data-action="duplicate-record" data-record-action-id="${t.id}">Copy</button>
                    <button type="button" data-action="delete-record" data-record-action-id="${t.id}">Delete</button>
                  </td>
                </tr>
              `).join(``)}
        </tbody>
      </table>
    </div>
  `}function ze(e){let t=e.records.find(e=>e.id===w)??e.records[0];if(!t)return`<div class="empty-panel">Add a record to use form view.</div>`;let n=S.schema.relationships.filter(t=>t.fromTableId===e.id).map(n=>{let r=S.schema.tables.find(e=>e.id===n.toTableId),i=r?ye(n,e,t,r):[];return`
        <section class="related-records">
          <h3>${V(n.name)}</h3>
          <p>${i.length} related record${i.length===1?``:`s`} from ${V(r?.name??`another table`)}</p>
          ${i.length?`<div class="related-grid">${i.slice(0,6).map(e=>`
                      <article>
                        <strong>${V(Q(r,e))}</strong>
                        ${r.fields.filter(e=>!e.hidden).slice(0,3).map(t=>`<span>${V(t.name)}: ${V(Y(r,e,t.id))}</span>`).join(``)}
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
                <span>${V(n.name)}</span>
                ${Ie(e,t,n.id,r)}
                ${n.description?`<small>${V(n.description)}</small>`:``}
              </label>
            `).join(``)}
        ${n}
      </div>
    </div>
  `}function Be(e,t){let n=(t,n)=>{let r=Y(e,n,t.id);if(t.type===`image`){let e=String(r??``);return`
        <figure class="card-image-field">
          ${e?`<img src="${V(e)}" alt="">`:`<span>No image yet</span>`}
          <figcaption>${V(t.name)}</figcaption>
        </figure>
      `}return`<p><strong>${V(t.name)}</strong><span>${V(r)}</span></p>`};return`
    <div class="cards-view ${T===`gallery`?`gallery-view`:``}">
      ${t.map(t=>{let r=Pe(e,t);return`
            <article class="record-card" data-select-record="${t.id}">
              ${T===`gallery`?`<div class="gallery-image">${r?`<img src="${V(r)}" alt="">`:`<span>Add an image field, then upload a picture.</span>`}</div>`:``}
              ${Z(e).filter(e=>T!==`gallery`||e.type!==`image`).slice(0,T===`gallery`?4:8).map(e=>n(e,t)).join(``)}
            </article>
          `}).join(``)}
    </div>
  `}function Ve(e,t){return`
    <div class="labels-view">
      ${t.map(t=>`
            <article class="print-label">
              ${Z(e).slice(0,4).map(n=>`<p><strong>${V(n.name)}:</strong> ${V(Y(e,t,n.id))}</p>`).join(``)}
            </article>
          `).join(``)}
    </div>
  `}function He(e,t){let n=h(e);return`
    <div class="report-view">
      <header>
        <h2>${V(S.metadata.title)}</h2>
        <p>${V(e.name)} report. ${t.length} record${t.length===1?``:`s`} shown.</p>
      </header>
      ${Re(e,t)}
      ${n.length?`<section class="summary-strip">${n.map(e=>`<div><strong>${V(e.fieldName)}</strong><span>Sum ${e.sum.toLocaleString()} | Avg ${e.average.toFixed(2)}</span></div>`).join(``)}</section>`:`<p class="empty-panel">Add a number, currency, or percent field to see summaries.</p>`}
    </div>
  `}function Ue(e){let t=U(e),n={table:`Table: spreadsheet-like rows and columns for fast data entry.`,form:`Form: focus on one record at a time.`,cards:`Cards: compact text-first record cards for browsing.`,gallery:`Gallery: image-first cards for collections and exhibits.`,labels:`Labels: printable small cards or shelf labels.`,report:`Report: printable table with title and summaries.`},r=T===`form`?ze(e):T===`cards`||T===`gallery`?Be(e,t):T===`labels`?Ve(e,t):T===`report`?He(e,t):Re(e,t);return`
    <section class="database-panel" aria-label="Database table">
      ${Le(e)}
      <div class="view-tabs" role="group" aria-label="Layout modes">
        ${[`table`,`form`,`cards`,`gallery`,`labels`,`report`].map(e=>`<button type="button" class="${T===e?`active`:``}" data-view-mode="${e}" title="${V(n[e])}" aria-label="${V(n[e])}">${e}</button>`).join(``)}
      </div>
      ${r}
    </section>
  `}function We(e){let t=h(e),n=e.records.find(e=>e.id===w)??e.records[0],r=n?S.schema.relationships.filter(t=>t.fromTableId===e.id).map(t=>{let r=S.schema.tables.find(e=>e.id===t.toTableId),i=r?ye(t,e,n,r).length:0;return`
            <div class="template-card">
              <strong>${V(t.name)}</strong>
              <span>${i} related record${i===1?``:`s`}</span>
              <p>${V(_(S,t))}</p>
            </div>
          `}).join(``):``;return`
    <aside class="teacher-panel" aria-label="Teacher tools and database stats">
      <h2>Database Check</h2>
      <div class="stat-grid">
        <div class="stat-card"><strong>${U(e).length}</strong> shown</div>
        <div class="stat-card"><strong>${e.records.length}</strong> records</div>
        <div class="stat-card"><strong>${e.fields.length}</strong> fields</div>
        <div class="stat-card"><strong>${S.schema.tables.length}</strong> tables</div>
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
      ${y.map(e=>`
            <div class="template-card">
              <strong>${V(e.title)}</strong>
              <span>${V(e.gradeBand)}</span>
              <p>${V(e.goal)}</p>
              <button type="button" data-template-id="${e.id}">Use template</button>
            </div>
          `).join(``)}
    </aside>
  `}function Ge(e){if(M===`none`)return``;if(M===`replace`){let t=I.slice(0,8);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Replace values">
          <h2>Replace values</h2>
          <label>Find <input data-replace-find placeholder="Text to find"></label>
          <label>Replace with <input data-replace-with placeholder="New text"></label>
          <label>Field <select data-replace-field>${e.fields.map(e=>`<option value="${e.id}">${V(e.name)}</option>`).join(``)}</select></label>
          <label class="check-row"><input type="checkbox" data-replace-case-sensitive> Case-sensitive</label>
          <label class="check-row"><input type="checkbox" data-replace-whole-word> Whole word only</label>
          <p>Replacement applies to the current found set when search is active. Preview first, then apply. The last replace can be undone from Edit.</p>
          ${I.length?`<div class="replace-preview"><strong>${I.length} change${I.length===1?``:`s`} ready</strong>${t.map(t=>{let n=e.records.find(e=>e.id===t.recordId),r=e.fields.find(e=>e.id===t.fieldId);return`<p><span>${V(n?Q(e,n):`Record`)} / ${V(r?.name??`Field`)}</span><del>${V(t.before)}</del><ins>${V(t.after)}</ins></p>`}).join(``)}</div>`:``}
          <div class="modal-actions">
            <button type="button" data-action="preview-replace">Preview</button>
            <button type="button" data-action="run-replace" ${I.length?``:`disabled`}>Apply Replace</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(M===`field`){let t=e.fields.find(e=>e.id===N)??e.fields[0];return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Field settings">
          <h2>Field settings</h2>
          <label>Name <input data-field-name value="${V(t.name)}"></label>
          <label>Type <select data-field-type>${je(t.type)}</select></label>
          <label>Description <textarea data-field-description>${V(t.description)}</textarea></label>
          <label>Choice options <input data-field-options value="${V(t.options?.join(`, `)??``)}" placeholder="Yes, No, Maybe"></label>
          <label class="check-row"><input type="checkbox" data-field-required ${t.required?`checked`:``}> Required field</label>
          <label class="check-row"><input type="checkbox" data-field-hidden ${t.hidden?`checked`:``}> Hide field</label>
          <label>Calculation formula <input data-field-formula value="${V(t.formula??``)}" placeholder='JOIN(First Name, " ", Last Name)'></label>
          <p>Supported starter formulas: <code>FIELD(Field Name)</code> and <code>JOIN(Field, " text ", Other Field)</code>.</p>
          <div class="modal-actions">
            <button type="button" data-action="save-field-settings">Save field</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(M===`layout`){let t=X(),n=Z(e);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Layout designer">
          <h2>Layout designer</h2>
          <p>Arrange fields for the current ${V(T)} view. Locked layouts can still be viewed, but students should not change them.</p>
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
    `}if(M===`csvImport`&&z){let t=z.records.slice(0,5);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="CSV import preview">
          <h2>CSV import preview</h2>
          <p>${V(B)} has ${z.fields.length} field${z.fields.length===1?``:`s`} and ${z.records.length} record${z.records.length===1?``:`s`}.</p>
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
    `}if(M===`projectIdeas`)return`
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
    `;if(M===`relationship`){let t=S.schema.tables.find(e=>e.id===L)??e,n=S.schema.tables.find(e=>e.id===R)??e,r=t.fields.map(e=>`<option value="${t.id}:${e.id}">${V(e.name)}</option>`).join(``),i=n.fields.map(e=>`<option value="${n.id}:${e.id}">${V(e.name)}</option>`).join(``);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Relationships">
          <h2>Relationships</h2>
          <p>Create a simple one-to-many relationship by matching values in two fields, such as Books:Title to Reviews:Book.</p>
          <label>Name <input data-relationship-name placeholder="Books to reviews"></label>
          <label>Parent table <select data-relationship-from-table>${S.schema.tables.map(e=>`<option value="${e.id}" ${e.id===t.id?`selected`:``}>${V(e.name)}</option>`).join(``)}</select></label>
          <label>Parent match field <select data-relationship-from-field>${r}</select></label>
          <label>Related table <select data-relationship-to-table>${S.schema.tables.map(e=>`<option value="${e.id}" ${e.id===n.id?`selected`:``}>${V(e.name)}</option>`).join(``)}</select></label>
          <label>Related match field <select data-relationship-to-field>${i}</select></label>
          ${S.schema.relationships.length?`<div class="relationship-list">${S.schema.relationships.map(e=>`<p><strong>${V(e.name)}</strong><br>${V(_(S,e))}</p>`).join(``)}</div>`:`<p>No relationships yet. Add a second table first for the most useful results.</p>`}
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
  `}function $(){let e=H();W(e),x.innerHTML=`
    <header class="app-header">
      <a class="brand" href="../../pages/splatworks.html" aria-label="SplatWorks home">
        <img class="brand-icon" src="listsplat_icon.svg" alt="">
        <span>
          <strong>ListSplat<sup>TM</sup></strong>
          <small>SplatWorks<sup>TM</sup> Database Studio</small>
        </span>
      </a>
      <div class="quick-actions">
        <button type="button" class="button primary" data-action="new">New</button>
        <button type="button" class="button primary" data-action="save-json">Save JSON</button>
        <button type="button" class="button primary" data-action="open-json">Open JSON</button>
        <button type="button" class="button primary" data-action="export-csv">Export CSV</button>
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
        <label>Title <input data-project-title value="${V(S.metadata.title)}"></label>
        <label>Search <input data-search value="${V(D)}" placeholder="Find records"></label>
        <label>In <select data-search-field><option value="all">All fields</option>${e.fields.map(e=>`<option value="${e.id}" ${O===e.id?`selected`:``}>${V(e.name)}</option>`).join(``)}</select></label>
        <label>Sort <select data-sort-field><option value="">Choose field</option>${e.fields.map(e=>`<option value="${e.id}" ${k===e.id?`selected`:``}>${V(e.name)}</option>`).join(``)}</select></label>
        <button type="button" data-action="toggle-sort">${A===`asc`?`A-Z`:`Z-A`}</button>
        <label>New field <input data-new-field placeholder="Field name"></label>
        <label>Type <select data-new-field-type>${je()}</select></label>
        <button type="button" data-action="add-field">Add field</button>
        <button type="button" data-action="add-record">Add record</button>
      </section>
      <div class="workspace">
        ${Ue(e)}
        ${We(e)}
      </div>
      <footer class="status-bar">
        <span>${V(e.name)}: ${U(e).length} shown of ${e.records.length} records, ${e.fields.length} fields</span>
        <span>${V(P)}</span>
        <span>${E}</span>
      </footer>
    </main>
    <input class="hidden-file" type="file" accept=".listsplat.json,application/json" data-open-json>
    <input class="hidden-file" type="file" accept=".csv,text/csv" data-import-csv>
    ${Ge(e)}
  `}function Ke(e){return e instanceof HTMLInputElement&&e.type===`checkbox`?e.checked:e instanceof HTMLInputElement&&e.type===`number`?e.value===``?``:Number(e.value):e.value}function qe(e){let t=e.dataset.recordId,n=e.dataset.fieldId;!t||!n||(S=u(S,l(H(),t,n,Ke(e))),p(S),E=`Saved locally`)}function Je(){let e=H(),t=e.fields.find(e=>e.id===N);if(!t)return;let n=x.querySelector(`[data-field-name]`)?.value??t.name,r=x.querySelector(`[data-field-type]`)?.value??t.type,i=x.querySelector(`[data-field-description]`)?.value??``,a=x.querySelector(`[data-field-required]`)?.checked??!1,o=x.querySelector(`[data-field-hidden]`)?.checked??!1,s=x.querySelector(`[data-field-formula]`)?.value??``,ee=(x.querySelector(`[data-field-options]`)?.value??``).split(`,`).map(e=>e.trim()).filter(Boolean);q(c(e,t.id,{name:n,type:r,description:i,required:a,hidden:o,formula:s,options:ee})),M=`none`,P=`Updated ${n}.`,$()}function Ye(){let e=x.querySelector(`[data-replace-find]`)?.value??``,t=x.querySelector(`[data-replace-with]`)?.value??``,n=x.querySelector(`[data-replace-field]`)?.value??H().fields[0]?.id,r=x.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=x.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=D?U(H()).map(e=>e.id):void 0;K(`replace`);let o=he(H(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i});M=`none`,I=[],P=`Replaced ${o.count} value${o.count===1?``:`s`}.`,q(o.table)}function Xe(){let e=x.querySelector(`[data-replace-find]`)?.value??``,t=x.querySelector(`[data-replace-with]`)?.value??``,n=x.querySelector(`[data-replace-field]`)?.value??H().fields[0]?.id,r=x.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=x.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=D?U(H()).map(e=>e.id):void 0;I=me(H(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i}),P=`Preview found ${I.length} change${I.length===1?``:`s`}.`,$()}function Ze(e){let t=x.querySelector(e)?.value;if(!t)return null;let[n,r]=t.split(`:`);return n&&r?{tableId:n,fieldId:r}:null}function Qe(){let e=x.querySelector(`[data-relationship-from-table]`)?.value??``,t=x.querySelector(`[data-relationship-to-table]`)?.value??``,n=Ze(`[data-relationship-from-field]`),r=Ze(`[data-relationship-to-field]`),i=x.querySelector(`[data-relationship-name]`)?.value??``;if(!e||!t||!n||!r){P=`Choose both tables and both match fields.`,$();return}if(n.tableId!==e||r.tableId!==t){P=`Match fields must belong to the tables you chose.`,$();return}K(`relationship create`);let a=_e(i,e,n.fieldId,t,r.fieldId);P=`Created relationship: ${a.name}.`,G(ve(S,a))}function $e(){L=x.querySelector(`[data-relationship-from-table]`)?.value??L,R=x.querySelector(`[data-relationship-to-table]`)?.value??R,$()}x.addEventListener(`click`,e=>{let t=e.target,n=t.closest(`[data-action]`)?.dataset.action,r=t.closest(`[data-table-id]`)?.dataset.tableId,i=t.closest(`[data-template-id]`)?.dataset.templateId,c=t.closest(`[data-view-mode]`)?.dataset.viewMode,l=t.closest(`[data-select-record]`)?.dataset.selectRecord,u=t.closest(`[data-field-settings]`)?.dataset.fieldSettings,d=t.closest(`[data-record-action-id]`)?.dataset.recordActionId;if(r){C=r,j=new Set,W(H()),$();return}if(i){Ae(i);return}if(c){T=c,$();return}if(l){w=l,T===`table`&&$();return}if(u){N=u,M=`field`,$();return}if(n)if(Se(),n===`new`){K(`new database`);let e=a(`Untitled Database`);C=e.schema.tables[0].id,w=e.schema.tables[0].records[0]?.id??``,j=new Set,G(e)}else if(n===`save-json`)we();else if(n===`open-json`)x.querySelector(`[data-open-json]`)?.click();else if(n===`import-csv`)x.querySelector(`[data-import-csv]`)?.click();else if(n===`export-csv`)Te();else if(n===`export-report`||n===`project-packet`)Ee();else if(n===`print`)window.print();else if(n===`add-record`)K(`add record`),q(s(H()));else if(n===`add-field`){let e=x.querySelector(`[data-new-field]`),t=x.querySelector(`[data-new-field-type]`)?.value;K(`add field`),q(o(H(),e?.value||`New Field`,t??`text`))}else if(n===`add-table`){let e=window.prompt(`New table name?`,`New Table`)??``;K(`add table`);let t=ne(S,e);C=t.schema.tables.at(-1)?.id??C,w=H().records[0]?.id??``,G(t)}else if(n===`duplicate-record`&&d)K(`duplicate record`),q(ee(H(),d));else if(n===`delete-record`&&d)K(`delete record`),q(te(H(),d));else if(n===`toggle-sort`)A=A===`asc`?`desc`:`asc`,$();else if(n===`sort`)k&&q(de(H(),k,A));else if(n===`duplicates`){let e=O===`all`?H().fields[0]?.id:O;j=new Set(fe(H(),e).map(e=>e.id)),P=`Found ${j.size} duplicate record${j.size===1?``:`s`}.`,$()}else if(n===`missing`){let e=O===`all`?H().fields[0]?.id:O;j=new Set(pe(H(),e).map(e=>e.id)),P=`Found ${j.size} record${j.size===1?``:`s`} with missing values.`,$()}else if(n===`clear-find`)D=``,j=new Set,P=`Showing all records.`,$();else if(n===`replace`)I=[],M=`replace`,$();else if(n===`preview-replace`)Xe();else if(n===`run-replace`)Ye();else if(n===`apply-csv-new`)ke(`new`);else if(n===`apply-csv-append`)ke(`append`);else if(n===`save-field-settings`)K(`field settings`),Je();else if(n===`layout-designer`||n===`lock-layout`)M=`layout`,$();else if(n===`layout-field-up`||n===`layout-field-down`){let e=t.closest(`[data-layout-field-id]`)?.dataset.layoutFieldId,r=X();if(e&&r){let t=Z(H()).map(e=>e.id),r=t.indexOf(e),i=n===`layout-field-up`?r-1:r+1;r>=0&&i>=0&&i<t.length&&([t[r],t[i]]=[t[i],t[r]],K(`layout order`),Fe({fieldOrder:t}),M=`layout`)}}else if(n===`save-layout-settings`){let e=x.querySelector(`[data-layout-locked]`)?.checked??!1;K(`layout settings`),Fe({locked:e,fieldOrder:Z(H()).map(e=>e.id)}),M=`none`}else n===`create-relationship`?Qe():n===`undo-change`?xe():n===`close-dialog`?(M=`none`,I=[],z=null,$()):n.endsWith(`-view`)?(T=n.replace(`-view`,``),$()):n===`templates`?(P=`Template starters are in the Teacher panel.`,$()):n===`project-ideas`?(M=`projectIdeas`,$()):n===`relationships`?(M=`relationship`,$()):n.startsWith(`help-`)||n===`functions`||n===`quality`?(M=`help`,$()):(P=`This ListSplatTM tool is planned for a later build.`,$())}),x.addEventListener(`change`,e=>{let t=e.target;if(t.matches(`[data-open-json]`)&&t instanceof HTMLInputElement&&t.files?.[0])De(t.files[0]);else if(t.matches(`[data-import-csv]`)&&t instanceof HTMLInputElement&&t.files?.[0])Oe(t.files[0]);else if(t.matches(`[data-search-field]`))O=t.value,j=new Set,$();else if(t.matches(`[data-sort-field]`))k=t.value,k&&q(de(H(),k,A));else if(t.matches(`[data-relationship-from-table], [data-relationship-to-table]`))$e();else if(t.matches(`.cell-input, .cell-checkbox, .image-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement))if(t instanceof HTMLInputElement&&t.type===`file`&&t.files?.[0]){let e=t.dataset.recordId,n=t.dataset.fieldId,r=t.files[0];if(e&&n){let t=new FileReader;t.addEventListener(`load`,()=>{K(`image upload`),S=u(S,l(H(),e,n,String(t.result??``))),p(S),$()}),t.readAsDataURL(r)}}else qe(t)}),x.addEventListener(`input`,e=>{let t=e.target;if(t.matches(`[data-project-title]`)){Ce(t.value);return}if(t.matches(`[data-search]`)){D=t.value,j=new Set,$();return}t.matches(`.cell-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)&&qe(t)}),document.addEventListener(`click`,e=>{e.target.closest(`.menu`)||Se()}),document.addEventListener(`toggle`,e=>{let t=e.target;!(t instanceof HTMLDetailsElement)||!t.matches(`.menu`)||!t.open||document.querySelectorAll(`.menu[open]`).forEach(e=>{e!==t&&(e.open=!1)})},!0),$();