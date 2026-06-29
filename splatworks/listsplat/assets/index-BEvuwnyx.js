(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={text:``,longText:``,number:0,currency:0,percent:0,date:``,checkbox:!1,choice:``,image:``,link:``,calculation:``};function t(e){return`${e}_${Math.random().toString(36).slice(2,10)}`}function n(e,n=`text`){return{id:t(`field`),name:e,type:n,description:``,required:!1,hidden:!1,options:n===`choice`?[`Yes`,`No`]:void 0}}function r(n,r={}){let i=new Date().toISOString(),a=Object.fromEntries(n.map(t=>[t.id,r[t.id]??e[t.type]]));return{id:t(`record`),createdAt:i,updatedAt:i,values:a}}function i(e,i){let a=i.map(e=>n(e));return{id:t(`table`),name:e,fields:a,records:[r(a)]}}function a(e=`Animal Research Database`){let n=new Date().toISOString(),a=i(`Animals`,[`Animal`,`Habitat`,`Diet`,`Interesting Fact`]);return a.records=[r(a.fields,{[a.fields[0].id]:`Axolotl`,[a.fields[1].id]:`Freshwater lakes`,[a.fields[2].id]:`Worms and insects`,[a.fields[3].id]:`It can regrow some body parts.`}),r(a.fields,{[a.fields[0].id]:`Red panda`,[a.fields[1].id]:`Mountain forests`,[a.fields[2].id]:`Bamboo and fruit`,[a.fields[3].id]:`It uses its tail like a blanket.`})],{app:`ListSplatTM`,version:1,createdAt:n,updatedAt:n,metadata:{title:e,author:``,className:``},schema:{tables:[a],relationships:[]},layouts:[{id:t(`layout`),name:`Table View`,tableId:a.id,mode:`table`,locked:!1},{id:t(`layout`),name:`Record Form`,tableId:a.id,mode:`form`,locked:!1},{id:t(`layout`),name:`Research Cards`,tableId:a.id,mode:`cards`,locked:!1}],teacher:{studentView:!1,notes:[`Ask students to add source notes before printing a report.`],rubric:[]}}}function o(t,r,i=`text`){let a=n(r.trim()||`New Field`,i);return{...t,fields:[...t.fields,a],records:t.records.map(t=>({...t,updatedAt:new Date().toISOString(),values:{...t.values,[a.id]:e[i]}}))}}function s(e){return{...e,records:[...e.records,r(e.fields)]}}function c(e,t,n){return{...e,fields:e.fields.map(e=>e.id===t?{...e,...n}:e)}}function ee(e,t){let n=e.records.find(e=>e.id===t);return n?{...e,records:[...e.records,r(e.fields,n.values)]}:e}function te(e,t){return e.records.length<=1?e:{...e,records:e.records.filter(e=>e.id!==t)}}function l(e,t,n,r){return{...e,records:e.records.map(e=>e.id===t?{...e,updatedAt:new Date().toISOString(),values:{...e.values,[n]:r}}:e)}}function u(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t.id?t:e)}}}function ne(e,n){let r=i(n.trim()||`New Table`,[`Name`,`Notes`]);return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:[...e.schema.tables,r]},layouts:[...e.layouts,{id:t(`layout`),name:`${r.name} Table`,tableId:r.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${r.name} Form`,tableId:r.id,mode:`form`,locked:!1}]}}function d(e){if(!e||typeof e!=`object`)throw Error(`This is not a ListSplatTM project file.`);let t=e;if(t.app!==`ListSplatTM`||t.version!==1||!t.schema?.tables)throw Error(`This file is not a supported .listsplat.json project.`)}function re(e){let t=[],n=``,r=[],i=!1;for(let a=0;a<e.length;a+=1){let o=e[a],s=e[a+1];i&&o===`"`&&s===`"`?(n+=`"`,a+=1):o===`"`?i=!i:!i&&o===`,`?(r.push(n),n=``):!i&&(o===`
`||o===`\r`)?(o===`\r`&&s===`
`&&(a+=1),r.push(n),r.some(e=>e.length>0)&&t.push(r),r=[],n=``):n+=o}return r.push(n),r.some(e=>e.length>0)&&t.push(r),t}function ie(e,t){let i=re(t),a=(i[0]?.map((e,t)=>e.trim()||`Field ${t+1}`)??[`Field 1`]).map(e=>n(e)),o=i.slice(1).map(e=>r(a,Object.fromEntries(a.map((t,n)=>[t.id,e[n]??``]))));return{id:`table_${Date.now().toString(36)}`,name:e,fields:a,records:o.length>0?o:[r(a)]}}function f(e){let t=e==null?``:String(e);return/[",\n\r]/.test(t)?`"${t.replaceAll(`"`,`""`)}"`:t}function ae(e){return[e.fields.map(e=>f(e.name)).join(`,`),...e.records.map(t=>e.fields.map(e=>f(t.values[e.id])).join(`,`))].join(`
`)}var p=`listsplat.autosave.v1`;function m(e){localStorage.setItem(p,JSON.stringify(e))}function oe(){let e=localStorage.getItem(p);if(!e)return null;let t=JSON.parse(e);return d(t),t}function h(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,a.click(),URL.revokeObjectURL(i)}function se(e,t){return e.records.map(e=>Number(e.values[t])).filter(e=>Number.isFinite(e))}function g(e){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)).map(t=>{let n=se(e,t.id),r=n.reduce((e,t)=>e+t,0);return{fieldId:t.id,fieldName:t.name,count:n.length,sum:r,average:n.length?r/n.length:0,minimum:n.length?Math.min(...n):0,maximum:n.length?Math.max(...n):0}})}function ce(e,t,n){let r=e.trim(),i=r.match(/^FIELD\(([^)]+)\)$/i);if(i){let e=i[1].trim().toLowerCase(),r=t.fields.find(t=>t.name.toLowerCase()===e);return r?String(n.values[r.id]??``):``}let a=r.match(/^JOIN\((.+)\)$/i);return a?a[1].split(`,`).map(e=>{let r=e.trim();if(r.startsWith(`"`)&&r.endsWith(`"`))return r.slice(1,-1);let i=t.fields.find(e=>e.name.toLowerCase()===r.toLowerCase());return i?String(n.values[i.id]??``):r}).join(``):``}function _(e){return e==null?``:String(e)}function le(e,t){let n=t.query.trim();if(!n)return e.records;let r=n.toLowerCase();return e.records.filter(n=>(t.fieldId===`all`?e.fields.map(e=>e.id):[t.fieldId]).some(e=>_(n.values[e]).toLowerCase().includes(r)))}function v(e,t,n){let r=n===`asc`?1:-1;return{...e,records:[...e.records].sort((e,n)=>{let i=_(e.values[t]),a=_(n.values[t]),o=Number(i),s=Number(a);return!Number.isNaN(o)&&!Number.isNaN(s)?(o-s)*r:i.localeCompare(a,void 0,{numeric:!0,sensitivity:`base`})*r})}}function ue(e,t){let n=new Map;return e.records.forEach(e=>{let r=_(e.values[t]).trim().toLowerCase();r&&n.set(r,(n.get(r)??0)+1)}),e.records.filter(e=>{let r=_(e.values[t]).trim().toLowerCase();return r?(n.get(r)??0)>1:!1})}function de(e,t){return e.records.filter(e=>!_(e.values[t]).trim())}function fe(e,t){if(!t.find)return[];let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=[];return e.records.forEach(e=>{o.has(e.id)&&t.fieldIds.forEach(n=>{let r=_(e.values[n]),i=r.replace(a,t.replacement);i!==r&&s.push({recordId:e.id,fieldId:n,before:r,after:i})})}),s}function pe(e,t){if(!t.find)return{table:e,count:0};let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=0,c=e.records.map(e=>{if(!o.has(e.id))return e;let n=!1,r={...e.values};return t.fieldIds.forEach(e=>{let i=_(r[e]),o=i.replace(a,()=>(s+=1,t.replacement));o!==i&&(n=!0,r[e]=o)}),n?{...e,updatedAt:new Date().toISOString(),values:r}:e});return{table:{...e,records:c},count:s}}function y(e){return e==null?``:String(e).trim().toLowerCase()}function me(e,n,r,i,a){return{id:t(`relationship`),name:e.trim()||`New Relationship`,fromTableId:n,fromFieldId:r,toTableId:i,toFieldId:a}}function he(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,relationships:[...e.schema.relationships,t]}}}function b(e,t,n,r){let i=y(n.values[e.fromFieldId]);return!i||t.id!==e.fromTableId||r.id!==e.toTableId?[]:r.records.filter(t=>y(t.values[e.toFieldId])===i)}function x(e,t){let n=e.schema.tables.find(e=>e.id===t.fromTableId),r=e.schema.tables.find(e=>e.id===t.toTableId),i=n?.fields.find(e=>e.id===t.fromFieldId),a=r?.fields.find(e=>e.id===t.toFieldId);return`${n?.name??`Table`}:${i?.name??`Field`} -> ${r?.name??`Table`}:${a?.name??`Field`}`}function S(e,t,n,r,i,a){return{id:e,title:t,gradeBand:n,goal:r,table:ie(t,i),reflectionQuestions:a}}var C=[S(`classroom-library`,`Classroom Library Catalog`,`Grades 3-8`,`Track books, genres, reading levels, and recommendations.`,`Title,Author,Genre,Pages,Who would enjoy it?
Charlotte's Web,E. B. White,Fiction,192,Readers who like animals
Hidden Figures,Margot Lee Shetterly,Biography,240,Readers who like history`,[`Which genre appears most often?`,`What book would you recommend first?`]),S(`science-observations`,`Science Observation Log`,`Grades 3-8`,`Collect observations over time and look for patterns.`,`Date,Object observed,Location,Measurement,Observation
2026-06-29,Bean plant,Window,8 cm,Two new leaves
2026-06-30,Bean plant,Window,8.5 cm,Stem leaned toward light`,[`What changed over time?`,`What might explain the pattern?`]),S(`state-facts`,`State Facts Database`,`Grades 4-8`,`Compare places using consistent fields.`,`State,Capital,Region,Population note,Interesting fact
Texas,Austin,South,Large population,Has many different ecosystems
New Mexico,Santa Fe,Southwest,Medium population,Capital is over 400 years old`,[`Which fields help compare states?`,`What new field would improve this database?`]),S(`book-reviews`,`Book Review Collection`,`Grades 3-8`,`Collect opinions and evidence from student reading.`,`Book,Reviewer,Rating,Favorite part,Would recommend?
Because of Winn-Dixie,Jordan,5,The friendship story,Yes
Wonder,Avery,4,The different points of view,Yes`,[`Which book has the strongest recommendation?`,`What evidence supports each rating?`]),S(`vocabulary-bank`,`Vocabulary Word Bank`,`Grades 2-8`,`Build a searchable word list with definitions and examples.`,`Word,Definition,Example sentence,Subject
evaporate,To change from liquid to gas,Water can evaporate in sunlight,Science
compare,To tell how things are alike,Compare two characters,Reading`,[`Which words belong to more than one subject?`,`Which examples help you remember the word?`]),S(`survey-results`,`Simple Survey Results`,`Grades 3-8`,`Organize survey answers and look for patterns.`,`Question,Answer,Student group,Count,Notes
Favorite recess activity,Soccer,Grade 4,12,Most common outdoor choice
Favorite recess activity,Drawing,Grade 4,6,Quiet activity choice`,[`Which answer appears most often?`,`What new question should the class ask next?`]),S(`museum-cards`,`Museum Exhibit Cards`,`Grades 4-8`,`Create printable exhibit cards for objects, images, or research topics.`,`Item,Creator or source,Year,Category,Why it matters
Printing press,Johannes Gutenberg,1440,Invention,Changed how books were made
Apollo 11 mission,NASA,1969,Space exploration,First humans walked on the Moon`,[`How should the exhibit be grouped?`,`What field would help visitors understand the item?`])];function ge(e){let t=e.table.fields.map(e=>({...e,id:`${e.id}_${Date.now().toString(36)}`})),n=e.table.records.map(n=>r(t,Object.fromEntries(e.table.fields.map((e,r)=>[t[r].id,n.values[e.id]??``]))));return{...e.table,id:`table_${e.id}_${Date.now().toString(36)}`,fields:t,records:n}}var w=document.querySelector(`#app`);if(!w)throw Error(`ListSplatTM app root was not found.`);var T=w,E=oe()??a(),D=E.schema.tables[0].id,O=E.schema.tables[0].records[0]?.id??``,k=`table`,A=`Saved locally`,j=``,M=`all`,N=``,P=`asc`,F=new Set,I=`none`,L=``,R=`Tip: Start with one table, then add relationships when your project needs them.`,z=[],B=[],V=D,H=E.schema.tables[1]?.id??D;function U(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function W(){return E.schema.tables.find(e=>e.id===D)??E.schema.tables[0]}function G(e){let t=le(e,{query:j,fieldId:M});return F.size>0?t.filter(e=>F.has(e.id)):t}function K(e){e.records.some(e=>e.id===O)||(O=e.records[0]?.id??``)}function q(e){E=e,K(W()),m(E),A=`Saved locally`,$()}function J(e){z=[{label:e,project:structuredClone(E)},...z].slice(0,12)}function _e(){let e=z[0];if(!e){R=`Nothing to undo yet.`,$();return}z=z.slice(1),E=e.project,D=E.schema.tables.some(e=>e.id===D)?D:E.schema.tables[0].id,K(W()),m(E),R=`Undid ${e.label}.`,$()}function Y(e){D=e.id,q(u(E,e))}function X(){document.querySelectorAll(`.menu[open]`).forEach(e=>{e.open=!1})}function ve(e){q({...E,updatedAt:new Date().toISOString(),metadata:{...E.metadata,title:e||`Untitled Database`}})}function ye(){h(`${E.metadata.title||`listsplat-project`}.listsplat.json`,JSON.stringify(E,null,2),`application/json`)}function be(){h(`${W().name}.csv`,ae(W()),`text/csv;charset=utf-8`)}function xe(){let e=W(),t=G(e),n=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${U(E.metadata.title)}</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{color:#5b21b6}</style></head>
<body><h1>${U(E.metadata.title)}</h1><p>${U(e.name)} report from ListSplatTM.</p>
<table><thead><tr>${e.fields.map(e=>`<th>${U(e.name)}</th>`).join(``)}</tr></thead>
<tbody>${t.map(t=>`<tr>${e.fields.map(n=>`<td>${U(Q(e,t,n.id))}</td>`).join(``)}</tr>`).join(``)}</tbody></table></body></html>`;h(`${E.metadata.title||`listsplat-report`}.html`,n,`text/html;charset=utf-8`)}function Se(e){e.text().then(e=>{let t=JSON.parse(e);d(t),D=t.schema.tables[0].id,O=t.schema.tables[0].records[0]?.id??``,q(t)}).catch(e=>{window.alert(e instanceof Error?e.message:`Could not open this ListSplatTM file.`)})}function Ce(e){e.text().then(t=>{let n=ie(e.name.replace(/\.csv$/i,``),t);J(`CSV import`),D=n.id,O=n.records[0]?.id??``,R=`Imported ${n.records.length} records from ${e.name}.`,q({...E,updatedAt:new Date().toISOString(),schema:{...E.schema,tables:[...E.schema.tables,n]},layouts:[...E.layouts,{id:`layout_${Date.now().toString(36)}`,name:`${n.name} Table`,tableId:n.id,mode:`table`,locked:!1}]})})}function we(e){let t=C.find(t=>t.id===e);if(!t)return;let n=ge(t);J(`template load`),D=n.id,O=n.records[0]?.id??``,R=`Loaded ${t.title}.`,q({...E,metadata:{...E.metadata,title:t.title},schema:{...E.schema,tables:[...E.schema.tables,n]},teacher:{...E.teacher,notes:t.reflectionQuestions}})}function Z(e,t){return`
    <details class="menu">
      <summary>${e}</summary>
      <div class="menu-panel">
        ${t.map(([e,t])=>`<button type="button" data-action="${e}">${t}</button>`).join(``)}
      </div>
    </details>
  `}function Te(e=`text`){return[[`text`,`Short text`],[`longText`,`Long text`],[`number`,`Number`],[`currency`,`Currency`],[`percent`,`Percent`],[`date`,`Date`],[`checkbox`,`Checkbox`],[`choice`,`Choice`],[`image`,`Image`],[`link`,`Link`],[`calculation`,`Calculation`]].map(([t,n])=>`<option value="${t}" ${e===t?`selected`:``}>${n}</option>`).join(``)}function Q(e,t,n){let r=e.fields.find(e=>e.id===n);return r?.type===`calculation`&&r.formula?ce(r.formula,e,t):t.values[n]??``}function Ee(e,t){let n=e.fields.find(e=>!e.hidden)??e.fields[0],r=n?Q(e,t,n.id):``;return String(r||`Untitled record`)}function De(e,t,n,r){let i=e.fields.find(e=>e.id===n),a=Q(e,t,n),o=`aria-label="${U(i?.name??`Field`)}, record ${r+1}" data-record-id="${t.id}" data-field-id="${n}"`;return i?.type===`checkbox`?`<input class="cell-checkbox" type="checkbox" ${o} ${a===!0||a===`true`?`checked`:``}>`:i?.type===`longText`?`<textarea class="cell-input" ${o}>${U(a)}</textarea>`:i?.type===`date`?`<input class="cell-input" type="date" ${o} value="${U(a)}">`:i?.type===`number`||i?.type===`currency`||i?.type===`percent`?`<input class="cell-input" type="number" step="any" ${o} value="${U(a)}">`:i?.type===`calculation`?`<output class="calc-output">${U(a)}</output>`:`<input class="cell-input" ${o} value="${U(a)}">`}function Oe(e){return`
    <div class="table-tabs">
      ${E.schema.tables.map(t=>`<button type="button" class="table-tab ${t.id===e.id?`active`:``}" data-table-id="${t.id}">${U(t.name)}</button>`).join(``)}
    </div>
  `}function ke(e,t){return`
    <div class="data-grid-wrap">
      <table class="data-grid">
        <thead>
          <tr>
            <th>#</th>
            ${e.fields.filter(e=>!e.hidden).map(e=>`
                  <th>
                    <button type="button" class="field-button" data-field-settings="${e.id}">
                      ${U(e.name)}<br><small>${U(e.type)}</small>
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
                  ${e.fields.filter(e=>!e.hidden).map(r=>`<td>${De(e,t,r.id,n)}</td>`).join(``)}
                  <td class="record-actions">
                    <button type="button" data-action="duplicate-record" data-record-action-id="${t.id}">Copy</button>
                    <button type="button" data-action="delete-record" data-record-action-id="${t.id}">Delete</button>
                  </td>
                </tr>
              `).join(``)}
        </tbody>
      </table>
    </div>
  `}function Ae(e){let t=e.records.find(e=>e.id===O)??e.records[0];if(!t)return`<div class="empty-panel">Add a record to use form view.</div>`;let n=E.schema.relationships.filter(t=>t.fromTableId===e.id).map(n=>{let r=E.schema.tables.find(e=>e.id===n.toTableId),i=r?b(n,e,t,r):[];return`
        <section class="related-records">
          <h3>${U(n.name)}</h3>
          <p>${i.length} related record${i.length===1?``:`s`} from ${U(r?.name??`another table`)}</p>
          ${i.length?`<div class="related-grid">${i.slice(0,6).map(e=>`
                      <article>
                        <strong>${U(Ee(r,e))}</strong>
                        ${r.fields.filter(e=>!e.hidden).slice(0,3).map(t=>`<span>${U(t.name)}: ${U(Q(r,e,t.id))}</span>`).join(``)}
                      </article>
                    `).join(``)}</div>`:`<p>No matches yet. Make sure the match fields use the same value.</p>`}
        </section>
      `}).join(``);return`
    <div class="form-view">
      <div class="form-nav">
        ${e.records.map((e,n)=>`<button type="button" class="${e.id===t.id?`active`:``}" data-select-record="${e.id}">Record ${n+1}</button>`).join(``)}
      </div>
      <div class="record-form">
        ${e.fields.filter(e=>!e.hidden).map((n,r)=>`
              <label>
                <span>${U(n.name)}</span>
                ${De(e,t,n.id,r)}
                ${n.description?`<small>${U(n.description)}</small>`:``}
              </label>
            `).join(``)}
        ${n}
      </div>
    </div>
  `}function je(e,t){return`
    <div class="cards-view ${k===`gallery`?`gallery-view`:``}">
      ${t.map(t=>`
            <article class="record-card" data-select-record="${t.id}">
              ${e.fields.filter(e=>!e.hidden).slice(0,k===`gallery`?5:8).map(n=>`<p><strong>${U(n.name)}</strong><span>${U(Q(e,t,n.id))}</span></p>`).join(``)}
            </article>
          `).join(``)}
    </div>
  `}function Me(e,t){return`
    <div class="labels-view">
      ${t.map(t=>`
            <article class="print-label">
              ${e.fields.filter(e=>!e.hidden).slice(0,4).map(n=>`<p><strong>${U(n.name)}:</strong> ${U(Q(e,t,n.id))}</p>`).join(``)}
            </article>
          `).join(``)}
    </div>
  `}function Ne(e,t){let n=g(e);return`
    <div class="report-view">
      <header>
        <h2>${U(E.metadata.title)}</h2>
        <p>${U(e.name)} report. ${t.length} record${t.length===1?``:`s`} shown.</p>
      </header>
      ${ke(e,t)}
      ${n.length?`<section class="summary-strip">${n.map(e=>`<div><strong>${U(e.fieldName)}</strong><span>Sum ${e.sum.toLocaleString()} | Avg ${e.average.toFixed(2)}</span></div>`).join(``)}</section>`:`<p class="empty-panel">Add a number, currency, or percent field to see summaries.</p>`}
    </div>
  `}function Pe(e){let t=G(e),n=k===`form`?Ae(e):k===`cards`||k===`gallery`?je(e,t):k===`labels`?Me(e,t):k===`report`?Ne(e,t):ke(e,t);return`
    <section class="database-panel" aria-label="Database table">
      ${Oe(e)}
      <div class="view-tabs" role="group" aria-label="Layout modes">
        ${[`table`,`form`,`cards`,`gallery`,`labels`,`report`].map(e=>`<button type="button" class="${k===e?`active`:``}" data-view-mode="${e}">${e}</button>`).join(``)}
      </div>
      ${n}
    </section>
  `}function Fe(e){let t=g(e),n=e.records.find(e=>e.id===O)??e.records[0],r=n?E.schema.relationships.filter(t=>t.fromTableId===e.id).map(t=>{let r=E.schema.tables.find(e=>e.id===t.toTableId),i=r?b(t,e,n,r).length:0;return`
            <div class="template-card">
              <strong>${U(t.name)}</strong>
              <span>${i} related record${i===1?``:`s`}</span>
              <p>${U(x(E,t))}</p>
            </div>
          `}).join(``):``;return`
    <aside class="teacher-panel" aria-label="Teacher tools and database stats">
      <h2>Database Check</h2>
      <div class="stat-grid">
        <div class="stat-card"><strong>${G(e).length}</strong> shown</div>
        <div class="stat-card"><strong>${e.records.length}</strong> records</div>
        <div class="stat-card"><strong>${e.fields.length}</strong> fields</div>
        <div class="stat-card"><strong>${E.schema.tables.length}</strong> tables</div>
      </div>
      ${t.map(e=>`
            <div class="template-card">
              <strong>${U(e.fieldName)} summary</strong>
              <span>Sum: ${e.sum.toLocaleString()}</span>
              <span>Average: ${e.average.toFixed(2)}</span>
            </div>
          `).join(``)}
      ${r?`<h3>Related Records</h3>${r}`:``}
      <h3>Template Starters</h3>
      ${C.map(e=>`
            <div class="template-card">
              <strong>${U(e.title)}</strong>
              <span>${U(e.gradeBand)}</span>
              <p>${U(e.goal)}</p>
              <button type="button" data-template-id="${e.id}">Use template</button>
            </div>
          `).join(``)}
    </aside>
  `}function Ie(e){if(I===`none`)return``;if(I===`replace`){let t=B.slice(0,8);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Replace values">
          <h2>Replace values</h2>
          <label>Find <input data-replace-find placeholder="Text to find"></label>
          <label>Replace with <input data-replace-with placeholder="New text"></label>
          <label>Field <select data-replace-field>${e.fields.map(e=>`<option value="${e.id}">${U(e.name)}</option>`).join(``)}</select></label>
          <label class="check-row"><input type="checkbox" data-replace-case-sensitive> Case-sensitive</label>
          <label class="check-row"><input type="checkbox" data-replace-whole-word> Whole word only</label>
          <p>Replacement applies to the current found set when search is active. Preview first, then apply. The last replace can be undone from Edit.</p>
          ${B.length?`<div class="replace-preview"><strong>${B.length} change${B.length===1?``:`s`} ready</strong>${t.map(t=>{let n=e.records.find(e=>e.id===t.recordId),r=e.fields.find(e=>e.id===t.fieldId);return`<p><span>${U(n?Ee(e,n):`Record`)} / ${U(r?.name??`Field`)}</span><del>${U(t.before)}</del><ins>${U(t.after)}</ins></p>`}).join(``)}</div>`:``}
          <div class="modal-actions">
            <button type="button" data-action="preview-replace">Preview</button>
            <button type="button" data-action="run-replace" ${B.length?``:`disabled`}>Apply Replace</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(I===`field`){let t=e.fields.find(e=>e.id===L)??e.fields[0];return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Field settings">
          <h2>Field settings</h2>
          <label>Name <input data-field-name value="${U(t.name)}"></label>
          <label>Type <select data-field-type>${Te(t.type)}</select></label>
          <label>Description <textarea data-field-description>${U(t.description)}</textarea></label>
          <label class="check-row"><input type="checkbox" data-field-required ${t.required?`checked`:``}> Required field</label>
          <label class="check-row"><input type="checkbox" data-field-hidden ${t.hidden?`checked`:``}> Hide field</label>
          <label>Calculation formula <input data-field-formula value="${U(t.formula??``)}" placeholder='JOIN(First Name, " ", Last Name)'></label>
          <p>Supported starter formulas: <code>FIELD(Field Name)</code> and <code>JOIN(Field, " text ", Other Field)</code>.</p>
          <div class="modal-actions">
            <button type="button" data-action="save-field-settings">Save field</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(I===`projectIdeas`)return`
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
    `;if(I===`relationship`){let t=E.schema.tables.find(e=>e.id===V)??e,n=E.schema.tables.find(e=>e.id===H)??e,r=t.fields.map(e=>`<option value="${t.id}:${e.id}">${U(e.name)}</option>`).join(``),i=n.fields.map(e=>`<option value="${n.id}:${e.id}">${U(e.name)}</option>`).join(``);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Relationships">
          <h2>Relationships</h2>
          <p>Create a simple one-to-many relationship by matching values in two fields, such as Books:Title to Reviews:Book.</p>
          <label>Name <input data-relationship-name placeholder="Books to reviews"></label>
          <label>Parent table <select data-relationship-from-table>${E.schema.tables.map(e=>`<option value="${e.id}" ${e.id===t.id?`selected`:``}>${U(e.name)}</option>`).join(``)}</select></label>
          <label>Parent match field <select data-relationship-from-field>${r}</select></label>
          <label>Related table <select data-relationship-to-table>${E.schema.tables.map(e=>`<option value="${e.id}" ${e.id===n.id?`selected`:``}>${U(e.name)}</option>`).join(``)}</select></label>
          <label>Related match field <select data-relationship-to-field>${i}</select></label>
          ${E.schema.relationships.length?`<div class="relationship-list">${E.schema.relationships.map(e=>`<p><strong>${U(e.name)}</strong><br>${U(x(E,e))}</p>`).join(``)}</div>`:`<p>No relationships yet. Add a second table first for the most useful results.</p>`}
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
  `}function $(){let e=W();K(e),T.innerHTML=`
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
        ${Z(`File`,[[`new`,`New database`],[`save-json`,`Save .listsplat.json`],[`open-json`,`Open .listsplat.json`],[`import-csv`,`Import CSV`],[`export-csv`,`Export CSV`],[`export-report`,`Export report HTML`],[`print`,`Print`]])}
        ${Z(`Edit`,[[`undo-change`,`Undo last change`],[`add-record`,`Add record`],[`add-field`,`Add field`],[`find`,`Find records`],[`replace`,`Replace values`]])}
        ${Z(`Data`,[[`add-table`,`New table`],[`sort`,`Sort records`],[`missing`,`Find missing values`],[`duplicates`,`Find duplicates`],[`clear-find`,`Show all records`]])}
        ${Z(`Layout`,[[`table-view`,`Table view`],[`form-view`,`Form view`],[`cards-view`,`Card view`],[`gallery-view`,`Gallery view`],[`labels-view`,`Label view`],[`report-view`,`Report view`]])}
        ${Z(`Tools`,[[`functions`,`Functions`],[`relationships`,`Relationships`],[`quality`,`Data quality check`]])}
        ${Z(`View`,[[`student-view`,`Student view`],[`teacher-notes`,`Teacher notes`]])}
        <span class="menu-spacer"></span>
        ${Z(`Teacher`,[[`templates`,`Template Library`],[`project-ideas`,`Project Ideas`],[`lock-layout`,`Lock Layout`],[`project-packet`,`Print Project Packet`]])}
        ${Z(`Help`,[[`help-start`,`Start a database`],[`help-csv`,`Import and export CSV`],[`help-layouts`,`Forms and reports`],[`help-privacy`,`Privacy and saving`]])}
      </nav>
      <section class="toolbar" aria-label="Database toolbar">
        <label>Title <input data-project-title value="${U(E.metadata.title)}"></label>
        <label>Search <input data-search value="${U(j)}" placeholder="Find records"></label>
        <label>In <select data-search-field><option value="all">All fields</option>${e.fields.map(e=>`<option value="${e.id}" ${M===e.id?`selected`:``}>${U(e.name)}</option>`).join(``)}</select></label>
        <label>Sort <select data-sort-field><option value="">Choose field</option>${e.fields.map(e=>`<option value="${e.id}" ${N===e.id?`selected`:``}>${U(e.name)}</option>`).join(``)}</select></label>
        <button type="button" data-action="toggle-sort">${P===`asc`?`A-Z`:`Z-A`}</button>
        <label>New field <input data-new-field placeholder="Field name"></label>
        <label>Type <select data-new-field-type>${Te()}</select></label>
        <button type="button" data-action="add-field">Add field</button>
        <button type="button" data-action="add-record">Add record</button>
      </section>
      <div class="workspace">
        ${Pe(e)}
        ${Fe(e)}
      </div>
      <footer class="status-bar">
        <span>${U(e.name)}: ${G(e).length} shown of ${e.records.length} records, ${e.fields.length} fields</span>
        <span>${U(R)}</span>
        <span>${A}</span>
      </footer>
    </main>
    <input class="hidden-file" type="file" accept=".listsplat.json,application/json" data-open-json>
    <input class="hidden-file" type="file" accept=".csv,text/csv" data-import-csv>
    ${Ie(e)}
  `}function Le(e){return e instanceof HTMLInputElement&&e.type===`checkbox`?e.checked:e instanceof HTMLInputElement&&e.type===`number`?e.value===``?``:Number(e.value):e.value}function Re(e){let t=e.dataset.recordId,n=e.dataset.fieldId;!t||!n||(E=u(E,l(W(),t,n,Le(e))),m(E),A=`Saved locally`)}function ze(){let e=W(),t=e.fields.find(e=>e.id===L);if(!t)return;let n=T.querySelector(`[data-field-name]`)?.value??t.name,r=T.querySelector(`[data-field-type]`)?.value??t.type,i=T.querySelector(`[data-field-description]`)?.value??``,a=T.querySelector(`[data-field-required]`)?.checked??!1,o=T.querySelector(`[data-field-hidden]`)?.checked??!1,s=T.querySelector(`[data-field-formula]`)?.value??``;Y(c(e,t.id,{name:n,type:r,description:i,required:a,hidden:o,formula:s})),I=`none`,R=`Updated ${n}.`,$()}function Be(){let e=T.querySelector(`[data-replace-find]`)?.value??``,t=T.querySelector(`[data-replace-with]`)?.value??``,n=T.querySelector(`[data-replace-field]`)?.value??W().fields[0]?.id,r=T.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=T.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=j?G(W()).map(e=>e.id):void 0;J(`replace`);let o=pe(W(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i});I=`none`,B=[],R=`Replaced ${o.count} value${o.count===1?``:`s`}.`,Y(o.table)}function Ve(){let e=T.querySelector(`[data-replace-find]`)?.value??``,t=T.querySelector(`[data-replace-with]`)?.value??``,n=T.querySelector(`[data-replace-field]`)?.value??W().fields[0]?.id,r=T.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=T.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=j?G(W()).map(e=>e.id):void 0;B=fe(W(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i}),R=`Preview found ${B.length} change${B.length===1?``:`s`}.`,$()}function He(e){let t=T.querySelector(e)?.value;if(!t)return null;let[n,r]=t.split(`:`);return n&&r?{tableId:n,fieldId:r}:null}function Ue(){let e=T.querySelector(`[data-relationship-from-table]`)?.value??``,t=T.querySelector(`[data-relationship-to-table]`)?.value??``,n=He(`[data-relationship-from-field]`),r=He(`[data-relationship-to-field]`),i=T.querySelector(`[data-relationship-name]`)?.value??``;if(!e||!t||!n||!r){R=`Choose both tables and both match fields.`,$();return}if(n.tableId!==e||r.tableId!==t){R=`Match fields must belong to the tables you chose.`,$();return}J(`relationship create`);let a=me(i,e,n.fieldId,t,r.fieldId);R=`Created relationship: ${a.name}.`,q(he(E,a))}function We(){V=T.querySelector(`[data-relationship-from-table]`)?.value??V,H=T.querySelector(`[data-relationship-to-table]`)?.value??H,$()}T.addEventListener(`click`,e=>{let t=e.target,n=t.closest(`[data-action]`)?.dataset.action,r=t.closest(`[data-table-id]`)?.dataset.tableId,i=t.closest(`[data-template-id]`)?.dataset.templateId,c=t.closest(`[data-view-mode]`)?.dataset.viewMode,l=t.closest(`[data-select-record]`)?.dataset.selectRecord,u=t.closest(`[data-field-settings]`)?.dataset.fieldSettings,d=t.closest(`[data-record-action-id]`)?.dataset.recordActionId;if(r){D=r,F=new Set,K(W()),$();return}if(i){we(i);return}if(c){k=c,$();return}if(l){O=l,k===`table`&&$();return}if(u){L=u,I=`field`,$();return}if(n)if(X(),n===`new`){J(`new database`);let e=a(`Untitled Database`);D=e.schema.tables[0].id,O=e.schema.tables[0].records[0]?.id??``,F=new Set,q(e)}else if(n===`save-json`)ye();else if(n===`open-json`)T.querySelector(`[data-open-json]`)?.click();else if(n===`import-csv`)T.querySelector(`[data-import-csv]`)?.click();else if(n===`export-csv`)be();else if(n===`export-report`||n===`project-packet`)xe();else if(n===`print`)window.print();else if(n===`add-record`)J(`add record`),Y(s(W()));else if(n===`add-field`){let e=T.querySelector(`[data-new-field]`),t=T.querySelector(`[data-new-field-type]`)?.value;J(`add field`),Y(o(W(),e?.value||`New Field`,t??`text`))}else if(n===`add-table`){let e=window.prompt(`New table name?`,`New Table`)??``;J(`add table`);let t=ne(E,e);D=t.schema.tables.at(-1)?.id??D,O=W().records[0]?.id??``,q(t)}else if(n===`duplicate-record`&&d)J(`duplicate record`),Y(ee(W(),d));else if(n===`delete-record`&&d)J(`delete record`),Y(te(W(),d));else if(n===`toggle-sort`)P=P===`asc`?`desc`:`asc`,$();else if(n===`sort`)N&&Y(v(W(),N,P));else if(n===`duplicates`){let e=M===`all`?W().fields[0]?.id:M;F=new Set(ue(W(),e).map(e=>e.id)),R=`Found ${F.size} duplicate record${F.size===1?``:`s`}.`,$()}else if(n===`missing`){let e=M===`all`?W().fields[0]?.id:M;F=new Set(de(W(),e).map(e=>e.id)),R=`Found ${F.size} record${F.size===1?``:`s`} with missing values.`,$()}else n===`clear-find`?(j=``,F=new Set,R=`Showing all records.`,$()):n===`replace`?(B=[],I=`replace`,$()):n===`preview-replace`?Ve():n===`run-replace`?Be():n===`save-field-settings`?(J(`field settings`),ze()):n===`create-relationship`?Ue():n===`undo-change`?_e():n===`close-dialog`?(I=`none`,B=[],$()):n.endsWith(`-view`)?(k=n.replace(`-view`,``),$()):n===`templates`?(R=`Template starters are in the Teacher panel.`,$()):n===`project-ideas`?(I=`projectIdeas`,$()):n===`relationships`?(I=`relationship`,$()):n.startsWith(`help-`)||n===`functions`||n===`quality`?(I=`help`,$()):(R=`This ListSplatTM tool is planned for a later build.`,$())}),T.addEventListener(`change`,e=>{let t=e.target;t.matches(`[data-open-json]`)&&t instanceof HTMLInputElement&&t.files?.[0]?Se(t.files[0]):t.matches(`[data-import-csv]`)&&t instanceof HTMLInputElement&&t.files?.[0]?Ce(t.files[0]):t.matches(`[data-search-field]`)?(M=t.value,F=new Set,$()):t.matches(`[data-sort-field]`)?(N=t.value,N&&Y(v(W(),N,P))):t.matches(`[data-relationship-from-table], [data-relationship-to-table]`)?We():t.matches(`.cell-input, .cell-checkbox`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement)&&Re(t)}),T.addEventListener(`input`,e=>{let t=e.target;if(t.matches(`[data-project-title]`)){ve(t.value);return}if(t.matches(`[data-search]`)){j=t.value,F=new Set,$();return}t.matches(`.cell-input`)&&Re(t)}),document.addEventListener(`click`,e=>{e.target.closest(`.menu`)||X()}),$();