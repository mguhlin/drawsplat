(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={text:``,longText:``,number:0,currency:0,percent:0,date:``,time:``,dateTime:``,checkbox:!1,rating:0,choice:``,multiSelect:``,email:``,phone:``,image:``,link:``,calculation:``,autoNumber:``,createdAt:``,updatedAt:``};function t(e){return`${e}_${Math.random().toString(36).slice(2,10)}`}function n(e,n=`text`){return{id:t(`field`),name:e,type:n,description:``,required:!1,hidden:!1,options:n===`choice`||n===`multiSelect`?[`Yes`,`No`]:void 0}}function r(n,r={}){let i=new Date().toISOString(),a=Object.fromEntries(n.map((t,n)=>t.type===`createdAt`||t.type===`updatedAt`?[t.id,r[t.id]??i]:t.type===`autoNumber`?[t.id,r[t.id]??n+1]:r[t.id]===void 0&&t.defaultValue!=null&&t.defaultValue!==``?[t.id,u(t.defaultValue,t.type,t.options).value]:[t.id,r[t.id]??e[t.type]]));return{id:t(`record`),createdAt:i,updatedAt:i,values:a}}function i(e,i){let a=i.map(e=>n(e));return{id:t(`table`),name:e,fields:a,records:[r(a)]}}function a(e=`Animal Research Database`){let n=new Date().toISOString(),a=i(`Animals`,[`Animal`,`Habitat`,`Diet`,`Interesting Fact`]);return a.records=[r(a.fields,{[a.fields[0].id]:`Axolotl`,[a.fields[1].id]:`Freshwater lakes`,[a.fields[2].id]:`Worms and insects`,[a.fields[3].id]:`It can regrow some body parts.`}),r(a.fields,{[a.fields[0].id]:`Red panda`,[a.fields[1].id]:`Mountain forests`,[a.fields[2].id]:`Bamboo and fruit`,[a.fields[3].id]:`It uses its tail like a blanket.`})],{app:`ListSplatTM`,version:1,createdAt:n,updatedAt:n,metadata:{title:e,author:``,className:``},schema:{tables:[a],relationships:[]},layouts:[{id:t(`layout`),name:`Table View`,tableId:a.id,mode:`table`,locked:!1},{id:t(`layout`),name:`Record Form`,tableId:a.id,mode:`form`,locked:!1},{id:t(`layout`),name:`Research Cards`,tableId:a.id,mode:`cards`,locked:!1}],teacher:{studentView:!1,notes:[`Ask students to add source notes before printing a report.`],rubric:[]}}}function o(t,r,i=`text`){let a=n(r.trim()||`New Field`,i);return{...t,fields:[...t.fields,a],records:t.records.map(t=>({...t,updatedAt:new Date().toISOString(),values:{...t.values,[a.id]:e[i]}}))}}function s(e,t){return e.records.reduce((e,n)=>{let r=Number(n.values[t]);return Number.isFinite(r)?Math.max(e,r):e},0)+1}function c(e){let t={};return e.fields.filter(e=>e.type===`autoNumber`).forEach(n=>{t[n.id]=s(e,n.id)}),t}function l(e){return{...e,records:[...e.records,r(e.fields,c(e))]}}function u(t,n,r){let i=t==null?``:String(t);if(i.trim()===``)return{value:e[n],lost:!1};switch(n){case`number`:case`currency`:case`percent`:case`rating`:{let t=Number(i.replace(/[$,%\s]/g,``));return Number.isFinite(t)?{value:n===`rating`?Math.max(0,Math.min(5,Math.round(t))):t,lost:!1}:{value:e[n],lost:!0}}case`checkbox`:{let e=i.trim().toLowerCase();return[`true`,`yes`,`1`,`y`,`checked`].includes(e)?{value:!0,lost:!1}:[`false`,`no`,`0`,`n`].includes(e)?{value:!1,lost:!1}:{value:!1,lost:!0}}case`choice`:{let e=r?.find(e=>e.toLowerCase()===i.trim().toLowerCase());return e?{value:e,lost:!1}:{value:``,lost:!!(r&&r.length)}}case`date`:{let e=new Date(i);return Number.isNaN(e.getTime())?{value:``,lost:!0}:{value:e.toISOString().slice(0,10),lost:!1}}case`text`:case`longText`:case`link`:return{value:i,lost:!1};default:return{value:i,lost:!1}}}function d(e,t,n,r){return{...e,records:e.records.map(e=>({...e,values:{...e.values,[t]:u(e.values[t],n,r).value}}))}}function ee(e,t,n){return{...e,fields:e.fields.map(e=>e.id===t?{...e,...n}:e)}}function f(e,t){let n=e.records.find(e=>e.id===t);return n?{...e,records:[...e.records,r(e.fields,{...n.values,...c(e)})]}:e}function te(e,t){return e.records.length<=1?e:{...e,records:e.records.filter(e=>e.id!==t)}}function p(e,t,n,r){let i=new Date().toISOString();return{...e,records:e.records.map(a=>a.id===t?{...a,updatedAt:i,values:Object.fromEntries(e.fields.map(e=>e.id===n?[e.id,r]:e.type===`updatedAt`?[e.id,i]:[e.id,a.values[e.id]]))}:a)}}function ne(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t.id?t:e)}}}function re(e,n){let r=i(n.trim()||`New Table`,[`Name`,`Notes`]);return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:[...e.schema.tables,r]},layouts:[...e.layouts,{id:t(`layout`),name:`${r.name} Table`,tableId:r.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${r.name} Form`,tableId:r.id,mode:`form`,locked:!1}]}}function ie(e,t,n){let r=n.trim()||`Table`;return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t?{...e,name:r}:e)}}}function ae(e,n){let r=e.schema.tables.find(e=>e.id===n);if(!r)return{project:e,newTableId:n};let i=new Map(r.fields.map(e=>[e.id,t(`field`)])),a=r.fields.map(e=>({...e,id:i.get(e.id)})),o=r.records.map(e=>({id:t(`record`),createdAt:e.createdAt,updatedAt:e.updatedAt,values:Object.fromEntries(Object.entries(e.values).map(([e,t])=>[i.get(e)??e,t]))})),s={id:t(`table`),name:`${r.name} copy`,fields:a,records:o},c=e.schema.tables.findIndex(e=>e.id===n),l=[...e.schema.tables];return l.splice(c+1,0,s),{project:{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:l},layouts:[...e.layouts,{id:t(`layout`),name:`${s.name} Table`,tableId:s.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${s.name} Form`,tableId:s.id,mode:`form`,locked:!1}]},newTableId:s.id}}function oe(e,t,n){let r=[...e.schema.tables],i=r.findIndex(e=>e.id===t),a=i+n;return i<0||a<0||a>=r.length?e:([r[i],r[a]]=[r[a],r[i]],{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:r}})}function se(e,t){return e.schema.tables.length<=1?e:{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.filter(e=>e.id!==t),relationships:e.schema.relationships.filter(e=>e.fromTableId!==t&&e.toTableId!==t)},layouts:e.layouts.filter(e=>e.tableId!==t),views:(e.views??[]).filter(e=>e.tableId!==t)}}function ce(e){let t=new Date().toISOString();return{...e,createdAt:t,updatedAt:t,metadata:{...e.metadata,title:`${e.metadata.title} (template)`},schema:{...e.schema,tables:e.schema.tables.map(e=>({...e,records:[r(e.fields)]}))},views:[]}}function le(e){if(!e||typeof e!=`object`)throw Error(`This is not a ListSplatTM project file.`);let t=e;if(t.app!==`ListSplatTM`||t.version!==1||!t.schema?.tables)throw Error(`This file is not a supported .listsplat.json project.`)}function ue(e){let t=e.split(/\r?\n/,1)[0]??``,n=[`,`,`	`,`;`],r=`,`,i=-1;for(let e of n){let n=t.split(e).length-1;n>i&&(i=n,r=e)}return r}function de(e,t=ue(e)){let n=[],r=``,i=[],a=!1;for(let o=0;o<e.length;o+=1){let s=e[o],c=e[o+1];a&&s===`"`&&c===`"`?(r+=`"`,o+=1):s===`"`?a=!a:!a&&s===t?(i.push(r),r=``):!a&&(s===`
`||s===`\r`)?(s===`\r`&&c===`
`&&(o+=1),i.push(r),i.some(e=>e.length>0)&&n.push(i),i=[],r=``):r+=s}return i.push(r),i.some(e=>e.length>0)&&n.push(i),n}function fe(e,t){let i=de(t),a=(i[0]?.map((e,t)=>e.trim()||`Field ${t+1}`)??[`Field 1`]).map(e=>n(e)),o=i.slice(1).map(e=>r(a,Object.fromEntries(a.map((t,n)=>[t.id,e[n]??``]))));return{id:`table_${Date.now().toString(36)}`,name:e,fields:a,records:o.length>0?o:[r(a)]}}function pe(e){let t=e==null?``:String(e);return/[",\n\r]/.test(t)?`"${t.replaceAll(`"`,`""`)}"`:t}function me(e){return[e.fields.map(e=>pe(e.name)).join(`,`),...e.records.map(t=>e.fields.map(e=>pe(t.values[e.id])).join(`,`))].join(`
`)}var he=`listsplat.autosave.v1`;function ge(e){localStorage.setItem(he,JSON.stringify(e))}function _e(){let e=localStorage.getItem(he);if(!e)return null;let t=JSON.parse(e);return le(t),t}function ve(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,a.click(),URL.revokeObjectURL(i)}function ye(e){return e==null?``:String(e).trim().toLowerCase()}function be(e,n,r,i,a){return{id:t(`relationship`),name:e.trim()||`New Relationship`,fromTableId:n,fromFieldId:r,toTableId:i,toFieldId:a}}function xe(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,relationships:[...e.schema.relationships,t]}}}function Se(e,t,n,r){let i=ye(n.values[e.fromFieldId]);return!i||t.id!==e.fromTableId||r.id!==e.toTableId?[]:r.records.filter(t=>ye(t.values[e.toFieldId])===i)}function Ce(e,t){let n=e.schema.tables.find(e=>e.id===t.fromTableId),r=e.schema.tables.find(e=>e.id===t.toTableId),i=n?.fields.find(e=>e.id===t.fromFieldId),a=r?.fields.find(e=>e.id===t.toFieldId);return`${n?.name??`Table`}:${i?.name??`Field`} -> ${r?.name??`Table`}:${a?.name??`Field`}`}function we(e,t){return e.records.map(e=>Number(e.values[t])).filter(e=>Number.isFinite(e))}function Te(e){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)).map(t=>{let n=we(e,t.id),r=n.reduce((e,t)=>e+t,0);return{fieldId:t.id,fieldName:t.name,count:n.length,sum:r,average:n.length?r/n.length:0,minimum:n.length?Math.min(...n):0,maximum:n.length?Math.max(...n):0}})}function Ee(e){let t=[],n=``,r=!1,i=0;for(let a=0;a<e.length;a+=1){let o=e[a],s=e[a-1];if(o===`"`&&s!==`\\`){r=!r,n+=o;continue}if(!r&&o===`(`&&(i+=1),!r&&o===`)`&&--i,o===`,`&&!r&&i===0){t.push(n.trim()),n=``;continue}n+=o}return(n.trim()||e.endsWith(`,`))&&t.push(n.trim()),t}function De(e){let t=e.trim();if(t.startsWith(`"`)&&t.endsWith(`"`))return t.slice(1,-1).replace(/\\"/g,`"`)}function Oe(e,t,n){let r=n.trim().toLowerCase(),i=e.fields.find(e=>e.name.toLowerCase()===r);return i?String(t.values[i.id]??``):``}function m(e,t,n){let r=n.trim();return/^[A-Z_]+\(.*\)$/i.test(r)?Ne(r,e,t):De(n)??Oe(e,t,n)}function h(e,t,n){let r=Number(m(e,t,n));return Number.isFinite(r)?r:0}function ke(e,t){let n=t.trim().toLowerCase(),r=e.fields.find(e=>e.name.toLowerCase()===n);return r?we(e,r.id):[]}function g(e){return Number.isFinite(e)?String(Number(e.toFixed(8))):`Formula error: not a number`}function Ae(e){return e.toLowerCase().replace(/\b[a-z]/g,e=>e.toUpperCase())}function je(e,t,n,r){if(!e)return[];let i=r.trim().toLowerCase(),a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===i),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0;return a&&o?Se(a,t,n,o):[]}function Me(e,t,n,r,i){if(!e)return``;let a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===r.trim().toLowerCase()),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0,s=je(e,t,n,r)[0],c=o?.fields.find(e=>e.name.toLowerCase()===i.trim().toLowerCase());return s&&c?String(s.values[c.id]??``):``}function Ne(e,t,n,r){let i=e.trim();if(!i)return``;let a=i.match(/^([A-Z_]+)\((.*)\)$/i);if(!a)return`Formula error: use a function like FIELD(Name)`;let o=a[1].toUpperCase(),s=Ee(a[2]),c=s[0]??``;if(o===`FIELD`)return Oe(t,n,c);if(o===`JOIN`)return s.map(e=>m(t,n,e)).join(``);if(o===`UPPER`)return m(t,n,c).toUpperCase();if(o===`LOWER`)return m(t,n,c).toLowerCase();if(o===`TITLECASE`)return Ae(m(t,n,c));if(o===`TRIM`)return m(t,n,c).trim();if(o===`LENGTH`)return String(m(t,n,c).length);if(o===`CONTAINS`)return m(t,n,c).toLowerCase().includes(m(t,n,s[1]??``).toLowerCase())?`Yes`:`No`;if(o===`IF_EMPTY`)return m(t,n,c).trim()?m(t,n,c):m(t,n,s[1]??``);if(o===`LOOKUP`)return Me(r,t,n,De(c)??c,De(s[1]??``)??s[1]??``);if(o===`COUNT_RELATED`)return String(je(r,t,n,De(c)??c).length);if(o===`ADD`)return g(s.reduce((e,r)=>e+h(t,n,r),0));if(o===`SUBTRACT`)return g(s.slice(1).reduce((e,r)=>e-h(t,n,r),h(t,n,c)));if(o===`MULTIPLY`)return g(s.reduce((e,r)=>e*h(t,n,r),1));if(o===`DIVIDE`){let e=h(t,n,s[1]??``);return e===0?`Formula error: divide by zero`:g(h(t,n,c)/e)}if(o===`ROUND`){let e=Math.max(0,Math.min(6,Math.round(h(t,n,s[1]??`"0"`))));return String(Number(h(t,n,c).toFixed(e)))}if([`SUM`,`AVERAGE`,`MIN`,`MAX`,`COUNT`].includes(o)){let e=ke(t,c);return o===`SUM`?g(e.reduce((e,t)=>e+t,0)):o===`AVERAGE`?g(e.length?e.reduce((e,t)=>e+t,0)/e.length:0):o===`MIN`?g(e.length?Math.min(...e):0):o===`MAX`?g(e.length?Math.max(...e):0):String(e.length)}if(o===`COUNT_UNIQUE`){let e=c.trim().toLowerCase(),n=t.fields.find(t=>t.name.toLowerCase()===e);if(!n)return`0`;let r=new Set(t.records.map(e=>String(e.values[n.id]??``).trim().toLowerCase()).filter(Boolean));return String(r.size)}if(o===`PERCENT`){let e=h(t,n,s[1]??``);return e===0?`0`:g(h(t,n,c)/e*100)}if(o===`LEFT`)return m(t,n,c).slice(0,Math.max(0,h(t,n,s[1]??`"0"`)));if(o===`RIGHT`){let e=Math.max(0,h(t,n,s[1]??`"0"`)),r=m(t,n,c);return e===0?``:r.slice(-e)}if(o===`MID`){let e=Math.max(0,h(t,n,s[1]??`"1"`)-1),r=Math.max(0,h(t,n,s[2]??`"0"`));return m(t,n,c).slice(e,e+r)}if(o===`SUBSTITUTE`)return m(t,n,c).split(m(t,n,s[1]??``)).join(m(t,n,s[2]??``));let l=e=>{let r=m(t,n,e).trim().toLowerCase();return r!==``&&![`no`,`false`,`0`].includes(r)};if(o===`IS_EMPTY`)return m(t,n,c).trim()===``?`Yes`:`No`;if(o===`NOT`)return l(c)?`No`:`Yes`;if(o===`AND`)return s.every(l)?`Yes`:`No`;if(o===`OR`)return s.some(l)?`Yes`:`No`;if(o===`IF`)return l(c)?m(t,n,s[1]??``):m(t,n,s[2]??``);let u=e=>{let r=m(t,n,e).trim();if(!r)return null;let i=new Date(r.length<=10?`${r}T00:00:00`:r);return Number.isNaN(i.getTime())?null:i};if(o===`TODAY`)return new Date().toISOString().slice(0,10);if(o===`YEAR`||o===`MONTH`||o===`DAY`){let e=u(c);return e?String(o===`YEAR`?e.getFullYear():o===`MONTH`?e.getMonth()+1:e.getDate()):``}if(o===`DAYS_BETWEEN`||o===`YEARS_BETWEEN`){let e=u(c),t=s[1]?u(s[1]):new Date;if(!e||!t)return``;let n=Math.round((t.getTime()-e.getTime())/864e5);return String(o===`DAYS_BETWEEN`?n:Math.floor(n/365.25))}return`Formula error: ${o} is not supported`}function _(e){return e==null?``:String(e)}function Pe(e,t){let n=t.query.trim();if(!n)return e.records;let r=n.toLowerCase();return e.records.filter(n=>(t.fieldId===`all`?e.fields.map(e=>e.id):[t.fieldId]).some(e=>_(n.values[e]).toLowerCase().includes(r)))}function Fe(e,t){let n=Number(e),r=Number(t);return e!==``&&t!==``&&!Number.isNaN(n)&&!Number.isNaN(r)?n-r:e.localeCompare(t,void 0,{numeric:!0,sensitivity:`base`})}function Ie(e,t){return t.length?[...e].sort((e,n)=>{for(let r of t){let t=_(e.values[r.fieldId]).trim(),i=_(n.values[r.fieldId]).trim();if(t===``&&i!==``)return 1;if(t!==``&&i===``)return-1;let a=Fe(t,i)*(r.direction===`asc`?1:-1);if(a!==0)return a}return 0}):e}function Le(e,t){let n=_(e.values[t.fieldId]),r=n.trim().toLowerCase(),i=t.value.trim().toLowerCase(),a=Number(n),o=Number(t.value),s=n.trim()!==``&&t.value.trim()!==``&&!Number.isNaN(a)&&!Number.isNaN(o);switch(t.operator){case`contains`:return r.includes(i);case`equals`:return s?a===o:r===i;case`startsWith`:return r.startsWith(i);case`endsWith`:return r.endsWith(i);case`greaterThan`:return s?a>o:r>i;case`lessThan`:return s?a<o:r<i;case`between`:{let e=Number(t.value),n=Number(t.value2);return!Number.isNaN(e)&&!Number.isNaN(n)&&!Number.isNaN(a)?a>=Math.min(e,n)&&a<=Math.max(e,n):r>=i&&r<=(t.value2??``).trim().toLowerCase()}case`isEmpty`:return n.trim()===``;case`isNotEmpty`:return n.trim()!==``;default:return!0}}function Re(e,t){return!t||t.rules.length===0?e:e.filter(e=>t.match===`all`?t.rules.every(t=>Le(e,t)):t.rules.some(t=>Le(e,t)))}function ze(e,t){let n=new Map;return e.records.forEach(e=>{let r=_(e.values[t]).trim().toLowerCase();r&&n.set(r,(n.get(r)??0)+1)}),e.records.filter(e=>{let r=_(e.values[t]).trim().toLowerCase();return r?(n.get(r)??0)>1:!1})}function Be(e,t){return e.records.filter(e=>!_(e.values[t]).trim())}function Ve(e,t){if(!t.find)return[];let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=[];return e.records.forEach(e=>{o.has(e.id)&&t.fieldIds.forEach(n=>{let r=_(e.values[n]),i=r.replace(a,t.replacement);i!==r&&s.push({recordId:e.id,fieldId:n,before:r,after:i})})}),s}function He(e,t){if(!t.find)return{table:e,count:0};let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=0,c=e.records.map(e=>{if(!o.has(e.id))return e;let n=!1,r={...e.values};return t.fieldIds.forEach(e=>{let i=_(r[e]),o=i.replace(a,()=>(s+=1,t.replacement));o!==i&&(n=!0,r[e]=o)}),n?{...e,updatedAt:new Date().toISOString(),values:r}:e});return{table:{...e,records:c},count:s}}var Ue={email:/^[^\s@]+@[^\s@]+\.[^\s@]+$/,url:/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/,phone:/^[+()\d][\d\s().-]{5,}$/};function We(e){return e==null?``:String(e)}function Ge(e,t,n,r){let i=Ke(e,t,n,r);return i&&e.customMessage?e.customMessage:i}function Ke(e,t,n,r){let i=We(t).trim();if(i===``)return e.required?`This field is required.`:``;if(e.maxLength&&i.length>e.maxLength)return`Keep this ${e.maxLength} characters or fewer.`;if(e.type===`email`&&!Ue.email.test(i))return`Enter a valid email address.`;if(e.type===`phone`&&!Ue.phone.test(i))return`Enter a valid phone number.`;if([`number`,`currency`,`percent`,`rating`].includes(e.type)){let t=Number(i);if(Number.isNaN(t))return`Enter a number.`;if(e.min!=null&&t<e.min)return`Must be at least ${e.min}.`;if(e.max!=null&&t>e.max)return`Must be at most ${e.max}.`}if([`text`,`longText`,`link`].includes(e.type)&&e.pattern&&e.pattern!==`none`){if(e.pattern===`custom`){if(e.customPattern)try{if(!new RegExp(e.customPattern).test(i))return`Does not match the required format.`}catch{}}else if(!Ue[e.pattern].test(i))return`Enter a valid ${e.pattern}.`}return e.unique&&n&&n.records.some(t=>t.id!==r&&We(t.values[e.id]).trim().toLowerCase()===i.toLowerCase())?`This value is already used in another record.`:``}function qe(e){let t=[];return e.fields.forEach(n=>{[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(n.type)||e.records.forEach(r=>{let i=Ge(n,r.values[n.id],e,r.id);i&&t.push({record:r,field:n,message:i})})}),t}function v(e,t,n,r,i,a){return{id:e,title:t,gradeBand:n,goal:r,table:fe(t,i),reflectionQuestions:a}}var Je=[v(`classroom-library`,`Classroom Library Catalog`,`Grades 3-8`,`Track books, genres, reading levels, and recommendations.`,`Title,Author,Genre,Pages,Who would enjoy it?
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
Apollo 11 mission,NASA,1969,Space exploration,First humans walked on the Moon`,[`How should the exhibit be grouped?`,`What field would help visitors understand the item?`])];function Ye(e){let t=e.table.fields.map(e=>({...e,id:`${e.id}_${Date.now().toString(36)}`})),n=e.table.records.map(n=>r(t,Object.fromEntries(e.table.fields.map((e,r)=>[t[r].id,n.values[e.id]??``]))));return{...e.table,id:`table_${e.id}_${Date.now().toString(36)}`,fields:t,records:n}}var Xe=`drawsplat.language`,Ze=[{code:`en`,label:`English`,dir:`ltr`,htmlLang:`en`},{code:`es`,label:`Español`,dir:`ltr`,htmlLang:`es`},{code:`vi`,label:`Tiếng Việt`,dir:`ltr`,htmlLang:`vi`},{code:`ar`,label:`العربية`,dir:`rtl`,htmlLang:`ar`},{code:`zh`,label:`中文`,dir:`ltr`,htmlLang:`zh`},{code:`uh`,label:`हिन्दी / اردو`,dir:`ltr`,htmlLang:`hi`}],Qe={es:{New:`Nuevo`,"Save JSON":`Guardar JSON`,"Open JSON":`Abrir JSON`,"Export CSV":`Exportar CSV`,File:`Archivo`,Edit:`Editar`,Data:`Datos`,Layout:`Diseño`,Tools:`Herramientas`,View:`Vista`,Teacher:`Docente`,Help:`Ayuda`,Title:`Título`,Search:`Buscar`,In:`En`,"All fields":`Todos los campos`,Sort:`Ordenar`,"Choose field":`Elegir campo`,"New field":`Campo nuevo`,"Field name":`Nombre del campo`,Type:`Tipo`,"Add field":`Agregar campo`,"Add record":`Agregar registro`,Table:`Tabla`,Form:`Formulario`,Cards:`Tarjetas`,Gallery:`Galería`,Labels:`Etiquetas`,Report:`Informe`,"Upload image":`Subir imagen`,"No image yet":`Sin imagen todavía`},vi:{New:`Mới`,"Save JSON":`Lưu JSON`,"Open JSON":`Mở JSON`,"Export CSV":`Xuất CSV`,File:`Tệp`,Edit:`Sửa`,Data:`Dữ liệu`,Layout:`Bố cục`,Tools:`Công cụ`,View:`Xem`,Teacher:`Giáo viên`,Help:`Trợ giúp`,Title:`Tiêu đề`,Search:`Tìm`,Sort:`Sắp xếp`,Table:`Bảng`,Form:`Biểu mẫu`,Cards:`Thẻ`,Gallery:`Thư viện ảnh`,Labels:`Nhãn`,Report:`Báo cáo`},ar:{New:`جديد`,"Save JSON":`حفظ JSON`,"Open JSON":`فتح JSON`,"Export CSV":`تصدير CSV`,File:`ملف`,Edit:`تحرير`,Data:`بيانات`,Layout:`تخطيط`,Tools:`أدوات`,View:`عرض`,Teacher:`المعلم`,Help:`مساعدة`,Title:`العنوان`,Search:`بحث`,Sort:`فرز`,Table:`جدول`,Form:`نموذج`,Cards:`بطاقات`,Gallery:`معرض`,Labels:`ملصقات`,Report:`تقرير`},zh:{New:`新建`,"Save JSON":`保存 JSON`,"Open JSON":`打开 JSON`,"Export CSV":`导出 CSV`,File:`文件`,Edit:`编辑`,Data:`数据`,Layout:`布局`,Tools:`工具`,View:`视图`,Teacher:`教师`,Help:`帮助`,Title:`标题`,Search:`搜索`,Sort:`排序`,Table:`表格`,Form:`表单`,Cards:`卡片`,Gallery:`图库`,Labels:`标签`,Report:`报告`},uh:{New:`नया`,File:`फ़ाइल`,Edit:`संपादन`,Data:`डेटा`,Layout:`लेआउट`,Tools:`औज़ार`,View:`दृश्य`,Teacher:`शिक्षक`,Help:`सहायता`,Search:`खोज`,Table:`तालिका`,Form:`फ़ॉर्म`,Cards:`कार्ड`,Gallery:`गैलरी`,Labels:`लेबल`,Report:`रिपोर्ट`}},$e=document.querySelector(`#app`);if(!$e)throw Error(`ListSplatTM app root was not found.`);var y=$e,b=_e()??a(),x=b.schema.tables[0].id,S=b.schema.tables[0].records[0]?.id??``,C=`table`,et=`Saved locally`,w=``,T=`all`,E=[],D=null,O={match:`all`,rules:[]},k=[],tt=``,A=new Set,j=null,M=!1,N=``,nt=``,rt=``,it=``,at=!1,ot=null,st=`bar`,ct=``,lt=`count`,ut=``,P=[],F=new Set,I=`none`,dt=``,L=`Tip: Start with one table, then add relationships when your project needs them.`,R=[],z=[],ft=``,pt=null,B=[],mt=x,ht=b.schema.tables[1]?.id??x,V=null,gt=``,_t=yt();function H(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function vt(e){let t=(e||``).toLowerCase();return t.startsWith(`es`)?`es`:t.startsWith(`vi`)?`vi`:t.startsWith(`ar`)?`ar`:t.startsWith(`zh`)?`zh`:t===`uh`||t.startsWith(`ur`)||t.startsWith(`hi`)?`uh`:`en`}function yt(){let e=new URLSearchParams(window.location.search);try{return vt(e.get(`lang`)||localStorage.getItem(Xe)||navigator.language)}catch{return vt(e.get(`lang`)||navigator.language)}}function bt(e){return Ze.map(({code:t,label:n})=>`<option value="${t}"${t===e?` selected`:``}>${n}</option>`).join(``)}function U(e){return _t===`en`?e:Qe[_t][e]??e}function xt(){let e=Ze.find(e=>e.code===_t)??Ze[0];document.documentElement.lang=e.htmlLang,document.documentElement.dir=e.dir}function W(){return b.schema.tables.find(e=>e.id===x)??b.schema.tables[0]}function G(e){let t=Pe(e,{query:w,fieldId:T});return t=t.filter(e=>M?e.archived:!e.archived),t=Re(t,D),F.size>0&&(t=t.filter(e=>F.has(e.id))),Ie(t,E.filter(t=>e.fields.some(e=>e.id===t.fieldId)))}function St(e){return e.records.filter(e=>e.archived).length}function Ct(){return!!w||!!(D&&D.rules.length)||F.size>0}function wt(){w=``,D=null,F=new Set}function Tt(e){e.records.some(e=>e.id===S)||(S=e.records[0]?.id??``)}function K(e){b=e,Tt(W()),ge(b),et=`Saved locally`,$()}function q(e){R=[{label:e,project:structuredClone(b)},...R].slice(0,25),z=[]}function Et(e,t){let n=`${e}:${t}`;ft!==n&&(q(`edit ${W().fields.find(e=>e.id===t)?.name??`cell`}`),ft=n,Dt())}function Dt(){let e=y.querySelector(`[data-action="undo-change"]`),t=y.querySelector(`[data-action="redo-change"]`);e&&(e.disabled=R.length===0),t&&(t.disabled=z.length===0)}function Ot(e){b=e,x=b.schema.tables.some(e=>e.id===x)?x:b.schema.tables[0].id,Tt(W()),ge(b),$()}function kt(){let e=R[0];if(!e){L=`Nothing to undo yet.`,$();return}z=[{label:e.label,project:structuredClone(b)},...z].slice(0,25),R=R.slice(1),L=`Undid ${e.label}.`,Ot(e.project)}function At(){let e=z[0];if(!e){L=`Nothing to redo.`,$();return}R=[{label:e.label,project:structuredClone(b)},...R].slice(0,25),z=z.slice(1),L=`Redid ${e.label}.`,Ot(e.project)}function J(e){x=e.id,K(ne(b,e))}function jt(){document.querySelectorAll(`.menu[open]`).forEach(e=>{e.open=!1})}function Mt(e){K({...b,updatedAt:new Date().toISOString(),metadata:{...b.metadata,title:e||`Untitled Database`}})}function Nt(e=b){ve(`${e.metadata.title||`listsplat-project`}.listsplat.json`,JSON.stringify(e,null,2),`application/json`)}function Pt(){ve(`${W().name}.csv`,me(W()),`text/csv;charset=utf-8`)}function Ft(){let e=W(),t=G(e),n=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${H(b.metadata.title)}</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{color:#5b21b6}</style></head>
<body><h1>${H(b.metadata.title)}</h1><p>${H(e.name)} report from ListSplatTM.</p>
<table><thead><tr>${e.fields.map(e=>`<th>${H(e.name)}</th>`).join(``)}</tr></thead>
<tbody>${t.map(t=>`<tr>${e.fields.map(n=>`<td>${H(X(e,t,n.id))}</td>`).join(``)}</tr>`).join(``)}</tbody></table></body></html>`;ve(`${b.metadata.title||`listsplat-report`}.html`,n,`text/html;charset=utf-8`)}function It(){let e=b.schema.tables.map(e=>{let t=qt(e),n=t.reduce((e,t)=>e+t.missing,0),r=t.reduce((e,t)=>e+t.duplicates,0);return`
        <section>
          <h2>${H(e.name)}</h2>
          <p>${e.records.length} records, ${e.fields.length} fields, ${n} missing values, ${r} duplicate values.</p>
          <table>
            <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th><th>Missing</th><th>Duplicates</th></tr></thead>
            <tbody>${e.fields.map(e=>{let n=t.find(t=>t.field.id===e.id);return`<tr><td>${H(e.name)}</td><td>${H(e.type)}</td><td>${e.required?`Yes`:`No`}</td><td>${H(e.description)}</td><td>${n?.missing??0}</td><td>${n?.duplicates??0}</td></tr>`}).join(``)}</tbody>
          </table>
        </section>
      `}).join(``),t=b.schema.relationships.length?`<ul>${b.schema.relationships.map(e=>`<li>${H(e.name)}: ${H(Ce(b,e))}</li>`).join(``)}</ul>`:`<p>No relationships have been created yet.</p>`,n=b.teacher.notes.length?`<ul>${b.teacher.notes.map(e=>`<li>${H(e)}</li>`).join(``)}</ul>`:`<p>No teacher notes yet.</p>`,r=`<!doctype html>
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
</body></html>`;ve(`${b.metadata.title||`listsplat`}-project-packet.html`,r,`text/html;charset=utf-8`)}function Lt(e){e.text().then(e=>{let t=JSON.parse(e);le(t),x=t.schema.tables[0].id,S=t.schema.tables[0].records[0]?.id??``,K(t)}).catch(e=>{window.alert(e instanceof Error?e.message:`Could not open this ListSplatTM file.`)})}function Rt(e){e.text().then(t=>{let n=fe(e.name.replace(/\.csv$/i,``),t);V=n,gt=e.name;let r=W();P=n.fields.map(e=>{let t=n.records.slice(0,12).map(t=>String(t.values[e.id]??``)),i=r.fields.find(t=>t.name.trim().toLowerCase()===e.name.trim().toLowerCase());return{header:e.name,action:i?`existing`:`new`,type:mr(t),fieldId:i?.id??``}}),I=`csvImport`,L=`Previewing ${n.records.length} CSV record${n.records.length===1?``:`s`} from ${e.name}.`,$()})}function zt(e){if(!V){I=`none`;return}hr();let i=V;if(q(`CSV import`),e===`new`){let e=P.filter(e=>e.action!==`skip`).map((e,t)=>{let r=i.fields[P.indexOf(e)];return{field:n(e.header||`Field ${t+1}`,e.type),sourceFieldId:r.id}}),a=i.records.map(t=>r(e.map(e=>e.field),Object.fromEntries(e.map(e=>[e.field.id,u(t.values[e.sourceFieldId],e.field.type).value])))),o={id:t(`table`),name:i.name,fields:e.map(e=>e.field),records:a.length?a:[r(e.map(e=>e.field))]};x=o.id,S=o.records[0]?.id??``,V=null,wt(),E=[],A=new Set,I=`none`,L=`Imported ${o.records.length} records from ${gt}.`,K({...b,updatedAt:new Date().toISOString(),schema:{...b.schema,tables:[...b.schema.tables,o]},layouts:[...b.layouts,{id:t(`layout`),name:`${o.name} Table`,tableId:o.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${o.name} Form`,tableId:o.id,mode:`form`,locked:!1}]});return}let a=W();P.forEach((e,t)=>{if(e.action===`new`){let r=n(e.header||`Field ${t+1}`,e.type);a={...a,fields:[...a.fields,r]},e.fieldId=r.id}});let o=new Map(a.fields.map(e=>[e.id,e])),s=i.records.map(e=>r(a.fields,Object.fromEntries(P.filter(e=>e.action!==`skip`&&e.fieldId&&o.has(e.fieldId)).map((t,n)=>{let r=i.fields[P.indexOf(t)],a=o.get(t.fieldId);return[t.fieldId,u(e.values[r.id],a.type,a.options).value]}))));V=null,I=`none`,L=`Appended ${s.length} CSV record${s.length===1?``:`s`} to ${a.name}.`,J({...a,records:[...a.records,...s]})}function Bt(e){let t=Je.find(t=>t.id===e);if(!t)return;let n=Ye(t);q(`template load`),x=n.id,S=n.records[0]?.id??``,L=`Loaded ${t.title}.`,K({...b,metadata:{...b.metadata,title:t.title},schema:{...b.schema,tables:[...b.schema.tables,n]},teacher:{...b.teacher,notes:t.reflectionQuestions}})}function Y(e,t){return`
    <details class="menu">
      <summary>${H(U(e))}</summary>
      <div class="menu-panel">
        ${t.map(([e,t])=>`<button type="button" data-action="${e}">${H(U(t))}</button>`).join(``)}
      </div>
    </details>
  `}function Vt(e=`text`){return[[`text`,`Short text`],[`longText`,`Long text`],[`number`,`Number`],[`currency`,`Currency`],[`percent`,`Percent`],[`date`,`Date`],[`time`,`Time`],[`dateTime`,`Date and time`],[`checkbox`,`Checkbox`],[`rating`,`Rating`],[`choice`,`Single choice`],[`multiSelect`,`Multiple choice`],[`email`,`Email`],[`phone`,`Phone`],[`link`,`Web address`],[`image`,`Image`],[`calculation`,`Calculation`],[`autoNumber`,`Auto number`],[`createdAt`,`Created time`],[`updatedAt`,`Updated time`]].map(([t,n])=>`<option value="${t}" ${e===t?`selected`:``}>${n}</option>`).join(``)}function X(e,t,n){let r=e.fields.find(e=>e.id===n);return r?.type===`calculation`&&r.formula?Ne(r.formula,e,t,b):t.values[n]??``}function Ht(e,t){if(t===``||t==null)return``;if(!e)return String(t);let n=typeof t==`number`?t:Number(t);return e.type===`currency`&&Number.isFinite(n)?n.toLocaleString(void 0,{style:`currency`,currency:`USD`}):e.type===`percent`&&Number.isFinite(n)?`${n.toLocaleString()}%`:e.type===`number`&&Number.isFinite(n)?n.toLocaleString():e.type===`checkbox`?t===!0||t===`true`?`Yes`:`No`:String(t)}function Z(){return b.layouts.find(e=>e.tableId===x&&e.mode===C)}function Ut(e){return!!e}function Q(e){let t=new Set(Z()?.hiddenFieldIds??[]);return Wt(e).filter(e=>!t.has(e.id))}function Wt(e){let t=Z()?.fieldOrder??e.fields.map(e=>e.id),n=new Map(e.fields.map(e=>[e.id,e]));return[...t.map(e=>n.get(e)).filter(Ut),...e.fields.filter(e=>!t.includes(e.id))].filter(e=>e&&!e.hidden)}function Gt(e){return e.fields.filter(e=>e.type===`calculation`)}function Kt(e){return Gt(e).reduce((t,n)=>n.formula?t+e.records.filter(t=>String(Ne(n.formula??``,e,t,b)).startsWith(`Formula error:`)).length:t,0)}function qt(e){return e.fields.filter(e=>!e.hidden&&![`image`,`autoNumber`,`createdAt`,`updatedAt`,`calculation`].includes(e.type)).map(t=>({field:t,missing:Be(e,t.id).length,duplicates:ze(e,t.id).length}))}function Jt(e){return Q(e).filter(e=>e.type===`image`)}function Yt(e,t){let n=Jt(e)[0];return n?String(X(e,t,n.id)??``):``}function Xt(e){let t=Z();t&&K({...b,updatedAt:new Date().toISOString(),layouts:b.layouts.map(n=>n.id===t.id?{...n,...e}:n)})}function Zt(e,t){let n=e.fields.find(e=>!e.hidden)??e.fields[0],r=n?X(e,t,n.id):``;return String(r||`Untitled record`)}function Qt(e,t,n,r){let i=e.fields.find(e=>e.id===n),a=X(e,t,n),o=`aria-label="${H(i?.name??`Field`)}, record ${r+1}" data-record-id="${t.id}" data-field-id="${n}"`,s=i&&![`checkbox`,`image`,`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(i.type)?Ge(i,a,e,t.id):``,c=s?`cell-input cell-invalid`:`cell-input`,l=s?` title="${H(s)}"`:``,u=`${l}${i?.readonly?` readonly disabled`:``}${i?.maxLength?` maxlength="${i.maxLength}"`:``}`;if(i?.type===`checkbox`)return`<input class="cell-checkbox" type="checkbox" ${o} ${i.readonly?`disabled`:``} ${a===!0||a===`true`?`checked`:``}>`;if(i?.type===`multiSelect`){let e=i.options?.length?i.options:[`Yes`,`No`],r=new Set(String(a??``).split(`,`).map(e=>e.trim()).filter(Boolean));return`<div class="multi-cell${s?` cell-invalid`:``}" ${o}${s?` title="${H(s)}"`:``}>${e.map(e=>`<label class="multi-chip${r.has(e)?` on`:``}"><input type="checkbox" class="multi-option" data-record-id="${t.id}" data-field-id="${n}" data-multi-option="${H(e)}" ${r.has(e)?`checked`:``} ${i.readonly?`disabled`:``}>${H(e)}</label>`).join(``)}</div>`}if(i?.type===`time`)return`<input class="${c}" type="time" ${o}${u} value="${H(a)}">`;if(i?.type===`dateTime`)return`<input class="${c}" type="datetime-local" ${o}${u} value="${H(a)}">`;if(i?.type===`email`){let e=String(a??``);return`<div class="link-cell"><input class="${c}" type="email" ${o}${u} value="${H(e)}" placeholder="name@example.com">${e&&!s?`<a class="link-open" href="mailto:${H(e)}" title="Send email" aria-label="Send email">✉</a>`:``}</div>`}if(i?.type===`phone`)return`<input class="${c}" type="tel" ${o}${u} value="${H(a)}" placeholder="(555) 555-5555">`;if(i?.type===`link`){let e=String(a??``),t=/^https?:\/\//i.test(e)?e:e?`https://${e}`:``;return`<div class="link-cell"><input class="${c}" type="url" ${o}${u} value="${H(e)}" placeholder="https://…">${t?`<a class="link-open" href="${H(t)}" target="_blank" rel="noopener" title="Open link" aria-label="Open link">↗</a>`:``}</div>`}if(i?.type===`image`){let e=String(a??``);return`
      <div class="image-cell" tabindex="0" role="button" title="Click here and paste an image, or use Upload image." ${o}>
        ${e?`<img src="${H(e)}" alt="">`:`<span>${H(U(`No image yet`))}</span>`}
        <small>Paste an image here or upload one.</small>
        <label class="image-upload-label">
          ${H(U(`Upload image`))}
          <input class="image-input" type="file" accept="image/*" ${o}>
        </label>
      </div>
    `}if(i?.type===`rating`)return`<input class="${c}" type="number" min="0" max="5" step="1" ${o}${u} value="${H(a)}">`;if(i?.type===`choice`){let e=i.options?.length?i.options:[`Yes`,`No`];return`<select class="${c}" ${o}${l}${i.readonly?` disabled`:``}><option value=""${a===``?` selected`:``}>—</option>${e.map(e=>`<option value="${H(e)}" ${String(a)===e?`selected`:``}>${H(e)}</option>`).join(``)}</select>`}if(i?.type===`autoNumber`||i?.type===`createdAt`||i?.type===`updatedAt`)return`<output class="calc-output">${H(a)}</output>`;if(i?.type===`longText`)return`<textarea class="${c}" ${o}${u}>${H(a)}</textarea>`;if(i?.type===`date`)return`<input class="${c}" type="date" ${o}${u} value="${H(a)}">`;if(i?.type===`number`||i?.type===`currency`||i?.type===`percent`){let e=i.type===`currency`?`<span class="cell-affix">$</span>`:``,t=i.type===`percent`?`<span class="cell-affix">%</span>`:``;return`<span class="num-cell">${e}<input class="${c}" type="number" step="any" ${o}${u} value="${H(a)}">${t}</span>`}return i?.type===`calculation`?`<output class="calc-output">${H(a)}</output>`:`<input class="${c}" ${o}${u} value="${H(a)}">`}function $t(e){return`
    <div class="table-tabs">
      ${b.schema.tables.map(t=>`<button type="button" class="table-tab ${t.id===e.id?`active`:``}" data-table-id="${t.id}">${H(t.name)}</button>`).join(``)}
    </div>
  `}function en(e,t){if(t.length===0){let e=Ct();return`
      <div class="data-grid-wrap">
        <div class="empty-state">
          <h3>${H(U(e?`No records match your find`:`No records yet`))}</h3>
          <p>${H(U(e?`Try a different search, or show all records.`:`Add your first record to start building this database.`))}</p>
          <button type="button" class="button primary" data-action="${e?`clear-find`:`add-record`}">${e?H(U(`Show all records`)):`+ ${H(U(`Add first record`))}`}</button>
        </div>
      </div>
    `}let n=Q(e),r=t.length>0&&t.every(e=>A.has(e.id)),i=e=>{let t=E.find(t=>t.fieldId===e);return t?t.direction===`asc`?`▲`:`▼`:`⇅`},a=cn(e,t),o=n.length+3,s=(t,r)=>`
                <tr class="${t.id===S?`active-row`:``}${A.has(t.id)?` selected-row`:``}" data-record-row="${t.id}">
                  <td class="select-col"><input type="checkbox" data-select-row="${t.id}" aria-label="Select record ${r+1}" ${A.has(t.id)?`checked`:``}></td>
                  <td class="row-num-col"><button type="button" class="row-button" data-select-record="${t.id}">${r+1}</button></td>
                  ${n.map(n=>`<td style="${tn(n.id)}">${Qt(e,t,n.id,r)}</td>`).join(``)}
                  <td class="record-actions">
                    <button type="button" title="Open record" data-action="expand-record" data-record-action-id="${t.id}">Open</button>
                    <button type="button" data-action="duplicate-record" data-record-action-id="${t.id}">Copy</button>
                    <button type="button" data-action="delete-record" data-record-action-id="${t.id}">Delete</button>
                  </td>
                </tr>
              `,c=0,l=a.map(t=>(N?`<tr class="group-row"><td colspan="${o}"><strong>${H(t.label)}</strong> <span>${t.records.length}${ln(e,t.records)?` · `+ln(e,t.records):``}</span></td></tr>`:``)+t.records.map(e=>s(e,c++)).join(``)).join(``);return`
    <div class="data-grid-wrap${at?` wrap-cells`:``}">
      <table class="data-grid">
        <thead>
          <tr>
            <th class="select-col"><input type="checkbox" data-select-all aria-label="Select all records" ${r?`checked`:``}></th>
            <th class="row-num-col">#</th>
            ${n.map(e=>`
                  <th class="col-head" data-col-field="${e.id}" draggable="true" style="${tn(e.id)}">
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
  `}function tn(e){let t=Z()?.columnWidths?.[e];return t?`width:${t}px;min-width:${t}px;`:``}function nn(e){let t=e.records.find(e=>e.id===S)??e.records[0];if(!t)return`<div class="empty-panel">Add a record to use form view.</div>`;let n=b.schema.relationships.filter(t=>t.fromTableId===e.id).map(n=>{let r=b.schema.tables.find(e=>e.id===n.toTableId),i=r?Se(n,e,t,r):[];return`
        <section class="related-records">
          <h3>${H(n.name)}</h3>
          <p>${i.length} related record${i.length===1?``:`s`} from ${H(r?.name??`another table`)}</p>
          ${i.length?`<div class="related-grid">${i.slice(0,6).map(e=>`
                      <article>
                        <strong>${H(Zt(r,e))}</strong>
                        ${r.fields.filter(e=>!e.hidden).slice(0,3).map(t=>`<span>${H(t.name)}: ${H(X(r,e,t.id))}</span>`).join(``)}
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
                <span>${H(n.name)}</span>
                ${Qt(e,t,n.id,r)}
                ${n.description?`<small>${H(n.description)}</small>`:``}
              </label>
            `).join(``)}
        ${n}
      </div>
    </div>
  `}function rn(e,t){let n=(t,n)=>{let r=X(e,n,t.id);if(t.type===`image`){let e=String(r??``);return`
        <figure class="card-image-field">
          ${e?`<img src="${H(e)}" alt="">`:`<span>No image yet</span>`}
          <figcaption>${H(t.name)}</figcaption>
        </figure>
      `}if(t.type===`link`&&String(r??``)){let e=String(r),n=/^https?:\/\//i.test(e)?e:`https://${e}`;return`<p><strong>${H(t.name)}</strong><a href="${H(n)}" target="_blank" rel="noopener">${H(e)}</a></p>`}return`<p><strong>${H(t.name)}</strong><span>${H(Ht(t,r))}</span></p>`};return`
    <div class="cards-view ${C===`gallery`?`gallery-view`:``}">
      ${t.map(t=>{let r=Yt(e,t);return`
            <article class="record-card" data-select-record="${t.id}">
              ${C===`gallery`?`<div class="gallery-image">${r?`<img src="${H(r)}" alt="">`:`<span>Add an image field, then upload a picture.</span>`}</div>`:``}
              ${Q(e).filter(e=>C!==`gallery`||e.type!==`image`).slice(0,C===`gallery`?4:8).map(e=>n(e,t)).join(``)}
            </article>
          `}).join(``)}
    </div>
  `}function an(e,t){return`
    <div class="labels-view">
      ${t.map(t=>`
            <article class="print-label">
              ${Q(e).slice(0,4).map(n=>`<p><strong>${H(n.name)}:</strong> ${H(Ht(n,X(e,t,n.id)))}</p>`).join(``)}
            </article>
          `).join(``)}
    </div>
  `}function on(e,t){let n=Te(e);return`
    <div class="report-view">
      <header>
        <h2>${H(b.metadata.title)}</h2>
        <p>${H(e.name)} report. ${t.length} record${t.length===1?``:`s`} shown.</p>
      </header>
      ${en(e,t)}
      ${n.length?`<section class="summary-strip">${n.map(e=>`<div><strong>${H(e.fieldName)}</strong><span>Sum ${e.sum.toLocaleString()} | Avg ${e.average.toFixed(2)}</span></div>`).join(``)}</section>`:`<p class="empty-panel">Add a number, currency, or percent field to see summaries.</p>`}
    </div>
  `}function sn(e,t,n){let r=new Set;return t.forEach(t=>{let i=String(X(e,t,n)??``).trim();i&&r.add(i)}),[...r]}function cn(e,t){if(!N||!e.fields.some(e=>e.id===N))return[{key:``,label:``,records:t}];let n=new Map;return t.forEach(t=>{let r=String(X(e,t,N)??``).trim();n.has(r)||n.set(r,[]),n.get(r).push(t)}),[...n.entries()].sort((e,t)=>e[0].localeCompare(t[0],void 0,{numeric:!0})).map(([e,t])=>({key:e,label:e||`(empty)`,records:t}))}function ln(e,t){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)&&!e.hidden).slice(0,3).map(n=>{let r=t.map(t=>Number(X(e,t,n.id))).filter(e=>Number.isFinite(e));if(!r.length)return``;let i=r.reduce((e,t)=>e+t,0);return`${H(n.name)}: sum ${i.toLocaleString()}, avg ${(i/r.length).toFixed(1)}`}).filter(Boolean).join(` · `)}function un(e,t){return e.map(e=>`<option value="${e.id}" ${t===e.id?`selected`:``}>${H(e.name)}</option>`).join(``)}function dn(e){let t=[];if(C===`list`||C===`table`){let n=e.fields.filter(e=>!e.hidden&&![`image`,`longText`].includes(e.type));t.push(`<label>Group by <select data-group-field><option value="">No grouping</option>${un(n,N)}</select></label>`),t.push(`<label class="inline-check"><input type="checkbox" data-wrap-toggle ${at?`checked`:``}> Wrap long text</label>`)}if(C===`kanban`){let n=e.fields.filter(e=>[`choice`,`text`].includes(e.type)&&!e.hidden);t.push(`<label>Columns by <select data-board-field><option value="">Choose a status or choice field</option>${un(n,nt)}</select></label>`)}if(C===`calendar`){let n=e.fields.filter(e=>[`date`,`dateTime`,`createdAt`,`updatedAt`].includes(e.type)&&!e.hidden);t.push(`<label>Dates from <select data-calendar-field><option value="">Choose a date field</option>${un(n,rt)}</select></label>`)}return t.length?`<div class="view-controls">${t.join(``)}</div>`:``}function fn(e,t){let n=Q(e),r=n[0],i=n.find(e=>e.id!==r?.id&&![`image`].includes(e.type)),a=cn(e,t).map(t=>`
        ${N?`<div class="group-head"><strong>${H(t.label)}</strong><span>${t.records.length}${ln(e,t.records)?` · `+ln(e,t.records):``}</span></div>`:``}
        ${t.records.map(t=>{let n=Yt(e,t);return`
              <div class="list-row${t.id===S?` active`:``}">
                ${n?`<img class="list-thumb" src="${H(n)}" alt="">`:``}
                <div class="list-main">
                  <strong>${H(X(e,t,r?.id??``)||`Untitled`)}</strong>
                  ${i?`<span>${H(Ht(i,X(e,t,i.id)))}</span>`:``}
                </div>
                <button type="button" class="button ghost" data-action="expand-record" data-record-action-id="${t.id}">Open</button>
              </div>
            `}).join(``)}
      `).join(``);return`<div class="list-view${at?` wrap-cells`:``}">${a||`<p class="empty-panel">No records to list.</p>`}</div>`}function pn(e,t){let n=e.fields.find(e=>e.id===nt);return n?`<div class="kanban">${[``,...(n.options&&n.options.length?n.options:sn(e,t,n.id)).filter(Boolean)].map(r=>{let i=t.filter(t=>String(X(e,t,n.id)??``).trim()===r);return`
        <div class="kanban-col" data-kanban-col="${H(r)}">
          <div class="kanban-col-head"><strong>${H(r||`Unassigned`)}</strong><span>${i.length}</span></div>
          <div class="kanban-cards">
            ${i.map(t=>`
                  <div class="kanban-card" draggable="true" data-kanban-card="${t.id}" data-action="expand-record" data-record-action-id="${t.id}">
                    <strong>${H(Zt(e,t))}</strong>
                  </div>
                `).join(``)}
          </div>
        </div>
      `}).join(``)}</div>`:`<p class="empty-panel">Choose a status or choice field above to build a board with draggable cards.</p>`}function mn(e,t){let n=e.fields.find(e=>e.id===rt)??e.fields.find(e=>[`date`,`dateTime`,`createdAt`,`updatedAt`].includes(e.type)&&!e.hidden);if(!n)return`<p class="empty-panel">Add a date field, then choose it above to see records on a calendar.</p>`;let r=it?new Date(`${it}-01T00:00:00`):new Date,i=r.getFullYear(),a=r.getMonth(),o=`${i}-${String(a+1).padStart(2,`0`)}`,s=new Date(i,a,1),c=s.getDay(),l=new Date(i,a+1,0).getDate(),u=new Map;t.forEach(t=>{let r=String(X(e,t,n.id)??``).slice(0,10);/^\d{4}-\d{2}-\d{2}$/.test(r)&&r.startsWith(o)&&(u.has(r)||u.set(r,[]),u.get(r).push(t))});let d=[];for(let e=0;e<c;e+=1)d.push(`<div class="cal-cell empty"></div>`);for(let t=1;t<=l;t+=1){let n=`${o}-${String(t).padStart(2,`0`)}`,r=u.get(n)??[];d.push(`
      <div class="cal-cell">
        <div class="cal-day">${t}</div>
        ${r.slice(0,4).map(t=>`<button type="button" class="cal-event" data-action="expand-record" data-record-action-id="${t.id}">${H(Zt(e,t))}</button>`).join(``)}
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
  `}function hn(e){let t=it?new Date(`${it}-01T00:00:00`):new Date;t.setMonth(t.getMonth()+e),it=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}`}function gn(e){let t=G(e),n={table:`Table: spreadsheet-like rows and columns for fast data entry.`,form:`Form: focus on one record at a time.`,cards:`Cards: compact text-first record cards for browsing.`,gallery:`Gallery: image-first cards for collections and exhibits.`,list:`List: compact rows grouped by a field.`,kanban:`Board: columns by status or category, drag cards to change them.`,calendar:`Calendar: records placed on a month grid by a date field.`,labels:`Labels: printable small cards or shelf labels.`,report:`Report: printable table with title and summaries.`},r=C===`form`?nn(e):C===`cards`||C===`gallery`?rn(e,t):C===`list`?fn(e,t):C===`kanban`?pn(e,t):C===`calendar`?mn(e,t):C===`labels`?an(e,t):C===`report`?on(e,t):en(e,t);return`
    <section class="database-panel" aria-label="Database table">
      ${$t(e)}
      <div class="view-tabs" role="group" aria-label="Layout modes">
        ${[`table`,`form`,`cards`,`gallery`,`list`,`kanban`,`calendar`,`labels`,`report`].map(e=>`<button type="button" class="${C===e?`active`:``}" data-view-mode="${e}" title="${H(n[e])}" aria-label="${H(n[e])}">${H(U(e===`kanban`?`Board`:e[0].toUpperCase()+e.slice(1)))}</button>`).join(``)}
      </div>
      ${dn(e)}
      ${_n()}
      ${vn(e)}
      ${r}
    </section>
  `}function _n(){let e=[];if(M&&e.push(`<button type="button" class="chip chip-button" data-action="toggle-archived" title="Back to active records">Archived view — click to exit</button>`),w&&e.push(`<span class="chip">Search: “${H(w)}”</span>`),D&&D.rules.length){let t=D.match===`all`?` AND `:` OR `,n=D.rules.map(e=>`${er(e.fieldId)} ${tr(e.operator)}${e.operator===`isEmpty`||e.operator===`isNotEmpty`?``:` `+e.value}${e.operator===`between`?`–`+(e.value2??``):``}`).join(t);e.push(`<button type="button" class="chip chip-button" data-action="find" title="Edit find">Find: ${H(n)}</button>`)}return F.size&&e.push(`<span class="chip">${F.size} highlighted</span>`),E.filter(e=>W().fields.some(t=>t.id===e.fieldId)).forEach(t=>{e.push(`<button type="button" class="chip chip-button" data-action="sort-dialog" title="Edit sort">Sort: ${H(er(t.fieldId))} ${t.direction===`asc`?`↑`:`↓`}</button>`)}),e.length?`<div class="filter-chips">${e.join(``)}${Ct()?`<button type="button" class="chip chip-clear" data-action="clear-find">Clear find</button>`:``}${E.length?`<button type="button" class="chip chip-clear" data-action="sort-dialog">Edit sort</button>`:``}</div>`:``}function vn(e){let t=ur(e).length;return t===0||C===`form`?``:`
    <div class="bulk-bar" role="group" aria-label="Bulk actions">
      <strong>${t} selected</strong>
      <button type="button" class="button" data-action="bulk-fill">Fill a field…</button>
      <button type="button" class="button" data-action="bulk-duplicate">Duplicate</button>
      ${M?`<button type="button" class="button" data-action="bulk-restore">Restore</button>`:`<button type="button" class="button" data-action="bulk-archive">Archive</button>`}
      <button type="button" class="button danger" data-action="bulk-delete">Delete</button>
      <button type="button" class="button ghost" data-action="bulk-clear">Clear selection</button>
    </div>
  `}function yn(e){let t=Te(e),n=e.records.find(e=>e.id===S)??e.records[0],r=n?b.schema.relationships.filter(t=>t.fromTableId===e.id).map(t=>{let r=b.schema.tables.find(e=>e.id===t.toTableId),i=r?Se(t,e,n,r).length:0;return`
            <div class="template-card">
              <strong>${H(t.name)}</strong>
              <span>${i} related record${i===1?``:`s`}</span>
              <p>${H(Ce(b,t))}</p>
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
      ${Je.map(e=>`
            <div class="template-card">
              <strong>${H(e.title)}</strong>
              <span>${H(e.gradeBand)}</span>
              <p>${H(e.goal)}</p>
              <button type="button" data-template-id="${e.id}">Use template</button>
            </div>
          `).join(``)}
    </aside>
  `}function bn(){let e=b.schema.tables,t=b.schema.relationships,n=t=>e.find(e=>e.id===t)?.name??`table`,r=(t,n)=>e.find(e=>e.id===t)?.fields.find(e=>e.id===n)?.name??`field`,i=new Set(t.flatMap(e=>[e.fromTableId,e.toTableId]));return`<div class="rel-diagram"><div class="rel-boxes">${e.map(e=>`
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
          `).join(``):`<p class="rel-empty">No links yet. Create one below to connect two tables.</p>`}</div></div>`}function xn(e){let t=[[`Combine text`,`JOIN(A, " ", B)`],[`Add`,`ADD(A, B)`],[`Multiply`,`MULTIPLY(A, B)`],[`Percent`,`PERCENT(A, B)`],[`If / then`,`IF(CONTAINS(A, "x"), "yes", "no")`],[`Sum column`,`SUM(A)`],[`Average`,`AVERAGE(A)`],[`Count`,`COUNT(A)`],[`Years since`,`YEARS_BETWEEN(A)`],[`Uppercase`,`UPPER(A)`]],n=e.fields.filter(e=>![`calculation`].includes(e.type)).slice(0,12);return`
    <div class="formula-builder">
      <div class="fb-row"><span>Functions</span>${t.map(([e,t])=>`<button type="button" class="fb-chip" data-formula-insert="${H(t)}">${H(e)}</button>`).join(``)}</div>
      <div class="fb-row"><span>Insert field</span>${n.map(e=>`<button type="button" class="fb-chip field" data-formula-insert="${H(e.name)}">${H(e.name)}</button>`).join(``)}</div>
    </div>
  `}function Sn(e,t){let n=[`number`,`currency`,`percent`,`rating`].includes(t),r=[`text`,`longText`,`link`].includes(t),i=[`text`,`longText`,`email`,`phone`,`link`].includes(t);return[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(t)?``:`
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
  `}function Cn(e,t,n){if(n===t.type||[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(n))return``;let r=(y.querySelector(`[data-field-options]`)?.value??t.options?.join(`, `)??``).split(`,`).map(e=>e.trim()).filter(Boolean),i=e.records.filter(e=>String(e.values[t.id]??``).trim()!==``).slice(0,4).map(e=>{let i=String(e.values[t.id]??``),a=u(e.values[t.id],n,r),o=a.value===!0?`Yes`:a.value===!1?`No`:String(a.value??``);return`<li><span>${H(i)}</span> → <span class="${a.lost?`preview-lost`:``}">${a.lost?`cleared`:H(o||`(empty)`)}</span></li>`}),a=e.records.filter(e=>String(e.values[t.id]??``).trim()===``?!1:u(e.values[t.id],n,r).lost).length;return`
    <div class="type-preview">
      <strong>Change ${H(t.type)} → ${H(n)}</strong>
      ${i.length?`<ul>${i.join(``)}</ul>`:`<p>No values to convert yet.</p>`}
      ${a?`<p class="preview-warn">${a} value${a===1?``:`s`} cannot convert and will be cleared.</p>`:`<p>All values convert cleanly.</p>`}
    </div>
  `}function wn(e){let t=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${H(e.name)}</option>`).join(``),n=O.rules.map((e,n)=>{let r=$n.find(t=>t.value===e.operator)??$n[0];return`
        <div class="find-rule" data-rule-index="${n}">
          <select data-find-field aria-label="Field">${t(e.fieldId)}</select>
          <select data-find-op aria-label="Condition">${$n.map(t=>`<option value="${t.value}" ${t.value===e.operator?`selected`:``}>${H(t.label)}</option>`).join(``)}</select>
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
  `}function Tn(e){let t=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${H(e.name)}</option>`).join(``);return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Sort records">
        <h2>Sort records</h2>
        <div class="sort-levels">${k.map((e,n)=>`
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
  `}function En(){let e=or();return`
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
  `}function Dn(e){let t=ur(e).length;return`
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
  `}function On(e){let t=e.fields.find(e=>e.id===ct);if(!t)return[];let n=G(e),r=new Map;return n.forEach(n=>{let i=String(X(e,n,t.id)??``).trim()||`(empty)`,a=1;if(lt===`sum`&&ut){let t=Number(X(e,n,ut));a=Number.isFinite(t)?t:0}r.set(i,(r.get(i)??0)+a)}),[...r.entries()].map(([e,t])=>({label:e,value:t})).slice(0,24)}var kn=[`#7c3aed`,`#0ea5e9`,`#16a34a`,`#f59e0b`,`#dc2626`,`#9333ea`,`#0891b2`,`#65a30d`,`#ea580c`,`#db2777`];function An(e){if(!e.length)return`<p class="empty-panel">Choose a category field to build a chart.</p>`;let t=Math.max(...e.map(e=>e.value),1),n=e.reduce((e,t)=>e+t.value,0)||1;if(st===`pie`){let t=-Math.PI/2;return`<svg viewBox="0 0 300 260" class="chart-svg" role="img" aria-label="Pie chart">${e.map((e,r)=>{let i=e.value/n*Math.PI*2,a=150+110*Math.cos(t),o=130+110*Math.sin(t);t+=i;let s=150+110*Math.cos(t),c=130+110*Math.sin(t),l=+(i>Math.PI);return`<path d="M150 130 L${a.toFixed(1)} ${o.toFixed(1)} A110 110 0 ${l} 1 ${s.toFixed(1)} ${c.toFixed(1)} Z" fill="${kn[r%kn.length]}"></path>`}).join(``)}</svg>`}let r=460/e.length;return st===`line`?`<svg viewBox="0 0 520 260" class="chart-svg" role="img" aria-label="Line chart">
      <polyline fill="none" stroke="#7c3aed" stroke-width="3" points="${e.map((e,n)=>{let i=30+r*n+r/2,a=230-e.value/t*200;return`${i.toFixed(1)},${a.toFixed(1)}`}).join(` `)}"></polyline>
      ${e.map((e,n)=>{let i=30+r*n+r/2,a=230-e.value/t*200;return`<circle cx="${i.toFixed(1)}" cy="${a.toFixed(1)}" r="4" fill="#5b21b6"></circle>`}).join(``)}
    </svg>`:`<svg viewBox="0 0 520 260" class="chart-svg" role="img" aria-label="Bar chart">${e.map((e,n)=>{let i=30+r*n+4,a=e.value/t*200,o=230-a;return`<rect x="${i.toFixed(1)}" y="${o.toFixed(1)}" width="${(r-8).toFixed(1)}" height="${a.toFixed(1)}" rx="4" fill="${kn[n%kn.length]}"></rect>`}).join(``)}<line x1="30" y1="230" x2="490" y2="230" stroke="#d8d2ff"></line></svg>`}function jn(e){let t=e.fields.filter(e=>!e.hidden&&![`image`,`longText`,`calculation`].includes(e.type)),n=e.fields.filter(e=>[`number`,`currency`,`percent`,`rating`].includes(e.type)),r=On(e);return`
    <div class="modal-backdrop">
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Charts">
        <h2>Charts</h2>
        <p>Charts use the records currently shown (${G(e).length}). Change filters to focus a chart.</p>
        <div class="chart-controls">
          <label>Type <select data-chart-type>${[`bar`,`pie`,`line`].map(e=>`<option value="${e}" ${st===e?`selected`:``}>${e}</option>`).join(``)}</select></label>
          <label>Category <select data-chart-category><option value="">Choose a field</option>${t.map(e=>`<option value="${e.id}" ${ct===e.id?`selected`:``}>${H(e.name)}</option>`).join(``)}</select></label>
          <label>Measure <select data-chart-value-mode><option value="count" ${lt===`count`?`selected`:``}>count records</option><option value="sum" ${lt===`sum`?`selected`:``}>sum a number</option></select></label>
          ${lt===`sum`?`<label>Number field <select data-chart-value-field><option value="">Choose</option>${n.map(e=>`<option value="${e.id}" ${ut===e.id?`selected`:``}>${H(e.name)}</option>`).join(``)}</select></label>`:``}
        </div>
        <div class="chart-area">${An(r)}</div>
        ${r.length?`<table class="chart-table"><caption class="sr-only">Chart data</caption><thead><tr><th>Category</th><th>Value</th></tr></thead><tbody>${r.map(e=>`<tr><td>${H(e.label)}</td><td>${e.value.toLocaleString()}</td></tr>`).join(``)}</tbody></table>`:``}
        <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
      </section>
    </div>
  `}function Mn(e){if(I===`none`)return``;if(I===`find`)return wn(e);if(I===`sort`)return Tn(e);if(I===`views`)return En();if(I===`bulkFill`)return Dn(e);if(I===`charts`)return jn(e);if(I===`replace`){let t=B.slice(0,8);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Replace values">
          <h2>Replace values</h2>
          <label>Find <input data-replace-find placeholder="Text to find"></label>
          <label>Replace with <input data-replace-with placeholder="New text"></label>
          <label>Field <select data-replace-field>${e.fields.map(e=>`<option value="${e.id}">${H(e.name)}</option>`).join(``)}</select></label>
          <label class="check-row"><input type="checkbox" data-replace-case-sensitive> Case-sensitive</label>
          <label class="check-row"><input type="checkbox" data-replace-whole-word> Whole word only</label>
          <p>Replacement applies to the current found set when search is active. Preview first, then apply. The last replace can be undone from Edit.</p>
          ${B.length?`<div class="replace-preview"><strong>${B.length} change${B.length===1?``:`s`} ready</strong>${t.map(t=>{let n=e.records.find(e=>e.id===t.recordId),r=e.fields.find(e=>e.id===t.fieldId);return`<p><span>${H(n?Zt(e,n):`Record`)} / ${H(r?.name??`Field`)}</span><del>${H(t.before)}</del><ins>${H(t.after)}</ins></p>`}).join(``)}</div>`:``}
          <div class="modal-actions">
            <button type="button" data-action="preview-replace">Preview</button>
            <button type="button" data-action="run-replace" ${B.length?``:`disabled`}>Apply Replace</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(I===`field`){let t=e.fields.find(e=>e.id===dt)??e.fields[0],n=tt||t.type;return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Field settings">
          <h2>Field settings</h2>
          <label>Name <input data-field-name value="${H(t.name)}"></label>
          <label>Type <select data-field-type>${Vt(n)}</select></label>
          ${Cn(e,t,n)}
          <label>Description <textarea data-field-description>${H(t.description)}</textarea></label>
          <label>Choice options <input data-field-options value="${H(t.options?.join(`, `)??``)}" placeholder="Yes, No, Maybe"></label>
          <label class="check-row"><input type="checkbox" data-field-required ${t.required?`checked`:``}> Required field</label>
          <label class="check-row"><input type="checkbox" data-field-hidden ${t.hidden?`checked`:``}> Hide field</label>
          ${Sn(t,n)}
          <label>Calculation formula <input data-field-formula value="${H(t.formula??``)}" placeholder='JOIN(First Name, " ", Last Name)'></label>
          ${n===`calculation`?xn(e):``}
          <p>Try <code>FIELD(Animal)</code>, <code>JOIN(Animal, " lives in ", Habitat)</code>, <code>UPPER(Animal)</code>, <code>ADD(Score, Bonus)</code>, <code>AVERAGE(Score)</code>, or <code>LOOKUP("Book reviews", Rating)</code>.</p>
          <div class="modal-actions">
            <button type="button" data-action="save-field-settings">Save field</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(I===`layout`){let t=Z(),n=Wt(e),r=new Set(t?.hiddenFieldIds??[]);return`
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
    `}if(I===`csvImport`&&V){let t=V.records.slice(0,4),n=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${H(e.name)}</option>`).join(``),r=P.map((e,t)=>`
          <div class="csv-map-row" data-map-index="${t}">
            <span class="csv-map-header">${H(e.header||`Column ${t+1}`)}</span>
            <select data-map-action aria-label="What to do with ${H(e.header)}">
              <option value="new" ${e.action===`new`?`selected`:``}>New field</option>
              <option value="existing" ${e.action===`existing`?`selected`:``}>Existing field</option>
              <option value="skip" ${e.action===`skip`?`selected`:``}>Skip</option>
            </select>
            <select data-map-type aria-label="Type for ${H(e.header)}" ${e.action===`new`?``:`hidden`}>${Vt(e.type)}</select>
            <select data-map-existing aria-label="Existing field for ${H(e.header)}" ${e.action===`existing`?``:`hidden`}>${n(e.fieldId)}</select>
          </div>
        `).join(``);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="CSV import">
          <h2>Import CSV</h2>
          <p>${H(gt)} has ${V.fields.length} column${V.fields.length===1?``:`s`} and ${V.records.length} row${V.records.length===1?``:`s`}. Choose how each column maps.</p>
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
    `;if(I===`relationship`){let t=b.schema.tables.find(e=>e.id===mt)??e,n=b.schema.tables.find(e=>e.id===ht)??e,r=t.fields.map(e=>`<option value="${t.id}:${e.id}">${H(e.name)}</option>`).join(``),i=n.fields.map(e=>`<option value="${n.id}:${e.id}">${H(e.name)}</option>`).join(``);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Relationships">
          <h2>Relationships</h2>
          <p>Create a simple one-to-many relationship by matching values in two fields, such as Books:Title to Reviews:Book.</p>
          ${bn()}
          <label>Name <input data-relationship-name placeholder="Books to reviews"></label>
          <label>Parent table <select data-relationship-from-table>${b.schema.tables.map(e=>`<option value="${e.id}" ${e.id===t.id?`selected`:``}>${H(e.name)}</option>`).join(``)}</select></label>
          <label>Parent match field <select data-relationship-from-field>${r}</select></label>
          <label>Related table <select data-relationship-to-table>${b.schema.tables.map(e=>`<option value="${e.id}" ${e.id===n.id?`selected`:``}>${H(e.name)}</option>`).join(``)}</select></label>
          <label>Related match field <select data-relationship-to-field>${i}</select></label>
          ${b.schema.relationships.length?`<div class="relationship-list">${b.schema.relationships.map(e=>`<p><strong>${H(e.name)}</strong><br>${H(Ce(b,e))}</p>`).join(``)}</div>`:`<p>No relationships yet. Add a second table first for the most useful results.</p>`}
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
    `}if(I===`quality`){let t=qt(e),n=Kt(e),r=t.reduce((e,t)=>e+t.missing,0),i=t.reduce((e,t)=>e+t.duplicates,0),a=qe(e).length;return`
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
  `}function $(){let e=W();Tt(e),xt();let t=b.teacher.studentView;if(y.innerHTML=`
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
        <select id="languageSwitcher" class="lang-switcher" aria-label="Language">${bt(_t)}</select>
      </div>
    </header>
    <main class="listsplat-app">
      <nav class="menu-bar" aria-label="Application menu">
        ${Y(`File`,[[`new`,`New database`],[`save-json`,`Save .listsplat.json`],[`open-json`,`Open .listsplat.json`],[`import-csv`,`Import CSV`],[`export-csv`,`Export CSV`],[`export-report`,`Export report HTML`],[`print`,`Print`]])}
        ${Y(`Edit`,[[`undo-change`,`Undo last change`],[`redo-change`,`Redo last change`],[`add-record`,`Add record`],[`add-field`,`Add field`],[`find`,`Find records`],[`replace`,`Replace values`]])}
        ${Y(`Data`,[[`add-table`,`New table`],[`rename-table`,`Rename this table`],[`duplicate-table`,`Duplicate this table`],[`move-table-left`,`Move table left`],[`move-table-right`,`Move table right`],[`delete-table`,`Delete this table`],[`sort`,`Sort records`],[`missing`,`Find missing values`],[`duplicates`,`Find duplicates`],[`toggle-archived`,M?`Show active records`:`Show archived records (${St(e)})`],[`structure-copy`,`Save structure-only copy`],[`clear-find`,`Show all records`]])}
        ${Y(`Layout`,[[`layout-designer`,`Design current layout`],[`table-view`,`Table view`],[`form-view`,`Form view`],[`cards-view`,`Card view`],[`gallery-view`,`Gallery view`],[`labels-view`,`Label view`],[`report-view`,`Report view`]])}
        ${Y(`Tools`,[[`functions`,`Functions`],[`relationships`,`Relationships`],[`charts`,`Charts`],[`quality`,`Data quality check`]])}
        ${Y(`View`,[[`student-view`,t?`Exit student view`:`Student view`],[`teacher-notes`,`Teacher notes`]])}
        <span class="menu-spacer"></span>
        ${t?``:Y(`Teacher`,[[`templates`,`Template Library`],[`project-ideas`,`Project Ideas`],[`lock-layout`,`Lock Layout`],[`project-packet`,`Print Project Packet`]])}
        ${Y(`Help`,[[`help-start`,`Start a database`],[`help-csv`,`Import and export CSV`],[`help-layouts`,`Forms and reports`],[`help-privacy`,`Privacy and saving`]])}
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
        <label>${H(U(`Type`))} <select data-new-field-type>${Vt()}</select></label>
        <button type="button" data-action="add-field">${H(U(`Add field`))}</button>
        <button type="button" data-action="add-record">${H(U(`Add record`))}</button>
      </section>
      <div class="workspace${t?` student-workspace`:``}">
        ${gn(e)}
        ${t?``:yn(e)}
      </div>
      <footer class="status-bar">
        <span>${H(e.name)}: ${G(e).length} shown of ${e.records.length} records, ${e.fields.length} fields</span>
        ${t?`<span>Student view hides teacher notes and teacher tools.</span>`:``}
        <span>${H(L)}</span>
        <span>${et}</span>
      </footer>
    </main>
    <input class="hidden-file" type="file" accept=".listsplat.json,application/json" data-open-json>
    <input class="hidden-file" type="file" accept=".csv,text/csv" data-import-csv>
    ${Mn(e)}
  `,ft=``,pt){let e=pt;pt=null,Gn(e.recordId,e.fieldId)}Yn()}function Nn(e){return e instanceof HTMLInputElement&&e.type===`checkbox`?e.checked:e instanceof HTMLInputElement&&e.type===`number`?e.value===``?``:Number(e.value):e.value}function Pn(e){let t=e.dataset.recordId,n=e.dataset.fieldId;!t||!n||(b=ne(b,p(W(),t,n,Nn(e))),ge(b),et=`Saved locally`)}function Fn(e){return new Promise((t,n)=>{let r=new FileReader;r.onerror=()=>n(r.error),r.onload=()=>{let n=String(r.result??``);if(e.size<=35e4){t(n);return}let i=new Image;i.onerror=()=>t(n),i.onload=()=>{let e=1280,r=Math.max(i.width,i.height),a=r>e?e/r:1,o=Math.max(1,Math.round(i.width*a)),s=Math.max(1,Math.round(i.height*a)),c=document.createElement(`canvas`);c.width=o,c.height=s;let l=c.getContext(`2d`);if(!l){t(n);return}l.drawImage(i,0,0,o,s);let u=c.toDataURL(`image/jpeg`,.82);t(u.length<n.length?u:n)},i.src=n},r.readAsDataURL(e)})}function In(e,t,n,r){if(!n.type.startsWith(`image/`)){L=`That clipboard item is not an image.`,$();return}Fn(n).then(n=>{q(r),b=ne(b,p(W(),e,t,n)),ge(b);let i=Math.round(n.length/1024);L=i>900?`Image saved (about ${i} KB). Very large pictures can slow autosave — a smaller image is fine for most projects.`:`Image saved in this field.`,$()}).catch(()=>{L=`Could not read that image.`,$()})}function Ln(){let e=W(),t=e.fields.find(e=>e.id===dt);if(!t)return;let n=y.querySelector(`[data-field-name]`)?.value??t.name,r=y.querySelector(`[data-field-type]`)?.value??t.type,i=y.querySelector(`[data-field-description]`)?.value??``,a=y.querySelector(`[data-field-required]`)?.checked??!1,o=y.querySelector(`[data-field-hidden]`)?.checked??!1,s=y.querySelector(`[data-field-formula]`)?.value??``,c=(y.querySelector(`[data-field-options]`)?.value??``).split(`,`).map(e=>e.trim()).filter(Boolean),l=y.querySelector(`[data-field-unique]`)?.checked??!1,u=y.querySelector(`[data-field-min]`)?.value??``,f=y.querySelector(`[data-field-max]`)?.value??``,te=u.trim()===``?void 0:Number(u),p=f.trim()===``?void 0:Number(f),ne=y.querySelector(`[data-field-pattern]`)?.value??`none`,re=y.querySelector(`[data-field-custom-pattern]`)?.value??``,ie=y.querySelector(`[data-field-default]`)?.value??``,ae=y.querySelector(`[data-field-readonly]`)?.checked??!1,oe=y.querySelector(`[data-field-maxlength]`)?.value??``,se=oe.trim()===``?void 0:Number(oe),ce=y.querySelector(`[data-field-message]`)?.value??``,le=r!==t.type,ue=ee(e,t.id,{name:n,type:r,description:i,required:a,hidden:o,formula:s,options:c,unique:l,min:te,max:p,pattern:ne,customPattern:re,defaultValue:ie,readonly:ae,maxLength:se,customMessage:ce});le&&![`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(r)&&(ue=d(ue,t.id,r,c)),J(ue),I=`none`,L=le?`Updated ${n} and converted values to ${r}.`:`Updated ${n}.`,$()}function Rn(){let e=y.querySelector(`[data-replace-find]`)?.value??``,t=y.querySelector(`[data-replace-with]`)?.value??``,n=y.querySelector(`[data-replace-field]`)?.value??W().fields[0]?.id,r=y.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=y.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=w?G(W()).map(e=>e.id):void 0;q(`replace`);let o=He(W(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i});I=`none`,B=[],L=`Replaced ${o.count} value${o.count===1?``:`s`}.`,J(o.table)}function zn(){let e=y.querySelector(`[data-replace-find]`)?.value??``,t=y.querySelector(`[data-replace-with]`)?.value??``,n=y.querySelector(`[data-replace-field]`)?.value??W().fields[0]?.id,r=y.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=y.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=w?G(W()).map(e=>e.id):void 0;B=Ve(W(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i}),L=`Preview found ${B.length} change${B.length===1?``:`s`}.`,$()}function Bn(){let e=(y.querySelector(`[data-teacher-notes]`)?.value??``).split(`
`).map(e=>e.trim()).filter(Boolean);q(`teacher notes`),I=`none`,L=`Saved ${e.length} teacher note${e.length===1?``:`s`}.`,K({...b,updatedAt:new Date().toISOString(),teacher:{...b.teacher,notes:e}})}function Vn(e){let t=y.querySelector(e)?.value;if(!t)return null;let[n,r]=t.split(`:`);return n&&r?{tableId:n,fieldId:r}:null}function Hn(){let e=y.querySelector(`[data-relationship-from-table]`)?.value??``,t=y.querySelector(`[data-relationship-to-table]`)?.value??``,n=Vn(`[data-relationship-from-field]`),r=Vn(`[data-relationship-to-field]`),i=y.querySelector(`[data-relationship-name]`)?.value??``;if(!e||!t||!n||!r){L=`Choose both tables and both match fields.`,$();return}if(n.tableId!==e||r.tableId!==t){L=`Match fields must belong to the tables you chose.`,$();return}q(`relationship create`);let a=be(i,e,n.fieldId,t,r.fieldId);L=`Created relationship: ${a.name}.`,K(xe(b,a))}function Un(){mt=y.querySelector(`[data-relationship-from-table]`)?.value??mt,ht=y.querySelector(`[data-relationship-to-table]`)?.value??ht,$()}function Wn(e){return window.CSS&&typeof CSS.escape==`function`?CSS.escape(e):e.replace(/["\\]/g,`\\$&`)}function Gn(e,t){let n=y.querySelector(`.data-grid`);if(!n)return!1;let r=n.querySelector(`tr[data-record-row="${Wn(e)}"]`);if(!r)return!1;let i=r.querySelector(`.cell-input[data-field-id="${Wn(t)}"], .cell-checkbox[data-field-id="${Wn(t)}"]`);return i||=r.querySelector(`.cell-input, .cell-checkbox`),i?(i.focus(),i instanceof HTMLInputElement&&i.type!==`checkbox`&&i.select(),!0):!1}function Kn(e){q(`add record`);let t=l(W()),n=t.records.at(-1);n&&(S=n.id,pt={recordId:n.id,fieldId:e}),J(t)}function qn(e,t,n,r){let i=Array.from(y.querySelectorAll(`.data-grid tbody tr[data-record-row]`)),a=i.findIndex(t=>t.dataset.recordRow===e),o=Q(W()).map(e=>e.id),s=o.indexOf(t);if(a<0||s<0)return;let c=a+n,l=s+r;if(r>0&&l>=o.length?(l=0,c=a+1):r<0&&l<0&&(l=o.length-1,c=a-1),c>=i.length){Kn(o[l]??o[0]);return}c<0||Gn(i[c].dataset.recordRow??e,o[l]??t)}function Jn(){if(!j)return null;let e=G(W()).map(e=>e.id),t=Q(W()).map(e=>e.id),n=e.indexOf(j.anchor.r),r=e.indexOf(j.focus.r),i=t.indexOf(j.anchor.f),a=t.indexOf(j.focus.f);return n<0||r<0||i<0||a<0?null:{rows:e,cols:t,r1:Math.min(n,r),r2:Math.max(n,r),c1:Math.min(i,a),c2:Math.max(i,a)}}function Yn(){y.querySelectorAll(`.data-grid td.cell-range`).forEach(e=>e.classList.remove(`cell-range`));let e=Jn();if(e&&!((e.r2-e.r1+1)*(e.c2-e.c1+1)<=1))for(let t=e.r1;t<=e.r2;t+=1)for(let n=e.c1;n<=e.c2;n+=1)y.querySelector(`.data-grid [data-record-id="${Wn(e.rows[t])}"][data-field-id="${Wn(e.cols[n])}"]`)?.closest(`td`)?.classList.add(`cell-range`)}function Xn(e){if(!j)return;let t=G(W()).map(e=>e.id),n=Q(W()).map(e=>e.id),r=t.indexOf(j.focus.r),i=n.indexOf(j.focus.f);r<0||i<0||(e===`ArrowUp`?r=Math.max(0,r-1):e===`ArrowDown`?r=Math.min(t.length-1,r+1):e===`ArrowLeft`?i=Math.max(0,i-1):e===`ArrowRight`&&(i=Math.min(n.length-1,i+1)),j={anchor:j.anchor,focus:{r:t[r],f:n[i]}},Yn())}function Zn(){let e=Jn();if(!e||e.r2-e.r1===0&&e.c2-e.c1===0)return!1;let t=W(),n=new Map(t.records.map(e=>[e.id,e])),r=[];for(let i=e.r1;i<=e.r2;i+=1){let a=n.get(e.rows[i]);if(!a)continue;let o=[];for(let n=e.c1;n<=e.c2;n+=1)o.push(String(X(t,a,e.cols[n])??``).replace(/\t/g,` `).replace(/\n/g,` `));r.push(o.join(`	`))}let i=r.join(`
`);navigator.clipboard?.writeText(i).catch(()=>void 0);let a=(e.r2-e.r1+1)*(e.c2-e.c1+1),o=y.querySelector(`.status-bar span:nth-last-child(2)`);return o&&(o.textContent=`Copied ${a} cells.`),!0}function Qn(e,t,n){let i=W(),a=G(i),o=Q(i).map(e=>e.id),s=a.findIndex(e=>e.id===t),c=o.indexOf(n);if(s<0||c<0)return;let l=e.replace(/\r/g,``).replace(/\n$/,``).split(`
`).map(e=>e.split(`	`));q(`paste`);let d=new Map(i.records.map(e=>[e.id,e])),ee=i.records.map(e=>e.id),f=0;l.forEach((e,t)=>{let n;if(s+t<a.length)n=a[s+t].id;else{let e=r(i.fields);d.set(e.id,e),ee.push(e.id),n=e.id,f+=1}let l=d.get(n);if(!l)return;let te={...l.values};e.forEach((e,t)=>{let n=o[c+t],r=n?i.fields.find(e=>e.id===n):void 0;!r||[`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(r.type)||(te[r.id]=u(e,r.type,r.options).value)}),d.set(n,{...l,updatedAt:new Date().toISOString(),values:te})}),j=null,L=`Pasted ${l.length} row${l.length===1?``:`s`}${f?` (${f} new)`:``}.`,J({...i,records:ee.map(e=>d.get(e)).filter(Boolean)})}var $n=[{value:`contains`,label:`contains`,needsValue:!0,needsSecond:!1},{value:`equals`,label:`is exactly`,needsValue:!0,needsSecond:!1},{value:`startsWith`,label:`starts with`,needsValue:!0,needsSecond:!1},{value:`endsWith`,label:`ends with`,needsValue:!0,needsSecond:!1},{value:`greaterThan`,label:`greater than`,needsValue:!0,needsSecond:!1},{value:`lessThan`,label:`less than`,needsValue:!0,needsSecond:!1},{value:`between`,label:`between`,needsValue:!0,needsSecond:!0},{value:`isEmpty`,label:`is empty`,needsValue:!1,needsSecond:!1},{value:`isNotEmpty`,label:`is not empty`,needsValue:!1,needsSecond:!1}];function er(e){return W().fields.find(t=>t.id===e)?.name??`field`}function tr(e){return $n.find(t=>t.value===e)?.label??e}function nr(){let e=y.querySelector(`[data-find-match]`)?.value??`all`,t=[];y.querySelectorAll(`.find-rule`).forEach(e=>{let n=e.querySelector(`[data-find-field]`)?.value??``,r=e.querySelector(`[data-find-op]`)?.value??`contains`,i=e.querySelector(`[data-find-value]`)?.value??``,a=e.querySelector(`[data-find-value2]`)?.value??``;n&&t.push({fieldId:n,operator:r,value:i,value2:a})}),O={match:e,rules:t}}function rr(){nr(),D=O.rules.length?O:null,F=new Set,I=`none`;let e=G(W()).length;L=D?`Find is on: ${e} record${e===1?``:`s`} match.`:`Find cleared.`,$()}function ir(){let e=[];y.querySelectorAll(`.sort-level`).forEach(t=>{let n=t.querySelector(`[data-sort-level-field]`)?.value??``,r=t.querySelector(`[data-sort-level-dir]`)?.value??`asc`;n&&e.push({fieldId:n,direction:r})}),k=e}function ar(){ir(),E=k,I=`none`,L=E.length?`Sorting by ${E.map(e=>er(e.fieldId)).join(`, `)}.`:`Sort cleared.`,$()}function or(){return b.views??[]}function sr(){let e=y.querySelector(`[data-view-name]`)?.value.trim()||`View ${or().length+1}`,n={id:t(`view`),name:e,tableId:x,mode:C,search:w,searchFieldId:T,find:D,sortKeys:E};q(`save view`),L=`Saved view: ${e}.`,K({...b,updatedAt:new Date().toISOString(),views:[...or(),n]})}function cr(e){let t=or().find(t=>t.id===e);t&&(b.schema.tables.some(e=>e.id===t.tableId)&&(x=t.tableId,Tt(W())),C=t.mode,w=t.search,T=t.searchFieldId,D=t.find,E=t.sortKeys,F=new Set,I=`none`,L=`Opened view: ${t.name}.`,$())}function lr(e){q(`delete view`),L=`Deleted a saved view.`,K({...b,updatedAt:new Date().toISOString(),views:or().filter(t=>t.id!==e)})}function ur(e){let t=new Set(e.records.map(e=>e.id));return[...A].filter(e=>t.has(e))}function dr(){let e=W(),t=new Set(ur(e));if(t.size===0)return;let n=e.records.filter(e=>!t.has(e.id));if(n.length===0){L=`Keep at least one record. Some rows were not deleted.`,$();return}window.confirm(`Delete ${t.size} selected record${t.size===1?``:`s`}? You can undo right after.`)&&(q(`bulk delete`),A=new Set,L=`Deleted ${e.records.length-n.length} records.`,J({...e,records:n}))}function fr(){let e=W(),t=ur(e);if(t.length===0)return;q(`bulk duplicate`);let n=t.reduce((e,t)=>f(e,t),e);A=new Set,L=`Duplicated ${t.length} record${t.length===1?``:`s`}.`,J(n)}function pr(){let e=W(),t=new Set(ur(e)),n=y.querySelector(`[data-bulk-field]`)?.value??``,r=y.querySelector(`[data-bulk-value]`)?.value??``,i=e.fields.find(e=>e.id===n);if(!i||t.size===0){I=`none`,$();return}let a=u(r,i.type,i.options).value;q(`bulk fill`);let o=e.records.map(e=>t.has(e.id)?{...e,updatedAt:new Date().toISOString(),values:{...e.values,[n]:a}}:e);I=`none`,L=`Filled ${i.name} for ${t.size} record${t.size===1?``:`s`}.`,J({...e,records:o})}function mr(e){let t=e.filter(e=>e.trim()!==``);return t.length===0?`text`:t.every(e=>!Number.isNaN(Number(e.replace(/[$,%\s]/g,``))))?`number`:t.every(e=>!Number.isNaN(new Date(e).getTime())&&/\d/.test(e))?`date`:t.every(e=>/^(yes|no|true|false)$/i.test(e.trim()))?`checkbox`:`text`}function hr(){y.querySelectorAll(`.csv-map-row`).forEach((e,t)=>{P[t]&&(P[t].action=e.querySelector(`[data-map-action]`)?.value??`new`,P[t].type=e.querySelector(`[data-map-type]`)?.value??`text`,P[t].fieldId=e.querySelector(`[data-map-existing]`)?.value??``)})}y.addEventListener(`click`,e=>{let t=e.target,n=t.closest(`[data-action]`)?.dataset.action,r=t.closest(`[data-table-id]`)?.dataset.tableId,i=t.closest(`[data-template-id]`)?.dataset.templateId,s=t.closest(`[data-view-mode]`)?.dataset.viewMode,c=t.closest(`[data-select-record]`)?.dataset.selectRecord,u=t.closest(`[data-field-settings]`)?.dataset.fieldSettings,d=t.closest(`[data-record-action-id]`)?.dataset.recordActionId,ee=t.closest(`[data-quality-field-id]`);if(r){x=r,wt(),E=[],A=new Set,j=null,Tt(W()),$();return}if(i){Bt(i);return}if(s){C=s,$();return}if(c){S=c,C===`table`&&$();return}if(u){dt=u,tt=``,I=`field`,$();return}let p=t.closest(`[data-formula-insert]`)?.dataset.formulaInsert;if(p){let e=y.querySelector(`[data-field-formula]`);if(e){let t=e.selectionStart??e.value.length;e.value=e.value.slice(0,t)+p+e.value.slice(e.selectionEnd??t),e.focus()}return}if(ee){let e=ee.dataset.qualityFieldId,t=ee.dataset.qualityKind;if(e&&t){let n=t===`duplicates`?ze(W(),e):Be(W(),e);F=new Set(n.map(e=>e.id));let r=W().fields.find(t=>t.id===e);L=`Highlighted ${n.length} ${t===`duplicates`?`duplicate`:`missing`} record${n.length===1?``:`s`} in ${r?.name??`this field`}.`,I=`none`,$();return}}if(n)if(jt(),n===`new`){if(!window.confirm(`Start a new database? Your current one is replaced here — export it first if you want to keep a copy. You can also undo right after.`))return;q(`new database`);let e=a(`Untitled Database`);x=e.schema.tables[0].id,S=e.schema.tables[0].records[0]?.id??``,F=new Set,K(e)}else if(n===`save-json`)Nt();else if(n===`open-json`)y.querySelector(`[data-open-json]`)?.click();else if(n===`import-csv`)y.querySelector(`[data-import-csv]`)?.click();else if(n===`export-csv`)Pt();else if(n===`export-report`)Ft();else if(n===`project-packet`)It();else if(n===`print`)window.print();else if(n===`add-record`)q(`add record`),J(l(W()));else if(n===`add-field`){let e=y.querySelector(`[data-new-field]`),t=y.querySelector(`[data-new-field-type]`)?.value;q(`add field`),J(o(W(),e?.value||`New Field`,t??`text`))}else if(n===`add-table`){let e=window.prompt(`New table name?`,`New Table`)??``;q(`add table`);let t=re(b,e);x=t.schema.tables.at(-1)?.id??x,S=W().records[0]?.id??``,K(t)}else if(n===`duplicate-record`&&d)q(`duplicate record`),J(f(W(),d));else if(n===`delete-record`&&d){if(W().records.length<=1){L=`Keep at least one record. Add another before deleting this one.`,$();return}if(!window.confirm(`Delete this record? You can undo right after with Ctrl+Z.`))return;q(`delete record`),J(te(W(),d))}else if(n===`toggle-sort`){if(E.length)E=[{...E[0],direction:E[0].direction===`asc`?`desc`:`asc`},...E.slice(1)];else{let e=W().fields[0];e&&(E=[{fieldId:e.id,direction:`asc`}])}$()}else if(n===`sort`||n===`sort-dialog`)k=E.length?E.map(e=>({...e})):[{fieldId:W().fields[0]?.id??``,direction:`asc`}],I=`sort`,$();else if(n===`find`)O=D?{match:D.match,rules:D.rules.map(e=>({...e}))}:{match:`all`,rules:[{fieldId:W().fields[0]?.id??``,operator:`contains`,value:``}]},I=`find`,$();else if(n===`views`)I=`views`,$();else if(n===`sort-add-level`)ir(),k.push({fieldId:W().fields[0]?.id??``,direction:`asc`}),$();else if(n===`sort-remove-level`){ir();let e=Number(t.closest(`[data-level-index]`)?.dataset.levelIndex??`-1`);e>=0&&k.splice(e,1),$()}else if(n===`sort-toggle`){let e=t.closest(`[data-sort-toggle]`)?.dataset.sortToggle;if(e){let t=E.find(t=>t.fieldId===e);E=[{fieldId:e,direction:t&&t.direction===`asc`?`desc`:`asc`}],$()}}else if(n===`apply-sort`)ar();else if(n===`clear-sort`)ir(),k=[],$();else if(n===`find-add-rule`)nr(),O.rules.push({fieldId:W().fields[0]?.id??``,operator:`contains`,value:``}),$();else if(n===`find-remove-rule`){nr();let e=Number(t.closest(`[data-rule-index]`)?.dataset.ruleIndex??`-1`);e>=0&&O.rules.splice(e,1),$()}else if(n===`apply-find`)rr();else if(n===`save-view`)sr();else if(n===`apply-view`){let e=t.closest(`[data-view-id]`)?.dataset.viewId;e&&cr(e)}else if(n===`delete-view`){let e=t.closest(`[data-view-id]`)?.dataset.viewId;e&&lr(e)}else if(n===`bulk-delete`)dr();else if(n===`bulk-duplicate`)fr();else if(n===`bulk-fill`)ur(W()).length&&(I=`bulkFill`,$());else if(n===`apply-bulk-fill`)pr();else if(n===`bulk-clear`)A=new Set,$();else if(n===`expand-record`&&d)S=d,C=`form`,$();else if(n===`cal-prev`)hn(-1),$();else if(n===`cal-next`)hn(1),$();else if(n===`cal-today`)it=``,$();else if(n===`bulk-archive`||n===`bulk-restore`){let e=n===`bulk-archive`,t=new Set(ur(W()));if(t.size){q(e?`archive records`:`restore records`);let n=W();A=new Set,L=`${e?`Archived`:`Restored`} ${t.size} record${t.size===1?``:`s`}.`,J({...n,records:n.records.map(n=>t.has(n.id)?{...n,archived:e}:n)})}}else if(n===`toggle-archived`)M=!M,A=new Set,L=M?`Showing archived records.`:`Showing active records.`,$();else if(n===`rename-table`){let e=W(),t=window.prompt(`Rename table`,e.name);t&&t.trim()&&(q(`rename table`),K(ie(b,e.id,t)))}else if(n===`duplicate-table`){q(`duplicate table`);let e=ae(b,x);x=e.newTableId,wt(),E=[],A=new Set,L=`Duplicated the table.`,K(e.project)}else if(n===`move-table-left`||n===`move-table-right`)q(`move table`),K(oe(b,x,n===`move-table-left`?-1:1));else if(n===`delete-table`){if(b.schema.tables.length<=1){L=`A database needs at least one table.`,$();return}if(window.confirm(`Delete the table "${W().name}" and all its records? You can undo right after.`)){q(`delete table`);let e=se(b,x);x=e.schema.tables[0].id,wt(),E=[],A=new Set,L=`Deleted the table.`,K(e)}}else if(n===`structure-copy`)Nt(ce(b)),L=`Saved a structure-only copy (no records).`,$();else if(n===`highlight-invalid`){let e=qe(W());F=new Set(e.map(e=>e.record.id)),I=`none`,L=`Highlighted ${F.size} record${F.size===1?``:`s`} with rule problems.`,$()}else if(n===`duplicates`){let e=T===`all`?W().fields[0]?.id:T;F=new Set(ze(W(),e).map(e=>e.id)),L=`Found ${F.size} duplicate record${F.size===1?``:`s`}.`,$()}else if(n===`missing`){let e=T===`all`?W().fields[0]?.id:T;F=new Set(Be(W(),e).map(e=>e.id)),L=`Found ${F.size} record${F.size===1?``:`s`} with missing values.`,$()}else if(n===`clear-find`)wt(),L=`Showing all records.`,$();else if(n===`replace`)B=[],I=`replace`,$();else if(n===`preview-replace`)zn();else if(n===`run-replace`)Rn();else if(n===`save-teacher-notes`)Bn();else if(n===`apply-csv-new`)zt(`new`);else if(n===`apply-csv-append`)zt(`append`);else if(n===`save-field-settings`)q(`field settings`),Ln();else if(n===`layout-designer`||n===`lock-layout`)I=`layout`,$();else if(n===`layout-field-up`||n===`layout-field-down`){let e=t.closest(`[data-layout-field-id]`)?.dataset.layoutFieldId,r=Z();if(e&&r){let t=Wt(W()).map(e=>e.id),r=t.indexOf(e),i=n===`layout-field-up`?r-1:r+1;r>=0&&i>=0&&i<t.length&&([t[r],t[i]]=[t[i],t[r]],q(`layout order`),I=`layout`,Xt({fieldOrder:t}))}}else if(n===`save-layout-settings`){let e=y.querySelector(`[data-layout-locked]`)?.checked??!1,t=new Set([...y.querySelectorAll(`[data-layout-field-visible]:checked`)].map(e=>e.dataset.layoutFieldVisible??``)),n=Wt(W()).map(e=>e.id),r=n.filter(e=>!t.has(e));q(`layout settings`),I=`none`,Xt({locked:e,fieldOrder:n,hiddenFieldIds:r})}else n===`create-relationship`?Hn():n===`undo-change`?kt():n===`redo-change`?At():n===`close-dialog`?(I=`none`,B=[],V=null,$()):n.endsWith(`-view`)?(C=n.replace(`-view`,``),$()):n===`templates`?(L=`Template starters are in the Teacher panel.`,$()):n===`student-view`?(q(`student view toggle`),L=b.teacher.studentView?`Teacher tools are visible again.`:`Student view is on.`,K({...b,updatedAt:new Date().toISOString(),teacher:{...b.teacher,studentView:!b.teacher.studentView}})):n===`project-ideas`?(I=`projectIdeas`,$()):n===`relationships`?(I=`relationship`,$()):n===`charts`?(ct||=W().fields.find(e=>!e.hidden&&![`image`,`longText`,`calculation`].includes(e.type))?.id??``,I=`charts`,$()):n===`functions`?(I=`functions`,$()):n===`quality`?(I=`quality`,$()):n===`teacher-notes`?(I=`teacherNotes`,$()):n.startsWith(`help-`)?(I=`help`,$()):(L=`That ListSplatTM control is not available in this workspace.`,$())}),y.addEventListener(`change`,e=>{let t=e.target;if(t.matches(`#languageSwitcher`)&&t instanceof HTMLSelectElement){_t=vt(t.value);try{localStorage.setItem(Xe,_t)}catch{}$()}else if(t.matches(`[data-open-json]`)&&t instanceof HTMLInputElement&&t.files?.[0])Lt(t.files[0]);else if(t.matches(`[data-import-csv]`)&&t instanceof HTMLInputElement&&t.files?.[0])Rt(t.files[0]);else if(t.matches(`[data-search-field]`))T=t.value,F=new Set,$();else if(t.matches(`[data-sort-field]`)){let e=E[0]?.direction??`asc`;E=t.value?[{fieldId:t.value,direction:e}]:[],$()}else if(t.matches(`[data-group-field]`))N=t.value,$();else if(t.matches(`[data-board-field]`))nt=t.value,$();else if(t.matches(`[data-calendar-field]`))rt=t.value,$();else if(t.matches(`[data-wrap-toggle]`)&&t instanceof HTMLInputElement)at=t.checked,$();else if(t.matches(`[data-chart-type]`))st=t.value,$();else if(t.matches(`[data-chart-category]`))ct=t.value,$();else if(t.matches(`[data-chart-value-mode]`))lt=t.value,$();else if(t.matches(`[data-chart-value-field]`))ut=t.value,$();else if(t.matches(`[data-select-all]`)&&t instanceof HTMLInputElement){let e=G(W()).map(e=>e.id);A=t.checked?new Set(e):new Set,$()}else if(t.matches(`[data-select-row]`)&&t instanceof HTMLInputElement){let e=t.dataset.selectRow??``;t.checked?A.add(e):A.delete(e),$()}else if(t.matches(`[data-field-type]`))tt=t.value,$();else if(t.matches(`[data-find-op]`))nr(),$();else if(t.matches(`[data-map-action]`))hr(),$();else if(t.matches(`[data-relationship-from-table], [data-relationship-to-table]`))Un();else if(t.matches(`.multi-option`)&&t instanceof HTMLInputElement){let e=t.closest(`.multi-cell`),n=t.dataset.recordId,r=t.dataset.fieldId;if(e&&n&&r){let t=Array.from(e.querySelectorAll(`.multi-option:checked`)).map(e=>e.dataset.multiOption??``);Et(n,r),b=ne(b,p(W(),n,r,t.join(`, `))),ge(b),$()}}else if(t.matches(`.cell-input, .cell-checkbox, .image-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement))if(t instanceof HTMLInputElement&&t.type===`file`&&t.files?.[0]){let e=t.dataset.recordId,n=t.dataset.fieldId,r=t.files[0];e&&n&&In(e,n,r,`image upload`)}else t.dataset.recordId&&t.dataset.fieldId&&Et(t.dataset.recordId,t.dataset.fieldId),Pn(t)}),y.addEventListener(`paste`,e=>{let t=e.target,n=t.closest(`.image-cell`);if(n){let t=n.dataset.recordId,r=n.dataset.fieldId,i=Array.from(e.clipboardData?.items??[]).find(e=>e.type.startsWith(`image/`))?.getAsFile();t&&r&&i&&(e.preventDefault(),In(t,r,i,`image paste`));return}let r=t.closest(`.cell-input`);if(!r||!r.closest(`.data-grid`)||!r.dataset.recordId||!r.dataset.fieldId)return;let i=e.clipboardData?.getData(`text/plain`)??``;/[\t\n]/.test(i.replace(/\n$/,``))&&(e.preventDefault(),Qn(i,r.dataset.recordId,r.dataset.fieldId))}),y.addEventListener(`input`,e=>{let t=e.target;if(t.matches(`[data-project-title]`)){Mt(t.value);return}if(t.matches(`[data-search]`)){w=t.value,F=new Set,$();return}t.matches(`.cell-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)&&(t.dataset.recordId&&t.dataset.fieldId&&Et(t.dataset.recordId,t.dataset.fieldId),Pn(t))}),y.addEventListener(`focusout`,e=>{e.target.matches?.(`.cell-input, .cell-checkbox`)&&(ft=``)}),y.addEventListener(`mousedown`,e=>{let t=e.target.closest(`[data-record-id][data-field-id]`);if(!t||!t.closest(`.data-grid`)||!t.dataset.recordId||!t.dataset.fieldId)return;let n={r:t.dataset.recordId,f:t.dataset.fieldId};e.shiftKey&&j?(e.preventDefault(),j={anchor:j.anchor,focus:n}):j={anchor:n,focus:n},Yn()}),y.addEventListener(`pointerdown`,e=>{let t=e.target.closest(`[data-col-resize]`);if(!t)return;e.preventDefault(),e.stopPropagation();let n=t.dataset.colResize??``,r=t.closest(`th`);if(!r)return;r.setAttribute(`draggable`,`false`);let i=e.clientX,a=r.getBoundingClientRect().width,o=Math.round(a),s=e=>{o=Math.max(80,Math.round(a+(e.clientX-i))),r.style.width=`${o}px`,r.style.minWidth=`${o}px`},c=()=>{document.removeEventListener(`pointermove`,s),document.removeEventListener(`pointerup`,c),r.setAttribute(`draggable`,`true`);let e=Z();e&&(q(`resize column`),Xt({columnWidths:{...e.columnWidths??{},[n]:o}}))};document.addEventListener(`pointermove`,s),document.addEventListener(`pointerup`,c)});var gr=null;y.addEventListener(`dragstart`,e=>{let t=e.target,n=t.closest(`.kanban-card[data-kanban-card]`);if(n){ot=n.dataset.kanbanCard??null,e.dataTransfer?.setData(`text/plain`,ot??``);return}if(t.closest(`[data-col-resize]`))return;let r=t.closest(`.col-head[data-col-field]`);r&&(gr=r.dataset.colField??null,e.dataTransfer?.setData(`text/plain`,gr??``))}),y.addEventListener(`dragover`,e=>{let t=e.target;(gr&&t.closest(`.col-head[data-col-field]`)||ot&&t.closest(`.kanban-col`))&&e.preventDefault()}),y.addEventListener(`drop`,e=>{let t=e.target.closest(`.kanban-col`);if(t&&ot&&nt){e.preventDefault();let n=ot;ot=null;let r=t.dataset.kanbanCol??``;q(`move card`),b=ne(b,p(W(),n,nt,r)),ge(b),L=`Moved card to ${r||`Unassigned`}.`,$();return}let n=e.target.closest(`.col-head[data-col-field]`);if(!n||!gr)return;e.preventDefault();let r=n.dataset.colField??``,i=gr;if(gr=null,!r||r===i)return;let a=Wt(W()).map(e=>e.id),o=a.indexOf(i),s=a.indexOf(r);o<0||s<0||(a.splice(s,0,a.splice(o,1)[0]),q(`reorder columns`),Xt({fieldOrder:a}))}),y.addEventListener(`keydown`,e=>{let t=e.target;if(!t.matches?.(`.cell-input, .cell-checkbox`))return;let n=t.dataset.recordId,r=t.dataset.fieldId;if(!n||!r)return;let i=t instanceof HTMLTextAreaElement,a=t instanceof HTMLSelectElement;if(e.shiftKey&&[`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`].includes(e.key)&&!i&&!a){j||={anchor:{r:n,f:r},focus:{r:n,f:r}},e.preventDefault(),Xn(e.key);return}if(e.key===`Escape`&&j){j=null,Yn();return}switch(e.key){case`Enter`:i||(e.preventDefault(),qn(n,r,e.shiftKey?-1:1,0));break;case`ArrowDown`:!i&&!a&&(e.preventDefault(),qn(n,r,1,0));break;case`ArrowUp`:!i&&!a&&(e.preventDefault(),qn(n,r,-1,0));break;case`Tab`:e.preventDefault(),qn(n,r,0,e.shiftKey?-1:1);break;default:break}}),document.addEventListener(`keydown`,e=>{if(!(e.ctrlKey||e.metaKey))return;let t=e.key.toLowerCase();if(t===`c`){Zn()&&e.preventDefault();return}t===`z`&&!e.shiftKey?(e.preventDefault(),kt()):t===`y`||t===`z`&&e.shiftKey?(e.preventDefault(),At()):t===`s`&&(e.preventDefault(),Nt(),L=`Saved a .listsplat.json file to your downloads.`,$())}),document.addEventListener(`click`,e=>{e.target.closest(`.menu`)||jt()}),document.addEventListener(`toggle`,e=>{let t=e.target;!(t instanceof HTMLDetailsElement)||!t.matches(`.menu`)||!t.open||document.querySelectorAll(`.menu[open]`).forEach(e=>{e!==t&&(e.open=!1)})},!0),$();