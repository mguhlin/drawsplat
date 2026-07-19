(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={text:``,longText:``,number:0,currency:0,percent:0,date:``,time:``,dateTime:``,checkbox:!1,rating:0,choice:``,multiSelect:``,email:``,phone:``,image:``,link:``,calculation:``,autoNumber:``,createdAt:``,updatedAt:``};function t(e){return`${e}_${Math.random().toString(36).slice(2,10)}`}function n(e,n=`text`){return{id:t(`field`),name:e,type:n,description:``,required:!1,hidden:!1,options:n===`choice`||n===`multiSelect`?[`Yes`,`No`]:void 0}}function r(n,r={}){let i=new Date().toISOString(),a=Object.fromEntries(n.map((t,n)=>t.type===`createdAt`||t.type===`updatedAt`?[t.id,r[t.id]??i]:t.type===`autoNumber`?[t.id,r[t.id]??n+1]:r[t.id]===void 0&&t.defaultValue!=null&&t.defaultValue!==``?[t.id,u(t.defaultValue,t.type,t.options).value]:[t.id,r[t.id]??e[t.type]]));return{id:t(`record`),createdAt:i,updatedAt:i,values:a}}function i(e,i){let a=i.map(e=>n(e));return{id:t(`table`),name:e,fields:a,records:[r(a)]}}function a(e=`Animal Research Database`){let n=new Date().toISOString(),a=i(`Animals`,[`Animal`,`Habitat`,`Diet`,`Interesting Fact`]);return a.records=[r(a.fields,{[a.fields[0].id]:`Axolotl`,[a.fields[1].id]:`Freshwater lakes`,[a.fields[2].id]:`Worms and insects`,[a.fields[3].id]:`It can regrow some body parts.`}),r(a.fields,{[a.fields[0].id]:`Red panda`,[a.fields[1].id]:`Mountain forests`,[a.fields[2].id]:`Bamboo and fruit`,[a.fields[3].id]:`It uses its tail like a blanket.`})],{app:`ListSplatTM`,version:1,createdAt:n,updatedAt:n,metadata:{title:e,author:``,className:``},schema:{tables:[a],relationships:[]},layouts:[{id:t(`layout`),name:`Table View`,tableId:a.id,mode:`table`,locked:!1},{id:t(`layout`),name:`Record Form`,tableId:a.id,mode:`form`,locked:!1},{id:t(`layout`),name:`Research Cards`,tableId:a.id,mode:`cards`,locked:!1}],teacher:{studentView:!1,notes:[`Ask students to add source notes before printing a report.`],rubric:[]}}}function o(t,r,i=`text`){let a=n(r.trim()||`New Field`,i);return{...t,fields:[...t.fields,a],records:t.records.map(t=>({...t,updatedAt:new Date().toISOString(),values:{...t.values,[a.id]:e[i]}}))}}function s(e,t){return e.records.reduce((e,n)=>{let r=Number(n.values[t]);return Number.isFinite(r)?Math.max(e,r):e},0)+1}function c(e){let t={};return e.fields.filter(e=>e.type===`autoNumber`).forEach(n=>{t[n.id]=s(e,n.id)}),t}function l(e){return{...e,records:[...e.records,r(e.fields,c(e))]}}function u(t,n,r){let i=t==null?``:String(t);if(i.trim()===``)return{value:e[n],lost:!1};switch(n){case`number`:case`currency`:case`percent`:case`rating`:{let t=Number(i.replace(/[$,%\s]/g,``));return Number.isFinite(t)?{value:n===`rating`?Math.max(0,Math.min(5,Math.round(t))):t,lost:!1}:{value:e[n],lost:!0}}case`checkbox`:{let e=i.trim().toLowerCase();return[`true`,`yes`,`1`,`y`,`checked`].includes(e)?{value:!0,lost:!1}:[`false`,`no`,`0`,`n`].includes(e)?{value:!1,lost:!1}:{value:!1,lost:!0}}case`choice`:{let e=r?.find(e=>e.toLowerCase()===i.trim().toLowerCase());return e?{value:e,lost:!1}:{value:``,lost:!!(r&&r.length)}}case`date`:{let e=new Date(i);return Number.isNaN(e.getTime())?{value:``,lost:!0}:{value:e.toISOString().slice(0,10),lost:!1}}case`text`:case`longText`:case`link`:return{value:i,lost:!1};default:return{value:i,lost:!1}}}function d(e,t,n,r){return{...e,records:e.records.map(e=>({...e,values:{...e.values,[t]:u(e.values[t],n,r).value}}))}}function ee(e,t,n){return{...e,fields:e.fields.map(e=>e.id===t?{...e,...n}:e)}}function f(e,t){let n=e.records.find(e=>e.id===t);return n?{...e,records:[...e.records,r(e.fields,{...n.values,...c(e)})]}:e}function te(e,t){return e.records.length<=1?e:{...e,records:e.records.filter(e=>e.id!==t)}}function ne(e,t,n,r){let i=new Date().toISOString();return{...e,records:e.records.map(a=>a.id===t?{...a,updatedAt:i,values:Object.fromEntries(e.fields.map(e=>e.id===n?[e.id,r]:e.type===`updatedAt`?[e.id,i]:[e.id,a.values[e.id]]))}:a)}}function re(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t.id?t:e)}}}function ie(e,n){let r=i(n.trim()||`New Table`,[`Name`,`Notes`]);return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:[...e.schema.tables,r]},layouts:[...e.layouts,{id:t(`layout`),name:`${r.name} Table`,tableId:r.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${r.name} Form`,tableId:r.id,mode:`form`,locked:!1}]}}function ae(e,t,n){let r=n.trim()||`Table`;return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t?{...e,name:r}:e)}}}function oe(e,n){let r=e.schema.tables.find(e=>e.id===n);if(!r)return{project:e,newTableId:n};let i=new Map(r.fields.map(e=>[e.id,t(`field`)])),a=r.fields.map(e=>({...e,id:i.get(e.id)})),o=r.records.map(e=>({id:t(`record`),createdAt:e.createdAt,updatedAt:e.updatedAt,values:Object.fromEntries(Object.entries(e.values).map(([e,t])=>[i.get(e)??e,t]))})),s={id:t(`table`),name:`${r.name} copy`,fields:a,records:o},c=e.schema.tables.findIndex(e=>e.id===n),l=[...e.schema.tables];return l.splice(c+1,0,s),{project:{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:l},layouts:[...e.layouts,{id:t(`layout`),name:`${s.name} Table`,tableId:s.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${s.name} Form`,tableId:s.id,mode:`form`,locked:!1}]},newTableId:s.id}}function se(e,t,n){let r=[...e.schema.tables],i=r.findIndex(e=>e.id===t),a=i+n;return i<0||a<0||a>=r.length?e:([r[i],r[a]]=[r[a],r[i]],{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:r}})}function ce(e,t){return e.schema.tables.length<=1?e:{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.filter(e=>e.id!==t),relationships:e.schema.relationships.filter(e=>e.fromTableId!==t&&e.toTableId!==t)},layouts:e.layouts.filter(e=>e.tableId!==t),views:(e.views??[]).filter(e=>e.tableId!==t)}}function le(e){let t=new Date().toISOString();return{...e,createdAt:t,updatedAt:t,metadata:{...e.metadata,title:`${e.metadata.title} (template)`},schema:{...e.schema,tables:e.schema.tables.map(e=>({...e,records:[r(e.fields)]}))},views:[]}}function ue(e){if(!e||typeof e!=`object`)throw Error(`This is not a ListSplatTM project file.`);let t=e;if(t.app!==`ListSplatTM`||t.version!==1||!t.schema?.tables)throw Error(`This file is not a supported .listsplat.json project.`)}function de(e){let t=e.split(/\r?\n/,1)[0]??``,n=[`,`,`	`,`;`],r=`,`,i=-1;for(let e of n){let n=t.split(e).length-1;n>i&&(i=n,r=e)}return r}function fe(e,t=de(e)){let n=[],r=``,i=[],a=!1;for(let o=0;o<e.length;o+=1){let s=e[o],c=e[o+1];a&&s===`"`&&c===`"`?(r+=`"`,o+=1):s===`"`?a=!a:!a&&s===t?(i.push(r),r=``):!a&&(s===`
`||s===`\r`)?(s===`\r`&&c===`
`&&(o+=1),i.push(r),i.some(e=>e.length>0)&&n.push(i),i=[],r=``):r+=s}return i.push(r),i.some(e=>e.length>0)&&n.push(i),n}function pe(e,t){let i=fe(t),a=(i[0]?.map((e,t)=>e.trim()||`Field ${t+1}`)??[`Field 1`]).map(e=>n(e)),o=i.slice(1).map(e=>r(a,Object.fromEntries(a.map((t,n)=>[t.id,e[n]??``]))));return{id:`table_${Date.now().toString(36)}`,name:e,fields:a,records:o.length>0?o:[r(a)]}}function me(e){let t=e==null?``:String(e);return/[",\n\r]/.test(t)?`"${t.replaceAll(`"`,`""`)}"`:t}function he(e){return[e.fields.map(e=>me(e.name)).join(`,`),...e.records.map(t=>e.fields.map(e=>me(t.values[e.id])).join(`,`))].join(`
`)}var ge=`listsplat.autosave.v1`;function _e(e){localStorage.setItem(ge,JSON.stringify(e))}function ve(){let e=localStorage.getItem(ge);if(!e)return null;let t=JSON.parse(e);return ue(t),t}function ye(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,a.click(),URL.revokeObjectURL(i)}function be(e){return e==null?``:String(e).trim().toLowerCase()}function xe(e,n,r,i,a){return{id:t(`relationship`),name:e.trim()||`New Relationship`,fromTableId:n,fromFieldId:r,toTableId:i,toFieldId:a}}function Se(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,relationships:[...e.schema.relationships,t]}}}function Ce(e,t,n,r){let i=be(n.values[e.fromFieldId]);return!i||t.id!==e.fromTableId||r.id!==e.toTableId?[]:r.records.filter(t=>be(t.values[e.toFieldId])===i)}function we(e,t){let n=e.schema.tables.find(e=>e.id===t.fromTableId),r=e.schema.tables.find(e=>e.id===t.toTableId),i=n?.fields.find(e=>e.id===t.fromFieldId),a=r?.fields.find(e=>e.id===t.toFieldId);return`${n?.name??`Table`}:${i?.name??`Field`} -> ${r?.name??`Table`}:${a?.name??`Field`}`}function Te(e,t){return e.records.map(e=>Number(e.values[t])).filter(e=>Number.isFinite(e))}function Ee(e){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)).map(t=>{let n=Te(e,t.id),r=n.reduce((e,t)=>e+t,0);return{fieldId:t.id,fieldName:t.name,count:n.length,sum:r,average:n.length?r/n.length:0,minimum:n.length?Math.min(...n):0,maximum:n.length?Math.max(...n):0}})}function De(e){let t=[],n=``,r=!1;for(let i=0;i<e.length;i+=1){let a=e[i],o=e[i-1];if(a===`"`&&o!==`\\`){r=!r,n+=a;continue}if(a===`,`&&!r){t.push(n.trim()),n=``;continue}n+=a}return(n.trim()||e.endsWith(`,`))&&t.push(n.trim()),t}function Oe(e){let t=e.trim();if(t.startsWith(`"`)&&t.endsWith(`"`))return t.slice(1,-1).replace(/\\"/g,`"`)}function ke(e,t,n){let r=n.trim().toLowerCase(),i=e.fields.find(e=>e.name.toLowerCase()===r);return i?String(t.values[i.id]??``):``}function p(e,t,n){return Oe(n)??ke(e,t,n)}function m(e,t,n){let r=Number(p(e,t,n));return Number.isFinite(r)?r:0}function Ae(e,t){let n=t.trim().toLowerCase(),r=e.fields.find(e=>e.name.toLowerCase()===n);return r?Te(e,r.id):[]}function h(e){return Number.isFinite(e)?String(Number(e.toFixed(8))):`Formula error: not a number`}function je(e){return e.toLowerCase().replace(/\b[a-z]/g,e=>e.toUpperCase())}function Me(e,t,n,r){if(!e)return[];let i=r.trim().toLowerCase(),a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===i),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0;return a&&o?Ce(a,t,n,o):[]}function Ne(e,t,n,r,i){if(!e)return``;let a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===r.trim().toLowerCase()),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0,s=Me(e,t,n,r)[0],c=o?.fields.find(e=>e.name.toLowerCase()===i.trim().toLowerCase());return s&&c?String(s.values[c.id]??``):``}function Pe(e,t,n,r){let i=e.trim();if(!i)return``;let a=i.match(/^([A-Z_]+)\((.*)\)$/i);if(!a)return`Formula error: use a function like FIELD(Name)`;let o=a[1].toUpperCase(),s=De(a[2]),c=s[0]??``;if(o===`FIELD`)return ke(t,n,c);if(o===`JOIN`)return s.map(e=>p(t,n,e)).join(``);if(o===`UPPER`)return p(t,n,c).toUpperCase();if(o===`LOWER`)return p(t,n,c).toLowerCase();if(o===`TITLECASE`)return je(p(t,n,c));if(o===`TRIM`)return p(t,n,c).trim();if(o===`LENGTH`)return String(p(t,n,c).length);if(o===`CONTAINS`)return p(t,n,c).toLowerCase().includes(p(t,n,s[1]??``).toLowerCase())?`Yes`:`No`;if(o===`IF_EMPTY`)return p(t,n,c).trim()?p(t,n,c):p(t,n,s[1]??``);if(o===`LOOKUP`)return Ne(r,t,n,Oe(c)??c,Oe(s[1]??``)??s[1]??``);if(o===`COUNT_RELATED`)return String(Me(r,t,n,Oe(c)??c).length);if(o===`ADD`)return h(s.reduce((e,r)=>e+m(t,n,r),0));if(o===`SUBTRACT`)return h(s.slice(1).reduce((e,r)=>e-m(t,n,r),m(t,n,c)));if(o===`MULTIPLY`)return h(s.reduce((e,r)=>e*m(t,n,r),1));if(o===`DIVIDE`){let e=m(t,n,s[1]??``);return e===0?`Formula error: divide by zero`:h(m(t,n,c)/e)}if(o===`ROUND`){let e=Math.max(0,Math.min(6,Math.round(m(t,n,s[1]??`"0"`))));return String(Number(m(t,n,c).toFixed(e)))}if([`SUM`,`AVERAGE`,`MIN`,`MAX`,`COUNT`].includes(o)){let e=Ae(t,c);return o===`SUM`?h(e.reduce((e,t)=>e+t,0)):o===`AVERAGE`?h(e.length?e.reduce((e,t)=>e+t,0)/e.length:0):o===`MIN`?h(e.length?Math.min(...e):0):o===`MAX`?h(e.length?Math.max(...e):0):String(e.length)}return`Formula error: ${o} is not supported`}function g(e){return e==null?``:String(e)}function Fe(e,t){let n=t.query.trim();if(!n)return e.records;let r=n.toLowerCase();return e.records.filter(n=>(t.fieldId===`all`?e.fields.map(e=>e.id):[t.fieldId]).some(e=>g(n.values[e]).toLowerCase().includes(r)))}function Ie(e,t){let n=Number(e),r=Number(t);return e!==``&&t!==``&&!Number.isNaN(n)&&!Number.isNaN(r)?n-r:e.localeCompare(t,void 0,{numeric:!0,sensitivity:`base`})}function Le(e,t){return t.length?[...e].sort((e,n)=>{for(let r of t){let t=g(e.values[r.fieldId]).trim(),i=g(n.values[r.fieldId]).trim();if(t===``&&i!==``)return 1;if(t!==``&&i===``)return-1;let a=Ie(t,i)*(r.direction===`asc`?1:-1);if(a!==0)return a}return 0}):e}function Re(e,t){let n=g(e.values[t.fieldId]),r=n.trim().toLowerCase(),i=t.value.trim().toLowerCase(),a=Number(n),o=Number(t.value),s=n.trim()!==``&&t.value.trim()!==``&&!Number.isNaN(a)&&!Number.isNaN(o);switch(t.operator){case`contains`:return r.includes(i);case`equals`:return s?a===o:r===i;case`startsWith`:return r.startsWith(i);case`endsWith`:return r.endsWith(i);case`greaterThan`:return s?a>o:r>i;case`lessThan`:return s?a<o:r<i;case`between`:{let e=Number(t.value),n=Number(t.value2);return!Number.isNaN(e)&&!Number.isNaN(n)&&!Number.isNaN(a)?a>=Math.min(e,n)&&a<=Math.max(e,n):r>=i&&r<=(t.value2??``).trim().toLowerCase()}case`isEmpty`:return n.trim()===``;case`isNotEmpty`:return n.trim()!==``;default:return!0}}function ze(e,t){return!t||t.rules.length===0?e:e.filter(e=>t.match===`all`?t.rules.every(t=>Re(e,t)):t.rules.some(t=>Re(e,t)))}function Be(e,t){let n=new Map;return e.records.forEach(e=>{let r=g(e.values[t]).trim().toLowerCase();r&&n.set(r,(n.get(r)??0)+1)}),e.records.filter(e=>{let r=g(e.values[t]).trim().toLowerCase();return r?(n.get(r)??0)>1:!1})}function Ve(e,t){return e.records.filter(e=>!g(e.values[t]).trim())}function He(e,t){if(!t.find)return[];let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=[];return e.records.forEach(e=>{o.has(e.id)&&t.fieldIds.forEach(n=>{let r=g(e.values[n]),i=r.replace(a,t.replacement);i!==r&&s.push({recordId:e.id,fieldId:n,before:r,after:i})})}),s}function Ue(e,t){if(!t.find)return{table:e,count:0};let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=0,c=e.records.map(e=>{if(!o.has(e.id))return e;let n=!1,r={...e.values};return t.fieldIds.forEach(e=>{let i=g(r[e]),o=i.replace(a,()=>(s+=1,t.replacement));o!==i&&(n=!0,r[e]=o)}),n?{...e,updatedAt:new Date().toISOString(),values:r}:e});return{table:{...e,records:c},count:s}}var We={email:/^[^\s@]+@[^\s@]+\.[^\s@]+$/,url:/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/,phone:/^[+()\d][\d\s().-]{5,}$/};function Ge(e){return e==null?``:String(e)}function Ke(e,t,n,r){let i=qe(e,t,n,r);return i&&e.customMessage?e.customMessage:i}function qe(e,t,n,r){let i=Ge(t).trim();if(i===``)return e.required?`This field is required.`:``;if(e.maxLength&&i.length>e.maxLength)return`Keep this ${e.maxLength} characters or fewer.`;if(e.type===`email`&&!We.email.test(i))return`Enter a valid email address.`;if(e.type===`phone`&&!We.phone.test(i))return`Enter a valid phone number.`;if([`number`,`currency`,`percent`,`rating`].includes(e.type)){let t=Number(i);if(Number.isNaN(t))return`Enter a number.`;if(e.min!=null&&t<e.min)return`Must be at least ${e.min}.`;if(e.max!=null&&t>e.max)return`Must be at most ${e.max}.`}if([`text`,`longText`,`link`].includes(e.type)&&e.pattern&&e.pattern!==`none`){if(e.pattern===`custom`){if(e.customPattern)try{if(!new RegExp(e.customPattern).test(i))return`Does not match the required format.`}catch{}}else if(!We[e.pattern].test(i))return`Enter a valid ${e.pattern}.`}return e.unique&&n&&n.records.some(t=>t.id!==r&&Ge(t.values[e.id]).trim().toLowerCase()===i.toLowerCase())?`This value is already used in another record.`:``}function Je(e){let t=[];return e.fields.forEach(n=>{[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(n.type)||e.records.forEach(r=>{let i=Ke(n,r.values[n.id],e,r.id);i&&t.push({record:r,field:n,message:i})})}),t}function _(e,t,n,r,i,a){return{id:e,title:t,gradeBand:n,goal:r,table:pe(t,i),reflectionQuestions:a}}var Ye=[_(`classroom-library`,`Classroom Library Catalog`,`Grades 3-8`,`Track books, genres, reading levels, and recommendations.`,`Title,Author,Genre,Pages,Who would enjoy it?
Charlotte's Web,E. B. White,Fiction,192,Readers who like animals
Hidden Figures,Margot Lee Shetterly,Biography,240,Readers who like history`,[`Which genre appears most often?`,`What book would you recommend first?`]),_(`science-observations`,`Science Observation Log`,`Grades 3-8`,`Collect observations over time and look for patterns.`,`Date,Object observed,Location,Measurement,Observation
2026-06-29,Bean plant,Window,8 cm,Two new leaves
2026-06-30,Bean plant,Window,8.5 cm,Stem leaned toward light`,[`What changed over time?`,`What might explain the pattern?`]),_(`state-facts`,`State Facts Database`,`Grades 4-8`,`Compare places using consistent fields.`,`State,Capital,Region,Population note,Interesting fact
Texas,Austin,South,Large population,Has many different ecosystems
New Mexico,Santa Fe,Southwest,Medium population,Capital is over 400 years old`,[`Which fields help compare states?`,`What new field would improve this database?`]),_(`book-reviews`,`Book Review Collection`,`Grades 3-8`,`Collect opinions and evidence from student reading.`,`Book,Reviewer,Rating,Favorite part,Would recommend?
Because of Winn-Dixie,Jordan,5,The friendship story,Yes
Wonder,Avery,4,The different points of view,Yes`,[`Which book has the strongest recommendation?`,`What evidence supports each rating?`]),_(`vocabulary-bank`,`Vocabulary Word Bank`,`Grades 2-8`,`Build a searchable word list with definitions and examples.`,`Word,Definition,Example sentence,Subject
evaporate,To change from liquid to gas,Water can evaporate in sunlight,Science
compare,To tell how things are alike,Compare two characters,Reading`,[`Which words belong to more than one subject?`,`Which examples help you remember the word?`]),_(`survey-results`,`Simple Survey Results`,`Grades 3-8`,`Organize survey answers and look for patterns.`,`Question,Answer,Student group,Count,Notes
Favorite recess activity,Soccer,Grade 4,12,Most common outdoor choice
Favorite recess activity,Drawing,Grade 4,6,Quiet activity choice`,[`Which answer appears most often?`,`What new question should the class ask next?`]),_(`museum-cards`,`Museum Exhibit Cards`,`Grades 4-8`,`Create printable exhibit cards for objects, images, or research topics.`,`Item,Creator or source,Year,Category,Why it matters
Printing press,Johannes Gutenberg,1440,Invention,Changed how books were made
Apollo 11 mission,NASA,1969,Space exploration,First humans walked on the Moon`,[`How should the exhibit be grouped?`,`What field would help visitors understand the item?`])];function Xe(e){let t=e.table.fields.map(e=>({...e,id:`${e.id}_${Date.now().toString(36)}`})),n=e.table.records.map(n=>r(t,Object.fromEntries(e.table.fields.map((e,r)=>[t[r].id,n.values[e.id]??``]))));return{...e.table,id:`table_${e.id}_${Date.now().toString(36)}`,fields:t,records:n}}var Ze=`drawsplat.language`,Qe=[{code:`en`,label:`English`,dir:`ltr`,htmlLang:`en`},{code:`es`,label:`Español`,dir:`ltr`,htmlLang:`es`},{code:`vi`,label:`Tiếng Việt`,dir:`ltr`,htmlLang:`vi`},{code:`ar`,label:`العربية`,dir:`rtl`,htmlLang:`ar`},{code:`zh`,label:`中文`,dir:`ltr`,htmlLang:`zh`},{code:`uh`,label:`हिन्दी / اردو`,dir:`ltr`,htmlLang:`hi`}],$e={es:{New:`Nuevo`,"Save JSON":`Guardar JSON`,"Open JSON":`Abrir JSON`,"Export CSV":`Exportar CSV`,File:`Archivo`,Edit:`Editar`,Data:`Datos`,Layout:`Diseño`,Tools:`Herramientas`,View:`Vista`,Teacher:`Docente`,Help:`Ayuda`,Title:`Título`,Search:`Buscar`,In:`En`,"All fields":`Todos los campos`,Sort:`Ordenar`,"Choose field":`Elegir campo`,"New field":`Campo nuevo`,"Field name":`Nombre del campo`,Type:`Tipo`,"Add field":`Agregar campo`,"Add record":`Agregar registro`,Table:`Tabla`,Form:`Formulario`,Cards:`Tarjetas`,Gallery:`Galería`,Labels:`Etiquetas`,Report:`Informe`,"Upload image":`Subir imagen`,"No image yet":`Sin imagen todavía`},vi:{New:`Mới`,"Save JSON":`Lưu JSON`,"Open JSON":`Mở JSON`,"Export CSV":`Xuất CSV`,File:`Tệp`,Edit:`Sửa`,Data:`Dữ liệu`,Layout:`Bố cục`,Tools:`Công cụ`,View:`Xem`,Teacher:`Giáo viên`,Help:`Trợ giúp`,Title:`Tiêu đề`,Search:`Tìm`,Sort:`Sắp xếp`,Table:`Bảng`,Form:`Biểu mẫu`,Cards:`Thẻ`,Gallery:`Thư viện ảnh`,Labels:`Nhãn`,Report:`Báo cáo`},ar:{New:`جديد`,"Save JSON":`حفظ JSON`,"Open JSON":`فتح JSON`,"Export CSV":`تصدير CSV`,File:`ملف`,Edit:`تحرير`,Data:`بيانات`,Layout:`تخطيط`,Tools:`أدوات`,View:`عرض`,Teacher:`المعلم`,Help:`مساعدة`,Title:`العنوان`,Search:`بحث`,Sort:`فرز`,Table:`جدول`,Form:`نموذج`,Cards:`بطاقات`,Gallery:`معرض`,Labels:`ملصقات`,Report:`تقرير`},zh:{New:`新建`,"Save JSON":`保存 JSON`,"Open JSON":`打开 JSON`,"Export CSV":`导出 CSV`,File:`文件`,Edit:`编辑`,Data:`数据`,Layout:`布局`,Tools:`工具`,View:`视图`,Teacher:`教师`,Help:`帮助`,Title:`标题`,Search:`搜索`,Sort:`排序`,Table:`表格`,Form:`表单`,Cards:`卡片`,Gallery:`图库`,Labels:`标签`,Report:`报告`},uh:{New:`नया`,File:`फ़ाइल`,Edit:`संपादन`,Data:`डेटा`,Layout:`लेआउट`,Tools:`औज़ार`,View:`दृश्य`,Teacher:`शिक्षक`,Help:`सहायता`,Search:`खोज`,Table:`तालिका`,Form:`फ़ॉर्म`,Cards:`कार्ड`,Gallery:`गैलरी`,Labels:`लेबल`,Report:`रिपोर्ट`}},et=document.querySelector(`#app`);if(!et)throw Error(`ListSplatTM app root was not found.`);var v=et,y=ve()??a(),b=y.schema.tables[0].id,x=y.schema.tables[0].records[0]?.id??``,S=`table`,tt=`Saved locally`,C=``,w=`all`,T=[],E=null,D={match:`all`,rules:[]},O=[],nt=``,k=new Set,A=null,j=!1,M=``,rt=``,it=``,at=``,ot=!1,st=null,N=[],P=new Set,F=`none`,ct=``,I=`Tip: Start with one table, then add relationships when your project needs them.`,L=[],R=[],lt=``,ut=null,z=[],dt=b,ft=y.schema.tables[1]?.id??b,B=null,pt=``,mt=gt();function V(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function ht(e){let t=(e||``).toLowerCase();return t.startsWith(`es`)?`es`:t.startsWith(`vi`)?`vi`:t.startsWith(`ar`)?`ar`:t.startsWith(`zh`)?`zh`:t===`uh`||t.startsWith(`ur`)||t.startsWith(`hi`)?`uh`:`en`}function gt(){let e=new URLSearchParams(window.location.search);try{return ht(e.get(`lang`)||localStorage.getItem(Ze)||navigator.language)}catch{return ht(e.get(`lang`)||navigator.language)}}function _t(e){return Qe.map(({code:t,label:n})=>`<option value="${t}"${t===e?` selected`:``}>${n}</option>`).join(``)}function H(e){return mt===`en`?e:$e[mt][e]??e}function vt(){let e=Qe.find(e=>e.code===mt)??Qe[0];document.documentElement.lang=e.htmlLang,document.documentElement.dir=e.dir}function U(){return y.schema.tables.find(e=>e.id===b)??y.schema.tables[0]}function W(e){let t=Fe(e,{query:C,fieldId:w});return t=t.filter(e=>j?e.archived:!e.archived),t=ze(t,E),P.size>0&&(t=t.filter(e=>P.has(e.id))),Le(t,T.filter(t=>e.fields.some(e=>e.id===t.fieldId)))}function yt(e){return e.records.filter(e=>e.archived).length}function bt(){return!!C||!!(E&&E.rules.length)||P.size>0}function xt(){C=``,E=null,P=new Set}function St(e){e.records.some(e=>e.id===x)||(x=e.records[0]?.id??``)}function G(e){y=e,St(U()),_e(y),tt=`Saved locally`,Q()}function K(e){L=[{label:e,project:structuredClone(y)},...L].slice(0,25),R=[]}function Ct(e,t){let n=`${e}:${t}`;lt!==n&&(K(`edit ${U().fields.find(e=>e.id===t)?.name??`cell`}`),lt=n,wt())}function wt(){let e=v.querySelector(`[data-action="undo-change"]`),t=v.querySelector(`[data-action="redo-change"]`);e&&(e.disabled=L.length===0),t&&(t.disabled=R.length===0)}function Tt(e){y=e,b=y.schema.tables.some(e=>e.id===b)?b:y.schema.tables[0].id,St(U()),_e(y),Q()}function Et(){let e=L[0];if(!e){I=`Nothing to undo yet.`,Q();return}R=[{label:e.label,project:structuredClone(y)},...R].slice(0,25),L=L.slice(1),I=`Undid ${e.label}.`,Tt(e.project)}function Dt(){let e=R[0];if(!e){I=`Nothing to redo.`,Q();return}L=[{label:e.label,project:structuredClone(y)},...L].slice(0,25),R=R.slice(1),I=`Redid ${e.label}.`,Tt(e.project)}function q(e){b=e.id,G(re(y,e))}function Ot(){document.querySelectorAll(`.menu[open]`).forEach(e=>{e.open=!1})}function kt(e){G({...y,updatedAt:new Date().toISOString(),metadata:{...y.metadata,title:e||`Untitled Database`}})}function At(e=y){ye(`${e.metadata.title||`listsplat-project`}.listsplat.json`,JSON.stringify(e,null,2),`application/json`)}function jt(){ye(`${U().name}.csv`,he(U()),`text/csv;charset=utf-8`)}function Mt(){let e=U(),t=W(e),n=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${V(y.metadata.title)}</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{color:#5b21b6}</style></head>
<body><h1>${V(y.metadata.title)}</h1><p>${V(e.name)} report from ListSplatTM.</p>
<table><thead><tr>${e.fields.map(e=>`<th>${V(e.name)}</th>`).join(``)}</tr></thead>
<tbody>${t.map(t=>`<tr>${e.fields.map(n=>`<td>${V(Y(e,t,n.id))}</td>`).join(``)}</tr>`).join(``)}</tbody></table></body></html>`;ye(`${y.metadata.title||`listsplat-report`}.html`,n,`text/html;charset=utf-8`)}function Nt(){let e=y.schema.tables.map(e=>{let t=Wt(e),n=t.reduce((e,t)=>e+t.missing,0),r=t.reduce((e,t)=>e+t.duplicates,0);return`
        <section>
          <h2>${V(e.name)}</h2>
          <p>${e.records.length} records, ${e.fields.length} fields, ${n} missing values, ${r} duplicate values.</p>
          <table>
            <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th><th>Missing</th><th>Duplicates</th></tr></thead>
            <tbody>${e.fields.map(e=>{let n=t.find(t=>t.field.id===e.id);return`<tr><td>${V(e.name)}</td><td>${V(e.type)}</td><td>${e.required?`Yes`:`No`}</td><td>${V(e.description)}</td><td>${n?.missing??0}</td><td>${n?.duplicates??0}</td></tr>`}).join(``)}</tbody>
          </table>
        </section>
      `}).join(``),t=y.schema.relationships.length?`<ul>${y.schema.relationships.map(e=>`<li>${V(e.name)}: ${V(we(y,e))}</li>`).join(``)}</ul>`:`<p>No relationships have been created yet.</p>`,n=y.teacher.notes.length?`<ul>${y.teacher.notes.map(e=>`<li>${V(e)}</li>`).join(``)}</ul>`:`<p>No teacher notes yet.</p>`,r=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${V(y.metadata.title)} Project Packet</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937;line-height:1.5}h1,h2{color:#5b21b6}section{margin:0 0 28px}table{border-collapse:collapse;width:100%;margin-top:10px}th,td{border:1px solid #d8ccff;padding:8px;text-align:left;vertical-align:top}th{background:#f3edff;color:#4c1d95}.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.meta div{border:1px solid #d8ccff;border-radius:8px;padding:12px;background:#faf8ff}</style></head>
<body>
  <h1>${V(y.metadata.title||`ListSplat Project`)} Project Packet</h1>
  <div class="meta">
    <div><strong>Author</strong><br>${V(y.metadata.author||`Not set`)}</div>
    <div><strong>Class</strong><br>${V(y.metadata.className||`Not set`)}</div>
    <div><strong>Tables</strong><br>${y.schema.tables.length}</div>
    <div><strong>Relationships</strong><br>${y.schema.relationships.length}</div>
  </div>
  <section><h2>Teacher Notes</h2>${n}</section>
  <section><h2>Relationships</h2>${t}</section>
  ${e}
</body></html>`;ye(`${y.metadata.title||`listsplat`}-project-packet.html`,r,`text/html;charset=utf-8`)}function Pt(e){e.text().then(e=>{let t=JSON.parse(e);ue(t),b=t.schema.tables[0].id,x=t.schema.tables[0].records[0]?.id??``,G(t)}).catch(e=>{window.alert(e instanceof Error?e.message:`Could not open this ListSplatTM file.`)})}function Ft(e){e.text().then(t=>{let n=pe(e.name.replace(/\.csv$/i,``),t);B=n,pt=e.name;let r=U();N=n.fields.map(e=>{let t=n.records.slice(0,12).map(t=>String(t.values[e.id]??``)),i=r.fields.find(t=>t.name.trim().toLowerCase()===e.name.trim().toLowerCase());return{header:e.name,action:i?`existing`:`new`,type:ar(t),fieldId:i?.id??``}}),F=`csvImport`,I=`Previewing ${n.records.length} CSV record${n.records.length===1?``:`s`} from ${e.name}.`,Q()})}function It(e){if(!B){F=`none`;return}or();let i=B;if(K(`CSV import`),e===`new`){let e=N.filter(e=>e.action!==`skip`).map((e,t)=>{let r=i.fields[N.indexOf(e)];return{field:n(e.header||`Field ${t+1}`,e.type),sourceFieldId:r.id}}),a=i.records.map(t=>r(e.map(e=>e.field),Object.fromEntries(e.map(e=>[e.field.id,u(t.values[e.sourceFieldId],e.field.type).value])))),o={id:t(`table`),name:i.name,fields:e.map(e=>e.field),records:a.length?a:[r(e.map(e=>e.field))]};b=o.id,x=o.records[0]?.id??``,B=null,xt(),T=[],k=new Set,F=`none`,I=`Imported ${o.records.length} records from ${pt}.`,G({...y,updatedAt:new Date().toISOString(),schema:{...y.schema,tables:[...y.schema.tables,o]},layouts:[...y.layouts,{id:t(`layout`),name:`${o.name} Table`,tableId:o.id,mode:`table`,locked:!1},{id:t(`layout`),name:`${o.name} Form`,tableId:o.id,mode:`form`,locked:!1}]});return}let a=U();N.forEach((e,t)=>{if(e.action===`new`){let r=n(e.header||`Field ${t+1}`,e.type);a={...a,fields:[...a.fields,r]},e.fieldId=r.id}});let o=new Map(a.fields.map(e=>[e.id,e])),s=i.records.map(e=>r(a.fields,Object.fromEntries(N.filter(e=>e.action!==`skip`&&e.fieldId&&o.has(e.fieldId)).map((t,n)=>{let r=i.fields[N.indexOf(t)],a=o.get(t.fieldId);return[t.fieldId,u(e.values[r.id],a.type,a.options).value]}))));B=null,F=`none`,I=`Appended ${s.length} CSV record${s.length===1?``:`s`} to ${a.name}.`,q({...a,records:[...a.records,...s]})}function Lt(e){let t=Ye.find(t=>t.id===e);if(!t)return;let n=Xe(t);K(`template load`),b=n.id,x=n.records[0]?.id??``,I=`Loaded ${t.title}.`,G({...y,metadata:{...y.metadata,title:t.title},schema:{...y.schema,tables:[...y.schema.tables,n]},teacher:{...y.teacher,notes:t.reflectionQuestions}})}function J(e,t){return`
    <details class="menu">
      <summary>${V(H(e))}</summary>
      <div class="menu-panel">
        ${t.map(([e,t])=>`<button type="button" data-action="${e}">${V(H(t))}</button>`).join(``)}
      </div>
    </details>
  `}function Rt(e=`text`){return[[`text`,`Short text`],[`longText`,`Long text`],[`number`,`Number`],[`currency`,`Currency`],[`percent`,`Percent`],[`date`,`Date`],[`time`,`Time`],[`dateTime`,`Date and time`],[`checkbox`,`Checkbox`],[`rating`,`Rating`],[`choice`,`Single choice`],[`multiSelect`,`Multiple choice`],[`email`,`Email`],[`phone`,`Phone`],[`link`,`Web address`],[`image`,`Image`],[`calculation`,`Calculation`],[`autoNumber`,`Auto number`],[`createdAt`,`Created time`],[`updatedAt`,`Updated time`]].map(([t,n])=>`<option value="${t}" ${e===t?`selected`:``}>${n}</option>`).join(``)}function Y(e,t,n){let r=e.fields.find(e=>e.id===n);return r?.type===`calculation`&&r.formula?Pe(r.formula,e,t,y):t.values[n]??``}function zt(e,t){if(t===``||t==null)return``;if(!e)return String(t);let n=typeof t==`number`?t:Number(t);return e.type===`currency`&&Number.isFinite(n)?n.toLocaleString(void 0,{style:`currency`,currency:`USD`}):e.type===`percent`&&Number.isFinite(n)?`${n.toLocaleString()}%`:e.type===`number`&&Number.isFinite(n)?n.toLocaleString():e.type===`checkbox`?t===!0||t===`true`?`Yes`:`No`:String(t)}function X(){return y.layouts.find(e=>e.tableId===b&&e.mode===S)}function Bt(e){return!!e}function Z(e){let t=new Set(X()?.hiddenFieldIds??[]);return Vt(e).filter(e=>!t.has(e.id))}function Vt(e){let t=X()?.fieldOrder??e.fields.map(e=>e.id),n=new Map(e.fields.map(e=>[e.id,e]));return[...t.map(e=>n.get(e)).filter(Bt),...e.fields.filter(e=>!t.includes(e.id))].filter(e=>e&&!e.hidden)}function Ht(e){return e.fields.filter(e=>e.type===`calculation`)}function Ut(e){return Ht(e).reduce((t,n)=>n.formula?t+e.records.filter(t=>String(Pe(n.formula??``,e,t,y)).startsWith(`Formula error:`)).length:t,0)}function Wt(e){return e.fields.filter(e=>!e.hidden&&![`image`,`autoNumber`,`createdAt`,`updatedAt`,`calculation`].includes(e.type)).map(t=>({field:t,missing:Ve(e,t.id).length,duplicates:Be(e,t.id).length}))}function Gt(e){return Z(e).filter(e=>e.type===`image`)}function Kt(e,t){let n=Gt(e)[0];return n?String(Y(e,t,n.id)??``):``}function qt(e){let t=X();t&&G({...y,updatedAt:new Date().toISOString(),layouts:y.layouts.map(n=>n.id===t.id?{...n,...e}:n)})}function Jt(e,t){let n=e.fields.find(e=>!e.hidden)??e.fields[0],r=n?Y(e,t,n.id):``;return String(r||`Untitled record`)}function Yt(e,t,n,r){let i=e.fields.find(e=>e.id===n),a=Y(e,t,n),o=`aria-label="${V(i?.name??`Field`)}, record ${r+1}" data-record-id="${t.id}" data-field-id="${n}"`,s=i&&![`checkbox`,`image`,`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(i.type)?Ke(i,a,e,t.id):``,c=s?`cell-input cell-invalid`:`cell-input`,l=s?` title="${V(s)}"`:``,u=`${l}${i?.readonly?` readonly disabled`:``}${i?.maxLength?` maxlength="${i.maxLength}"`:``}`;if(i?.type===`checkbox`)return`<input class="cell-checkbox" type="checkbox" ${o} ${i.readonly?`disabled`:``} ${a===!0||a===`true`?`checked`:``}>`;if(i?.type===`multiSelect`){let e=i.options?.length?i.options:[`Yes`,`No`],r=new Set(String(a??``).split(`,`).map(e=>e.trim()).filter(Boolean));return`<div class="multi-cell${s?` cell-invalid`:``}" ${o}${s?` title="${V(s)}"`:``}>${e.map(e=>`<label class="multi-chip${r.has(e)?` on`:``}"><input type="checkbox" class="multi-option" data-record-id="${t.id}" data-field-id="${n}" data-multi-option="${V(e)}" ${r.has(e)?`checked`:``} ${i.readonly?`disabled`:``}>${V(e)}</label>`).join(``)}</div>`}if(i?.type===`time`)return`<input class="${c}" type="time" ${o}${u} value="${V(a)}">`;if(i?.type===`dateTime`)return`<input class="${c}" type="datetime-local" ${o}${u} value="${V(a)}">`;if(i?.type===`email`){let e=String(a??``);return`<div class="link-cell"><input class="${c}" type="email" ${o}${u} value="${V(e)}" placeholder="name@example.com">${e&&!s?`<a class="link-open" href="mailto:${V(e)}" title="Send email" aria-label="Send email">✉</a>`:``}</div>`}if(i?.type===`phone`)return`<input class="${c}" type="tel" ${o}${u} value="${V(a)}" placeholder="(555) 555-5555">`;if(i?.type===`link`){let e=String(a??``),t=/^https?:\/\//i.test(e)?e:e?`https://${e}`:``;return`<div class="link-cell"><input class="${c}" type="url" ${o}${u} value="${V(e)}" placeholder="https://…">${t?`<a class="link-open" href="${V(t)}" target="_blank" rel="noopener" title="Open link" aria-label="Open link">↗</a>`:``}</div>`}if(i?.type===`image`){let e=String(a??``);return`
      <div class="image-cell" tabindex="0" role="button" title="Click here and paste an image, or use Upload image." ${o}>
        ${e?`<img src="${V(e)}" alt="">`:`<span>${V(H(`No image yet`))}</span>`}
        <small>Paste an image here or upload one.</small>
        <label class="image-upload-label">
          ${V(H(`Upload image`))}
          <input class="image-input" type="file" accept="image/*" ${o}>
        </label>
      </div>
    `}if(i?.type===`rating`)return`<input class="${c}" type="number" min="0" max="5" step="1" ${o}${u} value="${V(a)}">`;if(i?.type===`choice`){let e=i.options?.length?i.options:[`Yes`,`No`];return`<select class="${c}" ${o}${l}${i.readonly?` disabled`:``}><option value=""${a===``?` selected`:``}>—</option>${e.map(e=>`<option value="${V(e)}" ${String(a)===e?`selected`:``}>${V(e)}</option>`).join(``)}</select>`}if(i?.type===`autoNumber`||i?.type===`createdAt`||i?.type===`updatedAt`)return`<output class="calc-output">${V(a)}</output>`;if(i?.type===`longText`)return`<textarea class="${c}" ${o}${u}>${V(a)}</textarea>`;if(i?.type===`date`)return`<input class="${c}" type="date" ${o}${u} value="${V(a)}">`;if(i?.type===`number`||i?.type===`currency`||i?.type===`percent`){let e=i.type===`currency`?`<span class="cell-affix">$</span>`:``,t=i.type===`percent`?`<span class="cell-affix">%</span>`:``;return`<span class="num-cell">${e}<input class="${c}" type="number" step="any" ${o}${u} value="${V(a)}">${t}</span>`}return i?.type===`calculation`?`<output class="calc-output">${V(a)}</output>`:`<input class="${c}" ${o}${u} value="${V(a)}">`}function Xt(e){return`
    <div class="table-tabs">
      ${y.schema.tables.map(t=>`<button type="button" class="table-tab ${t.id===e.id?`active`:``}" data-table-id="${t.id}">${V(t.name)}</button>`).join(``)}
    </div>
  `}function Zt(e,t){if(t.length===0){let e=bt();return`
      <div class="data-grid-wrap">
        <div class="empty-state">
          <h3>${V(H(e?`No records match your find`:`No records yet`))}</h3>
          <p>${V(H(e?`Try a different search, or show all records.`:`Add your first record to start building this database.`))}</p>
          <button type="button" class="button primary" data-action="${e?`clear-find`:`add-record`}">${e?V(H(`Show all records`)):`+ ${V(H(`Add first record`))}`}</button>
        </div>
      </div>
    `}let n=Z(e),r=t.length>0&&t.every(e=>k.has(e.id)),i=e=>{let t=T.find(t=>t.fieldId===e);return t?t.direction===`asc`?`▲`:`▼`:`⇅`},a=an(e,t),o=n.length+3,s=(t,r)=>`
                <tr class="${t.id===x?`active-row`:``}${k.has(t.id)?` selected-row`:``}" data-record-row="${t.id}">
                  <td class="select-col"><input type="checkbox" data-select-row="${t.id}" aria-label="Select record ${r+1}" ${k.has(t.id)?`checked`:``}></td>
                  <td class="row-num-col"><button type="button" class="row-button" data-select-record="${t.id}">${r+1}</button></td>
                  ${n.map(n=>`<td style="${Qt(n.id)}">${Yt(e,t,n.id,r)}</td>`).join(``)}
                  <td class="record-actions">
                    <button type="button" title="Open record" data-action="expand-record" data-record-action-id="${t.id}">Open</button>
                    <button type="button" data-action="duplicate-record" data-record-action-id="${t.id}">Copy</button>
                    <button type="button" data-action="delete-record" data-record-action-id="${t.id}">Delete</button>
                  </td>
                </tr>
              `,c=0,l=a.map(t=>(M?`<tr class="group-row"><td colspan="${o}"><strong>${V(t.label)}</strong> <span>${t.records.length}${on(e,t.records)?` · `+on(e,t.records):``}</span></td></tr>`:``)+t.records.map(e=>s(e,c++)).join(``)).join(``);return`
    <div class="data-grid-wrap${ot?` wrap-cells`:``}">
      <table class="data-grid">
        <thead>
          <tr>
            <th class="select-col"><input type="checkbox" data-select-all aria-label="Select all records" ${r?`checked`:``}></th>
            <th class="row-num-col">#</th>
            ${n.map(e=>`
                  <th class="col-head" data-col-field="${e.id}" draggable="true" style="${Qt(e.id)}">
                    <button type="button" class="field-button" data-field-settings="${e.id}">
                      ${V(e.name)}${e.required?`<span class="req" title="Required field" aria-label="required">*</span>`:``}<br><small>${V(e.type)}</small>
                    </button>
                    <button type="button" class="col-sort" data-action="sort-toggle" data-sort-toggle="${e.id}" title="Sort by ${V(e.name)}">${i(e.id)}</button>
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
  `}function Qt(e){let t=X()?.columnWidths?.[e];return t?`width:${t}px;min-width:${t}px;`:``}function $t(e){let t=e.records.find(e=>e.id===x)??e.records[0];if(!t)return`<div class="empty-panel">Add a record to use form view.</div>`;let n=y.schema.relationships.filter(t=>t.fromTableId===e.id).map(n=>{let r=y.schema.tables.find(e=>e.id===n.toTableId),i=r?Ce(n,e,t,r):[];return`
        <section class="related-records">
          <h3>${V(n.name)}</h3>
          <p>${i.length} related record${i.length===1?``:`s`} from ${V(r?.name??`another table`)}</p>
          ${i.length?`<div class="related-grid">${i.slice(0,6).map(e=>`
                      <article>
                        <strong>${V(Jt(r,e))}</strong>
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
                ${Yt(e,t,n.id,r)}
                ${n.description?`<small>${V(n.description)}</small>`:``}
              </label>
            `).join(``)}
        ${n}
      </div>
    </div>
  `}function en(e,t){let n=(t,n)=>{let r=Y(e,n,t.id);if(t.type===`image`){let e=String(r??``);return`
        <figure class="card-image-field">
          ${e?`<img src="${V(e)}" alt="">`:`<span>No image yet</span>`}
          <figcaption>${V(t.name)}</figcaption>
        </figure>
      `}if(t.type===`link`&&String(r??``)){let e=String(r),n=/^https?:\/\//i.test(e)?e:`https://${e}`;return`<p><strong>${V(t.name)}</strong><a href="${V(n)}" target="_blank" rel="noopener">${V(e)}</a></p>`}return`<p><strong>${V(t.name)}</strong><span>${V(zt(t,r))}</span></p>`};return`
    <div class="cards-view ${S===`gallery`?`gallery-view`:``}">
      ${t.map(t=>{let r=Kt(e,t);return`
            <article class="record-card" data-select-record="${t.id}">
              ${S===`gallery`?`<div class="gallery-image">${r?`<img src="${V(r)}" alt="">`:`<span>Add an image field, then upload a picture.</span>`}</div>`:``}
              ${Z(e).filter(e=>S!==`gallery`||e.type!==`image`).slice(0,S===`gallery`?4:8).map(e=>n(e,t)).join(``)}
            </article>
          `}).join(``)}
    </div>
  `}function tn(e,t){return`
    <div class="labels-view">
      ${t.map(t=>`
            <article class="print-label">
              ${Z(e).slice(0,4).map(n=>`<p><strong>${V(n.name)}:</strong> ${V(zt(n,Y(e,t,n.id)))}</p>`).join(``)}
            </article>
          `).join(``)}
    </div>
  `}function nn(e,t){let n=Ee(e);return`
    <div class="report-view">
      <header>
        <h2>${V(y.metadata.title)}</h2>
        <p>${V(e.name)} report. ${t.length} record${t.length===1?``:`s`} shown.</p>
      </header>
      ${Zt(e,t)}
      ${n.length?`<section class="summary-strip">${n.map(e=>`<div><strong>${V(e.fieldName)}</strong><span>Sum ${e.sum.toLocaleString()} | Avg ${e.average.toFixed(2)}</span></div>`).join(``)}</section>`:`<p class="empty-panel">Add a number, currency, or percent field to see summaries.</p>`}
    </div>
  `}function rn(e,t,n){let r=new Set;return t.forEach(t=>{let i=String(Y(e,t,n)??``).trim();i&&r.add(i)}),[...r]}function an(e,t){if(!M||!e.fields.some(e=>e.id===M))return[{key:``,label:``,records:t}];let n=new Map;return t.forEach(t=>{let r=String(Y(e,t,M)??``).trim();n.has(r)||n.set(r,[]),n.get(r).push(t)}),[...n.entries()].sort((e,t)=>e[0].localeCompare(t[0],void 0,{numeric:!0})).map(([e,t])=>({key:e,label:e||`(empty)`,records:t}))}function on(e,t){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)&&!e.hidden).slice(0,3).map(n=>{let r=t.map(t=>Number(Y(e,t,n.id))).filter(e=>Number.isFinite(e));if(!r.length)return``;let i=r.reduce((e,t)=>e+t,0);return`${V(n.name)}: sum ${i.toLocaleString()}, avg ${(i/r.length).toFixed(1)}`}).filter(Boolean).join(` · `)}function sn(e,t){return e.map(e=>`<option value="${e.id}" ${t===e.id?`selected`:``}>${V(e.name)}</option>`).join(``)}function cn(e){let t=[];if(S===`list`||S===`table`){let n=e.fields.filter(e=>!e.hidden&&![`image`,`longText`].includes(e.type));t.push(`<label>Group by <select data-group-field><option value="">No grouping</option>${sn(n,M)}</select></label>`),t.push(`<label class="inline-check"><input type="checkbox" data-wrap-toggle ${ot?`checked`:``}> Wrap long text</label>`)}if(S===`kanban`){let n=e.fields.filter(e=>[`choice`,`text`].includes(e.type)&&!e.hidden);t.push(`<label>Columns by <select data-board-field><option value="">Choose a status or choice field</option>${sn(n,rt)}</select></label>`)}if(S===`calendar`){let n=e.fields.filter(e=>[`date`,`dateTime`,`createdAt`,`updatedAt`].includes(e.type)&&!e.hidden);t.push(`<label>Dates from <select data-calendar-field><option value="">Choose a date field</option>${sn(n,it)}</select></label>`)}return t.length?`<div class="view-controls">${t.join(``)}</div>`:``}function ln(e,t){let n=Z(e),r=n[0],i=n.find(e=>e.id!==r?.id&&![`image`].includes(e.type)),a=an(e,t).map(t=>`
        ${M?`<div class="group-head"><strong>${V(t.label)}</strong><span>${t.records.length}${on(e,t.records)?` · `+on(e,t.records):``}</span></div>`:``}
        ${t.records.map(t=>{let n=Kt(e,t);return`
              <div class="list-row${t.id===x?` active`:``}">
                ${n?`<img class="list-thumb" src="${V(n)}" alt="">`:``}
                <div class="list-main">
                  <strong>${V(Y(e,t,r?.id??``)||`Untitled`)}</strong>
                  ${i?`<span>${V(zt(i,Y(e,t,i.id)))}</span>`:``}
                </div>
                <button type="button" class="button ghost" data-action="expand-record" data-record-action-id="${t.id}">Open</button>
              </div>
            `}).join(``)}
      `).join(``);return`<div class="list-view${ot?` wrap-cells`:``}">${a||`<p class="empty-panel">No records to list.</p>`}</div>`}function un(e,t){let n=e.fields.find(e=>e.id===rt);return n?`<div class="kanban">${[``,...(n.options&&n.options.length?n.options:rn(e,t,n.id)).filter(Boolean)].map(r=>{let i=t.filter(t=>String(Y(e,t,n.id)??``).trim()===r);return`
        <div class="kanban-col" data-kanban-col="${V(r)}">
          <div class="kanban-col-head"><strong>${V(r||`Unassigned`)}</strong><span>${i.length}</span></div>
          <div class="kanban-cards">
            ${i.map(t=>`
                  <div class="kanban-card" draggable="true" data-kanban-card="${t.id}" data-action="expand-record" data-record-action-id="${t.id}">
                    <strong>${V(Jt(e,t))}</strong>
                  </div>
                `).join(``)}
          </div>
        </div>
      `}).join(``)}</div>`:`<p class="empty-panel">Choose a status or choice field above to build a board with draggable cards.</p>`}function dn(e,t){let n=e.fields.find(e=>e.id===it)??e.fields.find(e=>[`date`,`dateTime`,`createdAt`,`updatedAt`].includes(e.type)&&!e.hidden);if(!n)return`<p class="empty-panel">Add a date field, then choose it above to see records on a calendar.</p>`;let r=at?new Date(`${at}-01T00:00:00`):new Date,i=r.getFullYear(),a=r.getMonth(),o=`${i}-${String(a+1).padStart(2,`0`)}`,s=new Date(i,a,1),c=s.getDay(),l=new Date(i,a+1,0).getDate(),u=new Map;t.forEach(t=>{let r=String(Y(e,t,n.id)??``).slice(0,10);/^\d{4}-\d{2}-\d{2}$/.test(r)&&r.startsWith(o)&&(u.has(r)||u.set(r,[]),u.get(r).push(t))});let d=[];for(let e=0;e<c;e+=1)d.push(`<div class="cal-cell empty"></div>`);for(let t=1;t<=l;t+=1){let n=`${o}-${String(t).padStart(2,`0`)}`,r=u.get(n)??[];d.push(`
      <div class="cal-cell">
        <div class="cal-day">${t}</div>
        ${r.slice(0,4).map(t=>`<button type="button" class="cal-event" data-action="expand-record" data-record-action-id="${t.id}">${V(Jt(e,t))}</button>`).join(``)}
        ${r.length>4?`<span class="cal-more">+${r.length-4} more</span>`:``}
      </div>
    `)}return`
    <div class="calendar-view">
      <div class="cal-nav">
        <button type="button" class="button" data-action="cal-prev">‹</button>
        <strong>${V(s.toLocaleDateString(void 0,{month:`long`,year:`numeric`}))}</strong>
        <button type="button" class="button" data-action="cal-next">›</button>
        <button type="button" class="button ghost" data-action="cal-today">Today</button>
      </div>
      <div class="cal-grid">
        ${[`Sun`,`Mon`,`Tue`,`Wed`,`Thu`,`Fri`,`Sat`].map(e=>`<div class="cal-weekday">${e}</div>`).join(``)}
        ${d.join(``)}
      </div>
    </div>
  `}function fn(e){let t=at?new Date(`${at}-01T00:00:00`):new Date;t.setMonth(t.getMonth()+e),at=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}`}function pn(e){let t=W(e),n={table:`Table: spreadsheet-like rows and columns for fast data entry.`,form:`Form: focus on one record at a time.`,cards:`Cards: compact text-first record cards for browsing.`,gallery:`Gallery: image-first cards for collections and exhibits.`,list:`List: compact rows grouped by a field.`,kanban:`Board: columns by status or category, drag cards to change them.`,calendar:`Calendar: records placed on a month grid by a date field.`,labels:`Labels: printable small cards or shelf labels.`,report:`Report: printable table with title and summaries.`},r=S===`form`?$t(e):S===`cards`||S===`gallery`?en(e,t):S===`list`?ln(e,t):S===`kanban`?un(e,t):S===`calendar`?dn(e,t):S===`labels`?tn(e,t):S===`report`?nn(e,t):Zt(e,t);return`
    <section class="database-panel" aria-label="Database table">
      ${Xt(e)}
      <div class="view-tabs" role="group" aria-label="Layout modes">
        ${[`table`,`form`,`cards`,`gallery`,`list`,`kanban`,`calendar`,`labels`,`report`].map(e=>`<button type="button" class="${S===e?`active`:``}" data-view-mode="${e}" title="${V(n[e])}" aria-label="${V(n[e])}">${V(H(e===`kanban`?`Board`:e[0].toUpperCase()+e.slice(1)))}</button>`).join(``)}
      </div>
      ${cn(e)}
      ${mn()}
      ${hn(e)}
      ${r}
    </section>
  `}function mn(){let e=[];if(j&&e.push(`<button type="button" class="chip chip-button" data-action="toggle-archived" title="Back to active records">Archived view — click to exit</button>`),C&&e.push(`<span class="chip">Search: “${V(C)}”</span>`),E&&E.rules.length){let t=E.match===`all`?` AND `:` OR `,n=E.rules.map(e=>`${Kn(e.fieldId)} ${qn(e.operator)}${e.operator===`isEmpty`||e.operator===`isNotEmpty`?``:` `+e.value}${e.operator===`between`?`–`+(e.value2??``):``}`).join(t);e.push(`<button type="button" class="chip chip-button" data-action="find" title="Edit find">Find: ${V(n)}</button>`)}return P.size&&e.push(`<span class="chip">${P.size} highlighted</span>`),T.filter(e=>U().fields.some(t=>t.id===e.fieldId)).forEach(t=>{e.push(`<button type="button" class="chip chip-button" data-action="sort-dialog" title="Edit sort">Sort: ${V(Kn(t.fieldId))} ${t.direction===`asc`?`↑`:`↓`}</button>`)}),e.length?`<div class="filter-chips">${e.join(``)}${bt()?`<button type="button" class="chip chip-clear" data-action="clear-find">Clear find</button>`:``}${T.length?`<button type="button" class="chip chip-clear" data-action="sort-dialog">Edit sort</button>`:``}</div>`:``}function hn(e){let t=$(e).length;return t===0||S===`form`?``:`
    <div class="bulk-bar" role="group" aria-label="Bulk actions">
      <strong>${t} selected</strong>
      <button type="button" class="button" data-action="bulk-fill">Fill a field…</button>
      <button type="button" class="button" data-action="bulk-duplicate">Duplicate</button>
      ${j?`<button type="button" class="button" data-action="bulk-restore">Restore</button>`:`<button type="button" class="button" data-action="bulk-archive">Archive</button>`}
      <button type="button" class="button danger" data-action="bulk-delete">Delete</button>
      <button type="button" class="button ghost" data-action="bulk-clear">Clear selection</button>
    </div>
  `}function gn(e){let t=Ee(e),n=e.records.find(e=>e.id===x)??e.records[0],r=n?y.schema.relationships.filter(t=>t.fromTableId===e.id).map(t=>{let r=y.schema.tables.find(e=>e.id===t.toTableId),i=r?Ce(t,e,n,r).length:0;return`
            <div class="template-card">
              <strong>${V(t.name)}</strong>
              <span>${i} related record${i===1?``:`s`}</span>
              <p>${V(we(y,t))}</p>
            </div>
          `}).join(``):``;return`
    <aside class="teacher-panel" aria-label="Teacher tools and database stats">
      <h2>Database Check</h2>
      <div class="stat-grid">
        <div class="stat-card"><strong>${W(e).length}</strong> shown</div>
        <div class="stat-card"><strong>${e.records.length}</strong> records</div>
        <div class="stat-card"><strong>${e.fields.length}</strong> fields</div>
        <div class="stat-card"><strong>${y.schema.tables.length}</strong> tables</div>
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
      ${Ye.map(e=>`
            <div class="template-card">
              <strong>${V(e.title)}</strong>
              <span>${V(e.gradeBand)}</span>
              <p>${V(e.goal)}</p>
              <button type="button" data-template-id="${e.id}">Use template</button>
            </div>
          `).join(``)}
    </aside>
  `}function _n(){let e=y.schema.tables,t=y.schema.relationships,n=t=>e.find(e=>e.id===t)?.name??`table`,r=(t,n)=>e.find(e=>e.id===t)?.fields.find(e=>e.id===n)?.name??`field`,i=new Set(t.flatMap(e=>[e.fromTableId,e.toTableId]));return`<div class="rel-diagram"><div class="rel-boxes">${e.map(e=>`
        <div class="rel-box${e.id===b?` active`:``}${i.has(e.id)?` linked`:``}">
          <strong>${V(e.name)}</strong>
          <span>${e.records.length} record${e.records.length===1?``:`s`} · ${e.fields.length} field${e.fields.length===1?``:`s`}</span>
        </div>
      `).join(``)}</div><div class="rel-links">${t.length?t.map(e=>`
            <div class="rel-link">
              <span class="rel-badge">${V(n(e.fromTableId))}</span>
              <span class="rel-arrow">${V(r(e.fromTableId,e.fromFieldId))} <b>1 → &#8734;</b> ${V(r(e.toTableId,e.toFieldId))}</span>
              <span class="rel-badge">${V(n(e.toTableId))}</span>
            </div>
          `).join(``):`<p class="rel-empty">No links yet. Create one below to connect two tables.</p>`}</div></div>`}function vn(e,t){let n=[`number`,`currency`,`percent`,`rating`].includes(t),r=[`text`,`longText`,`link`].includes(t),i=[`text`,`longText`,`email`,`phone`,`link`].includes(t);return[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(t)?``:`
    <fieldset class="constraints">
      <legend>Rules and default</legend>
      <label class="check-row"><input type="checkbox" data-field-unique ${e.unique?`checked`:``}> No duplicate values (unique)</label>
      <label class="check-row"><input type="checkbox" data-field-readonly ${e.readonly?`checked`:``}> Read-only (students cannot change it)</label>
      ${n?`<div class="grid-two">
              <label>Minimum <input data-field-min type="number" step="any" value="${e.min==null?``:V(String(e.min))}"></label>
              <label>Maximum <input data-field-max type="number" step="any" value="${e.max==null?``:V(String(e.max))}"></label>
            </div>`:``}
      ${i?`<label>Character limit <input data-field-maxlength type="number" min="1" value="${e.maxLength==null?``:V(String(e.maxLength))}" placeholder="no limit"></label>`:``}
      ${r?`<label>Format <select data-field-pattern>${[`none`,`email`,`url`,`phone`,`custom`].map(t=>`<option value="${t}" ${(e.pattern??`none`)===t?`selected`:``}>${t}</option>`).join(``)}</select></label>
            <label>Custom pattern (advanced) <input data-field-custom-pattern value="${V(e.customPattern??``)}" placeholder="regular expression"></label>`:``}
      <label>Default value for new records <input data-field-default value="${V(e.defaultValue??``)}" placeholder="optional"></label>
      <label>Custom message when a value breaks a rule <input data-field-message value="${V(e.customMessage??``)}" placeholder="optional friendly message"></label>
    </fieldset>
  `}function yn(e,t,n){if(n===t.type||[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(n))return``;let r=(v.querySelector(`[data-field-options]`)?.value??t.options?.join(`, `)??``).split(`,`).map(e=>e.trim()).filter(Boolean),i=e.records.filter(e=>String(e.values[t.id]??``).trim()!==``).slice(0,4).map(e=>{let i=String(e.values[t.id]??``),a=u(e.values[t.id],n,r),o=a.value===!0?`Yes`:a.value===!1?`No`:String(a.value??``);return`<li><span>${V(i)}</span> → <span class="${a.lost?`preview-lost`:``}">${a.lost?`cleared`:V(o||`(empty)`)}</span></li>`}),a=e.records.filter(e=>String(e.values[t.id]??``).trim()===``?!1:u(e.values[t.id],n,r).lost).length;return`
    <div class="type-preview">
      <strong>Change ${V(t.type)} → ${V(n)}</strong>
      ${i.length?`<ul>${i.join(``)}</ul>`:`<p>No values to convert yet.</p>`}
      ${a?`<p class="preview-warn">${a} value${a===1?``:`s`} cannot convert and will be cleared.</p>`:`<p>All values convert cleanly.</p>`}
    </div>
  `}function bn(e){let t=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${V(e.name)}</option>`).join(``),n=D.rules.map((e,n)=>{let r=Gn.find(t=>t.value===e.operator)??Gn[0];return`
        <div class="find-rule" data-rule-index="${n}">
          <select data-find-field aria-label="Field">${t(e.fieldId)}</select>
          <select data-find-op aria-label="Condition">${Gn.map(t=>`<option value="${t.value}" ${t.value===e.operator?`selected`:``}>${V(t.label)}</option>`).join(``)}</select>
          <input data-find-value type="text" value="${V(e.value)}" placeholder="value" ${r.needsValue?``:`hidden`}>
          <input data-find-value2 type="text" value="${V(e.value2??``)}" placeholder="and" ${r.needsSecond?``:`hidden`}>
          <button type="button" class="button ghost" data-action="find-remove-rule">Remove</button>
        </div>
      `}).join(``);return`
    <div class="modal-backdrop">
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Advanced find">
        <h2>Find records</h2>
        <label>Match <select data-find-match>
          <option value="all" ${D.match===`all`?`selected`:``}>all conditions (AND)</option>
          <option value="any" ${D.match===`any`?`selected`:``}>any condition (OR)</option>
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
  `}function xn(e){let t=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${V(e.name)}</option>`).join(``);return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Sort records">
        <h2>Sort records</h2>
        <div class="sort-levels">${O.map((e,n)=>`
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
  `}function Sn(){let e=Qn();return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Saved views">
        <h2>Saved views</h2>
        <p>A view remembers the current table, layout, search, find, and sort. Save it, then reopen it any time.</p>
        <div class="saved-views">
          ${e.length?e.map(e=>`
                      <div class="saved-view" data-view-id="${e.id}">
                        <div><strong>${V(e.name)}</strong><span>${V(e.mode)}${e.sortKeys.length?` · sorted`:``}${e.find&&e.find.rules.length?` · found`:``}</span></div>
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
  `}function Cn(e){let t=$(e).length;return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Fill a field">
        <h2>Fill a field</h2>
        <p>Set the same value in ${t} selected record${t===1?``:`s`}.</p>
        <label>Field <select data-bulk-field>${e.fields.filter(e=>![`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(e.type)).map(e=>`<option value="${e.id}">${V(e.name)}</option>`).join(``)}</select></label>
        <label>Value <input data-bulk-value type="text" placeholder="value to fill in"></label>
        <div class="modal-actions">
          <button type="button" class="button primary" data-action="apply-bulk-fill">Fill selected</button>
          <button type="button" data-action="close-dialog">Cancel</button>
        </div>
      </section>
    </div>
  `}function wn(e){if(F===`none`)return``;if(F===`find`)return bn(e);if(F===`sort`)return xn(e);if(F===`views`)return Sn();if(F===`bulkFill`)return Cn(e);if(F===`replace`){let t=z.slice(0,8);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Replace values">
          <h2>Replace values</h2>
          <label>Find <input data-replace-find placeholder="Text to find"></label>
          <label>Replace with <input data-replace-with placeholder="New text"></label>
          <label>Field <select data-replace-field>${e.fields.map(e=>`<option value="${e.id}">${V(e.name)}</option>`).join(``)}</select></label>
          <label class="check-row"><input type="checkbox" data-replace-case-sensitive> Case-sensitive</label>
          <label class="check-row"><input type="checkbox" data-replace-whole-word> Whole word only</label>
          <p>Replacement applies to the current found set when search is active. Preview first, then apply. The last replace can be undone from Edit.</p>
          ${z.length?`<div class="replace-preview"><strong>${z.length} change${z.length===1?``:`s`} ready</strong>${t.map(t=>{let n=e.records.find(e=>e.id===t.recordId),r=e.fields.find(e=>e.id===t.fieldId);return`<p><span>${V(n?Jt(e,n):`Record`)} / ${V(r?.name??`Field`)}</span><del>${V(t.before)}</del><ins>${V(t.after)}</ins></p>`}).join(``)}</div>`:``}
          <div class="modal-actions">
            <button type="button" data-action="preview-replace">Preview</button>
            <button type="button" data-action="run-replace" ${z.length?``:`disabled`}>Apply Replace</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(F===`field`){let t=e.fields.find(e=>e.id===ct)??e.fields[0],n=nt||t.type;return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Field settings">
          <h2>Field settings</h2>
          <label>Name <input data-field-name value="${V(t.name)}"></label>
          <label>Type <select data-field-type>${Rt(n)}</select></label>
          ${yn(e,t,n)}
          <label>Description <textarea data-field-description>${V(t.description)}</textarea></label>
          <label>Choice options <input data-field-options value="${V(t.options?.join(`, `)??``)}" placeholder="Yes, No, Maybe"></label>
          <label class="check-row"><input type="checkbox" data-field-required ${t.required?`checked`:``}> Required field</label>
          <label class="check-row"><input type="checkbox" data-field-hidden ${t.hidden?`checked`:``}> Hide field</label>
          ${vn(t,n)}
          <label>Calculation formula <input data-field-formula value="${V(t.formula??``)}" placeholder='JOIN(First Name, " ", Last Name)'></label>
          <p>Try <code>FIELD(Animal)</code>, <code>JOIN(Animal, " lives in ", Habitat)</code>, <code>UPPER(Animal)</code>, <code>ADD(Score, Bonus)</code>, <code>AVERAGE(Score)</code>, or <code>LOOKUP("Book reviews", Rating)</code>.</p>
          <div class="modal-actions">
            <button type="button" data-action="save-field-settings">Save field</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(F===`layout`){let t=X(),n=Vt(e),r=new Set(t?.hiddenFieldIds??[]);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Layout designer">
          <h2>Layout designer</h2>
          <p>Arrange and choose fields for the current ${V(S)} view. Locked layouts can still be viewed, but students should not change them.</p>
          <label class="check-row"><input type="checkbox" data-layout-locked ${t?.locked?`checked`:``}> Lock this layout</label>
          <div class="layout-field-list">
            ${n.map((e,t)=>`
                  <div class="layout-field-row">
                    <label class="check-row"><input type="checkbox" data-layout-field-visible="${e.id}" ${r.has(e.id)?``:`checked`}> <strong>${V(e.name)}</strong></label>
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
    `}if(F===`csvImport`&&B){let t=B.records.slice(0,4),n=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${V(e.name)}</option>`).join(``),r=N.map((e,t)=>`
          <div class="csv-map-row" data-map-index="${t}">
            <span class="csv-map-header">${V(e.header||`Column ${t+1}`)}</span>
            <select data-map-action aria-label="What to do with ${V(e.header)}">
              <option value="new" ${e.action===`new`?`selected`:``}>New field</option>
              <option value="existing" ${e.action===`existing`?`selected`:``}>Existing field</option>
              <option value="skip" ${e.action===`skip`?`selected`:``}>Skip</option>
            </select>
            <select data-map-type aria-label="Type for ${V(e.header)}" ${e.action===`new`?``:`hidden`}>${Rt(e.type)}</select>
            <select data-map-existing aria-label="Existing field for ${V(e.header)}" ${e.action===`existing`?``:`hidden`}>${n(e.fieldId)}</select>
          </div>
        `).join(``);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="CSV import">
          <h2>Import CSV</h2>
          <p>${V(pt)} has ${B.fields.length} column${B.fields.length===1?``:`s`} and ${B.records.length} row${B.records.length===1?``:`s`}. Choose how each column maps.</p>
          <div class="csv-map">${r}</div>
          <div class="preview-table-wrap">
            <table class="preview-table">
              <thead>
                <tr>${B.fields.map(e=>`<th>${V(e.name)}</th>`).join(``)}</tr>
              </thead>
              <tbody>
                ${t.map(e=>`<tr>${B.fields.map(t=>`<td>${V(e.values[t.id])}</td>`).join(``)}</tr>`).join(``)}
              </tbody>
            </table>
          </div>
          <p><strong>Create new table</strong> builds a fresh table from the columns you keep. <strong>Append</strong> adds the rows to ${V(e.name)} using your field mapping.</p>
          <div class="modal-actions">
            <button type="button" class="button primary" data-action="apply-csv-new">Create new table</button>
            <button type="button" class="button" data-action="apply-csv-append">Append to ${V(e.name)}</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(F===`projectIdeas`)return`
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
    `;if(F===`relationship`){let t=y.schema.tables.find(e=>e.id===dt)??e,n=y.schema.tables.find(e=>e.id===ft)??e,r=t.fields.map(e=>`<option value="${t.id}:${e.id}">${V(e.name)}</option>`).join(``),i=n.fields.map(e=>`<option value="${n.id}:${e.id}">${V(e.name)}</option>`).join(``);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Relationships">
          <h2>Relationships</h2>
          <p>Create a simple one-to-many relationship by matching values in two fields, such as Books:Title to Reviews:Book.</p>
          ${_n()}
          <label>Name <input data-relationship-name placeholder="Books to reviews"></label>
          <label>Parent table <select data-relationship-from-table>${y.schema.tables.map(e=>`<option value="${e.id}" ${e.id===t.id?`selected`:``}>${V(e.name)}</option>`).join(``)}</select></label>
          <label>Parent match field <select data-relationship-from-field>${r}</select></label>
          <label>Related table <select data-relationship-to-table>${y.schema.tables.map(e=>`<option value="${e.id}" ${e.id===n.id?`selected`:``}>${V(e.name)}</option>`).join(``)}</select></label>
          <label>Related match field <select data-relationship-to-field>${i}</select></label>
          ${y.schema.relationships.length?`<div class="relationship-list">${y.schema.relationships.map(e=>`<p><strong>${V(e.name)}</strong><br>${V(we(y,e))}</p>`).join(``)}</div>`:`<p>No relationships yet. Add a second table first for the most useful results.</p>`}
          <div class="modal-actions">
            <button type="button" data-action="create-relationship">Create relationship</button>
            <button type="button" data-action="close-dialog">Close</button>
          </div>
        </section>
      </div>
    `}if(F===`functions`){let t=e.fields.filter(e=>![`image`,`createdAt`,`updatedAt`].includes(e.type)),n=t.find(e=>[`text`,`longText`,`choice`].includes(e.type))??t[0],r=t.find(e=>[`number`,`currency`,`percent`,`rating`].includes(e.type))??n,i=n?.name??`Field`,a=r?.name??`Score`;return`
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
    `}if(F===`quality`){let t=Wt(e),n=Ut(e),r=t.reduce((e,t)=>e+t.missing,0),i=t.reduce((e,t)=>e+t.duplicates,0),a=Je(e).length;return`
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
                          <span><strong>${V(e.name)}</strong><small>${V(e.type)}</small></span>
                          <button type="button" data-quality-kind="missing" data-quality-field-id="${e.id}" ${t?``:`disabled`}>${t}</button>
                          <button type="button" data-quality-kind="duplicates" data-quality-field-id="${e.id}" ${n?``:`disabled`}>${n}</button>
                        </div>
                      `).join(``):`<p class="empty-panel">No editable data fields are available yet.</p>`}
          </div>
          <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
        </section>
      </div>
    `}return F===`teacherNotes`?`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Teacher notes">
          <h2>Teacher notes</h2>
          <p>Add one note per line. These notes are saved in the .listsplat.json file and included in the project packet.</p>
          <label>Notes <textarea data-teacher-notes rows="8" placeholder="Add setup directions, reflection questions, or grading reminders.">${V(y.teacher.notes.join(`
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
  `}function Q(){let e=U();St(e),vt();let t=y.teacher.studentView;if(v.innerHTML=`
    <header class="app-header">
      <a class="brand" href="../../pages/splatworks.html" aria-label="SplatWorks home">
        <img class="brand-icon" src="listsplat_icon.png" alt="">
        <span>
          <strong>ListSplat<sup>TM</sup></strong>
          <small>SplatWorks<sup>TM</sup> Database Studio</small>
        </span>
      </a>
      <div class="quick-actions">
        <button type="button" class="button" data-action="undo-change"${L.length?``:` disabled`} title="Undo (Ctrl+Z)" aria-label="Undo">↶ ${V(H(`Undo`))}</button>
        <button type="button" class="button" data-action="redo-change"${R.length?``:` disabled`} title="Redo (Ctrl+Y)" aria-label="Redo">↷ ${V(H(`Redo`))}</button>
        <button type="button" class="button primary" data-action="new">${V(H(`New`))}</button>
        <button type="button" class="button primary" data-action="save-json">${V(H(`Save JSON`))}</button>
        <button type="button" class="button primary" data-action="open-json">${V(H(`Open JSON`))}</button>
        <button type="button" class="button primary" data-action="export-csv">${V(H(`Export CSV`))}</button>
        <select id="languageSwitcher" class="lang-switcher" aria-label="Language">${_t(mt)}</select>
      </div>
    </header>
    <main class="listsplat-app">
      <nav class="menu-bar" aria-label="Application menu">
        ${J(`File`,[[`new`,`New database`],[`save-json`,`Save .listsplat.json`],[`open-json`,`Open .listsplat.json`],[`import-csv`,`Import CSV`],[`export-csv`,`Export CSV`],[`export-report`,`Export report HTML`],[`print`,`Print`]])}
        ${J(`Edit`,[[`undo-change`,`Undo last change`],[`redo-change`,`Redo last change`],[`add-record`,`Add record`],[`add-field`,`Add field`],[`find`,`Find records`],[`replace`,`Replace values`]])}
        ${J(`Data`,[[`add-table`,`New table`],[`rename-table`,`Rename this table`],[`duplicate-table`,`Duplicate this table`],[`move-table-left`,`Move table left`],[`move-table-right`,`Move table right`],[`delete-table`,`Delete this table`],[`sort`,`Sort records`],[`missing`,`Find missing values`],[`duplicates`,`Find duplicates`],[`toggle-archived`,j?`Show active records`:`Show archived records (${yt(e)})`],[`structure-copy`,`Save structure-only copy`],[`clear-find`,`Show all records`]])}
        ${J(`Layout`,[[`layout-designer`,`Design current layout`],[`table-view`,`Table view`],[`form-view`,`Form view`],[`cards-view`,`Card view`],[`gallery-view`,`Gallery view`],[`labels-view`,`Label view`],[`report-view`,`Report view`]])}
        ${J(`Tools`,[[`functions`,`Functions`],[`relationships`,`Relationships`],[`quality`,`Data quality check`]])}
        ${J(`View`,[[`student-view`,t?`Exit student view`:`Student view`],[`teacher-notes`,`Teacher notes`]])}
        <span class="menu-spacer"></span>
        ${t?``:J(`Teacher`,[[`templates`,`Template Library`],[`project-ideas`,`Project Ideas`],[`lock-layout`,`Lock Layout`],[`project-packet`,`Print Project Packet`]])}
        ${J(`Help`,[[`help-start`,`Start a database`],[`help-csv`,`Import and export CSV`],[`help-layouts`,`Forms and reports`],[`help-privacy`,`Privacy and saving`]])}
      </nav>
      <section class="toolbar" aria-label="Database toolbar">
        <label>${V(H(`Title`))} <input data-project-title value="${V(y.metadata.title)}"></label>
        <label>${V(H(`Search`))} <input data-search value="${V(C)}" placeholder="${V(H(`Find records`))}"></label>
        <label>${V(H(`In`))} <select data-search-field><option value="all">${V(H(`All fields`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${w===e.id?`selected`:``}>${V(e.name)}</option>`).join(``)}</select></label>
        <label>${V(H(`Sort`))} <select data-sort-field><option value="">${V(H(`Choose field`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${T[0]?.fieldId===e.id?`selected`:``}>${V(e.name)}</option>`).join(``)}</select></label>
        <button type="button" data-action="toggle-sort" title="${V(H(`Sort direction`))}">${T[0]?.direction===`desc`?`Z-A`:`A-Z`}</button>
        <button type="button" data-action="sort-dialog" title="${V(H(`Sort by more than one field`))}">${V(H(`Sort…`))}</button>
        <button type="button" data-action="find" title="${V(H(`Advanced find with conditions`))}">${V(H(`Find…`))}</button>
        <button type="button" data-action="views" title="${V(H(`Save and reuse this view`))}">${V(H(`Views`))}</button>
        <label>${V(H(`New field`))} <input data-new-field placeholder="${V(H(`Field name`))}"></label>
        <label>${V(H(`Type`))} <select data-new-field-type>${Rt()}</select></label>
        <button type="button" data-action="add-field">${V(H(`Add field`))}</button>
        <button type="button" data-action="add-record">${V(H(`Add record`))}</button>
      </section>
      <div class="workspace${t?` student-workspace`:``}">
        ${pn(e)}
        ${t?``:gn(e)}
      </div>
      <footer class="status-bar">
        <span>${V(e.name)}: ${W(e).length} shown of ${e.records.length} records, ${e.fields.length} fields</span>
        ${t?`<span>Student view hides teacher notes and teacher tools.</span>`:``}
        <span>${V(I)}</span>
        <span>${tt}</span>
      </footer>
    </main>
    <input class="hidden-file" type="file" accept=".listsplat.json,application/json" data-open-json>
    <input class="hidden-file" type="file" accept=".csv,text/csv" data-import-csv>
    ${wn(e)}
  `,lt=``,ut){let e=ut;ut=null,Ln(e.recordId,e.fieldId)}Vn()}function Tn(e){return e instanceof HTMLInputElement&&e.type===`checkbox`?e.checked:e instanceof HTMLInputElement&&e.type===`number`?e.value===``?``:Number(e.value):e.value}function En(e){let t=e.dataset.recordId,n=e.dataset.fieldId;!t||!n||(y=re(y,ne(U(),t,n,Tn(e))),_e(y),tt=`Saved locally`)}function Dn(e){return new Promise((t,n)=>{let r=new FileReader;r.onerror=()=>n(r.error),r.onload=()=>{let n=String(r.result??``);if(e.size<=35e4){t(n);return}let i=new Image;i.onerror=()=>t(n),i.onload=()=>{let e=1280,r=Math.max(i.width,i.height),a=r>e?e/r:1,o=Math.max(1,Math.round(i.width*a)),s=Math.max(1,Math.round(i.height*a)),c=document.createElement(`canvas`);c.width=o,c.height=s;let l=c.getContext(`2d`);if(!l){t(n);return}l.drawImage(i,0,0,o,s);let u=c.toDataURL(`image/jpeg`,.82);t(u.length<n.length?u:n)},i.src=n},r.readAsDataURL(e)})}function On(e,t,n,r){if(!n.type.startsWith(`image/`)){I=`That clipboard item is not an image.`,Q();return}Dn(n).then(n=>{K(r),y=re(y,ne(U(),e,t,n)),_e(y);let i=Math.round(n.length/1024);I=i>900?`Image saved (about ${i} KB). Very large pictures can slow autosave — a smaller image is fine for most projects.`:`Image saved in this field.`,Q()}).catch(()=>{I=`Could not read that image.`,Q()})}function kn(){let e=U(),t=e.fields.find(e=>e.id===ct);if(!t)return;let n=v.querySelector(`[data-field-name]`)?.value??t.name,r=v.querySelector(`[data-field-type]`)?.value??t.type,i=v.querySelector(`[data-field-description]`)?.value??``,a=v.querySelector(`[data-field-required]`)?.checked??!1,o=v.querySelector(`[data-field-hidden]`)?.checked??!1,s=v.querySelector(`[data-field-formula]`)?.value??``,c=(v.querySelector(`[data-field-options]`)?.value??``).split(`,`).map(e=>e.trim()).filter(Boolean),l=v.querySelector(`[data-field-unique]`)?.checked??!1,u=v.querySelector(`[data-field-min]`)?.value??``,f=v.querySelector(`[data-field-max]`)?.value??``,te=u.trim()===``?void 0:Number(u),ne=f.trim()===``?void 0:Number(f),re=v.querySelector(`[data-field-pattern]`)?.value??`none`,ie=v.querySelector(`[data-field-custom-pattern]`)?.value??``,ae=v.querySelector(`[data-field-default]`)?.value??``,oe=v.querySelector(`[data-field-readonly]`)?.checked??!1,se=v.querySelector(`[data-field-maxlength]`)?.value??``,ce=se.trim()===``?void 0:Number(se),le=v.querySelector(`[data-field-message]`)?.value??``,ue=r!==t.type,de=ee(e,t.id,{name:n,type:r,description:i,required:a,hidden:o,formula:s,options:c,unique:l,min:te,max:ne,pattern:re,customPattern:ie,defaultValue:ae,readonly:oe,maxLength:ce,customMessage:le});ue&&![`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(r)&&(de=d(de,t.id,r,c)),q(de),F=`none`,I=ue?`Updated ${n} and converted values to ${r}.`:`Updated ${n}.`,Q()}function An(){let e=v.querySelector(`[data-replace-find]`)?.value??``,t=v.querySelector(`[data-replace-with]`)?.value??``,n=v.querySelector(`[data-replace-field]`)?.value??U().fields[0]?.id,r=v.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=v.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=C?W(U()).map(e=>e.id):void 0;K(`replace`);let o=Ue(U(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i});F=`none`,z=[],I=`Replaced ${o.count} value${o.count===1?``:`s`}.`,q(o.table)}function jn(){let e=v.querySelector(`[data-replace-find]`)?.value??``,t=v.querySelector(`[data-replace-with]`)?.value??``,n=v.querySelector(`[data-replace-field]`)?.value??U().fields[0]?.id,r=v.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=v.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=C?W(U()).map(e=>e.id):void 0;z=He(U(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i}),I=`Preview found ${z.length} change${z.length===1?``:`s`}.`,Q()}function Mn(){let e=(v.querySelector(`[data-teacher-notes]`)?.value??``).split(`
`).map(e=>e.trim()).filter(Boolean);K(`teacher notes`),F=`none`,I=`Saved ${e.length} teacher note${e.length===1?``:`s`}.`,G({...y,updatedAt:new Date().toISOString(),teacher:{...y.teacher,notes:e}})}function Nn(e){let t=v.querySelector(e)?.value;if(!t)return null;let[n,r]=t.split(`:`);return n&&r?{tableId:n,fieldId:r}:null}function Pn(){let e=v.querySelector(`[data-relationship-from-table]`)?.value??``,t=v.querySelector(`[data-relationship-to-table]`)?.value??``,n=Nn(`[data-relationship-from-field]`),r=Nn(`[data-relationship-to-field]`),i=v.querySelector(`[data-relationship-name]`)?.value??``;if(!e||!t||!n||!r){I=`Choose both tables and both match fields.`,Q();return}if(n.tableId!==e||r.tableId!==t){I=`Match fields must belong to the tables you chose.`,Q();return}K(`relationship create`);let a=xe(i,e,n.fieldId,t,r.fieldId);I=`Created relationship: ${a.name}.`,G(Se(y,a))}function Fn(){dt=v.querySelector(`[data-relationship-from-table]`)?.value??dt,ft=v.querySelector(`[data-relationship-to-table]`)?.value??ft,Q()}function In(e){return window.CSS&&typeof CSS.escape==`function`?CSS.escape(e):e.replace(/["\\]/g,`\\$&`)}function Ln(e,t){let n=v.querySelector(`.data-grid`);if(!n)return!1;let r=n.querySelector(`tr[data-record-row="${In(e)}"]`);if(!r)return!1;let i=r.querySelector(`.cell-input[data-field-id="${In(t)}"], .cell-checkbox[data-field-id="${In(t)}"]`);return i||=r.querySelector(`.cell-input, .cell-checkbox`),i?(i.focus(),i instanceof HTMLInputElement&&i.type!==`checkbox`&&i.select(),!0):!1}function Rn(e){K(`add record`);let t=l(U()),n=t.records.at(-1);n&&(x=n.id,ut={recordId:n.id,fieldId:e}),q(t)}function zn(e,t,n,r){let i=Array.from(v.querySelectorAll(`.data-grid tbody tr[data-record-row]`)),a=i.findIndex(t=>t.dataset.recordRow===e),o=Z(U()).map(e=>e.id),s=o.indexOf(t);if(a<0||s<0)return;let c=a+n,l=s+r;if(r>0&&l>=o.length?(l=0,c=a+1):r<0&&l<0&&(l=o.length-1,c=a-1),c>=i.length){Rn(o[l]??o[0]);return}c<0||Ln(i[c].dataset.recordRow??e,o[l]??t)}function Bn(){if(!A)return null;let e=W(U()).map(e=>e.id),t=Z(U()).map(e=>e.id),n=e.indexOf(A.anchor.r),r=e.indexOf(A.focus.r),i=t.indexOf(A.anchor.f),a=t.indexOf(A.focus.f);return n<0||r<0||i<0||a<0?null:{rows:e,cols:t,r1:Math.min(n,r),r2:Math.max(n,r),c1:Math.min(i,a),c2:Math.max(i,a)}}function Vn(){v.querySelectorAll(`.data-grid td.cell-range`).forEach(e=>e.classList.remove(`cell-range`));let e=Bn();if(e&&!((e.r2-e.r1+1)*(e.c2-e.c1+1)<=1))for(let t=e.r1;t<=e.r2;t+=1)for(let n=e.c1;n<=e.c2;n+=1)v.querySelector(`.data-grid [data-record-id="${In(e.rows[t])}"][data-field-id="${In(e.cols[n])}"]`)?.closest(`td`)?.classList.add(`cell-range`)}function Hn(e){if(!A)return;let t=W(U()).map(e=>e.id),n=Z(U()).map(e=>e.id),r=t.indexOf(A.focus.r),i=n.indexOf(A.focus.f);r<0||i<0||(e===`ArrowUp`?r=Math.max(0,r-1):e===`ArrowDown`?r=Math.min(t.length-1,r+1):e===`ArrowLeft`?i=Math.max(0,i-1):e===`ArrowRight`&&(i=Math.min(n.length-1,i+1)),A={anchor:A.anchor,focus:{r:t[r],f:n[i]}},Vn())}function Un(){let e=Bn();if(!e||e.r2-e.r1===0&&e.c2-e.c1===0)return!1;let t=U(),n=new Map(t.records.map(e=>[e.id,e])),r=[];for(let i=e.r1;i<=e.r2;i+=1){let a=n.get(e.rows[i]);if(!a)continue;let o=[];for(let n=e.c1;n<=e.c2;n+=1)o.push(String(Y(t,a,e.cols[n])??``).replace(/\t/g,` `).replace(/\n/g,` `));r.push(o.join(`	`))}let i=r.join(`
`);navigator.clipboard?.writeText(i).catch(()=>void 0);let a=(e.r2-e.r1+1)*(e.c2-e.c1+1),o=v.querySelector(`.status-bar span:nth-last-child(2)`);return o&&(o.textContent=`Copied ${a} cells.`),!0}function Wn(e,t,n){let i=U(),a=W(i),o=Z(i).map(e=>e.id),s=a.findIndex(e=>e.id===t),c=o.indexOf(n);if(s<0||c<0)return;let l=e.replace(/\r/g,``).replace(/\n$/,``).split(`
`).map(e=>e.split(`	`));K(`paste`);let d=new Map(i.records.map(e=>[e.id,e])),ee=i.records.map(e=>e.id),f=0;l.forEach((e,t)=>{let n;if(s+t<a.length)n=a[s+t].id;else{let e=r(i.fields);d.set(e.id,e),ee.push(e.id),n=e.id,f+=1}let l=d.get(n);if(!l)return;let te={...l.values};e.forEach((e,t)=>{let n=o[c+t],r=n?i.fields.find(e=>e.id===n):void 0;!r||[`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(r.type)||(te[r.id]=u(e,r.type,r.options).value)}),d.set(n,{...l,updatedAt:new Date().toISOString(),values:te})}),A=null,I=`Pasted ${l.length} row${l.length===1?``:`s`}${f?` (${f} new)`:``}.`,q({...i,records:ee.map(e=>d.get(e)).filter(Boolean)})}var Gn=[{value:`contains`,label:`contains`,needsValue:!0,needsSecond:!1},{value:`equals`,label:`is exactly`,needsValue:!0,needsSecond:!1},{value:`startsWith`,label:`starts with`,needsValue:!0,needsSecond:!1},{value:`endsWith`,label:`ends with`,needsValue:!0,needsSecond:!1},{value:`greaterThan`,label:`greater than`,needsValue:!0,needsSecond:!1},{value:`lessThan`,label:`less than`,needsValue:!0,needsSecond:!1},{value:`between`,label:`between`,needsValue:!0,needsSecond:!0},{value:`isEmpty`,label:`is empty`,needsValue:!1,needsSecond:!1},{value:`isNotEmpty`,label:`is not empty`,needsValue:!1,needsSecond:!1}];function Kn(e){return U().fields.find(t=>t.id===e)?.name??`field`}function qn(e){return Gn.find(t=>t.value===e)?.label??e}function Jn(){let e=v.querySelector(`[data-find-match]`)?.value??`all`,t=[];v.querySelectorAll(`.find-rule`).forEach(e=>{let n=e.querySelector(`[data-find-field]`)?.value??``,r=e.querySelector(`[data-find-op]`)?.value??`contains`,i=e.querySelector(`[data-find-value]`)?.value??``,a=e.querySelector(`[data-find-value2]`)?.value??``;n&&t.push({fieldId:n,operator:r,value:i,value2:a})}),D={match:e,rules:t}}function Yn(){Jn(),E=D.rules.length?D:null,P=new Set,F=`none`;let e=W(U()).length;I=E?`Find is on: ${e} record${e===1?``:`s`} match.`:`Find cleared.`,Q()}function Xn(){let e=[];v.querySelectorAll(`.sort-level`).forEach(t=>{let n=t.querySelector(`[data-sort-level-field]`)?.value??``,r=t.querySelector(`[data-sort-level-dir]`)?.value??`asc`;n&&e.push({fieldId:n,direction:r})}),O=e}function Zn(){Xn(),T=O,F=`none`,I=T.length?`Sorting by ${T.map(e=>Kn(e.fieldId)).join(`, `)}.`:`Sort cleared.`,Q()}function Qn(){return y.views??[]}function $n(){let e=v.querySelector(`[data-view-name]`)?.value.trim()||`View ${Qn().length+1}`,n={id:t(`view`),name:e,tableId:b,mode:S,search:C,searchFieldId:w,find:E,sortKeys:T};K(`save view`),I=`Saved view: ${e}.`,G({...y,updatedAt:new Date().toISOString(),views:[...Qn(),n]})}function er(e){let t=Qn().find(t=>t.id===e);t&&(y.schema.tables.some(e=>e.id===t.tableId)&&(b=t.tableId,St(U())),S=t.mode,C=t.search,w=t.searchFieldId,E=t.find,T=t.sortKeys,P=new Set,F=`none`,I=`Opened view: ${t.name}.`,Q())}function tr(e){K(`delete view`),I=`Deleted a saved view.`,G({...y,updatedAt:new Date().toISOString(),views:Qn().filter(t=>t.id!==e)})}function $(e){let t=new Set(e.records.map(e=>e.id));return[...k].filter(e=>t.has(e))}function nr(){let e=U(),t=new Set($(e));if(t.size===0)return;let n=e.records.filter(e=>!t.has(e.id));if(n.length===0){I=`Keep at least one record. Some rows were not deleted.`,Q();return}window.confirm(`Delete ${t.size} selected record${t.size===1?``:`s`}? You can undo right after.`)&&(K(`bulk delete`),k=new Set,I=`Deleted ${e.records.length-n.length} records.`,q({...e,records:n}))}function rr(){let e=U(),t=$(e);if(t.length===0)return;K(`bulk duplicate`);let n=t.reduce((e,t)=>f(e,t),e);k=new Set,I=`Duplicated ${t.length} record${t.length===1?``:`s`}.`,q(n)}function ir(){let e=U(),t=new Set($(e)),n=v.querySelector(`[data-bulk-field]`)?.value??``,r=v.querySelector(`[data-bulk-value]`)?.value??``,i=e.fields.find(e=>e.id===n);if(!i||t.size===0){F=`none`,Q();return}let a=u(r,i.type,i.options).value;K(`bulk fill`);let o=e.records.map(e=>t.has(e.id)?{...e,updatedAt:new Date().toISOString(),values:{...e.values,[n]:a}}:e);F=`none`,I=`Filled ${i.name} for ${t.size} record${t.size===1?``:`s`}.`,q({...e,records:o})}function ar(e){let t=e.filter(e=>e.trim()!==``);return t.length===0?`text`:t.every(e=>!Number.isNaN(Number(e.replace(/[$,%\s]/g,``))))?`number`:t.every(e=>!Number.isNaN(new Date(e).getTime())&&/\d/.test(e))?`date`:t.every(e=>/^(yes|no|true|false)$/i.test(e.trim()))?`checkbox`:`text`}function or(){v.querySelectorAll(`.csv-map-row`).forEach((e,t)=>{N[t]&&(N[t].action=e.querySelector(`[data-map-action]`)?.value??`new`,N[t].type=e.querySelector(`[data-map-type]`)?.value??`text`,N[t].fieldId=e.querySelector(`[data-map-existing]`)?.value??``)})}v.addEventListener(`click`,e=>{let t=e.target,n=t.closest(`[data-action]`)?.dataset.action,r=t.closest(`[data-table-id]`)?.dataset.tableId,i=t.closest(`[data-template-id]`)?.dataset.templateId,s=t.closest(`[data-view-mode]`)?.dataset.viewMode,c=t.closest(`[data-select-record]`)?.dataset.selectRecord,u=t.closest(`[data-field-settings]`)?.dataset.fieldSettings,d=t.closest(`[data-record-action-id]`)?.dataset.recordActionId,ee=t.closest(`[data-quality-field-id]`);if(r){b=r,xt(),T=[],k=new Set,A=null,St(U()),Q();return}if(i){Lt(i);return}if(s){S=s,Q();return}if(c){x=c,S===`table`&&Q();return}if(u){ct=u,nt=``,F=`field`,Q();return}if(ee){let e=ee.dataset.qualityFieldId,t=ee.dataset.qualityKind;if(e&&t){let n=t===`duplicates`?Be(U(),e):Ve(U(),e);P=new Set(n.map(e=>e.id));let r=U().fields.find(t=>t.id===e);I=`Highlighted ${n.length} ${t===`duplicates`?`duplicate`:`missing`} record${n.length===1?``:`s`} in ${r?.name??`this field`}.`,F=`none`,Q();return}}if(n)if(Ot(),n===`new`){if(!window.confirm(`Start a new database? Your current one is replaced here — export it first if you want to keep a copy. You can also undo right after.`))return;K(`new database`);let e=a(`Untitled Database`);b=e.schema.tables[0].id,x=e.schema.tables[0].records[0]?.id??``,P=new Set,G(e)}else if(n===`save-json`)At();else if(n===`open-json`)v.querySelector(`[data-open-json]`)?.click();else if(n===`import-csv`)v.querySelector(`[data-import-csv]`)?.click();else if(n===`export-csv`)jt();else if(n===`export-report`)Mt();else if(n===`project-packet`)Nt();else if(n===`print`)window.print();else if(n===`add-record`)K(`add record`),q(l(U()));else if(n===`add-field`){let e=v.querySelector(`[data-new-field]`),t=v.querySelector(`[data-new-field-type]`)?.value;K(`add field`),q(o(U(),e?.value||`New Field`,t??`text`))}else if(n===`add-table`){let e=window.prompt(`New table name?`,`New Table`)??``;K(`add table`);let t=ie(y,e);b=t.schema.tables.at(-1)?.id??b,x=U().records[0]?.id??``,G(t)}else if(n===`duplicate-record`&&d)K(`duplicate record`),q(f(U(),d));else if(n===`delete-record`&&d){if(U().records.length<=1){I=`Keep at least one record. Add another before deleting this one.`,Q();return}if(!window.confirm(`Delete this record? You can undo right after with Ctrl+Z.`))return;K(`delete record`),q(te(U(),d))}else if(n===`toggle-sort`){if(T.length)T=[{...T[0],direction:T[0].direction===`asc`?`desc`:`asc`},...T.slice(1)];else{let e=U().fields[0];e&&(T=[{fieldId:e.id,direction:`asc`}])}Q()}else if(n===`sort`||n===`sort-dialog`)O=T.length?T.map(e=>({...e})):[{fieldId:U().fields[0]?.id??``,direction:`asc`}],F=`sort`,Q();else if(n===`find`)D=E?{match:E.match,rules:E.rules.map(e=>({...e}))}:{match:`all`,rules:[{fieldId:U().fields[0]?.id??``,operator:`contains`,value:``}]},F=`find`,Q();else if(n===`views`)F=`views`,Q();else if(n===`sort-add-level`)Xn(),O.push({fieldId:U().fields[0]?.id??``,direction:`asc`}),Q();else if(n===`sort-remove-level`){Xn();let e=Number(t.closest(`[data-level-index]`)?.dataset.levelIndex??`-1`);e>=0&&O.splice(e,1),Q()}else if(n===`sort-toggle`){let e=t.closest(`[data-sort-toggle]`)?.dataset.sortToggle;if(e){let t=T.find(t=>t.fieldId===e);T=[{fieldId:e,direction:t&&t.direction===`asc`?`desc`:`asc`}],Q()}}else if(n===`apply-sort`)Zn();else if(n===`clear-sort`)Xn(),O=[],Q();else if(n===`find-add-rule`)Jn(),D.rules.push({fieldId:U().fields[0]?.id??``,operator:`contains`,value:``}),Q();else if(n===`find-remove-rule`){Jn();let e=Number(t.closest(`[data-rule-index]`)?.dataset.ruleIndex??`-1`);e>=0&&D.rules.splice(e,1),Q()}else if(n===`apply-find`)Yn();else if(n===`save-view`)$n();else if(n===`apply-view`){let e=t.closest(`[data-view-id]`)?.dataset.viewId;e&&er(e)}else if(n===`delete-view`){let e=t.closest(`[data-view-id]`)?.dataset.viewId;e&&tr(e)}else if(n===`bulk-delete`)nr();else if(n===`bulk-duplicate`)rr();else if(n===`bulk-fill`)$(U()).length&&(F=`bulkFill`,Q());else if(n===`apply-bulk-fill`)ir();else if(n===`bulk-clear`)k=new Set,Q();else if(n===`expand-record`&&d)x=d,S=`form`,Q();else if(n===`cal-prev`)fn(-1),Q();else if(n===`cal-next`)fn(1),Q();else if(n===`cal-today`)at=``,Q();else if(n===`bulk-archive`||n===`bulk-restore`){let e=n===`bulk-archive`,t=new Set($(U()));if(t.size){K(e?`archive records`:`restore records`);let n=U();k=new Set,I=`${e?`Archived`:`Restored`} ${t.size} record${t.size===1?``:`s`}.`,q({...n,records:n.records.map(n=>t.has(n.id)?{...n,archived:e}:n)})}}else if(n===`toggle-archived`)j=!j,k=new Set,I=j?`Showing archived records.`:`Showing active records.`,Q();else if(n===`rename-table`){let e=U(),t=window.prompt(`Rename table`,e.name);t&&t.trim()&&(K(`rename table`),G(ae(y,e.id,t)))}else if(n===`duplicate-table`){K(`duplicate table`);let e=oe(y,b);b=e.newTableId,xt(),T=[],k=new Set,I=`Duplicated the table.`,G(e.project)}else if(n===`move-table-left`||n===`move-table-right`)K(`move table`),G(se(y,b,n===`move-table-left`?-1:1));else if(n===`delete-table`){if(y.schema.tables.length<=1){I=`A database needs at least one table.`,Q();return}if(window.confirm(`Delete the table "${U().name}" and all its records? You can undo right after.`)){K(`delete table`);let e=ce(y,b);b=e.schema.tables[0].id,xt(),T=[],k=new Set,I=`Deleted the table.`,G(e)}}else if(n===`structure-copy`)At(le(y)),I=`Saved a structure-only copy (no records).`,Q();else if(n===`highlight-invalid`){let e=Je(U());P=new Set(e.map(e=>e.record.id)),F=`none`,I=`Highlighted ${P.size} record${P.size===1?``:`s`} with rule problems.`,Q()}else if(n===`duplicates`){let e=w===`all`?U().fields[0]?.id:w;P=new Set(Be(U(),e).map(e=>e.id)),I=`Found ${P.size} duplicate record${P.size===1?``:`s`}.`,Q()}else if(n===`missing`){let e=w===`all`?U().fields[0]?.id:w;P=new Set(Ve(U(),e).map(e=>e.id)),I=`Found ${P.size} record${P.size===1?``:`s`} with missing values.`,Q()}else if(n===`clear-find`)xt(),I=`Showing all records.`,Q();else if(n===`replace`)z=[],F=`replace`,Q();else if(n===`preview-replace`)jn();else if(n===`run-replace`)An();else if(n===`save-teacher-notes`)Mn();else if(n===`apply-csv-new`)It(`new`);else if(n===`apply-csv-append`)It(`append`);else if(n===`save-field-settings`)K(`field settings`),kn();else if(n===`layout-designer`||n===`lock-layout`)F=`layout`,Q();else if(n===`layout-field-up`||n===`layout-field-down`){let e=t.closest(`[data-layout-field-id]`)?.dataset.layoutFieldId,r=X();if(e&&r){let t=Vt(U()).map(e=>e.id),r=t.indexOf(e),i=n===`layout-field-up`?r-1:r+1;r>=0&&i>=0&&i<t.length&&([t[r],t[i]]=[t[i],t[r]],K(`layout order`),F=`layout`,qt({fieldOrder:t}))}}else if(n===`save-layout-settings`){let e=v.querySelector(`[data-layout-locked]`)?.checked??!1,t=new Set([...v.querySelectorAll(`[data-layout-field-visible]:checked`)].map(e=>e.dataset.layoutFieldVisible??``)),n=Vt(U()).map(e=>e.id),r=n.filter(e=>!t.has(e));K(`layout settings`),F=`none`,qt({locked:e,fieldOrder:n,hiddenFieldIds:r})}else n===`create-relationship`?Pn():n===`undo-change`?Et():n===`redo-change`?Dt():n===`close-dialog`?(F=`none`,z=[],B=null,Q()):n.endsWith(`-view`)?(S=n.replace(`-view`,``),Q()):n===`templates`?(I=`Template starters are in the Teacher panel.`,Q()):n===`student-view`?(K(`student view toggle`),I=y.teacher.studentView?`Teacher tools are visible again.`:`Student view is on.`,G({...y,updatedAt:new Date().toISOString(),teacher:{...y.teacher,studentView:!y.teacher.studentView}})):n===`project-ideas`?(F=`projectIdeas`,Q()):n===`relationships`?(F=`relationship`,Q()):n===`functions`?(F=`functions`,Q()):n===`quality`?(F=`quality`,Q()):n===`teacher-notes`?(F=`teacherNotes`,Q()):n.startsWith(`help-`)?(F=`help`,Q()):(I=`That ListSplatTM control is not available in this workspace.`,Q())}),v.addEventListener(`change`,e=>{let t=e.target;if(t.matches(`#languageSwitcher`)&&t instanceof HTMLSelectElement){mt=ht(t.value);try{localStorage.setItem(Ze,mt)}catch{}Q()}else if(t.matches(`[data-open-json]`)&&t instanceof HTMLInputElement&&t.files?.[0])Pt(t.files[0]);else if(t.matches(`[data-import-csv]`)&&t instanceof HTMLInputElement&&t.files?.[0])Ft(t.files[0]);else if(t.matches(`[data-search-field]`))w=t.value,P=new Set,Q();else if(t.matches(`[data-sort-field]`)){let e=T[0]?.direction??`asc`;T=t.value?[{fieldId:t.value,direction:e}]:[],Q()}else if(t.matches(`[data-group-field]`))M=t.value,Q();else if(t.matches(`[data-board-field]`))rt=t.value,Q();else if(t.matches(`[data-calendar-field]`))it=t.value,Q();else if(t.matches(`[data-wrap-toggle]`)&&t instanceof HTMLInputElement)ot=t.checked,Q();else if(t.matches(`[data-select-all]`)&&t instanceof HTMLInputElement){let e=W(U()).map(e=>e.id);k=t.checked?new Set(e):new Set,Q()}else if(t.matches(`[data-select-row]`)&&t instanceof HTMLInputElement){let e=t.dataset.selectRow??``;t.checked?k.add(e):k.delete(e),Q()}else if(t.matches(`[data-field-type]`))nt=t.value,Q();else if(t.matches(`[data-find-op]`))Jn(),Q();else if(t.matches(`[data-map-action]`))or(),Q();else if(t.matches(`[data-relationship-from-table], [data-relationship-to-table]`))Fn();else if(t.matches(`.multi-option`)&&t instanceof HTMLInputElement){let e=t.closest(`.multi-cell`),n=t.dataset.recordId,r=t.dataset.fieldId;if(e&&n&&r){let t=Array.from(e.querySelectorAll(`.multi-option:checked`)).map(e=>e.dataset.multiOption??``);Ct(n,r),y=re(y,ne(U(),n,r,t.join(`, `))),_e(y),Q()}}else if(t.matches(`.cell-input, .cell-checkbox, .image-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement))if(t instanceof HTMLInputElement&&t.type===`file`&&t.files?.[0]){let e=t.dataset.recordId,n=t.dataset.fieldId,r=t.files[0];e&&n&&On(e,n,r,`image upload`)}else t.dataset.recordId&&t.dataset.fieldId&&Ct(t.dataset.recordId,t.dataset.fieldId),En(t)}),v.addEventListener(`paste`,e=>{let t=e.target,n=t.closest(`.image-cell`);if(n){let t=n.dataset.recordId,r=n.dataset.fieldId,i=Array.from(e.clipboardData?.items??[]).find(e=>e.type.startsWith(`image/`))?.getAsFile();t&&r&&i&&(e.preventDefault(),On(t,r,i,`image paste`));return}let r=t.closest(`.cell-input`);if(!r||!r.closest(`.data-grid`)||!r.dataset.recordId||!r.dataset.fieldId)return;let i=e.clipboardData?.getData(`text/plain`)??``;/[\t\n]/.test(i.replace(/\n$/,``))&&(e.preventDefault(),Wn(i,r.dataset.recordId,r.dataset.fieldId))}),v.addEventListener(`input`,e=>{let t=e.target;if(t.matches(`[data-project-title]`)){kt(t.value);return}if(t.matches(`[data-search]`)){C=t.value,P=new Set,Q();return}t.matches(`.cell-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)&&(t.dataset.recordId&&t.dataset.fieldId&&Ct(t.dataset.recordId,t.dataset.fieldId),En(t))}),v.addEventListener(`focusout`,e=>{e.target.matches?.(`.cell-input, .cell-checkbox`)&&(lt=``)}),v.addEventListener(`mousedown`,e=>{let t=e.target.closest(`[data-record-id][data-field-id]`);if(!t||!t.closest(`.data-grid`)||!t.dataset.recordId||!t.dataset.fieldId)return;let n={r:t.dataset.recordId,f:t.dataset.fieldId};e.shiftKey&&A?(e.preventDefault(),A={anchor:A.anchor,focus:n}):A={anchor:n,focus:n},Vn()}),v.addEventListener(`pointerdown`,e=>{let t=e.target.closest(`[data-col-resize]`);if(!t)return;e.preventDefault(),e.stopPropagation();let n=t.dataset.colResize??``,r=t.closest(`th`);if(!r)return;r.setAttribute(`draggable`,`false`);let i=e.clientX,a=r.getBoundingClientRect().width,o=Math.round(a),s=e=>{o=Math.max(80,Math.round(a+(e.clientX-i))),r.style.width=`${o}px`,r.style.minWidth=`${o}px`},c=()=>{document.removeEventListener(`pointermove`,s),document.removeEventListener(`pointerup`,c),r.setAttribute(`draggable`,`true`);let e=X();e&&(K(`resize column`),qt({columnWidths:{...e.columnWidths??{},[n]:o}}))};document.addEventListener(`pointermove`,s),document.addEventListener(`pointerup`,c)});var sr=null;v.addEventListener(`dragstart`,e=>{let t=e.target,n=t.closest(`.kanban-card[data-kanban-card]`);if(n){st=n.dataset.kanbanCard??null,e.dataTransfer?.setData(`text/plain`,st??``);return}if(t.closest(`[data-col-resize]`))return;let r=t.closest(`.col-head[data-col-field]`);r&&(sr=r.dataset.colField??null,e.dataTransfer?.setData(`text/plain`,sr??``))}),v.addEventListener(`dragover`,e=>{let t=e.target;(sr&&t.closest(`.col-head[data-col-field]`)||st&&t.closest(`.kanban-col`))&&e.preventDefault()}),v.addEventListener(`drop`,e=>{let t=e.target.closest(`.kanban-col`);if(t&&st&&rt){e.preventDefault();let n=st;st=null;let r=t.dataset.kanbanCol??``;K(`move card`),y=re(y,ne(U(),n,rt,r)),_e(y),I=`Moved card to ${r||`Unassigned`}.`,Q();return}let n=e.target.closest(`.col-head[data-col-field]`);if(!n||!sr)return;e.preventDefault();let r=n.dataset.colField??``,i=sr;if(sr=null,!r||r===i)return;let a=Vt(U()).map(e=>e.id),o=a.indexOf(i),s=a.indexOf(r);o<0||s<0||(a.splice(s,0,a.splice(o,1)[0]),K(`reorder columns`),qt({fieldOrder:a}))}),v.addEventListener(`keydown`,e=>{let t=e.target;if(!t.matches?.(`.cell-input, .cell-checkbox`))return;let n=t.dataset.recordId,r=t.dataset.fieldId;if(!n||!r)return;let i=t instanceof HTMLTextAreaElement,a=t instanceof HTMLSelectElement;if(e.shiftKey&&[`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`].includes(e.key)&&!i&&!a){A||={anchor:{r:n,f:r},focus:{r:n,f:r}},e.preventDefault(),Hn(e.key);return}if(e.key===`Escape`&&A){A=null,Vn();return}switch(e.key){case`Enter`:i||(e.preventDefault(),zn(n,r,e.shiftKey?-1:1,0));break;case`ArrowDown`:!i&&!a&&(e.preventDefault(),zn(n,r,1,0));break;case`ArrowUp`:!i&&!a&&(e.preventDefault(),zn(n,r,-1,0));break;case`Tab`:e.preventDefault(),zn(n,r,0,e.shiftKey?-1:1);break;default:break}}),document.addEventListener(`keydown`,e=>{if(!(e.ctrlKey||e.metaKey))return;let t=e.key.toLowerCase();if(t===`c`){Un()&&e.preventDefault();return}t===`z`&&!e.shiftKey?(e.preventDefault(),Et()):t===`y`||t===`z`&&e.shiftKey?(e.preventDefault(),Dt()):t===`s`&&(e.preventDefault(),At(),I=`Saved a .listsplat.json file to your downloads.`,Q())}),document.addEventListener(`click`,e=>{e.target.closest(`.menu`)||Ot()}),document.addEventListener(`toggle`,e=>{let t=e.target;!(t instanceof HTMLDetailsElement)||!t.matches(`.menu`)||!t.open||document.querySelectorAll(`.menu[open]`).forEach(e=>{e!==t&&(e.open=!1)})},!0),Q();