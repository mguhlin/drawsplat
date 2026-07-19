(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={text:``,longText:``,number:0,currency:0,percent:0,date:``,time:``,dateTime:``,checkbox:!1,rating:0,choice:``,multiSelect:``,email:``,phone:``,image:``,file:``,audio:``,link:``,calculation:``,autoNumber:``,createdAt:``,updatedAt:``};function t(e){return`${e}_${Math.random().toString(36).slice(2,10)}`}function n(e,n=`text`){return{id:t(`field`),name:e,type:n,description:``,required:!1,hidden:!1,options:n===`choice`||n===`multiSelect`?[`Yes`,`No`]:void 0}}function r(n,r={}){let i=new Date().toISOString(),a=Object.fromEntries(n.map((t,n)=>t.type===`createdAt`||t.type===`updatedAt`?[t.id,r[t.id]??i]:t.type===`autoNumber`?[t.id,r[t.id]??n+1]:r[t.id]===void 0&&t.defaultValue!=null&&t.defaultValue!==``?[t.id,u(t.defaultValue,t.type,t.options).value]:[t.id,r[t.id]??e[t.type]]));return{id:t(`record`),createdAt:i,updatedAt:i,values:a}}function i(e,i){let a=i.map(e=>n(e));return{id:t(`table`),name:e,fields:a,records:[r(a)]}}function a(e=`Animal Research Database`){let n=new Date().toISOString(),a=i(`Animals`,[`Animal`,`Habitat`,`Diet`,`Interesting Fact`]);return a.records=[r(a.fields,{[a.fields[0].id]:`Axolotl`,[a.fields[1].id]:`Freshwater lakes`,[a.fields[2].id]:`Worms and insects`,[a.fields[3].id]:`It can regrow some body parts.`}),r(a.fields,{[a.fields[0].id]:`Red panda`,[a.fields[1].id]:`Mountain forests`,[a.fields[2].id]:`Bamboo and fruit`,[a.fields[3].id]:`It uses its tail like a blanket.`})],{app:`ListSplatTM`,version:1,createdAt:n,updatedAt:n,metadata:{title:e,author:``,className:``},schema:{tables:[a],relationships:[]},layouts:[{id:t(`layout`),name:`Table View`,tableId:a.id,mode:`table`,locked:!1},{id:t(`layout`),name:`Record Form`,tableId:a.id,mode:`form`,locked:!1},{id:t(`layout`),name:`Research Cards`,tableId:a.id,mode:`cards`,locked:!1}],teacher:{studentView:!1,notes:[`Ask students to add source notes before printing a report.`],rubric:[]}}}function o(t,r,i=`text`){let a=n(r.trim()||`New Field`,i);return{...t,fields:[...t.fields,a],records:t.records.map(t=>({...t,updatedAt:new Date().toISOString(),values:{...t.values,[a.id]:e[i]}}))}}function s(e,t){return e.records.reduce((e,n)=>{let r=Number(n.values[t]);return Number.isFinite(r)?Math.max(e,r):e},0)+1}function c(e){let t={};return e.fields.filter(e=>e.type===`autoNumber`).forEach(n=>{t[n.id]=s(e,n.id)}),t}function l(e){return{...e,records:[...e.records,r(e.fields,c(e))]}}function u(t,n,r){let i=t==null?``:String(t);if(i.trim()===``)return{value:e[n],lost:!1};switch(n){case`number`:case`currency`:case`percent`:case`rating`:{let t=Number(i.replace(/[$,%\s]/g,``));return Number.isFinite(t)?{value:n===`rating`?Math.max(0,Math.min(5,Math.round(t))):t,lost:!1}:{value:e[n],lost:!0}}case`checkbox`:{let e=i.trim().toLowerCase();return[`true`,`yes`,`1`,`y`,`checked`].includes(e)?{value:!0,lost:!1}:[`false`,`no`,`0`,`n`].includes(e)?{value:!1,lost:!1}:{value:!1,lost:!0}}case`choice`:{let e=r?.find(e=>e.toLowerCase()===i.trim().toLowerCase());return e?{value:e,lost:!1}:{value:``,lost:!!(r&&r.length)}}case`date`:{let e=new Date(i);return Number.isNaN(e.getTime())?{value:``,lost:!0}:{value:e.toISOString().slice(0,10),lost:!1}}case`text`:case`longText`:case`link`:return{value:i,lost:!1};default:return{value:i,lost:!1}}}function d(e,t,n,r){return{...e,records:e.records.map(e=>({...e,values:{...e.values,[t]:u(e.values[t],n,r).value}}))}}function ee(e,t,n){return{...e,fields:e.fields.map(e=>e.id===t?{...e,...n}:e)}}function te(e,t){let n=e.records.find(e=>e.id===t);return n?{...e,records:[...e.records,r(e.fields,{...n.values,...c(e)})]}:e}function ne(e,t){return e.records.length<=1?e:{...e,records:e.records.filter(e=>e.id!==t)}}function f(e,t,n,r){let i=new Date().toISOString();return{...e,records:e.records.map(a=>a.id===t?{...a,updatedAt:i,values:Object.fromEntries(e.fields.map(e=>e.id===n?[e.id,r]:e.type===`updatedAt`?[e.id,i]:[e.id,a.values[e.id]]))}:a)}}function p(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t.id?t:e)}}}function re(e,n){let r=i(n.trim()||`New Table`,[`Name`,`Notes`]);return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:[...e.schema.tables,r]},layouts:[...e.layouts,{id:t(`layout`),name:`${r.name} Table`,tableId:r.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${r.name} Form`,tableId:r.id,mode:`form`,locked:!1}]}}function ie(e,t,n){let r=n.trim()||`Table`;return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t?{...e,name:r}:e)}}}function ae(e,n){let r=e.schema.tables.find(e=>e.id===n);if(!r)return{project:e,newTableId:n};let i=new Map(r.fields.map(e=>[e.id,t(`field`)])),a=r.fields.map(e=>({...e,id:i.get(e.id)})),o=r.records.map(e=>({id:t(`record`),createdAt:e.createdAt,updatedAt:e.updatedAt,values:Object.fromEntries(Object.entries(e.values).map(([e,t])=>[i.get(e)??e,t]))})),s={id:t(`table`),name:`${r.name} copy`,fields:a,records:o},c=e.schema.tables.findIndex(e=>e.id===n),l=[...e.schema.tables];return l.splice(c+1,0,s),{project:{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:l},layouts:[...e.layouts,{id:t(`layout`),name:`${s.name} Table`,tableId:s.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${s.name} Form`,tableId:s.id,mode:`form`,locked:!1}]},newTableId:s.id}}function oe(e,t,n){let r=[...e.schema.tables],i=r.findIndex(e=>e.id===t),a=i+n;return i<0||a<0||a>=r.length?e:([r[i],r[a]]=[r[a],r[i]],{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:r}})}function se(e,t){return e.schema.tables.length<=1?e:{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.filter(e=>e.id!==t),relationships:e.schema.relationships.filter(e=>e.fromTableId!==t&&e.toTableId!==t)},layouts:e.layouts.filter(e=>e.tableId!==t),views:(e.views??[]).filter(e=>e.tableId!==t)}}function ce(e){let t=new Date().toISOString();return{...e,createdAt:t,updatedAt:t,metadata:{...e.metadata,title:`${e.metadata.title} (template)`},schema:{...e.schema,tables:e.schema.tables.map(e=>({...e,records:[r(e.fields)]}))},views:[]}}function le(e,t){return e.fields.filter(e=>![`autoNumber`,`createdAt`,`updatedAt`,`calculation`].includes(e.type)).map(e=>String(t.values[e.id]??``).trim().toLowerCase()).join(``)}function ue(e){let t=new Set,n=[];return e.records.forEach(r=>{let i=le(e,r);t.has(i)?n.push(r.id):t.add(i)}),n}function de(e){let t=new Set(ue(e));if(!t.size)return e;let n=e.records.filter(e=>!t.has(e.id));return{...e,records:n.length?n:[e.records[0]]}}function fe(e){return e.fields.filter(t=>![`autoNumber`,`createdAt`,`updatedAt`,`calculation`].includes(t.type)&&e.records.every(e=>String(e.values[t.id]??``).trim()===``))}function pe(e){return e.schema.relationships.filter(t=>{let n=e.schema.tables.find(e=>e.id===t.fromTableId),r=e.schema.tables.find(e=>e.id===t.toTableId),i=n?.fields.some(e=>e.id===t.fromFieldId),a=r?.fields.some(e=>e.id===t.toFieldId);return!i||!a})}function me(e){let t=new Set(pe(e).map(e=>e.id));return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,relationships:e.schema.relationships.filter(e=>!t.has(e.id))}}}function he(e){if(!e||typeof e!=`object`)throw Error(`This is not a ListSplatTM project file.`);let t=e;if(t.app!==`ListSplatTM`||t.version!==1||!t.schema?.tables)throw Error(`This file is not a supported .listsplat.json project.`)}function ge(e){let t=e.split(/\r?\n/,1)[0]??``,n=[`,`,`	`,`;`],r=`,`,i=-1;for(let e of n){let n=t.split(e).length-1;n>i&&(i=n,r=e)}return r}function _e(e,t=ge(e)){let n=[],r=``,i=[],a=!1;for(let o=0;o<e.length;o+=1){let s=e[o],c=e[o+1];a&&s===`"`&&c===`"`?(r+=`"`,o+=1):s===`"`?a=!a:!a&&s===t?(i.push(r),r=``):!a&&(s===`
`||s===`\r`)?(s===`\r`&&c===`
`&&(o+=1),i.push(r),i.some(e=>e.length>0)&&n.push(i),i=[],r=``):r+=s}return i.push(r),i.some(e=>e.length>0)&&n.push(i),n}function ve(e,t){let i=_e(t),a=(i[0]?.map((e,t)=>e.trim()||`Field ${t+1}`)??[`Field 1`]).map(e=>n(e)),o=i.slice(1).map(e=>r(a,Object.fromEntries(a.map((t,n)=>[t.id,e[n]??``]))));return{id:`table_${Date.now().toString(36)}`,name:e,fields:a,records:o.length>0?o:[r(a)]}}function ye(e){let t=e==null?``:String(e);return/[",\n\r]/.test(t)?`"${t.replaceAll(`"`,`""`)}"`:t}function be(e){return[e.fields.map(e=>ye(e.name)).join(`,`),...e.records.map(t=>e.fields.map(e=>ye(t.values[e.id])).join(`,`))].join(`
`)}var xe=`listsplat.autosave.v1`;function m(e){localStorage.setItem(xe,JSON.stringify(e))}function Se(){let e=localStorage.getItem(xe);if(!e)return null;let t=JSON.parse(e);return he(t),t}function Ce(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,a.click(),URL.revokeObjectURL(i)}function we(e){return e==null?``:String(e).trim().toLowerCase()}function Te(e,n,r,i,a){return{id:t(`relationship`),name:e.trim()||`New Relationship`,fromTableId:n,fromFieldId:r,toTableId:i,toFieldId:a}}function Ee(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,relationships:[...e.schema.relationships,t]}}}function De(e,t,n,r){let i=we(n.values[e.fromFieldId]);return!i||t.id!==e.fromTableId||r.id!==e.toTableId?[]:r.records.filter(t=>we(t.values[e.toFieldId])===i)}function Oe(e,t){let n=e.schema.tables.find(e=>e.id===t.fromTableId),r=e.schema.tables.find(e=>e.id===t.toTableId),i=n?.fields.find(e=>e.id===t.fromFieldId),a=r?.fields.find(e=>e.id===t.toFieldId);return`${n?.name??`Table`}:${i?.name??`Field`} -> ${r?.name??`Table`}:${a?.name??`Field`}`}function ke(e,t){return e.records.map(e=>Number(e.values[t])).filter(e=>Number.isFinite(e))}function Ae(e){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)).map(t=>{let n=ke(e,t.id),r=n.reduce((e,t)=>e+t,0);return{fieldId:t.id,fieldName:t.name,count:n.length,sum:r,average:n.length?r/n.length:0,minimum:n.length?Math.min(...n):0,maximum:n.length?Math.max(...n):0}})}function je(e){let t=[],n=``,r=!1,i=0;for(let a=0;a<e.length;a+=1){let o=e[a],s=e[a-1];if(o===`"`&&s!==`\\`){r=!r,n+=o;continue}if(!r&&o===`(`&&(i+=1),!r&&o===`)`&&--i,o===`,`&&!r&&i===0){t.push(n.trim()),n=``;continue}n+=o}return(n.trim()||e.endsWith(`,`))&&t.push(n.trim()),t}function Me(e){let t=e.trim();if(t.startsWith(`"`)&&t.endsWith(`"`))return t.slice(1,-1).replace(/\\"/g,`"`)}function Ne(e,t,n){let r=n.trim().toLowerCase(),i=e.fields.find(e=>e.name.toLowerCase()===r);return i?String(t.values[i.id]??``):``}function h(e,t,n){let r=n.trim();return/^[A-Z_]+\(.*\)$/i.test(r)?Re(r,e,t):Me(n)??Ne(e,t,n)}function g(e,t,n){let r=Number(h(e,t,n));return Number.isFinite(r)?r:0}function Pe(e,t){let n=t.trim().toLowerCase(),r=e.fields.find(e=>e.name.toLowerCase()===n);return r?ke(e,r.id):[]}function _(e){return Number.isFinite(e)?String(Number(e.toFixed(8))):`Formula error: not a number`}function Fe(e){return e.toLowerCase().replace(/\b[a-z]/g,e=>e.toUpperCase())}function Ie(e,t,n,r){if(!e)return[];let i=r.trim().toLowerCase(),a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===i),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0;return a&&o?De(a,t,n,o):[]}function Le(e,t,n,r,i){if(!e)return``;let a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===r.trim().toLowerCase()),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0,s=Ie(e,t,n,r)[0],c=o?.fields.find(e=>e.name.toLowerCase()===i.trim().toLowerCase());return s&&c?String(s.values[c.id]??``):``}function Re(e,t,n,r){let i=e.trim();if(!i)return``;let a=i.match(/^([A-Z_]+)\((.*)\)$/i);if(!a)return`Formula error: use a function like FIELD(Name)`;let o=a[1].toUpperCase(),s=je(a[2]),c=s[0]??``;if(o===`FIELD`)return Ne(t,n,c);if(o===`JOIN`)return s.map(e=>h(t,n,e)).join(``);if(o===`UPPER`)return h(t,n,c).toUpperCase();if(o===`LOWER`)return h(t,n,c).toLowerCase();if(o===`TITLECASE`)return Fe(h(t,n,c));if(o===`TRIM`)return h(t,n,c).trim();if(o===`LENGTH`)return String(h(t,n,c).length);if(o===`CONTAINS`)return h(t,n,c).toLowerCase().includes(h(t,n,s[1]??``).toLowerCase())?`Yes`:`No`;if(o===`IF_EMPTY`)return h(t,n,c).trim()?h(t,n,c):h(t,n,s[1]??``);if(o===`LOOKUP`)return Le(r,t,n,Me(c)??c,Me(s[1]??``)??s[1]??``);if(o===`COUNT_RELATED`)return String(Ie(r,t,n,Me(c)??c).length);if(o===`ADD`)return _(s.reduce((e,r)=>e+g(t,n,r),0));if(o===`SUBTRACT`)return _(s.slice(1).reduce((e,r)=>e-g(t,n,r),g(t,n,c)));if(o===`MULTIPLY`)return _(s.reduce((e,r)=>e*g(t,n,r),1));if(o===`DIVIDE`){let e=g(t,n,s[1]??``);return e===0?`Formula error: divide by zero`:_(g(t,n,c)/e)}if(o===`ROUND`){let e=Math.max(0,Math.min(6,Math.round(g(t,n,s[1]??`"0"`))));return String(Number(g(t,n,c).toFixed(e)))}if([`SUM`,`AVERAGE`,`MIN`,`MAX`,`COUNT`].includes(o)){let e=Pe(t,c);return o===`SUM`?_(e.reduce((e,t)=>e+t,0)):o===`AVERAGE`?_(e.length?e.reduce((e,t)=>e+t,0)/e.length:0):o===`MIN`?_(e.length?Math.min(...e):0):o===`MAX`?_(e.length?Math.max(...e):0):String(e.length)}if(o===`COUNT_UNIQUE`){let e=c.trim().toLowerCase(),n=t.fields.find(t=>t.name.toLowerCase()===e);if(!n)return`0`;let r=new Set(t.records.map(e=>String(e.values[n.id]??``).trim().toLowerCase()).filter(Boolean));return String(r.size)}if(o===`PERCENT`){let e=g(t,n,s[1]??``);return e===0?`0`:_(g(t,n,c)/e*100)}if(o===`LEFT`)return h(t,n,c).slice(0,Math.max(0,g(t,n,s[1]??`"0"`)));if(o===`RIGHT`){let e=Math.max(0,g(t,n,s[1]??`"0"`)),r=h(t,n,c);return e===0?``:r.slice(-e)}if(o===`MID`){let e=Math.max(0,g(t,n,s[1]??`"1"`)-1),r=Math.max(0,g(t,n,s[2]??`"0"`));return h(t,n,c).slice(e,e+r)}if(o===`SUBSTITUTE`)return h(t,n,c).split(h(t,n,s[1]??``)).join(h(t,n,s[2]??``));let l=e=>{let r=h(t,n,e).trim().toLowerCase();return r!==``&&![`no`,`false`,`0`].includes(r)};if(o===`IS_EMPTY`)return h(t,n,c).trim()===``?`Yes`:`No`;if(o===`NOT`)return l(c)?`No`:`Yes`;if(o===`AND`)return s.every(l)?`Yes`:`No`;if(o===`OR`)return s.some(l)?`Yes`:`No`;if(o===`IF`)return l(c)?h(t,n,s[1]??``):h(t,n,s[2]??``);let u=e=>{let r=h(t,n,e).trim();if(!r)return null;let i=new Date(r.length<=10?`${r}T00:00:00`:r);return Number.isNaN(i.getTime())?null:i};if(o===`TODAY`)return new Date().toISOString().slice(0,10);if(o===`YEAR`||o===`MONTH`||o===`DAY`){let e=u(c);return e?String(o===`YEAR`?e.getFullYear():o===`MONTH`?e.getMonth()+1:e.getDate()):``}if(o===`DAYS_BETWEEN`||o===`YEARS_BETWEEN`){let e=u(c),t=s[1]?u(s[1]):new Date;if(!e||!t)return``;let n=Math.round((t.getTime()-e.getTime())/864e5);return String(o===`DAYS_BETWEEN`?n:Math.floor(n/365.25))}return`Formula error: ${o} is not supported`}function v(e){return e==null?``:String(e)}function ze(e,t){let n=t.query.trim();if(!n)return e.records;let r=n.toLowerCase();return e.records.filter(n=>(t.fieldId===`all`?e.fields.map(e=>e.id):[t.fieldId]).some(e=>v(n.values[e]).toLowerCase().includes(r)))}function Be(e,t){let n=Number(e),r=Number(t);return e!==``&&t!==``&&!Number.isNaN(n)&&!Number.isNaN(r)?n-r:e.localeCompare(t,void 0,{numeric:!0,sensitivity:`base`})}function Ve(e,t){return t.length?[...e].sort((e,n)=>{for(let r of t){let t=v(e.values[r.fieldId]).trim(),i=v(n.values[r.fieldId]).trim();if(t===``&&i!==``)return 1;if(t!==``&&i===``)return-1;let a=Be(t,i)*(r.direction===`asc`?1:-1);if(a!==0)return a}return 0}):e}function He(e,t){let n=v(e.values[t.fieldId]),r=n.trim().toLowerCase(),i=t.value.trim().toLowerCase(),a=Number(n),o=Number(t.value),s=n.trim()!==``&&t.value.trim()!==``&&!Number.isNaN(a)&&!Number.isNaN(o);switch(t.operator){case`contains`:return r.includes(i);case`equals`:return s?a===o:r===i;case`startsWith`:return r.startsWith(i);case`endsWith`:return r.endsWith(i);case`greaterThan`:return s?a>o:r>i;case`lessThan`:return s?a<o:r<i;case`between`:{let e=Number(t.value),n=Number(t.value2);return!Number.isNaN(e)&&!Number.isNaN(n)&&!Number.isNaN(a)?a>=Math.min(e,n)&&a<=Math.max(e,n):r>=i&&r<=(t.value2??``).trim().toLowerCase()}case`isEmpty`:return n.trim()===``;case`isNotEmpty`:return n.trim()!==``;default:return!0}}function Ue(e,t){return!t||t.rules.length===0?e:e.filter(e=>t.match===`all`?t.rules.every(t=>He(e,t)):t.rules.some(t=>He(e,t)))}function We(e,t){let n=new Map;return e.records.forEach(e=>{let r=v(e.values[t]).trim().toLowerCase();r&&n.set(r,(n.get(r)??0)+1)}),e.records.filter(e=>{let r=v(e.values[t]).trim().toLowerCase();return r?(n.get(r)??0)>1:!1})}function Ge(e,t){return e.records.filter(e=>!v(e.values[t]).trim())}function Ke(e,t){if(!t.find)return[];let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=[];return e.records.forEach(e=>{o.has(e.id)&&t.fieldIds.forEach(n=>{let r=v(e.values[n]),i=r.replace(a,t.replacement);i!==r&&s.push({recordId:e.id,fieldId:n,before:r,after:i})})}),s}function qe(e,t){if(!t.find)return{table:e,count:0};let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=0,c=e.records.map(e=>{if(!o.has(e.id))return e;let n=!1,r={...e.values};return t.fieldIds.forEach(e=>{let i=v(r[e]),o=i.replace(a,()=>(s+=1,t.replacement));o!==i&&(n=!0,r[e]=o)}),n?{...e,updatedAt:new Date().toISOString(),values:r}:e});return{table:{...e,records:c},count:s}}var Je={email:/^[^\s@]+@[^\s@]+\.[^\s@]+$/,url:/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/,phone:/^[+()\d][\d\s().-]{5,}$/};function Ye(e){return e==null?``:String(e)}function Xe(e,t,n,r){let i=Ze(e,t,n,r);return i&&e.customMessage?e.customMessage:i}function Ze(e,t,n,r){let i=Ye(t).trim();if(i===``)return e.required?`This field is required.`:``;if(e.maxLength&&i.length>e.maxLength)return`Keep this ${e.maxLength} characters or fewer.`;if(e.type===`email`&&!Je.email.test(i))return`Enter a valid email address.`;if(e.type===`phone`&&!Je.phone.test(i))return`Enter a valid phone number.`;if([`number`,`currency`,`percent`,`rating`].includes(e.type)){let t=Number(i);if(Number.isNaN(t))return`Enter a number.`;if(e.min!=null&&t<e.min)return`Must be at least ${e.min}.`;if(e.max!=null&&t>e.max)return`Must be at most ${e.max}.`}if([`text`,`longText`,`link`].includes(e.type)&&e.pattern&&e.pattern!==`none`){if(e.pattern===`custom`){if(e.customPattern)try{if(!new RegExp(e.customPattern).test(i))return`Does not match the required format.`}catch{}}else if(!Je[e.pattern].test(i))return`Enter a valid ${e.pattern}.`}return e.unique&&n&&n.records.some(t=>t.id!==r&&Ye(t.values[e.id]).trim().toLowerCase()===i.toLowerCase())?`This value is already used in another record.`:``}function Qe(e){let t=[];return e.fields.forEach(n=>{[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(n.type)||e.records.forEach(r=>{let i=Xe(n,r.values[n.id],e,r.id);i&&t.push({record:r,field:n,message:i})})}),t}function $e(e,t,n,r,i,a){return{id:e,title:t,gradeBand:n,goal:r,table:ve(t,i),reflectionQuestions:a}}var et=[$e(`classroom-library`,`Classroom Library Catalog`,`Grades 3-8`,`Track books, genres, reading levels, and recommendations.`,`Title,Author,Genre,Pages,Who would enjoy it?
Charlotte's Web,E. B. White,Fiction,192,Readers who like animals
Hidden Figures,Margot Lee Shetterly,Biography,240,Readers who like history`,[`Which genre appears most often?`,`What book would you recommend first?`]),$e(`science-observations`,`Science Observation Log`,`Grades 3-8`,`Collect observations over time and look for patterns.`,`Date,Object observed,Location,Measurement,Observation
2026-06-29,Bean plant,Window,8 cm,Two new leaves
2026-06-30,Bean plant,Window,8.5 cm,Stem leaned toward light`,[`What changed over time?`,`What might explain the pattern?`]),$e(`state-facts`,`State Facts Database`,`Grades 4-8`,`Compare places using consistent fields.`,`State,Capital,Region,Population note,Interesting fact
Texas,Austin,South,Large population,Has many different ecosystems
New Mexico,Santa Fe,Southwest,Medium population,Capital is over 400 years old`,[`Which fields help compare states?`,`What new field would improve this database?`]),$e(`book-reviews`,`Book Review Collection`,`Grades 3-8`,`Collect opinions and evidence from student reading.`,`Book,Reviewer,Rating,Favorite part,Would recommend?
Because of Winn-Dixie,Jordan,5,The friendship story,Yes
Wonder,Avery,4,The different points of view,Yes`,[`Which book has the strongest recommendation?`,`What evidence supports each rating?`]),$e(`vocabulary-bank`,`Vocabulary Word Bank`,`Grades 2-8`,`Build a searchable word list with definitions and examples.`,`Word,Definition,Example sentence,Subject
evaporate,To change from liquid to gas,Water can evaporate in sunlight,Science
compare,To tell how things are alike,Compare two characters,Reading`,[`Which words belong to more than one subject?`,`Which examples help you remember the word?`]),$e(`survey-results`,`Simple Survey Results`,`Grades 3-8`,`Organize survey answers and look for patterns.`,`Question,Answer,Student group,Count,Notes
Favorite recess activity,Soccer,Grade 4,12,Most common outdoor choice
Favorite recess activity,Drawing,Grade 4,6,Quiet activity choice`,[`Which answer appears most often?`,`What new question should the class ask next?`]),$e(`museum-cards`,`Museum Exhibit Cards`,`Grades 4-8`,`Create printable exhibit cards for objects, images, or research topics.`,`Item,Creator or source,Year,Category,Why it matters
Printing press,Johannes Gutenberg,1440,Invention,Changed how books were made
Apollo 11 mission,NASA,1969,Space exploration,First humans walked on the Moon`,[`How should the exhibit be grouped?`,`What field would help visitors understand the item?`])];function tt(e){let t=e.table.fields.map(e=>({...e,id:`${e.id}_${Date.now().toString(36)}`})),n=e.table.records.map(n=>r(t,Object.fromEntries(e.table.fields.map((e,r)=>[t[r].id,n.values[e.id]??``]))));return{...e.table,id:`table_${e.id}_${Date.now().toString(36)}`,fields:t,records:n}}var nt=`drawsplat.language`,rt=[{code:`en`,label:`English`,dir:`ltr`,htmlLang:`en`},{code:`es`,label:`Español`,dir:`ltr`,htmlLang:`es`},{code:`vi`,label:`Tiếng Việt`,dir:`ltr`,htmlLang:`vi`},{code:`ar`,label:`العربية`,dir:`rtl`,htmlLang:`ar`},{code:`zh`,label:`中文`,dir:`ltr`,htmlLang:`zh`},{code:`uh`,label:`हिन्दी / اردو`,dir:`ltr`,htmlLang:`hi`}],it={es:{New:`Nuevo`,"Save JSON":`Guardar JSON`,"Open JSON":`Abrir JSON`,"Export CSV":`Exportar CSV`,File:`Archivo`,Edit:`Editar`,Data:`Datos`,Layout:`Diseño`,Tools:`Herramientas`,View:`Vista`,Teacher:`Docente`,Help:`Ayuda`,Title:`Título`,Search:`Buscar`,In:`En`,"All fields":`Todos los campos`,Sort:`Ordenar`,"Choose field":`Elegir campo`,"New field":`Campo nuevo`,"Field name":`Nombre del campo`,Type:`Tipo`,"Add field":`Agregar campo`,"Add record":`Agregar registro`,Table:`Tabla`,Form:`Formulario`,Cards:`Tarjetas`,Gallery:`Galería`,Labels:`Etiquetas`,Report:`Informe`,"Upload image":`Subir imagen`,"No image yet":`Sin imagen todavía`},vi:{New:`Mới`,"Save JSON":`Lưu JSON`,"Open JSON":`Mở JSON`,"Export CSV":`Xuất CSV`,File:`Tệp`,Edit:`Sửa`,Data:`Dữ liệu`,Layout:`Bố cục`,Tools:`Công cụ`,View:`Xem`,Teacher:`Giáo viên`,Help:`Trợ giúp`,Title:`Tiêu đề`,Search:`Tìm`,Sort:`Sắp xếp`,Table:`Bảng`,Form:`Biểu mẫu`,Cards:`Thẻ`,Gallery:`Thư viện ảnh`,Labels:`Nhãn`,Report:`Báo cáo`},ar:{New:`جديد`,"Save JSON":`حفظ JSON`,"Open JSON":`فتح JSON`,"Export CSV":`تصدير CSV`,File:`ملف`,Edit:`تحرير`,Data:`بيانات`,Layout:`تخطيط`,Tools:`أدوات`,View:`عرض`,Teacher:`المعلم`,Help:`مساعدة`,Title:`العنوان`,Search:`بحث`,Sort:`فرز`,Table:`جدول`,Form:`نموذج`,Cards:`بطاقات`,Gallery:`معرض`,Labels:`ملصقات`,Report:`تقرير`},zh:{New:`新建`,"Save JSON":`保存 JSON`,"Open JSON":`打开 JSON`,"Export CSV":`导出 CSV`,File:`文件`,Edit:`编辑`,Data:`数据`,Layout:`布局`,Tools:`工具`,View:`视图`,Teacher:`教师`,Help:`帮助`,Title:`标题`,Search:`搜索`,Sort:`排序`,Table:`表格`,Form:`表单`,Cards:`卡片`,Gallery:`图库`,Labels:`标签`,Report:`报告`},uh:{New:`नया`,File:`फ़ाइल`,Edit:`संपादन`,Data:`डेटा`,Layout:`लेआउट`,Tools:`औज़ार`,View:`दृश्य`,Teacher:`शिक्षक`,Help:`सहायता`,Search:`खोज`,Table:`तालिका`,Form:`फ़ॉर्म`,Cards:`कार्ड`,Gallery:`गैलरी`,Labels:`लेबल`,Report:`रिपोर्ट`}},at=document.querySelector(`#app`);if(!at)throw Error(`ListSplatTM app root was not found.`);var y=at,b=Se()??a(),x=b.schema.tables[0].id,S=b.schema.tables[0].records[0]?.id??``,C=`table`,ot=`Saved locally`,w=``,T=`all`,E=[],D=null,O={match:`all`,rules:[]},st=[],ct=``,k=[],A=new Set,j=null,lt=!1,ut=``,dt=``,ft=``,pt=``,mt=!1,ht=null,gt=`bar`,_t=``,vt=`count`,yt=``,M=null,bt=null,xt=null,N=[],St=``,P=`add`,F=new Set,I=`none`,Ct=``,L=`Tip: Start with one table, then add relationships when your project needs them.`,R=[],z=[],wt=``,Tt=null,B=[],Et=x,Dt=b.schema.tables[1]?.id??x,V=null,Ot=``,kt=jt();function H(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function At(e){let t=(e||``).toLowerCase();return t.startsWith(`es`)?`es`:t.startsWith(`vi`)?`vi`:t.startsWith(`ar`)?`ar`:t.startsWith(`zh`)?`zh`:t===`uh`||t.startsWith(`ur`)||t.startsWith(`hi`)?`uh`:`en`}function jt(){let e=new URLSearchParams(window.location.search);try{return At(e.get(`lang`)||localStorage.getItem(nt)||navigator.language)}catch{return At(e.get(`lang`)||navigator.language)}}function Mt(e){return rt.map(({code:t,label:n})=>`<option value="${t}"${t===e?` selected`:``}>${n}</option>`).join(``)}function U(e){return kt===`en`?e:it[kt][e]??e}function Nt(){let e=rt.find(e=>e.code===kt)??rt[0];document.documentElement.lang=e.htmlLang,document.documentElement.dir=e.dir}function W(){return b.schema.tables.find(e=>e.id===x)??b.schema.tables[0]}function G(e){let t=ze(e,{query:w,fieldId:T});return t=t.filter(e=>lt?e.archived:!e.archived),t=Ue(t,D),F.size>0&&(t=t.filter(e=>F.has(e.id))),Ve(t,E.filter(t=>e.fields.some(e=>e.id===t.fieldId)))}function Pt(e){return e.records.filter(e=>e.archived).length}function Ft(){return!!w||!!(D&&D.rules.length)||F.size>0}function K(){w=``,D=null,F=new Set}function It(e){e.records.some(e=>e.id===S)||(S=e.records[0]?.id??``)}function q(e){b=e,It(W()),m(b),ot=`Saved locally`,$()}function J(e){R=[{label:e,project:structuredClone(b)},...R].slice(0,25),z=[]}function Lt(e,t){let n=`${e}:${t}`;wt!==n&&(J(`edit ${W().fields.find(e=>e.id===t)?.name??`cell`}`),wt=n,Rt())}function Rt(){let e=y.querySelector(`[data-action="undo-change"]`),t=y.querySelector(`[data-action="redo-change"]`);e&&(e.disabled=R.length===0),t&&(t.disabled=z.length===0)}function zt(e){b=e,x=b.schema.tables.some(e=>e.id===x)?x:b.schema.tables[0].id,It(W()),m(b),$()}function Bt(){let e=R[0];if(!e){L=`Nothing to undo yet.`,$();return}z=[{label:e.label,project:structuredClone(b)},...z].slice(0,25),R=R.slice(1),L=`Undid ${e.label}.`,zt(e.project)}function Vt(){let e=z[0];if(!e){L=`Nothing to redo.`,$();return}R=[{label:e.label,project:structuredClone(b)},...R].slice(0,25),z=z.slice(1),L=`Redid ${e.label}.`,zt(e.project)}function Y(e){x=e.id,q(p(b,e))}function Ht(e,t){let n=W();J(t),Y({...n,records:n.records.map(t=>t.id===S?e(t):t)})}function Ut(){let e=[];y.querySelectorAll(`.rubric-def-row`).forEach(n=>{let r=n.dataset.critId??t(`crit`),i=n.querySelector(`[data-crit-label]`)?.value.trim()??``,a=Number(n.querySelector(`[data-crit-max]`)?.value)||4;i&&e.push({id:r,label:i,max:a})}),k=e}function Wt(){document.querySelectorAll(`.menu[open]`).forEach(e=>{e.open=!1})}function Gt(e){q({...b,updatedAt:new Date().toISOString(),metadata:{...b.metadata,title:e||`Untitled Database`}})}function Kt(e=b){Ce(`${e.metadata.title||`listsplat-project`}.listsplat.json`,JSON.stringify(e,null,2),`application/json`)}function qt(){Ce(`${W().name}.csv`,be(W()),`text/csv;charset=utf-8`)}function Jt(){let e=W(),t=e.fields.filter(e=>!e.hidden),n=G(e),r=t.map(e=>ye(e.name)).join(`,`),i=n.map(n=>t.map(t=>ye(Z(e,n,t.id))).join(`,`)).join(`
`);Ce(`${e.name}-found.csv`,`${r}\n${i}`,`text/csv;charset=utf-8`),L=`Exported ${n.length} shown record${n.length===1?``:`s`} to CSV.`,$()}async function Yt(e){let t=await crypto.subtle.digest(`SHA-256`,new TextEncoder().encode(e));return Array.from(new Uint8Array(t)).map(e=>e.toString(16).padStart(2,`0`)).join(``)}async function Xt(){let e=W(),t=e.fields.filter(e=>!e.hidden&&e.type!==`image`),n=e.fields.find(e=>e.type===`image`&&!e.hidden),r=G(e),i=window.prompt(`Optional password to view (leave blank for none). This is a convenience gate, not encryption.`)??``,a=i?await Yt(i):``,o=r.map(r=>{let i=n?mn(Z(e,r,n.id)):``;return`<article class="card">${i?`<img src="${H(i)}" alt="">`:``}<h3>${H(_n(e,r))}</h3>${t.map(t=>`<p><strong>${H(t.name)}:</strong> ${H(String(on(t,Z(e,r,t.id))))}</p>`).join(``)}</article>`}).join(``),s=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${H(b.metadata.title)} — ${H(e.name)}</title>
<style>body{margin:0;font-family:system-ui,sans-serif;color:#1f2937;background:#f4f1ff}header{background:linear-gradient(110deg,#6d28d9,#a855f7);color:#fff;padding:20px 24px}main{max-width:1000px;margin:0 auto;padding:20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}.card{background:#fff;border:1px solid #e5e0ff;border-radius:12px;padding:14px;box-shadow:0 8px 18px rgba(31,41,55,.06)}.card img{width:100%;border-radius:8px;margin-bottom:8px}.card h3{margin:0 0 8px;color:#5b21b6}.card p{margin:2px 0;font-size:.9rem}#gate{position:fixed;inset:0;display:none;place-items:center;background:#0b1d33;color:#fff}body.locked #gate{display:grid}body.locked main,body.locked header{filter:blur(6px)}</style></head>
<body data-hash="${a}"><div id="gate"><div style="text-align:center"><p>This page is password protected.</p><input id="pw" type="password" placeholder="Password"> <button id="go">View</button></div></div>
<header><h1>${H(b.metadata.title)}</h1><p>${H(e.name)} · ${r.length} record${r.length===1?``:`s`} · read-only</p></header>
<main>${o}</main>
<script>const HASH=document.body.dataset.hash;async function sha(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')}if(HASH){document.body.classList.add('locked');document.getElementById('go').onclick=async()=>{if(await sha(document.getElementById('pw').value)===HASH)document.body.classList.remove('locked')};document.getElementById('pw').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('go').click()})}<\/script>
</body></html>`;Ce(`${e.name}-shared.html`,s,`text/html;charset=utf-8`),L=`Exported a read-only page with ${r.length} record${r.length===1?``:`s`}${a?` (password protected)`:``}.`,$()}function Zt(){let e=W(),t=e.fields.filter(e=>!e.hidden),n=G(e),r=e=>String(e??``).replace(/\|/g,`\\|`).replace(/\n/g,` `),i=`| ${t.map(e=>r(e.name)).join(` | `)} |`,a=`| ${t.map(()=>`---`).join(` | `)} |`,o=n.map(n=>`| ${t.map(t=>r(Z(e,n,t.id))).join(` | `)} |`).join(`
`);Ce(`${e.name}.md`,`# ${e.name}\n\n${i}\n${a}\n${o}\n`,`text/markdown;charset=utf-8`),L=`Exported a Markdown table.`,$()}function Qt(){let e=W(),t=G(e),n=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${H(b.metadata.title)}</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{color:#5b21b6}</style></head>
<body><h1>${H(b.metadata.title)}</h1><p>${H(e.name)} report from ListSplatTM.</p>
<table><thead><tr>${e.fields.map(e=>`<th>${H(e.name)}</th>`).join(``)}</tr></thead>
<tbody>${t.map(t=>`<tr>${e.fields.map(n=>`<td>${H(Z(e,t,n.id))}</td>`).join(``)}</tr>`).join(``)}</tbody></table></body></html>`;Ce(`${b.metadata.title||`listsplat-report`}.html`,n,`text/html;charset=utf-8`)}function $t(){let e=b.schema.tables.map(e=>{let t=fn(e),n=t.reduce((e,t)=>e+t.missing,0),r=t.reduce((e,t)=>e+t.duplicates,0);return`
        <section>
          <h2>${H(e.name)}</h2>
          <p>${e.records.length} records, ${e.fields.length} fields, ${n} missing values, ${r} duplicate values.</p>
          <table>
            <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th><th>Missing</th><th>Duplicates</th></tr></thead>
            <tbody>${e.fields.map(e=>{let n=t.find(t=>t.field.id===e.id);return`<tr><td>${H(e.name)}</td><td>${H(e.type)}</td><td>${e.required?`Yes`:`No`}</td><td>${H(e.description)}</td><td>${n?.missing??0}</td><td>${n?.duplicates??0}</td></tr>`}).join(``)}</tbody>
          </table>
        </section>
      `}).join(``),t=b.schema.relationships.length?`<ul>${b.schema.relationships.map(e=>`<li>${H(e.name)}: ${H(Oe(b,e))}</li>`).join(``)}</ul>`:`<p>No relationships have been created yet.</p>`,n=b.teacher.notes.length?`<ul>${b.teacher.notes.map(e=>`<li>${H(e)}</li>`).join(``)}</ul>`:`<p>No teacher notes yet.</p>`,r=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${H(b.metadata.title)} Project Packet</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937;line-height:1.5}h1,h2{color:#5b21b6}section{margin:0 0 28px}table{border-collapse:collapse;width:100%;margin-top:10px}th,td{border:1px solid #d8ccff;padding:8px;text-align:left;vertical-align:top}th{background:#f3edff;color:#4c1d95}.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.meta div{border:1px solid #d8ccff;border-radius:8px;padding:12px;background:#faf8ff}</style></head>
<body>
  <h1>${H(b.metadata.title||`ListSplat Project`)} Project Packet</h1>
  <div class="meta">
    <div><strong>Author</strong><br>${H(b.metadata.author||`Not set`)}</div>
    <div><strong>Class</strong><br>${H(b.metadata.className||`Not set`)}</div>
    <div><strong>Tables</strong><br>${b.schema.tables.length}</div>
    <div><strong>Relationships</strong><br>${b.schema.relationships.length}</div>
  </div>
  <section><h2>Teacher Notes</h2>${n}</section>
  <section><h2>Relationships</h2>${t}</section>
  ${e}
</body></html>`;Ce(`${b.metadata.title||`listsplat`}-project-packet.html`,r,`text/html;charset=utf-8`)}function en(e){e.text().then(e=>{let t=JSON.parse(e);he(t),x=t.schema.tables[0].id,S=t.schema.tables[0].records[0]?.id??``,q(t)}).catch(e=>{window.alert(e instanceof Error?e.message:`Could not open this ListSplatTM file.`)})}function tn(e){e.text().then(t=>{let n=ve(e.name.replace(/\.csv$/i,``),t);V=n,Ot=e.name;let r=W();N=n.fields.map(e=>{let t=n.records.slice(0,12).map(t=>String(t.values[e.id]??``)),i=r.fields.find(t=>t.name.trim().toLowerCase()===e.name.trim().toLowerCase());return{header:e.name,action:i?`existing`:`new`,type:Kr(t),fieldId:i?.id??``}}),St=``,P=`add`,I=`csvImport`,L=`Previewing ${n.records.length} CSV record${n.records.length===1?``:`s`} from ${e.name}.`,$()})}function nn(e){if(!V){I=`none`;return}qr();let i=V;if(J(`CSV import`),e===`new`){let e=N.filter(e=>e.action!==`skip`).map((e,t)=>{let r=i.fields[N.indexOf(e)];return{field:n(e.header||`Field ${t+1}`,e.type),sourceFieldId:r.id}}),a=i.records.map(t=>r(e.map(e=>e.field),Object.fromEntries(e.map(e=>[e.field.id,u(t.values[e.sourceFieldId],e.field.type).value])))),o={id:t(`table`),name:i.name,fields:e.map(e=>e.field),records:a.length?a:[r(e.map(e=>e.field))]};x=o.id,S=o.records[0]?.id??``,V=null,K(),E=[],A=new Set,I=`none`,L=`Imported ${o.records.length} records from ${Ot}.`,q({...b,updatedAt:new Date().toISOString(),schema:{...b.schema,tables:[...b.schema.tables,o]},layouts:[...b.layouts,{id:t(`layout`),name:`${o.name} Table`,tableId:o.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${o.name} Form`,tableId:o.id,mode:`form`,locked:!1}]});return}let a=W();N.forEach((e,t)=>{if(e.action===`new`){let r=n(e.header||`Field ${t+1}`,e.type);a={...a,fields:[...a.fields,r]},e.fieldId=r.id}});let o=new Map(a.fields.map(e=>[e.id,e])),s=i.records.map(e=>r(a.fields,Object.fromEntries(N.filter(e=>e.action!==`skip`&&e.fieldId&&o.has(e.fieldId)).map((t,n)=>{let r=i.fields[N.indexOf(t)],a=o.get(t.fieldId);return[t.fieldId,u(e.values[r.id],a.type,a.options).value]}))));V=null,I=`none`;let c=St&&o.has(St)?St:``;if(c&&P!==`add`){let e=e=>String(e.values[c]??``).trim().toLowerCase(),t=new Map(a.records.map(t=>[e(t),t.id])),n=[...a.records],r=0,i=0,o=0;s.forEach(a=>{let s=e(a),c=s?t.get(s):void 0;c&&P===`skip`?o+=1:c&&P===`update`?(n=n.map(e=>e.id===c?{...e,updatedAt:new Date().toISOString(),values:{...e.values,...a.values}}:e),i+=1):(n.push(a),s&&t.set(s,a.id),r+=1)}),L=`Import: ${r} added, ${i} updated, ${o} skipped.`,Y({...a,records:n});return}L=`Appended ${s.length} CSV record${s.length===1?``:`s`} to ${a.name}.`,Y({...a,records:[...a.records,...s]})}function rn(e){let t=et.find(t=>t.id===e);if(!t)return;let n=tt(t);J(`template load`),x=n.id,S=n.records[0]?.id??``,L=`Loaded ${t.title}.`,q({...b,metadata:{...b.metadata,title:t.title},schema:{...b.schema,tables:[...b.schema.tables,n]},teacher:{...b.teacher,notes:t.reflectionQuestions}})}function X(e,t){return`
    <details class="menu">
      <summary>${H(U(e))}</summary>
      <div class="menu-panel">
        ${t.map(([e,t])=>`<button type="button" data-action="${e}">${H(U(t))}</button>`).join(``)}
      </div>
    </details>
  `}function an(e=`text`){return[[`text`,`Short text`],[`longText`,`Long text`],[`number`,`Number`],[`currency`,`Currency`],[`percent`,`Percent`],[`date`,`Date`],[`time`,`Time`],[`dateTime`,`Date and time`],[`checkbox`,`Checkbox`],[`rating`,`Rating`],[`choice`,`Single choice`],[`multiSelect`,`Multiple choice`],[`email`,`Email`],[`phone`,`Phone`],[`link`,`Web address`],[`image`,`Image`],[`file`,`File attachment`],[`audio`,`Audio recording`],[`calculation`,`Calculation`],[`autoNumber`,`Auto number`],[`createdAt`,`Created time`],[`updatedAt`,`Updated time`]].map(([t,n])=>`<option value="${t}" ${e===t?`selected`:``}>${n}</option>`).join(``)}function Z(e,t,n){let r=e.fields.find(e=>e.id===n);return r?.type===`calculation`&&r.formula?Re(r.formula,e,t,b):t.values[n]??``}function on(e,t){if(t===``||t==null)return``;if(!e)return String(t);let n=typeof t==`number`?t:Number(t);return e.type===`currency`&&Number.isFinite(n)?n.toLocaleString(void 0,{style:`currency`,currency:`USD`}):e.type===`percent`&&Number.isFinite(n)?`${n.toLocaleString()}%`:e.type===`number`&&Number.isFinite(n)?n.toLocaleString():e.type===`checkbox`?t===!0||t===`true`?`Yes`:`No`:e.type===`file`?cr(String(t??``))?.name??``:e.type===`audio`?t?`Audio recording`:``:String(t)}function sn(){return b.layouts.find(e=>e.tableId===x&&e.mode===C)}function cn(e){return!!e}function Q(e){let t=new Set(sn()?.hiddenFieldIds??[]);return ln(e).filter(e=>!t.has(e.id))}function ln(e){let t=sn()?.fieldOrder??e.fields.map(e=>e.id),n=new Map(e.fields.map(e=>[e.id,e]));return[...t.map(e=>n.get(e)).filter(cn),...e.fields.filter(e=>!t.includes(e.id))].filter(e=>e&&!e.hidden)}function un(e){return e.fields.filter(e=>e.type===`calculation`)}function dn(e){return un(e).reduce((t,n)=>n.formula?t+e.records.filter(t=>String(Re(n.formula??``,e,t,b)).startsWith(`Formula error:`)).length:t,0)}function fn(e){return e.fields.filter(e=>!e.hidden&&![`image`,`autoNumber`,`createdAt`,`updatedAt`,`calculation`].includes(e.type)).map(t=>({field:t,missing:Ge(e,t.id).length,duplicates:We(e,t.id).length}))}function pn(e){return Q(e).filter(e=>e.type===`image`)}function mn(e){let t=String(e??``);return/^(data:|https?:|blob:)/i.test(t)?t:``}function hn(e,t){let n=pn(e)[0];return n?mn(Z(e,t,n.id)):``}function gn(e){let t=sn();t&&q({...b,updatedAt:new Date().toISOString(),layouts:b.layouts.map(n=>n.id===t.id?{...n,...e}:n)})}function _n(e,t){let n=e.fields.find(e=>!e.hidden)??e.fields[0],r=n?Z(e,t,n.id):``;return String(r||`Untitled record`)}function vn(e,t,n,r){let i=e.fields.find(e=>e.id===n),a=Z(e,t,n),o=`aria-label="${H(i?.name??`Field`)}, record ${r+1}" data-record-id="${t.id}" data-field-id="${n}"`,s=i&&![`checkbox`,`image`,`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(i.type)?Xe(i,a,e,t.id):``,c=s?`cell-input cell-invalid`:`cell-input`,l=s?` title="${H(s)}"`:``,u=`${l}${i?.readonly?` readonly disabled`:``}${i?.maxLength?` maxlength="${i.maxLength}"`:``}`;if(i?.type===`checkbox`)return`<input class="cell-checkbox" type="checkbox" ${o} ${i.readonly?`disabled`:``} ${a===!0||a===`true`?`checked`:``}>`;if(i?.type===`multiSelect`){let e=i.options?.length?i.options:[`Yes`,`No`],r=new Set(String(a??``).split(`,`).map(e=>e.trim()).filter(Boolean));return`<div class="multi-cell${s?` cell-invalid`:``}" ${o}${s?` title="${H(s)}"`:``}>${e.map(e=>`<label class="multi-chip${r.has(e)?` on`:``}"><input type="checkbox" class="multi-option" data-record-id="${t.id}" data-field-id="${n}" data-multi-option="${H(e)}" ${r.has(e)?`checked`:``} ${i.readonly?`disabled`:``}>${H(e)}</label>`).join(``)}</div>`}if(i?.type===`time`)return`<input class="${c}" type="time" ${o}${u} value="${H(a)}">`;if(i?.type===`dateTime`)return`<input class="${c}" type="datetime-local" ${o}${u} value="${H(a)}">`;if(i?.type===`email`){let e=String(a??``);return`<div class="link-cell"><input class="${c}" type="email" ${o}${u} value="${H(e)}" placeholder="name@example.com">${e&&!s?`<a class="link-open" href="mailto:${H(e)}" title="Send email" aria-label="Send email">✉</a>`:``}</div>`}if(i?.type===`phone`)return`<input class="${c}" type="tel" ${o}${u} value="${H(a)}" placeholder="(555) 555-5555">`;if(i?.type===`link`){let e=String(a??``),t=/^https?:\/\//i.test(e)?e:e?`https://${e}`:``;return`<div class="link-cell"><input class="${c}" type="url" ${o}${u} value="${H(e)}" placeholder="https://…">${t?`<a class="link-open" href="${H(t)}" target="_blank" rel="noopener" title="Open link" aria-label="Open link">↗</a>`:``}</div>`}if(i?.type===`image`){let e=String(a??``),r=/^(data:|https?:|blob:)/i.test(e)?e:``;return`
      <div class="image-cell" tabindex="0" role="button" title="Click here and paste an image, or use Upload image." ${o}>
        ${r?`<img src="${H(r)}" alt="${H(i.description||i.name)}">`:`<span>${H(U(`No image yet`))}</span>`}
        <small>Paste, upload, or take a photo.</small>
        <div class="image-actions">
          <label class="image-upload-label">
            ${H(U(`Upload image`))}
            <input class="image-input" type="file" accept="image/*" ${o}>
          </label>
          <button type="button" class="button ghost" data-action="camera-capture" data-record-id="${t.id}" data-field-id="${n}">Take photo</button>
        </div>
      </div>
    `}if(i?.type===`file`){let e=cr(String(a??``));return`
      <div class="file-cell" ${o}>
        ${e?`<a class="file-link" href="${H(e.url)}" download="${H(e.name)}">📎 ${H(e.name)}</a>`:`<span>No file yet</span>`}
        <label class="image-upload-label">${e?`Replace`:`Add file`}<input class="file-input" type="file" data-record-id="${t.id}" data-field-id="${n}"></label>
      </div>
    `}if(i?.type===`audio`){let e=String(a??``),r=/^(data:|https?:|blob:)/i.test(e)?e:``;return`
      <div class="audio-cell" data-record-id="${t.id}" data-field-id="${n}">
        ${r?`<audio class="no-advance" src="${H(r)}" controls preload="metadata"></audio>`:`<span>No recording</span>`}
        <button type="button" class="button ghost" data-action="record-audio" data-record-id="${t.id}" data-field-id="${n}">${r?`Re-record`:`● Record`}</button>
      </div>
    `}if(i?.type===`rating`)return`<input class="${c}" type="number" min="0" max="5" step="1" ${o}${u} value="${H(a)}">`;if(i?.type===`choice`){let e=i.options?.length?i.options:[`Yes`,`No`];return`<select class="${c}" ${o}${l}${i.readonly?` disabled`:``}><option value=""${a===``?` selected`:``}>—</option>${e.map(e=>`<option value="${H(e)}" ${String(a)===e?`selected`:``}>${H(e)}</option>`).join(``)}</select>`}if(i?.type===`autoNumber`||i?.type===`createdAt`||i?.type===`updatedAt`)return`<output class="calc-output">${H(a)}</output>`;if(i?.type===`longText`)return`<textarea class="${c}" ${o}${u}>${H(a)}</textarea>`;if(i?.type===`date`)return`<input class="${c}" type="date" ${o}${u} value="${H(a)}">`;if(i?.type===`number`||i?.type===`currency`||i?.type===`percent`){let e=i.type===`currency`?`<span class="cell-affix">$</span>`:``,t=i.type===`percent`?`<span class="cell-affix">%</span>`:``;return`<span class="num-cell">${e}<input class="${c}" type="number" step="any" ${o}${u} value="${H(a)}">${t}</span>`}return i?.type===`calculation`?`<output class="calc-output">${H(a)}</output>`:`<input class="${c}" ${o}${u} value="${H(a)}">`}function yn(e){return`
    <div class="table-tabs">
      ${b.schema.tables.map(t=>`<button type="button" class="table-tab ${t.id===e.id?`active`:``}" data-table-id="${t.id}">${H(t.name)}</button>`).join(``)}
    </div>
  `}function bn(e,t){if(t.length===0){let e=Ft();return`
      <div class="data-grid-wrap">
        <div class="empty-state">
          <h3>${H(U(e?`No records match your find`:`No records yet`))}</h3>
          <p>${H(U(e?`Try a different search, or show all records.`:`Add your first record to start building this database.`))}</p>
          <button type="button" class="button primary" data-action="${e?`clear-find`:`add-record`}">${e?H(U(`Show all records`)):`+ ${H(U(`Add first record`))}`}</button>
        </div>
      </div>
    `}let n=Q(e),r=t.length>0&&t.every(e=>A.has(e.id)),i=e=>{let t=E.find(t=>t.fieldId===e);return t?t.direction===`asc`?`▲`:`▼`:`⇅`},a=kn(e,t),o=n.length+3,s=(t,r)=>`
                <tr class="${t.id===S?`active-row`:``}${A.has(t.id)?` selected-row`:``}" data-record-row="${t.id}">
                  <td class="select-col"><input type="checkbox" data-select-row="${t.id}" aria-label="Select record ${r+1}" ${A.has(t.id)?`checked`:``}></td>
                  <td class="row-num-col"><button type="button" class="row-button" data-select-record="${t.id}">${r+1}</button></td>
                  ${n.map(n=>`<td style="${xn(n.id)}">${vn(e,t,n.id,r)}</td>`).join(``)}
                  <td class="record-actions">
                    <button type="button" title="Open record" data-action="expand-record" data-record-action-id="${t.id}">Open</button>
                    <button type="button" data-action="duplicate-record" data-record-action-id="${t.id}">Copy</button>
                    <button type="button" data-action="delete-record" data-record-action-id="${t.id}">Delete</button>
                  </td>
                </tr>
              `,c=0,l=a.map(t=>(ut?`<tr class="group-row"><td colspan="${o}"><strong>${H(t.label)}</strong> <span>${t.records.length}${An(e,t.records)?` · `+An(e,t.records):``}</span></td></tr>`:``)+t.records.map(e=>s(e,c++)).join(``)).join(``);return`
    <div class="data-grid-wrap${mt?` wrap-cells`:``}">
      <table class="data-grid">
        <thead>
          <tr>
            <th class="select-col"><input type="checkbox" data-select-all aria-label="Select all records" ${r?`checked`:``}></th>
            <th class="row-num-col">#</th>
            ${n.map(e=>`
                  <th class="col-head" data-col-field="${e.id}" draggable="true" style="${xn(e.id)}">
                    <button type="button" class="field-button" data-field-settings="${e.id}">
                      ${H(e.name)}${e.required?`<span class="req" title="Required field" aria-label="required">*</span>`:``}<br><small>${H(e.type)}</small>
                    </button>
                    <button type="button" class="col-sort" data-action="sort-toggle" data-sort-toggle="${e.id}" title="Sort by ${H(e.name)}">${i(e.id)}</button>
                    <span class="col-resize" data-col-resize="${e.id}" title="Drag to resize" aria-hidden="true"></span>
                  </th>
                `).join(``)}
            <th>Record</th>
          </tr>
        </thead>
        <tbody>
          ${l}
        </tbody>
      </table>
    </div>
  `}function xn(e){let t=sn()?.columnWidths?.[e];return t?`width:${t}px;min-width:${t}px;`:``}function Sn(){return b.metadata.author.trim()||`You`}function Cn(e){let t=b.teacher.studentView,n=(e.comments??[]).filter(e=>!e.teacherOnly||!t),r=b.rubricCriteria??[],i=e.rubricScores??{},a=r.reduce((e,t)=>e+(Number(i[t.id])||0),0),o=r.reduce((e,t)=>e+t.max,0),s=e.history??[];return`
    <section class="record-extras">
      ${r.length?`<div class="record-block">
              <h3>Rubric ${t?``:`<button type="button" class="button ghost" data-action="edit-rubric">Edit</button>`}</h3>
              <div class="rubric-grid">
                ${r.map(e=>`<label class="rubric-row"><span>${H(e.label)}</span><input type="number" min="0" max="${e.max}" data-rubric-criterion="${e.id}" value="${i[e.id]==null?``:H(String(i[e.id]))}"> / ${e.max}</label>`).join(``)}
              </div>
              <p class="rubric-total"><strong>Total: ${a} / ${o}</strong></p>
            </div>`:t?``:`<div class="record-block"><h3>Rubric</h3><button type="button" class="button" data-action="edit-rubric">Set up a rubric</button></div>`}
      <div class="record-block">
        <h3>Comments</h3>
        <div class="comment-list">
          ${n.length?n.map(e=>`
                      <div class="comment${e.teacherOnly?` teacher`:``}">
                        <div class="comment-head"><strong>${H(e.author)}</strong>${e.teacherOnly?`<span class="badge">teacher only</span>`:``}<time>${H(new Date(e.at).toLocaleString())}</time></div>
                        <p>${H(e.text)}</p>
                        ${t&&e.author!==Sn()?``:`<button type="button" class="link-btn" data-action="delete-comment" data-comment-id="${e.id}">Delete</button>`}
                      </div>
                    `).join(``):`<p class="muted">No comments yet.</p>`}
        </div>
        <div class="comment-add">
          <textarea data-comment-text rows="2" placeholder="Add a comment or feedback…"></textarea>
          <div class="comment-add-row">
            ${t?``:`<label class="inline-check"><input type="checkbox" data-comment-teacher> Teacher only</label>`}
            <button type="button" class="button" data-action="add-comment">Add comment</button>
          </div>
        </div>
      </div>
      ${t?``:`<div class="record-block">
              <h3>Version history <button type="button" class="button ghost" data-action="save-version">Save version</button></h3>
              ${s.length?`<ul class="version-list">${s.slice().reverse().map((e,t)=>`<li><time>${H(new Date(e.at).toLocaleString())}</time> <button type="button" class="link-btn" data-action="restore-version" data-version-index="${s.length-1-t}">Restore</button></li>`).join(``)}</ul>`:`<p class="muted">Save a version to keep a snapshot you can restore.</p>`}
            </div>`}
    </section>
  `}function wn(e){let t=e.records.find(e=>e.id===S)??e.records[0];if(!t)return`<div class="empty-panel">Add a record to use form view.</div>`;let n=b.schema.relationships.filter(t=>t.fromTableId===e.id).map(n=>{let r=b.schema.tables.find(e=>e.id===n.toTableId),i=r?De(n,e,t,r):[];return`
        <section class="related-records">
          <h3>${H(n.name)}</h3>
          <p>${i.length} related record${i.length===1?``:`s`} from ${H(r?.name??`another table`)}</p>
          ${i.length?`<div class="related-grid">${i.slice(0,8).map(e=>`
                      <article class="related-card" data-action="open-related" data-rel-record="${e.id}" data-rel-table="${r.id}">
                        <strong>${H(_n(r,e))}</strong>
                        ${r.fields.filter(e=>!e.hidden).slice(0,3).map(t=>`<span>${H(t.name)}: ${H(Z(r,e,t.id))}</span>`).join(``)}
                      </article>
                    `).join(``)}</div>`:`<p>No matches yet. Make sure the match fields use the same value.</p>`}
          <button type="button" class="button" data-action="add-related" data-rel-id="${n.id}">+ Add ${H(r?.name??`related`)} record</button>
        </section>
      `}).join(``);return`
    <div class="form-view">
      <div class="form-nav">
        ${e.records.map((e,n)=>`<button type="button" class="${e.id===t.id?`active`:``}" data-select-record="${e.id}">Record ${n+1}</button>`).join(``)}
      </div>
      <div class="record-form">
        ${Q(e).map((n,r)=>`
              <label>
                <span>${H(n.name)}</span>
                ${vn(e,t,n.id,r)}
                ${n.description?`<small>${H(n.description)}</small>`:``}
              </label>
            `).join(``)}
        ${n}
        ${Cn(t)}
      </div>
    </div>
  `}function Tn(e,t){let n=(t,n)=>{let r=Z(e,n,t.id);if(t.type===`image`){let e=mn(r);return`
        <figure class="card-image-field">
          ${e?`<img src="${H(e)}" alt="">`:`<span>No image yet</span>`}
          <figcaption>${H(t.name)}</figcaption>
        </figure>
      `}if(t.type===`link`&&String(r??``)){let e=String(r),n=/^https?:\/\//i.test(e)?e:`https://${e}`;return`<p><strong>${H(t.name)}</strong><a href="${H(n)}" target="_blank" rel="noopener">${H(e)}</a></p>`}return`<p><strong>${H(t.name)}</strong><span>${H(on(t,r))}</span></p>`};return`
    <div class="cards-view ${C===`gallery`?`gallery-view`:``}">
      ${t.map(t=>{let r=hn(e,t);return`
            <article class="record-card" data-select-record="${t.id}">
              ${C===`gallery`?`<div class="gallery-image">${r?`<img src="${H(r)}" alt="">`:`<span>Add an image field, then upload a picture.</span>`}</div>`:``}
              ${Q(e).filter(e=>C!==`gallery`||e.type!==`image`).slice(0,C===`gallery`?4:8).map(e=>n(e,t)).join(``)}
            </article>
          `}).join(``)}
    </div>
  `}function En(e,t){return`
    <div class="labels-view">
      ${t.map(t=>`
            <article class="print-label">
              ${Q(e).slice(0,4).map(n=>`<p><strong>${H(n.name)}:</strong> ${H(on(n,Z(e,t,n.id)))}</p>`).join(``)}
            </article>
          `).join(``)}
    </div>
  `}function Dn(e,t){let n=Ae(e);return`
    <div class="report-view">
      <header>
        <h2>${H(b.metadata.title)}</h2>
        <p>${H(e.name)} report. ${t.length} record${t.length===1?``:`s`} shown.</p>
      </header>
      ${bn(e,t)}
      ${n.length?`<section class="summary-strip">${n.map(e=>`<div><strong>${H(e.fieldName)}</strong><span>Sum ${e.sum.toLocaleString()} | Avg ${e.average.toFixed(2)}</span></div>`).join(``)}</section>`:`<p class="empty-panel">Add a number, currency, or percent field to see summaries.</p>`}
    </div>
  `}function On(e,t,n){let r=new Set;return t.forEach(t=>{let i=String(Z(e,t,n)??``).trim();i&&r.add(i)}),[...r]}function kn(e,t){if(!ut||!e.fields.some(e=>e.id===ut))return[{key:``,label:``,records:t}];let n=new Map;return t.forEach(t=>{let r=String(Z(e,t,ut)??``).trim();n.has(r)||n.set(r,[]),n.get(r).push(t)}),[...n.entries()].sort((e,t)=>e[0].localeCompare(t[0],void 0,{numeric:!0})).map(([e,t])=>({key:e,label:e||`(empty)`,records:t}))}function An(e,t){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)&&!e.hidden).slice(0,3).map(n=>{let r=t.map(t=>Number(Z(e,t,n.id))).filter(e=>Number.isFinite(e));if(!r.length)return``;let i=r.reduce((e,t)=>e+t,0);return`${H(n.name)}: sum ${i.toLocaleString()}, avg ${(i/r.length).toFixed(1)}`}).filter(Boolean).join(` · `)}function jn(e,t){return e.map(e=>`<option value="${e.id}" ${t===e.id?`selected`:``}>${H(e.name)}</option>`).join(``)}function Mn(e){let t=[];if(C===`list`||C===`table`){let n=e.fields.filter(e=>!e.hidden&&![`image`,`longText`].includes(e.type));t.push(`<label>Group by <select data-group-field><option value="">No grouping</option>${jn(n,ut)}</select></label>`),t.push(`<label class="inline-check"><input type="checkbox" data-wrap-toggle ${mt?`checked`:``}> Wrap long text</label>`)}if(C===`kanban`){let n=e.fields.filter(e=>[`choice`,`text`].includes(e.type)&&!e.hidden);t.push(`<label>Columns by <select data-board-field><option value="">Choose a status or choice field</option>${jn(n,dt)}</select></label>`)}if(C===`calendar`){let n=e.fields.filter(e=>[`date`,`dateTime`,`createdAt`,`updatedAt`].includes(e.type)&&!e.hidden);t.push(`<label>Dates from <select data-calendar-field><option value="">Choose a date field</option>${jn(n,ft)}</select></label>`)}return t.length?`<div class="view-controls">${t.join(``)}</div>`:``}function Nn(e,t){let n=Q(e),r=n[0],i=n.find(e=>e.id!==r?.id&&![`image`].includes(e.type)),a=kn(e,t).map(t=>`
        ${ut?`<div class="group-head"><strong>${H(t.label)}</strong><span>${t.records.length}${An(e,t.records)?` · `+An(e,t.records):``}</span></div>`:``}
        ${t.records.map(t=>{let n=hn(e,t);return`
              <div class="list-row${t.id===S?` active`:``}">
                ${n?`<img class="list-thumb" src="${H(n)}" alt="">`:``}
                <div class="list-main">
                  <strong>${H(Z(e,t,r?.id??``)||`Untitled`)}</strong>
                  ${i?`<span>${H(on(i,Z(e,t,i.id)))}</span>`:``}
                </div>
                <button type="button" class="button ghost" data-action="expand-record" data-record-action-id="${t.id}">Open</button>
              </div>
            `}).join(``)}
      `).join(``);return`<div class="list-view${mt?` wrap-cells`:``}">${a||`<p class="empty-panel">No records to list.</p>`}</div>`}function Pn(e,t){let n=e.fields.find(e=>e.id===dt);return n?`<div class="kanban">${[``,...(n.options&&n.options.length?n.options:On(e,t,n.id)).filter(Boolean)].map(r=>{let i=t.filter(t=>String(Z(e,t,n.id)??``).trim()===r);return`
        <div class="kanban-col" data-kanban-col="${H(r)}">
          <div class="kanban-col-head"><strong>${H(r||`Unassigned`)}</strong><span>${i.length}</span></div>
          <div class="kanban-cards">
            ${i.map(t=>`
                  <div class="kanban-card" draggable="true" data-kanban-card="${t.id}" data-action="expand-record" data-record-action-id="${t.id}">
                    <strong>${H(_n(e,t))}</strong>
                  </div>
                `).join(``)}
          </div>
        </div>
      `}).join(``)}</div>`:`<p class="empty-panel">Choose a status or choice field above to build a board with draggable cards.</p>`}function Fn(e,t){let n=e.fields.find(e=>e.id===ft)??e.fields.find(e=>[`date`,`dateTime`,`createdAt`,`updatedAt`].includes(e.type)&&!e.hidden);if(!n)return`<p class="empty-panel">Add a date field, then choose it above to see records on a calendar.</p>`;let r=pt?new Date(`${pt}-01T00:00:00`):new Date,i=r.getFullYear(),a=r.getMonth(),o=`${i}-${String(a+1).padStart(2,`0`)}`,s=new Date(i,a,1),c=s.getDay(),l=new Date(i,a+1,0).getDate(),u=new Map;t.forEach(t=>{let r=String(Z(e,t,n.id)??``).slice(0,10);/^\d{4}-\d{2}-\d{2}$/.test(r)&&r.startsWith(o)&&(u.has(r)||u.set(r,[]),u.get(r).push(t))});let d=[];for(let e=0;e<c;e+=1)d.push(`<div class="cal-cell empty"></div>`);for(let t=1;t<=l;t+=1){let n=`${o}-${String(t).padStart(2,`0`)}`,r=u.get(n)??[];d.push(`
      <div class="cal-cell">
        <div class="cal-day">${t}</div>
        ${r.slice(0,4).map(t=>`<button type="button" class="cal-event" data-action="expand-record" data-record-action-id="${t.id}">${H(_n(e,t))}</button>`).join(``)}
        ${r.length>4?`<span class="cal-more">+${r.length-4} more</span>`:``}
      </div>
    `)}return`
    <div class="calendar-view">
      <div class="cal-nav">
        <button type="button" class="button" data-action="cal-prev">‹</button>
        <strong>${H(s.toLocaleDateString(void 0,{month:`long`,year:`numeric`}))}</strong>
        <button type="button" class="button" data-action="cal-next">›</button>
        <button type="button" class="button ghost" data-action="cal-today">Today</button>
      </div>
      <div class="cal-grid">
        ${[`Sun`,`Mon`,`Tue`,`Wed`,`Thu`,`Fri`,`Sat`].map(e=>`<div class="cal-weekday">${e}</div>`).join(``)}
        ${d.join(``)}
      </div>
    </div>
  `}function In(e){let t=pt?new Date(`${pt}-01T00:00:00`):new Date;t.setMonth(t.getMonth()+e),pt=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}`}function Ln(e){let t=G(e),n={table:`Table: spreadsheet-like rows and columns for fast data entry.`,form:`Form: focus on one record at a time.`,cards:`Cards: compact text-first record cards for browsing.`,gallery:`Gallery: image-first cards for collections and exhibits.`,list:`List: compact rows grouped by a field.`,kanban:`Board: columns by status or category, drag cards to change them.`,calendar:`Calendar: records placed on a month grid by a date field.`,labels:`Labels: printable small cards or shelf labels.`,report:`Report: printable table with title and summaries.`},r=C===`form`?wn(e):C===`cards`||C===`gallery`?Tn(e,t):C===`list`?Nn(e,t):C===`kanban`?Pn(e,t):C===`calendar`?Fn(e,t):C===`labels`?En(e,t):C===`report`?Dn(e,t):bn(e,t);return`
    <section class="database-panel" aria-label="Database table">
      ${yn(e)}
      <div class="view-tabs" role="group" aria-label="Layout modes">
        ${[`table`,`form`,`cards`,`gallery`,`list`,`kanban`,`calendar`,`labels`,`report`].map(e=>`<button type="button" class="${C===e?`active`:``}" data-view-mode="${e}" title="${H(n[e])}" aria-label="${H(n[e])}">${H(U(e===`kanban`?`Board`:e[0].toUpperCase()+e.slice(1)))}</button>`).join(``)}
      </div>
      ${Mn(e)}
      ${Rn()}
      ${zn(e)}
      ${r}
    </section>
  `}function Rn(){let e=[];if(lt&&e.push(`<button type="button" class="chip chip-button" data-action="toggle-archived" title="Back to active records">Archived view — click to exit</button>`),w&&e.push(`<span class="chip">Search: “${H(w)}”</span>`),D&&D.rules.length){let t=D.match===`all`?` AND `:` OR `,n=D.rules.map(e=>`${Mr(e.fieldId)} ${Nr(e.operator)}${e.operator===`isEmpty`||e.operator===`isNotEmpty`?``:` `+e.value}${e.operator===`between`?`–`+(e.value2??``):``}`).join(t);e.push(`<button type="button" class="chip chip-button" data-action="find" title="Edit find">Find: ${H(n)}</button>`)}return F.size&&e.push(`<span class="chip">${F.size} highlighted</span>`),E.filter(e=>W().fields.some(t=>t.id===e.fieldId)).forEach(t=>{e.push(`<button type="button" class="chip chip-button" data-action="sort-dialog" title="Edit sort">Sort: ${H(Mr(t.fieldId))} ${t.direction===`asc`?`↑`:`↓`}</button>`)}),e.length?`<div class="filter-chips">${e.join(``)}${Ft()?`<button type="button" class="chip chip-clear" data-action="clear-find">Clear find</button>`:``}${E.length?`<button type="button" class="chip chip-clear" data-action="sort-dialog">Edit sort</button>`:``}</div>`:``}function zn(e){let t=Hr(e).length;return t===0||C===`form`?``:`
    <div class="bulk-bar" role="group" aria-label="Bulk actions">
      <strong>${t} selected</strong>
      <button type="button" class="button" data-action="bulk-fill">Fill a field…</button>
      <button type="button" class="button" data-action="bulk-duplicate">Duplicate</button>
      ${lt?`<button type="button" class="button" data-action="bulk-restore">Restore</button>`:`<button type="button" class="button" data-action="bulk-archive">Archive</button>`}
      <button type="button" class="button danger" data-action="bulk-delete">Delete</button>
      <button type="button" class="button ghost" data-action="bulk-clear">Clear selection</button>
    </div>
  `}function Bn(e){let t=Ae(e),n=e.records.find(e=>e.id===S)??e.records[0],r=n?b.schema.relationships.filter(t=>t.fromTableId===e.id).map(t=>{let r=b.schema.tables.find(e=>e.id===t.toTableId),i=r?De(t,e,n,r).length:0;return`
            <div class="template-card">
              <strong>${H(t.name)}</strong>
              <span>${i} related record${i===1?``:`s`}</span>
              <p>${H(Oe(b,t))}</p>
            </div>
          `}).join(``):``;return`
    <aside class="teacher-panel" aria-label="Teacher tools and database stats">
      <h2>Database Check</h2>
      <div class="stat-grid">
        <div class="stat-card"><strong>${G(e).length}</strong> shown</div>
        <div class="stat-card"><strong>${e.records.length}</strong> records</div>
        <div class="stat-card"><strong>${e.fields.length}</strong> fields</div>
        <div class="stat-card"><strong>${b.schema.tables.length}</strong> tables</div>
      </div>
      ${t.map(e=>`
            <div class="template-card">
              <strong>${H(e.fieldName)} summary</strong>
              <span>Sum: ${e.sum.toLocaleString()}</span>
              <span>Average: ${e.average.toFixed(2)}</span>
            </div>
          `).join(``)}
      ${r?`<h3>Related Records</h3>${r}`:``}
      <h3>Template Starters</h3>
      ${et.map(e=>`
            <div class="template-card">
              <strong>${H(e.title)}</strong>
              <span>${H(e.gradeBand)}</span>
              <p>${H(e.goal)}</p>
              <button type="button" data-template-id="${e.id}">Use template</button>
            </div>
          `).join(``)}
    </aside>
  `}function Vn(){let e=b.schema.tables,t=b.schema.relationships,n=t=>e.find(e=>e.id===t)?.name??`table`,r=(t,n)=>e.find(e=>e.id===t)?.fields.find(e=>e.id===n)?.name??`field`,i=new Set(t.flatMap(e=>[e.fromTableId,e.toTableId]));return`<div class="rel-diagram"><div class="rel-boxes">${e.map(e=>`
        <div class="rel-box${e.id===x?` active`:``}${i.has(e.id)?` linked`:``}">
          <strong>${H(e.name)}</strong>
          <span>${e.records.length} record${e.records.length===1?``:`s`} · ${e.fields.length} field${e.fields.length===1?``:`s`}</span>
        </div>
      `).join(``)}</div><div class="rel-links">${t.length?t.map(e=>`
            <div class="rel-link">
              <span class="rel-badge">${H(n(e.fromTableId))}</span>
              <span class="rel-arrow">${H(r(e.fromTableId,e.fromFieldId))} <b>1 → &#8734;</b> ${H(r(e.toTableId,e.toFieldId))}</span>
              <span class="rel-badge">${H(n(e.toTableId))}</span>
            </div>
          `).join(``):`<p class="rel-empty">No links yet. Create one below to connect two tables.</p>`}</div></div>`}function Hn(e){let t=[[`Combine text`,`JOIN(A, " ", B)`],[`Add`,`ADD(A, B)`],[`Multiply`,`MULTIPLY(A, B)`],[`Percent`,`PERCENT(A, B)`],[`If / then`,`IF(CONTAINS(A, "x"), "yes", "no")`],[`Sum column`,`SUM(A)`],[`Average`,`AVERAGE(A)`],[`Count`,`COUNT(A)`],[`Years since`,`YEARS_BETWEEN(A)`],[`Uppercase`,`UPPER(A)`]],n=e.fields.filter(e=>![`calculation`].includes(e.type)).slice(0,12);return`
    <div class="formula-builder">
      <div class="fb-row"><span>Functions</span>${t.map(([e,t])=>`<button type="button" class="fb-chip" data-formula-insert="${H(t)}">${H(e)}</button>`).join(``)}</div>
      <div class="fb-row"><span>Insert field</span>${n.map(e=>`<button type="button" class="fb-chip field" data-formula-insert="${H(e.name)}">${H(e.name)}</button>`).join(``)}</div>
    </div>
  `}function Un(e,t){let n=[`number`,`currency`,`percent`,`rating`].includes(t),r=[`text`,`longText`,`link`].includes(t),i=[`text`,`longText`,`email`,`phone`,`link`].includes(t);return[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(t)?``:`
    <fieldset class="constraints">
      <legend>Rules and default</legend>
      <label class="check-row"><input type="checkbox" data-field-unique ${e.unique?`checked`:``}> No duplicate values (unique)</label>
      <label class="check-row"><input type="checkbox" data-field-readonly ${e.readonly?`checked`:``}> Read-only (students cannot change it)</label>
      ${n?`<div class="grid-two">
              <label>Minimum <input data-field-min type="number" step="any" value="${e.min==null?``:H(String(e.min))}"></label>
              <label>Maximum <input data-field-max type="number" step="any" value="${e.max==null?``:H(String(e.max))}"></label>
            </div>`:``}
      ${i?`<label>Character limit <input data-field-maxlength type="number" min="1" value="${e.maxLength==null?``:H(String(e.maxLength))}" placeholder="no limit"></label>`:``}
      ${r?`<label>Format <select data-field-pattern>${[`none`,`email`,`url`,`phone`,`custom`].map(t=>`<option value="${t}" ${(e.pattern??`none`)===t?`selected`:``}>${t}</option>`).join(``)}</select></label>
            <label>Custom pattern (advanced) <input data-field-custom-pattern value="${H(e.customPattern??``)}" placeholder="regular expression"></label>`:``}
      <label>Default value for new records <input data-field-default value="${H(e.defaultValue??``)}" placeholder="optional"></label>
      <label>Custom message when a value breaks a rule <input data-field-message value="${H(e.customMessage??``)}" placeholder="optional friendly message"></label>
    </fieldset>
  `}function Wn(e,t,n){if(n===t.type||[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(n))return``;let r=(y.querySelector(`[data-field-options]`)?.value??t.options?.join(`, `)??``).split(`,`).map(e=>e.trim()).filter(Boolean),i=e.records.filter(e=>String(e.values[t.id]??``).trim()!==``).slice(0,4).map(e=>{let i=String(e.values[t.id]??``),a=u(e.values[t.id],n,r),o=a.value===!0?`Yes`:a.value===!1?`No`:String(a.value??``);return`<li><span>${H(i)}</span> → <span class="${a.lost?`preview-lost`:``}">${a.lost?`cleared`:H(o||`(empty)`)}</span></li>`}),a=e.records.filter(e=>String(e.values[t.id]??``).trim()===``?!1:u(e.values[t.id],n,r).lost).length;return`
    <div class="type-preview">
      <strong>Change ${H(t.type)} → ${H(n)}</strong>
      ${i.length?`<ul>${i.join(``)}</ul>`:`<p>No values to convert yet.</p>`}
      ${a?`<p class="preview-warn">${a} value${a===1?``:`s`} cannot convert and will be cleared.</p>`:`<p>All values convert cleanly.</p>`}
    </div>
  `}function Gn(e){let t=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${H(e.name)}</option>`).join(``),n=O.rules.map((e,n)=>{let r=jr.find(t=>t.value===e.operator)??jr[0];return`
        <div class="find-rule" data-rule-index="${n}">
          <select data-find-field aria-label="Field">${t(e.fieldId)}</select>
          <select data-find-op aria-label="Condition">${jr.map(t=>`<option value="${t.value}" ${t.value===e.operator?`selected`:``}>${H(t.label)}</option>`).join(``)}</select>
          <input data-find-value type="text" value="${H(e.value)}" placeholder="value" ${r.needsValue?``:`hidden`}>
          <input data-find-value2 type="text" value="${H(e.value2??``)}" placeholder="and" ${r.needsSecond?``:`hidden`}>
          <button type="button" class="button ghost" data-action="find-remove-rule">Remove</button>
        </div>
      `}).join(``);return`
    <div class="modal-backdrop">
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Advanced find">
        <h2>Find records</h2>
        <label>Match <select data-find-match>
          <option value="all" ${O.match===`all`?`selected`:``}>all conditions (AND)</option>
          <option value="any" ${O.match===`any`?`selected`:``}>any condition (OR)</option>
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
  `}function Kn(e){let t=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${H(e.name)}</option>`).join(``);return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Sort records">
        <h2>Sort records</h2>
        <div class="sort-levels">${st.map((e,n)=>`
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
  `}function qn(){let e=Rr();return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Saved views">
        <h2>Saved views</h2>
        <p>A view remembers the current table, layout, search, find, and sort. Save it, then reopen it any time.</p>
        <div class="saved-views">
          ${e.length?e.map(e=>`
                      <div class="saved-view" data-view-id="${e.id}">
                        <div><strong>${H(e.name)}</strong><span>${H(e.mode)}${e.sortKeys.length?` · sorted`:``}${e.find&&e.find.rules.length?` · found`:``}</span></div>
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
  `}function Jn(e){let t=Hr(e).length;return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Fill a field">
        <h2>Fill a field</h2>
        <p>Set the same value in ${t} selected record${t===1?``:`s`}.</p>
        <label>Field <select data-bulk-field>${e.fields.filter(e=>![`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(e.type)).map(e=>`<option value="${e.id}">${H(e.name)}</option>`).join(``)}</select></label>
        <label>Value <input data-bulk-value type="text" placeholder="value to fill in"></label>
        <div class="modal-actions">
          <button type="button" class="button primary" data-action="apply-bulk-fill">Fill selected</button>
          <button type="button" data-action="close-dialog">Cancel</button>
        </div>
      </section>
    </div>
  `}function Yn(e){let t=e.fields.find(e=>e.id===_t);if(!t)return[];let n=G(e),r=new Map;return n.forEach(n=>{let i=String(Z(e,n,t.id)??``).trim()||`(empty)`,a=1;if(vt===`sum`&&yt){let t=Number(Z(e,n,yt));a=Number.isFinite(t)?t:0}r.set(i,(r.get(i)??0)+a)}),[...r.entries()].map(([e,t])=>({label:e,value:t})).slice(0,24)}var Xn=[`#7c3aed`,`#0ea5e9`,`#16a34a`,`#f59e0b`,`#dc2626`,`#9333ea`,`#0891b2`,`#65a30d`,`#ea580c`,`#db2777`];function Zn(e){if(!e.length)return`<p class="empty-panel">Choose a category field to build a chart.</p>`;let t=Math.max(...e.map(e=>e.value),1),n=e.reduce((e,t)=>e+t.value,0)||1;if(gt===`pie`){let t=-Math.PI/2;return`<svg viewBox="0 0 300 260" class="chart-svg" role="img" aria-label="Pie chart">${e.map((e,r)=>{let i=e.value/n*Math.PI*2,a=150+110*Math.cos(t),o=130+110*Math.sin(t);t+=i;let s=150+110*Math.cos(t),c=130+110*Math.sin(t),l=+(i>Math.PI);return`<path d="M150 130 L${a.toFixed(1)} ${o.toFixed(1)} A110 110 0 ${l} 1 ${s.toFixed(1)} ${c.toFixed(1)} Z" fill="${Xn[r%Xn.length]}"></path>`}).join(``)}</svg>`}let r=460/e.length;return gt===`line`?`<svg viewBox="0 0 520 260" class="chart-svg" role="img" aria-label="Line chart">
      <polyline fill="none" stroke="#7c3aed" stroke-width="3" points="${e.map((e,n)=>{let i=30+r*n+r/2,a=230-e.value/t*200;return`${i.toFixed(1)},${a.toFixed(1)}`}).join(` `)}"></polyline>
      ${e.map((e,n)=>{let i=30+r*n+r/2,a=230-e.value/t*200;return`<circle cx="${i.toFixed(1)}" cy="${a.toFixed(1)}" r="4" fill="#5b21b6"></circle>`}).join(``)}
    </svg>`:`<svg viewBox="0 0 520 260" class="chart-svg" role="img" aria-label="Bar chart">${e.map((e,n)=>{let i=30+r*n+4,a=e.value/t*200,o=230-a;return`<rect x="${i.toFixed(1)}" y="${o.toFixed(1)}" width="${(r-8).toFixed(1)}" height="${a.toFixed(1)}" rx="4" fill="${Xn[n%Xn.length]}"></rect>`}).join(``)}<line x1="30" y1="230" x2="490" y2="230" stroke="#d8d2ff"></line></svg>`}function Qn(e){let t=e.fields.filter(e=>!e.hidden&&![`image`,`longText`,`calculation`].includes(e.type)),n=e.fields.filter(e=>[`number`,`currency`,`percent`,`rating`].includes(e.type)),r=Yn(e);return`
    <div class="modal-backdrop">
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Charts">
        <h2>Charts</h2>
        <p>Charts use the records currently shown (${G(e).length}). Change filters to focus a chart.</p>
        <div class="chart-controls">
          <label>Type <select data-chart-type>${[`bar`,`pie`,`line`].map(e=>`<option value="${e}" ${gt===e?`selected`:``}>${e}</option>`).join(``)}</select></label>
          <label>Category <select data-chart-category><option value="">Choose a field</option>${t.map(e=>`<option value="${e.id}" ${_t===e.id?`selected`:``}>${H(e.name)}</option>`).join(``)}</select></label>
          <label>Measure <select data-chart-value-mode><option value="count" ${vt===`count`?`selected`:``}>count records</option><option value="sum" ${vt===`sum`?`selected`:``}>sum a number</option></select></label>
          ${vt===`sum`?`<label>Number field <select data-chart-value-field><option value="">Choose</option>${n.map(e=>`<option value="${e.id}" ${yt===e.id?`selected`:``}>${H(e.name)}</option>`).join(``)}</select></label>`:``}
        </div>
        <div class="chart-area">${Zn(r)}</div>
        ${r.length?`<table class="chart-table"><caption class="sr-only">Chart data</caption><thead><tr><th>Category</th><th>Value</th></tr></thead><tbody>${r.map(e=>`<tr><td>${H(e.label)}</td><td>${e.value.toLocaleString()}</td></tr>`).join(``)}</tbody></table>`:``}
        <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
      </section>
    </div>
  `}function $n(e){let t=ue(e),n=fe(e),r=pe(b),i=Math.round(JSON.stringify(b).length/1024);return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Database maintenance">
        <h2>Database maintenance</h2>
        <div class="maint-row">
          <div><strong>${t.length}</strong> duplicate record${t.length===1?``:`s`}</div>
          <button type="button" class="button" data-action="remove-duplicates" ${t.length?``:`disabled`}>Remove duplicates</button>
        </div>
        <div class="maint-row">
          <div><strong>${n.length}</strong> always-empty field${n.length===1?``:`s`}${n.length?`: `+H(n.map(e=>e.name).join(`, `)):``}</div>
          <span class="muted">${n.length?`Hide or delete them in field settings.`:``}</span>
        </div>
        <div class="maint-row">
          <div><strong>${r.length}</strong> broken relationship${r.length===1?``:`s`}</div>
          <button type="button" class="button" data-action="remove-broken" ${r.length?``:`disabled`}>Remove broken</button>
        </div>
        <div class="maint-row"><div>Project size in this browser: <strong>${i} KB</strong></div></div>
        <div class="maint-row">
          <button type="button" class="button" data-action="duplicate-project">Save a copy (.json)</button>
          <button type="button" class="button" data-action="structure-copy">Save structure-only copy</button>
        </div>
        <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
      </section>
    </div>
  `}function er(e){let t=[];e.fields.filter(e=>e.type===`image`).forEach(e=>{e.description.trim()||t.push(`Image field "${e.name}" has no description to use as alt text.`)});let n=e.fields.filter(e=>!e.hidden&&!e.description.trim()&&![`autoNumber`,`createdAt`,`updatedAt`].includes(e.type));n.length&&t.push(`${n.length} field${n.length===1?``:`s`} have no student-friendly description.`),b.metadata.title.trim()||t.push(`The database has no title.`);let r=Qe(e).filter(e=>/required/i.test(e.message)).length;return r&&t.push(`${r} required value${r===1?` is`:`s are`} still empty.`),t}function tr(e){let t=er(e);return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Accessibility check">
        <h2>Accessibility check</h2>
        <p>Quick checks a database creator can act on. ListSplat itself supports keyboard use, visible focus, and screen readers.</p>
        ${t.length?`<ul class="a11y-list">${t.map(e=>`<li>⚠️ ${H(e)}</li>`).join(``)}</ul>`:`<p class="a11y-ok">✅ No issues found. Nice work.</p>`}
        <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
      </section>
    </div>
  `}var nr=[{id:`collection`,label:`A collection (books, rocks, artifacts)`,fields:[[`Name`,`text`],[`Category`,`choice`],[`Notes`,`longText`],[`Picture`,`image`]]},{id:`log`,label:`A log or journal (observations, reading)`,fields:[[`Date`,`date`],[`Entry`,`longText`],[`Rating`,`rating`]]},{id:`people`,label:`A directory of people`,fields:[[`Name`,`text`],[`Email`,`email`],[`Phone`,`phone`],[`Notes`,`longText`]]},{id:`inventory`,label:`An inventory or checkout list`,fields:[[`Item`,`text`],[`Quantity`,`number`],[`Location`,`text`],[`Status`,`choice`]]},{id:`tracker`,label:`A tracker with status columns`,fields:[[`Title`,`text`],[`Status`,`choice`],[`Owner`,`text`],[`Due date`,`date`],[`Notes`,`longText`]]}];function rr(){return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Guided database builder">
        <h2>Build a database</h2>
        <p>Tell me what you want to track and I'll set up a table with useful fields. You can change anything afterward.</p>
        <label>Name it <input data-guided-name placeholder="e.g. Rock collection"></label>
        <div class="guided-kinds">
          ${nr.map(e=>`<button type="button" class="guided-kind" data-action="guided-create" data-guided-kind="${e.id}"><strong>${H(e.label)}</strong><span>${e.fields.map(([e])=>H(e)).join(` · `)}</span></button>`).join(``)}
        </div>
        <div class="modal-actions"><button type="button" data-action="close-dialog">Cancel</button></div>
      </section>
    </div>
  `}function ir(e){if(I===`none`)return``;if(I===`find`)return Gn(e);if(I===`sort`)return Kn(e);if(I===`views`)return qn();if(I===`bulkFill`)return Jn(e);if(I===`charts`)return Qn(e);if(I===`maintenance`)return $n(e);if(I===`accessibility`)return tr(e);if(I===`guided`)return rr();if(I===`rubric`)return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Rubric">
          <h2>Rubric criteria</h2>
          <p>Score each criterion on every record's form. The total adds up automatically.</p>
          <div class="rubric-def">
            ${k.map((e,t)=>`
                  <div class="rubric-def-row" data-crit-id="${e.id}" data-crit-index="${t}">
                    <input data-crit-label value="${H(e.label)}" placeholder="Criterion">
                    <label>out of <input data-crit-max type="number" min="1" value="${e.max}"></label>
                    <button type="button" class="button ghost" data-action="rubric-remove">Remove</button>
                  </div>
                `).join(``)}
          </div>
          <button type="button" class="button" data-action="rubric-add">+ Add criterion</button>
          <div class="modal-actions">
            <button type="button" class="button primary" data-action="save-rubric">Save rubric</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `;if(I===`camera`)return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Take a photo">
          <h2>Take a photo</h2>
          <video id="cameraVideo" class="camera-video" autoplay playsinline muted></video>
          <div class="modal-actions">
            <button type="button" class="button primary" data-action="camera-shoot">Capture</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `;if(I===`replace`){let t=B.slice(0,8);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Replace values">
          <h2>Replace values</h2>
          <label>Find <input data-replace-find placeholder="Text to find"></label>
          <label>Replace with <input data-replace-with placeholder="New text"></label>
          <label>Field <select data-replace-field>${e.fields.map(e=>`<option value="${e.id}">${H(e.name)}</option>`).join(``)}</select></label>
          <label class="check-row"><input type="checkbox" data-replace-case-sensitive> Case-sensitive</label>
          <label class="check-row"><input type="checkbox" data-replace-whole-word> Whole word only</label>
          <p>Replacement applies to the current found set when search is active. Preview first, then apply. The last replace can be undone from Edit.</p>
          ${B.length?`<div class="replace-preview"><strong>${B.length} change${B.length===1?``:`s`} ready</strong>${t.map(t=>{let n=e.records.find(e=>e.id===t.recordId),r=e.fields.find(e=>e.id===t.fieldId);return`<p><span>${H(n?_n(e,n):`Record`)} / ${H(r?.name??`Field`)}</span><del>${H(t.before)}</del><ins>${H(t.after)}</ins></p>`}).join(``)}</div>`:``}
          <div class="modal-actions">
            <button type="button" data-action="preview-replace">Preview</button>
            <button type="button" data-action="run-replace" ${B.length?``:`disabled`}>Apply Replace</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(I===`field`){let t=e.fields.find(e=>e.id===Ct)??e.fields[0],n=ct||t.type;return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Field settings">
          <h2>Field settings</h2>
          <label>Name <input data-field-name value="${H(t.name)}"></label>
          <label>Type <select data-field-type>${an(n)}</select></label>
          ${Wn(e,t,n)}
          <label>Description <textarea data-field-description>${H(t.description)}</textarea></label>
          <label>Choice options <input data-field-options value="${H(t.options?.join(`, `)??``)}" placeholder="Yes, No, Maybe"></label>
          <label class="check-row"><input type="checkbox" data-field-required ${t.required?`checked`:``}> Required field</label>
          <label class="check-row"><input type="checkbox" data-field-hidden ${t.hidden?`checked`:``}> Hide field</label>
          ${Un(t,n)}
          <label>Calculation formula <input data-field-formula value="${H(t.formula??``)}" placeholder='JOIN(First Name, " ", Last Name)'></label>
          ${n===`calculation`?Hn(e):``}
          <p>Try <code>FIELD(Animal)</code>, <code>JOIN(Animal, " lives in ", Habitat)</code>, <code>UPPER(Animal)</code>, <code>ADD(Score, Bonus)</code>, <code>AVERAGE(Score)</code>, or <code>LOOKUP("Book reviews", Rating)</code>.</p>
          <div class="modal-actions">
            <button type="button" data-action="save-field-settings">Save field</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(I===`layout`){let t=sn(),n=ln(e),r=new Set(t?.hiddenFieldIds??[]);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Layout designer">
          <h2>Layout designer</h2>
          <p>Arrange and choose fields for the current ${H(C)} view. Locked layouts can still be viewed, but students should not change them.</p>
          <label class="check-row"><input type="checkbox" data-layout-locked ${t?.locked?`checked`:``}> Lock this layout</label>
          <div class="layout-field-list">
            ${n.map((e,t)=>`
                  <div class="layout-field-row">
                    <label class="check-row"><input type="checkbox" data-layout-field-visible="${e.id}" ${r.has(e.id)?``:`checked`}> <strong>${H(e.name)}</strong></label>
                    <span>${H(e.type)}</span>
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
    `}if(I===`csvImport`&&V){let t=V.records.slice(0,4),n=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${H(e.name)}</option>`).join(``),r=N.map((e,t)=>`
          <div class="csv-map-row" data-map-index="${t}">
            <span class="csv-map-header">${H(e.header||`Column ${t+1}`)}</span>
            <select data-map-action aria-label="What to do with ${H(e.header)}">
              <option value="new" ${e.action===`new`?`selected`:``}>New field</option>
              <option value="existing" ${e.action===`existing`?`selected`:``}>Existing field</option>
              <option value="skip" ${e.action===`skip`?`selected`:``}>Skip</option>
            </select>
            <select data-map-type aria-label="Type for ${H(e.header)}" ${e.action===`new`?``:`hidden`}>${an(e.type)}</select>
            <select data-map-existing aria-label="Existing field for ${H(e.header)}" ${e.action===`existing`?``:`hidden`}>${n(e.fieldId)}</select>
          </div>
        `).join(``);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="CSV import">
          <h2>Import CSV</h2>
          <p>${H(Ot)} has ${V.fields.length} column${V.fields.length===1?``:`s`} and ${V.records.length} row${V.records.length===1?``:`s`}. Choose how each column maps.</p>
          <div class="csv-map">${r}</div>
          <div class="preview-table-wrap">
            <table class="preview-table">
              <thead>
                <tr>${V.fields.map(e=>`<th>${H(e.name)}</th>`).join(``)}</tr>
              </thead>
              <tbody>
                ${t.map(e=>`<tr>${V.fields.map(t=>`<td>${H(e.values[t.id])}</td>`).join(``)}</tr>`).join(``)}
              </tbody>
            </table>
          </div>
          <p><strong>Create new table</strong> builds a fresh table from the columns you keep. <strong>Append</strong> adds the rows to ${H(e.name)} using your field mapping.</p>
          <div class="csv-dup">
            <label>When appending, match on <select data-csv-key><option value="">nothing (always add)</option>${e.fields.filter(e=>![`image`,`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(e.type)).map(e=>`<option value="${e.id}" ${St===e.id?`selected`:``}>${H(e.name)}</option>`).join(``)}</select></label>
            <label>Duplicates <select data-csv-dup ${St?``:`disabled`}>
              <option value="add" ${P===`add`?`selected`:``}>always add</option>
              <option value="skip" ${P===`skip`?`selected`:``}>skip matches</option>
              <option value="update" ${P===`update`?`selected`:``}>update matches</option>
            </select></label>
          </div>
          <div class="modal-actions">
            <button type="button" class="button primary" data-action="apply-csv-new">Create new table</button>
            <button type="button" class="button" data-action="apply-csv-append">Append to ${H(e.name)}</button>
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
    `;if(I===`relationship`){let t=b.schema.tables.find(e=>e.id===Et)??e,n=b.schema.tables.find(e=>e.id===Dt)??e,r=t.fields.map(e=>`<option value="${t.id}:${e.id}">${H(e.name)}</option>`).join(``),i=n.fields.map(e=>`<option value="${n.id}:${e.id}">${H(e.name)}</option>`).join(``);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Relationships">
          <h2>Relationships</h2>
          <p>Create a simple one-to-many relationship by matching values in two fields, such as Books:Title to Reviews:Book.</p>
          ${Vn()}
          <label>Name <input data-relationship-name placeholder="Books to reviews"></label>
          <label>Parent table <select data-relationship-from-table>${b.schema.tables.map(e=>`<option value="${e.id}" ${e.id===t.id?`selected`:``}>${H(e.name)}</option>`).join(``)}</select></label>
          <label>Parent match field <select data-relationship-from-field>${r}</select></label>
          <label>Related table <select data-relationship-to-table>${b.schema.tables.map(e=>`<option value="${e.id}" ${e.id===n.id?`selected`:``}>${H(e.name)}</option>`).join(``)}</select></label>
          <label>Related match field <select data-relationship-to-field>${i}</select></label>
          ${b.schema.relationships.length?`<div class="relationship-list">${b.schema.relationships.map(e=>`<p><strong>${H(e.name)}</strong><br>${H(Oe(b,e))}</p>`).join(``)}</div>`:`<p>No relationships yet. Add a second table first for the most useful results.</p>`}
          <div class="modal-actions">
            <button type="button" data-action="create-relationship">Create relationship</button>
            <button type="button" data-action="close-dialog">Close</button>
          </div>
        </section>
      </div>
    `}if(I===`functions`){let t=e.fields.filter(e=>![`image`,`createdAt`,`updatedAt`].includes(e.type)),n=t.find(e=>[`text`,`longText`,`choice`].includes(e.type))??t[0],r=t.find(e=>[`number`,`currency`,`percent`,`rating`].includes(e.type))??n,i=n?.name??`Field`,a=r?.name??`Score`;return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Functions">
          <h2>Calculation functions</h2>
          <p>Use a calculation field when students need a result made from other fields. Formulas are simple, offline, and do not run custom code.</p>
          <div class="formula-grid">
            <div>
              <strong>Text</strong>
              <code>FIELD(${H(i)})</code>
              <code>JOIN(${H(i)}, " report")</code>
              <code>UPPER(${H(i)})</code>
              <code>TITLECASE(${H(i)})</code>
              <code>CONTAINS(${H(i)}, "a")</code>
            </div>
            <div>
              <strong>Numbers</strong>
              <code>ADD(${H(a)}, "5")</code>
              <code>SUBTRACT(${H(a)}, "1")</code>
              <code>MULTIPLY(${H(a)}, "2")</code>
              <code>DIVIDE(${H(a)}, "2")</code>
              <code>ROUND(${H(a)}, "1")</code>
            </div>
            <div>
              <strong>Whole table</strong>
              <code>SUM(${H(a)})</code>
              <code>AVERAGE(${H(a)})</code>
              <code>MIN(${H(a)})</code>
              <code>MAX(${H(a)})</code>
              <code>COUNT(${H(a)})</code>
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
    `}if(I===`quality`){let t=fn(e),n=dn(e),r=t.reduce((e,t)=>e+t.missing,0),i=t.reduce((e,t)=>e+t.duplicates,0),a=Qe(e).length;return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Data quality check">
          <h2>Data quality check</h2>
          <p>Use this before printing a report or exporting CSV. Click a count to highlight the records that need attention.</p>
          <div class="quality-summary">
            <div><strong>${r}</strong><span>missing values</span></div>
            <div><strong>${i}</strong><span>duplicate values</span></div>
            <div><strong>${n}</strong><span>formula errors</span></div>
            <div><button type="button" data-action="highlight-invalid" ${a?``:`disabled`}><strong>${a}</strong><span>rule problems</span></button></div>
          </div>
          <div class="quality-table" role="table" aria-label="Field quality">
            <div class="quality-row quality-head" role="row">
              <span>Field</span><span>Missing</span><span>Duplicates</span>
            </div>
            ${t.length?t.map(({field:e,missing:t,duplicates:n})=>`
                        <div class="quality-row" role="row">
                          <span><strong>${H(e.name)}</strong><small>${H(e.type)}</small></span>
                          <button type="button" data-quality-kind="missing" data-quality-field-id="${e.id}" ${t?``:`disabled`}>${t}</button>
                          <button type="button" data-quality-kind="duplicates" data-quality-field-id="${e.id}" ${n?``:`disabled`}>${n}</button>
                        </div>
                      `).join(``):`<p class="empty-panel">No editable data fields are available yet.</p>`}
          </div>
          <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
        </section>
      </div>
    `}return I===`teacherNotes`?`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Teacher notes">
          <h2>Teacher notes</h2>
          <p>Add one note per line. These notes are saved in the .listsplat.json file and included in the project packet.</p>
          <label>Notes <textarea data-teacher-notes rows="8" placeholder="Add setup directions, reflection questions, or grading reminders.">${H(b.teacher.notes.join(`
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
  `}function $(){let e=W();It(e),Nt();let t=b.teacher.studentView;if(y.innerHTML=`
    <header class="app-header">
      <a class="brand" href="../../pages/splatworks.html" aria-label="SplatWorks home">
        <img class="brand-icon" src="listsplat_icon.png" alt="">
        <span>
          <strong>ListSplat<sup>TM</sup></strong>
          <small>SplatWorks<sup>TM</sup> Database Studio</small>
        </span>
      </a>
      <div class="quick-actions">
        <button type="button" class="button" data-action="undo-change"${R.length?``:` disabled`} title="Undo (Ctrl+Z)" aria-label="Undo">↶ ${H(U(`Undo`))}</button>
        <button type="button" class="button" data-action="redo-change"${z.length?``:` disabled`} title="Redo (Ctrl+Y)" aria-label="Redo">↷ ${H(U(`Redo`))}</button>
        <button type="button" class="button primary" data-action="new">${H(U(`New`))}</button>
        <button type="button" class="button primary" data-action="save-json">${H(U(`Save JSON`))}</button>
        <button type="button" class="button primary" data-action="open-json">${H(U(`Open JSON`))}</button>
        <button type="button" class="button primary" data-action="export-csv">${H(U(`Export CSV`))}</button>
        <select id="languageSwitcher" class="lang-switcher" aria-label="Language">${Mt(kt)}</select>
      </div>
    </header>
    <main class="listsplat-app">
      <nav class="menu-bar" aria-label="Application menu">
        ${X(`File`,[[`new`,`New database`],[`save-json`,`Save .listsplat.json`],[`open-json`,`Open .listsplat.json`],[`import-csv`,`Import CSV or TSV`],[`export-csv`,`Export table CSV`],[`export-found-csv`,`Export shown records CSV`],[`export-markdown`,`Export Markdown table`],[`export-report`,`Export report HTML`],[`print`,`Print`]])}
        ${X(`Edit`,[[`undo-change`,`Undo last change`],[`redo-change`,`Redo last change`],[`add-record`,`Add record`],[`add-field`,`Add field`],[`find`,`Find records`],[`replace`,`Replace values`]])}
        ${X(`Data`,[[`add-table`,`New table`],[`rename-table`,`Rename this table`],[`duplicate-table`,`Duplicate this table`],[`move-table-left`,`Move table left`],[`move-table-right`,`Move table right`],[`delete-table`,`Delete this table`],[`sort`,`Sort records`],[`missing`,`Find missing values`],[`duplicates`,`Find duplicates`],[`toggle-archived`,lt?`Show active records`:`Show archived records (${Pt(e)})`],[`structure-copy`,`Save structure-only copy`],[`clear-find`,`Show all records`]])}
        ${X(`Layout`,[[`layout-designer`,`Design current layout`],[`table-view`,`Table view`],[`form-view`,`Form view`],[`cards-view`,`Card view`],[`gallery-view`,`Gallery view`],[`labels-view`,`Label view`],[`report-view`,`Report view`]])}
        ${X(`Tools`,[[`functions`,`Functions`],[`relationships`,`Relationships`],[`charts`,`Charts`],[`quality`,`Data quality check`],[`maintenance`,`Database maintenance`],[`accessibility`,`Accessibility check`]])}
        ${X(`View`,[[`student-view`,t?`Exit student view`:`Student view`],[`teacher-notes`,`Teacher notes`]])}
        <span class="menu-spacer"></span>
        ${t?``:X(`Teacher`,[[`guided`,`Guided database builder`],[`templates`,`Template Library`],[`project-ideas`,`Project Ideas`],[`share-html`,`Publish read-only page`],[`lock-layout`,`Lock Layout`],[`project-packet`,`Print Project Packet`]])}
        ${X(`Help`,[[`help-start`,`Start a database`],[`help-csv`,`Import and export CSV`],[`help-layouts`,`Forms and reports`],[`help-privacy`,`Privacy and saving`]])}
      </nav>
      <section class="toolbar" aria-label="Database toolbar">
        <label>${H(U(`Title`))} <input data-project-title value="${H(b.metadata.title)}"></label>
        <label>${H(U(`Search`))} <input data-search value="${H(w)}" placeholder="${H(U(`Find records`))}"></label>
        <label>${H(U(`In`))} <select data-search-field><option value="all">${H(U(`All fields`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${T===e.id?`selected`:``}>${H(e.name)}</option>`).join(``)}</select></label>
        <label>${H(U(`Sort`))} <select data-sort-field><option value="">${H(U(`Choose field`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${E[0]?.fieldId===e.id?`selected`:``}>${H(e.name)}</option>`).join(``)}</select></label>
        <button type="button" data-action="toggle-sort" title="${H(U(`Sort direction`))}">${E[0]?.direction===`desc`?`Z-A`:`A-Z`}</button>
        <button type="button" data-action="sort-dialog" title="${H(U(`Sort by more than one field`))}">${H(U(`Sort…`))}</button>
        <button type="button" data-action="find" title="${H(U(`Advanced find with conditions`))}">${H(U(`Find…`))}</button>
        <button type="button" data-action="views" title="${H(U(`Save and reuse this view`))}">${H(U(`Views`))}</button>
        <label>${H(U(`New field`))} <input data-new-field placeholder="${H(U(`Field name`))}"></label>
        <label>${H(U(`Type`))} <select data-new-field-type>${an()}</select></label>
        <button type="button" data-action="add-field">${H(U(`Add field`))}</button>
        <button type="button" data-action="add-record">${H(U(`Add record`))}</button>
      </section>
      <div class="workspace${t?` student-workspace`:``}">
        ${Ln(e)}
        ${t?``:Bn(e)}
      </div>
      <footer class="status-bar">
        <span>${H(e.name)}: ${G(e).length} shown of ${e.records.length} records, ${e.fields.length} fields</span>
        ${t?`<span>Student view hides teacher notes and teacher tools.</span>`:``}
        <span>${H(L)}</span>
        <span>${ot}</span>
      </footer>
    </main>
    <input class="hidden-file" type="file" accept=".listsplat.json,application/json" data-open-json>
    <input class="hidden-file" type="file" accept=".csv,text/csv" data-import-csv>
    ${ir(e)}
  `,wt=``,Tt){let e=Tt;Tt=null,Cr(e.recordId,e.fieldId)}Dr()}function ar(e){return e instanceof HTMLInputElement&&e.type===`checkbox`?e.checked:e instanceof HTMLInputElement&&e.type===`number`?e.value===``?``:Number(e.value):e.value}function or(e){let t=e.dataset.recordId,n=e.dataset.fieldId;!t||!n||(b=p(b,f(W(),t,n,ar(e))),m(b),ot=`Saved locally`)}function sr(e){return new Promise((t,n)=>{let r=new FileReader;r.onerror=()=>n(r.error),r.onload=()=>{let n=String(r.result??``);if(e.size<=35e4){t(n);return}let i=new Image;i.onerror=()=>t(n),i.onload=()=>{let e=1280,r=Math.max(i.width,i.height),a=r>e?e/r:1,o=Math.max(1,Math.round(i.width*a)),s=Math.max(1,Math.round(i.height*a)),c=document.createElement(`canvas`);c.width=o,c.height=s;let l=c.getContext(`2d`);if(!l){t(n);return}l.drawImage(i,0,0,o,s);let u=c.toDataURL(`image/jpeg`,.82);t(u.length<n.length?u:n)},i.src=n},r.readAsDataURL(e)})}function cr(e){if(!e)return null;try{let t=JSON.parse(e);if(t&&t.url)return{name:t.name||`file`,url:t.url}}catch{}return e.startsWith(`data:`)?{name:`file`,url:e}:null}function lr(e,t,n){let r=new FileReader;r.onload=()=>{J(`add file`);let i=JSON.stringify({name:n.name,url:String(r.result??``)});b=p(b,f(W(),e,t,i)),m(b);let a=Math.round(i.length/1024);L=a>900?`File attached (about ${a} KB). Large files can slow autosave.`:`File attached.`,$()},r.onerror=()=>{L=`Could not read that file.`,$()},r.readAsDataURL(n)}async function ur(e,t){if(M&&M.state===`recording`){M.stop();return}if(!navigator.mediaDevices?.getUserMedia||window.MediaRecorder===void 0){L=`Audio recording is not available in this browser.`,$();return}try{let n=await navigator.mediaDevices.getUserMedia({audio:!0}),r=[],i=new MediaRecorder(n);M=i,i.ondataavailable=e=>{e.data.size&&r.push(e.data)},i.onstop=()=>{n.getTracks().forEach(e=>e.stop()),M=null;let i=new FileReader;i.onload=()=>{J(`record audio`),b=p(b,f(W(),e,t,String(i.result??``))),m(b),L=`Recording saved.`,$()},i.readAsDataURL(new Blob(r,{type:`audio/webm`}))},i.start(),L=`Recording… press the button again to stop (auto-stops at 60s).`,$(),window.setTimeout(()=>{M&&M.state===`recording`&&M.stop()},6e4)}catch{L=`Microphone permission was blocked.`,$()}}async function dr(){if(!navigator.mediaDevices?.getUserMedia){L=`Camera is not available in this browser.`,I=`none`,$();return}try{xt=await navigator.mediaDevices.getUserMedia({video:{facingMode:`environment`}});let e=y.querySelector(`#cameraVideo`);e&&(e.srcObject=xt,await e.play().catch(()=>void 0))}catch{fr(),L=`Camera permission was blocked.`,I=`none`,$()}}function fr(){xt?.getTracks().forEach(e=>e.stop()),xt=null}function pr(){let e=y.querySelector(`#cameraVideo`);if(!e||!bt||!e.videoWidth)return;let t=document.createElement(`canvas`),n=Math.min(1,1280/Math.max(e.videoWidth,e.videoHeight));t.width=Math.round(e.videoWidth*n),t.height=Math.round(e.videoHeight*n);let r=t.getContext(`2d`);if(!r)return;r.drawImage(e,0,0,t.width,t.height);let i=t.toDataURL(`image/jpeg`,.85),{recordId:a,fieldId:o}=bt;J(`camera photo`),b=p(b,f(W(),a,o,i)),m(b),fr(),bt=null,I=`none`,L=`Photo captured.`,$()}function mr(e,t,n,r){if(!n.type.startsWith(`image/`)){L=`That clipboard item is not an image.`,$();return}sr(n).then(n=>{J(r),b=p(b,f(W(),e,t,n)),m(b);let i=Math.round(n.length/1024);L=i>900?`Image saved (about ${i} KB). Very large pictures can slow autosave — a smaller image is fine for most projects.`:`Image saved in this field.`,$()}).catch(()=>{L=`Could not read that image.`,$()})}function hr(){let e=W(),t=e.fields.find(e=>e.id===Ct);if(!t)return;let n=y.querySelector(`[data-field-name]`)?.value??t.name,r=y.querySelector(`[data-field-type]`)?.value??t.type,i=y.querySelector(`[data-field-description]`)?.value??``,a=y.querySelector(`[data-field-required]`)?.checked??!1,o=y.querySelector(`[data-field-hidden]`)?.checked??!1,s=y.querySelector(`[data-field-formula]`)?.value??``,c=(y.querySelector(`[data-field-options]`)?.value??``).split(`,`).map(e=>e.trim()).filter(Boolean),l=y.querySelector(`[data-field-unique]`)?.checked??!1,u=y.querySelector(`[data-field-min]`)?.value??``,te=y.querySelector(`[data-field-max]`)?.value??``,ne=u.trim()===``?void 0:Number(u),f=te.trim()===``?void 0:Number(te),p=y.querySelector(`[data-field-pattern]`)?.value??`none`,re=y.querySelector(`[data-field-custom-pattern]`)?.value??``,ie=y.querySelector(`[data-field-default]`)?.value??``,ae=y.querySelector(`[data-field-readonly]`)?.checked??!1,oe=y.querySelector(`[data-field-maxlength]`)?.value??``,se=oe.trim()===``?void 0:Number(oe),ce=y.querySelector(`[data-field-message]`)?.value??``,le=r!==t.type,ue=ee(e,t.id,{name:n,type:r,description:i,required:a,hidden:o,formula:s,options:c,unique:l,min:ne,max:f,pattern:p,customPattern:re,defaultValue:ie,readonly:ae,maxLength:se,customMessage:ce});le&&![`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(r)&&(ue=d(ue,t.id,r,c)),Y(ue),I=`none`,L=le?`Updated ${n} and converted values to ${r}.`:`Updated ${n}.`,$()}function gr(){let e=y.querySelector(`[data-replace-find]`)?.value??``,t=y.querySelector(`[data-replace-with]`)?.value??``,n=y.querySelector(`[data-replace-field]`)?.value??W().fields[0]?.id,r=y.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=y.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=w?G(W()).map(e=>e.id):void 0;J(`replace`);let o=qe(W(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i});I=`none`,B=[],L=`Replaced ${o.count} value${o.count===1?``:`s`}.`,Y(o.table)}function _r(){let e=y.querySelector(`[data-replace-find]`)?.value??``,t=y.querySelector(`[data-replace-with]`)?.value??``,n=y.querySelector(`[data-replace-field]`)?.value??W().fields[0]?.id,r=y.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=y.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=w?G(W()).map(e=>e.id):void 0;B=Ke(W(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i}),L=`Preview found ${B.length} change${B.length===1?``:`s`}.`,$()}function vr(){let e=(y.querySelector(`[data-teacher-notes]`)?.value??``).split(`
`).map(e=>e.trim()).filter(Boolean);J(`teacher notes`),I=`none`,L=`Saved ${e.length} teacher note${e.length===1?``:`s`}.`,q({...b,updatedAt:new Date().toISOString(),teacher:{...b.teacher,notes:e}})}function yr(e){let t=y.querySelector(e)?.value;if(!t)return null;let[n,r]=t.split(`:`);return n&&r?{tableId:n,fieldId:r}:null}function br(){let e=y.querySelector(`[data-relationship-from-table]`)?.value??``,t=y.querySelector(`[data-relationship-to-table]`)?.value??``,n=yr(`[data-relationship-from-field]`),r=yr(`[data-relationship-to-field]`),i=y.querySelector(`[data-relationship-name]`)?.value??``;if(!e||!t||!n||!r){L=`Choose both tables and both match fields.`,$();return}if(n.tableId!==e||r.tableId!==t){L=`Match fields must belong to the tables you chose.`,$();return}J(`relationship create`);let a=Te(i,e,n.fieldId,t,r.fieldId);L=`Created relationship: ${a.name}.`,q(Ee(b,a))}function xr(){Et=y.querySelector(`[data-relationship-from-table]`)?.value??Et,Dt=y.querySelector(`[data-relationship-to-table]`)?.value??Dt,$()}function Sr(e){return window.CSS&&typeof CSS.escape==`function`?CSS.escape(e):e.replace(/["\\]/g,`\\$&`)}function Cr(e,t){let n=y.querySelector(`.data-grid`);if(!n)return!1;let r=n.querySelector(`tr[data-record-row="${Sr(e)}"]`);if(!r)return!1;let i=r.querySelector(`.cell-input[data-field-id="${Sr(t)}"], .cell-checkbox[data-field-id="${Sr(t)}"]`);return i||=r.querySelector(`.cell-input, .cell-checkbox`),i?(i.focus(),i instanceof HTMLInputElement&&i.type!==`checkbox`&&i.select(),!0):!1}function wr(e){J(`add record`);let t=l(W()),n=t.records.at(-1);n&&(S=n.id,Tt={recordId:n.id,fieldId:e}),Y(t)}function Tr(e,t,n,r){let i=Array.from(y.querySelectorAll(`.data-grid tbody tr[data-record-row]`)),a=i.findIndex(t=>t.dataset.recordRow===e),o=Q(W()).map(e=>e.id),s=o.indexOf(t);if(a<0||s<0)return;let c=a+n,l=s+r;if(r>0&&l>=o.length?(l=0,c=a+1):r<0&&l<0&&(l=o.length-1,c=a-1),c>=i.length){wr(o[l]??o[0]);return}c<0||Cr(i[c].dataset.recordRow??e,o[l]??t)}function Er(){if(!j)return null;let e=G(W()).map(e=>e.id),t=Q(W()).map(e=>e.id),n=e.indexOf(j.anchor.r),r=e.indexOf(j.focus.r),i=t.indexOf(j.anchor.f),a=t.indexOf(j.focus.f);return n<0||r<0||i<0||a<0?null:{rows:e,cols:t,r1:Math.min(n,r),r2:Math.max(n,r),c1:Math.min(i,a),c2:Math.max(i,a)}}function Dr(){y.querySelectorAll(`.data-grid td.cell-range`).forEach(e=>e.classList.remove(`cell-range`));let e=Er();if(e&&!((e.r2-e.r1+1)*(e.c2-e.c1+1)<=1))for(let t=e.r1;t<=e.r2;t+=1)for(let n=e.c1;n<=e.c2;n+=1)y.querySelector(`.data-grid [data-record-id="${Sr(e.rows[t])}"][data-field-id="${Sr(e.cols[n])}"]`)?.closest(`td`)?.classList.add(`cell-range`)}function Or(e){if(!j)return;let t=G(W()).map(e=>e.id),n=Q(W()).map(e=>e.id),r=t.indexOf(j.focus.r),i=n.indexOf(j.focus.f);r<0||i<0||(e===`ArrowUp`?r=Math.max(0,r-1):e===`ArrowDown`?r=Math.min(t.length-1,r+1):e===`ArrowLeft`?i=Math.max(0,i-1):e===`ArrowRight`&&(i=Math.min(n.length-1,i+1)),j={anchor:j.anchor,focus:{r:t[r],f:n[i]}},Dr())}function kr(){let e=Er();if(!e||e.r2-e.r1===0&&e.c2-e.c1===0)return!1;let t=W(),n=new Map(t.records.map(e=>[e.id,e])),r=[];for(let i=e.r1;i<=e.r2;i+=1){let a=n.get(e.rows[i]);if(!a)continue;let o=[];for(let n=e.c1;n<=e.c2;n+=1)o.push(String(Z(t,a,e.cols[n])??``).replace(/\t/g,` `).replace(/\n/g,` `));r.push(o.join(`	`))}let i=r.join(`
`);navigator.clipboard?.writeText(i).catch(()=>void 0);let a=(e.r2-e.r1+1)*(e.c2-e.c1+1),o=y.querySelector(`.status-bar span:nth-last-child(2)`);return o&&(o.textContent=`Copied ${a} cells.`),!0}function Ar(e,t,n){let i=W(),a=G(i),o=Q(i).map(e=>e.id),s=a.findIndex(e=>e.id===t),c=o.indexOf(n);if(s<0||c<0)return;let l=e.replace(/\r/g,``).replace(/\n$/,``).split(`
`).map(e=>e.split(`	`));J(`paste`);let d=new Map(i.records.map(e=>[e.id,e])),ee=i.records.map(e=>e.id),te=0;l.forEach((e,t)=>{let n;if(s+t<a.length)n=a[s+t].id;else{let e=r(i.fields);d.set(e.id,e),ee.push(e.id),n=e.id,te+=1}let l=d.get(n);if(!l)return;let ne={...l.values};e.forEach((e,t)=>{let n=o[c+t],r=n?i.fields.find(e=>e.id===n):void 0;!r||[`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(r.type)||(ne[r.id]=u(e,r.type,r.options).value)}),d.set(n,{...l,updatedAt:new Date().toISOString(),values:ne})}),j=null,L=`Pasted ${l.length} row${l.length===1?``:`s`}${te?` (${te} new)`:``}.`,Y({...i,records:ee.map(e=>d.get(e)).filter(Boolean)})}var jr=[{value:`contains`,label:`contains`,needsValue:!0,needsSecond:!1},{value:`equals`,label:`is exactly`,needsValue:!0,needsSecond:!1},{value:`startsWith`,label:`starts with`,needsValue:!0,needsSecond:!1},{value:`endsWith`,label:`ends with`,needsValue:!0,needsSecond:!1},{value:`greaterThan`,label:`greater than`,needsValue:!0,needsSecond:!1},{value:`lessThan`,label:`less than`,needsValue:!0,needsSecond:!1},{value:`between`,label:`between`,needsValue:!0,needsSecond:!0},{value:`isEmpty`,label:`is empty`,needsValue:!1,needsSecond:!1},{value:`isNotEmpty`,label:`is not empty`,needsValue:!1,needsSecond:!1}];function Mr(e){return W().fields.find(t=>t.id===e)?.name??`field`}function Nr(e){return jr.find(t=>t.value===e)?.label??e}function Pr(){let e=y.querySelector(`[data-find-match]`)?.value??`all`,t=[];y.querySelectorAll(`.find-rule`).forEach(e=>{let n=e.querySelector(`[data-find-field]`)?.value??``,r=e.querySelector(`[data-find-op]`)?.value??`contains`,i=e.querySelector(`[data-find-value]`)?.value??``,a=e.querySelector(`[data-find-value2]`)?.value??``;n&&t.push({fieldId:n,operator:r,value:i,value2:a})}),O={match:e,rules:t}}function Fr(){Pr(),D=O.rules.length?O:null,F=new Set,I=`none`;let e=G(W()).length;L=D?`Find is on: ${e} record${e===1?``:`s`} match.`:`Find cleared.`,$()}function Ir(){let e=[];y.querySelectorAll(`.sort-level`).forEach(t=>{let n=t.querySelector(`[data-sort-level-field]`)?.value??``,r=t.querySelector(`[data-sort-level-dir]`)?.value??`asc`;n&&e.push({fieldId:n,direction:r})}),st=e}function Lr(){Ir(),E=st,I=`none`,L=E.length?`Sorting by ${E.map(e=>Mr(e.fieldId)).join(`, `)}.`:`Sort cleared.`,$()}function Rr(){return b.views??[]}function zr(){let e=y.querySelector(`[data-view-name]`)?.value.trim()||`View ${Rr().length+1}`,n={id:t(`view`),name:e,tableId:x,mode:C,search:w,searchFieldId:T,find:D,sortKeys:E};J(`save view`),L=`Saved view: ${e}.`,q({...b,updatedAt:new Date().toISOString(),views:[...Rr(),n]})}function Br(e){let t=Rr().find(t=>t.id===e);t&&(b.schema.tables.some(e=>e.id===t.tableId)&&(x=t.tableId,It(W())),C=t.mode,w=t.search,T=t.searchFieldId,D=t.find,E=t.sortKeys,F=new Set,I=`none`,L=`Opened view: ${t.name}.`,$())}function Vr(e){J(`delete view`),L=`Deleted a saved view.`,q({...b,updatedAt:new Date().toISOString(),views:Rr().filter(t=>t.id!==e)})}function Hr(e){let t=new Set(e.records.map(e=>e.id));return[...A].filter(e=>t.has(e))}function Ur(){let e=W(),t=new Set(Hr(e));if(t.size===0)return;let n=e.records.filter(e=>!t.has(e.id));if(n.length===0){L=`Keep at least one record. Some rows were not deleted.`,$();return}window.confirm(`Delete ${t.size} selected record${t.size===1?``:`s`}? You can undo right after.`)&&(J(`bulk delete`),A=new Set,L=`Deleted ${e.records.length-n.length} records.`,Y({...e,records:n}))}function Wr(){let e=W(),t=Hr(e);if(t.length===0)return;J(`bulk duplicate`);let n=t.reduce((e,t)=>te(e,t),e);A=new Set,L=`Duplicated ${t.length} record${t.length===1?``:`s`}.`,Y(n)}function Gr(){let e=W(),t=new Set(Hr(e)),n=y.querySelector(`[data-bulk-field]`)?.value??``,r=y.querySelector(`[data-bulk-value]`)?.value??``,i=e.fields.find(e=>e.id===n);if(!i||t.size===0){I=`none`,$();return}let a=u(r,i.type,i.options).value;J(`bulk fill`);let o=e.records.map(e=>t.has(e.id)?{...e,updatedAt:new Date().toISOString(),values:{...e.values,[n]:a}}:e);I=`none`,L=`Filled ${i.name} for ${t.size} record${t.size===1?``:`s`}.`,Y({...e,records:o})}function Kr(e){let t=e.filter(e=>e.trim()!==``);return t.length===0?`text`:t.every(e=>!Number.isNaN(Number(e.replace(/[$,%\s]/g,``))))?`number`:t.every(e=>!Number.isNaN(new Date(e).getTime())&&/\d/.test(e))?`date`:t.every(e=>/^(yes|no|true|false)$/i.test(e.trim()))?`checkbox`:`text`}function qr(){y.querySelectorAll(`.csv-map-row`).forEach((e,t)=>{N[t]&&(N[t].action=e.querySelector(`[data-map-action]`)?.value??`new`,N[t].type=e.querySelector(`[data-map-type]`)?.value??`text`,N[t].fieldId=e.querySelector(`[data-map-existing]`)?.value??``)})}y.addEventListener(`click`,e=>{let n=e.target,i=n.closest(`[data-action]`)?.dataset.action,s=n.closest(`[data-table-id]`)?.dataset.tableId,c=n.closest(`[data-template-id]`)?.dataset.templateId,u=n.closest(`[data-view-mode]`)?.dataset.viewMode,d=n.closest(`[data-select-record]`)?.dataset.selectRecord,ee=n.closest(`[data-field-settings]`)?.dataset.fieldSettings,f=n.closest(`[data-record-action-id]`)?.dataset.recordActionId,le=n.closest(`[data-quality-field-id]`);if(s){x=s,K(),E=[],A=new Set,j=null,It(W()),$();return}if(c){rn(c);return}if(u){C=u,$();return}if(d){S=d,C===`table`&&$();return}if(ee){Ct=ee,ct=``,I=`field`,$();return}let ue=n.closest(`[data-formula-insert]`)?.dataset.formulaInsert;if(ue){let e=y.querySelector(`[data-field-formula]`);if(e){let t=e.selectionStart??e.value.length;e.value=e.value.slice(0,t)+ue+e.value.slice(e.selectionEnd??t),e.focus()}return}if(le){let e=le.dataset.qualityFieldId,t=le.dataset.qualityKind;if(e&&t){let n=t===`duplicates`?We(W(),e):Ge(W(),e);F=new Set(n.map(e=>e.id));let r=W().fields.find(t=>t.id===e);L=`Highlighted ${n.length} ${t===`duplicates`?`duplicate`:`missing`} record${n.length===1?``:`s`} in ${r?.name??`this field`}.`,I=`none`,$();return}}if(i)if(Wt(),i===`new`){if(!window.confirm(`Start a new database? Your current one is replaced here — export it first if you want to keep a copy. You can also undo right after.`))return;J(`new database`);let e=a(`Untitled Database`);x=e.schema.tables[0].id,S=e.schema.tables[0].records[0]?.id??``,F=new Set,q(e)}else if(i===`save-json`)Kt();else if(i===`open-json`)y.querySelector(`[data-open-json]`)?.click();else if(i===`import-csv`)y.querySelector(`[data-import-csv]`)?.click();else if(i===`export-csv`)qt();else if(i===`export-found-csv`)Jt();else if(i===`export-markdown`)Zt();else if(i===`export-report`)Qt();else if(i===`project-packet`)$t();else if(i===`print`)window.print();else if(i===`add-record`)J(`add record`),Y(l(W()));else if(i===`add-field`){let e=y.querySelector(`[data-new-field]`),t=y.querySelector(`[data-new-field-type]`)?.value;J(`add field`),Y(o(W(),e?.value||`New Field`,t??`text`))}else if(i===`add-table`){let e=window.prompt(`New table name?`,`New Table`)??``;J(`add table`);let t=re(b,e);x=t.schema.tables.at(-1)?.id??x,S=W().records[0]?.id??``,q(t)}else if(i===`duplicate-record`&&f)J(`duplicate record`),Y(te(W(),f));else if(i===`delete-record`&&f){if(W().records.length<=1){L=`Keep at least one record. Add another before deleting this one.`,$();return}if(!window.confirm(`Delete this record? You can undo right after with Ctrl+Z.`))return;J(`delete record`),Y(ne(W(),f))}else if(i===`toggle-sort`){if(E.length)E=[{...E[0],direction:E[0].direction===`asc`?`desc`:`asc`},...E.slice(1)];else{let e=W().fields[0];e&&(E=[{fieldId:e.id,direction:`asc`}])}$()}else if(i===`sort`||i===`sort-dialog`)st=E.length?E.map(e=>({...e})):[{fieldId:W().fields[0]?.id??``,direction:`asc`}],I=`sort`,$();else if(i===`find`)O=D?{match:D.match,rules:D.rules.map(e=>({...e}))}:{match:`all`,rules:[{fieldId:W().fields[0]?.id??``,operator:`contains`,value:``}]},I=`find`,$();else if(i===`views`)I=`views`,$();else if(i===`sort-add-level`)Ir(),st.push({fieldId:W().fields[0]?.id??``,direction:`asc`}),$();else if(i===`sort-remove-level`){Ir();let e=Number(n.closest(`[data-level-index]`)?.dataset.levelIndex??`-1`);e>=0&&st.splice(e,1),$()}else if(i===`sort-toggle`){let e=n.closest(`[data-sort-toggle]`)?.dataset.sortToggle;if(e){let t=E.find(t=>t.fieldId===e);E=[{fieldId:e,direction:t&&t.direction===`asc`?`desc`:`asc`}],$()}}else if(i===`apply-sort`)Lr();else if(i===`clear-sort`)Ir(),st=[],$();else if(i===`find-add-rule`)Pr(),O.rules.push({fieldId:W().fields[0]?.id??``,operator:`contains`,value:``}),$();else if(i===`find-remove-rule`){Pr();let e=Number(n.closest(`[data-rule-index]`)?.dataset.ruleIndex??`-1`);e>=0&&O.rules.splice(e,1),$()}else if(i===`apply-find`)Fr();else if(i===`save-view`)zr();else if(i===`apply-view`){let e=n.closest(`[data-view-id]`)?.dataset.viewId;e&&Br(e)}else if(i===`delete-view`){let e=n.closest(`[data-view-id]`)?.dataset.viewId;e&&Vr(e)}else if(i===`bulk-delete`)Ur();else if(i===`bulk-duplicate`)Wr();else if(i===`bulk-fill`)Hr(W()).length&&(I=`bulkFill`,$());else if(i===`apply-bulk-fill`)Gr();else if(i===`bulk-clear`)A=new Set,$();else if(i===`expand-record`&&f)S=f,C=`form`,$();else if(i===`camera-capture`){let e=n.closest(`[data-record-id]`)?.dataset.recordId,t=n.closest(`[data-field-id]`)?.dataset.fieldId;e&&t&&(bt={recordId:e,fieldId:t},I=`camera`,$(),dr())}else if(i===`camera-shoot`)pr();else if(i===`record-audio`){let e=n.closest(`[data-record-id]`)?.dataset.recordId,t=n.closest(`[data-field-id]`)?.dataset.fieldId;e&&t&&ur(e,t)}else if(i===`add-comment`){let e=y.querySelector(`[data-comment-text]`)?.value.trim()??``,n=y.querySelector(`[data-comment-teacher]`)?.checked??!1;e&&Ht(r=>({...r,comments:[...r.comments??[],{id:t(`comment`),author:Sn(),text:e,at:new Date().toISOString(),teacherOnly:n}]}),`add comment`)}else if(i===`delete-comment`){let e=n.closest(`[data-comment-id]`)?.dataset.commentId;e&&Ht(t=>({...t,comments:(t.comments??[]).filter(t=>t.id!==e)}),`delete comment`)}else if(i===`save-version`)Ht(e=>({...e,history:[...e.history??[],{at:new Date().toISOString(),values:{...e.values}}].slice(-20)}),`save version`),L=`Saved a version snapshot.`;else if(i===`restore-version`){let e=Number(n.closest(`[data-version-index]`)?.dataset.versionIndex??`-1`);Ht(t=>{let n=(t.history??[])[e];return n?{...t,updatedAt:new Date().toISOString(),values:{...t.values,...n.values}}:t},`restore version`),L=`Restored an earlier version.`}else if(i===`edit-rubric`)k=(b.rubricCriteria??[]).map(e=>({...e})),k.length||(k=[{id:t(`crit`),label:`Ideas`,max:4}]),I=`rubric`,$();else if(i===`rubric-add`)Ut(),k.push({id:t(`crit`),label:`New criterion`,max:4}),$();else if(i===`rubric-remove`){Ut();let e=Number(n.closest(`[data-crit-index]`)?.dataset.critIndex??`-1`);e>=0&&k.splice(e,1),$()}else if(i===`save-rubric`)Ut(),J(`rubric`),I=`none`,L=`Saved the rubric.`,q({...b,updatedAt:new Date().toISOString(),rubricCriteria:k});else if(i===`open-related`){let e=n.closest(`[data-rel-table]`)?.dataset.relTable,t=n.closest(`[data-rel-record]`)?.dataset.relRecord;e&&t&&(x=e,S=t,K(),E=[],C=`form`,$())}else if(i===`add-related`){let e=n.closest(`[data-rel-id]`)?.dataset.relId,t=b.schema.relationships.find(t=>t.id===e),i=W().records.find(e=>e.id===S),a=t?b.schema.tables.find(e=>e.id===t.toTableId):void 0;if(t&&i&&a){J(`add related record`);let e=i.values[t.fromFieldId]??``,n=r(a.fields,{[t.toFieldId]:e}),o=p(b,{...a,records:[...a.records,n]});x=a.id,S=n.id,K(),E=[],C=`form`,L=`Added a ${a.name} record linked to ${_n(W(),i)}.`,q(o)}}else if(i===`cal-prev`)In(-1),$();else if(i===`cal-next`)In(1),$();else if(i===`cal-today`)pt=``,$();else if(i===`bulk-archive`||i===`bulk-restore`){let e=i===`bulk-archive`,t=new Set(Hr(W()));if(t.size){J(e?`archive records`:`restore records`);let n=W();A=new Set,L=`${e?`Archived`:`Restored`} ${t.size} record${t.size===1?``:`s`}.`,Y({...n,records:n.records.map(n=>t.has(n.id)?{...n,archived:e}:n)})}}else if(i===`toggle-archived`)lt=!lt,A=new Set,L=lt?`Showing archived records.`:`Showing active records.`,$();else if(i===`rename-table`){let e=W(),t=window.prompt(`Rename table`,e.name);t&&t.trim()&&(J(`rename table`),q(ie(b,e.id,t)))}else if(i===`duplicate-table`){J(`duplicate table`);let e=ae(b,x);x=e.newTableId,K(),E=[],A=new Set,L=`Duplicated the table.`,q(e.project)}else if(i===`move-table-left`||i===`move-table-right`)J(`move table`),q(oe(b,x,i===`move-table-left`?-1:1));else if(i===`delete-table`){if(b.schema.tables.length<=1){L=`A database needs at least one table.`,$();return}if(window.confirm(`Delete the table "${W().name}" and all its records? You can undo right after.`)){J(`delete table`);let e=se(b,x);x=e.schema.tables[0].id,K(),E=[],A=new Set,L=`Deleted the table.`,q(e)}}else if(i===`structure-copy`)Kt(ce(b)),L=`Saved a structure-only copy (no records).`,$();else if(i===`highlight-invalid`){let e=Qe(W());F=new Set(e.map(e=>e.record.id)),I=`none`,L=`Highlighted ${F.size} record${F.size===1?``:`s`} with rule problems.`,$()}else if(i===`duplicates`){let e=T===`all`?W().fields[0]?.id:T;F=new Set(We(W(),e).map(e=>e.id)),L=`Found ${F.size} duplicate record${F.size===1?``:`s`}.`,$()}else if(i===`missing`){let e=T===`all`?W().fields[0]?.id:T;F=new Set(Ge(W(),e).map(e=>e.id)),L=`Found ${F.size} record${F.size===1?``:`s`} with missing values.`,$()}else if(i===`clear-find`)K(),L=`Showing all records.`,$();else if(i===`replace`)B=[],I=`replace`,$();else if(i===`preview-replace`)_r();else if(i===`run-replace`)gr();else if(i===`save-teacher-notes`)vr();else if(i===`apply-csv-new`)nn(`new`);else if(i===`apply-csv-append`)nn(`append`);else if(i===`save-field-settings`)J(`field settings`),hr();else if(i===`layout-designer`||i===`lock-layout`)I=`layout`,$();else if(i===`layout-field-up`||i===`layout-field-down`){let e=n.closest(`[data-layout-field-id]`)?.dataset.layoutFieldId,t=sn();if(e&&t){let t=ln(W()).map(e=>e.id),n=t.indexOf(e),r=i===`layout-field-up`?n-1:n+1;n>=0&&r>=0&&r<t.length&&([t[n],t[r]]=[t[r],t[n]],J(`layout order`),I=`layout`,gn({fieldOrder:t}))}}else if(i===`save-layout-settings`){let e=y.querySelector(`[data-layout-locked]`)?.checked??!1,t=new Set([...y.querySelectorAll(`[data-layout-field-visible]:checked`)].map(e=>e.dataset.layoutFieldVisible??``)),n=ln(W()).map(e=>e.id),r=n.filter(e=>!t.has(e));J(`layout settings`),I=`none`,gn({locked:e,fieldOrder:n,hiddenFieldIds:r})}else if(i===`create-relationship`)br();else if(i===`undo-change`)Bt();else if(i===`redo-change`)Vt();else if(i===`close-dialog`)I===`camera`&&(fr(),bt=null),I=`none`,B=[],V=null,$();else if(i.endsWith(`-view`))C=i.replace(`-view`,``),$();else if(i===`templates`)L=`Template starters are in the Teacher panel.`,$();else if(i===`student-view`)J(`student view toggle`),L=b.teacher.studentView?`Teacher tools are visible again.`:`Student view is on.`,q({...b,updatedAt:new Date().toISOString(),teacher:{...b.teacher,studentView:!b.teacher.studentView}});else if(i===`project-ideas`)I=`projectIdeas`,$();else if(i===`relationships`)I=`relationship`,$();else if(i===`charts`)_t||=W().fields.find(e=>!e.hidden&&![`image`,`longText`,`calculation`].includes(e.type))?.id??``,I=`charts`,$();else if(i===`maintenance`)I=`maintenance`,$();else if(i===`accessibility`)I=`accessibility`,$();else if(i===`guided`)I=`guided`,$();else if(i===`share-html`)Xt();else if(i===`remove-duplicates`){J(`remove duplicates`);let e=W().records.length,t=de(W());I=`none`,L=`Removed ${e-t.records.length} duplicate record${e-t.records.length===1?``:`s`}.`,Y(t)}else if(i===`remove-broken`)J(`remove broken relationships`),I=`none`,L=`Removed broken relationships.`,q(me(b));else if(i===`duplicate-project`)Kt({...b,metadata:{...b.metadata,title:`${b.metadata.title} copy`}}),L=`Saved a copy of the whole project.`,$();else if(i===`guided-create`){let e=n.closest(`[data-guided-kind]`)?.dataset.guidedKind,t=nr.find(t=>t.id===e);if(t){let e=y.querySelector(`[data-guided-name]`)?.value.trim()||t.label;J(`guided build`);let n=re(b,e),i=n.schema.tables.at(-1).id,a=n.schema.tables.find(e=>e.id===i);a={...a,fields:[],records:[]},t.fields.forEach(([e,t])=>{a=o(a,e,t)}),a={...a,records:[r(a.fields)]},n=p(n,a),x=i,S=a.records[0].id,K(),E=[],I=`none`,C=`table`,L=`Built the "${e}" table. Add records and adjust fields any time.`,q(n)}}else i===`functions`?(I=`functions`,$()):i===`quality`?(I=`quality`,$()):i===`teacher-notes`?(I=`teacherNotes`,$()):i.startsWith(`help-`)?(I=`help`,$()):(L=`That ListSplatTM control is not available in this workspace.`,$())}),y.addEventListener(`change`,e=>{let t=e.target;if(t.matches(`#languageSwitcher`)&&t instanceof HTMLSelectElement){kt=At(t.value);try{localStorage.setItem(nt,kt)}catch{}$()}else if(t.matches(`[data-open-json]`)&&t instanceof HTMLInputElement&&t.files?.[0])en(t.files[0]);else if(t.matches(`[data-import-csv]`)&&t instanceof HTMLInputElement&&t.files?.[0])tn(t.files[0]);else if(t.matches(`[data-search-field]`))T=t.value,F=new Set,$();else if(t.matches(`[data-sort-field]`)){let e=E[0]?.direction??`asc`;E=t.value?[{fieldId:t.value,direction:e}]:[],$()}else if(t.matches(`[data-group-field]`))ut=t.value,$();else if(t.matches(`[data-board-field]`))dt=t.value,$();else if(t.matches(`[data-calendar-field]`))ft=t.value,$();else if(t.matches(`[data-wrap-toggle]`)&&t instanceof HTMLInputElement)mt=t.checked,$();else if(t.matches(`[data-chart-type]`))gt=t.value,$();else if(t.matches(`[data-chart-category]`))_t=t.value,$();else if(t.matches(`[data-chart-value-mode]`))vt=t.value,$();else if(t.matches(`[data-chart-value-field]`))yt=t.value,$();else if(t.matches(`[data-rubric-criterion]`)&&t instanceof HTMLInputElement){let e=t.dataset.rubricCriterion??``,n=t.value===``?void 0:Number(t.value);Ht(t=>{let r={...t.rubricScores??{}};return n==null||Number.isNaN(n)?delete r[e]:r[e]=n,{...t,rubricScores:r}},`rubric score`)}else if(t.matches(`[data-select-all]`)&&t instanceof HTMLInputElement){let e=G(W()).map(e=>e.id);A=t.checked?new Set(e):new Set,$()}else if(t.matches(`[data-select-row]`)&&t instanceof HTMLInputElement){let e=t.dataset.selectRow??``;t.checked?A.add(e):A.delete(e),$()}else if(t.matches(`[data-field-type]`))ct=t.value,$();else if(t.matches(`[data-find-op]`))Pr(),$();else if(t.matches(`[data-map-action]`))qr(),$();else if(t.matches(`[data-csv-key]`))qr(),St=t.value,$();else if(t.matches(`[data-csv-dup]`))qr(),P=t.value,$();else if(t.matches(`[data-relationship-from-table], [data-relationship-to-table]`))xr();else if(t.matches(`.file-input`)&&t instanceof HTMLInputElement&&t.files?.[0]){let e=t.dataset.recordId,n=t.dataset.fieldId;e&&n&&lr(e,n,t.files[0])}else if(t.matches(`.multi-option`)&&t instanceof HTMLInputElement){let e=t.closest(`.multi-cell`),n=t.dataset.recordId,r=t.dataset.fieldId;if(e&&n&&r){let t=Array.from(e.querySelectorAll(`.multi-option:checked`)).map(e=>e.dataset.multiOption??``);Lt(n,r),b=p(b,f(W(),n,r,t.join(`, `))),m(b),$()}}else if(t.matches(`.cell-input, .cell-checkbox, .image-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement))if(t instanceof HTMLInputElement&&t.type===`file`&&t.files?.[0]){let e=t.dataset.recordId,n=t.dataset.fieldId,r=t.files[0];e&&n&&mr(e,n,r,`image upload`)}else t.dataset.recordId&&t.dataset.fieldId&&Lt(t.dataset.recordId,t.dataset.fieldId),or(t)}),y.addEventListener(`paste`,e=>{let t=e.target,n=t.closest(`.image-cell`);if(n){let t=n.dataset.recordId,r=n.dataset.fieldId,i=Array.from(e.clipboardData?.items??[]).find(e=>e.type.startsWith(`image/`))?.getAsFile();t&&r&&i&&(e.preventDefault(),mr(t,r,i,`image paste`));return}let r=t.closest(`.cell-input`);if(!r||!r.closest(`.data-grid`)||!r.dataset.recordId||!r.dataset.fieldId)return;let i=e.clipboardData?.getData(`text/plain`)??``;/[\t\n]/.test(i.replace(/\n$/,``))&&(e.preventDefault(),Ar(i,r.dataset.recordId,r.dataset.fieldId))}),y.addEventListener(`input`,e=>{let t=e.target;if(t.matches(`[data-project-title]`)){Gt(t.value);return}if(t.matches(`[data-search]`)){w=t.value,F=new Set,$();return}t.matches(`.cell-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)&&(t.dataset.recordId&&t.dataset.fieldId&&Lt(t.dataset.recordId,t.dataset.fieldId),or(t))}),y.addEventListener(`focusout`,e=>{e.target.matches?.(`.cell-input, .cell-checkbox`)&&(wt=``)}),y.addEventListener(`mousedown`,e=>{let t=e.target.closest(`[data-record-id][data-field-id]`);if(!t||!t.closest(`.data-grid`)||!t.dataset.recordId||!t.dataset.fieldId)return;let n={r:t.dataset.recordId,f:t.dataset.fieldId};e.shiftKey&&j?(e.preventDefault(),j={anchor:j.anchor,focus:n}):j={anchor:n,focus:n},Dr()}),y.addEventListener(`pointerdown`,e=>{let t=e.target.closest(`[data-col-resize]`);if(!t)return;e.preventDefault(),e.stopPropagation();let n=t.dataset.colResize??``,r=t.closest(`th`);if(!r)return;r.setAttribute(`draggable`,`false`);let i=e.clientX,a=r.getBoundingClientRect().width,o=Math.round(a),s=e=>{o=Math.max(80,Math.round(a+(e.clientX-i))),r.style.width=`${o}px`,r.style.minWidth=`${o}px`},c=()=>{document.removeEventListener(`pointermove`,s),document.removeEventListener(`pointerup`,c),r.setAttribute(`draggable`,`true`);let e=sn();e&&(J(`resize column`),gn({columnWidths:{...e.columnWidths??{},[n]:o}}))};document.addEventListener(`pointermove`,s),document.addEventListener(`pointerup`,c)});var Jr=null;y.addEventListener(`dragstart`,e=>{let t=e.target,n=t.closest(`.kanban-card[data-kanban-card]`);if(n){ht=n.dataset.kanbanCard??null,e.dataTransfer?.setData(`text/plain`,ht??``);return}if(t.closest(`[data-col-resize]`))return;let r=t.closest(`.col-head[data-col-field]`);r&&(Jr=r.dataset.colField??null,e.dataTransfer?.setData(`text/plain`,Jr??``))}),y.addEventListener(`dragover`,e=>{let t=e.target;(Jr&&t.closest(`.col-head[data-col-field]`)||ht&&t.closest(`.kanban-col`))&&e.preventDefault()}),y.addEventListener(`drop`,e=>{let t=e.target.closest(`.kanban-col`);if(t&&ht&&dt){e.preventDefault();let n=ht;ht=null;let r=t.dataset.kanbanCol??``;J(`move card`),b=p(b,f(W(),n,dt,r)),m(b),L=`Moved card to ${r||`Unassigned`}.`,$();return}let n=e.target.closest(`.col-head[data-col-field]`);if(!n||!Jr)return;e.preventDefault();let r=n.dataset.colField??``,i=Jr;if(Jr=null,!r||r===i)return;let a=ln(W()).map(e=>e.id),o=a.indexOf(i),s=a.indexOf(r);o<0||s<0||(a.splice(s,0,a.splice(o,1)[0]),J(`reorder columns`),gn({fieldOrder:a}))}),y.addEventListener(`keydown`,e=>{let t=e.target;if(!t.matches?.(`.cell-input, .cell-checkbox`))return;let n=t.dataset.recordId,r=t.dataset.fieldId;if(!n||!r)return;let i=t instanceof HTMLTextAreaElement,a=t instanceof HTMLSelectElement;if(e.shiftKey&&[`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`].includes(e.key)&&!i&&!a){j||={anchor:{r:n,f:r},focus:{r:n,f:r}},e.preventDefault(),Or(e.key);return}if(e.key===`Escape`&&j){j=null,Dr();return}switch(e.key){case`Enter`:i||(e.preventDefault(),Tr(n,r,e.shiftKey?-1:1,0));break;case`ArrowDown`:!i&&!a&&(e.preventDefault(),Tr(n,r,1,0));break;case`ArrowUp`:!i&&!a&&(e.preventDefault(),Tr(n,r,-1,0));break;case`Tab`:e.preventDefault(),Tr(n,r,0,e.shiftKey?-1:1);break;default:break}}),document.addEventListener(`keydown`,e=>{if(!(e.ctrlKey||e.metaKey))return;let t=e.key.toLowerCase();if(t===`c`){kr()&&e.preventDefault();return}t===`z`&&!e.shiftKey?(e.preventDefault(),Bt()):t===`y`||t===`z`&&e.shiftKey?(e.preventDefault(),Vt()):t===`s`&&(e.preventDefault(),Kt(),L=`Saved a .listsplat.json file to your downloads.`,$())}),document.addEventListener(`click`,e=>{e.target.closest(`.menu`)||Wt()}),document.addEventListener(`toggle`,e=>{let t=e.target;!(t instanceof HTMLDetailsElement)||!t.matches(`.menu`)||!t.open||document.querySelectorAll(`.menu[open]`).forEach(e=>{e!==t&&(e.open=!1)})},!0),$();