(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={text:``,longText:``,number:0,currency:0,percent:0,date:``,time:``,dateTime:``,checkbox:!1,rating:0,choice:``,multiSelect:``,email:``,phone:``,image:``,file:``,audio:``,link:``,calculation:``,autoNumber:``,createdAt:``,updatedAt:``};function t(e){return`${e}_${Math.random().toString(36).slice(2,10)}`}function n(e,n=`text`){return{id:t(`field`),name:e,type:n,description:``,required:!1,hidden:!1,options:n===`choice`||n===`multiSelect`?[`Yes`,`No`]:void 0}}function r(n,r={}){let i=new Date().toISOString(),a=Object.fromEntries(n.map((t,n)=>t.type===`createdAt`||t.type===`updatedAt`?[t.id,r[t.id]??i]:t.type===`autoNumber`?[t.id,r[t.id]??n+1]:r[t.id]===void 0&&t.defaultValue!=null&&t.defaultValue!==``?[t.id,u(t.defaultValue,t.type,t.options).value]:[t.id,r[t.id]??e[t.type]]));return{id:t(`record`),createdAt:i,updatedAt:i,values:a}}function i(e,i){let a=i.map(e=>n(e));return{id:t(`table`),name:e,fields:a,records:[r(a)]}}function a(e=`Animal Research Database`){let n=new Date().toISOString(),a=i(`Animals`,[`Animal`,`Habitat`,`Diet`,`Interesting Fact`]);return a.records=[r(a.fields,{[a.fields[0].id]:`Axolotl`,[a.fields[1].id]:`Freshwater lakes`,[a.fields[2].id]:`Worms and insects`,[a.fields[3].id]:`It can regrow some body parts.`}),r(a.fields,{[a.fields[0].id]:`Red panda`,[a.fields[1].id]:`Mountain forests`,[a.fields[2].id]:`Bamboo and fruit`,[a.fields[3].id]:`It uses its tail like a blanket.`})],{app:`ListSplatTM`,version:1,createdAt:n,updatedAt:n,metadata:{title:e,author:``,className:``},schema:{tables:[a],relationships:[]},layouts:[{id:t(`layout`),name:`Table View`,tableId:a.id,mode:`table`,locked:!1},{id:t(`layout`),name:`Record Form`,tableId:a.id,mode:`form`,locked:!1},{id:t(`layout`),name:`Research Cards`,tableId:a.id,mode:`cards`,locked:!1}],teacher:{studentView:!1,notes:[`Ask students to add source notes before printing a report.`],rubric:[]}}}function o(t,r,i=`text`){let a=n(r.trim()||`New Field`,i);return{...t,fields:[...t.fields,a],records:t.records.map(t=>({...t,updatedAt:new Date().toISOString(),values:{...t.values,[a.id]:e[i]}}))}}function s(e,t){return e.records.reduce((e,n)=>{let r=Number(n.values[t]);return Number.isFinite(r)?Math.max(e,r):e},0)+1}function c(e){let t={};return e.fields.filter(e=>e.type===`autoNumber`).forEach(n=>{t[n.id]=s(e,n.id)}),t}function l(e){return{...e,records:[...e.records,r(e.fields,c(e))]}}function u(t,n,r){let i=t==null?``:String(t);if(i.trim()===``)return{value:e[n],lost:!1};switch(n){case`number`:case`currency`:case`percent`:case`rating`:{let t=Number(i.replace(/[$,%\s]/g,``));return Number.isFinite(t)?{value:n===`rating`?Math.max(0,Math.min(5,Math.round(t))):t,lost:!1}:{value:e[n],lost:!0}}case`checkbox`:{let e=i.trim().toLowerCase();return[`true`,`yes`,`1`,`y`,`checked`].includes(e)?{value:!0,lost:!1}:[`false`,`no`,`0`,`n`].includes(e)?{value:!1,lost:!1}:{value:!1,lost:!0}}case`choice`:{let e=r?.find(e=>e.toLowerCase()===i.trim().toLowerCase());return e?{value:e,lost:!1}:{value:``,lost:!!(r&&r.length)}}case`date`:{let e=new Date(i);return Number.isNaN(e.getTime())?{value:``,lost:!0}:{value:e.toISOString().slice(0,10),lost:!1}}case`text`:case`longText`:case`link`:return{value:i,lost:!1};default:return{value:i,lost:!1}}}function d(e,t,n,r){return{...e,records:e.records.map(e=>({...e,values:{...e.values,[t]:u(e.values[t],n,r).value}}))}}function f(e,t,n){return{...e,fields:e.fields.map(e=>e.id===t?{...e,...n}:e)}}function ee(e,t){let n=e.records.find(e=>e.id===t);return n?{...e,records:[...e.records,r(e.fields,{...n.values,...c(e)})]}:e}function te(e,t){return e.records.length<=1?e:{...e,records:e.records.filter(e=>e.id!==t)}}function p(e,t,n,r){let i=new Date().toISOString();return{...e,records:e.records.map(a=>a.id===t?{...a,updatedAt:i,values:Object.fromEntries(e.fields.map(e=>e.id===n?[e.id,r]:e.type===`updatedAt`?[e.id,i]:[e.id,a.values[e.id]]))}:a)}}function m(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t.id?t:e)}}}function ne(e,n){let r=i(n.trim()||`New Table`,[`Name`,`Notes`]);return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:[...e.schema.tables,r]},layouts:[...e.layouts,{id:t(`layout`),name:`${r.name} Table`,tableId:r.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${r.name} Form`,tableId:r.id,mode:`form`,locked:!1}]}}function re(e,t,n){let r=n.trim()||`Table`;return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t?{...e,name:r}:e)}}}function ie(e,n){let r=e.schema.tables.find(e=>e.id===n);if(!r)return{project:e,newTableId:n};let i=new Map(r.fields.map(e=>[e.id,t(`field`)])),a=r.fields.map(e=>({...e,id:i.get(e.id)})),o=r.records.map(e=>({id:t(`record`),createdAt:e.createdAt,updatedAt:e.updatedAt,values:Object.fromEntries(Object.entries(e.values).map(([e,t])=>[i.get(e)??e,t]))})),s={id:t(`table`),name:`${r.name} copy`,fields:a,records:o},c=e.schema.tables.findIndex(e=>e.id===n),l=[...e.schema.tables];return l.splice(c+1,0,s),{project:{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:l},layouts:[...e.layouts,{id:t(`layout`),name:`${s.name} Table`,tableId:s.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${s.name} Form`,tableId:s.id,mode:`form`,locked:!1}]},newTableId:s.id}}function ae(e,t,n){let r=[...e.schema.tables],i=r.findIndex(e=>e.id===t),a=i+n;return i<0||a<0||a>=r.length?e:([r[i],r[a]]=[r[a],r[i]],{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:r}})}function oe(e,t){return e.schema.tables.length<=1?e:{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.filter(e=>e.id!==t),relationships:e.schema.relationships.filter(e=>e.fromTableId!==t&&e.toTableId!==t)},layouts:e.layouts.filter(e=>e.tableId!==t),views:(e.views??[]).filter(e=>e.tableId!==t)}}function se(e){let t=new Date().toISOString();return{...e,createdAt:t,updatedAt:t,metadata:{...e.metadata,title:`${e.metadata.title} (template)`},schema:{...e.schema,tables:e.schema.tables.map(e=>({...e,records:[r(e.fields)]}))},views:[]}}function ce(e){if(!e||typeof e!=`object`)throw Error(`This is not a ListSplatTM project file.`);let t=e;if(t.app!==`ListSplatTM`||t.version!==1||!t.schema?.tables)throw Error(`This file is not a supported .listsplat.json project.`)}function le(e){let t=e.split(/\r?\n/,1)[0]??``,n=[`,`,`	`,`;`],r=`,`,i=-1;for(let e of n){let n=t.split(e).length-1;n>i&&(i=n,r=e)}return r}function ue(e,t=le(e)){let n=[],r=``,i=[],a=!1;for(let o=0;o<e.length;o+=1){let s=e[o],c=e[o+1];a&&s===`"`&&c===`"`?(r+=`"`,o+=1):s===`"`?a=!a:!a&&s===t?(i.push(r),r=``):!a&&(s===`
`||s===`\r`)?(s===`\r`&&c===`
`&&(o+=1),i.push(r),i.some(e=>e.length>0)&&n.push(i),i=[],r=``):r+=s}return i.push(r),i.some(e=>e.length>0)&&n.push(i),n}function de(e,t){let i=ue(t),a=(i[0]?.map((e,t)=>e.trim()||`Field ${t+1}`)??[`Field 1`]).map(e=>n(e)),o=i.slice(1).map(e=>r(a,Object.fromEntries(a.map((t,n)=>[t.id,e[n]??``]))));return{id:`table_${Date.now().toString(36)}`,name:e,fields:a,records:o.length>0?o:[r(a)]}}function fe(e){let t=e==null?``:String(e);return/[",\n\r]/.test(t)?`"${t.replaceAll(`"`,`""`)}"`:t}function pe(e){return[e.fields.map(e=>fe(e.name)).join(`,`),...e.records.map(t=>e.fields.map(e=>fe(t.values[e.id])).join(`,`))].join(`
`)}var me=`listsplat.autosave.v1`;function h(e){localStorage.setItem(me,JSON.stringify(e))}function he(){let e=localStorage.getItem(me);if(!e)return null;let t=JSON.parse(e);return ce(t),t}function ge(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,a.click(),URL.revokeObjectURL(i)}function _e(e){return e==null?``:String(e).trim().toLowerCase()}function ve(e,n,r,i,a){return{id:t(`relationship`),name:e.trim()||`New Relationship`,fromTableId:n,fromFieldId:r,toTableId:i,toFieldId:a}}function ye(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,relationships:[...e.schema.relationships,t]}}}function be(e,t,n,r){let i=_e(n.values[e.fromFieldId]);return!i||t.id!==e.fromTableId||r.id!==e.toTableId?[]:r.records.filter(t=>_e(t.values[e.toFieldId])===i)}function xe(e,t){let n=e.schema.tables.find(e=>e.id===t.fromTableId),r=e.schema.tables.find(e=>e.id===t.toTableId),i=n?.fields.find(e=>e.id===t.fromFieldId),a=r?.fields.find(e=>e.id===t.toFieldId);return`${n?.name??`Table`}:${i?.name??`Field`} -> ${r?.name??`Table`}:${a?.name??`Field`}`}function Se(e,t){return e.records.map(e=>Number(e.values[t])).filter(e=>Number.isFinite(e))}function Ce(e){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)).map(t=>{let n=Se(e,t.id),r=n.reduce((e,t)=>e+t,0);return{fieldId:t.id,fieldName:t.name,count:n.length,sum:r,average:n.length?r/n.length:0,minimum:n.length?Math.min(...n):0,maximum:n.length?Math.max(...n):0}})}function we(e){let t=[],n=``,r=!1,i=0;for(let a=0;a<e.length;a+=1){let o=e[a],s=e[a-1];if(o===`"`&&s!==`\\`){r=!r,n+=o;continue}if(!r&&o===`(`&&(i+=1),!r&&o===`)`&&--i,o===`,`&&!r&&i===0){t.push(n.trim()),n=``;continue}n+=o}return(n.trim()||e.endsWith(`,`))&&t.push(n.trim()),t}function Te(e){let t=e.trim();if(t.startsWith(`"`)&&t.endsWith(`"`))return t.slice(1,-1).replace(/\\"/g,`"`)}function Ee(e,t,n){let r=n.trim().toLowerCase(),i=e.fields.find(e=>e.name.toLowerCase()===r);return i?String(t.values[i.id]??``):``}function g(e,t,n){let r=n.trim();return/^[A-Z_]+\(.*\)$/i.test(r)?je(r,e,t):Te(n)??Ee(e,t,n)}function _(e,t,n){let r=Number(g(e,t,n));return Number.isFinite(r)?r:0}function De(e,t){let n=t.trim().toLowerCase(),r=e.fields.find(e=>e.name.toLowerCase()===n);return r?Se(e,r.id):[]}function v(e){return Number.isFinite(e)?String(Number(e.toFixed(8))):`Formula error: not a number`}function Oe(e){return e.toLowerCase().replace(/\b[a-z]/g,e=>e.toUpperCase())}function ke(e,t,n,r){if(!e)return[];let i=r.trim().toLowerCase(),a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===i),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0;return a&&o?be(a,t,n,o):[]}function Ae(e,t,n,r,i){if(!e)return``;let a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===r.trim().toLowerCase()),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0,s=ke(e,t,n,r)[0],c=o?.fields.find(e=>e.name.toLowerCase()===i.trim().toLowerCase());return s&&c?String(s.values[c.id]??``):``}function je(e,t,n,r){let i=e.trim();if(!i)return``;let a=i.match(/^([A-Z_]+)\((.*)\)$/i);if(!a)return`Formula error: use a function like FIELD(Name)`;let o=a[1].toUpperCase(),s=we(a[2]),c=s[0]??``;if(o===`FIELD`)return Ee(t,n,c);if(o===`JOIN`)return s.map(e=>g(t,n,e)).join(``);if(o===`UPPER`)return g(t,n,c).toUpperCase();if(o===`LOWER`)return g(t,n,c).toLowerCase();if(o===`TITLECASE`)return Oe(g(t,n,c));if(o===`TRIM`)return g(t,n,c).trim();if(o===`LENGTH`)return String(g(t,n,c).length);if(o===`CONTAINS`)return g(t,n,c).toLowerCase().includes(g(t,n,s[1]??``).toLowerCase())?`Yes`:`No`;if(o===`IF_EMPTY`)return g(t,n,c).trim()?g(t,n,c):g(t,n,s[1]??``);if(o===`LOOKUP`)return Ae(r,t,n,Te(c)??c,Te(s[1]??``)??s[1]??``);if(o===`COUNT_RELATED`)return String(ke(r,t,n,Te(c)??c).length);if(o===`ADD`)return v(s.reduce((e,r)=>e+_(t,n,r),0));if(o===`SUBTRACT`)return v(s.slice(1).reduce((e,r)=>e-_(t,n,r),_(t,n,c)));if(o===`MULTIPLY`)return v(s.reduce((e,r)=>e*_(t,n,r),1));if(o===`DIVIDE`){let e=_(t,n,s[1]??``);return e===0?`Formula error: divide by zero`:v(_(t,n,c)/e)}if(o===`ROUND`){let e=Math.max(0,Math.min(6,Math.round(_(t,n,s[1]??`"0"`))));return String(Number(_(t,n,c).toFixed(e)))}if([`SUM`,`AVERAGE`,`MIN`,`MAX`,`COUNT`].includes(o)){let e=De(t,c);return o===`SUM`?v(e.reduce((e,t)=>e+t,0)):o===`AVERAGE`?v(e.length?e.reduce((e,t)=>e+t,0)/e.length:0):o===`MIN`?v(e.length?Math.min(...e):0):o===`MAX`?v(e.length?Math.max(...e):0):String(e.length)}if(o===`COUNT_UNIQUE`){let e=c.trim().toLowerCase(),n=t.fields.find(t=>t.name.toLowerCase()===e);if(!n)return`0`;let r=new Set(t.records.map(e=>String(e.values[n.id]??``).trim().toLowerCase()).filter(Boolean));return String(r.size)}if(o===`PERCENT`){let e=_(t,n,s[1]??``);return e===0?`0`:v(_(t,n,c)/e*100)}if(o===`LEFT`)return g(t,n,c).slice(0,Math.max(0,_(t,n,s[1]??`"0"`)));if(o===`RIGHT`){let e=Math.max(0,_(t,n,s[1]??`"0"`)),r=g(t,n,c);return e===0?``:r.slice(-e)}if(o===`MID`){let e=Math.max(0,_(t,n,s[1]??`"1"`)-1),r=Math.max(0,_(t,n,s[2]??`"0"`));return g(t,n,c).slice(e,e+r)}if(o===`SUBSTITUTE`)return g(t,n,c).split(g(t,n,s[1]??``)).join(g(t,n,s[2]??``));let l=e=>{let r=g(t,n,e).trim().toLowerCase();return r!==``&&![`no`,`false`,`0`].includes(r)};if(o===`IS_EMPTY`)return g(t,n,c).trim()===``?`Yes`:`No`;if(o===`NOT`)return l(c)?`No`:`Yes`;if(o===`AND`)return s.every(l)?`Yes`:`No`;if(o===`OR`)return s.some(l)?`Yes`:`No`;if(o===`IF`)return l(c)?g(t,n,s[1]??``):g(t,n,s[2]??``);let u=e=>{let r=g(t,n,e).trim();if(!r)return null;let i=new Date(r.length<=10?`${r}T00:00:00`:r);return Number.isNaN(i.getTime())?null:i};if(o===`TODAY`)return new Date().toISOString().slice(0,10);if(o===`YEAR`||o===`MONTH`||o===`DAY`){let e=u(c);return e?String(o===`YEAR`?e.getFullYear():o===`MONTH`?e.getMonth()+1:e.getDate()):``}if(o===`DAYS_BETWEEN`||o===`YEARS_BETWEEN`){let e=u(c),t=s[1]?u(s[1]):new Date;if(!e||!t)return``;let n=Math.round((t.getTime()-e.getTime())/864e5);return String(o===`DAYS_BETWEEN`?n:Math.floor(n/365.25))}return`Formula error: ${o} is not supported`}function y(e){return e==null?``:String(e)}function Me(e,t){let n=t.query.trim();if(!n)return e.records;let r=n.toLowerCase();return e.records.filter(n=>(t.fieldId===`all`?e.fields.map(e=>e.id):[t.fieldId]).some(e=>y(n.values[e]).toLowerCase().includes(r)))}function Ne(e,t){let n=Number(e),r=Number(t);return e!==``&&t!==``&&!Number.isNaN(n)&&!Number.isNaN(r)?n-r:e.localeCompare(t,void 0,{numeric:!0,sensitivity:`base`})}function Pe(e,t){return t.length?[...e].sort((e,n)=>{for(let r of t){let t=y(e.values[r.fieldId]).trim(),i=y(n.values[r.fieldId]).trim();if(t===``&&i!==``)return 1;if(t!==``&&i===``)return-1;let a=Ne(t,i)*(r.direction===`asc`?1:-1);if(a!==0)return a}return 0}):e}function Fe(e,t){let n=y(e.values[t.fieldId]),r=n.trim().toLowerCase(),i=t.value.trim().toLowerCase(),a=Number(n),o=Number(t.value),s=n.trim()!==``&&t.value.trim()!==``&&!Number.isNaN(a)&&!Number.isNaN(o);switch(t.operator){case`contains`:return r.includes(i);case`equals`:return s?a===o:r===i;case`startsWith`:return r.startsWith(i);case`endsWith`:return r.endsWith(i);case`greaterThan`:return s?a>o:r>i;case`lessThan`:return s?a<o:r<i;case`between`:{let e=Number(t.value),n=Number(t.value2);return!Number.isNaN(e)&&!Number.isNaN(n)&&!Number.isNaN(a)?a>=Math.min(e,n)&&a<=Math.max(e,n):r>=i&&r<=(t.value2??``).trim().toLowerCase()}case`isEmpty`:return n.trim()===``;case`isNotEmpty`:return n.trim()!==``;default:return!0}}function Ie(e,t){return!t||t.rules.length===0?e:e.filter(e=>t.match===`all`?t.rules.every(t=>Fe(e,t)):t.rules.some(t=>Fe(e,t)))}function Le(e,t){let n=new Map;return e.records.forEach(e=>{let r=y(e.values[t]).trim().toLowerCase();r&&n.set(r,(n.get(r)??0)+1)}),e.records.filter(e=>{let r=y(e.values[t]).trim().toLowerCase();return r?(n.get(r)??0)>1:!1})}function Re(e,t){return e.records.filter(e=>!y(e.values[t]).trim())}function ze(e,t){if(!t.find)return[];let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=[];return e.records.forEach(e=>{o.has(e.id)&&t.fieldIds.forEach(n=>{let r=y(e.values[n]),i=r.replace(a,t.replacement);i!==r&&s.push({recordId:e.id,fieldId:n,before:r,after:i})})}),s}function Be(e,t){if(!t.find)return{table:e,count:0};let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=0,c=e.records.map(e=>{if(!o.has(e.id))return e;let n=!1,r={...e.values};return t.fieldIds.forEach(e=>{let i=y(r[e]),o=i.replace(a,()=>(s+=1,t.replacement));o!==i&&(n=!0,r[e]=o)}),n?{...e,updatedAt:new Date().toISOString(),values:r}:e});return{table:{...e,records:c},count:s}}var Ve={email:/^[^\s@]+@[^\s@]+\.[^\s@]+$/,url:/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/,phone:/^[+()\d][\d\s().-]{5,}$/};function He(e){return e==null?``:String(e)}function Ue(e,t,n,r){let i=We(e,t,n,r);return i&&e.customMessage?e.customMessage:i}function We(e,t,n,r){let i=He(t).trim();if(i===``)return e.required?`This field is required.`:``;if(e.maxLength&&i.length>e.maxLength)return`Keep this ${e.maxLength} characters or fewer.`;if(e.type===`email`&&!Ve.email.test(i))return`Enter a valid email address.`;if(e.type===`phone`&&!Ve.phone.test(i))return`Enter a valid phone number.`;if([`number`,`currency`,`percent`,`rating`].includes(e.type)){let t=Number(i);if(Number.isNaN(t))return`Enter a number.`;if(e.min!=null&&t<e.min)return`Must be at least ${e.min}.`;if(e.max!=null&&t>e.max)return`Must be at most ${e.max}.`}if([`text`,`longText`,`link`].includes(e.type)&&e.pattern&&e.pattern!==`none`){if(e.pattern===`custom`){if(e.customPattern)try{if(!new RegExp(e.customPattern).test(i))return`Does not match the required format.`}catch{}}else if(!Ve[e.pattern].test(i))return`Enter a valid ${e.pattern}.`}return e.unique&&n&&n.records.some(t=>t.id!==r&&He(t.values[e.id]).trim().toLowerCase()===i.toLowerCase())?`This value is already used in another record.`:``}function Ge(e){let t=[];return e.fields.forEach(n=>{[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(n.type)||e.records.forEach(r=>{let i=Ue(n,r.values[n.id],e,r.id);i&&t.push({record:r,field:n,message:i})})}),t}function Ke(e,t,n,r,i,a){return{id:e,title:t,gradeBand:n,goal:r,table:de(t,i),reflectionQuestions:a}}var qe=[Ke(`classroom-library`,`Classroom Library Catalog`,`Grades 3-8`,`Track books, genres, reading levels, and recommendations.`,`Title,Author,Genre,Pages,Who would enjoy it?
Charlotte's Web,E. B. White,Fiction,192,Readers who like animals
Hidden Figures,Margot Lee Shetterly,Biography,240,Readers who like history`,[`Which genre appears most often?`,`What book would you recommend first?`]),Ke(`science-observations`,`Science Observation Log`,`Grades 3-8`,`Collect observations over time and look for patterns.`,`Date,Object observed,Location,Measurement,Observation
2026-06-29,Bean plant,Window,8 cm,Two new leaves
2026-06-30,Bean plant,Window,8.5 cm,Stem leaned toward light`,[`What changed over time?`,`What might explain the pattern?`]),Ke(`state-facts`,`State Facts Database`,`Grades 4-8`,`Compare places using consistent fields.`,`State,Capital,Region,Population note,Interesting fact
Texas,Austin,South,Large population,Has many different ecosystems
New Mexico,Santa Fe,Southwest,Medium population,Capital is over 400 years old`,[`Which fields help compare states?`,`What new field would improve this database?`]),Ke(`book-reviews`,`Book Review Collection`,`Grades 3-8`,`Collect opinions and evidence from student reading.`,`Book,Reviewer,Rating,Favorite part,Would recommend?
Because of Winn-Dixie,Jordan,5,The friendship story,Yes
Wonder,Avery,4,The different points of view,Yes`,[`Which book has the strongest recommendation?`,`What evidence supports each rating?`]),Ke(`vocabulary-bank`,`Vocabulary Word Bank`,`Grades 2-8`,`Build a searchable word list with definitions and examples.`,`Word,Definition,Example sentence,Subject
evaporate,To change from liquid to gas,Water can evaporate in sunlight,Science
compare,To tell how things are alike,Compare two characters,Reading`,[`Which words belong to more than one subject?`,`Which examples help you remember the word?`]),Ke(`survey-results`,`Simple Survey Results`,`Grades 3-8`,`Organize survey answers and look for patterns.`,`Question,Answer,Student group,Count,Notes
Favorite recess activity,Soccer,Grade 4,12,Most common outdoor choice
Favorite recess activity,Drawing,Grade 4,6,Quiet activity choice`,[`Which answer appears most often?`,`What new question should the class ask next?`]),Ke(`museum-cards`,`Museum Exhibit Cards`,`Grades 4-8`,`Create printable exhibit cards for objects, images, or research topics.`,`Item,Creator or source,Year,Category,Why it matters
Printing press,Johannes Gutenberg,1440,Invention,Changed how books were made
Apollo 11 mission,NASA,1969,Space exploration,First humans walked on the Moon`,[`How should the exhibit be grouped?`,`What field would help visitors understand the item?`])];function Je(e){let t=e.table.fields.map(e=>({...e,id:`${e.id}_${Date.now().toString(36)}`})),n=e.table.records.map(n=>r(t,Object.fromEntries(e.table.fields.map((e,r)=>[t[r].id,n.values[e.id]??``]))));return{...e.table,id:`table_${e.id}_${Date.now().toString(36)}`,fields:t,records:n}}var Ye=`drawsplat.language`,Xe=[{code:`en`,label:`English`,dir:`ltr`,htmlLang:`en`},{code:`es`,label:`Español`,dir:`ltr`,htmlLang:`es`},{code:`vi`,label:`Tiếng Việt`,dir:`ltr`,htmlLang:`vi`},{code:`ar`,label:`العربية`,dir:`rtl`,htmlLang:`ar`},{code:`zh`,label:`中文`,dir:`ltr`,htmlLang:`zh`},{code:`uh`,label:`हिन्दी / اردو`,dir:`ltr`,htmlLang:`hi`}],Ze={es:{New:`Nuevo`,"Save JSON":`Guardar JSON`,"Open JSON":`Abrir JSON`,"Export CSV":`Exportar CSV`,File:`Archivo`,Edit:`Editar`,Data:`Datos`,Layout:`Diseño`,Tools:`Herramientas`,View:`Vista`,Teacher:`Docente`,Help:`Ayuda`,Title:`Título`,Search:`Buscar`,In:`En`,"All fields":`Todos los campos`,Sort:`Ordenar`,"Choose field":`Elegir campo`,"New field":`Campo nuevo`,"Field name":`Nombre del campo`,Type:`Tipo`,"Add field":`Agregar campo`,"Add record":`Agregar registro`,Table:`Tabla`,Form:`Formulario`,Cards:`Tarjetas`,Gallery:`Galería`,Labels:`Etiquetas`,Report:`Informe`,"Upload image":`Subir imagen`,"No image yet":`Sin imagen todavía`},vi:{New:`Mới`,"Save JSON":`Lưu JSON`,"Open JSON":`Mở JSON`,"Export CSV":`Xuất CSV`,File:`Tệp`,Edit:`Sửa`,Data:`Dữ liệu`,Layout:`Bố cục`,Tools:`Công cụ`,View:`Xem`,Teacher:`Giáo viên`,Help:`Trợ giúp`,Title:`Tiêu đề`,Search:`Tìm`,Sort:`Sắp xếp`,Table:`Bảng`,Form:`Biểu mẫu`,Cards:`Thẻ`,Gallery:`Thư viện ảnh`,Labels:`Nhãn`,Report:`Báo cáo`},ar:{New:`جديد`,"Save JSON":`حفظ JSON`,"Open JSON":`فتح JSON`,"Export CSV":`تصدير CSV`,File:`ملف`,Edit:`تحرير`,Data:`بيانات`,Layout:`تخطيط`,Tools:`أدوات`,View:`عرض`,Teacher:`المعلم`,Help:`مساعدة`,Title:`العنوان`,Search:`بحث`,Sort:`فرز`,Table:`جدول`,Form:`نموذج`,Cards:`بطاقات`,Gallery:`معرض`,Labels:`ملصقات`,Report:`تقرير`},zh:{New:`新建`,"Save JSON":`保存 JSON`,"Open JSON":`打开 JSON`,"Export CSV":`导出 CSV`,File:`文件`,Edit:`编辑`,Data:`数据`,Layout:`布局`,Tools:`工具`,View:`视图`,Teacher:`教师`,Help:`帮助`,Title:`标题`,Search:`搜索`,Sort:`排序`,Table:`表格`,Form:`表单`,Cards:`卡片`,Gallery:`图库`,Labels:`标签`,Report:`报告`},uh:{New:`नया`,File:`फ़ाइल`,Edit:`संपादन`,Data:`डेटा`,Layout:`लेआउट`,Tools:`औज़ार`,View:`दृश्य`,Teacher:`शिक्षक`,Help:`सहायता`,Search:`खोज`,Table:`तालिका`,Form:`फ़ॉर्म`,Cards:`कार्ड`,Gallery:`गैलरी`,Labels:`लेबल`,Report:`रिपोर्ट`}},Qe=document.querySelector(`#app`);if(!Qe)throw Error(`ListSplatTM app root was not found.`);var b=Qe,x=he()??a(),S=x.schema.tables[0].id,C=x.schema.tables[0].records[0]?.id??``,w=`table`,$e=`Saved locally`,T=``,E=`all`,D=[],O=null,k={match:`all`,rules:[]},A=[],et=``,j=new Set,M=null,tt=!1,nt=``,rt=``,it=``,at=``,ot=!1,st=null,ct=`bar`,lt=``,ut=`count`,dt=``,N=null,ft=null,pt=null,P=[],mt=``,F=`add`,I=new Set,L=`none`,ht=``,R=`Tip: Start with one table, then add relationships when your project needs them.`,z=[],B=[],gt=``,_t=null,V=[],vt=S,yt=x.schema.tables[1]?.id??S,H=null,bt=``,xt=Ct();function U(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function St(e){let t=(e||``).toLowerCase();return t.startsWith(`es`)?`es`:t.startsWith(`vi`)?`vi`:t.startsWith(`ar`)?`ar`:t.startsWith(`zh`)?`zh`:t===`uh`||t.startsWith(`ur`)||t.startsWith(`hi`)?`uh`:`en`}function Ct(){let e=new URLSearchParams(window.location.search);try{return St(e.get(`lang`)||localStorage.getItem(Ye)||navigator.language)}catch{return St(e.get(`lang`)||navigator.language)}}function wt(e){return Xe.map(({code:t,label:n})=>`<option value="${t}"${t===e?` selected`:``}>${n}</option>`).join(``)}function W(e){return xt===`en`?e:Ze[xt][e]??e}function Tt(){let e=Xe.find(e=>e.code===xt)??Xe[0];document.documentElement.lang=e.htmlLang,document.documentElement.dir=e.dir}function G(){return x.schema.tables.find(e=>e.id===S)??x.schema.tables[0]}function K(e){let t=Me(e,{query:T,fieldId:E});return t=t.filter(e=>tt?e.archived:!e.archived),t=Ie(t,O),I.size>0&&(t=t.filter(e=>I.has(e.id))),Pe(t,D.filter(t=>e.fields.some(e=>e.id===t.fieldId)))}function Et(e){return e.records.filter(e=>e.archived).length}function Dt(){return!!T||!!(O&&O.rules.length)||I.size>0}function Ot(){T=``,O=null,I=new Set}function kt(e){e.records.some(e=>e.id===C)||(C=e.records[0]?.id??``)}function q(e){x=e,kt(G()),h(x),$e=`Saved locally`,$()}function J(e){z=[{label:e,project:structuredClone(x)},...z].slice(0,25),B=[]}function At(e,t){let n=`${e}:${t}`;gt!==n&&(J(`edit ${G().fields.find(e=>e.id===t)?.name??`cell`}`),gt=n,jt())}function jt(){let e=b.querySelector(`[data-action="undo-change"]`),t=b.querySelector(`[data-action="redo-change"]`);e&&(e.disabled=z.length===0),t&&(t.disabled=B.length===0)}function Mt(e){x=e,S=x.schema.tables.some(e=>e.id===S)?S:x.schema.tables[0].id,kt(G()),h(x),$()}function Nt(){let e=z[0];if(!e){R=`Nothing to undo yet.`,$();return}B=[{label:e.label,project:structuredClone(x)},...B].slice(0,25),z=z.slice(1),R=`Undid ${e.label}.`,Mt(e.project)}function Pt(){let e=B[0];if(!e){R=`Nothing to redo.`,$();return}z=[{label:e.label,project:structuredClone(x)},...z].slice(0,25),B=B.slice(1),R=`Redid ${e.label}.`,Mt(e.project)}function Y(e){S=e.id,q(m(x,e))}function Ft(){document.querySelectorAll(`.menu[open]`).forEach(e=>{e.open=!1})}function It(e){q({...x,updatedAt:new Date().toISOString(),metadata:{...x.metadata,title:e||`Untitled Database`}})}function Lt(e=x){ge(`${e.metadata.title||`listsplat-project`}.listsplat.json`,JSON.stringify(e,null,2),`application/json`)}function Rt(){ge(`${G().name}.csv`,pe(G()),`text/csv;charset=utf-8`)}function zt(){let e=G(),t=e.fields.filter(e=>!e.hidden),n=K(e),r=t.map(e=>fe(e.name)).join(`,`),i=n.map(n=>t.map(t=>fe(Z(e,n,t.id))).join(`,`)).join(`
`);ge(`${e.name}-found.csv`,`${r}\n${i}`,`text/csv;charset=utf-8`),R=`Exported ${n.length} shown record${n.length===1?``:`s`} to CSV.`,$()}function Bt(){let e=G(),t=e.fields.filter(e=>!e.hidden),n=K(e),r=e=>String(e??``).replace(/\|/g,`\\|`).replace(/\n/g,` `),i=`| ${t.map(e=>r(e.name)).join(` | `)} |`,a=`| ${t.map(()=>`---`).join(` | `)} |`,o=n.map(n=>`| ${t.map(t=>r(Z(e,n,t.id))).join(` | `)} |`).join(`
`);ge(`${e.name}.md`,`# ${e.name}\n\n${i}\n${a}\n${o}\n`,`text/markdown;charset=utf-8`),R=`Exported a Markdown table.`,$()}function Vt(){let e=G(),t=K(e),n=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${U(x.metadata.title)}</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{color:#5b21b6}</style></head>
<body><h1>${U(x.metadata.title)}</h1><p>${U(e.name)} report from ListSplatTM.</p>
<table><thead><tr>${e.fields.map(e=>`<th>${U(e.name)}</th>`).join(``)}</tr></thead>
<tbody>${t.map(t=>`<tr>${e.fields.map(n=>`<td>${U(Z(e,t,n.id))}</td>`).join(``)}</tr>`).join(``)}</tbody></table></body></html>`;ge(`${x.metadata.title||`listsplat-report`}.html`,n,`text/html;charset=utf-8`)}function Ht(){let e=x.schema.tables.map(e=>{let t=en(e),n=t.reduce((e,t)=>e+t.missing,0),r=t.reduce((e,t)=>e+t.duplicates,0);return`
        <section>
          <h2>${U(e.name)}</h2>
          <p>${e.records.length} records, ${e.fields.length} fields, ${n} missing values, ${r} duplicate values.</p>
          <table>
            <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th><th>Missing</th><th>Duplicates</th></tr></thead>
            <tbody>${e.fields.map(e=>{let n=t.find(t=>t.field.id===e.id);return`<tr><td>${U(e.name)}</td><td>${U(e.type)}</td><td>${e.required?`Yes`:`No`}</td><td>${U(e.description)}</td><td>${n?.missing??0}</td><td>${n?.duplicates??0}</td></tr>`}).join(``)}</tbody>
          </table>
        </section>
      `}).join(``),t=x.schema.relationships.length?`<ul>${x.schema.relationships.map(e=>`<li>${U(e.name)}: ${U(xe(x,e))}</li>`).join(``)}</ul>`:`<p>No relationships have been created yet.</p>`,n=x.teacher.notes.length?`<ul>${x.teacher.notes.map(e=>`<li>${U(e)}</li>`).join(``)}</ul>`:`<p>No teacher notes yet.</p>`,r=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${U(x.metadata.title)} Project Packet</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937;line-height:1.5}h1,h2{color:#5b21b6}section{margin:0 0 28px}table{border-collapse:collapse;width:100%;margin-top:10px}th,td{border:1px solid #d8ccff;padding:8px;text-align:left;vertical-align:top}th{background:#f3edff;color:#4c1d95}.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.meta div{border:1px solid #d8ccff;border-radius:8px;padding:12px;background:#faf8ff}</style></head>
<body>
  <h1>${U(x.metadata.title||`ListSplat Project`)} Project Packet</h1>
  <div class="meta">
    <div><strong>Author</strong><br>${U(x.metadata.author||`Not set`)}</div>
    <div><strong>Class</strong><br>${U(x.metadata.className||`Not set`)}</div>
    <div><strong>Tables</strong><br>${x.schema.tables.length}</div>
    <div><strong>Relationships</strong><br>${x.schema.relationships.length}</div>
  </div>
  <section><h2>Teacher Notes</h2>${n}</section>
  <section><h2>Relationships</h2>${t}</section>
  ${e}
</body></html>`;ge(`${x.metadata.title||`listsplat`}-project-packet.html`,r,`text/html;charset=utf-8`)}function Ut(e){e.text().then(e=>{let t=JSON.parse(e);ce(t),S=t.schema.tables[0].id,C=t.schema.tables[0].records[0]?.id??``,q(t)}).catch(e=>{window.alert(e instanceof Error?e.message:`Could not open this ListSplatTM file.`)})}function Wt(e){e.text().then(t=>{let n=de(e.name.replace(/\.csv$/i,``),t);H=n,bt=e.name;let r=G();P=n.fields.map(e=>{let t=n.records.slice(0,12).map(t=>String(t.values[e.id]??``)),i=r.fields.find(t=>t.name.trim().toLowerCase()===e.name.trim().toLowerCase());return{header:e.name,action:i?`existing`:`new`,type:Or(t),fieldId:i?.id??``}}),mt=``,F=`add`,L=`csvImport`,R=`Previewing ${n.records.length} CSV record${n.records.length===1?``:`s`} from ${e.name}.`,$()})}function Gt(e){if(!H){L=`none`;return}kr();let i=H;if(J(`CSV import`),e===`new`){let e=P.filter(e=>e.action!==`skip`).map((e,t)=>{let r=i.fields[P.indexOf(e)];return{field:n(e.header||`Field ${t+1}`,e.type),sourceFieldId:r.id}}),a=i.records.map(t=>r(e.map(e=>e.field),Object.fromEntries(e.map(e=>[e.field.id,u(t.values[e.sourceFieldId],e.field.type).value])))),o={id:t(`table`),name:i.name,fields:e.map(e=>e.field),records:a.length?a:[r(e.map(e=>e.field))]};S=o.id,C=o.records[0]?.id??``,H=null,Ot(),D=[],j=new Set,L=`none`,R=`Imported ${o.records.length} records from ${bt}.`,q({...x,updatedAt:new Date().toISOString(),schema:{...x.schema,tables:[...x.schema.tables,o]},layouts:[...x.layouts,{id:t(`layout`),name:`${o.name} Table`,tableId:o.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${o.name} Form`,tableId:o.id,mode:`form`,locked:!1}]});return}let a=G();P.forEach((e,t)=>{if(e.action===`new`){let r=n(e.header||`Field ${t+1}`,e.type);a={...a,fields:[...a.fields,r]},e.fieldId=r.id}});let o=new Map(a.fields.map(e=>[e.id,e])),s=i.records.map(e=>r(a.fields,Object.fromEntries(P.filter(e=>e.action!==`skip`&&e.fieldId&&o.has(e.fieldId)).map((t,n)=>{let r=i.fields[P.indexOf(t)],a=o.get(t.fieldId);return[t.fieldId,u(e.values[r.id],a.type,a.options).value]}))));H=null,L=`none`;let c=mt&&o.has(mt)?mt:``;if(c&&F!==`add`){let e=e=>String(e.values[c]??``).trim().toLowerCase(),t=new Map(a.records.map(t=>[e(t),t.id])),n=[...a.records],r=0,i=0,o=0;s.forEach(a=>{let s=e(a),c=s?t.get(s):void 0;c&&F===`skip`?o+=1:c&&F===`update`?(n=n.map(e=>e.id===c?{...e,updatedAt:new Date().toISOString(),values:{...e.values,...a.values}}:e),i+=1):(n.push(a),s&&t.set(s,a.id),r+=1)}),R=`Import: ${r} added, ${i} updated, ${o} skipped.`,Y({...a,records:n});return}R=`Appended ${s.length} CSV record${s.length===1?``:`s`} to ${a.name}.`,Y({...a,records:[...a.records,...s]})}function Kt(e){let t=qe.find(t=>t.id===e);if(!t)return;let n=Je(t);J(`template load`),S=n.id,C=n.records[0]?.id??``,R=`Loaded ${t.title}.`,q({...x,metadata:{...x.metadata,title:t.title},schema:{...x.schema,tables:[...x.schema.tables,n]},teacher:{...x.teacher,notes:t.reflectionQuestions}})}function X(e,t){return`
    <details class="menu">
      <summary>${U(W(e))}</summary>
      <div class="menu-panel">
        ${t.map(([e,t])=>`<button type="button" data-action="${e}">${U(W(t))}</button>`).join(``)}
      </div>
    </details>
  `}function qt(e=`text`){return[[`text`,`Short text`],[`longText`,`Long text`],[`number`,`Number`],[`currency`,`Currency`],[`percent`,`Percent`],[`date`,`Date`],[`time`,`Time`],[`dateTime`,`Date and time`],[`checkbox`,`Checkbox`],[`rating`,`Rating`],[`choice`,`Single choice`],[`multiSelect`,`Multiple choice`],[`email`,`Email`],[`phone`,`Phone`],[`link`,`Web address`],[`image`,`Image`],[`file`,`File attachment`],[`audio`,`Audio recording`],[`calculation`,`Calculation`],[`autoNumber`,`Auto number`],[`createdAt`,`Created time`],[`updatedAt`,`Updated time`]].map(([t,n])=>`<option value="${t}" ${e===t?`selected`:``}>${n}</option>`).join(``)}function Z(e,t,n){let r=e.fields.find(e=>e.id===n);return r?.type===`calculation`&&r.formula?je(r.formula,e,t,x):t.values[n]??``}function Jt(e,t){if(t===``||t==null)return``;if(!e)return String(t);let n=typeof t==`number`?t:Number(t);return e.type===`currency`&&Number.isFinite(n)?n.toLocaleString(void 0,{style:`currency`,currency:`USD`}):e.type===`percent`&&Number.isFinite(n)?`${n.toLocaleString()}%`:e.type===`number`&&Number.isFinite(n)?n.toLocaleString():e.type===`checkbox`?t===!0||t===`true`?`Yes`:`No`:e.type===`file`?Wn(String(t??``))?.name??``:e.type===`audio`?t?`Audio recording`:``:String(t)}function Yt(){return x.layouts.find(e=>e.tableId===S&&e.mode===w)}function Xt(e){return!!e}function Q(e){let t=new Set(Yt()?.hiddenFieldIds??[]);return Zt(e).filter(e=>!t.has(e.id))}function Zt(e){let t=Yt()?.fieldOrder??e.fields.map(e=>e.id),n=new Map(e.fields.map(e=>[e.id,e]));return[...t.map(e=>n.get(e)).filter(Xt),...e.fields.filter(e=>!t.includes(e.id))].filter(e=>e&&!e.hidden)}function Qt(e){return e.fields.filter(e=>e.type===`calculation`)}function $t(e){return Qt(e).reduce((t,n)=>n.formula?t+e.records.filter(t=>String(je(n.formula??``,e,t,x)).startsWith(`Formula error:`)).length:t,0)}function en(e){return e.fields.filter(e=>!e.hidden&&![`image`,`autoNumber`,`createdAt`,`updatedAt`,`calculation`].includes(e.type)).map(t=>({field:t,missing:Re(e,t.id).length,duplicates:Le(e,t.id).length}))}function tn(e){return Q(e).filter(e=>e.type===`image`)}function nn(e){let t=String(e??``);return/^(data:|https?:|blob:)/i.test(t)?t:``}function rn(e,t){let n=tn(e)[0];return n?nn(Z(e,t,n.id)):``}function an(e){let t=Yt();t&&q({...x,updatedAt:new Date().toISOString(),layouts:x.layouts.map(n=>n.id===t.id?{...n,...e}:n)})}function on(e,t){let n=e.fields.find(e=>!e.hidden)??e.fields[0],r=n?Z(e,t,n.id):``;return String(r||`Untitled record`)}function sn(e,t,n,r){let i=e.fields.find(e=>e.id===n),a=Z(e,t,n),o=`aria-label="${U(i?.name??`Field`)}, record ${r+1}" data-record-id="${t.id}" data-field-id="${n}"`,s=i&&![`checkbox`,`image`,`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(i.type)?Ue(i,a,e,t.id):``,c=s?`cell-input cell-invalid`:`cell-input`,l=s?` title="${U(s)}"`:``,u=`${l}${i?.readonly?` readonly disabled`:``}${i?.maxLength?` maxlength="${i.maxLength}"`:``}`;if(i?.type===`checkbox`)return`<input class="cell-checkbox" type="checkbox" ${o} ${i.readonly?`disabled`:``} ${a===!0||a===`true`?`checked`:``}>`;if(i?.type===`multiSelect`){let e=i.options?.length?i.options:[`Yes`,`No`],r=new Set(String(a??``).split(`,`).map(e=>e.trim()).filter(Boolean));return`<div class="multi-cell${s?` cell-invalid`:``}" ${o}${s?` title="${U(s)}"`:``}>${e.map(e=>`<label class="multi-chip${r.has(e)?` on`:``}"><input type="checkbox" class="multi-option" data-record-id="${t.id}" data-field-id="${n}" data-multi-option="${U(e)}" ${r.has(e)?`checked`:``} ${i.readonly?`disabled`:``}>${U(e)}</label>`).join(``)}</div>`}if(i?.type===`time`)return`<input class="${c}" type="time" ${o}${u} value="${U(a)}">`;if(i?.type===`dateTime`)return`<input class="${c}" type="datetime-local" ${o}${u} value="${U(a)}">`;if(i?.type===`email`){let e=String(a??``);return`<div class="link-cell"><input class="${c}" type="email" ${o}${u} value="${U(e)}" placeholder="name@example.com">${e&&!s?`<a class="link-open" href="mailto:${U(e)}" title="Send email" aria-label="Send email">✉</a>`:``}</div>`}if(i?.type===`phone`)return`<input class="${c}" type="tel" ${o}${u} value="${U(a)}" placeholder="(555) 555-5555">`;if(i?.type===`link`){let e=String(a??``),t=/^https?:\/\//i.test(e)?e:e?`https://${e}`:``;return`<div class="link-cell"><input class="${c}" type="url" ${o}${u} value="${U(e)}" placeholder="https://…">${t?`<a class="link-open" href="${U(t)}" target="_blank" rel="noopener" title="Open link" aria-label="Open link">↗</a>`:``}</div>`}if(i?.type===`image`){let e=String(a??``),r=/^(data:|https?:|blob:)/i.test(e)?e:``;return`
      <div class="image-cell" tabindex="0" role="button" title="Click here and paste an image, or use Upload image." ${o}>
        ${r?`<img src="${U(r)}" alt="${U(i.description||i.name)}">`:`<span>${U(W(`No image yet`))}</span>`}
        <small>Paste, upload, or take a photo.</small>
        <div class="image-actions">
          <label class="image-upload-label">
            ${U(W(`Upload image`))}
            <input class="image-input" type="file" accept="image/*" ${o}>
          </label>
          <button type="button" class="button ghost" data-action="camera-capture" data-record-id="${t.id}" data-field-id="${n}">Take photo</button>
        </div>
      </div>
    `}if(i?.type===`file`){let e=Wn(String(a??``));return`
      <div class="file-cell" ${o}>
        ${e?`<a class="file-link" href="${U(e.url)}" download="${U(e.name)}">📎 ${U(e.name)}</a>`:`<span>No file yet</span>`}
        <label class="image-upload-label">${e?`Replace`:`Add file`}<input class="file-input" type="file" data-record-id="${t.id}" data-field-id="${n}"></label>
      </div>
    `}if(i?.type===`audio`){let e=String(a??``),r=/^(data:|https?:|blob:)/i.test(e)?e:``;return`
      <div class="audio-cell" data-record-id="${t.id}" data-field-id="${n}">
        ${r?`<audio class="no-advance" src="${U(r)}" controls preload="metadata"></audio>`:`<span>No recording</span>`}
        <button type="button" class="button ghost" data-action="record-audio" data-record-id="${t.id}" data-field-id="${n}">${r?`Re-record`:`● Record`}</button>
      </div>
    `}if(i?.type===`rating`)return`<input class="${c}" type="number" min="0" max="5" step="1" ${o}${u} value="${U(a)}">`;if(i?.type===`choice`){let e=i.options?.length?i.options:[`Yes`,`No`];return`<select class="${c}" ${o}${l}${i.readonly?` disabled`:``}><option value=""${a===``?` selected`:``}>—</option>${e.map(e=>`<option value="${U(e)}" ${String(a)===e?`selected`:``}>${U(e)}</option>`).join(``)}</select>`}if(i?.type===`autoNumber`||i?.type===`createdAt`||i?.type===`updatedAt`)return`<output class="calc-output">${U(a)}</output>`;if(i?.type===`longText`)return`<textarea class="${c}" ${o}${u}>${U(a)}</textarea>`;if(i?.type===`date`)return`<input class="${c}" type="date" ${o}${u} value="${U(a)}">`;if(i?.type===`number`||i?.type===`currency`||i?.type===`percent`){let e=i.type===`currency`?`<span class="cell-affix">$</span>`:``,t=i.type===`percent`?`<span class="cell-affix">%</span>`:``;return`<span class="num-cell">${e}<input class="${c}" type="number" step="any" ${o}${u} value="${U(a)}">${t}</span>`}return i?.type===`calculation`?`<output class="calc-output">${U(a)}</output>`:`<input class="${c}" ${o}${u} value="${U(a)}">`}function cn(e){return`
    <div class="table-tabs">
      ${x.schema.tables.map(t=>`<button type="button" class="table-tab ${t.id===e.id?`active`:``}" data-table-id="${t.id}">${U(t.name)}</button>`).join(``)}
    </div>
  `}function ln(e,t){if(t.length===0){let e=Dt();return`
      <div class="data-grid-wrap">
        <div class="empty-state">
          <h3>${U(W(e?`No records match your find`:`No records yet`))}</h3>
          <p>${U(W(e?`Try a different search, or show all records.`:`Add your first record to start building this database.`))}</p>
          <button type="button" class="button primary" data-action="${e?`clear-find`:`add-record`}">${e?U(W(`Show all records`)):`+ ${U(W(`Add first record`))}`}</button>
        </div>
      </div>
    `}let n=Q(e),r=t.length>0&&t.every(e=>j.has(e.id)),i=e=>{let t=D.find(t=>t.fieldId===e);return t?t.direction===`asc`?`▲`:`▼`:`⇅`},a=gn(e,t),o=n.length+3,s=(t,r)=>`
                <tr class="${t.id===C?`active-row`:``}${j.has(t.id)?` selected-row`:``}" data-record-row="${t.id}">
                  <td class="select-col"><input type="checkbox" data-select-row="${t.id}" aria-label="Select record ${r+1}" ${j.has(t.id)?`checked`:``}></td>
                  <td class="row-num-col"><button type="button" class="row-button" data-select-record="${t.id}">${r+1}</button></td>
                  ${n.map(n=>`<td style="${un(n.id)}">${sn(e,t,n.id,r)}</td>`).join(``)}
                  <td class="record-actions">
                    <button type="button" title="Open record" data-action="expand-record" data-record-action-id="${t.id}">Open</button>
                    <button type="button" data-action="duplicate-record" data-record-action-id="${t.id}">Copy</button>
                    <button type="button" data-action="delete-record" data-record-action-id="${t.id}">Delete</button>
                  </td>
                </tr>
              `,c=0,l=a.map(t=>(nt?`<tr class="group-row"><td colspan="${o}"><strong>${U(t.label)}</strong> <span>${t.records.length}${_n(e,t.records)?` · `+_n(e,t.records):``}</span></td></tr>`:``)+t.records.map(e=>s(e,c++)).join(``)).join(``);return`
    <div class="data-grid-wrap${ot?` wrap-cells`:``}">
      <table class="data-grid">
        <thead>
          <tr>
            <th class="select-col"><input type="checkbox" data-select-all aria-label="Select all records" ${r?`checked`:``}></th>
            <th class="row-num-col">#</th>
            ${n.map(e=>`
                  <th class="col-head" data-col-field="${e.id}" draggable="true" style="${un(e.id)}">
                    <button type="button" class="field-button" data-field-settings="${e.id}">
                      ${U(e.name)}${e.required?`<span class="req" title="Required field" aria-label="required">*</span>`:``}<br><small>${U(e.type)}</small>
                    </button>
                    <button type="button" class="col-sort" data-action="sort-toggle" data-sort-toggle="${e.id}" title="Sort by ${U(e.name)}">${i(e.id)}</button>
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
  `}function un(e){let t=Yt()?.columnWidths?.[e];return t?`width:${t}px;min-width:${t}px;`:``}function dn(e){let t=e.records.find(e=>e.id===C)??e.records[0];if(!t)return`<div class="empty-panel">Add a record to use form view.</div>`;let n=x.schema.relationships.filter(t=>t.fromTableId===e.id).map(n=>{let r=x.schema.tables.find(e=>e.id===n.toTableId),i=r?be(n,e,t,r):[];return`
        <section class="related-records">
          <h3>${U(n.name)}</h3>
          <p>${i.length} related record${i.length===1?``:`s`} from ${U(r?.name??`another table`)}</p>
          ${i.length?`<div class="related-grid">${i.slice(0,8).map(e=>`
                      <article class="related-card" data-action="open-related" data-rel-record="${e.id}" data-rel-table="${r.id}">
                        <strong>${U(on(r,e))}</strong>
                        ${r.fields.filter(e=>!e.hidden).slice(0,3).map(t=>`<span>${U(t.name)}: ${U(Z(r,e,t.id))}</span>`).join(``)}
                      </article>
                    `).join(``)}</div>`:`<p>No matches yet. Make sure the match fields use the same value.</p>`}
          <button type="button" class="button" data-action="add-related" data-rel-id="${n.id}">+ Add ${U(r?.name??`related`)} record</button>
        </section>
      `}).join(``);return`
    <div class="form-view">
      <div class="form-nav">
        ${e.records.map((e,n)=>`<button type="button" class="${e.id===t.id?`active`:``}" data-select-record="${e.id}">Record ${n+1}</button>`).join(``)}
      </div>
      <div class="record-form">
        ${Q(e).map((n,r)=>`
              <label>
                <span>${U(n.name)}</span>
                ${sn(e,t,n.id,r)}
                ${n.description?`<small>${U(n.description)}</small>`:``}
              </label>
            `).join(``)}
        ${n}
      </div>
    </div>
  `}function fn(e,t){let n=(t,n)=>{let r=Z(e,n,t.id);if(t.type===`image`){let e=nn(r);return`
        <figure class="card-image-field">
          ${e?`<img src="${U(e)}" alt="">`:`<span>No image yet</span>`}
          <figcaption>${U(t.name)}</figcaption>
        </figure>
      `}if(t.type===`link`&&String(r??``)){let e=String(r),n=/^https?:\/\//i.test(e)?e:`https://${e}`;return`<p><strong>${U(t.name)}</strong><a href="${U(n)}" target="_blank" rel="noopener">${U(e)}</a></p>`}return`<p><strong>${U(t.name)}</strong><span>${U(Jt(t,r))}</span></p>`};return`
    <div class="cards-view ${w===`gallery`?`gallery-view`:``}">
      ${t.map(t=>{let r=rn(e,t);return`
            <article class="record-card" data-select-record="${t.id}">
              ${w===`gallery`?`<div class="gallery-image">${r?`<img src="${U(r)}" alt="">`:`<span>Add an image field, then upload a picture.</span>`}</div>`:``}
              ${Q(e).filter(e=>w!==`gallery`||e.type!==`image`).slice(0,w===`gallery`?4:8).map(e=>n(e,t)).join(``)}
            </article>
          `}).join(``)}
    </div>
  `}function pn(e,t){return`
    <div class="labels-view">
      ${t.map(t=>`
            <article class="print-label">
              ${Q(e).slice(0,4).map(n=>`<p><strong>${U(n.name)}:</strong> ${U(Jt(n,Z(e,t,n.id)))}</p>`).join(``)}
            </article>
          `).join(``)}
    </div>
  `}function mn(e,t){let n=Ce(e);return`
    <div class="report-view">
      <header>
        <h2>${U(x.metadata.title)}</h2>
        <p>${U(e.name)} report. ${t.length} record${t.length===1?``:`s`} shown.</p>
      </header>
      ${ln(e,t)}
      ${n.length?`<section class="summary-strip">${n.map(e=>`<div><strong>${U(e.fieldName)}</strong><span>Sum ${e.sum.toLocaleString()} | Avg ${e.average.toFixed(2)}</span></div>`).join(``)}</section>`:`<p class="empty-panel">Add a number, currency, or percent field to see summaries.</p>`}
    </div>
  `}function hn(e,t,n){let r=new Set;return t.forEach(t=>{let i=String(Z(e,t,n)??``).trim();i&&r.add(i)}),[...r]}function gn(e,t){if(!nt||!e.fields.some(e=>e.id===nt))return[{key:``,label:``,records:t}];let n=new Map;return t.forEach(t=>{let r=String(Z(e,t,nt)??``).trim();n.has(r)||n.set(r,[]),n.get(r).push(t)}),[...n.entries()].sort((e,t)=>e[0].localeCompare(t[0],void 0,{numeric:!0})).map(([e,t])=>({key:e,label:e||`(empty)`,records:t}))}function _n(e,t){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)&&!e.hidden).slice(0,3).map(n=>{let r=t.map(t=>Number(Z(e,t,n.id))).filter(e=>Number.isFinite(e));if(!r.length)return``;let i=r.reduce((e,t)=>e+t,0);return`${U(n.name)}: sum ${i.toLocaleString()}, avg ${(i/r.length).toFixed(1)}`}).filter(Boolean).join(` · `)}function vn(e,t){return e.map(e=>`<option value="${e.id}" ${t===e.id?`selected`:``}>${U(e.name)}</option>`).join(``)}function yn(e){let t=[];if(w===`list`||w===`table`){let n=e.fields.filter(e=>!e.hidden&&![`image`,`longText`].includes(e.type));t.push(`<label>Group by <select data-group-field><option value="">No grouping</option>${vn(n,nt)}</select></label>`),t.push(`<label class="inline-check"><input type="checkbox" data-wrap-toggle ${ot?`checked`:``}> Wrap long text</label>`)}if(w===`kanban`){let n=e.fields.filter(e=>[`choice`,`text`].includes(e.type)&&!e.hidden);t.push(`<label>Columns by <select data-board-field><option value="">Choose a status or choice field</option>${vn(n,rt)}</select></label>`)}if(w===`calendar`){let n=e.fields.filter(e=>[`date`,`dateTime`,`createdAt`,`updatedAt`].includes(e.type)&&!e.hidden);t.push(`<label>Dates from <select data-calendar-field><option value="">Choose a date field</option>${vn(n,it)}</select></label>`)}return t.length?`<div class="view-controls">${t.join(``)}</div>`:``}function bn(e,t){let n=Q(e),r=n[0],i=n.find(e=>e.id!==r?.id&&![`image`].includes(e.type)),a=gn(e,t).map(t=>`
        ${nt?`<div class="group-head"><strong>${U(t.label)}</strong><span>${t.records.length}${_n(e,t.records)?` · `+_n(e,t.records):``}</span></div>`:``}
        ${t.records.map(t=>{let n=rn(e,t);return`
              <div class="list-row${t.id===C?` active`:``}">
                ${n?`<img class="list-thumb" src="${U(n)}" alt="">`:``}
                <div class="list-main">
                  <strong>${U(Z(e,t,r?.id??``)||`Untitled`)}</strong>
                  ${i?`<span>${U(Jt(i,Z(e,t,i.id)))}</span>`:``}
                </div>
                <button type="button" class="button ghost" data-action="expand-record" data-record-action-id="${t.id}">Open</button>
              </div>
            `}).join(``)}
      `).join(``);return`<div class="list-view${ot?` wrap-cells`:``}">${a||`<p class="empty-panel">No records to list.</p>`}</div>`}function xn(e,t){let n=e.fields.find(e=>e.id===rt);return n?`<div class="kanban">${[``,...(n.options&&n.options.length?n.options:hn(e,t,n.id)).filter(Boolean)].map(r=>{let i=t.filter(t=>String(Z(e,t,n.id)??``).trim()===r);return`
        <div class="kanban-col" data-kanban-col="${U(r)}">
          <div class="kanban-col-head"><strong>${U(r||`Unassigned`)}</strong><span>${i.length}</span></div>
          <div class="kanban-cards">
            ${i.map(t=>`
                  <div class="kanban-card" draggable="true" data-kanban-card="${t.id}" data-action="expand-record" data-record-action-id="${t.id}">
                    <strong>${U(on(e,t))}</strong>
                  </div>
                `).join(``)}
          </div>
        </div>
      `}).join(``)}</div>`:`<p class="empty-panel">Choose a status or choice field above to build a board with draggable cards.</p>`}function Sn(e,t){let n=e.fields.find(e=>e.id===it)??e.fields.find(e=>[`date`,`dateTime`,`createdAt`,`updatedAt`].includes(e.type)&&!e.hidden);if(!n)return`<p class="empty-panel">Add a date field, then choose it above to see records on a calendar.</p>`;let r=at?new Date(`${at}-01T00:00:00`):new Date,i=r.getFullYear(),a=r.getMonth(),o=`${i}-${String(a+1).padStart(2,`0`)}`,s=new Date(i,a,1),c=s.getDay(),l=new Date(i,a+1,0).getDate(),u=new Map;t.forEach(t=>{let r=String(Z(e,t,n.id)??``).slice(0,10);/^\d{4}-\d{2}-\d{2}$/.test(r)&&r.startsWith(o)&&(u.has(r)||u.set(r,[]),u.get(r).push(t))});let d=[];for(let e=0;e<c;e+=1)d.push(`<div class="cal-cell empty"></div>`);for(let t=1;t<=l;t+=1){let n=`${o}-${String(t).padStart(2,`0`)}`,r=u.get(n)??[];d.push(`
      <div class="cal-cell">
        <div class="cal-day">${t}</div>
        ${r.slice(0,4).map(t=>`<button type="button" class="cal-event" data-action="expand-record" data-record-action-id="${t.id}">${U(on(e,t))}</button>`).join(``)}
        ${r.length>4?`<span class="cal-more">+${r.length-4} more</span>`:``}
      </div>
    `)}return`
    <div class="calendar-view">
      <div class="cal-nav">
        <button type="button" class="button" data-action="cal-prev">‹</button>
        <strong>${U(s.toLocaleDateString(void 0,{month:`long`,year:`numeric`}))}</strong>
        <button type="button" class="button" data-action="cal-next">›</button>
        <button type="button" class="button ghost" data-action="cal-today">Today</button>
      </div>
      <div class="cal-grid">
        ${[`Sun`,`Mon`,`Tue`,`Wed`,`Thu`,`Fri`,`Sat`].map(e=>`<div class="cal-weekday">${e}</div>`).join(``)}
        ${d.join(``)}
      </div>
    </div>
  `}function Cn(e){let t=at?new Date(`${at}-01T00:00:00`):new Date;t.setMonth(t.getMonth()+e),at=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}`}function wn(e){let t=K(e),n={table:`Table: spreadsheet-like rows and columns for fast data entry.`,form:`Form: focus on one record at a time.`,cards:`Cards: compact text-first record cards for browsing.`,gallery:`Gallery: image-first cards for collections and exhibits.`,list:`List: compact rows grouped by a field.`,kanban:`Board: columns by status or category, drag cards to change them.`,calendar:`Calendar: records placed on a month grid by a date field.`,labels:`Labels: printable small cards or shelf labels.`,report:`Report: printable table with title and summaries.`},r=w===`form`?dn(e):w===`cards`||w===`gallery`?fn(e,t):w===`list`?bn(e,t):w===`kanban`?xn(e,t):w===`calendar`?Sn(e,t):w===`labels`?pn(e,t):w===`report`?mn(e,t):ln(e,t);return`
    <section class="database-panel" aria-label="Database table">
      ${cn(e)}
      <div class="view-tabs" role="group" aria-label="Layout modes">
        ${[`table`,`form`,`cards`,`gallery`,`list`,`kanban`,`calendar`,`labels`,`report`].map(e=>`<button type="button" class="${w===e?`active`:``}" data-view-mode="${e}" title="${U(n[e])}" aria-label="${U(n[e])}">${U(W(e===`kanban`?`Board`:e[0].toUpperCase()+e.slice(1)))}</button>`).join(``)}
      </div>
      ${yn(e)}
      ${Tn()}
      ${En(e)}
      ${r}
    </section>
  `}function Tn(){let e=[];if(tt&&e.push(`<button type="button" class="chip chip-button" data-action="toggle-archived" title="Back to active records">Archived view — click to exit</button>`),T&&e.push(`<span class="chip">Search: “${U(T)}”</span>`),O&&O.rules.length){let t=O.match===`all`?` AND `:` OR `,n=O.rules.map(e=>`${mr(e.fieldId)} ${hr(e.operator)}${e.operator===`isEmpty`||e.operator===`isNotEmpty`?``:` `+e.value}${e.operator===`between`?`–`+(e.value2??``):``}`).join(t);e.push(`<button type="button" class="chip chip-button" data-action="find" title="Edit find">Find: ${U(n)}</button>`)}return I.size&&e.push(`<span class="chip">${I.size} highlighted</span>`),D.filter(e=>G().fields.some(t=>t.id===e.fieldId)).forEach(t=>{e.push(`<button type="button" class="chip chip-button" data-action="sort-dialog" title="Edit sort">Sort: ${U(mr(t.fieldId))} ${t.direction===`asc`?`↑`:`↓`}</button>`)}),e.length?`<div class="filter-chips">${e.join(``)}${Dt()?`<button type="button" class="chip chip-clear" data-action="clear-find">Clear find</button>`:``}${D.length?`<button type="button" class="chip chip-clear" data-action="sort-dialog">Edit sort</button>`:``}</div>`:``}function En(e){let t=wr(e).length;return t===0||w===`form`?``:`
    <div class="bulk-bar" role="group" aria-label="Bulk actions">
      <strong>${t} selected</strong>
      <button type="button" class="button" data-action="bulk-fill">Fill a field…</button>
      <button type="button" class="button" data-action="bulk-duplicate">Duplicate</button>
      ${tt?`<button type="button" class="button" data-action="bulk-restore">Restore</button>`:`<button type="button" class="button" data-action="bulk-archive">Archive</button>`}
      <button type="button" class="button danger" data-action="bulk-delete">Delete</button>
      <button type="button" class="button ghost" data-action="bulk-clear">Clear selection</button>
    </div>
  `}function Dn(e){let t=Ce(e),n=e.records.find(e=>e.id===C)??e.records[0],r=n?x.schema.relationships.filter(t=>t.fromTableId===e.id).map(t=>{let r=x.schema.tables.find(e=>e.id===t.toTableId),i=r?be(t,e,n,r).length:0;return`
            <div class="template-card">
              <strong>${U(t.name)}</strong>
              <span>${i} related record${i===1?``:`s`}</span>
              <p>${U(xe(x,t))}</p>
            </div>
          `}).join(``):``;return`
    <aside class="teacher-panel" aria-label="Teacher tools and database stats">
      <h2>Database Check</h2>
      <div class="stat-grid">
        <div class="stat-card"><strong>${K(e).length}</strong> shown</div>
        <div class="stat-card"><strong>${e.records.length}</strong> records</div>
        <div class="stat-card"><strong>${e.fields.length}</strong> fields</div>
        <div class="stat-card"><strong>${x.schema.tables.length}</strong> tables</div>
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
      ${qe.map(e=>`
            <div class="template-card">
              <strong>${U(e.title)}</strong>
              <span>${U(e.gradeBand)}</span>
              <p>${U(e.goal)}</p>
              <button type="button" data-template-id="${e.id}">Use template</button>
            </div>
          `).join(``)}
    </aside>
  `}function On(){let e=x.schema.tables,t=x.schema.relationships,n=t=>e.find(e=>e.id===t)?.name??`table`,r=(t,n)=>e.find(e=>e.id===t)?.fields.find(e=>e.id===n)?.name??`field`,i=new Set(t.flatMap(e=>[e.fromTableId,e.toTableId]));return`<div class="rel-diagram"><div class="rel-boxes">${e.map(e=>`
        <div class="rel-box${e.id===S?` active`:``}${i.has(e.id)?` linked`:``}">
          <strong>${U(e.name)}</strong>
          <span>${e.records.length} record${e.records.length===1?``:`s`} · ${e.fields.length} field${e.fields.length===1?``:`s`}</span>
        </div>
      `).join(``)}</div><div class="rel-links">${t.length?t.map(e=>`
            <div class="rel-link">
              <span class="rel-badge">${U(n(e.fromTableId))}</span>
              <span class="rel-arrow">${U(r(e.fromTableId,e.fromFieldId))} <b>1 → &#8734;</b> ${U(r(e.toTableId,e.toFieldId))}</span>
              <span class="rel-badge">${U(n(e.toTableId))}</span>
            </div>
          `).join(``):`<p class="rel-empty">No links yet. Create one below to connect two tables.</p>`}</div></div>`}function kn(e){let t=[[`Combine text`,`JOIN(A, " ", B)`],[`Add`,`ADD(A, B)`],[`Multiply`,`MULTIPLY(A, B)`],[`Percent`,`PERCENT(A, B)`],[`If / then`,`IF(CONTAINS(A, "x"), "yes", "no")`],[`Sum column`,`SUM(A)`],[`Average`,`AVERAGE(A)`],[`Count`,`COUNT(A)`],[`Years since`,`YEARS_BETWEEN(A)`],[`Uppercase`,`UPPER(A)`]],n=e.fields.filter(e=>![`calculation`].includes(e.type)).slice(0,12);return`
    <div class="formula-builder">
      <div class="fb-row"><span>Functions</span>${t.map(([e,t])=>`<button type="button" class="fb-chip" data-formula-insert="${U(t)}">${U(e)}</button>`).join(``)}</div>
      <div class="fb-row"><span>Insert field</span>${n.map(e=>`<button type="button" class="fb-chip field" data-formula-insert="${U(e.name)}">${U(e.name)}</button>`).join(``)}</div>
    </div>
  `}function An(e,t){let n=[`number`,`currency`,`percent`,`rating`].includes(t),r=[`text`,`longText`,`link`].includes(t),i=[`text`,`longText`,`email`,`phone`,`link`].includes(t);return[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(t)?``:`
    <fieldset class="constraints">
      <legend>Rules and default</legend>
      <label class="check-row"><input type="checkbox" data-field-unique ${e.unique?`checked`:``}> No duplicate values (unique)</label>
      <label class="check-row"><input type="checkbox" data-field-readonly ${e.readonly?`checked`:``}> Read-only (students cannot change it)</label>
      ${n?`<div class="grid-two">
              <label>Minimum <input data-field-min type="number" step="any" value="${e.min==null?``:U(String(e.min))}"></label>
              <label>Maximum <input data-field-max type="number" step="any" value="${e.max==null?``:U(String(e.max))}"></label>
            </div>`:``}
      ${i?`<label>Character limit <input data-field-maxlength type="number" min="1" value="${e.maxLength==null?``:U(String(e.maxLength))}" placeholder="no limit"></label>`:``}
      ${r?`<label>Format <select data-field-pattern>${[`none`,`email`,`url`,`phone`,`custom`].map(t=>`<option value="${t}" ${(e.pattern??`none`)===t?`selected`:``}>${t}</option>`).join(``)}</select></label>
            <label>Custom pattern (advanced) <input data-field-custom-pattern value="${U(e.customPattern??``)}" placeholder="regular expression"></label>`:``}
      <label>Default value for new records <input data-field-default value="${U(e.defaultValue??``)}" placeholder="optional"></label>
      <label>Custom message when a value breaks a rule <input data-field-message value="${U(e.customMessage??``)}" placeholder="optional friendly message"></label>
    </fieldset>
  `}function jn(e,t,n){if(n===t.type||[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(n))return``;let r=(b.querySelector(`[data-field-options]`)?.value??t.options?.join(`, `)??``).split(`,`).map(e=>e.trim()).filter(Boolean),i=e.records.filter(e=>String(e.values[t.id]??``).trim()!==``).slice(0,4).map(e=>{let i=String(e.values[t.id]??``),a=u(e.values[t.id],n,r),o=a.value===!0?`Yes`:a.value===!1?`No`:String(a.value??``);return`<li><span>${U(i)}</span> → <span class="${a.lost?`preview-lost`:``}">${a.lost?`cleared`:U(o||`(empty)`)}</span></li>`}),a=e.records.filter(e=>String(e.values[t.id]??``).trim()===``?!1:u(e.values[t.id],n,r).lost).length;return`
    <div class="type-preview">
      <strong>Change ${U(t.type)} → ${U(n)}</strong>
      ${i.length?`<ul>${i.join(``)}</ul>`:`<p>No values to convert yet.</p>`}
      ${a?`<p class="preview-warn">${a} value${a===1?``:`s`} cannot convert and will be cleared.</p>`:`<p>All values convert cleanly.</p>`}
    </div>
  `}function Mn(e){let t=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${U(e.name)}</option>`).join(``),n=k.rules.map((e,n)=>{let r=pr.find(t=>t.value===e.operator)??pr[0];return`
        <div class="find-rule" data-rule-index="${n}">
          <select data-find-field aria-label="Field">${t(e.fieldId)}</select>
          <select data-find-op aria-label="Condition">${pr.map(t=>`<option value="${t.value}" ${t.value===e.operator?`selected`:``}>${U(t.label)}</option>`).join(``)}</select>
          <input data-find-value type="text" value="${U(e.value)}" placeholder="value" ${r.needsValue?``:`hidden`}>
          <input data-find-value2 type="text" value="${U(e.value2??``)}" placeholder="and" ${r.needsSecond?``:`hidden`}>
          <button type="button" class="button ghost" data-action="find-remove-rule">Remove</button>
        </div>
      `}).join(``);return`
    <div class="modal-backdrop">
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Advanced find">
        <h2>Find records</h2>
        <label>Match <select data-find-match>
          <option value="all" ${k.match===`all`?`selected`:``}>all conditions (AND)</option>
          <option value="any" ${k.match===`any`?`selected`:``}>any condition (OR)</option>
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
  `}function Nn(e){let t=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${U(e.name)}</option>`).join(``);return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Sort records">
        <h2>Sort records</h2>
        <div class="sort-levels">${A.map((e,n)=>`
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
  `}function Pn(){let e=br();return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Saved views">
        <h2>Saved views</h2>
        <p>A view remembers the current table, layout, search, find, and sort. Save it, then reopen it any time.</p>
        <div class="saved-views">
          ${e.length?e.map(e=>`
                      <div class="saved-view" data-view-id="${e.id}">
                        <div><strong>${U(e.name)}</strong><span>${U(e.mode)}${e.sortKeys.length?` · sorted`:``}${e.find&&e.find.rules.length?` · found`:``}</span></div>
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
  `}function Fn(e){let t=wr(e).length;return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Fill a field">
        <h2>Fill a field</h2>
        <p>Set the same value in ${t} selected record${t===1?``:`s`}.</p>
        <label>Field <select data-bulk-field>${e.fields.filter(e=>![`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(e.type)).map(e=>`<option value="${e.id}">${U(e.name)}</option>`).join(``)}</select></label>
        <label>Value <input data-bulk-value type="text" placeholder="value to fill in"></label>
        <div class="modal-actions">
          <button type="button" class="button primary" data-action="apply-bulk-fill">Fill selected</button>
          <button type="button" data-action="close-dialog">Cancel</button>
        </div>
      </section>
    </div>
  `}function In(e){let t=e.fields.find(e=>e.id===lt);if(!t)return[];let n=K(e),r=new Map;return n.forEach(n=>{let i=String(Z(e,n,t.id)??``).trim()||`(empty)`,a=1;if(ut===`sum`&&dt){let t=Number(Z(e,n,dt));a=Number.isFinite(t)?t:0}r.set(i,(r.get(i)??0)+a)}),[...r.entries()].map(([e,t])=>({label:e,value:t})).slice(0,24)}var Ln=[`#7c3aed`,`#0ea5e9`,`#16a34a`,`#f59e0b`,`#dc2626`,`#9333ea`,`#0891b2`,`#65a30d`,`#ea580c`,`#db2777`];function Rn(e){if(!e.length)return`<p class="empty-panel">Choose a category field to build a chart.</p>`;let t=Math.max(...e.map(e=>e.value),1),n=e.reduce((e,t)=>e+t.value,0)||1;if(ct===`pie`){let t=-Math.PI/2;return`<svg viewBox="0 0 300 260" class="chart-svg" role="img" aria-label="Pie chart">${e.map((e,r)=>{let i=e.value/n*Math.PI*2,a=150+110*Math.cos(t),o=130+110*Math.sin(t);t+=i;let s=150+110*Math.cos(t),c=130+110*Math.sin(t),l=+(i>Math.PI);return`<path d="M150 130 L${a.toFixed(1)} ${o.toFixed(1)} A110 110 0 ${l} 1 ${s.toFixed(1)} ${c.toFixed(1)} Z" fill="${Ln[r%Ln.length]}"></path>`}).join(``)}</svg>`}let r=460/e.length;return ct===`line`?`<svg viewBox="0 0 520 260" class="chart-svg" role="img" aria-label="Line chart">
      <polyline fill="none" stroke="#7c3aed" stroke-width="3" points="${e.map((e,n)=>{let i=30+r*n+r/2,a=230-e.value/t*200;return`${i.toFixed(1)},${a.toFixed(1)}`}).join(` `)}"></polyline>
      ${e.map((e,n)=>{let i=30+r*n+r/2,a=230-e.value/t*200;return`<circle cx="${i.toFixed(1)}" cy="${a.toFixed(1)}" r="4" fill="#5b21b6"></circle>`}).join(``)}
    </svg>`:`<svg viewBox="0 0 520 260" class="chart-svg" role="img" aria-label="Bar chart">${e.map((e,n)=>{let i=30+r*n+4,a=e.value/t*200,o=230-a;return`<rect x="${i.toFixed(1)}" y="${o.toFixed(1)}" width="${(r-8).toFixed(1)}" height="${a.toFixed(1)}" rx="4" fill="${Ln[n%Ln.length]}"></rect>`}).join(``)}<line x1="30" y1="230" x2="490" y2="230" stroke="#d8d2ff"></line></svg>`}function zn(e){let t=e.fields.filter(e=>!e.hidden&&![`image`,`longText`,`calculation`].includes(e.type)),n=e.fields.filter(e=>[`number`,`currency`,`percent`,`rating`].includes(e.type)),r=In(e);return`
    <div class="modal-backdrop">
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Charts">
        <h2>Charts</h2>
        <p>Charts use the records currently shown (${K(e).length}). Change filters to focus a chart.</p>
        <div class="chart-controls">
          <label>Type <select data-chart-type>${[`bar`,`pie`,`line`].map(e=>`<option value="${e}" ${ct===e?`selected`:``}>${e}</option>`).join(``)}</select></label>
          <label>Category <select data-chart-category><option value="">Choose a field</option>${t.map(e=>`<option value="${e.id}" ${lt===e.id?`selected`:``}>${U(e.name)}</option>`).join(``)}</select></label>
          <label>Measure <select data-chart-value-mode><option value="count" ${ut===`count`?`selected`:``}>count records</option><option value="sum" ${ut===`sum`?`selected`:``}>sum a number</option></select></label>
          ${ut===`sum`?`<label>Number field <select data-chart-value-field><option value="">Choose</option>${n.map(e=>`<option value="${e.id}" ${dt===e.id?`selected`:``}>${U(e.name)}</option>`).join(``)}</select></label>`:``}
        </div>
        <div class="chart-area">${Rn(r)}</div>
        ${r.length?`<table class="chart-table"><caption class="sr-only">Chart data</caption><thead><tr><th>Category</th><th>Value</th></tr></thead><tbody>${r.map(e=>`<tr><td>${U(e.label)}</td><td>${e.value.toLocaleString()}</td></tr>`).join(``)}</tbody></table>`:``}
        <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
      </section>
    </div>
  `}function Bn(e){if(L===`none`)return``;if(L===`find`)return Mn(e);if(L===`sort`)return Nn(e);if(L===`views`)return Pn();if(L===`bulkFill`)return Fn(e);if(L===`charts`)return zn(e);if(L===`camera`)return`
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
    `;if(L===`replace`){let t=V.slice(0,8);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Replace values">
          <h2>Replace values</h2>
          <label>Find <input data-replace-find placeholder="Text to find"></label>
          <label>Replace with <input data-replace-with placeholder="New text"></label>
          <label>Field <select data-replace-field>${e.fields.map(e=>`<option value="${e.id}">${U(e.name)}</option>`).join(``)}</select></label>
          <label class="check-row"><input type="checkbox" data-replace-case-sensitive> Case-sensitive</label>
          <label class="check-row"><input type="checkbox" data-replace-whole-word> Whole word only</label>
          <p>Replacement applies to the current found set when search is active. Preview first, then apply. The last replace can be undone from Edit.</p>
          ${V.length?`<div class="replace-preview"><strong>${V.length} change${V.length===1?``:`s`} ready</strong>${t.map(t=>{let n=e.records.find(e=>e.id===t.recordId),r=e.fields.find(e=>e.id===t.fieldId);return`<p><span>${U(n?on(e,n):`Record`)} / ${U(r?.name??`Field`)}</span><del>${U(t.before)}</del><ins>${U(t.after)}</ins></p>`}).join(``)}</div>`:``}
          <div class="modal-actions">
            <button type="button" data-action="preview-replace">Preview</button>
            <button type="button" data-action="run-replace" ${V.length?``:`disabled`}>Apply Replace</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(L===`field`){let t=e.fields.find(e=>e.id===ht)??e.fields[0],n=et||t.type;return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Field settings">
          <h2>Field settings</h2>
          <label>Name <input data-field-name value="${U(t.name)}"></label>
          <label>Type <select data-field-type>${qt(n)}</select></label>
          ${jn(e,t,n)}
          <label>Description <textarea data-field-description>${U(t.description)}</textarea></label>
          <label>Choice options <input data-field-options value="${U(t.options?.join(`, `)??``)}" placeholder="Yes, No, Maybe"></label>
          <label class="check-row"><input type="checkbox" data-field-required ${t.required?`checked`:``}> Required field</label>
          <label class="check-row"><input type="checkbox" data-field-hidden ${t.hidden?`checked`:``}> Hide field</label>
          ${An(t,n)}
          <label>Calculation formula <input data-field-formula value="${U(t.formula??``)}" placeholder='JOIN(First Name, " ", Last Name)'></label>
          ${n===`calculation`?kn(e):``}
          <p>Try <code>FIELD(Animal)</code>, <code>JOIN(Animal, " lives in ", Habitat)</code>, <code>UPPER(Animal)</code>, <code>ADD(Score, Bonus)</code>, <code>AVERAGE(Score)</code>, or <code>LOOKUP("Book reviews", Rating)</code>.</p>
          <div class="modal-actions">
            <button type="button" data-action="save-field-settings">Save field</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(L===`layout`){let t=Yt(),n=Zt(e),r=new Set(t?.hiddenFieldIds??[]);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Layout designer">
          <h2>Layout designer</h2>
          <p>Arrange and choose fields for the current ${U(w)} view. Locked layouts can still be viewed, but students should not change them.</p>
          <label class="check-row"><input type="checkbox" data-layout-locked ${t?.locked?`checked`:``}> Lock this layout</label>
          <div class="layout-field-list">
            ${n.map((e,t)=>`
                  <div class="layout-field-row">
                    <label class="check-row"><input type="checkbox" data-layout-field-visible="${e.id}" ${r.has(e.id)?``:`checked`}> <strong>${U(e.name)}</strong></label>
                    <span>${U(e.type)}</span>
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
    `}if(L===`csvImport`&&H){let t=H.records.slice(0,4),n=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${U(e.name)}</option>`).join(``),r=P.map((e,t)=>`
          <div class="csv-map-row" data-map-index="${t}">
            <span class="csv-map-header">${U(e.header||`Column ${t+1}`)}</span>
            <select data-map-action aria-label="What to do with ${U(e.header)}">
              <option value="new" ${e.action===`new`?`selected`:``}>New field</option>
              <option value="existing" ${e.action===`existing`?`selected`:``}>Existing field</option>
              <option value="skip" ${e.action===`skip`?`selected`:``}>Skip</option>
            </select>
            <select data-map-type aria-label="Type for ${U(e.header)}" ${e.action===`new`?``:`hidden`}>${qt(e.type)}</select>
            <select data-map-existing aria-label="Existing field for ${U(e.header)}" ${e.action===`existing`?``:`hidden`}>${n(e.fieldId)}</select>
          </div>
        `).join(``);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="CSV import">
          <h2>Import CSV</h2>
          <p>${U(bt)} has ${H.fields.length} column${H.fields.length===1?``:`s`} and ${H.records.length} row${H.records.length===1?``:`s`}. Choose how each column maps.</p>
          <div class="csv-map">${r}</div>
          <div class="preview-table-wrap">
            <table class="preview-table">
              <thead>
                <tr>${H.fields.map(e=>`<th>${U(e.name)}</th>`).join(``)}</tr>
              </thead>
              <tbody>
                ${t.map(e=>`<tr>${H.fields.map(t=>`<td>${U(e.values[t.id])}</td>`).join(``)}</tr>`).join(``)}
              </tbody>
            </table>
          </div>
          <p><strong>Create new table</strong> builds a fresh table from the columns you keep. <strong>Append</strong> adds the rows to ${U(e.name)} using your field mapping.</p>
          <div class="csv-dup">
            <label>When appending, match on <select data-csv-key><option value="">nothing (always add)</option>${e.fields.filter(e=>![`image`,`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(e.type)).map(e=>`<option value="${e.id}" ${mt===e.id?`selected`:``}>${U(e.name)}</option>`).join(``)}</select></label>
            <label>Duplicates <select data-csv-dup ${mt?``:`disabled`}>
              <option value="add" ${F===`add`?`selected`:``}>always add</option>
              <option value="skip" ${F===`skip`?`selected`:``}>skip matches</option>
              <option value="update" ${F===`update`?`selected`:``}>update matches</option>
            </select></label>
          </div>
          <div class="modal-actions">
            <button type="button" class="button primary" data-action="apply-csv-new">Create new table</button>
            <button type="button" class="button" data-action="apply-csv-append">Append to ${U(e.name)}</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(L===`projectIdeas`)return`
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
    `;if(L===`relationship`){let t=x.schema.tables.find(e=>e.id===vt)??e,n=x.schema.tables.find(e=>e.id===yt)??e,r=t.fields.map(e=>`<option value="${t.id}:${e.id}">${U(e.name)}</option>`).join(``),i=n.fields.map(e=>`<option value="${n.id}:${e.id}">${U(e.name)}</option>`).join(``);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Relationships">
          <h2>Relationships</h2>
          <p>Create a simple one-to-many relationship by matching values in two fields, such as Books:Title to Reviews:Book.</p>
          ${On()}
          <label>Name <input data-relationship-name placeholder="Books to reviews"></label>
          <label>Parent table <select data-relationship-from-table>${x.schema.tables.map(e=>`<option value="${e.id}" ${e.id===t.id?`selected`:``}>${U(e.name)}</option>`).join(``)}</select></label>
          <label>Parent match field <select data-relationship-from-field>${r}</select></label>
          <label>Related table <select data-relationship-to-table>${x.schema.tables.map(e=>`<option value="${e.id}" ${e.id===n.id?`selected`:``}>${U(e.name)}</option>`).join(``)}</select></label>
          <label>Related match field <select data-relationship-to-field>${i}</select></label>
          ${x.schema.relationships.length?`<div class="relationship-list">${x.schema.relationships.map(e=>`<p><strong>${U(e.name)}</strong><br>${U(xe(x,e))}</p>`).join(``)}</div>`:`<p>No relationships yet. Add a second table first for the most useful results.</p>`}
          <div class="modal-actions">
            <button type="button" data-action="create-relationship">Create relationship</button>
            <button type="button" data-action="close-dialog">Close</button>
          </div>
        </section>
      </div>
    `}if(L===`functions`){let t=e.fields.filter(e=>![`image`,`createdAt`,`updatedAt`].includes(e.type)),n=t.find(e=>[`text`,`longText`,`choice`].includes(e.type))??t[0],r=t.find(e=>[`number`,`currency`,`percent`,`rating`].includes(e.type))??n,i=n?.name??`Field`,a=r?.name??`Score`;return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Functions">
          <h2>Calculation functions</h2>
          <p>Use a calculation field when students need a result made from other fields. Formulas are simple, offline, and do not run custom code.</p>
          <div class="formula-grid">
            <div>
              <strong>Text</strong>
              <code>FIELD(${U(i)})</code>
              <code>JOIN(${U(i)}, " report")</code>
              <code>UPPER(${U(i)})</code>
              <code>TITLECASE(${U(i)})</code>
              <code>CONTAINS(${U(i)}, "a")</code>
            </div>
            <div>
              <strong>Numbers</strong>
              <code>ADD(${U(a)}, "5")</code>
              <code>SUBTRACT(${U(a)}, "1")</code>
              <code>MULTIPLY(${U(a)}, "2")</code>
              <code>DIVIDE(${U(a)}, "2")</code>
              <code>ROUND(${U(a)}, "1")</code>
            </div>
            <div>
              <strong>Whole table</strong>
              <code>SUM(${U(a)})</code>
              <code>AVERAGE(${U(a)})</code>
              <code>MIN(${U(a)})</code>
              <code>MAX(${U(a)})</code>
              <code>COUNT(${U(a)})</code>
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
    `}if(L===`quality`){let t=en(e),n=$t(e),r=t.reduce((e,t)=>e+t.missing,0),i=t.reduce((e,t)=>e+t.duplicates,0),a=Ge(e).length;return`
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
                          <span><strong>${U(e.name)}</strong><small>${U(e.type)}</small></span>
                          <button type="button" data-quality-kind="missing" data-quality-field-id="${e.id}" ${t?``:`disabled`}>${t}</button>
                          <button type="button" data-quality-kind="duplicates" data-quality-field-id="${e.id}" ${n?``:`disabled`}>${n}</button>
                        </div>
                      `).join(``):`<p class="empty-panel">No editable data fields are available yet.</p>`}
          </div>
          <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
        </section>
      </div>
    `}return L===`teacherNotes`?`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Teacher notes">
          <h2>Teacher notes</h2>
          <p>Add one note per line. These notes are saved in the .listsplat.json file and included in the project packet.</p>
          <label>Notes <textarea data-teacher-notes rows="8" placeholder="Add setup directions, reflection questions, or grading reminders.">${U(x.teacher.notes.join(`
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
  `}function $(){let e=G();kt(e),Tt();let t=x.teacher.studentView;if(b.innerHTML=`
    <header class="app-header">
      <a class="brand" href="../../pages/splatworks.html" aria-label="SplatWorks home">
        <img class="brand-icon" src="listsplat_icon.png" alt="">
        <span>
          <strong>ListSplat<sup>TM</sup></strong>
          <small>SplatWorks<sup>TM</sup> Database Studio</small>
        </span>
      </a>
      <div class="quick-actions">
        <button type="button" class="button" data-action="undo-change"${z.length?``:` disabled`} title="Undo (Ctrl+Z)" aria-label="Undo">↶ ${U(W(`Undo`))}</button>
        <button type="button" class="button" data-action="redo-change"${B.length?``:` disabled`} title="Redo (Ctrl+Y)" aria-label="Redo">↷ ${U(W(`Redo`))}</button>
        <button type="button" class="button primary" data-action="new">${U(W(`New`))}</button>
        <button type="button" class="button primary" data-action="save-json">${U(W(`Save JSON`))}</button>
        <button type="button" class="button primary" data-action="open-json">${U(W(`Open JSON`))}</button>
        <button type="button" class="button primary" data-action="export-csv">${U(W(`Export CSV`))}</button>
        <select id="languageSwitcher" class="lang-switcher" aria-label="Language">${wt(xt)}</select>
      </div>
    </header>
    <main class="listsplat-app">
      <nav class="menu-bar" aria-label="Application menu">
        ${X(`File`,[[`new`,`New database`],[`save-json`,`Save .listsplat.json`],[`open-json`,`Open .listsplat.json`],[`import-csv`,`Import CSV or TSV`],[`export-csv`,`Export table CSV`],[`export-found-csv`,`Export shown records CSV`],[`export-markdown`,`Export Markdown table`],[`export-report`,`Export report HTML`],[`print`,`Print`]])}
        ${X(`Edit`,[[`undo-change`,`Undo last change`],[`redo-change`,`Redo last change`],[`add-record`,`Add record`],[`add-field`,`Add field`],[`find`,`Find records`],[`replace`,`Replace values`]])}
        ${X(`Data`,[[`add-table`,`New table`],[`rename-table`,`Rename this table`],[`duplicate-table`,`Duplicate this table`],[`move-table-left`,`Move table left`],[`move-table-right`,`Move table right`],[`delete-table`,`Delete this table`],[`sort`,`Sort records`],[`missing`,`Find missing values`],[`duplicates`,`Find duplicates`],[`toggle-archived`,tt?`Show active records`:`Show archived records (${Et(e)})`],[`structure-copy`,`Save structure-only copy`],[`clear-find`,`Show all records`]])}
        ${X(`Layout`,[[`layout-designer`,`Design current layout`],[`table-view`,`Table view`],[`form-view`,`Form view`],[`cards-view`,`Card view`],[`gallery-view`,`Gallery view`],[`labels-view`,`Label view`],[`report-view`,`Report view`]])}
        ${X(`Tools`,[[`functions`,`Functions`],[`relationships`,`Relationships`],[`charts`,`Charts`],[`quality`,`Data quality check`]])}
        ${X(`View`,[[`student-view`,t?`Exit student view`:`Student view`],[`teacher-notes`,`Teacher notes`]])}
        <span class="menu-spacer"></span>
        ${t?``:X(`Teacher`,[[`templates`,`Template Library`],[`project-ideas`,`Project Ideas`],[`lock-layout`,`Lock Layout`],[`project-packet`,`Print Project Packet`]])}
        ${X(`Help`,[[`help-start`,`Start a database`],[`help-csv`,`Import and export CSV`],[`help-layouts`,`Forms and reports`],[`help-privacy`,`Privacy and saving`]])}
      </nav>
      <section class="toolbar" aria-label="Database toolbar">
        <label>${U(W(`Title`))} <input data-project-title value="${U(x.metadata.title)}"></label>
        <label>${U(W(`Search`))} <input data-search value="${U(T)}" placeholder="${U(W(`Find records`))}"></label>
        <label>${U(W(`In`))} <select data-search-field><option value="all">${U(W(`All fields`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${E===e.id?`selected`:``}>${U(e.name)}</option>`).join(``)}</select></label>
        <label>${U(W(`Sort`))} <select data-sort-field><option value="">${U(W(`Choose field`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${D[0]?.fieldId===e.id?`selected`:``}>${U(e.name)}</option>`).join(``)}</select></label>
        <button type="button" data-action="toggle-sort" title="${U(W(`Sort direction`))}">${D[0]?.direction===`desc`?`Z-A`:`A-Z`}</button>
        <button type="button" data-action="sort-dialog" title="${U(W(`Sort by more than one field`))}">${U(W(`Sort…`))}</button>
        <button type="button" data-action="find" title="${U(W(`Advanced find with conditions`))}">${U(W(`Find…`))}</button>
        <button type="button" data-action="views" title="${U(W(`Save and reuse this view`))}">${U(W(`Views`))}</button>
        <label>${U(W(`New field`))} <input data-new-field placeholder="${U(W(`Field name`))}"></label>
        <label>${U(W(`Type`))} <select data-new-field-type>${qt()}</select></label>
        <button type="button" data-action="add-field">${U(W(`Add field`))}</button>
        <button type="button" data-action="add-record">${U(W(`Add record`))}</button>
      </section>
      <div class="workspace${t?` student-workspace`:``}">
        ${wn(e)}
        ${t?``:Dn(e)}
      </div>
      <footer class="status-bar">
        <span>${U(e.name)}: ${K(e).length} shown of ${e.records.length} records, ${e.fields.length} fields</span>
        ${t?`<span>Student view hides teacher notes and teacher tools.</span>`:``}
        <span>${U(R)}</span>
        <span>${$e}</span>
      </footer>
    </main>
    <input class="hidden-file" type="file" accept=".listsplat.json,application/json" data-open-json>
    <input class="hidden-file" type="file" accept=".csv,text/csv" data-import-csv>
    ${Bn(e)}
  `,gt=``,_t){let e=_t;_t=null,ar(e.recordId,e.fieldId)}lr()}function Vn(e){return e instanceof HTMLInputElement&&e.type===`checkbox`?e.checked:e instanceof HTMLInputElement&&e.type===`number`?e.value===``?``:Number(e.value):e.value}function Hn(e){let t=e.dataset.recordId,n=e.dataset.fieldId;!t||!n||(x=m(x,p(G(),t,n,Vn(e))),h(x),$e=`Saved locally`)}function Un(e){return new Promise((t,n)=>{let r=new FileReader;r.onerror=()=>n(r.error),r.onload=()=>{let n=String(r.result??``);if(e.size<=35e4){t(n);return}let i=new Image;i.onerror=()=>t(n),i.onload=()=>{let e=1280,r=Math.max(i.width,i.height),a=r>e?e/r:1,o=Math.max(1,Math.round(i.width*a)),s=Math.max(1,Math.round(i.height*a)),c=document.createElement(`canvas`);c.width=o,c.height=s;let l=c.getContext(`2d`);if(!l){t(n);return}l.drawImage(i,0,0,o,s);let u=c.toDataURL(`image/jpeg`,.82);t(u.length<n.length?u:n)},i.src=n},r.readAsDataURL(e)})}function Wn(e){if(!e)return null;try{let t=JSON.parse(e);if(t&&t.url)return{name:t.name||`file`,url:t.url}}catch{}return e.startsWith(`data:`)?{name:`file`,url:e}:null}function Gn(e,t,n){let r=new FileReader;r.onload=()=>{J(`add file`);let i=JSON.stringify({name:n.name,url:String(r.result??``)});x=m(x,p(G(),e,t,i)),h(x);let a=Math.round(i.length/1024);R=a>900?`File attached (about ${a} KB). Large files can slow autosave.`:`File attached.`,$()},r.onerror=()=>{R=`Could not read that file.`,$()},r.readAsDataURL(n)}async function Kn(e,t){if(N&&N.state===`recording`){N.stop();return}if(!navigator.mediaDevices?.getUserMedia||window.MediaRecorder===void 0){R=`Audio recording is not available in this browser.`,$();return}try{let n=await navigator.mediaDevices.getUserMedia({audio:!0}),r=[],i=new MediaRecorder(n);N=i,i.ondataavailable=e=>{e.data.size&&r.push(e.data)},i.onstop=()=>{n.getTracks().forEach(e=>e.stop()),N=null;let i=new FileReader;i.onload=()=>{J(`record audio`),x=m(x,p(G(),e,t,String(i.result??``))),h(x),R=`Recording saved.`,$()},i.readAsDataURL(new Blob(r,{type:`audio/webm`}))},i.start(),R=`Recording… press the button again to stop (auto-stops at 60s).`,$(),window.setTimeout(()=>{N&&N.state===`recording`&&N.stop()},6e4)}catch{R=`Microphone permission was blocked.`,$()}}async function qn(){if(!navigator.mediaDevices?.getUserMedia){R=`Camera is not available in this browser.`,L=`none`,$();return}try{pt=await navigator.mediaDevices.getUserMedia({video:{facingMode:`environment`}});let e=b.querySelector(`#cameraVideo`);e&&(e.srcObject=pt,await e.play().catch(()=>void 0))}catch{Jn(),R=`Camera permission was blocked.`,L=`none`,$()}}function Jn(){pt?.getTracks().forEach(e=>e.stop()),pt=null}function Yn(){let e=b.querySelector(`#cameraVideo`);if(!e||!ft||!e.videoWidth)return;let t=document.createElement(`canvas`),n=Math.min(1,1280/Math.max(e.videoWidth,e.videoHeight));t.width=Math.round(e.videoWidth*n),t.height=Math.round(e.videoHeight*n);let r=t.getContext(`2d`);if(!r)return;r.drawImage(e,0,0,t.width,t.height);let i=t.toDataURL(`image/jpeg`,.85),{recordId:a,fieldId:o}=ft;J(`camera photo`),x=m(x,p(G(),a,o,i)),h(x),Jn(),ft=null,L=`none`,R=`Photo captured.`,$()}function Xn(e,t,n,r){if(!n.type.startsWith(`image/`)){R=`That clipboard item is not an image.`,$();return}Un(n).then(n=>{J(r),x=m(x,p(G(),e,t,n)),h(x);let i=Math.round(n.length/1024);R=i>900?`Image saved (about ${i} KB). Very large pictures can slow autosave — a smaller image is fine for most projects.`:`Image saved in this field.`,$()}).catch(()=>{R=`Could not read that image.`,$()})}function Zn(){let e=G(),t=e.fields.find(e=>e.id===ht);if(!t)return;let n=b.querySelector(`[data-field-name]`)?.value??t.name,r=b.querySelector(`[data-field-type]`)?.value??t.type,i=b.querySelector(`[data-field-description]`)?.value??``,a=b.querySelector(`[data-field-required]`)?.checked??!1,o=b.querySelector(`[data-field-hidden]`)?.checked??!1,s=b.querySelector(`[data-field-formula]`)?.value??``,c=(b.querySelector(`[data-field-options]`)?.value??``).split(`,`).map(e=>e.trim()).filter(Boolean),l=b.querySelector(`[data-field-unique]`)?.checked??!1,u=b.querySelector(`[data-field-min]`)?.value??``,ee=b.querySelector(`[data-field-max]`)?.value??``,te=u.trim()===``?void 0:Number(u),p=ee.trim()===``?void 0:Number(ee),m=b.querySelector(`[data-field-pattern]`)?.value??`none`,ne=b.querySelector(`[data-field-custom-pattern]`)?.value??``,re=b.querySelector(`[data-field-default]`)?.value??``,ie=b.querySelector(`[data-field-readonly]`)?.checked??!1,ae=b.querySelector(`[data-field-maxlength]`)?.value??``,oe=ae.trim()===``?void 0:Number(ae),se=b.querySelector(`[data-field-message]`)?.value??``,ce=r!==t.type,le=f(e,t.id,{name:n,type:r,description:i,required:a,hidden:o,formula:s,options:c,unique:l,min:te,max:p,pattern:m,customPattern:ne,defaultValue:re,readonly:ie,maxLength:oe,customMessage:se});ce&&![`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(r)&&(le=d(le,t.id,r,c)),Y(le),L=`none`,R=ce?`Updated ${n} and converted values to ${r}.`:`Updated ${n}.`,$()}function Qn(){let e=b.querySelector(`[data-replace-find]`)?.value??``,t=b.querySelector(`[data-replace-with]`)?.value??``,n=b.querySelector(`[data-replace-field]`)?.value??G().fields[0]?.id,r=b.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=b.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=T?K(G()).map(e=>e.id):void 0;J(`replace`);let o=Be(G(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i});L=`none`,V=[],R=`Replaced ${o.count} value${o.count===1?``:`s`}.`,Y(o.table)}function $n(){let e=b.querySelector(`[data-replace-find]`)?.value??``,t=b.querySelector(`[data-replace-with]`)?.value??``,n=b.querySelector(`[data-replace-field]`)?.value??G().fields[0]?.id,r=b.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=b.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=T?K(G()).map(e=>e.id):void 0;V=ze(G(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i}),R=`Preview found ${V.length} change${V.length===1?``:`s`}.`,$()}function er(){let e=(b.querySelector(`[data-teacher-notes]`)?.value??``).split(`
`).map(e=>e.trim()).filter(Boolean);J(`teacher notes`),L=`none`,R=`Saved ${e.length} teacher note${e.length===1?``:`s`}.`,q({...x,updatedAt:new Date().toISOString(),teacher:{...x.teacher,notes:e}})}function tr(e){let t=b.querySelector(e)?.value;if(!t)return null;let[n,r]=t.split(`:`);return n&&r?{tableId:n,fieldId:r}:null}function nr(){let e=b.querySelector(`[data-relationship-from-table]`)?.value??``,t=b.querySelector(`[data-relationship-to-table]`)?.value??``,n=tr(`[data-relationship-from-field]`),r=tr(`[data-relationship-to-field]`),i=b.querySelector(`[data-relationship-name]`)?.value??``;if(!e||!t||!n||!r){R=`Choose both tables and both match fields.`,$();return}if(n.tableId!==e||r.tableId!==t){R=`Match fields must belong to the tables you chose.`,$();return}J(`relationship create`);let a=ve(i,e,n.fieldId,t,r.fieldId);R=`Created relationship: ${a.name}.`,q(ye(x,a))}function rr(){vt=b.querySelector(`[data-relationship-from-table]`)?.value??vt,yt=b.querySelector(`[data-relationship-to-table]`)?.value??yt,$()}function ir(e){return window.CSS&&typeof CSS.escape==`function`?CSS.escape(e):e.replace(/["\\]/g,`\\$&`)}function ar(e,t){let n=b.querySelector(`.data-grid`);if(!n)return!1;let r=n.querySelector(`tr[data-record-row="${ir(e)}"]`);if(!r)return!1;let i=r.querySelector(`.cell-input[data-field-id="${ir(t)}"], .cell-checkbox[data-field-id="${ir(t)}"]`);return i||=r.querySelector(`.cell-input, .cell-checkbox`),i?(i.focus(),i instanceof HTMLInputElement&&i.type!==`checkbox`&&i.select(),!0):!1}function or(e){J(`add record`);let t=l(G()),n=t.records.at(-1);n&&(C=n.id,_t={recordId:n.id,fieldId:e}),Y(t)}function sr(e,t,n,r){let i=Array.from(b.querySelectorAll(`.data-grid tbody tr[data-record-row]`)),a=i.findIndex(t=>t.dataset.recordRow===e),o=Q(G()).map(e=>e.id),s=o.indexOf(t);if(a<0||s<0)return;let c=a+n,l=s+r;if(r>0&&l>=o.length?(l=0,c=a+1):r<0&&l<0&&(l=o.length-1,c=a-1),c>=i.length){or(o[l]??o[0]);return}c<0||ar(i[c].dataset.recordRow??e,o[l]??t)}function cr(){if(!M)return null;let e=K(G()).map(e=>e.id),t=Q(G()).map(e=>e.id),n=e.indexOf(M.anchor.r),r=e.indexOf(M.focus.r),i=t.indexOf(M.anchor.f),a=t.indexOf(M.focus.f);return n<0||r<0||i<0||a<0?null:{rows:e,cols:t,r1:Math.min(n,r),r2:Math.max(n,r),c1:Math.min(i,a),c2:Math.max(i,a)}}function lr(){b.querySelectorAll(`.data-grid td.cell-range`).forEach(e=>e.classList.remove(`cell-range`));let e=cr();if(e&&!((e.r2-e.r1+1)*(e.c2-e.c1+1)<=1))for(let t=e.r1;t<=e.r2;t+=1)for(let n=e.c1;n<=e.c2;n+=1)b.querySelector(`.data-grid [data-record-id="${ir(e.rows[t])}"][data-field-id="${ir(e.cols[n])}"]`)?.closest(`td`)?.classList.add(`cell-range`)}function ur(e){if(!M)return;let t=K(G()).map(e=>e.id),n=Q(G()).map(e=>e.id),r=t.indexOf(M.focus.r),i=n.indexOf(M.focus.f);r<0||i<0||(e===`ArrowUp`?r=Math.max(0,r-1):e===`ArrowDown`?r=Math.min(t.length-1,r+1):e===`ArrowLeft`?i=Math.max(0,i-1):e===`ArrowRight`&&(i=Math.min(n.length-1,i+1)),M={anchor:M.anchor,focus:{r:t[r],f:n[i]}},lr())}function dr(){let e=cr();if(!e||e.r2-e.r1===0&&e.c2-e.c1===0)return!1;let t=G(),n=new Map(t.records.map(e=>[e.id,e])),r=[];for(let i=e.r1;i<=e.r2;i+=1){let a=n.get(e.rows[i]);if(!a)continue;let o=[];for(let n=e.c1;n<=e.c2;n+=1)o.push(String(Z(t,a,e.cols[n])??``).replace(/\t/g,` `).replace(/\n/g,` `));r.push(o.join(`	`))}let i=r.join(`
`);navigator.clipboard?.writeText(i).catch(()=>void 0);let a=(e.r2-e.r1+1)*(e.c2-e.c1+1),o=b.querySelector(`.status-bar span:nth-last-child(2)`);return o&&(o.textContent=`Copied ${a} cells.`),!0}function fr(e,t,n){let i=G(),a=K(i),o=Q(i).map(e=>e.id),s=a.findIndex(e=>e.id===t),c=o.indexOf(n);if(s<0||c<0)return;let l=e.replace(/\r/g,``).replace(/\n$/,``).split(`
`).map(e=>e.split(`	`));J(`paste`);let d=new Map(i.records.map(e=>[e.id,e])),f=i.records.map(e=>e.id),ee=0;l.forEach((e,t)=>{let n;if(s+t<a.length)n=a[s+t].id;else{let e=r(i.fields);d.set(e.id,e),f.push(e.id),n=e.id,ee+=1}let l=d.get(n);if(!l)return;let te={...l.values};e.forEach((e,t)=>{let n=o[c+t],r=n?i.fields.find(e=>e.id===n):void 0;!r||[`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(r.type)||(te[r.id]=u(e,r.type,r.options).value)}),d.set(n,{...l,updatedAt:new Date().toISOString(),values:te})}),M=null,R=`Pasted ${l.length} row${l.length===1?``:`s`}${ee?` (${ee} new)`:``}.`,Y({...i,records:f.map(e=>d.get(e)).filter(Boolean)})}var pr=[{value:`contains`,label:`contains`,needsValue:!0,needsSecond:!1},{value:`equals`,label:`is exactly`,needsValue:!0,needsSecond:!1},{value:`startsWith`,label:`starts with`,needsValue:!0,needsSecond:!1},{value:`endsWith`,label:`ends with`,needsValue:!0,needsSecond:!1},{value:`greaterThan`,label:`greater than`,needsValue:!0,needsSecond:!1},{value:`lessThan`,label:`less than`,needsValue:!0,needsSecond:!1},{value:`between`,label:`between`,needsValue:!0,needsSecond:!0},{value:`isEmpty`,label:`is empty`,needsValue:!1,needsSecond:!1},{value:`isNotEmpty`,label:`is not empty`,needsValue:!1,needsSecond:!1}];function mr(e){return G().fields.find(t=>t.id===e)?.name??`field`}function hr(e){return pr.find(t=>t.value===e)?.label??e}function gr(){let e=b.querySelector(`[data-find-match]`)?.value??`all`,t=[];b.querySelectorAll(`.find-rule`).forEach(e=>{let n=e.querySelector(`[data-find-field]`)?.value??``,r=e.querySelector(`[data-find-op]`)?.value??`contains`,i=e.querySelector(`[data-find-value]`)?.value??``,a=e.querySelector(`[data-find-value2]`)?.value??``;n&&t.push({fieldId:n,operator:r,value:i,value2:a})}),k={match:e,rules:t}}function _r(){gr(),O=k.rules.length?k:null,I=new Set,L=`none`;let e=K(G()).length;R=O?`Find is on: ${e} record${e===1?``:`s`} match.`:`Find cleared.`,$()}function vr(){let e=[];b.querySelectorAll(`.sort-level`).forEach(t=>{let n=t.querySelector(`[data-sort-level-field]`)?.value??``,r=t.querySelector(`[data-sort-level-dir]`)?.value??`asc`;n&&e.push({fieldId:n,direction:r})}),A=e}function yr(){vr(),D=A,L=`none`,R=D.length?`Sorting by ${D.map(e=>mr(e.fieldId)).join(`, `)}.`:`Sort cleared.`,$()}function br(){return x.views??[]}function xr(){let e=b.querySelector(`[data-view-name]`)?.value.trim()||`View ${br().length+1}`,n={id:t(`view`),name:e,tableId:S,mode:w,search:T,searchFieldId:E,find:O,sortKeys:D};J(`save view`),R=`Saved view: ${e}.`,q({...x,updatedAt:new Date().toISOString(),views:[...br(),n]})}function Sr(e){let t=br().find(t=>t.id===e);t&&(x.schema.tables.some(e=>e.id===t.tableId)&&(S=t.tableId,kt(G())),w=t.mode,T=t.search,E=t.searchFieldId,O=t.find,D=t.sortKeys,I=new Set,L=`none`,R=`Opened view: ${t.name}.`,$())}function Cr(e){J(`delete view`),R=`Deleted a saved view.`,q({...x,updatedAt:new Date().toISOString(),views:br().filter(t=>t.id!==e)})}function wr(e){let t=new Set(e.records.map(e=>e.id));return[...j].filter(e=>t.has(e))}function Tr(){let e=G(),t=new Set(wr(e));if(t.size===0)return;let n=e.records.filter(e=>!t.has(e.id));if(n.length===0){R=`Keep at least one record. Some rows were not deleted.`,$();return}window.confirm(`Delete ${t.size} selected record${t.size===1?``:`s`}? You can undo right after.`)&&(J(`bulk delete`),j=new Set,R=`Deleted ${e.records.length-n.length} records.`,Y({...e,records:n}))}function Er(){let e=G(),t=wr(e);if(t.length===0)return;J(`bulk duplicate`);let n=t.reduce((e,t)=>ee(e,t),e);j=new Set,R=`Duplicated ${t.length} record${t.length===1?``:`s`}.`,Y(n)}function Dr(){let e=G(),t=new Set(wr(e)),n=b.querySelector(`[data-bulk-field]`)?.value??``,r=b.querySelector(`[data-bulk-value]`)?.value??``,i=e.fields.find(e=>e.id===n);if(!i||t.size===0){L=`none`,$();return}let a=u(r,i.type,i.options).value;J(`bulk fill`);let o=e.records.map(e=>t.has(e.id)?{...e,updatedAt:new Date().toISOString(),values:{...e.values,[n]:a}}:e);L=`none`,R=`Filled ${i.name} for ${t.size} record${t.size===1?``:`s`}.`,Y({...e,records:o})}function Or(e){let t=e.filter(e=>e.trim()!==``);return t.length===0?`text`:t.every(e=>!Number.isNaN(Number(e.replace(/[$,%\s]/g,``))))?`number`:t.every(e=>!Number.isNaN(new Date(e).getTime())&&/\d/.test(e))?`date`:t.every(e=>/^(yes|no|true|false)$/i.test(e.trim()))?`checkbox`:`text`}function kr(){b.querySelectorAll(`.csv-map-row`).forEach((e,t)=>{P[t]&&(P[t].action=e.querySelector(`[data-map-action]`)?.value??`new`,P[t].type=e.querySelector(`[data-map-type]`)?.value??`text`,P[t].fieldId=e.querySelector(`[data-map-existing]`)?.value??``)})}b.addEventListener(`click`,e=>{let t=e.target,n=t.closest(`[data-action]`)?.dataset.action,i=t.closest(`[data-table-id]`)?.dataset.tableId,s=t.closest(`[data-template-id]`)?.dataset.templateId,c=t.closest(`[data-view-mode]`)?.dataset.viewMode,u=t.closest(`[data-select-record]`)?.dataset.selectRecord,d=t.closest(`[data-field-settings]`)?.dataset.fieldSettings,f=t.closest(`[data-record-action-id]`)?.dataset.recordActionId,p=t.closest(`[data-quality-field-id]`);if(i){S=i,Ot(),D=[],j=new Set,M=null,kt(G()),$();return}if(s){Kt(s);return}if(c){w=c,$();return}if(u){C=u,w===`table`&&$();return}if(d){ht=d,et=``,L=`field`,$();return}let ce=t.closest(`[data-formula-insert]`)?.dataset.formulaInsert;if(ce){let e=b.querySelector(`[data-field-formula]`);if(e){let t=e.selectionStart??e.value.length;e.value=e.value.slice(0,t)+ce+e.value.slice(e.selectionEnd??t),e.focus()}return}if(p){let e=p.dataset.qualityFieldId,t=p.dataset.qualityKind;if(e&&t){let n=t===`duplicates`?Le(G(),e):Re(G(),e);I=new Set(n.map(e=>e.id));let r=G().fields.find(t=>t.id===e);R=`Highlighted ${n.length} ${t===`duplicates`?`duplicate`:`missing`} record${n.length===1?``:`s`} in ${r?.name??`this field`}.`,L=`none`,$();return}}if(n)if(Ft(),n===`new`){if(!window.confirm(`Start a new database? Your current one is replaced here — export it first if you want to keep a copy. You can also undo right after.`))return;J(`new database`);let e=a(`Untitled Database`);S=e.schema.tables[0].id,C=e.schema.tables[0].records[0]?.id??``,I=new Set,q(e)}else if(n===`save-json`)Lt();else if(n===`open-json`)b.querySelector(`[data-open-json]`)?.click();else if(n===`import-csv`)b.querySelector(`[data-import-csv]`)?.click();else if(n===`export-csv`)Rt();else if(n===`export-found-csv`)zt();else if(n===`export-markdown`)Bt();else if(n===`export-report`)Vt();else if(n===`project-packet`)Ht();else if(n===`print`)window.print();else if(n===`add-record`)J(`add record`),Y(l(G()));else if(n===`add-field`){let e=b.querySelector(`[data-new-field]`),t=b.querySelector(`[data-new-field-type]`)?.value;J(`add field`),Y(o(G(),e?.value||`New Field`,t??`text`))}else if(n===`add-table`){let e=window.prompt(`New table name?`,`New Table`)??``;J(`add table`);let t=ne(x,e);S=t.schema.tables.at(-1)?.id??S,C=G().records[0]?.id??``,q(t)}else if(n===`duplicate-record`&&f)J(`duplicate record`),Y(ee(G(),f));else if(n===`delete-record`&&f){if(G().records.length<=1){R=`Keep at least one record. Add another before deleting this one.`,$();return}if(!window.confirm(`Delete this record? You can undo right after with Ctrl+Z.`))return;J(`delete record`),Y(te(G(),f))}else if(n===`toggle-sort`){if(D.length)D=[{...D[0],direction:D[0].direction===`asc`?`desc`:`asc`},...D.slice(1)];else{let e=G().fields[0];e&&(D=[{fieldId:e.id,direction:`asc`}])}$()}else if(n===`sort`||n===`sort-dialog`)A=D.length?D.map(e=>({...e})):[{fieldId:G().fields[0]?.id??``,direction:`asc`}],L=`sort`,$();else if(n===`find`)k=O?{match:O.match,rules:O.rules.map(e=>({...e}))}:{match:`all`,rules:[{fieldId:G().fields[0]?.id??``,operator:`contains`,value:``}]},L=`find`,$();else if(n===`views`)L=`views`,$();else if(n===`sort-add-level`)vr(),A.push({fieldId:G().fields[0]?.id??``,direction:`asc`}),$();else if(n===`sort-remove-level`){vr();let e=Number(t.closest(`[data-level-index]`)?.dataset.levelIndex??`-1`);e>=0&&A.splice(e,1),$()}else if(n===`sort-toggle`){let e=t.closest(`[data-sort-toggle]`)?.dataset.sortToggle;if(e){let t=D.find(t=>t.fieldId===e);D=[{fieldId:e,direction:t&&t.direction===`asc`?`desc`:`asc`}],$()}}else if(n===`apply-sort`)yr();else if(n===`clear-sort`)vr(),A=[],$();else if(n===`find-add-rule`)gr(),k.rules.push({fieldId:G().fields[0]?.id??``,operator:`contains`,value:``}),$();else if(n===`find-remove-rule`){gr();let e=Number(t.closest(`[data-rule-index]`)?.dataset.ruleIndex??`-1`);e>=0&&k.rules.splice(e,1),$()}else if(n===`apply-find`)_r();else if(n===`save-view`)xr();else if(n===`apply-view`){let e=t.closest(`[data-view-id]`)?.dataset.viewId;e&&Sr(e)}else if(n===`delete-view`){let e=t.closest(`[data-view-id]`)?.dataset.viewId;e&&Cr(e)}else if(n===`bulk-delete`)Tr();else if(n===`bulk-duplicate`)Er();else if(n===`bulk-fill`)wr(G()).length&&(L=`bulkFill`,$());else if(n===`apply-bulk-fill`)Dr();else if(n===`bulk-clear`)j=new Set,$();else if(n===`expand-record`&&f)C=f,w=`form`,$();else if(n===`camera-capture`){let e=t.closest(`[data-record-id]`)?.dataset.recordId,n=t.closest(`[data-field-id]`)?.dataset.fieldId;e&&n&&(ft={recordId:e,fieldId:n},L=`camera`,$(),qn())}else if(n===`camera-shoot`)Yn();else if(n===`record-audio`){let e=t.closest(`[data-record-id]`)?.dataset.recordId,n=t.closest(`[data-field-id]`)?.dataset.fieldId;e&&n&&Kn(e,n)}else if(n===`open-related`){let e=t.closest(`[data-rel-table]`)?.dataset.relTable,n=t.closest(`[data-rel-record]`)?.dataset.relRecord;e&&n&&(S=e,C=n,Ot(),D=[],w=`form`,$())}else if(n===`add-related`){let e=t.closest(`[data-rel-id]`)?.dataset.relId,n=x.schema.relationships.find(t=>t.id===e),i=G().records.find(e=>e.id===C),a=n?x.schema.tables.find(e=>e.id===n.toTableId):void 0;if(n&&i&&a){J(`add related record`);let e=i.values[n.fromFieldId]??``,t=r(a.fields,{[n.toFieldId]:e}),o=m(x,{...a,records:[...a.records,t]});S=a.id,C=t.id,Ot(),D=[],w=`form`,R=`Added a ${a.name} record linked to ${on(G(),i)}.`,q(o)}}else if(n===`cal-prev`)Cn(-1),$();else if(n===`cal-next`)Cn(1),$();else if(n===`cal-today`)at=``,$();else if(n===`bulk-archive`||n===`bulk-restore`){let e=n===`bulk-archive`,t=new Set(wr(G()));if(t.size){J(e?`archive records`:`restore records`);let n=G();j=new Set,R=`${e?`Archived`:`Restored`} ${t.size} record${t.size===1?``:`s`}.`,Y({...n,records:n.records.map(n=>t.has(n.id)?{...n,archived:e}:n)})}}else if(n===`toggle-archived`)tt=!tt,j=new Set,R=tt?`Showing archived records.`:`Showing active records.`,$();else if(n===`rename-table`){let e=G(),t=window.prompt(`Rename table`,e.name);t&&t.trim()&&(J(`rename table`),q(re(x,e.id,t)))}else if(n===`duplicate-table`){J(`duplicate table`);let e=ie(x,S);S=e.newTableId,Ot(),D=[],j=new Set,R=`Duplicated the table.`,q(e.project)}else if(n===`move-table-left`||n===`move-table-right`)J(`move table`),q(ae(x,S,n===`move-table-left`?-1:1));else if(n===`delete-table`){if(x.schema.tables.length<=1){R=`A database needs at least one table.`,$();return}if(window.confirm(`Delete the table "${G().name}" and all its records? You can undo right after.`)){J(`delete table`);let e=oe(x,S);S=e.schema.tables[0].id,Ot(),D=[],j=new Set,R=`Deleted the table.`,q(e)}}else if(n===`structure-copy`)Lt(se(x)),R=`Saved a structure-only copy (no records).`,$();else if(n===`highlight-invalid`){let e=Ge(G());I=new Set(e.map(e=>e.record.id)),L=`none`,R=`Highlighted ${I.size} record${I.size===1?``:`s`} with rule problems.`,$()}else if(n===`duplicates`){let e=E===`all`?G().fields[0]?.id:E;I=new Set(Le(G(),e).map(e=>e.id)),R=`Found ${I.size} duplicate record${I.size===1?``:`s`}.`,$()}else if(n===`missing`){let e=E===`all`?G().fields[0]?.id:E;I=new Set(Re(G(),e).map(e=>e.id)),R=`Found ${I.size} record${I.size===1?``:`s`} with missing values.`,$()}else if(n===`clear-find`)Ot(),R=`Showing all records.`,$();else if(n===`replace`)V=[],L=`replace`,$();else if(n===`preview-replace`)$n();else if(n===`run-replace`)Qn();else if(n===`save-teacher-notes`)er();else if(n===`apply-csv-new`)Gt(`new`);else if(n===`apply-csv-append`)Gt(`append`);else if(n===`save-field-settings`)J(`field settings`),Zn();else if(n===`layout-designer`||n===`lock-layout`)L=`layout`,$();else if(n===`layout-field-up`||n===`layout-field-down`){let e=t.closest(`[data-layout-field-id]`)?.dataset.layoutFieldId,r=Yt();if(e&&r){let t=Zt(G()).map(e=>e.id),r=t.indexOf(e),i=n===`layout-field-up`?r-1:r+1;r>=0&&i>=0&&i<t.length&&([t[r],t[i]]=[t[i],t[r]],J(`layout order`),L=`layout`,an({fieldOrder:t}))}}else if(n===`save-layout-settings`){let e=b.querySelector(`[data-layout-locked]`)?.checked??!1,t=new Set([...b.querySelectorAll(`[data-layout-field-visible]:checked`)].map(e=>e.dataset.layoutFieldVisible??``)),n=Zt(G()).map(e=>e.id),r=n.filter(e=>!t.has(e));J(`layout settings`),L=`none`,an({locked:e,fieldOrder:n,hiddenFieldIds:r})}else n===`create-relationship`?nr():n===`undo-change`?Nt():n===`redo-change`?Pt():n===`close-dialog`?(L===`camera`&&(Jn(),ft=null),L=`none`,V=[],H=null,$()):n.endsWith(`-view`)?(w=n.replace(`-view`,``),$()):n===`templates`?(R=`Template starters are in the Teacher panel.`,$()):n===`student-view`?(J(`student view toggle`),R=x.teacher.studentView?`Teacher tools are visible again.`:`Student view is on.`,q({...x,updatedAt:new Date().toISOString(),teacher:{...x.teacher,studentView:!x.teacher.studentView}})):n===`project-ideas`?(L=`projectIdeas`,$()):n===`relationships`?(L=`relationship`,$()):n===`charts`?(lt||=G().fields.find(e=>!e.hidden&&![`image`,`longText`,`calculation`].includes(e.type))?.id??``,L=`charts`,$()):n===`functions`?(L=`functions`,$()):n===`quality`?(L=`quality`,$()):n===`teacher-notes`?(L=`teacherNotes`,$()):n.startsWith(`help-`)?(L=`help`,$()):(R=`That ListSplatTM control is not available in this workspace.`,$())}),b.addEventListener(`change`,e=>{let t=e.target;if(t.matches(`#languageSwitcher`)&&t instanceof HTMLSelectElement){xt=St(t.value);try{localStorage.setItem(Ye,xt)}catch{}$()}else if(t.matches(`[data-open-json]`)&&t instanceof HTMLInputElement&&t.files?.[0])Ut(t.files[0]);else if(t.matches(`[data-import-csv]`)&&t instanceof HTMLInputElement&&t.files?.[0])Wt(t.files[0]);else if(t.matches(`[data-search-field]`))E=t.value,I=new Set,$();else if(t.matches(`[data-sort-field]`)){let e=D[0]?.direction??`asc`;D=t.value?[{fieldId:t.value,direction:e}]:[],$()}else if(t.matches(`[data-group-field]`))nt=t.value,$();else if(t.matches(`[data-board-field]`))rt=t.value,$();else if(t.matches(`[data-calendar-field]`))it=t.value,$();else if(t.matches(`[data-wrap-toggle]`)&&t instanceof HTMLInputElement)ot=t.checked,$();else if(t.matches(`[data-chart-type]`))ct=t.value,$();else if(t.matches(`[data-chart-category]`))lt=t.value,$();else if(t.matches(`[data-chart-value-mode]`))ut=t.value,$();else if(t.matches(`[data-chart-value-field]`))dt=t.value,$();else if(t.matches(`[data-select-all]`)&&t instanceof HTMLInputElement){let e=K(G()).map(e=>e.id);j=t.checked?new Set(e):new Set,$()}else if(t.matches(`[data-select-row]`)&&t instanceof HTMLInputElement){let e=t.dataset.selectRow??``;t.checked?j.add(e):j.delete(e),$()}else if(t.matches(`[data-field-type]`))et=t.value,$();else if(t.matches(`[data-find-op]`))gr(),$();else if(t.matches(`[data-map-action]`))kr(),$();else if(t.matches(`[data-csv-key]`))kr(),mt=t.value,$();else if(t.matches(`[data-csv-dup]`))kr(),F=t.value,$();else if(t.matches(`[data-relationship-from-table], [data-relationship-to-table]`))rr();else if(t.matches(`.file-input`)&&t instanceof HTMLInputElement&&t.files?.[0]){let e=t.dataset.recordId,n=t.dataset.fieldId;e&&n&&Gn(e,n,t.files[0])}else if(t.matches(`.multi-option`)&&t instanceof HTMLInputElement){let e=t.closest(`.multi-cell`),n=t.dataset.recordId,r=t.dataset.fieldId;if(e&&n&&r){let t=Array.from(e.querySelectorAll(`.multi-option:checked`)).map(e=>e.dataset.multiOption??``);At(n,r),x=m(x,p(G(),n,r,t.join(`, `))),h(x),$()}}else if(t.matches(`.cell-input, .cell-checkbox, .image-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement))if(t instanceof HTMLInputElement&&t.type===`file`&&t.files?.[0]){let e=t.dataset.recordId,n=t.dataset.fieldId,r=t.files[0];e&&n&&Xn(e,n,r,`image upload`)}else t.dataset.recordId&&t.dataset.fieldId&&At(t.dataset.recordId,t.dataset.fieldId),Hn(t)}),b.addEventListener(`paste`,e=>{let t=e.target,n=t.closest(`.image-cell`);if(n){let t=n.dataset.recordId,r=n.dataset.fieldId,i=Array.from(e.clipboardData?.items??[]).find(e=>e.type.startsWith(`image/`))?.getAsFile();t&&r&&i&&(e.preventDefault(),Xn(t,r,i,`image paste`));return}let r=t.closest(`.cell-input`);if(!r||!r.closest(`.data-grid`)||!r.dataset.recordId||!r.dataset.fieldId)return;let i=e.clipboardData?.getData(`text/plain`)??``;/[\t\n]/.test(i.replace(/\n$/,``))&&(e.preventDefault(),fr(i,r.dataset.recordId,r.dataset.fieldId))}),b.addEventListener(`input`,e=>{let t=e.target;if(t.matches(`[data-project-title]`)){It(t.value);return}if(t.matches(`[data-search]`)){T=t.value,I=new Set,$();return}t.matches(`.cell-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)&&(t.dataset.recordId&&t.dataset.fieldId&&At(t.dataset.recordId,t.dataset.fieldId),Hn(t))}),b.addEventListener(`focusout`,e=>{e.target.matches?.(`.cell-input, .cell-checkbox`)&&(gt=``)}),b.addEventListener(`mousedown`,e=>{let t=e.target.closest(`[data-record-id][data-field-id]`);if(!t||!t.closest(`.data-grid`)||!t.dataset.recordId||!t.dataset.fieldId)return;let n={r:t.dataset.recordId,f:t.dataset.fieldId};e.shiftKey&&M?(e.preventDefault(),M={anchor:M.anchor,focus:n}):M={anchor:n,focus:n},lr()}),b.addEventListener(`pointerdown`,e=>{let t=e.target.closest(`[data-col-resize]`);if(!t)return;e.preventDefault(),e.stopPropagation();let n=t.dataset.colResize??``,r=t.closest(`th`);if(!r)return;r.setAttribute(`draggable`,`false`);let i=e.clientX,a=r.getBoundingClientRect().width,o=Math.round(a),s=e=>{o=Math.max(80,Math.round(a+(e.clientX-i))),r.style.width=`${o}px`,r.style.minWidth=`${o}px`},c=()=>{document.removeEventListener(`pointermove`,s),document.removeEventListener(`pointerup`,c),r.setAttribute(`draggable`,`true`);let e=Yt();e&&(J(`resize column`),an({columnWidths:{...e.columnWidths??{},[n]:o}}))};document.addEventListener(`pointermove`,s),document.addEventListener(`pointerup`,c)});var Ar=null;b.addEventListener(`dragstart`,e=>{let t=e.target,n=t.closest(`.kanban-card[data-kanban-card]`);if(n){st=n.dataset.kanbanCard??null,e.dataTransfer?.setData(`text/plain`,st??``);return}if(t.closest(`[data-col-resize]`))return;let r=t.closest(`.col-head[data-col-field]`);r&&(Ar=r.dataset.colField??null,e.dataTransfer?.setData(`text/plain`,Ar??``))}),b.addEventListener(`dragover`,e=>{let t=e.target;(Ar&&t.closest(`.col-head[data-col-field]`)||st&&t.closest(`.kanban-col`))&&e.preventDefault()}),b.addEventListener(`drop`,e=>{let t=e.target.closest(`.kanban-col`);if(t&&st&&rt){e.preventDefault();let n=st;st=null;let r=t.dataset.kanbanCol??``;J(`move card`),x=m(x,p(G(),n,rt,r)),h(x),R=`Moved card to ${r||`Unassigned`}.`,$();return}let n=e.target.closest(`.col-head[data-col-field]`);if(!n||!Ar)return;e.preventDefault();let r=n.dataset.colField??``,i=Ar;if(Ar=null,!r||r===i)return;let a=Zt(G()).map(e=>e.id),o=a.indexOf(i),s=a.indexOf(r);o<0||s<0||(a.splice(s,0,a.splice(o,1)[0]),J(`reorder columns`),an({fieldOrder:a}))}),b.addEventListener(`keydown`,e=>{let t=e.target;if(!t.matches?.(`.cell-input, .cell-checkbox`))return;let n=t.dataset.recordId,r=t.dataset.fieldId;if(!n||!r)return;let i=t instanceof HTMLTextAreaElement,a=t instanceof HTMLSelectElement;if(e.shiftKey&&[`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`].includes(e.key)&&!i&&!a){M||={anchor:{r:n,f:r},focus:{r:n,f:r}},e.preventDefault(),ur(e.key);return}if(e.key===`Escape`&&M){M=null,lr();return}switch(e.key){case`Enter`:i||(e.preventDefault(),sr(n,r,e.shiftKey?-1:1,0));break;case`ArrowDown`:!i&&!a&&(e.preventDefault(),sr(n,r,1,0));break;case`ArrowUp`:!i&&!a&&(e.preventDefault(),sr(n,r,-1,0));break;case`Tab`:e.preventDefault(),sr(n,r,0,e.shiftKey?-1:1);break;default:break}}),document.addEventListener(`keydown`,e=>{if(!(e.ctrlKey||e.metaKey))return;let t=e.key.toLowerCase();if(t===`c`){dr()&&e.preventDefault();return}t===`z`&&!e.shiftKey?(e.preventDefault(),Nt()):t===`y`||t===`z`&&e.shiftKey?(e.preventDefault(),Pt()):t===`s`&&(e.preventDefault(),Lt(),R=`Saved a .listsplat.json file to your downloads.`,$())}),document.addEventListener(`click`,e=>{e.target.closest(`.menu`)||Ft()}),document.addEventListener(`toggle`,e=>{let t=e.target;!(t instanceof HTMLDetailsElement)||!t.matches(`.menu`)||!t.open||document.querySelectorAll(`.menu[open]`).forEach(e=>{e!==t&&(e.open=!1)})},!0),$();