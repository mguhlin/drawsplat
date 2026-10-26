(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`https://www.googleapis.com/auth/drive.file`,t=null;function n(){if(window.SplatPrivacy?.getState().optionalConnections===!1)throw Error(`External connections are off. Enable them in Privacy before using Google Drive.`);if(navigator.onLine===!1)throw Error(`Google Drive needs an internet connection. You can still save to your device.`)}function r(){return n(),window.google?.accounts?.oauth2?Promise.resolve():t||(t=new Promise((e,n)=>{let r=document.createElement(`script`),i=()=>{clearTimeout(a),r.remove(),t=null,n(Error(`Google sign-in could not load. Check your connection and try again.`))},a=setTimeout(i,15e3);r.src=`https://accounts.google.com/gsi/client`,r.async=!0,r.onerror=i,r.onload=()=>{clearTimeout(a),window.google?.accounts?.oauth2?e():i()},document.head.append(r)}),t)}function i(t,r){return n(),new Promise((n,i)=>{let a=!1,o=(e,t)=>{a||(a=!0,clearTimeout(c),r.removeEventListener(`abort`,s),e?i(e):n(t))},s=()=>o(new DOMException(`Cancelled`,`AbortError`)),c=setTimeout(()=>o(Error(`Google sign-in timed out. Try again.`)),12e4);if(r.addEventListener(`abort`,s,{once:!0}),r.aborted){s();return}try{let n=window.google.accounts.oauth2;n.initTokenClient({client_id:t,scope:e,include_granted_scopes:!1,callback(t){if(t.error||!t.access_token){o(Error(`Google Drive permission was not granted. Your local work is unchanged.`));return}if(n.hasGrantedAllScopes&&!n.hasGrantedAllScopes(t,e)||t.scope&&!t.scope.split(/\s+/).includes(e)){o(Error(`Allow access to the files you use with this app to continue.`));return}o(null,t.access_token)},error_callback(){o(Error(`Google sign-in was closed or blocked. Allow the popup and try again.`))}}).requestAccessToken({prompt:`select_account`})}catch(e){o(e)}})}function a(t,r){return n(),typeof BroadcastChannel==`function`?new Promise((i,a)=>{let o=crypto.randomUUID(),s=new BroadcastChannel(`splat-drive-`+o),c=!1,l=(e,t)=>{c||(c=!0,s.postMessage({type:`close`}),s.close(),clearTimeout(d),r.removeEventListener(`abort`,u),e?a(e):i(t))},u=()=>l(new DOMException(`Cancelled`,`AbortError`)),d=setTimeout(()=>l(Error(`Google authorization timed out. Close the authorization window and try again.`)),12e4);if(r.addEventListener(`abort`,u,{once:!0}),r.aborted){u();return}s.onmessage=({data:r})=>{if(!(!r||c)&&(r.type===`ready`&&s.postMessage({type:`configure`,clientId:t}),r.type===`cancel`&&u(),r.type===`error`&&l(Error(`Google authorization was not completed. Your local work is preserved.`)),r.type===`token`&&typeof r.accessToken==`string`&&r.accessToken&&r.scope===e))try{n(),l(null,r.accessToken)}catch(e){l(e)}};try{let e=new URL(`../../splatworks/shared/google-drive-auth.html`,location.href);e.hash=o,window.open(e.href,`_blank`,`popup,width=540,height=620`)||l(Error(`The authorization window was blocked. Allow popups and try again.`))}catch(e){l(e)}}):Promise.reject(Error(`This browser cannot open the authorization window. Save to your device instead.`))}var o=`31274545407-l338d2doafet21gv8u4qmq2jk3j03jq3.apps.googleusercontent.com`,s=null;function c(e){return e||document.querySelector(`meta[name="google-drive-client-id"]`)?.content||(/^(splatworks\.org|drawsplat\.org)$/.test(location.hostname)?o:``)}async function l(e,t,r,i){n();let a=await fetch(e,{...t,signal:i,redirect:`error`,headers:{...t.headers,Authorization:`Bearer `+r}});if(!a.ok&&a.status!==308)throw a.status===401?Error(`Google authorization expired. Choose Save or Open again to sign in.`):a.status===403?Error(`Google Drive denied this action. Check your account permissions and school Workspace policy.`):Error(`Google Drive could not complete this action (`+a.status+`). Your local work is unchanged.`);return a}function u(e){if(typeof e!=`string`||!/^[\w-]+$/.test(e))throw Error(`Google Drive did not return a usable file. Try saving again.`);return e}async function d(e,t,n,r){if(!(e instanceof Blob))throw Error(`The project file could not be prepared. Save a local copy and try again.`);let i=e.type||`application/octet-stream`,a=JSON.stringify({name:t,mimeType:i}),o;if(e.size<=5*1024*1024){let t=`splatworks-`+crypto.randomUUID();o=await l(`https://www.googleapis.com/upload/drive/v3/files?fields=id&uploadType=multipart`,{method:`POST`,body:new Blob([`--`+t+`\r
Content-Type: application/json; charset=UTF-8\r
\r
`,a,`\r
--`+t+`\r
Content-Type: `+i+`\r
\r
`,e,`\r
--`+t+`--\r
`]),headers:{"Content-Type":`multipart/related; boundary=`+t}},n,r)}else{let t=(await l(`https://www.googleapis.com/upload/drive/v3/files?fields=id&uploadType=resumable`,{method:`POST`,body:a,headers:{"Content-Type":`application/json; charset=UTF-8`,"X-Upload-Content-Type":i,"X-Upload-Content-Length":String(e.size)}},n,r)).headers.get(`Location`);if(!t)throw Error(`Google Drive did not start the upload. Try again.`);let s=new URL(t);if(s.origin!==`https://www.googleapis.com`||s.pathname!==`/upload/drive/v3/files`)throw Error(`Google Drive returned an unexpected upload address.`);o=await l(s.href,{method:`PUT`,body:e,headers:{"Content-Type":i}},n,r)}let s=u((await o.json()).id);return{id:s,name:t,webViewLink:`https://drive.google.com/file/d/`+s+`/view`}}function ee(){if(document.getElementById(`splat-drive-styles`))return;let e=document.createElement(`style`);e.id=`splat-drive-styles`,e.textContent=`.splat-drive-dialog{box-sizing:border-box;width:min(32rem,calc(100vw - 2rem));max-height:calc(100dvh - 2rem);overflow:auto;margin:auto;padding:1.5rem;border:1px solid #cbd5e1;border-radius:1rem;background:#fff;color:#172036;font:16px/1.5 system-ui,sans-serif;box-shadow:0 24px 80px #0004;z-index:2147483647}.splat-drive-dialog::backdrop{background:#10172a99}.splat-drive-dialog h2{margin:0 0 .8rem;font-size:1.4rem;color:#172036}.splat-drive-dialog p{margin:.7rem 0}.splat-drive-dialog label{display:block;font-weight:650}.splat-drive-dialog input{box-sizing:border-box;display:block;width:100%;margin:.4rem 0;padding:.65rem;border:1px solid #94a3b8;border-radius:.5rem;background:#fff;color:#172036;font:inherit}.splat-drive-dialog button,.splat-drive-dialog a{font:inherit}.splat-drive-dialog button{padding:.65rem 1rem;border:1px solid #aab4c5;border-radius:.5rem;background:#f3f5fa;color:#172036;cursor:pointer}.splat-drive-dialog button[type=submit]{background:#5b21b6;border-color:#5b21b6;color:#fff}.splat-drive-dialog button:disabled{opacity:.55;cursor:wait}.splat-drive-dialog :focus-visible{outline:3px solid #d97706;outline-offset:3px}.splat-drive-dialog a{color:#5b21b6;text-decoration:underline}.splat-drive-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:.6rem;margin-top:1rem}.splat-drive-status{min-height:1.5em;overflow-wrap:anywhere}.splat-drive-dialog [hidden]{display:none!important}`,document.head.append(e)}function f(e,t){if(s)return Promise.reject(Error(`A Google Drive window is already open.`));ee();let o=document.activeElement,f=document.createElement(`dialog`);f.className=`splat-drive-dialog`,f.setAttribute(`aria-label`,t===`save`?`Save to Google Drive`:t===`open`?`Open from Google Drive`:`Connect Google Drive`),f.innerHTML=`<h2></h2><p class="splat-drive-note"></p><form><label>File name<input name="filename" maxlength="180" required></label><p class="splat-drive-status" role="status" aria-live="polite"></p><p class="splat-drive-result" hidden><a target="_blank" rel="noopener noreferrer">Open in Google Drive</a></p><div class="splat-drive-actions"><button type="button" data-close>Cancel</button><button type="submit" disabled></button></div></form>`;let te=f.querySelector(`form`),p=te.elements.filename,m=te.querySelector(`[type=submit]`),ne=te.querySelector(`[data-close]`),h=f.querySelector(`[role=status]`),re=f.querySelector(`.splat-drive-result`),ie=t===`save`?`Save to Google Drive`:t===`open`?`Open from Google Drive`:`Connect Google Drive`;if(f.querySelector(`h2`).textContent=ie,f.querySelector(`.splat-drive-note`).textContent=t===`save`?e.appName+` saves a new file copy to the Google account you choose. Local work stays here. Sharing is not enabled; manage access in Drive. You can download the file from Drive later.`:`Choose your Google account to `+(t===`open`?`reopen the last `+e.appName+` file saved from this browser.`:`connect `+e.appName+`.`)+` Access is limited to files you use with this app.`,e.note){let t=document.createElement(`p`);t.textContent=e.note,f.querySelector(`form`).before(t)}p.value=e.fileName||`project.json`,p.parentElement.hidden=t!==`save`,m.textContent=ie,document.body.append(f),s=f,f.showModal();let g,_=!1,v=null,ae=new Promise(e=>{f.addEventListener(`close`,()=>{_=!0,g?.abort(),s=null,f.remove(),o instanceof HTMLElement&&o.isConnected&&o.focus(),e(v)},{once:!0})});ne.onclick=()=>f.close();let oe=c(e.clientId),se=e.authorizationWindow===!0||window.crossOriginIsolated===!0;try{if(n(),location.protocol!==`https:`&&!/^(localhost|127\.0\.0\.1)$/.test(location.hostname))throw Error(`Google Drive needs a hosted HTTPS site. Save to your device here.`);if(!oe)throw Error(`This site needs Google Drive setup. Ask your administrator to configure a Google OAuth client. Local saving is available.`);h.textContent=`Loading Google sign-in…`,(se?Promise.resolve():r()).then(()=>{_||(n(),h.textContent=`Choose `+ie+` to sign in and authorize this file transfer.`,m.disabled=!1)}).catch(e=>{_||(h.textContent=e.message)})}catch(e){h.textContent=e.message}return te.onsubmit=async r=>{if(r.preventDefault(),m.disabled||_)return;let o=p.value.replace(/[\x00-\x1f/\\]/g,`-`).trim(),s=e.fileName?.match(/(?:\.(?:grid|show|write|list|video)splat\.json|\.drawsplat-cmap\.json|\.[a-z0-9]{1,12})$/i)?.[0];if(o&&s&&!o.toLowerCase().endsWith(s.toLowerCase())&&(o+=s),t===`save`&&!o){p.focus();return}m.disabled=!0,p.disabled=!0,g=new AbortController;let c;try{h.textContent=`Choose your Google account and allow file access…`;let r=await(se?a(oe,g.signal):i(oe,g.signal));if(_)return;if(n(),c=setTimeout(()=>g.abort(),18e4),t===`save`){h.textContent=`Preparing your file…`;let t=await e.buildFile();if(!(t instanceof Blob))throw Error(`The file could not be prepared. Save a local copy and try again.`);clearTimeout(c);let n=Math.min(18e5,Math.max(18e4,Math.ceil(t.size/(256*1024))*1e3+6e4));if(c=setTimeout(()=>g.abort(),n),h.textContent=`Uploading `+o+` (`+(t.size/1048576).toFixed(1)+` MB). Keep this tab open…`,v=await d(t,o,r,g.signal),_)return;re.querySelector(`a`).href=v.webViewLink,re.hidden=!1,h.textContent=`Saved `+o+` to Google Drive. Local work is preserved.`,ne.textContent=`Done`,m.hidden=!0}else t===`open`?(h.textContent=`Opening your project…`,v=await(await l(`https://www.googleapis.com/drive/v3/files/`+u(e.fileId)+`?alt=media`,{method:`GET`},r,g.signal)).blob(),f.close()):(v=!0,f.close())}catch(e){_||(v=null,h.textContent=e.name===`AbortError`?`The transfer stopped. Check Drive before retrying. Your local work is preserved.`:e.message,m.disabled=!1,p.disabled=!1)}finally{clearTimeout(c)}},ae}function te(e){return f(e,`save`)}var p={writesplat:`WriteSplat`,showsplat:`ShowSplat`,gridsplat:`GridSplat`,listsplat:`ListSplat`,layoutsplat:`LayoutSplat`},m={writesplat:[`doc`,`docx`,`odt`,`txt`,`text`,`md`,`markdown`,`html`,`htm`,`json`],showsplat:[`pptx`,`odp`,`pdf`,`html`,`htm`,`md`,`markdown`,`json`],gridsplat:[`xlsx`,`ods`,`csv`,`tsv`,`md`,`markdown`,`json`],listsplat:[`csv`,`tsv`,`json`],layoutsplat:[`layoutsplat`,`epub`,`json`]},ne=600*1e3,h=`open-file`,re=()=>`drawsplat.imported-tab.`+location.pathname,ie;typeof location<`u`&&(ie=new URL(location.href).searchParams.get(h));function g(){return typeof window>`u`?!1:ie?(sessionStorage.setItem(re(),`1`),!0):sessionStorage.getItem(re())===`1`}function _(){return g()?window.sessionStorage:window.localStorage}function v(e){let t=String(e).toLowerCase();for(let e of Object.keys(p))if(t.endsWith(`.`+e+`.json`))return e;let n=t.split(`.`).pop();return[`layoutsplat`,`epub`].includes(n)?`layoutsplat`:[`doc`,`docx`,`odt`].includes(n)?`writesplat`:[`pptx`,`odp`].includes(n)?`showsplat`:[`xlsx`,`ods`].includes(n)?`gridsplat`:null}function ae(e){return e?.app===`LayoutSplat`&&Array.isArray(e?.pages)&&e?.stories?`layoutsplat`:Array.isArray(e?.slides)?`showsplat`:e?.document&&e?.teacher?`writesplat`:Array.isArray(e?.sheets)?`gridsplat`:Array.isArray(e?.schema?.tables)?`listsplat`:null}async function oe(e,t){let n=e.name.toLowerCase().split(`.`).pop();if(!m[t]?.includes(n)){let n=v(e.name);throw Error(n?`Open ${e.name} in ${p[n]}.`:`${p[t]} cannot open this file type. Use ${m[t].map(e=>`.`+e).join(`, `)}. For older Office files, save a current DOCX, XLSX, PPTX, or CSV copy first.`)}if(e.size>2e7)throw Error(`File imports are limited to 20 MB.`);if(![`doc`,`docx`,`odt`,`pptx`,`odp`,`xlsx`,`ods`,`pdf`,`layoutsplat`,`epub`].includes(n)){let t=new Uint8Array(await e.slice(0,512).arrayBuffer());if(t.includes(0)||t[0]===80&&t[1]===75&&t[2]===3&&t[3]===4)throw Error(`This looks like a binary file with a text filename. Use its original Office extension, or export text/CSV as UTF-8.`)}}function se(){return new Promise((e,t)=>{let n=indexedDB.open(`drawsplat-file-transfers`,1);n.onupgradeneeded=()=>n.result.createObjectStore(`files`,{keyPath:`id`}),n.onsuccess=()=>e(n.result),n.onerror=()=>t(Error(`Browser file transfer storage is unavailable. Open the correct app and choose the file there.`))})}async function ce(e){let t=await se();try{await new Promise((n,r)=>{let i=t.transaction(`files`,`readwrite`),a=i.objectStore(`files`),o=a.openCursor();o.onsuccess=()=>{let e=o.result;e&&(Date.now()-e.value.createdAt>ne&&e.delete(),e.continue())},a.put(e),i.oncomplete=n,i.onerror=()=>r(i.error),i.onabort=()=>r(i.error)})}finally{t.close()}}async function le(e,t){let n=await se();try{return await new Promise((r,i)=>{let a=n.transaction(`files`,`readwrite`),o=a.objectStore(`files`),s=o.get(e),c;s.onsuccess=()=>{c=s.result,c&&o.delete(e)},a.oncomplete=()=>{!c||c.app!==t||Date.now()-c.createdAt>ne?i(Error(`This file transfer expired or is unavailable. Choose the file again in its matching app.`)):r(new File([c.file],c.name,{type:c.type,lastModified:c.modified}))},a.onerror=()=>i(a.error)})}finally{n.close()}}async function ue(e,t){let n=v(e.name);if(!n&&!m[t]?.includes(e.name.toLowerCase().split(`.`).pop())&&(/\.(csv|tsv)$/i.test(e.name)?n=`gridsplat`:/\.pdf$/i.test(e.name)?n=`showsplat`:/\.(txt|text|md|markdown|html|htm)$/i.test(e.name)&&(n=`writesplat`)),!n&&/\.json$/i.test(e.name)&&e.size<=2e7)try{n=ae(JSON.parse(await e.text()))}catch{}if(!n||n===t)return!1;if(e.size>2e7)throw Error(`File imports are limited to 20 MB.`);if(![`http:`,`https:`].includes(location.protocol))throw Error(`Open SplatWorks through a local web server to transfer files between apps.`);let r=window.open(`about:blank`,`_blank`);if(!r)throw Error(`Your browser blocked the new tab. Allow popups, then choose the file again to open it in ${p[n]}.`);r.opener=null;let i=location.pathname.indexOf(`/splatworks/`),a=i>=0?location.pathname.slice(0,i)+`/splatworks/`:`/splatworks/`,o=new URL(a+n+`/`,location.origin),s=crypto.randomUUID?.()||`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g,e=>{let t=crypto.getRandomValues(new Uint8Array(1))[0]&15;return(e===`x`?t:t&3|8).toString(16)});try{let t=await fetch(o,{cache:`no-cache`});if(!t.ok||!(await t.text()).includes(`name="splatworks-app" content="`+n+`"`))throw Error(`${p[n]} is not available at this school address. Install or enable it, then choose the file there.`);return await ce({id:s,app:n,file:e,name:e.name,type:e.type,modified:e.lastModified,createdAt:Date.now()}),o.searchParams.set(h,s),r.location.href=o.href,!0}catch(e){throw r.close(),e}}async function de(e){if(!ie)return null;let t=ie;g(),ie=null;let n=new URL(location.href);if(n.searchParams.delete(h),history.replaceState(history.state,``,n),!/^[0-9a-f-]{36}$/i.test(t))throw Error(`Invalid file transfer. Choose the file again.`);return le(t,e)}var fe=`Save a project file before closing this imported tab. Your other projects have not been replaced.`,pe={text:``,longText:``,number:0,currency:0,percent:0,date:``,time:``,dateTime:``,checkbox:!1,rating:0,choice:``,multiSelect:``,email:``,phone:``,image:``,file:``,audio:``,link:``,calculation:``,autoNumber:``,createdAt:``,updatedAt:``};function y(e){return`${e}_${Math.random().toString(36).slice(2,10)}`}function me(e,t=`text`){return{id:y(`field`),name:e,type:t,description:``,required:!1,hidden:!1,options:t===`choice`||t===`multiSelect`?[`Yes`,`No`]:void 0}}function b(e,t={}){let n=new Date().toISOString(),r=Object.fromEntries(e.map((e,r)=>e.primaryKey&&t[e.id]===void 0&&e.type===`text`?[e.id,y(`key`)]:e.type===`createdAt`||e.type===`updatedAt`?[e.id,t[e.id]??n]:e.type===`autoNumber`||e.primaryKey&&e.type===`number`?[e.id,t[e.id]??r+1]:t[e.id]===void 0&&e.defaultValue!=null&&e.defaultValue!==``?[e.id,xe(e.defaultValue,e.type,e.options).value]:[e.id,t[e.id]??pe[e.type]]));return{id:y(`record`),createdAt:n,updatedAt:n,values:r}}function he(e,t){let n=t.map(e=>me(e));return{id:y(`table`),name:e,fields:n,records:[b(n)]}}function ge(e=`Animal Research Database`){let t=new Date().toISOString(),n=he(`Animals`,[`Animal`,`Habitat`,`Diet`,`Interesting Fact`]);return n.records=[b(n.fields,{[n.fields[0].id]:`Axolotl`,[n.fields[1].id]:`Freshwater lakes`,[n.fields[2].id]:`Worms and insects`,[n.fields[3].id]:`It can regrow some body parts.`}),b(n.fields,{[n.fields[0].id]:`Red panda`,[n.fields[1].id]:`Mountain forests`,[n.fields[2].id]:`Bamboo and fruit`,[n.fields[3].id]:`It uses its tail like a blanket.`})],{app:`ListSplatTM`,version:1,createdAt:t,updatedAt:t,metadata:{title:e,author:``,className:``},schema:{tables:[n],relationships:[]},layouts:[{id:y(`layout`),name:`Table View`,tableId:n.id,mode:`table`,locked:!1},{id:y(`layout`),name:`Record Form`,tableId:n.id,mode:`form`,locked:!1},{id:y(`layout`),name:`Research Cards`,tableId:n.id,mode:`cards`,locked:!1}],teacher:{studentView:!1,notes:[`Ask students to add source notes before printing a report.`],rubric:[]}}}function _e(e,t,n=`text`){let r=me(t.trim()||`New Field`,n);return{...e,fields:[...e.fields,r],records:e.records.map(e=>({...e,updatedAt:new Date().toISOString(),values:{...e.values,[r.id]:pe[n]}}))}}function ve(e,t){return e.records.reduce((e,n)=>{let r=Number(n.values[t]);return Number.isFinite(r)?Math.max(e,r):e},0)+1}function ye(e){let t={};return e.fields.filter(e=>e.type===`autoNumber`||e.primaryKey&&e.type===`number`).forEach(n=>{t[n.id]=ve(e,n.id)}),t}function be(e){return{...e,records:[...e.records,b(e.fields,ye(e))]}}function xe(e,t,n){let r=e==null?``:String(e);if(r.trim()===``)return{value:pe[t],lost:!1};switch(t){case`number`:case`currency`:case`percent`:case`rating`:{let e=Number(r.replace(/[$,%\s]/g,``));return Number.isFinite(e)?{value:t===`rating`?Math.max(0,Math.min(5,Math.round(e))):e,lost:!1}:{value:pe[t],lost:!0}}case`checkbox`:{let e=r.trim().toLowerCase();return[`true`,`yes`,`1`,`y`,`checked`].includes(e)?{value:!0,lost:!1}:[`false`,`no`,`0`,`n`].includes(e)?{value:!1,lost:!1}:{value:!1,lost:!0}}case`choice`:{let e=n?.find(e=>e.toLowerCase()===r.trim().toLowerCase());return e?{value:e,lost:!1}:{value:``,lost:!!(n&&n.length)}}case`date`:{let e=new Date(r);return Number.isNaN(e.getTime())?{value:``,lost:!0}:{value:e.toISOString().slice(0,10),lost:!1}}case`text`:case`longText`:case`link`:return{value:r,lost:!1};default:return{value:r,lost:!1}}}function Se(e,t,n,r){return{...e,records:e.records.map(e=>({...e,values:{...e.values,[t]:xe(e.values[t],n,r).value}}))}}function Ce(e,t,n){return{...e,fields:e.fields.map(e=>e.id===t?{...e,...n}:e)}}function we(e,t){let n=e.records.find(e=>e.id===t);return n?{...e,records:[...e.records,b(e.fields,{...n.values,...Object.fromEntries(e.fields.filter(e=>e.primaryKey&&e.type===`text`).map(e=>[e.id,y(`key`)])),...ye(e)})]}:e}function Te(e,t){return e.records.length<=1?e:{...e,records:e.records.filter(e=>e.id!==t)}}function Ee(e,t,n,r){let i=new Date().toISOString();return{...e,records:e.records.map(a=>a.id===t?{...a,updatedAt:i,values:Object.fromEntries(e.fields.map(e=>e.id===n?[e.id,r]:e.type===`updatedAt`?[e.id,i]:[e.id,a.values[e.id]]))}:a)}}function x(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t.id?t:e)}}}function De(e,t){let n=he(t.trim()||`New Table`,[`Name`,`Notes`]);return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:[...e.schema.tables,n]},layouts:[...e.layouts,{id:y(`layout`),name:`${n.name} Table`,tableId:n.id,mode:`table`,locked:!1},{id:y(`layout`),name:`${n.name} Form`,tableId:n.id,mode:`form`,locked:!1}]}}function Oe(e,t,n){let r=n.trim()||`Table`;return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.map(e=>e.id===t?{...e,name:r}:e)}}}function ke(e,t){let n=e.schema.tables.find(e=>e.id===t);if(!n)return{project:e,newTableId:t};let r=new Map(n.fields.map(e=>[e.id,y(`field`)])),i=n.fields.map(e=>({...e,id:r.get(e.id)})),a=n.records.map(e=>({id:y(`record`),createdAt:e.createdAt,updatedAt:e.updatedAt,values:Object.fromEntries(Object.entries(e.values).map(([e,t])=>[r.get(e)??e,t]))})),o={id:y(`table`),name:`${n.name} copy`,fields:i,records:a},s=e.schema.tables.findIndex(e=>e.id===t),c=[...e.schema.tables];return c.splice(s+1,0,o),{project:{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:c},layouts:[...e.layouts,{id:y(`layout`),name:`${o.name} Table`,tableId:o.id,mode:`table`,locked:!1},{id:y(`layout`),name:`${o.name} Form`,tableId:o.id,mode:`form`,locked:!1}]},newTableId:o.id}}function Ae(e,t,n){let r=[...e.schema.tables],i=r.findIndex(e=>e.id===t),a=i+n;return i<0||a<0||a>=r.length?e:([r[i],r[a]]=[r[a],r[i]],{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:r}})}function je(e,t){return e.schema.tables.length<=1?e:{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,tables:e.schema.tables.filter(e=>e.id!==t),relationships:e.schema.relationships.filter(e=>e.fromTableId!==t&&e.toTableId!==t)},layouts:e.layouts.filter(e=>e.tableId!==t),views:(e.views??[]).filter(e=>e.tableId!==t)}}function Me(e){let t=new Date().toISOString();return{...e,createdAt:t,updatedAt:t,metadata:{...e.metadata,title:`${e.metadata.title} (template)`},schema:{...e.schema,tables:e.schema.tables.map(e=>({...e,records:[b(e.fields)]}))},views:[]}}function Ne(e,t){return e.fields.filter(e=>![`autoNumber`,`createdAt`,`updatedAt`,`calculation`].includes(e.type)).map(e=>String(t.values[e.id]??``).trim().toLowerCase()).join(``)}function Pe(e){let t=new Set,n=[];return e.records.forEach(r=>{let i=Ne(e,r);t.has(i)?n.push(r.id):t.add(i)}),n}function Fe(e){let t=new Set(Pe(e));if(!t.size)return e;let n=e.records.filter(e=>!t.has(e.id));return{...e,records:n.length?n:[e.records[0]]}}function Ie(e){return e.fields.filter(t=>![`autoNumber`,`createdAt`,`updatedAt`,`calculation`].includes(t.type)&&e.records.every(e=>String(e.values[t.id]??``).trim()===``))}function Le(e){return e.schema.relationships.filter(t=>{let n=e.schema.tables.find(e=>e.id===t.fromTableId),r=e.schema.tables.find(e=>e.id===t.toTableId),i=n?.fields.some(e=>e.id===t.fromFieldId),a=r?.fields.some(e=>e.id===t.toFieldId);return!i||!a})}function Re(e){let t=new Set(Le(e).map(e=>e.id));return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,relationships:e.schema.relationships.filter(e=>!t.has(e.id))}}}function ze(e){if(!e||typeof e!=`object`)throw Error(`This is not a ListSplatTM project file.`);let t=e;if(t.app!==`ListSplatTM`||t.version!==1||!t.schema?.tables)throw Error(`This file is not a supported .listsplat.json project.`)}function Be(e){let t=e.split(/\r?\n/,1)[0]??``,n=[`,`,`	`,`;`],r=`,`,i=-1;for(let e of n){let n=t.split(e).length-1;n>i&&(i=n,r=e)}return r}function Ve(e,t=Be(e)){let n=[],r=``,i=[],a=!1;for(let o=0;o<e.length;o+=1){let s=e[o],c=e[o+1];a&&s===`"`&&c===`"`?(r+=`"`,o+=1):s===`"`?a=!a:!a&&s===t?(i.push(r),r=``):!a&&(s===`
`||s===`\r`)?(s===`\r`&&c===`
`&&(o+=1),i.push(r),i.some(e=>e.length>0)&&n.push(i),i=[],r=``):r+=s}return i.push(r),i.some(e=>e.length>0)&&n.push(i),n}function He(e,t){let n=Ve(t),r=(n[0]?.map((e,t)=>e.trim()||`Field ${t+1}`)??[`Field 1`]).map(e=>me(e)),i=n.slice(1).map(e=>b(r,Object.fromEntries(r.map((t,n)=>[t.id,e[n]??``]))));return{id:`table_${Date.now().toString(36)}`,name:e,fields:r,records:i.length>0?i:[b(r)]}}function Ue(e){let t=e==null?``:String(e);return/[",\n\r]/.test(t)?`"${t.replaceAll(`"`,`""`)}"`:t}function We(e){return[e.fields.map(e=>Ue(e.name)).join(`,`),...e.records.map(t=>e.fields.map(e=>Ue(t.values[e.id])).join(`,`))].join(`
`)}var Ge=`listsplat.autosave.v1`;function S(e){_().setItem(Ge,JSON.stringify(e))}function Ke(){let e=_().getItem(Ge);if(!e)return null;let t=JSON.parse(e);return ze(t),t}function qe(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,a.click(),URL.revokeObjectURL(i)}function Je(e){return e==null?``:String(e).trim().toLowerCase()}function Ye(e,t,n,r,i){return{id:y(`relationship`),name:e.trim()||`New Relationship`,fromTableId:t,fromFieldId:n,toTableId:r,toFieldId:i}}function Xe(e,t){return{...e,updatedAt:new Date().toISOString(),schema:{...e.schema,relationships:[...e.schema.relationships,t]}}}function Ze(e,t,n,r){let i=Je(n.values[e.fromFieldId]);return!i||t.id!==e.fromTableId||r.id!==e.toTableId?[]:r.records.filter(t=>Je(t.values[e.toFieldId])===i)}function Qe(e,t){let n=e.schema.tables.find(e=>e.id===t.fromTableId),r=e.schema.tables.find(e=>e.id===t.toTableId),i=n?.fields.find(e=>e.id===t.fromFieldId),a=r?.fields.find(e=>e.id===t.toFieldId);return`${n?.name??`Table`}:${i?.name??`Field`} -> ${r?.name??`Table`}:${a?.name??`Field`}`}function $e(e){return e==null?``:String(e).trim().toLowerCase()}var et=[`text`,`number`,`autoNumber`];function tt(e){let t=[];for(let n of e.schema.tables){let e=n.fields.filter(e=>e.primaryKey);e.length>1&&t.push(`${n.name}: choose only one primary key.`);for(let r of e){et.includes(r.type)||t.push(`${n.name}.${r.name}: primary keys must use text, number, or automatic number.`);let e=new Set;for(let i of n.records){let a=$e(i.values[r.id]);a?e.has(a)&&t.push(`${n.name}.${r.name}: duplicate primary key “${a}”.`):t.push(`${n.name}.${r.name}: primary keys cannot be empty (record ${i.id}).`),e.add(a)}}}let n=new Set;for(let r of e.schema.relationships.filter(e=>e.enforceKeys)){let i=e.schema.tables.find(e=>e.id===r.fromTableId),a=e.schema.tables.find(e=>e.id===r.toTableId),o=i?.fields.find(e=>e.id===r.fromFieldId),s=a?.fields.find(e=>e.id===r.toFieldId);if(!i||!a||!o||!s){t.push(`${r.name}: a linked table or field is missing.`);continue}o.primaryKey||t.push(`${r.name}: the parent field must be a primary key.`),i.id===a.id&&t.push(`${r.name}: choose two different tables.`),(!et.includes(s.type)||s.type===`autoNumber`||o.type===`text`!=(s.type===`text`))&&t.push(`${r.name}: key types must match; use text with text, or number with number/automatic number.`);let c=`${a.id}:${s.id}`;n.has(c)&&t.push(`${r.name}: this foreign key already has a parent.`),n.add(c);let l=new Set(i.records.map(e=>$e(e.values[o.id])).filter(Boolean)),u=new Set;for(let e of a.records){let n=$e(e.values[s.id]);if(!n){(s.required||s.primaryKey)&&t.push(`${r.name}: a parent record is required (record ${e.id}).`);continue}l.has(n)||t.push(`${r.name}: foreign key “${n}” has no parent record.`),(r.cardinality===`one-to-one`||s.primaryKey)&&u.has(n)&&t.push(`${r.name}: one-to-one keys cannot repeat “${n}”.`),u.add(n)}}return t}function nt(e,t){let n=new Set(tt(e));return tt(t).find(e=>!n.has(e))??``}function rt(e,t){return e.records.map(e=>Number(e.values[t])).filter(e=>Number.isFinite(e))}function it(e){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)).map(t=>{let n=rt(e,t.id),r=n.reduce((e,t)=>e+t,0);return{fieldId:t.id,fieldName:t.name,count:n.length,sum:r,average:n.length?r/n.length:0,minimum:n.length?Math.min(...n):0,maximum:n.length?Math.max(...n):0}})}function at(e){let t=[],n=``,r=!1,i=0;for(let a=0;a<e.length;a+=1){let o=e[a],s=e[a-1];if(o===`"`&&s!==`\\`){r=!r,n+=o;continue}if(!r&&o===`(`&&(i+=1),!r&&o===`)`&&--i,o===`,`&&!r&&i===0){t.push(n.trim()),n=``;continue}n+=o}return(n.trim()||e.endsWith(`,`))&&t.push(n.trim()),t}function ot(e){let t=e.trim();if(t.startsWith(`"`)&&t.endsWith(`"`))return t.slice(1,-1).replace(/\\"/g,`"`)}function st(e,t,n){let r=n.trim().toLowerCase(),i=e.fields.find(e=>e.name.toLowerCase()===r);return i?String(t.values[i.id]??``):``}function C(e,t,n){let r=n.trim();return/^[A-Z_]+\(.*\)$/i.test(r)?ft(r,e,t):ot(n)??st(e,t,n)}function w(e,t,n){let r=Number(C(e,t,n));return Number.isFinite(r)?r:0}function ct(e,t){let n=t.trim().toLowerCase(),r=e.fields.find(e=>e.name.toLowerCase()===n);return r?rt(e,r.id):[]}function T(e){return Number.isFinite(e)?String(Number(e.toFixed(8))):`Formula error: not a number`}function lt(e){return e.toLowerCase().replace(/\b[a-z]/g,e=>e.toUpperCase())}function ut(e,t,n,r){if(!e)return[];let i=r.trim().toLowerCase(),a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===i),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0;return a&&o?Ze(a,t,n,o):[]}function dt(e,t,n,r,i){if(!e)return``;let a=e.schema.relationships.find(e=>e.fromTableId===t.id&&e.name.toLowerCase()===r.trim().toLowerCase()),o=a?e.schema.tables.find(e=>e.id===a.toTableId):void 0,s=ut(e,t,n,r)[0],c=o?.fields.find(e=>e.name.toLowerCase()===i.trim().toLowerCase());return s&&c?String(s.values[c.id]??``):``}function ft(e,t,n,r){let i=e.trim();if(!i)return``;let a=i.match(/^([A-Z_]+)\((.*)\)$/i);if(!a)return`Formula error: use a function like FIELD(Name)`;let o=a[1].toUpperCase(),s=at(a[2]),c=s[0]??``;if(o===`FIELD`)return st(t,n,c);if(o===`JOIN`)return s.map(e=>C(t,n,e)).join(``);if(o===`UPPER`)return C(t,n,c).toUpperCase();if(o===`LOWER`)return C(t,n,c).toLowerCase();if(o===`TITLECASE`)return lt(C(t,n,c));if(o===`TRIM`)return C(t,n,c).trim();if(o===`LENGTH`)return String(C(t,n,c).length);if(o===`CONTAINS`)return C(t,n,c).toLowerCase().includes(C(t,n,s[1]??``).toLowerCase())?`Yes`:`No`;if(o===`IF_EMPTY`)return C(t,n,c).trim()?C(t,n,c):C(t,n,s[1]??``);if(o===`LOOKUP`)return dt(r,t,n,ot(c)??c,ot(s[1]??``)??s[1]??``);if(o===`COUNT_RELATED`)return String(ut(r,t,n,ot(c)??c).length);if(o===`ADD`)return T(s.reduce((e,r)=>e+w(t,n,r),0));if(o===`SUBTRACT`)return T(s.slice(1).reduce((e,r)=>e-w(t,n,r),w(t,n,c)));if(o===`MULTIPLY`)return T(s.reduce((e,r)=>e*w(t,n,r),1));if(o===`DIVIDE`){let e=w(t,n,s[1]??``);return e===0?`Formula error: divide by zero`:T(w(t,n,c)/e)}if(o===`ROUND`){let e=Math.max(0,Math.min(6,Math.round(w(t,n,s[1]??`"0"`))));return String(Number(w(t,n,c).toFixed(e)))}if([`SUM`,`AVERAGE`,`MIN`,`MAX`,`COUNT`].includes(o)){let e=ct(t,c);return o===`SUM`?T(e.reduce((e,t)=>e+t,0)):o===`AVERAGE`?T(e.length?e.reduce((e,t)=>e+t,0)/e.length:0):o===`MIN`?T(e.length?Math.min(...e):0):o===`MAX`?T(e.length?Math.max(...e):0):String(e.length)}if(o===`COUNT_UNIQUE`){let e=c.trim().toLowerCase(),n=t.fields.find(t=>t.name.toLowerCase()===e);if(!n)return`0`;let r=new Set(t.records.map(e=>String(e.values[n.id]??``).trim().toLowerCase()).filter(Boolean));return String(r.size)}if(o===`PERCENT`){let e=w(t,n,s[1]??``);return e===0?`0`:T(w(t,n,c)/e*100)}if(o===`LEFT`)return C(t,n,c).slice(0,Math.max(0,w(t,n,s[1]??`"0"`)));if(o===`RIGHT`){let e=Math.max(0,w(t,n,s[1]??`"0"`)),r=C(t,n,c);return e===0?``:r.slice(-e)}if(o===`MID`){let e=Math.max(0,w(t,n,s[1]??`"1"`)-1),r=Math.max(0,w(t,n,s[2]??`"0"`));return C(t,n,c).slice(e,e+r)}if(o===`SUBSTITUTE`)return C(t,n,c).split(C(t,n,s[1]??``)).join(C(t,n,s[2]??``));let l=e=>{let r=C(t,n,e).trim().toLowerCase();return r!==``&&![`no`,`false`,`0`].includes(r)};if(o===`IS_EMPTY`)return C(t,n,c).trim()===``?`Yes`:`No`;if(o===`NOT`)return l(c)?`No`:`Yes`;if(o===`AND`)return s.every(l)?`Yes`:`No`;if(o===`OR`)return s.some(l)?`Yes`:`No`;if(o===`IF`)return l(c)?C(t,n,s[1]??``):C(t,n,s[2]??``);let u=e=>{let r=C(t,n,e).trim();if(!r)return null;let i=new Date(r.length<=10?`${r}T00:00:00`:r);return Number.isNaN(i.getTime())?null:i};if(o===`TODAY`)return new Date().toISOString().slice(0,10);if(o===`YEAR`||o===`MONTH`||o===`DAY`){let e=u(c);return e?String(o===`YEAR`?e.getFullYear():o===`MONTH`?e.getMonth()+1:e.getDate()):``}if(o===`DAYS_BETWEEN`||o===`YEARS_BETWEEN`){let e=u(c),t=s[1]?u(s[1]):new Date;if(!e||!t)return``;let n=Math.round((t.getTime()-e.getTime())/864e5);return String(o===`DAYS_BETWEEN`?n:Math.floor(n/365.25))}return`Formula error: ${o} is not supported`}function pt(e){return e==null?``:String(e)}function mt(e,t){let n=t.query.trim();if(!n)return e.records;let r=n.toLowerCase();return e.records.filter(n=>(t.fieldId===`all`?e.fields.map(e=>e.id):[t.fieldId]).some(e=>pt(n.values[e]).toLowerCase().includes(r)))}function ht(e,t){let n=Number(e),r=Number(t);return e!==``&&t!==``&&!Number.isNaN(n)&&!Number.isNaN(r)?n-r:e.localeCompare(t,void 0,{numeric:!0,sensitivity:`base`})}function gt(e,t){return t.length?[...e].sort((e,n)=>{for(let r of t){let t=pt(e.values[r.fieldId]).trim(),i=pt(n.values[r.fieldId]).trim();if(t===``&&i!==``)return 1;if(t!==``&&i===``)return-1;let a=ht(t,i)*(r.direction===`asc`?1:-1);if(a!==0)return a}return 0}):e}function _t(e,t){let n=pt(e.values[t.fieldId]),r=n.trim().toLowerCase(),i=t.value.trim().toLowerCase(),a=Number(n),o=Number(t.value),s=n.trim()!==``&&t.value.trim()!==``&&!Number.isNaN(a)&&!Number.isNaN(o);switch(t.operator){case`contains`:return r.includes(i);case`equals`:return s?a===o:r===i;case`startsWith`:return r.startsWith(i);case`endsWith`:return r.endsWith(i);case`greaterThan`:return s?a>o:r>i;case`lessThan`:return s?a<o:r<i;case`between`:{let e=Number(t.value),n=Number(t.value2);return!Number.isNaN(e)&&!Number.isNaN(n)&&!Number.isNaN(a)?a>=Math.min(e,n)&&a<=Math.max(e,n):r>=i&&r<=(t.value2??``).trim().toLowerCase()}case`isEmpty`:return n.trim()===``;case`isNotEmpty`:return n.trim()!==``;default:return!0}}function vt(e,t){return!t||t.rules.length===0?e:e.filter(e=>t.match===`all`?t.rules.every(t=>_t(e,t)):t.rules.some(t=>_t(e,t)))}function yt(e,t){let n=new Map;return e.records.forEach(e=>{let r=pt(e.values[t]).trim().toLowerCase();r&&n.set(r,(n.get(r)??0)+1)}),e.records.filter(e=>{let r=pt(e.values[t]).trim().toLowerCase();return r?(n.get(r)??0)>1:!1})}function bt(e,t){return e.records.filter(e=>!pt(e.values[t]).trim())}function xt(e,t){if(!t.find)return[];let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=[];return e.records.forEach(e=>{o.has(e.id)&&t.fieldIds.forEach(n=>{let r=pt(e.values[n]),i=r.replace(a,t.replacement);i!==r&&s.push({recordId:e.id,fieldId:n,before:r,after:i})})}),s}function St(e,t){if(!t.find)return{table:e,count:0};let n=t.caseSensitive?`g`:`gi`,r=t.find.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),i=t.wholeWord?`\\b${r}\\b`:r,a=new RegExp(i,n),o=new Set(t.recordIds??e.records.map(e=>e.id)),s=0,c=e.records.map(e=>{if(!o.has(e.id))return e;let n=!1,r={...e.values};return t.fieldIds.forEach(e=>{let i=pt(r[e]),o=i.replace(a,()=>(s+=1,t.replacement));o!==i&&(n=!0,r[e]=o)}),n?{...e,updatedAt:new Date().toISOString(),values:r}:e});return{table:{...e,records:c},count:s}}var Ct={email:/^[^\s@]+@[^\s@]+\.[^\s@]+$/,url:/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/,phone:/^[+()\d][\d\s().-]{5,}$/};function wt(e){return e==null?``:String(e)}function Tt(e,t,n,r){let i=Et(e,t,n,r);return i&&e.customMessage?e.customMessage:i}function Et(e,t,n,r){let i=wt(t).trim();if(i===``)return e.required||e.primaryKey?`This field is required.`:``;if(e.maxLength&&i.length>e.maxLength)return`Keep this ${e.maxLength} characters or fewer.`;if(e.type===`email`&&!Ct.email.test(i))return`Enter a valid email address.`;if(e.type===`phone`&&!Ct.phone.test(i))return`Enter a valid phone number.`;if([`number`,`currency`,`percent`,`rating`].includes(e.type)){let t=Number(i);if(Number.isNaN(t))return`Enter a number.`;if(e.min!=null&&t<e.min)return`Must be at least ${e.min}.`;if(e.max!=null&&t>e.max)return`Must be at most ${e.max}.`}if([`text`,`longText`,`link`].includes(e.type)&&e.pattern&&e.pattern!==`none`){if(e.pattern===`custom`){if(e.customPattern)try{if(!new RegExp(e.customPattern).test(i))return`Does not match the required format.`}catch{}}else if(!Ct[e.pattern].test(i))return`Enter a valid ${e.pattern}.`}return(e.unique||e.primaryKey)&&n&&n.records.some(t=>t.id!==r&&wt(t.values[e.id]).trim().toLowerCase()===i.toLowerCase())?`This value is already used in another record.`:``}function Dt(e){let t=[];return e.fields.forEach(n=>{[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(n.type)||e.records.forEach(r=>{let i=Tt(n,r.values[n.id],e,r.id);i&&t.push({record:r,field:n,message:i})})}),t}function Ot(e,t,n,r,i,a){return{id:e,title:t,gradeBand:n,goal:r,table:He(t,i),reflectionQuestions:a}}var kt=[Ot(`classroom-library`,`Classroom Library Catalog`,`Grades 3-8`,`Track books, genres, reading levels, and recommendations.`,`Title,Author,Genre,Pages,Who would enjoy it?
Charlotte's Web,E. B. White,Fiction,192,Readers who like animals
Hidden Figures,Margot Lee Shetterly,Biography,240,Readers who like history`,[`Which genre appears most often?`,`What book would you recommend first?`]),Ot(`science-observations`,`Science Observation Log`,`Grades 3-8`,`Collect observations over time and look for patterns.`,`Date,Object observed,Location,Measurement,Observation
2026-06-29,Bean plant,Window,8 cm,Two new leaves
2026-06-30,Bean plant,Window,8.5 cm,Stem leaned toward light`,[`What changed over time?`,`What might explain the pattern?`]),Ot(`state-facts`,`State Facts Database`,`Grades 4-8`,`Compare places using consistent fields.`,`State,Capital,Region,Population note,Interesting fact
Texas,Austin,South,Large population,Has many different ecosystems
New Mexico,Santa Fe,Southwest,Medium population,Capital is over 400 years old`,[`Which fields help compare states?`,`What new field would improve this database?`]),Ot(`book-reviews`,`Book Review Collection`,`Grades 3-8`,`Collect opinions and evidence from student reading.`,`Book,Reviewer,Rating,Favorite part,Would recommend?
Because of Winn-Dixie,Jordan,5,The friendship story,Yes
Wonder,Avery,4,The different points of view,Yes`,[`Which book has the strongest recommendation?`,`What evidence supports each rating?`]),Ot(`vocabulary-bank`,`Vocabulary Word Bank`,`Grades 2-8`,`Build a searchable word list with definitions and examples.`,`Word,Definition,Example sentence,Subject
evaporate,To change from liquid to gas,Water can evaporate in sunlight,Science
compare,To tell how things are alike,Compare two characters,Reading`,[`Which words belong to more than one subject?`,`Which examples help you remember the word?`]),Ot(`survey-results`,`Simple Survey Results`,`Grades 3-8`,`Organize survey answers and look for patterns.`,`Question,Answer,Student group,Count,Notes
Favorite recess activity,Soccer,Grade 4,12,Most common outdoor choice
Favorite recess activity,Drawing,Grade 4,6,Quiet activity choice`,[`Which answer appears most often?`,`What new question should the class ask next?`]),Ot(`museum-cards`,`Museum Exhibit Cards`,`Grades 4-8`,`Create printable exhibit cards for objects, images, or research topics.`,`Item,Creator or source,Year,Category,Why it matters
Printing press,Johannes Gutenberg,1440,Invention,Changed how books were made
Apollo 11 mission,NASA,1969,Space exploration,First humans walked on the Moon`,[`How should the exhibit be grouped?`,`What field would help visitors understand the item?`])];function At(e){let t=e.table.fields.map(e=>({...e,id:`${e.id}_${Date.now().toString(36)}`})),n=e.table.records.map(n=>b(t,Object.fromEntries(e.table.fields.map((e,r)=>[t[r].id,n.values[e.id]??``]))));return{...e.table,id:`table_${e.id}_${Date.now().toString(36)}`,fields:t,records:n}}var jt=`drawsplat.language`,Mt=[{code:`en`,label:`English`,dir:`ltr`,htmlLang:`en`},{code:`es`,label:`Español`,dir:`ltr`,htmlLang:`es`},{code:`vi`,label:`Tiếng Việt`,dir:`ltr`,htmlLang:`vi`},{code:`ar`,label:`العربية`,dir:`rtl`,htmlLang:`ar`},{code:`zh`,label:`中文`,dir:`ltr`,htmlLang:`zh`},{code:`uh`,label:`हिन्दी / اردو`,dir:`ltr`,htmlLang:`hi`}],Nt={es:{New:`Nuevo`,"Save JSON":`Guardar JSON`,"Open JSON":`Abrir JSON`,"Export CSV":`Exportar CSV`,File:`Archivo`,Edit:`Editar`,Data:`Datos`,Layout:`Diseño`,Tools:`Herramientas`,View:`Vista`,Teacher:`Docente`,Help:`Ayuda`,Title:`Título`,Search:`Buscar`,In:`En`,"All fields":`Todos los campos`,Sort:`Ordenar`,"Choose field":`Elegir campo`,"New field":`Campo nuevo`,"Field name":`Nombre del campo`,Type:`Tipo`,"Add field":`Agregar campo`,"Add record":`Agregar registro`,Table:`Tabla`,Form:`Formulario`,Cards:`Tarjetas`,Gallery:`Galería`,Labels:`Etiquetas`,Report:`Informe`,"Upload image":`Subir imagen`,"No image yet":`Sin imagen todavía`},vi:{New:`Mới`,"Save JSON":`Lưu JSON`,"Open JSON":`Mở JSON`,"Export CSV":`Xuất CSV`,File:`Tệp`,Edit:`Sửa`,Data:`Dữ liệu`,Layout:`Bố cục`,Tools:`Công cụ`,View:`Xem`,Teacher:`Giáo viên`,Help:`Trợ giúp`,Title:`Tiêu đề`,Search:`Tìm`,Sort:`Sắp xếp`,Table:`Bảng`,Form:`Biểu mẫu`,Cards:`Thẻ`,Gallery:`Thư viện ảnh`,Labels:`Nhãn`,Report:`Báo cáo`},ar:{New:`جديد`,"Save JSON":`حفظ JSON`,"Open JSON":`فتح JSON`,"Export CSV":`تصدير CSV`,File:`ملف`,Edit:`تحرير`,Data:`بيانات`,Layout:`تخطيط`,Tools:`أدوات`,View:`عرض`,Teacher:`المعلم`,Help:`مساعدة`,Title:`العنوان`,Search:`بحث`,Sort:`فرز`,Table:`جدول`,Form:`نموذج`,Cards:`بطاقات`,Gallery:`معرض`,Labels:`ملصقات`,Report:`تقرير`},zh:{New:`新建`,"Save JSON":`保存 JSON`,"Open JSON":`打开 JSON`,"Export CSV":`导出 CSV`,File:`文件`,Edit:`编辑`,Data:`数据`,Layout:`布局`,Tools:`工具`,View:`视图`,Teacher:`教师`,Help:`帮助`,Title:`标题`,Search:`搜索`,Sort:`排序`,Table:`表格`,Form:`表单`,Cards:`卡片`,Gallery:`图库`,Labels:`标签`,Report:`报告`},uh:{New:`नया`,File:`फ़ाइल`,Edit:`संपादन`,Data:`डेटा`,Layout:`लेआउट`,Tools:`औज़ार`,View:`दृश्य`,Teacher:`शिक्षक`,Help:`सहायता`,Search:`खोज`,Table:`तालिका`,Form:`फ़ॉर्म`,Cards:`कार्ड`,Gallery:`गैलरी`,Labels:`लेबल`,Report:`रिपोर्ट`}},Pt=document.querySelector(`#app`);if(!Pt)throw Error(`ListSplatTM app root was not found.`);var E=Pt,D=Ke()??ge(),O=D.schema.tables[0].id,Ft=new Set,k=D.schema.tables[0].records[0]?.id??``,A=`table`,It=`Saved locally`,j=``,Lt=`all`,M=[],N=null,Rt={match:`all`,rules:[]},zt=[],Bt=``,Vt=[],P=new Set,F=null,Ht=!1,Ut=``,Wt=``,Gt=``,Kt=``,qt=!1,Jt=null,Yt=`bar`,Xt=``,Zt=`count`,Qt=``,$t=null,en=null,tn=null,I=[],nn=``,rn=`add`,L=new Set,R=`none`,an=``,z=`Tip: Start with one table, then add relationships when your project needs them.`,on=[],sn=[],cn=``,ln=null,B=[],V=``,un=O,dn=D.schema.tables[1]?.id??O,H=null,fn=``,pn=hn();function U(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function mn(e){let t=(e||``).toLowerCase();return t.startsWith(`es`)?`es`:t.startsWith(`vi`)?`vi`:t.startsWith(`ar`)?`ar`:t.startsWith(`zh`)?`zh`:t===`uh`||t.startsWith(`ur`)||t.startsWith(`hi`)?`uh`:`en`}function hn(){let e=new URLSearchParams(window.location.search);try{return mn(e.get(`lang`)||localStorage.getItem(jt)||navigator.language)}catch{return mn(e.get(`lang`)||navigator.language)}}function gn(e){return Mt.map(({code:t,label:n})=>`<option value="${t}"${t===e?` selected`:``}>${n}</option>`).join(``)}function W(e){return pn===`en`?e:Nt[pn][e]??e}function _n(){let e=Mt.find(e=>e.code===pn)??Mt[0];document.documentElement.lang=e.htmlLang,document.documentElement.dir=e.dir}function G(){return D.schema.tables.find(e=>e.id===O)??D.schema.tables[0]}function K(e){let t=mt(e,{query:j,fieldId:Lt});return t=t.filter(e=>Ht?e.archived:!e.archived),t=vt(t,N),L.size>0&&(t=t.filter(e=>L.has(e.id))),gt(t,M.filter(t=>e.fields.some(e=>e.id===t.fieldId)))}function vn(e){return e.records.filter(e=>e.archived).length}function yn(){return!!j||!!(N&&N.rules.length)||L.size>0}function q(){j=``,N=null,L=new Set}function bn(e){e.records.some(e=>e.id===k)||(k=e.records[0]?.id??``)}function J(e){let t=nt(D,e);if(t){z=`Change blocked: ${t}`,V=t,$();return}D=e,bn(G()),S(D),It=`Saved locally`,$()}function Y(e){on=[{label:e,project:structuredClone(D)},...on].slice(0,25),sn=[]}function xn(e,t){let n=`${e}:${t}`;cn!==n&&(Y(`edit ${G().fields.find(e=>e.id===t)?.name??`cell`}`),cn=n,Sn())}function Sn(){let e=E.querySelector(`[data-action="undo-change"]`),t=E.querySelector(`[data-action="redo-change"]`);e&&(e.disabled=on.length===0),t&&(t.disabled=sn.length===0)}function Cn(e){D=e,O=D.schema.tables.some(e=>e.id===O)?O:D.schema.tables[0].id,bn(G()),S(D),$()}function wn(){let e=on[0];if(!e){z=`Nothing to undo yet.`,$();return}sn=[{label:e.label,project:structuredClone(D)},...sn].slice(0,25),on=on.slice(1),z=`Undid ${e.label}.`,Cn(e.project)}function Tn(){let e=sn[0];if(!e){z=`Nothing to redo.`,$();return}on=[{label:e.label,project:structuredClone(D)},...on].slice(0,25),sn=sn.slice(1),z=`Redid ${e.label}.`,Cn(e.project)}function X(e){O=e.id,J(x(D,e))}function En(e,t){let n=G();Y(t),X({...n,records:n.records.map(t=>t.id===k?e(t):t)})}function Dn(){let e=[];E.querySelectorAll(`.rubric-def-row`).forEach(t=>{let n=t.dataset.critId??y(`crit`),r=t.querySelector(`[data-crit-label]`)?.value.trim()??``,i=Number(t.querySelector(`[data-crit-max]`)?.value)||4;r&&e.push({id:n,label:r,max:i})}),Vt=e}function On(){document.querySelectorAll(`.menu[open]`).forEach(e=>{e.open=!1})}function kn(e){J({...D,updatedAt:new Date().toISOString(),metadata:{...D.metadata,title:e||`Untitled Database`}})}function An(e=D){qe(`${e.metadata.title||`listsplat-project`}.listsplat.json`,JSON.stringify(e,null,2),`application/json`)}function jn(){qe(`${G().name}.csv`,We(G()),`text/csv;charset=utf-8`)}function Mn(){let e=G(),t=e.fields.filter(e=>!e.hidden),n=K(e),r=t.map(e=>Ue(e.name)).join(`,`),i=n.map(n=>t.map(t=>Ue(Z(e,n,t.id))).join(`,`)).join(`
`);qe(`${e.name}-found.csv`,`${r}\n${i}`,`text/csv;charset=utf-8`),z=`Exported ${n.length} shown record${n.length===1?``:`s`} to CSV.`,$()}async function Nn(e){let t=await crypto.subtle.digest(`SHA-256`,new TextEncoder().encode(e));return Array.from(new Uint8Array(t)).map(e=>e.toString(16).padStart(2,`0`)).join(``)}async function Pn(){let e=G(),t=e.fields.filter(e=>!e.hidden&&e.type!==`image`),n=e.fields.find(e=>e.type===`image`&&!e.hidden),r=K(e),i=window.prompt(`Optional password to view (leave blank for none). This is a convenience gate, not encryption.`)??``,a=i?await Nn(i):``,o=r.map(r=>{let i=n?tr(Z(e,r,n.id)):``;return`<article class="card">${i?`<img src="${U(i)}" alt="">`:``}<h3>${U(ir(e,r))}</h3>${t.map(t=>`<p><strong>${U(t.name)}:</strong> ${U(String(qn(t,Z(e,r,t.id))))}</p>`).join(``)}</article>`}).join(``),s=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${U(D.metadata.title)} — ${U(e.name)}</title>
<style>body{margin:0;font-family:system-ui,sans-serif;color:#1f2937;background:#f4f1ff}header{background:linear-gradient(110deg,#6d28d9,#a855f7);color:#fff;padding:20px 24px}main{max-width:1000px;margin:0 auto;padding:20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}.card{background:#fff;border:1px solid #e5e0ff;border-radius:12px;padding:14px;box-shadow:0 8px 18px rgba(31,41,55,.06)}.card img{width:100%;border-radius:8px;margin-bottom:8px}.card h3{margin:0 0 8px;color:#5b21b6}.card p{margin:2px 0;font-size:.9rem}#gate{position:fixed;inset:0;display:none;place-items:center;background:#0b1d33;color:#fff}body.locked #gate{display:grid}body.locked main,body.locked header{filter:blur(6px)}</style></head>
<body data-hash="${a}"><div id="gate"><div style="text-align:center"><p>This page is password protected.</p><input id="pw" type="password" placeholder="Password"> <button id="go">View</button></div></div>
<header><h1>${U(D.metadata.title)}</h1><p>${U(e.name)} · ${r.length} record${r.length===1?``:`s`} · read-only</p></header>
<main>${o}</main>
<script>const HASH=document.body.dataset.hash;async function sha(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')}if(HASH){document.body.classList.add('locked');document.getElementById('go').onclick=async()=>{if(await sha(document.getElementById('pw').value)===HASH)document.body.classList.remove('locked')};document.getElementById('pw').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('go').click()})}<\/script>
</body></html>`;qe(`${e.name}-shared.html`,s,`text/html;charset=utf-8`),z=`Exported a read-only page with ${r.length} record${r.length===1?``:`s`}${a?` (password protected)`:``}.`,$()}function Fn(){let e=G(),t=e.fields.filter(e=>!e.hidden),n=K(e),r=e=>String(e??``).replace(/\|/g,`\\|`).replace(/\n/g,` `),i=`| ${t.map(e=>r(e.name)).join(` | `)} |`,a=`| ${t.map(()=>`---`).join(` | `)} |`,o=n.map(n=>`| ${t.map(t=>r(Z(e,n,t.id))).join(` | `)} |`).join(`
`);qe(`${e.name}.md`,`# ${e.name}\n\n${i}\n${a}\n${o}\n`,`text/markdown;charset=utf-8`),z=`Exported a Markdown table.`,$()}function In(){let e=G(),t=K(e),n=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${U(D.metadata.title)}</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{color:#5b21b6}</style></head>
<body><h1>${U(D.metadata.title)}</h1><p>${U(e.name)} report from ListSplatTM.</p>
<table><thead><tr>${e.fields.map(e=>`<th>${U(e.name)}</th>`).join(``)}</tr></thead>
<tbody>${t.map(t=>`<tr>${e.fields.map(n=>`<td>${U(Z(e,t,n.id))}</td>`).join(``)}</tr>`).join(``)}</tbody></table></body></html>`;qe(`${D.metadata.title||`listsplat-report`}.html`,n,`text/html;charset=utf-8`)}function Ln(){let e=D.schema.tables.map(e=>{let t=$n(e),n=t.reduce((e,t)=>e+t.missing,0),r=t.reduce((e,t)=>e+t.duplicates,0);return`
        <section>
          <h2>${U(e.name)}</h2>
          <p>${e.records.length} records, ${e.fields.length} fields, ${n} missing values, ${r} duplicate values.</p>
          <table>
            <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th><th>Missing</th><th>Duplicates</th></tr></thead>
            <tbody>${e.fields.map(e=>{let n=t.find(t=>t.field.id===e.id);return`<tr><td>${U(e.name)}</td><td>${U(e.type)}</td><td>${e.required?`Yes`:`No`}</td><td>${U(e.description)}</td><td>${n?.missing??0}</td><td>${n?.duplicates??0}</td></tr>`}).join(``)}</tbody>
          </table>
        </section>
      `}).join(``),t=D.schema.relationships.length?`<ul>${D.schema.relationships.map(e=>`<li>${U(e.name)}: ${U(Qe(D,e))}</li>`).join(``)}</ul>`:`<p>No relationships have been created yet.</p>`,n=D.teacher.notes.length?`<ul>${D.teacher.notes.map(e=>`<li>${U(e)}</li>`).join(``)}</ul>`:`<p>No teacher notes yet.</p>`,r=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${U(D.metadata.title)} Project Packet</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937;line-height:1.5}h1,h2{color:#5b21b6}section{margin:0 0 28px}table{border-collapse:collapse;width:100%;margin-top:10px}th,td{border:1px solid #d8ccff;padding:8px;text-align:left;vertical-align:top}th{background:#f3edff;color:#4c1d95}.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.meta div{border:1px solid #d8ccff;border-radius:8px;padding:12px;background:#faf8ff}</style></head>
<body>
  <h1>${U(D.metadata.title||`ListSplat Project`)} Project Packet</h1>
  <div class="meta">
    <div><strong>Author</strong><br>${U(D.metadata.author||`Not set`)}</div>
    <div><strong>Class</strong><br>${U(D.metadata.className||`Not set`)}</div>
    <div><strong>Tables</strong><br>${D.schema.tables.length}</div>
    <div><strong>Relationships</strong><br>${D.schema.relationships.length}</div>
  </div>
  <section><h2>Teacher Notes</h2>${n}</section>
  <section><h2>Relationships</h2>${t}</section>
  ${e}
</body></html>`;qe(`${D.metadata.title||`listsplat`}-project-packet.html`,r,`text/html;charset=utf-8`)}async function Rn(e){try{if(await ue(e,`listsplat`)){z=`Opened the file in its matching SplatWorks app.`,$();return}await oe(e,`listsplat`),/\.json$/i.test(e.name)?zn(e):Bn(e),g()&&(z=fe,$())}catch(e){window.alert(e instanceof Error?e.message:`Could not open that file.`)}}function zn(e){e.text().then(e=>{let t=JSON.parse(e);ze(t),O=t.schema.tables[0].id,k=t.schema.tables[0].records[0]?.id??``,J(t)}).catch(e=>{window.alert(e instanceof Error?e.message:`Could not open this ListSplatTM file.`)})}function Bn(e){e.text().then(t=>{let n=He(e.name.replace(/\.csv$/i,``),t);H=n,fn=e.name;let r=G();I=n.fields.map(e=>{let t=n.records.slice(0,12).map(t=>String(t.values[e.id]??``)),i=r.fields.find(t=>t.name.trim().toLowerCase()===e.name.trim().toLowerCase());return{header:e.name,action:i?`existing`:`new`,type:Ii(t),fieldId:i?.id??``}}),nn=``,rn=`add`,R=`csvImport`,z=`Previewing ${n.records.length} CSV record${n.records.length===1?``:`s`} from ${e.name}.`,$()})}function Vn(e){if(!H){R=`none`;return}Li();let t=H;if(Y(`CSV import`),e===`new`){let e=I.filter(e=>e.action!==`skip`).map((e,n)=>{let r=t.fields[I.indexOf(e)];return{field:me(e.header||`Field ${n+1}`,e.type),sourceFieldId:r.id}}),n=t.records.map(t=>b(e.map(e=>e.field),Object.fromEntries(e.map(e=>[e.field.id,xe(t.values[e.sourceFieldId],e.field.type).value])))),r={id:y(`table`),name:t.name,fields:e.map(e=>e.field),records:n.length?n:[b(e.map(e=>e.field))]};O=r.id,k=r.records[0]?.id??``,H=null,q(),M=[],P=new Set,R=`none`,z=`Imported ${r.records.length} records from ${fn}.`,J({...D,updatedAt:new Date().toISOString(),schema:{...D.schema,tables:[...D.schema.tables,r]},layouts:[...D.layouts,{id:y(`layout`),name:`${r.name} Table`,tableId:r.id,mode:`table`,locked:!1},{id:y(`layout`),name:`${r.name} Form`,tableId:r.id,mode:`form`,locked:!1}]});return}let n=G();I.forEach((e,t)=>{if(e.action===`new`){let r=me(e.header||`Field ${t+1}`,e.type);n={...n,fields:[...n.fields,r]},e.fieldId=r.id}});let r=new Map(n.fields.map(e=>[e.id,e])),i=t.records.map(e=>b(n.fields,Object.fromEntries(I.filter(e=>e.action!==`skip`&&e.fieldId&&r.has(e.fieldId)).map((n,i)=>{let a=t.fields[I.indexOf(n)],o=r.get(n.fieldId);return[n.fieldId,xe(e.values[a.id],o.type,o.options).value]}))));H=null,R=`none`;let a=nn&&r.has(nn)?nn:``;if(a&&rn!==`add`){let e=e=>String(e.values[a]??``).trim().toLowerCase(),t=new Map(n.records.map(t=>[e(t),t.id])),r=[...n.records],o=0,s=0,c=0;i.forEach(n=>{let i=e(n),a=i?t.get(i):void 0;a&&rn===`skip`?c+=1:a&&rn===`update`?(r=r.map(e=>e.id===a?{...e,updatedAt:new Date().toISOString(),values:{...e.values,...n.values}}:e),s+=1):(r.push(n),i&&t.set(i,n.id),o+=1)}),z=`Import: ${o} added, ${s} updated, ${c} skipped.`,X({...n,records:r});return}z=`Appended ${i.length} CSV record${i.length===1?``:`s`} to ${n.name}.`,X({...n,records:[...n.records,...i]})}function Hn(e){let t=kt.find(t=>t.id===e);if(!t)return;let n=At(t);Y(`template load`),O=n.id,k=n.records[0]?.id??``,z=`Loaded ${t.title}.`,J({...D,metadata:{...D.metadata,title:t.title},schema:{...D.schema,tables:[...D.schema.tables,n]},teacher:{...D.teacher,notes:t.reflectionQuestions}})}function Un(e){let t={key:`<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-5-5 3-3m-6 0 3-3"/>`,table:`<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>`,form:`<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>`,cards:`<rect x="3" y="4" width="8" height="16" rx="2"/><rect x="14" y="4" width="7" height="16" rx="2"/>`,gallery:`<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1"/><path d="m3 17 6-6 4 4 3-3 5 5"/>`,list:`<path d="M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1"/>`,kanban:`<rect x="3" y="4" width="5" height="14" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="16" rx="1"/>`,calendar:`<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18M7 15h2M13 15h2"/>`,labels:`<path d="m3 3 9 0 9 9-9 9-9-9Z"/><circle cx="8" cy="8" r="1"/>`,report:`<path d="M5 3h10l4 4v14H5Z M14 3v5h5M9 17v-4M13 17v-7M16 17v-3"/>`,plus:`<path d="M12 5v14M5 12h14"/>`,save:`<path d="M5 3h12l4 4v14H3V3ZM7 3v6h10V3M7 21v-8h10v8"/>`,open:`<path d="M3 8V5h6l2 3h10l-3 12H3V8Z"/>`,export:`<path d="M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6"/>`,search:`<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>`,sort:`<path d="M8 3v18m-4-4 4 4 4-4M14 5h7M14 10h5M14 15h3"/>`,check:`<path d="m5 12 4 4 10-10"/>`};return`<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${t[e]??t.table}</svg>`}function Wn(){E.querySelectorAll(`.modal`).forEach(e=>{e.insertAdjacentHTML(`afterbegin`,`<button type="button" class="dialog-close" data-action="close-dialog" aria-label="Close dialog" title="Close dialog">×</button>`)});let e={new:`plus`,"save-json":`save`,"open-json":`open`,"export-csv":`export`,"add-record":`plus`,"add-field":`plus`,find:`search`,"sort-dialog":`sort`,views:`cards`};E.querySelectorAll(`.quick-actions [data-action], .toolbar [data-action], [data-view-mode], .table-tab`).forEach(t=>{let n=t.dataset.viewMode??e[t.dataset.action??``]??(t.classList.contains(`table-tab`)?`table`:``);n&&t.insertAdjacentHTML(`afterbegin`,Un(n)),t.dataset.viewMode&&t.setAttribute(`aria-pressed`,String(t.classList.contains(`active`)))})}function Gn(e,t){return`
    <details class="menu">
      <summary>${U(W(e))}</summary>
      <div class="menu-panel">
        ${t.map(([e,t])=>`<button type="button" data-action="${e}">${U(W(t))}</button>`).join(``)}
      </div>
    </details>
  `}function Kn(e=`text`){return[[`text`,`Short text`],[`longText`,`Long text`],[`number`,`Number`],[`currency`,`Currency`],[`percent`,`Percent`],[`date`,`Date`],[`time`,`Time`],[`dateTime`,`Date and time`],[`checkbox`,`Checkbox`],[`rating`,`Rating`],[`choice`,`Single choice`],[`multiSelect`,`Multiple choice`],[`email`,`Email`],[`phone`,`Phone`],[`link`,`Web address`],[`image`,`Image`],[`file`,`File attachment`],[`audio`,`Audio recording`],[`calculation`,`Calculation`],[`autoNumber`,`Auto number`],[`createdAt`,`Created time`],[`updatedAt`,`Updated time`]].map(([t,n])=>`<option value="${t}" ${e===t?`selected`:``}>${n}</option>`).join(``)}function Z(e,t,n){let r=e.fields.find(e=>e.id===n);return r?.type===`calculation`&&r.formula?ft(r.formula,e,t,D):t.values[n]??``}function qn(e,t){if(t===``||t==null)return``;if(!e)return String(t);let n=typeof t==`number`?t:Number(t);return e.type===`currency`&&Number.isFinite(n)?n.toLocaleString(void 0,{style:`currency`,currency:`USD`}):e.type===`percent`&&Number.isFinite(n)?`${n.toLocaleString()}%`:e.type===`number`&&Number.isFinite(n)?n.toLocaleString():e.type===`checkbox`?t===!0||t===`true`?`Yes`:`No`:e.type===`file`?Qr(String(t??``))?.name??``:e.type===`audio`?t?`Audio recording`:``:String(t)}function Jn(){return D.layouts.find(e=>e.tableId===O&&e.mode===A)}function Yn(e){return!!e}function Q(e){let t=new Set(Jn()?.hiddenFieldIds??[]);return Xn(e).filter(e=>!t.has(e.id))}function Xn(e){let t=Jn()?.fieldOrder??e.fields.map(e=>e.id),n=new Map(e.fields.map(e=>[e.id,e]));return[...t.map(e=>n.get(e)).filter(Yn),...e.fields.filter(e=>!t.includes(e.id))].filter(e=>e&&!e.hidden)}function Zn(e){return e.fields.filter(e=>e.type===`calculation`)}function Qn(e){return Zn(e).reduce((t,n)=>n.formula?t+e.records.filter(t=>String(ft(n.formula??``,e,t,D)).startsWith(`Formula error:`)).length:t,0)}function $n(e){return e.fields.filter(e=>!e.hidden&&![`image`,`autoNumber`,`createdAt`,`updatedAt`,`calculation`].includes(e.type)).map(t=>({field:t,missing:bt(e,t.id).length,duplicates:yt(e,t.id).length}))}function er(e){return Q(e).filter(e=>e.type===`image`)}function tr(e){let t=String(e??``);return/^(data:|https?:|blob:)/i.test(t)?t:``}function nr(e,t){let n=er(e)[0];return n?tr(Z(e,t,n.id)):``}function rr(e){let t=Jn();t&&J({...D,updatedAt:new Date().toISOString(),layouts:D.layouts.map(n=>n.id===t.id?{...n,...e}:n)})}function ir(e,t){let n=e.fields.find(e=>!e.hidden)??e.fields[0],r=n?Z(e,t,n.id):``;return String(r||`Untitled record`)}function ar(e,t){let n=D.schema.relationships.some(n=>n.enforceKeys&&n.toTableId===e.id&&n.toFieldId===t.id);return`${t.primaryKey?`<span class="key-badge primary-key" title="Primary key: unique, required identifier">${Un(`key`)} PK</span>`:``}${n?`<span class="key-badge foreign-key" title="Foreign key: links to a parent record">↗ FK</span>`:``}`}function or(e,t){return D.schema.relationships.find(n=>n.enforceKeys&&n.toTableId===e&&n.toFieldId===t)}function sr(e,t,n,r){let i=e.fields.find(e=>e.id===n),a=Z(e,t,n),o=`aria-label="${U(i?.name??`Field`)}, record ${r+1}" data-record-id="${t.id}" data-field-id="${n}"`,s=i&&![`checkbox`,`image`,`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(i.type)?Tt(i,a,e,t.id):``,c=s?`cell-input cell-invalid`:`cell-input`,l=s?` title="${U(s)}"`:``,u=`${l}${i?.readonly?` readonly disabled`:``}${i?.maxLength?` maxlength="${i.maxLength}"`:``}`,d=or(e.id,n);if(d){let e=D.schema.tables.find(e=>e.id===d.fromTableId),t=$e(a),n=e?.records.find(e=>$e(e.values[d.fromFieldId])===t),r=(e?.records??[]).filter(e=>$e(e.values[d.fromFieldId])).map(n=>{let r=n.values[d.fromFieldId],i=e?.fields.find(e=>e.id!==d.fromFieldId&&e.type===`text`),a=i?n.values[i.id]:``;return`<option value="${U(r)}" ${$e(r)===t?`selected`:``}>${U(a?`${a} · ${r}`:r)}</option>`}).join(``);return`<div class="foreign-key-cell"><select class="${c}" ${o}${i?.readonly?` disabled`:``}><option value="">Choose a parent…</option>${t&&!n?`<option selected value="${U(a)}">Missing parent: ${U(a)}</option>`:``}${r}</select>${n?`<button type="button" class="linked-record" data-action="open-related" data-rel-table="${e.id}" data-rel-record="${n.id}" title="Open linked record" aria-label="Open linked ${U(e.name)} record">↗</button>`:``}</div>`}if(i?.type===`checkbox`)return`<input class="cell-checkbox" type="checkbox" ${o} ${i.readonly?`disabled`:``} ${a===!0||a===`true`?`checked`:``}>`;if(i?.type===`multiSelect`){let e=i.options?.length?i.options:[`Yes`,`No`],r=new Set(String(a??``).split(`,`).map(e=>e.trim()).filter(Boolean));return`<div class="multi-cell${s?` cell-invalid`:``}" ${o}${s?` title="${U(s)}"`:``}>${e.map(e=>`<label class="multi-chip${r.has(e)?` on`:``}"><input type="checkbox" class="multi-option" data-record-id="${t.id}" data-field-id="${n}" data-multi-option="${U(e)}" ${r.has(e)?`checked`:``} ${i.readonly?`disabled`:``}>${U(e)}</label>`).join(``)}</div>`}if(i?.type===`time`)return`<input class="${c}" type="time" ${o}${u} value="${U(a)}">`;if(i?.type===`dateTime`)return`<input class="${c}" type="datetime-local" ${o}${u} value="${U(a)}">`;if(i?.type===`email`){let e=String(a??``);return`<div class="link-cell"><input class="${c}" type="email" ${o}${u} value="${U(e)}" placeholder="name@example.com">${e&&!s?`<a class="link-open" href="mailto:${U(e)}" title="Send email" aria-label="Send email">✉</a>`:``}</div>`}if(i?.type===`phone`)return`<input class="${c}" type="tel" ${o}${u} value="${U(a)}" placeholder="(555) 555-5555">`;if(i?.type===`link`){let e=String(a??``),t=/^https?:\/\//i.test(e)?e:e?`https://${e}`:``;return`<div class="link-cell"><input class="${c}" type="url" ${o}${u} value="${U(e)}" placeholder="https://…">${t?`<a class="link-open" href="${U(t)}" target="_blank" rel="noopener" title="Open link" aria-label="Open link">↗</a>`:``}</div>`}if(i?.type===`image`){let e=String(a??``),r=/^(data:|https?:|blob:)/i.test(e)?e:``;return`
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
    `}if(i?.type===`file`){let e=Qr(String(a??``));return`
      <div class="file-cell" ${o}>
        ${e?`<a class="file-link" href="${U(e.url)}" download="${U(e.name)}">📎 ${U(e.name)}</a>`:`<span>No file yet</span>`}
        <label class="image-upload-label">${e?`Replace`:`Add file`}<input class="file-input" type="file" data-record-id="${t.id}" data-field-id="${n}"></label>
      </div>
    `}if(i?.type===`audio`){let e=String(a??``),r=/^(data:|https?:|blob:)/i.test(e)?e:``;return`
      <div class="audio-cell" data-record-id="${t.id}" data-field-id="${n}">
        ${r?`<audio class="no-advance" src="${U(r)}" controls preload="metadata"></audio>`:`<span>No recording</span>`}
        <button type="button" class="button ghost" data-action="record-audio" data-record-id="${t.id}" data-field-id="${n}">${r?`Re-record`:`● Record`}</button>
      </div>
    `}if(i?.type===`rating`)return`<input class="${c}" type="number" min="0" max="5" step="1" ${o}${u} value="${U(a)}">`;if(i?.type===`choice`){let e=i.options?.length?i.options:[`Yes`,`No`];return`<select class="${c}" ${o}${l}${i.readonly?` disabled`:``}><option value=""${a===``?` selected`:``}>—</option>${e.map(e=>`<option value="${U(e)}" ${String(a)===e?`selected`:``}>${U(e)}</option>`).join(``)}</select>`}if(i?.type===`autoNumber`||i?.type===`createdAt`||i?.type===`updatedAt`)return`<output class="calc-output">${U(a)}</output>`;if(i?.type===`longText`)return`<textarea class="${c}" ${o}${u}>${U(a)}</textarea>`;if(i?.type===`date`)return`<input class="${c}" type="date" ${o}${u} value="${U(a)}">`;if(i?.type===`number`||i?.type===`currency`||i?.type===`percent`){let e=i.type===`currency`?`<span class="cell-affix">$</span>`:``,t=i.type===`percent`?`<span class="cell-affix">%</span>`:``;return`<span class="num-cell">${e}<input class="${c}" type="number" step="any" ${o}${u} value="${U(a)}">${t}</span>`}return i?.type===`calculation`?`<output class="calc-output">${U(a)}</output>`:`<input class="${c}" ${o}${u} value="${U(a)}">`}function cr(e){Ft.delete(e.id);let t=D.schema.tables.filter(e=>!Ft.has(e.id)),n=D.schema.tables.filter(e=>Ft.has(e.id));return`<div class="table-tabs" aria-label="Open tables">
    ${t.map(n=>`<div class="table-tab-item ${n.id===e.id?`active`:``}"><button type="button" class="table-tab ${n.id===e.id?`active`:``}" data-table-id="${n.id}">${U(n.name)}</button><button type="button" class="table-tab-close" data-close-table-id="${n.id}" aria-label="Close ${U(n.name)} tab" title="${t.length===1?`Keep at least one table open`:`Close tab; keep its data`}" ${t.length===1?`disabled`:``}>×</button></div>`).join(``)}
    ${n.length?`<select class="reopen-table" data-reopen-table aria-label="Reopen table"><option value="">Reopen table (${n.length})</option>${n.map(e=>`<option value="${e.id}">${U(e.name)}</option>`).join(``)}</select>`:``}
  </div>`}function lr(e,t){if(t.length===0){let e=yn();return`
      <div class="data-grid-wrap">
        <div class="empty-state">
          <h3>${U(W(e?`No records match your find`:`No records yet`))}</h3>
          <p>${U(W(e?`Try a different search, or show all records.`:`Add your first record to start building this database.`))}</p>
          <button type="button" class="button primary" data-action="${e?`clear-find`:`add-record`}">${e?U(W(`Show all records`)):`+ ${U(W(`Add first record`))}`}</button>
        </div>
      </div>
    `}let n=Q(e),r=t.length>0&&t.every(e=>P.has(e.id)),i=e=>{let t=M.find(t=>t.fieldId===e);return t?t.direction===`asc`?`▲`:`▼`:`⇅`},a=vr(e,t),o=n.length+3,s=(t,r)=>`
                <tr class="${t.id===k?`active-row`:``}${P.has(t.id)?` selected-row`:``}" data-record-row="${t.id}">
                  <td class="select-col"><input type="checkbox" data-select-row="${t.id}" aria-label="Select record ${r+1}" ${P.has(t.id)?`checked`:``}></td>
                  <td class="row-num-col"><button type="button" class="row-button" data-select-record="${t.id}">${r+1}</button></td>
                  ${n.map(n=>`<td style="${ur(n.id)}">${sr(e,t,n.id,r)}</td>`).join(``)}
                  <td class="record-actions">
                    <button type="button" title="Open record" data-action="expand-record" data-record-action-id="${t.id}">Open</button>
                    <button type="button" data-action="duplicate-record" data-record-action-id="${t.id}">Copy</button>
                    <button type="button" data-action="delete-record" data-record-action-id="${t.id}">Delete</button>
                  </td>
                </tr>
              `,c=0,l=a.map(t=>(Ut?`<tr class="group-row"><td colspan="${o}"><strong>${U(t.label)}</strong> <span>${t.records.length}${yr(e,t.records)?` · `+yr(e,t.records):``}</span></td></tr>`:``)+t.records.map(e=>s(e,c++)).join(``)).join(``);return`
    <div class="data-grid-wrap${qt?` wrap-cells`:``}">
      <table class="data-grid">
        <thead>
          <tr>
            <th class="select-col"><input type="checkbox" data-select-all aria-label="Select all records" ${r?`checked`:``}></th>
            <th class="row-num-col">#</th>
            ${n.map(t=>`
                  <th class="col-head" data-col-field="${t.id}" draggable="true" style="${ur(t.id)}">
                    <button type="button" class="field-button" data-field-settings="${t.id}">
                      ${ar(e,t)} ${U(t.name)}${t.required?`<span class="req" title="Required field" aria-label="required">*</span>`:``}<br><small>${U(t.type)}</small>
                    </button>
                    <button type="button" class="col-sort" data-action="sort-toggle" data-sort-toggle="${t.id}" title="Sort by ${U(t.name)}">${i(t.id)}</button>
                    <span class="col-resize" data-col-resize="${t.id}" title="Drag to resize" aria-hidden="true"></span>
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
  `}function ur(e){let t=Jn()?.columnWidths?.[e];return t?`width:${t}px;min-width:${t}px;`:``}function dr(){return D.metadata.author.trim()||`You`}function fr(e){let t=D.teacher.studentView,n=(e.comments??[]).filter(e=>!e.teacherOnly||!t),r=D.rubricCriteria??[],i=e.rubricScores??{},a=r.reduce((e,t)=>e+(Number(i[t.id])||0),0),o=r.reduce((e,t)=>e+t.max,0),s=e.history??[];return`
    <section class="record-extras">
      ${r.length?`<div class="record-block">
              <h3>Rubric ${t?``:`<button type="button" class="button ghost" data-action="edit-rubric">Edit</button>`}</h3>
              <div class="rubric-grid">
                ${r.map(e=>`<label class="rubric-row"><span>${U(e.label)}</span><input type="number" min="0" max="${e.max}" data-rubric-criterion="${e.id}" value="${i[e.id]==null?``:U(String(i[e.id]))}"> / ${e.max}</label>`).join(``)}
              </div>
              <p class="rubric-total"><strong>Total: ${a} / ${o}</strong></p>
            </div>`:t?``:`<div class="record-block"><h3>Rubric</h3><button type="button" class="button" data-action="edit-rubric">Set up a rubric</button></div>`}
      <div class="record-block">
        <h3>Comments</h3>
        <div class="comment-list">
          ${n.length?n.map(e=>`
                      <div class="comment${e.teacherOnly?` teacher`:``}">
                        <div class="comment-head"><strong>${U(e.author)}</strong>${e.teacherOnly?`<span class="badge">teacher only</span>`:``}<time>${U(new Date(e.at).toLocaleString())}</time></div>
                        <p>${U(e.text)}</p>
                        ${t&&e.author!==dr()?``:`<button type="button" class="link-btn" data-action="delete-comment" data-comment-id="${e.id}">Delete</button>`}
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
              ${s.length?`<ul class="version-list">${s.slice().reverse().map((e,t)=>`<li><time>${U(new Date(e.at).toLocaleString())}</time> <button type="button" class="link-btn" data-action="restore-version" data-version-index="${s.length-1-t}">Restore</button></li>`).join(``)}</ul>`:`<p class="muted">Save a version to keep a snapshot you can restore.</p>`}
            </div>`}
    </section>
  `}function pr(e){let t=e.records.find(e=>e.id===k)??e.records[0];if(!t)return`<div class="empty-panel">Add a record to use form view.</div>`;let n=D.schema.relationships.filter(t=>t.fromTableId===e.id).map(n=>{let r=D.schema.tables.find(e=>e.id===n.toTableId),i=r?Ze(n,e,t,r):[];return`
        <section class="related-records">
          <h3>${U(n.name)}</h3>
          <p>${i.length} related record${i.length===1?``:`s`} from ${U(r?.name??`another table`)}</p>
          ${i.length?`<div class="related-grid">${i.slice(0,8).map(e=>`
                      <article class="related-card" data-action="open-related" data-rel-record="${e.id}" data-rel-table="${r.id}">
                        <strong>${U(ir(r,e))}</strong>
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
                <span>${ar(e,n)} ${U(n.name)}</span>
                ${sr(e,t,n.id,r)}
                ${n.description?`<small>${U(n.description)}</small>`:``}
              </label>
            `).join(``)}
        ${n}
        ${fr(t)}
      </div>
    </div>
  `}function mr(e,t){let n=(t,n)=>{let r=Z(e,n,t.id);if(t.type===`image`){let e=tr(r);return`
        <figure class="card-image-field">
          ${e?`<img src="${U(e)}" alt="">`:`<span>No image yet</span>`}
          <figcaption>${U(t.name)}</figcaption>
        </figure>
      `}if(t.type===`link`&&String(r??``)){let e=String(r),n=/^https?:\/\//i.test(e)?e:`https://${e}`;return`<p><strong>${U(t.name)}</strong><a href="${U(n)}" target="_blank" rel="noopener">${U(e)}</a></p>`}return`<p><strong>${U(t.name)}</strong><span>${U(qn(t,r))}</span></p>`};return`
    <div class="cards-view ${A===`gallery`?`gallery-view`:``}">
      ${t.map(t=>{let r=nr(e,t);return`
            <article class="record-card" data-select-record="${t.id}">
              ${A===`gallery`?`<div class="gallery-image">${r?`<img src="${U(r)}" alt="">`:`<span>Add an image field, then upload a picture.</span>`}</div>`:``}
              ${Q(e).filter(e=>A!==`gallery`||e.type!==`image`).slice(0,A===`gallery`?4:8).map(e=>n(e,t)).join(``)}
            </article>
          `}).join(``)}
    </div>
  `}function hr(e,t){return`
    <div class="labels-view">
      ${t.map(t=>`
            <article class="print-label">
              ${Q(e).slice(0,4).map(n=>`<p><strong>${U(n.name)}:</strong> ${U(qn(n,Z(e,t,n.id)))}</p>`).join(``)}
            </article>
          `).join(``)}
    </div>
  `}function gr(e,t){let n=it(e);return`
    <div class="report-view">
      <header>
        <h2>${U(D.metadata.title)}</h2>
        <p>${U(e.name)} report. ${t.length} record${t.length===1?``:`s`} shown.</p>
      </header>
      ${lr(e,t)}
      ${n.length?`<section class="summary-strip">${n.map(e=>`<div><strong>${U(e.fieldName)}</strong><span>Sum ${e.sum.toLocaleString()} | Avg ${e.average.toFixed(2)}</span></div>`).join(``)}</section>`:`<p class="empty-panel">Add a number, currency, or percent field to see summaries.</p>`}
    </div>
  `}function _r(e,t,n){let r=new Set;return t.forEach(t=>{let i=String(Z(e,t,n)??``).trim();i&&r.add(i)}),[...r]}function vr(e,t){if(!Ut||!e.fields.some(e=>e.id===Ut))return[{key:``,label:``,records:t}];let n=new Map;return t.forEach(t=>{let r=String(Z(e,t,Ut)??``).trim();n.has(r)||n.set(r,[]),n.get(r).push(t)}),[...n.entries()].sort((e,t)=>e[0].localeCompare(t[0],void 0,{numeric:!0})).map(([e,t])=>({key:e,label:e||`(empty)`,records:t}))}function yr(e,t){return e.fields.filter(e=>[`number`,`currency`,`percent`].includes(e.type)&&!e.hidden).slice(0,3).map(n=>{let r=t.map(t=>Number(Z(e,t,n.id))).filter(e=>Number.isFinite(e));if(!r.length)return``;let i=r.reduce((e,t)=>e+t,0);return`${U(n.name)}: sum ${i.toLocaleString()}, avg ${(i/r.length).toFixed(1)}`}).filter(Boolean).join(` · `)}function br(e,t){return e.map(e=>`<option value="${e.id}" ${t===e.id?`selected`:``}>${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``)}function xr(e){let t=[];if(A===`list`||A===`table`){let n=e.fields.filter(e=>!e.hidden&&![`image`,`longText`].includes(e.type));t.push(`<label>Group by <select data-group-field><option value="">No grouping</option>${br(n,Ut)}</select></label>`),t.push(`<label class="inline-check"><input type="checkbox" data-wrap-toggle ${qt?`checked`:``}> Wrap long text</label>`)}if(A===`kanban`){let n=e.fields.filter(e=>[`choice`,`text`].includes(e.type)&&!e.hidden);t.push(`<label>Columns by <select data-board-field><option value="">Choose a status or choice field</option>${br(n,Wt)}</select></label>`)}if(A===`calendar`){let n=e.fields.filter(e=>[`date`,`dateTime`,`createdAt`,`updatedAt`].includes(e.type)&&!e.hidden);t.push(`<label>Dates from <select data-calendar-field><option value="">Choose a date field</option>${br(n,Gt)}</select></label>`)}return t.length?`<div class="view-controls">${t.join(``)}</div>`:``}function Sr(e,t){let n=Q(e),r=n[0],i=n.find(e=>e.id!==r?.id&&![`image`].includes(e.type)),a=vr(e,t).map(t=>`
        ${Ut?`<div class="group-head"><strong>${U(t.label)}</strong><span>${t.records.length}${yr(e,t.records)?` · `+yr(e,t.records):``}</span></div>`:``}
        ${t.records.map(t=>{let n=nr(e,t);return`
              <div class="list-row${t.id===k?` active`:``}">
                ${n?`<img class="list-thumb" src="${U(n)}" alt="">`:``}
                <div class="list-main">
                  <strong>${U(Z(e,t,r?.id??``)||`Untitled`)}</strong>
                  ${i?`<span>${U(qn(i,Z(e,t,i.id)))}</span>`:``}
                </div>
                <button type="button" class="button ghost" data-action="expand-record" data-record-action-id="${t.id}">Open</button>
              </div>
            `}).join(``)}
      `).join(``);return`<div class="list-view${qt?` wrap-cells`:``}">${a||`<p class="empty-panel">No records to list.</p>`}</div>`}function Cr(e,t){let n=e.fields.find(e=>e.id===Wt);return n?`<div class="kanban">${[``,...(n.options&&n.options.length?n.options:_r(e,t,n.id)).filter(Boolean)].map(r=>{let i=t.filter(t=>String(Z(e,t,n.id)??``).trim()===r);return`
        <div class="kanban-col" data-kanban-col="${U(r)}">
          <div class="kanban-col-head"><strong>${U(r||`Unassigned`)}</strong><span>${i.length}</span></div>
          <div class="kanban-cards">
            ${i.map(t=>`
                  <div class="kanban-card" draggable="true" data-kanban-card="${t.id}" data-action="expand-record" data-record-action-id="${t.id}">
                    <strong>${U(ir(e,t))}</strong>
                  </div>
                `).join(``)}
          </div>
        </div>
      `}).join(``)}</div>`:`<p class="empty-panel">Choose a status or choice field above to build a board with draggable cards.</p>`}function wr(e,t){let n=e.fields.find(e=>e.id===Gt)??e.fields.find(e=>[`date`,`dateTime`,`createdAt`,`updatedAt`].includes(e.type)&&!e.hidden);if(!n)return`<p class="empty-panel">Add a date field, then choose it above to see records on a calendar.</p>`;let r=Kt?new Date(`${Kt}-01T00:00:00`):new Date,i=r.getFullYear(),a=r.getMonth(),o=`${i}-${String(a+1).padStart(2,`0`)}`,s=new Date(i,a,1),c=s.getDay(),l=new Date(i,a+1,0).getDate(),u=new Map;t.forEach(t=>{let r=String(Z(e,t,n.id)??``).slice(0,10);/^\d{4}-\d{2}-\d{2}$/.test(r)&&r.startsWith(o)&&(u.has(r)||u.set(r,[]),u.get(r).push(t))});let d=[];for(let e=0;e<c;e+=1)d.push(`<div class="cal-cell empty"></div>`);for(let t=1;t<=l;t+=1){let n=`${o}-${String(t).padStart(2,`0`)}`,r=u.get(n)??[];d.push(`
      <div class="cal-cell">
        <div class="cal-day">${t}</div>
        ${r.slice(0,4).map(t=>`<button type="button" class="cal-event" data-action="expand-record" data-record-action-id="${t.id}">${U(ir(e,t))}</button>`).join(``)}
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
  `}function Tr(e){let t=Kt?new Date(`${Kt}-01T00:00:00`):new Date;t.setMonth(t.getMonth()+e),Kt=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}`}function Er(e){let t=K(e),n={table:`Table: spreadsheet-like rows and columns for fast data entry.`,form:`Form: focus on one record at a time.`,cards:`Cards: compact text-first record cards for browsing.`,gallery:`Gallery: image-first cards for collections and exhibits.`,list:`List: compact rows grouped by a field.`,kanban:`Board: columns by status or category, drag cards to change them.`,calendar:`Calendar: records placed on a month grid by a date field.`,labels:`Labels: printable small cards or shelf labels.`,report:`Report: printable table with title and summaries.`},r=A===`form`?pr(e):A===`cards`||A===`gallery`?mr(e,t):A===`list`?Sr(e,t):A===`kanban`?Cr(e,t):A===`calendar`?wr(e,t):A===`labels`?hr(e,t):A===`report`?gr(e,t):lr(e,t);return`
    <section class="database-panel" aria-label="Database table">
      ${cr(e)}
      <div class="view-tabs" role="group" aria-label="Layout modes">
        ${[`table`,`form`,`cards`,`gallery`,`list`,`kanban`,`calendar`,`labels`,`report`].map(e=>`<button type="button" class="${A===e?`active`:``}" data-view-mode="${e}" title="${U(n[e])}" aria-label="${U(n[e])}">${U(W(e===`kanban`?`Board`:e[0].toUpperCase()+e.slice(1)))}</button>`).join(``)}
      </div>
      ${xr(e)}
      ${Dr()}
      ${Or(e)}
      ${r}
    </section>
  `}function Dr(){let e=[];if(Ht&&e.push(`<button type="button" class="chip chip-button" data-action="toggle-archived" title="Back to active records">Archived view — click to exit</button>`),j&&e.push(`<span class="chip">Search: “${U(j)}”</span>`),N&&N.rules.length){let t=N.match===`all`?` AND `:` OR `,n=N.rules.map(e=>`${Si(e.fieldId)} ${Ci(e.operator)}${e.operator===`isEmpty`||e.operator===`isNotEmpty`?``:` `+e.value}${e.operator===`between`?`–`+(e.value2??``):``}`).join(t);e.push(`<button type="button" class="chip chip-button" data-action="find" title="Edit find">Find: ${U(n)}</button>`)}return L.size&&e.push(`<span class="chip">${L.size} highlighted</span>`),M.filter(e=>G().fields.some(t=>t.id===e.fieldId)).forEach(t=>{e.push(`<button type="button" class="chip chip-button" data-action="sort-dialog" title="Edit sort">Sort: ${U(Si(t.fieldId))} ${t.direction===`asc`?`↑`:`↓`}</button>`)}),e.length?`<div class="filter-chips">${e.join(``)}${yn()?`<button type="button" class="chip chip-clear" data-action="clear-find">Clear find</button>`:``}${M.length?`<button type="button" class="chip chip-clear" data-action="sort-dialog">Edit sort</button>`:``}</div>`:``}function Or(e){let t=Mi(e).length;return t===0||A===`form`?``:`
    <div class="bulk-bar" role="group" aria-label="Bulk actions">
      <strong>${t} selected</strong>
      <button type="button" class="button" data-action="bulk-fill">Fill a field…</button>
      <button type="button" class="button" data-action="bulk-duplicate">Duplicate</button>
      ${Ht?`<button type="button" class="button" data-action="bulk-restore">Restore</button>`:`<button type="button" class="button" data-action="bulk-archive">Archive</button>`}
      <button type="button" class="button danger" data-action="bulk-delete">Delete</button>
      <button type="button" class="button ghost" data-action="bulk-clear">Clear selection</button>
    </div>
  `}function kr(e){let t=it(e),n=e.records.find(e=>e.id===k)??e.records[0],r=n?D.schema.relationships.filter(t=>t.fromTableId===e.id).map(t=>{let r=D.schema.tables.find(e=>e.id===t.toTableId),i=r?Ze(t,e,n,r).length:0;return`
            <div class="template-card">
              <strong>${U(t.name)}</strong>
              <span>${i} related record${i===1?``:`s`}</span>
              <p>${U(Qe(D,t))}</p>
            </div>
          `}).join(``):``;return`
    <aside class="teacher-panel" aria-label="Teacher tools and database stats">
      <h2>${Un(`check`)} Database Check</h2>
      <div class="stat-grid">
        <div class="stat-card"><strong>${K(e).length}</strong> shown</div>
        <div class="stat-card"><strong>${e.records.length}</strong> records</div>
        <div class="stat-card"><strong>${e.fields.length}</strong> fields</div>
        <div class="stat-card"><strong>${D.schema.tables.length}</strong> tables</div>
      </div>
      ${t.map(e=>`
            <div class="template-card">
              <strong>${U(e.fieldName)} summary</strong>
              <span>Sum: ${e.sum.toLocaleString()}</span>
              <span>Average: ${e.average.toFixed(2)}</span>
            </div>
          `).join(``)}
      ${r?`<h3>Related Records</h3>${r}`:``}
      <button type="button" class="button relationship-launch" data-action="relationships">${Un(`key`)} Keys &amp; Relationships</button>
      ${tt(D).length?`<p class="relationship-error" role="status">${U(tt(D)[0])}</p>`:``}
      <details class="template-starters"><summary>Template Starters <span>${kt.length} ideas</span></summary><div class="template-list">
      ${kt.map(e=>`
            <div class="template-card">
              <strong>${U(e.title)}</strong>
              <span>${U(e.gradeBand)}</span>
              <p>${U(e.goal)}</p>
              <button type="button" data-template-id="${e.id}">Use template</button>
            </div>
          `).join(``)}
      </div></details>
    </aside>
  `}function Ar(e,t){if(e.id===t.id)return`<aside class="relationship-example"><h3>Example for ${U(e.name)}</h3><p>Add a second table, then choose it as the related table to see an example using your records.</p></aside>`;let n=D.schema.relationships.find(n=>n.fromTableId===e.id&&n.toTableId===t.id&&n.enforceKeys),r=e.fields.find(e=>e.id===n?.fromFieldId)??e.fields.find(e=>e.primaryKey),i=t.fields.find(e=>e.id===n?.toFieldId),a=r?.name??`ID`,o=i?.name??`${e.name} ID`,s=e.records.find(e=>r&&$e(e.values[r.id]))??e.records[0],c=r&&s?s.values[r.id]:1,l=n&&s?Ze(n,e,s,t)[0]:t.records[0],u=(e,t,n)=>{let r=e.fields.find(e=>e.id!==n&&e.type===`text`);return t&&r?`${r.name}: ${String(t.values[r.id]??``)}`:`Example record`};return`<aside class="relationship-example" aria-label="Example using loaded tables">
    <h3>${n?`Your connection`:`Example using your tables`}</h3>
    <p>${n?`These fields already connect your records.`:`Use this structure if records in the related table belong to records in the parent table. The sample link below is an illustration, not a change to your data.`}</p>
    <div class="relationship-example-tables">
      <section><h4>${U(e.name)}</h4><p>${U(u(e,s,r?.id))}</p><div><span class="key-badge primary-key">${Un(`key`)} PK</span> ${U(a)} <strong>${U(c)}</strong></div></section>
      <span class="example-connector" aria-label="connects to">1 → ${n?.cardinality===`one-to-one`?`1`:`many`}</span>
      <section><h4>${U(t.name)}</h4><p>${U(u(t,l,i?.id))}${n&&!l?` — no linked records yet`:``}</p><div><span class="key-badge foreign-key">↗ FK</span> ${U(o)} <strong>${U(c)}</strong></div></section>
    </div>
    ${n?`<p>The same ID appears in both fields. Choose a parent in the ${U(t.name)} picker to store its ${U(a)}.</p>`:`<ol><li>${r?`Use <strong>${U(e.name)}.${U(a)}</strong> as the parent primary key.`:`Click <strong>Add an ID primary key to ${U(e.name)}</strong> below to give each record its own ID.`}</li><li>Add a <strong>${U(o)}</strong> ${r?.type===`text`?`text`:`number`} field in <strong>${U(t.name)}</strong>. Use an existing field only if it stores these parent IDs.</li><li>Choose those two fields below and create the relationship. In ${U(t.name)}, select the parent record by name; ListSplat stores its ID.</li></ol>`}
  </aside>`}function jr(){let e=D.schema.tables,t=D.schema.relationships,n=t=>e.find(e=>e.id===t)?.name??`table`,r=(t,n)=>e.find(e=>e.id===t)?.fields.find(e=>e.id===n)?.name??`field`,i=new Set(t.flatMap(e=>[e.fromTableId,e.toTableId]));return`<div class="rel-diagram"><div class="rel-boxes">${e.map(e=>`
        <div class="rel-box${e.id===O?` active`:``}${i.has(e.id)?` linked`:``}">
          <strong>${U(e.name)}</strong>
          <div class="rel-fields">${e.fields.map(t=>`<div>${ar(e,t)} ${U(t.name)} <small>${U(t.type)}</small></div>`).join(``)}</div>
          <span>${e.records.length} record${e.records.length===1?``:`s`} · ${e.fields.length} field${e.fields.length===1?``:`s`}</span>
        </div>
      `).join(``)}</div><div class="rel-links">${t.length?t.map(e=>`
            <div class="rel-link">
              <span class="rel-badge">${U(n(e.fromTableId))}</span>
              <span class="rel-arrow">${e.enforceKeys?`${Un(`key`)} PK `:``}${U(r(e.fromTableId,e.fromFieldId))} <b>${e.cardinality===`one-to-one`?`1 ─── 1`:`1 ─── ∞`}</b> ${e.enforceKeys?`↗ FK `:``}${U(r(e.toTableId,e.toFieldId))}</span>
              <span class="rel-badge">${U(n(e.toTableId))}</span>
            </div>
          `).join(``):`<p class="rel-empty">No links yet. Create one below to connect two tables.</p>`}</div></div>`}function Mr(e){let t=[[`Combine text`,`JOIN(A, " ", B)`],[`Add`,`ADD(A, B)`],[`Multiply`,`MULTIPLY(A, B)`],[`Percent`,`PERCENT(A, B)`],[`If / then`,`IF(CONTAINS(A, "x"), "yes", "no")`],[`Sum column`,`SUM(A)`],[`Average`,`AVERAGE(A)`],[`Count`,`COUNT(A)`],[`Years since`,`YEARS_BETWEEN(A)`],[`Uppercase`,`UPPER(A)`]],n=e.fields.filter(e=>![`calculation`].includes(e.type)).slice(0,12);return`
    <div class="formula-builder">
      <div class="fb-row"><span>Functions</span>${t.map(([e,t])=>`<button type="button" class="fb-chip" data-formula-insert="${U(t)}">${U(e)}</button>`).join(``)}</div>
      <div class="fb-row"><span>Insert field</span>${n.map(e=>`<button type="button" class="fb-chip field" data-formula-insert="${U(e.name)}">${U(e.name)}</button>`).join(``)}</div>
    </div>
  `}function Nr(e,t){let n=[`number`,`currency`,`percent`,`rating`].includes(t),r=[`text`,`longText`,`link`].includes(t),i=[`text`,`longText`,`email`,`phone`,`link`].includes(t);return[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(t)?``:`
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
  `}function Pr(e,t,n){if(n===t.type||[`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(n))return``;let r=(E.querySelector(`[data-field-options]`)?.value??t.options?.join(`, `)??``).split(`,`).map(e=>e.trim()).filter(Boolean),i=e.records.filter(e=>String(e.values[t.id]??``).trim()!==``).slice(0,4).map(e=>{let i=String(e.values[t.id]??``),a=xe(e.values[t.id],n,r),o=a.value===!0?`Yes`:a.value===!1?`No`:String(a.value??``);return`<li><span>${U(i)}</span> → <span class="${a.lost?`preview-lost`:``}">${a.lost?`cleared`:U(o||`(empty)`)}</span></li>`}),a=e.records.filter(e=>String(e.values[t.id]??``).trim()===``?!1:xe(e.values[t.id],n,r).lost).length;return`
    <div class="type-preview">
      <strong>Change ${U(t.type)} → ${U(n)}</strong>
      ${i.length?`<ul>${i.join(``)}</ul>`:`<p>No values to convert yet.</p>`}
      ${a?`<p class="preview-warn">${a} value${a===1?``:`s`} cannot convert and will be cleared.</p>`:`<p>All values convert cleanly.</p>`}
    </div>
  `}function Fr(e){let t=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``),n=Rt.rules.map((e,n)=>{let r=xi.find(t=>t.value===e.operator)??xi[0];return`
        <div class="find-rule" data-rule-index="${n}">
          <select data-find-field aria-label="Field">${t(e.fieldId)}</select>
          <select data-find-op aria-label="Condition">${xi.map(t=>`<option value="${t.value}" ${t.value===e.operator?`selected`:``}>${U(t.label)}</option>`).join(``)}</select>
          <input data-find-value type="text" value="${U(e.value)}" placeholder="value" ${r.needsValue?``:`hidden`}>
          <input data-find-value2 type="text" value="${U(e.value2??``)}" placeholder="and" ${r.needsSecond?``:`hidden`}>
          <button type="button" class="button ghost" data-action="find-remove-rule">Remove</button>
        </div>
      `}).join(``);return`
    <div class="modal-backdrop">
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Advanced find">
        <h2>Find records</h2>
        <label>Match <select data-find-match>
          <option value="all" ${Rt.match===`all`?`selected`:``}>all conditions (AND)</option>
          <option value="any" ${Rt.match===`any`?`selected`:``}>any condition (OR)</option>
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
  `}function Ir(e){let t=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``);return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Sort records">
        <h2>Sort records</h2>
        <div class="sort-levels">${zt.map((e,n)=>`
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
  `}function Lr(){let e=Oi();return`
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
  `}function Rr(e){let t=Mi(e).length;return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Fill a field">
        <h2>Fill a field</h2>
        <p>Set the same value in ${t} selected record${t===1?``:`s`}.</p>
        <label>Field <select data-bulk-field>${e.fields.filter(e=>![`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(e.type)).map(e=>`<option value="${e.id}">${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``)}</select></label>
        <label>Value <input data-bulk-value type="text" placeholder="value to fill in"></label>
        <div class="modal-actions">
          <button type="button" class="button primary" data-action="apply-bulk-fill">Fill selected</button>
          <button type="button" data-action="close-dialog">Cancel</button>
        </div>
      </section>
    </div>
  `}function zr(e){let t=e.fields.find(e=>e.id===Xt);if(!t)return[];let n=K(e),r=new Map;return n.forEach(n=>{let i=String(Z(e,n,t.id)??``).trim()||`(empty)`,a=1;if(Zt===`sum`&&Qt){let t=Number(Z(e,n,Qt));a=Number.isFinite(t)?t:0}r.set(i,(r.get(i)??0)+a)}),[...r.entries()].map(([e,t])=>({label:e,value:t})).slice(0,24)}var Br=[`#7c3aed`,`#0ea5e9`,`#16a34a`,`#f59e0b`,`#dc2626`,`#9333ea`,`#0891b2`,`#65a30d`,`#ea580c`,`#db2777`];function Vr(e){if(!e.length)return`<p class="empty-panel">Choose a category field to build a chart.</p>`;let t=Math.max(...e.map(e=>e.value),1),n=e.reduce((e,t)=>e+t.value,0)||1;if(Yt===`pie`){let t=-Math.PI/2;return`<svg viewBox="0 0 300 260" class="chart-svg" role="img" aria-label="Pie chart">${e.map((e,r)=>{let i=e.value/n*Math.PI*2,a=150+110*Math.cos(t),o=130+110*Math.sin(t);t+=i;let s=150+110*Math.cos(t),c=130+110*Math.sin(t),l=+(i>Math.PI);return`<path d="M150 130 L${a.toFixed(1)} ${o.toFixed(1)} A110 110 0 ${l} 1 ${s.toFixed(1)} ${c.toFixed(1)} Z" fill="${Br[r%Br.length]}"></path>`}).join(``)}</svg>`}let r=460/e.length;return Yt===`line`?`<svg viewBox="0 0 520 260" class="chart-svg" role="img" aria-label="Line chart">
      <polyline fill="none" stroke="#7c3aed" stroke-width="3" points="${e.map((e,n)=>{let i=30+r*n+r/2,a=230-e.value/t*200;return`${i.toFixed(1)},${a.toFixed(1)}`}).join(` `)}"></polyline>
      ${e.map((e,n)=>{let i=30+r*n+r/2,a=230-e.value/t*200;return`<circle cx="${i.toFixed(1)}" cy="${a.toFixed(1)}" r="4" fill="#5b21b6"></circle>`}).join(``)}
    </svg>`:`<svg viewBox="0 0 520 260" class="chart-svg" role="img" aria-label="Bar chart">${e.map((e,n)=>{let i=30+r*n+4,a=e.value/t*200,o=230-a;return`<rect x="${i.toFixed(1)}" y="${o.toFixed(1)}" width="${(r-8).toFixed(1)}" height="${a.toFixed(1)}" rx="4" fill="${Br[n%Br.length]}"></rect>`}).join(``)}<line x1="30" y1="230" x2="490" y2="230" stroke="#d8d2ff"></line></svg>`}function Hr(e){let t=e.fields.filter(e=>!e.hidden&&![`image`,`longText`,`calculation`].includes(e.type)),n=e.fields.filter(e=>[`number`,`currency`,`percent`,`rating`].includes(e.type)),r=zr(e);return`
    <div class="modal-backdrop">
      <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Charts">
        <h2>Charts</h2>
        <p>Charts use the records currently shown (${K(e).length}). Change filters to focus a chart.</p>
        <div class="chart-controls">
          <label>Type <select data-chart-type>${[`bar`,`pie`,`line`].map(e=>`<option value="${e}" ${Yt===e?`selected`:``}>${e}</option>`).join(``)}</select></label>
          <label>Category <select data-chart-category><option value="">Choose a field</option>${t.map(e=>`<option value="${e.id}" ${Xt===e.id?`selected`:``}>${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``)}</select></label>
          <label>Measure <select data-chart-value-mode><option value="count" ${Zt===`count`?`selected`:``}>count records</option><option value="sum" ${Zt===`sum`?`selected`:``}>sum a number</option></select></label>
          ${Zt===`sum`?`<label>Number field <select data-chart-value-field><option value="">Choose</option>${n.map(e=>`<option value="${e.id}" ${Qt===e.id?`selected`:``}>${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``)}</select></label>`:``}
        </div>
        <div class="chart-area">${Vr(r)}</div>
        ${r.length?`<table class="chart-table"><caption class="sr-only">Chart data</caption><thead><tr><th>Category</th><th>Value</th></tr></thead><tbody>${r.map(e=>`<tr><td>${U(e.label)}</td><td>${e.value.toLocaleString()}</td></tr>`).join(``)}</tbody></table>`:``}
        <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
      </section>
    </div>
  `}function Ur(e){let t=Pe(e),n=Ie(e),r=Le(D),i=Math.round(JSON.stringify(D).length/1024);return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Database maintenance">
        <h2>Database maintenance</h2>
        <div class="maint-row">
          <div><strong>${t.length}</strong> duplicate record${t.length===1?``:`s`}</div>
          <button type="button" class="button" data-action="remove-duplicates" ${t.length?``:`disabled`}>Remove duplicates</button>
        </div>
        <div class="maint-row">
          <div><strong>${n.length}</strong> always-empty field${n.length===1?``:`s`}${n.length?`: `+U(n.map(e=>e.name).join(`, `)):``}</div>
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
  `}function Wr(e){let t=[];e.fields.filter(e=>e.type===`image`).forEach(e=>{e.description.trim()||t.push(`Image field "${e.name}" has no description to use as alt text.`)});let n=e.fields.filter(e=>!e.hidden&&!e.description.trim()&&![`autoNumber`,`createdAt`,`updatedAt`].includes(e.type));n.length&&t.push(`${n.length} field${n.length===1?``:`s`} have no student-friendly description.`),D.metadata.title.trim()||t.push(`The database has no title.`);let r=Dt(e).filter(e=>/required/i.test(e.message)).length;return r&&t.push(`${r} required value${r===1?` is`:`s are`} still empty.`),t}function Gr(e){let t=Wr(e);return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Accessibility check">
        <h2>Accessibility check</h2>
        <p>Quick checks a database creator can act on. ListSplat itself supports keyboard use, visible focus, and screen readers.</p>
        ${t.length?`<ul class="a11y-list">${t.map(e=>`<li>⚠️ ${U(e)}</li>`).join(``)}</ul>`:`<p class="a11y-ok">✅ No issues found. Nice work.</p>`}
        <div class="modal-actions"><button type="button" data-action="close-dialog">Close</button></div>
      </section>
    </div>
  `}var Kr=[{id:`collection`,label:`A collection (books, rocks, artifacts)`,fields:[[`Name`,`text`],[`Category`,`choice`],[`Notes`,`longText`],[`Picture`,`image`]]},{id:`log`,label:`A log or journal (observations, reading)`,fields:[[`Date`,`date`],[`Entry`,`longText`],[`Rating`,`rating`]]},{id:`people`,label:`A directory of people`,fields:[[`Name`,`text`],[`Email`,`email`],[`Phone`,`phone`],[`Notes`,`longText`]]},{id:`inventory`,label:`An inventory or checkout list`,fields:[[`Item`,`text`],[`Quantity`,`number`],[`Location`,`text`],[`Status`,`choice`]]},{id:`tracker`,label:`A tracker with status columns`,fields:[[`Title`,`text`],[`Status`,`choice`],[`Owner`,`text`],[`Due date`,`date`],[`Notes`,`longText`]]}];function qr(){return`
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Guided database builder">
        <h2>Build a database</h2>
        <p>Tell me what you want to track and I'll set up a table with useful fields. You can change anything afterward.</p>
        <label>Name it <input data-guided-name placeholder="e.g. Rock collection"></label>
        <div class="guided-kinds">
          ${Kr.map(e=>`<button type="button" class="guided-kind" data-action="guided-create" data-guided-kind="${e.id}"><strong>${U(e.label)}</strong><span>${e.fields.map(([e])=>U(e)).join(` · `)}</span></button>`).join(``)}
        </div>
        <div class="modal-actions"><button type="button" data-action="close-dialog">Cancel</button></div>
      </section>
    </div>
  `}function Jr(e){if(R===`none`)return``;if(R===`find`)return Fr(e);if(R===`sort`)return Ir(e);if(R===`views`)return Lr();if(R===`bulkFill`)return Rr(e);if(R===`charts`)return Hr(e);if(R===`maintenance`)return Ur(e);if(R===`accessibility`)return Gr(e);if(R===`guided`)return qr();if(R===`rubric`)return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Rubric">
          <h2>Rubric criteria</h2>
          <p>Score each criterion on every record's form. The total adds up automatically.</p>
          <div class="rubric-def">
            ${Vt.map((e,t)=>`
                  <div class="rubric-def-row" data-crit-id="${e.id}" data-crit-index="${t}">
                    <input data-crit-label value="${U(e.label)}" placeholder="Criterion">
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
    `;if(R===`camera`)return`
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
    `;if(R===`replace`){let t=B.slice(0,8);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Replace values">
          <h2>Replace values</h2>
          <label>Find <input data-replace-find placeholder="Text to find"></label>
          <label>Replace with <input data-replace-with placeholder="New text"></label>
          <label>Field <select data-replace-field>${e.fields.map(e=>`<option value="${e.id}">${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``)}</select></label>
          <label class="check-row"><input type="checkbox" data-replace-case-sensitive> Case-sensitive</label>
          <label class="check-row"><input type="checkbox" data-replace-whole-word> Whole word only</label>
          <p>Replacement applies to the current found set when search is active. Preview first, then apply. The last replace can be undone from Edit.</p>
          ${B.length?`<div class="replace-preview"><strong>${B.length} change${B.length===1?``:`s`} ready</strong>${t.map(t=>{let n=e.records.find(e=>e.id===t.recordId),r=e.fields.find(e=>e.id===t.fieldId);return`<p><span>${U(n?ir(e,n):`Record`)} / ${U(r?.name??`Field`)}</span><del>${U(t.before)}</del><ins>${U(t.after)}</ins></p>`}).join(``)}</div>`:``}
          <div class="modal-actions">
            <button type="button" data-action="preview-replace">Preview</button>
            <button type="button" data-action="run-replace" ${B.length?``:`disabled`}>Apply Replace</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(R===`field`){let t=e.fields.find(e=>e.id===an)??e.fields[0],n=Bt||t.type;return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Field settings">
          <h2>Field settings</h2>
          <label>Name <input data-field-name value="${U(t.name)}"></label>
          <label>Type <select data-field-type>${Kn(n)}</select></label>
          ${Pr(e,t,n)}
          <label>Description <textarea data-field-description>${U(t.description)}</textarea></label>
          <label>Choice options <input data-field-options value="${U(t.options?.join(`, `)??``)}" placeholder="Yes, No, Maybe"></label>
          <label class="check-row"><input type="checkbox" data-field-primary-key ${t.primaryKey?`checked`:``}> Primary key (one per table; unique and required)</label>
          <label class="check-row"><input type="checkbox" data-field-required ${t.required?`checked`:``}> Required field</label>
          <label class="check-row"><input type="checkbox" data-field-hidden ${t.hidden?`checked`:``}> Hide field</label>
          ${Nr(t,n)}
          <label>Calculation formula <input data-field-formula value="${U(t.formula??``)}" placeholder='JOIN(First Name, " ", Last Name)'></label>
          ${n===`calculation`?Mr(e):``}
          <p>Try <code>FIELD(Animal)</code>, <code>JOIN(Animal, " lives in ", Habitat)</code>, <code>UPPER(Animal)</code>, <code>ADD(Score, Bonus)</code>, <code>AVERAGE(Score)</code>, or <code>LOOKUP("Book reviews", Rating)</code>.</p>
          <div class="modal-actions">
            <p class="relationship-error" role="alert">${U(V)}</p><button type="button" data-action="save-field-settings">Save field</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(R===`layout`){let t=Jn(),n=Xn(e),r=new Set(t?.hiddenFieldIds??[]);return`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Layout designer">
          <h2>Layout designer</h2>
          <p>Arrange and choose fields for the current ${U(A)} view. Locked layouts can still be viewed, but students should not change them.</p>
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
    `}if(R===`csvImport`&&H){let t=H.records.slice(0,4),n=t=>e.fields.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``),r=I.map((e,t)=>`
          <div class="csv-map-row" data-map-index="${t}">
            <span class="csv-map-header">${U(e.header||`Column ${t+1}`)}</span>
            <select data-map-action aria-label="What to do with ${U(e.header)}">
              <option value="new" ${e.action===`new`?`selected`:``}>New field</option>
              <option value="existing" ${e.action===`existing`?`selected`:``}>Existing field</option>
              <option value="skip" ${e.action===`skip`?`selected`:``}>Skip</option>
            </select>
            <select data-map-type aria-label="Type for ${U(e.header)}" ${e.action===`new`?``:`hidden`}>${Kn(e.type)}</select>
            <select data-map-existing aria-label="Existing field for ${U(e.header)}" ${e.action===`existing`?``:`hidden`}>${n(e.fieldId)}</select>
          </div>
        `).join(``);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="CSV import">
          <h2>Import CSV</h2>
          <p>${U(fn)} has ${H.fields.length} column${H.fields.length===1?``:`s`} and ${H.records.length} row${H.records.length===1?``:`s`}. Choose how each column maps.</p>
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
            <label>When appending, match on <select data-csv-key><option value="">nothing (always add)</option>${e.fields.filter(e=>![`image`,`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(e.type)).map(e=>`<option value="${e.id}" ${nn===e.id?`selected`:``}>${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``)}</select></label>
            <label>Duplicates <select data-csv-dup ${nn?``:`disabled`}>
              <option value="add" ${rn===`add`?`selected`:``}>always add</option>
              <option value="skip" ${rn===`skip`?`selected`:``}>skip matches</option>
              <option value="update" ${rn===`update`?`selected`:``}>update matches</option>
            </select></label>
          </div>
          <div class="modal-actions">
            <button type="button" class="button primary" data-action="apply-csv-new">Create new table</button>
            <button type="button" class="button" data-action="apply-csv-append">Append to ${U(e.name)}</button>
            <button type="button" data-action="close-dialog">Cancel</button>
          </div>
        </section>
      </div>
    `}if(R===`projectIdeas`)return`
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
    `;if(R===`relationship`){let t=D.schema.tables.find(e=>e.id===un)??e,n=D.schema.tables.find(e=>e.id===dn&&e.id!==t.id)??D.schema.tables.find(e=>e.id!==t.id)??e,r=t.fields.filter(e=>e.primaryKey).map(e=>`<option value="${t.id}:${e.id}">${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``),i=n.fields.map(e=>`<option value="${n.id}:${e.id}">${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``);return`
      <div class="modal-backdrop">
        <section class="modal wide-modal" role="dialog" aria-modal="true" aria-label="Relationships">
          <h2>Keys &amp; Relationships</h2>
          <p>Connect a parent primary key (PK) to a child foreign key (FK). IDs stay stored in the child table; the picker shows names.</p>
          <p>Set a primary key by clicking a column heading and choosing Primary key. New relationships enforce unique, nonempty parent keys and valid references. Existing value-match links remain available.</p>
          <p class="relationship-error" role="alert">${U(V)}</p>
          ${jr()}
          ${Ar(t,n)}
          <label>Relationship type <select data-relationship-cardinality><option value="one-to-many">One parent → many children</option><option value="one-to-one">One parent → one child (unique foreign key)</option></select></label>
          <label>Name <input data-relationship-name placeholder="${U(`${t.name} to ${n.name}`)}"></label>
          <label>Parent table <select data-relationship-from-table>${D.schema.tables.map(e=>`<option value="${e.id}" ${e.id===t.id?`selected`:``}>${U(e.name)}</option>`).join(``)}</select></label>
          ${t.fields.some(e=>e.primaryKey)?``:`<button type="button" class="button" data-action="generate-primary-key">${Un(`key`)} Add an ID primary key to ${U(t.name)}</button>`}
          <label>Parent primary key <select data-relationship-from-field>${r||`<option value="">Add or choose a primary key first</option>`}</select></label>
          <label>Related table <select data-relationship-to-table>${D.schema.tables.map(e=>`<option value="${e.id}" ${e.id===n.id?`selected`:``}>${U(e.name)}</option>`).join(``)}</select></label>
          <label>Child foreign key <select data-relationship-to-field>${i}</select></label>
          ${D.schema.relationships.length?`<div class="relationship-list">${D.schema.relationships.map(e=>`<p><strong>${U(e.name)}</strong><br>${U(Qe(D,e))}<br><button type="button" class="button" data-action="remove-relationship" data-relationship-id="${e.id}">Remove link</button></p>`).join(``)}</div>`:`<p>No relationships yet. Add a second table first for the most useful results.</p>`}
          <div class="modal-actions">
            <button type="button" data-action="create-relationship">Create relationship</button>
            <button type="button" data-action="close-dialog">Close</button>
          </div>
        </section>
      </div>
    `}if(R===`functions`){let t=e.fields.filter(e=>![`image`,`createdAt`,`updatedAt`].includes(e.type)),n=t.find(e=>[`text`,`longText`,`choice`].includes(e.type))??t[0],r=t.find(e=>[`number`,`currency`,`percent`,`rating`].includes(e.type))??n,i=n?.name??`Field`,a=r?.name??`Score`;return`
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
    `}if(R===`quality`){let t=$n(e),n=Qn(e),r=t.reduce((e,t)=>e+t.missing,0),i=t.reduce((e,t)=>e+t.duplicates,0),a=Dt(e).length;return`
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
    `}return R===`teacherNotes`?`
      <div class="modal-backdrop">
        <section class="modal" role="dialog" aria-modal="true" aria-label="Teacher notes">
          <h2>Teacher notes</h2>
          <p>Add one note per line. These notes are saved in the .listsplat.json file and included in the project packet.</p>
          <label>Notes <textarea data-teacher-notes rows="8" placeholder="Add setup directions, reflection questions, or grading reminders.">${U(D.teacher.notes.join(`
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
  `}function $(){let e=G();bn(e),_n();let t=D.teacher.studentView;if(E.innerHTML=`
    <header class="app-header">
      <a class="brand" href="../../pages/splatworks.html" aria-label="SplatWorks home">
        <img class="brand-icon" src="listsplat_icon.png" alt="">
        <span>
          <strong>ListSplat<sup>TM</sup></strong>
          <small>SplatWorks<sup>TM</sup> Database Studio</small>
        </span>
      </a>
      <div class="quick-actions">
        <button type="button" class="button" data-action="undo-change"${on.length?``:` disabled`} title="Undo (Ctrl+Z)" aria-label="Undo">↶ ${U(W(`Undo`))}</button>
        <button type="button" class="button" data-action="redo-change"${sn.length?``:` disabled`} title="Redo (Ctrl+Y)" aria-label="Redo">↷ ${U(W(`Redo`))}</button>
        <button type="button" class="button primary" data-action="new">${U(W(`New`))}</button>
        <button type="button" class="button primary" data-action="save-json">${U(W(`Save JSON`))}</button>
        <button type="button" class="button primary" data-action="open-json">${U(W(`Open JSON`))}</button>
        <button type="button" class="button primary" data-action="export-csv">${U(W(`Export CSV`))}</button>
        <select id="languageSwitcher" class="lang-switcher" aria-label="Language">${gn(pn)}</select>
      </div>
    </header>
    <main class="listsplat-app">
      <nav class="menu-bar" aria-label="Application menu">
        ${Gn(`File`,[[`new`,`New database`],[`save-json`,`Save .listsplat.json`],[`save-drive`,`Save to Google Drive`],[`open-json`,`Open .listsplat.json`],[`import-csv`,`Import CSV or TSV`],[`export-csv`,`Export table CSV`],[`export-found-csv`,`Export shown records CSV`],[`export-markdown`,`Export Markdown table`],[`export-report`,`Export report HTML`],[`print`,`Print`]])}
        ${Gn(`Edit`,[[`undo-change`,`Undo last change`],[`redo-change`,`Redo last change`],[`add-record`,`Add record`],[`add-field`,`Add field`],[`find`,`Find records`],[`replace`,`Replace values`]])}
        ${Gn(`Data`,[[`add-table`,`New table`],[`rename-table`,`Rename this table`],[`duplicate-table`,`Duplicate this table`],[`move-table-left`,`Move table left`],[`move-table-right`,`Move table right`],[`delete-table`,`Delete this table`],[`sort`,`Sort records`],[`missing`,`Find missing values`],[`duplicates`,`Find duplicates`],[`toggle-archived`,Ht?`Show active records`:`Show archived records (${vn(e)})`],[`structure-copy`,`Save structure-only copy`],[`clear-find`,`Show all records`]])}
        ${Gn(`Layout`,[[`layout-designer`,`Design current layout`],[`table-view`,`Table view`],[`form-view`,`Form view`],[`cards-view`,`Card view`],[`gallery-view`,`Gallery view`],[`labels-view`,`Label view`],[`report-view`,`Report view`]])}
        ${Gn(`Tools`,[[`functions`,`Functions`],[`relationships`,`Relationships`],[`charts`,`Charts`],[`quality`,`Data quality check`],[`maintenance`,`Database maintenance`],[`accessibility`,`Accessibility check`]])}
        ${Gn(`View`,[[`student-view`,t?`Exit student view`:`Student view`],[`teacher-notes`,`Teacher notes`]])}
        <span class="menu-spacer"></span>
        ${t?``:Gn(`Teacher`,[[`guided`,`Guided database builder`],[`templates`,`Template Library`],[`project-ideas`,`Project Ideas`],[`share-html`,`Publish read-only page`],[`lock-layout`,`Lock Layout`],[`project-packet`,`Print Project Packet`]])}
        ${Gn(`Help`,[[`help-start`,`Start a database`],[`help-csv`,`Import and export CSV`],[`help-layouts`,`Forms and reports`],[`help-privacy`,`Privacy and saving`]])}
      </nav>
      <section class="toolbar" aria-label="Database toolbar">
        <label>${U(W(`Title`))} <input data-project-title value="${U(D.metadata.title)}"></label>
        <label>${U(W(`Search`))} <input data-search value="${U(j)}" placeholder="${U(W(`Find records`))}"></label>
        <label>${U(W(`In`))} <select data-search-field><option value="all">${U(W(`All fields`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${Lt===e.id?`selected`:``}>${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``)}</select></label>
        <label>${U(W(`Sort`))} <select data-sort-field><option value="">${U(W(`Choose field`))}</option>${e.fields.map(e=>`<option value="${e.id}" ${M[0]?.fieldId===e.id?`selected`:``}>${U(e.name)}${e.primaryKey?` (PK)`:``}</option>`).join(``)}</select></label>
        <button type="button" data-action="toggle-sort" title="${U(W(`Sort direction`))}">${M[0]?.direction===`desc`?`Z-A`:`A-Z`}</button>
        <button type="button" data-action="sort-dialog" title="${U(W(`Sort by more than one field`))}">${U(W(`Sort…`))}</button>
        <button type="button" data-action="find" title="${U(W(`Advanced find with conditions`))}">${U(W(`Find…`))}</button>
        <button type="button" data-action="views" title="${U(W(`Save and reuse this view`))}">${U(W(`Views`))}</button>
        <label>${U(W(`New field`))} <input data-new-field placeholder="${U(W(`Field name`))}"></label>
        <label>${U(W(`Type`))} <select data-new-field-type>${Kn()}</select></label>
        <button type="button" data-action="add-field">${U(W(`Add field`))}</button>
        <button type="button" data-action="add-record">${U(W(`Add record`))}</button>
      </section>
      <div class="workspace${t?` student-workspace`:``}">
        ${Er(e)}
        ${t?``:kr(e)}
      </div>
      <footer class="status-bar">
        <span>${U(e.name)}: ${K(e).length} shown of ${e.records.length} records, ${e.fields.length} fields</span>
        ${t?`<span>Student view hides teacher notes and teacher tools.</span>`:``}
        <span role="status" aria-live="polite">${U(z)}</span>
        <span>${It}</span>
      </footer>
    </main>
    <input class="hidden-file" type="file" accept=".listsplat.json,application/json" data-open-json>
    <input class="hidden-file" type="file" accept=".csv,text/csv" data-import-csv>
    ${Jr(e)}
  `,Wn(),cn=``,ln){let e=ln;ln=null,pi(e.recordId,e.fieldId)}_i()}function Yr(e){return e instanceof HTMLInputElement&&e.type===`checkbox`?e.checked:e instanceof HTMLInputElement&&e.type===`number`?e.value===``?``:Number(e.value):e.value}function Xr(e){let t=e.dataset.recordId,n=e.dataset.fieldId;if(!t||!n)return;let r=G().fields.find(e=>e.id===n),i=Yr(e),a=or(O,n),o=a&&r?.type===`number`&&i!==``?Number(i):i,s=x(D,Ee(G(),t,n,o)),c=nt(D,s);if(c){z=`Change blocked: ${c}`,$();return}D=s,S(D),It=`Saved locally`,(r?.primaryKey||a)&&$()}function Zr(e){return new Promise((t,n)=>{let r=new FileReader;r.onerror=()=>n(r.error),r.onload=()=>{let n=String(r.result??``);if(e.size<=35e4){t(n);return}let i=new Image;i.onerror=()=>t(n),i.onload=()=>{let e=1280,r=Math.max(i.width,i.height),a=r>e?e/r:1,o=Math.max(1,Math.round(i.width*a)),s=Math.max(1,Math.round(i.height*a)),c=document.createElement(`canvas`);c.width=o,c.height=s;let l=c.getContext(`2d`);if(!l){t(n);return}l.drawImage(i,0,0,o,s);let u=c.toDataURL(`image/jpeg`,.82);t(u.length<n.length?u:n)},i.src=n},r.readAsDataURL(e)})}function Qr(e){if(!e)return null;try{let t=JSON.parse(e);if(t&&t.url)return{name:t.name||`file`,url:t.url}}catch{}return e.startsWith(`data:`)?{name:`file`,url:e}:null}function $r(e,t,n){let r=new FileReader;r.onload=()=>{Y(`add file`);let i=JSON.stringify({name:n.name,url:String(r.result??``)});D=x(D,Ee(G(),e,t,i)),S(D);let a=Math.round(i.length/1024);z=a>900?`File attached (about ${a} KB). Large files can slow autosave.`:`File attached.`,$()},r.onerror=()=>{z=`Could not read that file.`,$()},r.readAsDataURL(n)}async function ei(e,t){if($t&&$t.state===`recording`){$t.stop();return}if(!navigator.mediaDevices?.getUserMedia||window.MediaRecorder===void 0){z=`Audio recording is not available in this browser.`,$();return}try{let n=await navigator.mediaDevices.getUserMedia({audio:!0}),r=[],i=new MediaRecorder(n);$t=i,i.ondataavailable=e=>{e.data.size&&r.push(e.data)},i.onstop=()=>{n.getTracks().forEach(e=>e.stop()),$t=null;let i=new FileReader;i.onload=()=>{Y(`record audio`),D=x(D,Ee(G(),e,t,String(i.result??``))),S(D),z=`Recording saved.`,$()},i.readAsDataURL(new Blob(r,{type:`audio/webm`}))},i.start(),z=`Recording… press the button again to stop (auto-stops at 60s).`,$(),window.setTimeout(()=>{$t&&$t.state===`recording`&&$t.stop()},6e4)}catch{z=`Microphone permission was blocked.`,$()}}async function ti(){if(!navigator.mediaDevices?.getUserMedia){z=`Camera is not available in this browser.`,R=`none`,$();return}try{tn=await navigator.mediaDevices.getUserMedia({video:{facingMode:`environment`}});let e=E.querySelector(`#cameraVideo`);e&&(e.srcObject=tn,await e.play().catch(()=>void 0))}catch{ni(),z=`Camera permission was blocked.`,R=`none`,$()}}function ni(){tn?.getTracks().forEach(e=>e.stop()),tn=null}function ri(){let e=E.querySelector(`#cameraVideo`);if(!e||!en||!e.videoWidth)return;let t=document.createElement(`canvas`),n=Math.min(1,1280/Math.max(e.videoWidth,e.videoHeight));t.width=Math.round(e.videoWidth*n),t.height=Math.round(e.videoHeight*n);let r=t.getContext(`2d`);if(!r)return;r.drawImage(e,0,0,t.width,t.height);let i=t.toDataURL(`image/jpeg`,.85),{recordId:a,fieldId:o}=en;Y(`camera photo`),D=x(D,Ee(G(),a,o,i)),S(D),ni(),en=null,R=`none`,z=`Photo captured.`,$()}function ii(e,t,n,r){if(!n.type.startsWith(`image/`)){z=`That clipboard item is not an image.`,$();return}Zr(n).then(n=>{Y(r),D=x(D,Ee(G(),e,t,n)),S(D);let i=Math.round(n.length/1024);z=i>900?`Image saved (about ${i} KB). Very large pictures can slow autosave — a smaller image is fine for most projects.`:`Image saved in this field.`,$()}).catch(()=>{z=`Could not read that image.`,$()})}function ai(){let e=G(),t=e.fields.find(e=>e.id===an);if(!t)return;let n=E.querySelector(`[data-field-name]`)?.value??t.name,r=E.querySelector(`[data-field-type]`)?.value??t.type,i=E.querySelector(`[data-field-description]`)?.value??``,a=E.querySelector(`[data-field-primary-key]`)?.checked??!1,o=E.querySelector(`[data-field-required]`)?.checked??!1,s=E.querySelector(`[data-field-hidden]`)?.checked??!1,c=E.querySelector(`[data-field-formula]`)?.value??``,l=(E.querySelector(`[data-field-options]`)?.value??``).split(`,`).map(e=>e.trim()).filter(Boolean),u=E.querySelector(`[data-field-unique]`)?.checked??!1,d=E.querySelector(`[data-field-min]`)?.value??``,ee=E.querySelector(`[data-field-max]`)?.value??``,f=d.trim()===``?void 0:Number(d),te=ee.trim()===``?void 0:Number(ee),p=E.querySelector(`[data-field-pattern]`)?.value??`none`,m=E.querySelector(`[data-field-custom-pattern]`)?.value??``,ne=E.querySelector(`[data-field-default]`)?.value??``,h=E.querySelector(`[data-field-readonly]`)?.checked??!1,re=E.querySelector(`[data-field-maxlength]`)?.value??``,ie=re.trim()===``?void 0:Number(re),g=E.querySelector(`[data-field-message]`)?.value??``,_=r!==t.type,v=Ce(e,t.id,{name:n,type:r,description:i,required:o||a,primaryKey:a,hidden:s,formula:c,options:l,unique:u||a,min:f,max:te,pattern:p,customPattern:m,defaultValue:ne,readonly:h,maxLength:ie,customMessage:g});_&&![`calculation`,`autoNumber`,`createdAt`,`updatedAt`,`image`].includes(r)&&(v=Se(v,t.id,r,l));let ae=nt(D,x(D,v));if(ae){V=ae,z=ae,$();return}V=``,X(v),R=`none`,z=_?`Updated ${n} and converted values to ${r}.`:`Updated ${n}.`,$()}function oi(){let e=E.querySelector(`[data-replace-find]`)?.value??``,t=E.querySelector(`[data-replace-with]`)?.value??``,n=E.querySelector(`[data-replace-field]`)?.value??G().fields[0]?.id,r=E.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=E.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=j?K(G()).map(e=>e.id):void 0;Y(`replace`);let o=St(G(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i});R=`none`,B=[],z=`Replaced ${o.count} value${o.count===1?``:`s`}.`,X(o.table)}function si(){let e=E.querySelector(`[data-replace-find]`)?.value??``,t=E.querySelector(`[data-replace-with]`)?.value??``,n=E.querySelector(`[data-replace-field]`)?.value??G().fields[0]?.id,r=E.querySelector(`[data-replace-case-sensitive]`)?.checked??!1,i=E.querySelector(`[data-replace-whole-word]`)?.checked??!1,a=j?K(G()).map(e=>e.id):void 0;B=xt(G(),{fieldIds:[n],find:e,replacement:t,recordIds:a,caseSensitive:r,wholeWord:i}),z=`Preview found ${B.length} change${B.length===1?``:`s`}.`,$()}function ci(){let e=(E.querySelector(`[data-teacher-notes]`)?.value??``).split(`
`).map(e=>e.trim()).filter(Boolean);Y(`teacher notes`),R=`none`,z=`Saved ${e.length} teacher note${e.length===1?``:`s`}.`,J({...D,updatedAt:new Date().toISOString(),teacher:{...D.teacher,notes:e}})}function li(e){let t=E.querySelector(e)?.value;if(!t)return null;let[n,r]=t.split(`:`);return n&&r?{tableId:n,fieldId:r}:null}function ui(){let e=E.querySelector(`[data-relationship-from-table]`)?.value??``,t=E.querySelector(`[data-relationship-to-table]`)?.value??``,n=li(`[data-relationship-from-field]`),r=li(`[data-relationship-to-field]`),i=E.querySelector(`[data-relationship-name]`)?.value??``;if(!e||!t||!n||!r){z=`Choose both tables and both match fields.`,$();return}if(n.tableId!==e||r.tableId!==t){z=`Match fields must belong to the tables you chose.`,$();return}let a=Ye(i,e,n.fieldId,t,r.fieldId);a.enforceKeys=!0,a.cardinality=E.querySelector(`[data-relationship-cardinality]`)?.value===`one-to-one`?`one-to-one`:`one-to-many`,D.schema.tables.find(e=>e.id===t)?.fields.find(e=>e.id===r.fieldId)?.primaryKey&&(a.cardinality=`one-to-one`);let o=tt(Xe(D,a))[0];if(o){V=o,z=o,$();return}V=``,Y(`relationship create`),z=`Created relationship: ${a.name}.`,J(Xe(D,a))}function di(){un=E.querySelector(`[data-relationship-from-table]`)?.value??un,dn=E.querySelector(`[data-relationship-to-table]`)?.value??dn,$()}function fi(e){return window.CSS&&typeof CSS.escape==`function`?CSS.escape(e):e.replace(/["\\]/g,`\\$&`)}function pi(e,t){let n=E.querySelector(`.data-grid`);if(!n)return!1;let r=n.querySelector(`tr[data-record-row="${fi(e)}"]`);if(!r)return!1;let i=r.querySelector(`.cell-input[data-field-id="${fi(t)}"], .cell-checkbox[data-field-id="${fi(t)}"]`);return i||=r.querySelector(`.cell-input, .cell-checkbox`),i?(i.focus(),i instanceof HTMLInputElement&&i.type!==`checkbox`&&i.select(),!0):!1}function mi(e){Y(`add record`);let t=be(G()),n=t.records.at(-1);n&&(k=n.id,ln={recordId:n.id,fieldId:e}),X(t)}function hi(e,t,n,r){let i=Array.from(E.querySelectorAll(`.data-grid tbody tr[data-record-row]`)),a=i.findIndex(t=>t.dataset.recordRow===e),o=Q(G()).map(e=>e.id),s=o.indexOf(t);if(a<0||s<0)return;let c=a+n,l=s+r;if(r>0&&l>=o.length?(l=0,c=a+1):r<0&&l<0&&(l=o.length-1,c=a-1),c>=i.length){mi(o[l]??o[0]);return}c<0||pi(i[c].dataset.recordRow??e,o[l]??t)}function gi(){if(!F)return null;let e=K(G()).map(e=>e.id),t=Q(G()).map(e=>e.id),n=e.indexOf(F.anchor.r),r=e.indexOf(F.focus.r),i=t.indexOf(F.anchor.f),a=t.indexOf(F.focus.f);return n<0||r<0||i<0||a<0?null:{rows:e,cols:t,r1:Math.min(n,r),r2:Math.max(n,r),c1:Math.min(i,a),c2:Math.max(i,a)}}function _i(){E.querySelectorAll(`.data-grid td.cell-range`).forEach(e=>e.classList.remove(`cell-range`));let e=gi();if(e&&!((e.r2-e.r1+1)*(e.c2-e.c1+1)<=1))for(let t=e.r1;t<=e.r2;t+=1)for(let n=e.c1;n<=e.c2;n+=1)E.querySelector(`.data-grid [data-record-id="${fi(e.rows[t])}"][data-field-id="${fi(e.cols[n])}"]`)?.closest(`td`)?.classList.add(`cell-range`)}function vi(e){if(!F)return;let t=K(G()).map(e=>e.id),n=Q(G()).map(e=>e.id),r=t.indexOf(F.focus.r),i=n.indexOf(F.focus.f);r<0||i<0||(e===`ArrowUp`?r=Math.max(0,r-1):e===`ArrowDown`?r=Math.min(t.length-1,r+1):e===`ArrowLeft`?i=Math.max(0,i-1):e===`ArrowRight`&&(i=Math.min(n.length-1,i+1)),F={anchor:F.anchor,focus:{r:t[r],f:n[i]}},_i())}function yi(){let e=gi();if(!e||e.r2-e.r1===0&&e.c2-e.c1===0)return!1;let t=G(),n=new Map(t.records.map(e=>[e.id,e])),r=[];for(let i=e.r1;i<=e.r2;i+=1){let a=n.get(e.rows[i]);if(!a)continue;let o=[];for(let n=e.c1;n<=e.c2;n+=1)o.push(String(Z(t,a,e.cols[n])??``).replace(/\t/g,` `).replace(/\n/g,` `));r.push(o.join(`	`))}let i=r.join(`
`);navigator.clipboard?.writeText(i).catch(()=>void 0);let a=(e.r2-e.r1+1)*(e.c2-e.c1+1),o=E.querySelector(`.status-bar span:nth-last-child(2)`);return o&&(o.textContent=`Copied ${a} cells.`),!0}function bi(e,t,n){let r=G(),i=K(r),a=Q(r).map(e=>e.id),o=i.findIndex(e=>e.id===t),s=a.indexOf(n);if(o<0||s<0)return;let c=e.replace(/\r/g,``).replace(/\n$/,``).split(`
`).map(e=>e.split(`	`));Y(`paste`);let l=new Map(r.records.map(e=>[e.id,e])),u=r.records.map(e=>e.id),d=0;c.forEach((e,t)=>{let n;if(o+t<i.length)n=i[o+t].id;else{let e=b(r.fields);l.set(e.id,e),u.push(e.id),n=e.id,d+=1}let c=l.get(n);if(!c)return;let ee={...c.values};e.forEach((e,t)=>{let n=a[s+t],i=n?r.fields.find(e=>e.id===n):void 0;!i||[`calculation`,`autoNumber`,`createdAt`,`updatedAt`].includes(i.type)||(ee[i.id]=xe(e,i.type,i.options).value)}),l.set(n,{...c,updatedAt:new Date().toISOString(),values:ee})}),F=null,z=`Pasted ${c.length} row${c.length===1?``:`s`}${d?` (${d} new)`:``}.`,X({...r,records:u.map(e=>l.get(e)).filter(Boolean)})}var xi=[{value:`contains`,label:`contains`,needsValue:!0,needsSecond:!1},{value:`equals`,label:`is exactly`,needsValue:!0,needsSecond:!1},{value:`startsWith`,label:`starts with`,needsValue:!0,needsSecond:!1},{value:`endsWith`,label:`ends with`,needsValue:!0,needsSecond:!1},{value:`greaterThan`,label:`greater than`,needsValue:!0,needsSecond:!1},{value:`lessThan`,label:`less than`,needsValue:!0,needsSecond:!1},{value:`between`,label:`between`,needsValue:!0,needsSecond:!0},{value:`isEmpty`,label:`is empty`,needsValue:!1,needsSecond:!1},{value:`isNotEmpty`,label:`is not empty`,needsValue:!1,needsSecond:!1}];function Si(e){return G().fields.find(t=>t.id===e)?.name??`field`}function Ci(e){return xi.find(t=>t.value===e)?.label??e}function wi(){let e=E.querySelector(`[data-find-match]`)?.value??`all`,t=[];E.querySelectorAll(`.find-rule`).forEach(e=>{let n=e.querySelector(`[data-find-field]`)?.value??``,r=e.querySelector(`[data-find-op]`)?.value??`contains`,i=e.querySelector(`[data-find-value]`)?.value??``,a=e.querySelector(`[data-find-value2]`)?.value??``;n&&t.push({fieldId:n,operator:r,value:i,value2:a})}),Rt={match:e,rules:t}}function Ti(){wi(),N=Rt.rules.length?Rt:null,L=new Set,R=`none`;let e=K(G()).length;z=N?`Find is on: ${e} record${e===1?``:`s`} match.`:`Find cleared.`,$()}function Ei(){let e=[];E.querySelectorAll(`.sort-level`).forEach(t=>{let n=t.querySelector(`[data-sort-level-field]`)?.value??``,r=t.querySelector(`[data-sort-level-dir]`)?.value??`asc`;n&&e.push({fieldId:n,direction:r})}),zt=e}function Di(){Ei(),M=zt,R=`none`,z=M.length?`Sorting by ${M.map(e=>Si(e.fieldId)).join(`, `)}.`:`Sort cleared.`,$()}function Oi(){return D.views??[]}function ki(){let e=E.querySelector(`[data-view-name]`)?.value.trim()||`View ${Oi().length+1}`,t={id:y(`view`),name:e,tableId:O,mode:A,search:j,searchFieldId:Lt,find:N,sortKeys:M};Y(`save view`),z=`Saved view: ${e}.`,J({...D,updatedAt:new Date().toISOString(),views:[...Oi(),t]})}function Ai(e){let t=Oi().find(t=>t.id===e);t&&(D.schema.tables.some(e=>e.id===t.tableId)&&(O=t.tableId,bn(G())),A=t.mode,j=t.search,Lt=t.searchFieldId,N=t.find,M=t.sortKeys,L=new Set,R=`none`,z=`Opened view: ${t.name}.`,$())}function ji(e){Y(`delete view`),z=`Deleted a saved view.`,J({...D,updatedAt:new Date().toISOString(),views:Oi().filter(t=>t.id!==e)})}function Mi(e){let t=new Set(e.records.map(e=>e.id));return[...P].filter(e=>t.has(e))}function Ni(){let e=G(),t=new Set(Mi(e));if(t.size===0)return;let n=e.records.filter(e=>!t.has(e.id));if(n.length===0){z=`Keep at least one record. Some rows were not deleted.`,$();return}window.confirm(`Delete ${t.size} selected record${t.size===1?``:`s`}? You can undo right after.`)&&(Y(`bulk delete`),P=new Set,z=`Deleted ${e.records.length-n.length} records.`,X({...e,records:n}))}function Pi(){let e=G(),t=Mi(e);if(t.length===0)return;Y(`bulk duplicate`);let n=t.reduce((e,t)=>we(e,t),e);P=new Set,z=`Duplicated ${t.length} record${t.length===1?``:`s`}.`,X(n)}function Fi(){let e=G(),t=new Set(Mi(e)),n=E.querySelector(`[data-bulk-field]`)?.value??``,r=E.querySelector(`[data-bulk-value]`)?.value??``,i=e.fields.find(e=>e.id===n);if(!i||t.size===0){R=`none`,$();return}let a=xe(r,i.type,i.options).value;Y(`bulk fill`);let o=e.records.map(e=>t.has(e.id)?{...e,updatedAt:new Date().toISOString(),values:{...e.values,[n]:a}}:e);R=`none`,z=`Filled ${i.name} for ${t.size} record${t.size===1?``:`s`}.`,X({...e,records:o})}function Ii(e){let t=e.filter(e=>e.trim()!==``);return t.length===0?`text`:t.every(e=>!Number.isNaN(Number(e.replace(/[$,%\s]/g,``))))?`number`:t.every(e=>!Number.isNaN(new Date(e).getTime())&&/\d/.test(e))?`date`:t.every(e=>/^(yes|no|true|false)$/i.test(e.trim()))?`checkbox`:`text`}function Li(){E.querySelectorAll(`.csv-map-row`).forEach((e,t)=>{I[t]&&(I[t].action=e.querySelector(`[data-map-action]`)?.value??`new`,I[t].type=e.querySelector(`[data-map-type]`)?.value??`text`,I[t].fieldId=e.querySelector(`[data-map-existing]`)?.value??``)})}E.addEventListener(`click`,e=>{let t=e.target,n=t.closest(`[data-action]`)?.dataset.action,r=t.closest(`[data-table-id]`)?.dataset.tableId,i=t.closest(`[data-template-id]`)?.dataset.templateId,a=t.closest(`[data-view-mode]`)?.dataset.viewMode,o=t.closest(`[data-select-record]`)?.dataset.selectRecord,s=t.closest(`[data-field-settings]`)?.dataset.fieldSettings,c=t.closest(`[data-record-action-id]`)?.dataset.recordActionId,l=t.closest(`[data-quality-field-id]`),u=t.closest(`[data-close-table-id]`)?.dataset.closeTableId;if(u){let e=D.schema.tables.filter(e=>e.id!==u&&!Ft.has(e.id));if(!e.length)return;Ft.add(u),O===u&&(O=e[0].id,q(),M=[],P=new Set,F=null,bn(G())),$(),E.querySelector(`.table-tab.active`)?.focus();return}if(r){O=r,q(),M=[],P=new Set,F=null,bn(G()),$();return}if(i){Hn(i);return}if(a){A=a,$();return}if(o){k=o,A===`table`&&$();return}if(s){an=s,Bt=``,V=``,R=`field`,$();return}let d=t.closest(`[data-formula-insert]`)?.dataset.formulaInsert;if(d){let e=E.querySelector(`[data-field-formula]`);if(e){let t=e.selectionStart??e.value.length;e.value=e.value.slice(0,t)+d+e.value.slice(e.selectionEnd??t),e.focus()}return}if(l){let e=l.dataset.qualityFieldId,t=l.dataset.qualityKind;if(e&&t){let n=t===`duplicates`?yt(G(),e):bt(G(),e);L=new Set(n.map(e=>e.id));let r=G().fields.find(t=>t.id===e);z=`Highlighted ${n.length} ${t===`duplicates`?`duplicate`:`missing`} record${n.length===1?``:`s`} in ${r?.name??`this field`}.`,R=`none`,$();return}}if(n)if(On(),n===`new`){if(!window.confirm(`Start a new database? Your current one is replaced here — export it first if you want to keep a copy. You can also undo right after.`))return;Y(`new database`);let e=ge(`Untitled Database`);O=e.schema.tables[0].id,k=e.schema.tables[0].records[0]?.id??``,L=new Set,J(e)}else if(n===`save-json`)An();else if(n===`save-drive`){let e=JSON.stringify(D,null,2);te({appName:`ListSplat`,fileName:`${D.metadata.title||`listsplat-project`}.listsplat.json`,buildFile:()=>new Blob([e],{type:`application/json`})}).catch(e=>{z=e.message,$()})}else if(n===`open-json`)E.querySelector(`[data-open-json]`)?.click();else if(n===`import-csv`)E.querySelector(`[data-import-csv]`)?.click();else if(n===`export-csv`)jn();else if(n===`export-found-csv`)Mn();else if(n===`export-markdown`)Fn();else if(n===`export-report`)In();else if(n===`project-packet`)Ln();else if(n===`print`)window.print();else if(n===`add-record`){Y(`add record`);let e=G(),t=be(e),n=t.records[t.records.length-1];for(let t of e.fields)!t.primaryKey&&or(e.id,t.id)&&(n.values[t.id]=``);X(t)}else if(n===`add-field`){let e=E.querySelector(`[data-new-field]`),t=E.querySelector(`[data-new-field-type]`)?.value;Y(`add field`),X(_e(G(),e?.value||`New Field`,t??`text`))}else if(n===`add-table`){let e=window.prompt(`New table name?`,`New Table`)??``;Y(`add table`);let t=De(D,e);O=t.schema.tables.at(-1)?.id??O,k=G().records[0]?.id??``,J(t)}else if(n===`duplicate-record`&&c)Y(`duplicate record`),X(we(G(),c));else if(n===`delete-record`&&c){if(G().records.length<=1){z=`Keep at least one record. Add another before deleting this one.`,$();return}if(!window.confirm(`Delete this record? You can undo right after with Ctrl+Z.`))return;Y(`delete record`),X(Te(G(),c))}else if(n===`toggle-sort`){if(M.length)M=[{...M[0],direction:M[0].direction===`asc`?`desc`:`asc`},...M.slice(1)];else{let e=G().fields[0];e&&(M=[{fieldId:e.id,direction:`asc`}])}$()}else if(n===`sort`||n===`sort-dialog`)zt=M.length?M.map(e=>({...e})):[{fieldId:G().fields[0]?.id??``,direction:`asc`}],R=`sort`,$();else if(n===`find`)Rt=N?{match:N.match,rules:N.rules.map(e=>({...e}))}:{match:`all`,rules:[{fieldId:G().fields[0]?.id??``,operator:`contains`,value:``}]},R=`find`,$();else if(n===`views`)R=`views`,$();else if(n===`sort-add-level`)Ei(),zt.push({fieldId:G().fields[0]?.id??``,direction:`asc`}),$();else if(n===`sort-remove-level`){Ei();let e=Number(t.closest(`[data-level-index]`)?.dataset.levelIndex??`-1`);e>=0&&zt.splice(e,1),$()}else if(n===`sort-toggle`){let e=t.closest(`[data-sort-toggle]`)?.dataset.sortToggle;if(e){let t=M.find(t=>t.fieldId===e);M=[{fieldId:e,direction:t&&t.direction===`asc`?`desc`:`asc`}],$()}}else if(n===`apply-sort`)Di();else if(n===`clear-sort`)Ei(),zt=[],$();else if(n===`find-add-rule`)wi(),Rt.rules.push({fieldId:G().fields[0]?.id??``,operator:`contains`,value:``}),$();else if(n===`find-remove-rule`){wi();let e=Number(t.closest(`[data-rule-index]`)?.dataset.ruleIndex??`-1`);e>=0&&Rt.rules.splice(e,1),$()}else if(n===`apply-find`)Ti();else if(n===`save-view`)ki();else if(n===`apply-view`){let e=t.closest(`[data-view-id]`)?.dataset.viewId;e&&Ai(e)}else if(n===`delete-view`){let e=t.closest(`[data-view-id]`)?.dataset.viewId;e&&ji(e)}else if(n===`bulk-delete`)Ni();else if(n===`bulk-duplicate`)Pi();else if(n===`bulk-fill`)Mi(G()).length&&(R=`bulkFill`,$());else if(n===`apply-bulk-fill`)Fi();else if(n===`bulk-clear`)P=new Set,$();else if(n===`expand-record`&&c)k=c,A=`form`,$();else if(n===`camera-capture`){let e=t.closest(`[data-record-id]`)?.dataset.recordId,n=t.closest(`[data-field-id]`)?.dataset.fieldId;e&&n&&(en={recordId:e,fieldId:n},R=`camera`,$(),ti())}else if(n===`camera-shoot`)ri();else if(n===`record-audio`){let e=t.closest(`[data-record-id]`)?.dataset.recordId,n=t.closest(`[data-field-id]`)?.dataset.fieldId;e&&n&&ei(e,n)}else if(n===`add-comment`){let e=E.querySelector(`[data-comment-text]`)?.value.trim()??``,t=E.querySelector(`[data-comment-teacher]`)?.checked??!1;e&&En(n=>({...n,comments:[...n.comments??[],{id:y(`comment`),author:dr(),text:e,at:new Date().toISOString(),teacherOnly:t}]}),`add comment`)}else if(n===`delete-comment`){let e=t.closest(`[data-comment-id]`)?.dataset.commentId;e&&En(t=>({...t,comments:(t.comments??[]).filter(t=>t.id!==e)}),`delete comment`)}else if(n===`save-version`)En(e=>({...e,history:[...e.history??[],{at:new Date().toISOString(),values:{...e.values}}].slice(-20)}),`save version`),z=`Saved a version snapshot.`;else if(n===`restore-version`){let e=Number(t.closest(`[data-version-index]`)?.dataset.versionIndex??`-1`);En(t=>{let n=(t.history??[])[e];return n?{...t,updatedAt:new Date().toISOString(),values:{...t.values,...n.values}}:t},`restore version`),z=`Restored an earlier version.`}else if(n===`edit-rubric`)Vt=(D.rubricCriteria??[]).map(e=>({...e})),Vt.length||(Vt=[{id:y(`crit`),label:`Ideas`,max:4}]),R=`rubric`,$();else if(n===`rubric-add`)Dn(),Vt.push({id:y(`crit`),label:`New criterion`,max:4}),$();else if(n===`rubric-remove`){Dn();let e=Number(t.closest(`[data-crit-index]`)?.dataset.critIndex??`-1`);e>=0&&Vt.splice(e,1),$()}else if(n===`save-rubric`)Dn(),Y(`rubric`),R=`none`,z=`Saved the rubric.`,J({...D,updatedAt:new Date().toISOString(),rubricCriteria:Vt});else if(n===`open-related`){let e=t.closest(`[data-rel-table]`)?.dataset.relTable,n=t.closest(`[data-rel-record]`)?.dataset.relRecord;e&&n&&(O=e,k=n,q(),M=[],A=`form`,$())}else if(n===`add-related`){let e=t.closest(`[data-rel-id]`)?.dataset.relId,n=D.schema.relationships.find(t=>t.id===e),r=G().records.find(e=>e.id===k),i=n?D.schema.tables.find(e=>e.id===n.toTableId):void 0;if(n&&r&&i){Y(`add related record`);let e=r.values[n.fromFieldId]??``,t=be(i).records.at(-1),a={...t,values:{...t.values,[n.toFieldId]:e}},o=x(D,{...i,records:[...i.records,a]});O=i.id,k=a.id,q(),M=[],A=`form`,z=`Added a ${i.name} record linked to ${ir(G(),r)}.`,J(o)}}else if(n===`cal-prev`)Tr(-1),$();else if(n===`cal-next`)Tr(1),$();else if(n===`cal-today`)Kt=``,$();else if(n===`bulk-archive`||n===`bulk-restore`){let e=n===`bulk-archive`,t=new Set(Mi(G()));if(t.size){Y(e?`archive records`:`restore records`);let n=G();P=new Set,z=`${e?`Archived`:`Restored`} ${t.size} record${t.size===1?``:`s`}.`,X({...n,records:n.records.map(n=>t.has(n.id)?{...n,archived:e}:n)})}}else if(n===`toggle-archived`)Ht=!Ht,P=new Set,z=Ht?`Showing archived records.`:`Showing active records.`,$();else if(n===`rename-table`){let e=G(),t=window.prompt(`Rename table`,e.name);t&&t.trim()&&(Y(`rename table`),J(Oe(D,e.id,t)))}else if(n===`duplicate-table`){Y(`duplicate table`);let e=ke(D,O);O=e.newTableId,q(),M=[],P=new Set,z=`Duplicated the table.`,J(e.project)}else if(n===`move-table-left`||n===`move-table-right`)Y(`move table`),J(Ae(D,O,n===`move-table-left`?-1:1));else if(n===`delete-table`){if(D.schema.tables.length<=1){z=`A database needs at least one table.`,$();return}if(window.confirm(`Delete the table "${G().name}" and all its records? You can undo right after.`)){Y(`delete table`);let e=je(D,O);O=e.schema.tables[0].id,q(),M=[],P=new Set,z=`Deleted the table.`,J(e)}}else if(n===`structure-copy`)An(Me(D)),z=`Saved a structure-only copy (no records).`,$();else if(n===`highlight-invalid`){let e=Dt(G());L=new Set(e.map(e=>e.record.id)),R=`none`,z=`Highlighted ${L.size} record${L.size===1?``:`s`} with rule problems.`,$()}else if(n===`duplicates`){let e=Lt===`all`?G().fields[0]?.id:Lt;L=new Set(yt(G(),e).map(e=>e.id)),z=`Found ${L.size} duplicate record${L.size===1?``:`s`}.`,$()}else if(n===`missing`){let e=Lt===`all`?G().fields[0]?.id:Lt;L=new Set(bt(G(),e).map(e=>e.id)),z=`Found ${L.size} record${L.size===1?``:`s`} with missing values.`,$()}else if(n===`clear-find`)q(),z=`Showing all records.`,$();else if(n===`replace`)B=[],R=`replace`,$();else if(n===`preview-replace`)si();else if(n===`run-replace`)oi();else if(n===`save-teacher-notes`)ci();else if(n===`apply-csv-new`)Vn(`new`);else if(n===`apply-csv-append`)Vn(`append`);else if(n===`save-field-settings`)Y(`field settings`),ai();else if(n===`layout-designer`||n===`lock-layout`)R=`layout`,$();else if(n===`layout-field-up`||n===`layout-field-down`){let e=t.closest(`[data-layout-field-id]`)?.dataset.layoutFieldId,r=Jn();if(e&&r){let t=Xn(G()).map(e=>e.id),r=t.indexOf(e),i=n===`layout-field-up`?r-1:r+1;r>=0&&i>=0&&i<t.length&&([t[r],t[i]]=[t[i],t[r]],Y(`layout order`),R=`layout`,rr({fieldOrder:t}))}}else if(n===`save-layout-settings`){let e=E.querySelector(`[data-layout-locked]`)?.checked??!1,t=new Set([...E.querySelectorAll(`[data-layout-field-visible]:checked`)].map(e=>e.dataset.layoutFieldVisible??``)),n=Xn(G()).map(e=>e.id),r=n.filter(e=>!t.has(e));Y(`layout settings`),R=`none`,rr({locked:e,fieldOrder:n,hiddenFieldIds:r})}else if(n===`generate-primary-key`){let e=D.schema.tables.find(e=>e.id===un)??G();if(e.fields.some(e=>e.primaryKey)){V=`This table already has a primary key. Edit its column heading to change it.`,$();return}let t={...me(`ID`,`number`),primaryKey:!0,required:!0,unique:!0},n={...e,fields:[...e.fields,t],records:e.records.map((e,n)=>({...e,values:{...e.values,[t.id]:n+1}}))};Y(`add primary key`),V=``,J(x(D,n))}else if(n===`remove-relationship`){let e=t.closest(`[data-relationship-id]`)?.dataset.relationshipId;Y(`remove relationship`),V=``,J({...D,schema:{...D.schema,relationships:D.schema.relationships.filter(t=>t.id!==e)}})}else if(n===`create-relationship`)ui();else if(n===`undo-change`)wn();else if(n===`redo-change`)Tn();else if(n===`close-dialog`)R===`camera`&&(ni(),en=null),R=`none`,B=[],H=null,$();else if(n.endsWith(`-view`))A=n.replace(`-view`,``),$();else if(n===`templates`)z=`Template starters are in the Teacher panel.`,$();else if(n===`student-view`)Y(`student view toggle`),z=D.teacher.studentView?`Teacher tools are visible again.`:`Student view is on.`,J({...D,updatedAt:new Date().toISOString(),teacher:{...D.teacher,studentView:!D.teacher.studentView}});else if(n===`project-ideas`)R=`projectIdeas`,$();else if(n===`relationships`)V=``,R=`relationship`,$();else if(n===`charts`)Xt||=G().fields.find(e=>!e.hidden&&![`image`,`longText`,`calculation`].includes(e.type))?.id??``,R=`charts`,$();else if(n===`maintenance`)R=`maintenance`,$();else if(n===`accessibility`)R=`accessibility`,$();else if(n===`guided`)R=`guided`,$();else if(n===`share-html`)Pn();else if(n===`remove-duplicates`){Y(`remove duplicates`);let e=G().records.length,t=Fe(G());R=`none`,z=`Removed ${e-t.records.length} duplicate record${e-t.records.length===1?``:`s`}.`,X(t)}else if(n===`remove-broken`)Y(`remove broken relationships`),R=`none`,z=`Removed broken relationships.`,J(Re(D));else if(n===`duplicate-project`)An({...D,metadata:{...D.metadata,title:`${D.metadata.title} copy`}}),z=`Saved a copy of the whole project.`,$();else if(n===`guided-create`){let e=t.closest(`[data-guided-kind]`)?.dataset.guidedKind,n=Kr.find(t=>t.id===e);if(n){let e=E.querySelector(`[data-guided-name]`)?.value.trim()||n.label;Y(`guided build`);let t=De(D,e),r=t.schema.tables.at(-1).id,i=t.schema.tables.find(e=>e.id===r);i={...i,fields:[],records:[]},n.fields.forEach(([e,t])=>{i=_e(i,e,t)}),i={...i,records:[b(i.fields)]},t=x(t,i),O=r,k=i.records[0].id,q(),M=[],R=`none`,A=`table`,z=`Built the "${e}" table. Add records and adjust fields any time.`,J(t)}}else n===`functions`?(R=`functions`,$()):n===`quality`?(R=`quality`,$()):n===`teacher-notes`?(R=`teacherNotes`,$()):n.startsWith(`help-`)?(R=`help`,$()):(z=`That ListSplatTM control is not available in this workspace.`,$())}),E.addEventListener(`change`,e=>{let t=e.target;if(t.matches(`[data-reopen-table]`)){if(!D.schema.tables.some(e=>e.id===t.value))return;O=t.value,Ft.delete(O),q(),M=[],P=new Set,F=null,bn(G()),$(),E.querySelector(`.table-tab.active`)?.focus()}else if(t.matches(`#languageSwitcher`)&&t instanceof HTMLSelectElement){pn=mn(t.value);try{localStorage.setItem(jt,pn)}catch{}$()}else if(t.matches(`[data-open-json]`)&&t instanceof HTMLInputElement&&t.files?.[0])Rn(t.files[0]),t.value=``;else if(t.matches(`[data-import-csv]`)&&t instanceof HTMLInputElement&&t.files?.[0])Rn(t.files[0]),t.value=``;else if(t.matches(`[data-search-field]`))Lt=t.value,L=new Set,$();else if(t.matches(`[data-sort-field]`)){let e=M[0]?.direction??`asc`;M=t.value?[{fieldId:t.value,direction:e}]:[],$()}else if(t.matches(`[data-group-field]`))Ut=t.value,$();else if(t.matches(`[data-board-field]`))Wt=t.value,$();else if(t.matches(`[data-calendar-field]`))Gt=t.value,$();else if(t.matches(`[data-wrap-toggle]`)&&t instanceof HTMLInputElement)qt=t.checked,$();else if(t.matches(`[data-chart-type]`))Yt=t.value,$();else if(t.matches(`[data-chart-category]`))Xt=t.value,$();else if(t.matches(`[data-chart-value-mode]`))Zt=t.value,$();else if(t.matches(`[data-chart-value-field]`))Qt=t.value,$();else if(t.matches(`[data-rubric-criterion]`)&&t instanceof HTMLInputElement){let e=t.dataset.rubricCriterion??``,n=t.value===``?void 0:Number(t.value);En(t=>{let r={...t.rubricScores??{}};return n==null||Number.isNaN(n)?delete r[e]:r[e]=n,{...t,rubricScores:r}},`rubric score`)}else if(t.matches(`[data-select-all]`)&&t instanceof HTMLInputElement){let e=K(G()).map(e=>e.id);P=t.checked?new Set(e):new Set,$()}else if(t.matches(`[data-select-row]`)&&t instanceof HTMLInputElement){let e=t.dataset.selectRow??``;t.checked?P.add(e):P.delete(e),$()}else if(t.matches(`[data-field-type]`))Bt=t.value,$();else if(t.matches(`[data-find-op]`))wi(),$();else if(t.matches(`[data-map-action]`))Li(),$();else if(t.matches(`[data-csv-key]`))Li(),nn=t.value,$();else if(t.matches(`[data-csv-dup]`))Li(),rn=t.value,$();else if(t.matches(`[data-relationship-from-table], [data-relationship-to-table]`))di();else if(t.matches(`.file-input`)&&t instanceof HTMLInputElement&&t.files?.[0]){let e=t.dataset.recordId,n=t.dataset.fieldId;e&&n&&$r(e,n,t.files[0])}else if(t.matches(`.multi-option`)&&t instanceof HTMLInputElement){let e=t.closest(`.multi-cell`),n=t.dataset.recordId,r=t.dataset.fieldId;if(e&&n&&r){let t=Array.from(e.querySelectorAll(`.multi-option:checked`)).map(e=>e.dataset.multiOption??``);xn(n,r),D=x(D,Ee(G(),n,r,t.join(`, `))),S(D),$()}}else if(t.matches(`.cell-input, .cell-checkbox, .image-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement))if(t instanceof HTMLInputElement&&t.type===`file`&&t.files?.[0]){let e=t.dataset.recordId,n=t.dataset.fieldId,r=t.files[0];e&&n&&ii(e,n,r,`image upload`)}else t.dataset.recordId&&t.dataset.fieldId&&xn(t.dataset.recordId,t.dataset.fieldId),Xr(t)}),E.addEventListener(`paste`,e=>{let t=e.target,n=t.closest(`.image-cell`);if(n){let t=n.dataset.recordId,r=n.dataset.fieldId,i=Array.from(e.clipboardData?.items??[]).find(e=>e.type.startsWith(`image/`))?.getAsFile();t&&r&&i&&(e.preventDefault(),ii(t,r,i,`image paste`));return}let r=t.closest(`.cell-input`);if(!r||!r.closest(`.data-grid`)||!r.dataset.recordId||!r.dataset.fieldId)return;let i=e.clipboardData?.getData(`text/plain`)??``;/[\t\n]/.test(i.replace(/\n$/,``))&&(e.preventDefault(),bi(i,r.dataset.recordId,r.dataset.fieldId))}),E.addEventListener(`input`,e=>{let t=e.target;if(t.matches(`[data-project-title]`)){kn(t.value);return}if(t.matches(`[data-search]`)){j=t.value,L=new Set,$();return}if(t.matches(`.cell-input`)&&(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)){if(t.dataset.recordId&&t.dataset.fieldId&&xn(t.dataset.recordId,t.dataset.fieldId),G().fields.find(e=>e.id===t.dataset.fieldId)?.primaryKey||or(O,t.dataset.fieldId??``))return;Xr(t)}}),E.addEventListener(`focusout`,e=>{e.target.matches?.(`.cell-input, .cell-checkbox`)&&(cn=``)}),E.addEventListener(`mousedown`,e=>{let t=e.target.closest(`[data-record-id][data-field-id]`);if(!t||!t.closest(`.data-grid`)||!t.dataset.recordId||!t.dataset.fieldId)return;let n={r:t.dataset.recordId,f:t.dataset.fieldId};e.shiftKey&&F?(e.preventDefault(),F={anchor:F.anchor,focus:n}):F={anchor:n,focus:n},_i()}),E.addEventListener(`pointerdown`,e=>{let t=e.target.closest(`[data-col-resize]`);if(!t)return;e.preventDefault(),e.stopPropagation();let n=t.dataset.colResize??``,r=t.closest(`th`);if(!r)return;r.setAttribute(`draggable`,`false`);let i=e.clientX,a=r.getBoundingClientRect().width,o=Math.round(a),s=e=>{o=Math.max(80,Math.round(a+(e.clientX-i))),r.style.width=`${o}px`,r.style.minWidth=`${o}px`},c=()=>{document.removeEventListener(`pointermove`,s),document.removeEventListener(`pointerup`,c),r.setAttribute(`draggable`,`true`);let e=Jn();e&&(Y(`resize column`),rr({columnWidths:{...e.columnWidths??{},[n]:o}}))};document.addEventListener(`pointermove`,s),document.addEventListener(`pointerup`,c)});var Ri=null;E.addEventListener(`dragstart`,e=>{let t=e.target,n=t.closest(`.kanban-card[data-kanban-card]`);if(n){Jt=n.dataset.kanbanCard??null,e.dataTransfer?.setData(`text/plain`,Jt??``);return}if(t.closest(`[data-col-resize]`))return;let r=t.closest(`.col-head[data-col-field]`);r&&(Ri=r.dataset.colField??null,e.dataTransfer?.setData(`text/plain`,Ri??``))}),E.addEventListener(`dragover`,e=>{let t=e.target;(Ri&&t.closest(`.col-head[data-col-field]`)||Jt&&t.closest(`.kanban-col`))&&e.preventDefault()}),E.addEventListener(`drop`,e=>{let t=e.target.closest(`.kanban-col`);if(t&&Jt&&Wt){e.preventDefault();let n=Jt;Jt=null;let r=t.dataset.kanbanCol??``;Y(`move card`);let i=x(D,Ee(G(),n,Wt,r)),a=nt(D,i);if(a){z=`Change blocked: ${a}`,$();return}D=i,S(D),z=`Moved card to ${r||`Unassigned`}.`,$();return}let n=e.target.closest(`.col-head[data-col-field]`);if(!n||!Ri)return;e.preventDefault();let r=n.dataset.colField??``,i=Ri;if(Ri=null,!r||r===i)return;let a=Xn(G()).map(e=>e.id),o=a.indexOf(i),s=a.indexOf(r);o<0||s<0||(a.splice(s,0,a.splice(o,1)[0]),Y(`reorder columns`),rr({fieldOrder:a}))}),E.addEventListener(`keydown`,e=>{let t=e.target;if(!t.matches?.(`.cell-input, .cell-checkbox`))return;let n=t.dataset.recordId,r=t.dataset.fieldId;if(!n||!r)return;let i=t instanceof HTMLTextAreaElement,a=t instanceof HTMLSelectElement;if(e.shiftKey&&[`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`].includes(e.key)&&!i&&!a){F||={anchor:{r:n,f:r},focus:{r:n,f:r}},e.preventDefault(),vi(e.key);return}if(e.key===`Escape`&&F){F=null,_i();return}switch(e.key){case`Enter`:i||(e.preventDefault(),hi(n,r,e.shiftKey?-1:1,0));break;case`ArrowDown`:!i&&!a&&(e.preventDefault(),hi(n,r,1,0));break;case`ArrowUp`:!i&&!a&&(e.preventDefault(),hi(n,r,-1,0));break;case`Tab`:e.preventDefault(),hi(n,r,0,e.shiftKey?-1:1);break;default:break}}),document.addEventListener(`keydown`,e=>{if(!(e.ctrlKey||e.metaKey))return;let t=e.key.toLowerCase();if(t===`c`){yi()&&e.preventDefault();return}t===`z`&&!e.shiftKey?(e.preventDefault(),wn()):t===`y`||t===`z`&&e.shiftKey?(e.preventDefault(),Tn()):t===`s`&&(e.preventDefault(),An(),z=`Saved a .listsplat.json file to your downloads.`,$())}),document.addEventListener(`click`,e=>{e.target.closest(`.menu`)||On()}),document.addEventListener(`toggle`,e=>{let t=e.target;!(t instanceof HTMLDetailsElement)||!t.matches(`.menu`)||!t.open||document.querySelectorAll(`.menu[open]`).forEach(e=>{e!==t&&(e.open=!1)})},!0),$(),de(`listsplat`).then(e=>{e&&Rn(e)}).catch(e=>window.alert(e.message||String(e)));