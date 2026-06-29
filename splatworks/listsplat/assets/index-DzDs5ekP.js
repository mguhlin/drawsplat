(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={text:``,longText:``,number:0,currency:0,percent:0,date:``,checkbox:!1,choice:``,image:``,link:``,calculation:``};function t(e){return`${e}_${Math.random().toString(36).slice(2,10)}`}function n(e,n=`text`){return{id:t(`field`),name:e,type:n,description:``,required:!1,hidden:!1,options:n===`choice`?[`Yes`,`No`]:void 0}}function r(n,r={}){let i=new Date().toISOString(),a=Object.fromEntries(n.map(t=>[t.id,r[t.id]??e[t.type]]));return{id:t(`record`),createdAt:i,updatedAt:i,values:a}}function i(e,i){let a=i.map(e=>n(e));return{id:t(`table`),name:e,fields:a,records:[r(a)]}}function a(e=`Animal Research Database`){let n=new Date().toISOString(),a=i(`Animals`,[`Animal`,`Habitat`,`Diet`,`Interesting Fact`]);return a.records=[r(a.fields,{[a.fields[0].id]:`Axolotl`,[a.fields[1].id]:`Freshwater lakes`,[a.fields[2].id]:`Worms and insects`,[a.fields[3].id]:`It can regrow some body parts.`}),r(a.fields,{[a.fields[0].id]:`Red panda`,[a.fields[1].id]:`Mountain forests`,[a.fields[2].id]:`Bamboo and fruit`,[a.fields[3].id]:`It uses its tail like a blanket.`})],{app:`ListSplatTM`,version:1,createdAt:n,updatedAt:n,metadata:{title:e,author:``,className:``},schema:{tables:[a],relationships:[]},layouts:[{id:t(`layout`),name:`Table View`,tableId:a.id,mode:`table`,locked:!1},{id:t(`layout`),name:`Record Form`,tableId:a.id,mode:`form`,locked:!1},{id:t(`layout`),name:`Research Cards`,tableId:a.id,mode:`cards`,locked:!1}],teacher:{studentView:!1,notes:[`Ask students to add source notes before printing a report.`],rubric:[]}}}function o(t,r,i=`text`){let a=n(r.trim()||`New Field`,i);return{...t,fields:[...t.fields,a],records:t.records.map(t=>({...t,updatedAt:new Date().toISOString(),values:{...t.values,[a.id]:e[i]}}))}}function s(e){return{...e,records:[...e.records,r(e.fields)]}}function c(e,t,n){return{...e,fields:e.fields.map(e=>e.id===t?{...e,...n}:e)}}function l(e,t){let n=e.records.find(e=>e.id===t);return n?{...e,records:[...e.records,r(e.fields,n.values)]}:e}function ee(e,t){return e.records.length<=1?e:{...e,records:e.records.filter(e=>e.id!==t)}}function u(e,t,n,r){return{...e,records:e.records.map(e=>e.id===t?{...e,updatedAt:new Date().toISOString(),values:{...e.values,[n]:r}}:e)}}function d(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t.id?t:e)}}}function te(e,n){let r=i(n.trim()||`New Table`,[`Name`,`Notes`]);return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:[...e.schema.tables,r]},layouts:[...e.layouts,{id:t(`layout`),name:`${r.name} Table`,tableId:r.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${r.name} Form`,tableId:r.id,mode:`form`,locked:!1}]}}function f(e){if(!e||typeof e!=`object`)throw Error(`This is not a ListSplatTM project file.`);let t=e;if(t.app!==`ListSplatTM`||t.version!==1||!t.schema?.tables)throw Error(`This file is not a supported .listsplat.json project.`)}function ne(e){let t=[],n=``,r=[],i=!1;for(let a=0;a<e.length;a+=1){let o=e[a],s=e[a+1];i&&o===`"`&&s===`"`?(n+=`"`,a+=1):o===`"`?i=!i:!i&&o===`,`?(r.push(n),n=``):!i&&(o===`
`||o===`\r`)?(o===`\r`&&s===`
`&&(a+=1),r.push(n),r.some(e=>e.length>0)&&t.push(r),r=[],n=``):n+=o}return r.push(n),r.some(e=>e.length>0)&&t.push(r),t}function p(e,t){let i=ne(t),a=(i[0]?.map((e,t)=>e.trim()||`Field ${t+1}`)??[`Field 1`]).map(e=>n(e)),o=i.slice(1).map(e=>r(a,Object.fromEntries(a.map((t,n)=>[t.id,e[n]??``]))));return{id:`table_${Date.now().toString(36)}`,name:e,fields:a,records:o.length>0?o:[r(a)]}}function m(e){let t=e==null?``:String(e);return/[",\n\r]/.test(t)?`"${t.replaceAll(`"`,`""`)}"`:t}function re(e){return[e.fields.map(e=>m(e.name)).join(`,`),...e.records.map(t=>e.fields.map(e=>m(t.values[e.id])).join(`,`))].join(`
`)}var h=`listsplat.autosave.v1`;function g(e){localStorage.setItem(h,JSON.stringify(e))}function ie(){let e=localStorage.getItem(h);if(!e)return null;let t=JSON.parse(e);return f(t),t}function _(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,a.click(),URL.revokeObjectURL(i)}function ae(e,t){return e.records.map(e=>Number(e.values[t])).filter(e=>Number.isFinite(e))}function v(e){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)).map(t=>{let n=ae(e,t.id),r=n.reduce((e,t)=>e+t,0);return{fieldId:t.id,fieldName:t.name,count:n.length,sum:r,average:n.length?r/n.length:0,minimum:n.length?Math.min(...n):0,maximum:n.length?Math.max(...n):0}})}function oe(e,t,n){let r=e.trim(),i=r.match(/^FIELD\(([^)]+)\)$/i);if(i){let e=i[1].trim().toLowerCase(),r=t.fields.find(t=>t.name.toLowerCase()===e);return r?String(n.values[r.id]??``):``}let a=r.match(/^JOIN\((.+)\)$/i);return a?a[1].split(`,`).map(e=>{let r=e.trim();if(r.startsWith(`"`)&&r.endsWith(`"`))return r.slice(1,-1);let i=t.fields.find(e=>e.name.toLowerCase()===r.toLowerCase());return i?String(n.values[i.id]??``):r}).join(``):``}function y(e){return e==null?``:String(e)}function se(e,t){let n=t.query.trim();if(!n)return e.records;let r=n.toLowerCase();return e.records.filter(n=>(t.fieldId===`all`?e.fields.map(e=>e.id):[t.fieldId]).some(e=>y(n.values[e]).toLowerCase().includes(r)))}function b(e,t,n){let r=n===`asc`?1:-1;return{...e,records:[...e.records].sort((e,n)=>{let i=y(e.values[t]),a=y(n.values[t]),o=Number(i),s=Number(a);return!Number.isNaN(o)&&!Number.isNaN(s)?(o-s)*r:i.localeCompare(a,void 0,{numeric:!0,sensitivity:`base`})*r})}}function ce(e,t){let n=new Map;return e.records.forEach(e=>{let r=y(e.values[t]).trim().toLowerCase();r&&n.set(r,(n.get(r)??0)+1)}),e.records.filter(e=>{let r=y(e.values[t]).trim().toLowerCase();return r?(n.get(r)??0)>1:!1})}function le(e,t){return e.records.filter(e=>!y(e.values[t]).trim())}function ue(e,t){if(!t.find)return{table:e,count:0};let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=new RegExp(r,n),a=new Set(t.recordIds??e.records.map(e=>e.id)),o=0,s=e.records.map(e=>{if(!a.has(e.id))return e;let n=!1,r={...e.values};return t.fieldIds.forEach(e=>{let a=y(r[e]),s=a.replace(i,()=>(o+=1,t.replacement));s!==a&&(n=!0,r[e]=s)}),n?{...e,updatedAt:new Date().toISOString(),values:r}:e});return{table:{...e,records:s},count:o}}function x(e,t,n,r,i,a){return{id:e,title:t,gradeBand:n,goal:r,table:p(t,i),reflectionQuestions:a}}var S=[x(`classroom-library`,`Classroom Library Catalog`,`Grades 3-8`,`Track books, genres, reading levels, and recommendations.`,`Title,Author,Genre,Pages,Who would enjoy it?
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
Apollo 11 mission,NASA,1969,Space exploration,First humans walked on the Moon`,[`How should the exhibit be grouped?`,`What field would help visitors understand the item?`])];function C(e){let t=e.table.fields.map(e=>({...e,id:`${e.id}_${Date.now().toString(36)}`})),n=e.table.records.map(n=>r(t,Object.fromEntries(e.table.fields.map((e,r)=>[t[r].id,n.values[e.id]??``]))));return{...e.table,id:`table_${e.id}_${Date.now().toString(36)}`,fields:t,records:n}}var w=document.querySelector(`#app`);if(!w)throw Error(`ListSplatTM app root was not found.`);var T=w,E=ie()??a(),D=E.schema.tables[0].id,O=E.schema.tables[0].records[0]?.id??``,k=`table`,A=`Saved locally`,j=``,M=`all`,N=``,P=`asc`,F=new Set,I=`none`,L=``,R=`Tip: Start with one table, then add relationships when your project needs them.`;function z(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function B(){return E.schema.tables.find(e=>e.id===D)??E.schema.tables[0]}function V(e){let t=se(e,{query:j,fieldId:M});return F.size>0?t.filter(e=>F.has(e.id)):t}function H(e){e.records.some(e=>e.id===O)||(O=e.records[0]?.id??``)}function U(e){E=e,H(B()),g(E),A=`Saved locally`,Q()}function W(e){D=e.id,U(d(E,e))}function G(){document.querySelectorAll(`.menu[open]`).forEach(e=>{e.open=!1})}function de(e){U({...E,updatedAt:new Date().toISOString(),metadata:{...E.metadata,title:e||`Untitled Database`}})}function fe(){_(`${E.metadata.title||`listsplat-project`}.listsplat.json`,JSON.stringify(E,null,2),`application/json`)}function pe(){_(`${B().name}.csv`,re(B()),`text/csv;charset=utf-8`)}function me(){let e=B(),t=V(e),n=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${z(E.metadata.title)}</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{color:#5b21b6}</style></head>
<body><h1>${z(E.metadata.title)}</h1><p>${z(e.name)} report from ListSplatTM.</p>
<table><thead><tr>${e.fields.map(e=>`<th>${z(e.name)}</th>`).join(``)}</tr></thead>
<tbody>${t.map(t=>`<tr>${e.fields.map(n=>`<td>${z(J(e,t,n.id))}</td>`).join(``)}</tr>`).join(``)}</tbody></table></body></html>`;_(`${E.metadata.title||`listsplat-report`}.html`,n,`text/html;charset=utf-8`)}function he(e){e.text().then(e=>{let t=JSON.parse(e);f(t),D=t.schema.tables[0].id,O=t.schema.tables[0].records[0]?.id??``,U(t)}).catch(e=>{window.alert(e instanceof Error?e.message:`Could not open this ListSplatTM file.`)})}function ge(e){e.text().then(t=>{let n=p(e.name.replace(/\.csv$/i,``),t);D=n.id,O=n.records[0]?.id??``,R=`Imported ${n.records.length} records from ${e.name}.`,U({...E,updatedAt:new Date().toISOString(),schema:{...E.schema,tables:[...E.schema.tables,n]},layouts:[...E.layouts,{id:`layout_${Date.now().toString(36)}`,name:`${n.name} Table`,tableId:n.id,mode:`table`,locked:!1}]})})}function _e(e){let t=S.find(t=>t.id===e);if(!t)return;let n=C(t);D=n.id,O=n.records[0]?.id??``,R=`Loaded ${t.title}.`,U({...E,metadata:{...E.metadata,title:t.title},schema:{...E.schema,tables:[...E.schema.tables,n]},teacher:{...E.teacher,notes:t.reflectionQuestions}})}function K(e,t){return`
    <details class="menu">
      <summary>${e}</summary>
      <div class="menu-panel">
        ${t.map(([e,t])=>`<button type="button" data-action="${e}">${t}</button>`).join(``)}
      </div>
    </details>
  `}function q(e=`text`){return[[`text`,`Short text`],[`longText`,`Long text`],[`number`,`Number`],[`currency`,`Currency`],[`percent`,`Percent`],[`date`,`Date`],[`checkbox`,`Checkbox`],[`choice`,`Choice`],[`image`,`Image`],[`link`,`Link`],[`calculation`,`Calculation`]].map(([t,n])=>`<option value="${t}" ${e===t?`selected`:``}>${n}</option>`).join(``)}function J(e,t,n){let r=e.fields.find(e=>e.id===n);return r?.type===`calculation`&&r.formula?oe(r.formula,e,t):t.values[n]??``}function Y(e,t,n,r){let i=e.fields.find(e=>e.id===n),a=J(e,t,n),o=`aria-label="${z(i?.name??`Field`)}, record ${r+1}" data-record-id="${t.id}" data-field-id="${n}"`;return i?.type===`checkbox`?`<input class="cell-checkbox" type="checkbox" ${o} ${a===!0||a===`true`?`checked`:``}>`:i?.type===`longText`?`<textarea class="cell-input" ${o}>${z(a)}</textarea>`:i?.type===`date`?`<input class="cell-input" type="date" ${o} value="${z(a)}">`:i?.type===`number`||i?.type===`currency`||i?.type===`percent`?`<input class="cell-input" type="number" step="any" ${o} value="${z(a)}">`:i?.type===`calculation`?`<output class="calc-output">${z(a)}</output>`:`<input class="cell-input" ${o} value="${z(a)}">`}function ve(e){return`
    <div class="table-tabs">
      ${E.schema.tables.map(t=>`<button type="button" class="table-tab ${t.id===e.id?`active`:``}" data-table-id="${t.id}">${z(t.name)}</button>`).join(``)}
    </div>
  `}function X(e,t){return`
    <div class="data-grid-wrap">
      <table class="data-grid">
        <thead>
          <tr>
            <th>#</th>
            ${e.fields.filter(e=>!e.hidden).map(e=>`
                  <th>
                    <button type="button" class="field-button" data-field-settings="${e.id}">
                      ${z(e.name)}<br><small>${z(e.type)}</small>
                    </button>
                  </th>
                `).join(``)}
            <th>Record</th>
          </tr>
        </thead>
        <tbody>
          ${t.map((t,n)=>`
                <tr class="${t.id===O?`active-row`:``}" data-record-row="${t.id}">
                  <td><button type="button" class="row-button" data-select-record="${t.id}">${n+1}</button></td>
                  ${e.fields.filter(e=>!e.hidden).map(r=>`<td>${Y(e,t,r.id,n)}</td>`).join(``)}
                  <td class="record-actions">
                    <button type="button" data-action="duplicate-record" data-record-action-id="${t.id}">Copy</button>
                    <button type="button" data-action="delete-record" data-record-action-id="${t.id}">Delete</button>
                  </td>
                </tr>
              `).join(``)}
        </tbody>
      </table>
    </div>
  `}function ye(e){let t=e.records.find(e=>e.id===O)??e.records[0];return t?`
    <div class="form-view">
      <div class="form-nav">
        ${e.records.map((e,n)=>`<button type="button" class="${e.id===t.id?`active`:``}" data-select-record="${e.id}">Record ${n+1}</button>`).join(``)}
      </div>
      <div class="record-form">
        ${e.fields.filter(e=>!e.hidden).map((n,r)=>`
              <label>
                <span>${z(n.name)}</span>
                ${Y(e,t,n.id,r)}
                ${n.description?`<small>${z(n.description)}</small>`:``}
              </label>
            `).join(``)}
      </div>
    </div>
  `:`<div class="empty-panel">Add a record to use form view.</div>`}function be(e,t){return`
    <div class="cards-view ${k===`gallery`?`gallery-view`:``}">
      ${t.map(t=>`
            <article class="record-card" data-select-record="${t.id}">
              ${e.fields.filter(e=>!e.hidden).slice(0,k===`gallery`?5:8).map(n=>`<p><strong>${z(n.name)}</strong><span>${z(J(e,t,n.id))}</span></p>`).join(``)}
            </article>
          `).join(``)}
    </div>
  `}function xe(e,t){return`
    <div class="labels-view">
      ${t.map(t=>`
            <article class="print-label">
              ${e.fields.filter(e=>!e.hidden).slice(0,4).map(n=>`<p><strong>${z(n.name)}:</strong> ${z(J(e,t,n.id))}</p>`).join(``)}
            </article>
          `).join(``)}
    </div>
  `}function Se(e,t){let n=v(e);return`
    <div class="report-view">
      <header>
        <h2>${z(E.metadata.title)}</h2>
        <p>${z(e.name)} report. ${t.length} record${t.length===1?``:`s`} shown.</p>
      </header>
      ${X(e,t)}
      ${n.length?`<section class="summary-strip">${n.map(e=>`<div><strong>${z(e.fieldName)}</strong><span>Sum ${e.sum.toLocaleString()} | Avg ${e.average.toFixed(2)}</span></div>`).join(``)}</section>`:`<p class="empty-panel">Add a number, currency, or percent field to see summaries.</p>`}
    </div>
  `}function Z(e){let t=V(e),n=k===`form`?ye(e):k===`cards`||k===`gallery`?be(e,t):k===`labels`?xe(e,t):k===`report`?Se(e,t):X(e,t);return`
    <section class="database-panel" aria-label="Database table">
      ${ve(e)}
      <div class="view-tabs" role="group" aria-label="Layout modes">
        ${[`table`,`form`,`cards`,`gallery`,`labels`,`report`].map(e=>`<button type="button" class="${k===e?`active`:``}" data-view-mode="${e}">${e}</button>`).join(``)}
      </div>
      ${n}
    </section>
  `}function Ce(e){let t=v(e);return`
    <aside class="teacher-panel" aria-label="Teacher tools and database stats">
      <h2>Database Check</h2>
      <div class="stat-grid">
        <div class="stat-card"><strong>${V(e).length}</strong> shown</div>
        <div class="stat-card"><strong>${e.records.length}</strong> records</div>
        <div class="stat-card"><strong>${e.fields.length}</strong> fields</div>
        <div class="stat-card"><strong>${E.schema.tables.length}</strong> tables</div>
      </div>
      ${t.map(e=>`
            <div class="template-card">
              <strong>${z(e.fieldName)} summary</strong>
              <span>Sum: ${e.sum.toLocaleString()}</span>
              <span>Average: ${e.average.toFixed(2)}</span>
            </div>
          `).join(``)}
      <h3>Template Starters</h3>
      ${S.map(e=>`
            <div class="template-card">
              <strong>${z(e.title)}</strong>
              <span>${z(e.gradeBand)}</span>
              <p>${z(e.goal)}</p>
              <button type="button" data-template-id="${e.id}">Use template</button>
            </div>
          `).join(``)}
    </aside>
  `}function we(e){if(I===`none`)return``;if(I===`replace`)return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Replace values">
          <h2>Replace values</h2>
          <label>Find <input data-replace-find placeholder="Text to find"></label>
          <label>Replace with <input data-replace-with placeholder="New text"></label>
          <label>Field <select data-replace-field>${e.fields.map(e=>`<option value="${e.id}">${z(e.name)}</option>`).join(``)}</select></label>
          <p>Replacement applies to the current found set when search is active. You can undo by re-opening the saved JSON copy if needed.</p>
          <div class="modal-actions">
            <button type="button" data-action="run-replace">Replace</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `;if(I===`field`){let t=e.fields.find(e=>e.id===L)??e.fields[0];return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Field settings">
          <h2>Field settings</h2>
          <label>Name <input data-field-name value="${z(t.name)}"></label>
          <label>Type <select data-field-type>${q(t.type)}</select></label>
          <label>Description <textarea data-field-description>${z(t.description)}</textarea></label>
          <label class="check-row"><input type="checkbox" data-field-required ${t.required?`checked`:``}> Required field</label>
          <label class="check-row"><input type="checkbox" data-field-hidden ${t.hidden?`checked`:``}> Hide field</label>
          <label>Calculation formula <input data-field-formula value="${z(t.formula??``)}" placeholder='JOIN(First Name, " ", Last Name)'></label>
          <p>Supported starter formulas: <code>FIELD(Field Name)</code> and <code>JOIN(Field, " text ", Other Field)</code>.</p>
          <div class="modal-actions">
            <button type="button" data-action="save-field-settings">Save field</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}return I===`projectIdeas`?`
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
    `:I===`relationship`?`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Relationships">
          <h2>Relationships</h2>
          <p>Relationship building is staged after flat tables, forms, CSV, find, and reports. The target v1 model is one-to-many: one animal can have many observations, one book can have many reviews.</p>
          <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
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
  `}function Q(){let e=B();H(e),T.innerHTML=`
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
        ${K(`File`,[[`new`,`New database`],[`save-json`,`Save .listsplat.json`],[`open-json`,`Open .listsplat.json`],[`import-csv`,`Import CSV`],[`export-csv`,`Export CSV`],[`export-report`,`Export report HTML`],[`print`,`Print`]])}
        ${K(`Edit`,[[`add-record`,`Add record`],[`add-field`,`Add field`],[`find`,`Find records`],[`replace`,`Replace values`]])}
        ${K(`Data`,[[`add-table`,`New table`],[`sort`,`Sort records`],[`missing`,`Find missing values`],[`duplicates`,`Find duplicates`],[`clear-find`,`Show all records`]])}
        ${K(`Layout`,[[`table-view`,`Table view`],[`form-view`,`Form view`],[`cards-view`,`Card view`],[`gallery-view`,`Gallery view`],[`labels-view`,`Label view`],[`report-view`,`Report view`]])}
        ${K(`Tools`,[[`functions`,`Functions`],[`relationships`,`Relationships`],[`quality`,`Data quality check`]])}
        ${K(`View`,[[`student-view`,`Student view`],[`teacher-notes`,`Teacher notes`]])}
        <span class="menu-spacer"></span>
        ${K(`Teacher`,[[`templates`,`Template Library`],[`project-ideas`,`Project Ideas`],[`lock-layout`,`Lock Layout`],[`project-packet`,`Print Project Packet`]])}
        ${K(`Help`,[[`help-start`,`Start a database`],[`help-csv`,`Import and export CSV`],[`help-layouts`,`Forms and reports`],[`help-privacy`,`Privacy and saving`]])}
      </nav>
      <section class="toolbar" aria-label="Database toolbar">
        <label>Title <input data-project-title value="${z(E.metadata.title)}"></label>
        <label>Search <input data-search value="${z(j)}" placeholder="Find records"></label>
        <label>In <select data-search-field><option value="all">All fields</option>${e.fields.map(e=>`<option value="${e.id}" ${M===e.id?`selected`:``}>${z(e.name)}</option>`).join(``)}</select></label>
        <label>Sort <select data-sort-field><option value="">Choose field</option>${e.fields.map(e=>`<option value="${e.id}" ${N===e.id?`selected`:``}>${z(e.name)}</option>`).join(``)}</select></label>
        <button type="button" data-action="toggle-sort">${P===`asc`?`A-Z`:`Z-A`}</button>
        <label>New field <input data-new-field placeholder="Field name"></label>
        <label>Type <select data-new-field-type>${q()}</select></label>
        <button type="button" data-action="add-field">Add field</button>
        <button type="button" data-action="add-record">Add record</button>
      </section>
      <div class="workspace">
        ${Z(e)}
        ${Ce(e)}
      </div>
      <footer class="status-bar">
        <span>${z(e.name)}: ${V(e).length} shown of ${e.records.length} records, ${e.fields.length} fields</span>
        <span>${z(R)}</span>
        <span>${A}</span>
      </footer>
    </main>
    <input class="hidden-file" type="file" accept=".listsplat.json,application/json" data-open-json>
    <input class="hidden-file" type="file" accept=".csv,text/csv" data-import-csv>
    ${we(e)}
  `}function Te(e){return e instanceof HTMLInputElement&&e.type===`checkbox`?e.checked:e instanceof HTMLInputElement&&e.type===`number`?e.value===``?``:Number(e.value):e.value}function $(e){let t=e.dataset.recordId,n=e.dataset.fieldId;!t||!n||(E=d(E,u(B(),t,n,Te(e))),g(E),A=`Saved locally`)}function Ee(){let e=B(),t=e.fields.find(e=>e.id===L);if(!t)return;let n=T.querySelector(`[data-field-name]`)?.value??t.name,r=T.querySelector(`[data-field-type]`)?.value??t.type,i=T.querySelector(`[data-field-description]`)?.value??``,a=T.querySelector(`[data-field-required]`)?.checked??!1,o=T.querySelector(`[data-field-hidden]`)?.checked??!1,s=T.querySelector(`[data-field-formula]`)?.value??``;W(c(e,t.id,{name:n,type:r,description:i,required:a,hidden:o,formula:s})),I=`none`,R=`Updated ${n}.`,Q()}function De(){let e=T.querySelector(`[data-replace-find]`)?.value??``,t=T.querySelector(`[data-replace-with]`)?.value??``,n=T.querySelector(`[data-replace-field]`)?.value??B().fields[0]?.id,r=j?V(B()).map(e=>e.id):void 0,i=ue(B(),{fieldIds:[n],find:e,replacement:t,recordIds:r});I=`none`,R=`Replaced ${i.count} value${i.count===1?``:`s`}.`,W(i.table)}T.addEventListener(`click`,e=>{let t=e.target,n=t.closest(`[data-action]`)?.dataset.action,r=t.closest(`[data-table-id]`)?.dataset.tableId,i=t.closest(`[data-template-id]`)?.dataset.templateId,c=t.closest(`[data-view-mode]`)?.dataset.viewMode,u=t.closest(`[data-select-record]`)?.dataset.selectRecord,d=t.closest(`[data-field-settings]`)?.dataset.fieldSettings,f=t.closest(`[data-record-action-id]`)?.dataset.recordActionId;if(r){D=r,F=new Set,H(B()),Q();return}if(i){_e(i);return}if(c){k=c,Q();return}if(u){O=u,k===`table`&&Q();return}if(d){L=d,I=`field`,Q();return}if(n)if(G(),n===`new`){let e=a(`Untitled Database`);D=e.schema.tables[0].id,O=e.schema.tables[0].records[0]?.id??``,F=new Set,U(e)}else if(n===`save-json`)fe();else if(n===`open-json`)T.querySelector(`[data-open-json]`)?.click();else if(n===`import-csv`)T.querySelector(`[data-import-csv]`)?.click();else if(n===`export-csv`)pe();else if(n===`export-report`||n===`project-packet`)me();else if(n===`print`)window.print();else if(n===`add-record`)W(s(B()));else if(n===`add-field`){let e=T.querySelector(`[data-new-field]`),t=T.querySelector(`[data-new-field-type]`)?.value;W(o(B(),e?.value||`New Field`,t??`text`))}else if(n===`add-table`){let e=window.prompt(`New table name?`,`New Table`)??``,t=te(E,e);D=t.schema.tables.at(-1)?.id??D,O=B().records[0]?.id??``,U(t)}else if(n===`duplicate-record`&&f)W(l(B(),f));else if(n===`delete-record`&&f)W(ee(B(),f));else if(n===`toggle-sort`)P=P===`asc`?`desc`:`asc`,Q();else if(n===`sort`)N&&W(b(B(),N,P));else if(n===`duplicates`){let e=M===`all`?B().fields[0]?.id:M;F=new Set(ce(B(),e).map(e=>e.id)),R=`Found ${F.size} duplicate record${F.size===1?``:`s`}.`,Q()}else if(n===`missing`){let e=M===`all`?B().fields[0]?.id:M;F=new Set(le(B(),e).map(e=>e.id)),R=`Found ${F.size} record${F.size===1?``:`s`} with missing values.`,Q()}else n===`clear-find`?(j=``,F=new Set,R=`Showing all records.`,Q()):n===`replace`?(I=`replace`,Q()):n===`run-replace`?De():n===`save-field-settings`?Ee():n===`close-dialog`?(I=`none`,Q()):n.endsWith(`-view`)?(k=n.replace(`-view`,``),Q()):n===`templates`?(R=`Template starters are in the Teacher panel.`,Q()):n===`project-ideas`?(I=`projectIdeas`,Q()):n===`relationships`?(I=`relationship`,Q()):n.startsWith(`help-`)||n===`functions`||n===`quality`?(I=`help`,Q()):(R=`This ListSplatTM tool is planned for a later build.`,Q())}),T.addEventListener(`change`,e=>{let t=e.target;t.matches(`[data-open-json]`)&&t instanceof HTMLInputElement&&t.files?.[0]?he(t.files[0]):t.matches(`[data-import-csv]`)&&t instanceof HTMLInputElement&&t.files?.[0]?ge(t.files[0]):t.matches(`[data-search-field]`)?(M=t.value,F=new Set,Q()):t.matches(`[data-sort-field]`)?(N=t.value,N&&W(b(B(),N,P))):t.matches(`.cell-input, .cell-checkbox`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement)&&$(t)}),T.addEventListener(`input`,e=>{let t=e.target;if(t.matches(`[data-project-title]`)){de(t.value);return}if(t.matches(`[data-search]`)){j=t.value,F=new Set,Q();return}t.matches(`.cell-input`)&&$(t)}),document.addEventListener(`click`,e=>{e.target.closest(`.menu`)||G()}),Q();