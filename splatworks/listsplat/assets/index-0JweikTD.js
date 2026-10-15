(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`https://www.googleapis.com/auth/drive.file`,t=`31274545407-l338d2doafet21gv8u4qmq2jk3j03jq3.apps.googleusercontent.com`,n=null,r=null;function i(){if(window.SplatPrivacy?.getState().optionalConnections===!1)throw Error(`External connections are off. Enable them in Privacy before using Google Drive.`);if(navigator.onLine===!1)throw Error(`Google Drive needs an internet connection. You can still save to your device.`)}function a(e){return e||document.querySelector(`meta[name="google-drive-client-id"]`)?.content||(/^(splatworks\.org|drawsplat\.org)$/.test(location.hostname)?t:``)}function o(){return i(),window.google?.accounts?.oauth2?Promise.resolve():n||(n=new Promise((e,t)=>{let r=document.createElement(`script`),i=()=>{clearTimeout(a),r.remove(),n=null,t(Error(`Google sign-in could not load. Check your connection and try again.`))},a=setTimeout(i,15e3);r.src=`https://accounts.google.com/gsi/client`,r.async=!0,r.onerror=i,r.onload=()=>{clearTimeout(a),window.google?.accounts?.oauth2?e():i()},document.head.append(r)}),n)}function s(t,n){return i(),new Promise((r,i)=>{let a=!1,o=(e,t)=>{a||(a=!0,clearTimeout(c),n.removeEventListener(`abort`,s),e?i(e):r(t))},s=()=>o(new DOMException(`Cancelled`,`AbortError`)),c=setTimeout(()=>o(Error(`Google sign-in timed out. Try again.`)),12e4);if(n.addEventListener(`abort`,s,{once:!0}),n.aborted){s();return}try{let n=window.google.accounts.oauth2;n.initTokenClient({client_id:t,scope:e,include_granted_scopes:!1,callback(t){if(t.error||!t.access_token){o(Error(`Google Drive permission was not granted. Your local work is unchanged.`));return}if(n.hasGrantedAllScopes&&!n.hasGrantedAllScopes(t,e)||t.scope&&!t.scope.split(/\s+/).includes(e)){o(Error(`Allow access to the files you use with this app to continue.`));return}o(null,t.access_token)},error_callback(){o(Error(`Google sign-in was closed or blocked. Allow the popup and try again.`))}}).requestAccessToken({prompt:`select_account`})}catch(e){o(e)}})}async function c(e,t,n,r){i();let a=await fetch(e,{...t,signal:r,redirect:`error`,headers:{...t.headers,Authorization:`Bearer `+n}});if(!a.ok&&a.status!==308)throw a.status===401?Error(`Google authorization expired. Choose Save or Open again to sign in.`):a.status===403?Error(`Google Drive denied this action. Check your account permissions and school Workspace policy.`):Error(`Google Drive could not complete this action (`+a.status+`). Your local work is unchanged.`);return a}function l(e){if(typeof e!=`string`||!/^[\w-]+$/.test(e))throw Error(`Google Drive did not return a usable file. Try saving again.`);return e}async function u(e,t,n,r){if(!(e instanceof Blob))throw Error(`The project file could not be prepared. Save a local copy and try again.`);let i=e.type||`application/octet-stream`,a=JSON.stringify({name:t,mimeType:i}),o;if(e.size<=5*1024*1024){let t=`splatworks-`+crypto.randomUUID();o=await c(`https://www.googleapis.com/upload/drive/v3/files?fields=id&uploadType=multipart`,{method:`POST`,body:new Blob([`--`+t+`\r
Content-Type: application/json; charset=UTF-8\r
\r
`,a,`\r
--`+t+`\r
Content-Type: `+i+`\r
\r
`,e,`\r
--`+t+`--\r
`]),headers:{"Content-Type":`multipart/related; boundary=`+t}},n,r)}else{let t=(await c(`https://www.googleapis.com/upload/drive/v3/files?fields=id&uploadType=resumable`,{method:`POST`,body:a,headers:{"Content-Type":`application/json; charset=UTF-8`,"X-Upload-Content-Type":i,"X-Upload-Content-Length":String(e.size)}},n,r)).headers.get(`Location`);if(!t)throw Error(`Google Drive did not start the upload. Try again.`);let s=new URL(t);if(s.origin!==`https://www.googleapis.com`||s.pathname!==`/upload/drive/v3/files`)throw Error(`Google Drive returned an unexpected upload address.`);o=await c(s.href,{method:`PUT`,body:e,headers:{"Content-Type":i}},n,r)}let s=l((await o.json()).id);return{id:s,name:t,webViewLink:`https://drive.google.com/file/d/`+s+`/view`}}function ee(){if(document.getElementById(`splat-drive-styles`))return;let e=document.createElement(`style`);e.id=`splat-drive-styles`,e.textContent=`.splat-drive-dialog{box-sizing:border-box;width:min(32rem,calc(100vw - 2rem));max-height:calc(100dvh - 2rem);overflow:auto;margin:auto;padding:1.5rem;border:1px solid #cbd5e1;border-radius:1rem;background:#fff;color:#172036;font:16px/1.5 system-ui,sans-serif;box-shadow:0 24px 80px #0004;z-index:2147483647}.splat-drive-dialog::backdrop{background:#10172a99}.splat-drive-dialog h2{margin:0 0 .8rem;font-size:1.4rem;color:#172036}.splat-drive-dialog p{margin:.7rem 0}.splat-drive-dialog label{display:block;font-weight:650}.splat-drive-dialog input{box-sizing:border-box;display:block;width:100%;margin:.4rem 0;padding:.65rem;border:1px solid #94a3b8;border-radius:.5rem;background:#fff;color:#172036;font:inherit}.splat-drive-dialog button,.splat-drive-dialog a{font:inherit}.splat-drive-dialog button{padding:.65rem 1rem;border:1px solid #aab4c5;border-radius:.5rem;background:#f3f5fa;color:#172036;cursor:pointer}.splat-drive-dialog button[type=submit]{background:#5b21b6;border-color:#5b21b6;color:#fff}.splat-drive-dialog button:disabled{opacity:.55;cursor:wait}.splat-drive-dialog :focus-visible{outline:3px solid #d97706;outline-offset:3px}.splat-drive-dialog a{color:#5b21b6;text-decoration:underline}.splat-drive-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:.6rem;margin-top:1rem}.splat-drive-status{min-height:1.5em;overflow-wrap:anywhere}.splat-drive-dialog [hidden]{display:none!important}`,document.head.append(e)}function d(e,t){if(r)return Promise.reject(Error(`A Google Drive window is already open.`));ee();let n=document.activeElement,d=document.createElement(`dialog`);d.className=`splat-drive-dialog`,d.setAttribute(`aria-label`,t===`save`?`Save to Google Drive`:t===`open`?`Open from Google Drive`:`Connect Google Drive`),d.innerHTML=`<h2></h2><p class="splat-drive-note"></p><form><label>File name<input name="filename" maxlength="180" required></label><p class="splat-drive-status" role="status" aria-live="polite"></p><p class="splat-drive-result" hidden><a target="_blank" rel="noopener noreferrer">Open in Google Drive</a></p><div class="splat-drive-actions"><button type="button" data-close>Cancel</button><button type="submit" disabled></button></div></form>`;let te=d.querySelector(`form`),f=te.elements.filename,p=te.querySelector(`[type=submit]`),ne=te.querySelector(`[data-close]`),m=d.querySelector(`[role=status]`),re=d.querySelector(`.splat-drive-result`),h=t===`save`?`Save to Google Drive`:t===`open`?`Open from Google Drive`:`Connect Google Drive`;d.querySelector(`h2`).textContent=h,d.querySelector(`.splat-drive-note`).textContent=t===`save`?e.appName+` saves a new native project file to the Google account you choose. Local work stays here. Sharing is not enabled; manage access in Drive. Download the file from Drive and open it in `+e.appName+` to edit.`:`Choose your Google account to `+(t===`open`?`reopen the last `+e.appName+` file saved from this browser.`:`connect `+e.appName+`.`)+` Access is limited to files you use with this app.`,f.value=e.fileName||`project.json`,f.parentElement.hidden=t!==`save`,p.textContent=h,document.body.append(d),r=d,d.showModal();let g,_=!1,v=null,ie=new Promise(e=>{d.addEventListener(`close`,()=>{_=!0,g?.abort(),r=null,d.remove(),n instanceof HTMLElement&&n.isConnected&&n.focus(),e(v)},{once:!0})});ne.onclick=()=>d.close();let ae=a(e.clientId);try{if(i(),location.protocol!==`https:`&&!/^(localhost|127\.0\.0\.1)$/.test(location.hostname))throw Error(`Google Drive needs a hosted HTTPS site. Save to your device here.`);if(!ae)throw Error(`This site needs Google Drive setup. Ask your administrator to configure a Google OAuth client. Local saving is available.`);m.textContent=`Loading Google sign-in…`,o().then(()=>{_||(i(),m.textContent=`Choose `+h+` to sign in and authorize this file transfer.`,p.disabled=!1)}).catch(e=>{_||(m.textContent=e.message)})}catch(e){m.textContent=e.message}return te.onsubmit=async n=>{if(n.preventDefault(),p.disabled||_)return;let r=f.value.replace(/[\x00-\x1f/\\]/g,`-`).trim(),a=e.fileName?.match(/\.(?:(?:grid|show|write|list)splat\.json|layoutsplat)$/i)?.[0];if(r&&a&&!r.toLowerCase().endsWith(a.toLowerCase())&&(r+=a),t===`save`&&!r){f.focus();return}p.disabled=!0,f.disabled=!0,g=new AbortController;let o;try{m.textContent=`Choose your Google account and allow file access…`;let n=await s(ae,g.signal);if(_)return;if(i(),o=setTimeout(()=>g.abort(),18e4),t===`save`){if(m.textContent=`Preparing and uploading your project…`,v=await u(await e.buildFile(),r,n,g.signal),_)return;re.querySelector(`a`).href=v.webViewLink,re.hidden=!1,m.textContent=`Saved `+r+` to Google Drive. Local work is preserved.`,ne.textContent=`Done`,p.hidden=!0}else t===`open`?(m.textContent=`Opening your project…`,v=await(await c(`https://www.googleapis.com/drive/v3/files/`+l(e.fileId)+`?alt=media`,{method:`GET`},n,g.signal)).blob(),d.close()):(v=!0,d.close())}catch(e){_||(v=null,m.textContent=e.name===`AbortError`?`The transfer stopped. Check Drive before retrying. Your local work is preserved.`:e.message,p.disabled=!1,f.disabled=!1)}finally{clearTimeout(o)}},ie}function te(e){return d(e,`save`)}var f={writesplat:`WriteSplat`,showsplat:`ShowSplat`,gridsplat:`GridSplat`,listsplat:`ListSplat`,layoutsplat:`LayoutSplat`},p={writesplat:[`doc`,`docx`,`odt`,`txt`,`text`,`md`,`markdown`,`html`,`htm`,`json`],showsplat:[`pptx`,`odp`,`pdf`,`html`,`htm`,`md`,`markdown`,`json`],gridsplat:[`xlsx`,`ods`,`csv`,`tsv`,`md`,`markdown`,`json`],listsplat:[`csv`,`tsv`,`json`],layoutsplat:[`layoutsplat`,`json`]},ne=600*1e3,m=`open-file`,re=()=>`drawsplat.imported-tab.`+location.pathname,h;typeof location<`u`&&(h=new URL(location.href).searchParams.get(m));function g(){return typeof window>`u`?!1:h?(sessionStorage.setItem(re(),`1`),!0):sessionStorage.getItem(re())===`1`}function _(){return g()?window.sessionStorage:window.localStorage}function v(e){let t=String(e).toLowerCase();for(let e of Object.keys(f))if(t.endsWith(`.`+e+`.json`))return e;let n=t.split(`.`).pop();return n===`layoutsplat`?`layoutsplat`:[`doc`,`docx`,`odt`].includes(n)?`writesplat`:[`pptx`,`odp`].includes(n)?`showsplat`:[`xlsx`,`ods`].includes(n)?`gridsplat`:null}function ie(e){return e?.app===`LayoutSplat`&&Array.isArray(e?.pages)&&e?.stories?`layoutsplat`:Array.isArray(e?.slides)?`showsplat`:e?.document&&e?.teacher?`writesplat`:Array.isArray(e?.sheets)?`gridsplat`:Array.isArray(e?.schema?.tables)?`listsplat`:null}async function ae(e,t){let n=e.name.toLowerCase().split(`.`).pop();if(!p[t]?.includes(n)){let n=v(e.name);throw Error(n?`Open ${e.name} in ${f[n]}.`:`${f[t]} cannot open this file type. Use ${p[t].map(e=>`.`+e).join(`, `)}. For older Office files, save a current DOCX, XLSX, PPTX, or CSV copy first.`)}if(e.size>2e7)throw Error(`File imports are limited to 20 MB.`);if(![`doc`,`docx`,`odt`,`pptx`,`odp`,`xlsx`,`ods`,`pdf`,`layoutsplat`].includes(n)){let t=new Uint8Array(await e.slice(0,512).arrayBuffer());if(t.includes(0)||t[0]===80&&t[1]===75&&t[2]===3&&t[3]===4)throw Error(`This looks like a binary file with a text filename. Use its original Office extension, or export text/CSV as UTF-8.`)}}function oe(){return new Promise((e,t)=>{let n=indexedDB.open(`drawsplat-file-transfers`,1);n.onupgradeneeded=()=>n.result.createObjectStore(`files`,{keyPath:`id`}),n.onsuccess=()=>e(n.result),n.onerror=()=>t(Error(`Browser file transfer storage is unavailable. Open the correct app and choose the file there.`))})}async function se(e){let t=await oe();try{await new Promise((n,r)=>{let i=t.transaction(`files`,`readwrite`),a=i.objectStore(`files`),o=a.openCursor();o.onsuccess=()=>{let e=o.result;e&&(Date.now()-e.value.createdAt>ne&&e.delete(),e.continue())},a.put(e),i.oncomplete=n,i.onerror=()=>r(i.error),i.onabort=()=>r(i.error)})}finally{t.close()}}async function ce(e,t){let n=await oe();try{return await new Promise((r,i)=>{let a=n.transaction(`files`,`readwrite`),o=a.objectStore(`files`),s=o.get(e),c;s.onsuccess=()=>{c=s.result,c&&o.delete(e)},a.oncomplete=()=>{!c||c.app!==t||Date.now()-c.createdAt>ne?i(Error(`This file transfer expired or is unavailable. Choose the file again in its matching app.`)):r(new File([c.file],c.name,{type:c.type,lastModified:c.modified}))},a.onerror=()=>i(a.error)})}finally{n.close()}}async function le(e,t){let n=v(e.name);if(!n&&!p[t]?.includes(e.name.toLowerCase().split(`.`).pop())&&(/\.(csv|tsv)$/i.test(e.name)?n=`gridsplat`:/\.pdf$/i.test(e.name)?n=`showsplat`:/\.(txt|text|md|markdown|html|htm)$/i.test(e.name)&&(n=`writesplat`)),!n&&/\.json$/i.test(e.name)&&e.size<=2e7)try{n=ie(JSON.parse(await e.text()))}catch{}if(!n||n===t)return!1;if(e.size>2e7)throw Error(`File imports are limited to 20 MB.`);if(![`http:`,`https:`].includes(location.protocol))throw Error(`Open SplatWorks through a local web server to transfer files between apps.`);let r=window.open(`about:blank`,`_blank`);if(!r)throw Error(`Your browser blocked the new tab. Allow popups, then choose the file again to open it in ${f[n]}.`);r.opener=null;let i=location.pathname.indexOf(`/splatworks/`),a=i>=0?location.pathname.slice(0,i)+`/splatworks/`:`/splatworks/`,o=new URL(a+n+`/`,location.origin),s=crypto.randomUUID?.()||`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g,e=>{let t=crypto.getRandomValues(new Uint8Array(1))[0]&15;return(e===`x`?t:t&3|8).toString(16)});try{let t=await fetch(o,{cache:`no-cache`});if(!t.ok||!(await t.text()).includes(`name="splatworks-app" content="`+n+`"`))throw Error(`${f[n]} is not available at this school address. Install or enable it, then choose the file there.`);return await se({id:s,app:n,file:e,name:e.name,type:e.type,modified:e.lastModified,createdAt:Date.now()}),o.searchParams.set(m,s),r.location.href=o.href,!0}catch(e){throw r.close(),e}}async function ue(e){if(!h)return null;let t=h;g(),h=null;let n=new URL(location.href);if(n.searchParams.delete(m),history.replaceState(history.state,``,n),!/^[0-9a-f-]{36}$/i.test(t))throw Error(`Invalid file transfer. Choose the file again.`);return ce(t,e)}var de=`Save a project file before closing this imported tab. Your other projects have not been replaced.`,fe={text:``,longText:``,number:0,currency:0,percent:0,date:``,time:``,dateTime:``,checkbox:!1,rating:0,choice:``,multiSelect:``,email:``,phone:``,image:``,file:``,audio:``,link:``,calculation:``,autoNumber:``,createdAt:``,updatedAt:``};function y(e){return`${e}_${Math.random().toString(36).slice(2,10)}`}function pe(e,t=`text`){return{id:y(`field`),name:e,type:t,description:``,required:!1,hidden:!1,options:t===`choice`||t===`multiSelect`?[`Yes`,`No`]:void 0}}function b(e,t={}){let n=new Date().toISOString(),r=Object.fromEntries(e.map((e,r)=>e.type===`createdAt`||e.type===`updatedAt`?[e.id,t[e.id]??n]:e.type===`autoNumber`?[e.id,t[e.id]??r+1]:t[e.id]===void 0&&e.defaultValue!=null&&e.defaultValue!==``?[e.id,be(e.defaultValue,e.type,e.options).value]:[e.id,t[e.id]??fe[e.type]]));return{id:y(`record`),createdAt:n,updatedAt:n,values:r}}function me(e,t){let n=t.map(e=>pe(e));return{id:y(`table`),name:e,fields:n,records:[b(n)]}}function he(e=`Animal Research Database`){let t=new Date().toISOString(),n=me(`Animals`,[`Animal`,`Habitat`,`Diet`,`Interesting Fact`]);return n.records=[b(n.fields,{[n.fields[0].id]:`Axolotl`,[n.fields[1].id]:`Freshwater lakes`,[n.fields[2].id]:`Worms and insects`,[n.fields[3].id]:`It can regrow some body parts.`}),b(n.fields,{[n.fields[0].id]:`Red panda`,[n.fields[1].id]:`Mountain forests`,[n.fields[2].id]:`Bamboo and fruit`,[n.fields[3].id]:`It uses its tail like a blanket.`})],{app:`ListSplatTM`,version:1,createdAt:t,updatedAt:t,metadata:{title:e,author:``,className:``},schema:{tables:[n],relationships:[]},layouts:[{id:y(`layout`),name:`Table View`,tableId:n.id,mode:`table`,locked:!1},{id:y(`layout`),name:`Record Form`,tableId:n.id,mode:`form`,locked:!1},{id:y(`layout`),name:`Research Cards`,tableId:n.id,mode:`cards`,locked:!1}],teacher:{studentView:!1,notes:[`Ask students to add source notes before printing a report.`],rubric:[]}}}function ge(e,t,n=`text`){let r=pe(t.trim()||`New Field`,n);return{...e,fields:[...e.fields,r],records:e.records.map(e=>({...e,updatedAt:new Date().toISOString(),values:{...e.values,[r.id]:fe[n]}}))}}function _e(e,t){return e.records.reduce((e,n)=>{let r=Number(n.values[t]);return Number.isFinite(r)?Math.max(e,r):e},0)+1}function ve(e){let t={};return e.fields.filter(e=>e.type===`autoNumber`).forEach(n=>{t[n.id]=_e(e,n.id)}),t}function ye(e){return{...e,records:[...e.records,b(e.fields,ve(e))]}}function be(e,t,n){let r=e==null?``:String(e);if(r.trim()===``)return{value:fe[t],lost:!1};switch(t){case`number`:case`currency`:case`percent`:case`rating`:{let e=Number(r.replace(/[$,%\s]/g,``));return Number.isFinite(e)?{value:t===`rating`?Math.max(0,Math.min(5,Math.round(e))):e,lost:!1}:{value:fe[t],lost:!0}}case`checkbox`:{let e=r.trim().toLowerCase();return[`true`,`yes`,`1`,`y`,`checked`].includes(e)?{value:!0,lost:!1}:[`false`,`no`,`0`,`n`].includes(e)?{value:!1,lost:!1}:{value:!1,lost:!0}}case`choice`:{let e=n?.find(e=>e.toLowerCase()===r.trim().toLowerCase());return e?{value:e,lost:!1}:{value:``,lost:!!(n&&n.length)}}case`date`:{let e=new Date(r);return Number.isNaN(e.getTime())?{value:``,lost:!0}:{value:e.toISOString().slice(0,10),lost:!1}}case`text`:case`longText`:case`link`:return{value:r,lost:!1};default:return{value:r,lost:!1}}}function xe(e,t,n,r){return{...e,records:e.records.map(e=>({...e,values:{...e.values,[t]:be(e.values[t],n,r).value}}))}}function Se(e,t,n){return{...e,fields:e.fields.map(e=>e.id===t?{...e,...n}:e)}}function Ce(e,t){let n=e.records.find(e=>e.id===t);return n?{...e,records:[...e.records,b(e.fields,{...n.values,...ve(e)})]}:e}function we(e,t){return e.records.length<=1?e:{...e,records:e.records.filter(e=>e.id!==t)}}function Te(e,t,n,r){let i=new Date().toISOString();return{...e,records:e.records.map(a=>a.id===t?{...a,updatedAt:i,values:Object.fromEntries(e.fields.map(e=>e.id===n?[e.id,r]:e.type===`updatedAt`?[e.id,i]:[e.id,a.values[e.id]]))}:a)}}function x(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t.id?t:e)}}}function Ee(e,t){let n=me(t.trim()||`New Table`,[`Name`,`Notes`]);return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:[...e.schema.tables,n]},layouts:[...e.layouts,{id:y(`layout`),name:`${n.name} Table`,tableId:n.id,mode:`table`,locked:!1},{id:y(`layout`),name:`${n.name} Form`,tableId:n.id,mode:`form`,locked:!1}]}}function De(e,t,n){let r=n.trim()||`Table`;return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t?{...e,name:r}:e)}}}function Oe(e,t){let n=e.schema.tables.find(e=>e.id===t);if(!n)return{project:e,newTableId:t};let r=new Map(n.fields.map(e=>[e.id,y(`field`)])),i=n.fields.map(e=>({...e,id:r.get(e.id)})),a=n.records.map(e=>({id:y(`record`),createdAt:e.createdAt,updatedAt:e.updatedAt,values:Object.fromEntries(Object.entries(e.values).map(([e,t])=>[r.get(e)??e,t]))})),o={id:y(`table`),name:`${n.name} copy`,fields:i,records:a},s=e.schema.tables.findIndex(e=>e.id===t),c=[...e.schema.tables];return c.splice(s+1,0,o),{project:{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:c},layouts:[...e.layouts,{id:y(`layout`),name:`${o.name} Table`,tableId:o.id,mode:`table`,locked:!1},{id:y(`layout`),name:`${o.name} Form`,tableId:o.id,mode:`form`,locked:!1}]},newTableId:o.id}}function ke(e,t,n){let r=[...e.schema.tables],i=r.findIndex(e=>e.id===t),a=i+n;return i<0||a<0||a>=r.length?e:([r[i],r[a]]=[r[a],r[i]],{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:r}})}function Ae(e,t){return e.schema.tables.length<=1?e:{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.filter(e=>e.id!==t),relationships:e.schema.relationships.filter(e=>e.fromTableId!==t&&e.toTableId!==t)},layouts:e.layouts.filter(e=>e.tableId!==t),views:(e.views??[]).filter(e=>e.tableId!==t)}}function je(e){let t=new Date().toISOString();return{...e,createdAt:t,updatedAt:t,metadata:{...e.metadata,title:`${e.metadata.title} (template)`},schema:{...e.schema,tables:e.schema.tables.map(e=>({...e,records:[b(e.fields)]}))},views:[]}}function Me(e,t){return e.fields.filter(e=>![`autoNumber`,`createdAt`,`updatedAt`,`calculation`].includes(e.type)).map(e=>String(t.values[e.id]??``).trim().toLowerCase()).join(``)}function Ne(e){let t=new Set,n=[];return e.records.forEach(r=>{let i=Me(e,r);t.has(i)?n.push(r.id):t.add(i)}),n}function Pe(e){let t=new Set(Ne(e));if(!t.size)return e;let n=e.records.filter(e=>!t.has(e.id));return{...e,records:n.length?n:[e.records[0]]}}function Fe(e){return e.fields.filter(t=>![`autoNumber`,`createdAt`,`updatedAt`,`calculation`].includes(t.type)&&e.records.every(e=>String(e.values[t.id]??``).trim()===``))}function Ie(e){return e.schema.relationships.filter(t=>{let n=e.schema.tables.find(e=>e.id===t.fromTableId),r=e.schema.tables.find(e=>e.id===t.toTableId),i=n?.fields.some(e=>e.id===t.fromFieldId),a=r?.fields.some(e=>e.id===t.toFieldId);return!i||!a})}function Le(e){let t=new Set(Ie(e).map(e=>e.id));return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,relationships:e.schema.relationships.filter(e=>!t.has(e.id))}}}function Re(e){if(!e||typeof e!=`object`)throw Error(`This is not a ListSplatTM project file.`);let t=e;if(t.app!==`ListSplatTM`||t.version!==1||!t.schema?.tables)throw Error(`This file is not a supported .listsplat.json project.`)}function ze(e){let t=e.split(/\r?\n/,1)[0]??``,n=[`,`,`	`,`;`],r=`,`,i=-1;for(let e of n){let n=t.split(e).length-1;n>i&&(i=n,r=e)}return r}function Be(e,t=ze(e)){let n=[],r=``,i=[],a=!1;for(let o=0;o<e.length;o+=1){let s=e[o],c=e[o+1];a&&s===`"`&&c===`"`?(r+=`"`,o+=1):s===`"`?a=!a:!a&&s===t?(i.push(r),r=``):!a&&(s===`
`||s===`\r`)?(s===`\r`&&c===`
`&&(o+=1),i.push(r),i.some(e=>e.length>0)&&n.push(i),i=[],r=``):r+=s}return i.push(r),i.some(e=>e.length>0)&&n.push(i),n}function Ve(e,t){let n=Be(t),r=(n[0]?.map((e,t)=>e.trim()||`Field ${t+1}`)??[`Field 1`]).map(e=>pe(e)),i=n.slice(1).map(e=>b(r,Object.fromEntries(r.map((t,n)=>[t.id,e[n]??``]))));return{id:`table_${Date.now().toString(36)}`,name:e,fields:r,records:i.length>0?i:[b(r)]}}function He(e){let t=e==null?``:String(e);return/[",\n\r]/.test(t)?`"${t.replaceAll(`"`,`""`)}"`:t}function Ue(e){return[e.fields.map(e=>He(e.name)).join(`,`),...e.records.map(t=>e.fields.map(e=>He(t.values[e.id])).join(`,`))].join(`
`)}var We=`listsplat.autosave.v1`;function Ge(e){_().setItem(We,JSON.stringify(e))}function Ke(){let e=_().getItem(We);if(!e)return null;let t=JSON.parse(e);return Re(t),t}function qe(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,a.click(),URL.revokeObjectURL(i)}function Je(e){return e==null?``:String(e).trim().toLowerCase()}function Ye(e,t,n,r,i){return{id:y(`relationship`),name:e.trim()||`New Relationship`,fromTableId:t,fromFieldId:n,toTableId:r,toFieldId:i}}function Xe(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,relationships:[...e.schema.relationships,t]}}}function Ze(e,t,n,r){let i=Je(n.values[e.fromFieldId]);return!i||t.id!==e.fromTableId||r.id!==e.toTableId?[]:r.records.filter(t=>Je(t.values[e.toFieldId])===i)}function Qe(e,t){let n=e.schema.tables.find(e=>e.id===t.fromTableId),r=e.schema.tables.find(e=>e.id===t.toTableId),i=n?.fields.find(e=>e.id===t.fromFieldId),a=r?.fields.find(e=>e.id===t.toFieldId);return`${n?.name??`Table`}:${i?.name??`Field`} -> ${r?.name??`Table`}:${a?.name??`Field`}`}function $e(e,t){return e.records.map(e=>Number(e.values[t])).filter(e=>Number.isFinite(e))}function et(e){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)).map(t=>{let n=$e(e,t.id),r=n.reduce((e,t)=>e+t,0);return{fieldId:t.id,fieldName:t.name,count:n.length,sum:r,average:n.length?r/n.length:0,minimum:n.length?Math.min(...n):0,maximum:n.length?Math.max(...n):0}})}function tt(e){let t=[],n=``,r=!1,i=0;for(let a=0;a<e.length;a+=1){let o=e[a],s=e[a-1];if(o===`"`&&s!==`\\`){r=!r,n+=o;continue}if(!r&&o===`(`&&(i+=1),!r&&o===`)`&&--i,o===`,`&&!r&&i===0){t.push(n.trim()),n=``;continue}n+=o}return(n.trim()||e.endsWith(`,`))&&t.push(n.trim()),t}function nt(e){let t=e.trim();if(t.startsWith(`"`)&&t.endsWith(`"`))return t.slice(1,-1).replace(/\\"/g,`"`)}function rt(e,t,n){let r=n.trim().toLowerCase(),i=e.fields.find(e=>e.name.toLowerCase()===r);return i?String(t.values[i.id]??``):``}function S(e,t,n){let r=n.trim();return/^[A-Z_]+\(.*\)$/i.test(r)?ct(r,e,t):nt(n)??rt(e,t,n)}function C(e,t,n){let r=Number(S(e,t,n));return Number.isFinite(r)?r:0}function it(e,t){let n=t.trim().toLowerCase(),r=e.fields.find(e=>e.name.toLowerCase()===n);return r?$e(e,r.id):[]}function w(e){return Number.isFinite(e)?String(Number(e.toFixed(8))):`Formula error: not a number`}function at(e){return e.toLowerCase().replace(/\b[a-z]/g,e=>e.toUpperCase())}function ot(e,t,n,r){if(!e)return[];let i=r.trim().toLowerCase(),a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===i),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0;return a&&o?Ze(a,t,n,o):[]}function st(e,t,n,r,i){if(!e)return``;let a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===r.trim().toLowerCase()),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0,s=ot(e,t,n,r)[0],c=o?.fields.find(e=>e.name.toLowerCase()===i.trim().toLowerCase());return s&&c?String(s.values[c.id]??``):``}function ct(e,t,n,r){let i=e.trim();if(!i)return``;let a=i.match(/^([A-Z_]+)\((.*)\)$/i);if(!a)return`Formula error: use a function like FIELD(Name)`;let o=a[1].toUpperCase(),s=tt(a[2]),c=s[0]??``;if(o===`FIELD`)return rt(t,n,c);if(o===`JOIN`)return s.map(e=>S(t,n,e)).join(``);if(o===`UPPER`)return S(t,n,c).toUpperCase();if(o===`LOWER`)return S(t,n,c).toLowerCase();if(o===`TITLECASE`)return at(S(t,n,c));if(o===`TRIM`)return S(t,n,c).trim();if(o===`LENGTH`)return String(S(t,n,c).length);if(o===`CONTAINS`)return S(t,n,c).toLowerCase().includes(S(t,n,s[1]??``).toLowerCase())?`Yes`:`No`;if(o===`IF_EMPTY`)return S(t,n,c).trim()?S(t,n,c):S(t,n,s[1]??``);if(o===`LOOKUP`)return st(r,t,n,nt(c)??c,nt(s[1]??``)??s[1]??``);if(o===`COUNT_RELATED`)return String(ot(r,t,n,nt(c)??c).length);if(o===`ADD`)return w(s.reduce((e,r)=>e+C(t,n,r),0));if(o===`SUBTRACT`)return w(s.slice(1).reduce((e,r)=>e-C(t,n,r),C(t,n,c)));if(o===`MULTIPLY`)return w(s.reduce((e,r)=>e*C(t,n,r),1));if(o===`DIVIDE`){let e=C(t,n,s[1]??``);return e===0?`Formula error: divide by zero`:w(C(t,n,c)/e)}if(o===`ROUND`){let e=Math.max(0,Math.min(6,Math.round(C(t,n,s[1]??`"0"`))));return String(Number(C(t,n,c).toFixed(e)))}if([`SUM`,`AVERAGE`,`MIN`,`MAX`,`COUNT`].includes(o)){let e=it(t,c);return o===`SUM`?w(e.reduce((e,t)=>e+t,0)):o===`AVERAGE`?w(e.length?e.reduce((e,t)=>e+t,0)/e.length:0):o===`MIN`?w(e.length?Math.min(...e):0):o===`MAX`?w(e.length?Math.max(...e):0):String(e.length)}if(o===`COUNT_UNIQUE`){let e=c.trim().toLowerCase(),n=t.fields.find(t=>t.name.toLowerCase()===e);if(!n)return`0`;let r=new Set(t.records.map(e=>String(e.values[n.id]??``).trim().toLowerCase()).filter(Boolean));return String(r.size)}if(o===`PERCENT`){let e=C(t,n,s[1]??``);return e===0?`0`:w(C(t,n,c)/e*100)}if(o===`LEFT`)return S(t,n,c).slice(0,Math.max(0,C(t,n,s[1]??`"0"`)));if(o===`RIGHT`){let e=Math.max(0,C(t,n,s[1]??`"0"`)),r=S(t,n,c);return e===0?``:r.slice(-e)}if(o===`MID`){let e=Math.max(0,C(t,n,s[1]??`"1"`)-1),r=Math.max(0,C(t,n,s[2]??`"0"`));return S(t,n,c).slice(e,e+r)}if(o===`SUBSTITUTE`)return S(t,n,c).split(S(t,n,s[1]??``)).join(S(t,n,s[2]??``));let l=e=>{let r=S(t,n,e).trim().toLowerCase();return r!==``&&![`no`,`false`,`0`].includes(r)};if(o===`IS_EMPTY`)return S(t,n,c).trim()===``?`Yes`:`No`;if(o===`NOT`)return l(c)?`No`:`Yes`;if(o===`AND`)return s.every(l)?`Yes`:`No`;if(o===`OR`)return s.some(l)?`Yes`:`No`;if(o===`IF`)return l(c)?S(t,n,s[1]??``):S(t,n,s[2]??``);let u=e=>{let r=S(t,n,e).trim();if(!r)return null;let i=new Date(r.length<=10?`${r}T00:00:00`:r);return Number.isNaN(i.getTime())?null:i};if(o===`TODAY`)return new Date().toISOString().slice(0,10);if(o===`YEAR`||o===`MONTH`||o===`DAY`){let e=u(c);return e?String(o===`YEAR`?e.getFullYear():o===`MONTH`?e.getMonth()+1:e.getDate()):``}if(o===`DAYS_BETWEEN`||o===`YEARS_BETWEEN`){let e=u(c),t=s[1]?u(s[1]):new Date;if(!e||!t)return``;let n=Math.round((t.getTime()-e.getTime())/864e5);return String(o===`DAYS_BETWEEN`?n:Math.floor(n/365.25))}return`Formula error: ${o} is not supported`}function T(e){return e==null?``:String(e)}function lt(e,t){let n=t.query.trim();if(!n)return e.records;let r=n.toLowerCase();return e.records.filter(n=>(t.fieldId===`all`?e.fields.map(e=>e.id):[t.fieldId]).some(e=>T(n.values[e]).toLowerCase().includes(r)))}function ut(e,t){let n=Number(e),r=Number(t);return e!==``&&t!==``&&!Number.isNaN(n)&&!Number.isNaN(r)?n-r:e.localeCompare(t,void 0,{numeric:!0,sensitivity:`base`})}function dt(e,t){return t.length?[...e].sort((e,n)=>{for(let r of t){let t=T(e.values[r.fieldId]).trim(),i=T(n.values[r.fieldId]).trim();if(t===``&&i!==``)return 1;if(t!==``&&i===``)return-1;let a=ut(t,i)*(r.direction===`asc`?1:-1);if(a!==0)return a}return 0}):e}function ft(e,t){let n=T(e.values[t.fieldId]),r=n.trim().toLowerCase(),i=t.value.trim().toLowerCase(),a=Number(n),o=Number(t.value),s=n.trim()!==``&&t.value.trim()!==``&&!Number.isNaN(a)&&!Number.isNaN(o);switch(t.operator){case`contains`:return r.includes(i);case`equals`:return s?a===o:r===i;case`startsWith`:return r.startsWith(i);case`endsWith`:return r.endsWith(i);case`greaterThan`:return s?a>o:r>i;case`lessThan`:return s?a<o:r<i;case`between`:{let e=Number(t.value),n=Number(t.value2);return!Number.isNaN(e)&&!Number.isNaN(n)&&!Number.isNaN(a)?a>=Math.min(e,n)&&a<=Math.max(e,n):r>=i&&r<=(t.value2??``).trim().toLowerCase()}case`isEmpty`:return n.trim()===``;case`isNotEmpty`:return n.trim()!==``;default:return!0}}function pt(e,t){return!t||t.rules.length===0?e:e.filter(e=>t.match===`all`?t.rules.every(t=>ft(e,t)):t.rules.some(t=>ft(e,t)))}function mt(e,t){let n=new Map;return e.records.forEach(e=>{let r=T(e.values[t]).trim().toLowerCase();r&&n.set(r,(n.get(r)??0)+1)}),e.records.filter(e=>{let r=T(e.values[t]).trim().toLowerCase();return r?(n.get(r)??0)>1:!1})}function ht(e,t){return e.records.filter(e=>!T(e.values[t]).trim())}function gt(e,t){if(!t.find)return[];let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=[];return e.records.forEach(e=>{o.has(e.id)&&t.fieldIds.forEach(n=>{let r=T(e.values[n]),i=r.replace(a,t.replacement);i!==r&&s.push({recordId:e.id,fieldId:n,before:r,after:i})})}),s}function _t(e,t){if(!t.find)return{table:e,count:0};let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=0,c=e.records.map(e=>{if(!o.has(e.id))return e;let n=!1,r={...e.values};return t.fieldIds.forEach(e=>{let i=T(r[e]),o=i.replace(a,()=>(s+=1,t.replacement));o!==i&&(n=!0,r[e]=o)}),n?{...e,updatedAt:new Date().toISOString(),values:r}:e});return{table:{...e,records:c},count:s}}var vt={email:/^[^\s@]+@[^\s@]+\.[^\s@]+$/,url:/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/,phone:/^[+()\d][\d\s().-]{5,}$/};function yt(e){return e==null?``:String(e)}function bt(e,t,n,r){let i=xt(e,t,n,r);return i&&e.customMessage?e.customMessage:i}function xt(e,t,n,r){let i=yt(t).trim();if(i===``)return e.required?`This field is required.`:``;if(e.maxLength&&i.length>e.maxLength)return`Keep this ${e.maxLength} characters or fewer.`;if(e.type===`email`&&!vt.email.test(i))return`Enter a valid email address.`;if(e.type===`phone`&&!vt.phone.test(i))return`Enter a valid phone number.`;if([`number`,`currency`,`percent`,`rating`].includes(e.type)){let t=Number(i);if(Number.isNaN(t))return`Enter a number.`;if(e.min!=null&&t<e.min)return`Must be at least ${e.min}.`;if(e.max!=null&&t>e.max)return`Must be at most ${e.max}.`}if([`text`,`longText`,`link`].includes(e.type)&&e.pattern&&e.pattern!==`none`){if(e.pattern===`custom`){if(e.customPattern)try{if(!new RegExp(e.customPattern).test(i))return`Does not match the required format.`}catch{}}else if(!vt[e.pattern].test(i))return`Enter a valid ${e.pattern}.`}return e.unique&&n&&n.records.some(t=>t.id!==r&&yt(t.values[e.id]).trim().toLowerCase()===i.toLowerCase())?`This value is already used in another record.`:``}function St(e){let t=[];return e.fields.forEach(n=>{[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(n.type)||e.records.forEach(r=>{let i=bt(n,r.values[n.id],e,r.id);i&&t.push({record:r,field:n,message:i})})}),t}function Ct(e,t,n,r,i,a){return{id:e,title:t,gradeBand:n,goal:r,table:Ve(t,i),reflectionQuestions:a}}var wt=[Ct(`classroom-library`,`Classroom Library Catalog`,`Grades 3-8`,`Track books, genres, reading levels, and recommendations.`,`Title,Author,Genre,Pages,Who would enjoy it?
Charlotte's Web,E. B. White,Fiction,192,Readers who like animals
Hidden Figures,Margot Lee Shetterly,Biography,240,Readers who like history`,[`Which genre appears most often?`,`What book would you recommend first?`]),Ct(`science-observations`,`Science Observation Log`,`Grades 3-8`,`Collect observations over time and look for patterns.`,`Date,Object observed,Location,Measurement,Observation
2026-06-29,Bean plant,Window,8 cm,Two new leaves
2026-06-30,Bean plant,Window,8.5 cm,Stem leaned toward light`,[`What changed over time?`,`What might explain the pattern?`]),Ct(`state-facts`,`State Facts Database`,`Grades 4-8`,`Compare places using consistent fields.`,`State,Capital,Region,Population note,Interesting fact
Texas,Austin,South,Large population,Has many different ecosystems
New Mexico,Santa Fe,Southwest,Medium population,Capital is over 400 years old`,[`Which fields help compare states?`,`What new field would improve this database?`]),Ct(`book-reviews`,`Book Review Collection`,`Grades 3-8`,`Collect opinions and evidence from student reading.`,`Book,Reviewer,Rating,Favorite part,Would recommend?
Because of Winn-Dixie,Jordan,5,The friendship story,Yes
Wonder,Avery,4,The different points of view,Yes`,[`Which book has the strongest recommendation?`,`What evidence supports each rating?`]),Ct(`vocabulary-bank`,`Vocabulary Word Bank`,`Grades 2-8`,`Build a searchable word list with definitions and examples.`,`Word,Definition,Example sentence,Subject
evaporate,To change from liquid to gas,Water can evaporate in sunlight,Science
compare,To tell how things are alike,Compare two characters,Reading`,[`Which words belong to more than one subject?`,`Which examples help you remember the word?`]),Ct(`survey-results`,`Simple Survey Results`,`Grades 3-8`,`Organize survey answers and look for patterns.`,`Question,Answer,Student group,Count,Notes
Favorite recess activity,Soccer,Grade 4,12,Most common outdoor choice
Favorite recess activity,Drawing,Grade 4,6,Quiet activity choice`,[`Which answer appears most often?`,`What new question should the class ask next?`]),Ct(`museum-cards`,`Museum Exhibit Cards`,`Grades 4-8`,`Create printable exhibit cards for objects, images, or research topics.`,`Item,Creator or source,Year,Category,Why it matters
Printing press,Johannes Gutenberg,1440,Invention,Changed how books were made
Apollo 11 mission,NASA,1969,Space exploration,First humans walked on the Moon`,[`How should the exhibit be grouped?`,`What field would help visitors understand the item?`])];function Tt(e){let t=e.table.fields.map(e=>({...e,id:`${e.id}_${Date.now().toString(36)}`})),n=e.table.records.map(n=>b(t,Object.fromEntries(e.table.fields.map((e,r)=>[t[r].id,n.values[e.id]??``]))));return{...e.table,id:`table_${e.id}_${Date.now().toString(36)}`,fields:t,records:n}}var Et=`drawsplat.language`,Dt=[{code:`en`,label:`English`,dir:`ltr`,htmlLang:`en`},{code:`es`,label:`Español`,dir:`ltr`,htmlLang:`es`},{code:`vi`,label:`Tiếng Việt`,dir:`ltr`,htmlLang:`vi`},{code:`ar`,label:`العربية`,dir:`rtl`,htmlLang:`ar`},{code:`zh`,label:`中文`,dir:`ltr`,htmlLang:`zh`},{code:`uh`,label:`हिन्दी / اردو`,dir:`ltr`,htmlLang:`hi`}],Ot={es:{New:`Nuevo`,"Save JSON":`Guardar JSON`,"Open JSON":`Abrir JSON`,"Export CSV":`Exportar CSV`,File:`Archivo`,Edit:`Editar`,Data:`Datos`,Layout:`Diseño`,Tools:`Herramientas`,View:`Vista`,Teacher:`Docente`,Help:`Ayuda`,Title:`Título`,Search:`Buscar`,In:`En`,"All fields":`Todos los campos`,Sort:`Ordenar`,"Choose field":`Elegir campo`,"New field":`Campo nuevo`,"Field name":`Nombre del campo`,Type:`Tipo`,"Add field":`Agregar campo`,"Add record":`Agregar registro`,Table:`Tabla`,Form:`Formulario`,Cards:`Tarjetas`,Gallery:`Galería`,Labels:`Etiquetas`,Report:`Informe`,"Upload image":`Subir imagen`,"No image yet":`Sin imagen todavía`},vi:{New:`Mới`,"Save JSON":`Lưu JSON`,"Open JSON":`Mở JSON`,"Export CSV":`Xuất CSV`,File:`Tệp`,Edit:`Sửa`,Data:`Dữ liệu`,Layout:`Bố cục`,Tools:`Công cụ`,View:`Xem`,Teacher:`Giáo viên`,Help:`Trợ giúp`,Title:`Tiêu đề`,Search:`Tìm`,Sort:`Sắp xếp`,Table:`Bảng`,Form:`Biểu mẫu`,Cards:`Thẻ`,Gallery:`Thư viện ảnh`,Labels:`Nhãn`,Report:`Báo cáo`},ar:{New:`جديد`,"Save JSON":`حفظ JSON`,"Open JSON":`فتح JSON`,"Export CSV":`تصدير CSV`,File:`ملف`,Edit:`تحرير`,Data:`بيانات`,Layout:`تخطيط`,Tools:`أدوات`,View:`عرض`,Teacher:`المعلم`,Help:`مساعدة`,Title:`العنوان`,Search:`بحث`,Sort:`فرز`,Table:`جدول`,Form:`نموذج`,Cards:`بطاقات`,Gallery:`معرض`,Labels:`ملصقات`,Report:`تقرير`},zh:{New:`新建`,"Save JSON":`保存 JSON`,"Open JSON":`打开 JSON`,"Export CSV":`导出 CSV`,File:`文件`,Edit:`编辑`,Data:`数据`,Layout:`布局`,Tools:`工具`,View:`视图`,Teacher:`教师`,Help:`帮助`,Title:`标题`,Search:`搜索`,Sort:`排序`,Table:`表格`,Form:`表单`,Cards:`卡片`,Gallery:`图库`,Labels:`标签`,Report:`报告`},uh:{New:`नया`,File:`फ़ाइल`,Edit:`संपादन`,Data:`डेटा`,Layout:`लेआउट`,Tools:`औज़ार`,View:`दृश्य`,Teacher:`शिक्षक`,Help:`सहायता`,Search:`खोज`,Table:`तालिका`,Form:`फ़ॉर्म`,Cards:`कार्ड`,Gallery:`गैलरी`,Labels:`लेबल`,Report:`रिपोर्ट`}},kt=document.querySelector(`#app`);if(!kt)throw Error(`ListSplatTM app root was not found.`);var E=kt,D=Ke()??he(),O=D.schema.tables[0].id,k=D.schema.tables[0].records[0]?.id??``,A=`table`,At=`Saved locally`,j=``,jt=`all`,M=[],N=null,P={match:`all`,rules:[]},Mt=[],Nt=``,Pt=[],F=new Set,I=null,Ft=!1,It=``,Lt=``,Rt=``,zt=``,Bt=!1,Vt=null,Ht=`bar`,Ut=``,Wt=`count`,Gt=``,Kt=null,qt=null,Jt=null,L=[],Yt=``,Xt=`add`,R=new Set,z=`none`,Zt=``,B=`Tip: Start with one table, then add relationships when your project needs them.`,V=[],Qt=[],$t=``,en=null,H=[],tn=O,nn=D.schema.tables[1]?.id??O,U=null,rn=``,an=sn();function W(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function on(e){let t=(e||``).toLowerCase();return t.startsWith(`es`)?`es`:t.startsWith(`vi`)?`vi`:t.startsWith(`ar`)?`ar`:t.startsWith(`zh`)?`zh`:t===`uh`||t.startsWith(`ur`)||t.startsWith(`hi`)?`uh`:`en`}function sn(){let e=new URLSearchParams(window.location.search);try{return on(e.get(`lang`)||localStorage.getItem(Et)||navigator.language)}catch{return on(e.get(`lang`)||navigator.language)}}function cn(e){return Dt.map(({code:t,label:n})=>`<option value="${t}"${t===e?` selected`:``}>${n}</option>`).join(``)}function G(e){return an===`en`?e:Ot[an][e]??e}function ln(){let e=Dt.find(e=>e.code===an)??Dt[0];document.documentElement.lang=e.htmlLang,document.documentElement.dir=e.dir}function K(){return D.schema.tables.find(e=>e.id===O)??D.schema.tables[0]}function q(e){let t=lt(e,{query:j,fieldId:jt});return t=t.filter(e=>Ft?e.archived:!e.archived),t=pt(t,N),R.size>0&&(t=t.filter(e=>R.has(e.id))),dt(t,M.filter(t=>e.fields.some(e=>e.id===t.fieldId)))}function un(e){return e.records.filter(e=>e.archived).length}function dn(){return!!j||!!(N&&N.rules.length)||R.size>0}function fn(){j=``,N=null,R=new Set}function pn(e){e.records.some(e=>e.id===k)||(k=e.records[0]?.id??``)}function J(e){D=e,pn(K()),Ge(D),At=`Saved locally`,$()}function Y(e){V=[{label:e,project:structuredClone(D)},...V].slice(0,25),Qt=[]}function mn(e,t){let n=`${e}:${t}`;$t!==n&&(Y(`edit ${K().fields.find(e=>e.id===t)?.name??`cell`}`),$t=n,hn())}function hn(){let e=E.querySelector(`[data-action="undo-change"]`),t=E.querySelector(`[data-action="redo-change"]`);e&&(e.disabled=V.length===0),t&&(t.disabled=Qt.length===0)}function gn(e){D=e,O=D.schema.tables.some(e=>e.id===O)?O:D.schema.tables[0].id,pn(K()),Ge(D),$()}function _n(){let e=V[0];if(!e){B=`Nothing to undo yet.`,$();return}Qt=[{label:e.label,project:structuredClone(D)},...Qt].slice(0,25),V=V.slice(1),B=`Undid ${e.label}.`,gn(e.project)}function vn(){let e=Qt[0];if(!e){B=`Nothing to redo.`,$();return}V=[{label:e.label,project:structuredClone(D)},...V].slice(0,25),Qt=Qt.slice(1),B=`Redid ${e.label}.`,gn(e.project)}function X(e){O=e.id,J(x(D,e))}function yn(e,t){let n=K();Y(t),X({...n,records:n.records.map(t=>t.id===k?e(t):t)})}function bn(){let e=[];E.querySelectorAll(`.rubric-def-row`).forEach(t=>{let n=t.dataset.critId??y(`crit`),r=t.querySelector(`[data-crit-label]`)?.value.trim()??``,i=Number(t.querySelector(`[data-crit-max]`)?.value)||4;r&&e.push({id:n,label:r,max:i})}),Pt=e}function xn(){document.querySelectorAll(`.menu[open]`).forEach(e=>{e.open=!1})}function Sn(e){J({...D,updatedAt:new Date().toISOString(),metadata:{...D.metadata,title:e||`Untitled Database`}})}function Cn(e=D){qe(`${e.metadata.title||`listsplat-project`}.listsplat.json`,JSON.stringify(e,null,2),`application/json`)}function wn(){qe(`${K().name}.csv`,Ue(K()),`text/csv;charset=utf-8`)}function Tn(){let e=K(),t=e.fields.filter(e=>!e.hidden),n=q(e),r=t.map(e=>He(e.name)).join(`,`),i=n.map(n=>t.map(t=>He(Z(e,n,t.id))).join(`,`)).join(`
`);qe(`${e.name}-found.csv`,`${r}\n${i}`,`text/csv;charset=utf-8`),B=`Exported ${n.length} shown record${n.length===1?``:`s`} to CSV.`,$()}async function En(e){let t=await crypto.subtle.digest(`SHA-256`,new TextEncoder().encode(e));return Array.from(new Uint8Array(t)).map(e=>e.toString(16).padStart(2,`0`)).join(``)}async function Dn(){let e=K(),t=e.fields.filter(e=>!e.hidden&&e.type!==`image`),n=e.fields.find(e=>e.type===`image`&&!e.hidden),r=q(e),i=window.prompt(`Optional password to view (leave blank for none). This is a convenience gate, not encryption.`)??``,a=i?await En(i):``,o=r.map(r=>{let i=n?Kn(Z(e,r,n.id)):``;return`<article class="card">${i?`<img src="${W(i)}" alt="">`:``}<h3>${W(Yn(e,r))}</h3>${t.map(t=>`<p><strong>${W(t.name)}:</strong> ${W(String(Rn(t,Z(e,r,t.id))))}</p>`).join(``)}</article>`}).join(``),s=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${W(D.metadata.title)} — ${W(e.name)}</title>
<style>body{margin:0;font-family:system-ui,sans-serif;color:#1f2937;background:#f4f1ff}header{background:linear-gradient(110deg,#6d28d9,#a855f7);color:#fff;padding:20px 24px}main{max-width:1000px;margin:0 auto;padding:20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}.card{background:#fff;border:1px solid #e5e0ff;border-radius:12px;padding:14px;box-shadow:0 8px 18px rgba(31,41,55,.06)}.card img{width:100%;border-radius:8px;margin-bottom:8px}.card h3{margin:0 0 8px;color:#5b21b6}.card p{margin:2px 0;font-size:.9rem}#gate{position:fixed;inset:0;display:none;place-items:center;background:#0b1d33;color:#fff}body.locked #gate{display:grid}body.locked main,body.locked header{filter:blur(6px)}</style></head>
<body data-hash="${a}"><div id="gate"><div style="text-align:center"><p>This page is password protected.</p><input id="pw" type="password" placeholder="Password"> <button id="go">View</button></div></div>
<header><h1>${W(D.metadata.title)}</h1><p>${W(e.name)} · ${r.length} record${r.length===1?``:`s`} · read-only</p></header>
<main>${o}</main>
<script>const HASH=document.body.dataset.hash;async function sha(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')}if(HASH){document.body.classList.add('locked');document.getElementById('go').onclick=async()=>{if(await sha(document.getElementById('pw').value)===HASH)document.body.classList.remove('locked')};document.getElementById('pw').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('go').click()})}<\/script>
</body></html>`;qe(`${e.name}-shared.html`,s,`text/html;charset=utf-8`),B=`Exported a read-only page with ${r.length} record${r.length===1?``:`s`}${a?` (password protected)`:``}.`,$()}function On(){let e=K(),t=e.fields.filter(e=>!e.hidden),n=q(e),r=e=>String(e??``).replace(/\|/g,`\\|`).replace(/\n/g,` `),i=`| ${t.map(e=>r(e.name)).join(` | `)} |`,a=`| ${t.map(()=>`---`).join(` | `)} |`,o=n.map(n=>`| ${t.map(t=>r(Z(e,n,t.id))).join(` | `)} |`).join(`
`);qe(`${e.name}.md`,`# ${e.name}\n\n${i}\n${a}\n${o}\n`,`text/markdown;charset=utf-8`),B=`Exported a Markdown table.`,$()}function kn(){let e=K(),t=q(e),n=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${W(D.metadata.title)}</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{color:#5b21b6}</style></head>
<body><h1>${W(D.metadata.title)}</h1><p>${W(e.name)} report from ListSplatTM.</p>
<table><thead><tr>${e.fields.map(e=>`<th>${W(e.name)}</th>`).join(``)}</tr></thead>
<tbody>${t.map(t=>`<tr>${e.fields.map(n=>`<td>${W(Z(e,t,n.id))}</td>`).join(``)}</tr>`).join(``)}</tbody></table></body></html>`;qe(`${D.metadata.title||`listsplat-report`}.html`,n,`text/html;charset=utf-8`)}function An(){let e=D.schema.tables.map(e=>{let t=Wn(e),n=t.reduce((e,t)=>e+t.missing,0),r=t.reduce((e,t)=>e+t.duplicates,0);return`
        <section>
          <h2>${W(e.name)}</h2>
          <p>${e.records.length} records, ${e.fields.length} fields, ${n} missing values, ${r} duplicate values.</p>
          <table>
            <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th><th>Missing</th><th>Duplicates</th></tr></thead>
            <tbody>${e.fields.map(e=>{let n=t.find(t=>t.field.id===e.id);return`<tr><td>${W(e.name)}</td><td>${W(e.type)}</td><td>${e.required?`Yes`:`No`}</td><td>${W(e.description)}</td><td>${n?.missing??0}</td><td>${n?.duplicates??0}</td></tr>`}).join(``)}</tbody>
          </table>
        </section>
      `}).join(``),t=D.schema.relationships.length?`<ul>${D.schema.relationships.map(e=>`<li>${W(e.name)}: ${W(Qe(D,e))}</li>`).join(``)}</ul>`:`<p>No relationships have been created yet.</p>`,n=D.teacher.notes.length?`<ul>${D.teacher.notes.map(e=>`<li>${W(e)}</li>`).join(``)}</ul>`:`<p>No teacher notes yet.</p>`,r=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${W(D.metadata.title)} Project Packet</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937;line-height:1.5}h1,h2{color:#5b21b6}section{margin:0 0 28px}table{border-collapse:collapse;width:100%;margin-top:10px}th,td{border:1px solid #d8ccff;padding:8px;text-align:left;vertical-align:top}th{background:#f3edff;color:#4c1d95}.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.meta div{border:1px solid #d8ccff;border-radius:8px;padding:12px;background:#faf8ff}</style></head>
<body>
  <h1>${W(D.metadata.title||`ListSplat Project`)} Project Packet</h1>
  <div class="meta">
    <div><strong>Author</strong><br>${W(D.metadata.author||`Not set`)}</div>
    <div><strong>Class</strong><br>${W(D.metadata.className||`Not set`)}</div>
    <div><strong>Tables</strong><br>${D.schema.tables.length}</div>
    <div><strong>Relationships</strong><br>${D.schema.relationships.length}</div>
  </div>
  <section><h2>Teacher Notes</h2>${n}</section>
  <section><h2>Relationships</h2>${t}</section>
  ${e}
</body></html>`;qe(`${D.metadata.title||`listsplat`}-project-packet.html`,r,`text/html;charset=utf-8`)}async function jn(e){try{if(await le(e,`listsplat`)){B=`Opened the file in its matching SplatWorks app.`,$();return}await ae(e,`listsplat`),/\.json$/i.test(e.name)?Mn(e):Nn(e),g()&&(B=de,$())}catch(e){window.alert(e instanceof Error?e.message:`Could not open that file.`)}}function Mn(e){e.text().then(e=>{let t=JSON.parse(e);Re(t),O=t.schema.tables[0].id,k=t.schema.tables[0].records[0]?.id??``,J(t)}).catch(e=>{window.alert(e instanceof Error?e.message:`Could not open this ListSplatTM file.`)})}function Nn(e){e.text().then(t=>{let n=Ve(e.name.replace(/\.csv$/i,``),t);U=n,rn=e.name;let r=K();L=n.fields.map(e=>{let t=n.records.slice(0,12).map(t=>String(t.values[e.id]??``)),i=r.fields.find(t=>t.name.trim().toLowerCase()===e.name.trim().toLowerCase());return{header:e.name,action:i?`existing`:`new`,type:wi(t),fieldId:i?.id??``}}),Yt=``,Xt=`add`,z=`csvImport`,B=`Previewing ${n.records.length} CSV record${n.records.length===1?``:`s`} from ${e.name}.`,$()})}function Pn(e){if(!U){z=`none`;return}Ti();let t=U;if(Y(`CSV import`),e===`new`){let e=L.filter(e=>e.action!==`skip`).map((e,n)=>{let r=t.fields[L.indexOf(e)];return{field:pe(e.header||`Field ${n+1}`,e.type),sourceFieldId:r.id}}),n=t.records.map(t=>b(e.map(e=>e.field),Object.fromEntries(e.map(e=>[e.field.id,be(t.values[e.sourceFieldId],e.field.type).value])))),r={id:y(`table`),name:t.name,fields:e.map(e=>e.field),records:n.length?n:[b(e.map(e=>e.field))]};O=r.id,k=r.records[0]?.id??``,U=null,fn(),M=[],F=new Set,z=`none`,B=`Imported ${r.records.length} records from ${rn}.`,J({...D,updatedAt:new Date().toISOString(),schema:{...D.schema,tables:[...D.schema.tables,r]},layouts:[...D.layouts,{id:y(`layout`),name:`${r.name} Table`,tableId:r.id,mode:`table`,locked:!1},{id:y(`layout`),name:`${r.name} Form`,tableId:r.id,mode:`form`,locked:!1}]});return}let n=K();L.forEach((e,t)=>{if(e.action===`new`){let r=pe(e.header||`Field ${t+1}`,e.type);n={...n,fields:[...n.fields,r]},e.fieldId=r.id}});let r=new Map(n.fields.map(e=>[e.id,e])),i=t.records.map(e=>b(n.fields,Object.fromEntries(L.filter(e=>e.action!==`skip`&&e.fieldId&&r.has(e.fieldId)).map((n,i)=>{let a=t.fields[L.indexOf(n)],o=r.get(n.fieldId);return[n.fieldId,be(e.values[a.id],o.type,o.options).value]}))));U=null,z=`none`;let a=Yt&&r.has(Yt)?Yt:``;if(a&&Xt!==`add`){let e=e=>String(e.values[a]??``).trim().toLowerCase(),t=new Map(n.records.map(t=>[e(t),t.id])),r=[...n.records],o=0,s=0,c=0;i.forEach(n=>{let i=e(n),a=i?t.get(i):void 0;a&&Xt===`skip`?c+=1:a&&Xt===`update`?(r=r.map(e=>e.id===a?{...e,updatedAt:new Date().toISOString(),values:{...e.values,...n.values}}:e),s+=1):(r.push(n),i&&t.set(i,n.id),o+=1)}),B=`Import: ${o} added, ${s} updated, ${c} skipped.`,X({...n,records:r});return}B=`Appended ${i.length} CSV record${i.length===1?``:`s`} to ${n.name}.`,X({...n,records:[...n.records,...i]})}function Fn(e){let t=wt.find(t=>t.id===e);if(!t)return;let n=Tt(t);Y(`template load`),O=n.id,k=n.records[0]?.id??``,B=`Loaded ${t.title}.`,J({...D,metadata:{...D.metadata,title:t.title},schema:{...D.schema,tables:[...D.schema.tables,n]},teacher:{...D.teacher,notes:t.reflectionQuestions}})}function In(e,t){return`
    <details class="menu">
      <summary>${W(G(e))}</summary>
      <div class="menu-panel">
        ${t.map(([e,t])=>`<button type="button" data-action="${e}">${W(G(t))}</button>`).join(``)}
      </div>
    </details>
  `}function Ln(e=`text`){return[[`text`,`Short text`],[`longText`,`Long text`],[`number`,`Number`],[`currency`,`Currency`],[`percent`,`Percent`],[`date`,`Date`],[`time`,`Time`],[`dateTime`,`Date and time`],[`checkbox`,`Checkbox`],[`rating`,`Rating`],[`choice`,`Single choice`],[`multiSelect`,`Multiple choice`],[`email`,`Email`],[`phone`,`Phone`],[`link`,`Web address`],[`image`,`Image`],[`file`,`File attachment`],[`audio`,`Audio recording`],[`calculation`,`Calculation`],[`autoNumber`,`Auto number`],[`createdAt`,`Created time`],[`updatedAt`,`Updated time`]].map(([t,n])=>`<option value="${t}" ${e===t?`selected`:``}>${n}</option>`).join(``)}function Z(e,t,n){let r=e.fields.find(e=>e.id===n);return r?.type===`calculation`&&r.formula?ct(r.formula,e,t,D):t.values[n]??``}function Rn(e,t){if(t===``||t==null)return``;if(!e)return String(t);let n=typeof t==`number`?t:Number(t);return e.type===`currency`&&Number.isFinite(n)?n.toLocaleString(void 0,{style:`currency`,currency:`USD`}):e.type===`percent`&&Number.isFinite(n)?`${n.toLocaleString()}%`:e.type===`number`&&Number.isFinite(n)?n.toLocaleString():e.type===`checkbox`?t===!0||t===`true`?`Yes`:`No`:e.type===`file`?Br(String(t??``))?.name??``:e.type===`audio`?t?`Audio recording`:``:String(t)}function zn(){return D.layouts.find(e=>e.tableId===O&&e.mode===A)}function Bn(e){return!!e}function Q(e){let t=new Set(zn()?.hiddenFieldIds??[]);return Vn(e).filter(e=>!t.has(e.id))}function Vn(e){let t=zn()?.fieldOrder??e.fields.map(e=>e.id),n=new Map(e.fields.map(e=>[e.id,e]));return[...t.map(e=>n.get(e)).filter(Bn),...e.fields.filter(e=>!t.includes(e.id))].filter(e=>e&&!e.hidden)}function Hn(e){return e.fields.filter(e=>e.type===`calculation`)}function Un(e){return Hn(e).reduce((t,n)=>n.formula?t+e.records.filter(t=>String(ct(n.formula??``,e,t,D)).startsWith(`Formula error:`)).length:t,0)}function Wn(e){return e.fields.filter(e=>!e.hidden&&![`image`,`autoNumber`,`createdAt`,`updatedAt`,`calculation`].includes(e.type)).map(t=>({field:t,missing:ht(e,t.id).length,duplicates:mt(e,t.id).length}))}function Gn(e){return Q(e).filter(e=>e.type===`image`)}function Kn(e){let t=String(e??``);return/^(data:|https?:|blob:)/i.test(t)?t:``}function qn(e,t){let n=Gn(e)[0];return n?Kn(Z(e,t,n.id)):``}function Jn(e){let t=zn();t&&J({...D,updatedAt:new Date().toISOString(),layouts:D.layouts.map(n=>n.id===t.id?{...n,...e}:n)})}function Yn(e,t){let n=e.fields.find(e=>!e.hidden)??e.fields[0],r=n?Z(e,t,n.id):``;return String(r||`Untitled record`)}function Xn(e,t,n,r){let i=e.fields.find(e=>e.id===n),a=Z(e,t,n),o=`aria-label="${W(i?.name??`Field`)}, record ${r+1}" data-record-id="${t.id}" data-field-id="${n}"`,s=i&&![`checkbox`,`image`,`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(i.type)?bt(i,a,e,t.id):``,c=s?`cell-input cell-invalid`:`cell-input`,l=s?` title="${W(s)}"`:``,u=`${l}${i?.readonly?` readonly disabled`:``}${i?.maxLength?` maxlength="${i.maxLength}"`:``}`;if(i?.type===`checkbox`)return`<input class="cell-checkbox" type="checkbox" ${o} ${i.readonly?`disabled`:``} ${a===!0||a===`true`?`checked`:``}>`;if(i?.type===`multiSelect`){let e=i.options?.length?i.options:[`Yes`,`No`],r=new Set(String(a??``).split(`,`).map(e=>e.trim()).filter(Boolean));return`<div class="multi-cell${s?` cell-invalid`:``}" ${o}${s?` title="${W(s)}"`:``}>${e.map(e=>`<label class="multi-chip${r.has(e)?` on`:``}"><input type="checkbox" class="multi-option" data-record-id="${t.id}" data-field-id="${n}" data-multi-option="${W(e)}" ${r.has(e)?`checked`:``} ${i.readonly?`disabled`:``}>${W(e)}</label>`).join(``)}</div>`}if(i?.type===`time`)return`<input class="${c}" type="time" ${o}${u} value="${W(a)}">`;if(i?.type===`dateTime`)return`<input class="${c}" type="datetime-local" ${o}${u} value="${W(a)}">`;if(i?.type===`email`){let e=String(a??``);return`<div class="link-cell"><input class="${c}" type="email" ${o}${u} value="${W(e)}" placeholder="name@example.com">${e&&!s?`<a class="link-open" href="mailto:${W(e)}" title="Send email" aria-label="Send email">✉</a>`:``}</div>`}if(i?.type===`phone`)return`<input class="${c}" type="tel" ${o}${u} value="${W(a)}" placeholder="(555) 555-5555">`;if(i?.type===`link`){let e=String(a??``),t=/^https?:\/\//i.test(e)?e:e?`https://${e}`:``;return`<div class="link-cell"><input class="${c}" type="url" ${o}${u} value="${W(e)}" placeholder="https://…">${t?`<a class="link-open" href="${W(t)}" target="_blank" rel="noopener" title="Open link" aria-label="Open link">↗</a>`:``}</div>`}if(i?.type===`image`){let e=String(a??``),r=/^(data:|https?:|blob:)/i.test(e)?e:``;return`
      <div class="image-cell" tabindex="0" role="button" title="Click here and paste an image, or use Upload image." ${o}>
        ${r?`<img src="${W(r)}" alt="${W(i.description||i.name)}">`:`<span>${W(G(`No image yet`))}</span>`}
        <small>Paste, upload, or take a photo.</small>
        <div class="image-actions">
          <label class="image-upload-label">
            ${W(G(`Upload image`))}
            <input class="image-input" type="file" accept="image/*" ${o}>
          </label>
          <button type="button" class="button ghost" data-action="camera-capture" data-record-id="${t.id}" data-field-id="${n}">Take photo</button>
        </div>
      </div>
    `}if(i?.type===`file`){let e=Br(String(a??``));return`
      <div class="file-cell" ${o}>
        ${e?`<a class="file-link" href="${W(e.url)}" download="${W(e.name)}">📎 ${W(e.name)}</a>`:`<span>No file yet</span>`}
        <label class="image-upload-label">${e?`Replace`:`Add file`}<input class="file-input" type="file" data-record-id="${t.id}" data-field-id="${n}"></label>
      </div>
    `}if(i?.type===`audio`){let e=String(a??``),r=/^(data:|https?:|blob:)/i.test(e)?e:``;return`
      <div class="audio-cell" data-record-id="${t.id}" data-field-id="${n}">
        ${r?`<audio class="no-advance" src="${W(r)}" controls preload="metadata"></audio>`:`<span>No recording</span>`}
        <button type="button" class="button ghost" data-action="record-audio" data-record-id="${t.id}" data-field-id="${n}">${r?`Re-record`:`● Record`}</button>
      </div>
    `}if(i?.type===`rating`)return`<input class="${c}" type="number" min="0" max="5" step="1" ${o}${u} value="${W(a)}">`;if(i?.type===`choice`){let e=i.options?.length?i.options:[`Yes`,`No`];return`<select class="${c}" ${o}${l}${i.readonly?` disabled`:``}><option value=""${a===``?` selected`:``}>—</option>${e.map(e=>`<option value="${W(e)}" ${String(a)===e?`selected`:``}>${W(e)}</option>`).join(``)}</select>`}if(i?.type===`autoNumber`||i?.type===`createdAt`||i?.type===`updatedAt`)return`<output class="calc-output">${W(a)}</output>`;if(i?.type===`longText`)return`<textarea class="${c}" ${o}${u}>${W(a)}</textarea>`;if(i?.type===`date`)return`<input class="${c}" type="date" ${o}${u} value="${W(a)}">`;if(i?.type===`number`||i?.type===`currency`||i?.type===`percent`){let e=i.type===`currency`?`<span class="cell-affix">$</span>`:``,t=i.type===`percent`?`<span class="cell-affix">%</span>`:``;return`<span class="num-cell">${e}<input class="${c}" type="number" step="any" ${o}${u} value="${W(a)}">${t}</span>`}return i?.type===`calculation`?`<output class="calc-output">${W(a)}</output>`:`<input class="${c}" ${o}${u} value="${W(a)}">`}function Zn(e){return`
    <div class="table-tabs">
      ${D.schema.tables.map(t=>`<button type="button" class="table-tab ${t.id===e.id?`active`:``}" data-table-id="${t.id}">${W(t.name)}</button>`).join(``)}
    </div>
  `}function Qn(e,t){if(t.length===0){let e=dn();return`
      <div class="data-grid-wrap">
        <div class="empty-state">
          <h3>${W(G(e?`No records match your find`:`No records yet`))}</h3>
          <p>${W(G(e?`Try a different search, or show all records.`:`Add your first record to start building this database.`))}</p>
          <button type="button" class="button primary" data-action="${e?`clear-find`:`add-record`}">${e?W(G(`Show all records`)):`+ ${W(G(`Add first record`))}`}</button>
        </div>
      </div>
    `}let n=Q(e),r=t.length>0&&t.every(e=>F.has(e.id)),i=e=>{let t=M.find(t=>t.fieldId===e);return t?t.direction===`asc`?`▲`:`▼`:`⇅`},a=sr(e,t),o=n.length+3,s=(t,r)=>`
                <tr class="${t.id===k?`active-row`:``}${F.has(t.id)?` selected-row`:``}" data-record-row="${t.id}">
                  <td class="select-col"><input type="checkbox" data-select-row="${t.id}" aria-label="Select record ${r+1}" ${F.has(t.id)?`checked`:``}></td>
                  <td class="row-num-col"><button type="button" class="row-button" data-select-record="${t.id}">${r+1}</button></td>
                  ${n.map(n=>`<td style="${$n(n.id)}">${Xn(e,t,n.id,r)}</td>`).join(``)}
                  <td class="record-actions">
                    <button type="button" title="Open record" data-action="expand-record" data-record-action-id="${t.id}">Open</button>
                    <button type="button" data-action="duplicate-record" data-record-action-id="${t.id}">Copy</button>
                    <button type="button" data-action="delete-record" data-record-action-id="${t.id}">Delete</button>
                  </td>
                </tr>
              `,c=0,l=a.map(t=>(It?`<tr class="group-row"><td colspan="${o}"><strong>${W(t.label)}</strong> <span>${t.records.length}${cr(e,t.records)?` · `+cr(e,t.records):``}</span></td></tr>`:``)+t.records.map(e=>s(e,c++)).join(``)).join(``);return`
    <div class="data-grid-wrap${Bt?` wrap-cells`:``}">
      <table class="data-grid">
        <thead>
          <tr>
            <th class="select-col"><input type="checkbox" data-select-all aria-label="Select all records" ${r?`checked`:``}></th>
            <th class="row-num-col">#</th>
            ${n.map(e=>`
                  <th class="col-head" data-col-field="${e.id}" draggable="true" style="${$n(e.id)}">
                    <button type="button" class="field-button" data-field-settings="${e.id}">
                      ${W(e.name)}${e.required?`<span class="req" title="Required field" aria-label="required">*</span>`:``}<br><small>${W(e.type)}</small>
                    </button>
                    <button type="button" class="col-sort" data-action="sort-toggle" data-sort-toggle="${e.id}" title="Sort by ${W(e.name)}">${i(e.id)}</button>
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
  `}function $n(e){let t=zn()?.columnWidths?.[e];return t?`width:${t}px;min-width:${t}px;`:``}function er(){return D.metadata.author.trim()||`You`}function tr(e){let t=D.teacher.studentView,n=(e.comments??[]).filter(e=>!e.teacherOnly||!t),r=D.rubricCriteria??[],i=e.rubricScores??{},a=r.reduce((e,t)=>e+(Number(i[t.id])||0),0),o=r.reduce((e,t)=>e+t.max,0),s=e.history??[];return`
    <section class="record-extras">
      ${r.length?`<div class="record-block">
              <h3>Rubric ${t?``:`<button type="button" class="button ghost" data-action="edit-rubric">Edit</button>`}</h3>
              <div class="rubric-grid">
                ${r.map(e=>`<label class="rubric-row"><span>${W(e.label)}</span><input type="number" min="0" max="${e.max}" data-rubric-criterion="${e.id}" value="${i[e.id]==null?``:W(String(i[e.id]))}"> / ${e.max}</label>`).join(``)}
              </div>
              <p class="rubric-total"><strong>Total: ${a} / ${o}</strong></p>
            </div>`:t?``:`<div class="record-block"><h3>Rubric</h3><button type="button" class="button" data-action="edit-rubric">Set up a rubric</button></div>`}
      <div class="record-block">
        <h3>Comments</h3>
        <div class="comment-list">
          ${n.length?n.map(e=>`
                      <div class="comment${e.teacherOnly?` teacher`:``}">
                        <div class="comment-head"><strong>${W(e.author)}</strong>${e.teacherOnly?`<span class="badge">teacher only</span>`:``}<time>${W(new Date(e.at).toLocaleString())}</time></div>
                        <p>${W(e.text)}</p>
                        ${t&&e.author!==er()?``:`<button type="button" class="link-btn" data-action="delete-comment" data-comment-id="${e.id}">Delete</button>`}
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
              ${s.length?`<ul class="version-list">${s.slice().reverse().map((e,t)=>`<li><time>${W(new Date(e.at).toLocaleString())}</time> <button type="button" class="link-btn" data-action="restore-version" data-version-index="${s.length-1-t}">Restore</button></li>`).join(``)}</ul>`:`<p class="muted">Save a version to keep a snapshot you can restore.</p>`}
            </div>`}
    </section>
  `}function nr(e){let t=e.records.find(e=>e.id===k)??e.records[0];if(!t)return`<div class="empty-panel">Add a record to use form view.</div>`;let n=D.schema.relationships.filter(t=>t.fromTableId===e.id).map(n=>{let r=D.schema.tables.find(e=>e.id===n.toTableId),i=r?Ze(n,e,t,r):[];return`
        <section class="related-records">
          <h3>${W(n.name)}</h3>
          <p>${i.length} related record${i.length===1?``:`s`} from ${W(r?.name??`another table`)}</p>
          ${i.length?`<div class="related-grid">${i.slice(0,8).map(e=>`
                      <article class="related-card" data-action="open-related" data-rel-record="${e.id}" data-rel-table="${r.id}">
                        <strong>${W(Yn(r,e))}</strong>
                        ${r.fields.filter(e=>!e.hidden).slice(0,3).map(t=>`<span>${W(t.name)}: ${W(Z(r,e,t.id))}</span>`).join(``)}
                      </article>
                    `).join(``)}</div>`:`<p>No matches yet. Make sure the match fields use the same value.</p>`}
          <button type="button" class="button" data-action="add-related" data-rel-id="${n.id}">+ Add ${W(r?.name??`related`)} record</button>
        </section>
      `}).join(``);return`
    <div class="form-view">
      <div class="form-nav">
        ${e.records.map((e,n)=>`<button type="button" class="${e.id===t.id?`active`:``}" data-select-record="${e.id}">Record ${n+1}</button>`).join(``)}
      </div>
      <div class="record-form">
        ${Q(e).map((n,r)=>`
              <label>
                <span>${W(n.name)}</span>
                ${Xn(e,t,n.id,r)}
                ${n.description?`<small>${W(n.description)}</small>`:``}
              </label>
            `).join(``)}
        ${n}
        ${tr(t)}
      </div>
    </div>
  `}function rr(e,t){let n=(t,n)=>{let r=Z(e,n,t.id);if(t.type===`image`){let e=Kn(r);return`
        <figure class="card-image-field">
          ${e?`<img src="${W(e)}" alt="">`:`<span>No image yet</span>`}
          <figcaption>${W(t.name)}</figcaption>
        </figure>
      `}if(t.type===`link`&&String(r??``)){let e=String(r),n=/^https?:\/\//i.test(e)?e:`https://${e}`;return`<p><strong>${W(t.name)}</strong><a href="${W(n)}" target="_blank" rel="noopener">${W(e)}</a></p>`}return`<p><strong>${W(t.name)}</strong><span>${W(Rn(t,r))}</span></p>`};return`
    <div class="cards-view ${A===`gallery`?`gallery-view`:``}">
      ${t.map(t=>{let r=qn(e,t);return`
            <article class="record-card" data-select-record="${t.id}">
              ${A===`gallery`?`<div class="gallery-image">${r?`<img src="${W(r)}" alt="">`:`<span>Add an image field, then upload a picture.</span>`}</div>`:``}
              ${Q(e).filter(e=>A!==`gallery`||e.type!==`image`).slice(0,A===`gallery`?4:8).map(e=>n(e,t)).join(``)}
            </article>
          `}).join(``)}
    </div>
  `}function ir(e,t){return`
    <div class="labels-view">
      ${t.map(t=>`
            <article class="print-label">
              ${Q(e).slice(0,4).map(n=>`<p><strong>${W(n.name)}:</strong> ${W(Rn(n,Z(e,t,n.id)))}</p>`).join(``)}
            </article>
          `).join(``)}
    </div>
  `}function ar(e,t){let n=et(e);return`
    <div class="report-view">
      <header>
        <h2>${W(D.metadata.title)}</h2>
        <p>${W(e.name)} report. ${t.length} record${t.length===1?``:`s`} shown.</p>
      </header>
      ${Qn(e,t)}
      ${n.length?`<section class="summary-strip">${n.map(e=>`<div><strong>${W(e.fieldName)}</strong><span>Sum ${e.sum.toLocaleString()} | Avg ${e.average.toFixed(2)}</span></div>`).join(``)}</section>`:`<p class="empty-panel">Add a number, currency, or percent field to see summaries.</p>`}
    </div>
  `}function or(e,t,n){let r=new Set;return t.forEach(t=>{let i=String(Z(e,t,n)??``).trim();i&&r.add(i)}),[...r]}function sr(e,t){if(!It||!e.fields.some(e=>e.id===It))return[{key:``,label:``,records:t}];let n=new Map;return t.forEach(t=>{let r=String(Z(e,t,It)??``).trim();n.has(r)||n.set(r,[]),n.get(r).push(t)}),[...n.entries()].sort((e,t)=>e[0].localeCompare(t[0],void 0,{numeric:!0})).map(([e,t])=>({key:e,label:e||`(empty)`,records:t}))}function cr(e,t){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)&&!e.hidden).slice(0,3).map(n=>{let r=t.map(t=>Number(Z(e,t,n.id))).filter(e=>Number.isFinite(e));if(!r.length)return``;let i=r.reduce((e,t)=>e+t,0);return`${W(n.name)}: sum ${i.toLocaleString()}, avg ${(i/r.length).toFixed(1)}`}).filter(Boolean).join(` · `)}function lr(e,t){return e.map(e=>`<option value="${e.id}" ${t===e.id?`selected`:``}>${W(e.name)}</option>`).join(``)}function ur(e){let t=[];if(A===`list`||A===`table`){let n=e.fields.filter(e=>!e.hidden&&![`image`,`longText`].includes(e.type));t.push(`<label>Group by <select data-group-field><option value="">No grouping</option>${lr(n,It)}</select></label>`),t.push(`<label class="inline-check"><input type="checkbox" data-wrap-toggle ${Bt?`checked`:``}> Wrap long text</label>`)}if(A===`kanban`){let n=e.fields.filter(e=>[`choice`,`text`].includes(e.type)&&!e.hidden);t.push(`<label>Columns by <select data-board-field><option value="">Choose a status or choice field</option>${lr(n,Lt)}</select></label>`)}if(A===`calendar`){let n=e.fields.filter(e=>[`date`,`dateTime`,`createdAt`,`updatedAt`].includes(e.type)&&!e.hidden);t.push(`<label>Dates from <select data-calendar-field><option value="">Choose a date field</option>${lr(n,Rt)}</select></label>`)}return t.length?`<div class="view-controls">${t.join(``)}</div>`:``}function dr(e,t){let n=Q(e),r=n[0],i=n.find(e=>e.id!==r?.id&&![`image`].includes(e.type)),a=sr(e,t).map(t=>`
        ${It?`<div class="group-head"><strong>${W(t.label)}</strong><span>${t.records.length}${cr(e,t.records)?` · `+cr(e,t.records):``}</span></div>`:``}
        ${t.records.map(t=>{let n=qn(e,t);return`
              <div class="list-row${t.id===k?` active`:``}">
                ${n?`<img class="list-thumb" src="${W(n)}" alt="">`:``}
                <div class="list-main">
                  <strong>${W(Z(e,t,r?.id??``)||`Untitled`)}</strong>
                  ${i?`<span>${W(Rn(i,Z(e,t,i.id)))}</span>`:``}
                </div>
                <button type="button" class="button ghost" data-action="expand-record" data-record-action-id="${t.id}">Open</button>
              </div>
            `}).join(``)}
      `).join(``);return`<div class="list-view${Bt?` wrap-cells`:``}">${a||`<p class="empty-panel">No records to list.</p>`}</div>`}function fr(e,t){let n=e.fields.find(e=>e.id===Lt);return n?`<div class="kanban">${[``,...(n.options&&n.options.length?n.options:or(e,t,n.id)).filter(Boolean)].map(r=>{let i=t.filter(t=>String(Z(e,t,n.id)??``).trim()===r);return`
        <div class="kanban-col" data-kanban-col="${W(r)}">
          <div class="kanban-col-head"><strong>${W(r||`Unassigned`)}</strong><span>${i.length}</span></div>
          <div class="kanban-cards">
            ${i.map(t=>`
                  <div class="kanban-card" draggable="true" data-kanban-card="${t.id}" data-action="expand-record" data-record-action-id="${t.id}">
                    <strong>${W(Yn(e,t))}</strong>
                  </div>
                `).join(``)}
          </div>
        </div>
      `}).join(``)}</div>`:`<p class="empty-panel">Choose a status or choice field above to build a board with draggable cards.</p>`}function pr(e,t){let n=e.fields.find(e=>e.id===Rt)??e.fields.find(e=>[`date`,`dateTime`,`createdAt`,`updatedAt`].includes(e.type)&&!e.hidden);if(!n)return`<p class="empty-panel">Add a date field, then choose it above to see records on a calendar.</p>`;let r=zt?new Date(`${zt}-01T00:00:00`):new Date,i=r.getFullYear(),a=r.getMonth(),o=`${i}-${String(a+1).padStart(2,`0`)}`,s=new Date(i,a,1),c=s.getDay(),l=new Date(i,a+1,0).getDate(),u=new Map;t.forEach(t=>{let r=String(Z(e,t,n.id)??``).slice(0,10);/^\d{4}-\d{2}-\d{2}$/.test(r)&&r.startsWith(o)&&(u.has(r)||u.set(r,[]),u.get(r).push(t))});let ee=[];for(let e=0;e<c;e+=1)ee.push(`<div class="cal-cell empty"></div>`);for(let t=1;t<=l;t+=1){let n=`${o}-${String(t).padStart(2,`0`)}`,r=u.get(n)??[];ee.push(`
      <div class="cal-cell">
        <div class="cal-day">${t}</div>
        ${r.slice(0,4).map(t=>`<button type="button" class="cal-event" data-action="expand-record" data-record-action-id="${t.id}">${W(Yn(e,t))}</button>`).join(``)}
        ${r.length>4?`<span class="cal-more">+${r.length-4} more</span>`:``}
      </div>
    `)}return`
    <div class="calendar-view">
      <div class="cal-nav">
        <button type="button" class="button" data-action="cal-prev">‹</button>
        <strong>${W(s.toLocaleDateString(void 0,{month:`long`,year:`numeric`}))}</strong>
        <button type="button" class="button" data-action="cal-next">›</button>
        <button type="button" class="button ghost" data-action="cal-today">Today</button>
      </div>
      <div class="cal-grid">
        ${[`Sun`,`Mon`,`Tue`,`Wed`,`Thu`,`Fri`,`Sat`].map(e=>`<div class="cal-weekday">${e}</div>`).join(``)}
        ${ee.join(``)}
      </div>
    </div>
  `}function mr(e){let t=zt?new Date(`${zt}-01T00:00:00`):new Date;t.setMonth(t.getMonth()+e),zt=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}`}function hr(e){let t=q(e),n={table:`Table: spreadsheet-like rows and columns for fast data entry.`,form:`Form: focus on one record at a time.`,cards:`Cards: compact text-first record cards for browsing.`,gallery:`Gallery: image-first cards for collections and exhibits.`,list:`List: compact rows grouped by a field.`,kanban:`Board: columns by status or category, drag cards to change them.`,calendar:`Calendar: records placed on a month grid by a date field.`,labels:`Labels: printable small cards or shelf labels.`,report:`Report: printable table with title and summaries.`},r=A===`form`?nr(e):A===`cards`||A===`gallery`?rr(e,t):A===`list`?dr(e,t):A===`kanban`?fr(e,t):A===`calendar`?pr(e,t):A===`labels`?ir(e,t):A===`report`?ar(e,t):Qn(e,t);return`
    <section class="database-panel" aria-label="Database table">
      ${Zn(e)}
      <div class="view-tabs" role="group" aria-label="Layout modes">
        ${[`table`,`form`,`cards`,`gallery`,`list`,`kanban`,`calendar`,`labels`,`report`].map(e=>`<button type="button" class="${A===e?`active`:``}" data-view-mode="${e}" title="${W(n[e])}" aria-label="${W(n[e])}">${W(G(e===`kanban`?`Board`:e[0].toUpperCase()+e.slice(1)))}</button>`).join(``)}
      </div>
      ${ur(e)}
      ${gr()}
      ${_r(e)}
      ${r}
    </section>
  `}function gr(){let e=[];if(Ft&&e.push(`<button type="button" class="chip chip-button" data-action="toggle-archived" title="Back to active records">Archived view — click to exit</button>`),j&&e.push(`<span class="chip">Search: “${W(j)}”</span>`),N&&N.rules.length){let t=N.match===`all`?` AND `:` OR `,n=N.rules.map(e=>`${ui(e.fieldId)} ${di(e.operator)}${e.operator===`isEmpty`||e.operator===`isNotEmpty`?``:` `+e.value}${e.operator===`between`?`–`+(e.value2??``):``}`).join(t);e.push(`<button type="button" class="chip chip-button" data-action="find" title="Edit find">Find: ${W(n)}</button>`)}return R.size&&e.push(`<span class="chip">${R.size} highlighted</span>`),M.filter(e=>K().fields.some(t=>t.id===e.fieldId)).forEach(t=>{e.push(`<button type="button" class="chip chip-button" data-action="sort-dialog" title="Edit sort">Sort: ${W(ui(t.fieldId))} ${t.direction===`asc`?`↑`:`↓`}</button>`)}),e.length?`<div class="filter-chips">${e.join(``)}${dn()?`<button type="button" class="chip chip-clear" data-action="clear-find">Clear find</button>`:``}${M.length?`<button type="button" class="chip chip-clear" data-action="sort-dialog">Edit sort</button>`:``}</div>`:``}function _r(e){let t=bi(e).length;return t===0||A===`form`?``:`
    <div class="bulk-bar" role="group" aria-label="Bulk actions">
      <strong>${t} selected</strong>
      <button type="button" class="button" data-action="bulk-fill">Fill a field…</button>
      <button type="button" class="button" data-action="bulk-duplicate">Duplicate</button>
      ${Ft?`<button type="button" class="button" data-action="bulk-restore">Restore</button>`:`<button type="button" class="button" data-action="bulk-archive">Archive</button>`}
      <button type="button" class="button danger" data-action="bulk-delete">Delete</button>
      <button type="button" class="button ghost" data-action="bulk-clear">Clear selection</button>
    </div>
  `}function vr(e){let t=et(e),n=e.records.find(e=>e.id===k)??e.records[0],r=n?D.schema.relationships.filter(t=>t.fromTableId===e.id).map(t=>{let r=D.schema.tables.find(e=>e.id===t.toTableId),i=r?Ze(t,e,n,r).length:0;return`
            <div class="template-card">
              <strong>${W(t.name)}</strong>
              <span>${i} related record${i===1?``:`s`}</span>
              <p>${W(Qe(D,t))}</p>
            </div>
          `}).join(``):``;return`
    <aside class="teacher-panel" aria-label="Teacher tools and database stats">
      <h2>Database Check</h2>
      <div class="stat-grid">
        <div class="stat-card"><strong>${q(e).length}</strong> shown</div>
        <div class="stat-card"><strong>${e.records.length}</strong> records</div>
        <div class="stat-card"><strong>${e.fields.length}</strong> fields</div>
        <div class="stat-card"><strong>${D.schema.tables.length}</strong> tables</div>
      </div>
      ${t.map(e=>`
            <div class="template-card">
              <strong>${W(e.fieldName)} summary</strong>
              <span>Sum: ${e.sum.toLocaleString()}</span>
              <span>Average: ${e.average.toFixed(2)}</span>
            </div>
          `).join(``)}
      ${r?`<h3>Related Records</h3>${r}`:``}
      <h3>Template Starters</h3>
      ${wt.map(e=>`
            <div class="template-card">
              <strong>${W(e.title)}</strong>
              <span>${W(e.gradeBand)}</span>
              <p>${W(e.goal)}</p>
              <button type="button" data-template-id="${e.id}">Use template</button>
            </div>
          `).join(``)}
    </aside>
  `}function yr(){let e=D.schema.tables,t=D.schema.relationships,n=t=>e.find(e=>e.id===t)?.name??`table`,r=(t,n)=>e.find(e=>e.id===t)?.fields.find(e=>e.id===n)?.name??`field`,i=new Set(t.flatMap(e=>[e.fromTableId,e.toTableId]));return`<div class="rel-diagram"><div class="rel-boxes">${e.map(e=>`
        <div class="rel-box${e.id===O?` active`:``}${i.has(e.id)?` linked`:``}">
          <strong>${W(e.name)}</strong>
          <span>${e.records.length} record${e.records.length===1?``:`s`} · ${e.fields.length} field${e.fields.length===1?``:`s`}</span>
        </div>
      `).join(``)}</div><div class="rel-links">${t.length?t.map(e=>`
            <div class="rel-link">
              <span class="rel-badge">${W(n(e.fromTableId))}</span>
              <span class="rel-arrow">${W(r(e.fromTableId,e.fromFieldId))} <b>1 → &#8734;</b> ${W(r(e.toTableId,e.toFieldId))}</span>
              <span class="rel-badge">${W(n(e.toTableId))}</span>
            </div>
          `).join(``):`<p class="rel-empty">No links yet. Create one below to connect two tables.</p>`}</div></div>`}function br(e){let t=[[`Combine text`,`JOIN(A, " ", B)`],[`Add`,`ADD(A, B)`],[`Multiply`,`MULTIPLY(A, B)`],[`Percent`,`PERCENT(A, B)`],[`If / then`,`IF(CONTAINS(A, "x"), "yes", "no")`],[`Sum column`,`SUM(A)`],[`Average`,`AVERAGE(A)`],[`Count`,`COUNT(A)`],[`Years since`,`YEARS_BETWEEN(A)`],[`Uppercase`,`UPPER(A)`]],n=e.fields.filter(e=>![`calculation`].includes(e.type)).slice(0,12);return`
    <div class="formula-builder">
      <div class="fb-row"><span>Functions</span>${t.map(([e,t])=>`<button type="button" class="fb-chip" data-formula-insert="${W(t)}">${W(e)}</button>`).join(``)}</div>
      <div class="fb-row"><span>Insert field</span>${n.map(e=>`<button type="button" class="fb-chip field" data-formula-insert="${W(e.name)}">${W(e.name)}</button>`).join(``)}</div>
    </div>
  `}function xr(e,t){let n=[`number`,`currency`,`percent`,`rating`].includes(t),r=[`text`,`longText`,`link`].includes(t),i=[`text`,`longText`,`email`,`phone`,`link`].includes(t);return[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(t)?``:`
    <fieldset class="constraints">
      <legend>Rules and default</legend>
      <label class="check-row"><input type="checkbox" data-field-unique ${e.unique?`checked`:``}> No duplicate values (unique)</label>
      <label class="check-row"><input type="checkbox" data-field-readonly ${e.readonly?`checked`:``}> Read-only (students cannot change it)</label>
      ${n?`<div class="grid-two">
              <label>Minimum <input data-field-min type="number" step="any" value="${e.min==null?``:W(String(e.min))}"></label>
              <label>Maximum <input data-field-max type="number" step="any" value="${e.max==null?``:W(String(e.max))}"></label>
            </div>`:``}
      ${i?`<label>Character limit <input data-field-maxlength type="number" min="1" value="${e.maxLength==null?``:W(String(e.maxLength))}" placeholder="no limit"></label>`:``}
      ${r?`<label>Format <select data-field-pattern>${[`none`,`email`,`url`,`phone`,`custom`].map(t=>`<option value="${t}" ${(e.pattern??`none`)===t?`selected`:``}>${t}</option>`).join(``)}</select></label>
            <label>Custom pattern (advanced) <input data-field-custom-pattern value="${W(e.customPattern??``)}" placeholder="regular expression"></label>`:``}
      <label>Default value for new records <input data-field-default value="${W(e.defaultValue??``)}" placeholder="optional"></label>
      <label>Custom message when a value breaks a rule <input data-field-message value="${W(e.customMessage??``)}" placeholder="optional friendly message"></label>
    </fieldset>
  `}function Sr(e,t,n){if(n===t.type||[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(n))return``;let r=(E.querySelector(`[data-field-options]`)?.value??t.options?.join(`, `)??``).split(`,`).map(e=>e.trim()).filter(Boolean),i=e.records.filter(e=>String(e.values[t.id]??``).trim()!==``).slice(0,4).map(e=>{let i=String(e.values[t.id]??``),a=be(e.values[t.id],n,r),o=a.value===!0?`Yes`:a.value===!1?`No`:String(a.value??``);return`<li><span>${W(i)}</span> → <span class="${a.lost?`preview-lost`:``}">${a.lost?`cleared`:W(o||`(empty)`)}</span></li>`}),a=e.records.filter(e=>String(e.values[t.id]??``).trim()===``?!1:be(e.values[t.id],n,r).lost).length;return`
    <div class="type-preview">
      <strong>Change ${W(t.type)} → ${W(n)}</strong>
      ${i.length?`<ul>${i.join(``)}</ul>`:`<p>No values to convert yet.</p>`}
      ${a?`<p class="preview-warn">${a} value${a===1?``:`s`} cannot convert and will be cleared.</p>`:`<p>All values convert cleanly.</p>`}
    </div>
  `}function Cr(e){let t=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${W(e.name)}</option>`).join(``),n=P.rules.map((e,n)=>{let r=li.find(t=>t.value===e.operator)??li[0];return`
        <div class="find-rule" data-rule-index="${n}">
          <select data-find-field aria-label="Field">${t(e.fieldId)}</select>
          <select data-find-op aria-label="Condition">${li.map(t=>`<option value="${t.value}" ${t.value===e.operator?`selected`:``}>${W(t.label)}</option>`).join(``)}</select>
          <input data-find-value type="text" value="${W(e.value)}" placeholder="value" ${r.needsValue?``:`hidden`}>
          <input data-find-value2 type="text" value="${W(e.value2??``)}" placeholder="and" ${r.needsSecond?``:`hidden`}>
          <button type="button" class="button ghost" data-action="find-remove-rule">Remove</button>
        </div>
      `}).join(``);return`
    <div class="modal-backdrop">
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Advanced find">
        <h2>Find records</h2>
        <label>Match <select data-find-match>
          <option value="all" ${P.match===`all`?`selected`:``}>all conditions (AND)</option>
          <option value="any" ${P.match===`any`?`selected`:``}>any condition (OR)</option>
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
  `}function wr(e){let t=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${W(e.name)}</option>`).join(``);return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Sort records">
        <h2>Sort records</h2>
        <div class="sort-levels">${Mt.map((e,n)=>`
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
  `}function Tr(){let e=gi();return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Saved views">
        <h2>Saved views</h2>
        <p>A view remembers the current table, layout, search, find, and sort. Save it, then reopen it any time.</p>
        <div class="saved-views">
          ${e.length?e.map(e=>`
                      <div class="saved-view" data-view-id="${e.id}">
                        <div><strong>${W(e.name)}</strong><span>${W(e.mode)}${e.sortKeys.length?` · sorted`:``}${e.find&&e.find.rules.length?` · found`:``}</span></div>
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
  `}function Er(e){let t=bi(e).length;return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Fill a field">
        <h2>Fill a field</h2>
        <p>Set the same value in ${t} selected record${t===1?``:`s`}.</p>
        <label>Field <select data-bulk-field>${e.fields.filter(e=>![`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(e.type)).map(e=>`<option value="${e.id}">${W(e.name)}</option>`).join(``)}</select></label>
        <label>Value <input data-bulk-value type="text" placeholder="value to fill in"></label>
        <div class="modal-actions">
          <button type="button" class="button primary" data-action="apply-bulk-fill">Fill selected</button>
          <button type="button" data-action="close-dialog">Cancel</button>
        </div>
      </section>
    </div>
  `}function Dr(e){let t=e.fields.find(e=>e.id===Ut);if(!t)return[];let n=q(e),r=new Map;return n.forEach(n=>{let i=String(Z(e,n,t.id)??``).trim()||`(empty)`,a=1;if(Wt===`sum`&&Gt){let t=Number(Z(e,n,Gt));a=Number.isFinite(t)?t:0}r.set(i,(r.get(i)??0)+a)}),[...r.entries()].map(([e,t])=>({label:e,value:t})).slice(0,24)}var Or=[`#7c3aed`,`#0ea5e9`,`#16a34a`,`#f59e0b`,`#dc2626`,`#9333ea`,`#0891b2`,`#65a30d`,`#ea580c`,`#db2777`];function kr(e){if(!e.length)return`<p class="empty-panel">Choose a category field to build a chart.</p>`;let t=Math.max(...e.map(e=>e.value),1),n=e.reduce((e,t)=>e+t.value,0)||1;if(Ht===`pie`){let t=-Math.PI/2;return`<svg viewBox="0 0 300 260" class="chart-svg" role="img" aria-label="Pie chart">${e.map((e,r)=>{let i=e.value/n*Math.PI*2,a=150+110*Math.cos(t),o=130+110*Math.sin(t);t+=i;let s=150+110*Math.cos(t),c=130+110*Math.sin(t),l=+(i>Math.PI);return`<path d="M150 130 L${a.toFixed(1)} ${o.toFixed(1)} A110 110 0 ${l} 1 ${s.toFixed(1)} ${c.toFixed(1)} Z" fill="${Or[r%Or.length]}"></path>`}).join(``)}</svg>`}let r=460/e.length;return Ht===`line`?`<svg viewBox="0 0 520 260" class="chart-svg" role="img" aria-label="Line chart">
      <polyline fill="none" stroke="#7c3aed" stroke-width="3" points="${e.map((e,n)=>{let i=30+r*n+r/2,a=230-e.value/t*200;return`${i.toFixed(1)},${a.toFixed(1)}`}).join(` `)}"></polyline>
      ${e.map((e,n)=>{let i=30+r*n+r/2,a=230-e.value/t*200;return`<circle cx="${i.toFixed(1)}" cy="${a.toFixed(1)}" r="4" fill="#5b21b6"></circle>`}).join(``)}
    </svg>`:`<svg viewBox="0 0 520 260" class="chart-svg" role="img" aria-label="Bar chart">${e.map((e,n)=>{let i=30+r*n+4,a=e.value/t*200,o=230-a;return`<rect x="${i.toFixed(1)}" y="${o.toFixed(1)}" width="${(r-8).toFixed(1)}" height="${a.toFixed(1)}" rx="4" fill="${Or[n%Or.length]}"></rect>`}).join(``)}<line x1="30" y1="230" x2="490" y2="230" stroke="#d8d2ff"></line></svg>`}function Ar(e){let t=e.fields.filter(e=>!e.hidden&&![`image`,`longText`,`calculation`].includes(e.type)),n=e.fields.filter(e=>[`number`,`currency`,`percent`,`rating`].includes(e.type)),r=Dr(e);return`
    <div class="modal-backdrop">
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Charts">
        <h2>Charts</h2>
        <p>Charts use the records currently shown (${q(e).length}). Change filters to focus a chart.</p>
        <div class="chart-controls">
          <label>Type <select data-chart-type>${[`bar`,`pie`,`line`].map(e=>`<option value="${e}" ${Ht===e?`selected`:``}>${e}</option>`).join(``)}</select></label>
          <label>Category <select data-chart-category><option value="">Choose a field</option>${t.map(e=>`<option value="${e.id}" ${Ut===e.id?`selected`:``}>${W(e.name)}</option>`).join(``)}</select></label>
          <label>Measure <select data-chart-value-mode><option value="count" ${Wt===`count`?`selected`:``}>count records</option><option value="sum" ${Wt===`sum`?`selected`:``}>sum a number</option></select></label>
          ${Wt===`sum`?`<label>Number field <select data-chart-value-field><option value="">Choose</option>${n.map(e=>`<option value="${e.id}" ${Gt===e.id?`selected`:``}>${W(e.name)}</option>`).join(``)}</select></label>`:``}
        </div>
        <div class="chart-area">${kr(r)}</div>
        ${r.length?`<table class="chart-table"><caption class="sr-only">Chart data</caption><thead><tr><th>Category</th><th>Value</th></tr></thead><tbody>${r.map(e=>`<tr><td>${W(e.label)}</td><td>${e.value.toLocaleString()}</td></tr>`).join(``)}</tbody></table>`:``}
        <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
      </section>
    </div>
  `}function jr(e){let t=Ne(e),n=Fe(e),r=Ie(D),i=Math.round(JSON.stringify(D).length/1024);return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Database maintenance">
        <h2>Database maintenance</h2>
        <div class="maint-row">
          <div><strong>${t.length}</strong> duplicate record${t.length===1?``:`s`}</div>
          <button type="button" class="button" data-action="remove-duplicates" ${t.length?``:`disabled`}>Remove duplicates</button>
        </div>
        <div class="maint-row">
          <div><strong>${n.length}</strong> always-empty field${n.length===1?``:`s`}${n.length?`: `+W(n.map(e=>e.name).join(`, `)):``}</div>
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
  `}function Mr(e){let t=[];e.fields.filter(e=>e.type===`image`).forEach(e=>{e.description.trim()||t.push(`Image field "${e.name}" has no description to use as alt text.`)});let n=e.fields.filter(e=>!e.hidden&&!e.description.trim()&&![`autoNumber`,`createdAt`,`updatedAt`].includes(e.type));n.length&&t.push(`${n.length} field${n.length===1?``:`s`} have no student-friendly description.`),D.metadata.title.trim()||t.push(`The database has no title.`);let r=St(e).filter(e=>/required/i.test(e.message)).length;return r&&t.push(`${r} required value${r===1?` is`:`s are`} still empty.`),t}function Nr(e){let t=Mr(e);return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Accessibility check">
        <h2>Accessibility check</h2>
        <p>Quick checks a database creator can act on. ListSplat itself supports keyboard use, visible focus, and screen readers.</p>
        ${t.length?`<ul class="a11y-list">${t.map(e=>`<li>⚠️ ${W(e)}</li>`).join(``)}</ul>`:`<p class="a11y-ok">✅ No issues found. Nice work.</p>`}
        <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
      </section>
    </div>
  `}var Pr=[{id:`collection`,label:`A collection (books, rocks, artifacts)`,fields:[[`Name`,`text`],[`Category`,`choice`],[`Notes`,`longText`],[`Picture`,`image`]]},{id:`log`,label:`A log or journal (observations, reading)`,fields:[[`Date`,`date`],[`Entry`,`longText`],[`Rating`,`rating`]]},{id:`people`,label:`A directory of people`,fields:[[`Name`,`text`],[`Email`,`email`],[`Phone`,`phone`],[`Notes`,`longText`]]},{id:`inventory`,label:`An inventory or checkout list`,fields:[[`Item`,`text`],[`Quantity`,`number`],[`Location`,`text`],[`Status`,`choice`]]},{id:`tracker`,label:`A tracker with status columns`,fields:[[`Title`,`text`],[`Status`,`choice`],[`Owner`,`text`],[`Due date`,`date`],[`Notes`,`longText`]]}];function Fr(){return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Guided database builder">
        <h2>Build a database</h2>
        <p>Tell me what you want to track and I'll set up a table with useful fields. You can change anything afterward.</p>
        <label>Name it <input data-guided-name placeholder="e.g. Rock collection"></label>
        <div class="guided-kinds">
          ${Pr.map(e=>`<button type="button" class="guided-kind" data-action="guided-create" data-guided-kind="${e.id}"><strong>${W(e.label)}</strong><span>${e.fields.map(([e])=>W(e)).join(` · `)}</span></button>`).join(``)}
        </div>
        <div class="modal-actions"><button type="button" data-action="close-dialog">Cancel</button></div>
      </section>
    </div>
  `}function Ir(e){if(z===`none`)return``;if(z===`find`)return Cr(e);if(z===`sort`)return wr(e);if(z===`views`)return Tr();if(z===`bulkFill`)return Er(e);if(z===`charts`)return Ar(e);if(z===`maintenance`)return jr(e);if(z===`accessibility`)return Nr(e);if(z===`guided`)return Fr();if(z===`rubric`)return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Rubric">
          <h2>Rubric criteria</h2>
          <p>Score each criterion on every record's form. The total adds up automatically.</p>
          <div class="rubric-def">
            ${Pt.map((e,t)=>`
                  <div class="rubric-def-row" data-crit-id="${e.id}" data-crit-index="${t}">
                    <input data-crit-label value="${W(e.label)}" placeholder="Criterion">
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
    `;if(z===`camera`)return`
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
    `;if(z===`replace`){let t=H.slice(0,8);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Replace values">
          <h2>Replace values</h2>
          <label>Find <input data-replace-find placeholder="Text to find"></label>
          <label>Replace with <input data-replace-with placeholder="New text"></label>
          <label>Field <select data-replace-field>${e.fields.map(e=>`<option value="${e.id}">${W(e.name)}</option>`).join(``)}</select></label>
          <label class="check-row"><input type="checkbox" data-replace-case-sensitive> Case-sensitive</label>
          <label class="check-row"><input type="checkbox" data-replace-whole-word> Whole word only</label>
          <p>Replacement applies to the current found set when search is active. Preview first, then apply. The last replace can be undone from Edit.</p>
          ${H.length?`<div class="replace-preview"><strong>${H.length} change${H.length===1?``:`s`} ready</strong>${t.map(t=>{let n=e.records.find(e=>e.id===t.recordId),r=e.fields.find(e=>e.id===t.fieldId);return`<p><span>${W(n?Yn(e,n):`Record`)} / ${W(r?.name??`Field`)}</span><del>${W(t.before)}</del><ins>${W(t.after)}</ins></p>`}).join(``)}</div>`:``}
          <div class="modal-actions">
            <button type="button" data-action="preview-replace">Preview</button>
            <button type="button" data-action="run-replace" ${H.length?``:`disabled`}>Apply Replace</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(z===`field`){let t=e.fields.find(e=>e.id===Zt)??e.fields[0],n=Nt||t.type;return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Field settings">
          <h2>Field settings</h2>
          <label>Name <input data-field-name value="${W(t.name)}"></label>
          <label>Type <select data-field-type>${Ln(n)}</select></label>
          ${Sr(e,t,n)}
          <label>Description <textarea data-field-description>${W(t.description)}</textarea></label>
          <label>Choice options <input data-field-options value="${W(t.options?.join(`, `)??``)}" placeholder="Yes, No, Maybe"></label>
          <label class="check-row"><input type="checkbox" data-field-required ${t.required?`checked`:``}> Required field</label>
          <label class="check-row"><input type="checkbox" data-field-hidden ${t.hidden?`checked`:``}> Hide field</label>
          ${xr(t,n)}
          <label>Calculation formula <input data-field-formula value="${W(t.formula??``)}" placeholder='JOIN(First Name, " ", Last Name)'></label>
          ${n===`calculation`?br(e):``}
          <p>Try <code>FIELD(Animal)</code>, <code>JOIN(Animal, " lives in ", Habitat)</code>, <code>UPPER(Animal)</code>, <code>ADD(Score, Bonus)</code>, <code>AVERAGE(Score)</code>, or <code>LOOKUP("Book reviews", Rating)</code>.</p>
          <div class="modal-actions">
            <button type="button" data-action="save-field-settings">Save field</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(z===`layout`){let t=zn(),n=Vn(e),r=new Set(t?.hiddenFieldIds??[]);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Layout designer">
          <h2>Layout designer</h2>
          <p>Arrange and choose fields for the current ${W(A)} view. Locked layouts can still be viewed, but students should not change them.</p>
          <label class="check-row"><input type="checkbox" data-layout-locked ${t?.locked?`checked`:``}> Lock this layout</label>
          <div class="layout-field-list">
            ${n.map((e,t)=>`
                  <div class="layout-field-row">
                    <label class="check-row"><input type="checkbox" data-layout-field-visible="${e.id}" ${r.has(e.id)?``:`checked`}> <strong>${W(e.name)}</strong></label>
                    <span>${W(e.type)}</span>
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
    `}if(z===`csvImport`&&U){let t=U.records.slice(0,4),n=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${W(e.name)}</option>`).join(``),r=L.map((e,t)=>`
          <div class="csv-map-row" data-map-index="${t}">
            <span class="csv-map-header">${W(e.header||`Column ${t+1}`)}</span>
            <select data-map-action aria-label="What to do with ${W(e.header)}">
              <option value="new" ${e.action===`new`?`selected`:``}>New field</option>
              <option value="existing" ${e.action===`existing`?`selected`:``}>Existing field</option>
              <option value="skip" ${e.action===`skip`?`selected`:``}>Skip</option>
            </select>
            <select data-map-type aria-label="Type for ${W(e.header)}" ${e.action===`new`?``:`hidden`}>${Ln(e.type)}</select>
            <select data-map-existing aria-label="Existing field for ${W(e.header)}" ${e.action===`existing`?``:`hidden`}>${n(e.fieldId)}</select>
          </div>
        `).join(``);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="CSV import">
          <h2>Import CSV</h2>
          <p>${W(rn)} has ${U.fields.length} column${U.fields.length===1?``:`s`} and ${U.records.length} row${U.records.length===1?``:`s`}. Choose how each column maps.</p>
          <div class="csv-map">${r}</div>
          <div class="preview-table-wrap">
            <table class="preview-table">
              <thead>
                <tr>${U.fields.map(e=>`<th>${W(e.name)}</th>`).join(``)}</tr>
              </thead>
              <tbody>
                ${t.map(e=>`<tr>${U.fields.map(t=>`<td>${W(e.values[t.id])}</td>`).join(``)}</tr>`).join(``)}
              </tbody>
            </table>
          </div>
          <p><strong>Create new table</strong> builds a fresh table from the columns you keep. <strong>Append</strong> adds the rows to ${W(e.name)} using your field mapping.</p>
          <div class="csv-dup">
            <label>When appending, match on <select data-csv-key><option value="">nothing (always add)</option>${e.fields.filter(e=>![`image`,`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(e.type)).map(e=>`<option value="${e.id}" ${Yt===e.id?`selected`:``}>${W(e.name)}</option>`).join(``)}</select></label>
            <label>Duplicates <select data-csv-dup ${Yt?``:`disabled`}>
              <option value="add" ${Xt===`add`?`selected`:``}>always add</option>
              <option value="skip" ${Xt===`skip`?`selected`:``}>skip matches</option>
              <option value="update" ${Xt===`update`?`selected`:``}>update matches</option>
            </select></label>
          </div>
          <div class="modal-actions">
            <button type="button" class="button primary" data-action="apply-csv-new">Create new table</button>
            <button type="button" class="button" data-action="apply-csv-append">Append to ${W(e.name)}</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(z===`projectIdeas`)return`
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
    `;if(z===`relationship`){let t=D.schema.tables.find(e=>e.id===tn)??e,n=D.schema.tables.find(e=>e.id===nn)??e,r=t.fields.map(e=>`<option value="${t.id}:${e.id}">${W(e.name)}</option>`).join(``),i=n.fields.map(e=>`<option value="${n.id}:${e.id}">${W(e.name)}</option>`).join(``);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Relationships">
          <h2>Relationships</h2>
          <p>Create a simple one-to-many relationship by matching values in two fields, such as Books:Title to Reviews:Book.</p>
          ${yr()}
          <label>Name <input data-relationship-name placeholder="Books to reviews"></label>
          <label>Parent table <select data-relationship-from-table>${D.schema.tables.map(e=>`<option value="${e.id}" ${e.id===t.id?`selected`:``}>${W(e.name)}</option>`).join(``)}</select></label>
          <label>Parent match field <select data-relationship-from-field>${r}</select></label>
          <label>Related table <select data-relationship-to-table>${D.schema.tables.map(e=>`<option value="${e.id}" ${e.id===n.id?`selected`:``}>${W(e.name)}</option>`).join(``)}</select></label>
          <label>Related match field <select data-relationship-to-field>${i}</select></label>
          ${D.schema.relationships.length?`<div class="relationship-list">${D.schema.relationships.map(e=>`<p><strong>${W(e.name)}</strong><br>${W(Qe(D,e))}</p>`).join(``)}</div>`:`<p>No relationships yet. Add a second table first for the most useful results.</p>`}
          <div class="modal-actions">
            <button type="button" data-action="create-relationship">Create relationship</button>
            <button type="button" data-action="close-dialog">Close</button>
          </div>
        </section>
      </div>
    `}if(z===`functions`){let t=e.fields.filter(e=>![`image`,`createdAt`,`updatedAt`].includes(e.type)),n=t.find(e=>[`text`,`longText`,`choice`].includes(e.type))??t[0],r=t.find(e=>[`number`,`currency`,`percent`,`rating`].includes(e.type))??n,i=n?.name??`Field`,a=r?.name??`Score`;return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Functions">
          <h2>Calculation functions</h2>
          <p>Use a calculation field when students need a result made from other fields. Formulas are simple, offline, and do not run custom code.</p>
          <div class="formula-grid">
            <div>
              <strong>Text</strong>
              <code>FIELD(${W(i)})</code>
              <code>JOIN(${W(i)}, " report")</code>
              <code>UPPER(${W(i)})</code>
              <code>TITLECASE(${W(i)})</code>
              <code>CONTAINS(${W(i)}, "a")</code>
            </div>
            <div>
              <strong>Numbers</strong>
              <code>ADD(${W(a)}, "5")</code>
              <code>SUBTRACT(${W(a)}, "1")</code>
              <code>MULTIPLY(${W(a)}, "2")</code>
              <code>DIVIDE(${W(a)}, "2")</code>
              <code>ROUND(${W(a)}, "1")</code>
            </div>
            <div>
              <strong>Whole table</strong>
              <code>SUM(${W(a)})</code>
              <code>AVERAGE(${W(a)})</code>
              <code>MIN(${W(a)})</code>
              <code>MAX(${W(a)})</code>
              <code>COUNT(${W(a)})</code>
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
    `}if(z===`quality`){let t=Wn(e),n=Un(e),r=t.reduce((e,t)=>e+t.missing,0),i=t.reduce((e,t)=>e+t.duplicates,0),a=St(e).length;return`
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
                          <span><strong>${W(e.name)}</strong><small>${W(e.type)}</small></span>
                          <button type="button" data-quality-kind="missing" data-quality-field-id="${e.id}" ${t?``:`disabled`}>${t}</button>
                          <button type="button" data-quality-kind="duplicates" data-quality-field-id="${e.id}" ${n?``:`disabled`}>${n}</button>
                        </div>
                      `).join(``):`<p class="empty-panel">No editable data fields are available yet.</p>`}
          </div>
          <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
        </section>
      </div>
    `}return z===`teacherNotes`?`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Teacher notes">
          <h2>Teacher notes</h2>
          <p>Add one note per line. These notes are saved in the .listsplat.json file and included in the project packet.</p>
          <label>Notes <textarea data-teacher-notes rows="8" placeholder="Add setup directions, reflection questions, or grading reminders.">${W(D.teacher.notes.join(`
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
  `}function $(){let e=K();pn(e),ln();let t=D.teacher.studentView;if(E.innerHTML=`
    <header class="app-header">
      <a class="brand" href="../../pages/splatworks.html" aria-label="SplatWorks home">
        <img class="brand-icon" src="listsplat_icon.png" alt="">
        <span>
          <strong>ListSplat<sup>TM</sup></strong>
          <small>SplatWorks<sup>TM</sup> Database Studio</small>
        </span>
      </a>
      <div class="quick-actions">
        <button type="button" class="button" data-action="undo-change"${V.length?``:` disabled`} title="Undo (Ctrl+Z)" aria-label="Undo">↶ ${W(G(`Undo`))}</button>
        <button type="button" class="button" data-action="redo-change"${Qt.length?``:` disabled`} title="Redo (Ctrl+Y)" aria-label="Redo">↷ ${W(G(`Redo`))}</button>
        <button type="button" class="button primary" data-action="new">${W(G(`New`))}</button>
        <button type="button" class="button primary" data-action="save-json">${W(G(`Save JSON`))}</button>
        <button type="button" class="button primary" data-action="open-json">${W(G(`Open JSON`))}</button>
        <button type="button" class="button primary" data-action="export-csv">${W(G(`Export CSV`))}</button>
        <select id="languageSwitcher" class="lang-switcher" aria-label="Language">${cn(an)}</select>
      </div>
    </header>
    <main class="listsplat-app">
      <nav class="menu-bar" aria-label="Application menu">
        ${In(`File`,[[`new`,`New database`],[`save-json`,`Save .listsplat.json`],[`save-drive`,`Save to Google Drive`],[`open-json`,`Open .listsplat.json`],[`import-csv`,`Import CSV or TSV`],[`export-csv`,`Export table CSV`],[`export-found-csv`,`Export shown records CSV`],[`export-markdown`,`Export Markdown table`],[`export-report`,`Export report HTML`],[`print`,`Print`]])}
        ${In(`Edit`,[[`undo-change`,`Undo last change`],[`redo-change`,`Redo last change`],[`add-record`,`Add record`],[`add-field`,`Add field`],[`find`,`Find records`],[`replace`,`Replace values`]])}
        ${In(`Data`,[[`add-table`,`New table`],[`rename-table`,`Rename this table`],[`duplicate-table`,`Duplicate this table`],[`move-table-left`,`Move table left`],[`move-table-right`,`Move table right`],[`delete-table`,`Delete this table`],[`sort`,`Sort records`],[`missing`,`Find missing values`],[`duplicates`,`Find duplicates`],[`toggle-archived`,Ft?`Show active records`:`Show archived records (${un(e)})`],[`structure-copy`,`Save structure-only copy`],[`clear-find`,`Show all records`]])}
        ${In(`Layout`,[[`layout-designer`,`Design current layout`],[`table-view`,`Table view`],[`form-view`,`Form view`],[`cards-view`,`Card view`],[`gallery-view`,`Gallery view`],[`labels-view`,`Label view`],[`report-view`,`Report view`]])}
        ${In(`Tools`,[[`functions`,`Functions`],[`relationships`,`Relationships`],[`charts`,`Charts`],[`quality`,`Data quality check`],[`maintenance`,`Database maintenance`],[`accessibility`,`Accessibility check`]])}
        ${In(`View`,[[`student-view`,t?`Exit student view`:`Student view`],[`teacher-notes`,`Teacher notes`]])}
        <span class="menu-spacer"></span>
        ${t?``:In(`Teacher`,[[`guided`,`Guided database builder`],[`templates`,`Template Library`],[`project-ideas`,`Project Ideas`],[`share-html`,`Publish read-only page`],[`lock-layout`,`Lock Layout`],[`project-packet`,`Print Project Packet`]])}
        ${In(`Help`,[[`help-start`,`Start a database`],[`help-csv`,`Import and export CSV`],[`help-layouts`,`Forms and reports`],[`help-privacy`,`Privacy and saving`]])}
      </nav>
      <section class="toolbar" aria-label="Database toolbar">
        <label>${W(G(`Title`))} <input data-project-title value="${W(D.metadata.title)}"></label>
        <label>${W(G(`Search`))} <input data-search value="${W(j)}" placeholder="${W(G(`Find records`))}"></label>
        <label>${W(G(`In`))} <select data-search-field><option value="all">${W(G(`All fields`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${jt===e.id?`selected`:``}>${W(e.name)}</option>`).join(``)}</select></label>
        <label>${W(G(`Sort`))} <select data-sort-field><option value="">${W(G(`Choose field`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${M[0]?.fieldId===e.id?`selected`:``}>${W(e.name)}</option>`).join(``)}</select></label>
        <button type="button" data-action="toggle-sort" title="${W(G(`Sort direction`))}">${M[0]?.direction===`desc`?`Z-A`:`A-Z`}</button>
        <button type="button" data-action="sort-dialog" title="${W(G(`Sort by more than one field`))}">${W(G(`Sort…`))}</button>
        <button type="button" data-action="find" title="${W(G(`Advanced find with conditions`))}">${W(G(`Find…`))}</button>
        <button type="button" data-action="views" title="${W(G(`Save and reuse this view`))}">${W(G(`Views`))}</button>
        <label>${W(G(`New field`))} <input data-new-field placeholder="${W(G(`Field name`))}"></label>
        <label>${W(G(`Type`))} <select data-new-field-type>${Ln()}</select></label>
        <button type="button" data-action="add-field">${W(G(`Add field`))}</button>
        <button type="button" data-action="add-record">${W(G(`Add record`))}</button>
      </section>
      <div class="workspace${t?` student-workspace`:``}">
        ${hr(e)}
        ${t?``:vr(e)}
      </div>
      <footer class="status-bar">
        <span>${W(e.name)}: ${q(e).length} shown of ${e.records.length} records, ${e.fields.length} fields</span>
        ${t?`<span>Student view hides teacher notes and teacher tools.</span>`:``}
        <span>${W(B)}</span>
        <span>${At}</span>
      </footer>
    </main>
    <input class="hidden-file" type="file" accept=".listsplat.json,application/json" data-open-json>
    <input class="hidden-file" type="file" accept=".csv,text/csv" data-import-csv>
    ${Ir(e)}
  `,$t=``,en){let e=en;en=null,ti(e.recordId,e.fieldId)}ai()}function Lr(e){return e instanceof HTMLInputElement&&e.type===`checkbox`?e.checked:e instanceof HTMLInputElement&&e.type===`number`?e.value===``?``:Number(e.value):e.value}function Rr(e){let t=e.dataset.recordId,n=e.dataset.fieldId;!t||!n||(D=x(D,Te(K(),t,n,Lr(e))),Ge(D),At=`Saved locally`)}function zr(e){return new Promise((t,n)=>{let r=new FileReader;r.onerror=()=>n(r.error),r.onload=()=>{let n=String(r.result??``);if(e.size<=35e4){t(n);return}let i=new Image;i.onerror=()=>t(n),i.onload=()=>{let e=1280,r=Math.max(i.width,i.height),a=r>e?e/r:1,o=Math.max(1,Math.round(i.width*a)),s=Math.max(1,Math.round(i.height*a)),c=document.createElement(`canvas`);c.width=o,c.height=s;let l=c.getContext(`2d`);if(!l){t(n);return}l.drawImage(i,0,0,o,s);let u=c.toDataURL(`image/jpeg`,.82);t(u.length<n.length?u:n)},i.src=n},r.readAsDataURL(e)})}function Br(e){if(!e)return null;try{let t=JSON.parse(e);if(t&&t.url)return{name:t.name||`file`,url:t.url}}catch{}return e.startsWith(`data:`)?{name:`file`,url:e}:null}function Vr(e,t,n){let r=new FileReader;r.onload=()=>{Y(`add file`);let i=JSON.stringify({name:n.name,url:String(r.result??``)});D=x(D,Te(K(),e,t,i)),Ge(D);let a=Math.round(i.length/1024);B=a>900?`File attached (about ${a} KB). Large files can slow autosave.`:`File attached.`,$()},r.onerror=()=>{B=`Could not read that file.`,$()},r.readAsDataURL(n)}async function Hr(e,t){if(Kt&&Kt.state===`recording`){Kt.stop();return}if(!navigator.mediaDevices?.getUserMedia||window.MediaRecorder===void 0){B=`Audio recording is not available in this browser.`,$();return}try{let n=await navigator.mediaDevices.getUserMedia({audio:!0}),r=[],i=new MediaRecorder(n);Kt=i,i.ondataavailable=e=>{e.data.size&&r.push(e.data)},i.onstop=()=>{n.getTracks().forEach(e=>e.stop()),Kt=null;let i=new FileReader;i.onload=()=>{Y(`record audio`),D=x(D,Te(K(),e,t,String(i.result??``))),Ge(D),B=`Recording saved.`,$()},i.readAsDataURL(new Blob(r,{type:`audio/webm`}))},i.start(),B=`Recording… press the button again to stop (auto-stops at 60s).`,$(),window.setTimeout(()=>{Kt&&Kt.state===`recording`&&Kt.stop()},6e4)}catch{B=`Microphone permission was blocked.`,$()}}async function Ur(){if(!navigator.mediaDevices?.getUserMedia){B=`Camera is not available in this browser.`,z=`none`,$();return}try{Jt=await navigator.mediaDevices.getUserMedia({video:{facingMode:`environment`}});let e=E.querySelector(`#cameraVideo`);e&&(e.srcObject=Jt,await e.play().catch(()=>void 0))}catch{Wr(),B=`Camera permission was blocked.`,z=`none`,$()}}function Wr(){Jt?.getTracks().forEach(e=>e.stop()),Jt=null}function Gr(){let e=E.querySelector(`#cameraVideo`);if(!e||!qt||!e.videoWidth)return;let t=document.createElement(`canvas`),n=Math.min(1,1280/Math.max(e.videoWidth,e.videoHeight));t.width=Math.round(e.videoWidth*n),t.height=Math.round(e.videoHeight*n);let r=t.getContext(`2d`);if(!r)return;r.drawImage(e,0,0,t.width,t.height);let i=t.toDataURL(`image/jpeg`,.85),{recordId:a,fieldId:o}=qt;Y(`camera photo`),D=x(D,Te(K(),a,o,i)),Ge(D),Wr(),qt=null,z=`none`,B=`Photo captured.`,$()}function Kr(e,t,n,r){if(!n.type.startsWith(`image/`)){B=`That clipboard item is not an image.`,$();return}zr(n).then(n=>{Y(r),D=x(D,Te(K(),e,t,n)),Ge(D);let i=Math.round(n.length/1024);B=i>900?`Image saved (about ${i} KB). Very large pictures can slow autosave — a smaller image is fine for most projects.`:`Image saved in this field.`,$()}).catch(()=>{B=`Could not read that image.`,$()})}function qr(){let e=K(),t=e.fields.find(e=>e.id===Zt);if(!t)return;let n=E.querySelector(`[data-field-name]`)?.value??t.name,r=E.querySelector(`[data-field-type]`)?.value??t.type,i=E.querySelector(`[data-field-description]`)?.value??``,a=E.querySelector(`[data-field-required]`)?.checked??!1,o=E.querySelector(`[data-field-hidden]`)?.checked??!1,s=E.querySelector(`[data-field-formula]`)?.value??``,c=(E.querySelector(`[data-field-options]`)?.value??``).split(`,`).map(e=>e.trim()).filter(Boolean),l=E.querySelector(`[data-field-unique]`)?.checked??!1,u=E.querySelector(`[data-field-min]`)?.value??``,ee=E.querySelector(`[data-field-max]`)?.value??``,d=u.trim()===``?void 0:Number(u),te=ee.trim()===``?void 0:Number(ee),f=E.querySelector(`[data-field-pattern]`)?.value??`none`,p=E.querySelector(`[data-field-custom-pattern]`)?.value??``,ne=E.querySelector(`[data-field-default]`)?.value??``,m=E.querySelector(`[data-field-readonly]`)?.checked??!1,re=E.querySelector(`[data-field-maxlength]`)?.value??``,h=re.trim()===``?void 0:Number(re),g=E.querySelector(`[data-field-message]`)?.value??``,_=r!==t.type,v=Se(e,t.id,{name:n,type:r,description:i,required:a,hidden:o,formula:s,options:c,unique:l,min:d,max:te,pattern:f,customPattern:p,defaultValue:ne,readonly:m,maxLength:h,customMessage:g});_&&![`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(r)&&(v=xe(v,t.id,r,c)),X(v),z=`none`,B=_?`Updated ${n} and converted values to ${r}.`:`Updated ${n}.`,$()}function Jr(){let e=E.querySelector(`[data-replace-find]`)?.value??``,t=E.querySelector(`[data-replace-with]`)?.value??``,n=E.querySelector(`[data-replace-field]`)?.value??K().fields[0]?.id,r=E.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=E.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=j?q(K()).map(e=>e.id):void 0;Y(`replace`);let o=_t(K(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i});z=`none`,H=[],B=`Replaced ${o.count} value${o.count===1?``:`s`}.`,X(o.table)}function Yr(){let e=E.querySelector(`[data-replace-find]`)?.value??``,t=E.querySelector(`[data-replace-with]`)?.value??``,n=E.querySelector(`[data-replace-field]`)?.value??K().fields[0]?.id,r=E.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=E.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=j?q(K()).map(e=>e.id):void 0;H=gt(K(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i}),B=`Preview found ${H.length} change${H.length===1?``:`s`}.`,$()}function Xr(){let e=(E.querySelector(`[data-teacher-notes]`)?.value??``).split(`
`).map(e=>e.trim()).filter(Boolean);Y(`teacher notes`),z=`none`,B=`Saved ${e.length} teacher note${e.length===1?``:`s`}.`,J({...D,updatedAt:new Date().toISOString(),teacher:{...D.teacher,notes:e}})}function Zr(e){let t=E.querySelector(e)?.value;if(!t)return null;let[n,r]=t.split(`:`);return n&&r?{tableId:n,fieldId:r}:null}function Qr(){let e=E.querySelector(`[data-relationship-from-table]`)?.value??``,t=E.querySelector(`[data-relationship-to-table]`)?.value??``,n=Zr(`[data-relationship-from-field]`),r=Zr(`[data-relationship-to-field]`),i=E.querySelector(`[data-relationship-name]`)?.value??``;if(!e||!t||!n||!r){B=`Choose both tables and both match fields.`,$();return}if(n.tableId!==e||r.tableId!==t){B=`Match fields must belong to the tables you chose.`,$();return}Y(`relationship create`);let a=Ye(i,e,n.fieldId,t,r.fieldId);B=`Created relationship: ${a.name}.`,J(Xe(D,a))}function $r(){tn=E.querySelector(`[data-relationship-from-table]`)?.value??tn,nn=E.querySelector(`[data-relationship-to-table]`)?.value??nn,$()}function ei(e){return window.CSS&&typeof CSS.escape==`function`?CSS.escape(e):e.replace(/["\\]/g,`\\$&`)}function ti(e,t){let n=E.querySelector(`.data-grid`);if(!n)return!1;let r=n.querySelector(`tr[data-record-row="${ei(e)}"]`);if(!r)return!1;let i=r.querySelector(`.cell-input[data-field-id="${ei(t)}"], .cell-checkbox[data-field-id="${ei(t)}"]`);return i||=r.querySelector(`.cell-input, .cell-checkbox`),i?(i.focus(),i instanceof HTMLInputElement&&i.type!==`checkbox`&&i.select(),!0):!1}function ni(e){Y(`add record`);let t=ye(K()),n=t.records.at(-1);n&&(k=n.id,en={recordId:n.id,fieldId:e}),X(t)}function ri(e,t,n,r){let i=Array.from(E.querySelectorAll(`.data-grid tbody tr[data-record-row]`)),a=i.findIndex(t=>t.dataset.recordRow===e),o=Q(K()).map(e=>e.id),s=o.indexOf(t);if(a<0||s<0)return;let c=a+n,l=s+r;if(r>0&&l>=o.length?(l=0,c=a+1):r<0&&l<0&&(l=o.length-1,c=a-1),c>=i.length){ni(o[l]??o[0]);return}c<0||ti(i[c].dataset.recordRow??e,o[l]??t)}function ii(){if(!I)return null;let e=q(K()).map(e=>e.id),t=Q(K()).map(e=>e.id),n=e.indexOf(I.anchor.r),r=e.indexOf(I.focus.r),i=t.indexOf(I.anchor.f),a=t.indexOf(I.focus.f);return n<0||r<0||i<0||a<0?null:{rows:e,cols:t,r1:Math.min(n,r),r2:Math.max(n,r),c1:Math.min(i,a),c2:Math.max(i,a)}}function ai(){E.querySelectorAll(`.data-grid td.cell-range`).forEach(e=>e.classList.remove(`cell-range`));let e=ii();if(e&&!((e.r2-e.r1+1)*(e.c2-e.c1+1)<=1))for(let t=e.r1;t<=e.r2;t+=1)for(let n=e.c1;n<=e.c2;n+=1)E.querySelector(`.data-grid [data-record-id="${ei(e.rows[t])}"][data-field-id="${ei(e.cols[n])}"]`)?.closest(`td`)?.classList.add(`cell-range`)}function oi(e){if(!I)return;let t=q(K()).map(e=>e.id),n=Q(K()).map(e=>e.id),r=t.indexOf(I.focus.r),i=n.indexOf(I.focus.f);r<0||i<0||(e===`ArrowUp`?r=Math.max(0,r-1):e===`ArrowDown`?r=Math.min(t.length-1,r+1):e===`ArrowLeft`?i=Math.max(0,i-1):e===`ArrowRight`&&(i=Math.min(n.length-1,i+1)),I={anchor:I.anchor,focus:{r:t[r],f:n[i]}},ai())}function si(){let e=ii();if(!e||e.r2-e.r1===0&&e.c2-e.c1===0)return!1;let t=K(),n=new Map(t.records.map(e=>[e.id,e])),r=[];for(let i=e.r1;i<=e.r2;i+=1){let a=n.get(e.rows[i]);if(!a)continue;let o=[];for(let n=e.c1;n<=e.c2;n+=1)o.push(String(Z(t,a,e.cols[n])??``).replace(/\t/g,` `).replace(/\n/g,` `));r.push(o.join(`	`))}let i=r.join(`
`);navigator.clipboard?.writeText(i).catch(()=>void 0);let a=(e.r2-e.r1+1)*(e.c2-e.c1+1),o=E.querySelector(`.status-bar span:nth-last-child(2)`);return o&&(o.textContent=`Copied ${a} cells.`),!0}function ci(e,t,n){let r=K(),i=q(r),a=Q(r).map(e=>e.id),o=i.findIndex(e=>e.id===t),s=a.indexOf(n);if(o<0||s<0)return;let c=e.replace(/\r/g,``).replace(/\n$/,``).split(`
`).map(e=>e.split(`	`));Y(`paste`);let l=new Map(r.records.map(e=>[e.id,e])),u=r.records.map(e=>e.id),ee=0;c.forEach((e,t)=>{let n;if(o+t<i.length)n=i[o+t].id;else{let e=b(r.fields);l.set(e.id,e),u.push(e.id),n=e.id,ee+=1}let c=l.get(n);if(!c)return;let d={...c.values};e.forEach((e,t)=>{let n=a[s+t],i=n?r.fields.find(e=>e.id===n):void 0;!i||[`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(i.type)||(d[i.id]=be(e,i.type,i.options).value)}),l.set(n,{...c,updatedAt:new Date().toISOString(),values:d})}),I=null,B=`Pasted ${c.length} row${c.length===1?``:`s`}${ee?` (${ee} new)`:``}.`,X({...r,records:u.map(e=>l.get(e)).filter(Boolean)})}var li=[{value:`contains`,label:`contains`,needsValue:!0,needsSecond:!1},{value:`equals`,label:`is exactly`,needsValue:!0,needsSecond:!1},{value:`startsWith`,label:`starts with`,needsValue:!0,needsSecond:!1},{value:`endsWith`,label:`ends with`,needsValue:!0,needsSecond:!1},{value:`greaterThan`,label:`greater than`,needsValue:!0,needsSecond:!1},{value:`lessThan`,label:`less than`,needsValue:!0,needsSecond:!1},{value:`between`,label:`between`,needsValue:!0,needsSecond:!0},{value:`isEmpty`,label:`is empty`,needsValue:!1,needsSecond:!1},{value:`isNotEmpty`,label:`is not empty`,needsValue:!1,needsSecond:!1}];function ui(e){return K().fields.find(t=>t.id===e)?.name??`field`}function di(e){return li.find(t=>t.value===e)?.label??e}function fi(){let e=E.querySelector(`[data-find-match]`)?.value??`all`,t=[];E.querySelectorAll(`.find-rule`).forEach(e=>{let n=e.querySelector(`[data-find-field]`)?.value??``,r=e.querySelector(`[data-find-op]`)?.value??`contains`,i=e.querySelector(`[data-find-value]`)?.value??``,a=e.querySelector(`[data-find-value2]`)?.value??``;n&&t.push({fieldId:n,operator:r,value:i,value2:a})}),P={match:e,rules:t}}function pi(){fi(),N=P.rules.length?P:null,R=new Set,z=`none`;let e=q(K()).length;B=N?`Find is on: ${e} record${e===1?``:`s`} match.`:`Find cleared.`,$()}function mi(){let e=[];E.querySelectorAll(`.sort-level`).forEach(t=>{let n=t.querySelector(`[data-sort-level-field]`)?.value??``,r=t.querySelector(`[data-sort-level-dir]`)?.value??`asc`;n&&e.push({fieldId:n,direction:r})}),Mt=e}function hi(){mi(),M=Mt,z=`none`,B=M.length?`Sorting by ${M.map(e=>ui(e.fieldId)).join(`, `)}.`:`Sort cleared.`,$()}function gi(){return D.views??[]}function _i(){let e=E.querySelector(`[data-view-name]`)?.value.trim()||`View ${gi().length+1}`,t={id:y(`view`),name:e,tableId:O,mode:A,search:j,searchFieldId:jt,find:N,sortKeys:M};Y(`save view`),B=`Saved view: ${e}.`,J({...D,updatedAt:new Date().toISOString(),views:[...gi(),t]})}function vi(e){let t=gi().find(t=>t.id===e);t&&(D.schema.tables.some(e=>e.id===t.tableId)&&(O=t.tableId,pn(K())),A=t.mode,j=t.search,jt=t.searchFieldId,N=t.find,M=t.sortKeys,R=new Set,z=`none`,B=`Opened view: ${t.name}.`,$())}function yi(e){Y(`delete view`),B=`Deleted a saved view.`,J({...D,updatedAt:new Date().toISOString(),views:gi().filter(t=>t.id!==e)})}function bi(e){let t=new Set(e.records.map(e=>e.id));return[...F].filter(e=>t.has(e))}function xi(){let e=K(),t=new Set(bi(e));if(t.size===0)return;let n=e.records.filter(e=>!t.has(e.id));if(n.length===0){B=`Keep at least one record. Some rows were not deleted.`,$();return}window.confirm(`Delete ${t.size} selected record${t.size===1?``:`s`}? You can undo right after.`)&&(Y(`bulk delete`),F=new Set,B=`Deleted ${e.records.length-n.length} records.`,X({...e,records:n}))}function Si(){let e=K(),t=bi(e);if(t.length===0)return;Y(`bulk duplicate`);let n=t.reduce((e,t)=>Ce(e,t),e);F=new Set,B=`Duplicated ${t.length} record${t.length===1?``:`s`}.`,X(n)}function Ci(){let e=K(),t=new Set(bi(e)),n=E.querySelector(`[data-bulk-field]`)?.value??``,r=E.querySelector(`[data-bulk-value]`)?.value??``,i=e.fields.find(e=>e.id===n);if(!i||t.size===0){z=`none`,$();return}let a=be(r,i.type,i.options).value;Y(`bulk fill`);let o=e.records.map(e=>t.has(e.id)?{...e,updatedAt:new Date().toISOString(),values:{...e.values,[n]:a}}:e);z=`none`,B=`Filled ${i.name} for ${t.size} record${t.size===1?``:`s`}.`,X({...e,records:o})}function wi(e){let t=e.filter(e=>e.trim()!==``);return t.length===0?`text`:t.every(e=>!Number.isNaN(Number(e.replace(/[$,%\s]/g,``))))?`number`:t.every(e=>!Number.isNaN(new Date(e).getTime())&&/\d/.test(e))?`date`:t.every(e=>/^(yes|no|true|false)$/i.test(e.trim()))?`checkbox`:`text`}function Ti(){E.querySelectorAll(`.csv-map-row`).forEach((e,t)=>{L[t]&&(L[t].action=e.querySelector(`[data-map-action]`)?.value??`new`,L[t].type=e.querySelector(`[data-map-type]`)?.value??`text`,L[t].fieldId=e.querySelector(`[data-map-existing]`)?.value??``)})}E.addEventListener(`click`,e=>{let t=e.target,n=t.closest(`[data-action]`)?.dataset.action,r=t.closest(`[data-table-id]`)?.dataset.tableId,i=t.closest(`[data-template-id]`)?.dataset.templateId,a=t.closest(`[data-view-mode]`)?.dataset.viewMode,o=t.closest(`[data-select-record]`)?.dataset.selectRecord,s=t.closest(`[data-field-settings]`)?.dataset.fieldSettings,c=t.closest(`[data-record-action-id]`)?.dataset.recordActionId,l=t.closest(`[data-quality-field-id]`);if(r){O=r,fn(),M=[],F=new Set,I=null,pn(K()),$();return}if(i){Fn(i);return}if(a){A=a,$();return}if(o){k=o,A===`table`&&$();return}if(s){Zt=s,Nt=``,z=`field`,$();return}let u=t.closest(`[data-formula-insert]`)?.dataset.formulaInsert;if(u){let e=E.querySelector(`[data-field-formula]`);if(e){let t=e.selectionStart??e.value.length;e.value=e.value.slice(0,t)+u+e.value.slice(e.selectionEnd??t),e.focus()}return}if(l){let e=l.dataset.qualityFieldId,t=l.dataset.qualityKind;if(e&&t){let n=t===`duplicates`?mt(K(),e):ht(K(),e);R=new Set(n.map(e=>e.id));let r=K().fields.find(t=>t.id===e);B=`Highlighted ${n.length} ${t===`duplicates`?`duplicate`:`missing`} record${n.length===1?``:`s`} in ${r?.name??`this field`}.`,z=`none`,$();return}}if(n)if(xn(),n===`new`){if(!window.confirm(`Start a new database? Your current one is replaced here — export it first if you want to keep a copy. You can also undo right after.`))return;Y(`new database`);let e=he(`Untitled Database`);O=e.schema.tables[0].id,k=e.schema.tables[0].records[0]?.id??``,R=new Set,J(e)}else if(n===`save-json`)Cn();else if(n===`save-drive`){let e=JSON.stringify(D,null,2);te({appName:`ListSplat`,fileName:`${D.metadata.title||`listsplat-project`}.listsplat.json`,buildFile:()=>new Blob([e],{type:`application/json`})}).catch(e=>{B=e.message,$()})}else if(n===`open-json`)E.querySelector(`[data-open-json]`)?.click();else if(n===`import-csv`)E.querySelector(`[data-import-csv]`)?.click();else if(n===`export-csv`)wn();else if(n===`export-found-csv`)Tn();else if(n===`export-markdown`)On();else if(n===`export-report`)kn();else if(n===`project-packet`)An();else if(n===`print`)window.print();else if(n===`add-record`)Y(`add record`),X(ye(K()));else if(n===`add-field`){let e=E.querySelector(`[data-new-field]`),t=E.querySelector(`[data-new-field-type]`)?.value;Y(`add field`),X(ge(K(),e?.value||`New Field`,t??`text`))}else if(n===`add-table`){let e=window.prompt(`New table name?`,`New Table`)??``;Y(`add table`);let t=Ee(D,e);O=t.schema.tables.at(-1)?.id??O,k=K().records[0]?.id??``,J(t)}else if(n===`duplicate-record`&&c)Y(`duplicate record`),X(Ce(K(),c));else if(n===`delete-record`&&c){if(K().records.length<=1){B=`Keep at least one record. Add another before deleting this one.`,$();return}if(!window.confirm(`Delete this record? You can undo right after with Ctrl+Z.`))return;Y(`delete record`),X(we(K(),c))}else if(n===`toggle-sort`){if(M.length)M=[{...M[0],direction:M[0].direction===`asc`?`desc`:`asc`},...M.slice(1)];else{let e=K().fields[0];e&&(M=[{fieldId:e.id,direction:`asc`}])}$()}else if(n===`sort`||n===`sort-dialog`)Mt=M.length?M.map(e=>({...e})):[{fieldId:K().fields[0]?.id??``,direction:`asc`}],z=`sort`,$();else if(n===`find`)P=N?{match:N.match,rules:N.rules.map(e=>({...e}))}:{match:`all`,rules:[{fieldId:K().fields[0]?.id??``,operator:`contains`,value:``}]},z=`find`,$();else if(n===`views`)z=`views`,$();else if(n===`sort-add-level`)mi(),Mt.push({fieldId:K().fields[0]?.id??``,direction:`asc`}),$();else if(n===`sort-remove-level`){mi();let e=Number(t.closest(`[data-level-index]`)?.dataset.levelIndex??`-1`);e>=0&&Mt.splice(e,1),$()}else if(n===`sort-toggle`){let e=t.closest(`[data-sort-toggle]`)?.dataset.sortToggle;if(e){let t=M.find(t=>t.fieldId===e);M=[{fieldId:e,direction:t&&t.direction===`asc`?`desc`:`asc`}],$()}}else if(n===`apply-sort`)hi();else if(n===`clear-sort`)mi(),Mt=[],$();else if(n===`find-add-rule`)fi(),P.rules.push({fieldId:K().fields[0]?.id??``,operator:`contains`,value:``}),$();else if(n===`find-remove-rule`){fi();let e=Number(t.closest(`[data-rule-index]`)?.dataset.ruleIndex??`-1`);e>=0&&P.rules.splice(e,1),$()}else if(n===`apply-find`)pi();else if(n===`save-view`)_i();else if(n===`apply-view`){let e=t.closest(`[data-view-id]`)?.dataset.viewId;e&&vi(e)}else if(n===`delete-view`){let e=t.closest(`[data-view-id]`)?.dataset.viewId;e&&yi(e)}else if(n===`bulk-delete`)xi();else if(n===`bulk-duplicate`)Si();else if(n===`bulk-fill`)bi(K()).length&&(z=`bulkFill`,$());else if(n===`apply-bulk-fill`)Ci();else if(n===`bulk-clear`)F=new Set,$();else if(n===`expand-record`&&c)k=c,A=`form`,$();else if(n===`camera-capture`){let e=t.closest(`[data-record-id]`)?.dataset.recordId,n=t.closest(`[data-field-id]`)?.dataset.fieldId;e&&n&&(qt={recordId:e,fieldId:n},z=`camera`,$(),Ur())}else if(n===`camera-shoot`)Gr();else if(n===`record-audio`){let e=t.closest(`[data-record-id]`)?.dataset.recordId,n=t.closest(`[data-field-id]`)?.dataset.fieldId;e&&n&&Hr(e,n)}else if(n===`add-comment`){let e=E.querySelector(`[data-comment-text]`)?.value.trim()??``,t=E.querySelector(`[data-comment-teacher]`)?.checked??!1;e&&yn(n=>({...n,comments:[...n.comments??[],{id:y(`comment`),author:er(),text:e,at:new Date().toISOString(),teacherOnly:t}]}),`add comment`)}else if(n===`delete-comment`){let e=t.closest(`[data-comment-id]`)?.dataset.commentId;e&&yn(t=>({...t,comments:(t.comments??[]).filter(t=>t.id!==e)}),`delete comment`)}else if(n===`save-version`)yn(e=>({...e,history:[...e.history??[],{at:new Date().toISOString(),values:{...e.values}}].slice(-20)}),`save version`),B=`Saved a version snapshot.`;else if(n===`restore-version`){let e=Number(t.closest(`[data-version-index]`)?.dataset.versionIndex??`-1`);yn(t=>{let n=(t.history??[])[e];return n?{...t,updatedAt:new Date().toISOString(),values:{...t.values,...n.values}}:t},`restore version`),B=`Restored an earlier version.`}else if(n===`edit-rubric`)Pt=(D.rubricCriteria??[]).map(e=>({...e})),Pt.length||(Pt=[{id:y(`crit`),label:`Ideas`,max:4}]),z=`rubric`,$();else if(n===`rubric-add`)bn(),Pt.push({id:y(`crit`),label:`New criterion`,max:4}),$();else if(n===`rubric-remove`){bn();let e=Number(t.closest(`[data-crit-index]`)?.dataset.critIndex??`-1`);e>=0&&Pt.splice(e,1),$()}else if(n===`save-rubric`)bn(),Y(`rubric`),z=`none`,B=`Saved the rubric.`,J({...D,updatedAt:new Date().toISOString(),rubricCriteria:Pt});else if(n===`open-related`){let e=t.closest(`[data-rel-table]`)?.dataset.relTable,n=t.closest(`[data-rel-record]`)?.dataset.relRecord;e&&n&&(O=e,k=n,fn(),M=[],A=`form`,$())}else if(n===`add-related`){let e=t.closest(`[data-rel-id]`)?.dataset.relId,n=D.schema.relationships.find(t=>t.id===e),r=K().records.find(e=>e.id===k),i=n?D.schema.tables.find(e=>e.id===n.toTableId):void 0;if(n&&r&&i){Y(`add related record`);let e=r.values[n.fromFieldId]??``,t=b(i.fields,{[n.toFieldId]:e}),a=x(D,{...i,records:[...i.records,t]});O=i.id,k=t.id,fn(),M=[],A=`form`,B=`Added a ${i.name} record linked to ${Yn(K(),r)}.`,J(a)}}else if(n===`cal-prev`)mr(-1),$();else if(n===`cal-next`)mr(1),$();else if(n===`cal-today`)zt=``,$();else if(n===`bulk-archive`||n===`bulk-restore`){let e=n===`bulk-archive`,t=new Set(bi(K()));if(t.size){Y(e?`archive records`:`restore records`);let n=K();F=new Set,B=`${e?`Archived`:`Restored`} ${t.size} record${t.size===1?``:`s`}.`,X({...n,records:n.records.map(n=>t.has(n.id)?{...n,archived:e}:n)})}}else if(n===`toggle-archived`)Ft=!Ft,F=new Set,B=Ft?`Showing archived records.`:`Showing active records.`,$();else if(n===`rename-table`){let e=K(),t=window.prompt(`Rename table`,e.name);t&&t.trim()&&(Y(`rename table`),J(De(D,e.id,t)))}else if(n===`duplicate-table`){Y(`duplicate table`);let e=Oe(D,O);O=e.newTableId,fn(),M=[],F=new Set,B=`Duplicated the table.`,J(e.project)}else if(n===`move-table-left`||n===`move-table-right`)Y(`move table`),J(ke(D,O,n===`move-table-left`?-1:1));else if(n===`delete-table`){if(D.schema.tables.length<=1){B=`A database needs at least one table.`,$();return}if(window.confirm(`Delete the table "${K().name}" and all its records? You can undo right after.`)){Y(`delete table`);let e=Ae(D,O);O=e.schema.tables[0].id,fn(),M=[],F=new Set,B=`Deleted the table.`,J(e)}}else if(n===`structure-copy`)Cn(je(D)),B=`Saved a structure-only copy (no records).`,$();else if(n===`highlight-invalid`){let e=St(K());R=new Set(e.map(e=>e.record.id)),z=`none`,B=`Highlighted ${R.size} record${R.size===1?``:`s`} with rule problems.`,$()}else if(n===`duplicates`){let e=jt===`all`?K().fields[0]?.id:jt;R=new Set(mt(K(),e).map(e=>e.id)),B=`Found ${R.size} duplicate record${R.size===1?``:`s`}.`,$()}else if(n===`missing`){let e=jt===`all`?K().fields[0]?.id:jt;R=new Set(ht(K(),e).map(e=>e.id)),B=`Found ${R.size} record${R.size===1?``:`s`} with missing values.`,$()}else if(n===`clear-find`)fn(),B=`Showing all records.`,$();else if(n===`replace`)H=[],z=`replace`,$();else if(n===`preview-replace`)Yr();else if(n===`run-replace`)Jr();else if(n===`save-teacher-notes`)Xr();else if(n===`apply-csv-new`)Pn(`new`);else if(n===`apply-csv-append`)Pn(`append`);else if(n===`save-field-settings`)Y(`field settings`),qr();else if(n===`layout-designer`||n===`lock-layout`)z=`layout`,$();else if(n===`layout-field-up`||n===`layout-field-down`){let e=t.closest(`[data-layout-field-id]`)?.dataset.layoutFieldId,r=zn();if(e&&r){let t=Vn(K()).map(e=>e.id),r=t.indexOf(e),i=n===`layout-field-up`?r-1:r+1;r>=0&&i>=0&&i<t.length&&([t[r],t[i]]=[t[i],t[r]],Y(`layout order`),z=`layout`,Jn({fieldOrder:t}))}}else if(n===`save-layout-settings`){let e=E.querySelector(`[data-layout-locked]`)?.checked??!1,t=new Set([...E.querySelectorAll(`[data-layout-field-visible]:checked`)].map(e=>e.dataset.layoutFieldVisible??``)),n=Vn(K()).map(e=>e.id),r=n.filter(e=>!t.has(e));Y(`layout settings`),z=`none`,Jn({locked:e,fieldOrder:n,hiddenFieldIds:r})}else if(n===`create-relationship`)Qr();else if(n===`undo-change`)_n();else if(n===`redo-change`)vn();else if(n===`close-dialog`)z===`camera`&&(Wr(),qt=null),z=`none`,H=[],U=null,$();else if(n.endsWith(`-view`))A=n.replace(`-view`,``),$();else if(n===`templates`)B=`Template starters are in the Teacher panel.`,$();else if(n===`student-view`)Y(`student view toggle`),B=D.teacher.studentView?`Teacher tools are visible again.`:`Student view is on.`,J({...D,updatedAt:new Date().toISOString(),teacher:{...D.teacher,studentView:!D.teacher.studentView}});else if(n===`project-ideas`)z=`projectIdeas`,$();else if(n===`relationships`)z=`relationship`,$();else if(n===`charts`)Ut||=K().fields.find(e=>!e.hidden&&![`image`,`longText`,`calculation`].includes(e.type))?.id??``,z=`charts`,$();else if(n===`maintenance`)z=`maintenance`,$();else if(n===`accessibility`)z=`accessibility`,$();else if(n===`guided`)z=`guided`,$();else if(n===`share-html`)Dn();else if(n===`remove-duplicates`){Y(`remove duplicates`);let e=K().records.length,t=Pe(K());z=`none`,B=`Removed ${e-t.records.length} duplicate record${e-t.records.length===1?``:`s`}.`,X(t)}else if(n===`remove-broken`)Y(`remove broken relationships`),z=`none`,B=`Removed broken relationships.`,J(Le(D));else if(n===`duplicate-project`)Cn({...D,metadata:{...D.metadata,title:`${D.metadata.title} copy`}}),B=`Saved a copy of the whole project.`,$();else if(n===`guided-create`){let e=t.closest(`[data-guided-kind]`)?.dataset.guidedKind,n=Pr.find(t=>t.id===e);if(n){let e=E.querySelector(`[data-guided-name]`)?.value.trim()||n.label;Y(`guided build`);let t=Ee(D,e),r=t.schema.tables.at(-1).id,i=t.schema.tables.find(e=>e.id===r);i={...i,fields:[],records:[]},n.fields.forEach(([e,t])=>{i=ge(i,e,t)}),i={...i,records:[b(i.fields)]},t=x(t,i),O=r,k=i.records[0].id,fn(),M=[],z=`none`,A=`table`,B=`Built the "${e}" table. Add records and adjust fields any time.`,J(t)}}else n===`functions`?(z=`functions`,$()):n===`quality`?(z=`quality`,$()):n===`teacher-notes`?(z=`teacherNotes`,$()):n.startsWith(`help-`)?(z=`help`,$()):(B=`That ListSplatTM control is not available in this workspace.`,$())}),E.addEventListener(`change`,e=>{let t=e.target;if(t.matches(`#languageSwitcher`)&&t instanceof HTMLSelectElement){an=on(t.value);try{localStorage.setItem(Et,an)}catch{}$()}else if(t.matches(`[data-open-json]`)&&t instanceof HTMLInputElement&&t.files?.[0])jn(t.files[0]),t.value=``;else if(t.matches(`[data-import-csv]`)&&t instanceof HTMLInputElement&&t.files?.[0])jn(t.files[0]),t.value=``;else if(t.matches(`[data-search-field]`))jt=t.value,R=new Set,$();else if(t.matches(`[data-sort-field]`)){let e=M[0]?.direction??`asc`;M=t.value?[{fieldId:t.value,direction:e}]:[],$()}else if(t.matches(`[data-group-field]`))It=t.value,$();else if(t.matches(`[data-board-field]`))Lt=t.value,$();else if(t.matches(`[data-calendar-field]`))Rt=t.value,$();else if(t.matches(`[data-wrap-toggle]`)&&t instanceof HTMLInputElement)Bt=t.checked,$();else if(t.matches(`[data-chart-type]`))Ht=t.value,$();else if(t.matches(`[data-chart-category]`))Ut=t.value,$();else if(t.matches(`[data-chart-value-mode]`))Wt=t.value,$();else if(t.matches(`[data-chart-value-field]`))Gt=t.value,$();else if(t.matches(`[data-rubric-criterion]`)&&t instanceof HTMLInputElement){let e=t.dataset.rubricCriterion??``,n=t.value===``?void 0:Number(t.value);yn(t=>{let r={...t.rubricScores??{}};return n==null||Number.isNaN(n)?delete r[e]:r[e]=n,{...t,rubricScores:r}},`rubric score`)}else if(t.matches(`[data-select-all]`)&&t instanceof HTMLInputElement){let e=q(K()).map(e=>e.id);F=t.checked?new Set(e):new Set,$()}else if(t.matches(`[data-select-row]`)&&t instanceof HTMLInputElement){let e=t.dataset.selectRow??``;t.checked?F.add(e):F.delete(e),$()}else if(t.matches(`[data-field-type]`))Nt=t.value,$();else if(t.matches(`[data-find-op]`))fi(),$();else if(t.matches(`[data-map-action]`))Ti(),$();else if(t.matches(`[data-csv-key]`))Ti(),Yt=t.value,$();else if(t.matches(`[data-csv-dup]`))Ti(),Xt=t.value,$();else if(t.matches(`[data-relationship-from-table], [data-relationship-to-table]`))$r();else if(t.matches(`.file-input`)&&t instanceof HTMLInputElement&&t.files?.[0]){let e=t.dataset.recordId,n=t.dataset.fieldId;e&&n&&Vr(e,n,t.files[0])}else if(t.matches(`.multi-option`)&&t instanceof HTMLInputElement){let e=t.closest(`.multi-cell`),n=t.dataset.recordId,r=t.dataset.fieldId;if(e&&n&&r){let t=Array.from(e.querySelectorAll(`.multi-option:checked`)).map(e=>e.dataset.multiOption??``);mn(n,r),D=x(D,Te(K(),n,r,t.join(`, `))),Ge(D),$()}}else if(t.matches(`.cell-input, .cell-checkbox, .image-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement))if(t instanceof HTMLInputElement&&t.type===`file`&&t.files?.[0]){let e=t.dataset.recordId,n=t.dataset.fieldId,r=t.files[0];e&&n&&Kr(e,n,r,`image upload`)}else t.dataset.recordId&&t.dataset.fieldId&&mn(t.dataset.recordId,t.dataset.fieldId),Rr(t)}),E.addEventListener(`paste`,e=>{let t=e.target,n=t.closest(`.image-cell`);if(n){let t=n.dataset.recordId,r=n.dataset.fieldId,i=Array.from(e.clipboardData?.items??[]).find(e=>e.type.startsWith(`image/`))?.getAsFile();t&&r&&i&&(e.preventDefault(),Kr(t,r,i,`image paste`));return}let r=t.closest(`.cell-input`);if(!r||!r.closest(`.data-grid`)||!r.dataset.recordId||!r.dataset.fieldId)return;let i=e.clipboardData?.getData(`text/plain`)??``;/[\t\n]/.test(i.replace(/\n$/,``))&&(e.preventDefault(),ci(i,r.dataset.recordId,r.dataset.fieldId))}),E.addEventListener(`input`,e=>{let t=e.target;if(t.matches(`[data-project-title]`)){Sn(t.value);return}if(t.matches(`[data-search]`)){j=t.value,R=new Set,$();return}t.matches(`.cell-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)&&(t.dataset.recordId&&t.dataset.fieldId&&mn(t.dataset.recordId,t.dataset.fieldId),Rr(t))}),E.addEventListener(`focusout`,e=>{e.target.matches?.(`.cell-input, .cell-checkbox`)&&($t=``)}),E.addEventListener(`mousedown`,e=>{let t=e.target.closest(`[data-record-id][data-field-id]`);if(!t||!t.closest(`.data-grid`)||!t.dataset.recordId||!t.dataset.fieldId)return;let n={r:t.dataset.recordId,f:t.dataset.fieldId};e.shiftKey&&I?(e.preventDefault(),I={anchor:I.anchor,focus:n}):I={anchor:n,focus:n},ai()}),E.addEventListener(`pointerdown`,e=>{let t=e.target.closest(`[data-col-resize]`);if(!t)return;e.preventDefault(),e.stopPropagation();let n=t.dataset.colResize??``,r=t.closest(`th`);if(!r)return;r.setAttribute(`draggable`,`false`);let i=e.clientX,a=r.getBoundingClientRect().width,o=Math.round(a),s=e=>{o=Math.max(80,Math.round(a+(e.clientX-i))),r.style.width=`${o}px`,r.style.minWidth=`${o}px`},c=()=>{document.removeEventListener(`pointermove`,s),document.removeEventListener(`pointerup`,c),r.setAttribute(`draggable`,`true`);let e=zn();e&&(Y(`resize column`),Jn({columnWidths:{...e.columnWidths??{},[n]:o}}))};document.addEventListener(`pointermove`,s),document.addEventListener(`pointerup`,c)});var Ei=null;E.addEventListener(`dragstart`,e=>{let t=e.target,n=t.closest(`.kanban-card[data-kanban-card]`);if(n){Vt=n.dataset.kanbanCard??null,e.dataTransfer?.setData(`text/plain`,Vt??``);return}if(t.closest(`[data-col-resize]`))return;let r=t.closest(`.col-head[data-col-field]`);r&&(Ei=r.dataset.colField??null,e.dataTransfer?.setData(`text/plain`,Ei??``))}),E.addEventListener(`dragover`,e=>{let t=e.target;(Ei&&t.closest(`.col-head[data-col-field]`)||Vt&&t.closest(`.kanban-col`))&&e.preventDefault()}),E.addEventListener(`drop`,e=>{let t=e.target.closest(`.kanban-col`);if(t&&Vt&&Lt){e.preventDefault();let n=Vt;Vt=null;let r=t.dataset.kanbanCol??``;Y(`move card`),D=x(D,Te(K(),n,Lt,r)),Ge(D),B=`Moved card to ${r||`Unassigned`}.`,$();return}let n=e.target.closest(`.col-head[data-col-field]`);if(!n||!Ei)return;e.preventDefault();let r=n.dataset.colField??``,i=Ei;if(Ei=null,!r||r===i)return;let a=Vn(K()).map(e=>e.id),o=a.indexOf(i),s=a.indexOf(r);o<0||s<0||(a.splice(s,0,a.splice(o,1)[0]),Y(`reorder columns`),Jn({fieldOrder:a}))}),E.addEventListener(`keydown`,e=>{let t=e.target;if(!t.matches?.(`.cell-input, .cell-checkbox`))return;let n=t.dataset.recordId,r=t.dataset.fieldId;if(!n||!r)return;let i=t instanceof HTMLTextAreaElement,a=t instanceof HTMLSelectElement;if(e.shiftKey&&[`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`].includes(e.key)&&!i&&!a){I||={anchor:{r:n,f:r},focus:{r:n,f:r}},e.preventDefault(),oi(e.key);return}if(e.key===`Escape`&&I){I=null,ai();return}switch(e.key){case`Enter`:i||(e.preventDefault(),ri(n,r,e.shiftKey?-1:1,0));break;case`ArrowDown`:!i&&!a&&(e.preventDefault(),ri(n,r,1,0));break;case`ArrowUp`:!i&&!a&&(e.preventDefault(),ri(n,r,-1,0));break;case`Tab`:e.preventDefault(),ri(n,r,0,e.shiftKey?-1:1);break;default:break}}),document.addEventListener(`keydown`,e=>{if(!(e.ctrlKey||e.metaKey))return;let t=e.key.toLowerCase();if(t===`c`){si()&&e.preventDefault();return}t===`z`&&!e.shiftKey?(e.preventDefault(),_n()):t===`y`||t===`z`&&e.shiftKey?(e.preventDefault(),vn()):t===`s`&&(e.preventDefault(),Cn(),B=`Saved a .listsplat.json file to your downloads.`,$())}),document.addEventListener(`click`,e=>{e.target.closest(`.menu`)||xn()}),document.addEventListener(`toggle`,e=>{let t=e.target;!(t instanceof HTMLDetailsElement)||!t.matches(`.menu`)||!t.open||document.querySelectorAll(`.menu[open]`).forEach(e=>{e!==t&&(e.open=!1)})},!0),$(),ue(`listsplat`).then(e=>{e&&jn(e)}).catch(e=>window.alert(e.message||String(e)));